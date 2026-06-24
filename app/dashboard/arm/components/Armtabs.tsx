"use client";

// ─────────────────────────────────────────────────────────────────────────────
// ArmTabs.tsx
//
// Tab navigation for the arm detail page.  Follows the same visual pattern as
// the staff tab buttons in StaffTabArea:
// - Container has a thin indigo bottom border that the active tab's thicker
//   red bottom border sits on top of.
// - On desktop (md+): inline tab buttons whose active state is shown via a
//   3px red bottom border.
// - On mobile: the active tab name appears underlined on the left and a
//   compact violet dropdown picker on the right lets the user switch tabs.
//   The dropdown lists every tab except the currently active one.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

export const TAB_NAMES = [
  "Class Members",
  "Subjects",
  "Results",
  "Class Teacher",
  "Grading System",
  "Pass Rule",
] as const;

interface ArmTabsProps {
  activeIndex: number;
  onChange: (index: number) => void;
}

export default function ArmTabs({ activeIndex, onChange }: ArmTabsProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  // Ref for the mobile dropdown wrapper — used to detect outside clicks
  const mobileDropdownRef = useRef<HTMLDivElement>(null);

  // Close the mobile dropdown when the user clicks anywhere outside it
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (
        mobileDropdownRef.current &&
        !mobileDropdownRef.current.contains(e.target as Node)
      ) {
        setMobileOpen(false);
      }
    }
    if (mobileOpen) {
      document.addEventListener("mousedown", handleOutside);
    }
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [mobileOpen]);

  const activeLabel = TAB_NAMES[activeIndex];

  return (
    <div>
      {/* ── Tab bar ──────────────────────────────────────────────────────── */}
      <div className="relative border-b border-indigo-400 h-10 mb-6">
        {/* Desktop: inline tab buttons */}
        <div className="hidden md:flex absolute -bottom-0.5 left-0">
          {TAB_NAMES.map((name, index) => (
            <button
              key={name}
              onClick={() => onChange(index)}
              className={`p-2 text-sm font-medium border-b-[3px] transition-all duration-200 cursor-pointer whitespace-nowrap
                ${
                  activeIndex === index
                    ? "border-b-red-700 text-black"
                    : "border-b-transparent text-slate-500 hover:text-black hover:border-b-red-700 hover:scale-105"
                }`}
            >
              {name}
            </button>
          ))}
        </div>

        {/* Mobile: dropdown picker with outside-click dismissal */}
        <div
          ref={mobileDropdownRef}
          className="md:hidden absolute right-0 bottom-1"
        >
          <button
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-expanded={mobileOpen}
            aria-haspopup="listbox"
            className="flex items-center gap-2 bg-violet-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg cursor-pointer"
          >
            <span>{activeLabel}</span>
            <ChevronDown
              size={14}
              className={`transition-transform duration-200 ${mobileOpen ? "rotate-180" : ""}`}
            />
          </button>

          {mobileOpen && (
            <div
              role="listbox"
              className="absolute right-0 top-9 z-20 bg-white border border-slate-100 rounded-xl shadow-lg overflow-hidden w-44"
            >
              {/* Only show tabs other than the currently active one */}
              {TAB_NAMES.map((name, index) => {
                if (index === activeIndex) return null;
                return (
                  <button
                    key={name}
                    role="option"
                    onClick={() => {
                      onChange(index);
                      setMobileOpen(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-violet-50 hover:text-violet-700 transition-colors cursor-pointer"
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Mobile: active tab name underlined on the left */}
        <div className="md:hidden absolute -bottom-0.5 left-0">
          <span className="block text-sm font-medium text-slate-700 border-b-[3px] border-b-red-700 pb-2 px-1">
            {activeLabel}
          </span>
        </div>
      </div>
    </div>
  );
}
