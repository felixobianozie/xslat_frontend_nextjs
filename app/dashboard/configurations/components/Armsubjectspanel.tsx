"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Armsubjectspanel.tsx
//
// Chooses which subjects the arms ticked on the Arm Settings tab offer in the
// current term. One subject can be given to many arms at once.
//
//   Add subjects     PUT subject/detail/ with `add_arms`
//   Remove subjects  PUT subject/detail/ with `remove_arms`
//
// The backend takes one subject per request and refuses `add_arms` and
// `remove_arms` together, so the panel works in one mode at a time and sends
// one request per ticked subject, listing every arm that needs the change.
//
// A counter beside "Select all" shows how many subjects are ticked out of the
// subjects the current mode can change, for example 3/5.
//
// Removing a subject from an arm permanently deletes the academic scores
// already recorded for that subject in that arm, so the remove mode asks for a
// tick before it can be submitted.
//
// Requests run one after another. A subject that fails does not stop the
// others; the panel stays open and lists each failure, while the subjects that
// succeeded are already saved and are reported to the tab so it refreshes.
// Arms whose broadsheet is submitted or approved are locked; the backend
// rejects them, and the tab does not let them be ticked.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { useClientAuthFetch } from "@/lib/Useclientauthfetch";
import type { TermSubjectRecord } from "@/types/configurations";
import EmptyState from "../../components/Emptystate";
import { SCHOOL_ID, armLabel } from "../configutils";
import ConfigPanel from "./Configpanel";
import { PublicationNotice } from "./Configui";

type Mode = "add" | "remove";

interface ArmSubjectsPanelProps {
  arms: ClassArm[];
  subjects: TermSubjectRecord[];
  onClose: () => void;
  // Called with the ids of the arms whose subjects changed.
  onChanged: (armIds: string[]) => void;
}

// The chosen arms that already offer the subject.
function armsOffering(subject: TermSubjectRecord, arms: ClassArm[]): string[] {
  const offeringIds = new Set(subject.subject_arms.map((link) => link.arm.id));
  return arms.filter((arm) => offeringIds.has(arm.id)).map((arm) => arm.id);
}

export default function ArmSubjectsPanel({
  arms,
  subjects,
  onClose,
  onChanged,
}: ArmSubjectsPanelProps) {
  const { clientAuthFetch } = useClientAuthFetch();
  const [mode, setMode] = useState<Mode>("add");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [failures, setFailures] = useState<string[]>([]);

  const armIds = arms.map((arm) => arm.id);

  // For each subject, how many of the chosen arms already offer it, and
  // whether the current mode has anything to do for it.
  const rows = subjects.map((subject) => {
    const offeringIds = armsOffering(subject, arms);
    const changeableIds =
      mode === "add"
        ? armIds.filter((id) => !offeringIds.includes(id))
        : offeringIds;
    return { subject, offeringCount: offeringIds.length, changeableIds };
  });

  // Subjects the current mode has nothing to do for are not tickable.
  const chosenRows = rows.filter(
    (row) =>
      selectedIds.includes(row.subject.id) && row.changeableIds.length > 0,
  );
  const tickableRows = rows.filter((row) => row.changeableIds.length > 0);
  const allSelected =
    tickableRows.length > 0 && chosenRows.length === tickableRows.length;

  function changeMode(next: Mode) {
    setMode(next);
    setSelectedIds([]);
    setConfirmed(false);
    setFailures([]);
  }

  function toggle(subjectId: string) {
    setSelectedIds((previous) =>
      previous.includes(subjectId)
        ? previous.filter((id) => id !== subjectId)
        : [...previous, subjectId],
    );
  }

  const { mutate, isPending } = useMutation<
    { failures: string[]; changedArmIds: string[] },
    Error,
    typeof chosenRows
  >({
    mutationFn: async (changes) => {
      const problems: string[] = [];
      const changedArmIds = new Set<string>();

      for (const { subject, changeableIds } of changes) {
        const { error } = await clientAuthFetch("subject/detail/", {
          method: "PUT",
          body: {
            id: subject.id,
            school_id: SCHOOL_ID,
            [mode === "add" ? "add_arms" : "remove_arms"]: changeableIds,
          },
        });
        if (error)
          problems.push(`${subject.definition.name}: ${error.message}`);
        else changeableIds.forEach((id) => changedArmIds.add(id));
      }

      return { failures: problems, changedArmIds: Array.from(changedArmIds) };
    },
    onSuccess: ({ failures: problems, changedArmIds }) => {
      const savedAny = changedArmIds.length > 0;
      if (savedAny) onChanged(changedArmIds);

      if (problems.length === 0) {
        toast.success(mode === "add" ? "Subjects added." : "Subjects removed.");
        onClose();
        return;
      }
      setFailures(problems);
      toast.error(
        savedAny ? "Some subjects were not saved." : "No subjects were saved.",
      );
    },
  });

  const canSubmit =
    chosenRows.length > 0 && (mode === "add" || confirmed) && !isPending;

  return (
    <ConfigPanel
      title="Subjects offered by arms"
      subtitle={`${arms.length} ${arms.length === 1 ? "arm" : "arms"} selected: ${arms
        .map(armLabel)
        .join(", ")}`}
      submitLabel={mode === "add" ? "Add to arms" : "Remove from arms"}
      isPending={isPending}
      canSubmit={canSubmit}
      onSubmit={() => {
        setFailures([]);
        mutate(chosenRows);
      }}
      onClose={onClose}
    >
      <div
        role="group"
        aria-label="Add or remove subjects"
        className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 text-xs sm:w-72"
      >
        {(["add", "remove"] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => changeMode(option)}
            disabled={isPending}
            aria-pressed={mode === option}
            className={`cursor-pointer rounded-lg px-3 py-1.5 font-medium transition-colors disabled:opacity-50 ${
              mode === option
                ? "bg-white text-violet-700 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {option === "add" ? "Add subjects" : "Remove subjects"}
          </button>
        ))}
      </div>

      <PublicationNotice>
        Arms whose broadsheet is submitted or approved are locked and cannot be
        changed. The server will reject any such arm and say so below.
      </PublicationNotice>

      {subjects.length === 0 ? (
        <EmptyState
          title="No subjects in this term"
          description="Add subjects to the term on the Subjects tab first."
        />
      ) : (
        <>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              {mode === "add"
                ? "Tick the subjects the selected arms should offer."
                : "Tick the subjects the selected arms should stop offering."}
            </p>
            <div className="flex shrink-0 items-center gap-3">
              <span
                aria-live="polite"
                aria-label={`${chosenRows.length} of ${tickableRows.length} subjects selected`}
                className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium tabular-nums text-slate-600"
              >
                {chosenRows.length}/{tickableRows.length}
              </span>
              <button
                type="button"
                onClick={() =>
                  setSelectedIds(
                    allSelected
                      ? []
                      : tickableRows.map((row) => row.subject.id),
                  )
                }
                disabled={isPending || tickableRows.length === 0}
                className="cursor-pointer text-xs text-violet-700 hover:text-violet-800 disabled:opacity-50"
              >
                {allSelected ? "Clear all" : "Select all"}
              </button>
            </div>
          </div>

          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {rows.map(({ subject, offeringCount, changeableIds }) => {
              const disabled = changeableIds.length === 0;

              return (
                <li key={subject.id}>
                  <label
                    className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors ${
                      disabled
                        ? "cursor-not-allowed border-slate-100 bg-slate-50 opacity-60"
                        : selectedIds.includes(subject.id)
                          ? "cursor-pointer border-violet-300 bg-violet-50/50"
                          : "cursor-pointer border-slate-200 bg-white hover:border-violet-200"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(subject.id) && !disabled}
                      disabled={disabled || isPending}
                      onChange={() => toggle(subject.id)}
                      className="h-4 w-4 shrink-0 accent-violet-600"
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-slate-800 truncate">
                        {subject.definition.name}
                      </span>
                      <span className="block text-[11px] text-slate-400">
                        {offeringCount === 0
                          ? "Offered by none of the selected arms"
                          : offeringCount === arms.length
                            ? "Offered by all selected arms"
                            : `Offered by ${offeringCount} of ${arms.length} selected arms`}
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {mode === "remove" && chosenRows.length > 0 && (
        <label className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-[11px] text-red-700 cursor-pointer">
          <input
            type="checkbox"
            checked={confirmed}
            disabled={isPending}
            onChange={(event) => setConfirmed(event.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-red-600"
          />
          <span>
            I understand that removing a subject from an arm permanently deletes
            the academic scores already recorded for that subject in that arm.
          </span>
        </label>
      )}

      {failures.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5">
          <p className="text-[11px] font-semibold text-red-700 mb-1.5">
            These were not saved:
          </p>
          <ul className="flex flex-col gap-1 text-[11px] text-red-700">
            {failures.map((failure, index) => (
              <li key={index}>{failure}</li>
            ))}
          </ul>
        </div>
      )}
    </ConfigPanel>
  );
}
