// ─────────────────────────────────────────────────────────────────────────────
// Resultcount.tsx
//
// A small badge saying how many records a list returned, for the search and
// filters now in effect. It reads the `count` the backend sends with every
// page, so it is the full number of matches and not just this page.
//
// While nothing is applied it is a quiet white pill; while a search or filter
// is applied it turns violet and says "found". It renders nothing until the
// first count arrives, and announces changes politely to screen readers.
// ─────────────────────────────────────────────────────────────────────────────

interface ResultCountProps {
  count: number | undefined;
  singular: string;
  plural: string;
  /** True while a search or filter is applied. */
  filtered: boolean;
}

export default function ResultCount({
  count,
  singular,
  plural,
  filtered,
}: ResultCountProps) {
  if (count === undefined) return null;

  return (
    <span
      role="status"
      aria-live="polite"
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium tabular-nums ${
        filtered
          ? "border-violet-100 bg-violet-50 text-violet-700"
          : "border-slate-200 bg-white text-slate-600"
      }`}
    >
      <span className="font-bold">{count.toLocaleString()}</span>
      <span>
        {count === 1 ? singular : plural}
        {filtered ? " found" : ""}
      </span>
    </span>
  );
}
