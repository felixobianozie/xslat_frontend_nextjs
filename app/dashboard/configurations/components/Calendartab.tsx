"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Calendartab.tsx
//
// The School Calendar tab: sessions and the terms inside them.
//
// Admins can create and edit sessions and terms, set a session or term as the
// current one, close it, and migrate a term's setup into the current term.
// Publishing results is not done here; it stays on the arm and broadsheet pages.
//
// Sessions (GET session/list/) are loaded with React Query the first time the
// tab is opened and reused from the cache after that. Each session card loads
// its own terms when opened (see Sessioncard.tsx).
//
// Every change can alter which term is current, which in turn decides which
// arms the rest of the dashboard works on, so a successful change refreshes the
// sessions, terms, school, arms and arm detail caches.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useClientAuthFetch } from "@/lib/Useclientauthfetch";
import type {
  ApiEnvelope,
  SchoolDetailData,
  SessionRecord,
  TermRecord,
} from "@/types/configurations";
import EmptyState from "../../components/Emptystate";
import TableLoader from "../../components/Tableloader";
import {
  ARMS_KEY,
  ARM_DETAIL_KEY,
  QUERY_STALE_MS,
  SCHOOL_ID,
  SCHOOL_KEY,
  SESSIONS_KEY,
  TERMS_KEY,
} from "../configutils";
import { ErrorNotice, ListToolbar } from "./Configui";
import SessionCard from "./Sessioncard";
import SessionEditor from "./Sessioneditor";
import SlidePanelLayout from "./Slidepanellayout";
import StatusChangeDialog, {
  type StatusChangeTarget,
} from "./Statuschangedialog";
import TermEditor from "./Termeditor";
import TermMigratePanel from "./Termmigratepanel";

// What the slide-in panel is showing.
type PanelContent =
  | { kind: "session"; session: SessionRecord | null }
  | { kind: "term"; term: TermRecord | null; session: SessionRecord }
  | { kind: "migrate" };

export default function CalendarTab() {
  const queryClient = useQueryClient();
  const { clientAuthFetch } = useClientAuthFetch();

  // The school record carries the current term, which is the migration
  // destination. The cache entry is shared with the dashboard top bar.
  const school = useQuery<ApiEnvelope<SchoolDetailData>>({
    queryKey: SCHOOL_KEY,
    queryFn: async () => {
      const { data, error } = await clientAuthFetch<
        ApiEnvelope<SchoolDetailData>
      >(`school/detail/?id=${SCHOOL_ID}`);
      if (error) throw new Error(error.message);
      return data!;
    },
    staleTime: QUERY_STALE_MS,
  });

  // The content is kept after the panel closes so the panel still has it while
  // it slides out.
  const [content, setContent] = useState<PanelContent | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [statusTarget, setStatusTarget] = useState<StatusChangeTarget | null>(
    null,
  );

  function openPanel(next: PanelContent) {
    setContent(next);
    setPanelOpen(true);
  }

  function closePanel() {
    setPanelOpen(false);
  }

  const { data, isPending, error, refetch } = useQuery<
    ApiEnvelope<SessionRecord[]>
  >({
    queryKey: SESSIONS_KEY,
    queryFn: async () => {
      const { data, error } = await clientAuthFetch<
        ApiEnvelope<SessionRecord[]>
      >(`session/list/?school-id=${SCHOOL_ID}`);
      if (error) throw new Error(error.message);
      return data!;
    },
    staleTime: QUERY_STALE_MS,
  });

  // Refreshes everything that depends on the calendar.
  function refreshCalendar() {
    for (const queryKey of [
      SESSIONS_KEY,
      TERMS_KEY,
      SCHOOL_KEY,
      ARMS_KEY,
      ARM_DETAIL_KEY,
    ]) {
      queryClient.invalidateQueries({ queryKey });
    }
  }

  function handleSaved() {
    refreshCalendar();
    closePanel();
  }

  function renderPanel() {
    if (!content) return null;

    if (content.kind === "session") {
      return (
        <SessionEditor
          key={content.session?.id ?? "new-session"}
          session={content.session}
          onClose={closePanel}
          onSaved={handleSaved}
        />
      );
    }

    if (content.kind === "term") {
      return (
        <TermEditor
          key={content.term?.id ?? `new-term-${content.session.id}`}
          term={content.term}
          session={content.session}
          onClose={closePanel}
          onSaved={handleSaved}
        />
      );
    }

    return (
      <TermMigratePanel
        sessions={data?.data ?? []}
        destination={school.data?.data.current_term ?? null}
        onClose={closePanel}
        onMigrated={refreshCalendar}
      />
    );
  }

  const sessions = data?.data ?? [];

  return (
    <>
      <SlidePanelLayout panelOpen={panelOpen} panel={renderPanel()}>
        <div className="pb-10">
          <ListToolbar
            title="School calendar"
            description="Sessions and the terms inside them."
            actionLabel="New session"
            onAction={() => openPanel({ kind: "session", session: null })}
            secondaryLabel="Migrate term"
            onSecondary={() => openPanel({ kind: "migrate" })}
          />

          {isPending ? (
            <TableLoader rows={3} />
          ) : error ? (
            <ErrorNotice message={error.message} onRetry={() => refetch()} />
          ) : sessions.length === 0 ? (
            <EmptyState
              title="No sessions yet"
              description="Create the first session, add its terms, then set them as current."
            />
          ) : (
            <div className="flex flex-col gap-4">
              {sessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  onEditSession={(record) =>
                    openPanel({ kind: "session", session: record })
                  }
                  onAddTerm={(record) =>
                    openPanel({ kind: "term", term: null, session: record })
                  }
                  onEditTerm={(term, record) =>
                    openPanel({ kind: "term", term, session: record })
                  }
                  onChangeStatus={setStatusTarget}
                />
              ))}
            </div>
          )}
        </div>
      </SlidePanelLayout>

      {statusTarget && (
        <StatusChangeDialog
          target={statusTarget}
          onClose={() => setStatusTarget(null)}
          onDone={() => {
            refreshCalendar();
            setStatusTarget(null);
          }}
        />
      )}
    </>
  );
}
