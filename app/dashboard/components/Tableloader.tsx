// ─────────────────────────────────────────────────────────────────────────────
// TableLoader.tsx
//
// Shimmer skeleton placeholder for table and card-list sections.
// Renders a configurable number of rows that mimic the shape of a data row:
// a small avatar circle on the left, two text lines in the centre, and a
// pill badge on the right — matching the visual structure of the staff list,
// request list, and any similar paginated tables across the app.
//
// On mobile the rows stack as cards; on md+ they look like table rows.
// Both layouts use the same shimmer animation so the transition to real
// content feels seamless.
//
// Props:
//   rows      — number of skeleton rows to render (default: 5)
//   className — extra Tailwind classes on the root wrapper
//
// Usage:
//   // While a table query is pending
//   {isPending && <TableLoader rows={6} className="my-4" />}
//
//   // Inside a table cell spanning all columns
//   <tr><td colSpan={8}><TableLoader rows={4} /></td></tr>
// ─────────────────────────────────────────────────────────────────────────────

interface TableLoaderProps {
  rows?: number;
  className?: string;
}

export default function TableLoader({
  rows = 5,
  className = "",
}: TableLoaderProps) {
  return (
    <div
      className={`flex flex-col gap-3 w-full ${className}`}
      aria-busy="true"
      aria-label="Loading…"
      role="status"
    >
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden"
        >
          {/* Avatar circle */}
          <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0 shimmer-t" />

          {/* Text lines */}
          <div className="flex flex-col gap-1.5 flex-1 min-w-0">
            <div className="h-3 rounded-md bg-slate-200 w-2/5 shimmer-t" />
            <div className="h-2.5 rounded-md bg-slate-100 w-3/5 shimmer-t" />
          </div>

          {/* Right pill */}
          <div className="h-5 w-14 rounded-full bg-slate-100 shrink-0 shimmer-t" />
        </div>
      ))}

      <style>{`
        .shimmer-t {
          background: linear-gradient(
            90deg,
            #e2e8f0 25%,
            #f1f5f9 50%,
            #e2e8f0 75%
          );
          background-size: 200% 100%;
          animation: shimmerT 1.4s ease-in-out infinite;
        }
        @keyframes shimmerT {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
