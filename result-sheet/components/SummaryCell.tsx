import { ACCENTS, type Accent } from "../utils/accent";

// One figure in the summary strip (average, class average, total, decision).
// Drawn in the sheet's accent; `valueClassName` overrides the colour of the value.
export default function SummaryCell({
  label,
  value,
  className = "",
  valueClassName,
  accent,
}: {
  label: string;
  value: string;
  className?: string;
  valueClassName?: string;
  accent: Accent;
}) {
  const a = ACCENTS[accent];
  return (
    <div className={`${a.bg50} p-1.5 ${className}`}>
      <p className={`text-[7px] uppercase tracking-widest ${a.text900Soft}`}>
        {label}
      </p>
      <p className={`mt-0.5 text-[11px] font-bold ${valueClassName ?? a.text900}`}>
        {value}
      </p>
    </div>
  );
}
