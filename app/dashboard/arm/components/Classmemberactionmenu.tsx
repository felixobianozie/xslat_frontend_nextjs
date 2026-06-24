"use client";

// ─────────────────────────────────────────────────────────────────────────────
// ClassMemberActionMenu.tsx
//
// Action menu rendered next to each student row. Uses the same portal-anchored
// pattern as ArmActionMenu (in /arms) so it escapes overflow-hidden ancestors
// and stays positioned relative to its trigger during scroll/resize.
//
// Actions:
//   onView          → navigate to /dashboard/student?id=…
//   onEditSubjects  → open the Edit Student Subjects panel
//
// Note: class-arm membership changes (remove, change class) are intentionally
// owned by the student-management module. They are reachable via the student
// profile and are deliberately NOT exposed from the arm side.
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BookOpen, Eye, MoreHorizontal } from "lucide-react";

interface ClassMemberActionMenuProps {
  studentId: string;
  onView: () => void;
  onEditSubjects: () => void;
}

const PANEL_WIDTH = 200;

export default function ClassMemberActionMenu({
  studentId,
  onView,
  onEditSubjects,
}: ClassMemberActionMenuProps) {
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
        className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-slate-500 transition-colors cursor-pointer"
        aria-label="Student actions"
        aria-expanded={open}
      >
        <MoreHorizontal size={15} />
      </button>

      {open &&
        createPortal(
          <div
            ref={panelRef}
            id={`class-member-action-${studentId}`}
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
              label="View Profile"
              onClick={() => {
                onView();
                setOpen(false);
              }}
            />
            <MenuItem
              icon={<BookOpen size={13} />}
              label="Edit Subjects"
              onClick={() => {
                onEditSubjects();
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
      className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-colors text-left cursor-pointer ${
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
