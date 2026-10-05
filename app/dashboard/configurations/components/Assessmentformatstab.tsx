"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Assessmentformatstab.tsx
//
// The three assessment format families in one place:
//   cognitive    — subject score units        (cognitive-format/list/)
//   affective    — behaviour ratings          (affective-format/list/)
//   psychomotor  — activity ratings           (psychomotor-format/list/)
//
// A segmented control switches families. All three lists share one layout;
// opening an editor slides it in over the lists until the user goes back. The
// backend has no delete endpoint, so formats can be created and edited only.
//
// Each list is loaded with React Query the first time its family is shown and
// reused from the cache after that. After a save the matching list is
// refetched, and the arm and broadsheet detail caches are invalidated because
// those responses embed copies of the school's assessment formats.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil } from "lucide-react";

import { useClientAuthFetch } from "@/lib/Useclientauthfetch";
import type {
  AffectiveFormatRecord,
  ApiEnvelope,
  CognitiveFormatRecord,
  PsychomotorFormatRecord,
} from "@/types/configurations";
import EmptyState from "../../components/Emptystate";
import TableLoader from "../../components/Tableloader";
import { QUERY_STALE_MS } from "../configutils";
import CognitiveFormatEditor from "./Cognitiveformateditor";
import { ErrorNotice, ListToolbar } from "./Configui";
import ItemFormatEditor, {
  type ItemFormat,
  type ItemFormatKind,
} from "./Itemformateditor";
import SlidePanelLayout from "./Slidepanellayout";

// ── Constants ────────────────────────────────────────────────────────────────

const SCHOOL_ID = process.env.NEXT_PUBLIC_SCHOOL_ID ?? "";

const COGNITIVE_FORMATS_KEY = ["cognitive-formats", SCHOOL_ID];
const AFFECTIVE_FORMATS_KEY = ["affective-formats", SCHOOL_ID];
const PSYCHOMOTOR_FORMATS_KEY = ["psychomotor-formats", SCHOOL_ID];

// Cached arm and broadsheet details that embed assessment formats.
const ARM_CACHE_KEYS = [["arm-detail"], ["broadsheet-arm-detail"]];

type Family = "cognitive" | "affective" | "psychomotor";

const FAMILIES: { id: Family; label: string; description: string }[] = [
  {
    id: "cognitive",
    label: "Cognitive",
    description:
      "How a subject's score is split into units, such as CA and exam.",
  },
  {
    id: "affective",
    label: "Affective",
    description: "Behaviours rated for each student, such as punctuality.",
  },
  {
    id: "psychomotor",
    label: "Psychomotor",
    description: "Activities rated for each student, such as handwriting.",
  },
];

const AFFECTIVE_KIND: ItemFormatKind = {
  endpointBase: "affective-format",
  itemsKey: "behaviours",
  itemKey: "behaviour",
  formatLabel: "Affective",
  itemLabel: "Behaviour",
  itemLabelPlural: "behaviours",
};

const PSYCHOMOTOR_KIND: ItemFormatKind = {
  endpointBase: "psychomotor-format",
  itemsKey: "activities",
  itemKey: "activity",
  formatLabel: "Psychomotor",
  itemLabel: "Activity",
  itemLabelPlural: "activities",
};

// What the user is editing: the family, and the record (null = new).
type EditorTarget =
  | { family: "cognitive"; record: CognitiveFormatRecord | null }
  | { family: "affective" | "psychomotor"; record: ItemFormat | null };

export default function AssessmentFormatsTab() {
  const queryClient = useQueryClient();
  const { clientAuthFetch } = useClientAuthFetch();
  const [family, setFamily] = useState<Family>("cognitive");
  // The format being edited. It is kept after the panel closes so the panel
  // still has its content while it slides out.
  const [editor, setEditor] = useState<EditorTarget | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  function openEditor(target: EditorTarget) {
    setEditor(target);
    setPanelOpen(true);
  }

  function closeEditor() {
    setPanelOpen(false);
  }

  const cognitive = useQuery<ApiEnvelope<CognitiveFormatRecord[]>>({
    queryKey: COGNITIVE_FORMATS_KEY,
    queryFn: async () => {
      const { data, error } = await clientAuthFetch<
        ApiEnvelope<CognitiveFormatRecord[]>
      >(`cognitive-format/list/?school-id=${SCHOOL_ID}`);
      if (error) throw new Error(error.message);
      return data!;
    },
    // Only the family on screen is requested.
    enabled: family === "cognitive",
    staleTime: QUERY_STALE_MS,
  });

  const affective = useQuery<ApiEnvelope<AffectiveFormatRecord[]>>({
    queryKey: AFFECTIVE_FORMATS_KEY,
    queryFn: async () => {
      const { data, error } = await clientAuthFetch<
        ApiEnvelope<AffectiveFormatRecord[]>
      >(`affective-format/list/?school-id=${SCHOOL_ID}`);
      if (error) throw new Error(error.message);
      return data!;
    },
    // Only the family on screen is requested.
    enabled: family === "affective",
    staleTime: QUERY_STALE_MS,
  });

  const psychomotor = useQuery<ApiEnvelope<PsychomotorFormatRecord[]>>({
    queryKey: PSYCHOMOTOR_FORMATS_KEY,
    queryFn: async () => {
      const { data, error } = await clientAuthFetch<
        ApiEnvelope<PsychomotorFormatRecord[]>
      >(`psychomotor-format/list/?school-id=${SCHOOL_ID}`);
      if (error) throw new Error(error.message);
      return data!;
    },
    // Only the family on screen is requested.
    enabled: family === "psychomotor",
    staleTime: QUERY_STALE_MS,
  });

  // Refreshes the list of the family that was just edited, plus the cached
  // arm details, then returns to the lists.
  function handleSaved(editedFamily: Family) {
    const listKey =
      editedFamily === "cognitive"
        ? COGNITIVE_FORMATS_KEY
        : editedFamily === "affective"
          ? AFFECTIVE_FORMATS_KEY
          : PSYCHOMOTOR_FORMATS_KEY;
    queryClient.invalidateQueries({ queryKey: listKey });
    for (const queryKey of ARM_CACHE_KEYS) {
      queryClient.invalidateQueries({ queryKey });
    }
    closeEditor();
  }

  const active = FAMILIES.find((f) => f.id === family)!;
  const query =
    family === "cognitive"
      ? cognitive
      : family === "affective"
        ? affective
        : psychomotor;

  // Each family's records reduced to what the card list needs: a name, a
  // summary line and the lines to show inside the card.
  const cards = buildCards(family, query.data?.data);

  function handleNew() {
    openEditor({ family, record: null });
  }

  function handleEdit(id: string) {
    if (family === "cognitive") {
      const record = cognitive.data?.data.find((r) => r.id === id) ?? null;
      openEditor({ family, record });
    } else if (family === "affective") {
      const record = affective.data?.data.find((r) => r.id === id);
      openEditor({
        family,
        record: record
          ? {
              id: record.id,
              name: record.name,
              items: record.behaviours.map((b) => ({
                label: b.behaviour,
                maxScore: b.max_score,
                displayOrder: b.display_order,
              })),
            }
          : null,
      });
    } else {
      const record = psychomotor.data?.data.find((r) => r.id === id);
      openEditor({
        family,
        record: record
          ? {
              id: record.id,
              name: record.name,
              items: record.activities.map((a) => ({
                label: a.activity,
                maxScore: a.max_score,
                displayOrder: a.display_order,
              })),
            }
          : null,
      });
    }
  }

  return (
    <SlidePanelLayout
      panelOpen={panelOpen}
      panel={
        editor &&
        (editor.family === "cognitive" ? (
          <CognitiveFormatEditor
            key={editor.record?.id ?? "new"}
            format={editor.record}
            onClose={closeEditor}
            onSaved={() => handleSaved("cognitive")}
          />
        ) : (
          <ItemFormatEditor
            key={`${editor.family}-${editor.record?.id ?? "new"}`}
            kind={
              editor.family === "affective" ? AFFECTIVE_KIND : PSYCHOMOTOR_KIND
            }
            format={editor.record}
            onClose={closeEditor}
            onSaved={() => handleSaved(editor.family)}
          />
        ))
      }
    >
      <div className="pb-10">
        {/* Segmented control — scrolls sideways on very narrow screens */}
        <div
          role="tablist"
          aria-label="Assessment format type"
          className="inline-flex max-w-full overflow-x-auto scrollbar-hide rounded-xl border border-slate-200 bg-white p-1 mb-5"
        >
          {FAMILIES.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={family === item.id}
              onClick={() => setFamily(item.id)}
              className={`cursor-pointer whitespace-nowrap rounded-lg px-4 py-1.5 text-xs font-medium transition-colors ${
                family === item.id
                  ? "bg-violet-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-violet-700"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <ListToolbar
          title={`${active.label} formats`}
          description={active.description}
          actionLabel="New format"
          onAction={handleNew}
        />

        {query.isPending ? (
          <TableLoader rows={3} />
        ) : query.error ? (
          <ErrorNotice
            message={query.error.message}
            onRetry={() => query.refetch()}
          />
        ) : cards.length === 0 ? (
          <EmptyState
            title={`No ${active.label.toLowerCase()} formats yet`}
            description="Create a format to start using it on class arms."
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {cards.map((card) => (
              <article
                key={card.id}
                className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 flex flex-col gap-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-slate-800 truncate">
                      {card.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {card.summary}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleEdit(card.id)}
                    className="cursor-pointer flex items-center gap-1 px-3 py-1.5 text-xs border border-slate-200 rounded-xl text-slate-600 hover:border-violet-300 hover:text-violet-700 transition-colors"
                  >
                    <Pencil size={11} /> Edit
                  </button>
                </div>
                <ul className="flex flex-wrap gap-2">
                  {card.chips.map((chip, index) => (
                    <li
                      key={`${chip.label}-${index}`}
                      className="rounded-lg border border-indigo-100 bg-indigo-50/60 px-2.5 py-1.5 text-[11px] text-indigo-800"
                    >
                      <span className="font-semibold">{chip.label}</span>{" "}
                      <span className="opacity-70">{chip.value}</span>
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

interface CardView {
  id: string;
  name: string;
  summary: string;
  chips: { label: string; value: string }[];
}

function buildCards(
  family: Family,
  records:
    | CognitiveFormatRecord[]
    | AffectiveFormatRecord[]
    | PsychomotorFormatRecord[]
    | undefined,
): CardView[] {
  if (!records) return [];

  if (family === "cognitive") {
    return (records as CognitiveFormatRecord[]).map((format) => {
      const total = format.units.reduce((sum, unit) => sum + unit.max_score, 0);
      return {
        id: format.id,
        name: format.name,
        summary: `${format.units.length} ${format.units.length === 1 ? "unit" : "units"} · ${total} marks`,
        chips: [...format.units]
          .sort((a, b) => a.display_order - b.display_order)
          .map((unit) => ({ label: unit.abbr, value: `/ ${unit.max_score}` })),
      };
    });
  }

  if (family === "affective") {
    return (records as AffectiveFormatRecord[]).map((format) => ({
      id: format.id,
      name: format.name,
      summary: `${format.behaviours.length} ${format.behaviours.length === 1 ? "behaviour" : "behaviours"}`,
      chips: [...format.behaviours]
        .sort((a, b) => a.display_order - b.display_order)
        .map((item) => ({
          label: item.behaviour,
          value: `/ ${item.max_score}`,
        })),
    }));
  }

  return (records as PsychomotorFormatRecord[]).map((format) => ({
    id: format.id,
    name: format.name,
    summary: `${format.activities.length} ${format.activities.length === 1 ? "activity" : "activities"}`,
    chips: [...format.activities]
      .sort((a, b) => a.display_order - b.display_order)
      .map((item) => ({ label: item.activity, value: `/ ${item.max_score}` })),
  }));
}
