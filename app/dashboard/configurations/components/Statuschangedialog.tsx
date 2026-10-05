"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Statuschangedialog.tsx
//
// Confirmation modal for the two status changes on the school calendar:
//
//   activate — make a session or term the current one
//   close    — close the current session or term
//
// Both are one PUT to session/detail/ or term/detail/ with `current` set to
// true or false. Neither can be undone: once a session or term has been
// current and is closed, it can never be made current again.
//
// The backend refuses a close until its conditions are met (a term needs every
// arm approved and its results published; a session needs every term closed).
// Its explanation is shown inside the dialog so the admin can read it in full.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { AlertTriangle, X } from "lucide-react";
import { toast } from "react-toastify";

import { useClientAuthFetch } from "@/lib/Useclientauthfetch";
import type { ApiEnvelope } from "@/types/configurations";
import { SCHOOL_ID, SaveError, fieldMessage } from "../configutils";
import ButtonLoader from "../../components/Buttonloader";

export interface StatusChangeTarget {
  kind: "session" | "term";
  id: string;
  name: string;
  action: "activate" | "close";
}

interface StatusChangeDialogProps {
  target: StatusChangeTarget;
  onClose: () => void;
  onDone: () => void;
}

export default function StatusChangeDialog({
  target,
  onClose,
  onDone,
}: StatusChangeDialogProps) {
  const { clientAuthFetch } = useClientAuthFetch();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isActivate = target.action === "activate";
  const kindLabel = target.kind;

  const { mutate, isPending } = useMutation<
    ApiEnvelope<unknown>,
    SaveError,
    void
  >({
    mutationFn: async () => {
      const { data, error } = await clientAuthFetch<ApiEnvelope<unknown>>(
        `${target.kind}/detail/`,
        {
          method: "PUT",
          body: {
            id: target.id,
            school_id: SCHOOL_ID,
            current: isActivate,
          },
        },
      );
      if (error) throw new SaveError(error.message, error.data);
      return data!;
    },
    onSuccess: (response) => {
      toast.success(response.message);
      onDone();
    },
    onError: (err) => {
      // The reason a change was refused is sent under the "current" field.
      setErrorMessage(fieldMessage(err.fieldErrors, "current") ?? err.message);
    },
  });

  // Close on Escape unless a request is running.
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !isPending) onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isPending, onClose]);

  return (
    <div
      className="fixed inset-0 z-9999 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="status-change-title"
      onClick={() => {
        if (!isPending) onClose();
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
              <AlertTriangle size={16} className="text-amber-500" />
            </div>
            <h2
              id="status-change-title"
              className="text-sm font-bold text-slate-800"
            >
              {isActivate
                ? `Set ${kindLabel} as current`
                : `Close ${kindLabel}`}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="cursor-pointer text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-5 text-xs text-slate-700 leading-relaxed space-y-3">
          {isActivate ? (
            <p>
              <span className="font-semibold text-slate-900">
                {target.name}
              </span>{" "}
              will become the school&apos;s current {kindLabel}. Only one{" "}
              {kindLabel} can be current at a time.
            </p>
          ) : (
            <p>
              You are about to close{" "}
              <span className="font-semibold text-slate-900">
                {target.name}
              </span>
              .{" "}
              {target.kind === "term"
                ? "Every arm must be approved and the term's results published first."
                : "Every term in the session must be closed first."}
            </p>
          )}

          <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-100 rounded-xl px-3 py-2">
            <AlertTriangle
              size={13}
              className="text-yellow-600 shrink-0 mt-0.5"
            />
            <p className="text-[11px] text-yellow-700">
              {isActivate
                ? `Once this ${kindLabel} has been current and is closed, it cannot be made current again.`
                : `A closed ${kindLabel} cannot be made current again.`}
            </p>
          </div>

          {errorMessage && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700">
              {errorMessage}
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 bg-slate-50 border-t border-slate-100 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="cursor-pointer px-4 py-2 text-xs border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              setErrorMessage(null);
              mutate();
            }}
            disabled={isPending}
            className="cursor-pointer relative flex items-center justify-center px-4 py-2 text-xs bg-violet-600 text-white rounded-xl hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm shadow-violet-200"
          >
            <span className={isPending ? "invisible" : ""}>
              {isActivate ? "Set as current" : "Close"}
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
    </div>
  );
}
