"use client";

// ─────────────────────────────────────────────────────────────────────────────
// BroadsheetDetailsProvider.tsx
//
// Provides every component on the /dashboard/broadsheet/arm page with the
// data it needs — the arm record itself, the student roster, the subjects
// list, and the computed class assessment aggregates. All children read
// the value via the `useBroadsheetDetails` hook (exported from this same
// file).
//
// Why one provider for everything?
//   The broadsheet detail page has three sibling tables (Cognitive,
//   Affective, Psychomotor) and a couple of modals. Each of them needs the
//   same underlying data (arm, students, subjects, aggregates). Putting it
//   in a single provider keeps the data-loading logic in one place and
//   avoids prop drilling through six layers of components.
//
// Where the aggregates come from:
//   The class-level result (per-student totals, grades, positions, decisions,
//   plus class average) is fetched as a separate query — it comes from the
//   arm/assessment/compute/ endpoint on the real backend. On the mock the
//   same shape is produced by `fetchBroadsheetClassResult`, which shares the
//   seed data with the raw arm.assessments returned above.
//
// MOCK: every queryFn calls a local broadsheet-detail-mock-data helper. To
// wire this page to the real backend, replace each helper with the matching
// clientAuthFetch call shown in the comment above it.
// ─────────────────────────────────────────────────────────────────────────────

import { createContext, ReactNode, useContext, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";

import {
  fetchBroadsheetArmDetail,
  fetchBroadsheetClassResult,
  fetchBroadsheetStudents,
  fetchBroadsheetSubjects,
} from "../broadsheet-detail-mock-data";

// ── Context value ─────────────────────────────────────────────────────────

export interface BroadsheetDetailsContextValue {
  armId: string;
  arm: ClassArm | null;
  students: ArmStudent[];
  subjects: ArmSubject[];
  classResult: ClassAssessmentResult;
  isPending: boolean;
  isError: boolean;
  error: unknown;
}

// Kept internal to this file: consumers should read it through the
// `useBroadsheetDetails` hook below, never the context directly.
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
  // ── Query 1: arm detail ─────────────────────────────────────────────────
  // MOCK: fetchBroadsheetArmDetail. Real call:
  //   clientAuthFetch(`arm/detail/?id=${armId}&school-id=${SCHOOL_ID}`)
  const {
    data: armData,
    isPending: armPending,
    isError: armIsError,
    error: armError,
  } = useQuery({
    queryKey: ["broadsheet-arm-detail", armId],
    queryFn: async () => {
      const { data, error } = await fetchBroadsheetArmDetail(armId);
      if (error) throw new Error(error.message);
      return data!;
    },
    enabled: !!armId,
    refetchOnWindowFocus: false,
  });

  // ── Query 2: student roster ─────────────────────────────────────────────
  // MOCK: fetchBroadsheetStudents. Real call:
  //   clientAuthFetch(`student/list/?school-id=${SCHOOL_ID}&arm-id=${armId}&page-size=100`)
  const { data: studentsData, isPending: studentsPending } = useQuery({
    queryKey: ["broadsheet-students", armId],
    queryFn: async () => {
      const { data, error } = await fetchBroadsheetStudents(armId);
      if (error) throw new Error(error.message);
      return data!;
    },
    enabled: !!armId,
    refetchOnWindowFocus: false,
  });

  // ── Query 3: subjects ───────────────────────────────────────────────────
  // MOCK: fetchBroadsheetSubjects. Real call:
  //   clientAuthFetch(`subject/list/?school-id=${SCHOOL_ID}&term-id=${termId}&arm=${armId}`)
  const { data: subjectsData, isPending: subjectsPending } = useQuery({
    queryKey: ["broadsheet-subjects", armId],
    queryFn: async () => {
      const { data, error } = await fetchBroadsheetSubjects(armId);
      if (error) throw new Error(error.message);
      return data!;
    },
    enabled: !!armId,
    refetchOnWindowFocus: false,
  });

  // ── Query 4: class assessment result ────────────────────────────────────
  // MOCK: fetchBroadsheetClassResult. Real call:
  //   clientAuthFetch(`arm/assessment/compute/?school-id=${SCHOOL_ID}&arm-id=${armId}`)
  // This replaces the old client-side computeClassAssessment memo — the
  // real backend now derives the whole class result server-side and returns
  // it as the compute-endpoint payload.
  const { data: classResultData, isPending: classResultPending } = useQuery({
    queryKey: ["broadsheet-class-result", armId],
    queryFn: async () => {
      const { data, error } = await fetchBroadsheetClassResult(armId);
      if (error) throw new Error(error.message);
      return data!;
    },
    enabled: !!armId,
    refetchOnWindowFocus: false,
  });

  // Surface the arm-fetch error to the user via toast. We watch just the arm
  // query here because it's the gating one — without an arm record, the
  // rest of the page can't render anything meaningful.
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
  const arm = armData?.data ?? null;
  const students = studentsData?.data ?? [];
  const subjects = subjectsData?.data ?? [];

  // Fallback keeps downstream consumers strictly-typed as ClassAssessmentResult
  // while the query is pending or errored (rare on the mock; matters when this
  // page eventually goes live). Downstream views handle empty student maps.
  const classResult: ClassAssessmentResult = classResultData?.data ?? {
    class_average: 0,
    student_population: 0,
    students: {},
  };

  // We consider the page "pending" only while the arm query is still in
  // flight. Students and subjects loading slightly later just means a few
  // cells display "—" briefly — much better than blocking the entire page
  // until all three resolve.
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
  };

  // Briefly note when secondary queries are still loading — useful for
  // child components that want to show a more nuanced loading state.
  // (We don't return these in the context value because no consumer uses
  //  them yet; they're kept commented as a note for future enhancement.)
  void studentsPending;
  void subjectsPending;
  void classResultPending;

  return (
    <BroadsheetDetailsContext.Provider value={value}>
      {children}
    </BroadsheetDetailsContext.Provider>
  );
}

// ── Consumer hook ─────────────────────────────────────────────────────────
// Throws when used outside the provider so the failure mode is loud at
// development time rather than a silent null at runtime. This is the
// SAME pattern as useArmDetails in ArmDetailsProvider.
export function useBroadsheetDetails(): BroadsheetDetailsContextValue {
  const ctx = useContext(BroadsheetDetailsContext);
  if (!ctx) {
    throw new Error(
      "useBroadsheetDetails must be used inside a <BroadsheetDetailsProvider>.",
    );
  }
  return ctx;
}

// Default export kept for parity with the original draft so any consumer
// that does `import BroadsheetDetailsContext from "…"` continues to compile.
export default BroadsheetDetailsContext;
