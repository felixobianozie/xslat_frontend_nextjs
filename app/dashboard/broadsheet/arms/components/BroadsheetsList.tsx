"use client";

// ─────────────────────────────────────────────────────────────────────────────
// BroadsheetsList.tsx
//
// Renders the broadsheets list page — one row per class arm, showing each
// arm's current broadsheet status and exposing the admin actions
// (View / Approve / Revoke), plus the term-level Publish Results action.
//
// Layout:
//   - Session / Term filter row (placeholder — see note below).
//   - Term-level progress strip showing how many arms in the term are approved.
//   - Toolbar with search + Publish Results button.
//   - Desktop: table.   Mobile: stacked cards.
//
// Data layer:
//   - useQuery is the single source of truth. queryFn calls the real backend
//     GET arm/list/?school-id=…&term-id=… via clientAuthFetch.
//   - initialArms (from the server component) is handed to React Query as
//     initialData so there is no loading flash on first paint.
//   - The query key is ["broadsheet-arms", SCHOOL_ID, currentTerm.id] so that
//     switching term (once the placeholder filter becomes real) doesn't
//     stale-serve the previous term's arms. BroadsheetAdminActionModal
//     invalidates the broad ["broadsheet-arms"] prefix, which still matches.
//   - Text search is purely client-side: the backend list endpoint doesn't
//     expose a full-text search param.
//
// Session / Term filter (placeholder):
//   - The two chips at the top display the school's CURRENT session and CURRENT
//     term names (resolved server-side and passed in via props).
//   - Clicking either fires a "feature in the works" toast — actual switching
//     between sessions/terms is not wired yet. Once the backend exposes list
//     endpoints for prior sessions/terms, the chips become real dropdowns and
//     the query key already picks up the new term-id automatically.
//
// Actions:
//   - View   → navigates to /dashboard/broadsheet/arm?id=<armId>.
//   - Approve / Revoke → opens BroadsheetAdminActionModal, which fires the
//     mutation and invalidates ["broadsheet-arms"] on success.
// ─────────────────────────────────────────────────────────────────────────────

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarClock,
  CalendarRange,
  ChevronDown,
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
import type { ApiEnvelope, CurrentTerm } from "../page";

// ── Types ────────────────────────────────────────────────────────────────
// Shape returned by GET pins/stats/school/ when a SchoolTermResultStat row
// exists for the given (school, term, session) triple. The endpoint
// returns `data: null` when there's no row yet — no pin activity has
// been recorded — so consumers treat the stat as nullable throughout.
// Declared locally here because this is the only page that reads it; a
// prior copy lived on the broadsheet detail-page provider and moved with
// the analytics card.
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

// Shown when the user taps the placeholder session/term chips. Kept centralised
// so the wording stays consistent if/when other placeholders appear.
const FEATURE_IN_WORKS = "This feature is still in the works.";

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
  /** School's current term chain, resolved server-side. Drives both the
   *  scoping of the arms query and the labels on the placeholder filter chips. */
  currentTerm: CurrentTerm;
  /** Pre-fetched arms envelope, used as React Query initialData. */
  initialArms: ApiEnvelope<ClassArm[]> | null;
}

export default function BroadsheetsList({
  currentTerm,
  initialArms,
}: BroadsheetsListProps) {
  const router = useRouter();
  const { clientAuthFetch } = useClientAuthFetch();

  // ── Local UI state ────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");

  // When set, BroadsheetAdminActionModal renders for this arm + action.
  const [pendingAction, setPendingAction] = useState<PendingAdminAction | null>(
    null,
  );

  // Toggles the "Publish Term Results" modal. Lives separately from the
  // per-arm action modal so they can never collide.
  const [publishModalOpen, setPublishModalOpen] = useState(false);

  // ── React Query: arms list ────────────────────────────────────────────────
  // The query key includes currentTerm.id so once the session/term filter is
  // wired, changing the term picks up a fresh query without cross-contaminating
  // the currently-cached term's rows.
  const { data, isPending, isError, error } = useQuery<ApiEnvelope<ClassArm[]>>(
    {
      queryKey: ["broadsheet-arms", SCHOOL_ID, currentTerm.id],

      queryFn: async () => {
        const url = `arm/list/?school-id=${SCHOOL_ID}&term-id=${currentTerm.id}`;
        const { data, error } =
          await clientAuthFetch<ApiEnvelope<ClassArm[]>>(url);

        // Throwing marks the query as errored; the toast below surfaces the
        // message to the user.
        if (error) throw new Error(error.message);
        return data!;
      },

      // Hydrate from the server-fetched envelope so the table renders instantly
      // on first paint. initialDataUpdatedAt tells React Query the data is
      // fresh so it doesn't fire an immediate background refetch on mount.
      initialData: initialArms ?? undefined,
      initialDataUpdatedAt: initialArms ? Date.now() : undefined,
    },
  );

  // ── React Query: school pin-usage rollup ─────────────────────────────────
  // GET pins/stats/school/ returns a SchoolTermResultStat row per (school,
  // term, session) triple. All three ids come from props/env, so the query
  // fires immediately. The endpoint returns `data: null` — not an error —
  // when no pin activity has been recorded yet, which the Results Access
  // card below renders as an empty-state row rather than a spinner.
  const { data: schoolAccessStatData, isPending: schoolAccessStatPending } =
    useQuery<ApiEnvelope<SchoolTermResultStat | null>>({
      queryKey: [
        "broadsheet-school-access-stat",
        SCHOOL_ID,
        currentTerm.id,
        currentTerm.session.id,
      ],
      queryFn: async () => {
        const url =
          `pins/stats/school/?school-id=${SCHOOL_ID}` +
          `&term-id=${currentTerm.id}` +
          `&session-id=${currentTerm.session.id}`;
        const { data, error } =
          await clientAuthFetch<ApiEnvelope<SchoolTermResultStat | null>>(url);
        if (error) throw new Error(error.message);
        return data!;
      },
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

  // Session/term placeholder chips share one handler — swapping between the
  // two is not wired yet, so both tell the user the same thing.
  function handlePlaceholderFilter() {
    toast.info(FEATURE_IN_WORKS);
  }

  return (
    <>
      {/* ── Session / Term placeholder filter row ───────────────────────────
          Two chips displaying the current session and current term names.
          Clicking either fires a "feature in the works" toast for now; once
          the backend exposes prior-session/term listings these become real
          dropdowns and the query key already handles the switchover. */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <PlaceholderFilterChip
          Icon={CalendarRange}
          label="Session"
          value={currentTerm.session.name}
          onClick={handlePlaceholderFilter}
        />
        <PlaceholderFilterChip
          Icon={CalendarClock}
          label="Term"
          value={currentTerm.name}
          onClick={handlePlaceholderFilter}
        />
      </div>

      {/* ── Top status row — progress + access analytics ─────────────────
          Two side-by-side cards at md+: on the left the arm-approval
          progress strip; on the right the school/term/session pin-usage
          rollup. On narrow viewports they stack. `align-items: stretch`
          (grid's default) keeps both cards the same height regardless of
          which side has slightly more content. */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* <TermProgressStrip
          approved={termStats.approved}
          pending={termStats.pending}
          total={termStats.total}
          allApproved={termStats.allApproved}
          isPending={isPending}
        /> */}
        <SchoolAccessCard
          stat={schoolAccessStat}
          isPending={schoolAccessStatPending}
        />
      </div>

      {/* ── Toolbar ─ Search + Publish ─────────────────────────────────────
          Search stacks above Publish on mobile and sits inline on sm+. */}
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

        {/* Publish Term Results — opens BroadsheetPublishModal. Always
            enabled; the modal explains the action and the backend will
            ultimately enforce its own preconditions. Full-width on mobile
            to match the search input above it; content-sized on sm+. */}
        {/* <button
          type="button"
          onClick={() => setPublishModalOpen(true)}
          className="cursor-pointer w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-2 text-xs text-white bg-violet-600 hover:bg-violet-700 rounded-xl shadow-sm shadow-violet-200 transition-colors whitespace-nowrap"
          aria-label="Publish term results"
        >
          <Globe size={12} />
          <span className="hidden sm:inline">Publish Results</span>
          <span className="sm:hidden">Publish</span>
        </button> */}
      </div>

      {/* ── List body ───────────────────────────────────────────────────── */}
      {isPending ? (
        <TableLoader rows={6} className="my-4" />
      ) : (
        <>
          {/* Desktop table (md+) */}
          <div className="hidden md:block border border-indigo-100 rounded-2xl overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-100 text-left text-slate-500 border-b border-slate-200">
                  <th className="px-5 py-3 font-semibold">S/N</th>
                  <th className="px-5 py-3 font-semibold">Class Arm</th>
                  <th className="px-5 py-3 font-semibold">Section</th>
                  <th className="px-5 py-3 font-semibold">Broadsheet Status</th>
                  <th className="px-5 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-50">
                {visibleArms.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
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
                            : "There are no class arms set up for the current term."
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
                          href="/dashboard/broadsheet/arms"
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

                      <td className="px-5" onClick={(e) => e.stopPropagation()}>
                        {/* <BroadsheetsListActionMenu
                          armId={arm.id}
                          status={arm.broadsheet}
                          onView={() => handleView(arm)}
                          onApprove={() => handleApprove(arm)}
                          onRevoke={() => handleRevoke(arm)}
                        /> */}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile cards (below md) */}
          <div className="flex flex-col gap-3 md:hidden my-4">
            {visibleArms.length === 0 ? (
              <EmptyState
                variant={searchQuery ? "search" : "generic"}
                title={searchQuery ? "No results found" : "No class arms found"}
                description={
                  searchQuery
                    ? `No arms match "${searchQuery}".`
                    : "There are no class arms set up for the current term."
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
                      href="/dashboard/broadsheet/arms"
                      className="flex flex-col min-w-0 flex-1"
                    >
                      <span className="text-sm font-semibold text-slate-800 truncate">
                        {formatArm(arm)}
                      </span>
                      <span className="text-[10px] text-slate-400 truncate">
                        {arm.level.section.name}
                      </span>
                    </Link>
                    <div onClick={(e) => e.stopPropagation()}>
                      {/* <BroadsheetsListActionMenu
                        armId={arm.id}
                        status={arm.broadsheet}
                        onView={() => handleView(arm)}
                        onApprove={() => handleApprove(arm)}
                        onRevoke={() => handleRevoke(arm)}
                      /> */}
                    </div>
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
          lingering error state from the previous attempt. */}
      {pendingAction && (
        <BroadsheetAdminActionModal
          action={pendingAction.action}
          armId={pendingAction.arm.id}
          armLabel={formatArm(pendingAction.arm)}
          onClose={() => setPendingAction(null)}
        />
      )}

      {/* ── Publish Term Results modal ─────────────────────────────────────
          Surfaces the irreversibility of publishing and (for now) hands off
          to a "feature in works" toast since the backend trigger isn't
          ready yet. Approval counts are passed through so the modal can
          show the admin where they are in the approval cycle. */}
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

// ── PlaceholderFilterChip ────────────────────────────────────────────────────
// Chip-style button used for the session/term placeholder filters. Visually
// consistent with the section filter chip so the user reads them as the same
// kind of control; the parent's `onClick` today just fires a toast.
function PlaceholderFilterChip({
  Icon,
  label,
  value,
  onClick,
}: {
  Icon: typeof CalendarRange;
  label: string;
  value: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="cursor-pointer flex flex-1 items-center gap-2 px-3 py-2 text-xs border border-slate-200 bg-white rounded-xl hover:border-violet-300 transition-colors"
    >
      <Icon size={13} className="text-slate-400 shrink-0" />
      <span className="text-slate-400 shrink-0">{label}:</span>
      <span className="font-medium text-slate-700 truncate">{value}</span>
      <ChevronDown size={12} className="text-slate-400 ml-auto shrink-0" />
    </button>
  );
}

// ── TermProgressStrip ─────────────────────────────────────────────────────────
// Compact info strip that summarises how far through the term's broadsheet
// approvals the admin is. Publishing the term results is now a manual,
// admin-triggered action (via the toolbar's Publish Results button), so the
// strip's job is to surface readiness — not derive a published state.
function TermProgressStrip({
  approved,
  pending,
  total,
  allApproved,
  isPending,
}: {
  approved: number;
  pending: number;
  total: number;
  allApproved: boolean;
  isPending: boolean;
}) {
  if (isPending) {
    return (
      <div className="min-h-24 rounded-2xl bg-slate-50 border border-slate-100 animate-pulse" />
    );
  }

  // Readiness label — reflects how close the term is to being publishable.
  // The actual published state lives on Term.results_status and will be
  // surfaced separately when the backend exposes it on the list endpoint.
  let readiness: { label: string; classes: string };
  if (total === 0) {
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

  return (
    <div className="rounded-2xl border border-indigo-100 bg-white p-4 sm:p-5 shadow-sm flex flex-col justify-between gap-3">
      {/* Title — pinned to the top of the card by justify-between placing
          the first flex item at the start of the main axis. */}
      <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">
        Term Approval Progress
      </p>

      {/* Status — readiness pill and count summary. Sits vertically
          centered between the title above and the progress bar below
          when the grid stretches this card to match its sibling. With
          three items and justify-between, the two remaining gaps are
          equal, so the middle item lands centered by construction. */}
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
          className={`h-full rounded-full transition-all duration-500 ${
            allApproved ? "bg-emerald-500" : "bg-violet-500"
          }`}
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
