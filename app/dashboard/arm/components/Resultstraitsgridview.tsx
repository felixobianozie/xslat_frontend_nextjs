"use client";

// ─────────────────────────────────────────────────────────────────────────────
// ResultsTraitsGridView.tsx
//
// Shared display + edit grid for one student's affective OR psychomotor
// scores. Both views use the same structure (a list of named traits scored
// against a small format with grade lookup), so one component covers both
// with a `kind` discriminator.
//
// Display mode (default):
//   - Table per row: Trait name, Score / total, Grade chip, Remark.
//   - "Edit" button toggles edit mode for the whole grid.
//
// Edit mode:
//   - Each row's score becomes a number input bound 0 ≤ x ≤ trait max.
//   - The Grade column updates LIVE as the user types — useful feedback that
//     mirrors the original draft's behaviour.
//   - "Mark All Absent" sets every score to -1 (absent marker).
//   - Save submits the diff; Cancel reverts to original values.
//
// Backend wiring:
//   PUT arm/detail/scores/
//     body (kind = "affective"):
//       { id, school_id, affective: [{behaviour: behaviourId, entries: [{student, score}]}] }
//     body (kind = "psychomotor"):
//       { id, school_id, psychomotor: [{activity: activityId, entries: [{student, score}]}] }
//
//   One trait-entry per touched trait; each entry has exactly one student
//   (the one this panel is scoped to). Only edited rows are submitted so
//   untouched scores are left intact by the backend.
//
// Validation lives per-cell (same pattern as RecordAssessmentPanel) so an
// invalid value blocks save without losing the user's other edits.
// ─────────────────────────────────────────────────────────────────────────────

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Save, UserX, X } from "lucide-react";
import { toast } from "react-toastify";

import { useClientAuthFetch } from "@/lib/Useclientauthfetch";
import { useArmDetails } from "../context/Armdetailsprovider";
import ButtonLoader from "../../components/Buttonloader";
import EmptyState from "../../components/Emptystate";
import { resolveTraitGrade, TraitAssessmentResult } from "./results-aggregates";
import type { ApiEnvelope } from "../page";

// ── Constants ────────────────────────────────────────────────────────────────

const SCHOOL_ID = process.env.NEXT_PUBLIC_SCHOOL_ID ?? "";

// A "trait" is either an affective behaviour or a psychomotor activity.
// Their shapes are nearly identical — same id / display_order / max_score —
// but the human-readable label sits in a differently-named field per kind
// (`behaviour` vs `activity`). The helpers below smooth that over.
type TraitDef = ArmAffAssessmentBehaviour | ArmPsyAssessmentActivity;

// Reads a trait's per-cell cap. Backend returns `max_score` directly on both
// AffectiveAssessmentBehaviour and PsychomotorAssessmentActivity, so this is
// a single field lookup with a safe 0 fallback.
function traitCap(t: TraitDef): number {
  return t.max_score ?? 0;
}

// Reads a trait's display label. Affective behaviours use the `behaviour`
// field; psychomotor activities use `activity`. A simple `in` check narrows
// the union at runtime — no need to thread the `kind` discriminator down
// into every row/card component.
function traitLabel(t: TraitDef): string {
  return "behaviour" in t ? t.behaviour : t.activity;
}

interface ResultsTraitsGridViewProps {
  kind: "affective" | "psychomotor";
  student: ArmStudent;
  // Trait definitions from the assessment format (ordered traits in this kind).
  traits: TraitDef[];
  // Grading format used to derive the grade column.
  gradingFormat: ArmGradingFormat | null | undefined;
  // Existing results keyed by trait id — comes from computeClassAssessment.
  existingResults: Record<string, TraitAssessmentResult>;
  // When true, the Edit / Mark All Absent / Save controls are suppressed and
  // the grid renders as a pure read-only display. Used by ResultsGeneralView
  // to surface behaviours/skills alongside the remark editors without
  // duplicating the dedicated BEHAVIOURS / SKILLS filter views.
  readonly?: boolean;
}

// User-facing labels for the kind — keeps copy in one place.
const COPY = {
  affective: {
    sectionTitle: "Behaviours",
    sectionBlurb: "Affective traits assessment for the current term.",
    rowLabel: "Behaviour",
    emptyTitle: "Behaviour format not configured",
    emptyDescription:
      "Set up an affective assessment format and grading format for this arm before recording behaviours.",
  },
  psychomotor: {
    sectionTitle: "Skills",
    sectionBlurb: "Psychomotor traits assessment for the current term.",
    rowLabel: "Skill",
    emptyTitle: "Skills format not configured",
    emptyDescription:
      "Set up a psychomotor assessment format and grading format for this arm before recording skills.",
  },
} as const;

export default function ResultsTraitsGridView({
  kind,
  student,
  traits,
  gradingFormat,
  existingResults,
  readonly = false,
}: ResultsTraitsGridViewProps) {
  const { armId } = useArmDetails();
  const queryClient = useQueryClient();
  const { clientAuthFetch } = useClientAuthFetch();
  const copy = COPY[kind];

  const [editing, setEditing] = useState(false);
  // Map from trait id → current input string. Strings (not numbers) so we
  // can represent "cleared" state without coercing to 0.
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());

  // Sort traits by display_order so the table is consistent across renders.
  const orderedTraits = useMemo(
    () => [...traits].sort((a, b) => a.display_order - b.display_order),
    [traits],
  );

  // If every trait in this format shares the same max_score, expose that
  // single cap so the Score column header can read "Score /100" (etc.) — a
  // hint to whoever is entering scores. Returns null when traits have
  // differing caps; in that case the per-row "/cap" indicator still surfaces
  // each row's own ceiling.
  const sharedCap = useMemo<number | null>(() => {
    if (orderedTraits.length === 0) return null;
    const first = traitCap(orderedTraits[0]);
    return orderedTraits.every((t) => traitCap(t) === first) ? first : null;
  }, [orderedTraits]);

  // Seed inputs from existing results when entering edit mode (or when the
  // student/results change while in edit mode).
  useEffect(() => {
    if (!editing) return;
    const next: Record<string, string> = {};
    for (const t of orderedTraits) {
      const existing = existingResults[t.id];
      next[t.id] = existing ? String(existing.score) : "";
    }
    setInputs(next);
    setTouched(new Set());
  }, [editing, orderedTraits, existingResults, student.id]);

  // ── Validation ────────────────────────────────────────────────────────────
  // Per-trait error map. Empty string is allowed (= no entry yet). -1 is
  // valid (= absent marker). Otherwise must be 0..trait cap.
  const errors = useMemo(() => {
    const result: Record<string, string> = {};
    for (const t of orderedTraits) {
      const raw = inputs[t.id] ?? "";
      if (raw === "") continue;
      const num = Number(raw);
      const cap = traitCap(t);
      if (Number.isNaN(num)) {
        result[t.id] = "Number required";
      } else if (num === -1) {
        // valid absent marker
      } else if (num < 0) {
        result[t.id] = "≥ 0";
      } else if (num > cap) {
        result[t.id] = `≤ ${cap}`;
      }
    }
    return result;
  }, [orderedTraits, inputs]);

  const hasErrors = Object.keys(errors).length > 0;

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleCellChange(traitId: string, raw: string) {
    setInputs((prev) => ({ ...prev, [traitId]: raw }));
    setTouched((prev) => new Set(prev).add(traitId));
  }

  // Mark all rows absent — sets each input to -1 and flags every trait as touched.
  function handleMarkAllAbsent() {
    const next: Record<string, string> = {};
    for (const t of orderedTraits) next[t.id] = "-1";
    setInputs(next);
    setTouched(new Set(orderedTraits.map((t) => t.id)));
  }

  function handleCancel() {
    setEditing(false);
    setInputs({});
    setTouched(new Set());
  }

  // ── Mutation ──────────────────────────────────────────────────────────────
  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      // Build the per-trait entries from touched rows that have valid values.
      // Each entry contains a single { student, score } pair since the panel
      // is scoped to one student at a time.
      const entries: { trait: string; score: number }[] = [];
      for (const traitId of touched) {
        const raw = inputs[traitId];
        if (raw === undefined || raw === "") continue;
        entries.push({ trait: traitId, score: Number(raw) });
      }
      if (entries.length === 0) {
        throw new Error("No changes to save.");
      }

      // Reshape into the backend's expected list-of-trait-entries shape.
      // Backend uses different field names per kind:
      //   - affective:    each entry's trait id sits under `behaviour`
      //   - psychomotor:  each entry's trait id sits under `activity`
      const reshaped = entries.map((e) =>
        kind === "affective"
          ? {
              behaviour: e.trait,
              entries: [{ student: student.id, score: e.score }],
            }
          : {
              activity: e.trait,
              entries: [{ student: student.id, score: e.score }],
            },
      );

      const body =
        kind === "affective"
          ? { id: armId, school_id: SCHOOL_ID, affective: reshaped }
          : { id: armId, school_id: SCHOOL_ID, psychomotor: reshaped };

      const { data, error } = await clientAuthFetch<ApiEnvelope<unknown>>(
        "arm/detail/scores/",
        { method: "PUT", body },
      );
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      toast.success(
        kind === "affective" ? "Behaviours saved." : "Skills saved.",
      );
      // Arm detail carries the updated assessment array on its next read.
      queryClient.invalidateQueries({ queryKey: ["arm-detail", armId] });
      setEditing(false);
      setInputs({});
      setTouched(new Set());
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Could not save.");
    },
  });

  // ── Empty state ───────────────────────────────────────────────────────────
  if (orderedTraits.length === 0) {
    return (
      <EmptyState
        variant="generic"
        title={copy.emptyTitle}
        description={copy.emptyDescription}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* ── Section title + edit toggle ────────────────────────────── */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">
            {copy.sectionTitle}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">{copy.sectionBlurb}</p>
        </div>
        {/* Action buttons are suppressed entirely in read-only mode — the
            grid renders as a pure display. */}
        {!readonly && !editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-slate-200 bg-white text-slate-600 rounded-xl hover:border-violet-300 transition-colors cursor-pointer"
          >
            <Pencil size={12} />
            Edit
          </button>
        )}
        {!readonly && editing && (
          <button
            type="button"
            onClick={handleMarkAllAbsent}
            disabled={isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-slate-300 bg-slate-900 text-white rounded-xl hover:bg-slate-700 disabled:opacity-50 transition-colors cursor-pointer"
            title="Set every row to absent (-1)"
          >
            <UserX size={12} />
            Mark All Absent
          </button>
        )}
      </div>

      {/* ── Desktop table ──────────────────────────────────────────── */}
      <div className="hidden md:block border border-slate-200 rounded-2xl overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-100 text-left text-slate-500 border-b border-slate-200">
              <th className="px-4 py-3 font-semibold">{copy.rowLabel}</th>
              <th className="px-3 py-3 font-semibold text-center">
                Score
                {/* Shared-cap hint — surfaces the format's single max_score
                    next to the column heading so users know what they're
                    scoring against, even while editing. Rendered only when
                    every trait in the format shares the same cap. */}
                {sharedCap !== null && (
                  <span className="ml-1 text-[10px] font-normal text-slate-400">
                    /{sharedCap}
                  </span>
                )}
              </th>
              <th className="px-3 py-3 font-semibold text-center">Grade</th>
              <th className="px-3 py-3 font-semibold">Remark</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-50">
            {orderedTraits.map((trait, index) => (
              <TraitRow
                key={trait.id}
                trait={trait}
                existing={existingResults[trait.id]}
                editing={editing}
                inputValue={inputs[trait.id] ?? ""}
                error={errors[trait.id]}
                gradingFormat={gradingFormat}
                onChange={(v) => handleCellChange(trait.id, v)}
                striped={index % 2 === 1}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Mobile cards ───────────────────────────────────────────── */}
      <div className="flex flex-col gap-2 md:hidden">
        {orderedTraits.map((trait) => (
          <TraitCard
            key={trait.id}
            trait={trait}
            existing={existingResults[trait.id]}
            editing={editing}
            inputValue={inputs[trait.id] ?? ""}
            error={errors[trait.id]}
            gradingFormat={gradingFormat}
            onChange={(v) => handleCellChange(trait.id, v)}
          />
        ))}
      </div>

      {/* ── Edit action bar ────────────────────────────────────────── */}
      {editing && (
        <div className="flex items-center justify-end gap-2 pt-1">
          <span className="text-[11px] text-slate-500 mr-auto">
            {touched.size === 0
              ? "No changes yet."
              : `${touched.size} row${touched.size === 1 ? "" : "s"} edited.`}
          </span>
          <button
            type="button"
            onClick={handleCancel}
            disabled={isPending}
            className="flex items-center gap-1.5 px-3 py-2 text-xs border border-slate-200 bg-white text-slate-600 rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-colors cursor-pointer"
          >
            <X size={12} />
            Cancel
          </button>
          <button
            type="button"
            onClick={() => mutate()}
            disabled={touched.size === 0 || hasErrors || isPending}
            className="relative flex items-center justify-center gap-1.5 px-3 py-2 text-xs bg-violet-600 text-white rounded-xl hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm shadow-violet-200 min-w-24 cursor-pointer"
          >
            {/* Flex layout stays applied in BOTH states so the icon + gap
                + text always reserve space — only `invisible` toggles. The
                loader sits on top via `absolute inset-0` and never affects
                sizing. Locks the button's intrinsic width across loading
                transitions. */}
            <span
              className={`flex items-center gap-1.5 ${
                isPending ? "invisible" : ""
              }`}
            >
              <Save size={12} />
              Save
            </span>
            <span
              className={`absolute inset-0 flex items-center justify-center ${
                isPending ? "" : "invisible"
              }`}
            >
              <ButtonLoader />
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

// ── Single table row (desktop) ───────────────────────────────────────────────
function TraitRow({
  trait,
  existing,
  editing,
  inputValue,
  error,
  gradingFormat,
  onChange,
  striped,
}: {
  trait: TraitDef;
  existing: TraitAssessmentResult | undefined;
  editing: boolean;
  inputValue: string;
  error: string | undefined;
  gradingFormat: ArmGradingFormat | null | undefined;
  onChange: (value: string) => void;
  striped: boolean;
}) {
  // In edit mode, derive the LIVE grade from the current input so users see
  // their grade band update as they type.
  const liveScore = editing
    ? inputValue === "" || Number.isNaN(Number(inputValue))
      ? null
      : Number(inputValue)
    : (existing?.score ?? null);

  const liveGrade =
    liveScore === null
      ? {
          symbol: null as string | null,
          remark: null as string | null,
          isAbsent: false,
        }
      : resolveTraitGrade(gradingFormat, liveScore);

  const cap = traitCap(trait);

  return (
    <tr className={striped ? "bg-slate-50/40" : "bg-white"}>
      <td className="px-4 py-3">
        <span className="text-slate-800 font-medium">{traitLabel(trait)}</span>
      </td>
      <td className="px-3 py-3 text-center tabular-nums">
        {editing ? (
          <ScoreInput
            value={inputValue}
            max={cap}
            error={error}
            onChange={onChange}
          />
        ) : existing?.isAbsent ? (
          <span className="text-slate-400 text-[10px]">ABS</span>
        ) : existing ? (
          <span className="text-slate-700">
            {existing.score}
            <span className="text-[10px] text-slate-400 ml-1">/{cap}</span>
          </span>
        ) : (
          <span className="text-slate-300">—</span>
        )}
      </td>
      <td className="px-3 py-3 text-center">
        {liveGrade.isAbsent ? (
          <span className="inline-block px-2 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200 rounded-md">
            ABS
          </span>
        ) : liveGrade.symbol ? (
          <span className="inline-block px-2 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 rounded-md">
            {liveGrade.symbol}
          </span>
        ) : (
          <span className="text-slate-300">—</span>
        )}
      </td>
      <td className="px-3 py-3 text-slate-600">
        {liveGrade.remark ?? <span className="text-slate-300">—</span>}
      </td>
    </tr>
  );
}

// ── Single card (mobile) ─────────────────────────────────────────────────────
function TraitCard({
  trait,
  existing,
  editing,
  inputValue,
  error,
  gradingFormat,
  onChange,
}: {
  trait: TraitDef;
  existing: TraitAssessmentResult | undefined;
  editing: boolean;
  inputValue: string;
  error: string | undefined;
  gradingFormat: ArmGradingFormat | null | undefined;
  onChange: (value: string) => void;
}) {
  const liveScore = editing
    ? inputValue === "" || Number.isNaN(Number(inputValue))
      ? null
      : Number(inputValue)
    : (existing?.score ?? null);
  const liveGrade =
    liveScore === null
      ? {
          symbol: null as string | null,
          remark: null as string | null,
          isAbsent: false,
        }
      : resolveTraitGrade(gradingFormat, liveScore);

  const cap = traitCap(trait);

  return (
    <div className="border border-slate-200 rounded-2xl bg-white overflow-hidden">
      <div className="flex items-center justify-between bg-slate-50 px-4 py-2.5 border-b border-slate-100">
        <span className="text-xs font-semibold text-slate-800 truncate min-w-0">
          {traitLabel(trait)}
        </span>
        {liveGrade.isAbsent ? (
          <span className="inline-block px-2 py-0.5 text-[10px] font-semibold bg-white text-slate-500 border border-slate-200 rounded-md">
            ABS
          </span>
        ) : liveGrade.symbol ? (
          <span className="inline-block px-2 py-0.5 text-[10px] font-semibold bg-white text-slate-700 border border-slate-200 rounded-md">
            {liveGrade.symbol}
          </span>
        ) : null}
      </div>
      <div className="p-3 flex items-center justify-between gap-3 text-xs">
        {/* Per-card score label — sits right next to the input so users
            always see the cap they're scoring against, mirroring the
            desktop header's "Score /<max>" hint. Cap text is bumped to
            text-[10px] to match the desktop header's hint size. */}
        <span className="text-slate-500">
          Score
          <span className="text-[10px] text-slate-400 ml-1">/{cap}</span>
        </span>
        {editing ? (
          <ScoreInput
            value={inputValue}
            max={cap}
            error={error}
            onChange={onChange}
          />
        ) : existing?.isAbsent ? (
          <span className="text-slate-400 text-[10px]">ABS</span>
        ) : existing ? (
          <span className="text-slate-800 tabular-nums">{existing.score}</span>
        ) : (
          <span className="text-slate-300">—</span>
        )}
      </div>
      {liveGrade.remark && (
        <div className="px-3 pb-3 text-[11px] text-slate-500 italic">
          {liveGrade.remark}
        </div>
      )}
    </div>
  );
}

// ── Single number input (shared by row + card variants) ──────────────────────
function ScoreInput({
  value,
  max,
  error,
  onChange,
}: {
  value: string;
  max: number;
  error: string | undefined;
  onChange: (next: string) => void;
}) {
  return (
    <div className="flex flex-col items-center">
      <input
        type="number"
        inputMode="numeric"
        min={-1}
        max={max}
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          onChange(e.target.value)
        }
        // - `peer` marks this input as the focus source for the sibling
        //   error span below (peer-focus shows the message only while
        //   the offending cell is focused — keeps the grid visually quiet).
        // - The spin-button selectors strip the native up/down arrows on
        //   Chrome/Safari/Edge (WebKit) and Firefox respectively.
        // - The error styling on the border is gated behind `focus:` too,
        //   so an unfocused invalid cell shows a neutral border at rest.
        className={`peer w-16 text-center px-2 py-1 text-xs text-slate-600 border rounded-lg outline-none transition-all bg-white tabular-nums border-slate-200 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield] ${
          error
            ? "focus:border-red-300 focus:ring-2 focus:ring-red-100"
            : "focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
        }`}
        aria-invalid={!!error}
      />
      {error && (
        <span className="hidden peer-focus:block text-[9px] text-red-500 mt-0.5">
          {error}
        </span>
      )}
    </div>
  );
}
