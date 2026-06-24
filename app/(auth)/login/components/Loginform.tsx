"use client";

import { useState, ChangeEvent } from "react";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { signIn } from "next-auth/react";
import publicFetch from "@/lib/Publicfetch";
import { useRouter } from "next/navigation";

// ── Auth user type options ────────────────────────────────────────────────
// Mirrors CustomJWTSerializer.VALID_USER_TYPES on the backend. Order is
// chosen for UX (most common portals first), not alphabetical.
const USER_TYPE_OPTIONS = [
  { value: "staff", label: "Staff" },
  { value: "student", label: "Student" },
  { value: "guardian", label: "Guardian" },
  { value: "alumni", label: "Alumni" },
  { value: "general", label: "General" },
] as const;

type AuthUserType = (typeof USER_TYPE_OPTIONS)[number]["value"];

type FormValues = {
  identifier: string;
  password: string;
  // Empty string represents the unselected placeholder state
  auth_user_type: AuthUserType | "";
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

const INITIAL_VALUES: FormValues = {
  identifier: "",
  password: "",
  auth_user_type: "",
};

// Abort threshold — falls back to 15s if the env variable is missing (matches Signupform)
const TIMEOUT_MS = Number(process.env.NEXT_PUBLIC_REQUEST_TIMEOUT_MS) || 15000;

// School UUID is per-deployment and never user-entered. Read once at module
// scope since NEXT_PUBLIC_* vars are inlined at build time.
const SCHOOL_ID = process.env.NEXT_PUBLIC_SCHOOL_ID;

// Single message shown for every 4xx response from the login endpoint. The
// backend distinguishes "no account", "wrong password", and "unverified
// contact" — we collapse them here so the form's response gives no signal
// about which case applies. Legitimate unverified users reach
// /contact-validation through the persistent footer link, not via the form.
const GENERIC_AUTH_ERROR =
  "Invalid credentials. Please check your details and try again.";

// Shown when SCHOOL_ID is missing for a non-"general" selection. Treated as
// a deployment misconfiguration, not a credentials issue — surfaced clearly
// so users don't waste retries on something they can't fix.
const PORTAL_NOT_CONFIGURED_ERROR =
  "Sign-in is not configured for this portal. Please contact support.";

// ── Validation — kept lax on purpose ───────────────────────────────────────
// Identifier can be email OR phone, and existing accounts may have passwords
// that predate current strength rules. We only enforce presence here and let
// the backend produce the authoritative rejection.
function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};
  if (!values.identifier.trim())
    errors.identifier = "Email or phone is required.";
  if (!values.password) errors.password = "Password is required.";
  if (!values.auth_user_type)
    errors.auth_user_type = "Please choose how you're signing in.";
  return errors;
}

// Build the payload sent to the backend's token endpoint.
//
// auth_school is per-deployment and only relevant when auth_user_type is not
// "general" — the backend ignores it for "general" logins. Omitting it in
// that case means a missing SCHOOL_ID env var won't block general sign-ins.
function buildAuthPayload(values: FormValues) {
  const includeSchool = values.auth_user_type !== "general";

  return {
    identifier: values.identifier.trim(),
    password: values.password,
    auth_user_type: values.auth_user_type,
    ...(includeSchool && SCHOOL_ID ? { auth_school: SCHOOL_ID } : {}),
  };
}

export default function LoginForm() {
  const router = useRouter();

  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);

  // Inline status banner — mirrors the toast message so the user has a
  // persistent reference for the most recent login event.
  const [notice, setNotice] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);

  // ─────────────────────────────────────────────────────────────────────────
  // Login mutation
  // ─────────────────────────────────────────────────────────────────────────
  //
  // Two-stage flow:
  //   1. Pre-flight POST to `token/` via publicFetch — this is the ONLY way
  //      to see the backend's actual error message. NextAuth's
  //      CredentialsProvider in Authoptions returns null on failure, which
  //      collapses every error into the generic string "CredentialsSignin"
  //      and discards the distinction between, e.g. "wrong password" and
  //      "Login requires a verified email address."
  //   2. On a successful pre-flight, hand off to NextAuth's signIn() to
  //      establish the session cookie. signIn() will hit the backend again
  //      with the same credentials — wasteful but harmless, and the only
  //      way to keep error visibility while still letting NextAuth manage
  //      the session.
  //
  const loginMutation = useMutation({
    mutationFn: async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      // Single source of truth for the payload — same shape for both the
      // pre-flight and the NextAuth handoff, so any backend rule that
      // accepts the first call will accept the second.
      const payload = buildAuthPayload(values);

      try {
        // 1) Pre-flight against `token/` to discover the real error shape.
        const probe = await publicFetch("token/", {
          method: "POST",
          body: payload,
          signal: controller.signal,
        });

        if (probe.error) throw probe.error;

        // 2) Hand off to NextAuth to establish the session cookie.
        //    Re-validates against the backend, which will succeed since the
        //    pre-flight just did and no state has changed between the calls.
        //    Extra fields (auth_user_type, auth_school) are forwarded by
        //    Authoptions' authorize() via `body: credentials`.
        const result = await signIn("credentials", {
          redirect: false,
          ...payload,
        });

        // A non-null error here is rare (pre-flight just succeeded) — surface
        // as a transient failure rather than a credentials issue.
        if (result?.error) {
          throw {
            name: "FetchError",
            status: result.status ?? 401,
            message: "Sign-in could not be completed. Please try again.",
            data: null,
          };
        }

        return probe.data;
      } finally {
        clearTimeout(timeoutId);
      }
    },
    onSuccess: () => {
      const message = "Signed in. Redirecting…";
      toast.success(message);
      setNotice({ kind: "success", message });
      router.push("/dashboard");
    },
    onError: (err: any) => {
      // Two error categories deserve different wording:
      //   - Technical failures (network/5xx) — surfaced honestly so the user
      //     can act on them (retry, check connection, contact support).
      //   - Auth rejections (any 4xx from token/) — masked to a single
      //     generic message so the response cannot be used to discriminate
      //     between "no account", "wrong password", and "unverified contact".
      //     The visible footer link gives unverified users a path forward
      //     without us having to confirm their verification state.
      let message: string;

      if (err?.name === "NetworkError") {
        message =
          err.message ??
          "Unable to reach the server. Please check your connection and try again.";
      } else if (typeof err?.status === "number" && err.status >= 500) {
        message =
          "Sign-in is temporarily unavailable. Please try again shortly.";
      } else {
        message = GENERIC_AUTH_ERROR;
      }

      toast.error(message);
      setNotice({ kind: "error", message });
    },
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────────────────────────────────────

  // Accepts both <input> and <select> change events so a single handler
  // works for every field on the form.
  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));

    // Clear the field-level error as the user corrects the input
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name as keyof FormErrors];
        return next;
      });
    }
  }

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const validationErrors = validate(values);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Deployment-level guard: every non-"general" user type requires a
    // configured SCHOOL_ID. If it's missing, the backend would reject with
    // "auth_school is required ..." which would otherwise be masked by
    // GENERIC_AUTH_ERROR and read as a credentials failure to the user.
    if (values.auth_user_type !== "general" && !SCHOOL_ID) {
      toast.error(PORTAL_NOT_CONFIGURED_ERROR);
      setNotice({ kind: "error", message: PORTAL_NOT_CONFIGURED_ERROR });
      console.error(
        "NEXT_PUBLIC_SCHOOL_ID is not set. Required for auth_user_type other than 'general'.",
      );
      return;
    }

    loginMutation.mutate();
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
  const isSubmitting = loginMutation.isPending;

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

  // Eye toggle for the password field — same visual as Signupform
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

  // Chevron icon shown on the right side of the select field.
  // Native select arrows vary by OS, so we hide them with appearance-none
  // (in the select className) and render this one for visual consistency.
  function SelectChevron() {
    return (
      <svg
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
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
        <polyline points="6 9 12 15 18 9" />
      </svg>
    );
  }

  // Inline status banner — mirrors the toast for persistent visibility.
  // Same styling and ARIA pattern as Contactvalidationform.tsx for consistency.
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

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* User type — sets the scope for which portfolio the backend resolves.
            Placed first because it contextualises the credentials below it. */}
        <div>
          <label htmlFor="auth_user_type" className={labelClass}>
            Signing in as <span className="text-violet-500">*</span>
          </label>
          <div className="relative">
            <select
              id="auth_user_type"
              name="auth_user_type"
              value={values.auth_user_type}
              onChange={handleChange}
              className={`${inputClass(Boolean(errors.auth_user_type))} appearance-none pr-9`}
            >
              <option value="" disabled>
                Select user type
              </option>
              {USER_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <SelectChevron />
          </div>
          {errors.auth_user_type && (
            <p className={errorClass}>{errors.auth_user_type}</p>
          )}
        </div>

        {/* Identifier — accepts email OR phone, matches CustomJWTSerializer */}
        <div>
          <label htmlFor="identifier" className={labelClass}>
            Email or Phone <span className="text-violet-500">*</span>
          </label>
          <input
            id="identifier"
            name="identifier"
            type="text"
            autoComplete="username"
            value={values.identifier}
            onChange={handleChange}
            placeholder="jane@example.com or +2348012345678"
            className={inputClass(Boolean(errors.identifier))}
          />
          {errors.identifier && (
            <p className={errorClass}>{errors.identifier}</p>
          )}
        </div>

        {/* Password */}
        <div>
          {/* Label row — pairs the field label with a "Forgot password?" link.
              Overrides labelClass's uppercase/tracking on the link so it reads
              as a normal action, not a label. */}
          <div className="flex items-center justify-between mb-1">
            <label
              htmlFor="password"
              className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider"
            >
              Password <span className="text-violet-500">*</span>
            </label>
            <Link
              href="/password-reset"
              className="text-[11px] font-semibold text-violet-600 hover:text-violet-700"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={values.password}
              onChange={handleChange}
              placeholder="Enter your password"
              className={`${inputClass(Boolean(errors.password))} pr-9`}
            />
            <EyeToggle
              show={showPassword}
              onToggle={() => setShowPassword((v) => !v)}
            />
          </div>
          {errors.password && <p className={errorClass}>{errors.password}</p>}
        </div>

        {/* Inline status banner — mirrors the most recent toast notification */}
        {notice && <Notice kind={notice.kind} message={notice.message} />}

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-violet-600 hover:bg-violet-700 active:bg-violet-800 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold py-2.5 transition-colors flex items-center justify-center gap-2 shadow-sm shadow-violet-200 cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Spinner />
              <span>Signing in…</span>
            </>
          ) : (
            <span>Sign In</span>
          )}
        </button>

        {/* Back to home */}
        <Link
          href="/"
          className="group w-full inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-900 text-sm font-medium py-2.5 transition-colors"
        >
          <svg
            className="transition-transform group-hover:-translate-x-0.5"
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
          Return to home
        </Link>

        {/* Always-visible escape route for unverified users. Visible to
            everyone, not gated on an error — by design, since gating it on
            the verification error would re-introduce the enumeration leak. */}
        <p className="text-center text-xs text-gray-500">
          Haven&apos;t verified your email or phone yet?{" "}
          <Link
            href="/contact-validation"
            className="font-semibold text-violet-600 hover:text-violet-700"
          >
            Verify here
          </Link>
        </p>

        {/* Sign-up link */}
        <p className="text-center text-xs text-gray-500">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="font-semibold text-violet-600 hover:text-violet-700"
          >
            Sign up
          </Link>
        </p>
      </form>
    </div>
  );
}
