"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Passruleeditor.tsx
//
// Create or edit one pass rule (POST / PUT pass-rule/list|detail/).
//
//   type "score"  — compares the student's aggregate score to the threshold
//   type "count"  — compares the number of subjects passed to the threshold
//   decide_by "percentage" — threshold is a fraction from 0 to 1 on the server;
//                            this form lets the user type 0–100 instead
//   decide_by "raw"        — threshold is a plain number, 0 or more
//
// Optional per-subject thresholds are prerequisites checked in addition to the
// overall threshold. They use the same unit (percentage or raw) as the rule.
//
// On edit, fields are only sent when they changed. `subjects` replaces every
// subject threshold when present, so it is only sent when the list changed.
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { useClientAuthFetch } from "@/lib/Useclientauthfetch";
import type {
  ApiEnvelope,
  PassRuleDecideBy,
  PassRuleRecord,
  PassRuleType,
  SubjectDefinitionRecord,
} from "@/types/configurations";
import {
  QUERY_STALE_MS,
  SaveError,
  fieldMessage,
  fractionToPercentText,
  isSameJson,
  percentTextToFraction,
  trimDecimalText,
  type FieldErrors,
} from "../configutils";
import ConfigPanel from "./Configpanel";
import {
  PublicationNotice,
  SelectField,
  TextField,
  ToggleRow,
} from "./Configui";

const SCHOOL_ID = process.env.NEXT_PUBLIC_SCHOOL_ID ?? "";

const SUBJECT_DEFINITIONS_KEY = ["subject-definitions", SCHOOL_ID];

interface FormState {
  name: string;
  type: PassRuleType;
  decideBy: PassRuleDecideBy;
  baseValue: string;
  active: boolean;
  // Subject definition id → threshold text. Presence means "selected".
  subjects: Record<string, string>;
}

function toFormState(rule: PassRuleRecord | null): FormState {
  if (!rule) {
    return {
      name: "",
      type: "score",
      decideBy: "percentage",
      baseValue: "",
      active: true,
      subjects: {},
    };
  }
  const toText = (value: string) =>
    rule.decide_by === "percentage"
      ? fractionToPercentText(value)
      : trimDecimalText(value);

  return {
    name: rule.name,
    type: rule.type,
    decideBy: rule.decide_by,
    baseValue: toText(rule.base_value),
    active: rule.active,
    subjects: Object.fromEntries(
      rule.subjects.map((subject) => [
        subject.subject_definition.id,
        toText(subject.base_value),
      ]),
    ),
  };
}

// Whole percentage 0–100, or a non-negative number with at most 2 decimals.
function thresholdError(
  value: string,
  decideBy: PassRuleDecideBy,
): string | undefined {
  const text = value.trim();
  if (!text) return "Enter a value.";
  if (decideBy === "percentage") {
    if (!/^\d+$/.test(text) || Number(text) > 100) {
      return "Enter a whole percentage from 0 to 100.";
    }
    return undefined;
  }
  if (!/^\d+(\.\d{1,2})?$/.test(text)) {
    return "Enter a number, 0 or more, with at most 2 decimals.";
  }
  return undefined;
}

// The value the backend receives: a 2-decimal string.
function toBackendValue(text: string, decideBy: PassRuleDecideBy): string {
  return decideBy === "percentage"
    ? percentTextToFraction(text)
    : Number(text).toFixed(2);
}

function subjectsPayload(state: FormState): Record<string, string> {
  return Object.fromEntries(
    Object.keys(state.subjects)
      .sort()
      .map((id) => [id, toBackendValue(state.subjects[id], state.decideBy)]),
  );
}

interface PassRuleEditorProps {
  rule: PassRuleRecord | null;
  onClose: () => void;
  // Called after a successful save; the tab refreshes its list and closes.
  onSaved: () => void;
}

export default function PassRuleEditor({
  rule,
  onClose,
  onSaved,
}: PassRuleEditorProps) {
  const { clientAuthFetch } = useClientAuthFetch();
  const isEdit = rule !== null;
  const [initial] = useState(() => toFormState(rule));
  const [state, setState] = useState<FormState>(initial);
  const [serverErrors, setServerErrors] = useState<FieldErrors>({});

  // Subjects a pass rule can require. The endpoint takes `?school=` (not
  // `school-id`).
  const definitions = useQuery<ApiEnvelope<SubjectDefinitionRecord[]>>({
    queryKey: SUBJECT_DEFINITIONS_KEY,
    queryFn: async () => {
      const { data, error } = await clientAuthFetch<
        ApiEnvelope<SubjectDefinitionRecord[]>
      >(`subject-definition/list/?school=${SCHOOL_ID}`);
      if (error) throw new Error(error.message);
      return data!;
    },
    staleTime: QUERY_STALE_MS,
  });

  // The request body for the current form values.
  function buildBody(values: FormState): Record<string, unknown> {
    if (!rule) {
      return {
        school: SCHOOL_ID,
        name: values.name.trim(),
        type: values.type,
        decide_by: values.decideBy,
        base_value: toBackendValue(values.baseValue, values.decideBy),
        active: values.active,
        subjects: subjectsPayload(values),
      };
    }

    const body: Record<string, unknown> = { id: rule.id, school_id: SCHOOL_ID };
    if (values.name.trim() !== initial.name) body.name = values.name.trim();
    if (values.type !== initial.type) body.type = values.type;
    if (values.active !== initial.active) body.active = values.active;

    // The server validates base_value against decide_by, so the two are
    // always sent together when either one changes.
    if (
      values.decideBy !== initial.decideBy ||
      values.baseValue !== initial.baseValue
    ) {
      body.decide_by = values.decideBy;
      body.base_value = toBackendValue(values.baseValue, values.decideBy);
    }

    // Subject thresholds depend on the unit too, so they follow decide_by.
    if (
      values.decideBy !== initial.decideBy ||
      !isSameJson(subjectsPayload(values), subjectsPayload(initial))
    ) {
      body.subjects = subjectsPayload(values);
    }
    return body;
  }

  const { mutate, isPending } = useMutation<
    ApiEnvelope<PassRuleRecord>,
    SaveError,
    FormState
  >({
    mutationFn: async (values) => {
      const { data, error } = await clientAuthFetch<
        ApiEnvelope<PassRuleRecord>
      >(isEdit ? "pass-rule/detail/" : "pass-rule/list/", {
        method: isEdit ? "PUT" : "POST",
        body: buildBody(values),
      });
      if (error) throw new SaveError(error.message, error.data);
      return data!;
    },
    onSuccess: () => {
      toast.success(isEdit ? "Pass rule updated." : "Pass rule created.");
      onSaved();
    },
    onError: (err) => {
      setServerErrors(err.fieldErrors);
      toast.error(err.message);
    },
  });

  // Validation
  const nameError = !state.name.trim()
    ? "Enter a name."
    : state.name.trim().length > 100
      ? "Maximum 100 characters."
      : undefined;
  const baseError = thresholdError(state.baseValue, state.decideBy);
  const subjectErrors = Object.fromEntries(
    Object.entries(state.subjects)
      .map(
        ([id, value]) => [id, thresholdError(value, state.decideBy)] as const,
      )
      .filter(([, message]) => message !== undefined),
  ) as Record<string, string>;

  const hasProblems =
    !!nameError || !!baseError || Object.keys(subjectErrors).length > 0;
  const hasChanges = !isEdit || !isSameJson(state, initial);

  const thresholdLabel =
    state.type === "score"
      ? state.decideBy === "percentage"
        ? "Pass mark (% of total score)"
        : "Pass mark (aggregate score)"
      : state.decideBy === "percentage"
        ? "Subjects to pass (% of subjects offered)"
        : "Subjects to pass (number)";

  const sortedDefinitions = useMemo(
    () =>
      [...(definitions.data?.data ?? [])].sort((a, b) =>
        a.name.localeCompare(b.name),
      ),
    [definitions.data],
  );

  function updateState(patch: Partial<FormState>) {
    setState((previous) => ({ ...previous, ...patch }));
    setServerErrors({});
  }

  function toggleSubject(id: string, selected: boolean) {
    const next = { ...state.subjects };
    if (selected) next[id] = "";
    else delete next[id];
    updateState({ subjects: next });
  }

  return (
    <ConfigPanel
      title={isEdit ? `Edit ${rule.name}` : "New pass rule"}
      subtitle="Decides whether a student passes the term."
      submitLabel={isEdit ? "Save changes" : "Create rule"}
      isPending={isPending}
      canSubmit={!hasProblems && hasChanges}
      onSubmit={() => mutate(state)}
      onClose={onClose}
    >
      {isEdit && (
        <PublicationNotice>
          Type, unit, pass mark and active status cannot be changed while the
          rule is used by an arm whose results are locked. The server will
          reject the save if that applies.
        </PublicationNotice>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextField
          id="pr-name"
          label="Name"
          required
          placeholder="e.g. Standard pass rule"
          value={state.name}
          onChange={(name) => updateState({ name })}
          error={
            fieldMessage(serverErrors, "name") ??
            (state.name ? nameError : undefined)
          }
          className="md:col-span-2"
        />
        <SelectField
          id="pr-type"
          label="Decide pass by"
          required
          value={state.type}
          onChange={(type) => updateState({ type: type as PassRuleType })}
          options={[
            { value: "score", label: "Aggregate score" },
            { value: "count", label: "Number of subjects passed" },
          ]}
          error={fieldMessage(serverErrors, "type")}
        />
        <SelectField
          id="pr-decide-by"
          label="Measured as"
          required
          value={state.decideBy}
          onChange={(decideBy) =>
            updateState({ decideBy: decideBy as PassRuleDecideBy })
          }
          options={[
            { value: "percentage", label: "Percentage" },
            { value: "raw", label: "Raw value" },
          ]}
          hint="Changing this means the pass marks below must be re-entered."
          error={fieldMessage(serverErrors, "decide_by")}
        />
        <TextField
          id="pr-base-value"
          label={thresholdLabel}
          required
          type="number"
          min={0}
          max={state.decideBy === "percentage" ? 100 : undefined}
          step={state.decideBy === "percentage" ? 1 : 0.01}
          value={state.baseValue}
          onChange={(baseValue) => updateState({ baseValue })}
          error={
            fieldMessage(serverErrors, "base_value") ??
            (state.baseValue ? baseError : undefined)
          }
        />
      </div>

      <div className="border-t border-slate-100 pt-1">
        <ToggleRow
          label="Rule is active"
          description="Inactive rules are kept but are not enforced."
          checked={state.active}
          onChange={(active) => updateState({ active })}
        />
      </div>

      <div className="flex flex-col gap-3">
        <div>
          <h3 className="text-xs font-semibold text-slate-700">
            Subject requirements{" "}
            <span className="font-normal text-slate-400">· optional</span>
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            A student must also reach the mark set for each selected subject.
          </p>
        </div>

        {definitions.isPending ? (
          <p className="text-xs text-slate-400">Loading subjects…</p>
        ) : definitions.error ? (
          <p className="text-xs text-red-500">
            Could not load subjects: {definitions.error.message}
          </p>
        ) : sortedDefinitions.length === 0 ? (
          <p className="text-xs text-slate-400">
            This school has no subject definitions yet.
          </p>
        ) : (
          <ul className="max-h-72 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100">
            {sortedDefinitions.map((definition) => {
              const selected = definition.id in state.subjects;
              const error =
                subjectErrors[definition.id] && state.subjects[definition.id]
                  ? subjectErrors[definition.id]
                  : undefined;
              return (
                <li
                  key={definition.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-2 px-3 py-2.5"
                >
                  <label className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={(e) =>
                        toggleSubject(definition.id, e.target.checked)
                      }
                      className="h-4 w-4 accent-violet-600"
                    />
                    <span className="text-xs text-slate-700 truncate">
                      {definition.name}{" "}
                      <span className="text-slate-400">
                        ({definition.abbr})
                      </span>
                    </span>
                  </label>
                  {selected && (
                    <div className="sm:w-40">
                      <TextField
                        id={`pr-subject-${definition.id}`}
                        label={
                          state.decideBy === "percentage"
                            ? "Minimum %"
                            : "Minimum"
                        }
                        type="number"
                        min={0}
                        max={state.decideBy === "percentage" ? 100 : undefined}
                        value={state.subjects[definition.id]}
                        onChange={(value) =>
                          updateState({
                            subjects: {
                              ...state.subjects,
                              [definition.id]: value,
                            },
                          })
                        }
                        error={error}
                      />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {fieldMessage(serverErrors, "subjects") && (
          <p className="text-[11px] text-red-600">
            {fieldMessage(serverErrors, "subjects")}
          </p>
        )}
      </div>
    </ConfigPanel>
  );
}
