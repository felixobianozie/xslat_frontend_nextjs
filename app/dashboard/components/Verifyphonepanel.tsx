"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Verifyphonepanel.tsx
//
// Slide-out panel for verifying the current user's phone number.
// Mirrors Verifyemailpanel — same flow, same UX, same panel chrome — but
// hits the phone-specific backend endpoints:
//
//   GET  phone/validate/resend-token/?phone=<E.164>
//   POST phone/validate/  { phone, token }
//
// The phone number is sent in E.164 format (with the leading '+'). The
// backend normalises the leading '+' if it gets stripped by the URL parser,
// so we URL-encode the value to be safe.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ChevronLeft, Phone } from "lucide-react";
import { toast } from "react-toastify";

import { useClientAuthFetch } from "@/lib/Useclientauthfetch";
import ButtonLoader from "../components/Buttonloader";

interface VerifyPhonePanelProps {
  show: boolean;
  onClose: () => void;
  /** Phone in E.164 format (e.g. +2348012345678). */
  phone: string;
  userId: string;
}

export default function VerifyPhonePanel({
  show,
  onClose,
  phone,
  userId,
}: VerifyPhonePanelProps) {
  const { clientAuthFetch } = useClientAuthFetch();
  const queryClient = useQueryClient();

  const [token, setToken] = useState("");
  const [hasSentCode, setHasSentCode] = useState(false);

  useEffect(() => {
    if (show) {
      setToken("");
      setHasSentCode(false);
    }
  }, [show, phone]);

  // ── Send / resend code mutation ──────────────────────────────────────────
  const { mutate: sendCode, isPending: isSending } = useMutation({
    mutationFn: async () => {
      // encodeURIComponent preserves the '+' as %2B so the backend reads it
      // correctly. Without encoding, URL parsing treats '+' as a space.
      const encoded = encodeURIComponent(phone);
      const { data, error } = await clientAuthFetch(
        `phone/validate/resend-token/?phone=${encoded}`,
      );
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      toast.success("Verification code sent to your phone.");
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
      const { data, error } = await clientAuthFetch("phone/validate/", {
        method: "POST",
        body: { phone, token: trimmed },
      });
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      toast.success("Phone number verified successfully.");
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
        <button
          onClick={onClose}
          className="cursor-pointer flex items-center gap-1 text-xs text-red-600 hover:text-red-700 my-5 md:my-8 transition-all hover:scale-105 w-fit"
        >
          <ChevronLeft size={14} />
          <span>Back</span>
        </button>

        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm mb-10 text-black">
          <div className="bg-slate-100 border-b border-slate-200 px-5 py-4">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Phone size={14} className="text-violet-600" />
              Verify Your Phone Number
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              We&apos;ll send a 6-digit code to your phone. Enter it below to
              confirm.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 px-5 py-6">
            {/* Phone (read-only) */}
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-slate-500">
                Phone Number
              </span>
              <div className="text-sm text-slate-800 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
                {phone || (
                  <span className="text-slate-400">No phone on file</span>
                )}
              </div>
            </div>

            {/* Send code */}
            <div className="flex flex-col gap-1">
              <button
                onClick={() => sendCode()}
                disabled={isSending || !phone}
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
                  Code sent. Check your messages.
                </p>
              )}
            </div>

            {/* Token */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor="phone-token"
                className="text-xs font-medium text-slate-500"
              >
                Verification Code <span className="text-red-500">*</span>
              </label>
              <input
                id="phone-token"
                type="text"
                inputMode="numeric"
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
                Verify Phone
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
