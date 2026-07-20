// ─────────────────────────────────────────────────────────────────────────────
// results.d.ts
//
// Global type declarations for the assessment-compute endpoints:
//
//   GET arm/assessment/compute/       → ClassAssessmentResult
//   GET student/assessment/compute/   → StudentAssessmentResult + class context
//
// Source of truth: backend academics/services/results_aggregation.py
// (the `compute_results` function). Any change to the wire format on the
// backend must be reflected here in lockstep — these interfaces describe the
// raw dict that JSON-serialises out of that function.
//
// Score conventions (mirrors the backend):
//   - -1   in a numeric field means the student was marked absent.
//   - null in a subject `scores` slot means no entry has been recorded yet.
//   - Both contribute 0 to totals.
// ─────────────────────────────────────────────────────────────────────────────

// One subject's cognitive result for a single student.
//
// `scores` positional contract (IMPORTANT for consumers):
//   - Length equals the number of CognitiveAssessmentUnit rows on the arm's
//     cognitive_assessment_format. Same length for EVERY student and EVERY
//     subject in the arm.
//   - Position i holds the score for the unit that lands at position i when
//     the format's units are sorted by `display_order` ascending. In other
//     words, `display_order` is a SORT KEY, not the array index. A unit with
//     display_order = 5 does NOT go at index 5.
//   - A position holds `null` when the student has no CognitiveScore row for
//     the unit at that position. Otherwise it holds the raw score integer
//     (0+, or -1 for explicit absent).
interface SubjectAssessmentResult {
  subject_id: string;
  subject_definition_id: string | null;
  subject_name: string | null;
  subject_abbr: string | null;
  display_order: number;
  scores: (number | null)[];
  total: number;
  grade_symbol: string | null;
  remark: string | null;
}

// One trait's (behaviour OR skill) result for a single student.
// `score` is always numeric: 0+ for a real mark, -1 for explicit absent.
// `is_absent` is redundant with score === -1 but kept as a first-class field
// so the UI doesn't need to duplicate the check.
interface TraitAssessmentResult {
  trait_id: string;
  trait_name: string;
  display_order: number;
  max_score: number;
  score: number;
  grade_symbol: string | null;
  remark: string | null;
  is_absent: boolean;
}

// One student's full computed row.
//
// `grading_summary` counts subjects grouped by grade-symbol prefix — e.g.
// { "A": 3, "B": 4, "C": 2 } for a student who earned three A-band, four
// B-band, and two C-band subject grades. The key set is stable across every
// student in the class (backend seeds the same keys from the arm's grading
// format), even for zero-count prefixes.
interface StudentAssessmentResult {
  assessment_id: string;
  student_id: string;
  student_public_id: string | null;
  student_first_name: string;
  student_middle_name: string | null;
  student_last_name: string;
  student_gender: string | null;
  total_score: number;
  total_score_obtainable: number;
  subject_count: number;
  average: number;
  position: number;
  decision: "Pass" | "Fail" | "—";
  subjects: Record<string, SubjectAssessmentResult>;
  grading_summary: Record<string, number>;
  behaviours: Record<string, TraitAssessmentResult>;
  skills: Record<string, TraitAssessmentResult>;
  teachers_remark: string;
  supervisors_remark: string;
}

// Whole-class response from GET arm/assessment/compute/.
// `students` insertion order = position ascending, so iterating
// `Object.values(students)` walks the cohort in leaderboard order.
interface ClassAssessmentResult {
  class_average: number;
  student_population: number;
  students: Record<string, StudentAssessmentResult>;
}
