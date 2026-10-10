"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Sessioncard.tsx
//
// One session on the School Calendar tab: its dates, state, actions and, when
// expanded, its terms.
//
// Terms are loaded the first time the card is opened (GET term/list/ for the
// session, then GET term/detail/ for each term, because only the detail
// carries `initialized`, `results_status` and `closed_at`). The current session
// starts open.
//
// A session or term is in one of three states:
//   Current   — in use right now (only one of each at a time)
//   Closed    — has been current and was then closed; it can never be current again
//   Upcoming  — has never been current, so it can still be set as current
//
// The buttons only offer what the state allows. A closed session, a closed term
// and any term inside a closed session are read-only, so they show no action
// buttons. A term can only be set as current while its session is current. The
// backend still checks every request and explains any refusal.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Pencil, PlusCircle } from "lucide-react";

import { useClientAuthFetch } from "@/lib/Useclientauthfetch";
import type {
  ApiEnvelope,
  SessionRecord,
  TermRecord,
  TermResultsStatus,
} from "@/types/configurations";
import {
  QUERY_STALE_MS,
  SCHOOL_ID,
  TERMS_KEY,
  formatDay,
} from "../configutils";
import { ErrorNotice } from "./Configui";
import type { StatusChangeTarget } from "./Statuschangedialog";

// ── Constants ────────────────────────────────────────────────────────────────

const ACTION_BUTTON =
  "cursor-pointer flex items-center gap-1 px-3 py-1.5 text-xs border border-slate-200 rounded-xl text-slate-600 hover:border-violet-300 hover:text-violet-700 transition-colors";

const RESULTS_STATUS_LABELS: Record<TermResultsStatus, string> = {
  nota: "Not available",
  computing: "Computing",
  published: "Published",
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function StatePill({
  current,
  initialized,
}: {
  current: boolean;
  initialized: boolean;
}) {
  const label = current ? "Current" : initialized ? "Closed" : "Upcoming";
  const style = current
    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
    : initialized
      ? "bg-slate-100 text-slate-500 border-slate-200"
      : "bg-amber-50 text-amber-700 border-amber-100";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${style}`}
    >
      {label}
    </span>
  );
}

// Closed means the period has been current and is not any more.
function isClosed(period: { current: boolean; initialized: boolean }): boolean {
  return period.initialized && !period.current;
}

function dateRange(starts: string, ends: string | null): string {
  return ends
    ? `${formatDay(starts)} – ${formatDay(ends)}`
    : `From ${formatDay(starts)}`;
}

// ── Component ────────────────────────────────────────────────────────────────

interface SessionCardProps {
  session: SessionRecord;
  onEditSession: (session: SessionRecord) => void;
  onAddTerm: (session: SessionRecord) => void;
  onEditTerm: (term: TermRecord, session: SessionRecord) => void;
  onChangeStatus: (target: StatusChangeTarget) => void;
}

export default function SessionCard({
  session,
  onEditSession,
  onAddTerm,
  onEditTerm,
  onChangeStatus,
}: SessionCardProps) {
  const { clientAuthFetch } = useClientAuthFetch();
  const [expanded, setExpanded] = useState(session.current);

  const {
    data: terms,
    isPending,
    error,
    refetch,
  } = useQuery<TermRecord[]>({
    queryKey: [...TERMS_KEY, session.id],
    // Terms are only requested once the card has been opened.
    enabled: expanded,
    queryFn: async () => {
      const list = await clientAuthFetch<ApiEnvelope<{ id: string }[]>>(
        `term/list/?school-id=${SCHOOL_ID}&session-id=${session.id}`,
      );
      if (list.error || !list.data) {
        throw new Error(list.error?.message ?? "Could not load terms.");
      }

      // One detail request per term, in parallel.
      return Promise.all(
        list.data.data.map(async (item) => {
          const detail = await clientAuthFetch<ApiEnvelope<TermRecord>>(
            `term/detail/?id=${item.id}&school-id=${SCHOOL_ID}`,
          );
          if (detail.error || !detail.data) {
            throw new Error(detail.error?.message ?? "Could not load a term.");
          }
          return detail.data.data;
        }),
      );
    },
    staleTime: QUERY_STALE_MS,
  });

  const canSetCurrent = !session.current && !session.initialized;
  const sessionClosed = isClosed(session);

  return (
    <article className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Session header */}
      <div className="p-4 sm:p-5 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-slate-800">
                {session.name}
              </h3>
              <StatePill
                current={session.current}
                initialized={session.initialized}
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {dateRange(session.starts, session.ends)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setExpanded((open) => !open)}
            aria-expanded={expanded}
            aria-label={expanded ? "Hide terms" : "Show terms"}
            className="cursor-pointer shrink-0 rounded-xl border border-slate-200 p-2 text-slate-500 hover:border-violet-300 hover:text-violet-700 transition-colors"
          >
            <ChevronDown
              size={14}
              className={`transition-transform duration-200 ${
                expanded ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>

        {!sessionClosed && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onEditSession(session)}
              className={ACTION_BUTTON}
            >
              <Pencil size={11} /> Edit
            </button>
            <button
              type="button"
              onClick={() => onAddTerm(session)}
              className={ACTION_BUTTON}
            >
              <PlusCircle size={11} /> Add term
            </button>
            {canSetCurrent && (
              <button
                type="button"
                onClick={() =>
                  onChangeStatus({
                    kind: "session",
                    id: session.id,
                    name: session.name,
                    action: "activate",
                  })
                }
                className={ACTION_BUTTON}
              >
                Set as current
              </button>
            )}
            {session.current && (
              <button
                type="button"
                onClick={() =>
                  onChangeStatus({
                    kind: "session",
                    id: session.id,
                    name: session.name,
                    action: "close",
                  })
                }
                className={ACTION_BUTTON}
              >
                Close session
              </button>
            )}
          </div>
        )}
      </div>

      {/* Terms */}
      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50/60 p-4 sm:p-5">
          {isPending ? (
            <p className="text-xs text-slate-400">Loading terms…</p>
          ) : error ? (
            <ErrorNotice message={error.message} onRetry={() => refetch()} />
          ) : !terms || terms.length === 0 ? (
            <p className="text-xs text-slate-400">
              {sessionClosed
                ? "No terms were recorded for this session."
                : 'No terms yet. Use "Add term" to create the first one.'}
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {terms.map((term) => {
                const termReadOnly = sessionClosed || isClosed(term);

                return (
                  <li
                    key={term.id}
                    className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col gap-2.5"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs font-semibold text-slate-800">
                          {term.name}
                          {term.abbr && (
                            <span className="ml-1.5 font-normal text-slate-400">
                              ({term.abbr})
                            </span>
                          )}
                        </h4>
                        <StatePill
                          current={term.current}
                          initialized={term.initialized}
                        />
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {dateRange(term.starts, term.ends)}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Results: {RESULTS_STATUS_LABELS[term.results_status]}
                      </p>
                    </div>

                    {!termReadOnly && (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => onEditTerm(term, session)}
                          className={ACTION_BUTTON}
                        >
                          <Pencil size={11} /> Edit
                        </button>
                        {session.current &&
                          !term.current &&
                          !term.initialized && (
                            <button
                              type="button"
                              onClick={() =>
                                onChangeStatus({
                                  kind: "term",
                                  id: term.id,
                                  name: `${term.name} (${session.name})`,
                                  action: "activate",
                                })
                              }
                              className={ACTION_BUTTON}
                            >
                              Set as current
                            </button>
                          )}
                        {term.current && (
                          <button
                            type="button"
                            onClick={() =>
                              onChangeStatus({
                                kind: "term",
                                id: term.id,
                                name: `${term.name} (${session.name})`,
                                action: "close",
                              })
                            }
                            className={ACTION_BUTTON}
                          >
                            Close term
                          </button>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </article>
  );
}
