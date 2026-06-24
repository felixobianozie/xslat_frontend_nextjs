"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Verifyemailpanel.tsx
//
// Slide-out panel for verifying the current user's email address.
//
// Flow (matches the backend's two-endpoint design):
//   1. User clicks "Send Code"     → GET email/validate/resend-token/?email=…
//      (issues a fresh token if the existing one has expired, otherwise resends
//      the current one. Public endpoint — auth header is ignored.)
//   2. User enters the 6-digit code shown in their inbox.
//   3. User clicks "Verify Email"  → POST email/validate/ { email, token }
//   4. On success, the user query is invalidated so the underlying card flips
//      to the "Verified" state, and the panel closes.
//
// Panel structure mirrors the existing Studentassignarmpanel pattern:
//   * width-collapses to 0 when closed so it can sit in a flex row beside the
//     card grid and animate in/out.
//   * Header, body, footer card layout.
//   * Button-loader pattern with stable button width while a mutation runs.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ChevronLeft, Mail } from "lucide-react";
import { toast } from "react-toastify";

import { useClientAuthFetch } from "@/lib/Useclientauthfetch";
import ButtonLoader from "../components/Buttonloader";

interface VerifyEmailPanelProps {
  show: boolean;
  onClose: () => void;
  /** Email address being verified — shown read-only and used as the lookup key. */
  email: string;
  /** User id — used as the React Query key prefix so the user card refreshes. */
  userId: string;
}

export default function VerifyEmailPanel({
  show,
  onClose,
  email,
  userId,
}: VerifyEmailPanelProps) {
  const { clientAuthFetch } = useClientAuthFetch();
  const queryClient = useQueryClient();

  // Token entered by the user — restricted to digits via the onChange handler.
  const [token, setToken] = useState("");

  // Once the user has clicked "Send Code" successfully, the input becomes
  // enabled and a confirmation hint is shown.
  const [hasSentCode, setHasSentCode] = useState(false);

  // Reset all form state whenever the panel re-opens. Prevents a stale token
  // value from leaking across uses.
  useEffect(() => {
    if (show) {
      setToken("");
      setHasSentCode(false);
    }
  }, [show, email]);

  // ── Send / resend code mutation ──────────────────────────────────────────
  const { mutate: sendCode, isPending: isSending } = useMutation({
    mutationFn: async () => {
      const encoded = encodeURIComponent(email);
      const { data, error } = await clientAuthFetch(
        `email/validate/resend-token/?email=${encoded}`,
      );
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      toast.success("Verification code sent to your email.");
      setHasSentCode(true);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to send code.");
    },
  });

  // ── Verify code mutation ─────────────────────────────────────────────────
  const { mutate: verify, isPending: isVerifying } = useMutation({
    mutationFn: async () => {
      const trimmed = token.trim();
      if (!trimmed) throw new Error("Please enter the verification code.");
      const { data, error } = await clientAuthFetch("email/validate/", {
        method: "POST",
        body: { email, token: trimmed },
      });
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      toast.success("Email verified successfully.");
      // Refetch user data so the OnboardingSection card flips to "Verified".
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
      onClose();
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Verification failed.");
    },
  });

  const canVerify = hasSentCode && token.trim().length > 0 && !isVerifying;

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
          className="cursor-pointer flex items-center gap-1 text-xs text-red-600 hover:text-red-700 my-5 md:my-8 transition-all hover:scale-105 w-fit"
        >
          <ChevronLeft size={14} />
          <span>Back</span>
        </button>

        {/* Panel card */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm mb-10 text-black">
          {/* Header */}
          <div className="bg-slate-100 border-b border-slate-200 px-5 py-4">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Mail size={14} className="text-violet-600" />
              Verify Your Email
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              We&apos;ll send a 6-digit code to your email. Enter it below to
              confirm.
            </p>
          </div>

          {/* Body */}
          <div className="grid grid-cols-1 gap-5 px-5 py-6">
            {/* Email (read-only) */}
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-slate-500">Email</span>
              <div className="text-sm text-slate-800 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 break-all">
                {email || (
                  <span className="text-slate-400">No email on file</span>
                )}
              </div>
            </div>

            {/* Send code button + confirmation */}
            <div className="flex flex-col gap-1">
              <button
                onClick={() => sendCode()}
                disabled={isSending || !email}
                className="cursor-pointer relative flex items-center justify-center px-4 py-2 text-xs bg-violet-50 text-violet-700 rounded-xl hover:bg-violet-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span className={isSending ? "invisible" : ""}>
                  {hasSentCode ? "Resend Code" : "Send Code"}
                </span>
                <span
                  className={`absolute inset-0 flex items-center justify-center ${
                    isSending ? "" : "invisible"
                  }`}
                >
                  <ButtonLoader dotColor="bg-violet-500" />
                </span>
              </button>
              {hasSentCode && (
                <p className="text-[11px] text-emerald-600 flex items-center gap-1 mt-1">
                  <CheckCircle2 size={12} />
                  Code sent. Check your inbox.
                </p>
              )}
            </div>

            {/* Token input */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor="email-token"
                className="text-xs font-medium text-slate-500"
              >
                Verification Code <span className="text-red-500">*</span>
              </label>
              <input
                id="email-token"
                type="text"
                inputMode="numeric"
                // Only allow 6 digits — matches the backend token format.
                pattern="[0-9]*"
                maxLength={6}
                value={token}
                onChange={(e) => setToken(e.target.value.replace(/\D/g, ""))}
                placeholder="Enter 6-digit code"
                disabled={!hasSentCode}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none transition-all bg-white focus:border-violet-400 focus:ring-2 focus:ring-violet-100 disabled:opacity-50 disabled:cursor-not-allowed tracking-widest text-center"
              />
              {!hasSentCode && (
                <p className="text-[11px] text-slate-400 mt-1">
                  Click &quot;Send Code&quot; to receive your verification code.
                </p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 bg-slate-50 border-t border-slate-100 px-5 py-4">
            <button
              onClick={onClose}
              disabled={isVerifying}
              className="cursor-pointer px-4 py-2 text-xs border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => verify()}
              disabled={!canVerify}
              className="cursor-pointer relative flex items-center justify-center gap-2 px-4 py-2 text-xs bg-violet-600 text-white rounded-xl hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm shadow-violet-200"
            >
              <span className={isVerifying ? "invisible" : ""}>
                Verify Email
              </span>
              <span
                className={`absolute inset-0 flex items-center justify-center ${
                  isVerifying ? "" : "invisible"
                }`}
              >
                <ButtonLoader />
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
