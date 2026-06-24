"use client";

// ─────────────────────────────────────────────────────────────────────────────
// BroadsheetsListActionMenu.tsx
//
// Three-dot menu shown on every broadsheet row. The menu items are
// status-aware so the user only sees actions that are actually valid for the
// current state — this matches the backend's serializer-level transition
// rules:
//
//   broadsheet === "none"     → only "View" (nothing to approve/revoke yet)
//   broadsheet === "pending"  → View · Approve · Revoke
//   broadsheet === "approved" → View · Revoke
//   broadsheet === "revoked"  → only "View" (the teacher has to resubmit)
//
// The dropdown is rendered into a React portal so it can escape any
// overflow-hidden ancestor (the table wrapper, mobile card container, etc.).
// Pattern mirrors ArmActionMenu so the two pages feel the same.
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, Eye, MoreHorizontal, RotateCcw } from "lucide-react";

// Width of the dropdown panel — match the inline style below.
const PANEL_WIDTH = 200;

interface BroadsheetsListActionMenuProps {
  armId: string;
  // Current broadsheet status — drives which items appear.
  status: ClassArm["broadsheet"] | undefined;
  onView: () => void;
  onApprove: () => void;
  onRevoke: () => void;
}

export default function BroadsheetsListActionMenu({
  armId,
  status,
  onView,
  onApprove,
  onRevoke,
}: BroadsheetsListActionMenuProps) {
  const [open, setOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Position the dropdown to the LEFT of the trigger so it doesn't clip on
  // the right edge of the viewport. Re-run on scroll and resize so the
  // dropdown stays anchored even while the page moves under it.
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setDropdownPos({
      top: rect.top,
      left: rect.left - PANEL_WIDTH - 4,
    });
  }, []);

  useEffect(() => {
    if (open) updatePosition();
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    // Capture phase catches nested scroll containers too.
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, updatePosition]);

  // Close on click outside (anywhere that isn't the trigger or the panel).
  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        panelRef.current?.contains(e.target as Node)
      ) {
        return;
      }
      setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [open]);

  // Decide which actions are valid in the current status. View is always shown.
  const canApprove = status === "pending";
  const canRevoke = status === "pending" || status === "approved";

  return (
    <div className="relative w-fit">
      <button
        ref={triggerRef}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        className="cursor-pointer p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-slate-500 transition-colors"
        aria-label="Broadsheet actions"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <MoreHorizontal size={15} />
      </button>

      {open &&
        createPortal(
          <div
            ref={panelRef}
            id={`broadsheet-action-menu-${armId}`}
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
            <MenuItem
              icon={<Eye size={13} />}
              label="View Broadsheet"
              onClick={() => {
                onView();
                setOpen(false);
              }}
            />

            {canApprove && (
              <MenuItem
                icon={<CheckCircle2 size={13} />}
                label="Approve Broadsheet"
                tone="success"
                onClick={() => {
                  onApprove();
                  setOpen(false);
                }}
              />
            )}

            {canRevoke && (
              <div className="border-t border-slate-50 mt-1 pt-1">
                <MenuItem
                  icon={<RotateCcw size={13} />}
                  label="Revoke Broadsheet"
                  tone="danger"
                  onClick={() => {
                    onRevoke();
                    setOpen(false);
                  }}
                />
              </div>
            )}

            {/* Arrow pointer toward the trigger — visually anchors the menu */}
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

// ── Reusable menu item ──────────────────────────────────────────────────────
// `tone` controls the visual emphasis — neutral grey by default, green for
// affirmative actions (approve), red for destructive ones (revoke).
function MenuItem({
  icon,
  label,
  tone = "neutral",
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  tone?: "neutral" | "success" | "danger";
  onClick: () => void;
}) {
  const toneClasses =
    tone === "success"
      ? "text-emerald-700 hover:bg-emerald-50"
      : tone === "danger"
        ? "text-red-500 hover:bg-red-50"
        : "text-slate-600 hover:bg-violet-50 hover:text-violet-700";

  return (
    <button
      role="menuitem"
      onClick={onClick}
      className={`cursor-pointer w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-colors text-left ${toneClasses}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
