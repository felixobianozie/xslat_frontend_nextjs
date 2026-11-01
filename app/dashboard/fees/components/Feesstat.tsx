// ─────────────────────────────────────────
// app/dashboard/fees/components/Feesstat.tsx
//
// A compact figure tile for the fees pages. It stacks its icon above the value,
// so two fit side by side on a phone.
// ─────────────────────────────────────────

import type { ReactNode } from "react";

type StatTone = "violet" | "emerald" | "amber" | "rose" | "slate";

const TONE_CLASSES: Record<StatTone, string> = {
  violet: "bg-violet-50 text-violet-600",
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  rose: "bg-rose-50 text-rose-600",
  slate: "bg-slate-100 text-slate-600",
};

interface FeesStatProps {
  label: string;
  value: string;
  /** Shown on hover, e.g. the exact amount behind a shortened value. */
  valueTitle?: string;
  sub?: string;
  icon: ReactNode;
  tone: StatTone;
}

export default function FeesStat({
  label,
  value,
  valueTitle,
  sub,
  icon,
  tone,
}: FeesStatProps) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-xl ${TONE_CLASSES[tone]}`}
        aria-hidden="true"
      >
        {icon}
      </span>
      <p className="mt-3 text-xs font-medium text-slate-400">{label}</p>
      <p
        title={valueTitle}
        className="mt-0.5 truncate text-xl font-bold leading-tight text-slate-800"
      >
        {value}
      </p>
      {sub && <p className="mt-0.5 truncate text-xs text-slate-400">{sub}</p>}
    </div>
  );
}
