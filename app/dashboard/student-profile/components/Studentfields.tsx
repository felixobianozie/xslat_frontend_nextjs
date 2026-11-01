"use client";

// ──────────────────────────────────────────
// Studentfields.tsx
//
// The inputs of the student profile's edit form for the two sections that are not
// addresses: personal details and contact. The address inputs come from the shared
// AddressFields. Each group is one column on a phone and two from `sm`.
// ──────────────────────────────────────────

import {
  SelectField,
  TextField,
} from "../../components/Profilefields";
import {
  GENDER_OPTIONS,
  MAX_LENGTH,
  type EditableField,
  type StudentForm,
} from "../studentprofile";

interface FieldsProps {
  form: StudentForm;
  onChange: (field: EditableField, value: string) => void;
}

export function PersonalFields({
  form,
  onChange,
  maxDob,
}: FieldsProps & {
  // The latest date of birth the date input accepts (YYYY-MM-DD).
  maxDob: string;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <TextField
        label="First name"
        required
        value={form.first_name}
        maxLength={MAX_LENGTH.first_name}
        autoComplete="off"
        onChange={(value) => onChange("first_name", value)}
      />
      <TextField
        label="Middle name"
        value={form.middle_name}
        maxLength={MAX_LENGTH.middle_name}
        autoComplete="off"
        onChange={(value) => onChange("middle_name", value)}
      />
      <TextField
        label="Last name"
        required
        value={form.last_name}
        maxLength={MAX_LENGTH.last_name}
        autoComplete="off"
        onChange={(value) => onChange("last_name", value)}
      />
      <SelectField
        label="Gender"
        value={form.gender}
        options={GENDER_OPTIONS}
        onChange={(value) => onChange("gender", value)}
      />
      <TextField
        label="Date of birth"
        required
        type="date"
        max={maxDob}
        value={form.dob}
        maxLength={MAX_LENGTH.dob}
        onChange={(value) => onChange("dob", value)}
      />
    </div>
  );
}

export function ContactFields({ form, onChange }: FieldsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <TextField
        label="Email"
        type="email"
        inputMode="email"
        autoComplete="off"
        placeholder="name@example.com"
        value={form.email}
        maxLength={MAX_LENGTH.email}
        onChange={(value) => onChange("email", value)}
      />
      <TextField
        label="Phone"
        type="tel"
        inputMode="tel"
        autoComplete="off"
        placeholder="+2348012345678"
        hint="Include the country code."
        value={form.phone}
        maxLength={MAX_LENGTH.phone}
        onChange={(value) => onChange("phone", value)}
      />
    </div>
  );
}
