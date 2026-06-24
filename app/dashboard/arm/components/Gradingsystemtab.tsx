"use client";

// ─────────────────────────────────────────────────────────────────────────────
// GradingSystemTab.tsx
//
// Fifth tab — visualizes the three grading formats configured on this arm:
//   - Academics (cognitive)
//   - Behaviours (affective)
//   - Skills (psychomotor)
//
// Each card lists the grade symbols, their remarks, and the score band that
// maps to each symbol. If any format is missing, surface a CTA to configure.
//
// Data source:
//   No mock helpers and no own queries — every field consumed here is part of
//   the arm/detail/ payload exposed via ArmDetailsProvider:
//     arm.cog_grading_format, arm.aff_grading_format, arm.psy_grading_format.
//   The provider's React Query cache (["arm-detail", armId]) is the single
//   source of truth; this tab is purely a renderer.
//
// Layout note (alignment):
//   Grades are rendered in a two-column CSS grid inside each card. The fixed
//   column widths keep every grade symbol at a predictable x-position, so
//   symbols line up both vertically (within a column) and horizontally
//   (across a row) regardless of how long the per-grade remark text is.
//   The symbol circle uses `shrink-0` so a long remark next to it can't
//   squash the circle; the remark column uses `min-w-0` + `truncate` so it
//   clips gracefully instead of pushing the circle out of alignment.
// ─────────────────────────────────────────────────────────────────────────────

import { Settings2 } from "lucide-react";
import { useArmDetails } from "../context/Armdetailsprovider";

// Color rotation for grade chips — keeps the first (best) grade visually
// distinct as a "red flag" anchor, then cycles through colors for the rest.
function ringColorForIndex(index: number): string {
  if (index === 0) return "border-red-400 text-red-500 bg-red-50";
  if (index % 4 === 0)
    return "border-emerald-400 text-emerald-600 bg-emerald-50";
  if (index % 3 === 0) return "border-blue-400 text-blue-600 bg-blue-50";
  if (index % 2 === 0) return "border-amber-400 text-amber-600 bg-amber-50";
  return "border-slate-400 text-slate-700 bg-slate-50";
}

interface GradingCardProps {
  title: string;
  accent: string; // header tint
  format: ArmGradingFormat | null | undefined;
}

function GradingCard({ title, accent, format }: GradingCardProps) {
  if (!format) {
    return (
      <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white break-inside-avoid mb-5">
        <div
          className={`px-4 py-3 text-xs font-semibold border-b border-slate-200 ${accent}`}
        >
          {title}
        </div>
        <div className="p-6 text-xs text-slate-400 text-center">
          Not configured
        </div>
      </div>
    );
  }

  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white break-inside-avoid mb-5">
      <div
        className={`px-4 py-3 text-xs font-semibold border-b border-slate-200 ${accent}`}
      >
        {title}
      </div>

      {/* Two-column grid — each cell has identical width, so every grade
          symbol sits at a predictable x-position both within and across
          rows. Container-level `items-center` aligns the symbol circle
          and the text vertically inside each cell. */}
      <div className="p-4 grid grid-cols-2 gap-x-4 gap-y-3 items-center">
        {format.grades.map((grade, index) => (
          <div
            key={grade.id}
            // `min-w-0` lets the child text container shrink when remarks
            // are long, so the symbol circle stays put.
            className="flex items-center gap-2.5 min-w-0"
          >
            <div
              // `shrink-0` keeps the circle at its w-9 size no matter how
              // wide the remark text wants to grow. This is what locks
              // the symbol's horizontal position across rows.
              className={`flex items-center justify-center w-9 h-9 rounded-full border-2 text-xs font-bold shrink-0 ${ringColorForIndex(
                index,
              )}`}
            >
              {grade.symbol}
            </div>
            {/* `min-w-0` is the standard "let me actually shrink inside
                a flex parent" escape hatch; without it `truncate` is a
                no-op because the text content forces an intrinsic width. */}
            <div className="text-xs min-w-0">
              <div className="text-slate-700 truncate">{grade.remark}</div>
              <div className="text-[10px] text-slate-400">
                ({grade.low}–{grade.high})
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function GradingSystemTab() {
  const { arm } = useArmDetails();

  const cog = arm?.cog_grading_format;
  const aff = arm?.aff_grading_format;
  const psy = arm?.psy_grading_format;

  // If ALL three are missing, show the CTA. Partial configuration still shows
  // the cards with "Not configured" placeholders so it's clear what's missing.
  const allMissing = !cog && !aff && !psy;

  if (allMissing) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <Settings2 size={40} className="text-slate-400" />
        <div className="flex flex-col gap-1 max-w-md">
          <h3 className="text-sm font-semibold text-slate-700">
            Grading format not configured
          </h3>
          <p className="text-xs text-slate-500">
            Set up cognitive, affective, and psychomotor grading formats to
            enable result generation for this arm.
          </p>
        </div>
        <button
          // TODO: link to grading format configuration when that page lands.
          className="px-4 py-2 text-xs bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors shadow-sm shadow-violet-200 cursor-pointer"
        >
          Configure Grading Format
        </button>
      </div>
    );
  }

  return (
    <div className="columns-1 md:columns-2 lg:columns-3 gap-5">
      <GradingCard
        title="Academics Grading Format"
        accent="bg-emerald-50 text-emerald-800"
        format={cog}
      />
      <GradingCard
        title="Behaviours Grading Format"
        accent="bg-rose-50 text-rose-800"
        format={aff}
      />
      <GradingCard
        title="Skills Grading Format"
        accent="bg-sky-50 text-sky-800"
        format={psy}
      />
    </div>
  );
}
