"use client";

// ─────────────────────────────────────────────────────────────────────────────
// TerminalReportSeniorSecondary.tsx
//
// Converted from terminal-report-template-2_senior-secondary.html. Same
// underlying data contract as the Junior Secondary template, but with the
// visual differences called out in the mockup:
//   - Violet accent scheme in place of indigo. Chosen deliberately so it
//     prints as a distinct grey shade in black-and-white and doesn't clash
//     with rose (fails) or emerald (PASS decision) colours.
//   - "Position" field removed from the identity grid (senior secondary
//     reports do not publish class positions individually).
//   - Date Issued widened to col-span-2 to close the resulting gap.
//   - Grade Summary lifted OUT of the cognitive table footer and placed as
//     its own full-width band directly under the summary strip.
//
// These are the ONLY structural differences. Everything else — cognitive
// table, behaviour tiles, skills tiles, remark cards, legend row — is
// visually and logically identical to the junior template. Both remain
// separate files so each can evolve independently with school-branding
// changes without risking regressions to the other.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import Image from "next/image";

import type { ResultTemplateProps } from "./types";
import type { ResultGrade } from "./results";

// A4 print-size and print-media reset — the two things Tailwind can't
// reasonably express. Same content as the junior template; scoped here so
// this file remains self-contained.
const PRINT_STYLES = `
  @page { size: A4 portrait; margin: 0; }
  @media print {
    html, body { background: white; }
    .result-page { box-shadow: none !important; margin: 0 !important; }
  }
`;

// ── Small helpers duplicated so each template file is self-contained ────────

function composeStudentName(
  first: string,
  middle: string | null,
  last: string,
): string {
  return [first, middle, last].filter(Boolean).join(" ");
}

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

function formatScore(score: number | null): string {
  if (score === null || score === undefined) return "";
  if (score === -1) return "AB";
  return String(score);
}

function formatToday(): string {
  return new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ── Main component ───────────────────────────────────────────────────────────

// See the note on the junior template's signature — `printRef` is a
// regular prop, not a forwardRef ref, so the parent can attach it via
// `<Template printRef={ref} />`.
function TerminalReportSeniorSecondary({
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

  const units = arm.cognitive_assessment_format
    ? [...arm.cognitive_assessment_format.units].sort(
        (a, b) => a.display_order - b.display_order,
      )
    : [];

  const subjectRows = Object.values(subjects).sort(
    (a, b) => a.display_order - b.display_order,
  );
  const behaviourRows = Object.values(behaviours).sort(
    (a, b) => a.display_order - b.display_order,
  );
  const skillRows = Object.values(skills).sort(
    (a, b) => a.display_order - b.display_order,
  );

  const unitTotals = units.map((_unit, index) =>
    subjectRows.reduce((sum, subject) => {
      const value = subject.scores[index];
      return value != null && value >= 0 ? sum + value : sum;
    }, 0),
  );

  const unitColumnCount = Math.max(units.length, 1);
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

        {/* ── Student information (no Position field for senior secondary) ── */}
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
            {/* Date Issued spans 2 cols because Position is dropped for SS. */}
            <IdentityCell
              className="col-span-2"
              label="Date Issued"
              value={formatToday()}
            />
          </div>

          <div className="mt-1 grid grid-cols-4 gap-0 overflow-hidden rounded-md border border-violet-200">
            <SummaryCell
              className="border-r border-violet-200"
              label="Student's Average"
              value={`${average.toFixed(2)} %`}
            />
            <SummaryCell
              className="border-r border-violet-200"
              label="Class Average"
              value={`${class_average.toFixed(2)} %`}
            />
            <SummaryCell
              className="border-r border-violet-200"
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
                    : "text-violet-900"
              }
            />
          </div>
        </section>

        {/* ── Grade summary (own band, above the cognitive table) ────────── */}
        <section className="mt-1">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-md border border-violet-200 bg-violet-50 px-3 py-1">
            <span className="text-[7.5px] font-semibold uppercase tracking-widest text-violet-900/70">
              Grade Summary
            </span>
            {gradeSummaryEntries.map(([prefix, count]) => {
              const isFail = prefix.toUpperCase().startsWith("F");
              return (
                <span
                  key={prefix}
                  className={`text-[10px] font-bold ${
                    isFail ? "text-rose-700" : "text-slate-900"
                  }`}
                >
                  {prefix}&times;{count}
                </span>
              );
            })}
          </div>
        </section>

        {/* ── Cognitive table (violet accent, no summary-in-footer row) ──── */}
        <section className="mt-3">
          <p className="mb-1 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-700">
            Cognitive · Academic Progress
          </p>

          <table className="w-full table-fixed border-collapse text-[9.5px]">
            <thead>
              <tr className="bg-violet-900 text-white">
                <th
                  className="w-[6mm] whitespace-nowrap border border-violet-500 px-1 py-1 text-left"
                  rowSpan={2}
                >
                  #
                </th>
                <th
                  className="w-[38mm] whitespace-nowrap border border-violet-500 px-1.5 py-1 text-left"
                  rowSpan={2}
                >
                  Subject
                </th>
                <th
                  className="whitespace-nowrap border border-violet-500 px-1 py-1"
                  colSpan={unitColumnCount}
                >
                  Cognitive Scores
                </th>
                {/* Total column carries a header of its own — subject totals
                    live under this column in the body, and the grand total
                    lives under it in the tfoot. Without this <th> the header
                    row is one column narrower than the body and footer. */}
                <th
                  className="w-[10mm] whitespace-nowrap border border-violet-500 px-1 py-1"
                  rowSpan={2}
                >
                  Total
                </th>
                <th
                  className="w-[9mm] whitespace-nowrap border border-violet-500 px-1 py-1"
                  rowSpan={2}
                >
                  Grade
                </th>
                <th
                  className="w-[20mm] whitespace-nowrap border border-violet-500 px-1.5 py-1 text-left"
                  rowSpan={2}
                >
                  Remark
                </th>
                <th
                  className="w-[15mm] whitespace-nowrap border border-violet-500 px-1 py-1"
                  rowSpan={2}
                >
                  Teacher ID
                </th>
              </tr>
              <tr className="bg-violet-900 text-white">
                {units.length > 0 ? (
                  units.map((unit) => (
                    <th
                      key={unit.id}
                      className="whitespace-nowrap border border-violet-500 px-1 py-1 text-[8px] font-normal"
                    >
                      {unit.name}{" "}
                      <span className="opacity-70">({unit.max_score})</span>
                    </th>
                  ))
                ) : (
                  <th className="whitespace-nowrap border border-violet-500 px-1 py-1 text-[8px] font-normal">
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
                      {/* Teacher ID column intentionally blank — same as the junior template. */}
                    </td>
                  </tr>
                );
              })}
            </tbody>

            <tfoot>
              {/* Totals row — only the aggregate Total column carries a value.
                  No grade summary row here; that band lives above the table
                  for the senior secondary layout. */}
              <tr className="bg-violet-900 text-white">
                <td className="border border-violet-900 px-1 py-1" />
                <td className="border border-violet-900 px-1.5 py-1 text-[8.5px] uppercase tracking-widest">
                  Total
                </td>
                {units.length > 0 ? (
                  units.map((_unit, unitIdx) => (
                    <td
                      key={unitIdx}
                      className="border border-violet-900 px-1 py-1 text-center font-bold"
                    >
                      {unitTotals[unitIdx]}
                    </td>
                  ))
                ) : (
                  <td className="border border-violet-900 px-1 py-1" />
                )}
                <td className="border border-violet-900 px-1 py-1 text-center font-bold">
                  {total_score}
                </td>
                <td className="border border-violet-900 px-1 py-1" />
                <td className="border border-violet-900 px-1.5 py-1" />
                <td className="border border-violet-900 px-1 py-1" />
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

export default TerminalReportSeniorSecondary;

// ─── Small reusable subcomponents (violet accent variants) ───────────────────

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
  valueClassName = "text-violet-900",
}: {
  label: string;
  value: string;
  className?: string;
  valueClassName?: string;
}) {
  return (
    <div className={`bg-violet-50 p-1.5 ${className}`}>
      <p className="text-[7px] uppercase tracking-widest text-violet-900/70">
        {label}
      </p>
      <p className={`mt-0.5 text-[11px] font-bold ${valueClassName}`}>
        {value}
      </p>
    </div>
  );
}

// School logo with graceful fallback (identical behaviour to the junior
// template, but with a violet border to match this template's accent).
function LogoWithFallback({ abbr }: { abbr: string }) {
  const [errored, setErrored] = useState(false);

  return (
    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-visible rounded-full">
      {errored ? (
        <span className="px-1 text-center text-[9px] font-semibold leading-tight text-violet-900">
          {abbr || "LOGO"}
        </span>
      ) : (
        <Image
          src="/images/lhs_logo.png"
          alt={`${abbr} logo`}
          // Matches the 16 x 16 (Tailwind unit = 4px) parent so Next can
          // reserve exact layout space and skip runtime measurement.
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
            <span className="rounded-sm border border-violet-200 bg-violet-50 px-1.5 py-0.5 text-[10px] font-bold leading-none text-violet-900">
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

function LegendCard({
  title,
  grades,
}: {
  title: string;
  grades: ResultGrade[];
}) {
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
