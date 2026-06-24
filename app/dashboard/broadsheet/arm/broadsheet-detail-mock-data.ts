// ─────────────────────────────────────────────────────────────────────────────
// broadsheet-detail-mock-data.ts
//
// In-memory mock data + async helpers for the broadsheet detail view.
//
// Three helpers mirror three real backend calls:
//   GET arm/detail/?id=…&school-id=…                  → fetchBroadsheetArmDetail()
//   GET student/list/?school-id=…&arm-id=…&page-size= → fetchBroadsheetStudents()
//   GET subject/list/?school-id=…&term-id=…&arm=…     → fetchBroadsheetSubjects()
//
// The shapes returned by these helpers mirror the real ApiEnvelope and
// PaginatedResponse envelopes documented in arm_d.ts, arms_d.ts, and
// pagination.py — so swapping them for real clientAuthFetch calls is a
// one-line change inside the queryFn at each call site.
//
// Why a separate mock file from the list page?
//   The list and the detail need different fixtures (the detail needs scored
//   assessments, grading formats, students, subjects; the list just needs the
//   slim arm objects). Keeping them apart matches how the real backend splits
//   responsibilities across endpoints.
// ─────────────────────────────────────────────────────────────────────────────

// ── Shared envelope types (match the real backend's response shapes) ─────────

export interface ApiEnvelope<T> {
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  message: string;
  count: number;
  total_pages: number;
  current_page: number;
  next: string | null;
  previous: string | null;
  data: T[];
}

export interface MockApiResponse<T> {
  data?: T;
  error?: { name: string; message: string; data?: unknown };
}

// ── Latency helper ───────────────────────────────────────────────────────────

const SIMULATED_LATENCY_MS = 350;

function delay(ms: number = SIMULATED_LATENCY_MS): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Tiny deterministic pseudo-random — keeps the mock fixture stable across
// reloads while still varying scores per student/subject/unit.
function pseudoRandom(seed: number): number {
  // Mulberry32-style integer hash, returns a value in [0, 1).
  let s = seed | 0;
  s = (s + 0x6d2b79f5) | 0;
  let t = Math.imul(s ^ (s >>> 15), 1 | s);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

// ── Seed nested chain (same as the list module) ──────────────────────────────

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

const MOCK_SECTION: ArmSectionRef = {
  id: "section-jss",
  name: "Junior Secondary",
  abbr: "JSS",
  term: MOCK_TERM,
};

// ── Grading formats ──────────────────────────────────────────────────────────
// Bands chosen to cover the full 0–100 range with meaningful labels.

const MOCK_COG_GRADING_FORMAT: ArmGradingFormat = {
  id: "grade-cog-1",
  name: "Standard Cognitive Grading",
  abbr: "SCG",
  grades: [
    {
      id: "g-a-plus",
      symbol: "A+",
      remark: "Excellent",
      low: 80,
      high: 100,
      passed: true,
    },
    {
      id: "g-a",
      symbol: "A",
      remark: "Very Good",
      low: 70,
      high: 79,
      passed: true,
    },
    { id: "g-b", symbol: "B", remark: "Good", low: 60, high: 69, passed: true },
    {
      id: "g-c",
      symbol: "C",
      remark: "Credit",
      low: 50,
      high: 59,
      passed: true,
    },
    { id: "g-d", symbol: "D", remark: "Pass", low: 40, high: 49, passed: true },
    { id: "g-f", symbol: "F", remark: "Fail", low: 0, high: 39, passed: false },
  ],
};

const MOCK_AFF_GRADING_FORMAT: ArmGradingFormat = {
  id: "grade-aff-1",
  name: "Behaviour Rating",
  abbr: "BHR",
  grades: [
    {
      id: "ga-1",
      symbol: "E",
      remark: "Excellent",
      low: 5,
      high: 5,
      passed: true,
    },
    {
      id: "ga-2",
      symbol: "VG",
      remark: "Very Good",
      low: 4,
      high: 4,
      passed: true,
    },
    { id: "ga-3", symbol: "G", remark: "Good", low: 3, high: 3, passed: true },
    { id: "ga-4", symbol: "F", remark: "Fair", low: 2, high: 2, passed: true },
    { id: "ga-5", symbol: "P", remark: "Poor", low: 0, high: 1, passed: false },
  ],
};

const MOCK_PSY_GRADING_FORMAT: ArmGradingFormat = {
  id: "grade-psy-1",
  name: "Skill Rating",
  abbr: "SKR",
  grades: [
    {
      id: "gp-1",
      symbol: "E",
      remark: "Excellent",
      low: 5,
      high: 5,
      passed: true,
    },
    {
      id: "gp-2",
      symbol: "VG",
      remark: "Very Good",
      low: 4,
      high: 4,
      passed: true,
    },
    { id: "gp-3", symbol: "G", remark: "Good", low: 3, high: 3, passed: true },
    { id: "gp-4", symbol: "F", remark: "Fair", low: 2, high: 2, passed: true },
    { id: "gp-5", symbol: "P", remark: "Poor", low: 0, high: 1, passed: false },
  ],
};

// ── Assessment formats — column headers for each table ──────────────────────

const MOCK_COG_ASSESSMENT_FORMAT: ArmCogAssessmentFormat = {
  id: "cog-fmt-1",
  name: "CA + Exam",
  units: [
    {
      id: "unit-ca1",
      name: "CA 1",
      abbr: "CA1",
      display_order: 0,
      max_score: 20,
    },
    {
      id: "unit-ca2",
      name: "CA 2",
      abbr: "CA2",
      display_order: 1,
      max_score: 20,
    },
    {
      id: "unit-exam",
      name: "Exam",
      abbr: "EXAM",
      display_order: 2,
      max_score: 60,
    },
  ],
};

const MOCK_AFF_ASSESSMENT_FORMAT: ArmAffAssessmentFormat = {
  id: "aff-fmt-1",
  name: "Core Behaviours",
  behaviours: [
    { id: "beh-1", behaviour: "Creativity", display_order: 0, max_score: 5 },
    { id: "beh-2", behaviour: "Honesty", display_order: 1, max_score: 5 },
    { id: "beh-3", behaviour: "Initiative", display_order: 2, max_score: 5 },
    { id: "beh-4", behaviour: "Leadership", display_order: 3, max_score: 5 },
    { id: "beh-5", behaviour: "Neatness", display_order: 4, max_score: 5 },
    { id: "beh-6", behaviour: "Obedience", display_order: 5, max_score: 5 },
    { id: "beh-7", behaviour: "Politeness", display_order: 6, max_score: 5 },
    { id: "beh-8", behaviour: "Punctuality", display_order: 7, max_score: 5 },
  ],
};

const MOCK_PSY_ASSESSMENT_FORMAT: ArmPsyAssessmentFormat = {
  id: "psy-fmt-1",
  name: "Core Skills",
  activities: [
    { id: "act-1", activity: "Games", display_order: 0, max_score: 5 },
    { id: "act-2", activity: "Sports", display_order: 1, max_score: 5 },
    { id: "act-3", activity: "Handwriting", display_order: 2, max_score: 5 },
    { id: "act-4", activity: "Communication", display_order: 3, max_score: 5 },
    { id: "act-5", activity: "Drawings", display_order: 4, max_score: 5 },
    { id: "act-6", activity: "Crafts", display_order: 5, max_score: 5 },
  ],
};

// ── Pass rule ────────────────────────────────────────────────────────────────
// Simple percentage rule + one subject-level prerequisite — exercises both
// branches of the PassRuleSubject display logic.

const MOCK_PASS_RULE: ArmPassRule = {
  id: "rule-1",
  name: "Standard Pass Rule",
  type: "score",
  decide_by: "percentage",
  base_value: "0.5",
  active: true,
  subjects: [
    {
      id: "rule-subj-1",
      base_value: "0.5",
      subject_definition: {
        id: "subj-def-eng",
        name: "English Language",
        abbr: "ENG",
      },
    },
    {
      id: "rule-subj-2",
      base_value: "0.5",
      subject_definition: {
        id: "subj-def-math",
        name: "Mathematics",
        abbr: "MTH",
      },
    },
  ],
};

// ── Subjects offered by the arm ─────────────────────────────────────────────

const SUBJECT_DEFINITIONS: { id: string; name: string; abbr: string }[] = [
  { id: "subj-def-eng", name: "English Language", abbr: "ENG" },
  { id: "subj-def-math", name: "Mathematics", abbr: "MTH" },
  { id: "subj-def-bio", name: "Biology", abbr: "BIO" },
  { id: "subj-def-chem", name: "Chemistry", abbr: "CHM" },
  { id: "subj-def-phy", name: "Physics", abbr: "PHY" },
  { id: "subj-def-lit", name: "Literature", abbr: "LIT" },
  { id: "subj-def-econ", name: "Economics", abbr: "ECO" },
  { id: "subj-def-geo", name: "Geography", abbr: "GEO" },
  { id: "subj-def-cs", name: "Computer Studies", abbr: "CSC" },
  { id: "subj-def-civic", name: "Civic Education", abbr: "CIV" },
];

const MOCK_SUBJECTS: ArmSubject[] = SUBJECT_DEFINITIONS.map((def, index) => ({
  id: `subj-${def.abbr.toLowerCase()}`,
  definition: def,
  term: { id: MOCK_TERM.id, name: MOCK_TERM.name },
  subject_arms: [
    {
      id: `sa-${index}`,
      arm: { id: "arm-jss1-a", name: "Arm A", abbr: "A" },
      teachers: [],
    },
  ],
  excluded_students: [],
}));

// ── Students (roster) ─────────────────────────────────────────────────────────

// Realistic Nigerian names so the broadsheet preview feels like a real class.
const STUDENT_SEEDS: {
  first_name: string;
  middle_name?: string;
  last_name: string;
  gender: "M" | "F";
}[] = [
  {
    first_name: "Felix",
    middle_name: "Uzoma",
    last_name: "Obianozie",
    gender: "M",
  },
  { first_name: "Adaeze", last_name: "Okeke", gender: "F" },
  {
    first_name: "Tunde",
    middle_name: "Bolanle",
    last_name: "Adeyemi",
    gender: "M",
  },
  { first_name: "Zainab", last_name: "Ibrahim", gender: "F" },
  {
    first_name: "Chiamaka",
    middle_name: "Grace",
    last_name: "Eze",
    gender: "F",
  },
  { first_name: "Emmanuel", last_name: "Okafor", gender: "M" },
  { first_name: "Aisha", last_name: "Bello", gender: "F" },
  { first_name: "Ifeoma", middle_name: "Joy", last_name: "Nwosu", gender: "F" },
  { first_name: "Olumide", last_name: "Adebayo", gender: "M" },
  { first_name: "Blessing", last_name: "Etim", gender: "F" },
  {
    first_name: "Samuel",
    middle_name: "Chinedu",
    last_name: "Okonkwo",
    gender: "M",
  },
  { first_name: "Hassan", last_name: "Yusuf", gender: "M" },
  {
    first_name: "Esther",
    middle_name: "Chidinma",
    last_name: "Nnamdi",
    gender: "F",
  },
  { first_name: "Michael", last_name: "Adamu", gender: "M" },
  { first_name: "Faith", last_name: "Okoro", gender: "F" },
  {
    first_name: "Daniel",
    middle_name: "Tobi",
    last_name: "Adeyinka",
    gender: "M",
  },
  { first_name: "Mercy", last_name: "Bassey", gender: "F" },
  { first_name: "Ayodele", last_name: "Ogundimu", gender: "M" },
];

const MOCK_STUDENTS: ArmStudent[] = STUDENT_SEEDS.map((seed, index) => ({
  id: `stu-${index + 1}`,
  first_name: seed.first_name,
  middle_name: seed.middle_name,
  last_name: seed.last_name,
  public_id: `LHS/${String(2000 + index + 1).padStart(4, "0")}`,
  gender: seed.gender,
}));

// ── Assessment records ───────────────────────────────────────────────────────
// One AssessmentRecord per student, with cognitive scores for every subject
// and trait scores for every behaviour + activity. Numbers come from the
// deterministic pseudo-random so the table stays stable between reloads.

function makeAssessmentForStudent(
  student: ArmStudent,
  studentIndex: number,
): ArmAssessmentRecord {
  // Cognitive — one record per subject, each with one score entry per unit.
  const cognitive_records: ArmCognitiveRecord[] = MOCK_SUBJECTS.map(
    (subject, subjectIndex) => {
      const scores = MOCK_COG_ASSESSMENT_FORMAT.units.map((unit, unitIndex) => {
        // Mix the seed across student/subject/unit so scores vary realistically.
        const seed =
          (studentIndex + 1) * 1000 +
          (subjectIndex + 1) * 100 +
          (unitIndex + 1) * 13;
        // Bias most scores upward (mean ~70 % of max) so the broadsheet has
        // a realistic distribution with occasional weak rows.
        const raw = pseudoRandom(seed);
        const value = Math.round(
          raw * unit.max_score * 0.6 + unit.max_score * 0.3,
        );
        return {
          id: `cog-${student.id}-${subject.id}-${unit.id}`,
          unit,
          score: value,
        };
      });
      return {
        id: `cogrec-${student.id}-${subject.id}`,
        subject: { id: subject.id, definition: subject.definition },
        scores,
      };
    },
  );

  // Affective — one record total, with one score entry per behaviour.
  const affective_records: ArmAffectiveRecord[] = [
    {
      id: `affrec-${student.id}`,
      scores: MOCK_AFF_ASSESSMENT_FORMAT.behaviours.map((b, i) => {
        const seed = (studentIndex + 1) * 700 + (i + 1) * 17;
        // Cap at max_score so the grade-band lookup always finds a match.
        const value = Math.max(1, Math.round(pseudoRandom(seed) * b.max_score));
        return {
          id: `aff-${student.id}-${b.id}`,
          behaviour: {
            id: b.id,
            name: b.behaviour,
            display_order: b.display_order,
            max_score: b.max_score,
          },
          score: value,
        };
      }),
    },
  ];

  // Psychomotor — one record total, with one score entry per activity.
  const psychomotor_records: ArmPsychomotorRecord[] = [
    {
      id: `psyrec-${student.id}`,
      scores: MOCK_PSY_ASSESSMENT_FORMAT.activities.map((a, i) => {
        const seed = (studentIndex + 1) * 500 + (i + 1) * 23;
        const value = Math.max(1, Math.round(pseudoRandom(seed) * a.max_score));
        return {
          id: `psy-${student.id}-${a.id}`,
          activity: {
            id: a.id,
            name: a.activity,
            display_order: a.display_order,
            max_score: a.max_score,
          },
          score: value,
        };
      }),
    },
  ];

  return {
    id: `asmt-${student.id}`,
    student,
    teachers_remark:
      "Performed well this term. Keep up the consistency and aim higher next term.",
    supervisors_remark:
      "Promising effort. Pay closer attention to weaker subjects to round out performance.",
    cognitive_records,
    affective_records,
    psychomotor_records,
  };
}

const MOCK_ASSESSMENTS: ArmAssessmentRecord[] = MOCK_STUDENTS.map((s, i) =>
  makeAssessmentForStudent(s, i),
);

// ── Arm detail (one fully-populated arm, plus a few shells for other ids) ────

const MOCK_ARM_DETAIL: ClassArm = {
  id: "arm-jss1-a",
  name: "Arm A",
  abbr: "A",
  level: {
    id: "lvl-jss1",
    name: "Junior 1",
    abbr: "1",
    section: MOCK_SECTION,
  },
  display_order: 1,
  class_teacher: null,
  ass_class_teacher: null,
  broadsheet: "pending",
  cog_grading_format: MOCK_COG_GRADING_FORMAT,
  aff_grading_format: MOCK_AFF_GRADING_FORMAT,
  psy_grading_format: MOCK_PSY_GRADING_FORMAT,
  cognitive_assessment_format: MOCK_COG_ASSESSMENT_FORMAT,
  affective_assessment_format: MOCK_AFF_ASSESSMENT_FORMAT,
  psychomotor_assessment_format: MOCK_PSY_ASSESSMENT_FORMAT,
  pass_rule: MOCK_PASS_RULE,
  assessments: MOCK_ASSESSMENTS,
};

// ── Public fetchers ──────────────────────────────────────────────────────────
// Each one mirrors a real backend endpoint. The unused params are still
// accepted so swapping in clientAuthFetch is a syntactic no-op.

// MOCK: GET arm/detail/?id=<armId>&school-id=…
export async function fetchBroadsheetArmDetail(
  armId: string,
): Promise<MockApiResponse<ApiEnvelope<ClassArm>>> {
  await delay();

  // Any armId from the list page resolves to the same fully-populated arm
  // here so the demo flow works end-to-end. The id is preserved on the
  // returned object so the calling code keeps its referential expectations.
  return {
    data: {
      message: "Arm detail fetched successfully.",
      data: { ...MOCK_ARM_DETAIL, id: armId },
    },
  };
}

// MOCK: GET student/list/?school-id=…&arm-id=<armId>&page-size=…
export async function fetchBroadsheetStudents(
  _armId: string,
): Promise<MockApiResponse<PaginatedResponse<ArmStudent>>> {
  await delay();
  return {
    data: {
      message: "Students fetched successfully.",
      count: MOCK_STUDENTS.length,
      total_pages: 1,
      current_page: 1,
      next: null,
      previous: null,
      data: [...MOCK_STUDENTS],
    },
  };
}

// MOCK: GET subject/list/?school-id=…&term-id=…&arm=<armId>
export async function fetchBroadsheetSubjects(
  _armId: string,
): Promise<MockApiResponse<ApiEnvelope<ArmSubject[]>>> {
  await delay();
  return {
    data: {
      message: "Subjects fetched successfully.",
      data: [...MOCK_SUBJECTS],
    },
  };
}
