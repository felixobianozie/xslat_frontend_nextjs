// ─────────────────────────────────────────────────────────────────────────────
// configutils.ts
//
// Plain helper functions, constants and React Query keys shared by the
// Configurations tabs and editors.
// ─────────────────────────────────────────────────────────────────────────────

import type { PermissionRecord } from "@/types/configurations";

export const SCHOOL_ID = process.env.NEXT_PUBLIC_SCHOOL_ID ?? "";

// How long fetched data counts as fresh. A tab that is closed and opened again
// inside this window reuses its cached data instead of requesting it again.
export const QUERY_STALE_MS = 5 * 60 * 1000;

// ── React Query keys ─────────────────────────────────────────────────────────

// The school and arm list keys are shared with the dashboard top bar and the
// Class Arms page, so a change here refreshes those screens as well.
export const SCHOOL_KEY = ["school", SCHOOL_ID];
export const ARMS_KEY = ["arms", SCHOOL_ID];
export const ARM_DETAIL_KEY = ["arm-detail"];
// Followed by the term id: the sections of one term.
export const SECTIONS_KEY = ["structure-sections", SCHOOL_ID];
// Followed by the section id: the levels of one section.
export const LEVELS_KEY = ["structure-levels", SCHOOL_ID];

export const SESSIONS_KEY = ["calendar-sessions", SCHOOL_ID];
export const TERMS_KEY = ["calendar-terms", SCHOOL_ID];

export const GRADING_FORMATS_KEY = ["grading-formats", SCHOOL_ID];
export const COGNITIVE_FORMATS_KEY = ["cognitive-formats", SCHOOL_ID];
export const AFFECTIVE_FORMATS_KEY = ["affective-formats", SCHOOL_ID];
export const PSYCHOMOTOR_FORMATS_KEY = ["psychomotor-formats", SCHOOL_ID];
export const PASS_RULES_KEY = ["pass-rules", SCHOOL_ID];
export const SUBJECT_DEFINITIONS_KEY = ["subject-definitions", SCHOOL_ID];
// Followed by the term id: the subjects offered in one term.
export const TERM_SUBJECTS_KEY = ["term-subjects", SCHOOL_ID];
export const RESULT_TEMPLATES_KEY = ["result-templates", SCHOOL_ID];
export const ROLES_KEY = ["roles", SCHOOL_ID];
// The permission catalogue is the same for every school.
export const PERMISSION_CATALOGUE_KEY = ["permission-catalogue"];
// Followed by the role name: how many staff hold the role.
export const ROLE_MEMBERS_KEY = ["role-members", SCHOOL_ID];

// ── Arm Settings ─────────────────────────────────────────────────────────────

// The school settings that can be assigned to a class arm. `key` is the arm
// field that holds the setting, in the order the settings are shown.
export const ASSIGNMENT_PARAMETERS = [
  { key: "result_template", label: "Result template" },
  { key: "cog_grading_format", label: "Academics grading" },
  { key: "aff_grading_format", label: "Behaviours grading" },
  { key: "psy_grading_format", label: "Skills grading" },
  { key: "cognitive_assessment_format", label: "Academics format" },
  { key: "affective_assessment_format", label: "Behaviours format" },
  { key: "psychomotor_assessment_format", label: "Skills format" },
  { key: "pass_rule", label: "Pass rule" },
] as const;

export type AssignmentKey = (typeof ASSIGNMENT_PARAMETERS)[number]["key"];

// Arms in these broadsheet states are locked and cannot be reconfigured.
export function isArmLocked(broadsheet: string | undefined): boolean {
  return broadsheet === "pending" || broadsheet === "approved";
}

// "JSS 1 A" — the label used for an arm in the assignment screens.
export function armLabel(arm: ClassArm): string {
  return `${arm.level.section.abbr} ${arm.level.abbr} ${arm.abbr}`;
}

let rowCounter = 0;

// Editable rows (grade bands, units, …) need a stable React key before they
// have a database id. This returns a new unique key each time it is called.
export function nextRowKey(): string {
  rowCounter += 1;
  return `row-${rowCounter}`;
}

// True for strings such as "0", "42" and "-1" — whole numbers only.
export function isWholeNumber(value: string): boolean {
  return /^-?\d+$/.test(value.trim());
}

// True when the two values serialise to the same JSON. Used to decide whether
// a list the user edited differs from the one the server returned.
export function isSameJson(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Formats a date-only value such as "2025-09-08". The time is added before
// parsing so the date is read in local time and cannot shift to another day.
export function formatDay(day: string | null | undefined): string {
  if (!day) return "—";
  return new Date(`${day}T00:00:00`).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// DRF sends decimals as strings such as "0.50". Returns the number, or 0 when
// the value is missing or not a number.
export function parseDecimal(
  value: string | number | null | undefined,
): number {
  if (value === null || value === undefined) return 0;
  const parsed = typeof value === "number" ? value : parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

// A pass rule stores a percentage as a fraction ("0.65"). The editor shows and
// accepts whole percentages, so these two functions convert between the two.
export function fractionToPercentText(fraction: string): string {
  return String(Math.round(parseDecimal(fraction) * 100));
}

export function percentTextToFraction(percent: string): string {
  return (Number(percent) / 100).toFixed(2);
}

// "40.00" → "40", "2.50" → "2.5". Used to show raw thresholds without noise.
export function trimDecimalText(value: string): string {
  return String(parseDecimal(value));
}

// ── Backend validation messages ──────────────────────────────────────────────

// Field name → messages, as normalised by handleFetchErrors (error.data).
export type FieldErrors = Record<string, string[]>;

// Joins the backend messages for one field into a single string.
export function fieldMessage(
  fieldErrors: FieldErrors,
  key: string,
): string | undefined {
  const messages = fieldErrors[key];
  return messages && messages.length > 0 ? messages.join(" ") : undefined;
}

// The backend reports problems inside a nested list under keys such as
// "grades" (the whole list) and "grades[2]" (the third row). This splits them
// into list-level messages and a map of row index → message.
export function splitItemErrors(
  fieldErrors: FieldErrors,
  listKey: string,
): { general: string | undefined; rows: Record<number, string> } {
  const rows: Record<number, string> = {};
  const rowPattern = new RegExp("^" + listKey + "\\[(\\d+)\\]$");

  for (const [key, messages] of Object.entries(fieldErrors)) {
    const match = key.match(rowPattern);
    if (match) rows[Number(match[1])] = messages.join(" ");
  }

  return { general: fieldMessage(fieldErrors, listKey), rows };
}

// Thrown by a query when the backend refuses a read. Carries the HTTP status so
// a screen can tell a missing permission (403) from other failures.
export class LoadError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "LoadError";
    this.status = status;
  }
}

// Thrown by an editor's mutation when the backend rejects a save. Carries the
// per-field messages so the form can show them next to the right input.
export class SaveError extends Error {
  fieldErrors: FieldErrors;

  constructor(message: string, fieldErrors?: FieldErrors | null) {
    super(message);
    this.name = "SaveError";
    this.fieldErrors = fieldErrors ?? {};
  }
}

// ── Roles and permissions ────────────────────────────────────────────────────

// The permission categories, in the order they are shown, with their labels. A
// category the backend adds later is shown after these under its own name.
const PERMISSION_CATEGORIES: { id: string; label: string }[] = [
  { id: "iam", label: "Roles and access" },
  { id: "staff", label: "Staff" },
  { id: "student", label: "Students" },
  { id: "school", label: "School" },
  { id: "academics", label: "Academics" },
  { id: "subject", label: "Subjects" },
  { id: "score", label: "Scores" },
  { id: "remark", label: "Remarks" },
  { id: "result", label: "Results" },
];

export function categoryLabel(category: string): string {
  const known = PERMISSION_CATEGORIES.find((item) => item.id === category);
  if (known) return known.label;
  if (!category) return "Other";
  return category.charAt(0).toUpperCase() + category.slice(1);
}

export interface PermissionGroup {
  category: string;
  label: string;
  permissions: PermissionRecord[];
}

// Groups permissions by category, in the display order, keeping the order the
// permissions arrived in inside each group.
export function groupPermissionsByCategory(
  permissions: PermissionRecord[],
): PermissionGroup[] {
  const byCategory = new Map<string, PermissionRecord[]>();
  for (const permission of permissions) {
    const list = byCategory.get(permission.category) ?? [];
    list.push(permission);
    byCategory.set(permission.category, list);
  }

  const knownIds = PERMISSION_CATEGORIES.map((item) => item.id);
  const otherIds = Array.from(byCategory.keys()).filter(
    (id) => !knownIds.includes(id),
  );

  return [...knownIds, ...otherIds]
    .filter((id) => byCategory.has(id))
    .map((id) => ({
      category: id,
      label: categoryLabel(id),
      permissions: byCategory.get(id) ?? [],
    }));
}

// True when the permission matches what was typed in a search box, by label or
// by codename.
export function permissionMatches(
  permission: PermissionRecord,
  search: string,
): boolean {
  const needle = search.trim().toLowerCase();
  if (!needle) return true;
  return (
    permission.label.toLowerCase().includes(needle) ||
    permission.codename.toLowerCase().includes(needle)
  );
}

// ── School structure forms ───────────────────────────────────────────────────

// The backend reports a clash with another record (for example a duplicate
// name) under this key instead of under a field.
export function nonFieldMessage(fieldErrors: FieldErrors): string | undefined {
  return fieldMessage(fieldErrors, "non_field_errors");
}

// A required text field: not empty and not longer than the database allows.
export function textError(
  value: string,
  label: string,
  maxLength: number,
): string | undefined {
  const text = value.trim();
  if (!text) return `Enter ${label}.`;
  if (text.length > maxLength) return `Maximum ${maxLength} characters.`;
  return undefined;
}

// An abbreviation: no spaces, and not longer than the database allows. A blank
// one is an error only when `required` is set.
export function abbrError(
  value: string,
  required: boolean,
  maxLength = 20,
): string | undefined {
  const text = value.trim();
  if (!text) return required ? "Enter an abbreviation." : undefined;
  if (/\s/.test(text)) return "No spaces. Use underscores instead.";
  if (text.length > maxLength) return `Maximum ${maxLength} characters.`;
  return undefined;
}

// A whole number of zero or more, entered as text.
export function wholeNumberError(
  value: string,
  label: string,
): string | undefined {
  const text = value.trim();
  if (!text) return `Enter ${label}.`;
  if (!/^\d+$/.test(text)) return "Enter a whole number, 0 or more.";
  return undefined;
}

// Names and abbreviations are compared ignoring case and surrounding spaces,
// because the backend capitalises them before checking they are unique.
export function sameText(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

// ISO dates (YYYY-MM-DD) sort the same as text, so they can be compared
// directly. True when `ends` is a day after `starts`, or either is empty.
export function endsAfterStart(starts: string, ends: string): boolean {
  if (!starts || !ends) return true;
  return ends > starts;
}
