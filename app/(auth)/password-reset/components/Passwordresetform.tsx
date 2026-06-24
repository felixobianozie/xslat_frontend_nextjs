"use client";

import { useState, useEffect, useRef, ChangeEvent } from "react";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import publicFetch from "@/lib/Publicfetch";
import { useRouter } from "next/navigation";

type Step1Values = {
  email: string;
};

type Step2Values = {
  token: string;
  new_password: string;
  new_password_repeat: string;
};

type Errors = Partial<{
  email: string;
  token: string;
  new_password: string;
  new_password_repeat: string;
}>;

// ─── Format constants — kept consistent with Signupform / Contactvalidationform ──
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OTP_REGEX = /^\d{6}$/;

// How long the "Resend code" button stays disabled after each send (in seconds).
// Adjust here to change the cooldown across the whole form.
const RESEND_COOLDOWN_SECONDS = 60;

// Length of the pause before redirecting to /login after a successful reset.
// Gives the user time to read the toast and inline notice first.
const LOGIN_REDIRECT_DELAY_MS = 1500;

// Abort timeout — falls back to 15s if the env variable is missing (matches Signupform)
const TIMEOUT_MS = Number(process.env.NEXT_PUBLIC_REQUEST_TIMEOUT_MS) || 15000;

export default function PasswordResetForm() {
  const router = useRouter();

  // Step tracking — starts at 1 and only advances to 2 after step-1 succeeds
  const [step, setStep] = useState<1 | 2>(1);

  // ── Step 1: registered email ──
  const [step1Values, setStep1Values] = useState<Step1Values>({ email: "" });

  // ── Step 2: token + new password (and confirmation) ──
  const [step2Values, setStep2Values] = useState<Step2Values>({
    token: "",
    new_password: "",
    new_password_repeat: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordRepeat, setShowPasswordRepeat] = useState(false);

  const [errors, setErrors] = useState<Errors>({});

  // Inline status banner — mirrors the toast for persistent visibility
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

  // Track the pending login-redirect timer so we can clear it if the component
  // unmounts before the delay elapses, preventing a stray navigation.
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    };
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────────

  // Lowercased email for backend consistency (the serializer does this too)
  function currentEmail(): string {
    return step1Values.email.trim().toLowerCase();
  }

  function validateStep1(): Errors {
    const next: Errors = {};
    const v = step1Values.email.trim();
    if (!v) next.email = "Email is required.";
    else if (!EMAIL_REGEX.test(v)) next.email = "Enter a valid email address.";
    return next;
  }

  // Strong-password rules mirror Signupform so reset and signup have parity.
  // The backend enforces only min_length=8; we enforce the full set client-side.
  function validateStep2(): Errors {
    const next: Errors = {};

    if (!step2Values.token.trim()) {
      next.token = "OTP is required.";
    } else if (!OTP_REGEX.test(step2Values.token.trim())) {
      next.token = "Enter the 6-digit code from your email.";
    }

    if (!step2Values.new_password) {
      next.new_password = "Password is required.";
    } else if (step2Values.new_password.length < 8) {
      next.new_password = "Must be at least 8 characters.";
    } else if (
      !/[A-Z]/.test(step2Values.new_password) ||
      !/[a-z]/.test(step2Values.new_password) ||
      !/[0-9]/.test(step2Values.new_password) ||
      !/[^A-Za-z0-9]/.test(step2Values.new_password)
    ) {
      next.new_password =
        "Must contain at least one uppercase letter, one lowercase letter, one number, and one special character.";
    }

    if (!step2Values.new_password_repeat) {
      next.new_password_repeat = "Please confirm your password.";
    } else if (
      step2Values.new_password &&
      step2Values.new_password !== step2Values.new_password_repeat
    ) {
      next.new_password_repeat = "Passwords do not match.";
    }

    return next;
  }

  // Wraps a fetch call so it aborts after TIMEOUT_MS — mirrors Signupform pattern.
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

  // ─────────────────────────────────────────────────────────────────────────
  // Mutations
  // ─────────────────────────────────────────────────────────────────────────

  // Step 1 — request a reset token. Backend always returns 200 regardless of
  // whether the email exists (anti-enumeration), so any successful response
  // simply advances to step 2.
  const requestMutation = useMutation({
    mutationFn: async () => {
      const resp = await withTimeout((signal) =>
        publicFetch("password-reset/request/", {
          method: "POST",
          body: { email: currentEmail() },
          signal,
        }),
      );
      if (resp.error) throw resp.error;
      return resp.data;
    },
    onSuccess: () => {
      // Reset step-2 state and start the cooldown for the resend button
      setStep2Values({ token: "", new_password: "", new_password_repeat: "" });
      setErrors({});
      setResendSecondsLeft(RESEND_COOLDOWN_SECONDS);
      setStep(2);

      // Anti-enumeration wording — we don't claim the email is registered
      const message =
        "If that email is registered, a 6-digit code has been sent.";
      toast.success(message);
      setNotice({ kind: "success", message });
    },
    onError: (err: any) => {
      const message = err?.message ?? "Something went wrong. Please try again.";
      toast.error(message);
      setNotice({ kind: "error", message });
    },
  });

  // Step 2 — resend the token (re-hits the request endpoint).
  // Separate from requestMutation so the success handler does not advance the step.
  const resendMutation = useMutation({
    mutationFn: async () => {
      const resp = await withTimeout((signal) =>
        publicFetch("password-reset/request/", {
          method: "POST",
          body: { email: currentEmail() },
          signal,
        }),
      );
      if (resp.error) throw resp.error;
      return resp.data;
    },
    onSuccess: () => {
      setResendSecondsLeft(RESEND_COOLDOWN_SECONDS);
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

  // Step 2 — submit the reset. POSTs { email, token, new_password } to the
  // final endpoint and routes to /login on success.
  const resetMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        email: currentEmail(),
        token: step2Values.token.trim(),
        new_password: step2Values.new_password,
      };

      const resp = await withTimeout((signal) =>
        publicFetch("password-reset/", {
          method: "POST",
          body: payload,
          signal,
        }),
      );
      if (resp.error) throw resp.error;
      return resp.data;
    },
    onSuccess: () => {
      const message = "Password reset! Redirecting to login…";
      toast.success(message);
      setNotice({ kind: "success", message });
      redirectTimerRef.current = setTimeout(
        () => router.push("/login"),
        LOGIN_REDIRECT_DELAY_MS,
      );
    },
    onError: (err: any) => {
      // Map backend field errors inline where they have matching form fields.
      // Email errors (e.g. "Email address has not been verified.") are
      // surfaced via the Notice only — the email isn't editable at step 2,
      // and the user must go back to step 1 to change it.
      const fieldErrors: Errors = {};
      let emailLevelMessage: string | null = null;

      if (err?.data && typeof err.data === "object") {
        if (Array.isArray(err.data.token)) {
          fieldErrors.token = err.data.token.join(" ");
        }
        if (Array.isArray(err.data.new_password)) {
          fieldErrors.new_password = err.data.new_password.join(" ");
        }
        if (Array.isArray(err.data.email)) {
          emailLevelMessage = err.data.email.join(" ");
        }
      }

      if (Object.keys(fieldErrors).length > 0) {
        setErrors((prev) => ({ ...prev, ...fieldErrors }));
      }

      // Pick the most useful single message for the toast and Notice.
      // Priority: email-level message (most actionable for step 2) →
      // first field error → top-level error.message → generic fallback.
      const display =
        emailLevelMessage ??
        fieldErrors.token ??
        fieldErrors.new_password ??
        err?.message ??
        "Could not reset password. Please try again.";

      toast.error(display);
      setNotice({ kind: "error", message: display });
    },
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────────────────────────────────────

  function handleStep1Change(e: ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setStep1Values((prev) => ({ ...prev, [name]: value }));

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

    // OTP: digits only, capped at 6 characters for a smoother mobile experience
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
    requestMutation.mutate();
  }

  function handleStep2Submit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const validationErrors = validateStep2();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    resetMutation.mutate();
  }

  // Lets the user correct the email and start over.
  // Step-1 value is kept (good UX); step-2 inputs, notice, and timer are reset.
  function handleBackToStep1() {
    setStep(1);
    setStep2Values({ token: "", new_password: "", new_password_repeat: "" });
    setErrors({});
    setResendSecondsLeft(0);
    setNotice(null);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Shared style helpers (mirrors Signupform / Contactvalidationform)
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
  const isRequesting = requestMutation.isPending;
  const isResending = resendMutation.isPending;
  const isResetting = resetMutation.isPending;
  const resendDisabled = isResending || resendSecondsLeft > 0;

  function formatCountdown(total: number) {
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  // Step indicator strip shown above both forms for clarity
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
          Email
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
          Reset
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
          <div>
            <label htmlFor="email" className={labelClass}>
              Registered Email <span className="text-violet-500">*</span>
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

          {/* Inline status banner — mirrors the most recent toast notification */}
          {notice && <Notice kind={notice.kind} message={notice.message} />}

          {/* Submit */}
          <button
            type="submit"
            disabled={isRequesting}
            className="w-full rounded-lg bg-violet-600 hover:bg-violet-700 active:bg-violet-800 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold py-2.5 transition-colors flex items-center justify-center gap-2 shadow-sm shadow-violet-200 cursor-pointer"
          >
            {isRequesting ? (
              <>
                <Spinner />
                <span>Sending code…</span>
              </>
            ) : (
              <span>Send Reset Code</span>
            )}
          </button>

          {/* Footer link — return to login */}
          <p className="text-center text-xs text-gray-500">
            Remembered your password?{" "}
            <Link
              href="/login"
              className="font-semibold text-violet-600 hover:text-violet-700"
            >
              Log in
            </Link>
          </p>
        </form>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render — Step 2
  // ─────────────────────────────────────────────────────────────────────────

  const displayedEmail = currentEmail();

  return (
    <div className="w-full">
      {stepIndicator}
      <form onSubmit={handleStep2Submit} noValidate className="space-y-4">
        {/* Recap card — shows which email is being reset */}
        <div className="rounded-lg bg-violet-50 border border-violet-100 px-3 py-2.5">
          <p className="text-[11px] font-semibold text-violet-700 uppercase tracking-wider">
            Resetting password for
          </p>
          <p className="text-sm text-gray-900 break-all">{displayedEmail}</p>
        </div>

        {/* Inline status banner — mirrors the most recent toast notification */}
        {notice && <Notice kind={notice.kind} message={notice.message} />}

        {/* OTP — numeric, centered, with one-time-code autofill on supporting devices */}
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

        {/* New password */}
        <div>
          <label htmlFor="new_password" className={labelClass}>
            New Password <span className="text-violet-500">*</span>
          </label>
          <div className="relative">
            <input
              id="new_password"
              name="new_password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={step2Values.new_password}
              onChange={handleStep2Change}
              placeholder="Strong password"
              className={`${inputClass(Boolean(errors.new_password))} pr-9`}
            />
            <EyeToggle
              show={showPassword}
              onToggle={() => setShowPassword((v) => !v)}
            />
          </div>
          {errors.new_password ? (
            <p className={errorClass}>{errors.new_password}</p>
          ) : (
            <p className="mt-1 text-[11px] text-gray-400">
              8+ chars · uppercase · lowercase · number · special
            </p>
          )}
        </div>

        {/* Confirm new password */}
        <div>
          <label htmlFor="new_password_repeat" className={labelClass}>
            Confirm New Password <span className="text-violet-500">*</span>
          </label>
          <div className="relative">
            <input
              id="new_password_repeat"
              name="new_password_repeat"
              type={showPasswordRepeat ? "text" : "password"}
              autoComplete="new-password"
              value={step2Values.new_password_repeat}
              onChange={handleStep2Change}
              placeholder="Re-enter password"
              className={`${inputClass(Boolean(errors.new_password_repeat))} pr-9`}
            />
            <EyeToggle
              show={showPasswordRepeat}
              onToggle={() => setShowPasswordRepeat((v) => !v)}
            />
          </div>
          {errors.new_password_repeat && (
            <p className={errorClass}>{errors.new_password_repeat}</p>
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

        {/* Submit */}
        <button
          type="submit"
          disabled={isResetting}
          className="w-full rounded-lg bg-violet-600 hover:bg-violet-700 active:bg-violet-800 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold py-2.5 transition-colors flex items-center justify-center gap-2 shadow-sm shadow-violet-200 cursor-pointer"
        >
          {isResetting ? (
            <>
              <Spinner />
              <span>Resetting…</span>
            </>
          ) : (
            <span>Reset Password</span>
          )}
        </button>

        {/* Back to step 1 — lets the user fix a typo'd email */}
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
          Use a different email
        </button>
      </form>
    </div>
  );
}
