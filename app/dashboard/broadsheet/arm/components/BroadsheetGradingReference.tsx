"use client";

// ─────────────────────────────────────────────────────────────────────────────
// BroadsheetGradingReference.tsx
//
// Reference panel rendered below the main broadsheet table. Surfaces:
//   1. The pass-decision rule that applies to the arm.
//   2. The three grading formats (cognitive, affective, psychomotor).
//
// Why bundle the pass rule and grading systems together?
//   They're both "what do these numbers mean?" context. Keeping them on the
//   same screen lets the admin sanity-check a borderline result without
//   leaving the page.
//
// Pass rule formatting note:
//   `base_value` comes through as a string from the backend (DRF's
//   DecimalField serialisation). We `parseFloat` it before rendering so
//   percentages display as percentages, not as "0.5".
// ─────────────────────────────────────────────────────────────────────────────

import { useBroadsheetDetails } from "../context/BroadsheetDetailsProvider";

export default function BroadsheetGradingReference() {
  const { arm } = useBroadsheetDetails();

  // Don't render anything until the arm loads — the parent already shows
  // a skeleton in that window.
  if (!arm) return null;

  return (
    <div className="space-y-6">
      <PassRule rule={arm.pass_rule ?? null} />

      <div>
        <h3 className="text-sm font-semibold text-slate-800 mb-3">
          Grading Systems
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <GradingFormatCard
            title="Cognitive Grades"
            description="Applied to subject totals."
            accent="bg-violet-50 border-violet-100"
            format={arm.cog_grading_format ?? null}
          />
          <GradingFormatCard
            title="Affective Grades"
            description="Applied to each behaviour score."
            accent="bg-rose-50 border-rose-100"
            format={arm.aff_grading_format ?? null}
          />
          <GradingFormatCard
            title="Psychomotor Grades"
            description="Applied to each skill score."
            accent="bg-amber-50 border-amber-100"
            format={arm.psy_grading_format ?? null}
          />
        </div>
      </div>
    </div>
  );
}

// ── Pass rule ────────────────────────────────────────────────────────────
function PassRule({ rule }: { rule: ArmPassRule | null }) {
  if (!rule) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center">
        <p className="text-xs text-slate-500">
          No pass rule is configured for this arm. Pass / fail decisions fall
          back to the default threshold.
        </p>
      </div>
    );
  }

  // Compose a human-readable summary of the rule. We branch on the two
  // dimensions documented in arm.d.ts:
  //   - type: "score" | "count"  (aggregate score vs. subject pass count)
  //   - decide_by: "raw" | "percentage"
  const baseValueNumber = parseFloat(rule.base_value);

  // The natural-language summary the rule label expands to.
  function summarise(): string {
    if (rule?.type === "score") {
      if (rule?.decide_by === "percentage") {
        return `Overall total must be at least ${Math.round(baseValueNumber * 100)}% of the total obtainable.`;
      }
      return `Overall total must be at least ${baseValueNumber}.`;
    }
    // type === "count" — student passes when they've passed at least N subjects
    // (raw count) or at least Y% of subjects (percentage).
    if (rule?.decide_by === "percentage") {
      return `Student must pass at least ${Math.round(baseValueNumber * 100)}% of their subjects.`;
    }
    return `Student must pass at least ${baseValueNumber} subjects.`;
  }

  return (
    <div className="rounded-2xl border border-indigo-100 bg-white p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">
            Pass Decision Rule
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">{rule.name}</p>
        </div>
        {!rule.active && (
          <span className="inline-flex items-center px-2 py-0.5 text-[10px] rounded-full bg-slate-100 text-slate-500 border border-slate-200">
            Inactive
          </span>
        )}
      </div>

      <ul className="flex flex-col gap-2">
        <li className="text-xs text-slate-700 flex items-start gap-2">
          <span className="w-1.5 h-1.5 mt-1.5 bg-violet-500 rounded-full shrink-0" />
          <span>{summarise()}</span>
        </li>
        {rule.subjects.map((subj) => {
          const subjValue = parseFloat(subj.base_value);
          const threshold =
            rule.decide_by === "percentage"
              ? `${Math.round(subjValue * 100)}%`
              : String(subjValue);
          return (
            <li
              key={subj.id}
              className="text-xs text-slate-700 flex items-start gap-2"
            >
              <span className="w-1.5 h-1.5 mt-1.5 bg-violet-500 rounded-full shrink-0" />
              <span>
                {subj.subject_definition.name} must reach at least {threshold}
                {rule.decide_by === "percentage"
                  ? " of its total obtainable."
                  : "."}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ── Grading format card ──────────────────────────────────────────────────
function GradingFormatCard({
  title,
  description,
  accent,
  format,
}: {
  title: string;
  description: string;
  accent: string;
  format: ArmGradingFormat | null;
}) {
  return (
    <div className="rounded-2xl border border-indigo-100 bg-white overflow-hidden">
      <div className={`px-4 py-3 border-b border-indigo-100 ${accent}`}>
        <h4 className="text-xs font-semibold text-slate-800">{title}</h4>
        <p className="text-[10px] text-slate-500 mt-0.5">{description}</p>
      </div>
      <div className="p-4">
        {format ? (
          <ul className="flex flex-col gap-2">
            {format.grades.map((grade) => (
              <li key={grade.id} className="flex items-center gap-3 text-xs">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-slate-200 bg-slate-50 text-slate-700 font-semibold text-xs">
                  {grade.symbol}
                </span>
                <div className="flex flex-col min-w-0">
                  <span className="text-slate-700 font-medium">
                    {grade.remark}
                  </span>
                  <span className="text-[10px] text-slate-400 tabular-nums">
                    {grade.low}
                    {grade.low !== grade.high ? `–${grade.high}` : ""}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[11px] text-slate-400 italic">
            Not configured for this arm.
          </p>
        )}
      </div>
    </div>
  );
}
