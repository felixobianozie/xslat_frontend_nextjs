"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Subjectmanagementtab.tsx
//
// The Subjects tab, in two views switched by a segmented control:
//
//   School subjects   the school's subject definitions
//                     (GET subject-definition/list/). A definition is a name
//                     and an abbreviation; the editor creates and changes
//                     them. The backend has no delete endpoint.
//   Term subjects     the subjects offered in the current term
//                     (GET subject/list/). The panel offers more of the
//                     school's subjects in the current term.
//
// The backend only accepts new subjects in the current term of the current
// session, so the term view always shows the current term and has no actions
// when the school has none.
//
// Which arms offer a subject is set on the Arm Settings tab. Teacher
// assignment and student exclusions stay on the class arm pages.
//
// Both lists load with React Query the first time the tab is opened and are
// reused from the cache after that. The term subjects share their cache entry
// with the Arm Settings tab.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil } from "lucide-react";

import { useClientAuthFetch } from "@/lib/Useclientauthfetch";
import type {
  ApiEnvelope,
  SubjectDefinitionRecord,
} from "@/types/configurations";
import EmptyState from "../../components/Emptystate";
import TableLoader from "../../components/Tableloader";
import {
  PASS_RULES_KEY,
  QUERY_STALE_MS,
  SCHOOL_ID,
  SUBJECT_DEFINITIONS_KEY,
  TERM_SUBJECTS_KEY,
} from "../configutils";
import { useCurrentTerm } from "../hooks/Usecurrentterm";
import { useTermSubjects } from "../hooks/Usetermsubjects";
import { ErrorNotice, ListToolbar, StatusPill } from "./Configui";
import SlidePanelLayout from "./Slidepanellayout";
import SubjectDefinitionEditor from "./Subjectdefinitioneditor";
import TermSubjectsPanel from "./Termsubjectspanel";

// ── Constants ────────────────────────────────────────────────────────────────

const ACTION_BUTTON =
  "cursor-pointer flex items-center gap-1 px-3 py-1.5 text-xs border border-slate-200 rounded-xl text-slate-600 hover:border-violet-300 hover:text-violet-700 transition-colors";

type View = "school" | "term";

const VIEWS: { id: View; label: string }[] = [
  { id: "school", label: "School subjects" },
  { id: "term", label: "Term subjects" },
];

// What the slide-in panel is showing.
type PanelState =
  | { kind: "definition"; definition: SubjectDefinitionRecord | null }
  | { kind: "term-subjects" };

export default function SubjectManagementTab() {
  const queryClient = useQueryClient();
  const { clientAuthFetch } = useClientAuthFetch();
  const { school, currentTerm } = useCurrentTerm();
  const [view, setView] = useState<View>("school");

  // The panel content is kept after the panel closes so the panel still has
  // its content while it slides out.
  const [panel, setPanel] = useState<PanelState>({
    kind: "definition",
    definition: null,
  });
  const [panelOpen, setPanelOpen] = useState(false);

  function openPanel(next: PanelState) {
    setPanel(next);
    setPanelOpen(true);
  }

  const definitionsQuery = useQuery<ApiEnvelope<SubjectDefinitionRecord[]>>({
    queryKey: SUBJECT_DEFINITIONS_KEY,
    queryFn: async () => {
      const { data, error } = await clientAuthFetch<
        ApiEnvelope<SubjectDefinitionRecord[]>
      >(`subject-definition/list/?school=${SCHOOL_ID}`);
      if (error) throw new Error(error.message);
      return data!;
    },
    staleTime: QUERY_STALE_MS,
  });

  const termSubjectsQuery = useTermSubjects(currentTerm?.id);

  const definitions = definitionsQuery.data?.data ?? [];
  const termSubjects = termSubjectsQuery.data?.data ?? [];

  const offeredDefinitionIds = new Set(
    termSubjects.map((subject) => subject.definition.id),
  );
  const availableDefinitions = definitions.filter(
    (definition) => !offeredDefinitionIds.has(definition.id),
  );

  // A renamed definition shows in pass rules and arm subject lists as well.
  function handleDefinitionSaved() {
    queryClient.invalidateQueries({ queryKey: SUBJECT_DEFINITIONS_KEY });
    queryClient.invalidateQueries({ queryKey: TERM_SUBJECTS_KEY });
    queryClient.invalidateQueries({ queryKey: PASS_RULES_KEY });
    queryClient.invalidateQueries({ queryKey: ["arm-subjects"] });
    setPanelOpen(false);
  }

  function renderDefinitions() {
    if (definitionsQuery.isPending) return <TableLoader rows={3} />;
    if (definitionsQuery.error) {
      return (
        <ErrorNotice
          message={definitionsQuery.error.message}
          onRetry={() => definitionsQuery.refetch()}
        />
      );
    }
    if (definitions.length === 0) {
      return (
        <EmptyState
          title="No subjects yet"
          description="Create the subjects your school teaches, then offer them in a term."
        />
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {definitions.map((definition) => (
          <article
            key={definition.id}
            className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 flex items-start justify-between gap-3"
          >
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-slate-800 truncate">
                {definition.name}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {definition.abbr}
              </p>
              {currentTerm && termSubjectsQuery.data && (
                <div className="mt-2">
                  <StatusPill
                    active={offeredDefinitionIds.has(definition.id)}
                    activeLabel="In this term"
                    inactiveLabel="Not in this term"
                  />
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => openPanel({ kind: "definition", definition })}
              className={ACTION_BUTTON}
            >
              <Pencil size={11} /> Edit
            </button>
          </article>
        ))}
      </div>
    );
  }

  function renderTermSubjects() {
    if (school.isPending) return <TableLoader rows={2} />;
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
    if (termSubjectsQuery.isPending) return <TableLoader rows={2} />;
    if (termSubjectsQuery.error) {
      return (
        <ErrorNotice
          message={termSubjectsQuery.error.message}
          onRetry={() => termSubjectsQuery.refetch()}
        />
      );
    }
    if (termSubjects.length === 0) {
      return (
        <EmptyState
          title="No subjects offered this term"
          description='Use "Add to term" to offer subjects in the current term.'
        />
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {termSubjects.map((subject) => {
          const armCount = subject.subject_arms.length;

          return (
            <article
              key={subject.id}
              className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4"
            >
              <h3 className="text-sm font-semibold text-slate-800 truncate">
                {subject.definition.name}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {subject.definition.abbr}
              </p>
              <p
                className={`text-xs mt-2 ${
                  armCount > 0 ? "text-slate-600" : "text-amber-600"
                }`}
              >
                {armCount > 0
                  ? `Offered by ${armCount} ${armCount === 1 ? "arm" : "arms"}`
                  : "Not offered by any arm yet"}
              </p>
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
        panel.kind === "definition" ? (
          <SubjectDefinitionEditor
            key={panel.definition?.id ?? "new"}
            definition={panel.definition}
            onClose={() => setPanelOpen(false)}
            onSaved={handleDefinitionSaved}
          />
        ) : currentTerm ? (
          <TermSubjectsPanel
            term={currentTerm}
            available={availableDefinitions}
            onClose={() => setPanelOpen(false)}
            onChanged={() =>
              queryClient.invalidateQueries({ queryKey: TERM_SUBJECTS_KEY })
            }
          />
        ) : null
      }
    >
      <div className="pb-10">
        {/* Segmented control — scrolls sideways on very narrow screens */}
        <div
          role="tablist"
          aria-label="Subject type"
          className="inline-flex max-w-full overflow-x-auto scrollbar-hide rounded-xl border border-slate-200 bg-white p-1 mb-5"
        >
          {VIEWS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={view === item.id}
              onClick={() => setView(item.id)}
              className={`cursor-pointer whitespace-nowrap rounded-lg px-4 py-1.5 text-xs font-medium transition-colors ${
                view === item.id
                  ? "bg-violet-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-violet-700"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {view === "school" ? (
          <>
            <ListToolbar
              title="School subjects"
              description="The subjects your school can offer. A subject must be added to a term before arms can offer it."
              actionLabel="New subject"
              onAction={() =>
                openPanel({ kind: "definition", definition: null })
              }
            />
            {renderDefinitions()}
          </>
        ) : (
          <>
            <ListToolbar
              title="Term subjects"
              description={
                currentTerm
                  ? `${currentTerm.name} Term | ${currentTerm.session.name} Session. Choose the arms that offer each subject on the Arm Settings tab.`
                  : "The subjects offered in the current term."
              }
              actionLabel={currentTerm ? "Add to term" : undefined}
              onAction={() => openPanel({ kind: "term-subjects" })}
            />
            {renderTermSubjects()}
          </>
        )}
      </div>
    </SlidePanelLayout>
  );
}
