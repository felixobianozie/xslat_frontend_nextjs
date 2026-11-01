// ──────────────────────────────────────────
// studentprofile.ts
//
// The logic behind the student profile page (see components/Studentprofile.tsx):
// which fields can be edited, how a form is built from a student and compared with
// it, how it is checked before it is sent, and how dates, ages and the current
// class are written. Plain functions, so they can be tested without rendering.
// ──────────────────────────────────────────

// The fields the page lets someone change. A student's public ID, school, status,
// current class, registration number and boarding are shown but not edited here:
// they have their own workflows, and the update endpoint would apply a
// registration number or boarding change to the student's *current* school, which
// is not always the school being viewed.
export const EDITABLE_FIELDS = [
  "first_name",
  "middle_name",
  "last_name",
  "gender",
  "dob",
  "email",
  "phone",
  "r_address",
  "r_city",
  "r_lga",
  "r_state",
  "r_country",
  "o_address",
  "o_city",
  "o_lga",
  "o_state",
  "o_country",
] as const;

export type EditableField = (typeof EDITABLE_FIELDS)[number];
export type StudentForm = Record<EditableField, string>;

// The longest value each field accepts, as the backend stores it.
export const MAX_LENGTH: Record<EditableField, number> = {
  first_name: 50,
  middle_name: 50,
  last_name: 50,
  gender: 1,
  dob: 10,
  email: 254,
  phone: 15,
  r_address: 100,
  r_city: 100,
  r_lga: 100,
  r_state: 100,
  r_country: 100,
  o_address: 100,
  o_city: 100,
  o_lga: 100,
  o_state: 100,
  o_country: 100,
};

export const GENDER_OPTIONS: { value: "M" | "F" | "O"; label: string }[] = [
  { value: "M", label: "Male" },
  { value: "F", label: "Female" },
  { value: "O", label: "Other" },
];

export function genderLabel(value: string): string {
  return GENDER_OPTIONS.find((option) => option.value === value)?.label ?? "";
}

// The phone number must be international: a +, then 7 to 15 digits. The backend
// enforces the same rule.
const PHONE_PATTERN = /^\+\d{7,15}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ── The form ─────────────────────────────────────────────────────────────

// The form's starting values: the student's own, with a missing value as "".
export function formFrom(student: StudentProfileRecord): StudentForm {
  return Object.fromEntries(
    EDITABLE_FIELDS.map((field) => [field, student[field] ?? ""]),
  ) as StudentForm;
}

// What the form changes. Text is trimmed before it is compared, and only the
// fields that differ from the student are returned, so only those are sent.
export function changesBetween(
  student: StudentProfileRecord,
  form: StudentForm,
): Partial<StudentForm> {
  const changes: Partial<StudentForm> = {};
  for (const field of EDITABLE_FIELDS) {
    const value = form[field].trim();
    if (value !== (student[field] ?? "")) changes[field] = value;
  }
  return changes;
}

// The first thing wrong with the form, or null when it can be sent. The backend
// checks the same rules; checking here saves a round trip.
export function validateForm(form: StudentForm, today: Date): string | null {
  if (!form.first_name.trim() || !form.last_name.trim()) {
    return "First name and last name are required.";
  }
  if (!["M", "F", "O"].includes(form.gender)) {
    return "Choose a gender.";
  }

  const dob = parseDateOnly(form.dob.trim());
  if (!form.dob.trim()) return "Date of birth is required.";
  if (!dob) return "Enter a valid date of birth.";
  if (dob.getTime() > startOfDay(today).getTime()) {
    return "Date of birth cannot be in the future.";
  }

  const email = form.email.trim();
  if (email && !EMAIL_PATTERN.test(email)) return "Enter a valid email address.";

  const phone = form.phone.trim();
  if (phone && !PHONE_PATTERN.test(phone)) {
    return "Phone must include the country code, for example +2348012345678.";
  }
  return null;
}

// The backend's message for a phone number another student already has reads like
// a database error; this says it plainly. Any other message is shown as it is.
export function friendlyStudentError(message: string): string {
  return /student with this phone already exists/i.test(message)
    ? "Another student already has this phone number."
    : message;
}

// ── Dates ────────────────────────────────────────────────────────────────

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

// A date-only value (YYYY-MM-DD) as a date at local midnight, or null when it is
// not a real date. It is not passed to `new Date(value)`, which reads such a value
// as UTC midnight and shows the day before in time zones behind UTC.
export function parseDateOnly(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
    ? date
    : null;
}

// A date of birth for reading, like "12 Mar 2012". Empty when it is not a date.
export function formatDob(value: string | null | undefined): string {
  const date = value ? parseDateOnly(value) : null;
  return date
    ? date.toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";
}

// The age in whole years on `today`, or null when the date is not a real date. A
// date of birth later than today gives null as well.
export function ageOf(dob: string | null | undefined, today: Date): number | null {
  const born = dob ? parseDateOnly(dob) : null;
  if (!born) return null;
  let years = today.getFullYear() - born.getFullYear();
  const hadBirthday =
    today.getMonth() > born.getMonth() ||
    (today.getMonth() === born.getMonth() && today.getDate() >= born.getDate());
  if (!hadBirthday) years -= 1;
  return years >= 0 ? years : null;
}

// Today as YYYY-MM-DD in local time: the latest date of birth the date input
// accepts.
export function todayIso(today: Date): string {
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${today.getFullYear()}-${month}-${day}`;
}

// ── The school record ────────────────────────────────────────────────────

// A class as the student list writes it, like "JSS 1 A": the section, level and
// arm abbreviations, with any that is empty left out. "" when there is no class.
export function formatClass(arm: ClassArm | null | undefined): string {
  if (!arm) return "";
  return [arm.level?.section?.abbr, arm.level?.abbr, arm.abbr]
    .filter((part) => part && part.trim())
    .join(" ");
}

// The student's portfolio at this school. The backend sends only this school's,
// so it is the first; the school id is matched anyway.
export function portfolioAt(
  student: StudentProfileRecord,
  schoolId: string,
): StudentPortfolio | undefined {
  return (
    student.portfolios.find((portfolio) => portfolio.school.id === schoolId) ??
    student.portfolios[0]
  );
}

// A failed load, with the HTTP status so a missing or forbidden student is not
// retried.
export class StudentLoadError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}
