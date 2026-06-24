// ─────────────────────────────────────────────────────────────────────────────
// FormLoader.tsx
//
// Shimmer skeleton placeholder for form and panel sections.
// Renders ghost field boxes arranged in a responsive grid that mirrors the
// layout of create/edit panels (e.g. StaffCreatePanel) — a header bar at
// the top, a grid of input-shaped boxes, and a footer action bar.
//
// Props:
//   fields    — number of input field skeletons to render (default: 6)
//   cols      — Tailwind grid-cols classes for the field grid
//               (default: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" —
//               matches StaffCreatePanel)
//   className — extra Tailwind classes on the root wrapper
//
// Usage:
//   // While a form's supporting data (e.g. dropdowns) is loading
//   {isPending && <FormLoader />}
//
//   // Fewer fields for a smaller form
//   {isPending && <FormLoader fields={4} cols="grid-cols-1 md:grid-cols-2" />}
// ─────────────────────────────────────────────────────────────────────────────

interface FormLoaderProps {
  fields?: number;
  cols?: string;
  className?: string;
}

export default function FormLoader({
  fields = 6,
  cols = "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  className = "",
}: FormLoaderProps) {
  return (
    <div
      className={`border border-slate-200 rounded-2xl overflow-hidden shadow-sm ${className}`}
      aria-busy="true"
      aria-label="Loading form…"
      role="status"
    >
      {/* Header bar */}
      <div className="bg-slate-100 border-b border-slate-200 px-5 py-4 flex flex-col gap-2">
        <div className="h-4 rounded-md bg-slate-300 w-1/4 shimmer-f" />
        <div className="h-3 rounded-md bg-slate-200 w-2/5 shimmer-f" />
      </div>

      {/* Field grid */}
      <div className={`grid ${cols} gap-4 px-5 py-6`}>
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="flex flex-col gap-1.5">
            {/* Label line */}
            <div className="h-2.5 rounded-md bg-slate-200 w-1/3 shimmer-f" />
            {/* Input box */}
            <div className="h-8 rounded-xl bg-slate-100 w-full shimmer-f" />
          </div>
        ))}
      </div>

      {/* Footer action bar */}
      <div className="flex items-center justify-end gap-2 bg-slate-50 border-t border-slate-100 px-5 py-4">
        <div className="h-8 w-20 rounded-xl bg-slate-200 shimmer-f" />
        <div className="h-8 w-24 rounded-xl bg-slate-300 shimmer-f" />
      </div>

      <style>{`
        .shimmer-f {
          background: linear-gradient(
            90deg,
            #e2e8f0 25%,
            #f1f5f9 50%,
            #e2e8f0 75%
          );
          background-size: 200% 100%;
          animation: shimmerF 1.4s ease-in-out infinite;
        }
        @keyframes shimmerF {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
