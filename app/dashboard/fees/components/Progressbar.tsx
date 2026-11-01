// ─────────────────────────────────────────
// app/dashboard/fees/components/Progressbar.tsx
//
// A thin progress bar. It is the browser's own <progress> element, styled with
// Tailwind, so it needs no inline styles and is announced properly by screen
// readers.
// ─────────────────────────────────────────

export type BarTone = "violet" | "emerald" | "amber" | "rose";

const TONE_CLASSES: Record<BarTone, string> = {
  violet:
    "[&::-webkit-progress-value]:bg-violet-500 [&::-moz-progress-bar]:bg-violet-500",
  emerald:
    "[&::-webkit-progress-value]:bg-emerald-500 [&::-moz-progress-bar]:bg-emerald-500",
  amber:
    "[&::-webkit-progress-value]:bg-amber-500 [&::-moz-progress-bar]:bg-amber-500",
  rose: "[&::-webkit-progress-value]:bg-rose-500 [&::-moz-progress-bar]:bg-rose-500",
};

/** The colour that suits a collection rate: green when high, red when low. */
export function rateTone(rate: number): BarTone {
  if (rate >= 75) return "emerald";
  if (rate >= 40) return "amber";
  return "rose";
}

interface ProgressBarProps {
  /** 0 to 100 */
  value: number;
  label: string;
  tone?: BarTone;
  className?: string;
}

export default function ProgressBar({
  value,
  label,
  tone = "violet",
  className = "",
}: ProgressBarProps) {
  return (
    <progress
      value={value}
      max={100}
      aria-label={label}
      className={`block h-2 w-full appearance-none overflow-hidden rounded-full bg-slate-100 [&::-webkit-progress-bar]:bg-slate-100 [&::-webkit-progress-value]:rounded-full [&::-moz-progress-bar]:rounded-full ${TONE_CLASSES[tone]} ${className}`}
    />
  );
}
