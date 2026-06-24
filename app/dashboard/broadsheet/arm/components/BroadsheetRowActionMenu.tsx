"use client";

// ─────────────────────────────────────────────────────────────────────────────
// BroadsheetRowActionMenu.tsx
//
// Three-dot menu on every student row inside the broadsheet tables. Exposes
// three actions:
//   - Performance Info   — opens a modal with the student's full performance
//                           summary (totals, position, decision).
//   - Result Access Info — placeholder for the "report card access" feature
//                           (not yet backed by a backend endpoint; surfaces
//                           the "in works" toast).
//   - Print Student Result — placeholder for per-student PDF print.
//
// Same portal-and-position pattern as ArmActionMenu / BroadsheetsListActionMenu
// so the visual feel is consistent across the app.
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Eye, Lock, MoreHorizontal, Printer } from "lucide-react";

const PANEL_WIDTH = 200;

interface BroadsheetRowActionMenuProps {
  studentId: string;
  onPerformanceInfo: () => void;
  onResultAccessInfo: () => void;
  onPrintResult: () => void;
}

export default function BroadsheetRowActionMenu({
  studentId,
  onPerformanceInfo,
  onResultAccessInfo,
  onPrintResult,
}: BroadsheetRowActionMenuProps) {
  const [open, setOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Position the panel to the RIGHT of the trigger so the panel doesn't
  // disappear behind the table's left edge when the user opens it on a
  // narrow viewport. (The list page positions to the left because the
  // action column sits flush right; here the action column sits flush
  // left.)
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setDropdownPos({
      top: rect.top,
      left: rect.right + 4,
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

  // Close on outside click.
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
        aria-label="Student actions"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <MoreHorizontal size={13} />
      </button>

      {open &&
        createPortal(
          <div
            ref={panelRef}
            id={`broadsheet-row-action-menu-${studentId}`}
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
              label="Performance Info"
              onClick={() => {
                onPerformanceInfo();
                setOpen(false);
              }}
            />
            <MenuItem
              icon={<Lock size={13} />}
              label="Result Access Info"
              onClick={() => {
                onResultAccessInfo();
                setOpen(false);
              }}
            />
            <div className="border-t border-slate-50 mt-1 pt-1">
              <MenuItem
                icon={<Printer size={13} />}
                label="Print Student Result"
                onClick={() => {
                  onPrintResult();
                  setOpen(false);
                }}
              />
            </div>

            {/* Arrow pointer — anchors the panel visually to its trigger. */}
            <span
              aria-hidden="true"
              className="absolute right-full top-2.5 border-[7px] border-t-transparent border-b-transparent border-l-transparent border-r-white drop-shadow-[-1px_0_0_#f1f5f9]"
            />
          </div>,
          document.body,
        )}
    </div>
  );
}

// ── Reusable menu item ──────────────────────────────────────────────────
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
