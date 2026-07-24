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
  symbol: string; // e.g. "A", "B", "F"
  remark: string; // e.g. "Distinction", "Merit", "Fail"
  passed: boolean; // used for colour treatment in the legend
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

// ── Teacher record (from the result context endpoint) ───────────────────────

// Flat teacher shape returned by /academics/student/result/context/ and
// merged onto each subject row on the frontend. `public_id` is the human
// identifier the templates render in the Teacher ID column (e.g. "TCH-014").
export interface TeacherRef {
  id: string;
  public_id: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
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
  // Populated on the frontend by merging in data from the result context
  // endpoint. Absent from the raw check-endpoint response; present after
  // merge. Templates render `teachers[0]?.public_id ?? "—"`.
  teachers?: TeacherRef[];
}

export interface TraitAssessmentResult {
  trait_id: string;
  trait_name: string;
  display_order: number;
  max_score: number;
  score: number; // -1 = absent
  grade_symbol: string | null;
  remark: string | null;
  is_absent: boolean;
}

// Grade prefix counts (e.g. { A: 6, B: 6, C: 0, F: 2 }). Keys are stable
// across the arm so templates can iterate confidently.
export type GradingSummary = Record<string, number>;

// ── Raw check endpoint response ──────────────────────────────────────────────
// This is what /academics/student/result/check/ actually returns. It carries
// the per-student result data plus the academic-chain objects in their
// basic (id/name/abbr) form only. The frontend merges this with
// ResultContextResponse to produce the enriched StudentResultResponse that
// templates consume.

export interface CheckStudentResultResponse {
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

  // Basic (id/name/abbr) academic context — enriched during merge.
  arm: ResultAcademicRef;
  level: ResultAcademicRef;
  section: ResultAcademicRef;
  term: ResultAcademicRef;
  session: ResultAcademicRef;
  school: ResultAcademicRef;
}

// ── Context endpoint response ────────────────────────────────────────────────
// This is what /academics/student/result/context/ returns. It carries the
// arm's assessment/grading configuration, the school with address parts,
// and the arm's subject-teacher assignments. The response is stable per
// arm and can be cached aggressively.

// One SubjectArm row as returned by the context endpoint. Not to be confused
// with SubjectAssessmentResult (which is per-student). Used only during the
// merge step to hydrate `SubjectAssessmentResult.teachers`.
export interface ContextSubjectArm {
  subject_arm_id: string;
  display_order: number;
  offered: boolean;
  subject: {
    id: string;
    definition_id: string;
    name: string;
    abbr: string;
  };
  teachers: TeacherRef[];
}

export interface ResultContextResponse {
  arm: ResultArm;
  level: ResultAcademicRef;
  section: ResultAcademicRef;
  term: ResultAcademicRef;
  session: ResultAcademicRef;
  school: ResultSchoolRef;
  subjects: ContextSubjectArm[];
}

// ── Merged shape templates consume ───────────────────────────────────────────
// Produced by mergeResultAndContext() in page.tsx from the two raw responses
// above. `arm` and `school` are upgraded to their enriched types; each
// `subjects[key]` row is enriched with the matching context teachers list.
export interface StudentResultResponse extends Omit<
  CheckStudentResultResponse,
  "arm" | "school"
> {
  arm: ResultArm;
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
