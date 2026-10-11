"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Configtabarea.tsx
//
// Tab bar and tab content for the Configurations page. Inline tabs from lg
// upwards and a dropdown on smaller screens, so the eight tabs always fit. Only the active tab is mounted, so a tab fetches its data
// the first time it is opened.
//
// The data was fetched on the server in page.tsx and lives in
// ConfigurationsProvider; each tab reads the slice it needs from there.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

import ArmAssignmentsTab from "./Armassignmentstab";
import AssessmentFormatsTab from "./Assessmentformatstab";
import CalendarTab from "./Calendartab";
import GradingFormatsTab from "./Gradingformatstab";
import PassRulesTab from "./Passrulestab";
import PoliciesTab from "./Policiestab";
import SchoolProfileTab from "./Schoolprofiletab";
import SubjectManagementTab from "./Subjectmanagementtab";

const TAB_LABELS = [
  "School Policies",
  "School Profile",
  "Grading",
  "Assessment Formats",
  "Pass Rules",
  "Subjects",
  "School Calendar",
  "Arm Settings",
];

export default function ConfigTabArea() {
  const [activeTab, setActiveTab] = useState(0);
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false);
  const mobileDropdownRef = useRef<HTMLDivElement>(null);

  // Close the mobile dropdown when the user clicks outside it.
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

  const activeLabel = TAB_LABELS[activeTab];

  return (
    <div>
      <div className="relative border-b border-indigo-400 h-10 mb-6">
        {/* Desktop: inline tab buttons */}
        <div className="hidden lg:flex absolute -bottom-0.5 left-0">
          {TAB_LABELS.map((label, index) => (
            <button
              key={label}
              type="button"
              onClick={() => setActiveTab(index)}
              className={`p-2 text-sm font-medium border-b-[3px] transition-all duration-200 cursor-pointer ${
                activeTab === index
                  ? "border-b-red-700 text-black"
                  : "border-b-transparent text-slate-500 hover:text-black hover:border-b-red-700 hover:scale-105"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Mobile: dropdown picker */}
        <div
          ref={mobileDropdownRef}
          className="lg:hidden absolute right-0 bottom-1"
        >
          <button
            type="button"
            onClick={() => setMobileDropdownOpen((open) => !open)}
            aria-expanded={mobileDropdownOpen}
            aria-haspopup="listbox"
            className="flex items-center gap-2 bg-violet-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg"
          >
            <span>{activeLabel}</span>
            <ChevronDown
              size={14}
              className={`transition-transform duration-200 ${
                mobileDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {mobileDropdownOpen && (
            <div
              role="listbox"
              className="absolute right-0 top-9 z-20 bg-white border border-slate-100 rounded-xl shadow-lg overflow-hidden w-48"
            >
              {TAB_LABELS.map((label, index) =>
                index === activeTab ? null : (
                  <button
                    key={label}
                    type="button"
                    role="option"
                    aria-selected={false}
                    onClick={() => {
                      setActiveTab(index);
                      setMobileDropdownOpen(false);
                    }}
                    className="cursor-pointer w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-violet-50 hover:text-violet-700 transition-colors"
                  >
                    {label}
                  </button>
                ),
              )}
            </div>
          )}
        </div>

        {/* Mobile: active tab name underlined on the left */}
        <div className="lg:hidden absolute -bottom-0.5 left-0">
          <span className="block text-sm font-medium text-slate-700 border-b-[3px] border-b-red-700 pb-2 px-1">
            {activeLabel}
          </span>
        </div>
      </div>

      {activeTab === 0 && <PoliciesTab />}
      {activeTab === 1 && <SchoolProfileTab />}
      {activeTab === 2 && <GradingFormatsTab />}
      {activeTab === 3 && <AssessmentFormatsTab />}
      {activeTab === 4 && <PassRulesTab />}
      {activeTab === 5 && <SubjectManagementTab />}
      {activeTab === 6 && <CalendarTab />}
      {activeTab === 7 && <ArmAssignmentsTab />}
    </div>
  );
}
