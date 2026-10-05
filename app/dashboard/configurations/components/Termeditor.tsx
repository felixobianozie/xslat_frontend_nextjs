"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Termeditor.tsx
//
// Create or edit one term inside a session (POST term/list/, PUT
// term/detail/).
//
// A term has a name (for example "First"), an optional short name without
// spaces (for example "1ST"), a start date and an optional end date. Its dates
// must fall inside the session's dates. Whether a term is current is changed
// separately with the "Set as current" and "Close" actions on the calendar.
//
// On edit, only the fields that changed are sent. The backend refuses name,
// short name or date changes once an arm in the term has a submitted or
// approved broadsheet; its message is shown as an error toast.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { useClientAuthFetch } from "@/lib/Useclientauthfetch";
import type {
  ApiEnvelope,
  SessionRecord,
  TermRecord,
} from "@/types/configurations";
import {
  SCHOOL_ID,
  SaveError,
  fieldMessage,
  formatDay,
  type FieldErrors,
} from "../configutils";
import ConfigPanel from "./Configpanel";
import { TextField } from "./Configui";

interface TermEditorProps {
  /** The term being edited, or null to create a new one. */
  term: TermRecord | null;
  /** The session the term belongs to. */
  session: SessionRecord;
  onClose: () => void;
  onSaved: () => void;
}

interface FormState {
  name: string;
  abbr: string;
  starts: string;
  ends: string;
}

export default function TermEditor({
  term,
  session,
  onClose,
  onSaved,
}: TermEditorProps) {
  const { clientAuthFetch } = useClientAuthFetch();
  const isEdit = term !== null;

  const initial: FormState = {
    name: term?.name ?? "",
    abbr: term?.abbr ?? "",
    starts: term?.starts ?? "",
    ends: term?.ends ?? "",
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

      if (term) {
        // Edit: send the id and only the fields that changed.
        body = { id: term.id, school_id: SCHOOL_ID };
        if (values.name.trim() !== initial.name) body.name = values.name.trim();
        if (values.abbr.trim() !== initial.abbr) body.abbr = values.abbr.trim();
        if (values.starts !== initial.starts) body.starts = values.starts;
        if (values.ends !== initial.ends) body.ends = values.ends || null;
      } else {
        body = {
          name: values.name.trim(),
          starts: values.starts,
          session: session.id,
        };
        if (values.abbr.trim()) body.abbr = values.abbr.trim();
        if (values.ends) body.ends = values.ends;
      }

      const { data, error } = await clientAuthFetch<ApiEnvelope<unknown>>(
        term ? "term/detail/" : "term/list/",
        { method: term ? "PUT" : "POST", body },
      );
      if (error) throw new SaveError(error.message, error.data);
      return data!;
    },
    onSuccess: () => {
      toast.success(isEdit ? "Term updated." : "Term created.");
      onSaved();
    },
    onError: (err) => {
      setServerErrors(err.fieldErrors);
      toast.error(err.message);
    },
  });

  // Validation
  const nameError = !state.name.trim()
    ? "Enter a name, for example First."
    : state.name.trim().length > 50
      ? "Maximum 50 characters."
      : undefined;
  const abbrError = /\s/.test(state.abbr)
    ? "No spaces. Use underscores instead."
    : state.abbr.length > 50
      ? "Maximum 50 characters."
      : undefined;
  const startsError = !state.starts ? "Choose a start date." : undefined;
  const endsError =
    state.starts && state.ends && state.ends <= state.starts
      ? "The end date must be after the start date."
      : undefined;

  const hasProblems =
    !!nameError || !!abbrError || !!startsError || !!endsError;
  const hasChanges =
    state.name.trim() !== initial.name ||
    state.abbr.trim() !== initial.abbr ||
    state.starts !== initial.starts ||
    state.ends !== initial.ends;

  const sessionRange = session.ends
    ? `${formatDay(session.starts)} to ${formatDay(session.ends)}`
    : `from ${formatDay(session.starts)}`;

  return (
    <ConfigPanel
      title={isEdit ? "Edit term" : "New term"}
      subtitle={`${session.name} session`}
      submitLabel={isEdit ? "Save changes" : "Create term"}
      isPending={isPending}
      canSubmit={!hasProblems && (!isEdit || hasChanges)}
      onSubmit={() => mutate(state)}
      onClose={onClose}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <TextField
          id="term-name"
          label="Name"
          required
          value={state.name}
          onChange={(value) => updateField("name", value)}
          placeholder="First"
          error={nameError ?? fieldMessage(serverErrors, "name")}
        />
        <TextField
          id="term-abbr"
          label="Short name"
          value={state.abbr}
          onChange={(value) => updateField("abbr", value)}
          placeholder="1ST"
          hint="Optional. Shown in tight spaces."
          error={abbrError ?? fieldMessage(serverErrors, "abbr")}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <TextField
          id="term-starts"
          label="Starts"
          type="date"
          required
          value={state.starts}
          onChange={(value) => updateField("starts", value)}
          hint={`Session runs ${sessionRange}.`}
          error={startsError ?? fieldMessage(serverErrors, "starts")}
        />
        <TextField
          id="term-ends"
          label="Ends"
          type="date"
          value={state.ends}
          onChange={(value) => updateField("ends", value)}
          hint="Optional. Set automatically when the term is closed."
          error={endsError ?? fieldMessage(serverErrors, "ends")}
        />
      </div>
    </ConfigPanel>
  );
}
