"use client";

// ─────────────────────────────────────────────────────────────────────────────
// BroadsheetCognitiveView.tsx
//
// Wide academics table. Every column belongs to a (subject, unit) pair from
// the cognitive assessment format, plus a per-subject TOTAL and GRADE, plus
// the class-wide summary columns (Subjects Taken, Overall Total, Total
// Obtainable, Average, Position, Grades Summary, Decision).
//
// Rendering choices:
//   - The header is two-row: top row holds the subject name spanning all of
//     its unit columns, the second row holds the unit abbreviations.
//   - Long header text rotates via `writing-mode: vertical-rl` + rotate(180).
//     The rotation and writing-mode classes live on an inner `<span
//     className="inline-block …">` inside each `<th>` (not on the `<th>`
//     itself). Reason: on Safari/WebKit, applying `writing-mode` and
//     `transform: rotate(180deg)` directly to a `<th>` renders the glyphs
//     upside down instead of bottom-to-top. Wrapping the text in an inline-
//     block span gives the transform a stable inline layout box and the
//     rendering matches Chromium.
//   - The outer wrapper scrolls in both axes inside a capped max-height, and
//     carries a small bottom-spacer div so the horizontal scrollbar doesn't
//     obscure the last data row.
//
// Loading gate:
//   isPending (top-level, arm-fetch) is handled by the parent — this file
//   is only mounted once the arm has loaded. But secondary queries
//   (subjects, students, classResult) may still be in flight when we mount,
//   and rendering an empty state during that window would flash "No
//   subjects set up" for a fraction of a second. We show a `TableLoader`
//   instead while any of those three queries is still pending.
// ─────────────────────────────────────────────────────────────────────────────

import { Fragment, useMemo, useState } from "react";

import EmptyState from "../../../components/Emptystate";
import TableLoader from "../../../components/Tableloader";
import { useBroadsheetDetails } from "../context/BroadsheetDetailsProvider";
import BroadsheetRowActionMenu from "./BroadsheetRowActionMenu";
import StudentInfoModal, { StudentInfoVariant } from "./StudentInfoModal";

// Tracks which row's modal is open. Stored at this level (rather than in
// each row) so only one modal is ever mounted at a time.
interface ActiveModalState {
  variant: StudentInfoVariant;
  student: ArmStudent;
}

interface BroadsheetCognitiveViewProps {
  searchQuery: string;
}

export default function BroadsheetCognitiveView({
  searchQuery,
}: BroadsheetCognitiveViewProps) {
  const {
    arm,
    students,
    subjects,
    classResult,
    subjectsPending,
    studentsPending,
    classResultPending,
  } = useBroadsheetDetails();

  const [activeModal, setActiveModal] = useState<ActiveModalState | null>(null);

  // Sort assessment-format units by display_order so the column order is
  // stable across renders and matches the score-entry UI.
  const units = useMemo(() => {
    const list = arm?.cognitive_assessment_format?.units ?? [];
    return [...list].sort((a, b) => a.display_order - b.display_order);
  }, [arm?.cognitive_assessment_format]);

  // Sort subjects alphabetically by name so the header row is predictable.
  const orderedSubjects = useMemo(() => {
    return [...subjects].sort((a, b) =>
      a.definition.name.localeCompare(b.definition.name),
    );
  }, [subjects]);

  // Total obtainable score per subject — sum of every unit's max_score.
  const subjectMaxScore = useMemo(
    () => units.reduce((sum, u) => sum + u.max_score, 0),
    [units],
  );

  // Filter students by the parent's search box. We match on name and the
  // public_id so admins can look up either way.
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

  if (!arm) return null;

  // Wait for every query this view depends on before deciding between the
  // table and an empty state. This eliminates the flash where `subjects`
  // is briefly `[]` (the provider's default) before the real fetch lands.
  if (subjectsPending || studentsPending || classResultPending) {
    return <TableLoader rows={8} className="my-4" />;
  }

  // ── Empty states (config or roster missing) ─────────────────────────────

  if (units.length === 0) {
    return (
      <EmptyState
        variant="generic"
        title="Cognitive format not configured"
        description="Set up the cognitive assessment format for this arm before viewing the broadsheet."
      />
    );
  }

  if (orderedSubjects.length === 0) {
    return (
      <EmptyState
        variant="generic"
        title="No subjects set up"
        description="Add subjects to this arm before viewing the cognitive broadsheet."
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
      {/* Wrapper handles BOTH axes of scroll. A capped max-height keeps the
          table from running off the page on long rosters; sticky thead
          pins the column headers during vertical scroll, and the SN/Action
          cells pin during horizontal scroll. */}
      <div className="overflow-auto max-h-[80vh] border border-indigo-100 rounded-2xl">
        <table className="table-auto bg-white text-[11px] w-full">
          <thead className="sticky top-0 z-30">
            {/* Top header row — bio + subject names + summary columns. */}
            <tr className="h-10 text-white bg-indigo-900">
              <th
                className="px-2 py-2 text-center sticky left-0 z-20 bg-indigo-900 w-10"
                rowSpan={2}
              >
                <span className="sr-only">Action</span>
              </th>
              <th
                className="px-2 py-2 text-center sticky left-10 z-20 bg-indigo-900 w-12 border-r border-r-indigo-700"
                rowSpan={2}
              >
                SN
              </th>
              <th className="px-3 py-2 text-left whitespace-nowrap" rowSpan={2}>
                Full Name
              </th>
              <th
                className="px-2 py-2 text-center whitespace-nowrap"
                rowSpan={2}
              >
                ID
              </th>
              <RotatedHeader
                extraClassName="border-l border-l-indigo-300"
                rowSpan={2}
              >
                SEX
              </RotatedHeader>

              {/* Subject group headers — span all of the subject's units +
                  TOTAL + GRADE. */}
              {orderedSubjects.map((subject) => (
                <RotatedHeader
                  key={subject.id}
                  colSpan={units.length + 2}
                  extraClassName="border-l border-l-indigo-300"
                >
                  {subject.definition.name}
                </RotatedHeader>
              ))}

              {/* Summary columns — rotated on md-, horizontal on lg+. */}
              <SummaryHeader>Subjects Taken</SummaryHeader>
              <SummaryHeader>Overall Total</SummaryHeader>
              <SummaryHeader>Total Obtainable</SummaryHeader>
              <SummaryHeader>Average</SummaryHeader>
              <SummaryHeader>Position</SummaryHeader>
              <SummaryHeader>Grades Summary</SummaryHeader>
              <SummaryHeader>Decision</SummaryHeader>
            </tr>

            {/* Second header row — unit labels under each subject. */}
            <tr className="h-10 text-white bg-indigo-900">
              {orderedSubjects.map((subject) => (
                <Fragment key={`hdr2-${subject.id}`}>
                  {units.map((unit, idx) => (
                    <RotatedHeader
                      key={`${subject.id}-${unit.id}`}
                      extraClassName={
                        idx === 0 ? "border-l border-l-indigo-300" : ""
                      }
                    >
                      {unit.abbr}
                    </RotatedHeader>
                  ))}
                  <RotatedHeader key={`${subject.id}-total`}>
                    TOTAL
                  </RotatedHeader>
                  <RotatedHeader key={`${subject.id}-grade`}>
                    GRADE
                  </RotatedHeader>
                </Fragment>
              ))}
            </tr>
          </thead>

          <tbody>
            {visibleStudents.map((student, rowIndex) => {
              const studentResult = classResult.students[student.id];

              const gradeTally = (() => {
                const tally: Record<string, number> = {};
                if (!studentResult) return tally;
                for (const subjectResult of Object.values(
                  studentResult.subjects,
                )) {
                  const sym = subjectResult.grade_symbol ?? "—";
                  tally[sym] = (tally[sym] ?? 0) + 1;
                }
                return tally;
              })();

              const totalObtained = studentResult
                ? Object.values(studentResult.subjects).reduce(
                    (sum, s) => sum + s.total,
                    0,
                  )
                : 0;
              const totalObtainable = subjectMaxScore * orderedSubjects.length;

              return (
                <tr
                  key={student.id}
                  className={`h-10 text-center ${
                    rowIndex % 2 === 0 ? "bg-white" : "bg-indigo-50/40"
                  }`}
                >
                  <td
                    className={`px-2 py-1 sticky left-0 z-10 w-10 ${
                      rowIndex % 2 === 0 ? "bg-white" : "bg-indigo-50"
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
                    className={`px-2 py-2 text-slate-500 sticky left-10 z-10 w-12 border-r border-r-indigo-100 ${
                      rowIndex % 2 === 0 ? "bg-white" : "bg-indigo-50"
                    }`}
                  >
                    {rowIndex + 1}
                  </td>
                  <td className="px-3 py-2 text-left whitespace-nowrap text-slate-800 min-w-44">
                    {student.first_name}{" "}
                    {student.middle_name ? `${student.middle_name} ` : ""}
                    {student.last_name}
                  </td>
                  <td className="px-2 py-2 text-slate-500 whitespace-nowrap">
                    {student.public_id ?? "—"}
                  </td>
                  <td className="px-2 py-2 border-l border-l-indigo-100 text-slate-600">
                    {student.gender ?? "—"}
                  </td>

                  {/* Subject groups */}
                  {orderedSubjects.map((subject) => {
                    const subjectResult = studentResult?.subjects[subject.id];
                    return (
                      <Fragment key={`${student.id}-${subject.id}-group`}>
                        {units.map((unit, idx) => {
                          // Score index i in `scores` corresponds to
                          // `units[i]` (both sorted by display_order). Do
                          // NOT read by display_order value directly — it
                          // can be non-contiguous.
                          const rawScore = subjectResult?.scores[idx];
                          return (
                            <td
                              key={`${student.id}-${subject.id}-${unit.id}`}
                              className={`px-1 py-2 text-slate-700 ${
                                idx === 0 ? "border-l border-l-indigo-100" : ""
                              }`}
                            >
                              <ScoreCell score={rawScore} />
                            </td>
                          );
                        })}
                        <td
                          key={`${student.id}-${subject.id}-total`}
                          className="px-1 py-2 font-semibold text-slate-800"
                        >
                          {subjectResult?.total ?? "—"}
                        </td>
                        <td
                          key={`${student.id}-${subject.id}-grade`}
                          className="px-1 py-2 text-slate-700"
                        >
                          {subjectResult?.grade_symbol ?? "—"}
                        </td>
                      </Fragment>
                    );
                  })}

                  {/* Summary cells */}
                  <SummaryCell>
                    {studentResult
                      ? Object.keys(studentResult.subjects).length
                      : 0}
                  </SummaryCell>
                  <SummaryCell>{totalObtained}</SummaryCell>
                  <SummaryCell>{totalObtainable}</SummaryCell>
                  <SummaryCell>
                    {studentResult?.average.toFixed(2) ?? "—"}
                  </SummaryCell>
                  <SummaryCell>{studentResult?.position ?? "—"}</SummaryCell>
                  <SummaryCell>
                    {Object.entries(gradeTally)
                      .map(([sym, n]) => `${sym}:${n}`)
                      .join(", ") || "—"}
                  </SummaryCell>
                  <SummaryCell>
                    <span
                      className={
                        studentResult?.decision === "Pass"
                          ? "text-emerald-600 font-semibold"
                          : studentResult?.decision === "Fail"
                            ? "text-red-500 font-semibold"
                            : "text-slate-500"
                      }
                    >
                      {studentResult?.decision ?? "—"}
                    </span>
                  </SummaryCell>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Spacer below the table so the horizontal scrollbar doesn't
            obscure the last row's content. `pb-*` on the wrapper doesn't
            reliably reserve space inside overflow-auto across browsers,
            so we drop a real spacer element instead. */}
        <div aria-hidden className="h-4" />
      </div>

      {activeModal && (
        <StudentInfoModal
          variant={activeModal.variant}
          student={activeModal.student}
          studentResult={classResult.students[activeModal.student.id]}
          totalClassSubjects={orderedSubjects.length}
          classSize={students.length}
          onClose={() => setActiveModal(null)}
        />
      )}
    </>
  );
}

// ── Rotated cell primitives ──────────────────────────────────────────────
// See file header for the rationale behind wrapping the rotated text in an
// inner inline-block span rather than rotating the `<th>` directly.

// Base rotated column header — vertical writing mode, rotated 180deg.
// Used for the SEX corner cell and the subject / unit labels.
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

// Summary column header — rotated on md- and horizontal on lg+ where we
// have room. The responsive switch lives on the inner span so Safari
// respects the transform origin.
function SummaryHeader({ children }: { children: React.ReactNode }) {
  return (
    <th
      className="px-2 py-2 border-l border-l-indigo-300 align-bottom lg:align-middle"
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
    <td className="px-2 py-2 border-l border-l-indigo-100 text-slate-700">
      {children}
    </td>
  );
}

// ── ScoreCell ─────────────────────────────────────────────────────────────
// Presentation for a single cognitive-score cell. Renders the raw score
// when present, "—" when missing, and a smaller-weight "ABS" pill for the
// absent sentinel (-1). Extracted so all three tables can share the same
// rendering for the absent case.
function ScoreCell({ score }: { score: number | null | undefined }) {
  if (score === -1) {
    return <span className="text-[9px] font-semibold text-slate-500">ABS</span>;
  }
  if (score == null) return <>—</>;
  return <>{score}</>;
}
