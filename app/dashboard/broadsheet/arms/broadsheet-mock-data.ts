// ─────────────────────────────────────────────────────────────────────────────
// broadsheet-mock-data.ts
//
// In-memory mock data + async helpers for the Broadsheets feature.
//
// Every helper here is designed to be a drop-in replacement for a real
// clientAuthFetch call. The return shape mirrors what clientAuthFetch returns
// ({ data, error } envelopes) so when the backend is wired up later, swapping
// these helpers for the real fetches is a one-line change in each component.
//
// Backend reference (academics.views):
//   GET  arm/list/?school-id=…&term-id=…                — fetchBroadsheetArms()
//   PUT  arm/detail/broadsheet/                         — applyBroadsheetAction()
//        body: { id, school_id, broadsheet: "submit" | "resend" | "revoke" | "approve" }
//
// Status semantics (from models.py + ArmSerializer):
//   - "none"     — no submission yet (teacher action: submit)
//   - "pending"  — awaiting admin review (admin actions: approve / revoke)
//   - "approved" — admin signed off (admin action: revoke still possible)
//   - "revoked"  — admin sent back (teacher action: resend)
//
// "Result published" status (per arm row in the list) is DERIVED: an arm
// counts as published-ready when its broadsheet is "approved". The term's
// `results_status` is set to "published" only when ALL arms in the term are
// approved — that aggregate is computed by the backend, not us.
// ─────────────────────────────────────────────────────────────────────────────

// ── Envelope shape (matches what clientAuthFetch returns) ────────────────────
// Importing from the lib types would be ideal, but to keep this module
// self-contained for the mock phase, we redeclare the shape here.
export interface ApiEnvelope<T> {
  message: string;
  data: T;
}

export interface MockApiResponse<T> {
  data?: ApiEnvelope<T>;
  error?: { name: string; message: string; data?: unknown };
}

// ── Constants ────────────────────────────────────────────────────────────────

// Small delay so React Query's loading state is visible during UI iteration.
const SIMULATED_LATENCY_MS = 350;

function delay(ms: number = SIMULATED_LATENCY_MS): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Possible broadsheet action verbs accepted by the backend.
export type BroadsheetActionVerb = "submit" | "resend" | "revoke" | "approve";

// Maps an action verb to the resulting broadsheet status. Same mapping
// the backend applies in ArmSerializer.update().
const VERB_TO_STATUS: Record<BroadsheetActionVerb, ClassArm["broadsheet"]> = {
  submit: "pending",
  resend: "pending",
  revoke: "revoked",
  approve: "approved",
};

// ── Seed nested chain: School → Session → Term → Section → Level ─────────────
// Mirrors the nested objects returned by ArmSerializer's `to_representation`.

const MOCK_SCHOOL: ArmSchool = {
  id: "school-001",
  name: "Lutheran High School, Obot Idim",
  abbr: "LHS",
};

const MOCK_SESSION: ArmSession = {
  id: "session-2024-2025",
  name: "2024/2025",
  abbr: "24/25",
  school: MOCK_SCHOOL,
};

const MOCK_TERM: ArmTerm = {
  id: "term-second-2024",
  name: "Second",
  abbr: "2nd",
  session: MOCK_SESSION,
};

const MOCK_SECTION_JSS: ArmSectionRef = {
  id: "section-jss",
  name: "Junior Secondary",
  abbr: "JSS",
  term: MOCK_TERM,
};

const MOCK_SECTION_SSS: ArmSectionRef = {
  id: "section-sss",
  name: "Senior Secondary",
  abbr: "SSS",
  term: MOCK_TERM,
};

// ── Seed levels — one row per (section, level) ───────────────────────────────

const MOCK_LEVELS: ArmLevel[] = [
  { id: "lvl-jss1", name: "Junior 1", abbr: "1", section: MOCK_SECTION_JSS },
  { id: "lvl-jss2", name: "Junior 2", abbr: "2", section: MOCK_SECTION_JSS },
  { id: "lvl-jss3", name: "Junior 3", abbr: "3", section: MOCK_SECTION_JSS },
  { id: "lvl-sss1", name: "Senior 1", abbr: "1", section: MOCK_SECTION_SSS },
  { id: "lvl-sss2", name: "Senior 2", abbr: "2", section: MOCK_SECTION_SSS },
];

// ── Seed class arms — mutable so action helpers can update broadsheet state ──
// Each arm sits at a specific level and starts with a varied broadsheet status
// so the list reflects every state and the admin sees a realistic mix.

const MOCK_ARMS: ClassArm[] = [
  {
    id: "arm-jss1-a",
    name: "Arm A",
    abbr: "A",
    level: MOCK_LEVELS[0],
    broadsheet: "approved",
  },
  {
    id: "arm-jss1-b",
    name: "Arm B",
    abbr: "B",
    level: MOCK_LEVELS[0],
    broadsheet: "pending",
  },
  {
    id: "arm-jss2-a",
    name: "Arm A",
    abbr: "A",
    level: MOCK_LEVELS[1],
    broadsheet: "pending",
  },
  {
    id: "arm-jss2-b",
    name: "Arm B",
    abbr: "B",
    level: MOCK_LEVELS[1],
    broadsheet: "revoked",
  },
  {
    id: "arm-jss3-a",
    name: "Arm A",
    abbr: "A",
    level: MOCK_LEVELS[2],
    broadsheet: "approved",
  },
  {
    id: "arm-jss3-b",
    name: "Arm B",
    abbr: "B",
    level: MOCK_LEVELS[2],
    broadsheet: "none",
  },
  {
    id: "arm-sss1-a",
    name: "Arm A",
    abbr: "A",
    level: MOCK_LEVELS[3],
    broadsheet: "pending",
  },
  {
    id: "arm-sss2-a",
    name: "Arm A",
    abbr: "A",
    level: MOCK_LEVELS[4],
    broadsheet: "approved",
  },
];

// ── fetchBroadsheetArms — simulates GET arm/list/ ────────────────────────────
// Returns ALL arms for the term. The broadsheets list page filters/searches
// client-side, matching how the real arm/list/ endpoint behaves (no
// full-text search or broadsheet-status filter at the URL level).
export async function fetchBroadsheetArms(): Promise<
  MockApiResponse<ClassArm[]>
> {
  await delay();
  return {
    data: {
      message: "Arms fetched successfully.",
      data: [...MOCK_ARMS],
    },
  };
}

// ── applyBroadsheetAction — simulates PUT arm/detail/broadsheet/ ─────────────
// Updates the in-memory arm's broadsheet status and returns the updated arm.
// Mirrors the backend's serializer-level state transitions.
export async function applyBroadsheetAction(
  armId: string,
  action: BroadsheetActionVerb,
): Promise<MockApiResponse<ClassArm>> {
  await delay();

  const arm = MOCK_ARMS.find((a) => a.id === armId);
  if (!arm) {
    return {
      error: {
        name: "NotFound",
        message: "Class arm not found.",
      },
    };
  }

  // Light validation — surfaces the kinds of issues the backend would catch.
  // The real serializer is stricter (config completeness, scores entered,
  // etc.), but this guard mirrors the OBVIOUS transition rules so the UI
  // exercises its error paths.
  const currentStatus = arm.broadsheet ?? "none";
  const validTransitions: Record<string, BroadsheetActionVerb[]> = {
    none: ["submit"],
    pending: ["approve", "revoke"],
    approved: ["revoke"],
    revoked: ["resend"],
  };
  if (!validTransitions[currentStatus]?.includes(action)) {
    return {
      error: {
        name: "ValidationError",
        message: `Cannot ${action} a broadsheet that is currently "${currentStatus}".`,
        data: { broadsheet: [`Invalid transition from ${currentStatus}.`] },
      },
    };
  }

  arm.broadsheet = VERB_TO_STATUS[action];

  return {
    data: {
      message: "Broadsheet action applied successfully.",
      data: { ...arm },
    },
  };
}
