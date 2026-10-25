// ─────────────────────────────────────────────────────────────────────────────
// Statcards.tsx
//
// The two stat-card layouts shared by the student and staff stats bars, so the
// two pages read as one set.
//
//   CombinedStatCard  Two related numbers side by side, with a divider.
//   LeaversStatCard   Several small numbers in one compact card, for example
//                     the ways people leave. Any number of cells fits.
//
// Both keep the same minimum height, so cards stay level on a grid.
// ─────────────────────────────────────────────────────────────────────────────

import type { ComponentType, ReactNode } from "react";
import type { LucideProps } from "lucide-react";

export interface StatEntry {
  label: string;
  value: number;
  icon: ReactNode;
  accent: string;
}

export interface LeaverEntry {
  label: string;
  value: number;
  Icon: ComponentType<LucideProps>;
  iconColorClass: string;
  accent: string;
}

// Compact card packing two related stats into two side-by-side halves,
// separated by a thin vertical divider. Each half is an icon square, a label
// and a value.
export function CombinedStatCard({
  entries,
}: {
  entries: [StatEntry, StatEntry];
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex overflow-hidden min-h-19 hover:shadow-md transition-shadow duration-200">
      {entries.map((entry, i) => (
        <div
          key={entry.label}
          className={`flex-1 min-w-0 flex items-center gap-2.5 px-3 py-3 ${
            i === 0 ? "border-r border-slate-100" : ""
          }`}
        >
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${entry.accent}`}
          >
            {entry.icon}
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-slate-400 font-medium truncate">
              {entry.label}
            </p>
            <p className="text-xl font-bold text-slate-800 leading-tight tabular-nums truncate">
              {entry.value.toLocaleString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// Compact card summarising several small counts. Each cell is a vertical stack
// (icon pill, bold value, small label) rather than the horizontal layout of
// the combined card, because the cells share one card's width. `title` repeats
// the label as a tooltip in case a very narrow screen truncates it.
export function LeaversStatCard({ entries }: { entries: LeaverEntry[] }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex overflow-hidden min-h-19 hover:shadow-md transition-shadow duration-200">
      {entries.map((entry, i) => (
        <div
          key={entry.label}
          title={entry.label}
          className={`flex-1 min-w-0 flex flex-col items-center justify-center gap-1 px-1 py-2 ${
            i < entries.length - 1 ? "border-r border-slate-100" : ""
          }`}
        >
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${entry.accent}`}
          >
            <entry.Icon size={11} className={entry.iconColorClass} />
          </div>
          <p className="text-sm font-bold text-slate-800 tabular-nums leading-none">
            {entry.value.toLocaleString()}
          </p>
          <p className="text-[9px] text-slate-400 font-medium truncate max-w-full">
            {entry.label}
          </p>
        </div>
      ))}
    </div>
  );
}
