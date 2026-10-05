"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Configpanel.tsx
//
// Full-width editor panel used by the grading, assessment, pass rule, school
// calendar and arm assignment tabs. It follows the layout of the dashboard's
// create panels (back link, grey header, form body, footer with Cancel / Save).
// ─────────────────────────────────────────────────────────────────────────────

import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";

import { SaveButton } from "./Configui";

interface ConfigPanelProps {
  title: string;
  subtitle?: string;
  submitLabel: string;
  isPending: boolean;
  canSubmit: boolean;
  onSubmit: () => void;
  onClose: () => void;
  children: ReactNode;
}

export default function ConfigPanel({
  title,
  subtitle,
  submitLabel,
  isPending,
  canSubmit,
  onSubmit,
  onClose,
  children,
}: ConfigPanelProps) {
  function handleClose() {
    if (!isPending) onClose();
  }

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={handleClose}
        className="cursor-pointer flex items-center gap-1 text-xs text-red-600 hover:text-red-700 mb-5 transition-all hover:scale-105 w-fit"
      >
        <ChevronLeft size={14} />
        <span>Back</span>
      </button>

      <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm mb-10 text-black bg-white">
        <div className="bg-slate-100 border-b border-slate-200 px-5 py-4">
          <h2 className="text-sm font-bold text-slate-800">{title}</h2>
          {subtitle && (
            <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
          )}
        </div>

        <div className="px-5 py-6 flex flex-col gap-5">{children}</div>

        <div className="flex items-center justify-end gap-2 bg-slate-50 border-t border-slate-100 px-5 py-4">
          <button
            type="button"
            onClick={handleClose}
            disabled={isPending}
            className="cursor-pointer px-4 py-2 text-xs border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <SaveButton
            label={submitLabel}
            onClick={onSubmit}
            isPending={isPending}
            disabled={!canSubmit}
          />
        </div>
      </div>
    </div>
  );
}
