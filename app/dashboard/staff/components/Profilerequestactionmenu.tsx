"use client";

// ─────────────────────────────────────────────────────────────────────────────
// ProfileRequestActionMenu.tsx
//
// Action dropdown for profile-request rows:
//   Review Requester — opens the ProfileReviewPanel
//   Approve Request  — triggers the approve confirmation modal
//   Decline Request  — triggers the decline confirmation modal
//
// The dropdown is rendered via a React portal (into document.body) so it
// escapes any overflow-hidden ancestor — including the table wrapper — and
// never gets clipped. It is positioned with getBoundingClientRect() relative
// to the viewport, and updates on scroll/resize so it stays anchored to the
// trigger button at all times.
//
// Closes automatically on outside click.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { MoreHorizontal, Eye, CheckCircle, XCircle } from "lucide-react";

interface ProfileRequestActionMenuProps {
  requestId: string;
  onReview: () => void;
  onApprove: () => void;
  onDecline: () => void;
}

// Width of the dropdown panel in pixels — must match the `width` style below.
const PANEL_WIDTH = 176; // w-44 = 11rem = 176px at 16px base

export default function ProfileRequestActionMenu({
  requestId,
  onReview,
  onApprove,
  onDecline,
}: ProfileRequestActionMenuProps) {
  const [open, setOpen] = useState(false);

  // Position of the dropdown panel, calculated from the trigger button's rect
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

  // Ref for the trigger button (used to compute position)
  const triggerRef = useRef<HTMLButtonElement>(null);
  // Ref for the portal panel (used for outside-click detection)
  const panelRef = useRef<HTMLDivElement>(null);

  // ── Compute and store the dropdown's viewport position ──────────────────
  // Called every time the menu opens, and also on scroll/resize so the panel
  // tracks the trigger button even if the page moves while it is open.
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();

    // Align the panel's RIGHT edge with the trigger button's LEFT edge,
    // with a small gap (4 px) so the arrow visually bridges the two.
    const left = rect.left - PANEL_WIDTH - 4;
    // Align the panel's top with the trigger button's top
    const top = rect.top;

    setDropdownPos({ top, left });
  }, []);

  // Re-position whenever the menu opens
  useEffect(() => {
    if (open) updatePosition();
  }, [open, updatePosition]);

  // Keep the panel anchored while the user scrolls or resizes the viewport
  useEffect(() => {
    if (!open) return;
    window.addEventListener("scroll", updatePosition, true); // capture phase catches nested scrolls
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, updatePosition]);

  // ── Close on outside click ───────────────────────────────────────────────
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      // Ignore clicks inside the trigger button or the dropdown panel itself
      if (
        triggerRef.current?.contains(e.target as Node) ||
        panelRef.current?.contains(e.target as Node)
      )
        return;
      setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  return (
    // The wrapper only needs to wrap the trigger; the dropdown lives in a portal
    <div className="relative w-fit">
      {/* Trigger button */}
      <button
        ref={triggerRef}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-slate-500 transition-colors"
        aria-label="Request actions"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <MoreHorizontal size={15} />
      </button>

      {/*
        Portal — renders the dropdown panel directly into <body> so it escapes
        any overflow-hidden ancestor (e.g. the table wrapper div).
        `fixed` positioning + viewport coordinates from getBoundingClientRect
        keeps it visually attached to the trigger button.
      */}
      {open &&
        createPortal(
          <div
            ref={panelRef}
            id={`req-action-menu-${requestId}`}
            role="menu"
            style={{
              position: "fixed",
              top: dropdownPos.top,
              left: dropdownPos.left,
              width: PANEL_WIDTH,
              zIndex: 9999,
            }}
            className="bg-white border border-slate-100 rounded-xl shadow-lg py-1"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              role="menuitem"
              onClick={() => {
                onReview();
                setOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-600 hover:bg-violet-50 hover:text-violet-700 transition-colors text-left"
            >
              <Eye size={13} />
              Review Requester
            </button>

            <button
              role="menuitem"
              onClick={() => {
                onApprove();
                setOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-emerald-700 hover:bg-emerald-50 transition-colors text-left"
            >
              <CheckCircle size={13} />
              Approve Request
            </button>

            <div className="border-t border-slate-50 mt-1 pt-1">
              <button
                role="menuitem"
                onClick={() => {
                  onDecline();
                  setOpen(false);
                }}
                className="cursor-pointer w-full flex items-center gap-2.5 px-3 py-2 text-xs text-red-500 hover:bg-red-50 transition-colors text-left"
              >
                <XCircle size={13} />
                Decline Request
              </button>
            </div>

            {/*
              Arrow pointer — points RIGHT toward the three-dot trigger.
              Positioned on the right edge of the panel, vertically centred
              with the trigger button (top-2.5 aligns with the button icon).
            */}
            <span
              aria-hidden="true"
              className="absolute left-full top-2.5 border-[7px] border-t-transparent border-b-transparent border-r-transparent border-l-white
                         drop-shadow-[1px_0_0_#f1f5f9]"
            />
          </div>,
          document.body,
        )}
    </div>
  );
}
