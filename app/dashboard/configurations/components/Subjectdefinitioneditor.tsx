"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Subjectdefinitioneditor.tsx
//
// Create or edit one subject definition, the school's reusable subject
// (POST / PUT subject-definition/list|detail/). A definition only has a name
// and an abbreviation; it is offered in a term from the Subjects tab.
//
// The backend formats the name in title case and the abbreviation in capitals,
// and requires both to be unique within the school. The backend has no delete
// endpoint for definitions.
//
// A definition is locked while a class arm whose broadsheet is submitted or
// approved offers a subject that uses it (`is_locked`). Its name and
// abbreviation then cannot be changed, so the fields are read-only. To use
// another name, create a new subject.
//
// On edit, only the fields that changed are sent.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { useClientAuthFetch } from "@/lib/Useclientauthfetch";
import type {
  ApiEnvelope,
  SubjectDefinitionRecord,
} from "@/types/configurations";
import {
  SCHOOL_ID,
  SaveError,
  fieldMessage,
  type FieldErrors,
} from "../configutils";
import ConfigPanel from "./Configpanel";
import { PublicationNotice, TextField } from "./Configui";

interface FormState {
  name: string;
  abbr: string;
}

interface SubjectDefinitionEditorProps {
  definition: SubjectDefinitionRecord | null;
  onClose: () => void;
  // Called after a successful save; the tab refreshes its lists and closes.
  onSaved: () => void;
}

export default function SubjectDefinitionEditor({
  definition,
  onClose,
  onSaved,
}: SubjectDefinitionEditorProps) {
  const { clientAuthFetch } = useClientAuthFetch();
  const isEdit = definition !== null;
  const [initial] = useState<FormState>({
    name: definition?.name ?? "",
    abbr: definition?.abbr ?? "",
  });
  const [state, setState] = useState<FormState>(initial);
  const [serverErrors, setServerErrors] = useState<FieldErrors>({});
  const locked = isEdit && definition.is_locked === true;

  // The request body for the current form values.
  function buildBody(values: FormState): Record<string, unknown> {
    const name = values.name.trim();
    const abbr = values.abbr.trim();

    if (!definition) {
      return { school: SCHOOL_ID, name, abbr };
    }

    const body: Record<string, unknown> = {
      id: definition.id,
      school_id: SCHOOL_ID,
    };
    if (name !== initial.name) body.name = name;
    if (abbr !== initial.abbr) body.abbr = abbr;
    return body;
  }

  const { mutate, isPending } = useMutation<
    ApiEnvelope<SubjectDefinitionRecord>,
    SaveError,
    FormState
  >({
    mutationFn: async (values) => {
      const { data, error } = await clientAuthFetch<
        ApiEnvelope<SubjectDefinitionRecord>
      >(isEdit ? "subject-definition/detail/" : "subject-definition/list/", {
        method: isEdit ? "PUT" : "POST",
        body: buildBody(values),
      });
      if (error) throw new SaveError(error.message, error.data);
      return data!;
    },
    onSuccess: () => {
      toast.success(isEdit ? "Subject updated." : "Subject created.");
      onSaved();
    },
    onError: (err) => {
      setServerErrors(err.fieldErrors);
      toast.error(err.message);
    },
  });

  // Validation
  const nameError = !state.name.trim()
    ? "Enter a name, for example Mathematics."
    : state.name.trim().length > 100
      ? "Maximum 100 characters."
      : undefined;
  const abbrError = !state.abbr.trim()
    ? "Enter an abbreviation, for example MTH."
    : /\s/.test(state.abbr.trim())
      ? "No spaces. Use underscores instead."
      : state.abbr.trim().length > 20
        ? "Maximum 20 characters."
        : undefined;

  const hasProblems = !!nameError || !!abbrError;
  const hasChanges =
    !isEdit ||
    state.name.trim() !== initial.name ||
    state.abbr.trim() !== initial.abbr;

  function updateState(patch: Partial<FormState>) {
    setState((previous) => ({ ...previous, ...patch }));
    setServerErrors({});
  }

  return (
    <ConfigPanel
      title={isEdit ? `Edit ${definition.name}` : "New subject"}
      subtitle="A subject the school can offer. Offer it in a term from the term subjects list."
      submitLabel={isEdit ? "Save changes" : "Create subject"}
      isPending={isPending}
      canSubmit={!locked && !hasProblems && hasChanges}
      onSubmit={() => mutate(state)}
      onClose={onClose}
    >
      {locked && (
        <PublicationNotice>
          A class arm whose broadsheet is submitted or approved offers this
          subject, so its name and abbreviation are locked. To use a different
          name, create a new subject and offer that one instead. You can come
          back to this one at any time.
        </PublicationNotice>
      )}
      {isEdit && !locked && (
        <PublicationNotice>
          The name and abbreviation appear on result sheets. They are locked as
          soon as a class arm that offers this subject is submitted or approved.
          To use a different name after that, create a new subject.
        </PublicationNotice>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TextField
          id="sd-name"
          label="Name"
          required
          placeholder="e.g. Mathematics"
          value={state.name}
          disabled={locked}
          onChange={(name) => updateState({ name })}
          error={
            fieldMessage(serverErrors, "name") ??
            (state.name ? nameError : undefined)
          }
          hint="Shown in title case."
        />
        <TextField
          id="sd-abbr"
          label="Abbreviation"
          required
          placeholder="e.g. MTH"
          value={state.abbr}
          disabled={locked}
          onChange={(abbr) => updateState({ abbr })}
          error={
            fieldMessage(serverErrors, "abbr") ??
            (state.abbr ? abbrError : undefined)
          }
          hint="Shown in capitals. No spaces."
        />
      </div>
    </ConfigPanel>
  );
}
