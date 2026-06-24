// ─────────────────────────────────────────────────────────────────────────────
// PageLoader.tsx
//
// Full-section loading indicator for async page or tab content transitions.
// Renders the app's three-dot pulse animation centred in a block that fills
// its container vertically — suitable for lazy-loaded tab panels, dynamic
// route segments, or any section that suspends while fetching its first data.
//
// This sits between the skeleton loaders (TableLoader, StatCardLoader, etc.)
// and the root loading.tsx page spinner in terms of scope: it covers a
// defined region of the page rather than the whole viewport.
//
// Props:
//   label     — optional text shown below the dots (default: none)
//   minHeight — Tailwind min-h-* class controlling the minimum height of the
//               loading region (default: "min-h-[240px]")
//   className — extra Tailwind classes on the root wrapper
//
// Usage:
//   // Lazy-loaded tab panel while the component chunk downloads
//   <PageLoader />
//
//   // Taller section with a descriptive label
//   <PageLoader label="Loading requests…" minHeight="min-h-[400px]" />
// ─────────────────────────────────────────────────────────────────────────────

interface PageLoaderProps {
  label?: string;
  minHeight?: string;
  className?: string;
}

export default function PageLoader({
  label,
  minHeight = "min-h-[240px]",
  className = "",
}: PageLoaderProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center ${minHeight} ${className}`}
      aria-busy="true"
      aria-label={label ?? "Loading…"}
      role="status"
    >
      {/* Three-dot pulse — same keyframe as ButtonLoader and LoadingState */}
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2 h-2 rounded-full bg-sky-500"
            style={{
              animation: `lhsDot 1.2s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>

      {label && (
        <p className="mt-3 text-xs text-slate-400 font-medium">{label}</p>
      )}

      <style>{`
        @keyframes lhsDot {
          0%, 80%, 100% { opacity: 0.3; transform: scale(1);   }
          40%            { opacity: 1;   transform: scale(1.4); }
        }
      `}</style>
    </div>
  );
}
