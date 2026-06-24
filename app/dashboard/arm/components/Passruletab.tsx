"use client";

// ─────────────────────────────────────────────────────────────────────────────
// PassRuleTab.tsx
//
// Sixth tab — visualizes the pass rule configured on this arm.
//
// A pass rule answers: "what does it take for a student to pass the term?"
// It has two dimensions:
//   - type        — "score" (judged by aggregate score) or
//                   "count" (judged by how many subjects were passed)
//   - decide_by   — "raw" (an absolute value) or
//                   "percentage" (a fraction in [0, 1] of the maximum)
// Plus a `base_value` threshold and an optional list of subject-level
// prerequisites (PassRuleSubject) that each student must also satisfy.
//
// Visual hierarchy:
//   ArmInfo (page header) is the dark gradient hero on this page. To keep
//   that hierarchy intact, the summary card here is intentionally a calm,
//   light, document-style card — same content prominence achieved through
//   typography and a single indigo accent rather than a competing gradient.
//
// Data source:
//   Same pattern as GradingSystemTab — no mock helpers, no own queries.
//   The arm.pass_rule field is exposed via ArmDetailsProvider's React Query
//   cache (["arm-detail", armId]). This tab is purely a renderer.
//
// Empty / unconfigured state:
//   If arm.pass_rule is null we show a CTA mirroring the GradingSystemTab
//   "Not configured" pattern. The CTA endpoint isn't wired here because the
//   configuration page lives elsewhere; this tab is read-only by spec.
// ─────────────────────────────────────────────────────────────────────────────

import {
  AlertTriangle,
  BookOpen,
  Calculator,
  Hash,
  ListChecks,
  Percent,
  ShieldCheck,
  Target,
} from "lucide-react";
import { useArmDetails } from "../context/Armdetailsprovider";

// ── Helpers ──────────────────────────────────────────────────────────────────

// Parses the API's decimal string into a number. DRF serializes DecimalField
// as a string (e.g. "0.50"), so a parseFloat is required before any maths.
// Returns 0 on a missing or malformed value so the UI never NaNs out.
function parseDecimal(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const n = typeof value === "number" ? value : parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

// Formats a percentage fraction (0–1) as a clean human-readable string.
// 0.5   -> "50%"
// 0.75  -> "75%"
// 0.123 -> "12.3%" (keeps one decimal if it's meaningful)
function formatPercent(fraction: number): string {
  const pct = fraction * 100;
  const rounded = Math.round(pct * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded}%` : `${rounded.toFixed(1)}%`;
}

// Formats a raw count/score by stripping any trailing ".00" decimals so an
// integer count reads as "5" rather than "5.00".
function formatRaw(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  return `${rounded}`;
}

// Renders the threshold value as a short, standalone string (e.g. "50%" or
// "5 subjects" or "60 marks"). Used by the summary card and by each subject
// prerequisite chip.
function formatThreshold(
  type: ArmPassRule["type"],
  decideBy: ArmPassRule["decide_by"],
  baseValue: string | number,
): string {
  const num = parseDecimal(baseValue);
  if (decideBy === "percentage") return formatPercent(num);
  if (type === "count") {
    return `${formatRaw(num)} ${num === 1 ? "subject" : "subjects"}`;
  }
  return `${formatRaw(num)} marks`;
}

// Same as formatThreshold but tailored to a subject row. A subject prerequisite
// is always evaluated against the subject's own score, never a count — so we
// only have two cases (percentage vs raw marks).
function formatSubjectThreshold(
  decideBy: ArmPassRule["decide_by"],
  baseValue: string | number,
): string {
  const num = parseDecimal(baseValue);
  return decideBy === "percentage"
    ? formatPercent(num)
    : `${formatRaw(num)} marks`;
}

// Builds the natural-language sentence shown in the summary card. Covers all
// four permutations of (type × decide_by) so any rule the backend can express
// is described in plain English.
function buildSummarySentence(rule: ArmPassRule): string {
  const threshold = formatThreshold(rule.type, rule.decide_by, rule.base_value);

  if (rule?.type === "score") {
    if (rule.decide_by === "percentage") {
      return `To pass, a student must achieve an aggregate score of at least ${threshold}.`;
    }
    return `To pass, a student must accumulate at least ${threshold} in aggregate score.`;
  }

  // type === "count"
  if (rule.decide_by === "percentage") {
    return `To pass, a student must pass at least ${threshold} of the subjects they offer.`;
  }
  return `To pass, a student must pass at least ${threshold}.`;
}

// Human-readable label for the rule's `type`.
function labelForType(type: ArmPassRule["type"]): string {
  return type === "score" ? "Aggregate Score" : "Subject Count";
}

// Human-readable label for the rule's `decide_by`.
function labelForDecideBy(decideBy: ArmPassRule["decide_by"]): string {
  return decideBy === "percentage" ? "Percentage" : "Raw Value";
}

// ── Sub-components ───────────────────────────────────────────────────────────

// A single key/value stat in the summary card's metadata strip. Compact
// layout (uppercase label above a bold value) reads well on mobile and lets
// the threshold stand out via a larger, accented value while the other two
// stats stay neutral slate.
interface StatBlockProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
  emphasis?: boolean;
}

function StatBlock({ label, value, icon, emphasis }: StatBlockProps) {
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <span className="text-[10px] uppercase tracking-wide text-slate-500 font-medium">
        {label}
      </span>
      <span
        className={`flex items-center gap-1.5 truncate ${
          emphasis
            ? "text-xl md:text-2xl font-bold text-indigo-600"
            : "text-sm font-semibold text-slate-700"
        }`}
      >
        {icon && <span className="shrink-0 text-slate-400">{icon}</span>}
        <span className="truncate">{value}</span>
      </span>
    </div>
  );
}

// One subject-prerequisite card. Shows the abbreviation prominently (since
// it's the primary recall key for teachers), the full subject name below it,
// and the per-subject threshold in an accent badge.
interface SubjectPrereqCardProps {
  abbr: string;
  name: string;
  threshold: string;
}

function SubjectPrereqCard({ abbr, name, threshold }: SubjectPrereqCardProps) {
  return (
    <div className="border border-slate-200 rounded-2xl bg-white p-4 flex flex-col gap-2 hover:border-indigo-200 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 shrink-0">
          <BookOpen size={18} />
        </div>
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-full px-2.5 py-1 whitespace-nowrap">
          ≥ {threshold}
        </span>
      </div>
      <div className="min-w-0">
        <div className="text-sm font-semibold text-slate-800 truncate">
          {abbr}
        </div>
        <div className="text-xs text-slate-500 truncate" title={name}>
          {name}
        </div>
      </div>
    </div>
  );
}

// ── Main tab ─────────────────────────────────────────────────────────────────

export default function PassRuleTab() {
  const { arm } = useArmDetails();
  const rule = arm?.pass_rule;

  // ── Empty state: no pass rule configured for this arm. Mirrors the CTA
  // shape used by GradingSystemTab for visual consistency.
  if (!rule) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <ShieldCheck size={40} className="text-slate-400" />
        <div className="flex flex-col gap-1 max-w-md">
          <h3 className="text-sm font-semibold text-slate-700">
            Pass rule not configured
          </h3>
          <p className="text-xs text-slate-500">
            Set up a pass rule for this arm to control how a student&apos;s term
            result is decided as passed or failed.
          </p>
        </div>
        <button
          // TODO: link to pass-rule configuration when that page lands.
          className="px-4 py-2 text-xs bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors shadow-sm shadow-violet-200 cursor-pointer"
        >
          Configure Pass Rule
        </button>
      </div>
    );
  }

  const summary = buildSummarySentence(rule);
  const thresholdText = formatThreshold(
    rule.type,
    rule.decide_by,
    rule.base_value,
  );
  const hasSubjectPrereqs = rule.subjects && rule.subjects.length > 0;

  return (
    <div className="flex flex-col gap-5">
      {/* ── Summary card ────────────────────────────────────────────────
          Deliberately calm and document-style — white background, slate
          text, single indigo accent on the icon badge and the threshold
          value. Sits under the ArmInfo gradient header without competing
          with it for attention.
      ─────────────────────────────────────────────────────────────────── */}
      <section className="border border-slate-200 rounded-2xl bg-white overflow-hidden">
        {/* Header row — icon badge + name + active/inactive chip */}
        <div className="p-5 md:p-6 flex items-center gap-3 md:gap-4">
          <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <ShieldCheck size={20} />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs md:text-sm text-slate-600 mt-1.5 leading-relaxed">
              {summary}
            </p>
          </div>
        </div>

        {/* Metadata strip — three stat blocks on a subtle background.
            Threshold gets visual emphasis (size + indigo accent); the other
            two stats stay neutral so the eye lands on the threshold first,
            then picks up the qualifiers. */}
        <div className="border-t border-slate-100 bg-slate-50/60 px-5 md:px-6 py-4 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <StatBlock label="Threshold" value={thresholdText} emphasis />

          <StatBlock
            label="Decision Type"
            value={labelForType(rule.type)}
            icon={
              rule?.type === "score" ? (
                <Calculator size={14} />
              ) : (
                <Hash size={14} />
              )
            }
          />

          <StatBlock
            label="Measured As"
            value={labelForDecideBy(rule.decide_by)}
            icon={
              rule.decide_by === "percentage" ? (
                <Percent size={14} />
              ) : (
                <Target size={14} />
              )
            }
          />
        </div>
      </section>

      {/* ── Inactive banner ────────────────────────────────────────────────
          Surfaces the case where a rule is linked to the arm but its `active`
          flag is false — backend-side that means the rule itself has been
          paused at the school level.
      ───────────────────────────────────────────────────────────────────── */}
      {!rule.active && (
        <div className="flex items-start gap-3 border border-amber-200 bg-amber-50 rounded-2xl p-4">
          <AlertTriangle size={18} className="text-amber-500 mt-0.5 shrink-0" />
          <div className="text-xs md:text-sm text-amber-800">
            <span className="font-semibold">This pass rule is inactive. </span>
            <span className="text-amber-700">
              It is linked to this arm but will not be applied while inactive.
              Activate it from the pass-rule configuration to enforce the
              criteria above.
            </span>
          </div>
        </div>
      )}

      {/* ── Subject prerequisites ──────────────────────────────────────────
          Only renders when PassRuleSubject rows exist. Mobile-first grid:
          single column on phones, two on tablet, three on desktop.
      ───────────────────────────────────────────────────────────────────── */}
      {hasSubjectPrereqs && (
        <div className="border border-slate-200 rounded-2xl bg-white overflow-hidden">
          <div className="px-4 md:px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
            <ListChecks size={16} className="text-indigo-600" />
            <h3 className="text-xs md:text-sm font-semibold text-slate-700">
              Subject Prerequisites
            </h3>
            <span className="ml-auto text-[10px] md:text-xs text-slate-500">
              {rule.subjects.length}{" "}
              {rule.subjects.length === 1 ? "subject" : "subjects"}
            </span>
          </div>

          <div className="p-4 md:p-5">
            <p className="text-xs md:text-sm text-slate-600 mb-4">
              Beyond the overall rule above, each student must individually meet
              the threshold below for every listed subject. Falling short on any
              one of them fails the student for the term regardless of their
              aggregate.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {rule.subjects.map((s) => (
                <SubjectPrereqCard
                  key={s.id}
                  abbr={s.subject_definition.abbr}
                  name={s.subject_definition.name}
                  threshold={formatSubjectThreshold(
                    rule.decide_by,
                    s.base_value,
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── No subject prerequisites note ──────────────────────────────────
          A short, neutral note for the case where the rule applies only at
          the aggregate level. Keeps the tab from looking incomplete and
          makes the absence intentional.
      ───────────────────────────────────────────────────────────────────── */}
      {!hasSubjectPrereqs && (
        <div className="border border-slate-200 rounded-2xl bg-slate-50/50 p-4 md:p-5 text-xs md:text-sm text-slate-600">
          <span className="font-semibold text-slate-700">
            No subject-level prerequisites.{" "}
          </span>
          Pass or fail is decided purely by the overall rule above. No single
          subject can independently fail a student.
        </div>
      )}
    </div>
  );
}
