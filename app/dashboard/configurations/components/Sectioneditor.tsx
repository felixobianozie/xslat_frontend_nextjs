"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Sectioneditor.tsx
//
// Create or edit one section of the current term (POST section/list/ and PUT
// section/detail/). A section is a part of the school's programme, for example
// Junior Secondary, and holds levels.
//
// Fields: name, abbreviation, promotion order and the final-section flag. The
// backend capitalises the name and the abbreviation, and requires the name, the
// abbreviation and the promotion order to be different from every other
// section of the term. The form checks that against the sections it is given
// before it sends anything.
//
// Final section. At most one section of a term is final. Students graduate at
// term migration only when they finish the final level of the final section, so
// the form warns before the flag is changed and refuses to switch it on while
// another section already has it.
//
// Locks. While any arm in the section has a submitted or approved broadsheet,
// the backend refuses to change the name, abbreviation or promotion order. The
// form disables those three fields in that case; the final-section flag stays
// available.
//
// On edit only the fields that changed are sent.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { useClientAuthFetch } from "@/lib/Useclientauthfetch";
import type { ApiEnvelope, SectionRecord } from "@/types/configurations";
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
import { PublicationNotice, TextField, ToggleRow } from "./Configui";

interface FormState {
  name: string;
  abbr: string;
  order: string;
  terminal: boolean;
}

interface SectionEditorProps {
  // null creates a section; a record edits that section.
  section: SectionRecord | null;
  term: { id: string; name: string; session: { name: string } };
  // Every section of the term, for the duplicate and final-section checks.
  sections: SectionRecord[];
  // True when an arm in this section has a submitted or approved broadsheet.
  hasLockedArm: boolean;
  onClose: () => void;
  // Called after a successful save; the tab refreshes its lists and closes.
  onSaved: () => void;
}

export default function SectionEditor({
  section,
  term,
  sections,
  hasLockedArm,
  onClose,
  onSaved,
}: SectionEditorProps) {
  const { clientAuthFetch } = useClientAuthFetch();
  const isEdit = section !== null;
  const locked = isEdit && hasLockedArm;

  const [initial] = useState<FormState>({
    name: section?.name ?? "",
    abbr: section?.abbr ?? "",
    order: section ? String(section.promotion_order) : "",
    terminal: section?.terminal ?? false,
  });
  const [state, setState] = useState<FormState>(initial);
  const [serverErrors, setServerErrors] = useState<FieldErrors>({});

  const others = sections.filter((item) => item.id !== section?.id);

  // The request body for the current form values.
  function buildBody(values: FormState): Record<string, unknown> {
    const name = values.name.trim();
    const abbr = values.abbr.trim();
    const order = Number(values.order);

    if (!section) {
      return {
        name,
        abbr,
        promotion_order: order,
        term: term.id,
        is_terminal: values.terminal,
      };
    }

    const body: Record<string, unknown> = {
      id: section.id,
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
    ApiEnvelope<SectionRecord>,
    SaveError,
    FormState
  >({
    mutationFn: async (values) => {
      const { data, error } = await clientAuthFetch<ApiEnvelope<SectionRecord>>(
        isEdit ? "section/detail/" : "section/list/",
        {
          method: isEdit ? "PUT" : "POST",
          body: buildBody(values),
        },
      );
      if (error) throw new SaveError(error.message, error.data);
      return data!;
    },
    onSuccess: () => {
      toast.success(isEdit ? "Section updated." : "Section created.");
      onSaved();
    },
    onError: (err) => {
      setServerErrors(err.fieldErrors);
      toast.error(err.message);
    },
  });

  // ── Validation ─────────────────────────────────────────────────────────────
  const clashingName = others.find((item) => sameText(item.name, state.name));
  const clashingAbbr = others.find((item) => sameText(item.abbr, state.abbr));
  const clashingOrder = others.find(
    (item) => String(item.promotion_order) === state.order.trim(),
  );
  const finalSection = others.find((item) => item.terminal);

  const nameError =
    textError(state.name, "a section name", 100) ??
    (clashingName ? "Another section already has this name." : undefined);
  const abbrIssue =
    abbrError(state.abbr, true) ??
    (clashingAbbr
      ? "Another section already has this abbreviation."
      : undefined);
  const orderError =
    wholeNumberError(state.order, "a promotion order") ??
    (clashingOrder
      ? `${clashingOrder.name} already uses this number.`
      : undefined);
  const terminalError =
    state.terminal && finalSection
      ? `${finalSection.name} is already the final section. Switch that off first.`
      : undefined;

  const hasProblems =
    !!nameError || !!abbrIssue || !!orderError || !!terminalError;
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
      title={isEdit ? `Edit ${section.name}` : "New section"}
      subtitle={`${term.name} Term | ${term.session.name} Session`}
      submitLabel={isEdit ? "Save changes" : "Create section"}
      isPending={isPending}
      canSubmit={!hasProblems && hasChanges}
      onSubmit={() => mutate(state)}
      onClose={onClose}
    >
      {locked && (
        <PublicationNotice>
          An arm in this section has a submitted or approved broadsheet, so its
          name, abbreviation and promotion order are locked. Revoke the
          broadsheet to change them.
        </PublicationNotice>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <TextField
          id="section-name"
          label="Name"
          required
          placeholder="e.g. Junior Secondary"
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
          id="section-abbr"
          label="Abbreviation"
          required
          placeholder="e.g. JSS"
          value={state.abbr}
          onChange={(abbr) => updateState({ abbr })}
          disabled={locked}
          error={
            fieldMessage(serverErrors, "abbr") ??
            (state.abbr ? abbrIssue : undefined)
          }
          hint="Shown in capitals. No spaces."
        />
      </div>

      <TextField
        id="section-order"
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
        hint="Where this section comes in the programme. Students move from a lower number to the next one up. Each section needs a different number."
      />

      <div className="flex flex-col gap-3">
        <ToggleRow
          label="Final section"
          description="Marks the last section of your programme. Students who finish the final level of the final section graduate when the term is migrated. Only one section can be final."
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
            Changing the final section changes who graduates the next time the
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
