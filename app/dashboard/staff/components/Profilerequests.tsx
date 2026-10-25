"use client";

// ─────────────────────────────────────────────────────────────────────────────
// ProfileRequests.tsx
//
// Staff profile requests for the school, in three views:
//   Pending     — requests waiting for a decision (the default view)
//   Declined    — requests an approver turned down. Read-only here: only the
//                 requester can resend a declined request.
//   Blacklisted — people who were blacklisted and cannot request again until
//                 the blacklist is lifted
//
// What an approver can do:
//   Pending request      → Approve, Decline, or Blacklist
//   Declined request     → Review the details only
//   Blacklisted request  → Lift and decline (the person may apply again), or
//                          Lift and approve (grants the staff portfolio now)
//
// Data layer:
//  - initialData is the server-fetched first page of the Pending view. The
//    other views, other pages and searches load when first opened.
//  - The list is paginated and searchable on the backend. Typing in the
//    search box sends nothing; Enter or the search button does. The paginator
//    steps through the pages of the open view.
//  - useQuery is the single source of truth after hydration. The query key
//    includes the view, page and search, so each is cached on its own.
//  - Every action goes through one useMutation that calls
//    PUT staff/requests/review/ with { request_id, status }.
//  - On success the mutation refreshes the requests caches. An approval also
//    creates a staff portfolio, so the staff list and stats refresh too.
//  - initialDataUpdatedAt: Date.now() prevents an immediate background
//    refetch on mount, treating the server data as already fresh.
//  - isPending (not isLoading) drives the skeleton — correct for React Query v5.
//  - Loading state lives only on the confirm button via ButtonLoader.
//    No overlay is used.
//
// ConfirmModal is a private component defined at the bottom of this file.
// It is not used anywhere else so it lives here rather than as a separate file.
// ─────────────────────────────────────────────────────────────────────────────

import { FormEvent, ReactNode, useState } from "react";
import { HelpCircle, Search, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useClientAuthFetch } from "@/lib/Useclientauthfetch";
import ProfileRequestActionMenu from "./Profilerequestactionmenu";
import ProfileReviewPanel from "./Profilereviewpanel";
import ButtonLoader from "../../components/Buttonloader";
import EmptyState from "../../components/Emptystate";
import { toast } from "react-toastify";
import TableLoader from "../../components/Tableloader";
import Paginator, { PAGE_SIZE } from "../../components/Paginator";
import type { PaginatedResponse } from "../page";

// ── Constants ─────────────────────────────────────────────────────────────────

const SCHOOL_ID = process.env.NEXT_PUBLIC_SCHOOL_ID ?? "";

// The lists the tab switcher shows. The value is also the `status` filter
// sent to the backend.
type RequestView = "pending" | "declined" | "blacklisted";

const VIEW_LABELS: Record<RequestView, string> = {
  pending: "Pending",
  declined: "Declined",
  blacklisted: "Blacklisted",
};

// What the empty state says for the views other than Pending (Pending uses the
// standard requests empty state)
const EMPTY_MESSAGES: Record<
  Exclude<RequestView, "pending">,
  { title: string; description: string }
> = {
  declined: {
    title: "No declined requests",
    description: "Requests you decline will appear here.",
  },
  blacklisted: {
    title: "No blacklisted requesters",
    description:
      "People you blacklist will appear here, where you can lift the blacklist.",
  },
};

// Everything an approver can do to a request
export type ReviewAction =
  | "approve"
  | "decline"
  | "blacklist"
  | "lift-decline"
  | "lift-approve";

// What each action sends to the backend and how it is presented to the user
interface ActionConfig {
  /** The `status` sent to staff/requests/review/. */
  status: "approved" | "declined" | "blacklisted";
  title: string;
  confirmLabel: string;
  /** Tailwind classes for the confirm button (background + text colour). */
  confirmClass: string;
  success: string;
  /** The sentence shown in the confirmation modal. */
  describe: (name: string) => ReactNode;
}

const ACTIONS: Record<ReviewAction, ActionConfig> = {
  approve: {
    status: "approved",
    title: "Approve Staff Profile",
    confirmLabel: "Approve",
    confirmClass: "bg-violet-700 hover:bg-violet-800 text-white",
    success: "Request approved successfully.",
    describe: (name) => (
      <>
        You are about to approve <span className="font-bold">{name}</span> as
        staff. Click <span className="font-bold">&apos;Approve&apos;</span> to
        proceed.
      </>
    ),
  },
  decline: {
    status: "declined",
    title: "Decline Staff Profile",
    confirmLabel: "Decline",
    confirmClass: "bg-red-600 hover:bg-red-700 text-white",
    success: "Request declined.",
    describe: (name) => (
      <>
        You are about to decline <span className="font-bold">{name}</span>.
        Click <span className="font-bold">&apos;Decline&apos;</span> to proceed.
      </>
    ),
  },
  blacklist: {
    status: "blacklisted",
    title: "Blacklist Requester",
    confirmLabel: "Blacklist",
    confirmClass: "bg-slate-800 hover:bg-slate-900 text-white",
    success: "Requester blacklisted.",
    describe: (name) => (
      <>
        You are about to blacklist <span className="font-bold">{name}</span>.
        They will not be able to request staff access at this school again until
        you lift the blacklist. Click{" "}
        <span className="font-bold">&apos;Blacklist&apos;</span> to proceed.
      </>
    ),
  },
  "lift-decline": {
    status: "declined",
    title: "Lift Blacklist and Decline",
    confirmLabel: "Lift and Decline",
    confirmClass: "bg-amber-600 hover:bg-amber-700 text-white",
    success: "Blacklist lifted. The requester can apply again.",
    describe: (name) => (
      <>
        You are about to lift the blacklist on{" "}
        <span className="font-bold">{name}</span> and decline the request. They
        will be able to send a new request. Click{" "}
        <span className="font-bold">&apos;Lift and Decline&apos;</span> to
        proceed.
      </>
    ),
  },
  "lift-approve": {
    status: "approved",
    title: "Lift Blacklist and Approve",
    confirmLabel: "Lift and Approve",
    confirmClass: "bg-violet-700 hover:bg-violet-800 text-white",
    success: "Blacklist lifted and request approved.",
    describe: (name) => (
      <>
        You are about to lift the blacklist on{" "}
        <span className="font-bold">{name}</span> and approve them as staff.
        Click <span className="font-bold">&apos;Lift and Approve&apos;</span> to
        proceed.
      </>
    ),
  },
};

// ── Props ──────────────────────────────────────────────────────────────────

interface ProfileRequestsProps {
  /**
   * Server-fetched first page of the pending profile requests — used as React
   * Query initialData. Null when the server fetch failed.
   */
  initialData: PaginatedResponse<StaffProfReq> | null;
}

export default function ProfileRequests({ initialData }: ProfileRequestsProps) {
  const queryClient = useQueryClient();
  const { clientAuthFetch } = useClientAuthFetch();

  // ── UI state ───────────────────────────────────────────────────────────────
  const [view, setView] = useState<RequestView>("pending");
  // `searchInput` is what is typed and is never sent by itself;
  // `appliedSearch` is what the backend is asked for.
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRequest, setSelectedRequest] = useState<StaffProfReq | null>(
    null,
  );
  const [showReviewPanel, setShowReviewPanel] = useState(false);
  // The action waiting for the approver's confirmation, with its request
  const [pendingAction, setPendingAction] = useState<{
    action: ReviewAction;
    request: StaffProfReq;
  } | null>(null);

  // ── React Query ────────────────────────────────────────────────────────────
  // The server fetched page 1 of the pending view, with no search
  const isStartingState =
    view === "pending" && currentPage === 1 && appliedSearch === "";

  const { data: queryData, isPending } = useQuery<
    PaginatedResponse<StaffProfReq>
  >({
    queryKey: ["staff-requests", SCHOOL_ID, view, currentPage, appliedSearch],

    queryFn: async () => {
      const params = new URLSearchParams({
        "school-id": SCHOOL_ID,
        status: view,
        page: String(currentPage),
        "page-size": String(PAGE_SIZE),
      });
      if (appliedSearch) params.set("search", appliedSearch);

      const { data, error } = await clientAuthFetch<
        PaginatedResponse<StaffProfReq>
      >(`staff/requests/list/?${params.toString()}`);

      if (error) throw new Error(error.message);
      return data!;
    },

    initialData: isStartingState ? (initialData ?? undefined) : undefined,
    initialDataUpdatedAt: isStartingState ? Date.now() : undefined,
  });

  const requests: StaffProfReq[] = queryData?.data ?? [];
  const totalPages: number = queryData?.total_pages ?? 1;
  const hasSearch = appliedSearch !== "";

  // ── Review mutation ────────────────────────────────────────────────────────
  // One mutation serves every action. An approval also creates a
  // StaffPortfolio on the backend, so the staff list and stats refresh too.
  const { mutate: reviewRequest, isPending: isReviewing } = useMutation<
    unknown,
    Error,
    { requestId: string; action: ReviewAction }
  >({
    mutationFn: async ({ requestId, action }) => {
      const { data, error } = await clientAuthFetch("staff/requests/review/", {
        method: "PUT",
        body: { request_id: requestId, status: ACTIONS[action].status },
      });
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (_data, { action }) => {
      toast.success(ACTIONS[action].success);
      setPendingAction(null);
      setSelectedRequest(null);
      // Reviewing the only request on a later page leaves that page empty, so
      // step back one page.
      if (requests.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
      queryClient.invalidateQueries({
        queryKey: ["staff-requests", SCHOOL_ID],
      });
      if (ACTIONS[action].status === "approved") {
        queryClient.invalidateQueries({ queryKey: ["staff", SCHOOL_ID] });
        queryClient.invalidateQueries({
          queryKey: ["staff-analytics", SCHOOL_ID],
        });
      }
    },
    onError: (err) => {
      toast.error(err.message ?? "That action failed. Please try again.");
    },
  });

  // Sends the typed search to the backend. Called by the search button and by
  // pressing Enter in the input. Starts again from page 1, and does nothing
  // when the text has not changed.
  function handleSearchSubmit(e?: FormEvent) {
    e?.preventDefault();
    const text = searchInput.trim();
    if (text === appliedSearch) return;
    setAppliedSearch(text);
    setCurrentPage(1);
  }

  // Clears the input and the applied search, back to page 1.
  function handleSearchClear() {
    setSearchInput("");
    if (appliedSearch !== "") {
      setAppliedSearch("");
      setCurrentPage(1);
    }
  }

  // True while the typed text differs from the search already applied
  const hasUnsubmittedSearch = searchInput.trim() !== appliedSearch;

  // ── Helpers ────────────────────────────────────────────────────────────────

  function fullName(req: StaffProfReq) {
    return `${req.user.first_name} ${req.user.last_name}`;
  }

  // Opens the confirmation modal for an action on a request
  function askToConfirm(action: ReviewAction, req: StaffProfReq) {
    setSelectedRequest(req);
    setPendingAction({ action, request: req });
  }

  function openReview(req: StaffProfReq) {
    setSelectedRequest(req);
    setShowReviewPanel(true);
  }

  // The row's three-dot menu, used by both the table and the mobile cards
  function renderActionMenu(req: StaffProfReq) {
    return (
      <ProfileRequestActionMenu
        requestId={req.id}
        status={req.status}
        onReview={() => openReview(req)}
        onApprove={() => askToConfirm("approve", req)}
        onDecline={() => askToConfirm("decline", req)}
        onBlacklist={() => askToConfirm("blacklist", req)}
        onLiftDecline={() => askToConfirm("lift-decline", req)}
        onLiftApprove={() => askToConfirm("lift-approve", req)}
      />
    );
  }

  // The confirmation modal's content for the waiting action, if any
  const currentConfig = pendingAction ? ACTIONS[pendingAction.action] : null;

  return (
    <div className="flex">
      {/* ── List panel ───────────────────────────────────────────────────── */}
      <div
        className={`transition-all duration-500 ease-in-out overflow-hidden ${
          showReviewPanel ? "w-0 opacity-0" : "w-full opacity-100"
        }`}
      >
        {/* View switcher */}
        <div
          className="flex gap-2 mt-6"
          role="tablist"
          aria-label="Request views"
        >
          {(Object.keys(VIEW_LABELS) as RequestView[]).map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={view === key}
              onClick={() => {
                setView(key);
                setCurrentPage(1);
              }}
              className={`cursor-pointer px-3 py-1.5 text-xs rounded-xl border transition-colors ${
                view === key
                  ? "bg-violet-600 border-violet-600 text-white shadow-sm"
                  : "bg-white border-slate-200 text-slate-600 hover:border-violet-300 hover:text-violet-700"
              }`}
            >
              {VIEW_LABELS[key]}
            </button>
          ))}
        </div>

        {/* Search the open view by the requester's name, email, phone or ID.
            A form, so Enter and the button both send it. */}
        <form
          onSubmit={handleSearchSubmit}
          className="mt-3 flex gap-2 sm:max-w-sm"
          role="search"
          aria-label="Search requests"
        >
          <div className="relative flex-1 min-w-0">
            <Search
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search name, email, phone, ID…"
              aria-label="Search requests by name, email, phone or ID"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-8 pr-8 py-2 text-xs text-slate-800 placeholder:text-slate-400 border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
            />
            {(searchInput || appliedSearch) && (
              <button
                type="button"
                onClick={handleSearchClear}
                aria-label="Clear search"
                className="cursor-pointer absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X size={12} />
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={!hasUnsubmittedSearch}
            aria-label="Search"
            title="Search"
            className="cursor-pointer flex items-center justify-center px-3 py-2 text-xs bg-violet-600 text-white rounded-xl hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm shadow-violet-200"
          >
            <Search size={14} />
          </button>
        </form>

        {/* The search the results are scoped to, with a one-click way out */}
        {appliedSearch && (
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
            <span>Showing results for</span>
            <span className="inline-flex items-center gap-1.5 bg-violet-50 text-violet-700 border border-violet-100 rounded-full px-2.5 py-1 font-medium">
              <span className="truncate max-w-55">
                &ldquo;{appliedSearch}&rdquo;
              </span>
              <button
                type="button"
                onClick={handleSearchClear}
                aria-label="Clear search"
                className="cursor-pointer text-violet-500 hover:text-violet-800 transition-colors"
              >
                <X size={11} />
              </button>
            </span>
          </div>
        )}

        {isPending ? (
          <TableLoader rows={4} className="my-6" />
        ) : requests.length === 0 ? (
          hasSearch ? (
            <EmptyState
              variant="search"
              title="No results found"
              description={`No requests match "${appliedSearch}".`}
            />
          ) : view === "pending" ? (
            <EmptyState variant="requests" />
          ) : (
            <EmptyState variant="requests" {...EMPTY_MESSAGES[view]} />
          )
        ) : (
          <>
            {/* ── Desktop table ─────────────────────────────────────── */}
            <div className="hidden md:block border border-indigo-100 rounded-2xl overflow-hidden my-6">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-100 text-left text-slate-500 border-b border-slate-200">
                    <th className="px-5 py-3 font-semibold">Requester</th>
                    <th className="px-5 py-3 font-semibold">Request Date</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold">Resent</th>
                    <th className="px-5 py-3 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-50">
                  {requests.map((req, index) => (
                    <tr
                      key={req.id}
                      className={`h-14 hover:bg-violet-50/40 transition-colors cursor-pointer ${
                        index % 2 === 0 ? "bg-white" : "bg-indigo-50/50"
                      }`}
                      onClick={() => setSelectedRequest(req)}
                    >
                      <td className="px-5">
                        <div className="flex items-center gap-2">
                          <HelpCircle
                            size={14}
                            className="text-slate-400 shrink-0"
                          />
                          <span
                            className="font-medium text-slate-800 hover:text-violet-700 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              openReview(req);
                            }}
                          >
                            {req.user.first_name} {req.user.last_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 text-slate-500">
                        {req.created_on.slice(0, 10)}
                      </td>
                      <td className="px-5">
                        <StatusBadge status={req.status} />
                      </td>
                      <td className="px-5 text-slate-500">
                        {req.refresh_count > 0 ? (
                          <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-[10px] font-semibold">
                            {req.refresh_count}×
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-5" onClick={(e) => e.stopPropagation()}>
                        {renderActionMenu(req)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Mobile card list ──────────────────────────────────── */}
            <div className="flex flex-col gap-3 md:hidden my-6">
              {requests.map((req) => (
                <div
                  key={req.id}
                  className="bg-white border border-indigo-100 rounded-2xl overflow-hidden shadow-sm"
                  onClick={() => setSelectedRequest(req)}
                >
                  <div className="flex items-center justify-between p-4 border-b border-slate-50">
                    <div className="flex items-center gap-2 min-w-0">
                      <HelpCircle
                        size={18}
                        className="text-slate-400 shrink-0"
                      />
                      <div className="flex flex-col min-w-0">
                        <span
                          className="text-sm font-semibold text-slate-800 truncate"
                          onClick={(e) => {
                            e.stopPropagation();
                            openReview(req);
                          }}
                        >
                          {req.user.first_name} {req.user.last_name}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {req.created_on.slice(0, 10)}
                        </span>
                      </div>
                    </div>
                    <div onClick={(e) => e.stopPropagation()}>
                      {renderActionMenu(req)}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-2.5">
                    <StatusBadge status={req.status} />
                    {req.refresh_count > 0 && (
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-[10px] font-semibold">
                        Resent {req.refresh_count}×
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* ── Paginator ─────────────────────────────────────────── */}
            <Paginator
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>

      {/* ── Profile review panel ──────────────────────────────────────── */}
      <ProfileReviewPanel
        show={showReviewPanel}
        request={selectedRequest}
        onClose={() => {
          setShowReviewPanel(false);
          setSelectedRequest(null);
        }}
        onAction={(action) => {
          setShowReviewPanel(false);
          if (selectedRequest) askToConfirm(action, selectedRequest);
        }}
      />

      {/* ── Confirmation modal — one for every action ─────────────────── */}
      <ConfirmModal
        open={pendingAction !== null}
        title={currentConfig?.title ?? ""}
        message={
          currentConfig && pendingAction
            ? currentConfig.describe(fullName(pendingAction.request))
            : null
        }
        confirmLabel={currentConfig?.confirmLabel ?? ""}
        confirmClass={currentConfig?.confirmClass ?? ""}
        isLoading={isReviewing}
        onConfirm={() =>
          pendingAction &&
          reviewRequest({
            requestId: pendingAction.request.id,
            action: pendingAction.action,
          })
        }
        onCancel={() => {
          setPendingAction(null);
          setSelectedRequest(null);
        }}
      />
    </div>
  );
}

// ── StatusBadge ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: StaffProfReq["status"] }) {
  const styles: Record<StaffProfReq["status"], string> = {
    pending: "bg-amber-50 text-amber-700",
    approved: "bg-emerald-50 text-emerald-700",
    declined: "bg-red-50 text-red-600",
    blacklisted: "bg-slate-100 text-slate-500",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${styles[status]}`}
    >
      {status}
    </span>
  );
}

// ── ConfirmModal ───────────────────────────────────────────────────────────
//
// Private confirmation dialog — used only within this file, for every review
// action. Not exported.
//
// Built with plain Tailwind — no DaisyUI dependencies.
// A fixed backdrop dims the page; the card is centred over it.
// The confirm button maintains a stable size between idle and loading states
// by keeping both the label and ButtonLoader in the DOM simultaneously,
// toggling visibility rather than mounting/unmounting.

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmLabel: string;
  /** Tailwind classes applied to the confirm button (background + text colour). */
  confirmClass: string;
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmModal({
  open,
  title,
  message,
  confirmLabel,
  confirmClass,
  isLoading,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null;

  return (
    // Backdrop — fixed, full-screen, dims content behind the modal
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px]"
      // Clicking the backdrop cancels (unless a mutation is in flight)
      onClick={() => {
        if (!isLoading) onCancel();
      }}
    >
      {/* Card — stop clicks from bubbling to the backdrop */}
      <div
        className="relative w-full max-w-md mx-4 bg-indigo-50 rounded-2xl shadow-xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title */}
        <h3 className="font-bold text-slate-800 text-base">{title}</h3>

        {/* Message */}
        <p className="mt-3 mb-6 text-sm text-slate-600 leading-relaxed">
          {message}
        </p>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-xs border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>

          {/* Confirm — stable width via invisible placeholder pattern */}
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`cursor-pointer relative flex items-center justify-center px-4 py-2 text-xs rounded-xl disabled:opacity-70 transition-colors ${confirmClass}`}
          >
            {/* Label — invisible while loading but still sets the button width */}
            <span className={isLoading ? "invisible" : ""}>{confirmLabel}</span>
            {/* Loader — absolutely centred, invisible when idle */}
            <span
              className={`absolute inset-0 flex items-center justify-center ${
                isLoading ? "" : "invisible"
              }`}
            >
              <ButtonLoader />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
