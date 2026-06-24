"use client";

// ─────────────────────────────────────────────────────────────────────────────
// BroadsheetInfo.tsx
//
// Header card at the top of the broadsheet detail page. Shows the class
// identifier, the term + session, the current broadsheet status, and a
// compact stats panel summarising the class:
//
//   - Class average (cognitive)
//   - Pass / fail count + total student population
//   - Gender breakdown
//
// All stats are pulled from the provider so there's no extra fetching or
// recomputation here — they're already memoised at the provider level.
// ─────────────────────────────────────────────────────────────────────────────

import { GraduationCap, Mars, Venus } from "lucide-react";

import BroadsheetStatusBadge from "../../arms/components/BroadsheetStatusBadge";
import { useBroadsheetDetails } from "../context/BroadsheetDetailsProvider";

export default function BroadsheetInfo() {
  const { arm, students, classResult, isPending } = useBroadsheetDetails();

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

  // Pass/fail counts come from the pre-computed classResult — we just tally
  // how many student decisions ended up on each side of the line.
  const studentResults = Object.values(classResult.students);
  const passedCount = studentResults.filter(
    (s) => s.decision === "Pass",
  ).length;
  const failedCount = studentResults.filter(
    (s) => s.decision === "Fail",
  ).length;

  // Gender split. Backend stores gender as "M" | "F" | "O"; we surface the
  // first two and lump anything else into "Other" so the legend stays clean.
  const maleCount = students.filter((s) => s.gender === "M").length;
  const femaleCount = students.filter((s) => s.gender === "F").length;
  const otherCount = students.length - maleCount - femaleCount;

  const armLabel = `${section.abbr} ${arm.level.abbr} ${arm.abbr}`;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
      {/* ── Identity card — primary, dark, branded ────────────────────── */}
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

      {/* ── Performance card — class average, pass / fail / total ────── */}
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
      </div>

      {/* ── Composition card — gender split ──────────────────────────── */}
      <div className="rounded-2xl border border-indigo-100 bg-white p-5">
        <div className="text-xs uppercase tracking-wide text-slate-400 font-semibold">
          Composition
        </div>

        <div className="flex items-end gap-2 mt-2">
          <span className="text-3xl font-bold text-slate-800">
            {students.length}
          </span>
          <span className="text-xs text-slate-400 mb-1">on roster</span>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-4">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center">
              <Mars size={13} className="text-blue-600" />
            </span>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold text-slate-700">
                {maleCount}
              </span>
              <span className="text-[10px] text-slate-400">Male</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-pink-50 flex items-center justify-center">
              <Venus size={13} className="text-pink-600" />
            </span>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold text-slate-700">
                {femaleCount}
              </span>
              <span className="text-[10px] text-slate-400">Female</span>
            </div>
          </div>
          {otherCount > 0 && (
            <div className="flex items-center gap-2 col-span-2">
              <span className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center">
                <span className="text-[10px] text-slate-500 font-bold">O</span>
              </span>
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-semibold text-slate-700">
                  {otherCount}
                </span>
                <span className="text-[10px] text-slate-400">Other</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Stat ─────────────────────────────────────────────────────────────────
// Small inline figure component used in the performance card.
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
