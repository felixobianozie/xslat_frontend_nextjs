"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Paginator.tsx  (shared / reusable)
//
// A fully controlled, accessible paginator used across list pages.
// Navigation form:  ⟪ first  ‹ prev  (current) of (total)  next ›  last ⟫
//
// Page size is read-only and sourced from the centralised env variable
// NEXT_PUBLIC_PAGE_SIZE (set in .env.local).  It is displayed for the user's
// awareness but cannot be changed from within the component.
//
// Props
//   currentPage  — 1-based current page number
//   totalPages   — total number of pages
//   onPageChange — callback fired with the new page number
// ─────────────────────────────────────────────────────────────────────────────

import {
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// Read the page size that was set in .env.local.
// Falls back to 10 if the variable is missing or not a valid number.
const PAGE_SIZE = (() => {
  const raw = process.env.NEXT_PUBLIC_PAGE_SIZE;
  const parsed = parseInt(raw ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 10;
})();

interface PaginatorProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Paginator({
  currentPage,
  totalPages,
  onPageChange,
}: PaginatorProps) {
  // Safety clamp: ensure we never display a broken state
  const safeCurrent = Math.max(1, Math.min(currentPage, totalPages));
  const safeTotal = Math.max(1, totalPages);

  const isFirst = safeCurrent <= 1;
  const isLast = safeCurrent >= safeTotal;

  // Shared classes for nav buttons
  const navBtn = (disabled: boolean) =>
    `flex items-center justify-center w-7 h-7 rounded-lg transition-colors
     ${
       disabled
         ? "text-slate-300 cursor-not-allowed"
         : "text-slate-500 hover:bg-violet-100 hover:text-violet-700"
     }`;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-3 text-xs text-slate-500 select-none">
      {/* ── Page size indicator (read-only) ─────────────────────────────── */}
      <span className="border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 text-slate-400 text-[11px]">
        {PAGE_SIZE} rows / page
      </span>

      {/* ── Navigation controls ──────────────────────────────────────────── */}
      <div className="flex items-center gap-1">
        {/* First page */}
        <button
          aria-label="First page"
          disabled={isFirst}
          onClick={() => onPageChange(1)}
          className={navBtn(isFirst)}
        >
          <ChevronsLeft size={14} />
        </button>

        {/* Previous page */}
        <button
          aria-label="Previous page"
          disabled={isFirst}
          onClick={() => onPageChange(safeCurrent - 1)}
          className={navBtn(isFirst)}
        >
          <ChevronLeft size={14} />
        </button>

        {/* Current / Total display */}
        <span className="mx-2 font-medium text-slate-700 whitespace-nowrap">
          <span className="inline-flex items-center justify-center min-w-7 h-7 px-2 rounded-lg bg-green-700 text-white font-semibold text-xs shadow-sm shadow-violet-200">
            {safeCurrent}
          </span>
          <span className="mx-1.5 text-slate-400">of</span>
          <span className="inline-flex items-center justify-center min-w-7 h-7 px-2 rounded-lg bg-slate-200 text-slate-600 font-semibold text-xs">
            {safeTotal}
          </span>
        </span>

        {/* Next page */}
        <button
          aria-label="Next page"
          disabled={isLast}
          onClick={() => onPageChange(safeCurrent + 1)}
          className={navBtn(isLast)}
        >
          <ChevronRight size={14} />
        </button>

        {/* Last page */}
        <button
          aria-label="Last page"
          disabled={isLast}
          onClick={() => onPageChange(safeTotal)}
          className={navBtn(isLast)}
        >
          <ChevronsRight size={14} />
        </button>
      </div>
    </div>
  );
}

// Export PAGE_SIZE so parent components can read it when building API query params
export { PAGE_SIZE };
