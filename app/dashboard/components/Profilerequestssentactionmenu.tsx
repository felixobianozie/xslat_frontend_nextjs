"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Profilerequestssentactionmenu.tsx
//
// Three-dot action menu for a row in the user's own profile-requests list.
//
// Actions:
//   * Resend Request — calls back to the parent component, which fires the
//                      PUT staff/requests/detail/ mutation (declined → pending).
//                      Disabled when the row's status isn't "declined" since
//                      the backend rejects any other transition from the user
//                      side.
//   * Delete Request — no backend endpoint yet, so this just triggers the
//                      "feature in the works" toast from the parent.
//
// Implementation mirrors Profilerequestactionmenu.tsx (portal-anchored panel,
// outside-click close, repositions on scroll/resize) so behaviour is
// consistent across the app.
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MoreHorizontal, RotateCw, Trash2 } from "lucide-react";

interface ProfileRequestsSentActionMenuProps {
  requestId: string;
  /** Current request status — controls whether Resend is enabled. */
  status: "pending" | "approved" | "declined" | "blacklisted";
  onResend: () => void;
  onDelete: () => void;
}

const PANEL_WIDTH = 176; // w-44 — keep in sync with style.width below

export default function ProfileRequestsSentActionMenu({
  requestId,
  status,
  onResend,
  onDelete,
}: ProfileRequestsSentActionMenuProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Reposition relative to the trigger button — used on open, scroll, resize.
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPos({
      top: rect.top,
      left: rect.left - PANEL_WIDTH - 4,
    });
  }, []);

  useEffect(() => {
    if (open) updatePosition();
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, updatePosition]);

  // Close on outside click — ignore clicks inside the trigger or panel.
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        panelRef.current?.contains(e.target as Node)
      ) {
        return;
      }
      setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  // Resend is only valid when the current status is "declined" — every other
  // transition from the user side is blocked by the serializer.
  const canResend = status === "declined";

  return (
    <div className="relative w-fit">
      <button
        ref={triggerRef}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className="cursor-pointer p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-slate-500 transition-colors"
        aria-label="Request actions"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <MoreHorizontal size={15} />
      </button>

      {open &&
        createPortal(
          <div
            ref={panelRef}
            id={`req-sent-action-menu-${requestId}`}
            role="menu"
            style={{
              position: "fixed",
              top: pos.top,
              left: pos.left,
              width: PANEL_WIDTH,
              zIndex: 9999,
            }}
            className="bg-white border border-slate-100 rounded-xl shadow-lg py-1"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              role="menuitem"
              disabled={!canResend}
              onClick={() => {
                if (!canResend) return;
                onResend();
                setOpen(false);
              }}
              className={`cursor-pointer w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-colors text-left ${
                canResend
                  ? "text-violet-700 hover:bg-violet-50"
                  : "text-slate-300 cursor-not-allowed"
              }`}
            >
              <RotateCw size={13} />
              Resend Request
            </button>

            <div className="border-t border-slate-50 mt-1 pt-1">
              <button
                role="menuitem"
                onClick={() => {
                  onDelete();
                  setOpen(false);
                }}
                className="cursor-pointer w-full flex items-center gap-2.5 px-3 py-2 text-xs text-red-500 hover:bg-red-50 transition-colors text-left"
              >
                <Trash2 size={13} />
                Delete Request
              </button>
            </div>

            {/* Right-pointing arrow that visually anchors the panel to the
                trigger button. Same shape used by the school-admin menu. */}
            <span
              aria-hidden="true"
              className="absolute left-full top-2.5 border-[7px] border-t-transparent border-b-transparent border-r-transparent border-l-white drop-shadow-[1px_0_0_#f1f5f9]"
            />
          </div>,
          document.body,
        )}
    </div>
  );
}
