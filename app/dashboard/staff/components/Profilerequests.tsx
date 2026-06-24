"use client";

// ─────────────────────────────────────────────────────────────────────────────
// ProfileRequests.tsx
//
// Displays pending staff profile requests for the school.
//
// Data layer:
//  - initialData is server-fetched by the parent page on first load.
//  - useQuery is the single source of truth after hydration.
//  - Approve and decline are handled by dedicated useMutation hooks that call
//    PUT staff/requests/detail/ with { request_id, status }.
//  - On success each mutation invalidates the relevant query caches:
//      Approve → requests + staff list + staff stats (portfolio is created)
//      Decline → requests only
//  - initialDataUpdatedAt: Date.now() prevents an immediate background
//    refetch on mount, treating the server data as already fresh.
//  - isPending (not isLoading) drives the skeleton — correct for React Query v5.
//  - Loading state lives only on the confirm button via ButtonLoader.
//    No overlay is used.
//
// ConfirmModal is a private component defined at the bottom of this file.
// It is not used anywhere else so it lives here rather than as a separate file.
// ─────────────────────────────────────────────────────────────────────────────

import { ReactNode, useState } from "react";
import { HelpCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useClientAuthFetch } from "@/lib/Useclientauthfetch";
import ProfileRequestActionMenu from "./Profilerequestactionmenu";
import ProfileReviewPanel from "./Profilereviewpanel";
import ButtonLoader from "../../components/Buttonloader";
import EmptyState from "../../components/Emptystate";
import { toast } from "react-toastify";
import TableLoader from "../../components/Tableloader";

// ── Constants ─────────────────────────────────────────────────────────────────

const SCHOOL_ID = process.env.NEXT_PUBLIC_SCHOOL_ID ?? "";

// ── Props ──────────────────────────────────────────────────────────────────

interface ProfileRequestsProps {
  /** Server-fetched pending profile requests — used as React Query initialData. */
  initialData: StaffProfReq[];
}

export default function ProfileRequests({ initialData }: ProfileRequestsProps) {
  const queryClient = useQueryClient();
  const { clientAuthFetch } = useClientAuthFetch();

  // ── UI state ───────────────────────────────────────────────────────────────
  const [selectedRequest, setSelectedRequest] = useState<StaffProfReq | null>(
    null,
  );
  const [showReviewPanel, setShowReviewPanel] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);

  // ── React Query ────────────────────────────────────────────────────────────
  const { data: requests = [], isPending } = useQuery<StaffProfReq[]>({
    queryKey: ["staff-requests", SCHOOL_ID],

    queryFn: async () => {
      const { data, error } = await clientAuthFetch<{ data: StaffProfReq[] }>(
        `staff/requests/list/?school-id=${SCHOOL_ID}&status=pending`,
      );

      if (error) throw new Error(error.message);
      return data!.data;
    },

    initialData,
    initialDataUpdatedAt: Date.now(),
  });

  // ── Approve mutation ───────────────────────────────────────────────────────
  // pending → approved also creates a StaffPortfolio on the backend,
  // so staff list and stats caches are invalidated too.
  const { mutate: approveRequest, isPending: isApproving } = useMutation({
    mutationFn: async (requestId: string) => {
      const { data, error } = await clientAuthFetch("staff/requests/detail/", {
        method: "PUT",
        body: { request_id: requestId, status: "approved" },
      });
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      toast.success("Request approved successfully.");
      setShowApproveModal(false);
      setSelectedRequest(null);
      queryClient.invalidateQueries({
        queryKey: ["staff-requests", SCHOOL_ID],
      });
      queryClient.invalidateQueries({ queryKey: ["staff", SCHOOL_ID] });
      queryClient.invalidateQueries({ queryKey: ["staff-stats", SCHOOL_ID] });
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Approval failed. Please try again.");
    },
  });

  // ── Decline mutation ───────────────────────────────────────────────────────
  // pending → declined. No portfolio created, so only requests cache refreshes.
  const { mutate: declineRequest, isPending: isDeclining } = useMutation({
    mutationFn: async (requestId: string) => {
      const { data, error } = await clientAuthFetch("staff/requests/detail/", {
        method: "PUT",
        body: { request_id: requestId, status: "declined" },
      });
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      toast.success("Request declined.");
      setShowDeclineModal(false);
      setSelectedRequest(null);
      queryClient.invalidateQueries({
        queryKey: ["staff-requests", SCHOOL_ID],
      });
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Decline failed. Please try again.");
    },
  });

  return (
    <div className="flex">
      {/* ── List panel ───────────────────────────────────────────────────── */}
      <div
        className={`transition-all duration-500 ease-in-out overflow-hidden ${
          showReviewPanel ? "w-0 opacity-0" : "w-full opacity-100"
        }`}
      >
        {isPending ? (
          <TableLoader rows={4} className="my-6" />
        ) : requests.length === 0 ? (
          <EmptyState variant="requests" />
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
                              setSelectedRequest(req);
                              setShowReviewPanel(true);
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
                        <ProfileRequestActionMenu
                          requestId={req.id}
                          onReview={() => {
                            setSelectedRequest(req);
                            setShowReviewPanel(true);
                          }}
                          onApprove={() => {
                            setSelectedRequest(req);
                            setShowApproveModal(true);
                          }}
                          onDecline={() => {
                            setSelectedRequest(req);
                            setShowDeclineModal(true);
                          }}
                        />
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
                            setSelectedRequest(req);
                            setShowReviewPanel(true);
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
                      <ProfileRequestActionMenu
                        requestId={req.id}
                        onReview={() => {
                          setSelectedRequest(req);
                          setShowReviewPanel(true);
                        }}
                        onApprove={() => {
                          setSelectedRequest(req);
                          setShowApproveModal(true);
                        }}
                        onDecline={() => {
                          setSelectedRequest(req);
                          setShowDeclineModal(true);
                        }}
                      />
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
        onApprove={() => {
          setShowReviewPanel(false);
          setShowApproveModal(true);
        }}
        onDecline={() => {
          setShowReviewPanel(false);
          setShowDeclineModal(true);
        }}
      />

      {/* ── Approve confirmation modal ────────────────────────────────── */}
      <ConfirmModal
        open={showApproveModal}
        title="Approve Staff Profile"
        message={
          <>
            You are about to approve{" "}
            <span className="font-bold">
              {selectedRequest?.user.first_name}{" "}
              {selectedRequest?.user.last_name}
            </span>{" "}
            as staff. Click <span className="font-bold">'Approve'</span> to
            proceed.
          </>
        }
        confirmLabel="Approve"
        confirmClass="bg-violet-700 hover:bg-violet-800 text-white"
        isLoading={isApproving}
        onConfirm={() => selectedRequest && approveRequest(selectedRequest.id)}
        onCancel={() => {
          setShowApproveModal(false);
          setSelectedRequest(null);
        }}
      />

      {/* ── Decline confirmation modal ────────────────────────────────── */}
      <ConfirmModal
        open={showDeclineModal}
        title="Decline Staff Profile"
        message={
          <>
            You are about to decline{" "}
            <span className="font-bold">
              {selectedRequest?.user.first_name}{" "}
              {selectedRequest?.user.last_name}
            </span>
            . Click <span className="font-bold">'Decline'</span> to proceed.
          </>
        }
        confirmLabel="Decline"
        confirmClass="bg-red-600 hover:bg-red-700 text-white"
        isLoading={isDeclining}
        onConfirm={() => selectedRequest && declineRequest(selectedRequest.id)}
        onCancel={() => {
          setShowDeclineModal(false);
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
// Private confirmation dialog — used only within this file for the approve
// and decline actions. Not exported.
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
