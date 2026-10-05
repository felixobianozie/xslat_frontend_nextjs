"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Resulttemplateeditor.tsx
//
// Create or edit one result template (POST result-template/list/ and
// PUT result-template/detail/).
//
// A template is metadata only: the layout itself is a React component in this
// app, chosen by `template_key`. The key can be set when creating and never
// changes afterwards. New templates are always school-specific — a universal
// template can only be created by a platform superuser.
//
// When editing, the template arrives with its full detail (description and
// config), already loaded by the Result Templates tab. On edit only the
// fields that changed are sent.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { useClientAuthFetch } from "@/lib/Useclientauthfetch";
import type {
  ApiEnvelope,
  ResultTemplateRecord,
} from "@/types/configurations";
import {
  SaveError,
  fieldMessage,
  isSameJson,
  type FieldErrors,
} from "../configutils";
import ConfigPanel from "./Configpanel";
import {
  PublicationNotice,
  TextAreaField,
  TextField,
  ToggleRow,
} from "./Configui";

// ── Constants ────────────────────────────────────────────────────────────────

const SCHOOL_ID = process.env.NEXT_PUBLIC_SCHOOL_ID ?? "";

// The backend stores template_key as a slug.
const SLUG_PATTERN = /^[-a-zA-Z0-9_]+$/;

interface FormState {
  name: string;
  templateKey: string;
  description: string;
  previewImageUrl: string;
  configText: string;
  active: boolean;
}

function toFormState(template: ResultTemplateRecord | null): FormState {
  if (!template) {
    return {
      name: "",
      templateKey: "",
      description: "",
      previewImageUrl: "",
      configText: "{}",
      active: false,
    };
  }
  return {
    name: template.name,
    templateKey: template.template_key,
    description: template.detail?.description ?? "",
    previewImageUrl: template.preview_image_url,
    configText: JSON.stringify(template.detail?.config ?? {}, null, 2),
    active: template.is_active,
  };
}

// Returns the parsed config object, or an error message.
function parseConfig(text: string): {
  value?: Record<string, unknown>;
  error?: string;
} {
  try {
    const parsed: unknown = JSON.parse(text.trim() === "" ? "{}" : text);
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { error: "Config must be a JSON object, e.g. {}" };
    }
    return { value: parsed as Record<string, unknown> };
  } catch {
    return { error: "Config is not valid JSON." };
  }
}

interface ResultTemplateEditorProps {
  // null creates a template; a record edits that template.
  template: ResultTemplateRecord | null;
  onClose: () => void;
  // Called after a successful save; the tab refreshes its list and closes.
  onSaved: () => void;
}

export default function ResultTemplateEditor({
  template,
  onClose,
  onSaved,
}: ResultTemplateEditorProps) {
  const { clientAuthFetch } = useClientAuthFetch();
  const isEdit = template !== null;
  const [initial] = useState(() => toFormState(template));
  const [state, setState] = useState<FormState>(initial);
  const [serverErrors, setServerErrors] = useState<FieldErrors>({});

  // The request body for the current form values and parsed config.
  function buildBody(
    values: FormState,
    config: Record<string, unknown>,
  ): Record<string, unknown> {
    if (!template) {
      return {
        name: values.name.trim(),
        template_key: values.templateKey.trim().toLowerCase(),
        description: values.description.trim(),
        scope: "school",
        school: SCHOOL_ID,
        config,
        preview_image_url: values.previewImageUrl.trim(),
        activate: values.active,
      };
    }
    // Edit: send only what changed.
    const body: Record<string, unknown> = { id: template.id };
    if (values.name.trim() !== initial.name) body.name = values.name.trim();
    if (values.description.trim() !== initial.description) {
      body.description = values.description.trim();
    }
    if (values.previewImageUrl.trim() !== initial.previewImageUrl) {
      body.preview_image_url = values.previewImageUrl.trim();
    }
    if (!isSameJson(config, parseConfig(initial.configText).value)) {
      body.config = config;
    }
    if (values.active !== initial.active) body.activate = values.active;
    return body;
  }

  const { mutate, isPending } = useMutation<
    ApiEnvelope<unknown>,
    SaveError,
    { values: FormState; config: Record<string, unknown> }
  >({
    mutationFn: async ({ values, config }) => {
      const { data, error } = await clientAuthFetch<ApiEnvelope<unknown>>(
        isEdit ? "result-template/detail/" : "result-template/list/",
        {
          method: isEdit ? "PUT" : "POST",
          body: buildBody(values, config),
        },
      );
      if (error) throw new SaveError(error.message, error.data);
      return data!;
    },
    onSuccess: () => {
      toast.success(
        isEdit ? "Result template updated." : "Result template created.",
      );
      onSaved();
    },
    onError: (err) => {
      setServerErrors(err.fieldErrors);
      toast.error(err.message);
    },
  });

  const config = parseConfig(state.configText);
  const nameError = !state.name.trim() ? "Enter a name." : undefined;
  const keyError = isEdit
    ? undefined
    : !state.templateKey.trim()
      ? "Enter a template key."
      : !SLUG_PATTERN.test(state.templateKey.trim())
        ? "Use letters, numbers, hyphens and underscores only."
        : undefined;
  const urlError =
    state.previewImageUrl.trim() &&
    !/^https?:\/\//i.test(state.previewImageUrl.trim())
      ? "Enter a full URL starting with http:// or https://"
      : undefined;

  const hasProblems = !!nameError || !!keyError || !!urlError || !!config.error;
  const hasChanges = !isEdit || !isSameJson(state, initial);

  function updateState(patch: Partial<FormState>) {
    setState((previous) => ({ ...previous, ...patch }));
    setServerErrors({});
  }

  return (
    <ConfigPanel
      title={isEdit ? `Edit ${template.name}` : "New result template"}
      subtitle="Describes a report card layout and the options it reads."
      submitLabel={isEdit ? "Save changes" : "Create template"}
      isPending={isPending}
      canSubmit={!hasProblems && hasChanges}
      onSubmit={() =>
        config.value && mutate({ values: state, config: config.value })
      }
      onClose={onClose}
    >
      {isEdit && (
        <PublicationNotice>
          Name and config cannot be changed while an arm with locked results
          uses this template. The server will reject the save if that applies.
        </PublicationNotice>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextField
          id="rt-name"
          label="Name"
          required
          placeholder="e.g. Junior default"
          hint="Saved in capital letters."
          value={state.name}
          onChange={(name) => updateState({ name })}
          error={
            fieldMessage(serverErrors, "name") ??
            (state.name ? nameError : undefined)
          }
        />
        <TextField
          id="rt-key"
          label="Template key"
          required={!isEdit}
          placeholder="e.g. junior-default-a4v1"
          hint={
            isEdit
              ? "The key cannot be changed after creation."
              : "Must match a layout built into this app. An unknown key shows the generic report."
          }
          value={state.templateKey}
          onChange={(templateKey) => updateState({ templateKey })}
          disabled={isEdit}
          error={
            fieldMessage(serverErrors, "template_key") ??
            (state.templateKey ? keyError : undefined)
          }
        />
        <TextField
          id="rt-preview"
          label="Preview image URL"
          type="url"
          placeholder="https://…"
          value={state.previewImageUrl}
          onChange={(previewImageUrl) => updateState({ previewImageUrl })}
          error={fieldMessage(serverErrors, "preview_image_url") ?? urlError}
          className="md:col-span-2"
        />
        <TextAreaField
          id="rt-description"
          label="Description"
          rows={3}
          value={state.description}
          onChange={(description) => updateState({ description })}
          error={fieldMessage(serverErrors, "description")}
          className="md:col-span-2"
        />
        <TextAreaField
          id="rt-config"
          label="Config (JSON)"
          rows={6}
          mono
          hint='Options read by the layout, e.g. {"show_attendance": true}.'
          value={state.configText}
          onChange={(configText) => updateState({ configText })}
          error={config.error ?? fieldMessage(serverErrors, "config")}
          className="md:col-span-2"
        />
      </div>

      <div className="border-t border-slate-100 pt-1">
        <ToggleRow
          label="Template is active"
          description="Only active templates can be assigned to class arms."
          checked={state.active}
          onChange={(active) => updateState({ active })}
        />
      </div>
    </ConfigPanel>
  );
}
