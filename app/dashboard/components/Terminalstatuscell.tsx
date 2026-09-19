"use client";

// ─────────────────────────────────────────────────────────────────────────────
// TerminalStatusCell.tsx
//
// Renders the Level and Section terminal states of a class arm as a
// compact one-line pair of colored pills. Used by the Arms List and the
// Broadsheet Arms List to replace the plain "Section" column with an
// at-a-glance view of whether the arm sits at the terminal boundary of
// its programme (drives graduation server-side).
//
// The pill is a private helper in this file — it has no other consumer,
// so it stays local rather than as an exported module. Move it to its own
// file only when a second consumer appears.
//
// Layout keeps the two label-pill pairs on a single line separated by a
// small gap; wraps only on extremely narrow viewports as a safety net.
// Kept intentionally quiet — small text, flat pills, no ring — so the
// surrounding row retains its visual hierarchy.
// ─────────────────────────────────────────────────────────────────────────────

// Flat pill for a single terminal / non-terminal state. Missing or
// undefined values render as "Non-Terminal" — the backend default is
// terminal=False, so a gap in the payload reads the same as an explicit
// non-terminal value and never leaves an empty cell.
function TerminalStatusPill({
  terminal,
}: {
  terminal: boolean | null | undefined;
}) {
  const isTerminal = terminal === true;
  const label = isTerminal ? "Terminal" : "Non-Terminal";
  const pillClasses = isTerminal
    ? "bg-emerald-50 text-emerald-700"
    : "bg-slate-100 text-slate-500";
  return (
    <span
      className={`px-1.5 py-px rounded-full text-[10px] font-medium whitespace-nowrap ${pillClasses}`}
    >
      {label}
    </span>
  );
}

interface TerminalStatusCellProps {
  levelTerminal: boolean | null | undefined;
  sectionTerminal: boolean | null | undefined;
}

export default function TerminalStatusCell({
  levelTerminal,
  sectionTerminal,
}: TerminalStatusCellProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-500">
      <span className="flex items-center gap-1">
        <span>Level</span>
        <TerminalStatusPill terminal={levelTerminal} />
      </span>
      <span className="flex items-center gap-1">
        <span>Section</span>
        <TerminalStatusPill terminal={sectionTerminal} />
      </span>
    </div>
  );
}
