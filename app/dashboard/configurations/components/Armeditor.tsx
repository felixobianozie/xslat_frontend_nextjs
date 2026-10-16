"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Armeditor.tsx
//
// Create or edit one arm of the current term (POST arm/list/ and PUT
// arm/detail/fields/). An arm is one class group inside a level, for example A
// in Year 1.
//
// Fields: level (chosen when creating, fixed afterwards), name, abbreviation,
// display order, and the score-entry window: the dates between which teachers
// can enter scores for the arm. The backend capitalises the name and the
// abbreviation, and requires the name, the abbreviation and the display order
// to be different from every other arm of the same level. The form checks that
// against the arms it is given before it sends anything. The window must close
// after it opens; an empty close date means no end date.
//
// Class teachers are not set here; they stay on the Arms page.
//
// Loading the window. The arm list does not include the score-entry dates, so
// when editing, the panel reads them from the arm's detail record first
// (GET arm/detail/) and shows the form once they are known.
//
// Locks. While the arm's broadsheet is submitted or approved the backend
// refuses to change any of these fields, so the form shows a notice and cannot
// be saved.
//
// On edit only the fields that changed are sent.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { useClientAuthFetch } from "@/lib/Useclientauthfetch";
import type { ApiEnvelope } from "@/types/configurations";
import TableLoader from "../../components/Tableloader";
import {
  ARM_DETAIL_KEY,
  SCHOOL_ID,
  SaveError,
  abbrError,
  endsAfterStart,
  fieldMessage,
  isArmLocked,
  nonFieldMessage,
  sameText,
  textError,
  wholeNumberError,
  type FieldErrors,
} from "../configutils";
import ConfigPanel from "./Configpanel";
import {
  ErrorNotice,
  PublicationNotice,
  SelectField,
  TextField,
} from "./Configui";

// The score-entry dates of an arm, read from arm/detail/.
interface ScoreWindow {
  score_entry_starts: string | null;
  score_entry_ends: string | null;
}

interface FormState {
  levelId: string;
  name: string;
  abbr: string;
  order: string;
  starts: string;
  ends: string;
}

interface ArmEditorProps {
  // null creates an arm; a record edits that arm.
  arm: ClassArm | null;
  // The level of the arm being edited, or the level chosen in advance when
  // creating ("" leaves the choice open).
  levelId: string;
  term: { name: string; session: { name: string } };
  // Every level of the term, in programme order, as select options.
  levelOptions: { value: string; label: string }[];
  // Every arm of the term, for the duplicate checks.
  arms: ClassArm[];
  onClose: () => void;
  // Called after a successful save; the tab refreshes its lists and closes.
  onSaved: () => void;
}

export default function ArmEditor(props: ArmEditorProps) {
  const { arm, term, onClose } = props;
  const { clientAuthFetch } = useClientAuthFetch();

  // The score-entry window is only needed (and only fetched) when editing.
  const detail = useQuery<ApiEnvelope<ScoreWindow>>({
    queryKey: [...ARM_DETAIL_KEY, arm?.id, "structure-fields"],
    enabled: arm !== null,
    queryFn: async () => {
      const { data, error } = await clientAuthFetch<ApiEnvelope<ScoreWindow>>(
        `arm/detail/?id=${arm!.id}&school-id=${SCHOOL_ID}`,
      );
      if (error) throw new Error(error.message);
      return data!;
    },
    // Always read the current dates when the panel opens.
    staleTime: 0,
  });

  if (arm !== null && !detail.data) {
    return (
      <ConfigPanel
        title={`Edit ${arm.name}`}
        subtitle={`${term.name} Term | ${term.session.name} Session`}
        submitLabel="Save changes"
        isPending={false}
        canSubmit={false}
        onSubmit={() => {}}
        onClose={onClose}
      >
        {detail.error ? (
          <ErrorNotice
            message={detail.error.message}
            onRetry={() => detail.refetch()}
          />
        ) : (
          <TableLoader rows={3} />
        )}
      </ConfigPanel>
    );
  }

  return (
    <ArmForm
      {...props}
      initialStarts={detail.data?.data.score_entry_starts ?? ""}
      initialEnds={detail.data?.data.score_entry_ends ?? ""}
    />
  );
}

function ArmForm({
  arm,
  levelId,
  term,
  levelOptions,
  arms,
  onClose,
  onSaved,
  initialStarts,
  initialEnds,
}: ArmEditorProps & { initialStarts: string; initialEnds: string }) {
  const { clientAuthFetch } = useClientAuthFetch();
  const isEdit = arm !== null;
  const locked = isEdit && isArmLocked(arm.broadsheet);

  const [initial] = useState<FormState>({
    levelId,
    name: arm?.name ?? "",
    abbr: arm?.abbr ?? "",
    order: arm?.display_order !== undefined ? String(arm.display_order) : "",
    starts: initialStarts,
    ends: initialEnds,
  });
  const [state, setState] = useState<FormState>(initial);
  const [serverErrors, setServerErrors] = useState<FieldErrors>({});

  // The other arms of the chosen level.
  const siblings = arms.filter(
    (item) => item.level.id === state.levelId && item.id !== arm?.id,
  );

  // The request body for the current form values.
  function buildBody(values: FormState): Record<string, unknown> {
    const name = values.name.trim();
    const abbr = values.abbr.trim();
    const order = Number(values.order);

    if (!arm) {
      const body: Record<string, unknown> = {
        name,
        abbr,
        display_order: order,
        level: values.levelId,
      };
      // Left out, the backend opens the window today and sets no end date.
      if (values.starts) body.score_entry_starts = values.starts;
      if (values.ends) body.score_entry_ends = values.ends;
      return body;
    }

    const body: Record<string, unknown> = { id: arm.id, school_id: SCHOOL_ID };
    if (name !== initial.name) body.name = name;
    if (abbr !== initial.abbr) body.abbr = abbr;
    if (order !== Number(initial.order)) body.display_order = order;
    if (values.starts !== initial.starts)
      body.score_entry_starts = values.starts;
    // An empty close date clears the end date.
    if (values.ends !== initial.ends)
      body.score_entry_ends = values.ends || null;
    return body;
  }

  const { mutate, isPending } = useMutation<
    ApiEnvelope<ClassArm>,
    SaveError,
    FormState
  >({
    mutationFn: async (values) => {
      const { data, error } = await clientAuthFetch<ApiEnvelope<ClassArm>>(
        isEdit ? "arm/detail/fields/" : "arm/list/",
        {
          method: isEdit ? "PUT" : "POST",
          body: buildBody(values),
        },
      );
      if (error) throw new SaveError(error.message, error.data);
      return data!;
    },
    onSuccess: () => {
      toast.success(isEdit ? "Arm updated." : "Arm created.");
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
    (item) => String(item.display_order) === state.order.trim(),
  );

  const levelError = state.levelId ? undefined : "Choose a level.";
  const nameError =
    textError(state.name, "an arm name", 50) ??
    (clashingName
      ? "Another arm in this level already has this name."
      : undefined);
  const abbrIssue =
    abbrError(state.abbr, true) ??
    (clashingAbbr
      ? "Another arm in this level already has this abbreviation."
      : undefined);
  const orderError =
    wholeNumberError(state.order, "a display order") ??
    (clashingOrder
      ? `${clashingOrder.name} already uses this number in this level.`
      : undefined);
  // An existing arm always has an opening date, so it cannot be emptied.
  const startsError =
    isEdit && !state.starts ? "Enter the date score entry opens." : undefined;
  const endsError = endsAfterStart(state.starts, state.ends)
    ? undefined
    : "Score entry must close after the day it opens.";

  const hasProblems =
    !!levelError ||
    !!nameError ||
    !!abbrIssue ||
    !!orderError ||
    !!startsError ||
    !!endsError;
  const hasChanges =
    !isEdit ||
    state.name.trim() !== initial.name ||
    state.abbr.trim() !== initial.abbr ||
    Number(state.order) !== Number(initial.order) ||
    state.starts !== initial.starts ||
    state.ends !== initial.ends;

  function updateState(patch: Partial<FormState>) {
    setState((previous) => ({ ...previous, ...patch }));
    setServerErrors({});
  }

  return (
    <ConfigPanel
      title={isEdit ? `Edit ${arm.name}` : "New arm"}
      subtitle={`${term.name} Term | ${term.session.name} Session`}
      submitLabel={isEdit ? "Save changes" : "Create arm"}
      isPending={isPending}
      canSubmit={!locked && !hasProblems && hasChanges}
      onSubmit={() => mutate(state)}
      onClose={onClose}
    >
      {locked && (
        <PublicationNotice>
          This arm&apos;s broadsheet is submitted or approved, so it cannot be
          changed. Revoke the broadsheet first.
        </PublicationNotice>
      )}

      <SelectField
        id="arm-level"
        label="Level"
        required
        value={state.levelId}
        onChange={(value) => updateState({ levelId: value })}
        options={[
          ...(state.levelId ? [] : [{ value: "", label: "Choose a level" }]),
          ...levelOptions,
        ]}
        disabled={isEdit}
        hint={isEdit ? "An arm cannot be moved to another level." : undefined}
        error={fieldMessage(serverErrors, "level")}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <TextField
          id="arm-name"
          label="Name"
          required
          placeholder="e.g. Gold"
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
          id="arm-abbr"
          label="Abbreviation"
          required
          placeholder="e.g. A"
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
        id="arm-order"
        label="Display order"
        type="number"
        min={0}
        step={1}
        required
        placeholder="e.g. 1"
        value={state.order}
        onChange={(order) => updateState({ order })}
        disabled={locked}
        error={
          fieldMessage(serverErrors, "display_order") ??
          (state.order ? orderError : undefined)
        }
        hint="Where this arm is listed within its level. Each arm of a level needs a different number."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <TextField
          id="arm-starts"
          label="Score entry opens"
          type="date"
          value={state.starts}
          onChange={(starts) => updateState({ starts })}
          disabled={locked}
          error={
            startsError ?? fieldMessage(serverErrors, "score_entry_starts")
          }
          hint={
            isEdit
              ? "Teachers cannot enter scores before this date."
              : "Teachers cannot enter scores before this date. Leave empty to open today."
          }
        />
        <TextField
          id="arm-ends"
          label="Score entry closes"
          type="date"
          value={state.ends}
          onChange={(ends) => updateState({ ends })}
          disabled={locked}
          error={endsError ?? fieldMessage(serverErrors, "score_entry_ends")}
          hint="Optional. Teachers cannot enter scores after this date. Leave empty for no end date."
        />
      </div>

      {nonFieldMessage(serverErrors) && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-[11px] text-red-700">
          {nonFieldMessage(serverErrors)}
        </p>
      )}
    </ConfigPanel>
  );
}
