"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Termsubjectspanel.tsx
//
// Offers subject definitions in the current term (POST subject/list/, one
// request per ticked definition). Only definitions the term does not already
// have are listed.
//
// Requests run one after another. A definition that fails does not stop the
// others; the panel stays open and lists each failure, while the ones that
// succeeded are already saved and reported to the tab so it refreshes.
//
// A subject added here is not offered by any arm yet. Arms are chosen on the
// Arm Settings tab. The backend only accepts new subjects in the current term
// of the current session.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { useClientAuthFetch } from "@/lib/Useclientauthfetch";
import type { SubjectDefinitionRecord } from "@/types/configurations";
import ConfigPanel from "./Configpanel";
import EmptyState from "../../components/Emptystate";

interface TermSubjectsPanelProps {
  term: { id: string; name: string; session: { name: string } };
  // Definitions the term does not offer yet.
  available: SubjectDefinitionRecord[];
  onClose: () => void;
  // Called when at least one subject was added.
  onChanged: () => void;
}

export default function TermSubjectsPanel({
  term,
  available,
  onClose,
  onChanged,
}: TermSubjectsPanelProps) {
  const { clientAuthFetch } = useClientAuthFetch();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [failures, setFailures] = useState<string[]>([]);

  // Definitions added in an earlier attempt drop out of `available`, so they
  // are also dropped from the ticked list.
  const chosen = available.filter((definition) =>
    selectedIds.includes(definition.id),
  );
  const allSelected =
    available.length > 0 && chosen.length === available.length;

  function toggle(definitionId: string) {
    setSelectedIds((previous) =>
      previous.includes(definitionId)
        ? previous.filter((id) => id !== definitionId)
        : [...previous, definitionId],
    );
  }

  const { mutate, isPending } = useMutation<
    { failures: string[]; addedCount: number },
    Error,
    SubjectDefinitionRecord[]
  >({
    mutationFn: async (definitions) => {
      const problems: string[] = [];
      let addedCount = 0;

      for (const definition of definitions) {
        const { error } = await clientAuthFetch("subject/list/", {
          method: "POST",
          body: { definition: definition.id, term: term.id },
        });
        if (error) problems.push(`${definition.name}: ${error.message}`);
        else addedCount += 1;
      }

      return { failures: problems, addedCount };
    },
    onSuccess: ({ failures: problems, addedCount }) => {
      if (addedCount > 0) onChanged();

      if (problems.length === 0) {
        toast.success(
          addedCount === 1 ? "Subject added." : `${addedCount} subjects added.`,
        );
        onClose();
        return;
      }
      setFailures(problems);
      toast.error(
        addedCount > 0
          ? "Some subjects were not added."
          : "No subjects were added.",
      );
    },
  });

  return (
    <ConfigPanel
      title="Add subjects to the term"
      subtitle={`${term.name} Term | ${term.session.name} Session`}
      submitLabel={
        chosen.length > 0 ? `Add ${chosen.length} to term` : "Add to term"
      }
      isPending={isPending}
      canSubmit={chosen.length > 0}
      onSubmit={() => {
        setFailures([]);
        mutate(chosen);
      }}
      onClose={onClose}
    >
      {available.length === 0 ? (
        <EmptyState
          title="Every subject is already in this term"
          description="Create a new subject first if you need another one."
        />
      ) : (
        <>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              Tick the subjects this term should offer. Choose which arms offer
              them on the Arm Settings tab.
            </p>
            <button
              type="button"
              onClick={() =>
                setSelectedIds(
                  allSelected
                    ? []
                    : available.map((definition) => definition.id),
                )
              }
              disabled={isPending}
              className="cursor-pointer shrink-0 text-xs text-violet-700 hover:text-violet-800 disabled:opacity-50"
            >
              {allSelected ? "Clear all" : "Select all"}
            </button>
          </div>

          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {available.map((definition) => (
              <li key={definition.id}>
                <label
                  className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 cursor-pointer transition-colors ${
                    selectedIds.includes(definition.id)
                      ? "border-violet-300 bg-violet-50/50"
                      : "border-slate-200 bg-white hover:border-violet-200"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(definition.id)}
                    disabled={isPending}
                    onChange={() => toggle(definition.id)}
                    className="h-4 w-4 shrink-0 accent-violet-600"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-slate-800 truncate">
                      {definition.name}
                    </span>
                    <span className="block text-[11px] text-slate-400">
                      {definition.abbr}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </>
      )}

      {failures.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5">
          <p className="text-[11px] font-semibold text-red-700 mb-1.5">
            These were not added:
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
