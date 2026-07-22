"use client";

// ─────────────────────────────────────────────────────────────────────────────
// BroadsheetInfo.tsx
//
// Header card row at the top of the broadsheet detail page. Two cards on a
// horizontal grid at md+:
//
//   1. Identity — the arm label + term/session + a row of status pills
//      (broadsheet submission state, and the term's results-published state).
//   2. Performance — class average as a featured hero tile on the left, and
//      the five secondary counters (Passed / Failed / Students / Male /
//      Female) inline on the right in a single horizontal strip. The whole
//      card fits in a shallow vertical band so the row height is dictated
//      by the identity card's content rather than a tall stats grid.
//
// The previous Results Access card lived here alongside these two. That
// analytic is scoped to the school/term/session rather than to a single
// arm, so it moved to the Broadsheet Arms *list* page next to Term
// Approval Progress. See BroadsheetsList.tsx for its new home.
// ─────────────────────────────────────────────────────────────────────────────

import type { ComponentType } from "react";
import {
  CheckCircle2,
  GraduationCap,
  Mars,
  Users,
  Venus,
  XCircle,
} from "lucide-react";
import type { LucideProps } from "lucide-react";

import BroadsheetStatusBadge from "../../arms/components/BroadsheetStatusBadge";
import { useBroadsheetDetails } from "../context/BroadsheetDetailsProvider";

// Loose alias for a lucide-react icon component. Every icon we import from
// lucide implements this signature. Keeping the alias narrow means the tile
// helpers can type-check the icon prop without depending on lucide's
// deeper generics.
type IconComponent = ComponentType<LucideProps>;

export default function BroadsheetInfo() {
  const { arm, students, classResult, isPending } = useBroadsheetDetails();

  // ── Loading state — mirrors the populated card so layout doesn't shift ──
  if (isPending) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
        <div className="rounded-2xl bg-indigo-700/80 p-6 animate-pulse h-32" />
        <div className="rounded-2xl bg-slate-100 p-6 animate-pulse h-32" />
      </div>
    );
  }

  if (!arm) {
    return (
      <div className="rounded-2xl bg-slate-100 p-6 text-slate-500 text-sm">
        Broadsheet details unavailable for this class arm.
      </div>
    );
  }

  // ── Derived stat values ────────────────────────────────────────────────
  const section = arm.level.section;
  const term = section.term;
  const session = term?.session;

  const studentResults = Object.values(classResult.students);
  const passedCount = studentResults.filter(
    (s) => s.decision === "Pass",
  ).length;
  const failedCount = studentResults.filter(
    (s) => s.decision === "Fail",
  ).length;

  // Backend stores gender as "M" | "F" | "O". Male / female get their own
  // tiles; "Other" is folded into the Students total without its own pill.
  const maleCount = students.filter((s) => s.gender === "M").length;
  const femaleCount = students.filter((s) => s.gender === "F").length;

  const armLabel = `${section.abbr} ${arm.level.abbr} ${arm.abbr}`;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
      {/* ── Identity card ────────────────────────────────────────────── */}
      {/* flex-col + justify-center: on md+ the two cards stretch to the
          tallest row height (CSS grid's default `align-items: stretch`);
          without vertical centring the identity content sat pinned to the
          top of that row leaving a lot of empty space beneath. The
          absolutely-positioned GraduationCap is unaffected by the flex
          layout since it's taken out of flow. */}
      <div className="relative overflow-hidden rounded-2xl bg-indigo-700 p-6 text-white shadow-lg shadow-violet-200 flex flex-col justify-center">
        <GraduationCap
          size={120}
          className="absolute -right-4 -bottom-4 text-white/10"
          strokeWidth={1}
        />
        <div className="relative flex flex-col gap-2">
          <div className="text-xs uppercase tracking-wide text-white/70">
            Broadsheet
          </div>
          <div className="text-2xl md:text-3xl font-bold tracking-tight">
            {armLabel}
          </div>
          <div className="text-xs text-white/80">
            {term?.name ? `${term.name} Term` : "Term unavailable"}
            {session ? ` · ${session.name}` : ""}
          </div>
          {/* Status pill row — broadsheet submission state and, next to it,
              the term's own publish state. Flex-wrap so both pills stay
              legible on narrow viewports where the card is one column. */}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <BroadsheetStatusBadge status={arm.broadsheet} />
            <TermResultsTag status={term?.results_status} />
          </div>
        </div>
      </div>

      {/* ── Performance card ─────────────────────────────────────────────
          Compact horizontal layout: featured class-average hero on the
          left, five secondary metric tiles inline on the right. Whole
          card fits in a shallow vertical band — the previous 3-row
          stacked design used ~3x this height, which now lets the
          Identity card next door co-determine the row height instead of
          being dictated to by Performance. Tiles switch from a 3-then-2
          grid on narrow viewports to a single 5-column row from sm up. */}
      <div className="rounded-2xl border border-indigo-100 bg-white p-4 sm:p-5 flex flex-col justify-center">
        <div className="text-xs uppercase tracking-wide text-slate-400 font-semibold mb-3">
          Performance
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          {/* Featured class-average hero — separated from the metrics by
              a right border so it reads as the headline figure. Fixed on
              the left so it doesn't shrink under the tile grid. */}
          <div className="shrink-0 pr-3 sm:pr-4 border-r border-slate-100">
            <div className="text-2xl sm:text-3xl font-bold text-slate-800 tabular-nums leading-none">
              {classResult.class_average.toFixed(2)}
            </div>
            <div className="text-[10px] text-slate-400 mt-1 whitespace-nowrap">
              Class Average
            </div>
          </div>

          {/* Five metric tiles. 3-col on very narrow screens (they wrap
              into two rows there); a single 5-col row from sm up. Each
              tile is a stacked icon + bold value + muted label so all
              five read at the same visual weight regardless of column
              width. */}
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 flex-1 min-w-0">
            <CompactMetric
              Icon={CheckCircle2}
              iconClasses="text-emerald-600 bg-emerald-50"
              value={passedCount}
              label="Passed"
            />
            <CompactMetric
              Icon={XCircle}
              iconClasses="text-red-500 bg-red-50"
              value={failedCount}
              label="Failed"
            />
            <CompactMetric
              Icon={Users}
              iconClasses="text-violet-600 bg-violet-50"
              value={students.length}
              label="Students"
            />
            <CompactMetric
              Icon={Mars}
              iconClasses="text-blue-600 bg-blue-50"
              value={maleCount}
              label="Male"
            />
            <CompactMetric
              Icon={Venus}
              iconClasses="text-pink-600 bg-pink-50"
              value={femaleCount}
              label="Female"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── TermResultsTag ───────────────────────────────────────────────────────
// Renders as a small pill next to the broadsheet-status badge on the
// identity card. Binary display:
//   - "published" → green Published pill
//   - anything else (including undefined/missing on the wire) → gray
//     Unpublished pill.
//
// Backend caveat: the current ArmDetailView doesn't include
// "results_status" in its include_term_fields tuple, so this component
// will render "Unpublished" for every arm until that tuple is updated
// on the server. The graceful fallback here means we ship no broken UI
// in the interim; adding "results_status" to the include tuple is a
// one-line backend edit.
function TermResultsTag({
  status,
}: {
  status?: "nota" | "computing" | "published";
}) {
  const isPublished = status === "published";
  const label = isPublished ? "Published" : "Unpublished";

  // Colour: emerald for published, neutral slate for anything else. Slate
  // reads clearly on the dark indigo identity-card background alongside
  // the broadsheet status badge.
  const pillClasses = isPublished
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : "bg-slate-100 text-slate-600 border-slate-200";
  const dotClasses = isPublished ? "bg-emerald-500" : "bg-slate-400";

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-medium border ${pillClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotClasses}`} />
      {label}
    </span>
  );
}

// ── CompactMetric ────────────────────────────────────────────────────────
// Stacked layout: coloured icon pill on top, bold value in the middle,
// small muted label below. Designed for the horizontal metric strip on
// the Performance card, where each tile lives inside a narrow grid cell
// and the vertical stack keeps every tile the same footprint.
function CompactMetric({
  Icon,
  iconClasses,
  value,
  label,
}: {
  Icon: IconComponent;
  iconClasses: string;
  value: number;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center text-center min-w-0">
      <span
        className={`w-7 h-7 rounded-full flex items-center justify-center mb-1 shrink-0 ${iconClasses}`}
      >
        <Icon size={12} />
      </span>
      <span className="text-sm font-bold text-slate-800 tabular-nums leading-none">
        {value}
      </span>
      <span className="text-[9px] text-slate-400 mt-1 truncate max-w-full">
        {label}
      </span>
    </div>
  );
}
