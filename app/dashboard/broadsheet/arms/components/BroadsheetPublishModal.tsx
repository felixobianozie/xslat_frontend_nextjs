"use client";

// ─────────────────────────────────────────────────────────────────────────────
// BroadsheetPublishModal.tsx
//
// Confirmation dialog for the manual "Publish Term Results" action. The
// backend trigger endpoint that flips Term.results_status to "published"
// isn't implemented yet, so the CTA currently surfaces an informational
// toast instead of firing a real mutation. When the endpoint lands, replace
// the toast call inside handlePublish with the appropriate clientAuthFetch
// PUT (and add the React Query mutation/invalidations alongside it).
//
// Design notes:
//   - Same chrome as BroadsheetAdminActionModal so the two dialogs feel
//     consistent (portal, scroll lock, ESC-to-close, bottom-sheet on
//     mobile, centred card on desktop).
//   - Irreversibility is called out in a dedicated amber warning panel
//     rather than hidden in a bullet — the user emphasised that this
//     point must be clear to the admin.
//   - Approval-state context (X of Y approved) is informational, not
//     gating. The button isn't disabled because the backend will
//     ultimately enforce its own preconditions; the modal just gives
//     the admin a chance to notice if they're acting too early.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Globe, X } from "lucide-react";
import { toast } from "react-toastify";

interface BroadsheetPublishModalProps {
  // Informational counts shown in the modal so the admin can see how far
  // along the term's approvals are. Not validated against — the modal
  // never blocks the publish CTA.
  approvedCount: number;
  pendingCount: number;
  totalCount: number;
  onClose: () => void;
}

export default function BroadsheetPublishModal({
  approvedCount,
  pendingCount,
  totalCount,
  onClose,
}: BroadsheetPublishModalProps) {
  // Lock body scroll while open and listen for Escape to close. Same
  // pattern used by BroadsheetAdminActionModal — kept inline (rather than
  // a shared hook) because the modal count is small and a hook would add
  // more indirection than it removes.
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

  // True only when every arm in the term has been approved. Used to choose
  // between the contextual note and the "you're ready" framing in the body.
  const allApproved = totalCount > 0 && approvedCount === totalCount;

  function handlePublish() {
    // BACKEND PENDING: the publish trigger endpoint is not yet implemented.
    // When it is, replace this toast with the matching mutation — e.g.
    //   const { data, error } = await clientAuthFetch("term/publish/", {
    //     method: "PUT",
    //     body: { id: termId, school_id: SCHOOL_ID },
    //   });
    // followed by an invalidate on the broadsheet-arms / term queries.
    toast.info("Term result publishing is in the works — coming soon.");
    onClose();
  }

  return createPortal(
    <div
      className="fixed inset-0 z-9999 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="publish-term-results-title"
    >
      {/* Backdrop — click anywhere outside the card to dismiss. */}
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        className="cursor-pointer absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
      />

      {/* Dialog card. Always centred — the outer `p-4` keeps a comfortable
          gutter on small screens so the card never touches the viewport edge. */}
      <div className="relative w-full sm:max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full border border-violet-100 bg-violet-50 flex items-center justify-center shrink-0">
              <Globe size={16} className="text-violet-600" />
            </div>
            <h2
              id="publish-term-results-title"
              className="text-sm font-bold text-slate-800 truncate"
            >
              Publish Term Results
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors shrink-0"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body — scrollable when the warning + bullets grow tall on small
            screens. */}
        <div className="px-5 py-4 overflow-y-auto flex flex-col gap-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Publishing closes the term's assessment cycle and makes the term's
            results available for public consumption. Students and guardians
            will be able to access their results once published.
          </p>

          <div className="rounded-xl bg-slate-50 border border-slate-100 p-3.5">
            <h3 className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold mb-2">
              What happens next
            </h3>
            <ul className="flex flex-col gap-1.5">
              {[
                "The term's assessment is locked — scores and remarks become read-only.",
                "Approved broadsheets are finalised for the term.",
                "Results are made available for public consumption.",
              ].map((bullet) => (
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

          {/* Irreversibility warning — kept prominent so the admin can't
              miss it. Amber rather than red because this isn't a destructive
              action per se; it's a one-way state transition. */}
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3.5">
            <div className="flex items-start gap-2.5">
              <AlertTriangle
                size={16}
                className="text-amber-600 mt-0.5 shrink-0"
              />
              <div>
                <h3 className="text-xs font-semibold text-amber-900">
                  This action cannot be undone
                </h3>
                <p className="text-[11px] text-amber-800 mt-1 leading-relaxed">
                  Once published, the term's results are permanently finalised.
                  You will not be able to revert this — make sure every arm's
                  broadsheet is in the state you want before proceeding.
                </p>
              </div>
            </div>
          </div>

          {/* Approval-state context — informational only. Doesn't block the
              CTA; the backend will enforce its own preconditions. */}
          {totalCount > 0 && !allApproved && (
            <p className="text-[11px] text-slate-500 italic">
              {approvedCount} of {totalCount} arm
              {totalCount === 1 ? "" : "s"} approved
              {pendingCount > 0 ? ` · ${pendingCount} still pending` : ""}.
              Consider approving every arm before publishing.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-slate-100 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer px-4 py-2 text-xs border border-slate-200 bg-white text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handlePublish}
            className="cursor-pointer flex items-center justify-center gap-1.5 px-4 py-2 text-xs text-white bg-violet-600 hover:bg-violet-700 rounded-xl shadow-sm shadow-violet-200 transition-colors"
          >
            <Globe size={12} />
            <span>Publish Results</span>
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
