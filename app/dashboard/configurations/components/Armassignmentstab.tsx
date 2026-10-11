"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Armassignmentstab.tsx
//
// The Arm Settings tab: which school settings each class arm of the current
// term uses. The settings are the result template, the three grading formats,
// the three assessment formats and the pass rule.
//
// Admins tick one or more arms and choose "Assign settings" to give them the
// same settings in one go (see Armassignpanel.tsx), or "Manage subjects" to add
// subjects to, or remove them from, all the ticked arms at once (see
// Armsubjectspanel.tsx).
//
// Data:
//   • The current term comes from the school record (school/detail/) and the
//     arms from arm/list/. The arm list shares its cache entry with the
//     Class Arms page.
//   • arm/list/ does not say which settings an arm uses, so each arm's detail
//     (arm/detail/) is requested too. These entries share their cache with the
//     arm page. After an assignment, only the arms that were changed are
//     refetched.
//   • The term's subjects (subject/list/) say which arms offer each subject.
//     They share their cache entry with the Subjects tab.
//
// Arms whose broadsheet is submitted or approved are locked by the backend, so
// they are shown but cannot be ticked.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { Lock } from "lucide-react";
import { toast } from "react-toastify";

import { useClientAuthFetch } from "@/lib/Useclientauthfetch";
import type { ApiEnvelope, ArmAssignmentsData } from "@/types/configurations";
import EmptyState from "../../components/Emptystate";
import TableLoader from "../../components/Tableloader";
import {
  ARMS_KEY,
  ARM_DETAIL_KEY,
  ASSIGNMENT_PARAMETERS,
  QUERY_STALE_MS,
  SCHOOL_ID,
  TERM_SUBJECTS_KEY,
  armLabel,
  isArmLocked,
} from "../configutils";
import { useCurrentTerm } from "../hooks/Usecurrentterm";
import { useTermSubjects } from "../hooks/Usetermsubjects";
import ArmAssignPanel from "./Armassignpanel";
import ArmSubjectsPanel from "./Armsubjectspanel";
import { ErrorNotice, ListToolbar } from "./Configui";
import SlidePanelLayout from "./Slidepanellayout";

export default function ArmAssignmentsTab() {
  const queryClient = useQueryClient();
  const { clientAuthFetch } = useClientAuthFetch();

  // The school record carries the current term. The cache entry is shared with
  // the dashboard top bar.
  const { school, currentTerm } = useCurrentTerm();
  const subjectsQuery = useTermSubjects(currentTerm?.id);
  const termSubjects = subjectsQuery.data?.data ?? [];

  // Ids of the ticked arms.
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  // The arms shown in the panel. Kept after the panel closes so the panel still
  // has its content while it slides out.
  const [panelArms, setPanelArms] = useState<ClassArm[]>([]);
  const [panelKind, setPanelKind] = useState<"settings" | "subjects">(
    "settings",
  );
  const [panelOpen, setPanelOpen] = useState(false);

  const armsQuery = useQuery<ApiEnvelope<ClassArm[]>>({
    queryKey: [...ARMS_KEY, currentTerm?.id],
    enabled: !!currentTerm,
    queryFn: async () => {
      const { data, error } = await clientAuthFetch<ApiEnvelope<ClassArm[]>>(
        `arm/list/?school-id=${SCHOOL_ID}&term-id=${currentTerm?.id}`,
      );
      if (error) throw new Error(error.message);
      return data!;
    },
    staleTime: QUERY_STALE_MS,
  });

  const arms = armsQuery.data?.data ?? [];

  // One detail request per arm, to learn which settings it uses.
  const detailQueries = useQueries({
    queries: arms.map((arm) => ({
      queryKey: [...ARM_DETAIL_KEY, arm.id],
      queryFn: async (): Promise<ApiEnvelope<ArmAssignmentsData>> => {
        const { data, error } = await clientAuthFetch<
          ApiEnvelope<ArmAssignmentsData>
        >(`arm/detail/?id=${arm.id}&school-id=${SCHOOL_ID}`);
        if (error) throw new Error(error.message);
        return data!;
      },
      staleTime: QUERY_STALE_MS,
    })),
  });

  const selectableIds = arms
    .filter((arm) => !isArmLocked(arm.broadsheet))
    .map((arm) => arm.id);
  const allSelected =
    selectableIds.length > 0 &&
    selectableIds.every((id) => selectedIds.includes(id));

  function toggleArm(armId: string) {
    setSelectedIds((previous) =>
      previous.includes(armId)
        ? previous.filter((id) => id !== armId)
        : [...previous, armId],
    );
  }

  function openPanelForSelection(kind: "settings" | "subjects") {
    const chosen = arms.filter((arm) => selectedIds.includes(arm.id));
    if (chosen.length === 0) {
      toast.info("Tick at least one arm first.");
      return;
    }
    setPanelArms(chosen);
    setPanelKind(kind);
    setPanelOpen(true);
  }

  // After the subjects of some arms changed, refresh everything that lists
  // those subjects.
  function handleSubjectsChanged(armIds: string[]) {
    queryClient.invalidateQueries({ queryKey: TERM_SUBJECTS_KEY });
    for (const armId of armIds) {
      for (const queryKey of [
        ["arm-subjects", armId],
        ["student-offered-subjects", armId],
        ["student-not-offered-subjects", armId],
        ["arm-detail", armId],
        ["broadsheet-arm-detail", armId],
      ]) {
        queryClient.invalidateQueries({ queryKey });
      }
    }
  }

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
          description="Set a current session and term on the School Calendar tab, then assign settings to its arms."
        />
      );
    }
    if (armsQuery.isPending) return <TableLoader rows={3} />;
    if (armsQuery.error) {
      return (
        <ErrorNotice
          message={armsQuery.error.message}
          onRetry={() => armsQuery.refetch()}
        />
      );
    }
    if (arms.length === 0) {
      return (
        <EmptyState
          title="No arms in the current term"
          description="Create class arms on the Class Arms page first."
        />
      );
    }

    return (
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {arms.map((arm, index) => {
          const locked = isArmLocked(arm.broadsheet);
          const detail = detailQueries[index];
          const assignments = detail?.data?.data;
          const subjectCount = termSubjects.filter((subject) =>
            subject.subject_arms.some((link) => link.arm.id === arm.id),
          ).length;

          return (
            <article
              key={arm.id}
              className={`bg-white border rounded-2xl shadow-sm p-4 flex flex-col gap-3 ${
                selectedIds.includes(arm.id)
                  ? "border-violet-300"
                  : "border-slate-200"
              }`}
            >
              <label
                className={`flex items-start gap-3 ${
                  locked ? "cursor-not-allowed" : "cursor-pointer"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedIds.includes(arm.id)}
                  disabled={locked}
                  onChange={() => toggleArm(arm.id)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-violet-600"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-slate-800">
                    {armLabel(arm)}
                  </span>
                  <span className="block text-[11px] text-slate-400">
                    {arm.level.section.name} · {arm.level.name} · {arm.name}
                  </span>
                </span>
                {locked && (
                  <span className="ml-auto flex items-center gap-1 text-[11px] text-slate-400">
                    <Lock size={11} /> Locked
                  </span>
                )}
              </label>

              {detail?.isPending ? (
                <p className="text-[11px] text-slate-400">Loading settings…</p>
              ) : detail?.error ? (
                <p className="text-[11px] text-red-500">
                  Could not load settings: {detail.error.message}
                </p>
              ) : (
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
                  {ASSIGNMENT_PARAMETERS.map((parameter) => {
                    const value = assignments?.[parameter.key];
                    return (
                      <div key={parameter.key} className="min-w-0">
                        <dt className="text-[10px] text-slate-400">
                          {parameter.label}
                        </dt>
                        <dd
                          className={`text-xs truncate ${
                            value ? "text-slate-700" : "text-amber-600"
                          }`}
                        >
                          {value ? value.name : "Not set"}
                        </dd>
                      </div>
                    );
                  })}
                  <div className="min-w-0">
                    <dt className="text-[10px] text-slate-400">Subjects</dt>
                    <dd
                      className={`text-xs truncate ${
                        subjectCount > 0 ? "text-slate-700" : "text-amber-600"
                      }`}
                    >
                      {subjectsQuery.isPending
                        ? "Loading…"
                        : subjectsQuery.error
                          ? "Unavailable"
                          : subjectCount > 0
                            ? `${subjectCount} offered`
                            : "None offered"}
                    </dd>
                  </div>
                </dl>
              )}
            </article>
          );
        })}
      </div>
    );
  }

  return (
    <SlidePanelLayout
      panelOpen={panelOpen}
      panel={
        panelKind === "settings" ? (
          <ArmAssignPanel
            arms={panelArms}
            onClose={() => setPanelOpen(false)}
            onChanged={(armIds) => {
              // Only the arms that were changed need their details reloaded.
              for (const armId of armIds) {
                queryClient.invalidateQueries({
                  queryKey: [...ARM_DETAIL_KEY, armId],
                });
              }
            }}
          />
        ) : (
          <ArmSubjectsPanel
            arms={panelArms}
            subjects={termSubjects}
            onClose={() => setPanelOpen(false)}
            onChanged={handleSubjectsChanged}
          />
        )
      }
    >
      <div className="pb-10">
        <ListToolbar
          title="Arm Settings"
          description={
            currentTerm
              ? `${currentTerm.name} Term | ${currentTerm.session.name} Session. Tick the arms to configure, then assign settings or manage their subjects.`
              : "Choose the settings each class arm uses."
          }
          actionLabel={
            selectedIds.length > 0
              ? `Assign settings (${selectedIds.length})`
              : "Assign settings"
          }
          onAction={() => openPanelForSelection("settings")}
          secondaryLabel={allSelected ? "Clear selection" : "Select all"}
          onSecondary={() => setSelectedIds(allSelected ? [] : selectableIds)}
          extraActions={[
            {
              label:
                selectedIds.length > 0
                  ? `Manage subjects (${selectedIds.length})`
                  : "Manage subjects",
              onClick: () => openPanelForSelection("subjects"),
            },
          ]}
        />
        {renderContent()}
      </div>
    </SlidePanelLayout>
  );
}
