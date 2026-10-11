"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Rolesandpermissionstab.tsx
//
// The Roles & Permissions tab, in two views switched by a segmented control:
//
//   Roles        the school's roles (GET roles/list/). Each card shows the
//                number of permissions and how many staff hold the role.
//                "New role" and "Edit" open the role editor; "Delete" opens a
//                confirmation.
//   Permissions  a read-only list of every permission in the catalogue
//                (GET permissions/) with the roles that hold each one.
//
// Giving roles and permissions to staff members is done on the staff page.
//
// The roles, the catalogue and the staff counts load with React Query when the
// tab is opened and are reused from the cache after that. Saving or deleting a
// role refreshes the role list and the staff counts.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "react-toastify";

import type { RoleRecord } from "@/types/configurations";
import EmptyState from "../../components/Emptystate";
import TableLoader from "../../components/Tableloader";
import { ROLES_KEY, ROLE_MEMBERS_KEY } from "../configutils";
import {
  usePermissionCatalogue,
  useRoleMemberCounts,
  useRoles,
} from "../hooks/Useroles";
import { ErrorNotice, ListToolbar } from "./Configui";
import PermissionCatalogue from "./Permissioncatalogue";
import RoleDeleteDialog from "./Roledeletedialog";
import RoleEditor from "./Roleeditor";
import SlidePanelLayout from "./Slidepanellayout";

// ── Constants ────────────────────────────────────────────────────────────────

const ACTION_BUTTON =
  "cursor-pointer flex items-center gap-1 px-3 py-1.5 text-xs border border-slate-200 rounded-xl text-slate-600 transition-colors";

type View = "roles" | "permissions";

const VIEWS: { id: View; label: string }[] = [
  { id: "roles", label: "Roles" },
  { id: "permissions", label: "Permissions" },
];

export default function RolesAndPermissionsTab() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<View>("roles");

  // The role being edited (null = a new role). It is kept after the panel
  // closes so the panel still has its content while it slides out.
  const [editorRole, setEditorRole] = useState<RoleRecord | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<RoleRecord | null>(null);

  const rolesQuery = useRoles();
  const catalogueQuery = usePermissionCatalogue();

  const roles = rolesQuery.data?.data ?? [];
  const catalogue = catalogueQuery.data?.data ?? [];
  const memberCounts = useRoleMemberCounts(roles.map((role) => role.name));

  function refreshRoles() {
    queryClient.invalidateQueries({ queryKey: ROLES_KEY });
    queryClient.invalidateQueries({ queryKey: ROLE_MEMBERS_KEY });
  }

  // The editor needs the catalogue to list the permissions.
  function openEditor(role: RoleRecord | null) {
    if (catalogueQuery.isPending) {
      toast.info(
        "The permission list is still loading. Try again in a moment.",
      );
      return;
    }
    if (catalogueQuery.error) {
      toast.error("The permission list could not be loaded.");
      return;
    }
    setEditorRole(role);
    setPanelOpen(true);
  }

  function renderStaffCount(roleName: string) {
    const member = memberCounts[roleName];
    if (!member || member.isPending) return "Counting staff…";
    if (member.isError || member.count === undefined) {
      return "Staff count unavailable";
    }
    if (member.count === 0) return "No staff";
    return member.count === 1
      ? "1 staff member"
      : `${member.count} staff members`;
  }

  function renderRoles() {
    if (rolesQuery.isPending) return <TableLoader rows={3} />;
    if (rolesQuery.error) {
      return (
        <ErrorNotice
          message={rolesQuery.error.message}
          onRetry={() => rolesQuery.refetch()}
        />
      );
    }
    if (roles.length === 0) {
      return (
        <EmptyState
          title="No roles yet"
          description='Use "New role" to create the first one.'
        />
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {roles.map((role) => (
          <article
            key={role.id}
            className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 flex flex-col gap-3"
          >
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-slate-800 truncate">
                {role.name}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {role.permissions.length === 1
                  ? "1 permission"
                  : `${role.permissions.length} permissions`}
              </p>
              <p className="text-xs text-slate-500">
                {renderStaffCount(role.name)}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => openEditor(role)}
                className={`${ACTION_BUTTON} hover:border-violet-300 hover:text-violet-700`}
              >
                <Pencil size={11} /> Edit
              </button>
              <button
                type="button"
                onClick={() => setDeleteTarget(role)}
                className={`${ACTION_BUTTON} hover:border-red-300 hover:text-red-600`}
              >
                <Trash2 size={11} /> Delete
              </button>
            </div>
          </article>
        ))}
      </div>
    );
  }

  function renderPermissions() {
    if (catalogueQuery.isPending || rolesQuery.isPending) {
      return <TableLoader rows={4} />;
    }
    if (catalogueQuery.error) {
      return (
        <ErrorNotice
          message={catalogueQuery.error.message}
          onRetry={() => catalogueQuery.refetch()}
        />
      );
    }
    if (rolesQuery.error) {
      return (
        <ErrorNotice
          message={rolesQuery.error.message}
          onRetry={() => rolesQuery.refetch()}
        />
      );
    }
    return <PermissionCatalogue catalogue={catalogue} roles={roles} />;
  }

  return (
    <>
      <SlidePanelLayout
        panelOpen={panelOpen}
        panel={
          <RoleEditor
            key={editorRole?.id ?? "new"}
            role={editorRole}
            catalogue={catalogue}
            memberCount={
              editorRole ? memberCounts[editorRole.name]?.count : undefined
            }
            onClose={() => setPanelOpen(false)}
            onChanged={refreshRoles}
          />
        }
      >
        <div className="pb-10">
          {/* Segmented control — scrolls sideways on very narrow screens */}
          <div
            role="tablist"
            aria-label="Roles and permissions"
            className="inline-flex max-w-full overflow-x-auto scrollbar-hide rounded-xl border border-slate-200 bg-white p-1 mb-5"
          >
            {VIEWS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={view === item.id}
                onClick={() => setView(item.id)}
                className={`cursor-pointer whitespace-nowrap rounded-lg px-4 py-1.5 text-xs font-medium transition-colors ${
                  view === item.id
                    ? "bg-violet-600 text-white shadow-sm"
                    : "text-slate-500 hover:text-violet-700"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {view === "roles" ? (
            <>
              <ListToolbar
                title="Roles"
                description="Named sets of permissions for your school's staff."
                actionLabel="New role"
                onAction={() => openEditor(null)}
              />
              {renderRoles()}
            </>
          ) : (
            <>
              <ListToolbar
                title="Permissions"
                description="Every permission a role can grant, and the roles that hold it."
              />
              {renderPermissions()}
            </>
          )}
        </div>
      </SlidePanelLayout>

      {deleteTarget && (
        <RoleDeleteDialog
          role={deleteTarget}
          memberCount={memberCounts[deleteTarget.name]?.count}
          onClose={() => setDeleteTarget(null)}
          onDone={() => {
            setDeleteTarget(null);
            refreshRoles();
          }}
        />
      )}
    </>
  );
}
