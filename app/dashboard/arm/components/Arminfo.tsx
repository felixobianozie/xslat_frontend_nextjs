"use client";

// ─────────────────────────────────────────────────────────────────────────────
// ArmInfo.tsx
//
// Header card at the top of the arm detail page. Shows the class identifier
// (e.g. "JSS 1 ORNG"), section name with level name, and term + session.
// ─────────────────────────────────────────────────────────────────────────────

import { GraduationCap } from "lucide-react";
import { useArmDetails } from "../context/Armdetailsprovider";

export default function ArmInfo() {
  const { arm, isPending } = useArmDetails();

  if (isPending) {
    // Skeleton mirrors the populated card's three text rows so layout doesn't shift.
    return (
      <div className="rounded-2xl bg-indigo-700 p-6 mb-8 animate-pulse">
        <div className="h-8 w-40 bg-white/30 rounded mb-3" />
        <div className="h-5 w-64 bg-white/20 rounded mb-2" />
        <div className="h-4 w-48 bg-white/20 rounded" />
      </div>
    );
  }

  if (!arm) {
    return (
      <div className="rounded-2xl bg-slate-100 p-6 mb-8 text-slate-500 text-sm">
        Class arm details unavailable.
      </div>
    );
  }

  const section = arm.level.section;
  const term = section.term;
  const session = term?.session;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-linear-to-br bg-indigo-700 p-6 mb-8 text-white shadow-lg shadow-violet-200">
      {/* Subtle decorative icon — gives the card a visual anchor without
          competing with the text. */}
      <GraduationCap
        size={120}
        className="absolute -right-4 -bottom-4 text-white/10"
        strokeWidth={1}
      />

      <div className="relative flex flex-col gap-2">
        <div className="text-2xl md:text-3xl font-bold tracking-tight">
          {section.abbr} {arm.level.abbr} {arm.abbr}
        </div>

        <div className="text-sm md:text-base text-white/90">{section.name}</div>

        <div className="text-xs text-white/70">
          {term?.name ? `${term?.name} Term` : "Term unavailable"}
          {session ? ` | ${session.name}` : ""}
        </div>
      </div>
    </div>
  );
}
