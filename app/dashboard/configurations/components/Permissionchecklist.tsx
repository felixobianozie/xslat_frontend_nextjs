"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Permissionchecklist.tsx
//
// The permission picker of the role editor: every permission in the catalogue
// as a checkbox, grouped by category.
//
//   • A search box narrows the list by label or codename.
//   • A counter beside it shows how many permissions are ticked out of the
//     whole catalogue, for example 12/57.
//   • Each category shows its own count and a button that ticks or clears the
//     permissions of that category that are currently shown.
//
// The list is controlled: the editor owns the ticked codenames.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";

import type { PermissionRecord } from "@/types/configurations";
import EmptyState from "../../components/Emptystate";
import { groupPermissionsByCategory, permissionMatches } from "../configutils";
import { SearchField } from "./Configui";

interface PermissionChecklistProps {
  catalogue: PermissionRecord[];
  selected: string[];
  onChange: (codenames: string[]) => void;
  disabled?: boolean;
}

export default function PermissionChecklist({
  catalogue,
  selected,
  onChange,
  disabled,
}: PermissionChecklistProps) {
  const [search, setSearch] = useState("");

  const visibleGroups = groupPermissionsByCategory(
    catalogue.filter((permission) => permissionMatches(permission, search)),
  );

  function toggle(codename: string) {
    onChange(
      selected.includes(codename)
        ? selected.filter((item) => item !== codename)
        : [...selected, codename],
    );
  }

  // Ticks every shown permission of a category, or clears them when they are
  // all ticked already.
  function toggleCategory(permissions: PermissionRecord[]) {
    const codenames = permissions.map((permission) => permission.codename);
    const allTicked = codenames.every((codename) =>
      selected.includes(codename),
    );
    onChange(
      allTicked
        ? selected.filter((item) => !codenames.includes(item))
        : [
            ...selected,
            ...codenames.filter((item) => !selected.includes(item)),
          ],
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <SearchField
          id="permission-search"
          label="Search permissions"
          placeholder="Search permissions"
          value={search}
          onChange={setSearch}
          className="min-w-0 flex-1"
        />
        <span
          aria-live="polite"
          aria-label={`${selected.length} of ${catalogue.length} permissions ticked`}
          className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium tabular-nums text-slate-600"
        >
          {selected.length}/{catalogue.length}
        </span>
      </div>

      {visibleGroups.length === 0 ? (
        <EmptyState
          title="No matching permissions"
          description="Try a different search."
        />
      ) : (
        visibleGroups.map((group) => {
          const tickedCount = group.permissions.filter((permission) =>
            selected.includes(permission.codename),
          ).length;
          const allTicked = tickedCount === group.permissions.length;

          return (
            <section
              key={group.category}
              className="rounded-2xl border border-slate-200 bg-white"
            >
              <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-3 py-2.5">
                <h3 className="text-xs font-semibold text-slate-700">
                  {group.label}{" "}
                  <span className="font-normal tabular-nums text-slate-400">
                    {tickedCount}/{group.permissions.length}
                  </span>
                </h3>
                <button
                  type="button"
                  onClick={() => toggleCategory(group.permissions)}
                  disabled={disabled}
                  className="cursor-pointer shrink-0 text-xs text-violet-700 hover:text-violet-800 disabled:opacity-50"
                >
                  {allTicked ? "Clear" : "Select all"}
                </button>
              </header>

              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1 p-2">
                {group.permissions.map((permission) => (
                  <li key={permission.codename}>
                    <label className="flex cursor-pointer items-start gap-2.5 rounded-lg px-2 py-1.5 hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={selected.includes(permission.codename)}
                        disabled={disabled}
                        onChange={() => toggle(permission.codename)}
                        className="mt-0.5 h-4 w-4 shrink-0 accent-violet-600"
                      />
                      <span className="min-w-0">
                        <span className="block text-xs text-slate-800">
                          {permission.label}
                        </span>
                        <span className="block truncate text-[10px] text-slate-400">
                          {permission.codename}
                        </span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </section>
          );
        })
      )}
    </div>
  );
}
