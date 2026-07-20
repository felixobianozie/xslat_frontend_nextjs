"use client";

// ─────────────────────────────────────────────────────────────────────────────
// ResultsAcademicsView.tsx
//
// Detail-pane content for the ACADEMICS filter. Shows one student's per-subject
// cognitive results — scores per assessment unit (CA1 / CA2 / EXAM / …),
// the per-subject total, the grade symbol, and the grade remark.
//
// Read-only view. Score entry lives in RecordAssessmentPanel (Subjects tab).
//
// Visual choices follow the report-feel direction: flat palette, no
// rainbow-coded grade rings, just neutral row stripes with a violet TOTAL
// column for emphasis. The grade chip uses a single muted badge style.
//
// Backend integration notes:
//   - Unit caps come from `unit.max_score` on the arm's cognitive format.
//   - Subject display name/abbr are read directly off each `SubjectAssessmentResult`
//     (`subject_name`, `subject_abbr` — supplied by arm/assessment/compute/).
//     No separate subjects fetch is needed here.
//   - `scores` positions follow the units sorted by `display_order` ascending —
//     i.e. the array index corresponds to the loop index over the sorted units,
//     NOT to the `display_order` value. See the `results.d.ts` interface for
//     the full contract.
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo } from "react";
import EmptyState from "../../components/Emptystate";

interface ResultsAcademicsViewProps {
  student: ArmStudent;
  studentResult: StudentAssessmentResult | undefined;
  // The arm's cognitive assessment format — supplies unit columns + per-unit caps.
  units: ArmCogAssessmentUnit[] | undefined;
}

export default function ResultsAcademicsView({
  student,
  studentResult,
  units,
}: ResultsAcademicsViewProps) {
  // Sort units by display_order so column order is stable across renders.
  // The `scores` array on each subject row is already positioned to line up
  // with this exact ordering — index i in `scores` corresponds to `orderedUnits[i]`.
  const orderedUnits = useMemo(() => {
    if (!units) return [];
    return [...units].sort((a, b) => a.display_order - b.display_order);
  }, [units]);

  // Rows the student actually has records for. `Object.values` walks the
  // subjects in the display_order the backend already applied, so no extra
  // sort is needed here.
  const rows = useMemo(() => {
    if (!studentResult) return [];
    return Object.values(studentResult.subjects);
  }, [studentResult]);

  // Total possible score per subject — used in the TOTAL column header.
  const subjectMaxScore = useMemo(
    () => orderedUnits.reduce((sum, u) => sum + u.max_score, 0),
    [orderedUnits],
  );

  // ── Empty / loading states ────────────────────────────────────────────────

  if (!units || orderedUnits.length === 0) {
    return (
      <EmptyState
        variant="generic"
        title="Cognitive format not configured"
        description="Set up the cognitive assessment format for this arm before viewing academic results."
      />
    );
  }

  if (!studentResult || rows.length === 0) {
    return (
      <EmptyState
        variant="generic"
        title="No academic records yet"
        description={`No cognitive scores have been recorded for ${student.first_name}.`}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* ── Section title ────────────────────────────────────────────── */}
      <div>
        <h3 className="text-sm font-semibold text-slate-800">
          Academic Results
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Cognitive scores per subject for the current term.
        </p>
      </div>

      {/* ── Desktop table ────────────────────────────────────────────── */}
      <div className="hidden md:block border border-slate-200 rounded-2xl overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-100 text-left text-slate-500 border-b border-slate-200">
              <th className="px-4 py-3 font-semibold">Subject</th>
              {orderedUnits.map((unit) => (
                <th
                  key={unit.id}
                  className="px-3 py-3 font-semibold text-center"
                >
                  <div className="flex flex-col items-center">
                    <span>{unit.abbr}</span>
                    <span className="text-[9px] font-normal text-slate-400">
                      /{unit.max_score}
                    </span>
                  </div>
                </th>
              ))}
              <th className="px-3 py-3 font-semibold text-center bg-violet-50 text-violet-700">
                <div className="flex flex-col items-center">
                  <span>TOTAL</span>
                  <span className="text-[9px] font-normal text-violet-400">
                    /{subjectMaxScore}
                  </span>
                </div>
              </th>
              <th className="px-3 py-3 font-semibold text-center">Grade</th>
              <th className="px-3 py-3 font-semibold">Remark</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-50">
            {rows.map((subjectResult, index) => (
              <tr
                key={subjectResult.subject_id}
                className={index % 2 === 0 ? "bg-white" : "bg-slate-50/40"}
              >
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <span className="text-slate-800 font-medium">
                      {subjectResult.subject_name ?? "Unknown subject"}
                    </span>
                    {subjectResult.subject_abbr && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        {subjectResult.subject_abbr}
                      </span>
                    )}
                  </div>
                </td>
                {orderedUnits.map((unit, unitIndex) => {
                  // The backend positions each subject's `scores` array
                  // against `units-sorted-by-display_order-ascending`, so
                  // the array index matches this loop's index — NOT
                  // `unit.display_order`.
                  const raw = subjectResult.scores[unitIndex];
                  return (
                    <td
                      key={unit.id}
                      className="px-3 py-3 text-center text-slate-700 tabular-nums"
                    >
                      {raw === -1 ? (
                        <span className="text-slate-400 text-[10px]">ABS</span>
                      ) : (
                        (raw ?? "—")
                      )}
                    </td>
                  );
                })}
                <td className="px-3 py-3 text-center font-semibold text-violet-700 bg-violet-50/40 tabular-nums">
                  {subjectResult.total}
                </td>
                <td className="px-3 py-3 text-center">
                  {subjectResult.grade_symbol ? (
                    <span className="inline-block px-2 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 rounded-md">
                      {subjectResult.grade_symbol}
                    </span>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </td>
                <td className="px-3 py-3 text-slate-600">
                  {subjectResult.remark ?? (
                    <span className="text-slate-300">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Mobile card list ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-2 md:hidden">
        {rows.map((subjectResult) => (
          <div
            key={subjectResult.subject_id}
            className="border border-slate-200 rounded-2xl bg-white overflow-hidden"
          >
            <div className="flex items-center justify-between bg-slate-50 px-4 py-2.5 border-b border-slate-100">
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-slate-800 truncate">
                  {subjectResult.subject_name ?? "Unknown subject"}
                </span>
                {subjectResult.subject_abbr && (
                  <span className="text-[10px] text-slate-400 font-mono">
                    {subjectResult.subject_abbr}
                  </span>
                )}
              </div>
              {subjectResult.grade_symbol && (
                <span className="inline-block px-2 py-0.5 text-[10px] font-semibold bg-white text-slate-700 border border-slate-200 rounded-md">
                  {subjectResult.grade_symbol}
                </span>
              )}
            </div>
            <div className="p-3 grid grid-cols-2 gap-y-2 gap-x-3 text-xs">
              {orderedUnits.map((unit, unitIndex) => {
                // Same sorted-position indexing rule as the desktop table
                // above — array index tracks the loop over ordered units.
                const raw = subjectResult.scores[unitIndex];
                return (
                  <div
                    key={unit.id}
                    className="flex items-center justify-between border-b border-slate-50 pb-1.5"
                  >
                    <span className="text-slate-500">
                      {unit.abbr}
                      <span className="text-[9px] text-slate-400 ml-1">
                        /{unit.max_score}
                      </span>
                    </span>
                    <span className="text-slate-800 tabular-nums">
                      {raw === -1 ? (
                        <span className="text-slate-400 text-[10px]">ABS</span>
                      ) : (
                        (raw ?? "—")
                      )}
                    </span>
                  </div>
                );
              })}
              <div className="col-span-2 flex items-center justify-between pt-1 text-violet-700 font-semibold">
                <span>
                  TOTAL
                  <span className="text-[9px] text-violet-400 ml-1">
                    /{subjectMaxScore}
                  </span>
                </span>
                <span className="tabular-nums">{subjectResult.total}</span>
              </div>
              {subjectResult.remark && (
                <div className="col-span-2 text-[11px] text-slate-500 italic">
                  {subjectResult.remark}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
