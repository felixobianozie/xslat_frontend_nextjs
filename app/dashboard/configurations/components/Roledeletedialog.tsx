"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Roledeletedialog.tsx
//
// Confirmation modal for deleting a school role (DELETE roles/detail/).
//
// The backend refuses to delete a role that any staff portfolio still holds,
// including portfolios that were soft-deleted. When the staff count is known
// to be above zero, the dialog says so and does not offer the delete. When the
// count is zero or unknown, the delete is offered and any refusal from the
// backend is shown inside the dialog so the admin can read it in full.
//
// A deleted role cannot be restored. Creating a role with the same name makes
// a new, empty role.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { AlertTriangle, X } from "lucide-react";
import { toast } from "react-toastify";

import { useClientAuthFetch } from "@/lib/Useclientauthfetch";
import type { ApiEnvelope, RoleRecord } from "@/types/configurations";
import { SCHOOL_ID, SaveError } from "../configutils";
import ButtonLoader from "../../components/Buttonloader";

interface RoleDeleteDialogProps {
  role: RoleRecord;
  // How many staff hold the role, when known.
  memberCount: number | undefined;
  onClose: () => void;
  onDone: () => void;
}

export default function RoleDeleteDialog({
  role,
  memberCount,
  onClose,
  onDone,
}: RoleDeleteDialogProps) {
  const { clientAuthFetch } = useClientAuthFetch();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const inUse = memberCount !== undefined && memberCount > 0;

  const { mutate, isPending } = useMutation<
    ApiEnvelope<unknown>,
    SaveError,
    void
  >({
    mutationFn: async () => {
      const { data, error } = await clientAuthFetch<ApiEnvelope<unknown>>(
        "roles/detail/",
        { method: "DELETE", body: { id: role.id, school_id: SCHOOL_ID } },
      );
      if (error) throw new SaveError(error.message, error.data);
      return data!;
    },
    onSuccess: (response) => {
      toast.success(response.message);
      onDone();
    },
    onError: (err) => setErrorMessage(err.message),
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
      aria-labelledby="role-delete-title"
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
            <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center">
              <AlertTriangle size={16} className="text-red-500" />
            </div>
            <h2
              id="role-delete-title"
              className="text-sm font-bold text-slate-800"
            >
              Delete role
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
          {inUse ? (
            <p>
              <span className="font-semibold text-slate-900">{role.name}</span>{" "}
              is held by {memberCount}{" "}
              {memberCount === 1 ? "staff member" : "staff members"} and cannot
              be deleted. Remove the role from them first.
            </p>
          ) : (
            <>
              <p>
                You are about to delete{" "}
                <span className="font-semibold text-slate-900">
                  {role.name}
                </span>
                .
              </p>
              <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-100 rounded-xl px-3 py-2">
                <AlertTriangle
                  size={13}
                  className="text-yellow-600 shrink-0 mt-0.5"
                />
                <p className="text-[11px] text-yellow-700">
                  A deleted role cannot be restored. Creating a role with the
                  same name makes a new, empty role.
                </p>
              </div>
            </>
          )}

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
            {inUse ? "Close" : "Cancel"}
          </button>
          {!inUse && (
            <button
              type="button"
              onClick={() => {
                setErrorMessage(null);
                mutate();
              }}
              disabled={isPending}
              className="cursor-pointer relative flex items-center justify-center px-4 py-2 text-xs bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm shadow-red-200"
            >
              <span className={isPending ? "invisible" : ""}>Delete role</span>
              <span
                className={`absolute inset-0 flex items-center justify-center ${
                  isPending ? "" : "invisible"
                }`}
              >
                <ButtonLoader />
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
