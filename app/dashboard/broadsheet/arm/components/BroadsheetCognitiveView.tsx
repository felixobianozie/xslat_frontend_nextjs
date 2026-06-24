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
//   - Long header text rotates to [writing-mode:vertical-rl] so the table
//     stays compact even with 10+ subjects.
//   - The outer wrapper scrolls in both axes inside a capped max-height —
//     broadsheets are inherently wide and can be long. Sticky positioning
//     keeps the header rows pinned to the top during vertical scroll and
//     the Action/SN cells pinned to the left during horizontal scroll, so
//     the user always has a column-and-row anchor while exploring data.
//
// Data: everything comes from the provider — students, subjects, assessment
// format columns, and the pre-computed per-student totals/grades/positions.
// ─────────────────────────────────────────────────────────────────────────────

import { Fragment, useMemo, useState } from "react";

import EmptyState from "../../../components/Emptystate";
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
  // Client-side text search applied across student name + public id.
  searchQuery: string;
}

export default function BroadsheetCognitiveView({
  searchQuery,
}: BroadsheetCognitiveViewProps) {
  const { arm, students, subjects, classResult } = useBroadsheetDetails();

  // Modal state — see ActiveModalState above for purpose.
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
  // Reused inside the rows so we precompute once.
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

  // ── Empty states (config or roster missing) ─────────────────────────────
  if (!arm) return null;

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
          (below) then pins the column headers to the top of the wrapper
          during vertical scroll, mirroring how the SN/Action cells pin to
          the left during horizontal scroll. */}
      <div className="overflow-auto max-h-[80vh] border border-indigo-100 rounded-2xl">
        <table className="table-auto bg-white text-[11px] w-full">
          {/* `sticky top-0 z-30` pins the entire header block (both rows,
              including the rowSpan=2 corners) to the top edge of the
              wrapper. z-30 keeps it above body sticky cells (z-10) so the
              header always wins overlap. */}
          <thead className="sticky top-0 z-30">
            {/* Top header row — bio + subject names + summary columns.
                Action and SN cells are sticky so they stay pinned to the
                left edge while the user scrolls horizontally through the
                subject columns. The SN cell carries a right border to mark
                the boundary between the pinned area and the scrolling
                content. */}
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
              <th
                className="px-2 py-2 text-center border-l border-l-indigo-300 [writing-mode:vertical-rl] rotate-180"
                rowSpan={2}
              >
                SEX
              </th>

              {/* Subject group headers — span all of the subject's units + TOTAL + GRADE. */}
              {orderedSubjects.map((subject) => (
                <th
                  key={subject.id}
                  colSpan={units.length + 2}
                  className="px-2 py-2 border-l border-l-indigo-300 [writing-mode:vertical-rl] rotate-180 whitespace-nowrap"
                >
                  {subject.definition.name}
                </th>
              ))}

              {/* Summary columns — rotated so they stay narrow. */}
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
                    <th
                      key={`${subject.id}-${unit.id}`}
                      className={`px-2 py-2 text-center [writing-mode:vertical-rl] rotate-180 ${
                        idx === 0 ? "border-l border-l-indigo-300" : ""
                      }`}
                    >
                      {unit.abbr}
                    </th>
                  ))}
                  <th
                    key={`${subject.id}-total`}
                    className="px-2 py-2 text-center [writing-mode:vertical-rl] rotate-180"
                  >
                    TOTAL
                  </th>
                  <th
                    key={`${subject.id}-grade`}
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

              // Build per-student grade tally (e.g. {A:5, B:2, C:1}) so the
              // "Grades Summary" column can render counts without any
              // additional fetch. Object iteration order is fine here —
              // Object.values returns insertion order for string keys.
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
                  {/* Action menu — sticky so it stays accessible regardless
                      of horizontal scroll position. The bg colour matches
                      the row's alternating shade so scrolled content can't
                      bleed through. */}
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
                        // Per-student print isn't wired yet — placeholder
                        // toast in the parent. We intentionally don't import
                        // toast here to keep this component leaf-light.
                      }}
                    />
                  </td>

                  {/* Bio cells — SN is sticky too, giving each row a
                      persistent identifier the user can follow while
                      scrolling through wide subject data. */}
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
                          const rawScore =
                            subjectResult?.scores[unit.display_order];
                          // Score === -1 represents "absent" by the
                          // convention in results-aggregates.ts.
                          const display =
                            rawScore === -1 ? "ABS" : (rawScore ?? "—");
                          return (
                            <td
                              key={`${student.id}-${subject.id}-${unit.id}`}
                              className={`px-1 py-2 text-slate-700 ${
                                idx === 0 ? "border-l border-l-indigo-100" : ""
                              }`}
                            >
                              {display}
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
      </div>

      {/* Modal — single instance shared across rows. */}
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

// ── Header / cell helpers ───────────────────────────────────────────────
// Tiny abstractions to keep the JSX skim-readable above. The summary
// header rotates on mobile + medium screens, then unrotates on lg+ where
// there's more horizontal room.
function SummaryHeader({ children }: { children: React.ReactNode }) {
  return (
    <th
      className="px-2 py-2 [writing-mode:vertical-rl] rotate-180 lg:[writing-mode:horizontal-tb] lg:rotate-0 border-l border-l-indigo-300 whitespace-nowrap"
      rowSpan={2}
    >
      {children}
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
