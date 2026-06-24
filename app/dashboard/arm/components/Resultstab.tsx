"use client";

// ─────────────────────────────────────────────────────────────────────────────
// ResultsTab.tsx
//
// Third tab — Results. Master-detail layout for viewing per-student reports.
//
// Layout:
//   - Top action bar: filter selector + broadsheet action button.
//   - Below: desktop = left master list + right detail pane, side-by-side.
//     Mobile = master OR detail visible at a time, with a slide animation
//     when a student is selected.
//
// State owned here:
//   - selectedStudentId  → which student is currently in the detail pane.
//   - filter             → which sub-view (ACADEMICS / BEHAVIOURS / SKILLS / GENERAL).
//   - submitAction       → which broadsheet modal variant to open (null = closed).
//
// Aggregates are computed once per render via useMemo, keyed by the arm's
// assessment array + grading format + subject count. React Query handles the
// fetch caching so re-renders don't re-fetch.
//
// Backend wiring:
//   - Roster:  GET student/list/?school-id=…&arm-id=…&page-size=100
//   - Subjects: GET subject/list/?school-id=…&term-id=…&arm=…
//   - Assessment data: read straight from arm.assessments (delivered by
//     arm/detail/ via ArmDetailsProvider).
//
// Broadsheet action button has FOUR status-driven variants:
//   - broadsheet === "none"    → "Generate Broadsheet" (opens submit modal)
//   - broadsheet === "pending" → "Pending Review" (non-actionable pill)
//   - broadsheet === "revoked" → "Resubmit for Review" (opens submit modal)
//   - broadsheet === "approved"→ "Approved" (non-actionable pill)
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Clock, FileBarChart, RefreshCw } from "lucide-react";
import { toast } from "react-toastify";

import { useClientAuthFetch } from "@/lib/Useclientauthfetch";
import { useArmDetails } from "../context/Armdetailsprovider";
import TableLoader from "../../components/Tableloader";
import EmptyState from "../../components/Emptystate";
import ResultsFilter from "./Resultsfilter";
import ResultsMasterList from "./Resultsmasterlist";
import ResultsDetailPane from "./Resultsdetailpane";
import BroadsheetSubmitModal, {
  BroadsheetSubmitAction,
} from "./Broadsheetsubmitmodal";
import { computeClassAssessment, ResultsFilterKey } from "./results-aggregates";
import type { ApiEnvelope } from "../page";

// ── Constants ────────────────────────────────────────────────────────────────

const SCHOOL_ID = process.env.NEXT_PUBLIC_SCHOOL_ID ?? "";
const STUDENTS_PAGE_SIZE = 100;

// ── Local response shape for the paginated student endpoint ──────────────────
interface PaginatedResponse<T> {
  message: string;
  count: number;
  total_pages: number;
  current_page: number;
  next: string | null;
  previous: string | null;
  data: T[];
}

// Decide which action verb to send based on current broadsheet status.
// Pure helper — kept inline since it's tightly coupled to this tab's button.
function broadsheetActionFor(
  status: ClassArm["broadsheet"] | undefined,
): BroadsheetSubmitAction | null {
  if (status === "none" || status === undefined) return "submit";
  if (status === "revoked") return "resend";
  return null;
}

export default function ResultsTab() {
  const { armId, arm } = useArmDetails();
  const { clientAuthFetch } = useClientAuthFetch();

  const [filter, setFilter] = useState<ResultsFilterKey>("ACADEMICS");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    null,
  );
  // Submit-modal state. We track the action verb alongside the open flag so
  // the modal renders the right variant (submit vs resend) without recomputing
  // it from the arm status — the verb is decided at the moment of opening.
  const [submitAction, setSubmitAction] =
    useState<BroadsheetSubmitAction | null>(null);

  // The subject endpoint requires term-id — same chain we use elsewhere.
  const termId = arm?.level.section.term?.id ?? "";

  // ── Data ──────────────────────────────────────────────────────────────────
  // Two queries: students for the master list, subjects for the academic table.
  // Both reuse the same cache keys as the rest of the page so navigating
  // between tabs doesn't trigger re-fetches.

  const {
    data: studentsData,
    isPending: studentsPending,
    isError: studentsError,
    error: studentsErr,
  } = useQuery<PaginatedResponse<ArmStudent>>({
    queryKey: ["arm-students", armId],
    queryFn: async () => {
      const url = `student/list/?school-id=${SCHOOL_ID}&arm-id=${armId}&page-size=${STUDENTS_PAGE_SIZE}`;
      const { data, error } =
        await clientAuthFetch<PaginatedResponse<ArmStudent>>(url);
      if (error) throw new Error(error.message);
      return data!;
    },
    enabled: !!armId,
  });

  const { data: subjectsData, isPending: subjectsPending } = useQuery<
    ApiEnvelope<ArmSubject[]>
  >({
    queryKey: ["arm-subjects", armId],
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
  });

  useEffect(() => {
    if (studentsError && studentsErr) {
      toast.error(
        studentsErr instanceof Error
          ? studentsErr.message
          : "Failed to load results.",
      );
    }
  }, [studentsError, studentsErr]);

  const students = studentsData?.data ?? [];
  const subjects = subjectsData?.data ?? [];

  // ── Computed aggregates ───────────────────────────────────────────────────
  // Pure function — recomputes only when its inputs change. Memo avoids
  // re-running the aggregation on every render (e.g. while typing in search).
  const classResult = useMemo(
    () =>
      computeClassAssessment(
        arm?.assessments,
        arm?.cog_grading_format,
        arm?.aff_grading_format,
        arm?.psy_grading_format,
        // Drives the Pass/Fail decision per student — see decideOutcome()
        // in results-aggregates.ts for the full evaluation flow.
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

  // Currently selected student record (full object, not just id) — null when
  // no selection yet (initial state) or after the selected id falls out of
  // the list (e.g. removed by another tab).
  const selectedStudent = useMemo(
    () =>
      selectedStudentId
        ? (students.find((s) => s.id === selectedStudentId) ?? null)
        : null,
    [students, selectedStudentId],
  );

  // ── Render ────────────────────────────────────────────────────────────────

  // Top loading: only block render until students AND subjects resolve once.
  // After that, partial reloads use the inline loaders inside each pane.
  if (studentsPending && subjectsPending) {
    return <TableLoader rows={6} />;
  }

  if (studentsError) {
    return (
      <EmptyState
        variant="generic"
        title="Failed to load results"
        description="Refresh the page or try again later."
      />
    );
  }

  const armLabel = arm
    ? `${arm.level.section.abbr} ${arm.level.abbr} ${arm.abbr}`
    : "this arm";

  return (
    <div className="text-sm flex flex-col gap-5">
      {/* ── Top action bar ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
        <ResultsFilter value={filter} onChange={setFilter} />

        {/* Inline context — shows what the filter is scoped to */}
        <span className="text-[11px] text-slate-500 sm:ml-1 hidden sm:inline">
          for {armLabel} · {students.length} student
          {students.length === 1 ? "" : "s"}
        </span>

        <div className="sm:ml-auto">
          <BroadsheetActionButton
            status={arm?.broadsheet}
            disabled={students.length === 0}
            onOpen={(action) => setSubmitAction(action)}
          />
        </div>
      </div>

      {/* ── Master / detail body ────────────────────────────────────────── */}
      {students.length === 0 ? (
        <EmptyState
          variant="generic"
          title="No students in this arm"
          description="Add students before generating results."
        />
      ) : (
        <div className="flex flex-col md:flex-row gap-4 md:gap-6">
          {/* Master list: full width on mobile when no student selected;
              hidden on mobile when a student is selected; persistent
              sidebar on desktop. */}
          <div
            className={`md:w-72 md:shrink-0 ${
              selectedStudent ? "hidden md:block" : "block"
            }`}
          >
            <ResultsMasterList
              students={students}
              selectedStudentId={selectedStudentId}
              onSelect={(s) => setSelectedStudentId(s.id)}
              isLoading={studentsPending}
            />
          </div>

          {/* Detail pane — visible whenever a student is selected. On desktop
              also shows a "pick a student" empty state when none picked. */}
          <div
            className={`flex-1 min-w-0 ${
              selectedStudent ? "block" : "hidden md:block"
            }`}
          >
            {selectedStudent ? (
              <ResultsDetailPane
                student={selectedStudent}
                allStudents={students}
                classResult={classResult}
                filter={filter}
                subjects={subjects}
                onBack={() => setSelectedStudentId(null)}
                onSelect={(s) => setSelectedStudentId(s.id)}
              />
            ) : (
              <div className="hidden md:flex h-full min-h-72 items-center justify-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/40">
                <div className="text-center max-w-xs">
                  <p className="text-sm text-slate-600 font-medium">
                    Select a student
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Pick a name from the list to view their{" "}
                    {filter.toLowerCase()} report for this term.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Submit modal ────────────────────────────────────────────────
          Conditionally rendered so each open is a fresh instance — no
          manual reset of error state needed between attempts. */}
      {submitAction && (
        <BroadsheetSubmitModal
          action={submitAction}
          onClose={() => setSubmitAction(null)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Status-aware broadsheet action button.
//
// Decides which variant to show based on the arm's broadsheet status:
//   - "none"     → primary action button, "Generate Broadsheet"
//   - "pending"  → muted informational pill, "Pending Review"
//   - "revoked"  → primary action button with warm color, "Resubmit for Review"
//   - "approved" → muted success pill, "Approved"
//
// Actionable variants delegate to `onOpen` with the appropriate action verb
// so the parent can mount the submit modal in the right mode.
// ─────────────────────────────────────────────────────────────────────────────
function BroadsheetActionButton({
  status,
  disabled,
  onOpen,
}: {
  status: ClassArm["broadsheet"];
  disabled: boolean;
  onOpen: (action: BroadsheetSubmitAction) => void;
}) {
  // Pending — informational only. No action available until admin acts.
  if (status === "pending") {
    return (
      <div
        className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs bg-amber-50 text-amber-800 border border-amber-200 rounded-xl w-full sm:w-auto"
        role="status"
        aria-label="Broadsheet status: pending administrator review"
      >
        <Clock size={12} />
        Pending Review
      </div>
    );
  }

  // Approved — also informational; the admin has signed off.
  if (status === "approved") {
    return (
      <div
        className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl w-full sm:w-auto"
        role="status"
        aria-label="Broadsheet status: approved"
      >
        <CheckCircle2 size={12} />
        Approved
      </div>
    );
  }

  // Actionable variants — pick verb + label + icon + accent based on status.
  // broadsheetActionFor() returns the wire-level verb to send when the modal's
  // Proceed is clicked. For "none" → "submit"; for "revoked" → "resend".
  const action = broadsheetActionFor(status);
  if (!action) return null; // Unknown status — render nothing rather than guess.

  const isResubmit = status === "revoked";
  const label = isResubmit ? "Resubmit for Review" : "Generate Broadsheet";
  const Icon = isResubmit ? RefreshCw : FileBarChart;

  return (
    <button
      type="button"
      onClick={() => onOpen(action)}
      disabled={disabled}
      className="flex items-center gap-1.5 px-3 py-2 text-xs bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors shadow-sm shadow-violet-200 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto justify-center cursor-pointer"
      title={
        disabled
          ? "Add students before submitting"
          : isResubmit
            ? "Submit corrected results for another review"
            : "Submit results for administrator review"
      }
    >
      <Icon size={12} />
      {label}
    </button>
  );
}
