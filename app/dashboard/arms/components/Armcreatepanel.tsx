"use client";

// ─────────────────────────────────────────────────────────────────────────────
// ArmCreatePanel.tsx
//
// Slide-in panel for creating a new class arm.
//
// Backend reference (ArmSerializer — POST arm/list/):
//   Required: name, abbr, level (Level UUID), display_order
//   Optional: class_teacher, ass_class_teacher, score_entry_starts/ends
//
//   Backend validation enforced:
//     - abbr must not contain spaces
//     - name / abbr / display_order must each be unique within the same level
//     - name is auto-title-cased; abbr is auto-uppercased server-side
//
// Data layer:
//   useMutation calls POST arm/list/ via clientAuthFetch. On success the
//   ["arms", SCHOOL_ID] cache is invalidated so the list refreshes. Backend
//   field-level errors are merged into the inline validation state so they
//   appear next to the relevant input — same pattern as StaffCreatePanel.
//
// Reference data:
//   The `levels` prop is server-prefetched in page.tsx (sections in current
//   term → levels per section, flattened). The panel doesn't issue its own
//   reference fetches, which keeps the open transition snappy.
// ─────────────────────────────────────────────────────────────────────────────

import { ChangeEvent, useState } from "react";
import { CheckCircle2, ChevronLeft, XCircle } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { useClientAuthFetch } from "@/lib/Useclientauthfetch";
import ButtonLoader from "../../components/Buttonloader";
import type { ApiEnvelope } from "../page";

// ── Constants ────────────────────────────────────────────────────────────────

const SCHOOL_ID = process.env.NEXT_PUBLIC_SCHOOL_ID ?? "";

// ── Validation — mirrors backend ArmSerializer rules ─────────────────────────
// These mirror the backend rules so users get feedback before the request
// even leaves the client. The backend re-checks everything, so any drift
// between client and server rules surfaces as a server-side field error.
const REGEX = {
  // 1–32 letters/digits/dashes/underscores; allow spaces for multi-word names
  name: /^[a-zA-Z0-9-_ ]{1,32}$/,
  // 1–10 letters/digits/dashes/underscores; NO spaces (backend rule)
  abbr: /^[a-zA-Z0-9-_]{1,10}$/,
  // 1 or 2 digit non-negative integer for display order
  displayOrder: /^[0-9]{1,2}$/,
};

type FormField = "name" | "abbr" | "level" | "display_order";

interface FormValues {
  name: string;
  abbr: string;
  level: string; // Level UUID
  display_order: string; // Kept as string in form state; coerced on submit
}

const INITIAL_VALUES: FormValues = {
  name: "",
  abbr: "",
  level: "",
  display_order: "",
};

// Returns a map of field → error message. Empty when every value is valid.
function validate(values: FormValues): Partial<Record<FormField, string>> {
  const errors: Partial<Record<FormField, string>> = {};

  if (!REGEX.name.test(values.name)) {
    errors.name =
      "1–32 characters; letters, digits, dashes, underscores or spaces.";
  }
  if (!REGEX.abbr.test(values.abbr)) {
    errors.abbr = "1–10 characters, no spaces.";
  }
  if (!values.level) {
    errors.level = "Please choose a class level.";
  }
  if (!REGEX.displayOrder.test(values.display_order)) {
    errors.display_order = "Whole number, 1–99.";
  }

  return errors;
}

interface ArmCreatePanelProps {
  show: boolean;
  onClose: () => void;
  /** Levels available for the dropdown — server-prefetched in page.tsx. */
  levels: ArmLevel[];
  /** Used to invalidate the right ["arms", SCHOOL_ID, termId] cache on success. */
  currentTermId: string;
}

export default function ArmCreatePanel({
  show,
  onClose,
  levels,
  currentTermId,
}: ArmCreatePanelProps) {
  const queryClient = useQueryClient();
  const { clientAuthFetch } = useClientAuthFetch();

  // Form state — values, validation errors, and which fields the user has
  // touched (so errors only appear after the first interaction).
  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<Partial<Record<FormField, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<FormField, boolean>>>(
    {},
  );

  // ── Mutation: create a new arm ─────────────────────────────────────────────
  const { mutate, isPending } = useMutation({
    mutationFn: async (payload: FormValues) => {
      const { data, error } = await clientAuthFetch<ApiEnvelope<ClassArm>>(
        "arm/list/",
        {
          method: "POST",
          body: {
            name: payload.name,
            abbr: payload.abbr,
            level: payload.level,
            // display_order is sent as a number — backend rejects strings
            // for integer fields.
            display_order: Number(payload.display_order),
          },
        },
      );

      // Re-throw with field-error metadata so onError can wire the messages
      // back into the inline validation state.
      if (error) {
        throw { message: error.message, fieldErrors: error.data ?? {} };
      }
      return data;
    },

    onSuccess: () => {
      toast.success("Class arm created.");
      resetForm();
      // Broad prefix so every cached variant of the arms list refetches.
      queryClient.invalidateQueries({ queryKey: ["arms", SCHOOL_ID] });
      onClose();
    },

    onError: (err: any) => {
      const fieldErrors: Record<string, string[]> = err?.fieldErrors ?? {};
      const message: string =
        err?.message ?? "Could not create class arm. Please try again.";

      // Merge field-level backend errors into inline validation state so the
      // user sees them next to the relevant input — same visual pattern as
      // client-side validation errors.
      const mergedErrors: Partial<Record<FormField, string>> = {};
      const mergedTouched: Partial<Record<FormField, boolean>> = { ...touched };
      for (const key of Object.keys(fieldErrors)) {
        if (key in INITIAL_VALUES) {
          const field = key as FormField;
          mergedErrors[field] = fieldErrors[key].join(" ");
          mergedTouched[field] = true;
        }
      }
      setErrors(mergedErrors);
      setTouched(mergedTouched);
      toast.error(message);
    },
  });

  // ── Handlers ───────────────────────────────────────────────────────────────

  function resetForm() {
    setValues(INITIAL_VALUES);
    setErrors({});
    setTouched({});
  }

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    // Clear the field's error as soon as the user starts editing it again.
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
    setErrors((prev) => {
      const next = { ...prev };
      if (fieldError) {
        next[field] = fieldError;
      } else {
        delete next[field];
      }
      return next;
    });
  }

  function handleSubmit() {
    // Validate the whole form on submit so users can't submit a half-filled form.
    const allErrors = validate(values);
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      setTouched({ name: true, abbr: true, level: true, display_order: true });
      return;
    }
    mutate(values);
  }

  function handleCancel() {
    if (isPending) return;
    resetForm();
    onClose();
  }

  // The form is submittable only when every field is valid.
  const canSubmit =
    !!values.name &&
    !!values.abbr &&
    !!values.level &&
    !!values.display_order &&
    Object.keys(validate(values)).length === 0;

  // Display "Section / Level" in the level dropdown so the user disambiguates
  // levels with the same abbr across sections (e.g. JSS 1 vs SSS 1).
  function levelLabel(level: ArmLevel): string {
    return `${level.section.abbr} ${level.abbr} — ${level.name}`;
  }

  return (
    <div
      className={`transition-all duration-500 ease-in-out overflow-hidden ${
        show ? "w-full opacity-100" : "w-0 opacity-0 h-0"
      }`}
    >
      <div className="w-full">
        {/* Back link — mirrors the staff/student panels */}
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
            <h2 className="text-sm font-bold text-slate-800">
              Create Class Arm
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Fields marked <span className="text-red-500 font-medium">*</span>{" "}
              are required.
            </p>
          </div>

          {/* Form fields — responsive grid: 1 column on mobile, 2 on tablet, 3 on desktop */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-5 py-6">
            <Field
              id="name"
              label="Arm Name"
              required
              placeholder="e.g. Orange"
              value={values.name}
              error={touched.name ? errors.name : undefined}
              isValid={
                touched.name && !errors.name && REGEX.name.test(values.name)
              }
              onChange={handleChange}
              onBlur={() => handleBlur("name")}
            />
            <Field
              id="abbr"
              label="Abbreviation"
              required
              placeholder="e.g. ORNG"
              hint="No spaces. Auto-uppercased."
              value={values.abbr}
              error={touched.abbr ? errors.abbr : undefined}
              isValid={
                touched.abbr && !errors.abbr && REGEX.abbr.test(values.abbr)
              }
              onChange={handleChange}
              onBlur={() => handleBlur("abbr")}
            />
            <Field
              id="display_order"
              label="Display Order"
              required
              type="number"
              placeholder="e.g. 1"
              value={values.display_order}
              error={touched.display_order ? errors.display_order : undefined}
              isValid={
                touched.display_order &&
                !errors.display_order &&
                REGEX.displayOrder.test(values.display_order)
              }
              onChange={handleChange}
              onBlur={() => handleBlur("display_order")}
            />

            {/* Level select — spans 2 cols on tablet so it isn't cramped */}
            <div className="flex flex-col gap-1 md:col-span-2 lg:col-span-3">
              <label
                htmlFor="level"
                className="flex items-center gap-1.5 text-xs font-medium text-slate-500"
              >
                Class Level <span className="text-red-500">*</span>
                {touched.level && values.level && !errors.level && (
                  <CheckCircle2 size={12} className="text-emerald-500" />
                )}
                {touched.level && errors.level && (
                  <XCircle size={12} className="text-red-400" />
                )}
              </label>
              <select
                id="level"
                name="level"
                value={values.level}
                onChange={handleChange}
                onBlur={() => handleBlur("level")}
                disabled={levels.length === 0}
                className={`w-full border rounded-xl px-3 py-2 text-xs outline-none transition-all bg-white appearance-none cursor-pointer disabled:cursor-not-allowed disabled:bg-slate-50 ${
                  touched.level && errors.level
                    ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                    : "border-slate-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                }`}
              >
                <option value="">
                  {levels.length === 0
                    ? "No levels available for this term"
                    : "— Select a level —"}
                </option>
                {levels.map((level) => (
                  <option key={level.id} value={level.id}>
                    {levelLabel(level)}
                  </option>
                ))}
              </select>
              {touched.level && errors.level && (
                <p className="text-[10px] text-red-500 mt-0.5">
                  {errors.level}
                </p>
              )}
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
              {/* Label is hidden but keeps the button width steady while loading */}
              <span className={isPending ? "invisible" : ""}>Create Arm</span>
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
    </div>
  );
}

// ── Reusable text input ──────────────────────────────────────────────────────
// Same shape as the Field used in StaffCreatePanel — kept local for clarity.
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
        className={`w-full border rounded-xl px-3 py-2 text-xs outline-none transition-all bg-white ${
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
