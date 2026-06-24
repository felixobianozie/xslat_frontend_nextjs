"use client";

import { useState, ChangeEvent } from "react";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import publicFetch from "@/lib/Publicfetch";
import { useRouter } from "next/navigation";

type FormValues = {
  first_name: string;
  last_name: string;
  middle_name: string;
  email: string;
  phone: string;
  password: string;
  password_repeat: string;
  gender: string;
  joined_as: string;
};

type FormErrors = Partial<Record<keyof FormValues | "agree_to_terms", string>>;

const INITIAL_VALUES: FormValues = {
  first_name: "",
  last_name: "",
  middle_name: "",
  email: "",
  phone: "",
  password: "",
  password_repeat: "",
  gender: "",
  joined_as: "",
};

const GENDER_OPTIONS = [
  { value: "M", label: "Male" },
  { value: "F", label: "Female" },
  { value: "O", label: "Other" },
];

const JOINED_AS_OPTIONS = [
  { value: "general", label: "General" },
  { value: "student", label: "Student" },
  { value: "staff", label: "Staff" },
  { value: "guardian", label: "Guardian / Parent" },
  { value: "alumni", label: "Alumni" },
];

const PHONE_REGEX = /^\+\d{8,16}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(values: FormValues, agreedToTerms: boolean): FormErrors {
  const errors: FormErrors = {};

  if (!values.first_name.trim()) {
    errors.first_name = "First name is required.";
  } else if (values.first_name.trim().length < 2) {
    errors.first_name = "Must be at least 2 characters.";
  }

  if (!values.last_name.trim()) {
    errors.last_name = "Last name is required.";
  } else if (values.last_name.trim().length < 2) {
    errors.last_name = "Must be at least 2 characters.";
  }

  if (!values.email.trim()) {
    errors.email = "Email is required.";
  } else if (!EMAIL_REGEX.test(values.email.trim())) {
    errors.email = "Enter a valid email address.";
  }

  if (!values.phone.trim()) {
    errors.phone = "Phone number is required.";
  } else if (!PHONE_REGEX.test(values.phone.trim())) {
    errors.phone = "Use E.164 format, e.g. +2348012345678.";
  }

  if (!values.password) {
    errors.password = "Password is required.";
  } else if (values.password.length < 8) {
    errors.password = "Must be at least 8 characters.";
  } else if (
    !/[A-Z]/.test(values.password) ||
    !/[a-z]/.test(values.password) ||
    !/[0-9]/.test(values.password) ||
    !/[^A-Za-z0-9]/.test(values.password)
  ) {
    errors.password =
      "Must contain at least one uppercase letter, one lowercase letter, one number, and one special character.";
  }

  if (!values.password_repeat) {
    errors.password_repeat = "Please confirm your password.";
  } else if (values.password && values.password !== values.password_repeat) {
    errors.password_repeat = "Passwords do not match.";
  }

  if (!values.gender) errors.gender = "Required.";
  if (!values.joined_as) errors.joined_as = "Required.";
  if (!agreedToTerms)
    errors.agree_to_terms = "You must agree to the terms to continue.";

  return errors;
}

export default function SignupForm() {
  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordRepeat, setShowPasswordRepeat] = useState(false);
  const router = useRouter();

  // Abort requests that exceed this duration — falls back to 15s if the env variable is missing
  const TIMEOUT_MS =
    Number(process.env.NEXT_PUBLIC_REQUEST_TIMEOUT_MS) || 15000;

  const mutation = useMutation({
    mutationFn: async (payload: Record<string, any>) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      try {
        const response = await publicFetch("users/list/", {
          method: "POST",
          body: payload,
          signal: controller.signal,
        });
        if (response.error) throw response.error;
        return response.data;
      } finally {
        clearTimeout(timeoutId);
      }
    },
    onSuccess: () => {
      toast.success(
        "Account created! Please check your email to verify your address.",
      );
      setValues(INITIAL_VALUES);
      setAgreedToTerms(false);
      setErrors({});
      // router.push("/contact-validation");
      setTimeout(() => router.push("/contact-validation"), 2000); // I want the user to read the toast a bit before redirection
    },
    onError: (err: any) => {
      toast.error(err?.message ?? "Something went wrong. Please try again.");
      if (err?.data && typeof err.data === "object") {
        const fieldErrors: FormErrors = {};
        for (const [field, msgs] of Object.entries(err.data)) {
          if (field in INITIAL_VALUES && Array.isArray(msgs)) {
            fieldErrors[field as keyof FormValues] = msgs.join(" ");
          }
        }
        if (Object.keys(fieldErrors).length > 0) {
          setErrors((prev) => ({ ...prev, ...fieldErrors }));
        }
      }
    },
  });

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name as keyof FormErrors];
        return next;
      });
    }
  }

  function handleTermsChange(e: ChangeEvent<HTMLInputElement>) {
    const checked = e.target.checked;
    setAgreedToTerms(checked);
    if (checked && errors.agree_to_terms) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.agree_to_terms;
        return next;
      });
    }
  }

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const validationErrors = validate(values, agreedToTerms);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    const schoolId = process.env.NEXT_PUBLIC_SCHOOL_ID;
    if (!schoolId) {
      toast.error(
        "Setup error: school ID is missing. Please contact the administrator.",
      );
      return;
    }
    const payload: Record<string, any> = {
      first_name: values.first_name.trim(),
      last_name: values.last_name.trim(),
      email: values.email.trim().toLowerCase(),
      phone: values.phone.trim(),
      password: values.password,
      gender: values.gender,
      joined_as: values.joined_as,
      school_id: schoolId,
    };
    if (values.middle_name.trim()) {
      payload.middle_name = values.middle_name.trim();
    }
    mutation.mutate(payload);
  }

  // ── Shared style helpers (light theme) ──
  function inputClass(hasError: boolean) {
    const base =
      "w-full rounded-lg px-3 py-2.5 text-sm text-gray-900 outline-none transition-all bg-gray-50 placeholder:text-gray-400 border";
    return hasError
      ? `${base} border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100`
      : `${base} border-gray-200 hover:border-gray-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-100`;
  }

  const isSubmitting = mutation.isPending;

  const labelClass =
    "block text-[11px] font-semibold text-gray-500 mb-1 uppercase tracking-wider";
  const errorClass = "mt-1 text-[11px] text-red-500";

  // Eye icon toggle button (reused twice)
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

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} noValidate className="space-y-3">
        {/* ── Row 1: First | Last ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label htmlFor="first_name" className={labelClass}>
              First Name <span className="text-violet-500">*</span>
            </label>
            <input
              id="first_name"
              name="first_name"
              type="text"
              autoComplete="given-name"
              value={values.first_name}
              onChange={handleChange}
              placeholder="Jane"
              className={inputClass(Boolean(errors.first_name))}
            />
            {errors.first_name && (
              <p className={errorClass}>{errors.first_name}</p>
            )}
          </div>
          <div>
            <label htmlFor="last_name" className={labelClass}>
              Last Name <span className="text-violet-500">*</span>
            </label>
            <input
              id="last_name"
              name="last_name"
              type="text"
              autoComplete="family-name"
              value={values.last_name}
              onChange={handleChange}
              placeholder="Doe"
              className={inputClass(Boolean(errors.last_name))}
            />
            {errors.last_name && (
              <p className={errorClass}>{errors.last_name}</p>
            )}
          </div>
        </div>
        {/* ── Middle name ── */}
        <div>
          <label htmlFor="middle_name" className={labelClass}>
            Middle Name{" "}
            <span className="ml-1 text-gray-400 font-normal normal-case tracking-normal">
              (optional)
            </span>
          </label>
          <input
            id="middle_name"
            name="middle_name"
            type="text"
            autoComplete="additional-name"
            value={values.middle_name}
            onChange={handleChange}
            placeholder="Marie"
            className={inputClass(false)}
          />
        </div>
        {/* ── Row 2: Email | Phone ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label htmlFor="email" className={labelClass}>
              Email <span className="text-violet-500">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={values.email}
              onChange={handleChange}
              placeholder="jane@example.com"
              className={inputClass(Boolean(errors.email))}
            />
            {errors.email && <p className={errorClass}>{errors.email}</p>}
          </div>
          <div>
            <label htmlFor="phone" className={labelClass}>
              Phone <span className="text-violet-500">*</span>
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              value={values.phone}
              onChange={handleChange}
              placeholder="+2348012345678"
              className={inputClass(Boolean(errors.phone))}
            />
            {errors.phone && <p className={errorClass}>{errors.phone}</p>}
          </div>
        </div>
        {/* ── Row 3: Gender | Register As ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label htmlFor="gender" className={labelClass}>
              Gender <span className="text-violet-500">*</span>
            </label>
            <div className="relative">
              <select
                id="gender"
                name="gender"
                value={values.gender}
                onChange={handleChange}
                className={`${inputClass(Boolean(errors.gender))} appearance-none cursor-pointer pr-9 ${
                  values.gender ? "text-gray-900" : "text-gray-400"
                }`}
              >
                <option value="" disabled className="bg-white text-gray-400">
                  Select…
                </option>
                {GENDER_OPTIONS.map((opt) => (
                  <option
                    key={opt.value}
                    value={opt.value}
                    className="bg-white text-gray-900"
                  >
                    {opt.label}
                  </option>
                ))}
              </select>
              <svg
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                aria-hidden="true"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
            {errors.gender && <p className={errorClass}>{errors.gender}</p>}
          </div>

          <div>
            <label htmlFor="joined_as" className={labelClass}>
              Register As <span className="text-violet-500">*</span>
            </label>
            <div className="relative">
              <select
                id="joined_as"
                name="joined_as"
                value={values.joined_as}
                onChange={handleChange}
                className={`${inputClass(Boolean(errors.joined_as))} appearance-none cursor-pointer pr-9 ${
                  values.joined_as ? "text-gray-900" : "text-gray-400"
                }`}
              >
                <option value="" disabled className="bg-white text-gray-400">
                  Select…
                </option>
                {JOINED_AS_OPTIONS.map((opt) => (
                  <option
                    key={opt.value}
                    value={opt.value}
                    className="bg-white text-gray-900"
                  >
                    {opt.label}
                  </option>
                ))}
              </select>
              <svg
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                aria-hidden="true"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
            {errors.joined_as && (
              <p className={errorClass}>{errors.joined_as}</p>
            )}
          </div>
        </div>
        {/* ── Row 4: Password | Repeat Password ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label htmlFor="password" className={labelClass}>
              Password <span className="text-violet-500">*</span>
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={values.password}
                onChange={handleChange}
                placeholder="Strong password"
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

          <div>
            <label htmlFor="password_repeat" className={labelClass}>
              Repeat Password <span className="text-violet-500">*</span>
            </label>
            <div className="relative">
              <input
                id="password_repeat"
                name="password_repeat"
                type={showPasswordRepeat ? "text" : "password"}
                autoComplete="new-password"
                value={values.password_repeat}
                onChange={handleChange}
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
        </div>
        {/* ── Terms of Service ── */}
        <div className="pt-1">
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={handleTermsChange}
              className="mt-0.5 w-4 h-4 rounded accent-violet-600 cursor-pointer shrink-0"
            />
            <span className="text-xs text-gray-500 leading-snug">
              I agree to the{" "}
              <Link
                href="/terms"
                className="text-violet-600 hover:text-violet-700 underline underline-offset-2"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                className="text-violet-600 hover:text-violet-700 underline underline-offset-2"
              >
                Privacy Policy
              </Link>
              . By creating an account, you confirm that the information you
              have provided is accurate.
            </span>
          </label>
          {errors.agree_to_terms && (
            <p className={`${errorClass} ml-6`}>{errors.agree_to_terms}</p>
          )}
        </div>
        {/* ── Submit ── */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full mt-1 rounded-lg bg-violet-600 hover:bg-violet-700 active:bg-violet-800 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold py-2.5 transition-colors flex items-center justify-center gap-2 shadow-sm shadow-violet-200 cursor-pointer"
        >
          {isSubmitting ? (
            <>
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
              <span>Creating account…</span>
            </>
          ) : (
            <span>Create Account</span>
          )}
        </button>
        {/* ── Back link ── */}
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
        {/* ── Footer link ── */}
        <p className="text-center text-xs text-gray-500">
          Already have an account?{" "}
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
