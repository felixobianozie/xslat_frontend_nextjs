"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Resulttemplatestab.tsx
//
// Lists the result templates this school can use (GET result-template/list/):
// its own school-specific templates plus every universal template. Each list
// item carries the template's description and config, so editing needs no
// further request.
//
// Universal templates belong to the platform, so only a platform superuser
// (is_superuser claim in the session) gets an Edit button on them. The
// backend enforces the same rule; hiding the button just avoids a dead end.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Globe, Pencil } from "lucide-react";

import { useClientAuthFetch } from "@/lib/Useclientauthfetch";
import type {
  ApiEnvelope,
  ResultTemplateListItem,
} from "@/types/configurations";
import EmptyState from "../../components/Emptystate";
import TableLoader from "../../components/Tableloader";
import { QUERY_STALE_MS, formatDate } from "../configutils";
import { ErrorNotice, ListToolbar, StatusPill } from "./Configui";
import SlidePanelLayout from "./Slidepanellayout";
import ResultTemplateEditor from "./Resulttemplateeditor";

// ── Constants ────────────────────────────────────────────────────────────────

const SCHOOL_ID = process.env.NEXT_PUBLIC_SCHOOL_ID ?? "";

const RESULT_TEMPLATES_KEY = ["result-templates", SCHOOL_ID];

// Cached arm and broadsheet details that embed result templates.
const ARM_CACHE_KEYS = [["arm-detail"], ["broadsheet-arm-detail"]];

// ── Component ────────────────────────────────────────────────────────────────

export default function ResultTemplatesTab() {
  const queryClient = useQueryClient();
  const { clientAuthFetch } = useClientAuthFetch();
  const { data: session } = useSession();
  const isSuperuser = session?.accessClaims?.is_superuser === true;

  // The template being edited (null = creating a new one). It is kept after
  // the panel closes so the panel still has its content while it slides out.
  const [editing, setEditing] = useState<ResultTemplateListItem | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  function openEditor(template: ResultTemplateListItem | null) {
    setEditing(template);
    setPanelOpen(true);
  }

  function closeEditor() {
    setPanelOpen(false);
  }

  const { data, isPending, error, refetch } = useQuery<
    ApiEnvelope<ResultTemplateListItem[]>
  >({
    queryKey: RESULT_TEMPLATES_KEY,
    queryFn: async () => {
      const { data, error } = await clientAuthFetch<
        ApiEnvelope<ResultTemplateListItem[]>
      >(`result-template/list/?school-id=${SCHOOL_ID}`);
      if (error) throw new Error(error.message);
      return data!;
    },
    staleTime: QUERY_STALE_MS,
  });

  function handleSaved() {
    queryClient.invalidateQueries({ queryKey: RESULT_TEMPLATES_KEY });
    for (const queryKey of ARM_CACHE_KEYS) {
      queryClient.invalidateQueries({ queryKey });
    }
    closeEditor();
  }

  const templates = data?.data ?? [];

  return (
    <SlidePanelLayout
      panelOpen={panelOpen}
      panel={
        <ResultTemplateEditor
          key={editing?.id ?? "new"}
          template={editing}
          onClose={closeEditor}
          onSaved={handleSaved}
        />
      }
    >
      <div className="pb-10">
        <ListToolbar
          title="Result templates"
          description="Report card layouts available to this school's class arms."
          actionLabel="New template"
          onAction={() => openEditor(null)}
        />

        {isPending ? (
          <TableLoader rows={3} />
        ) : error ? (
          <ErrorNotice message={error.message} onRetry={() => refetch()} />
        ) : templates.length === 0 ? (
          <EmptyState
            title="No result templates yet"
            description="Create a template to describe a report card layout."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {templates.map((template) => {
              const isUniversal = template.scope === "universal";
              const canEdit = !isUniversal || isSuperuser;
              return (
                <article
                  key={template.id}
                  className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col"
                >
                  {/* Preview — falls back to a plain block when no image is set */}
                  <div className="h-40 bg-slate-100 border-b border-slate-200 flex items-center justify-center overflow-hidden">
                    {template.preview_image_url ? (
                      // Preview images are admin-supplied URLs on unknown hosts,
                      // so a plain <img> is used rather than next/image.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={template.preview_image_url}
                        alt={`${template.name} preview`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-xs text-slate-400">No preview</span>
                    )}
                  </div>

                  <div className="p-4 flex flex-col gap-3 flex-1">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold text-slate-800 truncate">
                          {template.name}
                        </h3>
                        <StatusPill active={template.is_active} />
                      </div>
                      <p className="text-[11px] font-mono text-slate-400 mt-1 truncate">
                        {template.template_key}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-auto">
                      <p className="flex items-center gap-1 text-[11px] text-slate-400">
                        {isUniversal && <Globe size={11} />}
                        {isUniversal ? "Shared" : "This school"} ·{" "}
                        {formatDate(template.created_on)}
                      </p>
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => openEditor(template)}
                          className="cursor-pointer flex items-center gap-1 px-3 py-1.5 text-xs border border-slate-200 rounded-xl text-slate-600 hover:border-violet-300 hover:text-violet-700 transition-colors"
                        >
                          <Pencil size={11} /> Edit
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </SlidePanelLayout>
  );
}
