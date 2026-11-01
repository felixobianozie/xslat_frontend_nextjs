"use client";

// ──────────────────────────────────────────
// templates/JuniorDefaultA4V1.tsx
//
// Registered against the backend template_key `junior-default-a4v1`. Assigned to arms whose
// result_template points at that row on the backend's ResultTemplate table.
//
// Design language: indigo accent, A4 portrait, the grade summary in the cognitive
// table's footer, and the student's position in the identity grid. Ported from
// terminal-report-template-1_junior-secondary.html.
//
// Data mapping (from the StudentResultResponse the sheet is given):
//   Header / identity ← result.school, result.arm/level/section, result.term,
//                       result.session, and the student name fields.
//   Summary strip     ← result.average, class_average, total_score, decision.
//   Cognitive table   ← result.subjects (rows), result.arm.cognitive_assessment_format.units
//                       (unit column headers), result.grading_summary.
//   Teacher ID col.   ← result.subjects[*].teachers[0].public_id (hydrated from
//                       the result context's subjects).
//   Behaviour grid    ← result.behaviours.
//   Skills grid       ← result.skills.
//   Remarks           ← result.teachers_remark, result.supervisors_remark.
//   Grading legends   ← result.arm.cog_grading_format / aff_grading_format /
//                       psy_grading_format (their `.grades` arrays).
//   Date issued       ← result.term.results_published_at, printed as the WAT date
//                       (see formatIssueDate); today's date when it is missing.
//
// Assumptions the runtime data may not satisfy:
//   - School logo: served from /images/lhs_logo.png; a circle showing the school
//     abbreviation renders when the image is absent or fails to load.
//   - Student photo: no field exists on the Student model yet, so the dashed
//     square renders as a permanent placeholder.
// ──────────────────────────────────────────

import type { ResultTemplateProps } from "../types";
import IdentityCell from "../components/IdentityCell";
import LegendCard from "../components/LegendCard";
import LogoWithFallback from "../components/LogoWithFallback";
import PhotoPlaceholder from "../components/PhotoPlaceholder";
import RemarkCard from "../components/RemarkCard";
import SummaryCell from "../components/SummaryCell";
import TraitGrid from "../components/TraitGrid";
import {
  composeSchoolAddress,
  composeStudentName,
  formatIssueDate,
  formatScore,
} from "../utils/formatting";
import { PRINT_STYLES } from "../utils/printStyles";

// `printRef` is a regular prop (not a forwardRef ref). It is attached to the
// outer .result-page div below, which is the node the viewer rasterises for the
// PDF download and prints.
function JuniorDefaultA4V1({ result, printRef }: ResultTemplateProps) {
  const {
    student_first_name,
    student_middle_name,
    student_last_name,
    student_public_id,
    student_gender,
    average,
    class_average,
    total_score,
    student_population,
    position,
    decision,
    subjects,
    grading_summary,
    behaviours,
    skills,
    teachers_remark,
    supervisors_remark,
    arm,
    level,
    section,
    term,
    session,
    school,
  } = result;

  // ── Derived values ─────────────────────────────────────────────────────────

  const issueDate = formatIssueDate(result.term.results_published_at);

  const studentName = composeStudentName(
    student_first_name,
    student_middle_name,
    student_last_name,
  );
  const schoolAddress = composeSchoolAddress(school);
  const classLabel = `${section.abbr} ${level.abbr} ${arm.name}`.trim();
  const sexLabel =
    student_gender === "M"
      ? "Male"
      : student_gender === "F"
        ? "Female"
        : student_gender || "—";

  // Cognitive units — sorted by display_order so the header columns match
  // the positional order of each subject's `scores` array.
  const units = arm.cognitive_assessment_format
    ? [...arm.cognitive_assessment_format.units].sort(
        (a, b) => a.display_order - b.display_order,
      )
    : [];

  // Subjects sorted by their SubjectArm display_order (backend already
  // preserves insertion order, but this defensive re-sort keeps consumers
  // that reshape the map safe).
  const subjectRows = Object.values(subjects).sort(
    (a, b) => a.display_order - b.display_order,
  );

  const behaviourRows = Object.values(behaviours).sort(
    (a, b) => a.display_order - b.display_order,
  );
  const skillRows = Object.values(skills).sort(
    (a, b) => a.display_order - b.display_order,
  );

  // Per-unit column totals for the totals row (indigo band under the table).
  // Sums each unit position across every subject row. -1 (absent) and null
  // are excluded — consistent with _sum_positive in the backend.
  const unitTotals = units.map((_unit, index) =>
    subjectRows.reduce((sum, subject) => {
      const value = subject.scores[index];
      return value != null && value >= 0 ? sum + value : sum;
    }, 0),
  );

  // Column count for the cognitive-scores section of the table. We need at
  // least 1 column so the header's colspan matches the body — when an arm
  // has no assessment format configured (defensive edge case; the workflow
  // gate normally prevents this from ever reaching a published result), we
  // still render a single blank column instead of a lopsided table.
  const unitColumnCount = Math.max(units.length, 1);

  // Grade summary entries — insertion-ordered per the backend contract.
  const gradeSummaryEntries = Object.entries(grading_summary);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PRINT_STYLES }} />

      <div
        ref={printRef}
        className="result-page mx-auto my-6 w-[210mm] min-h-[297mm] bg-white px-[10mm] py-[8mm] font-sans text-[10px] leading-tight text-slate-900 shadow-2xl print:my-0 print:shadow-none"
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <header className="flex items-center justify-between gap-4 border-b border-slate-300 pb-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <LogoWithFallback accent="indigo" abbr={school.abbr} />
            <div className="flex min-h-[35mm] min-w-0 flex-col justify-center gap-1">
              <h1 className="text-[20px] font-bold uppercase leading-tight tracking-wide text-slate-900">
                {school.name}
              </h1>
              {schoolAddress ? (
                <p className="text-[11px] text-slate-600">{schoolAddress}</p>
              ) : null}
              <p className="text-[13px] font-bold uppercase tracking-wider text-slate-900">
                Terminal Report &bull; {section.name}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center">
            <PhotoPlaceholder />
          </div>
        </header>

        {/* ── Student information ────────────────────────────────────────── */}
        <section className="mt-3">
          <p className="mb-1 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-700">
            Student Information
          </p>

          <div className="grid grid-cols-5 gap-0 overflow-hidden rounded-md border border-slate-300">
            <IdentityCell
              className="col-span-2 border-b border-r border-slate-200"
              label="Student Name"
              value={studentName}
            />
            <IdentityCell
              className="border-b border-r border-slate-200"
              label="Student ID"
              value={student_public_id ?? "—"}
            />
            <IdentityCell
              className="border-b border-r border-slate-200"
              label="Class"
              value={classLabel}
            />
            <IdentityCell
              className="border-b border-slate-200"
              label="Sex"
              value={sexLabel}
            />
            <IdentityCell
              className="border-r border-slate-200"
              label="Term"
              value={term.name}
            />
            <IdentityCell
              className="border-r border-slate-200"
              label="Session"
              value={session.name}
            />
            <IdentityCell
              className="border-r border-slate-200"
              label="No. in Class"
              value={String(student_population)}
            />
            <IdentityCell
              className="border-r border-slate-200"
              label="Position"
              value={String(position)}
            />
            <IdentityCell label="Date Issued" value={issueDate} />
          </div>

          <div className="mt-1 grid grid-cols-4 gap-0 overflow-hidden rounded-md border border-indigo-200">
            <SummaryCell
              accent="indigo"
              className="border-r border-indigo-200"
              label="Student's Average"
              value={`${average.toFixed(2)} %`}
            />
            <SummaryCell
              accent="indigo"
              className="border-r border-indigo-200"
              label="Class Average"
              value={`${class_average.toFixed(2)} %`}
            />
            <SummaryCell
              accent="indigo"
              className="border-r border-indigo-200"
              label="Total Score"
              value={String(total_score)}
            />
            <SummaryCell
              accent="indigo"
              label="Decision"
              value={decision.toUpperCase()}
              valueClassName={
                decision === "Pass"
                  ? "text-emerald-700"
                  : decision === "Fail"
                    ? "text-rose-700"
                    : "text-indigo-900"
              }
            />
          </div>
        </section>

        {/* ── Cognitive table ────────────────────────────────────────────── */}
        <section className="mt-3">
          <p className="mb-1 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-700">
            Cognitive &middot; Academic Progress
          </p>

          <table className="w-full table-fixed border-collapse text-[9.5px]">
            <thead>
              <tr className="bg-indigo-900 text-white">
                <th
                  className="w-[6mm] whitespace-nowrap border border-indigo-500 px-1 py-1 text-left"
                  rowSpan={2}
                >
                  #
                </th>
                <th
                  className="w-[38mm] whitespace-nowrap border border-indigo-500 px-1.5 py-1 text-left"
                  rowSpan={2}
                >
                  Subject
                </th>
                <th
                  className="whitespace-nowrap border border-indigo-500 px-1 py-1"
                  colSpan={unitColumnCount}
                >
                  Cognitive Scores
                </th>
                {/* Total column carries a header of its own — subject totals
                    live under this column in the body, and the grand total
                    lives under it in the tfoot. Without this <th> the header
                    row is one column narrower than the body and footer. */}
                <th
                  className="w-[10mm] whitespace-nowrap border border-indigo-500 px-1 py-1"
                  rowSpan={2}
                >
                  Total
                </th>
                <th
                  className="w-[9mm] whitespace-nowrap border border-indigo-500 px-1 py-1"
                  rowSpan={2}
                >
                  Grade
                </th>
                <th
                  className="w-[20mm] whitespace-nowrap border border-indigo-500 px-1.5 py-1 text-left"
                  rowSpan={2}
                >
                  Remark
                </th>
                <th
                  className="w-[22mm] whitespace-nowrap border border-indigo-500 px-2 py-1"
                  rowSpan={2}
                >
                  Teacher ID
                </th>
              </tr>
              <tr className="bg-indigo-900 text-white">
                {units.length > 0 ? (
                  units.map((unit) => (
                    <th
                      key={unit.id}
                      className="whitespace-nowrap border border-indigo-500 px-1 py-1 text-[8px] font-normal"
                    >
                      {unit.name}{" "}
                      <span className="opacity-70">({unit.max_score})</span>
                    </th>
                  ))
                ) : (
                  <th className="whitespace-nowrap border border-indigo-500 px-1 py-1 text-[8px] font-normal">
                    Score
                  </th>
                )}
              </tr>
            </thead>

            <tbody>
              {subjectRows.map((subject, index) => {
                const isFail = subject.grade_symbol
                  ? subject.grade_symbol.toUpperCase().startsWith("F")
                  : false;
                return (
                  <tr
                    key={subject.subject_id}
                    className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}
                  >
                    <td className="border border-slate-300 px-1 py-0.5 text-center text-slate-500">
                      {index + 1}
                    </td>
                    <td className="border border-slate-300 px-1.5 py-0.5">
                      {subject.subject_name ?? "—"}
                    </td>
                    {units.length > 0 ? (
                      units.map((_unit, unitIdx) => (
                        <td
                          key={unitIdx}
                          className="border border-slate-300 px-1 py-0.5 text-center"
                        >
                          {formatScore(subject.scores[unitIdx])}
                        </td>
                      ))
                    ) : (
                      // Defensive: an arm with no cognitive units still gets a
                      // rendered cell so this row's column count matches the
                      // header's colspan.
                      <td className="border border-slate-300 px-1 py-0.5 text-center text-slate-400">
                        —
                      </td>
                    )}
                    <td
                      className={`border border-slate-300 px-1 py-0.5 text-center font-semibold ${
                        isFail ? "text-rose-700" : ""
                      }`}
                    >
                      {subject.total}
                    </td>
                    <td
                      className={`border border-slate-300 px-1 py-0.5 text-center font-semibold ${
                        isFail ? "text-rose-700" : ""
                      }`}
                    >
                      {subject.grade_symbol ?? "—"}
                    </td>
                    <td
                      className={`border border-slate-300 px-1.5 py-0.5 ${
                        isFail
                          ? "font-semibold text-rose-700"
                          : "text-slate-700"
                      }`}
                    >
                      {subject.remark ?? "—"}
                    </td>
                    <td className="border border-slate-300 px-2 py-0.5 text-center text-slate-600">
                      {/* First assigned teacher's public_id, or an em-dash
                          if no teacher is assigned in the SubjectArm →
                          teachers M2M. The merge step on the frontend
                          populates `subject.teachers` from the context
                          endpoint's payload. */}
                      {subject.teachers?.[0]?.public_id ?? "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>

            <tfoot>
              {/* Totals row: per the spec, only the aggregate Total column
                  carries a value; everything else is blank. */}
              <tr className="bg-indigo-900 text-white">
                <td className="border border-indigo-900 px-1 py-1" />
                <td className="border border-indigo-900 px-1.5 py-1 text-[8.5px] uppercase tracking-widest">
                  Total
                </td>
                {units.length > 0 ? (
                  units.map((_unit, unitIdx) => (
                    <td
                      key={unitIdx}
                      className="border border-indigo-900 px-1 py-1 text-center font-bold"
                    >
                      {unitTotals[unitIdx]}
                    </td>
                  ))
                ) : (
                  <td className="border border-indigo-900 px-1 py-1" />
                )}
                <td className="border border-indigo-900 px-1 py-1 text-center font-bold">
                  {total_score}
                </td>
                <td className="border border-indigo-900 px-1 py-1" />
                <td className="border border-indigo-900 px-1.5 py-1" />
                <td className="border border-indigo-900 px-1 py-1" />
              </tr>

              {/* Grade summary row — indigo template places it inside the
                  cognitive tfoot so it visually belongs to the table. */}
              <tr className="bg-slate-50">
                <td
                  // Full-width caption row: 2 fixed cells on the left (# + Subject),
                  // `unitColumnCount` cognitive-score cells in the middle, and
                  // 4 fixed cells on the right (Total + Grade + Remark + Teacher ID).
                  colSpan={2 + unitColumnCount + 4}
                  className="border border-slate-300 px-2 py-1"
                >
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[9.5px]">
                    <span className="text-[7.5px] font-semibold uppercase tracking-widest text-slate-500">
                      Grade Summary
                    </span>
                    {gradeSummaryEntries
                      .filter(([, count]) => count > 0)
                      .map(([prefix, count]) => {
                        const isFail = prefix.toUpperCase().startsWith("F");
                        return (
                          <span
                            key={prefix}
                            className={`font-bold ${
                              isFail ? "text-rose-700" : "text-slate-900"
                            }`}
                          >
                            {prefix}&times;{count}
                          </span>
                        );
                      })}
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </section>

        {/* ── Behaviour ──────────────────────────────────────────────────── */}
        <TraitGrid
          accent="indigo"
          title="Behaviour · Affective Domain"
          rows={behaviourRows}
          columns={4}
        />

        {/* ── Skills ─────────────────────────────────────────────────────── */}
        <TraitGrid
          accent="indigo"
          title="Skills · Psychomotor Domain"
          rows={skillRows}
          columns={4}
        />

        {/* ── Remarks ────────────────────────────────────────────────────── */}
        <section className="mt-3 grid grid-cols-2 gap-3">
          <RemarkCard title="Class Teacher's Remark" body={teachers_remark} />
          <RemarkCard title="Principal's Comment" body={supervisors_remark} />
        </section>

        {/* ── Grading legends ────────────────────────────────────────────── */}
        <section className="mt-3">
          <p className="mb-1 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-700">
            Grading &amp; Rating Legend
          </p>
          <div className="grid grid-cols-3 gap-2">
            <LegendCard
              title="Cognitive"
              grades={arm.cog_grading_format?.grades ?? []}
            />
            <LegendCard
              title="Behaviour"
              grades={arm.aff_grading_format?.grades ?? []}
            />
            <LegendCard
              title="Skills"
              grades={arm.psy_grading_format?.grades ?? []}
            />
          </div>
        </section>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <footer className="mt-4 flex items-center justify-between border-t border-slate-300 pt-2 text-[7px] uppercase tracking-widest text-slate-500">
          <span className="normal-case tracking-normal">
            https://www.lutheranhighschool.ng/results/check
          </span>
          <span>Issued {issueDate}</span>
        </footer>
      </div>
    </>
  );
}

export default JuniorDefaultA4V1;
