"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Slidepanellayout.tsx
//
// Lays out a list next to a slide-in editor panel. The two sit side by side in
// a flex row with the panel on the LEFT and the list on the right. Opening the
// panel expands it from the left edge to full width while the list is pushed to
// the right and collapses (width 0, invisible), so the panel slides in from
// left to right. Both use a 500 ms transition. Closing runs it in reverse.
//
// The panel is only mounted while it is open or sliding away:
//   • On open it is mounted collapsed, then expanded 20 ms later so the browser
//     has painted the collapsed state and the transition actually runs.
//   • On close it slides out, and is unmounted when the slide finishes, which
//     also resets the editor's form state for the next time.
//
// `panel` should be the editor element. Callers keep the record being edited
// after closing so the panel keeps its content while it slides out.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState, type ReactNode } from "react";

// Must match the duration-500 class on the two wrappers below.
const SLIDE_DURATION_MS = 500;

interface SlidePanelLayoutProps {
  /** True while the editor panel should be showing. */
  panelOpen: boolean;
  /** The editor, shown in the slide-in panel. */
  panel: ReactNode;
  /** The list, shown while the panel is closed. */
  children: ReactNode;
}

export default function SlidePanelLayout({
  panelOpen,
  panel,
  children,
}: SlidePanelLayoutProps) {
  // `mounted`: the panel is in the page. `entered`: it has been expanded.
  const [mounted, setMounted] = useState(false);
  const [entered, setEntered] = useState(false);

  // Mount the panel as soon as it is asked to open.
  if (panelOpen && !mounted) setMounted(true);

  useEffect(() => {
    if (panelOpen) {
      const expandTimer = setTimeout(() => setEntered(true), 20);
      return () => clearTimeout(expandTimer);
    }
    const unmountTimer = setTimeout(() => {
      setMounted(false);
      setEntered(false);
    }, SLIDE_DURATION_MS);
    return () => clearTimeout(unmountTimer);
  }, [panelOpen]);

  const expanded = panelOpen && entered;

  return (
    <div className="flex">
      {/* List (left) */}
      <div
        className={`transition-all duration-500 ease-in-out overflow-hidden ${
          panelOpen ? "w-0 opacity-0 h-0" : "w-full opacity-100"
        }`}
      >
        {children}
      </div>

      {/* Slide-in panel (right) */}
      <div
        className={`transition-all duration-500 ease-in-out overflow-hidden ${
          expanded ? "w-full opacity-100" : "w-0 opacity-0 h-0"
        }`}
      >
        {mounted && panel}
      </div>
    </div>
  );
}
