"use client";

// ─────────────────────────────────────────────────────────────────────────────
// BroadsheetAffectiveView.tsx
//
// Behaviour ratings table. Same structural shape as the cognitive view but
// flatter — one score + one grade column per behaviour (no nested unit
// columns), and a small set of class-wide summary columns at the right.
//
// Per the AffectiveAssessmentBehaviour serializer in users/serializers.py,
// the label sits on `behaviour` (not `name`). We display that string in the
// rotated column header.
//
// Rotated headers: rotation lives on an inner `<span className="inline-
// block …">`, not on the `<th>`. Without the inner wrapper, Safari renders
// `writing-mode: vertical-rl` + `rotate(180deg)` combinations with the
// glyphs upside down; wrapping the text in an inline-block gives the
// transform a stable origin that renders identically in Chromium and Safari.
//
// Loading gate: shows a TableLoader while students / classResult queries
// are still in flight (subjects isn't consumed here, but behaviours come
// from the arm's own affective_assessment_format so the arm-loaded check
// suffices for the column set). Prevents the "No students in this arm"
// flash from firing before the roster query lands.
// ─────────────────────────────────────────────────────────────────────────────

import { Fragment, useMemo, useState } from "react";

import EmptyState from "../../../components/Emptystate";
import TableLoader from "../../../components/Tableloader";
import { useBroadsheetDetails } from "../context/BroadsheetDetailsProvider";
import BroadsheetRowActionMenu from "./BroadsheetRowActionMenu";
import StudentInfoModal, { StudentInfoVariant } from "./StudentInfoModal";

interface ActiveModalState {
  variant: StudentInfoVariant;
  student: ArmStudent;
}

interface BroadsheetAffectiveViewProps {
  searchQuery: string;
}

export default function BroadsheetAffectiveView({
  searchQuery,
}: BroadsheetAffectiveViewProps) {
  const { arm, students, classResult, studentsPending, classResultPending } =
    useBroadsheetDetails();
  const [activeModal, setActiveModal] = useState<ActiveModalState | null>(null);

  // Behaviours sorted by display_order so the column layout stays stable.
  const behaviours = useMemo(() => {
    const list = arm?.affective_assessment_format?.behaviours ?? [];
    return [...list].sort((a, b) => a.display_order - b.display_order);
  }, [arm?.affective_assessment_format]);

  const visibleStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) => {
      const fullName = `${s.first_name} ${s.middle_name ?? ""} ${s.last_name}`
        .toLowerCase()
        .replace(/\s+/g, " ");
      return (
        fullName.includes(q) ||
        (s.public_id?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [students, searchQuery]);

  // Per-student affective overall (sum of all behaviour scores) — drives
  // the "Overall Total" column. Position column is no longer shown, so we
  // no longer compute a ranking here (it wasn't consumed elsewhere).
  const affectiveTotals = useMemo(() => {
    const totalsById: Record<string, number> = {};
    for (const student of students) {
      const sr = classResult.students[student.id];
      let total = 0;
      if (sr) {
        for (const traitResult of Object.values(sr.behaviours)) {
          if (traitResult.score >= 0) total += traitResult.score;
        }
      }
      totalsById[student.id] = total;
    }
    return totalsById;
  }, [students, classResult]);

  if (!arm) return null;

  // Wait for the queries this view depends on before deciding between the
  // table and an empty state.
  if (studentsPending || classResultPending) {
    return <TableLoader rows={8} className="my-4" />;
  }

  if (behaviours.length === 0) {
    return (
      <EmptyState
        variant="generic"
        title="Affective format not configured"
        description="Set up the affective assessment format for this arm before viewing the behaviour broadsheet."
      />
    );
  }

  if (visibleStudents.length === 0) {
    return (
      <EmptyState
        variant={searchQuery ? "search" : "generic"}
        title={searchQuery ? "No matching students" : "No students in this arm"}
        description={
          searchQuery
            ? `No students match "${searchQuery}".`
            : "Add students to this arm to populate the broadsheet."
        }
      />
    );
  }

  return (
    <>
      <div className="overflow-auto max-h-[80vh] border border-indigo-100 rounded-2xl">
        <table className="table-auto bg-white text-[11px] w-full">
          <thead className="sticky top-0 z-30">
            <tr className="h-10 text-white bg-rose-800">
              <th
                className="px-2 py-2 text-center sticky left-0 z-20 bg-rose-800 w-10"
                rowSpan={2}
              >
                <span className="sr-only">Action</span>
              </th>
              <th
                className="px-2 py-2 text-center sticky left-10 z-20 bg-rose-800 w-12 border-r border-r-rose-600"
                rowSpan={2}
              >
                SN
              </th>
              <th className="px-3 py-2 text-left whitespace-nowrap" rowSpan={2}>
                Full Name
              </th>

              {behaviours.map((b) => (
                <RotatedHeader
                  key={b.id}
                  colSpan={2}
                  extraClassName="border-l border-l-rose-300"
                >
                  {b.behaviour}
                </RotatedHeader>
              ))}

              {/* Summary columns — Total Obtainable and Position removed
                  per current spec; only the two most useful summaries
                  remain. */}
              <SummaryHeader>Behaviours Assessed</SummaryHeader>
              <SummaryHeader>Overall Total</SummaryHeader>
            </tr>

            {/* Second row — SCORE / GRADE labels under each behaviour. */}
            <tr className="h-10 text-white bg-rose-800">
              {behaviours.map((b) => (
                <Fragment key={`hdr2-${b.id}`}>
                  <RotatedHeader
                    key={`${b.id}-score`}
                    extraClassName="border-l border-l-rose-300"
                  >
                    SCORE
                  </RotatedHeader>
                  <RotatedHeader key={`${b.id}-grade`}>GRADE</RotatedHeader>
                </Fragment>
              ))}
            </tr>
          </thead>

          <tbody>
            {visibleStudents.map((student, rowIndex) => {
              const studentResult = classResult.students[student.id];
              const total = affectiveTotals[student.id] ?? 0;

              // Count of behaviours that actually have a non-absent score.
              const assessedCount = studentResult
                ? Object.values(studentResult.behaviours).filter(
                    (t) => !t.is_absent,
                  ).length
                : 0;

              return (
                <tr
                  key={student.id}
                  className={`h-10 text-center ${
                    rowIndex % 2 === 0 ? "bg-white" : "bg-rose-50/40"
                  }`}
                >
                  <td
                    className={`px-2 py-1 sticky left-0 z-10 w-10 ${
                      rowIndex % 2 === 0 ? "bg-white" : "bg-rose-50"
                    }`}
                  >
                    <BroadsheetRowActionMenu
                      studentId={student.id}
                      onPerformanceInfo={() =>
                        setActiveModal({ variant: "performance", student })
                      }
                      onResultAccessInfo={() =>
                        setActiveModal({ variant: "access", student })
                      }
                      onPrintResult={() => {
                        /* Placeholder — per-student print is not wired yet. */
                      }}
                    />
                  </td>
                  <td
                    className={`px-2 py-2 text-slate-500 sticky left-10 z-10 w-12 border-r border-r-rose-100 ${
                      rowIndex % 2 === 0 ? "bg-white" : "bg-rose-50"
                    }`}
                  >
                    {rowIndex + 1}
                  </td>
                  <td className="px-3 py-2 text-left whitespace-nowrap text-slate-800 min-w-44">
                    {student.first_name}{" "}
                    {student.middle_name ? `${student.middle_name} ` : ""}
                    {student.last_name}
                  </td>

                  {behaviours.map((b) => {
                    const traitResult = studentResult?.behaviours[b.id];
                    const score = traitResult?.score;
                    return (
                      <Fragment key={`${student.id}-${b.id}-group`}>
                        <td
                          key={`${student.id}-${b.id}-score`}
                          className="px-1 py-2 border-l border-l-rose-100 text-slate-700"
                        >
                          <ScoreCell score={score} />
                        </td>
                        <td
                          key={`${student.id}-${b.id}-grade`}
                          className="px-1 py-2 text-slate-700"
                        >
                          {traitResult?.grade_symbol ?? "—"}
                        </td>
                      </Fragment>
                    );
                  })}

                  <SummaryCell>{assessedCount}</SummaryCell>
                  <SummaryCell>{total}</SummaryCell>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {activeModal && (
        <StudentInfoModal
          variant={activeModal.variant}
          student={activeModal.student}
          studentResult={classResult.students[activeModal.student.id]}
          totalClassSubjects={
            arm.cognitive_assessment_format?.units.length ?? 0
          }
          classSize={students.length}
          onClose={() => setActiveModal(null)}
        />
      )}
    </>
  );
}

// ── Rotated cell primitives ──────────────────────────────────────────────

function RotatedHeader({
  children,
  extraClassName = "",
  colSpan,
  rowSpan,
}: {
  children: React.ReactNode;
  extraClassName?: string;
  colSpan?: number;
  rowSpan?: number;
}) {
  return (
    <th
      colSpan={colSpan}
      rowSpan={rowSpan}
      className={`px-2 py-2 text-center align-bottom ${extraClassName}`}
    >
      <span className="inline-block [writing-mode:vertical-rl] rotate-180 whitespace-nowrap">
        {children}
      </span>
    </th>
  );
}

function SummaryHeader({ children }: { children: React.ReactNode }) {
  return (
    <th
      className="px-2 py-2 border-l border-l-rose-300 align-bottom lg:align-middle"
      rowSpan={2}
    >
      <span className="inline-block [writing-mode:vertical-rl] rotate-180 lg:[writing-mode:horizontal-tb] lg:rotate-0 whitespace-nowrap">
        {children}
      </span>
    </th>
  );
}

function SummaryCell({ children }: { children: React.ReactNode }) {
  return (
    <td className="px-2 py-2 border-l border-l-rose-100 text-slate-700">
      {children}
    </td>
  );
}

// ── ScoreCell ─────────────────────────────────────────────────────────────
// Small helper matching the cognitive view — small-weight ABS pill for
// the absent sentinel, "—" for missing, raw score otherwise.
function ScoreCell({ score }: { score: number | null | undefined }) {
  if (score === -1) {
    return <span className="text-[9px] font-semibold text-slate-500">ABS</span>;
  }
  if (score == null) return <>—</>;
  return <>{score}</>;
}
