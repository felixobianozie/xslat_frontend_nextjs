"use client";

import { useState, useEffect, ChangeEvent } from "react";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import publicFetch from "@/lib/Publicfetch";
import { useRouter } from "next/navigation";

// Which contact channel the user is currently verifying
type Channel = "email" | "phone";

type Step1Values = {
  email: string;
  phone: string;
};

type Step2Values = {
  token: string;
  password: string;
  password_repeat: string;
};

// Errors are keyed by field name across both steps; we render the relevant ones per step
type Errors = Partial<{
  email: string;
  phone: string;
  token: string;
  password: string;
  password_repeat: string;
}>;

// ─── Format constants — kept consistent with Signupform ─────────────────────
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+\d{8,16}$/;
const OTP_REGEX = /^\d{6}$/;

// How long the "Resend code" button stays disabled after each send (in seconds).
// Adjust here to change the cooldown across the whole form.
const RESEND_COOLDOWN_SECONDS = 300;

// Abort timeout — falls back to 15s if the env variable is missing (matches Signupform)
const TIMEOUT_MS = Number(process.env.NEXT_PUBLIC_REQUEST_TIMEOUT_MS) || 15000;

export default function ContactValidationForm() {
  const router = useRouter();

  // Step tracking — starts at 1 and only advances to 2 after step-1 succeeds
  const [step, setStep] = useState<1 | 2>(1);

  // ── Step 1: which channel and the credential entered for it ──
  // Email is the default channel per the spec.
  const [channel, setChannel] = useState<Channel>("email");
  const [step1Values, setStep1Values] = useState<Step1Values>({
    email: "",
    phone: "",
  });

  // ── Step 2: OTP, password, password confirmation ──
  // Password is OPTIONAL (only used for accounts without one yet). The inline
  // tip near the field explains this — see the render section.
  const [step2Values, setStep2Values] = useState<Step2Values>({
    token: "",
    password: "",
    password_repeat: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordRepeat, setShowPasswordRepeat] = useState(false);

  const [errors, setErrors] = useState<Errors>({});

  // Inline status banner shown at step 2 — mirrors the toast messages so the
  // user has a persistent reference for what just happened (code sent, resent, errors).
  // `null` hides the banner. Updates each time a relevant event fires.
  const [notice, setNotice] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);

  // ── Resend cooldown timer ──
  const [resendSecondsLeft, setResendSecondsLeft] = useState(0);

  // Tick the cooldown down once per second while it is active
  useEffect(() => {
    if (resendSecondsLeft <= 0) return;
    const id = setInterval(() => {
      setResendSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [resendSecondsLeft]);

  // ─────────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────────

  // Returns the credential string for the currently-selected channel.
  // Emails are lowercased for consistency with the signup payload.
  function currentCredential(): string {
    return channel === "email"
      ? step1Values.email.trim().toLowerCase()
      : step1Values.phone.trim();
  }

  // Validates the step-1 input for the active channel only
  function validateStep1(): Errors {
    const next: Errors = {};

    if (channel === "email") {
      const v = step1Values.email.trim();
      if (!v) next.email = "Email is required.";
      else if (!EMAIL_REGEX.test(v))
        next.email = "Enter a valid email address.";
    } else {
      const v = step1Values.phone.trim();
      if (!v) next.phone = "Phone number is required.";
      else if (!PHONE_REGEX.test(v))
        next.phone = "Use E.164 format, e.g. +2348012345678.";
    }

    return next;
  }

  // Validates the step-2 input. Password is OPTIONAL — the backend uses it
  // only for accounts that have no password yet. When the user does fill it
  // in, we enforce signup-grade strength rules and require a matching
  // confirmation, the same rules as Signupform.
  function validateStep2(): Errors {
    const next: Errors = {};

    if (!step2Values.token.trim()) {
      next.token = "OTP is required.";
    } else if (!OTP_REGEX.test(step2Values.token.trim())) {
      next.token = "Enter the 6-digit code from your message.";
    }

    // Validate password only when the user typed something. An empty
    // password is allowed — the backend will reject it if needed.
    if (step2Values.password) {
      if (step2Values.password.length < 8) {
        next.password = "Must be at least 8 characters.";
      } else if (
        !/[A-Z]/.test(step2Values.password) ||
        !/[a-z]/.test(step2Values.password) ||
        !/[0-9]/.test(step2Values.password) ||
        !/[^A-Za-z0-9]/.test(step2Values.password)
      ) {
        next.password =
          "Must contain at least one uppercase letter, one lowercase letter, one number, and one special character.";
      }

      // Confirmation is required only when a password was provided
      if (!step2Values.password_repeat) {
        next.password_repeat = "Please confirm your password.";
      } else if (step2Values.password !== step2Values.password_repeat) {
        next.password_repeat = "Passwords do not match.";
      }
    }

    return next;
  }

  // Wraps a fetch call so it aborts after TIMEOUT_MS — mirrors the Signupform pattern.
  // The callback receives the AbortSignal to forward into publicFetch.
  async function withTimeout<T>(
    fn: (signal: AbortSignal) => Promise<T>,
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      return await fn(controller.signal);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // Builds the query string used by the resend-token endpoint.
  // encodeURIComponent ensures the leading "+" in phone numbers survives the URL.
  function credentialQuery(): string {
    const key = channel === "email" ? "email" : "phone";
    return `${key}=${encodeURIComponent(currentCredential())}`;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Mutations (React Query)
  // ─────────────────────────────────────────────────────────────────────────

  // Step 1 — fire resend-token to trigger an OTP if the contact is registered,
  // then advance to step 2 unconditionally. Anti-enumeration: 400 responses
  // (user-not-found / no-pending-verification) are silently swallowed so the
  // user cannot infer whether the contact exists. Only network and 5xx errors
  // bubble up to the error handler.
  const beginMutation = useMutation({
    mutationFn: async () => {
      const resp = await withTimeout((signal) =>
        publicFetch(`${channel}/validate/resend-token/?${credentialQuery()}`, {
          signal,
        }),
      );
      // Treat 400 the same as success — we do NOT want to leak that the
      // contact isn't registered or has no open verification transaction.
      if (resp.error && resp.error.status !== 400) throw resp.error;
      return {};
    },
    onSuccess: () => {
      // Reset step-2 state and start the cooldown for the resend button
      setStep2Values({ token: "", password: "", password_repeat: "" });
      setErrors({});
      setResendSecondsLeft(RESEND_COOLDOWN_SECONDS);
      setStep(2);

      // Anti-enumeration wording — does not confirm the contact is registered
      const target = channel === "email" ? "your email" : "your phone";
      const message = `If your ${channel} is registered, we've sent a 6-digit code to ${target}.`;
      toast.success(message);
      setNotice({ kind: "success", message });
    },
    onError: (err: any) => {
      toast.error(err?.message ?? "Something went wrong. Please try again.");
    },
  });

  // Step 2 — resend the OTP (used by the "Resend code" button).
  // Same anti-enumeration treatment as beginMutation: silently swallow 400s so
  // an attacker who reached step 2 cannot probe by clicking resend.
  const resendMutation = useMutation({
    mutationFn: async () => {
      const resp = await withTimeout((signal) =>
        publicFetch(`${channel}/validate/resend-token/?${credentialQuery()}`, {
          signal,
        }),
      );
      if (resp.error && resp.error.status !== 400) throw resp.error;
      return {};
    },
    onSuccess: () => {
      setResendSecondsLeft(RESEND_COOLDOWN_SECONDS);
      // Neutral wording: doesn't claim a code was definitely delivered
      const message = "A new code has been sent.";
      toast.success(message);
      setNotice({ kind: "success", message });
    },
    onError: (err: any) => {
      const message =
        err?.message ?? "Could not resend the code. Please try again.";
      toast.error(message);
      setNotice({ kind: "error", message });
    },
  });

  // Step 2 — submit the OTP (and password if required) to the final validate endpoint
  const validateMutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, any> = {
        [channel]: currentCredential(),
        token: step2Values.token.trim(),
      };
      // Send password only when the user filled it in. The backend ignores
      // this field for accounts that already have a password, so an empty
      // value is harmless. Accounts that need a password but receive none
      // will be rejected at the backend with a clear "password required" error.
      if (step2Values.password) {
        payload.password = step2Values.password;
      }

      const resp = await withTimeout((signal) =>
        publicFetch(`${channel}/validate/`, {
          method: "POST",
          body: payload,
          signal,
        }),
      );
      if (resp.error) throw resp.error;
      return resp.data;
    },
    onSuccess: () => {
      const label = channel === "email" ? "Email" : "Phone number";
      toast.success(`${label} verified! Redirecting to login…`);
      setTimeout(() => router.push("/login"), 1500);
    },
    onError: (err: any) => {
      const message = err?.message ?? "Validation failed. Please try again.";
      toast.error(message);
      setNotice({ kind: "error", message });

      // Surface backend field errors inline where they map to our form fields
      if (err?.data && typeof err.data === "object") {
        const fieldErrors: Errors = {};
        if (Array.isArray(err.data.token)) {
          fieldErrors.token = err.data.token.join(" ");
        }
        if (Array.isArray(err.data.password)) {
          fieldErrors.password = err.data.password.join(" ");
        }
        if (Object.keys(fieldErrors).length > 0) {
          setErrors((prev) => ({ ...prev, ...fieldErrors }));
        }
      }
    },
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────────────────────────────────────

  function handleChannelToggle(next: Channel) {
    if (next === channel) return;
    setChannel(next);
    setErrors({});
  }

  function handleStep1Change(e: ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setStep1Values((prev) => ({ ...prev, [name]: value }));

    // Clear the field's error as the user types
    if (errors[name as keyof Errors]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name as keyof Errors];
        return next;
      });
    }
  }

  function handleStep2Change(e: ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;

    // OTP: restrict to digits and cap at 6 characters for a smoother mobile experience
    const cleaned =
      name === "token" ? value.replace(/\D/g, "").slice(0, 6) : value;

    setStep2Values((prev) => ({ ...prev, [name]: cleaned }));

    if (errors[name as keyof Errors]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name as keyof Errors];
        return next;
      });
    }
  }

  function handleStep1Submit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const validationErrors = validateStep1();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    beginMutation.mutate();
  }

  function handleStep2Submit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const validationErrors = validateStep2();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    validateMutation.mutate();
  }

  // Lets the user go back to choose a different channel or correct a typo.
  // Step-1 values are kept (good UX); step-2 inputs, notice, and timer are reset.
  function handleBackToStep1() {
    setStep(1);
    setStep2Values({ token: "", password: "", password_repeat: "" });
    setErrors({});
    setResendSecondsLeft(0);
    setNotice(null);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Shared style helpers (light theme — mirrors Signupform)
  // ─────────────────────────────────────────────────────────────────────────

  function inputClass(hasError: boolean) {
    const base =
      "w-full rounded-lg px-3 py-2.5 text-sm text-gray-900 outline-none transition-all bg-gray-50 placeholder:text-gray-400 border";
    return hasError
      ? `${base} border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100`
      : `${base} border-gray-200 hover:border-gray-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-100`;
  }

  const labelClass =
    "block text-[11px] font-semibold text-gray-500 mb-1 uppercase tracking-wider";
  const errorClass = "mt-1 text-[11px] text-red-500";

  // Small inline spinner used inside loading buttons
  function Spinner() {
    return (
      <svg
        className="animate-spin h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="3"
          strokeOpacity="0.25"
        />
        <path
          d="M22 12a10 10 0 0 0-10-10"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  // Eye toggle for the password field — visually identical to Signupform's
  function EyeToggle({
    show,
    onToggle,
  }: {
    show: boolean;
    onToggle: () => void;
  }) {
    return (
      <button
        type="button"
        onClick={onToggle}
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:text-violet-600 transition-colors cursor-pointer"
      >
        {show ? (
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
        ) : (
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    );
  }

  // Inline status banner. Mirrors the toast message so the user has a
  // persistent reference for the latest event. Hidden when `notice` is null.
  function Notice({
    kind,
    message,
  }: {
    kind: "success" | "error";
    message: string;
  }) {
    const palette =
      kind === "success"
        ? "bg-green-50 border-green-100 text-green-700"
        : "bg-red-50 border-red-100 text-red-700";
    return (
      <div
        role="status"
        aria-live="polite"
        className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-xs ${palette}`}
      >
        {kind === "success" ? (
          <svg
            className="mt-0.5 shrink-0"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg
            className="mt-0.5 shrink-0"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        )}
        <span className="leading-snug">{message}</span>
      </div>
    );
  }

  // Derived loading flags for the three async actions
  const isBeginning = beginMutation.isPending;
  const isResending = resendMutation.isPending;
  const isValidating = validateMutation.isPending;
  const resendDisabled = isResending || resendSecondsLeft > 0;

  // Formats a number of seconds as m:ss — works for any cooldown length
  function formatCountdown(total: number) {
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  // Step indicator strip rendered above both forms for clarity
  const stepIndicator = (
    <div className="flex items-center gap-2 mb-4">
      <div className="flex items-center gap-2 text-xs font-semibold">
        <span
          className={`flex items-center justify-center w-6 h-6 rounded-full ${
            step === 1
              ? "bg-violet-600 text-white"
              : "bg-violet-100 text-violet-600"
          }`}
        >
          1
        </span>
        <span className={step === 1 ? "text-gray-900" : "text-gray-400"}>
          Choose
        </span>
      </div>
      <div className="flex-1 h-px bg-gray-200" />
      <div className="flex items-center gap-2 text-xs font-semibold">
        <span
          className={`flex items-center justify-center w-6 h-6 rounded-full ${
            step === 2
              ? "bg-violet-600 text-white"
              : "bg-gray-100 text-gray-400"
          }`}
        >
          2
        </span>
        <span className={step === 2 ? "text-gray-900" : "text-gray-400"}>
          Verify
        </span>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Render — Step 1
  // ─────────────────────────────────────────────────────────────────────────

  if (step === 1) {
    return (
      <div className="w-full">
        {stepIndicator}
        <form onSubmit={handleStep1Submit} noValidate className="space-y-4">
          {/* Channel toggle — segmented control, email is the default */}
          <div>
            <span className={labelClass}>Verify with</span>
            <div className="grid grid-cols-2 gap-2 rounded-lg bg-gray-100 p-1">
              <button
                type="button"
                onClick={() => handleChannelToggle("email")}
                className={`rounded-md py-2 text-sm font-semibold transition-colors cursor-pointer ${
                  channel === "email"
                    ? "bg-white text-violet-700 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                aria-pressed={channel === "email"}
              >
                Email
              </button>
              <button
                type="button"
                onClick={() => handleChannelToggle("phone")}
                className={`rounded-md py-2 text-sm font-semibold transition-colors cursor-pointer ${
                  channel === "phone"
                    ? "bg-white text-violet-700 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                aria-pressed={channel === "phone"}
              >
                Phone
              </button>
            </div>
          </div>

          {/* Channel-specific input */}
          {channel === "email" ? (
            <div>
              <label htmlFor="email" className={labelClass}>
                Email <span className="text-violet-500">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={step1Values.email}
                onChange={handleStep1Change}
                placeholder="jane@example.com"
                className={inputClass(Boolean(errors.email))}
              />
              {errors.email && <p className={errorClass}>{errors.email}</p>}
            </div>
          ) : (
            <div>
              <label htmlFor="phone" className={labelClass}>
                Phone <span className="text-violet-500">*</span>
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                value={step1Values.phone}
                onChange={handleStep1Change}
                placeholder="+2348012345678"
                className={inputClass(Boolean(errors.phone))}
              />
              {errors.phone ? (
                <p className={errorClass}>{errors.phone}</p>
              ) : (
                <p className="mt-1 text-[11px] text-gray-400">
                  Include your country code, e.g. +234
                </p>
              )}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isBeginning}
            className="w-full rounded-lg bg-violet-600 hover:bg-violet-700 active:bg-violet-800 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold py-2.5 transition-colors flex items-center justify-center gap-2 shadow-sm shadow-violet-200 cursor-pointer "
          >
            {isBeginning ? (
              <>
                <Spinner />
                <span>Sending code…</span>
              </>
            ) : (
              <span>Send Verification Code</span>
            )}
          </button>

          {/* Footer navigation — two clear escape routes for users who
              opened this page by mistake. Kept neutral wording so neither
              choice signals which path is "correct" for them. */}
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
            <Link
              href="/login"
              className="font-semibold text-violet-600 hover:text-violet-700 cursor-pointer"
            >
              Log in
            </Link>
            <span aria-hidden="true">|</span>
            <Link
              href="/signup"
              className="font-semibold text-violet-600 hover:text-violet-700 cursor-pointer"
            >
              Sign up
            </Link>
          </div>
        </form>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render — Step 2
  // ─────────────────────────────────────────────────────────────────────────

  const channelLabel = channel === "email" ? "email" : "phone";
  const displayedCredential = currentCredential();

  return (
    <div className="w-full">
      {stepIndicator}
      <form onSubmit={handleStep2Submit} noValidate className="space-y-4">
        {/* Recap card — shows which credential is being verified */}
        <div className="rounded-lg bg-violet-50 border border-violet-100 px-3 py-2.5">
          <p className="text-[11px] font-semibold text-violet-700 uppercase tracking-wider">
            Verifying {channelLabel}
          </p>
          <p className="text-sm text-gray-900 break-all">
            {displayedCredential}
          </p>
        </div>

        {/* Inline status banner — mirrors the most recent toast notification */}
        {notice && <Notice kind={notice.kind} message={notice.message} />}

        {/* OTP input — numeric, centered, with one-time-code autofill on supporting devices */}
        <div>
          <label htmlFor="token" className={labelClass}>
            6-Digit Code <span className="text-violet-500">*</span>
          </label>
          <input
            id="token"
            name="token"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={step2Values.token}
            onChange={handleStep2Change}
            placeholder="123456"
            maxLength={6}
            className={`${inputClass(Boolean(errors.token))} tracking-[0.4em] text-center font-semibold`}
          />
          {errors.token && <p className={errorClass}>{errors.token}</p>}
        </div>

        {/* ── Optional-password tip ──────────────────────────────────────
            Sky-toned banner that visually separates from the violet
            recap card and the green/red notice. Sits directly above the
            password fields so the context is obvious. */}
        <div className="rounded-lg bg-sky-50 border border-sky-100 px-3 py-2.5 text-xs text-sky-800 flex items-start gap-2">
          <svg
            className="mt-0.5 shrink-0 text-sky-500"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <span className="leading-snug">
            <strong className="font-semibold">Password is optional.</strong> Set
            one below only if your account doesn&apos;t have a password yet. If
            you already have one, leave these blank, your existing password
            won&apos;t change. To change it, use{" "}
            <Link
              href="/password-reset"
              className="font-semibold underline underline-offset-2 hover:text-sky-900"
            >
              reset password
            </Link>
            .
          </span>
        </div>

        {/* New password — optional, see tip above */}
        <div>
          <label htmlFor="password" className={labelClass}>
            Set Password{" "}
            <span className="ml-1 text-gray-400 font-normal normal-case tracking-normal">
              (optional)
            </span>
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={step2Values.password}
              onChange={handleStep2Change}
              placeholder="Leave blank if you already have a password"
              className={`${inputClass(Boolean(errors.password))} pr-9`}
            />
            <EyeToggle
              show={showPassword}
              onToggle={() => setShowPassword((v) => !v)}
            />
          </div>
          {errors.password ? (
            <p className={errorClass}>{errors.password}</p>
          ) : (
            <p className="mt-1 text-[11px] text-gray-400">
              8+ chars · uppercase · lowercase · number · special
            </p>
          )}
        </div>

        {/* Confirm new password — required only when a password was entered */}
        <div>
          <label htmlFor="password_repeat" className={labelClass}>
            Confirm Password{" "}
            <span className="ml-1 text-gray-400 font-normal normal-case tracking-normal">
              (optional)
            </span>
          </label>
          <div className="relative">
            <input
              id="password_repeat"
              name="password_repeat"
              type={showPasswordRepeat ? "text" : "password"}
              autoComplete="new-password"
              value={step2Values.password_repeat}
              onChange={handleStep2Change}
              placeholder="Re-enter password"
              className={`${inputClass(Boolean(errors.password_repeat))} pr-9`}
            />
            <EyeToggle
              show={showPasswordRepeat}
              onToggle={() => setShowPasswordRepeat((v) => !v)}
            />
          </div>
          {errors.password_repeat && (
            <p className={errorClass}>{errors.password_repeat}</p>
          )}
        </div>

        {/* Resend control — disabled while the cooldown timer is running */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">Didn’t get the code?</span>
          <button
            type="button"
            onClick={() => resendMutation.mutate()}
            disabled={resendDisabled}
            className="font-semibold text-violet-600 hover:text-violet-700 disabled:text-gray-400 disabled:cursor-not-allowed inline-flex items-center gap-1.5 cursor-pointer"
          >
            {isResending ? (
              <>
                <Spinner />
                <span>Sending…</span>
              </>
            ) : resendSecondsLeft > 0 ? (
              <span>Resend in {formatCountdown(resendSecondsLeft)}</span>
            ) : (
              <span>Resend code</span>
            )}
          </button>
        </div>

        {/* Final submit */}
        <button
          type="submit"
          disabled={isValidating}
          className="w-full rounded-lg bg-violet-600 hover:bg-violet-700 active:bg-violet-800 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold py-2.5 transition-colors flex items-center justify-center gap-2 shadow-sm shadow-violet-200 cursor-pointer"
        >
          {isValidating ? (
            <>
              <Spinner />
              <span>Verifying…</span>
            </>
          ) : (
            <span>Verify &amp; Continue</span>
          )}
        </button>

        {/* Back to step 1 — lets the user fix a typo or switch channel */}
        <button
          type="button"
          onClick={handleBackToStep1}
          className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-900 text-sm font-medium py-2.5 transition-colors cursor-pointer"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Use a different {channelLabel}
        </button>
      </form>
    </div>
  );
}
