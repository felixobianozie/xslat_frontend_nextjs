"use client";

// ─────────────────────────────────────────────────────────────────────────────
// BroadsheetDetailsProvider.tsx
//
// Provides every component on the /dashboard/broadsheet/arm page with the
// data it needs — the arm record itself, the student roster, the subjects
// list, and the computed class assessment aggregates. All children read the
// value via the `useBroadsheetDetails` hook (exported from this same file).
//
// Data layer:
//   Four React Query queries hit the real backend via clientAuthFetch:
//     1. GET arm/detail/?id=<armId>&school-id=…              → the arm record
//     2. GET student/list/?school-id=…&arm-id=<armId>&…      → the roster
//     3. GET subject/list/?school-id=…&term-id=…&arm=<armId> → subjects offered
//     4. GET arm/assessment/compute/?school-id=…&arm-id=…    → class aggregates
//
//   Queries (1), (2), and (4) fire in parallel — armId is available on mount.
//   Query (3) is chained: it needs term-id from the arm chain (arm.level
//   .section.term.id), so it waits for (1) to resolve.
//
// Note on school-level pin usage analytics:
//   The pins/stats/school/ endpoint was previously fetched here to power a
//   Results Access card on the detail page. That card has moved to the
//   Broadsheet Arms *list* page, since school/term/session analytics are
//   scoped to the whole term rather than to a single arm — see
//   BroadsheetsList.tsx for the new home.
//
// Secondary loading flags are exported so views can distinguish between
// "the arm is loaded, keep showing the page" (isPending=false) and "the
// arm is loaded but the query I depend on is still in flight" — which
// previously caused a fraction-of-a-second empty-state flash in the three
// broadsheet tables.
// ─────────────────────────────────────────────────────────────────────────────

import { createContext, ReactNode, useContext, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { useClientAuthFetch } from "@/lib/Useclientauthfetch";

// ── Constants ────────────────────────────────────────────────────────────────

const SCHOOL_ID = process.env.NEXT_PUBLIC_SCHOOL_ID ?? "";

// Backend paginates student/list/ in chunks (default 10, max 100). Request
// the max so a single fetch usually covers the class in one round-trip.
const STUDENTS_PAGE_SIZE = 100;

// ── Envelope types ───────────────────────────────────────────────────────────

export interface ApiEnvelope<T> {
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  message: string;
  count: number;
  total_pages: number;
  current_page: number;
  next: string | null;
  previous: string | null;
  data: T[];
}

// ── Context value ────────────────────────────────────────────────────────────
// Same shape as the previous version minus the school-level pin analytics
// pair (schoolAccessStat + schoolAccessStatPending), which moved to the
// arms list page. Existing consumers keep working — the fields they read
// (arm/students/subjects/classResult + secondary pending flags) are all
// still here.

export interface BroadsheetDetailsContextValue {
  armId: string;
  arm: ClassArm | null;
  students: ArmStudent[];
  subjects: ArmSubject[];
  classResult: ClassAssessmentResult;

  // Top-level page loading — driven by the arm query specifically. Kept as
  // the primary "should the page show a table skeleton" signal.
  isPending: boolean;
  isError: boolean;
  error: unknown;

  // Per-secondary-query pending flags. Views use these to gate empty-state
  // rendering — otherwise, once the arm loads (isPending=false) but a
  // secondary query is still in flight, the view flashes its empty state
  // for a fraction of a second before real data arrives.
  studentsPending: boolean;
  subjectsPending: boolean;
  classResultPending: boolean;
}

const BroadsheetDetailsContext =
  createContext<BroadsheetDetailsContextValue | null>(null);

interface BroadsheetDetailsProviderProps {
  armId: string;
  children: ReactNode;
}

export function BroadsheetDetailsProvider({
  armId,
  children,
}: BroadsheetDetailsProviderProps) {
  const { clientAuthFetch } = useClientAuthFetch();

  // ── Query 1: arm detail ─────────────────────────────────────────────────
  const {
    data: armData,
    isPending: armPending,
    isError: armIsError,
    error: armError,
  } = useQuery<ApiEnvelope<ClassArm>>({
    queryKey: ["broadsheet-arm-detail", armId],
    queryFn: async () => {
      const url = `arm/detail/?id=${armId}&school-id=${SCHOOL_ID}`;
      const { data, error } = await clientAuthFetch<ApiEnvelope<ClassArm>>(url);
      if (error) throw new Error(error.message);
      return data!;
    },
    enabled: !!armId,
    refetchOnWindowFocus: false,
  });

  // Term id is derived from the arm chain for the chained subjects query.
  // Empty string when the arm hasn't loaded yet keeps the enabled gate simple.
  const arm = armData?.data ?? null;
  const termId = arm?.level.section.term?.id ?? "";

  // ── Query 2: student roster ─────────────────────────────────────────────
  const { data: studentsData, isPending: studentsPending } = useQuery<
    PaginatedResponse<ArmStudent>
  >({
    queryKey: ["broadsheet-students", armId],
    queryFn: async () => {
      const url = `student/list/?school-id=${SCHOOL_ID}&arm-id=${armId}&page-size=${STUDENTS_PAGE_SIZE}`;
      const { data, error } =
        await clientAuthFetch<PaginatedResponse<ArmStudent>>(url);
      if (error) throw new Error(error.message);
      return data!;
    },
    enabled: !!armId,
    refetchOnWindowFocus: false,
  });

  // ── Query 3: subjects offered by the arm ────────────────────────────────
  const { data: subjectsData, isPending: subjectsPending } = useQuery<
    ApiEnvelope<ArmSubject[]>
  >({
    queryKey: ["broadsheet-subjects", armId],
    queryFn: async () => {
      const url =
        `subject/list/?school-id=${SCHOOL_ID}` +
        `&term-id=${termId}` +
        `&arm=${armId}`;
      const { data, error } =
        await clientAuthFetch<ApiEnvelope<ArmSubject[]>>(url);
      if (error) throw new Error(error.message);
      return data!;
    },
    enabled: !!armId && !!termId,
    refetchOnWindowFocus: false,
  });

  // ── Query 4: class assessment result ────────────────────────────────────
  const { data: classResultData, isPending: classResultPending } = useQuery<
    ApiEnvelope<ClassAssessmentResult>
  >({
    queryKey: ["broadsheet-class-result", armId],
    queryFn: async () => {
      const url = `arm/assessment/compute/?school-id=${SCHOOL_ID}&arm-id=${armId}`;
      const { data, error } =
        await clientAuthFetch<ApiEnvelope<ClassAssessmentResult>>(url);
      if (error) throw new Error(error.message);
      return data!;
    },
    enabled: !!armId,
    refetchOnWindowFocus: false,
  });

  // Surface only the arm error to the user — the other queries silently fall
  // back to empty/null shapes, which downstream views handle gracefully.
  useEffect(() => {
    if (armIsError && armError) {
      toast.error(
        armError instanceof Error
          ? armError.message
          : "Failed to load broadsheet details.",
      );
    }
  }, [armIsError, armError]);

  // ── Derived values ─────────────────────────────────────────────────────
  const students = studentsData?.data ?? [];
  const subjects = subjectsData?.data ?? [];

  // Fallback keeps downstream consumers strictly-typed as ClassAssessmentResult
  // while the query is pending or errored.
  const classResult: ClassAssessmentResult = classResultData?.data ?? {
    class_average: 0,
    student_population: 0,
    students: {},
  };

  // Top-level pending — arm-fetch only. Views use the more granular flags
  // below when they need to distinguish their specific dependencies.
  const isPending = armPending;

  const value: BroadsheetDetailsContextValue = {
    armId,
    arm,
    students,
    subjects,
    classResult,
    isPending,
    isError: armIsError,
    error: armError,
    studentsPending,
    subjectsPending,
    classResultPending,
  };

  return (
    <BroadsheetDetailsContext.Provider value={value}>
      {children}
    </BroadsheetDetailsContext.Provider>
  );
}

// ── Consumer hook ─────────────────────────────────────────────────────────

export function useBroadsheetDetails(): BroadsheetDetailsContextValue {
  const ctx = useContext(BroadsheetDetailsContext);
  if (!ctx) {
    throw new Error(
      "useBroadsheetDetails must be used inside a <BroadsheetDetailsProvider>.",
    );
  }
  return ctx;
}

export default BroadsheetDetailsContext;
