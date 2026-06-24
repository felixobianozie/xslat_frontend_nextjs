"use client";

// ─────────────────────────────────────────────────────────────────────────────
// StaffTabArea.tsx
//
// Manages the active tab state and renders the correct tab content.
// Two tabs: "Staff List" and "Profile Requests".
//
// On mobile a dropdown replaces the tab bar.  The dropdown now closes when
// the user clicks anywhere outside it (consistent with other dropdowns).
//
// initialPortfolios is the full server-fetched paginated envelope — passed to
// StaffList as initialData so it can hydrate total_pages and count accurately.
// initialRequests is the server-fetched pending requests array — passed to
// ProfileRequests as initialData.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import dynamic from "next/dynamic";
import StaffList from "./Stafflist";
import type { PaginatedResponse } from "../page";
import TableLoader from "../../components/Tableloader";

// Lazy-load ProfileRequests so it doesn't render until the user opens that tab
const ProfileRequests = dynamic(() => import("./Profilerequests"), {
  loading: () => <TableLoader rows={4} className="mt-6" />,
});

const TABS = [
  { label: "Staff List", index: 0 },
  { label: "Profile Requests", index: 1 },
];

interface StaffTabAreaProps {
  /**
   * Full server-fetched paginated envelope for page 1 of staff portfolios.
   * Null when the server fetch failed — StaffList handles the empty state.
   */
  initialPortfolios: PaginatedResponse<StaffPortfolio> | null;
  /** Server-fetched pending profile requests — passed to ProfileRequests as initialData. */
  initialRequests: StaffProfReq[];
}

export default function StaffTabArea({
  initialPortfolios,
  initialRequests,
}: StaffTabAreaProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false);

  // Ref for the mobile dropdown wrapper — used to detect outside clicks
  const mobileDropdownRef = useRef<HTMLDivElement>(null);

  // Close the mobile dropdown when the user clicks outside it
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (
        mobileDropdownRef.current &&
        !mobileDropdownRef.current.contains(e.target as Node)
      ) {
        setMobileDropdownOpen(false);
      }
    }
    if (mobileDropdownOpen) {
      document.addEventListener("mousedown", handleOutside);
    }
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [mobileDropdownOpen]);

  const activeLabel = TABS[activeTab].label;

  return (
    <div>
      {/* ── Tab bar ──────────────────────────────────────────────────────── */}
      <div className="relative border-b border-indigo-400 h-10 mb-6">
        {/* Desktop: inline tab buttons */}
        <div className="hidden md:flex absolute -bottom-0.5 left-0">
          {TABS.map((tab) => (
            <button
              key={tab.index}
              onClick={() => setActiveTab(tab.index)}
              className={`p-2 text-sm font-medium border-b-[3px] transition-all duration-200 cursor-pointer
                ${
                  activeTab === tab.index
                    ? "border-b-red-700 text-black"
                    : "border-b-transparent text-slate-500 hover:text-black hover:border-b-red-700 hover:scale-105"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Mobile: dropdown picker with outside-click dismissal */}
        <div
          ref={mobileDropdownRef}
          className="md:hidden absolute right-0 bottom-1"
        >
          <button
            onClick={() => setMobileDropdownOpen((prev) => !prev)}
            aria-expanded={mobileDropdownOpen}
            aria-haspopup="listbox"
            className="flex items-center gap-2 bg-violet-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg"
          >
            <span>{activeLabel}</span>
            <ChevronDown
              size={14}
              className={`transition-transform duration-200 ${mobileDropdownOpen ? "rotate-180" : ""}`}
            />
          </button>

          {mobileDropdownOpen && (
            <div
              role="listbox"
              className="absolute right-0 top-9 z-20 bg-white border border-slate-100 rounded-xl shadow-lg overflow-hidden w-44"
            >
              {TABS.filter((t) => t.index !== activeTab).map((tab) => (
                <button
                  key={tab.index}
                  role="option"
                  onClick={() => {
                    setActiveTab(tab.index);
                    setMobileDropdownOpen(false);
                  }}
                  className="cursor-pointer w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-violet-50 hover:text-violet-700 transition-colors"
                >
                  {tab.label}
                </button>
              ))}
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

      {/* ── Tab content ──────────────────────────────────────────────────── */}
      {activeTab === 0 && <StaffList initialData={initialPortfolios} />}
      {activeTab === 1 && <ProfileRequests initialData={initialRequests} />}
    </div>
  );
}
