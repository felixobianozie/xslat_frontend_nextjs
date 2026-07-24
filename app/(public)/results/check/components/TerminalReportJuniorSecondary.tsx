"use client";

// ─────────────────────────────────────────────────────────────────────────────
// TerminalReportJuniorSecondary.tsx
//
// Converted from terminal-report-template-1_junior-secondary.html. Faithful
// port of the visual design — indigo accent, A4 portrait, grade summary in
// the cognitive table footer, per-student position surfaced in the identity
// grid — with every piece of mock data replaced by live props from a
// StudentResultResponse.
//
// Data mapping (from the check-result response):
//   Header / identity ← result.school, result.arm/level/section, result.term,
//                       result.session, and the student name fields.
//   Summary strip     ← result.average, class_average, total_score, decision.
//   Cognitive table   ← result.subjects (rows), result.arm.cognitive_assessment_format.units
//                       (unit column headers), result.grading_summary (footer row).
//   Behaviour grid    ← result.behaviours.
//   Skills grid       ← result.skills.
//   Remarks           ← result.teachers_remark, result.supervisors_remark.
//   Grading legends   ← result.arm.cog_grading_format / aff_grading_format /
//                       psy_grading_format (their `.grades` arrays).
//
// Assumptions the mockup baked in that the runtime data may not satisfy:
//   - School logo image: imported from /images/school_logo; a placeholder
//     circle showing the school abbreviation renders when the image is
//     absent or fails to load (see LogoWithFallback below).
//   - Student photo: no field exists on the Student model yet, so the
//     dashed square from the mockup renders as a permanent placeholder.
//   - Teacher ID column: rendered as an empty cell for now — the data
//     isn't threaded through the check-result response yet.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import Image from "next/image";

import type { ResultTemplateProps } from "./types";
import type { ResultGrade } from "./results";

// The two non-Tailwind styles the mockup needed — the exact A4 print size
// and the print-media reset. Kept small and scoped inline so they only
// apply when this template mounts. Justified exception to the Tailwind-only
// rule: `@page` and `@media print` are not utility-expressible.
const PRINT_STYLES = `
  @page { size: A4 portrait; margin: 0; }
  @media print {
    html, body { background: white; }
    .result-page { box-shadow: none !important; margin: 0 !important; }
  }
`;

// ── Presentational helpers ───────────────────────────────────────────────────

function composeStudentName(
  first: string,
  middle: string | null,
  last: string,
): string {
  return [first, middle, last].filter(Boolean).join(" ");
}

// Format a school's full address line from its parts. Filters out empties
// so a missing LGA/state doesn't leave a dangling comma.
function composeSchoolAddress(school: {
  address: string | null;
  city: string | null;
  lga: string | null;
  state: string | null;
  country: string | null;
}): string {
  return [school.address, school.city, school.lga, school.state, school.country]
    .filter(Boolean)
    .join(", ");
}

// Render a single score cell. See FallbackTerminalReport for the same rules —
// duplicated locally so this template is self-contained.
function formatScore(score: number | null): string {
  if (score === null || score === undefined) return "";
  if (score === -1) return "AB";
  return String(score);
}

// Format today's date for the "Date Issued" field. Uses "DD MMM YYYY" — same
// treatment as the mockup ("23 Jul 2026").
function formatToday(): string {
  return new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ── Main component ───────────────────────────────────────────────────────────

// The `printRef` prop is what `ResultsPreview` uses to grab a handle on the
// rendered A4 sheet for html2canvas / PDF export. It's attached to the
// outer .result-page div below. Previously this component was wrapped in
// forwardRef, but the parent passes the ref as a regular prop (matching
// the interface in ResultTemplateProps), not as `ref={...}` — so the
// forwardRef version silently ignored the ref and the download button
// couldn't find the node to rasterise.
function TerminalReportJuniorSecondary({
  result,
  printRef,
}: ResultTemplateProps) {
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
            <LogoWithFallback abbr={school.abbr} />
            <div className="flex min-h-[45mm] min-w-0 flex-col justify-center gap-1">
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
            <IdentityCell label="Date Issued" value={formatToday()} />
          </div>

          <div className="mt-1 grid grid-cols-4 gap-0 overflow-hidden rounded-md border border-indigo-200">
            <SummaryCell
              className="border-r border-indigo-200"
              label="Student's Average"
              value={`${average.toFixed(2)} %`}
            />
            <SummaryCell
              className="border-r border-indigo-200"
              label="Class Average"
              value={`${class_average.toFixed(2)} %`}
            />
            <SummaryCell
              className="border-r border-indigo-200"
              label="Total Score"
              value={String(total_score)}
            />
            <SummaryCell
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
                  className="w-[15mm] whitespace-nowrap border border-indigo-500 px-1 py-1"
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
                    <td className="border border-slate-300 px-1 py-0.5 text-center text-slate-600">
                      {/* Teacher ID column intentionally blank — data not yet threaded through. */}
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
                    {gradeSummaryEntries.map(([prefix, count]) => {
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
          title="Behaviour · Affective Domain"
          rows={behaviourRows}
          columns={4}
        />

        {/* ── Skills ─────────────────────────────────────────────────────── */}
        <TraitGrid
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
          <span className="normal-case tracking-normal">/results</span>
          <span>Issued {formatToday()}</span>
        </footer>
      </div>
    </>
  );
}

export default TerminalReportJuniorSecondary;

// ─── Small reusable subcomponents ────────────────────────────────────────────
// Local to this file so the template stays self-contained and one file per
// template remains the unit of ownership.

function IdentityCell({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`p-1.5 ${className}`}>
      <p className="text-[7px] uppercase tracking-widest text-slate-500">
        {label}
      </p>
      <p className="mt-0.5 text-[10px] font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function SummaryCell({
  label,
  value,
  className = "",
  valueClassName = "text-indigo-900",
}: {
  label: string;
  value: string;
  className?: string;
  valueClassName?: string;
}) {
  return (
    <div className={`bg-indigo-50 p-1.5 ${className}`}>
      <p className="text-[7px] uppercase tracking-widest text-indigo-900/70">
        {label}
      </p>
      <p className={`mt-0.5 text-[11px] font-bold ${valueClassName}`}>
        {value}
      </p>
    </div>
  );
}

// Logo with graceful fallback:
//   - Tries to load /images/school_logo.png via next/image so we benefit
//     from Next.js image optimisation (format conversion, sizing hints,
//     eager loading for above-the-fold content).
//   - If the load fails (missing file, network issue, invalid image),
//     swaps to an indigo bordered circle showing the school abbreviation.
// Uses React state so re-renders don't blow away the fallback we've chosen,
// and there's no imperative DOM manipulation.
function LogoWithFallback({ abbr }: { abbr: string }) {
  const [errored, setErrored] = useState(false);

  return (
    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-visible rounded-full">
      {errored ? (
        <span className="px-1 text-center text-[9px] font-semibold leading-tight text-indigo-900">
          {abbr || "LOGO"}
        </span>
      ) : (
        <Image
          src="/images/lhs_logo.png"
          alt={`${abbr} logo`}
          // Matches the 16 x 16 (Tailwind unit = 4px) parent so Next can
          // reserve exact layout space and skip runtime measurement. If the
          // container size ever changes, update these numbers to match.
          width={64}
          height={64}
          // Header logo is above the fold on every render — eager-load so
          // it never flashes in late during printing or PDF capture.
          priority
          className="h-full w-full object-contain"
          onError={() => setErrored(true)}
        />
      )}
    </div>
  );
}

// Student photo — placeholder for now (no field on the model).
function PhotoPlaceholder() {
  return (
    <div className="flex h-[30mm] w-[30mm] items-center justify-center border border-dashed border-slate-400 bg-slate-50">
      <span className="px-1 text-center text-[8px] uppercase leading-tight tracking-widest text-slate-500">
        Student
        <br />
        Photo
      </span>
    </div>
  );
}

// Behaviour / Skills tile grid — 4 columns by default per the mockup. Rows
// come in already-sorted so we just render them.
function TraitGrid({
  title,
  rows,
  columns,
}: {
  title: string;
  rows: {
    trait_id: string;
    trait_name: string;
    grade_symbol: string | null;
    is_absent: boolean;
  }[];
  columns: number;
}) {
  if (rows.length === 0) return null;
  // Tailwind can't build `grid-cols-{n}` dynamically at build time — the
  // safelist for known small counts covers the mockup's 4-column layout.
  const gridClass =
    columns === 4
      ? "grid-cols-4"
      : columns === 3
        ? "grid-cols-3"
        : "grid-cols-2";
  return (
    <section className="mt-3">
      <div className="mb-1">
        <p className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-700">
          {title}
        </p>
      </div>
      <div className={`grid gap-0.5 ${gridClass}`}>
        {rows.map((row) => (
          <div
            key={row.trait_id}
            className="flex items-center justify-between rounded-sm border border-slate-300 bg-white px-2 py-0.5"
          >
            <span className="text-[9.5px] text-slate-800">
              {row.trait_name}
            </span>
            <span className="rounded-sm border border-indigo-200 bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold leading-none text-indigo-900">
              {row.is_absent ? "—" : (row.grade_symbol ?? "—")}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function RemarkCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-sm border border-slate-300 bg-slate-50 p-2.5">
      <p className="mb-1 flex items-center gap-2 text-[8px] font-bold uppercase tracking-[0.2em] text-slate-700">
        {title}
      </p>
      <p className="text-[10px] italic leading-snug text-slate-800">
        {body ? (
          `"${body}"`
        ) : (
          <span className="not-italic text-slate-400">No remark provided.</span>
        )}
      </p>
    </div>
  );
}

// A single grading-format card in the legend row.
function LegendCard({
  title,
  grades,
}: {
  title: string;
  grades: ResultGrade[];
}) {
  // Legends read best low-to-high (ascending). The API returns them in the
  // model's default ordering; we sort here to keep the visual consistent.
  const sortedGrades = [...grades].sort((a, b) => b.low - a.low);

  return (
    <div className="overflow-hidden rounded-sm border border-slate-300">
      <div className="border-b border-slate-300 bg-slate-100 px-2 py-1">
        <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-700">
          {title}
        </p>
      </div>
      <table className="w-full text-[8.5px]">
        <thead className="text-slate-500">
          <tr>
            <th className="px-1.5 py-0.5 text-left font-normal">Range</th>
            <th className="px-1.5 py-0.5 text-left font-normal">Remark</th>
            <th className="w-[8mm] px-1.5 py-0.5 text-right font-normal">
              Symbol
            </th>
          </tr>
        </thead>
        <tbody className="text-slate-800">
          {sortedGrades.length === 0 ? (
            <tr className="border-t border-slate-200">
              <td
                colSpan={3}
                className="px-1.5 py-1 text-center text-slate-400"
              >
                No grades configured.
              </td>
            </tr>
          ) : (
            sortedGrades.map((grade) => (
              <tr key={grade.id} className="border-t border-slate-200">
                <td className="px-1.5 py-0 text-slate-500">
                  {grade.low} – {grade.high}
                </td>
                <td
                  className={`px-1.5 py-0 ${
                    !grade.passed ? "text-rose-700" : ""
                  }`}
                >
                  {grade.remark}
                </td>
                <td
                  className={`px-1.5 py-0 text-right font-bold ${
                    !grade.passed ? "text-rose-700" : ""
                  }`}
                >
                  {grade.symbol}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
