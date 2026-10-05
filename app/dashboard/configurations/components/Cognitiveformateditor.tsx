"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Cognitiveformateditor.tsx
//
// Create or edit one cognitive assessment format
// (POST / PUT cognitive-format/list|detail/).
//
// A format is a set of scoring units (e.g. CA 40, Exam 60). Backend rules
// mirrored here:
//   • unit names, abbreviations and display orders are unique
//   • abbreviations contain no spaces
//   • the units' max scores add up to (highest score − lowest score)
//
// The list and detail responses do not include the format's low and high, so
// they are only entered when creating. When editing, the backend compares the
// unit total against the range it already has and reports a mismatch.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { PlusCircle, Trash2 } from "lucide-react";
import { toast } from "react-toastify";

import { useClientAuthFetch } from "@/lib/Useclientauthfetch";
import type {
  ApiEnvelope,
  CognitiveFormatRecord,
} from "@/types/configurations";
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

interface UnitDraft {
  key: string;
  name: string;
  abbr: string;
  maxScore: string;
}

interface FormState {
  name: string;
  low: string;
  high: string;
  units: UnitDraft[];
}

function toFormState(format: CognitiveFormatRecord | null): FormState {
  if (!format) {
    return {
      name: "",
      low: "0",
      high: "100",
      units: [{ key: nextRowKey(), name: "", abbr: "", maxScore: "" }],
    };
  }
  return {
    name: format.name,
    low: "",
    high: "",
    units: [...format.units]
      .sort((a, b) => a.display_order - b.display_order)
      .map((unit) => ({
        key: nextRowKey(),
        name: unit.name,
        abbr: unit.abbr,
        maxScore: String(unit.max_score),
      })),
  };
}

// Display order follows the position of the row in the list.
function unitsPayload(units: UnitDraft[]) {
  return units.map((unit, index) => ({
    name: unit.name.trim(),
    abbr: unit.abbr.trim(),
    max_score: Number(unit.maxScore),
    display_order: index + 1,
  }));
}

interface Problems {
  name?: string;
  range?: string;
  units?: string;
  rows: Record<number, string>;
}

function validate(state: FormState, isEdit: boolean): Problems {
  const problems: Problems = { rows: {} };

  if (!state.name.trim()) problems.name = "Enter a name.";
  else if (state.name.trim().length > 100) problems.name = "Maximum 100 characters.";

  let expectedTotal: number | null = null;
  if (!isEdit) {
    if (!isWholeNumber(state.low) || !isWholeNumber(state.high)) {
      problems.range = "Low and high must be whole numbers.";
    } else if (Number(state.high) <= Number(state.low)) {
      problems.range = "High must be greater than low.";
    } else {
      expectedTotal = Number(state.high) - Number(state.low);
    }
  }

  if (state.units.length === 0) {
    problems.units = "Add at least one unit.";
    return problems;
  }

  const names = new Set<string>();
  const abbrs = new Set<string>();
  let total = 0;
  let allNumeric = true;

  state.units.forEach((unit, index) => {
    const name = unit.name.trim().toLowerCase();
    const abbr = unit.abbr.trim().toUpperCase();

    if (!name || name.length > 100) {
      problems.rows[index] = "Name must be 1–100 characters.";
    } else if (!abbr || abbr.length > 20) {
      problems.rows[index] = "Abbreviation must be 1–20 characters.";
    } else if (/\s/.test(abbr)) {
      problems.rows[index] = "Abbreviation cannot contain spaces. Use underscores.";
    } else if (!isWholeNumber(unit.maxScore) || Number(unit.maxScore) < 0) {
      problems.rows[index] = "Max score must be a whole number, 0 or more.";
    } else if (names.has(name)) {
      problems.rows[index] = "This name is used more than once.";
    } else if (abbrs.has(abbr)) {
      problems.rows[index] = `Abbreviation "${abbr}" is used more than once.`;
    }

    if (isWholeNumber(unit.maxScore)) total += Number(unit.maxScore);
    else allNumeric = false;
    names.add(name);
    abbrs.add(abbr);
  });

  if (
    expectedTotal !== null &&
    allNumeric &&
    Object.keys(problems.rows).length === 0 &&
    total !== expectedTotal
  ) {
    problems.units = `Unit scores add up to ${total} but the range needs ${expectedTotal}.`;
  }

  return problems;
}

interface CognitiveFormatEditorProps {
  format: CognitiveFormatRecord | null;
  onClose: () => void;
  // Called after a successful save; the tab refreshes its list and closes.
  onSaved: () => void;
}

export default function CognitiveFormatEditor({
  format,
  onClose,
  onSaved,
}: CognitiveFormatEditorProps) {
  const { clientAuthFetch } = useClientAuthFetch();
  const isEdit = format !== null;
  const [initial] = useState(() => toFormState(format));
  const [state, setState] = useState<FormState>(initial);
  const [serverErrors, setServerErrors] = useState<FieldErrors>({});

  // The request body for the current form values.
  function buildBody(values: FormState): Record<string, unknown> {
    const units = unitsPayload(values.units);
    if (!format) {
      return {
        school: SCHOOL_ID,
        name: values.name.trim(),
        low: Number(values.low),
        high: Number(values.high),
        units,
      };
    }
    // Edit: send only what changed. `units` replaces every unit when sent.
    const body: Record<string, unknown> = {
      id: format.id,
      school_id: SCHOOL_ID,
    };
    if (values.name.trim() !== initial.name) body.name = values.name.trim();
    if (!isSameJson(units, unitsPayload(initial.units))) body.units = units;
    return body;
  }

  const { mutate, isPending } = useMutation<
    ApiEnvelope<CognitiveFormatRecord>,
    SaveError,
    FormState
  >({
    mutationFn: async (values) => {
      const { data, error } = await clientAuthFetch<
        ApiEnvelope<CognitiveFormatRecord>
      >(isEdit ? "cognitive-format/detail/" : "cognitive-format/list/", {
        method: isEdit ? "PUT" : "POST",
        body: buildBody(values),
      });
      if (error) throw new SaveError(error.message, error.data);
      return data!;
    },
    onSuccess: () => {
      toast.success(isEdit ? "Cognitive format updated." : "Cognitive format created.");
      onSaved();
    },
    onError: (err) => {
      setServerErrors(err.fieldErrors);
      toast.error(err.message);
    },
  });

  const problems = validate(state, isEdit);
  const hasProblems =
    !!problems.name ||
    !!problems.range ||
    !!problems.units ||
    Object.keys(problems.rows).length > 0;
  const hasChanges = !isEdit || !isSameJson(state, initial);
  const serverUnits = splitItemErrors(serverErrors, "units");

  const total = state.units.reduce(
    (sum, unit) => sum + (isWholeNumber(unit.maxScore) ? Number(unit.maxScore) : 0),
    0,
  );

  function updateState(patch: Partial<FormState>) {
    setState((previous) => ({ ...previous, ...patch }));
    setServerErrors({});
  }

  function updateUnit(key: string, patch: Partial<UnitDraft>) {
    updateState({
      units: state.units.map((unit) =>
        unit.key === key ? { ...unit, ...patch } : unit,
      ),
    });
  }

  return (
    <ConfigPanel
      title={isEdit ? `Edit ${format.name}` : "New cognitive format"}
      subtitle="Splits a subject's score into units such as continuous assessment and exam."
      submitLabel={isEdit ? "Save changes" : "Create format"}
      isPending={isPending}
      canSubmit={!hasProblems && hasChanges}
      onSubmit={() => mutate(state)}
      onClose={onClose}
    >
      {isEdit && (
        <PublicationNotice>
          Formats used by an arm whose results are locked cannot be changed.
          The server will reject the save if that applies.
        </PublicationNotice>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <TextField
          id="cog-name"
          label="Name"
          required
          placeholder="e.g. 40 / 60 split"
          value={state.name}
          onChange={(name) => updateState({ name })}
          error={fieldMessage(serverErrors, "name") ?? (state.name ? problems.name : undefined)}
        />
        {!isEdit && (
          <>
            <TextField
              id="cog-low"
              label="Lowest score"
              required
              type="number"
              value={state.low}
              onChange={(low) => updateState({ low })}
              error={fieldMessage(serverErrors, "low") ?? problems.range}
            />
            <TextField
              id="cog-high"
              label="Highest score"
              required
              type="number"
              value={state.high}
              onChange={(high) => updateState({ high })}
              error={fieldMessage(serverErrors, "high")}
            />
          </>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-slate-700">
            Units <span className="font-normal text-slate-400">· total {total}</span>
          </h3>
          <button
            type="button"
            onClick={() =>
              updateState({
                units: [
                  ...state.units,
                  { key: nextRowKey(), name: "", abbr: "", maxScore: "" },
                ],
              })
            }
            className="cursor-pointer flex items-center gap-1 text-xs text-violet-600 hover:text-violet-700"
          >
            <PlusCircle size={12} /> Add unit
          </button>
        </div>

        {state.units.map((unit, index) => {
          const rowError = serverUnits.rows[index] ?? problems.rows[index];
          return (
            <div
              key={unit.key}
              className={`rounded-xl border p-3 flex flex-col gap-3 ${
                rowError ? "border-red-200 bg-red-50/40" : "border-slate-200 bg-slate-50/50"
              }`}
            >
              <div className="grid grid-cols-2 md:grid-cols-[1fr_8rem_8rem_auto] gap-3 items-end">
                <TextField
                  id={`cog-unit-name-${unit.key}`}
                  label={`Unit ${index + 1} name`}
                  placeholder="Continuous Assessment"
                  value={unit.name}
                  onChange={(name) => updateUnit(unit.key, { name })}
                  className="col-span-2 md:col-span-1"
                />
                <TextField
                  id={`cog-unit-abbr-${unit.key}`}
                  label="Abbreviation"
                  placeholder="CA"
                  value={unit.abbr}
                  onChange={(abbr) => updateUnit(unit.key, { abbr })}
                />
                <TextField
                  id={`cog-unit-max-${unit.key}`}
                  label="Max score"
                  type="number"
                  min={0}
                  value={unit.maxScore}
                  onChange={(maxScore) => updateUnit(unit.key, { maxScore })}
                />
                <button
                  type="button"
                  onClick={() =>
                    updateState({ units: state.units.filter((u) => u.key !== unit.key) })
                  }
                  disabled={state.units.length === 1}
                  aria-label="Remove unit"
                  className="cursor-pointer justify-self-end p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              {rowError && <p className="text-[11px] text-red-600">{rowError}</p>}
            </div>
          );
        })}

        {(serverUnits.general ?? problems.units) && (
          <p className="text-[11px] text-red-600">
            {serverUnits.general ?? problems.units}
          </p>
        )}
      </div>
    </ConfigPanel>
  );
}
