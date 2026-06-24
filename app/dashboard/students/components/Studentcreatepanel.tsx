"use client";

// ─────────────────────────────────────────────────────────────────────────────
// StudentCreatePanel.tsx
//
// Slide-in panel for creating a new student.
//
// Backend reference (StudentSerializer — POST student/list/):
//   Required fields: first_name, last_name, gender, current_school
//   Optional fields: middle_name, email, phone, dob, reg_numb, boarding
//                    (plus address fields not surfaced in this minimal form)
//   Phone format:    E.164 — must start with + (e.g. +2348012345678)
//                    Backend regex: ^\+\d{7,15}$
//   public_id:       auto-generated server-side
//   Initial status:  inactive — flips to active once the student is assigned
//                    to a class arm
//
// Data layer:
//   useMutation calls clientAuthFetch with POST student/list/. Optional
//   fields are conditionally included so empty strings are not sent (the
//   backend's regex validators would reject "" for email / phone / etc).
//   Backend field-level validation errors (e.g. "phone": ["Already in use."])
//   are merged back into the form's inline error state so the user sees them
//   under the relevant input — non-field errors fall back to a toast.
//   On success the students and stats query caches are invalidated so both
//   StudentList and StudentStatsBar refresh.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, ChangeEvent } from "react";
import { ChevronLeft, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "react-toastify";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useClientAuthFetch } from "@/lib/Useclientauthfetch";
import ButtonLoader from "../../components/Buttonloader";

// ── Constants ─────────────────────────────────────────────────────────────────

const SCHOOL_ID = process.env.NEXT_PUBLIC_SCHOOL_ID ?? "";

// ── Validation — mirrors backend StudentSerializer rules ──────────────────────
const REGEX = {
  name: /^[a-zA-Z-_ ]{2,32}$/,
  email: /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/,
  // E.164: + then 7–15 digits
  phone: /^\+\d{7,15}$/,
  // Registration number — alphanumeric with optional dashes/slashes, 3–32 chars
  reg_numb: /^[a-zA-Z0-9-/]{3,32}$/,
};

type FormField =
  | "first_name"
  | "last_name"
  | "middle_name"
  | "email"
  | "phone"
  | "gender"
  | "dob"
  | "reg_numb";

interface FormValues {
  first_name: string;
  last_name: string;
  middle_name: string;
  email: string;
  phone: string;
  gender: "M" | "F" | "O" | "";
  dob: string;
  reg_numb: string;
  boarding: boolean;
}

const INITIAL_VALUES: FormValues = {
  first_name: "",
  last_name: "",
  middle_name: "",
  email: "",
  phone: "",
  gender: "",
  dob: "",
  reg_numb: "",
  boarding: false,
};

// Validates all fields and returns a map of field-name → error message.
// Empty optional fields don't produce errors; only invalid filled-in ones do.
function validate(values: FormValues): Partial<Record<FormField, string>> {
  const errors: Partial<Record<FormField, string>> = {};

  if (!REGEX.name.test(values.first_name))
    errors.first_name = "2–32 letters only.";
  if (!REGEX.name.test(values.last_name))
    errors.last_name = "2–32 letters only.";
  if (values.middle_name && !REGEX.name.test(values.middle_name))
    errors.middle_name = "2–32 letters only.";
  if (values.email && !REGEX.email.test(values.email))
    errors.email = "Enter a valid email address.";
  if (values.phone && !REGEX.phone.test(values.phone))
    errors.phone = "Must be E.164 format, e.g. +2348012345678.";
  if (!values.gender) errors.gender = "Please select a gender.";
  if (!values.dob) errors.dob = "Please select a date of birth.";
  if (values.reg_numb && !REGEX.reg_numb.test(values.reg_numb))
    errors.reg_numb = "3–32 chars; letters, digits, '-' or '/'.";

  return errors;
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface StudentCreatePanelProps {
  show: boolean;
  onClose: () => void;
}

export default function StudentCreatePanel({
  show,
  onClose,
}: StudentCreatePanelProps) {
  const queryClient = useQueryClient();
  const { clientAuthFetch } = useClientAuthFetch();

  // ── Form state ─────────────────────────────────────────────────────────────
  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<Partial<Record<FormField, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<FormField, boolean>>>(
    {},
  );

  // ── Mutation ───────────────────────────────────────────────────────────────
  const { mutate: createStudentMutation, isPending } = useMutation({
    mutationFn: async (payload: FormValues) => {
      const { data, error } = await clientAuthFetch<{
        message: string;
        data?: Record<string, string[]>;
      }>("student/list/", {
        method: "POST",
        body: {
          // Required fields — the form gate (canSubmit) guarantees these are present
          first_name: payload.first_name,
          last_name: payload.last_name,
          gender: payload.gender,
          dob: payload.dob,
          boarding: payload.boarding,
          current_school: SCHOOL_ID,
          // Optional fields — only sent when non-empty so the backend's
          // regex validators do not reject blank strings.
          ...(payload.middle_name ? { middle_name: payload.middle_name } : {}),
          ...(payload.email ? { email: payload.email } : {}),
          ...(payload.phone ? { phone: payload.phone } : {}),
          ...(payload.reg_numb ? { reg_numb: payload.reg_numb } : {}),
        },
      });

      // Throw a structured payload so onError can show field errors inline
      // and fall back to a toast for anything that is not field-keyed.
      if (error) {
        throw { message: error.message, fieldErrors: error.data ?? {} };
      }

      return data;
    },

    onSuccess: () => {
      toast.success("Student created successfully.");

      setValues(INITIAL_VALUES);
      setErrors({});
      setTouched({});

      // Invalidate list + stats so both refresh with the new record.
      // The broader ["students", SCHOOL_ID] prefix covers all page/filter variants.
      queryClient.invalidateQueries({ queryKey: ["students", SCHOOL_ID] });
      queryClient.invalidateQueries({ queryKey: ["student-stats", SCHOOL_ID] });

      onClose();
    },

    onError: (err: any) => {
      const fieldErrors: Record<string, string[]> = err?.fieldErrors ?? {};
      const generalMessage: string =
        err?.message ?? "Student creation failed. Please try again.";

      // Merge backend field errors into inline validation state so each
      // message appears under the matching input — same visual pattern as
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
        "dob",
        "reg_numb",
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

      // Toast for non-field errors or when the backend gave no field detail.
      if (!hasFieldError) {
        toast.error(generalMessage);
      }
    },
  });

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value, type } = e.target;
    // Checkbox values come through as `checked`, everything else as `value`
    const next =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    setValues((prev) => ({ ...prev, [name]: next }));
    if (errors[name as FormField]) {
      setErrors((prev) => {
        const cleaned = { ...prev };
        delete cleaned[name as FormField];
        return cleaned;
      });
    }
  }

  function handleBlur(field: FormField) {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const fieldError = validate(values)[field];
    setErrors((prev) => {
      if (fieldError) return { ...prev, [field]: fieldError };
      const cleaned = { ...prev };
      delete cleaned[field];
      return cleaned;
    });
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
        dob: true,
        reg_numb: true,
      });
      return;
    }

    createStudentMutation(values);
  }

  function handleCancel() {
    setValues(INITIAL_VALUES);
    setErrors({});
    setTouched({});
    onClose();
  }

  // Required-field gate for the submit button. Optional fields are only checked
  // when they have a value (validate() handles that nuance).
  const canSubmit =
    REGEX.name.test(values.first_name) &&
    REGEX.name.test(values.last_name) &&
    !!values.gender &&
    !!values.dob &&
    (!values.middle_name || REGEX.name.test(values.middle_name)) &&
    (!values.email || REGEX.email.test(values.email)) &&
    (!values.phone || REGEX.phone.test(values.phone)) &&
    (!values.reg_numb || REGEX.reg_numb.test(values.reg_numb));

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
          className="cursor-pointer flex items-center gap-1 text-xs text-red-600 hover:text-red-700 my-5 md:my-8 transition-all hover:scale-105 w-fit"
        >
          <ChevronLeft size={14} />
          <span>Back</span>
        </button>

        {/* Panel card */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm mb-10 text-black">
          {/* Header */}
          <div className="bg-slate-100 border-b border-slate-200 px-5 py-4">
            <h2 className="text-sm font-bold text-slate-800">Create Student</h2>
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
              type="email"
              placeholder="mail@example.com"
              value={values.email}
              error={touched.email ? errors.email : undefined}
              isValid={
                !!values.email &&
                touched.email &&
                !errors.email &&
                REGEX.email.test(values.email)
              }
              onChange={handleChange}
              onBlur={() => handleBlur("email")}
            />
            {/* Phone — optional, but must be E.164 when provided */}
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

            {/* Date of birth — required */}
            <Field
              id="dob"
              label="Date of Birth"
              required
              type="date"
              value={values.dob}
              error={touched.dob ? errors.dob : undefined}
              isValid={!!values.dob && touched.dob && !errors.dob}
              onChange={handleChange}
              onBlur={() => handleBlur("dob")}
            />

            {/* Registration number */}
            <Field
              id="reg_numb"
              label="Registration No."
              placeholder="e.g. REG-2024-001"
              value={values.reg_numb}
              error={touched.reg_numb ? errors.reg_numb : undefined}
              isValid={
                !!values.reg_numb &&
                touched.reg_numb &&
                !errors.reg_numb &&
                REGEX.reg_numb.test(values.reg_numb)
              }
              onChange={handleChange}
              onBlur={() => handleBlur("reg_numb")}
            />

            {/* Boarding — boolean toggle */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-500">
                Boarding Status
              </label>
              <label className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-xl bg-white cursor-pointer hover:border-violet-300 transition-colors">
                <input
                  type="checkbox"
                  name="boarding"
                  checked={values.boarding}
                  onChange={handleChange}
                  className="accent-violet-600"
                />
                <span className="text-xs text-slate-600">
                  Student is a boarder
                </span>
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 bg-slate-50 border-t border-slate-100 px-5 py-4">
            <button
              onClick={handleCancel}
              disabled={isPending}
              className="cursor-pointer px-4 py-2 text-xs border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || isPending}
              className="cursor-pointer relative flex items-center justify-center gap-2 px-4 py-2 text-xs bg-violet-600 text-white rounded-xl hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm shadow-violet-200"
            >
              <span className={isPending ? "invisible" : ""}>
                Create Student
              </span>
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
