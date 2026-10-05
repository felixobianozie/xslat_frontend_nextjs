"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Settingslayout.tsx
//
// Layout pieces for the School Policies and School Profile tabs, in the style of a modern settings page:
//
//   SettingsSection — a group title on the left, the controls on the right
//                     (stacked on small screens). Sections are separated by
//                     spacing instead of being boxed in cards.
//   SettingsFooter  — Reset and Save buttons at the end of a settings form.
//
// These are presentational only; the forms that use them own the data.
// ─────────────────────────────────────────────────────────────────────────────

import type { ReactNode } from "react";

import { SaveButton } from "./Configui";

interface SettingsSectionProps {
  title: string;
  children: ReactNode;
}

export function SettingsSection({ title, children }: SettingsSectionProps) {
  return (
    <section className="grid grid-cols-1 items-start gap-x-12 gap-y-4 py-7 first:pt-2 lg:grid-cols-[17rem_minmax(0,1fr)]">
      <header>
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      </header>

      <div className="divide-y rounded-xl divide-slate-100 bg-white px-5 my-5 ring-1 ring-slate-200">
        {children}
      </div>
    </section>
  );
}

interface SettingsFooterProps {
  hasChanges: boolean;
  isSaving: boolean;
  onReset: () => void;
  onSave: () => void;
}

export function SettingsFooter({
  hasChanges,
  isSaving,
  onReset,
  onSave,
}: SettingsFooterProps) {
  return (
    <div className="flex items-center justify-end gap-2 border-t border-slate-200 py-8">
      <button
        type="button"
        onClick={onReset}
        disabled={!hasChanges || isSaving}
        className="cursor-pointer rounded-xl px-4 py-2 text-xs text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Reset
      </button>
      <SaveButton
        label="Save changes"
        onClick={onSave}
        isPending={isSaving}
        disabled={!hasChanges}
      />
    </div>
  );
}
