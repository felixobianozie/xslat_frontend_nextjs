"use client";

// ─────────────────────────────────────────────────────────────────────────────
// SubjectActionMenu.tsx
//
// Action menu for each subject row in the Subjects tab. Mirrors
// ClassMemberActionMenu but with subject-specific actions.
//
// Actions:
//   onView        → open View Assessment panel (read-only score grid)
//   onRecord      → open Record Assessment panel (editable score grid)
//   onAssign      → open Assign Subject Teachers panel
//   onUnassign    → open Remove Subject Teachers panel
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ClipboardList,
  Eye,
  MoreHorizontal,
  UserMinus,
  UserPlus,
} from "lucide-react";

interface SubjectActionMenuProps {
  subjectId: string;
  onView: () => void;
  onRecord: () => void;
  onAssign: () => void;
  onUnassign: () => void;
}

const PANEL_WIDTH = 220;

export default function SubjectActionMenu({
  subjectId,
  onView,
  onRecord,
  onAssign,
  onUnassign,
}: SubjectActionMenuProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPos({ top: rect.top, left: rect.left - PANEL_WIDTH - 4 });
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
      <button
        ref={triggerRef}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        className="cursor-pointer p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-slate-500 transition-colors"
        aria-label="Subject actions"
        aria-expanded={open}
      >
        <MoreHorizontal size={15} />
      </button>

      {open &&
        createPortal(
          <div
            ref={panelRef}
            id={`subject-action-${subjectId}`}
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
            <MenuItem
              icon={<Eye size={13} />}
              label="View Assessment"
              onClick={() => {
                onView();
                setOpen(false);
              }}
            />
            <MenuItem
              icon={<ClipboardList size={13} />}
              label="Record Assessment"
              onClick={() => {
                onRecord();
                setOpen(false);
              }}
            />
            <div className="border-t border-slate-50 my-1" />
            <MenuItem
              icon={<UserPlus size={13} />}
              label="Assign Teacher(s)"
              onClick={() => {
                onAssign();
                setOpen(false);
              }}
            />
            <MenuItem
              icon={<UserMinus size={13} />}
              label="Remove Teacher(s)"
              onClick={() => {
                onUnassign();
                setOpen(false);
              }}
            />
            <span
              aria-hidden="true"
              className="absolute left-full top-2.5 border-[7px] border-t-transparent border-b-transparent border-r-transparent border-l-white"
            />
          </div>,
          document.body,
        )}
    </div>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      role="menuitem"
      onClick={onClick}
      className="cursor-pointer w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-600 hover:bg-violet-50 hover:text-violet-700 transition-colors text-left"
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
