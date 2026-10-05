"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Sessioneditor.tsx
//
// Create or edit one school session (POST session/list/, PUT session/detail/).
//
// A session has a name such as "2025/2026", a start date and an optional end
// date. Whether a session is current is changed separately with the "Set as
// current" and "Close" actions on the calendar, not in this form.
//
// On edit, only the fields that changed are sent. The backend refuses name or
// date changes once an arm in the session has a submitted or approved
// broadsheet; its message is shown as an error toast.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { useClientAuthFetch } from "@/lib/Useclientauthfetch";
import type { ApiEnvelope, SessionRecord } from "@/types/configurations";
import {
  SCHOOL_ID,
  SaveError,
  fieldMessage,
  type FieldErrors,
} from "../configutils";
import ConfigPanel from "./Configpanel";
import { TextField } from "./Configui";

interface SessionEditorProps {
  /** The session being edited, or null to create a new one. */
  session: SessionRecord | null;
  onClose: () => void;
  onSaved: () => void;
}

interface FormState {
  name: string;
  starts: string;
  ends: string;
}

export default function SessionEditor({
  session,
  onClose,
  onSaved,
}: SessionEditorProps) {
  const { clientAuthFetch } = useClientAuthFetch();
  const isEdit = session !== null;

  const initial: FormState = {
    name: session?.name ?? "",
    starts: session?.starts ?? "",
    ends: session?.ends ?? "",
  };
  const [state, setState] = useState<FormState>(initial);
  const [serverErrors, setServerErrors] = useState<FieldErrors>({});

  // Changes one field and clears the backend message shown for it.
  function updateField(field: keyof FormState, value: string) {
    setState((previous) => ({ ...previous, [field]: value }));
    setServerErrors((previous) => ({ ...previous, [field]: [] }));
  }

  const { mutate, isPending } = useMutation<
    ApiEnvelope<unknown>,
    SaveError,
    FormState
  >({
    mutationFn: async (values) => {
      let body: Record<string, unknown>;

      if (session) {
        // Edit: send the id and only the fields that changed.
        body = { id: session.id, school_id: SCHOOL_ID };
        if (values.name.trim() !== initial.name) body.name = values.name.trim();
        if (values.starts !== initial.starts) body.starts = values.starts;
        if (values.ends !== initial.ends) body.ends = values.ends || null;
      } else {
        body = {
          name: values.name.trim(),
          starts: values.starts,
          school: SCHOOL_ID,
        };
        if (values.ends) body.ends = values.ends;
      }

      const { data, error } = await clientAuthFetch<ApiEnvelope<unknown>>(
        session ? "session/detail/" : "session/list/",
        { method: session ? "PUT" : "POST", body },
      );
      if (error) throw new SaveError(error.message, error.data);
      return data!;
    },
    onSuccess: () => {
      toast.success(isEdit ? "Session updated." : "Session created.");
      onSaved();
    },
    onError: (err) => {
      setServerErrors(err.fieldErrors);
      toast.error(err.message);
    },
  });

  // Validation
  const nameError = !state.name.trim()
    ? "Enter a name, for example 2025/2026."
    : state.name.trim().length > 50
      ? "Maximum 50 characters."
      : undefined;
  const startsError = !state.starts ? "Choose a start date." : undefined;
  const endsError =
    state.starts && state.ends && state.ends <= state.starts
      ? "The end date must be after the start date."
      : undefined;

  const hasProblems = !!nameError || !!startsError || !!endsError;
  const hasChanges =
    state.name.trim() !== initial.name ||
    state.starts !== initial.starts ||
    state.ends !== initial.ends;

  return (
    <ConfigPanel
      title={isEdit ? "Edit session" : "New session"}
      subtitle={
        isEdit ? session.name : "Add a school year to the calendar."
      }
      submitLabel={isEdit ? "Save changes" : "Create session"}
      isPending={isPending}
      canSubmit={!hasProblems && (!isEdit || hasChanges)}
      onSubmit={() => mutate(state)}
      onClose={onClose}
    >
      <TextField
        id="session-name"
        label="Name"
        required
        value={state.name}
        onChange={(value) => updateField("name", value)}
        placeholder="2025/2026"
        error={nameError ?? fieldMessage(serverErrors, "name")}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <TextField
          id="session-starts"
          label="Starts"
          type="date"
          required
          value={state.starts}
          onChange={(value) => updateField("starts", value)}
          error={startsError ?? fieldMessage(serverErrors, "starts")}
        />
        <TextField
          id="session-ends"
          label="Ends"
          type="date"
          value={state.ends}
          onChange={(value) => updateField("ends", value)}
          hint="Optional. Set automatically when the session is closed."
          error={endsError ?? fieldMessage(serverErrors, "ends")}
        />
      </div>
    </ConfigPanel>
  );
}
