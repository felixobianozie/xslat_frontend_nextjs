"use client";

// ─────────────────────────────────────────────────────────────────────────────
// FallbackTerminalReport.tsx
//
// Rendered when the arm's result_template.template_key is missing from the
// registry — typically because the backend was configured with a template
// key the current frontend build doesn't know about yet, or because the
// arm has no template assigned. This guarantees the page never breaks on a
// deploy skew: the student still sees a usable, printable result sheet.
//
// The layout is intentionally plainer than the branded templates —
// utilitarian, single-column, and derived entirely from the shared
// StudentResultResponse shape. No accent colour, no branding, just the data.
// ─────────────────────────────────────────────────────────────────────────────

import type { ResultTemplateProps } from "./types";

// Sort a keyed dict by its rows' display_order — the backend already inserts
// rows in this order, but re-sorting explicitly makes the intent obvious
// and defends against any consumer that reshapes the map.
function orderedValues<T extends { display_order: number }>(
  map: Record<string, T>,
): T[] {
  return Object.values(map).sort((a, b) => a.display_order - b.display_order);
}

// Compose the student's full name, skipping middle name when absent so we
// don't render "First  Last" with a double space.
function composeStudentName(
  first: string,
  middle: string | null,
  last: string,
): string {
  return [first, middle, last].filter(Boolean).join(" ");
}

// See the note on the junior template's signature — `printRef` is a
// regular prop, attached to the outer .result-page div below.
function FallbackTerminalReport({ result, printRef }: ResultTemplateProps) {
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
  const classLabel = `${section.abbr} ${level.abbr} ${arm.name}`.trim();

  // Cognitive units — used to render dynamic column headers. May be empty
  // if the arm has no cognitive_assessment_format configured, in which
  // case we only show subject / total / grade.
  const units = arm.cognitive_assessment_format
    ? [...arm.cognitive_assessment_format.units].sort(
        (a, b) => a.display_order - b.display_order,
      )
    : [];

  const subjectRows = orderedValues(subjects);
  const behaviourRows = orderedValues(behaviours);
  const skillRows = orderedValues(skills);

  return (
    <div
      ref={printRef}
      className="result-page mx-auto w-full max-w-[210mm] bg-white px-6 py-6 text-[11px] text-slate-900 sm:px-8"
    >
      {/* Header — plain, no branding */}
      <header className="border-b border-slate-300 pb-3">
        <h1 className="text-lg font-semibold uppercase tracking-wide">
          {school.name}
        </h1>
        <p className="mt-1 text-[10px] text-slate-600">
          Terminal Report · {term.name} · {session.name}
        </p>
      </header>

      {/* Student identity block */}
      <section className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
        <div>
          <p className="text-[8px] uppercase tracking-widest text-slate-500">
            Student
          </p>
          <p className="font-medium">{studentName}</p>
        </div>
        <div>
          <p className="text-[8px] uppercase tracking-widest text-slate-500">
            Student ID
          </p>
          <p className="font-medium">{student_public_id ?? "—"}</p>
        </div>
        <div>
          <p className="text-[8px] uppercase tracking-widest text-slate-500">
            Class
          </p>
          <p className="font-medium">{classLabel}</p>
        </div>
        <div>
          <p className="text-[8px] uppercase tracking-widest text-slate-500">
            Sex
          </p>
          <p className="font-medium">{student_gender || "—"}</p>
        </div>
      </section>

      {/* Aggregate strip */}
      <section className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-sm border border-slate-300 p-2">
          <p className="text-[8px] uppercase tracking-widest text-slate-500">
            Average
          </p>
          <p className="font-semibold">{average.toFixed(2)}%</p>
        </div>
        <div className="rounded-sm border border-slate-300 p-2">
          <p className="text-[8px] uppercase tracking-widest text-slate-500">
            Class average
          </p>
          <p className="font-semibold">{class_average.toFixed(2)}%</p>
        </div>
        <div className="rounded-sm border border-slate-300 p-2">
          <p className="text-[8px] uppercase tracking-widest text-slate-500">
            Position
          </p>
          <p className="font-semibold">
            {position} of {student_population}
          </p>
        </div>
        <div className="rounded-sm border border-slate-300 p-2">
          <p className="text-[8px] uppercase tracking-widest text-slate-500">
            Decision
          </p>
          <p
            className={`font-semibold ${
              decision === "Pass"
                ? "text-emerald-700"
                : decision === "Fail"
                  ? "text-rose-700"
                  : "text-slate-700"
            }`}
          >
            {decision.toUpperCase()}
          </p>
        </div>
      </section>

      {/* Cognitive table */}
      <section className="mt-4">
        <p className="text-[9px] font-semibold uppercase tracking-widest text-slate-600">
          Academic performance
        </p>
        <table className="mt-1 w-full border-collapse text-[10px]">
          <thead>
            <tr className="bg-slate-100">
              <th className="border border-slate-300 px-1.5 py-1 text-left">
                #
              </th>
              <th className="border border-slate-300 px-1.5 py-1 text-left">
                Subject
              </th>
              {units.map((unit) => (
                <th
                  key={unit.id}
                  className="border border-slate-300 px-1.5 py-1 text-center font-normal"
                >
                  <span className="block font-semibold">{unit.abbr}</span>
                  <span className="text-[8px] text-slate-500">
                    ({unit.max_score})
                  </span>
                </th>
              ))}
              <th className="border border-slate-300 px-1.5 py-1 text-center">
                Total
              </th>
              <th className="border border-slate-300 px-1.5 py-1 text-center">
                Grade
              </th>
              <th className="border border-slate-300 px-1.5 py-1 text-left">
                Remark
              </th>
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
                  <td className="border border-slate-300 px-1.5 py-0.5 text-center text-slate-500">
                    {index + 1}
                  </td>
                  <td className="border border-slate-300 px-1.5 py-0.5">
                    {subject.subject_name ?? "—"}
                  </td>
                  {units.map((_unit, unitIdx) => (
                    <td
                      key={unitIdx}
                      className="border border-slate-300 px-1.5 py-0.5 text-center"
                    >
                      {formatScore(subject.scores[unitIdx])}
                    </td>
                  ))}
                  <td className="border border-slate-300 px-1.5 py-0.5 text-center font-semibold">
                    {subject.total}
                  </td>
                  <td
                    className={`border border-slate-300 px-1.5 py-0.5 text-center font-semibold ${
                      isFail ? "text-rose-700" : ""
                    }`}
                  >
                    {subject.grade_symbol ?? "—"}
                  </td>
                  <td
                    className={`border border-slate-300 px-1.5 py-0.5 ${
                      isFail ? "font-semibold text-rose-700" : ""
                    }`}
                  >
                    {subject.remark ?? "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-slate-100 font-semibold">
              <td className="border border-slate-300 px-1.5 py-1" />
              <td className="border border-slate-300 px-1.5 py-1 uppercase tracking-wider">
                Total
              </td>
              {units.map((_unit, unitIdx) => (
                <td
                  key={unitIdx}
                  className="border border-slate-300 px-1.5 py-1"
                />
              ))}
              <td className="border border-slate-300 px-1.5 py-1 text-center">
                {total_score}
              </td>
              <td className="border border-slate-300 px-1.5 py-1" />
              <td className="border border-slate-300 px-1.5 py-1" />
            </tr>
          </tfoot>
        </table>
      </section>

      {/* Behaviour + skills */}
      <TraitBlock title="Behaviour" rows={behaviourRows} />
      <TraitBlock title="Skills" rows={skillRows} />

      {/* Remarks */}
      <section className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <RemarkBlock title="Class Teacher's remark" body={teachers_remark} />
        <RemarkBlock title="Principal's comment" body={supervisors_remark} />
      </section>

      <footer className="mt-4 border-t border-slate-300 pt-2 text-[8px] uppercase tracking-widest text-slate-500">
        Fallback view · template key not recognised by this build
      </footer>
    </div>
  );
}

export default FallbackTerminalReport;

// ── Local presentational helpers ─────────────────────────────────────────────

// Format a single cell in the score matrix:
//   - null   → "—" (no record for this unit — cell still has a value)
//   - -1     → "AB" (explicit absent marker from the backend)
//   - number → the value as-is
function formatScore(score: number | null): string {
  if (score === null || score === undefined) return "—";
  if (score === -1) return "AB";
  return String(score);
}

function TraitBlock({
  title,
  rows,
}: {
  title: string;
  rows: { trait_id: string; trait_name: string; grade_symbol: string | null }[];
}) {
  if (rows.length === 0) return null;
  return (
    <section className="mt-4">
      <p className="text-[9px] font-semibold uppercase tracking-widest text-slate-600">
        {title}
      </p>
      <div className="mt-1 grid grid-cols-2 gap-1 sm:grid-cols-4">
        {rows.map((row) => (
          <div
            key={row.trait_id}
            className="flex items-center justify-between rounded-sm border border-slate-300 px-2 py-1"
          >
            <span>{row.trait_name}</span>
            <span className="font-semibold">{row.grade_symbol || "—"}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function RemarkBlock({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-sm border border-slate-300 bg-slate-50 p-3">
      <p className="text-[8px] font-semibold uppercase tracking-widest text-slate-600">
        {title}
      </p>
      <p className="mt-1 italic text-slate-800">
        {body || <span className="not-italic text-slate-400">No remark.</span>}
      </p>
    </div>
  );
}
