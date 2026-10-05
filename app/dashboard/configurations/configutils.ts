// ─────────────────────────────────────────────────────────────────────────────
// configutils.ts
//
// Plain helper functions, constants and React Query keys shared by the
// Configurations tabs and editors.
// ─────────────────────────────────────────────────────────────────────────────

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

export const SESSIONS_KEY = ["calendar-sessions", SCHOOL_ID];
export const TERMS_KEY = ["calendar-terms", SCHOOL_ID];

export const GRADING_FORMATS_KEY = ["grading-formats", SCHOOL_ID];
export const COGNITIVE_FORMATS_KEY = ["cognitive-formats", SCHOOL_ID];
export const AFFECTIVE_FORMATS_KEY = ["affective-formats", SCHOOL_ID];
export const PSYCHOMOTOR_FORMATS_KEY = ["psychomotor-formats", SCHOOL_ID];
export const PASS_RULES_KEY = ["pass-rules", SCHOOL_ID];
export const RESULT_TEMPLATES_KEY = ["result-templates", SCHOOL_ID];

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
