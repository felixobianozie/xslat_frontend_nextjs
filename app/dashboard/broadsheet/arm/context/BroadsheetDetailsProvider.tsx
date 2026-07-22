"use client";

// ─────────────────────────────────────────────────────────────────────────────
// BroadsheetDetailsProvider.tsx
//
// Provides every component on the /dashboard/broadsheet/arm page with the
// data it needs — the arm record itself, the student roster, the subjects
// list, the computed class assessment aggregates, and the school/term/session
// pin-usage rollup. All children read the value via the `useBroadsheetDetails`
// hook (exported from this same file).
//
// Data layer:
//   Five React Query queries hit the real backend via clientAuthFetch:
//     1. GET arm/detail/?id=<armId>&school-id=…              → the arm record
//     2. GET student/list/?school-id=…&arm-id=<armId>&…      → the roster
//     3. GET subject/list/?school-id=…&term-id=…&arm=<armId> → subjects offered
//     4. GET arm/assessment/compute/?school-id=…&arm-id=…    → class aggregates
//     5. GET pins/stats/school/?school-id=…&term-id=…&…      → pin usage rollup
//
//   Queries (1), (2), and (4) fire in parallel — armId is available on mount.
//   Queries (3) and (5) are chained: (3) needs term-id, (5) needs term-id +
//   session-id — both live on arm.level.section.term chain and can't resolve
//   until (1) lands.
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

// ── Pin-usage rollup type ────────────────────────────────────────────────────
// Shape returned by GET pins/stats/school/ when the SchoolTermResultStat row
// exists. The nested school/term/session objects are limited to id + basic
// display fields via the include_*_fields context set by the view.
//
// The endpoint returns `data: null` when no pin activity has been recorded
// for the (school, term, session) triple yet, so the provider treats the
// stat as nullable throughout.

export interface SchoolTermResultStat {
  id: string;
  school: { id: string; name: string; abbr?: string };
  term: { id: string; name: string };
  session: { id: string; name: string };
  total_unique_pins: number;
  total_accesses: number;
  assessments_accessed: number;
  last_accessed_at: string | null;
}

// ── Context value ────────────────────────────────────────────────────────────
// Additive-only from the previous version: same fields as before, plus the
// three secondary-pending flags and the schoolAccessStat pair. Existing
// consumers keep working without modification.

export interface BroadsheetDetailsContextValue {
  armId: string;
  arm: ClassArm | null;
  students: ArmStudent[];
  subjects: ArmSubject[];
  classResult: ClassAssessmentResult;

  // School/term/session pin-usage rollup for this arm's term chain. `null`
  // either while the query is still pending or when no pin activity has
  // been recorded yet (the endpoint's "no row" case).
  schoolAccessStat: SchoolTermResultStat | null;

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
  schoolAccessStatPending: boolean;
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

  // Term + session are both needed by chained queries (subjects, school stat).
  // Empty strings when the arm hasn't loaded yet keep the enabled gates simple.
  const arm = armData?.data ?? null;
  const termId = arm?.level.section.term?.id ?? "";
  const sessionId = arm?.level.section.term?.session?.id ?? "";

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

  // ── Query 5: school/term/session pin usage rollup ───────────────────────
  // Chained on term + session (both derived from the arm chain). The endpoint
  // returns `data: null` when no pin activity has been recorded yet — that's
  // a valid response, not an error, so we don't throw on it.
  const { data: schoolAccessStatData, isPending: schoolAccessStatPending } =
    useQuery<ApiEnvelope<SchoolTermResultStat | null>>({
      queryKey: ["broadsheet-school-access-stat", SCHOOL_ID, termId, sessionId],
      queryFn: async () => {
        const url =
          `pins/stats/school/?school-id=${SCHOOL_ID}` +
          `&term-id=${termId}` +
          `&session-id=${sessionId}`;
        const { data, error } =
          await clientAuthFetch<ApiEnvelope<SchoolTermResultStat | null>>(url);
        if (error) throw new Error(error.message);
        return data!;
      },
      enabled: !!termId && !!sessionId,
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
  const schoolAccessStat = schoolAccessStatData?.data ?? null;

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
    schoolAccessStat,
    isPending,
    isError: armIsError,
    error: armError,
    studentsPending,
    subjectsPending,
    classResultPending,
    schoolAccessStatPending,
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
