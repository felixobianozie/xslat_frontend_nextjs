"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Permissioncatalogue.tsx
//
// A read-only list of every permission that can be given to a role, grouped by
// category. Each permission shows the roles that currently hold it, so an
// admin can see who has access to what without opening each role.
//
// A search box narrows the list by label or codename. Roles are changed from
// the Roles view.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";

import type { PermissionRecord, RoleRecord } from "@/types/configurations";
import EmptyState from "../../components/Emptystate";
import { groupPermissionsByCategory, permissionMatches } from "../configutils";
import { SearchField } from "./Configui";

interface PermissionCatalogueProps {
  catalogue: PermissionRecord[];
  roles: RoleRecord[];
}

export default function PermissionCatalogue({
  catalogue,
  roles,
}: PermissionCatalogueProps) {
  const [search, setSearch] = useState("");

  const groups = groupPermissionsByCategory(
    catalogue.filter((permission) => permissionMatches(permission, search)),
  );

  return (
    <div className="flex flex-col gap-4">
      <SearchField
        id="catalogue-search"
        label="Search permissions"
        placeholder="Search permissions"
        value={search}
        onChange={setSearch}
        className="sm:max-w-sm"
      />

      {groups.length === 0 ? (
        <EmptyState
          title="No matching permissions"
          description="Try a different search."
        />
      ) : (
        groups.map((group) => (
          <section
            key={group.category}
            className="rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <header className="border-b border-slate-100 px-4 py-2.5">
              <h3 className="text-xs font-semibold text-slate-700">
                {group.label}{" "}
                <span className="font-normal tabular-nums text-slate-400">
                  {group.permissions.length}
                </span>
              </h3>
            </header>

            <ul className="divide-y divide-slate-100">
              {group.permissions.map((permission) => {
                const holders = roles.filter((role) =>
                  role.permissions.includes(permission.codename),
                );

                return (
                  <li
                    key={permission.codename}
                    className="flex flex-col gap-1.5 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                  >
                    <div className="min-w-0">
                      <p className="text-xs text-slate-800">
                        {permission.label}
                      </p>
                      <p className="truncate text-[10px] text-slate-400">
                        {permission.codename}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-1.5 sm:max-w-[50%] sm:justify-end">
                      {holders.length === 0 ? (
                        <span className="text-[11px] text-slate-400">
                          No role holds this
                        </span>
                      ) : (
                        holders.map((role) => (
                          <span
                            key={role.id}
                            className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-700"
                          >
                            {role.name}
                          </span>
                        ))
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
