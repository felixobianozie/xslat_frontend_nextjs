"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Acceptinviteform.tsx
//
// The form a new staff member uses to accept the invitation an administrator
// sent them. It is a single step: the person enters the 6-digit code from the
// invitation email and chooses a password. Both are sent together to
// POST staff/invite/accept/, which sets the password and marks the email as
// verified in one go. They are then sent to the login page.
//
//   • The email comes from the invitation link and cannot be edited here.
//   • There is no "resend code" button. Only an administrator can send a new
//     invitation, so a person who needs one is told to ask them.
//   • Wrong codes are counted by the backend. After too many it answers 429
//     with a message saying when to try again; the form then locks and tells
//     the person to ask their administrator for a new invitation.
//   • The password rules match the sign-up form: 8+ characters with an
//     uppercase letter, a lowercase letter, a number and a special character.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, ChangeEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import publicFetch from "@/lib/Publicfetch";
import type { ApiError } from "@/lib/Handlefetcherrors";
import CodeInput, { CODE_REGEX } from "../../components/Codeinput";
import StatusNotice from "../../components/Statusnotice";

type Errors = Partial<{
  code: string;
  password: string;
  password_repeat: string;
}>;

// Abort timeout — falls back to 15s if the env variable is missing (matches Signupform)
const TIMEOUT_MS = Number(process.env.NEXT_PUBLIC_REQUEST_TIMEOUT_MS) || 15000;

// How long the success message shows before the person is sent to login
const LOGIN_REDIRECT_DELAY_MS = 1500;

// ─── Small pieces used only by this form ────────────────────────────────────

function inputClass(hasError: boolean) {
  const base =
    "w-full rounded-lg px-3 py-2.5 text-sm text-gray-900 outline-none transition-all bg-gray-50 placeholder:text-gray-400 border disabled:opacity-60 disabled:cursor-not-allowed";
  return hasError
    ? `${base} border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100`
    : `${base} border-gray-200 hover:border-gray-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-100`;
}

const labelClass =
  "block text-[11px] font-semibold text-gray-500 mb-1 uppercase tracking-wider";
const errorClass = "mt-1 text-[11px] text-red-500";

// Small inline spinner used inside the submit button
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

// Eye button that shows or hides a password field
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

// ─── The form ────────────────────────────────────────────────────────────────

interface AcceptInviteFormProps {
  /** The invited email address, taken from the invitation link. */
  email: string;
}

export default function AcceptInviteForm({ email }: AcceptInviteFormProps) {
  const router = useRouter();

  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [passwordRepeat, setPasswordRepeat] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordRepeat, setShowPasswordRepeat] = useState(false);
  const [errors, setErrors] = useState<Errors>({});

  // Message bar under the email recap — mirrors the latest toast
  const [notice, setNotice] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);

  // True once the backend has answered 429, meaning the invitation is locked
  const [locked, setLocked] = useState(false);

  const mutation = useMutation<unknown, ApiError>({
    mutationFn: async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
      try {
        const resp = await publicFetch("staff/invite/accept/", {
          method: "POST",
          body: { email, code: code.trim(), password },
          signal: controller.signal,
        });
        if (resp.error) throw resp.error;
        return resp.data;
      } finally {
        clearTimeout(timeoutId);
      }
    },
    onSuccess: () => {
      const message = "Invitation accepted! Redirecting to login…";
      toast.success(message);
      setNotice({ kind: "success", message });
      setTimeout(() => router.push("/login"), LOGIN_REDIRECT_DELAY_MS);
    },
    onError: (err) => {
      const message =
        err.message ?? "Could not accept the invitation. Please try again.";
      toast.error(message);
      setNotice({ kind: "error", message });
      if (err.status === 429) setLocked(true);
    },
  });

  // Checks the form before sending it
  function validate(): Errors {
    const next: Errors = {};

    if (!code.trim()) {
      next.code = "The invitation code is required.";
    } else if (!CODE_REGEX.test(code.trim())) {
      next.code = "Enter the 6-digit code from your invitation email.";
    }

    if (!password) {
      next.password = "Choose a password.";
    } else if (password.length < 8) {
      next.password = "Must be at least 8 characters.";
    } else if (
      !/[A-Z]/.test(password) ||
      !/[a-z]/.test(password) ||
      !/[0-9]/.test(password) ||
      !/[^A-Za-z0-9]/.test(password)
    ) {
      next.password =
        "Must contain at least one uppercase letter, one lowercase letter, one number, and one special character.";
    }

    if (!passwordRepeat) {
      next.password_repeat = "Please confirm your password.";
    } else if (password !== passwordRepeat) {
      next.password_repeat = "Passwords do not match.";
    }

    return next;
  }

  function handlePasswordChange(
    e: ChangeEvent<HTMLInputElement>,
    field: "password" | "password_repeat",
  ) {
    if (field === "password") setPassword(e.target.value);
    else setPasswordRepeat(e.target.value);

    // Clear the field's error as the person types
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  function handleCodeChange(value: string) {
    setCode(value);
    if (errors.code) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.code;
        return next;
      });
    }
  }

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    mutation.mutate();
  }

  // ── The link has no email ──
  if (!email) {
    return (
      <div className="space-y-4">
        <StatusNotice
          kind="error"
          message="This invitation link is incomplete. Open the link from your invitation email, or ask your administrator to send you a new invitation."
        />
        <div className="text-center text-xs text-gray-500">
          <Link
            href="/login"
            className="font-semibold text-violet-600 hover:text-violet-700 cursor-pointer"
          >
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  // The form stops accepting input while sending, after success, or when locked
  const busy = mutation.isPending || mutation.isSuccess;
  const inputsDisabled = busy || locked;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {/* Recap card — shows which email is being activated */}
      <div className="rounded-lg bg-violet-50 border border-violet-100 px-3 py-2.5">
        <p className="text-[11px] font-semibold text-violet-700 uppercase tracking-wider">
          Activating account for
        </p>
        <p className="text-sm text-gray-900 break-all">{email}</p>
      </div>

      {/* Message bar — mirrors the most recent toast */}
      {notice && <StatusNotice kind={notice.kind} message={notice.message} />}

      {/* Locked — only an administrator can send a new invitation */}
      {locked && (
        <p className="text-xs text-gray-600">
          This invitation is locked. Ask your administrator to send you a new
          invitation.
        </p>
      )}

      {/* 6-digit code */}
      <CodeInput
        value={code}
        onChange={handleCodeChange}
        error={errors.code}
        disabled={inputsDisabled}
      />

      {/* Password */}
      <div>
        <label htmlFor="password" className={labelClass}>
          Choose a Password <span className="text-violet-500">*</span>
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            value={password}
            onChange={(e) => handlePasswordChange(e, "password")}
            placeholder="Choose a password"
            disabled={inputsDisabled}
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

      {/* Confirm password */}
      <div>
        <label htmlFor="password_repeat" className={labelClass}>
          Confirm Password <span className="text-violet-500">*</span>
        </label>
        <div className="relative">
          <input
            id="password_repeat"
            name="password_repeat"
            type={showPasswordRepeat ? "text" : "password"}
            autoComplete="new-password"
            value={passwordRepeat}
            onChange={(e) => handlePasswordChange(e, "password_repeat")}
            placeholder="Re-enter password"
            disabled={inputsDisabled}
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

      {/* Submit */}
      <button
        type="submit"
        disabled={inputsDisabled}
        className="w-full rounded-lg bg-violet-600 hover:bg-violet-700 active:bg-violet-800 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold py-2.5 transition-colors flex items-center justify-center gap-2 shadow-sm shadow-violet-200 cursor-pointer"
      >
        {mutation.isPending ? (
          <>
            <Spinner />
            <span>Activating…</span>
          </>
        ) : (
          <span>Activate My Account</span>
        )}
      </button>

      {/* Help — only an administrator can send a new code */}
      <p className="text-center text-xs text-gray-500">
        Didn’t get a code, or it has expired? Ask your administrator to resend
        your invitation.
      </p>
      <div className="text-center text-xs text-gray-500">
        <Link
          href="/login"
          className="font-semibold text-violet-600 hover:text-violet-700 cursor-pointer"
        >
          Already activated? Log in
        </Link>
      </div>
    </form>
  );
}
