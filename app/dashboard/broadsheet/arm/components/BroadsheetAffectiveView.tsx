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
// rotated subject-style header.
// ─────────────────────────────────────────────────────────────────────────────

import { Fragment, useMemo, useState } from "react";

import EmptyState from "../../../components/Emptystate";
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
  const { arm, students, classResult } = useBroadsheetDetails();
  const [activeModal, setActiveModal] = useState<ActiveModalState | null>(null);

  // Behaviours sorted by display_order so the column layout stays stable.
  const behaviours = useMemo(() => {
    const list = arm?.affective_assessment_format?.behaviours ?? [];
    return [...list].sort((a, b) => a.display_order - b.display_order);
  }, [arm?.affective_assessment_format]);

  // Maximum possible affective score = sum of every behaviour's max_score.
  // Drives the "Overall Total" obtainable visible in the summary column.
  const maxOverallTotal = useMemo(
    () => behaviours.reduce((sum, b) => sum + b.max_score, 0),
    [behaviours],
  );

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

  // Per-student affective overall (sum of all behaviour scores) — used
  // for the "Overall Total" + ranking. Computed here rather than in the
  // shared aggregator because the academic average there counts cognitive
  // scores only; behaviour ranking is independent.
  const affectiveRankings = useMemo(() => {
    const totals: { studentId: string; total: number }[] = [];
    for (const student of students) {
      const sr = classResult.students[student.id];
      if (!sr) {
        totals.push({ studentId: student.id, total: 0 });
        continue;
      }
      let total = 0;
      for (const traitResult of Object.values(sr.behaviours)) {
        if (traitResult.score >= 0) total += traitResult.score;
      }
      totals.push({ studentId: student.id, total });
    }
    // Rank by total descending; equal totals share sort-stable order.
    const sorted = [...totals].sort((a, b) => b.total - a.total);
    const positions: Record<string, number> = {};
    sorted.forEach((entry, index) => {
      positions[entry.studentId] = index + 1;
    });
    return {
      positions,
      totalsById: Object.fromEntries(totals.map((t) => [t.studentId, t.total])),
    };
  }, [students, classResult]);

  if (!arm) return null;

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
          {/* Sticky thead — pinned to the top edge of the wrapper so column
              headers stay visible during vertical scroll. z-30 keeps it
              above the body's left-sticky cells (z-10). */}
          <thead className="sticky top-0 z-30">
            {/* Action + SN cells are sticky so they stay pinned to the
                left edge during horizontal scroll, giving the user a
                stable per-row anchor. */}
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
                <th
                  key={b.id}
                  colSpan={2}
                  className="px-2 py-2 border-l border-l-rose-300 [writing-mode:vertical-rl] rotate-180 whitespace-nowrap"
                >
                  {b.behaviour}
                </th>
              ))}

              <SummaryHeader>Behaviours Assessed</SummaryHeader>
              <SummaryHeader>Overall Total</SummaryHeader>
              <SummaryHeader>Total Obtainable</SummaryHeader>
              <SummaryHeader>Position</SummaryHeader>
            </tr>

            {/* Second row — SCORE / GRADE labels under each behaviour. */}
            <tr className="h-10 text-white bg-rose-800">
              {behaviours.map((b) => (
                <Fragment key={`hdr2-${b.id}`}>
                  <th
                    key={`${b.id}-score`}
                    className="px-2 py-2 text-center border-l border-l-rose-300 [writing-mode:vertical-rl] rotate-180"
                  >
                    SCORE
                  </th>
                  <th
                    key={`${b.id}-grade`}
                    className="px-2 py-2 text-center [writing-mode:vertical-rl] rotate-180"
                  >
                    GRADE
                  </th>
                </Fragment>
              ))}
            </tr>
          </thead>

          <tbody>
            {visibleStudents.map((student, rowIndex) => {
              const studentResult = classResult.students[student.id];
              const total = affectiveRankings.totalsById[student.id] ?? 0;
              const position = affectiveRankings.positions[student.id] ?? "—";

              // Count of behaviours that actually have a non-absent score.
              const assessedCount = studentResult
                ? Object.values(studentResult.behaviours).filter(
                    (t) => !t.isAbsent,
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
                    const display = score === -1 ? "ABS" : (score ?? "—");
                    return (
                      <Fragment key={`${student.id}-${b.id}-group`}>
                        <td
                          key={`${student.id}-${b.id}-score`}
                          className="px-1 py-2 border-l border-l-rose-100 text-slate-700"
                        >
                          {display}
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
                  <SummaryCell>{maxOverallTotal}</SummaryCell>
                  <SummaryCell>{position}</SummaryCell>
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

// ── Header / cell helpers (rose accent for the affective table) ────────
function SummaryHeader({ children }: { children: React.ReactNode }) {
  return (
    <th
      className="px-2 py-2 [writing-mode:vertical-rl] rotate-180 lg:[writing-mode:horizontal-tb] lg:rotate-0 border-l border-l-rose-300 whitespace-nowrap"
      rowSpan={2}
    >
      {children}
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
