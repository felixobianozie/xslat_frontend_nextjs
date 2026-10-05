"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Passrulestab.tsx
//
// Lists the school's pass rules (GET pass-rule/list/) and opens the editor to
// create or change one. The backend has no delete endpoint; a rule is switched
// off with its "active" setting instead.
//
// Pass rules are loaded with React Query the first time the tab is opened and
// reused from the cache after that. The editor loads the school's subject
// definitions when it opens.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil } from "lucide-react";

import { useClientAuthFetch } from "@/lib/Useclientauthfetch";
import type { ApiEnvelope, PassRuleRecord } from "@/types/configurations";
import EmptyState from "../../components/Emptystate";
import TableLoader from "../../components/Tableloader";
import {
  QUERY_STALE_MS,
  fractionToPercentText,
  trimDecimalText,
} from "../configutils";
import { ErrorNotice, ListToolbar, StatusPill } from "./Configui";
import SlidePanelLayout from "./Slidepanellayout";
import PassRuleEditor from "./Passruleeditor";

// ── Constants ────────────────────────────────────────────────────────────────

const SCHOOL_ID = process.env.NEXT_PUBLIC_SCHOOL_ID ?? "";

const PASS_RULES_KEY = ["pass-rules", SCHOOL_ID];

// Cached arm and broadsheet details that embed pass rules.
const ARM_CACHE_KEYS = [["arm-detail"], ["broadsheet-arm-detail"]];

// One sentence describing what the rule requires.
function describeRule(rule: PassRuleRecord): string {
  const isPercentage = rule.decide_by === "percentage";
  const value = isPercentage
    ? `${fractionToPercentText(rule.base_value)}%`
    : trimDecimalText(rule.base_value);

  if (rule.type === "score") {
    return isPercentage
      ? `Pass with at least ${value} of the total score`
      : `Pass with an aggregate score of at least ${value}`;
  }
  return isPercentage
    ? `Pass at least ${value} of the subjects offered`
    : `Pass at least ${value} subjects`;
}

export default function PassRulesTab() {
  const queryClient = useQueryClient();
  const { clientAuthFetch } = useClientAuthFetch();

  // The record being edited (null = creating a new one). It is kept after the
  // panel closes so the panel still has its content while it slides out.
  const [editing, setEditing] = useState<PassRuleRecord | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  function openEditor(record: PassRuleRecord | null) {
    setEditing(record);
    setPanelOpen(true);
  }

  function closeEditor() {
    setPanelOpen(false);
  }

  const { data, isPending, error, refetch } = useQuery<
    ApiEnvelope<PassRuleRecord[]>
  >({
    queryKey: PASS_RULES_KEY,
    queryFn: async () => {
      const { data, error } = await clientAuthFetch<
        ApiEnvelope<PassRuleRecord[]>
      >(`pass-rule/list/?school-id=${SCHOOL_ID}`);
      if (error) throw new Error(error.message);
      return data!;
    },
    staleTime: QUERY_STALE_MS,
  });

  function handleSaved() {
    queryClient.invalidateQueries({ queryKey: PASS_RULES_KEY });
    for (const queryKey of ARM_CACHE_KEYS) {
      queryClient.invalidateQueries({ queryKey });
    }
    closeEditor();
  }

  const rules = data?.data ?? [];

  return (
    <SlidePanelLayout
      panelOpen={panelOpen}
      panel={
        <PassRuleEditor
          key={editing?.id ?? "new"}
          rule={editing}
          onClose={closeEditor}
          onSaved={handleSaved}
        />
      }
    >
      <div className="pb-10">
        <ListToolbar
          title="Pass rules"
          description="How a student's results decide a pass or a fail."
          actionLabel="New rule"
          onAction={() => openEditor(null)}
        />

        {isPending ? (
          <TableLoader rows={3} />
        ) : error ? (
          <ErrorNotice message={error.message} onRetry={() => refetch()} />
        ) : rules.length === 0 ? (
          <EmptyState
            title="No pass rules yet"
            description="Create a pass rule to decide who passes each term."
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {rules.map((rule) => (
              <article
                key={rule.id}
                className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-slate-800 truncate">
                        {rule.name}
                      </h3>
                      <StatusPill active={rule.active} />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {describeRule(rule)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openEditor(rule)}
                    className="cursor-pointer flex items-center gap-1 px-3 py-1.5 text-xs border border-slate-200 rounded-xl text-slate-600 hover:border-violet-300 hover:text-violet-700 transition-colors"
                  >
                    <Pencil size={11} /> Edit
                  </button>
                </div>

                {rule.subjects.length > 0 && (
                  <div>
                    <p className="text-[11px] font-medium text-slate-400 mb-1.5">
                      Subject requirements
                    </p>
                    <ul className="flex flex-wrap gap-2">
                      {rule.subjects.map((subject) => (
                        <li
                          key={subject.id}
                          className="rounded-lg border border-indigo-100 bg-indigo-50/60 px-2.5 py-1.5 text-[11px] text-indigo-800"
                        >
                          <span className="font-semibold">
                            {subject.subject_definition.name}
                          </span>{" "}
                          <span className="opacity-70">
                            {rule.decide_by === "percentage"
                              ? `${fractionToPercentText(subject.base_value)}%`
                              : trimDecimalText(subject.base_value)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </SlidePanelLayout>
  );
}
