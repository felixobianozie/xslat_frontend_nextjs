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

// ─────────────────────────────────────────────────────────────────────────────
// Mock compute — turns raw MOCK_ASSESSMENTS into the compute-endpoint payload.
//
// The real backend does this in academics/services/results_aggregation.py.
// Here we reproduce just enough to keep the broadsheet UI working against
// mocked data — no exclusions, no ordinal/dense ranking, no pass-rule branch
// coverage beyond the mock arm's own "score" rule. Any real behaviour lives
// on the backend; this helper exists so BroadsheetDetailsProvider can consume
// the compute-endpoint shape without importing results-aggregates.ts.
// ─────────────────────────────────────────────────────────────────────────────

// Grade-band lookup for cognitive totals. Mirrors the backend helper of the
// same intent; returns null when the score is negative (absent) or when no
// band covers it.
function mockFindGrade(
  grades: ArmGradingFormatGrade[],
  score: number,
): { symbol: string; remark: string; passed: boolean } | null {
  if (score < 0) return null;
  for (const g of grades) {
    if (score >= g.low && score <= g.high) {
      return { symbol: g.symbol, remark: g.remark, passed: Boolean(g.passed) };
    }
  }
  return null;
}

// Trait grade resolver — folds in the "absent" (-1) special case so the
// caller doesn't need to.
function mockResolveTrait(
  grades: ArmGradingFormatGrade[],
  score: number,
): { grade_symbol: string | null; remark: string | null; is_absent: boolean } {
  if (score === -1) {
    return { grade_symbol: null, remark: "Absent", is_absent: true };
  }
  const g = mockFindGrade(grades, score);
  return {
    grade_symbol: g?.symbol ?? null,
    remark: g?.remark ?? null,
    is_absent: false,
  };
}

// Round to 2dp without floating-point drift. Same rule as the real backend.
function mockRound2(n: number): number {
  return Math.round(n * 100) / 100;
}

// Build the compute-endpoint payload for the mock arm. Pure function of its
// inputs; called once inside fetchBroadsheetClassResult.
function computeMockClassResult(
  arm: ClassArm,
  assessments: ArmAssessmentRecord[],
): ClassAssessmentResult {
  const cogGrades = arm.cog_grading_format?.grades ?? [];
  const affGrades = arm.aff_grading_format?.grades ?? [];
  const psyGrades = arm.psy_grading_format?.grades ?? [];

  // Canonical unit ordering — units sorted by display_order ascending. The
  // subject `scores` array is positioned against THIS sequence (index i
  // holds the score for orderedUnits[i]). Mirrors the backend contract.
  const orderedUnits = [...(arm.cognitive_assessment_format?.units ?? [])].sort(
    (a, b) => a.display_order - b.display_order,
  );
  const unitIndexById = new Map<string, number>();
  orderedUnits.forEach((u, idx) => unitIndexById.set(u.id, idx));
  const unitCount = orderedUnits.length;

  // Every subject in an arm shares the same cognitive format, so this cap
  // is the same for every subject and every student.
  const subjectMaxScore = orderedUnits.reduce(
    (sum, u) => sum + (u.max_score ?? 0),
    0,
  );

  // Zero-initialised grading-summary template. Keys are the distinct leading
  // alphabetic prefixes on the arm's cognitive grade symbols (e.g. A, B, C).
  const gradingSummaryTemplate: Record<string, number> = {};
  for (const g of cogGrades) {
    const prefix = g.symbol.match(/^[A-Za-z]+/)?.[0] ?? "";
    if (prefix) gradingSummaryTemplate[prefix] = 0;
  }

  // Simple, mock-only pass rule: the arm's rule is a `score` type with a
  // percentage threshold; treat everyone whose total ≥ threshold × max as
  // Pass, else Fail. When the arm has no rule, decision is "—".
  const passRule = arm.pass_rule;
  const passBaseValue =
    passRule && typeof passRule.base_value === "string"
      ? parseFloat(passRule.base_value)
      : NaN;

  const rows: StudentAssessmentResult[] = [];
  let totalOfAverages = 0;

  for (const assessment of assessments) {
    // ── Subject rows ──────────────────────────────────────────────────────
    const subjects: Record<string, SubjectAssessmentResult> = {};
    let studentTotal = 0;

    // We iterate the ARM's SubjectArm list for display_order lookup. The
    // mock file doesn't carry SubjectArm rows separately; use the subject's
    // definition order as a stand-in. Deterministic and stable.
    for (const cog of assessment.cognitive_records) {
      const scores: (number | null)[] = new Array(unitCount).fill(null);
      for (const entry of cog.scores) {
        const idx = unitIndexById.get(entry.unit.id);
        if (idx === undefined) continue;
        scores[idx] = entry.score;
      }
      const total = scores.reduce<number>(
        (sum, s) => (typeof s === "number" && s > 0 ? sum + s : sum),
        0,
      );
      studentTotal += total;
      const grade = mockFindGrade(cogGrades, total);
      subjects[cog.subject.id] = {
        subject_id: cog.subject.id,
        subject_definition_id: cog.subject.definition?.id ?? null,
        subject_name: cog.subject.definition?.name ?? null,
        subject_abbr: cog.subject.definition?.abbr ?? null,
        // Mock proxy for SubjectArm.display_order: same-order iteration
        // through cognitive_records. Good enough for a mock; real backend
        // uses the actual SubjectArm.display_order.
        display_order: Object.keys(subjects).length,
        scores,
        total,
        grade_symbol: grade?.symbol ?? null,
        remark: grade?.remark ?? null,
      };
    }

    // Grading summary — count subjects per grade-symbol prefix. Clone the
    // template so every student surfaces the same keys, even if the count
    // is 0 for some prefix.
    const grading_summary: Record<string, number> = {
      ...gradingSummaryTemplate,
    };
    for (const s of Object.values(subjects)) {
      if (!s.grade_symbol) continue;
      const prefix = s.grade_symbol.match(/^[A-Za-z]+/)?.[0] ?? "";
      if (prefix && prefix in grading_summary) {
        grading_summary[prefix] += 1;
      }
    }

    // ── Behaviours ───────────────────────────────────────────────────────
    const behaviours: Record<string, TraitAssessmentResult> = {};
    const behaviourRows: TraitAssessmentResult[] = [];
    for (const aff of assessment.affective_records) {
      for (const entry of aff.scores) {
        const beh = entry.behaviour;
        const resolved = mockResolveTrait(affGrades, entry.score);
        behaviourRows.push({
          trait_id: beh.id,
          // The score-entry type marks these as optional even though every
          // real backend response populates them. Fall back to safe defaults.
          trait_name: beh.name ?? "",
          display_order: beh.display_order ?? 0,
          max_score: beh.max_score ?? 0,
          score: entry.score,
          grade_symbol: resolved.grade_symbol,
          remark: resolved.remark,
          is_absent: resolved.is_absent,
        });
      }
    }
    // Sort by display_order and build the dict — the insertion order defines
    // Object.values() iteration order for downstream consumers.
    behaviourRows.sort((a, b) => a.display_order - b.display_order);
    for (const row of behaviourRows) behaviours[row.trait_id] = row;

    // ── Skills ───────────────────────────────────────────────────────────
    const skills: Record<string, TraitAssessmentResult> = {};
    const skillRows: TraitAssessmentResult[] = [];
    for (const psy of assessment.psychomotor_records) {
      for (const entry of psy.scores) {
        const act = entry.activity;
        const resolved = mockResolveTrait(psyGrades, entry.score);
        skillRows.push({
          trait_id: act.id,
          trait_name: act.name ?? "",
          display_order: act.display_order ?? 0,
          max_score: act.max_score ?? 0,
          score: entry.score,
          grade_symbol: resolved.grade_symbol,
          remark: resolved.remark,
          is_absent: resolved.is_absent,
        });
      }
    }
    skillRows.sort((a, b) => a.display_order - b.display_order);
    for (const row of skillRows) skills[row.trait_id] = row;

    // ── Roll-up ──────────────────────────────────────────────────────────
    // Mock uses the FULL subject list as the divisor (no per-student
    // exclusions in the mock data). Real backend computes this per student.
    const subjectCount = Object.keys(subjects).length;
    const average =
      subjectCount > 0 ? mockRound2(studentTotal / subjectCount) : 0;
    totalOfAverages += average;

    // Decision — simple mock branch on the arm's pass rule if it looks like
    // a percentage-score rule. Otherwise "—".
    let decision: "Pass" | "Fail" | "—" = "—";
    if (
      passRule &&
      passRule.active !== false &&
      passRule.type === "score" &&
      Number.isFinite(passBaseValue)
    ) {
      const maxAggregate = subjectMaxScore * subjectCount;
      const requiredMark =
        passRule.decide_by === "percentage"
          ? passBaseValue * maxAggregate
          : passBaseValue;
      decision = studentTotal >= requiredMark ? "Pass" : "Fail";
    }

    rows.push({
      assessment_id: assessment.id,
      student_id: assessment.student.id,
      student_public_id: assessment.student.public_id ?? null,
      student_first_name: assessment.student.first_name,
      student_middle_name: assessment.student.middle_name ?? null,
      student_last_name: assessment.student.last_name,
      student_gender: assessment.student.gender ?? null,
      total_score: studentTotal,
      total_score_obtainable: subjectMaxScore * subjectCount,
      subject_count: subjectCount,
      average,
      // Filled in below once every student's average is known.
      position: 0,
      decision,
      subjects,
      grading_summary,
      behaviours,
      skills,
      teachers_remark: assessment.teachers_remark ?? "",
      supervisors_remark: assessment.supervisors_remark ?? "",
    });
  }

  const student_population = rows.length;
  const class_average =
    student_population > 0
      ? mockRound2(totalOfAverages / student_population)
      : 0;

  // "Competition" ranking (backend default). Averages sorted desc; ties
  // share the same position, and the next distinct position is skipped by
  // the size of the tie group.
  const ranked = [...rows].sort((a, b) => b.average - a.average);
  let currentPosition = 0;
  let previousAverage: number | null = null;
  ranked.forEach((row, index) => {
    if (previousAverage === null || row.average !== previousAverage) {
      currentPosition = index + 1;
      previousAverage = row.average;
    }
    row.position = currentPosition;
  });

  // Insertion order = position ascending so Object.values() walks the
  // cohort in leaderboard order (mirrors backend behaviour).
  ranked.sort((a, b) => a.position - b.position);
  const students: Record<string, StudentAssessmentResult> = {};
  for (const row of ranked) students[row.student_id] = row;

  return { class_average, student_population, students };
}

// Pre-compute once at module load so multiple fetches share the same object
// and repeated broadsheet renders never re-run the aggregation.
const MOCK_CLASS_RESULT: ClassAssessmentResult = computeMockClassResult(
  MOCK_ARM_DETAIL,
  MOCK_ASSESSMENTS,
);

// MOCK: GET arm/assessment/compute/?school-id=…&arm-id=<armId>
// Real call:
//   clientAuthFetch(`arm/assessment/compute/?school-id=${SCHOOL_ID}&arm-id=${armId}`)
export async function fetchBroadsheetClassResult(
  _armId: string,
): Promise<MockApiResponse<ApiEnvelope<ClassAssessmentResult>>> {
  await delay();
  return {
    data: {
      message: "Class assessment computed successfully.",
      data: MOCK_CLASS_RESULT,
    },
  };
}
