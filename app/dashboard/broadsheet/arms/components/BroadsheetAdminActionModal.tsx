"use client";

// ─────────────────────────────────────────────────────────────────────────────
// BroadsheetAdminActionModal.tsx
//
// Confirmation dialog used by the admin's Approve / Revoke actions on the
// broadsheets list. Mirrors the structure of BroadsheetSubmitModal (which
// handles the teacher's "submit"/"resend" actions) so the two dialogs feel
// identical to the user.
//
// Flow:
//   1. User picks Approve or Revoke from the row action menu → this opens.
//   2. Modal explains exactly what the action does.
//   3. User clicks Proceed → mutation hits arm/detail/broadsheet/.
//   4a. On success: cache invalidates, modal closes, toast notifies.
//   4b. On validation failure: errors render inline as a checklist of
//       blockers so the user knows what to fix.
//
// Two variants (controlled by the parent's choice of `action`):
//   - "approve" → moves broadsheet from "pending" to "approved"
//   - "revoke"  → moves broadsheet from "pending" or "approved" to "revoked"
//
// Backend wiring (academics.views.ArmBroadsheetView):
//   PUT arm/detail/broadsheet/
//     body: { id: armId, school_id, broadsheet: action }
//
// MOCK NOTE: while we are in mock mode this calls `applyBroadsheetAction`
// from the local mock-data module instead of clientAuthFetch. The function
// signature mirrors the real call so the swap is a one-line change.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, RotateCcw, X } from "lucide-react";
import { toast } from "react-toastify";

import ButtonLoader from "../../../components/Buttonloader";
import {
  applyBroadsheetAction,
  type BroadsheetActionVerb,
} from "../broadsheet-mock-data";

// Restrict the modal's `action` to the two admin-side verbs. Teacher-side
// verbs ("submit", "resend") have their own dedicated modal elsewhere.
export type BroadsheetAdminAction = Extract<
  BroadsheetActionVerb,
  "approve" | "revoke"
>;

interface BroadsheetAdminActionModalProps {
  action: BroadsheetAdminAction;
  armId: string;
  // Human-readable arm label (e.g. "JSS 1 A") so the dialog can reference
  // the specific arm being acted on without re-deriving it here.
  armLabel: string;
  onClose: () => void;
}

// Copy that varies between variants — kept in one place for clarity.
const VARIANT_COPY: Record<
  BroadsheetAdminAction,
  {
    title: string;
    Icon: typeof CheckCircle2;
    iconClasses: string;
    intro: (label: string) => string;
    bullets: readonly string[];
    proceedLabel: string;
    proceedClasses: string;
    successMessage: string;
  }
> = {
  approve: {
    title: "Approve Broadsheet",
    Icon: CheckCircle2,
    iconClasses: "text-emerald-600 bg-emerald-50 border-emerald-100",
    intro: (label) =>
      `Approving signs off on the term results for ${label} and contributes towards publishing the term's results.`,
    bullets: [
      "Results stay locked and read-only for this arm.",
      "Status changes to “Approved”.",
      "When every arm in the term is approved, the term's results status becomes “Published” automatically.",
    ],
    proceedLabel: "Approve Broadsheet",
    proceedClasses: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200",
    successMessage: "Broadsheet approved.",
  },
  revoke: {
    title: "Revoke Broadsheet",
    Icon: RotateCcw,
    iconClasses: "text-red-600 bg-red-50 border-red-100",
    intro: (label) =>
      `Revoking sends the broadsheet for ${label} back to the result submitter for corrections.`,
    bullets: [
      "Status changes to “Revoked”.",
      "Score entry and remark editing become available to the submitter again.",
      "The submitter has to resubmit before you can approve.",
    ],
    proceedLabel: "Revoke Broadsheet",
    proceedClasses: "bg-red-600 hover:bg-red-700 shadow-red-200",
    successMessage: "Broadsheet revoked.",
  },
};

// Wraps the backend's field-keyed error response into a list of human-readable
// strings so the inline checklist UI can render them as bullet points.
class BroadsheetValidationError extends Error {
  issues: string[];
  constructor(issues: string[]) {
    super("Broadsheet validation failed.");
    this.name = "BroadsheetValidationError";
    this.issues = issues;
  }
}

// Walk the error.data object (typically { broadsheet: ["…"] } or similar
// field-keyed errors) and pull out every string we find. Falls back to the
// top-level error message if nothing structured is available.
function extractIssues(errorData: unknown, fallbackMessage?: string): string[] {
  const issues: string[] = [];
  if (errorData && typeof errorData === "object") {
    for (const value of Object.values(errorData as Record<string, unknown>)) {
      if (Array.isArray(value)) {
        for (const v of value) {
          if (typeof v === "string") issues.push(v);
        }
      } else if (typeof value === "string") {
        issues.push(value);
      }
    }
  }
  if (issues.length === 0 && fallbackMessage) {
    issues.push(fallbackMessage);
  }
  return issues;
}

export default function BroadsheetAdminActionModal({
  action,
  armId,
  armLabel,
  onClose,
}: BroadsheetAdminActionModalProps) {
  const queryClient = useQueryClient();
  const copy = VARIANT_COPY[action];
  const Icon = copy.Icon;

  // Validation errors returned by the mutation — rendered inline so the
  // user can read what's blocking the action before closing the dialog.
  const [issues, setIssues] = useState<string[]>([]);

  // Lock body scroll while the modal is open and listen for Escape to close.
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);

    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  // ── Mutation ─────────────────────────────────────────────────────────────
  // MOCK: hits the local applyBroadsheetAction helper. To wire to the real
  // backend, replace this call with:
  //   const { data, error } = await clientAuthFetch("arm/detail/broadsheet/", {
  //     method: "PUT",
  //     body: { id: armId, school_id: SCHOOL_ID, broadsheet: action },
  //   });
  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const { data, error } = await applyBroadsheetAction(armId, action);
      if (error) {
        const extracted = extractIssues(error.data, error.message);
        throw new BroadsheetValidationError(extracted);
      }
      return data;
    },
    onSuccess: () => {
      toast.success(copy.successMessage);
      // Refresh every cached broadsheet query so the list reflects the new state.
      // ["broadsheet-arms"] is the broad key used by BroadsheetsList.
      queryClient.invalidateQueries({ queryKey: ["broadsheet-arms"] });
      onClose();
    },
    onError: (err) => {
      if (err instanceof BroadsheetValidationError) {
        setIssues(err.issues);
        return;
      }
      toast.error(
        err instanceof Error
          ? err.message
          : "Could not apply broadsheet action.",
      );
    },
  });

  return createPortal(
    <div
      className="fixed inset-0 z-9999 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="broadsheet-admin-action-title"
    >
      {/* Backdrop — click to dismiss (unless the mutation is in-flight). */}
      <button
        type="button"
        aria-label="Close dialog"
        onClick={() => {
          if (!isPending) onClose();
        }}
        className="cursor-pointer absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
      />

      {/* Dialog card. Always centred — the outer `p-4` keeps a comfortable
          gutter on small screens so the card never touches the viewport edge. */}
      <div className="relative w-full sm:max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-9 h-9 rounded-full border flex items-center justify-center shrink-0 ${copy.iconClasses}`}
            >
              <Icon size={16} />
            </div>
            <h2
              id="broadsheet-admin-action-title"
              className="text-sm font-bold text-slate-800 truncate"
            >
              {copy.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="cursor-pointer p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50 transition-colors shrink-0"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body — scrollable when content (errors) gets long. */}
        <div className="px-5 py-4 overflow-y-auto flex flex-col gap-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            {copy.intro(armLabel)}
          </p>

          <div className="rounded-xl bg-slate-50 border border-slate-100 p-3.5">
            <h3 className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold mb-2">
              What happens next
            </h3>
            <ul className="flex flex-col gap-1.5">
              {copy.bullets.map((bullet) => (
                <li
                  key={bullet}
                  className="text-xs text-slate-600 flex items-start gap-2"
                >
                  <span className="w-1 h-1 bg-violet-500 rounded-full mt-1.5 shrink-0" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Validation issues — only when the most recent attempt failed. */}
          {issues.length > 0 && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3.5">
              <div className="flex items-start gap-2.5 mb-2">
                <AlertTriangle
                  size={16}
                  className="text-red-500 mt-0.5 shrink-0"
                />
                <div>
                  <h3 className="text-xs font-semibold text-red-900">
                    Action blocked
                  </h3>
                  <p className="text-[11px] text-red-700 mt-0.5">
                    Fix the{" "}
                    {issues.length === 1 ? "issue" : `${issues.length} issues`}{" "}
                    below before trying again:
                  </p>
                </div>
              </div>
              <ul className="flex flex-col gap-1 pl-1">
                {issues.map((issue, index) => (
                  <li
                    key={index}
                    className="text-xs text-red-800 flex items-start gap-2"
                  >
                    <span className="text-red-400 shrink-0">•</span>
                    <span>{issue}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-slate-100 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="cursor-pointer px-4 py-2 text-xs border border-slate-200 bg-white text-slate-600 rounded-xl hover:bg-slate-100 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              setIssues([]); // clear previous attempt's issues
              mutate();
            }}
            disabled={isPending}
            className={`cursor-pointer relative flex items-center justify-center gap-1.5 px-4 py-2 text-xs text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm min-w-44 ${copy.proceedClasses}`}
          >
            {/* Flex-stays-mounted pattern — keeps the button width stable
                across loading transitions so it doesn't jitter. */}
            <span
              className={`flex items-center gap-1.5 ${
                isPending ? "invisible" : ""
              }`}
            >
              {copy.proceedLabel}
            </span>
            <span
              className={`absolute inset-0 flex items-center justify-center ${
                isPending ? "" : "invisible"
              }`}
            >
              <ButtonLoader />
            </span>
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
