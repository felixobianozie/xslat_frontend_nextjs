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
// Why compute aggregates here?
//   The class-level computation (per-student totals, grades, positions) is
//   identical across every view in the page, so memoising it once at the
//   provider level means the heavy reduce only runs when the underlying
//   inputs actually change.
//
// MOCK: queryFn calls the local broadsheet-detail-mock-data helpers. To wire
// to the real backend, replace each one with the matching clientAuthFetch
// call shown in the comment above it.
// ─────────────────────────────────────────────────────────────────────────────

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { computeClassAssessment } from "../../../arm/components/results-aggregates";
import type { ClassAssessmentResult } from "../../../arm/components/results-aggregates";
import {
  fetchBroadsheetArmDetail,
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

  // Pre-compute per-student/class aggregates so every table downstream can
  // read them straight from context. computeClassAssessment is pure, so
  // memoisation is purely a performance optimisation.
  const classResult = useMemo(
    () =>
      computeClassAssessment(
        arm?.assessments,
        arm?.cog_grading_format,
        arm?.aff_grading_format,
        arm?.psy_grading_format,
        arm?.pass_rule,
        subjects.length,
      ),
    [
      arm?.assessments,
      arm?.cog_grading_format,
      arm?.aff_grading_format,
      arm?.psy_grading_format,
      arm?.pass_rule,
      subjects.length,
    ],
  );

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

  // Briefly note when students/subjects are still loading — useful for
  // child components that want to show a more nuanced loading state.
  // (We don't return this in the context value because no consumer uses
  //  it yet; it's kept commented as a note for future enhancement.)
  void studentsPending;
  void subjectsPending;

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
