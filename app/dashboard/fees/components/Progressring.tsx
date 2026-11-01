// ─────────────────────────────────────────
// app/dashboard/fees/components/Progressring.tsx
//
// A ring that fills clockwise to show a percentage, with room in the middle
// for a label. The colours come in as Tailwind stroke classes, so it suits both
// the dark header cards and light cards.
// ─────────────────────────────────────────

import type { ReactNode } from "react";

interface ProgressRingProps {
  /** 0 to 100 */
  value: number;
  label: string;
  size?: number;
  strokeWidth?: number;
  trackClassName?: string;
  barClassName?: string;
  children?: ReactNode;
}

export default function ProgressRing({
  value,
  label,
  size = 112,
  strokeWidth = 10,
  trackClassName = "stroke-white/15",
  barClassName = "stroke-emerald-300",
  children,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = (Math.max(0, Math.min(100, value)) / 100) * circumference;

  return (
    <div className="relative inline-flex shrink-0 items-center justify-center">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        role="img"
        aria-label={label}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className={trackClassName}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference}`}
          className={barClassName}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {children}
      </div>
    </div>
  );
}
