"use client";

// ──────────────────────────────────────────
// Profilefields.tsx
//
// The form fields the profile pages share: a text input (also email, phone and
// date), a select, and a group of address inputs. They are styled alike, so every
// profile form looks the same.
// ──────────────────────────────────────────

import { useId } from "react";

export const INPUT_CLASSES =
  "w-full px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all";

export function TextField({
  label,
  value,
  onChange,
  maxLength,
  required,
  type = "text",
  inputMode,
  placeholder,
  autoComplete,
  max,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  required?: boolean;
  type?: "text" | "email" | "tel" | "date";
  inputMode?: "text" | "email" | "tel" | "numeric";
  placeholder?: string;
  autoComplete?: string;
  // The latest value a date input accepts (YYYY-MM-DD).
  max?: string;
  // A line of guidance under the input.
  hint?: string;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs text-slate-500">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      <input
        id={id}
        type={type}
        inputMode={inputMode}
        placeholder={placeholder}
        autoComplete={autoComplete}
        max={max}
        aria-describedby={hint ? `${id}-hint` : undefined}
        value={value}
        maxLength={maxLength}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className={INPUT_CLASSES}
      />
      {hint && (
        <p id={`${id}-hint`} className="text-[10px] text-slate-400">
          {hint}
        </p>
      )}
    </div>
  );
}

export function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs text-slate-500">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`cursor-pointer ${INPUT_CLASSES}`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// The five fields of one address, residential ("r") or office ("o").

// One address block: a titled group of text inputs. The caller says which inputs it
// has (the user profile has a district, the student profile an LGA), so the group
// fits any form whose values are strings.
export function AddressFields<K extends string>({
  title,
  fields,
  values,
  onChange,
}: {
  title: string;
  fields: { name: K; label: string; maxLength: number }[];
  values: Record<K, string>;
  onChange: (name: K, value: string) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {title}
      </legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map(({ name, label, maxLength }) => (
          <TextField
            key={name}
            label={label}
            value={values[name]}
            maxLength={maxLength}
            onChange={(value) => onChange(name, value)}
          />
        ))}
      </div>
    </fieldset>
  );
}
