"use client";

// ─────────────────────────────────────────────────────────────────────────────
// BroadsheetInfo.tsx
//
// Header card at the top of the broadsheet detail page. Three cards on a
// horizontal grid at md+:
//
//   1. Identity — the arm label + term/session + broadsheet status badge.
//   2. Performance — class average, passed / failed / total students, plus
//      a compact male/female gender breakdown pulled from the roster.
//   3. Results Access — school/term/session pin usage rollup: assessments
//      accessed, total accesses, unique pins issued, last accessed at.
//
// Data:
//   - `students`, `arm`, `classResult`, `schoolAccessStat` — all from the
//     provider. Nothing is fetched or computed here beyond simple tallies.
//   - The Results Access card handles three data states: loading (skeleton),
//     no activity yet (`schoolAccessStat === null`), and populated.
// ─────────────────────────────────────────────────────────────────────────────

import { GraduationCap, Lock, Mars, Venus } from "lucide-react";

import BroadsheetStatusBadge from "../../arms/components/BroadsheetStatusBadge";
import {
  useBroadsheetDetails,
  type SchoolTermResultStat,
} from "../context/BroadsheetDetailsProvider";

// ── Utility: format an ISO datetime for the "last accessed" line ────────────
// Uses the user's locale — short date, short time. Silently returns "—" for
// null/invalid inputs so the caller doesn't need to null-check.
function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function BroadsheetInfo() {
  const {
    arm,
    students,
    classResult,
    schoolAccessStat,
    schoolAccessStatPending,
    isPending,
  } = useBroadsheetDetails();

  // ── Loading state — mirrors the populated card so layout doesn't shift ──
  if (isPending) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
        <div className="rounded-2xl bg-indigo-700/80 p-6 animate-pulse h-32" />
        <div className="rounded-2xl bg-slate-100 p-6 animate-pulse h-32" />
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

  // Gender split. Backend stores gender as "M" | "F" | "O"; we surface male
  // and female here on the Performance card. "Other" is folded into the
  // Students total but doesn't get its own pill on this compact layout.
  const maleCount = students.filter((s) => s.gender === "M").length;
  const femaleCount = students.filter((s) => s.gender === "F").length;

  const armLabel = `${section.abbr} ${arm.level.abbr} ${arm.abbr}`;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
      {/* ── Identity card ────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-indigo-700 p-6 text-white shadow-lg shadow-violet-200">
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
          <div className="mt-2">
            <BroadsheetStatusBadge status={arm.broadsheet} />
          </div>
        </div>
      </div>

      {/* ── Performance card ─────────────────────────────────────────────
          Class average headlines; below it a compact stat grid mixes the
          pass / fail / total counts with the male / female split. The
          gender pills use the same slot pattern as the other stats so
          the visual weight of the row stays balanced. */}
      <div className="rounded-2xl border border-indigo-100 bg-white p-5">
        <div className="text-xs uppercase tracking-wide text-slate-400 font-semibold">
          Performance
        </div>

        <div className="flex items-end gap-2 mt-2">
          <span className="text-3xl font-bold text-slate-800">
            {classResult.class_average.toFixed(2)}
          </span>
          <span className="text-xs text-slate-400 mb-1">class average</span>
        </div>

        {/* First row — outcomes (pass, fail, total). */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <Stat
            value={passedCount}
            label="Passed"
            valueClasses="text-emerald-600"
          />
          <Stat
            value={failedCount}
            label="Failed"
            valueClasses="text-red-500"
          />
          <Stat
            value={students.length}
            label="Students"
            valueClasses="text-violet-600"
          />
        </div>

        {/* Second row — gender counters. Two-column grid to keep the pill
            heights aligned with the outcome row above. */}
        <div className="grid grid-cols-2 gap-2 mt-3">
          <GenderPill
            Icon={Mars}
            iconClasses="text-blue-600"
            wrapperClasses="bg-blue-50"
            count={maleCount}
            label="Male"
          />
          <GenderPill
            Icon={Venus}
            iconClasses="text-pink-600"
            wrapperClasses="bg-pink-50"
            count={femaleCount}
            label="Female"
          />
        </div>
      </div>

      {/* ── Results Access card ─────────────────────────────────────────
          School-level pin usage rollup. Three data states:
            - loading  → skeleton bars in the stat slots
            - null     → "no activity recorded yet" empty state
            - present  → assessments accessed / total accesses / unique
                         pins issued, with the last-accessed timestamp. */}
      <ResultsAccessCard
        stat={schoolAccessStat}
        isPending={schoolAccessStatPending}
      />
    </div>
  );
}

// ── Stat ─────────────────────────────────────────────────────────────────
// Small inline figure used in the performance card's top row.
function Stat({
  value,
  label,
  valueClasses,
}: {
  value: number;
  label: string;
  valueClasses: string;
}) {
  return (
    <div className="flex flex-col">
      <span className={`text-lg font-bold leading-tight ${valueClasses}`}>
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-[10px] text-slate-400">{label}</span>
    </div>
  );
}

// ── GenderPill ───────────────────────────────────────────────────────────
// Icon + count pair used for the male/female counters on the performance
// card. Kept as its own component so the pill markup stays skim-readable
// above and each pill can carry its own colour scheme.
function GenderPill({
  Icon,
  iconClasses,
  wrapperClasses,
  count,
  label,
}: {
  Icon: typeof Mars;
  iconClasses: string;
  wrapperClasses: string;
  count: number;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${wrapperClasses}`}
      >
        <Icon size={13} className={iconClasses} />
      </span>
      <div className="flex flex-col leading-tight">
        <span className="text-sm font-semibold text-slate-700">{count}</span>
        <span className="text-[10px] text-slate-400">{label}</span>
      </div>
    </div>
  );
}

// ── Results Access card ──────────────────────────────────────────────────
// Renders one of three states based on the school-stat query. Kept in a
// dedicated component so the tri-state logic doesn't clutter the main
// layout above.
function ResultsAccessCard({
  stat,
  isPending,
}: {
  stat: SchoolTermResultStat | null;
  isPending: boolean;
}) {
  return (
    <div className="rounded-2xl border border-indigo-100 bg-white p-5">
      <div className="flex items-center gap-2">
        <span className="w-6 h-6 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
          <Lock size={11} className="text-amber-600" />
        </span>
        <div className="text-xs uppercase tracking-wide text-slate-400 font-semibold">
          Results Access
        </div>
      </div>

      {isPending ? (
        // Loading skeleton — mirror the populated shape below so the card
        // height stays stable through the transition.
        <div className="mt-3 space-y-2">
          <div className="h-7 w-24 rounded bg-slate-100 animate-pulse" />
          <div className="h-3 w-32 rounded bg-slate-100 animate-pulse" />
          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="h-8 rounded bg-slate-100 animate-pulse" />
            <div className="h-8 rounded bg-slate-100 animate-pulse" />
            <div className="h-8 rounded bg-slate-100 animate-pulse" />
          </div>
        </div>
      ) : !stat ? (
        // Endpoint returned data:null — no rollup row exists yet because no
        // pin has ever been redeemed against this school/term/session.
        <div className="mt-3">
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-slate-800">0</span>
            <span className="text-xs text-slate-400 mb-1">accesses</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            No result-access activity recorded for this term yet.
          </p>
        </div>
      ) : (
        // Populated — headline is the assessment-access count (a proxy for
        // "how many students have had their result viewed"), with the two
        // other counters below and the last-accessed timestamp beneath.
        <div className="mt-3">
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-slate-800">
              {stat.assessments_accessed}
            </span>
            <span className="text-xs text-slate-400 mb-1">
              student{stat.assessments_accessed === 1 ? "" : "s"} accessed
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4">
            <Stat
              value={stat.total_accesses}
              label="Total accesses"
              valueClasses="text-violet-600"
            />
            <Stat
              value={stat.total_unique_pins}
              label="Pins used"
              valueClasses="text-emerald-600"
            />
          </div>

          <div className="mt-3 text-[10px] text-slate-400 leading-relaxed">
            <span className="uppercase tracking-wide text-slate-400">
              Last access
            </span>
            <span className="block text-[11px] text-slate-600 font-medium">
              {formatDateTime(stat.last_accessed_at)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
