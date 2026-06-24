"use client";

// ─────────────────────────────────────────────────────────────────────────────
// ArmActionMenu.tsx
//
// Three-dot button that opens a contextual dropdown with actions for an arm row:
//   View Class Arm           — navigates to /dashboard/arm?id=<arm_id>
//   Assign Class Teachers    — opens the teacher-assignment slide-in panel
//   Delete Class Arm         — danger action (asks for confirmation)
//
// Implementation mirrors StaffActionMenu: the dropdown is rendered via a React
// portal into document.body so it escapes any overflow-hidden ancestor (e.g.
// the table wrapper) and is positioned with getBoundingClientRect() relative
// to the viewport, then re-positioned on scroll/resize.
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Eye, MoreHorizontal, Trash2, UserCog } from "lucide-react";

interface ArmActionMenuProps {
  armId: string;
  onView: () => void;
  onAssignTeachers: () => void;
  onDelete: () => void;
}

// Width of the dropdown panel — must match the `width` style below.
const PANEL_WIDTH = 200; // w-50 doesn't exist; using a fixed px value to match

export default function ArmActionMenu({
  armId,
  onView,
  onAssignTeachers,
  onDelete,
}: ArmActionMenuProps) {
  const [open, setOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Position the dropdown to the LEFT of the trigger with a small gap. Re-run
  // on open and on scroll/resize so it stays anchored even while the page moves.
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

  // Close when the user clicks anywhere outside the trigger or the dropdown.
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

  return (
    <div className="relative w-fit">
      {/* Trigger — three-dot button */}
      <button
        ref={triggerRef}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        className="cursor-pointer p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-slate-500 transition-colors"
        aria-label="Class arm actions"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <MoreHorizontal size={15} />
      </button>

      {/*
        Portal — renders the dropdown panel directly into <body> so it escapes
        any overflow-hidden ancestor. `fixed` positioning + viewport coordinates
        from getBoundingClientRect keeps it visually attached to the trigger.
      */}
      {open &&
        createPortal(
          <div
            ref={panelRef}
            id={`arm-action-menu-${armId}`}
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
              label="View Class Arm"
              onClick={() => {
                onView();
                setOpen(false);
              }}
            />
            <MenuItem
              icon={<UserCog size={13} />}
              label="Assign Class Teachers"
              onClick={() => {
                onAssignTeachers();
                setOpen(false);
              }}
            />
            <div className="border-t border-slate-50 mt-1 pt-1">
              <MenuItem
                icon={<Trash2 size={13} />}
                label="Delete Class Arm"
                danger
                onClick={() => {
                  onDelete();
                  setOpen(false);
                }}
              />
            </div>

            {/* Arrow pointer toward the trigger — sits on the panel's right edge */}
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

// ── Reusable menu item ─────────────────────────────────────────────────────
function MenuItem({
  icon,
  label,
  danger = false,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      role="menuitem"
      onClick={onClick}
      className={`cursor-pointer w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-colors text-left ${
        danger
          ? "text-red-500 hover:bg-red-50"
          : "text-slate-600 hover:bg-violet-50 hover:text-violet-700"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
