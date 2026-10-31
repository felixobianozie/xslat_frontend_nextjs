import type { Ref } from "react";

// ──────────────────────────────────────────
// types.ts
//
// The types of the result-sheet package.
//
// They describe everything a result template needs to render itself faithfully:
// one student's computed result (StudentResultData) together with its context,
// which is the arm's assessment configuration and grading formats, the school's
// details and the subjects' teachers (ResultContextResponse). The two are
// combined into the StudentResultResponse a template draws.
//
// Design note:
//   The result fields follow the shape produced by compute_results() on the
//   backend (results_aggregation.py). The templates only need these types: they
//   never fetch anything, they receive a `StudentResultResponse` as a prop.
//
//   The shape is independent of any transport concern. The public result check
//   builds it from the check endpoint's response (see resultcheck.ts), and a
//   screen that already holds the data can pass it in directly.
// ──────────────────────────────────────────

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

// ── Teacher record (from the result context) ───────────────────────

// A subject's teacher, as the result context carries it, and as it is merged onto
// each subject row. The result check is public, so only the public identifier is
// sent. `public_id` is what the templates render in the Teacher ID column (e.g.
// "TCH-014").
export interface TeacherRef {
  public_id: string;
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

// ── The term, with when its results were published ───────────────────────
// `results_published_at` is an ISO timestamp in UTC. It is null only when the
// backend has no publication time for a published term; the templates then
// print today's date (see formatIssueDate).
export interface ResultTermRef extends ResultAcademicRef {
  results_published_at: string | null;
}

// ── One student's computed result ────────────────────────────────────────
// The numbers and rows of a result, without the academic context around them.
// The check endpoint returns exactly these fields next to `context`.
export interface StudentResultData {
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
  // Empty string when the student has no registration number.
  student_reg_numb: string;

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
}

// ── The result sheet's context ───────────────────────────────────────────
// Everything a sheet needs beyond one student's own numbers: the arm's formats,
// grading and template, the level, section, term, session and school, and the
// subjects with their teachers. Holds no student data.

// One SubjectArm row of the context. Not to be confused with
// SubjectAssessmentResult, which is per student. Used to hydrate
// `SubjectAssessmentResult.teachers`.
export interface ContextSubjectArm {
  subject_arm_id: string;
  display_order: number;
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
  term: ResultTermRef;
  session: ResultAcademicRef;
  school: ResultSchoolRef;
  subjects: ContextSubjectArm[];
}

// ── What a template renders ──────────────────────────────────────────────
// One student's result with its context spread out, and each subject row
// hydrated with its teachers. Whatever the data came from (the public check,
// or a screen for staff), it is turned into this before it reaches a sheet.
export interface StudentResultResponse extends StudentResultData {
  arm: ResultArm;
  level: ResultAcademicRef;
  section: ResultAcademicRef;
  term: ResultTermRef;
  session: ResultAcademicRef;
  school: ResultSchoolRef;
}

// ── The contract every template implements ───────────────────────────────
export interface ResultTemplateProps {
  // The student's result, with its context. Templates draw everything from here.
  result: StudentResultResponse;
  // Free-form settings from `arm.result_template.config`. A template may read
  // the keys it knows and must tolerate their absence.
  config?: Record<string, unknown>;
  // Attached to the printable A4 page root. The viewer uses it to rasterise
  // exactly that node for the PDF download. Optional, because a sheet shown
  // inline needs no print or PDF flow.
  printRef?: Ref<HTMLDivElement>;
}
