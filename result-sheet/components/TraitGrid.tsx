import { ACCENTS, type Accent } from "../utils/accent";

// What a rating chip shows when the student has no grade for the trait, or was
// absent. The chip is never left empty, so it keeps the same height and width
// whether or not a grade has been given.
const NO_GRADE = "—";

// The behaviour or skills tiles, four to a row by default. Rows come in already
// sorted. The grade chip is drawn in the sheet's accent.
export default function TraitGrid({
  title,
  rows,
  columns,
  accent,
}: {
  title: string;
  rows: {
    trait_id: string;
    trait_name: string;
    grade_symbol: string | null;
    is_absent: boolean;
  }[];
  columns: number;
  accent: Accent;
}) {
  if (rows.length === 0) return null;
  const a = ACCENTS[accent];
  // Tailwind cannot build `grid-cols-{n}` at runtime, so the known small counts
  // are written out.
  const gridClass =
    columns === 4
      ? "grid-cols-4"
      : columns === 3
        ? "grid-cols-3"
        : "grid-cols-2";
  return (
    <section className="mt-3">
      <div className="mb-1">
        <p className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-700">
          {title}
        </p>
      </div>
      <div className={`grid gap-0.5 ${gridClass}`}>
        {rows.map((row) => (
          <div
            key={row.trait_id}
            className="flex items-center justify-between rounded-sm border border-slate-300 bg-white px-2 py-0.5"
          >
            <span className="text-[9.5px] text-slate-800">
              {row.trait_name}
            </span>
            <span
              className={`rounded-sm border ${a.border200} ${a.bg50} px-1.5 py-0.5 text-[10px] font-bold leading-none ${a.text900}`}
            >
              {row.is_absent || !row.grade_symbol ? NO_GRADE : row.grade_symbol}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
