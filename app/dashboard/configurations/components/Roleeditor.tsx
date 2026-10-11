"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Roleeditor.tsx
//
// Create or edit one school role: its name and the permissions it grants.
//
// Saving takes up to two requests, in this order:
//   1. the name   POST roles/list/ for a new role, or PUT roles/detail/ when
//                 an existing role was renamed
//   2. the permissions   PUT roles/permissions/set/, which replaces the whole
//                 permission list of the role
// Only the steps that have something to save are sent.
//
// If the second step fails after the first succeeded, the role already exists
// (or is already renamed). The panel keeps what the server has saved, so a
// second attempt repeats only the step that failed, and the role list is
// refreshed after every step that succeeded.
//
// The backend removes spaces from a role name and capitalises each word, so
// "class teacher" is saved as "ClassTeacher". The name field shows the saved
// name once the role has been saved.
// ─────────────────────────────────────────────────────────────────────────────

import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { useClientAuthFetch } from "@/lib/Useclientauthfetch";
import type {
  ApiEnvelope,
  PermissionRecord,
  RoleRecord,
} from "@/types/configurations";
import {
  SCHOOL_ID,
  SaveError,
  fieldMessage,
  type FieldErrors,
} from "../configutils";
import ConfigPanel from "./Configpanel";
import { PublicationNotice, TextField } from "./Configui";
import PermissionChecklist from "./Permissionchecklist";

interface RoleEditorProps {
  // The role being edited; null creates a new role.
  role: RoleRecord | null;
  catalogue: PermissionRecord[];
  // How many staff hold the role, when known.
  memberCount?: number;
  onClose: () => void;
  // Called after every saved step so the lists can refresh.
  onChanged: () => void;
}

type Step = "name" | "permissions";

// True when both lists hold the same codenames, in any order.
function sameCodenames(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sortedB = [...b].sort();
  return [...a].sort().every((codename, index) => codename === sortedB[index]);
}

export default function RoleEditor({
  role,
  catalogue,
  memberCount,
  onClose,
  onChanged,
}: RoleEditorProps) {
  const { clientAuthFetch } = useClientAuthFetch();
  const isNew = role === null;

  // What the server has saved for this role; null until a new role is created.
  const [saved, setSaved] = useState<RoleRecord | null>(role);
  const [name, setName] = useState(role?.name ?? "");
  const [selected, setSelected] = useState<string[]>(role?.permissions ?? []);
  const [serverErrors, setServerErrors] = useState<FieldErrors>({});
  const [stepMessage, setStepMessage] = useState<string | null>(null);
  // The step that was running, so a failure can say which part did not save.
  const runningStep = useRef<Step>("name");

  const { mutate, isPending } = useMutation<void, SaveError, void>({
    mutationFn: async () => {
      let current = saved;
      const trimmedName = name.trim();

      // Step 1: create or rename.
      if (!current) {
        runningStep.current = "name";
        const { data, error } = await clientAuthFetch<ApiEnvelope<RoleRecord>>(
          "roles/list/",
          { method: "POST", body: { school_id: SCHOOL_ID, name: trimmedName } },
        );
        if (error) throw new SaveError(error.message, error.data);
        current = data!.data;
        setSaved(current);
        setName(current.name);
        onChanged();
      } else if (trimmedName !== current.name) {
        runningStep.current = "name";
        const { data, error } = await clientAuthFetch<ApiEnvelope<RoleRecord>>(
          "roles/detail/",
          {
            method: "PUT",
            body: { id: current.id, school_id: SCHOOL_ID, name: trimmedName },
          },
        );
        if (error) throw new SaveError(error.message, error.data);
        current = { ...current, name: data!.data.name };
        setSaved(current);
        setName(current.name);
        onChanged();
      }

      // Step 2: replace the permissions.
      if (!sameCodenames(selected, current.permissions)) {
        runningStep.current = "permissions";
        const { error } = await clientAuthFetch("roles/permissions/set/", {
          method: "PUT",
          body: {
            school_id: SCHOOL_ID,
            role_id: current.id,
            permissions: selected,
          },
        });
        if (error) throw new SaveError(error.message, error.data);
        setSaved({ ...current, permissions: selected });
        onChanged();
      }
    },
    onSuccess: () => {
      toast.success(isNew ? "Role created." : "Role updated.");
      onClose();
    },
    onError: (err) => {
      setServerErrors(err.fieldErrors);

      if (runningStep.current === "permissions") {
        setStepMessage(
          `${err.message} The role itself is saved; only its permissions were not.`,
        );
      } else {
        setStepMessage(null);
      }
      toast.error(err.message);
    },
  });

  // Validation
  const nameError = !name.trim()
    ? "Enter a role name, for example Class Teacher."
    : name.trim().length > 100
      ? "Maximum 100 characters."
      : undefined;

  const hasChanges =
    !saved ||
    name.trim() !== saved.name ||
    !sameCodenames(selected, saved.permissions);

  return (
    <ConfigPanel
      title={isNew ? "New role" : `Edit ${role.name}`}
      subtitle="A role is a named set of permissions. Roles are given to staff separately."
      submitLabel={isNew ? "Create role" : "Save changes"}
      isPending={isPending}
      canSubmit={!nameError && hasChanges}
      onSubmit={() => {
        setServerErrors({});
        setStepMessage(null);
        mutate();
      }}
      onClose={onClose}
    >
      {!isNew && memberCount !== undefined && memberCount > 0 && (
        <PublicationNotice>
          {memberCount === 1
            ? "1 staff member holds this role. "
            : `${memberCount} staff members hold this role. `}
          Permission changes apply to them as soon as you save.
        </PublicationNotice>
      )}

      <TextField
        id="role-name"
        label="Role name"
        required
        placeholder="e.g. Class Teacher"
        value={name}
        onChange={(value) => {
          setName(value);
          setServerErrors({});
        }}
        error={
          fieldMessage(serverErrors, "name") ?? (name ? nameError : undefined)
        }
        hint="Spaces are removed and each word is capitalised, so Class Teacher is saved as ClassTeacher."
        disabled={isPending}
      />

      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-semibold text-slate-700">Permissions</h3>
        <PermissionChecklist
          catalogue={catalogue}
          selected={selected}
          onChange={(codenames) => {
            setSelected(codenames);
            setStepMessage(null);
          }}
          disabled={isPending}
        />
      </div>

      {(stepMessage || fieldMessage(serverErrors, "permissions")) && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-[11px] text-red-700">
          {stepMessage ?? fieldMessage(serverErrors, "permissions")}
        </p>
      )}
    </ConfigPanel>
  );
}
