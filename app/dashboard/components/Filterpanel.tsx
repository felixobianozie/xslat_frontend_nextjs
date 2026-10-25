"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Filterpanel.tsx
//
// The Filter button, its panel and a quick Reset button, shared by the staff
// and student lists.
//
// How it works:
//  - The panel shows groups of choices. A "multi" group lets several values be
//    ticked together; a "single" group allows one, and choosing it again
//    clears it.
//  - What is ticked is a DRAFT. Nothing is requested until Apply is pressed,
//    so a half-finished selection never sends a request. Apply sends the
//    whole selection at once and closes the panel. Closing the panel any
//    other way (a click outside, Escape) throws the draft away, and the next
//    opening starts from what is applied.
//  - Reset, in the panel or on the Filter button, puts every filter back to
//    its default at once. A small red × badge on the button's top-right
//    corner shows only while something is applied, so a filter can be
//    cleared without opening the panel.
//  - Shortcuts (optional) tick a ready-made set of values in one click, still
//    as a draft.
//
// The list owns the applied filters and what they mean to the backend; this
// component only edits them.
// ─────────────────────────────────────────────────────────────────────────────

import { useRef, useState } from "react";
import { Filter, X } from "lucide-react";
import DropdownPanel from "./Dropdownpanel";

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterGroupConfig {
  key: string;
  title: string;
  mode: "multi" | "single";
  options: FilterOption[];
}

// The ticked values of every group, by group key. A single group holds none
// or one.
export type FilterValues = Record<string, string[]>;

export interface FilterShortcut {
  label: string;
  values: FilterValues;
}

interface FilterPanelProps {
  groups: FilterGroupConfig[];
  /** The filters in effect now. */
  applied: FilterValues;
  /** Called with the whole draft when Apply is pressed. */
  onApply: (values: FilterValues) => void;
  /** Called to put every filter back to its default. */
  onReset: () => void;
  shortcuts?: FilterShortcut[];
}

const PANEL_WIDTH = 288;

function sameValues(
  a: FilterValues,
  b: FilterValues,
  groups: FilterGroupConfig[],
): boolean {
  return groups.every(({ key }) => {
    const left = [...(a[key] ?? [])].sort();
    const right = [...(b[key] ?? [])].sort();
    return (
      left.length === right.length &&
      left.every((value, index) => value === right[index])
    );
  });
}

export default function FilterPanel({
  groups,
  applied,
  onApply,
  onReset,
  shortcuts = [],
}: FilterPanelProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<FilterValues>(applied);

  // How many groups have something applied.
  const appliedGroups = groups.filter(
    ({ key }) => (applied[key] ?? []).length > 0,
  ).length;
  const isActive = appliedGroups > 0;
  const draftChanged = !sameValues(draft, applied, groups);

  function toggleOpen() {
    // Every opening starts from what is applied.
    if (!open) setDraft(applied);
    setOpen((previous) => !previous);
  }

  function toggleValue(group: FilterGroupConfig, value: string) {
    setDraft((previous) => {
      const current = previous[group.key] ?? [];
      const has = current.includes(value);
      let next: string[];
      if (group.mode === "multi") {
        next = has
          ? current.filter((item) => item !== value)
          : [...current, value];
      } else {
        next = has ? [] : [value];
      }
      return { ...previous, [group.key]: next };
    });
  }

  function apply() {
    onApply(draft);
    setOpen(false);
  }

  function reset() {
    onReset();
    setOpen(false);
  }

  return (
    <div className="relative flex-1 sm:flex-none">
      <button
        ref={triggerRef}
        type="button"
        onClick={toggleOpen}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`cursor-pointer flex w-full items-center justify-center gap-1.5 px-3 py-2 text-xs border rounded-xl transition-colors ${
          isActive
            ? "border-violet-400 bg-violet-50 text-violet-700"
            : "border-slate-200 bg-white text-slate-600 hover:border-violet-300"
        }`}
      >
        <Filter size={12} />
        <span>Filter</span>
        {isActive && (
          <span className="rounded-full bg-violet-600 px-1.5 text-[10px] font-semibold leading-4 text-white">
            {appliedGroups}
          </span>
        )}
      </button>

      {/* Quick reset — a small red × badge on the button's top-right corner,
          only while a filter is applied. The white ring keeps it readable
          where it overlaps the button's border. */}
      {isActive && (
        <button
          type="button"
          onClick={reset}
          aria-label="Reset filters"
          title="Reset filters"
          className="cursor-pointer absolute -right-1.5 -top-1.5 z-10 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white shadow-sm ring-2 ring-white transition-colors hover:bg-red-600"
        >
          <X size={10} strokeWidth={3} />
        </button>
      )}

      <DropdownPanel
        open={open}
        onClose={() => setOpen(false)}
        anchorRef={triggerRef}
        width={PANEL_WIDTH}
        role="dialog"
        label="Filter"
      >
        <div className="flex flex-col gap-4 p-3">
          {shortcuts.length > 0 && (
            <fieldset className="flex flex-col">
              <legend className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Shortcuts
              </legend>
              <div className="flex flex-wrap gap-1.5">
                {shortcuts.map((shortcut) => (
                  <button
                    key={shortcut.label}
                    type="button"
                    onClick={() =>
                      setDraft((previous) => ({
                        ...previous,
                        ...shortcut.values,
                      }))
                    }
                    className="cursor-pointer rounded-lg border border-dashed border-violet-300 px-2.5 py-1 text-[11px] text-violet-700 transition-colors hover:bg-violet-50"
                  >
                    {shortcut.label}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          {groups.map((group) => (
            <fieldset key={group.key} className="flex flex-col">
              <legend className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                {group.title}
                {group.mode === "multi" && (
                  <span className="ml-1 font-normal normal-case tracking-normal">
                    (pick any)
                  </span>
                )}
              </legend>
              <div className="flex flex-wrap gap-1.5">
                {group.options.map((option) => {
                  const selected = (draft[group.key] ?? []).includes(
                    option.value,
                  );
                  return (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => toggleValue(group, option.value)}
                      className={`cursor-pointer rounded-lg border px-2.5 py-1 text-[11px] transition-colors ${
                        selected
                          ? "border-violet-600 bg-violet-600 text-white"
                          : "border-slate-200 bg-white text-slate-600 hover:border-violet-300"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ))}
        </div>

        {/* Footer — Reset puts everything back to default; Apply sends the
            draft. Apply stays off until the draft differs from what is
            applied, so it never sends a request that changes nothing. */}
        <div className="flex items-center justify-between gap-2 border-t border-slate-100 bg-slate-50 px-3 py-2.5">
          <button
            type="button"
            onClick={reset}
            className="cursor-pointer text-[11px] font-medium text-slate-500 hover:text-red-600 transition-colors"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={apply}
            disabled={!draftChanged}
            className="cursor-pointer rounded-lg bg-violet-600 px-4 py-1.5 text-xs text-white shadow-sm shadow-violet-200 transition-colors hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Apply
          </button>
        </div>
      </DropdownPanel>
    </div>
  );
}
