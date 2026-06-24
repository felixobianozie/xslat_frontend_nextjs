"use client";

// ─────────────────────────────────────────────────────────────────────────────
// BroadsheetsList.tsx
//
// Renders the broadsheets list page — one row per class arm, showing each
// arm's current broadsheet status and exposing the admin actions
// (View / Approve / Revoke), plus the term-level Publish Results action.
//
// Layout:
//   - Toolbar with search + section filter + Publish Results button.
//   - Term-level progress strip showing how many arms in the term are
//     approved. Publishing is a manual action via the toolbar button;
//     the strip just surfaces approval readiness.
//   - Desktop: table.   Mobile: stacked cards.
//
// Data layer:
//   - Single useQuery against the mock helper. Result shape mirrors what the
//     real GET arm/list/ envelope would return, so swapping to clientAuthFetch
//     is a one-line change inside queryFn.
//   - Filtering and search are purely client-side: the real backend list
//     endpoint doesn't expose a broadsheet-status filter or a full-text
//     search param, so doing this in the client matches its behaviour.
//
// Actions:
//   - View   → navigates to /dashboard/broadsheet/arm?id=<armId>.
//   - Approve / Revoke → opens BroadsheetAdminActionModal, which fires the
//     mutation and invalidates ["broadsheet-arms"] on success.
// ─────────────────────────────────────────────────────────────────────────────

import Link from "next/link";
import { useMemo, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Filter, Globe, Search } from "lucide-react";
import { toast } from "react-toastify";

import EmptyState from "../../../components/Emptystate";
import TableLoader from "../../../components/Tableloader";
import BroadsheetStatusBadge from "./BroadsheetStatusBadge";
import BroadsheetsListActionMenu from "./BroadsheetsListActionMenu";
import BroadsheetAdminActionModal, {
  type BroadsheetAdminAction,
} from "./BroadsheetAdminActionModal";
import BroadsheetPublishModal from "./BroadsheetPublishModal";
import { fetchBroadsheetArms, type ApiEnvelope } from "../broadsheet-mock-data";

// ── Filter type — section abbreviation, or "all" for no filter ───────────────
type SectionFilter = "all" | `section:${string}`;

// "JSS 1 A" — full identifier used in row labels and dialogs.
function formatArm(arm: ClassArm): string {
  return `${arm.level.section.abbr} ${arm.level.abbr} ${arm.abbr}`;
}

// Holds the in-flight modal action, if any. `null` means the modal is closed.
interface PendingAdminAction {
  action: BroadsheetAdminAction;
  arm: ClassArm;
}

export default function BroadsheetsList() {
  const router = useRouter();

  // ── Local UI state ────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<SectionFilter>("all");
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);

  // When set, BroadsheetAdminActionModal renders for this arm + action.
  const [pendingAction, setPendingAction] = useState<PendingAdminAction | null>(
    null,
  );

  // Toggles the "Publish Term Results" modal. Lives separately from the
  // per-arm action modal so they can never collide.
  const [publishModalOpen, setPublishModalOpen] = useState(false);

  const filterDropdownRef = useRef<HTMLDivElement>(null);

  // Close the filter dropdown when the user clicks anywhere outside it.
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (
        filterDropdownRef.current &&
        !filterDropdownRef.current.contains(e.target as Node)
      ) {
        setFilterDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  // ── React Query: arms list ────────────────────────────────────────────────
  // MOCK: queryFn calls fetchBroadsheetArms(). To wire to the real backend,
  // replace with clientAuthFetch("arm/list/?school-id=…&term-id=…").
  const { data, isPending, isError, error } = useQuery<ApiEnvelope<ClassArm[]>>(
    {
      queryKey: ["broadsheet-arms"],
      queryFn: async () => {
        const { data, error } = await fetchBroadsheetArms();
        if (error) throw new Error(error.message);
        return data!;
      },
    },
  );

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

  // Unique sections present in the result set — drives the filter dropdown.
  const sectionOptions = useMemo(() => {
    const abbrs = new Set(arms.map((a) => a.level.section.abbr));
    return Array.from(abbrs).sort();
  }, [arms]);

  // Apply section filter, then search.
  const visibleArms = useMemo(() => {
    let filtered = arms;

    if (activeFilter !== "all") {
      const wanted = activeFilter.slice("section:".length);
      filtered = filtered.filter((a) => a.level.section.abbr === wanted);
    }

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      filtered = filtered.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.abbr.toLowerCase().includes(q) ||
          formatArm(a).toLowerCase().includes(q),
      );
    }

    return filtered;
  }, [arms, activeFilter, searchQuery]);

  // Term progress stats — drives the strip above the table.
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

  function handleFilterChange(filter: SectionFilter) {
    setActiveFilter(filter);
    setFilterDropdownOpen(false);
  }

  function handleView(arm: ClassArm) {
    router.push(`/dashboard/broadsheet/arm?id=${arm.id}`);
  }

  function handleApprove(arm: ClassArm) {
    setPendingAction({ action: "approve", arm });
  }

  function handleRevoke(arm: ClassArm) {
    setPendingAction({ action: "revoke", arm });
  }

  // Filter-button label — "All Sections" by default, otherwise the chosen one.
  const activeFilterLabel =
    activeFilter === "all"
      ? "All Sections"
      : `Section: ${activeFilter.slice("section:".length)}`;

  return (
    <>
      {/* ── Term-level progress strip ───────────────────────────────────────
          Shows how the term's broadsheet approvals are progressing so the
          admin knows whether the term is ready for publishing. Publishing
          itself is a manual action — see the Publish Results button below. */}
      <TermProgressStrip
        approved={termStats.approved}
        pending={termStats.pending}
        total={termStats.total}
        allApproved={termStats.allApproved}
        isPending={isPending}
      />

      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
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

        {/* Filter + Publish cluster — keeps the two trailing controls on the
            same row on mobile (each takes half) and inline on sm+. */}
        <div className="flex gap-2">
          {/* Section filter — the only backend-aligned dimension worth
              exposing here. Broadsheet status is shown per row, so filtering
              by it would mostly hide rows the admin actively needs to act on. */}
          <div ref={filterDropdownRef} className="relative flex-1 sm:flex-none">
            <button
              onClick={() => setFilterDropdownOpen((open) => !open)}
              className={`cursor-pointer flex w-full items-center justify-center sm:justify-start gap-1.5 px-3 py-2 text-xs border rounded-xl transition-colors ${
                activeFilter !== "all"
                  ? "border-violet-400 bg-violet-50 text-violet-700"
                  : "border-slate-200 bg-white text-slate-600 hover:border-violet-300"
              }`}
            >
              <Filter size={12} />
              <span className="hidden sm:inline">{activeFilterLabel}</span>
              <span className="sm:hidden">Filter</span>
            </button>

            {filterDropdownOpen && (
              <div className="absolute top-10 right-0 sm:left-0 z-20 bg-white border border-slate-100 rounded-xl shadow-lg overflow-hidden w-48 py-1">
                <FilterOptionButton
                  label="All Sections"
                  active={activeFilter === "all"}
                  onClick={() => handleFilterChange("all")}
                />
                {sectionOptions.map((abbr) => (
                  <FilterOptionButton
                    key={abbr}
                    label={`Section: ${abbr}`}
                    active={activeFilter === `section:${abbr}`}
                    onClick={() => handleFilterChange(`section:${abbr}`)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Publish Term Results — opens BroadsheetPublishModal. Always
              enabled; the modal explains the action and the backend will
              ultimately enforce its own preconditions. */}
          <button
            type="button"
            onClick={() => setPublishModalOpen(true)}
            className="cursor-pointer flex flex-1 sm:flex-none items-center justify-center gap-1.5 px-3 py-2 text-xs text-white bg-violet-600 hover:bg-violet-700 rounded-xl shadow-sm shadow-violet-200 transition-colors whitespace-nowrap"
            aria-label="Publish term results"
          >
            <Globe size={12} />
            <span className="hidden sm:inline">Publish Results</span>
            <span className="sm:hidden">Publish</span>
          </button>
        </div>
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
                          href={`/dashboard/broadsheet/arm?id=${arm.id}`}
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
                        <BroadsheetsListActionMenu
                          armId={arm.id}
                          status={arm.broadsheet}
                          onView={() => handleView(arm)}
                          onApprove={() => handleApprove(arm)}
                          onRevoke={() => handleRevoke(arm)}
                        />
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
                      href={`/dashboard/broadsheet/arm?id=${arm.id}`}
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
                      <BroadsheetsListActionMenu
                        armId={arm.id}
                        status={arm.broadsheet}
                        onView={() => handleView(arm)}
                        onApprove={() => handleApprove(arm)}
                        onRevoke={() => handleRevoke(arm)}
                      />
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
      <div className="mb-6 h-16 rounded-2xl bg-slate-50 border border-slate-100 animate-pulse" />
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
    <div className="mb-6 rounded-2xl border border-indigo-100 bg-white p-4 sm:p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">
            Term Approval Progress
          </p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
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
        </div>
        <p className="text-[10px] text-slate-400 sm:text-right max-w-xs">
          Approve every arm, then click Publish Results to finalise the term.
        </p>
      </div>

      {/* Progress bar — visualises approved share of total. */}
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

// ── FilterOptionButton ───────────────────────────────────────────────────────
// Single dropdown item — extracted so the filter list reads cleanly above.
function FilterOptionButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`cursor-pointer w-full text-left px-4 py-2 text-xs transition-colors ${
        active
          ? "bg-violet-50 text-violet-700 font-semibold"
          : "text-slate-600 hover:bg-slate-50"
      }`}
    >
      {label}
    </button>
  );
}
