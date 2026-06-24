"use client";

// ─────────────────────────────────────────────────────────────────────────────
// ResultsFilter.tsx
//
// Four-option selector that picks which view of a student's report is shown
// in the detail pane: ACADEMICS, BEHAVIOURS, SKILLS, or GENERAL.
//
// Pure dropdown — state is owned by the parent (ResultsTab) so the choice
// persists across student selections. The "active" option's icon is rendered
// inline as a small visual cue.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from "react";
import {
  Award,
  BookOpenCheck,
  ChevronDown,
  FileBarChart,
  Smile,
} from "lucide-react";
import { ResultsFilterKey } from "./results-aggregates";

interface FilterOption {
  key: ResultsFilterKey;
  label: string;
  Icon: typeof BookOpenCheck;
}

export const RESULTS_FILTER_OPTIONS: readonly FilterOption[] = [
  { key: "ACADEMICS", label: "Academics", Icon: BookOpenCheck },
  { key: "BEHAVIOURS", label: "Behaviours", Icon: Smile },
  { key: "SKILLS", label: "Skills", Icon: Award },
  { key: "GENERAL", label: "General", Icon: FileBarChart },
] as const;

interface ResultsFilterProps {
  value: ResultsFilterKey;
  onChange: (next: ResultsFilterKey) => void;
}

export default function ResultsFilter({ value, onChange }: ResultsFilterProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Close on outside click — listens only while open to avoid an idle listener.
  useEffect(() => {
    if (!open) return;
    function handleOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  const active = RESULTS_FILTER_OPTIONS.find((opt) => opt.key === value)!;
  const ActiveIcon = active.Icon;

  return (
    <div ref={rootRef} className="relative w-full sm:w-48">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white hover:border-violet-300 transition-colors cursor-pointer"
      >
        <span className="flex items-center gap-2 text-slate-700">
          <ActiveIcon size={12} className="text-violet-600" />
          {active.label}
        </span>
        <ChevronDown
          size={12}
          className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-100 rounded-xl shadow-lg overflow-hidden z-20"
        >
          {RESULTS_FILTER_OPTIONS.map((opt) => {
            const Icon = opt.Icon;
            const isActive = opt.key === value;
            return (
              <li key={opt.key}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onClick={() => {
                    onChange(opt.key);
                    setOpen(false);
                  }}
                  className={`w-full text-left flex items-center gap-2 px-3 py-2 text-xs transition-colors cursor-pointer ${
                    isActive
                      ? "bg-violet-50 text-violet-700 font-semibold"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Icon size={12} />
                  {opt.label}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
