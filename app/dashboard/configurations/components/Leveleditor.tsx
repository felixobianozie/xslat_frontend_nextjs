"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Leveleditor.tsx
//
// Create or edit one level of a section in the current term (POST level/list/
// and PUT level/detail/). A level is a year or class within a section, for
// example Year 1, and holds arms.
//
// Fields: section (chosen when creating, fixed afterwards), name, abbreviation,
// promotion order and the final-level flag. The backend capitalises the name
// and the abbreviation, and requires the name, the abbreviation and the
// promotion order to be different from every other level of the same section.
// It accepts a blank abbreviation, but only one level of a section can have
// one, so the form treats a second blank as a clash. The form checks all of
// this against the levels it is given before it sends anything.
//
// Final level. At most one level of a section is final. Students graduate at
// term migration only when they finish the final level of the final section, so
// the form warns before the flag is changed and refuses to switch it on while
// another level of the section already has it.
//
// Locks. While any arm in the level has a submitted or approved broadsheet, the
// backend refuses to change the name, abbreviation or promotion order. The form
// disables those three fields in that case; the final-level flag stays
// available.
//
// On edit only the fields that changed are sent.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { useClientAuthFetch } from "@/lib/Useclientauthfetch";
import type {
  ApiEnvelope,
  LevelRecord,
  SectionRecord,
} from "@/types/configurations";
import {
  SCHOOL_ID,
  SaveError,
  abbrError,
  fieldMessage,
  nonFieldMessage,
  sameText,
  textError,
  wholeNumberError,
  type FieldErrors,
} from "../configutils";
import ConfigPanel from "./Configpanel";
import {
  PublicationNotice,
  SelectField,
  TextField,
  ToggleRow,
} from "./Configui";

interface FormState {
  sectionId: string;
  name: string;
  abbr: string;
  order: string;
  terminal: boolean;
}

interface LevelEditorProps {
  // null creates a level; a record edits that level.
  level: LevelRecord | null;
  // The section of the level being edited, or the section chosen in advance
  // when creating ("" leaves the choice open).
  sectionId: string;
  term: { name: string; session: { name: string } };
  sections: SectionRecord[];
  // The levels of every section, for the duplicate and final-level checks.
  levelsBySection: Record<string, LevelRecord[]>;
  // True when an arm in this level has a submitted or approved broadsheet.
  hasLockedArm: boolean;
  onClose: () => void;
  // Called after a successful save; the tab refreshes its lists and closes.
  onSaved: () => void;
}

export default function LevelEditor({
  level,
  sectionId,
  term,
  sections,
  levelsBySection,
  hasLockedArm,
  onClose,
  onSaved,
}: LevelEditorProps) {
  const { clientAuthFetch } = useClientAuthFetch();
  const isEdit = level !== null;
  const locked = isEdit && hasLockedArm;

  const [initial] = useState<FormState>({
    sectionId,
    name: level?.name ?? "",
    abbr: level?.abbr ?? "",
    order: level ? String(level.promotion_order) : "",
    terminal: level?.terminal ?? false,
  });
  const [state, setState] = useState<FormState>(initial);
  const [serverErrors, setServerErrors] = useState<FieldErrors>({});

  // The other levels of the chosen section.
  const siblings = (levelsBySection[state.sectionId] ?? []).filter(
    (item) => item.id !== level?.id,
  );

  // The request body for the current form values.
  function buildBody(values: FormState): Record<string, unknown> {
    const name = values.name.trim();
    const abbr = values.abbr.trim();
    const order = Number(values.order);

    if (!level) {
      return {
        name,
        abbr,
        promotion_order: order,
        section: values.sectionId,
        is_terminal: values.terminal,
      };
    }

    const body: Record<string, unknown> = {
      id: level.id,
      school_id: SCHOOL_ID,
    };
    if (name !== initial.name) body.name = name;
    if (abbr !== initial.abbr) body.abbr = abbr;
    if (order !== Number(initial.order)) body.promotion_order = order;
    if (values.terminal !== initial.terminal) {
      body.is_terminal = values.terminal;
    }
    return body;
  }

  const { mutate, isPending } = useMutation<
    ApiEnvelope<LevelRecord>,
    SaveError,
    FormState
  >({
    mutationFn: async (values) => {
      const { data, error } = await clientAuthFetch<ApiEnvelope<LevelRecord>>(
        isEdit ? "level/detail/" : "level/list/",
        {
          method: isEdit ? "PUT" : "POST",
          body: buildBody(values),
        },
      );
      if (error) throw new SaveError(error.message, error.data);
      return data!;
    },
    onSuccess: () => {
      toast.success(isEdit ? "Level updated." : "Level created.");
      onSaved();
    },
    onError: (err) => {
      setServerErrors(err.fieldErrors);
      toast.error(err.message);
    },
  });

  // ── Validation ─────────────────────────────────────────────────────────────
  const clashingName = siblings.find((item) => sameText(item.name, state.name));
  const clashingAbbr = siblings.find((item) => sameText(item.abbr, state.abbr));
  const clashingOrder = siblings.find(
    (item) => String(item.promotion_order) === state.order.trim(),
  );
  const finalLevel = siblings.find((item) => item.terminal);

  const sectionError = state.sectionId ? undefined : "Choose a section.";
  const nameError =
    textError(state.name, "a level name", 50) ??
    (clashingName
      ? "Another level in this section already has this name."
      : undefined);
  const abbrIssue =
    abbrError(state.abbr, false) ??
    (clashingAbbr
      ? state.abbr.trim()
        ? "Another level in this section already has this abbreviation."
        : "Another level in this section has no abbreviation. Give each level its own."
      : undefined);
  const orderError =
    wholeNumberError(state.order, "a promotion order") ??
    (clashingOrder
      ? `${clashingOrder.name} already uses this number in this section.`
      : undefined);
  const terminalError =
    state.terminal && finalLevel
      ? `${finalLevel.name} is already the final level of this section. Switch that off first.`
      : undefined;

  const hasProblems =
    !!sectionError ||
    !!nameError ||
    !!abbrIssue ||
    !!orderError ||
    !!terminalError;
  const hasChanges =
    !isEdit ||
    state.name.trim() !== initial.name ||
    state.abbr.trim() !== initial.abbr ||
    Number(state.order) !== Number(initial.order) ||
    state.terminal !== initial.terminal;

  function updateState(patch: Partial<FormState>) {
    setState((previous) => ({ ...previous, ...patch }));
    setServerErrors({});
  }

  return (
    <ConfigPanel
      title={isEdit ? `Edit ${level.name}` : "New level"}
      subtitle={`${term.name} Term | ${term.session.name} Session`}
      submitLabel={isEdit ? "Save changes" : "Create level"}
      isPending={isPending}
      canSubmit={!hasProblems && hasChanges}
      onSubmit={() => mutate(state)}
      onClose={onClose}
    >
      {locked && (
        <PublicationNotice>
          An arm in this level has a submitted or approved broadsheet, so its
          name, abbreviation and promotion order are locked. Revoke the
          broadsheet to change them.
        </PublicationNotice>
      )}

      <SelectField
        id="level-section"
        label="Section"
        required
        value={state.sectionId}
        onChange={(value) => updateState({ sectionId: value })}
        options={[
          ...(state.sectionId
            ? []
            : [{ value: "", label: "Choose a section" }]),
          ...sections.map((item) => ({ value: item.id, label: item.name })),
        ]}
        disabled={isEdit}
        hint={
          isEdit ? "A level cannot be moved to another section." : undefined
        }
        error={fieldMessage(serverErrors, "section")}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <TextField
          id="level-name"
          label="Name"
          required
          placeholder="e.g. Year 1"
          value={state.name}
          onChange={(name) => updateState({ name })}
          disabled={locked}
          error={
            fieldMessage(serverErrors, "name") ??
            (state.name ? nameError : undefined)
          }
          hint="Shown in title case."
        />
        <TextField
          id="level-abbr"
          label="Abbreviation"
          placeholder="e.g. Y1"
          value={state.abbr}
          onChange={(abbr) => updateState({ abbr })}
          disabled={locked}
          error={fieldMessage(serverErrors, "abbr") ?? abbrIssue}
          hint="Shown in capitals. No spaces. Used in class names such as JSS Y1 A."
        />
      </div>

      <TextField
        id="level-order"
        label="Promotion order"
        type="number"
        min={0}
        step={1}
        required
        placeholder="e.g. 1"
        value={state.order}
        onChange={(order) => updateState({ order })}
        disabled={locked}
        error={
          fieldMessage(serverErrors, "promotion_order") ??
          (state.order ? orderError : undefined)
        }
        hint="Where this level comes in its section. Students move from a lower number to the next one up. Each level of a section needs a different number."
      />

      <div className="flex flex-col gap-3">
        <ToggleRow
          label="Final level"
          description="Marks the last level of this section. Students who finish the final level of the final section graduate when the term is migrated. Only one level of a section can be final."
          checked={state.terminal}
          onChange={(terminal) => updateState({ terminal })}
          disabled={isPending}
          changed={state.terminal !== initial.terminal}
        />
        {terminalError && (
          <p className="text-[11px] text-red-600">{terminalError}</p>
        )}
        {fieldMessage(serverErrors, "is_terminal") && (
          <p className="text-[11px] text-red-600">
            {fieldMessage(serverErrors, "is_terminal")}
          </p>
        )}
        {state.terminal !== initial.terminal && (
          <PublicationNotice>
            Changing the final level changes who graduates the next time the
            term is migrated. Check this with the programme before saving.
          </PublicationNotice>
        )}
      </div>

      {nonFieldMessage(serverErrors) && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-[11px] text-red-700">
          {nonFieldMessage(serverErrors)}
        </p>
      )}
    </ConfigPanel>
  );
}
