"use client";

// ─────────────────────────────────────────────────────────────────────────────
// StaffCreatePanel.tsx
//
// Slide-in panel for creating a new staff member.
//
// Backend reference (CustomUserSerializer — POST users/list/):
//   Required fields: first_name, last_name, email, gender,
//                    joined_as ("staff" — fixed), school_id (from env),
//                    created_by (active admin's user_id from session claims)
//   Optional fields: middle_name, phone
//   Phone format:    E.164 — must start with + (e.g. +2348012345678)
//                    Backend regex: ^\+\d{1,3}\d{7,15}$
//
//   Success (201): { message, data: { id, public_id, first_name, ... } }
//   Error   (400): { message, data: { field: ["error text", ...] } }
//
// Data layer:
//   useMutation handles the POST request. On success the staff and stats
//   query caches are invalidated so both StaffList and StaffStatsBar refresh.
//   The Create button carries the loading spinner; no overlay is used.
//   Field-level backend errors are merged into the inline validation state.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, ChangeEvent } from "react";
import { ChevronLeft, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "react-toastify";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useClientAuthFetch } from "@/lib/Useclientauthfetch";
import ButtonLoader from "../../components/Buttonloader";

// ── Constants ─────────────────────────────────────────────────────────────────

const SCHOOL_ID = process.env.NEXT_PUBLIC_SCHOOL_ID ?? "";

// ── Validation — mirrors backend CustomUserSerializer rules ───────────────────

const REGEX = {
  name: /^[a-zA-Z-_]{2,32}$/,
  email: /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/,
  // E.164: + then 1–3 digit country code then 7–15 digits
  phone: /^\+\d{1,3}\d{7,15}$/,
};

type FormField =
  | "first_name"
  | "last_name"
  | "middle_name"
  | "email"
  | "phone"
  | "gender";

interface FormValues {
  first_name: string;
  last_name: string;
  middle_name: string;
  email: string;
  phone: string; // stored with leading "+" (E.164)
  gender: "M" | "F" | "O" | "";
}

const INITIAL_VALUES: FormValues = {
  first_name: "",
  last_name: "",
  middle_name: "",
  email: "",
  phone: "",
  gender: "",
};

function validate(values: FormValues): Partial<Record<FormField, string>> {
  const errors: Partial<Record<FormField, string>> = {};

  if (!REGEX.name.test(values.first_name))
    errors.first_name = "2–32 letters only.";
  if (!REGEX.name.test(values.last_name))
    errors.last_name = "2–32 letters only.";
  if (values.middle_name && !REGEX.name.test(values.middle_name))
    errors.middle_name = "2–32 letters only.";
  if (!REGEX.email.test(values.email))
    errors.email = "Enter a valid email address.";
  if (values.phone && !REGEX.phone.test(values.phone))
    errors.phone = "Must be E.164 format, e.g. +2348012345678.";
  if (!values.gender) errors.gender = "Please select a gender.";

  return errors;
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface StaffCreatePanelProps {
  show: boolean;
  onClose: () => void;
}

export default function StaffCreatePanel({
  show,
  onClose,
}: StaffCreatePanelProps) {
  const queryClient = useQueryClient();
  const { clientAuthFetch } = useClientAuthFetch();

  // Read the active admin's user_id from the session JWT claims.
  // session.accessClaims is decoded from the backend-issued access token;
  // user_id is embedded in the token payload by CustomJWTSerializer.
  const { data: session } = useSession();
  const createdBy = session?.accessClaims?.user_id ?? "";

  // ── Form state ─────────────────────────────────────────────────────────────
  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<Partial<Record<FormField, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<FormField, boolean>>>(
    {},
  );

  // ── Mutation ───────────────────────────────────────────────────────────────
  const { mutate: createStaff, isPending } = useMutation({
    mutationFn: async (payload: FormValues) => {
      const { data, error } = await clientAuthFetch<{
        message: string;
        data: Record<string, string[]>;
      }>("users/list/", {
        method: "POST",
        body: {
          // User-supplied fields
          first_name: payload.first_name,
          last_name: payload.last_name,
          ...(payload.middle_name ? { middle_name: payload.middle_name } : {}),
          email: payload.email,
          ...(payload.phone ? { phone: payload.phone } : {}),
          gender: payload.gender,

          // Hidden fields — fixed values not exposed in the form
          joined_as: "staff",
          school_id: SCHOOL_ID,
          created_by: createdBy,
        },
      });

      // Surface the raw response so onError can inspect field-level errors
      if (error) {
        throw { message: error.message, fieldErrors: error.data ?? {} };
      }

      return data;
    },

    onSuccess: () => {
      toast.success("Staff created successfully.");

      // Reset form state
      setValues(INITIAL_VALUES);
      setErrors({});
      setTouched({});

      // Invalidate staff list and stats so both refresh with the new record.
      // The broader ["staff", SCHOOL_ID] prefix covers all page/filter variants.
      queryClient.invalidateQueries({ queryKey: ["staff", SCHOOL_ID] });
      queryClient.invalidateQueries({ queryKey: ["staff-stats", SCHOOL_ID] });

      onClose();
    },

    onError: (err: any) => {
      const fieldErrors: Record<string, string[]> = err?.fieldErrors ?? {};
      const generalMessage: string =
        err?.message ?? "Staff creation failed. Please try again.";

      // Merge field-level backend errors into inline validation state so the
      // user sees them next to the relevant input — same visual pattern as
      // client-side validation errors.
      const mergedErrors: Partial<Record<FormField, string>> = {};
      const mergedTouched: Partial<Record<FormField, boolean>> = { ...touched };

      const knownFields: FormField[] = [
        "first_name",
        "last_name",
        "middle_name",
        "email",
        "phone",
        "gender",
      ];

      let hasFieldError = false;
      for (const field of knownFields) {
        if (fieldErrors[field]?.length) {
          mergedErrors[field] = fieldErrors[field][0];
          mergedTouched[field] = true;
          hasFieldError = true;
        }
      }

      if (Object.keys(mergedErrors).length > 0) {
        setErrors((prev) => ({ ...prev, ...mergedErrors }));
        setTouched(mergedTouched);
      }

      // Show a toast for non-field errors or when no field errors were surfaced
      if (!hasFieldError) {
        toast.error(generalMessage);
      }
    },
  });

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    if (errors[name as FormField]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name as FormField];
        return next;
      });
    }
  }

  function handleBlur(field: FormField) {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const fieldError = validate(values)[field];
    setErrors((prev) => ({
      ...prev,
      ...(fieldError
        ? { [field]: fieldError }
        : (() => {
            const n = { ...prev };
            delete n[field];
            return n;
          })()),
    }));
  }

  function handleSubmit() {
    const allErrors = validate(values);
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      setTouched({
        first_name: true,
        last_name: true,
        middle_name: true,
        email: true,
        phone: true,
        gender: true,
      });
      return;
    }

    createStaff(values);
  }

  function handleCancel() {
    setValues(INITIAL_VALUES);
    setErrors({});
    setTouched({});
    onClose();
  }

  const canSubmit =
    REGEX.name.test(values.first_name) &&
    REGEX.name.test(values.last_name) &&
    REGEX.email.test(values.email) &&
    !!values.gender &&
    (!values.phone || REGEX.phone.test(values.phone));

  return (
    <div
      className={`transition-all duration-500 ease-in-out overflow-hidden ${
        show ? "w-full opacity-100" : "w-0 opacity-0 h-0"
      }`}
    >
      <div className="w-full">
        {/* Back link */}
        <button
          onClick={handleCancel}
          className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 my-5 md:my-8 transition-all hover:scale-105 w-fit"
        >
          <ChevronLeft size={14} />
          <span>Back</span>
        </button>

        {/* Panel card */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm mb-10 text-black">
          {/* Header */}
          <div className="bg-slate-100 border-b border-slate-200 px-5 py-4">
            <h2 className="text-sm font-bold text-slate-800">Create Staff</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Fields marked <span className="text-red-500 font-medium">*</span>{" "}
              are required.
            </p>
          </div>

          {/* Form fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-5 py-6">
            <Field
              id="first_name"
              label="First Name"
              required
              placeholder="e.g. Amara"
              value={values.first_name}
              error={touched.first_name ? errors.first_name : undefined}
              isValid={
                touched.first_name &&
                !errors.first_name &&
                REGEX.name.test(values.first_name)
              }
              onChange={handleChange}
              onBlur={() => handleBlur("first_name")}
            />
            <Field
              id="last_name"
              label="Last Name"
              required
              placeholder="e.g. Okafor"
              value={values.last_name}
              error={touched.last_name ? errors.last_name : undefined}
              isValid={
                touched.last_name &&
                !errors.last_name &&
                REGEX.name.test(values.last_name)
              }
              onChange={handleChange}
              onBlur={() => handleBlur("last_name")}
            />
            <Field
              id="middle_name"
              label="Middle Name"
              placeholder="Optional"
              value={values.middle_name}
              error={touched.middle_name ? errors.middle_name : undefined}
              isValid={
                !!values.middle_name &&
                touched.middle_name &&
                !errors.middle_name
              }
              onChange={handleChange}
              onBlur={() => handleBlur("middle_name")}
            />
            <Field
              id="email"
              label="Email Address"
              required
              type="email"
              placeholder="mail@example.com"
              value={values.email}
              error={touched.email ? errors.email : undefined}
              isValid={
                touched.email && !errors.email && REGEX.email.test(values.email)
              }
              onChange={handleChange}
              onBlur={() => handleBlur("email")}
            />
            {/*
              Phone — optional, but must be E.164 when provided.
              The backend validates: ^\+\d{1,3}\d{7,15}$
              User must type the "+" themselves; the field does not inject it.
              This prevents double "+" (the field value is stored and sent as-is).
            */}
            <Field
              id="phone"
              label="Phone Number"
              placeholder="+2348012345678"
              hint="International format starting with +"
              value={values.phone}
              error={touched.phone ? errors.phone : undefined}
              isValid={
                !!values.phone &&
                touched.phone &&
                !errors.phone &&
                REGEX.phone.test(values.phone)
              }
              onChange={handleChange}
              onBlur={() => handleBlur("phone")}
            />

            {/* Gender — required */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor="gender"
                className="flex items-center gap-1 text-xs font-medium text-slate-500"
              >
                Gender <span className="text-red-500">*</span>
              </label>
              <select
                id="gender"
                name="gender"
                value={values.gender}
                onChange={handleChange}
                onBlur={() => handleBlur("gender")}
                className={`w-full border rounded-xl px-3 py-2 text-xs outline-none transition-all bg-white appearance-none cursor-pointer
                  ${
                    touched.gender && errors.gender
                      ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                      : "border-slate-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                  }`}
              >
                <option value="">— Select —</option>
                <option value="M">Male</option>
                <option value="F">Female</option>
                <option value="O">Other</option>
              </select>
              {touched.gender && errors.gender && (
                <p className="text-[10px] text-red-500 mt-0.5">
                  {errors.gender}
                </p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 bg-slate-50 border-t border-slate-100 px-5 py-4">
            <button
              onClick={handleCancel}
              disabled={isPending}
              className="px-4 py-2 text-xs border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || isPending}
              className="relative flex items-center justify-center gap-2 px-4 py-2 text-xs bg-violet-600 text-white rounded-xl hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm shadow-violet-200"
            >
              {/* Label — invisible (but still occupies space) while pending */}
              <span className={isPending ? "invisible" : ""}>Create Staff</span>
              {/* Loader — absolutely centred, invisible (but still occupies space) when idle */}
              <span
                className={`absolute inset-0 flex items-center justify-center ${isPending ? "" : "invisible"}`}
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

// ── Reusable text input ────────────────────────────────────────────────────────
function Field({
  id,
  label,
  required,
  type = "text",
  placeholder,
  hint,
  value,
  error,
  isValid,
  onChange,
  onBlur,
}: {
  id: FormField;
  label: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
  hint?: string;
  value: string;
  error?: string;
  isValid?: boolean;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onBlur: () => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={id}
        className="flex items-center gap-1.5 text-xs font-medium text-slate-500"
      >
        {label}
        {required && <span className="text-red-500">*</span>}
        {isValid && <CheckCircle2 size={12} className="text-emerald-500" />}
        {error && <XCircle size={12} className="text-red-400" />}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        className={`w-full border rounded-xl px-3 py-2 text-xs outline-none transition-all bg-white
          ${
            error
              ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
              : "border-slate-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
          }`}
      />
      {hint && !error && (
        <p className="text-[10px] text-slate-400 mt-0.5">{hint}</p>
      )}
      {error && <p className="text-[10px] text-red-500 mt-0.5">{error}</p>}
    </div>
  );
}
