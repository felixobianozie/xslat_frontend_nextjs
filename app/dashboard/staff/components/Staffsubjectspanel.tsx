"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Staffsubjectspanel.tsx
//
// Slide-in panel that assigns subjects to one staff member, or unassigns them,
// for the current term. The staff action menu opens it in one of two modes:
//
//   assign     Tick subjects, then tick arms. Only arms that offer at least
//              one ticked subject are listed, grouped by level. Each ticked
//              subject is assigned in each ticked arm that offers it; a
//              summary shows what will be saved and what is left out.
//   unassign   Lists the subjects the staff member teaches this term, each
//              with its arms grouped by level. Tick the ones to remove.
//
// Arms whose results are submitted or approved are shown but cannot be
// ticked, because the backend refuses to change their teachers.
//
// Data, all shared with the Configurations page through the same hooks:
//   - the current term from the school record (useCurrentTerm)
//   - the term's subjects with their arms and teachers (useTermSubjects)
//   - the term's arms with their levels and results state (useStructureArms)
// Opening the panel needs permission to view subjects and arms; when either
// read is refused the panel says so.
//
// Saving sends one PUT subject/detail/ per subject (add_teachers or
// remove_teachers, listing every arm for that subject), a few at a time. Each
// subject is saved completely or not at all. One failing does not stop the
// others; the panel stays open and lists each failure, and the subjects that
// did save keep their changes.
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { toast } from "react-toastify";

import { useClientAuthFetch } from "@/lib/Useclientauthfetch";
import { apiErrorText } from "@/lib/Apierrortext";
import { personName } from "@/lib/Personname";
import type { TermSubjectRecord } from "@/types/configurations";
import ButtonLoader from "../../components/Buttonloader";
import EmptyState from "../../components/Emptystate";
import TableLoader from "../../components/Tableloader";
import { ErrorNotice } from "../../configurations/components/Configui";
import {
  armLabel,
  isArmLocked,
  LoadError,
  TERM_SUBJECTS_KEY,
} from "../../configurations/configutils";
import { useCurrentTerm } from "../../configurations/hooks/Usecurrentterm";
import { useStructureArms } from "../../configurations/hooks/Usestructure";
import { useTermSubjects } from "../../configurations/hooks/Usetermsubjects";
import { inGroupsOf } from "../staffaccess";
import {
  currentAssignments,
  groupArmsByLevel,
  pairKey,
  planAssignments,
  planRemovals,
  type SubjectChange,
  type SubjectsMode,
} from "../staffsubjects";

// ── Constants ────────────────────────────────────────────────────────────────

const SCHOOL_ID = process.env.NEXT_PUBLIC_SCHOOL_ID ?? "";

// How many subjects are saved at the same time.
const SAVE_BATCH_SIZE = 4;

const NO_READ_PERMISSION =
  "You need permission to view subjects and arms to assign subjects.";

// ── Types ────────────────────────────────────────────────────────────────────

interface SaveResult {
  saved: number;
  failures: string[];
}

interface StaffSubjectsPanelProps {
  show: boolean;
  // Changes each time the panel opens, so every opening starts fresh.
  session: number;
  mode: SubjectsMode;
  target: StaffPortfolio | null;
  onClose: () => void;
  // Called after every subject was saved.
  onApplied: () => void;
}

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

function subjectName(subject: TermSubjectRecord): string {
  return subject.definition.name;
}

// ── Panel ────────────────────────────────────────────────────────────────────

export default function StaffSubjectsPanel({
  show,
  session,
  mode,
  target,
  onClose,
  onApplied,
}: StaffSubjectsPanelProps) {
  return (
    <div
      className={`transition-all duration-500 ease-in-out overflow-hidden ${
        show ? "w-full opacity-100" : "w-0 opacity-0 h-0"
      }`}
    >
      {/* The body is keyed by the opening, so its choices reset every time. */}
      {target && (
        <PanelBody
          key={session}
          mode={mode}
          target={target}
          onClose={onClose}
          onApplied={onApplied}
        />
      )}
    </div>
  );
}

function PanelBody({
  mode,
  target,
  onClose,
  onApplied,
}: Omit<StaffSubjectsPanelProps, "show" | "session" | "target"> & {
  target: StaffPortfolio;
}) {
  const queryClient = useQueryClient();
  const { clientAuthFetch } = useClientAuthFetch();
  const isAssign = mode === "assign";

  // Assign mode: ticked subject ids and arm ids.
  const [pickedSubjectIds, setPickedSubjectIds] = useState<string[]>([]);
  const [pickedArmIds, setPickedArmIds] = useState<string[]>([]);
  // Unassign mode: ticked subject-and-arm pairs (see pairKey).
  const [pickedPairs, setPickedPairs] = useState<string[]>([]);
  const [failures, setFailures] = useState<string[]>([]);

  const { school, currentTerm } = useCurrentTerm();
  const subjectsQuery = useTermSubjects(currentTerm?.id);
  const armsQuery = useStructureArms(currentTerm?.id);

  const subjects = useMemo(
    () => subjectsQuery.data?.data ?? [],
    [subjectsQuery.data],
  );
  const arms = useMemo(() => armsQuery.data?.data ?? [], [armsQuery.data]);
  const armsById = useMemo(
    () => new Map(arms.map((arm) => [arm.id, arm])),
    [arms],
  );

  const staffName = personName(target.staff_profile.user);

  // ── What saving will change ────────────────────────────────────────────────

  // Assign mode: the arms that offer at least one ticked subject. A ticked
  // arm that stops qualifying (its subject was unticked) is ignored.
  const offeringArmIds = useMemo(() => {
    const ids = new Set<string>();
    for (const subject of subjects) {
      if (!pickedSubjectIds.includes(subject.id)) continue;
      for (const subjectArm of subject.subject_arms) ids.add(subjectArm.arm.id);
    }
    return ids;
  }, [subjects, pickedSubjectIds]);

  const assignments = useMemo(
    () => currentAssignments(subjects, target.id),
    [subjects, target.id],
  );

  const changes: SubjectChange[] = isAssign
    ? planAssignments(
        subjects,
        pickedSubjectIds,
        pickedArmIds.filter((armId) => offeringArmIds.has(armId)),
        target.id,
      )
    : planRemovals(assignments, pickedPairs);

  const changeCount = changes.reduce(
    (total, change) => total + change.armIds.length,
    0,
  );
  const subjectsToSave = changes.filter((change) => change.armIds.length > 0);

  function labelOf(armId: string, subject?: TermSubjectRecord): string {
    const arm = armsById.get(armId);
    if (arm) return armLabel(arm);
    // An arm missing from the arm list still has its own abbreviation.
    const subjectArm = subject?.subject_arms.find(
      (item) => item.arm.id === armId,
    );
    return subjectArm?.arm.abbr ?? "Unknown arm";
  }

  function toggle(
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    value: string,
  ) {
    setter((previous) =>
      previous.includes(value)
        ? previous.filter((item) => item !== value)
        : [...previous, value],
    );
  }

  // ── Saving ─────────────────────────────────────────────────────────────────
  const { mutate, isPending } = useMutation<SaveResult, Error, void>({
    mutationFn: async () => {
      const result: SaveResult = { saved: 0, failures: [] };
      const teacherKey = isAssign ? "add_teachers" : "remove_teachers";

      for (const group of inGroupsOf(subjectsToSave, SAVE_BATCH_SIZE)) {
        await Promise.all(
          group.map(async (change) => {
            const { error } = await clientAuthFetch("subject/detail/", {
              method: "PUT",
              body: {
                id: change.subject.id,
                school_id: SCHOOL_ID,
                [teacherKey]: change.armIds.map((armId) => ({
                  arm: armId,
                  teachers: [target.id],
                })),
              },
            });
            if (error) {
              result.failures.push(
                `${subjectName(change.subject)}: ${apiErrorText(error)}`,
              );
            } else {
              result.saved += 1;
            }
          }),
        );
      }

      return result;
    },
    onSuccess: ({ saved, failures: problems }) => {
      if (saved > 0) {
        queryClient.invalidateQueries({ queryKey: TERM_SUBJECTS_KEY });
        // The arm page's Subjects tab lists the same teachers.
        queryClient.invalidateQueries({ queryKey: ["arm-subjects"] });
        // Assigning a subject marks a non-academic staff member academic.
        queryClient.invalidateQueries({ queryKey: ["staff", SCHOOL_ID] });
      }

      if (problems.length === 0) {
        toast.success(
          `${isAssign ? "Assigned" : "Unassigned"} ${plural(saved, "subject", "subjects")}.`,
        );
        onApplied();
        return;
      }

      setFailures(problems);
      toast.error(
        saved > 0
          ? `Saved ${saved}, but ${problems.length} could not be saved.`
          : "No changes were saved.",
      );
    },
  });

  // ── Body content ───────────────────────────────────────────────────────────
  function renderContent() {
    if (school.isPending) return <TableLoader rows={3} />;
    if (school.error) {
      return (
        <ErrorNotice
          message={school.error.message}
          onRetry={() => school.refetch()}
        />
      );
    }
    if (!currentTerm) {
      return (
        <EmptyState
          title="No current term"
          description="Set a current session and term on the School Calendar tab, then offer subjects in it."
        />
      );
    }
    if (subjectsQuery.isPending || armsQuery.isPending) {
      return <TableLoader rows={3} />;
    }

    const readError = subjectsQuery.error ?? armsQuery.error;
    if (readError) {
      const refused =
        readError instanceof LoadError && readError.status === 403;
      return (
        <ErrorNotice
          message={refused ? NO_READ_PERMISSION : readError.message}
          onRetry={
            refused
              ? undefined
              : () => {
                  subjectsQuery.refetch();
                  armsQuery.refetch();
                }
          }
        />
      );
    }

    return isAssign ? renderAssign() : renderUnassign();
  }

  // ── Assign mode ────────────────────────────────────────────────────────────
  function renderAssign() {
    if (subjects.length === 0) {
      return (
        <EmptyState
          title="No subjects this term"
          description="Offer subjects on the Subjects tab of the Configurations page, then assign them here."
        />
      );
    }

    const armGroups = groupArmsByLevel(
      arms.filter((arm) => offeringArmIds.has(arm.id)),
    );

    return (
      <>
        {!target.academic && (
          <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[11px] text-slate-600">
            {staffName} is non-academic staff. Assigning a subject makes them
            academic staff.
          </p>
        )}

        {/* Subjects */}
        <section className="flex flex-col gap-3">
          <SectionHeading
            title="Subjects"
            hint="The subjects to assign."
            ticked={pickedSubjectIds.length}
          />
          <ul className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
            {subjects.map((subject) => {
              const offeredNowhere = subject.subject_arms.length === 0;
              return (
                <li key={subject.id}>
                  <CheckRow
                    checked={pickedSubjectIds.includes(subject.id)}
                    disabled={offeredNowhere || isPending}
                    onChange={() => toggle(setPickedSubjectIds, subject.id)}
                    title={subjectName(subject)}
                    note={
                      offeredNowhere
                        ? "Not offered in any arm"
                        : `Offered in ${plural(subject.subject_arms.length, "arm", "arms")}`
                    }
                  />
                </li>
              );
            })}
          </ul>
        </section>

        {/* Arms */}
        <section className="flex flex-col gap-3">
          <SectionHeading
            title="Arms"
            hint="Only arms that offer a ticked subject are listed."
            ticked={
              pickedArmIds.filter((armId) => offeringArmIds.has(armId)).length
            }
          />
          {pickedSubjectIds.length === 0 ? (
            <p className="text-xs text-slate-400">
              Tick a subject to see the arms that offer it.
            </p>
          ) : (
            armGroups.map((group) => (
              <div key={group.levelId} className="flex flex-col gap-2">
                <h4 className="text-[11px] font-semibold text-slate-500">
                  {group.label}
                </h4>
                <ul className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
                  {group.arms.map((arm) => {
                    const locked = isArmLocked(arm.broadsheet);
                    const offered = subjects.filter(
                      (subject) =>
                        pickedSubjectIds.includes(subject.id) &&
                        subject.subject_arms.some(
                          (item) => item.arm.id === arm.id,
                        ),
                    ).length;
                    return (
                      <li key={arm.id}>
                        <CheckRow
                          checked={!locked && pickedArmIds.includes(arm.id)}
                          disabled={locked || isPending}
                          onChange={() => toggle(setPickedArmIds, arm.id)}
                          title={armLabel(arm)}
                          note={
                            locked
                              ? "Results submitted, so teachers cannot change"
                              : `Offers ${offered} of ${pickedSubjectIds.length} ticked`
                          }
                        />
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
        </section>

        {renderAssignSummary()}
      </>
    );
  }

  // What will be saved and what is left out, per subject.
  function renderAssignSummary() {
    if (changes.length === 0 || pickedArmIds.length === 0) return null;

    return (
      <section className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
        <h3 className="text-xs font-semibold text-slate-700">
          What will be saved
        </h3>
        <ul className="flex flex-col gap-2 text-[11px] text-slate-600">
          {changes.map((change) => (
            <li key={change.subject.id}>
              <p className="font-medium text-slate-800">
                {subjectName(change.subject)}
              </p>
              <p>
                {change.armIds.length > 0
                  ? `Assign in ${change.armIds.map((id) => labelOf(id, change.subject)).join(", ")}.`
                  : "Nothing to assign."}
              </p>
              {change.alreadyAssignedArmIds.length > 0 && (
                <p className="text-slate-400">
                  Already teaches it in{" "}
                  {change.alreadyAssignedArmIds
                    .map((id) => labelOf(id, change.subject))
                    .join(", ")}
                  .
                </p>
              )}
              {change.notOfferedArmIds.length > 0 && (
                <p className="text-slate-400">
                  Not offered in{" "}
                  {change.notOfferedArmIds
                    .map((id) => labelOf(id, change.subject))
                    .join(", ")}
                  , so left out.
                </p>
              )}
            </li>
          ))}
        </ul>
      </section>
    );
  }

  // ── Unassign mode ──────────────────────────────────────────────────────────
  function renderUnassign() {
    if (assignments.length === 0) {
      return (
        <EmptyState
          title="No subjects assigned"
          description={`${staffName} does not teach any subject this term.`}
        />
      );
    }

    return (
      <section className="flex flex-col gap-4">
        <SectionHeading
          title="Assigned subjects"
          hint="Tick the arms to remove this staff member from."
          ticked={pickedPairs.length}
        />
        {assignments.map(({ subject, armIds }) => {
          const subjectArms = armIds
            .map((armId) => armsById.get(armId))
            .filter((arm): arm is ClassArm => arm !== undefined);
          // Arms missing from the arm list are still listed, by abbreviation.
          const unlisted = armIds.filter((armId) => !armsById.has(armId));

          return (
            <div
              key={subject.id}
              className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3"
            >
              <h4 className="text-xs font-semibold text-slate-800">
                {subjectName(subject)}
              </h4>
              {groupArmsByLevel(subjectArms).map((group) => (
                <div key={group.levelId} className="flex flex-col gap-1.5">
                  <p className="text-[11px] font-semibold text-slate-500">
                    {group.label}
                  </p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
                    {group.arms.map((arm) => {
                      const key = pairKey(subject.id, arm.id);
                      const locked = isArmLocked(arm.broadsheet);
                      return (
                        <li key={key}>
                          <CheckRow
                            danger
                            checked={!locked && pickedPairs.includes(key)}
                            disabled={locked || isPending}
                            onChange={() => toggle(setPickedPairs, key)}
                            title={armLabel(arm)}
                            note={
                              locked
                                ? "Results submitted, so teachers cannot change"
                                : undefined
                            }
                          />
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
              {unlisted.length > 0 && (
                <ul className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
                  {unlisted.map((armId) => {
                    const key = pairKey(subject.id, armId);
                    return (
                      <li key={key}>
                        <CheckRow
                          danger
                          checked={pickedPairs.includes(key)}
                          disabled={isPending}
                          onChange={() => toggle(setPickedPairs, key)}
                          title={labelOf(armId, subject)}
                        />
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </section>
    );
  }

  // ── Layout ─────────────────────────────────────────────────────────────────
  const actionLabel = isAssign ? "Assign" : "Unassign";

  return (
    <div className="w-full">
      {/* Back link */}
      <button
        type="button"
        onClick={onClose}
        disabled={isPending}
        className="cursor-pointer flex items-center gap-1 text-xs text-red-600 hover:text-red-700 my-5 md:my-8 transition-all hover:scale-105 w-fit disabled:opacity-50"
      >
        <ChevronLeft size={14} />
        <span>Back</span>
      </button>

      {/* Panel card */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm mb-10 text-black">
        {/* Header */}
        <div className="bg-slate-100 border-b border-slate-200 px-5 py-4">
          <h2 className="text-sm font-bold text-slate-800">
            {isAssign ? "Assign Subjects" : "Unassign Subjects"}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {staffName}
            {currentTerm &&
              ` · ${currentTerm.name}, ${currentTerm.session.name}`}
          </p>
        </div>

        <div className="flex flex-col gap-6 px-5 py-6">
          {renderContent()}

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
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-3 bg-slate-50 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="min-w-0 text-[11px] text-slate-500">
            {changeCount > 0
              ? `${actionLabel} ${plural(subjectsToSave.length, "subject", "subjects")} in ${plural(changeCount, "arm", "arms")} in total.`
              : "Nothing ticked yet."}
          </p>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="cursor-pointer px-4 py-2 text-xs border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                setFailures([]);
                mutate();
              }}
              disabled={changeCount === 0 || isPending}
              className={`cursor-pointer relative flex items-center justify-center gap-2 px-4 py-2 text-xs text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm ${
                isAssign
                  ? "bg-violet-600 hover:bg-violet-700 shadow-violet-200"
                  : "bg-red-600 hover:bg-red-700 shadow-red-200"
              }`}
            >
              <span className={isPending ? "invisible" : ""}>
                {actionLabel}
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
        </div>
      </div>
    </div>
  );
}

// ── Small building blocks ──────────────────────────────────────────────────

function SectionHeading({
  title,
  hint,
  ticked,
}: {
  title: string;
  hint: string;
  ticked: number;
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-slate-700">
        {title}
        {ticked > 0 && (
          <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-slate-600">
            {ticked} ticked
          </span>
        )}
      </h3>
      <p className="text-[11px] text-slate-400 mt-0.5">{hint}</p>
    </div>
  );
}

// A ticked or unticked option, styled like the Roles & Permissions panel's.
// `danger` uses the red of removing instead of the violet of adding.
function CheckRow({
  checked,
  disabled,
  onChange,
  title,
  note,
  danger = false,
}: {
  checked: boolean;
  disabled: boolean;
  onChange: () => void;
  title: string;
  note?: string;
  danger?: boolean;
}) {
  return (
    <label
      className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors ${
        disabled && !checked
          ? "cursor-not-allowed border-slate-100 bg-slate-50 opacity-60"
          : checked
            ? danger
              ? "cursor-pointer border-red-300 bg-red-50/50"
              : "cursor-pointer border-violet-300 bg-violet-50/50"
            : "cursor-pointer border-slate-200 bg-white hover:border-violet-200"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        className={`h-4 w-4 shrink-0 ${danger ? "accent-red-600" : "accent-violet-600"}`}
      />
      <span className="min-w-0">
        <span className="block text-sm font-medium text-slate-800 truncate">
          {title}
        </span>
        {note && (
          <span className="block text-[11px] text-slate-400">{note}</span>
        )}
      </span>
    </label>
  );
}
