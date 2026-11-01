// ─────────────────────────────────────────
// app/dashboard/fees/components/Debtdonut.tsx
//
// A donut that splits a class into students who have cleared their fees
// (green) and students who still owe something (red). The number of students
// is written in the middle.
// ─────────────────────────────────────────

interface DebtDonutProps {
  cleared: number;
  indebted: number;
}

const SIZE = 120;
const STROKE = 14;

export default function DebtDonut({ cleared, indebted }: DebtDonutProps) {
  const total = cleared + indebted;
  const radius = (SIZE - STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  const clearedLength = total === 0 ? 0 : (cleared / total) * circumference;
  const indebtedLength = total === 0 ? 0 : (indebted / total) * circumference;

  return (
    <div className="relative inline-flex shrink-0 items-center justify-center">
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="-rotate-90"
        role="img"
        aria-label={`${cleared} students cleared, ${indebted} still owing`}
      >
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={radius}
          fill="none"
          strokeWidth={STROKE}
          className="stroke-slate-100"
        />
        {cleared > 0 && (
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={radius}
            fill="none"
            strokeWidth={STROKE}
            strokeDasharray={`${clearedLength} ${circumference}`}
            className="stroke-emerald-500"
          />
        )}
        {indebted > 0 && (
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={radius}
            fill="none"
            strokeWidth={STROKE}
            strokeDasharray={`${indebtedLength} ${circumference}`}
            strokeDashoffset={-clearedLength}
            className="stroke-rose-400"
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-2xl font-bold leading-none text-slate-800">
          {total}
        </span>
        <span className="mt-1 text-[10px] uppercase tracking-wide text-slate-400">
          students
        </span>
      </div>
    </div>
  );
}
