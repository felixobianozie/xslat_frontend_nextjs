"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Staffinvitedialog.tsx
//
// A small dialog for the two invitation actions that need more than a click:
//
//   revoke — asks for confirmation, then calls POST staff/invite/revoke/.
//            The invitation code stops working and the staff member's
//            portfolio is deactivated. "Resend Invitation" brings it back.
//   email  — shows the current address, asks for a corrected one, then calls
//            PUT staff/invite/email/. The backend gives the invitation a new
//            code and sends it to the new address.
//
// Both only apply to staff whose invitation has not been accepted. The backend
// refuses them otherwise, and its message is shown here.
//
// On success the staff list is refreshed and the dialog closes. The confirm
// button keeps its size while loading, as in the other confirmation modals.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { useClientAuthFetch } from "@/lib/Useclientauthfetch";
import ButtonLoader from "../../components/Buttonloader";

const SCHOOL_ID = process.env.NEXT_PUBLIC_SCHOOL_ID ?? "";

// Same email rule as the staff creation panel
const EMAIL_REGEX = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/;

interface StaffInviteDialogProps {
  kind: "email" | "revoke";
  portfolio: StaffPortfolio;
  onClose: () => void;
}

export default function StaffInviteDialog({
  kind,
  portfolio,
  onClose,
}: StaffInviteDialogProps) {
  const queryClient = useQueryClient();
  const { clientAuthFetch } = useClientAuthFetch();

  const user = portfolio.staff_profile.user;
  const name = `${user.first_name} ${user.last_name}`;

  const [email, setEmail] = useState("");
  // A problem with the new address, from this form or from the backend
  const [emailError, setEmailError] = useState<string | null>(null);

  const { mutate, isPending } = useMutation<
    { message: string; data?: { invite_sent?: boolean } } | undefined,
    Error
  >({
    mutationFn: async () => {
      const { data, error } =
        kind === "revoke"
          ? await clientAuthFetch<{ message: string }>(
              "staff/invite/revoke/",
              { method: "POST", body: { portfolio_id: portfolio.id } },
            )
          : await clientAuthFetch<{
              message: string;
              data: { invite_sent: boolean };
            }>("staff/invite/email/", {
              method: "PUT",
              body: {
                portfolio_id: portfolio.id,
                email: email.trim().toLowerCase(),
              },
            });
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (response) => {
      if (kind === "email" && response?.data?.invite_sent === false) {
        // The address was changed, but the email did not go out
        toast.warning(response.message);
      } else {
        toast.success(response?.message ?? "Done.");
      }
      queryClient.invalidateQueries({ queryKey: ["staff", SCHOOL_ID] });
      onClose();
    },
    onError: (err) => {
      if (kind === "email") setEmailError(err.message);
      else toast.error(err.message);
    },
  });

  function handleConfirm() {
    if (kind === "email") {
      const value = email.trim();
      if (!EMAIL_REGEX.test(value)) {
        setEmailError("Enter a valid email address.");
        return;
      }
      if (value.toLowerCase() === user.email.toLowerCase()) {
        setEmailError("That is already this person's email address.");
        return;
      }
    }
    mutate();
  }

  return (
    // Backdrop — clicking it cancels unless a request is in flight
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px]"
      onClick={() => {
        if (!isPending) onClose();
      }}
    >
      {/* Card — stop clicks from reaching the backdrop */}
      <div
        className="relative w-full max-w-md mx-4 bg-indigo-50 rounded-2xl shadow-xl p-6"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {kind === "revoke" ? (
          <>
            <h3 className="font-bold text-slate-800 text-base">
              Revoke Invitation
            </h3>
            <p className="mt-3 mb-6 text-sm text-slate-600 leading-relaxed">
              You are about to revoke the invitation for{" "}
              <span className="font-bold">{name}</span>. Their code will stop
              working and their staff portfolio will be deactivated. You can
              bring it back with{" "}
              <span className="font-bold">&apos;Resend Invitation&apos;</span>.
            </p>
          </>
        ) : (
          <>
            <h3 className="font-bold text-slate-800 text-base">
              Change Email Address
            </h3>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">
              The invitation for <span className="font-bold">{name}</span> will
              be sent to the new address with a fresh code. The old code stops
              working.
            </p>

            <p className="mt-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Current email
            </p>
            <p className="text-sm text-slate-700 break-all">{user.email}</p>

            <label
              htmlFor="invite-new-email"
              className="mt-4 block text-[11px] font-semibold text-slate-500 uppercase tracking-wider"
            >
              New email <span className="text-red-500">*</span>
            </label>
            <input
              id="invite-new-email"
              type="email"
              autoComplete="off"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError(null);
              }}
              disabled={isPending}
              placeholder="name@example.com"
              className={`mt-1 w-full rounded-xl border bg-white px-3 py-2 text-xs text-slate-900 outline-none transition-all disabled:opacity-60 ${
                emailError
                  ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                  : "border-slate-200 hover:border-slate-300 focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              }`}
            />
            {emailError && (
              <p className="mt-1 text-[11px] text-red-500">{emailError}</p>
            )}
            <div className="mb-6" />
          </>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-2 text-xs border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>

          {/* Confirm — stable width via invisible placeholder pattern */}
          <button
            onClick={handleConfirm}
            disabled={isPending}
            className={`cursor-pointer relative flex items-center justify-center px-4 py-2 text-xs rounded-xl text-white disabled:opacity-70 transition-colors ${
              kind === "revoke"
                ? "bg-red-600 hover:bg-red-700"
                : "bg-violet-700 hover:bg-violet-800"
            }`}
          >
            <span className={isPending ? "invisible" : ""}>
              {kind === "revoke" ? "Revoke" : "Update & Resend"}
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
