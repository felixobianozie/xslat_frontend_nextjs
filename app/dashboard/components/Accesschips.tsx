"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Accesschips.tsx
//
// A staff member's roles and direct permissions at one school, as two
// labelled groups of chips. Used by the staff profile header and by each
// school card on the user profile.
//
//   Roles                   the role names
//   Individual permissions  permissions given directly, on top of the roles
//
// A group shows only when it has entries, and nothing renders when both are
// empty. Permissions arrive as codenames; their names come from the permission
// catalogue (GET permissions/, cached and shared app-wide). Until the
// catalogue loads, or for a codename it does not list, a chip shows the
// codename in plain words instead.
// ─────────────────────────────────────────────────────────────────────────────

import { usePermissionCatalogue } from "../configurations/hooks/Useroles";

interface AccessChipsProps {
  roles: ProfileRole[];
  // The direct permission codenames; undefined while they are loading.
  permissions?: string[];
  // True when the permissions could not be loaded.
  permissionsFailed?: boolean;
  className?: string;
}

// "can_enter_cognitive_score" → "Enter cognitive score"
function codenameToWords(codename: string): string {
  const words = codename.replace(/^can_/, "").replace(/_/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export default function AccessChips({
  roles,
  permissions,
  permissionsFailed = false,
  className = "",
}: AccessChipsProps) {
  const catalogueQuery = usePermissionCatalogue();
  const labels = new Map(
    (catalogueQuery.data?.data ?? []).map((item) => [
      item.codename,
      item.label,
    ]),
  );

  const directPermissions = permissions ?? [];
  if (
    roles.length === 0 &&
    directPermissions.length === 0 &&
    !permissionsFailed
  ) {
    return null;
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {roles.length > 0 && (
        <ChipGroup label="Roles">
          {roles.map((role) => (
            <li
              key={role.id}
              className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-700"
            >
              {role.name}
            </li>
          ))}
        </ChipGroup>
      )}

      {directPermissions.length > 0 && (
        <ChipGroup label="Individual permissions">
          {directPermissions.map((codename) => (
            <li
              key={codename}
              className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700"
            >
              {labels.get(codename) ?? codenameToWords(codename)}
            </li>
          ))}
        </ChipGroup>
      )}

      {permissionsFailed && (
        <p className="text-[11px] text-slate-400">
          Individual permissions could not be loaded.
        </p>
      )}
    </div>
  );
}

function ChipGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-1 text-[10px] font-semibold text-slate-400">{label}</p>
      <ul className="flex flex-wrap gap-1.5" aria-label={label}>
        {children}
      </ul>
    </div>
  );
}
