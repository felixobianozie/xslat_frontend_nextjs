"use client";

// ─────────────────────────────────────────────────────────────────────────────
// StudentActionMenu.tsx
//
// A three-dot button that opens a contextual dropdown with actions for a
// student row.
//
// Action set depends on whether the student is currently assigned to an arm:
//   Always shown:
//     - View Profile
//     - Delete Student (danger)
//   If student has a current arm:
//     - Remove from Class (danger)
//     - Change Class
//   If student has NO current arm:
//     - Assign Class
//
// Note: subject editing is intentionally NOT exposed here. That action now
// lives in the arm detail section instead of the student list.
//
// Portal-based positioning is identical to StaffActionMenu so the dropdown
// escapes any overflow-hidden ancestor and stays anchored to the trigger on
// scroll / resize.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  MoreHorizontal,
  Eye,
  UserMinus,
  Repeat,
  UserPlus,
  Trash2,
} from "lucide-react";

interface StudentActionMenuProps {
  studentId: string;
  /** True when the student has a current class arm. Drives which actions are shown. */
  hasArm: boolean;
  onViewProfile: () => void;
  onAssignClass: () => void;
  onChangeClass: () => void;
  onRemoveFromClass: () => void;
  onDelete: () => void;
}

// Width of the dropdown panel in pixels — must match the `width` style below.
const PANEL_WIDTH = 200; // ~12.5rem — slightly wider than staff to fit longer labels

export default function StudentActionMenu({
  studentId,
  hasArm,
  onViewProfile,
  onAssignClass,
  onChangeClass,
  onRemoveFromClass,
  onDelete,
}: StudentActionMenuProps) {
  const [open, setOpen] = useState(false);

  // Position of the dropdown panel, calculated from the trigger button's rect
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // ── Compute and store the dropdown's viewport position ──────────────────
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    // Align panel's RIGHT edge with the trigger's LEFT edge, plus a 4px gap
    const left = rect.left - PANEL_WIDTH - 4;
    const top = rect.top;
    setDropdownPos({ top, left });
  }, []);

  useEffect(() => {
    if (open) updatePosition();
  }, [open, updatePosition]);

  // Keep the panel anchored while the user scrolls or resizes
  useEffect(() => {
    if (!open) return;
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, updatePosition]);

  // Close on outside click
  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        panelRef.current?.contains(e.target as Node)
      )
        return;
      setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [open]);

  return (
    <div className="relative w-fit">
      {/* Trigger button — the three dots */}
      <button
        ref={triggerRef}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className="cursor-pointer p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-slate-500 transition-colors"
        aria-label="Student actions"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <MoreHorizontal size={15} />
      </button>

      {/* Portal — renders the dropdown panel directly into <body> */}
      {open &&
        createPortal(
          <div
            ref={panelRef}
            id={`student-action-menu-${studentId}`}
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
              label="View Profile"
              onClick={() => {
                onViewProfile();
                setOpen(false);
              }}
            />

            {/* Arm-dependent actions */}
            {hasArm ? (
              <>
                <MenuItem
                  icon={<Repeat size={13} />}
                  label="Change Class"
                  onClick={() => {
                    onChangeClass();
                    setOpen(false);
                  }}
                />
                <MenuItem
                  icon={<UserMinus size={13} />}
                  label="Remove from Class"
                  danger
                  onClick={() => {
                    onRemoveFromClass();
                    setOpen(false);
                  }}
                />
              </>
            ) : (
              <MenuItem
                icon={<UserPlus size={13} />}
                label="Assign Class"
                onClick={() => {
                  onAssignClass();
                  setOpen(false);
                }}
              />
            )}

            {/* Delete is always last and visually separated */}
            <div className="border-t border-slate-50 mt-1 pt-1">
              <MenuItem
                icon={<Trash2 size={13} />}
                label="Delete Student"
                danger
                onClick={() => {
                  onDelete();
                  setOpen(false);
                }}
              />
            </div>

            {/* Arrow pointer — points RIGHT toward the three-dot trigger */}
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
      className={`cursor-pointer w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-colors text-left
        ${
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
