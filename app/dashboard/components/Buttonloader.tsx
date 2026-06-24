// ─────────────────────────────────────────────────────────────────────────────
// ButtonLoader.tsx
//
// Reusable animated-dot loading indicator designed to sit inside a button.
//
// Uses the same `lhsDot` keyframe as LoadingState and the root loading.tsx
// page so the animation feels consistent across the app.
//
// Props:
//   dotColor  — Tailwind bg-* class for the dot colour.
//               Defaults to "bg-white" — correct for filled/coloured buttons
//               (violet, red, etc.) where white dots read clearly.
//               Pass "bg-sky-500" to match the LoadingState inline style,
//               or any other bg-* class to suit the button's background.
//
// Usage:
//   // Inside a filled violet button (white dots)
//   {isPending ? <ButtonLoader /> : "Save"}
//
//   // Inside a ghost / outline button (sky dots to match LoadingState)
//   {isPending ? <ButtonLoader dotColor="bg-sky-500" /> : "Load more"}
// ─────────────────────────────────────────────────────────────────────────────

interface ButtonLoaderProps {
  /** Tailwind bg-* class for dot colour. Defaults to "bg-white". */
  dotColor?: string;
}

export default function ButtonLoader({
  dotColor = "bg-white",
}: ButtonLoaderProps) {
  return (
    <span className="flex items-center gap-1" aria-label="Loading…" role="status">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={`w-1.5 h-1.5 rounded-full ${dotColor}`}
          style={{
            animation: `lhsDot 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}

      {/*
        Keyframe defined inline so ButtonLoader is fully self-contained —
        no global CSS dependency. The name `lhsDot` is shared with LoadingState
        and root loading.tsx intentionally; all three resolve to the same
        animation when rendered together, with no conflict.
      */}
      <style>{`
        @keyframes lhsDot {
          0%, 80%, 100% { opacity: 0.3; transform: scale(1);   }
          40%            { opacity: 1;   transform: scale(1.4); }
        }
      `}</style>
    </span>
  );
}
