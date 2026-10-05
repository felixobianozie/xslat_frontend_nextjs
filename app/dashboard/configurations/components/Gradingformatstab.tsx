"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Gradingformatstab.tsx
//
// Lists the school's grading formats (GET grading-format/list/) and opens the
// editor to create or change one. The backend has no delete endpoint, so
// formats can be created and edited but not removed.
//
// The list is loaded with React Query the first time the tab is opened and
// reused from the cache after that. After a save the list is refetched, and the
// arm and broadsheet detail caches are invalidated too because those responses
// embed copies of the school's grading formats.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil } from "lucide-react";

import { useClientAuthFetch } from "@/lib/Useclientauthfetch";
import type { ApiEnvelope, GradingFormatRecord } from "@/types/configurations";
import EmptyState from "../../components/Emptystate";
import TableLoader from "../../components/Tableloader";
import { QUERY_STALE_MS } from "../configutils";
import { ErrorNotice, ListToolbar } from "./Configui";
import SlidePanelLayout from "./Slidepanellayout";
import GradingFormatEditor from "./Gradingformateditor";

// ── Constants ────────────────────────────────────────────────────────────────

const SCHOOL_ID = process.env.NEXT_PUBLIC_SCHOOL_ID ?? "";

const GRADING_FORMATS_KEY = ["grading-formats", SCHOOL_ID];

// Cached arm and broadsheet details that embed grading formats.
const ARM_CACHE_KEYS = [["arm-detail"], ["broadsheet-arm-detail"]];

// ── Component ────────────────────────────────────────────────────────────────

export default function GradingFormatsTab() {
  const queryClient = useQueryClient();
  const { clientAuthFetch } = useClientAuthFetch();

  // The record being edited (null = creating a new one). It is kept after the
  // panel closes so the panel still has its content while it slides out.
  const [editing, setEditing] = useState<GradingFormatRecord | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  function openEditor(record: GradingFormatRecord | null) {
    setEditing(record);
    setPanelOpen(true);
  }

  function closeEditor() {
    setPanelOpen(false);
  }

  const { data, isPending, error, refetch } = useQuery<
    ApiEnvelope<GradingFormatRecord[]>
  >({
    queryKey: GRADING_FORMATS_KEY,
    queryFn: async () => {
      const { data, error } = await clientAuthFetch<
        ApiEnvelope<GradingFormatRecord[]>
      >(`grading-format/list/?school-id=${SCHOOL_ID}`);
      if (error) throw new Error(error.message);
      return data!;
    },
    staleTime: QUERY_STALE_MS,
  });

  function handleSaved() {
    queryClient.invalidateQueries({ queryKey: GRADING_FORMATS_KEY });
    for (const queryKey of ARM_CACHE_KEYS) {
      queryClient.invalidateQueries({ queryKey });
    }
    closeEditor();
  }

  const formats = data?.data ?? [];

  return (
    <SlidePanelLayout
      panelOpen={panelOpen}
      panel={
        <GradingFormatEditor
          key={editing?.id ?? "new"}
          format={editing}
          onClose={closeEditor}
          onSaved={handleSaved}
        />
      }
    >
      <div className="pb-10">
        <ListToolbar
          title="Grading formats"
          description="Score ranges and the symbol and remark each one earns."
          actionLabel="New format"
          onAction={() => openEditor(null)}
        />

        {isPending ? (
          <TableLoader rows={3} />
        ) : error ? (
          <ErrorNotice message={error.message} onRetry={() => refetch()} />
        ) : formats.length === 0 ? (
          <EmptyState
            title="No grading formats yet"
            description="Create a grading format to start grading scores."
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {formats.map((format) => (
              <article
                key={format.id}
                className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 flex flex-col gap-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-slate-800 truncate">
                      {format.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Scores {format.low}–{format.high} · {format.grades.length}{" "}
                      {format.grades.length === 1 ? "band" : "bands"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openEditor(format)}
                    className="cursor-pointer flex items-center gap-1 px-3 py-1.5 text-xs border border-slate-200 rounded-xl text-slate-600 hover:border-violet-300 hover:text-violet-700 transition-colors"
                  >
                    <Pencil size={11} /> Edit
                  </button>
                </div>

                <ul className="flex flex-wrap gap-2">
                  {[...format.grades]
                    .sort((a, b) => b.low - a.low)
                    .map((grade) => (
                      <li
                        key={grade.id}
                        title={grade.remark}
                        className={`rounded-lg border px-2.5 py-1.5 text-[11px] ${
                          grade.passed
                            ? "border-emerald-100 bg-emerald-50 text-emerald-800"
                            : "border-red-100 bg-red-50 text-red-700"
                        }`}
                      >
                        <span className="font-bold">{grade.symbol}</span>{" "}
                        <span className="opacity-80">
                          {grade.low}–{grade.high}
                        </span>
                      </li>
                    ))}
                </ul>
              </article>
            ))}
          </div>
        )}
      </div>
    </SlidePanelLayout>
  );
}
