"use client";

// ─────────────────────────────────────────────────────────────────────────────
// BroadsheetRecordSelector.tsx
//
// Tab-style selector for switching between the three broadsheet views:
//   COGNITIVE   — subject scores per student
//   AFFECTIVE   — behaviour ratings per student
//   PSYCHOMOTOR — skill ratings per student
//
// Lifted from the original draft's dropdown + replaced with proper tabs
// because tabs are clearer at this density (only three options) and
// keyboard-accessible by default. Each tab carries an icon so the active
// view reads at a glance on small screens.
// ─────────────────────────────────────────────────────────────────────────────

import { BookOpen, Heart, Trophy } from "lucide-react";

// The three possible views. Exported so the parent can store it in state
// without redefining the union.
export type BroadsheetView = "cognitive" | "affective" | "psychomotor";

interface BroadsheetRecordSelectorProps {
  value: BroadsheetView;
  onChange: (view: BroadsheetView) => void;
}

// Visual config per tab — label, icon, accent. Keeping it in a table makes
// adding a fourth view (if the backend ever introduces one) a single-line
// change.
const TAB_CONFIG: Record<
  BroadsheetView,
  { label: string; Icon: typeof BookOpen; activeClasses: string }
> = {
  cognitive: {
    label: "Cognitive",
    Icon: BookOpen,
    activeClasses: "bg-violet-600 text-white shadow-sm shadow-violet-200",
  },
  affective: {
    label: "Affective",
    Icon: Heart,
    activeClasses: "bg-rose-600 text-white shadow-sm shadow-rose-200",
  },
  psychomotor: {
    label: "Psychomotor",
    Icon: Trophy,
    activeClasses: "bg-amber-600 text-white shadow-sm shadow-amber-200",
  },
};

export default function BroadsheetRecordSelector({
  value,
  onChange,
}: BroadsheetRecordSelectorProps) {
  return (
    <div
      role="tablist"
      aria-label="Broadsheet view"
      className="inline-flex w-full sm:w-auto rounded-xl bg-slate-100 p-1 gap-1"
    >
      {(Object.keys(TAB_CONFIG) as BroadsheetView[]).map((key) => {
        const { label, Icon, activeClasses } = TAB_CONFIG[key];
        const isActive = value === key;
        return (
          <button
            key={key}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(key)}
            className={`cursor-pointer flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs font-medium transition-all ${
              isActive
                ? activeClasses
                : "text-slate-600 hover:bg-white hover:text-slate-800"
            }`}
          >
            <Icon size={12} />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
