// ─────────────────────────────────────────────────────────────────────────────
// StatCardLoader.tsx
//
// Shimmer skeleton placeholder for stat/summary card grids.
// Renders ghost cards that match the shape of a StatCard: a square icon
// placeholder on the left and two text lines (label + value) on the right.
//
// The layout mirrors the real card grid so the page doesn't shift when
// data arrives.
//
// Props:
//   count     — number of skeleton cards to render (default: 4)
//   cols      — Tailwind grid-cols classes for responsive layout
//               (default: "grid-cols-2 lg:grid-cols-4" — matches StaffStatsBar)
//   className — extra Tailwind classes on the root grid wrapper
//
// Usage:
//   // While the stats query is pending
//   {isPending && <StatCardLoader />}
//
//   // Different column count for another page
//   {isPending && <StatCardLoader count={3} cols="grid-cols-1 md:grid-cols-3" />}
// ─────────────────────────────────────────────────────────────────────────────

interface StatCardLoaderProps {
  count?: number;
  cols?: string;
  className?: string;
}

export default function StatCardLoader({
  count = 4,
  cols = "grid-cols-2 lg:grid-cols-4",
  className = "",
}: StatCardLoaderProps) {
  return (
    <div
      className={`grid ${cols} gap-4 ${className}`}
      aria-busy="true"
      aria-label="Loading statistics…"
      role="status"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3"
        >
          {/* Icon square */}
          <div className="w-10 h-10 rounded-xl bg-slate-200 shrink-0 shimmer-sc" />

          {/* Label + value lines */}
          <div className="flex flex-col gap-2 flex-1 min-w-0">
            <div className="h-2.5 rounded-md bg-slate-200 w-3/5 shimmer-sc" />
            <div className="h-5 rounded-md bg-slate-200 w-2/5 shimmer-sc" />
          </div>
        </div>
      ))}

      <style>{`
        .shimmer-sc {
          background: linear-gradient(
            90deg,
            #e2e8f0 25%,
            #f1f5f9 50%,
            #e2e8f0 75%
          );
          background-size: 200% 100%;
          animation: shimmerSC 1.4s ease-in-out infinite;
        }
        @keyframes shimmerSC {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
