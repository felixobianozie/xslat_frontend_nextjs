"use client";

// ─────────────────────────────────────────────────────────────────────────────
// BroadsheetsList.tsx
//
// Renders the broadsheets list page — one row per class arm, showing each
// arm's broadsheet status for the currently-scoped term and exposing the
// admin actions (View / Approve / Revoke) plus the term-level Publish
// Results action when the scoped term is the school's live one.
//
// Layout:
//   - Session / Term filter row (real dropdowns; see below).
//   - Term-level progress strip + school pin-usage rollup, side by side.
//   - Toolbar with search and either the Publish button (current term) or
//     a Published tag (previous terms).
//   - Desktop: table.   Mobile: stacked cards.
//
// Data layer:
//   - useQuery is the single source of truth for both arms and the sessions
//     list. Both hydrate from server-fetched initialData so first paint has
//     no loading flash.
//   - Arms query key is ["broadsheet-arms", SCHOOL_ID, selectedTermId] so
//     switching term instantly resolves to a fresh cached query without
//     stale-serving the previously-selected term's rows.
//     BroadsheetAdminActionModal invalidates the broad ["broadsheet-arms"]
//     prefix, which still matches.
//   - Pin-usage query key includes selectedTermId + selectedSessionId so
//     the rollup card mirrors the same term the arms table is scoped to.
//   - Text search is purely client-side: the backend list endpoint doesn't
//     expose a full-text search param.
//
// Session / Term filter:
//   - Two dropdowns (SessionTermFilterBar). Session lists every session for
//     the school; Term lists the terms of the selected session. Selecting
//     a session auto-picks that session's current term (or its first term
//     when none is marked current — the common case for a past session).
//   - The school's live session and term are tagged "Current" inside the
//     dropdowns so the admin can distinguish the live period from history.
//
// Previous-term behaviour (read-only):
//   - A previous term is any selected term whose id doesn't match the
//     school's current term id. On such a selection:
//       · The Publish Results button in the toolbar is replaced with a
//         static "Published" tag — publishing is only a current-term action.
//       · The row action menu (Approve / Revoke / View) is hidden on every
//         row, both in the desktop table and the mobile cards. The row
//         name remains a link into the arm's broadsheet detail so viewing
//         is still one tap away.
//       · The term progress strip switches its readiness pill to a green
//         "Published" pill instead of the current-term readiness ladder.
//   - Approve / Revoke never dispatch against a past term because their
//     entry point (the action menu) doesn't render at all in that state.
//
// Actions (current term only):
//   - View   → navigates to /dashboard/broadsheet/arm?id=<armId>.
//   - Approve / Revoke → opens BroadsheetAdminActionModal, which fires the
//     mutation and invalidates ["broadsheet-arms"] on success.
// ─────────────────────────────────────────────────────────────────────────────

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  Eye,
  Globe,
  KeyRound,
  Lock,
  Search,
  Users,
} from "lucide-react";
import { toast } from "react-toastify";

import { useClientAuthFetch } from "@/lib/Useclientauthfetch";
import EmptyState from "../../../components/Emptystate";
import TableLoader from "../../../components/Tableloader";
import BroadsheetStatusBadge from "./BroadsheetStatusBadge";
import BroadsheetsListActionMenu from "./BroadsheetsListActionMenu";
import BroadsheetAdminActionModal, {
  type BroadsheetAdminAction,
} from "./BroadsheetAdminActionModal";
import BroadsheetPublishModal from "./BroadsheetPublishModal";
import SessionTermFilterBar from "./SessionTermFilterBar";
import type { ApiEnvelope, CurrentTerm, SessionListItem } from "../page";

// ── Types ────────────────────────────────────────────────────────────────
// Shape returned by GET pins/stats/school/ when a SchoolTermResultStat row
// exists for the given (school, term, session) triple. The endpoint
// returns `data: null` when no row exists yet (no pin activity recorded),
// so consumers treat the stat as nullable throughout.
interface SchoolTermResultStat {
  id: string;
  school: { id: string; name: string; abbr?: string };
  term: { id: string; name: string };
  session: { id: string; name: string };
  total_unique_pins: number;
  total_accesses: number;
  assessments_accessed: number;
  last_accessed_at: string | null;
}

// ── Constants ────────────────────────────────────────────────────────────────

const SCHOOL_ID = process.env.NEXT_PUBLIC_SCHOOL_ID ?? "";

// "JSS 1 A" — full identifier used in row labels and dialogs.
function formatArm(arm: ClassArm): string {
  return `${arm.level.section.abbr} ${arm.level.abbr} ${arm.abbr}`;
}

// Holds the in-flight modal action, if any. `null` means the modal is closed.
interface PendingAdminAction {
  action: BroadsheetAdminAction;
  arm: ClassArm;
}

// ── Props ────────────────────────────────────────────────────────────────────

interface BroadsheetsListProps {
  /** School's current term chain, resolved server-side. Seeds the initial
   *  session/term selection and marks the live period in the dropdowns. */
  currentTerm: CurrentTerm;
  /** Pre-fetched arms envelope for the current term. Used as React Query
   *  initialData so first paint has no loading flash. */
  initialArms: ApiEnvelope<ClassArm[]> | null;
  /** Pre-fetched sessions envelope (with nested terms). Powers the filter
   *  bar dropdowns without a client-side fetch delay. */
  initialSessions: ApiEnvelope<SessionListItem[]> | null;
}

export default function BroadsheetsList({
  currentTerm,
  initialArms,
  initialSessions,
}: BroadsheetsListProps) {
  const router = useRouter();
  const { clientAuthFetch } = useClientAuthFetch();

  // ── Local UI state ────────────────────────────────────────────────────────

  const [searchQuery, setSearchQuery] = useState("");

  // Selected session/term ids. Defaulted to the school's live period so the
  // page opens on the current term; the filter bar owns the dropdown UI and
  // emits a single onChange for both ids.
  const [selectedSessionId, setSelectedSessionId] = useState(
    currentTerm.session.id,
  );
  const [selectedTermId, setSelectedTermId] = useState(currentTerm.id);

  // When set, BroadsheetAdminActionModal renders for this arm + action.
  const [pendingAction, setPendingAction] = useState<PendingAdminAction | null>(
    null,
  );

  // Toggles the "Publish Term Results" modal. Lives separately from the
  // per-arm action modal so they can never collide.
  const [publishModalOpen, setPublishModalOpen] = useState(false);

  // ── React Query: sessions list ───────────────────────────────────────────
  // Powers the filter bar's dropdowns. Session list changes only at
  // term-boundary events, so it's safe to skip the focus refetch — the
  // server-hydrated initialData is nearly always right.
  const { data: sessionsData, isPending: sessionsPending } = useQuery<
    ApiEnvelope<SessionListItem[]>
  >({
    queryKey: ["broadsheet-sessions", SCHOOL_ID],
    queryFn: async () => {
      const { data, error } = await clientAuthFetch<
        ApiEnvelope<SessionListItem[]>
      >(`session/list/?school-id=${SCHOOL_ID}`);
      if (error) throw new Error(error.message);
      return data!;
    },
    initialData: initialSessions ?? undefined,
    initialDataUpdatedAt: initialSessions ? Date.now() : undefined,
    refetchOnWindowFocus: false,
  });

  const sessions = sessionsData?.data ?? [];

  // ── React Query: arms list ────────────────────────────────────────────────
  // Keyed on selectedTermId so switching term (via the filter bar) picks up
  // a fresh cached query without cross-contaminating the previously-selected
  // term's rows.
  const { data, isPending, isError, error } = useQuery<ApiEnvelope<ClassArm[]>>(
    {
      queryKey: ["broadsheet-arms", SCHOOL_ID, selectedTermId],

      queryFn: async () => {
        const url = `arm/list/?school-id=${SCHOOL_ID}&term-id=${selectedTermId}`;
        const { data, error } =
          await clientAuthFetch<ApiEnvelope<ClassArm[]>>(url);

        // Throwing marks the query as errored; the toast below surfaces the
        // message to the user.
        if (error) throw new Error(error.message);
        return data!;
      },

      // Hydrate from the server-fetched envelope so the table renders instantly
      // on first paint for the current term. Once the user switches to a
      // different term, that query key has no initialData and fetches normally.
      initialData:
        selectedTermId === currentTerm.id
          ? (initialArms ?? undefined)
          : undefined,
      initialDataUpdatedAt:
        selectedTermId === currentTerm.id && initialArms
          ? Date.now()
          : undefined,
      // Only fire once a term id is available. In practice this is true from
      // mount because the state defaults to currentTerm.id — the gate covers
      // the edge case of a session with no terms being selected later.
      enabled: !!selectedTermId,
    },
  );

  // ── React Query: school pin-usage rollup ─────────────────────────────────
  // Scoped to the same term + session the arms table is showing so both
  // cards refer to the same period. The endpoint returns `data: null` — not
  // an error — when no pin activity has been recorded, which the Results
  // Access card below renders as zeros rather than a spinner.
  const { data: schoolAccessStatData, isPending: schoolAccessStatPending } =
    useQuery<ApiEnvelope<SchoolTermResultStat | null>>({
      queryKey: [
        "broadsheet-school-access-stat",
        SCHOOL_ID,
        selectedTermId,
        selectedSessionId,
      ],
      queryFn: async () => {
        const url =
          `pins/stats/school/?school-id=${SCHOOL_ID}` +
          `&term-id=${selectedTermId}` +
          `&session-id=${selectedSessionId}`;
        const { data, error } =
          await clientAuthFetch<ApiEnvelope<SchoolTermResultStat | null>>(url);
        if (error) throw new Error(error.message);
        return data!;
      },
      enabled: !!selectedTermId && !!selectedSessionId,
      refetchOnWindowFocus: false,
    });

  const schoolAccessStat = schoolAccessStatData?.data ?? null;

  // Surface fetch errors via toast so the user knows the list didn't load.
  useEffect(() => {
    if (isError && error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load broadsheets.",
      );
    }
  }, [isError, error]);

  // ── Derived data ──────────────────────────────────────────────────────────

  const arms: ClassArm[] = data?.data ?? [];

  // True whenever the selected term isn't the school's live one. Everything
  // gated on read-only mode (action menus hidden, publish button becomes a
  // Published tag, progress strip switches to a published pill) reads from
  // this single derived flag.
  const isPreviousTerm = selectedTermId !== currentTerm.id;

  // Apply text search. No other narrowing filters remain in this toolbar.
  const visibleArms = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return arms;
    return arms.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.abbr.toLowerCase().includes(q) ||
        formatArm(a).toLowerCase().includes(q),
    );
  }, [arms, searchQuery]);

  // Term progress stats — drives the strip above the table.
  // arm.broadsheet may be absent from a row's payload; treat that the same
  // as "none" (per the backend's Arm.broadsheet default), which is what the
  // downstream badge / action-menu components already fall back to.
  const termStats = useMemo(() => {
    const total = arms.length;
    const approved = arms.filter((a) => a.broadsheet === "approved").length;
    const pending = arms.filter((a) => a.broadsheet === "pending").length;
    // True once every arm in the term has been approved — the term is then
    // ready for the admin to trigger Publish Results manually.
    const allApproved = total > 0 && approved === total;
    return { total, approved, pending, allApproved };
  }, [arms]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleView(arm: ClassArm) {
    router.push(`/dashboard/broadsheet/arm?id=${arm.id}`);
  }

  function handleApprove(arm: ClassArm) {
    setPendingAction({ action: "approve", arm });
  }

  function handleRevoke(arm: ClassArm) {
    setPendingAction({ action: "revoke", arm });
  }

  // Filter bar always emits both ids together, so a single setter pair keeps
  // them in sync without race conditions between two separate onChanges.
  function handleFilterChange(sessionId: string, termId: string) {
    setSelectedSessionId(sessionId);
    setSelectedTermId(termId);
  }

  return (
    <>
      {/* ── Session / Term filter row ─────────────────────────────────── */}
      <SessionTermFilterBar
        sessions={sessions}
        selectedSessionId={selectedSessionId}
        selectedTermId={selectedTermId}
        currentSessionId={currentTerm.session.id}
        currentTermId={currentTerm.id}
        onChange={handleFilterChange}
        isLoading={sessionsPending}
      />

      {/* ── Top status row — progress + access analytics ─────────────────
          Two side-by-side cards at md+: on the left the arm-approval
          progress strip; on the right the school/term/session pin-usage
          rollup. On narrow viewports they stack. `align-items: stretch`
          (grid's default) keeps both cards the same height regardless of
          which side has slightly more content. */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <TermProgressStrip
          approved={termStats.approved}
          pending={termStats.pending}
          total={termStats.total}
          allApproved={termStats.allApproved}
          isPending={isPending}
          isPreviousTerm={isPreviousTerm}
        />
        <SchoolAccessCard
          stat={schoolAccessStat}
          isPending={schoolAccessStatPending}
        />
      </div>

      {/* ── Toolbar ─ Search + Publish / Published ─────────────────────────
          Search stacks above the trailing control on mobile and sits inline
          on sm+. Current term shows the Publish button; previous terms show
          a static Published tag in its place. */}
      <div className="flex flex-col sm:flex-row gap-2 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search by class arm…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-xs text-slate-600 border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
          />
        </div>

        {isPreviousTerm ? (
          // Previous term: the term's results are already published. Replace
          // the action with a static tag so the toolbar still balances the
          // search field and the read-only state reads clearly.
          <PublishedTag />
        ) : (
          // Current term: Publish Term Results opens BroadsheetPublishModal.
          // Always enabled here; the modal explains the action and the
          // backend enforces its own preconditions.
          <button
            type="button"
            onClick={() => setPublishModalOpen(true)}
            className="cursor-pointer w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-2 text-xs text-white bg-violet-600 hover:bg-violet-700 rounded-xl shadow-sm shadow-violet-200 transition-colors whitespace-nowrap"
            aria-label="Publish term results"
          >
            <Globe size={12} />
            <span className="hidden sm:inline">Publish Results</span>
            <span className="sm:hidden">Publish</span>
          </button>
        )}
      </div>

      {/* ── List body ───────────────────────────────────────────────────── */}
      {isPending ? (
        <TableLoader rows={6} className="my-4" />
      ) : (
        <>
          {/* Desktop table (md+). The Action column and every row's
              action-menu cell are omitted entirely on previous terms —
              there are no admin actions to expose in that state. */}
          <div className="hidden md:block border border-indigo-100 rounded-2xl overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-100 text-left text-slate-500 border-b border-slate-200">
                  <th className="px-5 py-3 font-semibold">S/N</th>
                  <th className="px-5 py-3 font-semibold">Class Arm</th>
                  <th className="px-5 py-3 font-semibold">Section</th>
                  <th className="px-5 py-3 font-semibold">Broadsheet Status</th>
                  {!isPreviousTerm && (
                    <th className="px-5 py-3 font-semibold">Action</th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-50">
                {visibleArms.length === 0 ? (
                  <tr>
                    {/* colSpan matches the visible column count so the empty
                        state stretches across the whole table body. */}
                    <td colSpan={isPreviousTerm ? 4 : 5}>
                      <EmptyState
                        variant={searchQuery ? "search" : "generic"}
                        title={
                          searchQuery
                            ? "No results found"
                            : "No class arms found"
                        }
                        description={
                          searchQuery
                            ? `No arms match "${searchQuery}".`
                            : "There are no class arms recorded for this term."
                        }
                      />
                    </td>
                  </tr>
                ) : (
                  visibleArms.map((arm, index) => (
                    <tr
                      key={arm.id}
                      className={`h-14 hover:bg-violet-50/40 transition-colors ${
                        index % 2 === 0 ? "bg-white" : "bg-indigo-50/30"
                      }`}
                    >
                      <td className="px-5 text-slate-500">{index + 1}</td>

                      <td className="px-5">
                        <Link
                          // href={`/dashboard/broadsheet/arm?id=${arm.id}`}
                          href={`/dashboard/broadsheet/arms`}
                          className="font-medium text-slate-800 hover:text-violet-700"
                        >
                          {formatArm(arm)}
                        </Link>
                      </td>

                      <td className="px-5 text-slate-600">
                        {arm.level.section.name}
                      </td>

                      <td className="px-5">
                        <BroadsheetStatusBadge status={arm.broadsheet} />
                      </td>

                      {!isPreviousTerm && (
                        <td
                          className="px-5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <BroadsheetsListActionMenu
                            armId={arm.id}
                            status={arm.broadsheet}
                            onView={() => handleView(arm)}
                            onApprove={() => handleApprove(arm)}
                            onRevoke={() => handleRevoke(arm)}
                          />
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile cards (below md). The action menu is omitted on
              previous terms; the arm name remains a link so viewing is
              still one tap away. */}
          <div className="flex flex-col gap-3 md:hidden my-4">
            {visibleArms.length === 0 ? (
              <EmptyState
                variant={searchQuery ? "search" : "generic"}
                title={searchQuery ? "No results found" : "No class arms found"}
                description={
                  searchQuery
                    ? `No arms match "${searchQuery}".`
                    : "There are no class arms recorded for this term."
                }
              />
            ) : (
              visibleArms.map((arm) => (
                <div
                  key={arm.id}
                  className="bg-white border border-indigo-100 rounded-2xl overflow-hidden shadow-sm"
                >
                  <div className="flex items-start justify-between p-4 gap-3">
                    <Link
                      // href={`/dashboard/broadsheet/arm?id=${arm.id}`}
                      href={`/dashboard/broadsheet/arms`}
                      className="flex flex-col min-w-0 flex-1"
                    >
                      <span className="text-sm font-semibold text-slate-800 truncate">
                        {formatArm(arm)}
                      </span>
                      <span className="text-[10px] text-slate-400 truncate">
                        {arm.level.section.name}
                      </span>
                    </Link>
                    {!isPreviousTerm && (
                      <div onClick={(e) => e.stopPropagation()}>
                        <BroadsheetsListActionMenu
                          armId={arm.id}
                          status={arm.broadsheet}
                          onView={() => handleView(arm)}
                          onApprove={() => handleApprove(arm)}
                          onRevoke={() => handleRevoke(arm)}
                        />
                      </div>
                    )}
                  </div>

                  <div className="px-4 pb-4">
                    <BroadsheetStatusBadge status={arm.broadsheet} />
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* ── Approve / Revoke modal ─────────────────────────────────────────
          Conditionally rendered so each open is a fresh instance with no
          lingering error state from the previous attempt. Only ever set
          for current-term rows since the action menu is the only entry
          point and it's suppressed on previous terms. */}
      {pendingAction && (
        <BroadsheetAdminActionModal
          action={pendingAction.action}
          armId={pendingAction.arm.id}
          armLabel={formatArm(pendingAction.arm)}
          onClose={() => setPendingAction(null)}
        />
      )}

      {/* ── Publish Term Results modal ─────────────────────────────────────
          Surfaces the irreversibility of publishing and shows the current
          approval counts so the admin sees where they are in the cycle. */}
      {publishModalOpen && (
        <BroadsheetPublishModal
          approvedCount={termStats.approved}
          pendingCount={termStats.pending}
          totalCount={termStats.total}
          onClose={() => setPublishModalOpen(false)}
        />
      )}
    </>
  );
}

// ── PublishedTag ─────────────────────────────────────────────────────────
// Static "Published" pill shown in the toolbar in place of the Publish
// Results button when a previous term is selected. Sized to match the
// button's footprint so the toolbar layout stays balanced across the
// current/previous switch. Uses the same green language as the TermResults
// indicator on the single-arm broadsheet page so the "published" state
// reads the same everywhere in the feature.
function PublishedTag() {
  return (
    <div
      className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-2 text-xs rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 whitespace-nowrap"
      role="status"
      aria-label="Term results are published"
    >
      <CheckCircle2 size={12} />
      <span>Published</span>
    </div>
  );
}

// ── TermProgressStrip ─────────────────────────────────────────────────────────
// Compact info strip that summarises the term's broadsheet approvals. For
// the current term it surfaces readiness — how close the term is to being
// publishable. For previous terms it displays a static Published state
// alongside the historical approval counts.
function TermProgressStrip({
  approved,
  pending,
  total,
  allApproved,
  isPending,
  isPreviousTerm,
}: {
  approved: number;
  pending: number;
  total: number;
  allApproved: boolean;
  isPending: boolean;
  isPreviousTerm: boolean;
}) {
  if (isPending) {
    return (
      <div className="min-h-24 rounded-2xl bg-slate-50 border border-slate-100 animate-pulse" />
    );
  }

  // Readiness label — reflects how close the term is to being publishable
  // for the current term, or a fixed Published state for previous terms.
  let readiness: { label: string; classes: string };
  if (isPreviousTerm) {
    readiness = {
      label: "Published",
      classes: "bg-emerald-50 text-emerald-700 border-emerald-200",
    };
  } else if (total === 0) {
    readiness = {
      label: "Not Set Up",
      classes: "bg-slate-100 text-slate-600 border-slate-200",
    };
  } else if (allApproved) {
    readiness = {
      label: "Ready to Publish",
      classes: "bg-emerald-50 text-emerald-700 border-emerald-200",
    };
  } else if (approved > 0) {
    readiness = {
      label: "In Progress",
      classes: "bg-amber-50 text-amber-700 border-amber-200",
    };
  } else {
    readiness = {
      label: "Not Started",
      classes: "bg-slate-100 text-slate-600 border-slate-200",
    };
  }

  // Progress bar width — guard against division by zero on the empty case.
  const progressPercent = total === 0 ? 0 : (approved / total) * 100;

  // Card title varies per mode so the strip's purpose is unambiguous.
  const cardTitle = isPreviousTerm
    ? "Term Results Status"
    : "Term Approval Progress";

  // Progress bar colour — emerald when everything is signed off (or the
  // term is a historical published one), violet during in-progress terms.
  const progressBarColor =
    isPreviousTerm || allApproved ? "bg-emerald-500" : "bg-violet-500";

  return (
    <div className="rounded-2xl border border-indigo-100 bg-white p-4 sm:p-5 shadow-sm flex flex-col justify-between gap-3">
      {/* Title — pinned to the top of the card by justify-between placing
          the first flex item at the start of the main axis. */}
      <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">
        {cardTitle}
      </p>

      {/* Status — readiness pill and count summary. Sits vertically
          centered between the title above and the progress bar below
          when the grid stretches this card to match its sibling. */}
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-medium ${readiness.classes}`}
        >
          {readiness.label}
        </span>
        <span className="text-[11px] text-slate-500">
          {approved} of {total} arm{total === 1 ? "" : "s"} approved
          {pending > 0 ? ` · ${pending} pending` : ""}
        </span>
      </div>

      {/* Progress bar — anchored at the bottom of the card by
          justify-between placing the last flex item at the end of the
          main axis. Visualises approved share of total. */}
      <div
        className="h-1.5 rounded-full bg-slate-100 overflow-hidden"
        role="progressbar"
        aria-valuenow={approved}
        aria-valuemin={0}
        aria-valuemax={total}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ${progressBarColor}`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}

// ── SchoolAccessCard ─────────────────────────────────────────────────────────
// Compact school/term/session pin-usage rollup card. Renders next to the
// TermProgressStrip so it needs to hit roughly the same content height —
// header row + one row of compact stats — to keep the two cards visually
// balanced in their side-by-side grid.
//
// States:
//   - loading   → skeleton bars in the stat slots
//   - populated → three coloured icon pills for students accessed, total
//                 accesses, unique pins used; last-accessed timestamp in
//                 the header.
//
// The endpoint returns `data: null` when no pin activity has been recorded
// for the (school, term, session) triple yet — a valid response, not an
// error. In that case the three pills still render, all reading zero,
// which matches the always-populated shape of the sibling TermProgressStrip
// (readiness pill + counts) and reads more naturally than a separate empty
// placeholder. The header's last-accessed timestamp is suppressed in the
// null case so the header doesn't reference a date that isn't there.
function SchoolAccessCard({
  stat,
  isPending,
}: {
  stat: SchoolTermResultStat | null;
  isPending: boolean;
}) {
  // Fallback to zeros when the endpoint returned data:null. Hoisted so the
  // JSX below reads clean and the label pluralisation only checks one
  // resolved number rather than an inline ?? chain per pill.
  const studentsAccessed = stat?.assessments_accessed ?? 0;
  const totalAccesses = stat?.total_accesses ?? 0;
  const uniquePins = stat?.total_unique_pins ?? 0;

  return (
    <div className="rounded-2xl border border-indigo-100 bg-white p-4 sm:p-5 shadow-sm">
      {/* Header row — title on the left, last-accessed timestamp on the
          right (only when there's a stat to reference; suppressed in the
          loading and null states to avoid a placeholder "—" that reads
          like a bug). */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
            <Lock size={11} className="text-amber-600" />
          </span>
          <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">
            Results Access
          </p>
        </div>
        {stat && (
          <p className="text-[10px] text-slate-400 sm:text-right">
            <span className="uppercase tracking-wide">Last access</span>
            <span className="block text-[11px] text-slate-600 font-medium">
              {formatAccessTime(stat.last_accessed_at)}
            </span>
          </p>
        )}
      </div>

      {isPending ? (
        // Loading skeleton — three pulse bars matching the AccessMetricPill
        // footprint (icon pill + two-line text stack) so the card height
        // stays stable through the transition.
        <div className="grid grid-cols-3 gap-2">
          <div className="h-12 rounded-xl bg-slate-100 animate-pulse" />
          <div className="h-12 rounded-xl bg-slate-100 animate-pulse" />
          <div className="h-12 rounded-xl bg-slate-100 animate-pulse" />
        </div>
      ) : (
        // Populated — three coloured icon pills. `assessments_accessed`
        // reads as "students whose result was viewed", `total_accesses`
        // as raw redemption count (repeat views count), `total_unique_pins`
        // as the number of distinct pins that have been issued and used.
        // Amber on the pins tile intentionally echoes the amber Lock in
        // the card header so the accent colour threads through the card.
        <div className="grid grid-cols-3 gap-2">
          <AccessMetricPill
            Icon={Users}
            iconClasses="text-violet-600 bg-violet-50"
            value={studentsAccessed}
            label={`Student${studentsAccessed === 1 ? "" : "s"}`}
          />
          <AccessMetricPill
            Icon={Eye}
            iconClasses="text-blue-600 bg-blue-50"
            value={totalAccesses}
            label={`Access${totalAccesses === 1 ? "" : "es"}`}
          />
          <AccessMetricPill
            Icon={KeyRound}
            iconClasses="text-amber-600 bg-amber-50"
            value={uniquePins}
            label={`Pin${uniquePins === 1 ? "" : "s"}`}
          />
        </div>
      )}
    </div>
  );
}

// ── AccessMetricPill ────────────────────────────────────────────────────────
// Horizontal icon-left tile used inside SchoolAccessCard: coloured icon
// pill on the left, bold value + muted label stacked on the right. Same
// visual language as the metric tiles on the Broadsheet Arm Detail page,
// so the two cards read as siblings rather than one plain and one styled.
// Kept file-local; if this pattern lands on a third card later, worth
// promoting to a shared component.
function AccessMetricPill({
  Icon,
  iconClasses,
  value,
  label,
}: {
  Icon: typeof Users;
  iconClasses: string;
  value: number;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-xl border border-slate-100 bg-slate-50/50">
      <span
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${iconClasses}`}
      >
        <Icon size={14} />
      </span>
      <div className="flex flex-col leading-tight min-w-0">
        <span className="text-base font-bold text-slate-800 tabular-nums">
          {value}
        </span>
        <span className="text-[10px] text-slate-400 truncate">{label}</span>
      </div>
    </div>
  );
}

// Format an ISO datetime for the "last accessed" line. Returns "—" for
// null / invalid input so callers don't need to null-check.
function formatAccessTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
