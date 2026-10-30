"use client";

// ─────────────────────────────────────────────────────────────────────────────
// BroadsheetDetail.tsx
//
// Orchestrator for the broadsheet detail page. Holds the local UI state
// (which view is active, what's typed in the search box, the print ref) and
// composes the toolbar + active view + grading reference + hidden printable
// template.
//
// Why does this component own state, not the provider?
//   The view-toggle and search query are pure UI concerns — they don't
//   need to be observable by any other page or persisted across navigation.
//   Keeping them local here means no extra context-value churn and no
//   redundant re-renders in the cognitive/affective/psychomotor tables.
// ─────────────────────────────────────────────────────────────────────────────

import { useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import { ArrowUpDown, Check, Download, Printer, Search } from "lucide-react";
import { toast } from "react-toastify";

import DropdownPanel from "../../../components/Dropdownpanel";
import TableLoader from "../../../components/Tableloader";
import { useBroadsheetDetails } from "../context/BroadsheetDetailsProvider";
import {
  BROADSHEET_SORT_OPTIONS,
  DEFAULT_BROADSHEET_SORT,
  type BroadsheetSort,
} from "../broadsheetsort";
import BroadsheetRecordSelector, {
  type BroadsheetView,
} from "./BroadsheetRecordSelector";
import BroadsheetCognitiveView from "./BroadsheetCognitiveView";
import BroadsheetAffectiveView from "./BroadsheetAffectiveView";
import BroadsheetPsychomotorView from "./BroadsheetPsychomotorView";
import BroadsheetGradingReference from "./BroadsheetGradingReference";
import PrintableBroadsheet from "./PrintableBroadsheet";

export default function BroadsheetDetail() {
  const { arm, isPending } = useBroadsheetDetails();

  // ── Local UI state ───────────────────────────────────────────────────
  const [view, setView] = useState<BroadsheetView>("cognitive");
  const [searchQuery, setSearchQuery] = useState("");

  // The order of the students in every table and in the printout. The menu
  // hangs from its button in a portal, so a short table cannot clip it.
  const [sort, setSort] = useState<BroadsheetSort>(DEFAULT_BROADSHEET_SORT);
  const [sortOpen, setSortOpen] = useState(false);
  const sortTriggerRef = useRef<HTMLButtonElement>(null);
  const activeSortLabel =
    BROADSHEET_SORT_OPTIONS.find((option) => option.value === sort)?.label ??
    "Sort";

  // Ref attached to the hidden PrintableBroadsheet. react-to-print uses this
  // to clone the subtree into a print window. The v3+ API uses `contentRef`
  // (not `content`) — passing a ref directly is the recommended path.
  const printRef = useRef<HTMLDivElement>(null);

  // Dynamic document title for the print preview — includes the arm label
  // so saved PDFs land with a meaningful filename.
  const printTitle = arm
    ? `${arm.level.section.abbr}-${arm.level.abbr}-${arm.abbr}-broadsheet`
    : "broadsheet";

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: printTitle,
    // A4 landscape — the broadsheet has many columns, portrait would
    // truncate them at the page edge.
    pageStyle: `
      @page { size: A4 landscape; margin: 12mm; }
      @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }
    `,
  });

  // PDF download is conceptually similar to printing but uses a different
  // pipeline (server-side rendering or a client-side PDF lib). Not wired
  // yet; surface a friendly toast so users know it's coming.
  function handleDownloadPdf() {
    toast.info(
      "PDF download is in the works — use Print → Save as PDF for now.",
    );
  }

  // ── Loading state ────────────────────────────────────────────────────
  // The provider's isPending flag tracks the arm fetch specifically;
  // students/subjects will already be in flight too and will fill in
  // shortly. Showing the table loader at this top level keeps the page
  // simple — no flicker between three nested loaders.
  if (isPending) {
    return <TableLoader rows={8} className="my-4" />;
  }

  return (
    <div className="space-y-6">
      {/* ── Toolbar ──────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* View selector — drives which table renders below. */}
        <BroadsheetRecordSelector value={view} onChange={setView} />

        {/* Right-side cluster: search input + print + download buttons. */}
        <div className="flex flex-col sm:flex-row gap-2 lg:items-center">
          <div className="relative flex-1 sm:flex-none">
            <Search
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search student…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-56 pl-8 pr-3 py-2 text-xs text-slate-600 border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Sort — overall total or gender. Applies to every table and to
                what is printed. */}
            <div className="relative">
              <button
                ref={sortTriggerRef}
                type="button"
                onClick={() => setSortOpen((open) => !open)}
                aria-haspopup="menu"
                aria-expanded={sortOpen}
                className={`cursor-pointer flex items-center justify-center gap-1.5 px-3 py-2 text-xs border rounded-xl transition-colors ${
                  sort !== DEFAULT_BROADSHEET_SORT
                    ? "border-violet-400 bg-violet-50 text-violet-700"
                    : "border-slate-200 bg-white text-slate-700 hover:border-violet-300 hover:bg-violet-50"
                }`}
              >
                <ArrowUpDown size={12} />
                <span className="hidden sm:inline">{activeSortLabel}</span>
                <span className="sm:hidden">Sort</span>
              </button>

              <DropdownPanel
                open={sortOpen}
                onClose={() => setSortOpen(false)}
                anchorRef={sortTriggerRef}
                width={224}
                align="right"
                label="Sort students"
              >
                <div className="py-1">
                  {BROADSHEET_SORT_OPTIONS.map((option) => {
                    const isActive = sort === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setSort(option.value);
                          setSortOpen(false);
                        }}
                        className={`cursor-pointer w-full flex items-center justify-between px-4 py-2 text-left text-xs transition-colors ${
                          isActive
                            ? "bg-violet-50 font-semibold text-violet-700"
                            : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <span>{option.label}</span>
                        {isActive && <Check size={12} />}
                      </button>
                    );
                  })}
                </div>
              </DropdownPanel>
            </div>

            <button
              type="button"
              onClick={() => handlePrint()}
              className="cursor-pointer flex items-center justify-center gap-1.5 px-3 py-2 text-xs text-slate-700 border border-slate-200 bg-white rounded-xl hover:border-violet-300 hover:bg-violet-50 transition-colors"
              aria-label="Print broadsheet"
            >
              <Printer size={12} />
              <span className="hidden sm:inline">Print</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="cursor-pointer flex items-center justify-center gap-1.5 px-3 py-2 text-xs text-white bg-violet-600 rounded-xl hover:bg-violet-700 transition-colors"
              aria-label="Download as PDF"
            >
              <Download size={12} />
              <span className="hidden sm:inline">Download PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Active view ─────────────────────────────────────────────── */}
      {/* Conditionally render rather than show/hide so each table only
          mounts when active — keeps DOM size and React reconciliation light
          when there are 200+ students × 10+ subjects. */}
      {view === "cognitive" && (
        <BroadsheetCognitiveView searchQuery={searchQuery} sort={sort} />
      )}
      {view === "affective" && (
        <BroadsheetAffectiveView searchQuery={searchQuery} sort={sort} />
      )}
      {view === "psychomotor" && (
        <BroadsheetPsychomotorView searchQuery={searchQuery} sort={sort} />
      )}

      {/* ── Grading reference ───────────────────────────────────────── */}
      <BroadsheetGradingReference />

      {/* ── Hidden print template ───────────────────────────────────── */}
      {/* Kept in the DOM (not display:none) so refs and layout work, but
          collapsed to zero height so it doesn't take up screen space. */}
      <div className="h-0 overflow-hidden" aria-hidden="true">
        <PrintableBroadsheet ref={printRef} sort={sort} />
      </div>
    </div>
  );
}
