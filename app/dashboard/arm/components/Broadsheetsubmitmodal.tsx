"use client";

// ─────────────────────────────────────────────────────────────────────────────
// BroadsheetSubmitModal.tsx
//
// Confirmation dialog used by the Generate Broadsheet / Resubmit for Review
// action in the Results tab.
//
// Flow:
//   1. User clicks the action button → this modal opens.
//   2. Modal explains exactly what submission does (locks results, hands off
//      to the school administrator for review).
//   3. User clicks Proceed → mutation hits arm/detail/broadsheet/.
//   4a. On success: cache invalidates, modal closes, toast notifies.
//   4b. On validation failure: errors render inline as a checklist of
//       blockers so the user knows what to fix before retrying.
//
// Two variants (controlled by the parent's choice of `action`):
//   - "submit" → first-time submission (broadsheet was "none")
//   - "resend" → resubmission after rejection (broadsheet was "revoked")
//
// Backend wiring:
//   PUT arm/detail/broadsheet/
//     body: { id: armId, school_id, broadsheet: action }
//
//   The backend's serializer raises a ValidationError at the FIRST failed
//   check (one message, not a list). Our checklist UI is array-based; we
//   extract every string we can find in error.data so the inline list
//   handles the single-issue case naturally.
//
// The modal is conditionally rendered by the parent (mounted only when
// `show === true`), so reopening always starts with a clean state — no need
// for a manual state reset.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Lock, RefreshCw, X } from "lucide-react";
import { toast } from "react-toastify";

import { useClientAuthFetch } from "@/lib/Useclientauthfetch";
import { useArmDetails } from "../context/Armdetailsprovider";
import ButtonLoader from "../../components/Buttonloader";
import type { ApiEnvelope } from "../page";

// ── Constants ────────────────────────────────────────────────────────────────

const SCHOOL_ID = process.env.NEXT_PUBLIC_SCHOOL_ID ?? "";

export type BroadsheetSubmitAction = "submit" | "resend";

// ── Validation error type ────────────────────────────────────────────────────
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

interface BroadsheetSubmitModalProps {
  // Which transition the modal is performing — sets copy + CTA label.
  action: BroadsheetSubmitAction;
  onClose: () => void;
}

// Copy that varies by action variant — kept in one place for clarity.
const VARIANT_COPY = {
  submit: {
    title: "Submit Results for Review",
    Icon: Lock,
    intro:
      "Submitting locks the term results for this class arm and sends them to the school administrator for review.",
    proceedLabel: "Submit for Review",
    successMessage: "Results submitted for review.",
  },
  resend: {
    title: "Resubmit Results for Review",
    Icon: RefreshCw,
    intro:
      "The previous submission was rejected. Resubmitting will lock the term results and send them to the school administrator for a fresh review.",
    proceedLabel: "Resubmit for Review",
    successMessage: "Results resubmitted for review.",
  },
} as const;

// What happens after submission — shown as a bulleted preamble so the user
// has no surprises about what the action will do.
const POST_SUBMISSION_BULLETS = [
  "Scores and remarks become read-only for this class arm.",
  "Status changes to “Pending Review” until the administrator acts on it.",
  "The administrator can approve the broadsheet or send it back with corrections.",
] as const;

export default function BroadsheetSubmitModal({
  action,
  onClose,
}: BroadsheetSubmitModalProps) {
  const { armId } = useArmDetails();
  const queryClient = useQueryClient();
  const { clientAuthFetch } = useClientAuthFetch();
  const copy = VARIANT_COPY[action];
  const Icon = copy.Icon;

  // Validation errors returned by the mutation. Stays visible inside the
  // modal so the user can read the issues, then close the modal and fix
  // them via the relevant editor.
  const [issues, setIssues] = useState<string[]>([]);

  // ── Page-level concerns: body scroll lock + Escape to close ──────────────
  // The modal lives at the top of the z-stack; locking the body scroll
  // avoids the awkward "scroll behind the dialog" effect on long pages.
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
  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const { data, error } = await clientAuthFetch<ApiEnvelope<unknown>>(
        "arm/detail/broadsheet/",
        {
          method: "PUT",
          body: {
            id: armId,
            school_id: SCHOOL_ID,
            broadsheet: action,
          },
        },
      );

      if (error) {
        // Treat any backend error response as a validation issue — these
        // are surfaced in the inline checklist rather than a toast so the
        // user can fix the underlying data before retrying.
        const extracted = extractIssues(error.data, error.message);
        throw new BroadsheetValidationError(extracted);
      }
      return data;
    },
    onSuccess: () => {
      toast.success(copy.successMessage);
      // Refresh the arm so the button switches to the "Pending Review" variant.
      queryClient.invalidateQueries({ queryKey: ["arm-detail", armId] });
      onClose();
    },
    onError: (err) => {
      // Validation errors get rendered inline; unexpected errors fall back to a toast.
      if (err instanceof BroadsheetValidationError) {
        setIssues(err.issues);
        return;
      }
      toast.error(
        err instanceof Error ? err.message : "Could not submit broadsheet.",
      );
    },
  });

  // Render via portal so the dialog escapes any overflow-hidden ancestors
  // and lives directly under <body>.
  return createPortal(
    <div
      className="fixed inset-0 z-9999 flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="broadsheet-submit-title"
    >
      {/* Backdrop — click to dismiss (but not while submitting). */}
      <button
        type="button"
        aria-label="Close dialog"
        onClick={() => {
          if (!isPending) onClose();
        }}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm cursor-pointer"
      />

      {/* Dialog card. Bottom-sheet on mobile (slides up); centered modal on
          desktop. The shared content is identical — just the chrome differs. */}
      <div className="relative w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden mx-auto sm:my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full bg-violet-50 border border-violet-100 flex items-center justify-center shrink-0">
              <Icon size={16} className="text-violet-600" />
            </div>
            <h2
              id="broadsheet-submit-title"
              className="text-sm font-bold text-slate-800 truncate"
            >
              {copy.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50 transition-colors shrink-0 cursor-pointer"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body — scrollable when content (errors) gets long. */}
        <div className="px-5 py-4 overflow-y-auto flex flex-col gap-4">
          <p className="text-xs text-slate-600 leading-relaxed">{copy.intro}</p>

          <div className="rounded-xl bg-slate-50 border border-slate-100 p-3.5">
            <h3 className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold mb-2">
              Once submitted
            </h3>
            <ul className="flex flex-col gap-1.5">
              {POST_SUBMISSION_BULLETS.map((bullet) => (
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

          {/* Validation issues — only when the most recent submission failed. */}
          {issues.length > 0 && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3.5">
              <div className="flex items-start gap-2.5 mb-2">
                <AlertTriangle
                  size={16}
                  className="text-red-500 mt-0.5 shrink-0"
                />
                <div>
                  <h3 className="text-xs font-semibold text-red-900">
                    Submission blocked
                  </h3>
                  <p className="text-[11px] text-red-700 mt-0.5">
                    Fix the{" "}
                    {issues.length === 1 ? "issue" : `${issues.length} issues`}{" "}
                    below before submitting:
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
            className="px-4 py-2 text-xs border border-slate-200 bg-white text-slate-600 rounded-xl hover:bg-slate-100 disabled:opacity-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              // Clear previously-displayed issues so the user sees a fresh
              // result for this attempt — old issues from a prior click
              // shouldn't linger when they retry.
              setIssues([]);
              mutate();
            }}
            disabled={isPending}
            className="relative flex items-center justify-center gap-1.5 px-4 py-2 text-xs bg-violet-600 text-white rounded-xl hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm shadow-violet-200 min-w-44 cursor-pointer"
          >
            {/* Same flex-stays-mounted pattern used elsewhere to lock the
                button's intrinsic width across loading transitions. */}
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
