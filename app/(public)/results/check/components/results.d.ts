// ─────────────────────────────────────────────────────────────────────────────
// results.d.ts
//
// Types for the /results check-student-result flow.
//
// These mirror the shape returned by
//   POST academics/student/result/check/
// once the CheckStudentResultView is extended (planned as the second delivery)
// to include the arm's assessment configuration and grading formats —
// everything a result template needs to render itself faithfully.
//
// Design note:
//   The check response reuses the shape produced by compute_results() (see
//   backend results_aggregation.py) plus the academic-context enrichment
//   (arm / level / section / term / session / school). The templates only
//   need to know about these types — they never fetch anything themselves,
//   they just receive `StudentResultResponse` as a prop.
//
//   Because the same template components are reusable inside the broadsheet
//   "print student results" flow, the shape here is deliberately independent
//   of any transport concern — a caller that already has all the data in
//   local state can pass it directly.
// ─────────────────────────────────────────────────────────────────────────────

// ── Nested primitives ─────────────────────────────────────────────────────────

// One row inside a grading format's grades list. Drives the legend cards
// (Cognitive / Behaviour / Skills) at the bottom of each template.
export interface ResultGrade {
  id: string;
  low: number;
  high: number;
  symbol: string;   // e.g. "A", "B", "F"
  remark: string;   // e.g. "Distinction", "Merit", "Fail"
  passed: boolean;  // used for colour treatment in the legend
}

// A grading format bundles together a set of grades over a low–high range.
export interface ResultGradingFormat {
  id: string;
  name: string;
  low: number;
  high: number;
  grades: ResultGrade[];
}

// One cognitive assessment unit (e.g. "Class Work (30)", "Term Exam (70)").
// Drives the cognitive table's unit column headers.
export interface ResultCognitiveUnit {
  id: string;
  name: string;
  abbr: string;
  max_score: number;
  display_order: number;
}

// The parent format that owns the units above.
export interface ResultCognitiveAssessmentFormat {
  id: string;
  name: string;
  units: ResultCognitiveUnit[];
}

// Which frontend template component to render, plus its per-arm config.
// `template_key` maps to an entry in the template registry; unknown or
// missing keys fall through to the fallback template.
export interface ResultTemplateMeta {
  id: string;
  name: string;
  template_key: string;
  config: Record<string, unknown>;
}

// ── Academic context objects (level → school chain) ──────────────────────────
// Each object carries just id/name/abbr; school also carries address parts
// so templates can render the full school-identity line.

export interface ResultAcademicRef {
  id: string;
  name: string;
  abbr: string;
}

export interface ResultSchoolRef extends ResultAcademicRef {
  address: string | null;
  city: string | null;
  lga: string | null;
  state: string | null;
  country: string | null;
}

// ── Arm object as returned inside the result response ────────────────────────
// The arm here carries the assessment configuration bundled in — templates
// read units and grade legends off this object rather than making a
// secondary call.

export interface ResultArm extends ResultAcademicRef {
  cognitive_assessment_format: ResultCognitiveAssessmentFormat | null;
  cog_grading_format: ResultGradingFormat | null;
  aff_grading_format: ResultGradingFormat | null;
  psy_grading_format: ResultGradingFormat | null;
  result_template: ResultTemplateMeta | null;
}

// ── Per-subject / per-trait / per-skill rows ─────────────────────────────────
// These mirror _build_subject_row / _build_behaviour_rows / _build_skill_rows
// in results_aggregation.py. Positional score arrays: index N corresponds to
// the unit at position N in `cognitive_assessment_format.units` sorted by
// display_order ascending. Missing scores are null; explicit "absent" is -1.

export interface SubjectAssessmentResult {
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

export interface TraitAssessmentResult {
  trait_id: string;
  trait_name: string;
  display_order: number;
  max_score: number;
  score: number;              // -1 = absent
  grade_symbol: string | null;
  remark: string | null;
  is_absent: boolean;
}

// Grade prefix counts (e.g. { A: 6, B: 6, C: 0, F: 2 }). Keys are stable
// across the arm so templates can iterate confidently.
export type GradingSummary = Record<string, number>;

// ── Top-level student result payload ─────────────────────────────────────────

export interface StudentResultResponse {
  // Class-level context, always surfaced so the template can render
  // "Position 3 of 42" and "Class avg 65.42%" without a second call.
  class_average: number;
  student_population: number;

  // Student identity
  assessment_id: string;
  student_id: string;
  student_public_id: string | null;
  student_first_name: string;
  student_middle_name: string | null;
  student_last_name: string;
  student_gender: string;

  // Aggregates for this student
  total_score: number;
  total_score_obtainable: number;
  subject_count: number;
  average: number;
  position: number;
  decision: "Pass" | "Fail" | "—" | string;

  // Detailed rows — keyed dicts so consumers can lookup by id AND iterate
  // in the display order the backend already applied.
  subjects: Record<string, SubjectAssessmentResult>;
  grading_summary: GradingSummary;
  behaviours: Record<string, TraitAssessmentResult>;
  skills: Record<string, TraitAssessmentResult>;

  // Remarks
  teachers_remark: string;
  supervisors_remark: string;

  // Academic-context objects walked from the assessment's parent chain
  arm: ResultArm;
  level: ResultAcademicRef;
  section: ResultAcademicRef;
  term: ResultAcademicRef;
  session: ResultAcademicRef;
  school: ResultSchoolRef;
}

// The envelope every API call in this codebase uses.
export interface ApiEnvelope<T> {
  message: string;
  data: T;
}

// ── Form input types ─────────────────────────────────────────────────────────

// The payload the /results form submits to the backend. Session and term are
// deliberately absent — they don't reach the backend; the arm_id alone
// pins down the academic context. The dropdowns exist for user guidance only.
export interface CheckStudentResultPayload {
  pin: string;
  arm_id: string;
  student_public_id: string;
  ranking?: "ordinal" | "competition" | "dense";
}
