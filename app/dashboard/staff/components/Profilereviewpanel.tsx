"use client";

// ─────────────────────────────────────────────────────────────────────────────
// ProfileReviewPanel.tsx
//
// Slide-in panel displaying the details of a profile request.
// The approver acts on the request directly from the header buttons:
//   Pending request     — Approve, Decline, or Blacklist
//   Declined request    — no buttons; only the requester can resend it
//   Blacklisted request — Lift and Decline, or Lift and Approve
// Each button hands the chosen action to the parent, which asks for
// confirmation.
//
// The applicant's gender is shown under their name.
//
// Data shape from StaffProfReqSerializer (list view):
//   user: { id, first_name, last_name, middle_name, gender, email, phone }
//   school: { id, name }
//   status, refresh_count, created_on
// ─────────────────────────────────────────────────────────────────────────────

import { ChevronLeft, User } from "lucide-react";
import type { ReviewAction } from "./Profilerequests";

// Human-readable gender labels — mirrors CustomUser GENDER choices on the backend
const GENDER_LABELS: Record<string, string> = {
  M: "Male",
  F: "Female",
  O: "Other",
  NOTA: "Not Applicable",
};

interface ProfileReviewPanelProps {
  show: boolean;
  request: StaffProfReq | null;
  onClose: () => void;
  /** Called with the action the approver chose. */
  onAction: (action: ReviewAction) => void;
}

export default function ProfileReviewPanel({
  show,
  request,
  onClose,
  onAction,
}: ProfileReviewPanelProps) {
  // Resolved gender label — falls back to "—" when gender is absent or unrecognised
  const genderLabel = request?.user.gender
    ? (GENDER_LABELS[request.user.gender] ?? request.user.gender)
    : "—";

  return (
    <div
      className={`transition-all duration-500 ease-in-out overflow-hidden ${
        show ? "w-full opacity-100" : "w-0 opacity-0 h-0"
      }`}
    >
      <div className="w-full">
        {/* Back link */}
        <button
          onClick={onClose}
          className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 my-5 md:my-8 transition-all hover:scale-105 w-fit"
        >
          <ChevronLeft size={14} />
          Back
        </button>

        {/* Review card */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm mb-10">
          {/* Header with action buttons. On a phone the title is on its own
              line and the buttons wrap onto the next; from sm up they share
              one row, the buttons on the right. The button group is hidden
              when it is empty (a declined request has none), so it adds no
              gap. */}
          <div className="flex flex-col gap-3 bg-slate-100 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-sm font-bold text-slate-800">
              Review Requester
            </h2>
            <div className="flex flex-wrap gap-2 empty:hidden sm:justify-end">
              {request?.status === "blacklisted" && (
                <>
                  <button
                    onClick={() => onAction("lift-approve")}
                    className="cursor-pointer px-3 py-1.5 text-xs bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-all shadow-sm"
                  >
                    Lift and Approve
                  </button>
                  <button
                    onClick={() => onAction("lift-decline")}
                    className="cursor-pointer px-3 py-1.5 text-xs border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-100 transition-all"
                  >
                    Lift and Decline
                  </button>
                </>
              )}
              {request?.status === "pending" && (
                <>
                  <button
                    onClick={() => onAction("approve")}
                    className="cursor-pointer px-3 py-1.5 text-xs bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-all shadow-sm"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => onAction("decline")}
                    className="cursor-pointer px-3 py-1.5 text-xs border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-100 transition-all"
                  >
                    Decline
                  </button>
                  <button
                    onClick={() => onAction("blacklist")}
                    className="cursor-pointer px-3 py-1.5 text-xs border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-100 transition-all"
                  >
                    Blacklist
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Profile header */}
          <div className="flex flex-col md:flex-row items-center md:items-start gap-4 px-5 pt-6 pb-4 border-b border-slate-50">
            {/* Avatar placeholder */}
            <div className="w-20 h-20 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
              <User size={32} className="text-violet-400" />
            </div>
            <div className="text-center md:text-left">
              <p className="text-lg font-bold text-slate-800">
                {request?.user.first_name} {request?.user.last_name}
              </p>

              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                {genderLabel}
              </p>

              <p className="text-[10px] text-slate-400 mt-1">
                Submitted: {request?.created_on.slice(0, 10) ?? "—"}
              </p>
            </div>
          </div>

          {/* Detail fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-5 py-6">
            <DetailField label="First Name" value={request?.user.first_name} />
            <DetailField label="Last Name" value={request?.user.last_name} />
            <DetailField
              label="Middle Name"
              value={request?.user.middle_name}
            />
            <DetailField label="Email Address" value={request?.user.email} />
            <DetailField label="Phone Number" value={request?.user.phone} />
            <DetailField label="School" value={request?.school.name} />
          </div>

          {/* Declined notice */}
          {request?.status === "declined" && (
            <div className="px-5 pb-5">
              <p className="text-[10px] text-slate-500 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
                This request was declined. Only the requester can resend it.
              </p>
            </div>
          )}

          {/* Resend notice */}
          {request && request.refresh_count > 0 && (
            <div className="px-5 pb-5">
              <p className="text-[10px] text-amber-600 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                This request has been resent{" "}
                <strong>{request.refresh_count}</strong> time(s).
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-medium text-slate-400">{label}</span>
      <div className="border border-slate-100 rounded-xl px-3 py-2 text-xs text-slate-700 bg-slate-50 min-h-8">
        {value ?? <span className="text-slate-300">—Not Set—</span>}
      </div>
    </div>
  );
}
