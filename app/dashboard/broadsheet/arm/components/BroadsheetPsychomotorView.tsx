"use client";

// ─────────────────────────────────────────────────────────────────────────────
// BroadsheetPsychomotorView.tsx
//
// Skill ratings table. Structurally identical to the affective view, but
// reads from the psychomotor format (`activities`) and uses an amber accent
// to distinguish the two at a glance.
//
// Per PsychomotorAssessmentActivity in users/serializers.py, the label sits
// on `activity` (not `name`). We display that string in the rotated header.
//
// Rotated headers: the rotation lives on an inner `<span className="inline-
// block …">` inside each `<th>`, not on the `<th>` itself. See the
// cognitive view for the full rationale — Safari renders the `<th>` +
// writing-mode + rotate combination upside down; the inner-span wrapper
// gives the transform a stable inline origin that renders consistently.
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

interface BroadsheetPsychomotorViewProps {
  searchQuery: string;
}

export default function BroadsheetPsychomotorView({
  searchQuery,
}: BroadsheetPsychomotorViewProps) {
  const { arm, students, classResult, studentsPending, classResultPending } =
    useBroadsheetDetails();
  const [activeModal, setActiveModal] = useState<ActiveModalState | null>(null);

  const activities = useMemo(() => {
    const list = arm?.psychomotor_assessment_format?.activities ?? [];
    return [...list].sort((a, b) => a.display_order - b.display_order);
  }, [arm?.psychomotor_assessment_format]);

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

  // Per-student psychomotor total — drives the "Overall Total" column.
  // Position is no longer displayed so we don't rank here.
  const psyTotals = useMemo(() => {
    const totalsById: Record<string, number> = {};
    for (const student of students) {
      const sr = classResult.students[student.id];
      let total = 0;
      if (sr) {
        for (const traitResult of Object.values(sr.skills)) {
          if (traitResult.score >= 0) total += traitResult.score;
        }
      }
      totalsById[student.id] = total;
    }
    return totalsById;
  }, [students, classResult]);

  if (!arm) return null;

  if (studentsPending || classResultPending) {
    return <TableLoader rows={8} className="my-4" />;
  }

  if (activities.length === 0) {
    return (
      <EmptyState
        variant="generic"
        title="Psychomotor format not configured"
        description="Set up the psychomotor assessment format for this arm before viewing the skills broadsheet."
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
            <tr className="h-10 text-white bg-amber-700">
              <th
                className="px-2 py-2 text-center sticky left-0 z-20 bg-amber-700 w-10"
                rowSpan={2}
              >
                <span className="sr-only">Action</span>
              </th>
              <th
                className="px-2 py-2 text-center sticky left-10 z-20 bg-amber-700 w-12 border-r border-r-amber-500"
                rowSpan={2}
              >
                SN
              </th>
              <th className="px-3 py-2 text-left whitespace-nowrap" rowSpan={2}>
                Full Name
              </th>

              {activities.map((a) => (
                <RotatedHeader
                  key={a.id}
                  colSpan={2}
                  extraClassName="border-l border-l-amber-300"
                >
                  {a.activity}
                </RotatedHeader>
              ))}

              {/* Summary columns — Total Obtainable and Position removed
                  per current spec; only the two most useful summaries
                  remain. */}
              <SummaryHeader>Activities Assessed</SummaryHeader>
              <SummaryHeader>Overall Total</SummaryHeader>
            </tr>

            <tr className="h-10 text-white bg-amber-700">
              {activities.map((a) => (
                <Fragment key={`hdr2-${a.id}`}>
                  <RotatedHeader
                    key={`${a.id}-score`}
                    extraClassName="border-l border-l-amber-300"
                  >
                    SCORE
                  </RotatedHeader>
                  <RotatedHeader key={`${a.id}-grade`}>GRADE</RotatedHeader>
                </Fragment>
              ))}
            </tr>
          </thead>

          <tbody>
            {visibleStudents.map((student, rowIndex) => {
              const studentResult = classResult.students[student.id];
              const total = psyTotals[student.id] ?? 0;

              const assessedCount = studentResult
                ? Object.values(studentResult.skills).filter(
                    (t) => !t.is_absent,
                  ).length
                : 0;

              return (
                <tr
                  key={student.id}
                  className={`h-10 text-center ${
                    rowIndex % 2 === 0 ? "bg-white" : "bg-amber-50/40"
                  }`}
                >
                  <td
                    className={`px-2 py-1 sticky left-0 z-10 w-10 ${
                      rowIndex % 2 === 0 ? "bg-white" : "bg-amber-50"
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
                    className={`px-2 py-2 text-slate-500 sticky left-10 z-10 w-12 border-r border-r-amber-100 ${
                      rowIndex % 2 === 0 ? "bg-white" : "bg-amber-50"
                    }`}
                  >
                    {rowIndex + 1}
                  </td>
                  <td className="px-3 py-2 text-left whitespace-nowrap text-slate-800 min-w-44">
                    {student.first_name}{" "}
                    {student.middle_name ? `${student.middle_name} ` : ""}
                    {student.last_name}
                  </td>

                  {activities.map((a) => {
                    const traitResult = studentResult?.skills[a.id];
                    const score = traitResult?.score;
                    return (
                      <Fragment key={`${student.id}-${a.id}-group`}>
                        <td
                          key={`${student.id}-${a.id}-score`}
                          className="px-1 py-2 border-l border-l-amber-100 text-slate-700"
                        >
                          <ScoreCell score={score} />
                        </td>
                        <td
                          key={`${student.id}-${a.id}-grade`}
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

// ── Rotated cell primitives (amber accent for the psychomotor table) ────

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
      className="px-2 py-2 border-l border-l-amber-300 align-bottom lg:align-middle"
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
    <td className="px-2 py-2 border-l border-l-amber-100 text-slate-700">
      {children}
    </td>
  );
}

// ── ScoreCell ─────────────────────────────────────────────────────────────
function ScoreCell({ score }: { score: number | null | undefined }) {
  if (score === -1) {
    return <span className="text-[9px] font-semibold text-slate-500">ABS</span>;
  }
  if (score == null) return <>—</>;
  return <>{score}</>;
}
