"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Gradingformateditor.tsx
//
// Create or edit one grading format (POST / PUT grading-format/list|detail/).
//
// Backend rules mirrored here so mistakes show before the request is sent:
//   • high must be greater than low
//   • at least one grade band
//   • each band: low ≤ high, inside the format's range
//   • symbols and remarks are unique across bands
//   • bands together cover every score from low to high with no gap or overlap
//
// On edit, `grades` is only sent when the bands changed, because the backend
// replaces every band whenever the list is present.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { PlusCircle, Trash2 } from "lucide-react";
import { toast } from "react-toastify";

import { useClientAuthFetch } from "@/lib/Useclientauthfetch";
import type {
  ApiEnvelope,
  GradingFormatRecord,
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
import { PublicationNotice, TextField, ToggleRow } from "./Configui";

const SCHOOL_ID = process.env.NEXT_PUBLIC_SCHOOL_ID ?? "";

interface BandDraft {
  key: string;
  symbol: string;
  remark: string;
  low: string;
  high: string;
  passed: boolean;
}

interface FormState {
  name: string;
  low: string;
  high: string;
  bands: BandDraft[];
}

function toFormState(format: GradingFormatRecord | null): FormState {
  if (!format) {
    return {
      name: "",
      low: "0",
      high: "100",
      bands: [
        { key: nextRowKey(), symbol: "", remark: "", low: "0", high: "100", passed: true },
      ],
    };
  }
  return {
    name: format.name,
    low: String(format.low),
    high: String(format.high),
    bands: [...format.grades]
      .sort((a, b) => a.low - b.low)
      .map((grade) => ({
        key: nextRowKey(),
        symbol: grade.symbol,
        remark: grade.remark,
        low: String(grade.low),
        high: String(grade.high),
        passed: grade.passed,
      })),
  };
}

// The band fields the backend receives, in a fixed order so two lists can be
// compared with isSameJson.
function bandsPayload(bands: BandDraft[]) {
  return bands.map((band) => ({
    symbol: band.symbol.trim(),
    remark: band.remark.trim(),
    low: Number(band.low),
    high: Number(band.high),
    passed: band.passed,
  }));
}

interface ValidationResult {
  name?: string;
  range?: string;
  bands?: string;
  rows: Record<number, string>;
}

function validate(state: FormState): ValidationResult {
  const result: ValidationResult = { rows: {} };

  if (!state.name.trim()) result.name = "Enter a name.";
  else if (state.name.trim().length > 100) result.name = "Maximum 100 characters.";

  if (!isWholeNumber(state.low) || !isWholeNumber(state.high)) {
    result.range = "Low and high must be whole numbers.";
    return result;
  }
  const low = Number(state.low);
  const high = Number(state.high);
  if (high <= low) {
    result.range = "High must be greater than low.";
    return result;
  }

  if (state.bands.length === 0) {
    result.bands = "Add at least one grade band.";
    return result;
  }

  const seenSymbols = new Set<string>();
  const seenRemarks = new Set<string>();
  const numeric: { low: number; high: number }[] = [];

  state.bands.forEach((band, index) => {
    const symbol = band.symbol.trim().toUpperCase();
    const remark = band.remark.trim().toLowerCase();

    if (!symbol || symbol.length > 5) {
      result.rows[index] = "Symbol must be 1–5 characters.";
    } else if (!remark || remark.length > 50) {
      result.rows[index] = "Remark must be 1–50 characters.";
    } else if (!isWholeNumber(band.low) || !isWholeNumber(band.high)) {
      result.rows[index] = "Low and high must be whole numbers.";
    } else if (Number(band.high) < Number(band.low)) {
      result.rows[index] = "High must not be below low.";
    } else if (Number(band.low) < low || Number(band.high) > high) {
      result.rows[index] = `Must stay within ${low}–${high}.`;
    } else if (seenSymbols.has(symbol)) {
      result.rows[index] = `Symbol "${symbol}" is used more than once.`;
    } else if (seenRemarks.has(remark)) {
      result.rows[index] = "This remark is used more than once.";
    } else {
      numeric.push({ low: Number(band.low), high: Number(band.high) });
    }
    seenSymbols.add(symbol);
    seenRemarks.add(remark);
  });

  // Coverage is only meaningful once every row is individually valid.
  if (Object.keys(result.rows).length === 0) {
    const sorted = [...numeric].sort((a, b) => a.low - b.low);
    let expected = low;
    for (const band of sorted) {
      if (band.low !== expected) {
        result.bands = `Bands must cover ${low}–${high} with no gap or overlap. Expected a band starting at ${expected}.`;
        return result;
      }
      expected = band.high + 1;
    }
    if (expected !== high + 1) {
      result.bands = `Bands end at ${expected - 1} but the format goes up to ${high}.`;
    }
  }

  return result;
}

interface GradingFormatEditorProps {
  // null creates a new format; a record edits that format.
  format: GradingFormatRecord | null;
  onClose: () => void;
  // Called after a successful save; the tab refreshes its list and closes.
  onSaved: () => void;
}

export default function GradingFormatEditor({
  format,
  onClose,
  onSaved,
}: GradingFormatEditorProps) {
  const { clientAuthFetch } = useClientAuthFetch();
  const isEdit = format !== null;
  const [initial] = useState(() => toFormState(format));
  const [state, setState] = useState<FormState>(initial);
  const [serverErrors, setServerErrors] = useState<FieldErrors>({});

  // The request body for the current form values.
  function buildBody(values: FormState): Record<string, unknown> {
    const bands = bandsPayload(values.bands);
    if (!format) {
      return {
        school: SCHOOL_ID,
        name: values.name.trim(),
        low: Number(values.low),
        high: Number(values.high),
        grades: bands,
      };
    }
    // Edit: send only what changed.
    const body: Record<string, unknown> = {
      id: format.id,
      school_id: SCHOOL_ID,
    };
    if (values.name.trim() !== initial.name) body.name = values.name.trim();
    if (values.low !== initial.low) body.low = Number(values.low);
    if (values.high !== initial.high) body.high = Number(values.high);
    if (!isSameJson(bands, bandsPayload(initial.bands))) body.grades = bands;
    return body;
  }

  const { mutate, isPending } = useMutation<
    ApiEnvelope<GradingFormatRecord>,
    SaveError,
    FormState
  >({
    mutationFn: async (values) => {
      const { data, error } = await clientAuthFetch<
        ApiEnvelope<GradingFormatRecord>
      >(isEdit ? "grading-format/detail/" : "grading-format/list/", {
        method: isEdit ? "PUT" : "POST",
        body: buildBody(values),
      });
      if (error) throw new SaveError(error.message, error.data);
      return data!;
    },
    onSuccess: () => {
      toast.success(isEdit ? "Grading format updated." : "Grading format created.");
      onSaved();
    },
    onError: (err) => {
      setServerErrors(err.fieldErrors);
      toast.error(err.message);
    },
  });

  const problems = validate(state);
  const hasProblems =
    !!problems.name ||
    !!problems.range ||
    !!problems.bands ||
    Object.keys(problems.rows).length > 0;
  const hasChanges = !isEdit || !isSameJson(state, { ...initial });
  const serverBands = splitItemErrors(serverErrors, "grades");

  function updateState(patch: Partial<FormState>) {
    setState((previous) => ({ ...previous, ...patch }));
    setServerErrors({});
  }

  function updateBand(key: string, patch: Partial<BandDraft>) {
    updateState({
      bands: state.bands.map((band) =>
        band.key === key ? { ...band, ...patch } : band,
      ),
    });
  }

  function addBand() {
    // Start the new band just above the highest existing one.
    const highest = Math.max(
      ...state.bands.map((band) => (isWholeNumber(band.high) ? Number(band.high) : -Infinity)),
    );
    const start = Number.isFinite(highest) ? String(highest + 1) : state.low;
    updateState({
      bands: [
        ...state.bands,
        { key: nextRowKey(), symbol: "", remark: "", low: start, high: start, passed: true },
      ],
    });
  }

  function removeBand(key: string) {
    updateState({ bands: state.bands.filter((band) => band.key !== key) });
  }

  return (
    <ConfigPanel
      title={isEdit ? `Edit ${format.name}` : "New grading format"}
      subtitle="A grading format turns a score into a symbol and remark."
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
          id="gf-name"
          label="Name"
          required
          placeholder="e.g. Standard 100-point scale"
          value={state.name}
          onChange={(name) => updateState({ name })}
          error={fieldMessage(serverErrors, "name") ?? (state.name ? problems.name : undefined)}
          className="md:col-span-1"
        />
        <TextField
          id="gf-low"
          label="Lowest score"
          required
          type="number"
          value={state.low}
          onChange={(low) => updateState({ low })}
          error={fieldMessage(serverErrors, "low") ?? problems.range}
        />
        <TextField
          id="gf-high"
          label="Highest score"
          required
          type="number"
          value={state.high}
          onChange={(high) => updateState({ high })}
          error={fieldMessage(serverErrors, "high")}
        />
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-slate-700">Grade bands</h3>
          <button
            type="button"
            onClick={addBand}
            className="cursor-pointer flex items-center gap-1 text-xs text-violet-600 hover:text-violet-700"
          >
            <PlusCircle size={12} /> Add band
          </button>
        </div>

        {state.bands.map((band, index) => {
          const rowError = serverBands.rows[index] ?? problems.rows[index];
          return (
            <div
              key={band.key}
              className={`rounded-xl border p-3 flex flex-col gap-3 ${
                rowError ? "border-red-200 bg-red-50/40" : "border-slate-200 bg-slate-50/50"
              }`}
            >
              <div className="grid grid-cols-2 md:grid-cols-[6rem_1fr_6rem_6rem] gap-3">
                <TextField
                  id={`gf-symbol-${band.key}`}
                  label="Symbol"
                  placeholder="A"
                  value={band.symbol}
                  onChange={(symbol) => updateBand(band.key, { symbol })}
                />
                <TextField
                  id={`gf-remark-${band.key}`}
                  label="Remark"
                  placeholder="Excellent"
                  value={band.remark}
                  onChange={(remark) => updateBand(band.key, { remark })}
                  className="col-span-2 md:col-span-1 order-last md:order-0"
                />
                <TextField
                  id={`gf-band-low-${band.key}`}
                  label="From"
                  type="number"
                  value={band.low}
                  onChange={(low) => updateBand(band.key, { low })}
                />
                <TextField
                  id={`gf-band-high-${band.key}`}
                  label="To"
                  type="number"
                  value={band.high}
                  onChange={(high) => updateBand(band.key, { high })}
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <ToggleRow
                  compact
                  label="Counts as a pass"
                  checked={band.passed}
                  onChange={(passed) => updateBand(band.key, { passed })}
                />
                <button
                  type="button"
                  onClick={() => removeBand(band.key)}
                  disabled={state.bands.length === 1}
                  aria-label="Remove band"
                  className="cursor-pointer p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              {rowError && <p className="text-[11px] text-red-600">{rowError}</p>}
            </div>
          );
        })}

        {(serverBands.general ?? problems.bands) && (
          <p className="text-[11px] text-red-600">
            {serverBands.general ?? problems.bands}
          </p>
        )}
      </div>
    </ConfigPanel>
  );
}
