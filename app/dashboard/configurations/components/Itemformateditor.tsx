"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Itemformateditor.tsx
//
// Create or edit an affective or psychomotor assessment format. The two
// formats have the same shape — a name plus an ordered list of scored items —
// and differ only in names:
//
//   affective     POST|PUT affective-format/…     items key "behaviours"
//                 each item: { behaviour, max_score, display_order }
//   psychomotor   POST|PUT psychomotor-format/…   items key "activities"
//                 each item: { activity, max_score, display_order }
//
// Backend rules mirrored here: item names are unique and display orders are
// unique (display order follows the row position). On edit the item list is
// only sent when it changed, because the backend replaces every item when the
// list is present, and refuses to replace items that already have scores.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { PlusCircle, Trash2 } from "lucide-react";
import { toast } from "react-toastify";

import { useClientAuthFetch } from "@/lib/Useclientauthfetch";
import type { ApiEnvelope } from "@/types/configurations";
import {
  SaveError,
  fieldMessage,
  isSameJson,
  isWholeNumber,
  nextRowKey,
  splitItemErrors,
  type FieldErrors,
} from "../configutils";
import ConfigPanel from "./Configpanel";
import { PublicationNotice, TextField } from "./Configui";

const SCHOOL_ID = process.env.NEXT_PUBLIC_SCHOOL_ID ?? "";

// Describes which of the two formats the editor is working on.
export interface ItemFormatKind {
  endpointBase: "affective-format" | "psychomotor-format";
  itemsKey: "behaviours" | "activities";
  itemKey: "behaviour" | "activity";
  formatLabel: string; // "Affective"
  itemLabel: string; // "Behaviour"
  itemLabelPlural: string; // "behaviours"
}

// Both API shapes reduced to one editable shape.
export interface ItemFormat {
  id: string;
  name: string;
  items: { label: string; maxScore: number; displayOrder: number }[];
}

interface ItemDraft {
  key: string;
  label: string;
  maxScore: string;
}

interface FormState {
  name: string;
  items: ItemDraft[];
}

function toFormState(format: ItemFormat | null): FormState {
  if (!format) {
    return {
      name: "",
      items: [{ key: nextRowKey(), label: "", maxScore: "5" }],
    };
  }
  return {
    name: format.name,
    items: [...format.items]
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((item) => ({
        key: nextRowKey(),
        label: item.label,
        maxScore: String(item.maxScore),
      })),
  };
}

interface Problems {
  name?: string;
  items?: string;
  rows: Record<number, string>;
}

function validate(state: FormState, kind: ItemFormatKind): Problems {
  const problems: Problems = { rows: {} };

  if (!state.name.trim()) problems.name = "Enter a name.";
  else if (state.name.trim().length > 100)
    problems.name = "Maximum 100 characters.";

  if (state.items.length === 0) {
    problems.items = `Add at least one ${kind.itemLabel.toLowerCase()}.`;
    return problems;
  }

  const seen = new Set<string>();
  state.items.forEach((item, index) => {
    const label = item.label.trim().toLowerCase();
    if (!label || label.length > 100) {
      problems.rows[index] = `${kind.itemLabel} must be 1–100 characters.`;
    } else if (!isWholeNumber(item.maxScore) || Number(item.maxScore) < 0) {
      problems.rows[index] = "Max score must be a whole number, 0 or more.";
    } else if (seen.has(label)) {
      problems.rows[index] =
        `This ${kind.itemLabel.toLowerCase()} is used more than once.`;
    }
    seen.add(label);
  });

  return problems;
}

interface ItemFormatEditorProps {
  kind: ItemFormatKind;
  format: ItemFormat | null;
  onClose: () => void;
  // Called after a successful save; the tab refreshes its list and closes.
  onSaved: () => void;
}

export default function ItemFormatEditor({
  kind,
  format,
  onClose,
  onSaved,
}: ItemFormatEditorProps) {
  const { clientAuthFetch } = useClientAuthFetch();
  const isEdit = format !== null;
  const [initial] = useState(() => toFormState(format));
  const [state, setState] = useState<FormState>(initial);
  const [serverErrors, setServerErrors] = useState<FieldErrors>({});

  // The item objects the backend expects, keyed by `behaviour` or `activity`.
  function itemsPayload(items: ItemDraft[]) {
    return items.map((item, index) => ({
      [kind.itemKey]: item.label.trim(),
      max_score: Number(item.maxScore),
      display_order: index + 1,
    }));
  }

  // The request body for the current form values.
  function buildBody(values: FormState): Record<string, unknown> {
    const items = itemsPayload(values.items);
    if (!format) {
      return {
        school: SCHOOL_ID,
        name: values.name.trim(),
        [kind.itemsKey]: items,
      };
    }
    const body: Record<string, unknown> = {
      id: format.id,
      school_id: SCHOOL_ID,
    };
    if (values.name.trim() !== initial.name) body.name = values.name.trim();
    if (!isSameJson(items, itemsPayload(initial.items))) {
      body[kind.itemsKey] = items;
    }
    return body;
  }

  const { mutate, isPending } = useMutation<
    ApiEnvelope<unknown>,
    SaveError,
    FormState
  >({
    mutationFn: async (values) => {
      const { data, error } = await clientAuthFetch<ApiEnvelope<unknown>>(
        `${kind.endpointBase}/${isEdit ? "detail" : "list"}/`,
        {
          method: isEdit ? "PUT" : "POST",
          body: buildBody(values),
        },
      );
      if (error) throw new SaveError(error.message, error.data);
      return data!;
    },
    onSuccess: () => {
      toast.success(
        isEdit
          ? `${kind.formatLabel} format updated.`
          : `${kind.formatLabel} format created.`,
      );
      onSaved();
    },
    onError: (err) => {
      setServerErrors(err.fieldErrors);
      toast.error(err.message);
    },
  });

  const problems = validate(state, kind);
  const hasProblems =
    !!problems.name ||
    !!problems.items ||
    Object.keys(problems.rows).length > 0;
  const hasChanges = !isEdit || !isSameJson(state, initial);
  const serverItems = splitItemErrors(serverErrors, kind.itemsKey);

  function updateState(patch: Partial<FormState>) {
    setState((previous) => ({ ...previous, ...patch }));
    setServerErrors({});
  }

  function updateItem(key: string, patch: Partial<ItemDraft>) {
    updateState({
      items: state.items.map((item) =>
        item.key === key ? { ...item, ...patch } : item,
      ),
    });
  }

  return (
    <ConfigPanel
      title={
        isEdit
          ? `Edit ${format.name}`
          : `New ${kind.formatLabel.toLowerCase()} format`
      }
      subtitle={`A list of ${kind.itemLabelPlural} that are scored for each student.`}
      submitLabel={isEdit ? "Save changes" : "Create format"}
      isPending={isPending}
      canSubmit={!hasProblems && hasChanges}
      onSubmit={() => mutate(state)}
      onClose={onClose}
    >
      {isEdit && (
        <PublicationNotice>
          Formats used by an arm whose results are locked cannot be changed.
          Once scores have been recorded against the {kind.itemLabelPlural},
          that list cannot be changed either. The server will reject the save if
          either applies.
        </PublicationNotice>
      )}

      <TextField
        id={`${kind.endpointBase}-name`}
        label="Name"
        required
        placeholder="e.g. Default"
        value={state.name}
        onChange={(name) => updateState({ name })}
        error={
          fieldMessage(serverErrors, "name") ??
          (state.name ? problems.name : undefined)
        }
        className="md:max-w-sm"
      />

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-slate-700">
            {kind.itemLabel === "Behaviour" ? "Behaviours" : "Activities"}
          </h3>
          <button
            type="button"
            onClick={() =>
              updateState({
                items: [
                  ...state.items,
                  { key: nextRowKey(), label: "", maxScore: "5" },
                ],
              })
            }
            className="cursor-pointer flex items-center gap-1 text-xs text-violet-600 hover:text-violet-700"
          >
            <PlusCircle size={12} /> Add {kind.itemLabel.toLowerCase()}
          </button>
        </div>

        {state.items.map((item, index) => {
          const rowError = serverItems.rows[index] ?? problems.rows[index];
          return (
            <div
              key={item.key}
              className={`rounded-xl border p-3 flex flex-col gap-3 ${
                rowError
                  ? "border-red-200 bg-red-50/40"
                  : "border-slate-200 bg-slate-50/50"
              }`}
            >
              <div className="grid grid-cols-[1fr_6rem_auto] gap-3 items-end">
                <TextField
                  id={`${kind.endpointBase}-item-${item.key}`}
                  label={`${kind.itemLabel} ${index + 1}`}
                  value={item.label}
                  onChange={(label) => updateItem(item.key, { label })}
                />
                <TextField
                  id={`${kind.endpointBase}-max-${item.key}`}
                  label="Max score"
                  type="number"
                  min={0}
                  value={item.maxScore}
                  onChange={(maxScore) => updateItem(item.key, { maxScore })}
                />
                <button
                  type="button"
                  onClick={() =>
                    updateState({
                      items: state.items.filter((i) => i.key !== item.key),
                    })
                  }
                  disabled={state.items.length === 1}
                  aria-label={`Remove ${kind.itemLabel.toLowerCase()}`}
                  className="cursor-pointer p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              {rowError && (
                <p className="text-[11px] text-red-600">{rowError}</p>
              )}
            </div>
          );
        })}

        {(serverItems.general ?? problems.items) && (
          <p className="text-[11px] text-red-600">
            {serverItems.general ?? problems.items}
          </p>
        )}
      </div>
    </ConfigPanel>
  );
}
