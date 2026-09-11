"use client";

// ─────────────────────────────────────────────────────────────────────────────
// SessionTermFilterBar.tsx
//
// Two-dropdown control that scopes the broadsheets list to a specific
// session + term. The Session dropdown lists every session for the school
// (from GET session/list/); the Term dropdown lists just the terms of the
// currently-selected session. Selecting a session auto-picks that session's
// current term (or its first term if none is marked current), so the term
// dropdown always resolves to something valid whenever the session has any
// terms at all.
//
// The chip shape (icon · label · value · chevron) mirrors the surrounding
// toolbar controls, and a small "Current" tag appears next to the school's
// live session/term inside each dropdown so the admin can distinguish them
// from historical entries at a glance.
//
// Click-outside closes any open dropdown; the two dropdowns can never both
// be open at the same time.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useMemo, useRef, useState } from "react";
import type { ComponentType } from "react";
import {
  CalendarClock,
  CalendarRange,
  ChevronDown,
  type LucideProps,
} from "lucide-react";

import type { SessionListItem, SessionTermItem } from "../page";

// Loose alias for a lucide-react icon component. Keeps the chip prop typed
// without depending on lucide's deeper generics.
type IconComponent = ComponentType<LucideProps>;

interface SessionTermFilterBarProps {
  /** All sessions for the school, newest first. Each session carries the
   *  terms that belong to it. */
  sessions: SessionListItem[];
  /** Currently-selected session id — drives which terms populate the term
   *  dropdown and which option is highlighted as active. */
  selectedSessionId: string;
  /** Currently-selected term id within the selected session. */
  selectedTermId: string;
  /** School's live session id — marked with a "Current" tag in the
   *  session dropdown so the admin can tell it apart from past sessions. */
  currentSessionId: string;
  /** School's live term id — marked with a "Current" tag in the term
   *  dropdown, same purpose as `currentSessionId`. */
  currentTermId: string;
  /** Fired whenever either dropdown selection changes. The bar always emits
   *  both ids together so the parent doesn't have to sync them separately. */
  onChange: (sessionId: string, termId: string) => void;
  /** Disables both chips while the sessions query is still resolving. */
  isLoading?: boolean;
}

export default function SessionTermFilterBar({
  sessions,
  selectedSessionId,
  selectedTermId,
  currentSessionId,
  currentTermId,
  onChange,
  isLoading = false,
}: SessionTermFilterBarProps) {
  // Which dropdown, if any, is open. `null` closes both — enforced so the
  // two chips can never overlap their popovers.
  const [openMenu, setOpenMenu] = useState<"session" | "term" | null>(null);

  // Close the open dropdown when the user clicks outside either chip.
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!openMenu) return;
    function handleOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpenMenu(null);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [openMenu]);

  // Resolve the selected session record from the sessions array so the
  // chip label stays in sync with the id even when the parent's list of
  // sessions changes.
  const selectedSession = useMemo(
    () => sessions.find((s) => s.id === selectedSessionId) ?? null,
    [sessions, selectedSessionId],
  );

  // Terms of the selected session — populates the term dropdown.
  const termsForSelectedSession = selectedSession?.terms ?? [];

  const selectedTerm = useMemo(
    () => termsForSelectedSession.find((t) => t.id === selectedTermId) ?? null,
    [termsForSelectedSession, selectedTermId],
  );

  // ── Handlers ──────────────────────────────────────────────────────────

  function handleSessionSelect(session: SessionListItem) {
    // On session change, prefer the session's current term (there's at most
    // one). Falls back to the first term when none is marked current — which
    // covers past sessions where every term is closed. Empty string when the
    // session has no terms at all; the parent gates its queries on this.
    const nextCurrent = session.terms.find((t) => t.current);
    const nextTermId = nextCurrent?.id ?? session.terms[0]?.id ?? "";
    onChange(session.id, nextTermId);
    setOpenMenu(null);
  }

  function handleTermSelect(term: SessionTermItem) {
    onChange(selectedSessionId, term.id);
    setOpenMenu(null);
  }

  // Labels shown on the chip buttons. Dash fallback covers the brief window
  // between mount and the sessions query resolving, and any id-mismatch
  // corner case (e.g. a session that was deleted after the id was stored).
  const sessionLabel = selectedSession?.name ?? "—";
  const termLabel = selectedTerm?.name ?? "—";

  return (
    <div ref={containerRef} className="flex flex-col sm:flex-row gap-2 mb-4">
      {/* ── Session chip + dropdown ─────────────────────────────────── */}
      <div className="relative flex-1">
        <FilterChipButton
          Icon={CalendarRange}
          label="Session"
          value={sessionLabel}
          open={openMenu === "session"}
          disabled={isLoading || sessions.length === 0}
          onClick={() =>
            setOpenMenu((prev) => (prev === "session" ? null : "session"))
          }
        />
        {openMenu === "session" && sessions.length > 0 && (
          <FilterOptionsPanel>
            {sessions.map((session) => (
              <FilterOptionButton
                key={session.id}
                label={session.name}
                active={session.id === selectedSessionId}
                isCurrent={session.id === currentSessionId}
                onClick={() => handleSessionSelect(session)}
              />
            ))}
          </FilterOptionsPanel>
        )}
      </div>

      {/* ── Term chip + dropdown ────────────────────────────────────── */}
      <div className="relative flex-1">
        <FilterChipButton
          Icon={CalendarClock}
          label="Term"
          value={termLabel}
          open={openMenu === "term"}
          disabled={isLoading || termsForSelectedSession.length === 0}
          onClick={() =>
            setOpenMenu((prev) => (prev === "term" ? null : "term"))
          }
        />
        {openMenu === "term" && termsForSelectedSession.length > 0 && (
          <FilterOptionsPanel>
            {termsForSelectedSession.map((term) => (
              <FilterOptionButton
                key={term.id}
                label={term.name}
                active={term.id === selectedTermId}
                isCurrent={term.id === currentTermId}
                onClick={() => handleTermSelect(term)}
              />
            ))}
          </FilterOptionsPanel>
        )}
      </div>
    </div>
  );
}

// ── FilterChipButton ─────────────────────────────────────────────────────
// The clickable chip that opens each dropdown. Preserves the visual shape
// of the surrounding toolbar (icon · label · value · chevron) so the two
// chips read as siblings of the search box next to them.
function FilterChipButton({
  Icon,
  label,
  value,
  open,
  disabled,
  onClick,
}: {
  Icon: IconComponent;
  label: string;
  value: string;
  open: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-haspopup="listbox"
      aria-expanded={open}
      className={`cursor-pointer flex w-full items-center gap-2 px-3 py-2 text-xs border rounded-xl transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
        open
          ? "border-violet-400 bg-violet-50"
          : "border-slate-200 bg-white hover:border-violet-300"
      }`}
    >
      <Icon size={13} className="text-slate-400 shrink-0" />
      <span className="text-slate-400 shrink-0">{label}:</span>
      <span className="font-medium text-slate-700 truncate">{value}</span>
      <ChevronDown
        size={12}
        className={`text-slate-400 ml-auto shrink-0 transition-transform ${
          open ? "rotate-180" : ""
        }`}
      />
    </button>
  );
}

// ── FilterOptionsPanel ───────────────────────────────────────────────────
// Absolutely-positioned popover that hosts the option list. Extracted so
// the dropdown chrome is identical between both chips. max-h + overflow-y
// keeps the list scrollable when a school accumulates many sessions.
function FilterOptionsPanel({ children }: { children: React.ReactNode }) {
  return (
    <ul
      role="listbox"
      className="absolute top-11 left-0 right-0 z-20 bg-white border border-slate-100 rounded-xl shadow-lg overflow-hidden py-1 max-h-64 overflow-y-auto"
    >
      {children}
    </ul>
  );
}

// ── FilterOptionButton ───────────────────────────────────────────────────
// Individual option row. The "Current" tag calls out the school's live
// session/term so the admin can tell it apart from historical entries at
// a glance.
function FilterOptionButton({
  label,
  active,
  isCurrent,
  onClick,
}: {
  label: string;
  active: boolean;
  isCurrent: boolean;
  onClick: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        role="option"
        aria-selected={active}
        onClick={onClick}
        className={`cursor-pointer w-full flex items-center justify-between gap-2 text-left px-4 py-2 text-xs transition-colors ${
          active
            ? "bg-violet-50 text-violet-700 font-semibold"
            : "text-slate-600 hover:bg-slate-50"
        }`}
      >
        <span className="truncate">{label}</span>
        {isCurrent && (
          <span className="ml-auto text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 shrink-0">
            Current
          </span>
        )}
      </button>
    </li>
  );
}
