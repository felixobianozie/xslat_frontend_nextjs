// ─────────────────────────────────────────────────────────────────────────────
// types/configurations.ts
//
// Response shapes for the Configurations page
// (app/dashboard/configurations).
//
// Each interface mirrors what the matching backend endpoint returns given the
// dynamic-fields context its view passes to the serializer. Fields the
// backend does not always return are marked optional.
// ─────────────────────────────────────────────────────────────────────────────

// Standard backend envelope returned by every non-paginated endpoint.
export interface ApiEnvelope<T> {
  message: string;
  data: T;
}

// Minimal school reference nested inside list and detail responses.
export interface SchoolRef {
  id: string;
  name: string;
}

// ── School Policies ─────────────────────────────────────────────────────────────────

// school-settings/detail/ — `modified_on` is null while the school is still
// on the default values (no row has been saved yet).
export interface SchoolSettingsData {
  id: string | null;
  allow_teacher_view_after_publish: boolean;
  require_prev_term_result_before_current: boolean;
  require_psychomotor_for_arm_broadsheet_submission: boolean;
  require_affective_for_arm_broadsheet_submission: boolean;
  require_all_arms_approved_for_publish: boolean;
  created_on: string | null;
  modified_on: string | null;
}

// pins/policy/detail/ — `updated_at` is null while the school is still on the
// default values.
export interface PinPolicyData {
  require_pin: boolean;
  require_school_scoped_result_pins: boolean;
  require_school_scoped_validation_pins: boolean;
  created_at: string | null;
  updated_at: string | null;
}

// ── Grading formats ──────────────────────────────────────────────────────────

export interface GradeBand {
  id: string;
  low: number;
  high: number;
  symbol: string;
  remark: string;
  passed: boolean;
}

export interface GradingFormatRecord {
  id: string;
  name: string;
  low: number;
  high: number;
  grades: GradeBand[];
  school?: SchoolRef;
}

// ── Assessment formats ───────────────────────────────────────────────────────

export interface CognitiveUnit {
  id: string;
  name: string;
  abbr: string;
  max_score: number;
  display_order: number;
}

// The cognitive list/detail responses do not include `low` and `high`.
export interface CognitiveFormatRecord {
  id: string;
  name: string;
  low?: number;
  high?: number;
  units: CognitiveUnit[];
  school?: SchoolRef;
}

export interface AffectiveBehaviour {
  id: string;
  behaviour: string;
  max_score: number;
  display_order: number;
}

export interface AffectiveFormatRecord {
  id: string;
  name: string;
  behaviours: AffectiveBehaviour[];
  school?: SchoolRef;
}

export interface PsychomotorActivity {
  id: string;
  activity: string;
  max_score: number;
  display_order: number;
}

export interface PsychomotorFormatRecord {
  id: string;
  name: string;
  activities: PsychomotorActivity[];
  school?: SchoolRef;
}

// ── Subject definitions ──────────────────────────────────────────────────────

export interface SubjectDefinitionRecord {
  id: string;
  name: string;
  abbr: string;
}

// ── Term subjects ────────────────────────────────────────────────────────────

// A subject definition offered in one term. `subject_arms` lists the arms of
// that term that offer it.
export interface TermSubjectRecord {
  id: string;
  definition: SubjectDefinitionRecord;
  subject_arms: {
    id: string;
    arm: { id: string; name: string; abbr: string };
  }[];
}

// ── Pass rules ───────────────────────────────────────────────────────────────

export type PassRuleType = "score" | "count";
export type PassRuleDecideBy = "raw" | "percentage";

export interface PassRuleSubjectRecord {
  id: string;
  // DRF serialises decimals as strings, e.g. "0.50".
  base_value: string;
  subject_definition: { id: string; name: string };
}

export interface PassRuleRecord {
  id: string;
  name: string;
  type: PassRuleType;
  decide_by: PassRuleDecideBy;
  // Decimal string. A fraction between 0 and 1 when decide_by is "percentage".
  base_value: string;
  active: boolean;
  subjects: PassRuleSubjectRecord[];
  school?: SchoolRef;
}

// ── Result templates ─────────────────────────────────────────────────────────

export type ResultTemplateScope = "universal" | "school";

// result-template/list/ returns the universal templates plus the school's own.
// `config` is the template's free-form options object, for example
// { "show_attendance": true, "accent": "#003366" }; it is empty when the
// template has none.
export interface ResultTemplateListItem {
  id: string;
  name: string;
  template_key: string;
  description: string;
  scope: ResultTemplateScope;
  school: SchoolRef | null;
  config: Record<string, unknown>;
  preview_image_url: string;
  is_active: boolean;
  created_on: string;
}

// ── School calendar ──────────────────────────────────────────────────────────

// session/list/ nests a short version of each term.
export interface SessionTermRef {
  id: string;
  name: string;
  current: boolean;
}

export interface SessionRecord {
  id: string;
  name: string;
  // Date-only strings such as "2025-09-08".
  starts: string;
  ends: string | null;
  current: boolean;
  // True once the session has been current and then closed.
  initialized: boolean;
  terms: SessionTermRef[];
}

export type TermResultsStatus = "nota" | "computing" | "published";

// A term as the calendar holds it: term/list/ fields plus the status fields
// that only term/detail/ returns.
export interface TermRecord {
  id: string;
  name: string;
  abbr: string;
  starts: string;
  ends: string | null;
  current: boolean;
  initialized: boolean;
  results_status: TermResultsStatus;
  closed_at: string | null;
  session: { id: string; name: string };
}

// The fields of school/detail/ used on this page. The cache entry is shared
// with the dashboard top bar, so extra fields may also be present.
//
// The profile fields after `city` are optional because GET school/detail/
// returns only id, name, abbr, city and current_term, while PUT school/detail/
// returns every field. `long` and `latt` are decimal strings such as
// "6.524379".
export interface SchoolDetailData {
  id: string;
  name: string;
  abbr: string;
  city?: string;
  address?: string;
  lga?: string;
  state?: string;
  country?: string;
  long?: string | null;
  latt?: string | null;
  school_website?: string;
  custom_url?: string;
  current_term: {
    id: string;
    name: string;
    abbr: string;
    session: { id: string; name: string };
  } | null;
}

// ── Term migration ───────────────────────────────────────────────────────────

export type TermMigrationMode = "same_session" | "session_rollover";

export interface MigrationReportData {
  sections_created: number;
  levels_created: number;
  arms_created: number;
  subjects_created: number;
  subject_arms_created: number;
  enrollments_created: number;
  unmigrated_students: {
    student_id: string;
    student_name: string;
    source_arm_label: string;
    reason: string;
  }[];
  repeated_students: {
    student_id: string;
    student_name: string;
    source_arm_label: string;
    destination_arm_label: string;
  }[];
  auto_created: {
    kind: string;
    name: string;
    reason: string;
    parent_label: string;
    source_label: string;
  }[];
  dropped_staff_fks: {
    arm_label: string;
    role: string;
    staff_portfolio_id: string;
    reason: string;
    subject_name: string;
  }[];
  dropped_subject_exclusions: {
    subject_name: string;
    student_id: string;
    student_name: string;
    reason: string;
  }[];
  notes: string[];
}

// ── Arm Settings ─────────────────────────────────────────────────────────────

export interface NamedRef {
  id: string;
  name: string;
}

// The part of arm/detail/ that shows which school parameters an arm uses.
export interface ArmAssignmentsData {
  id: string;
  cog_grading_format: NamedRef | null;
  aff_grading_format: NamedRef | null;
  psy_grading_format: NamedRef | null;
  cognitive_assessment_format: NamedRef | null;
  affective_assessment_format: NamedRef | null;
  psychomotor_assessment_format: NamedRef | null;
  pass_rule: NamedRef | null;
  result_template: NamedRef | null;
}

// ── Roles and permissions ────────────────────────────────────────────────────

// A school role. `name` is the clean name without the school prefix and
// `permissions` lists the codenames granted to the role.
export interface RoleRecord {
  id: number;
  name: string;
  permissions: string[];
}

// One entry of the permission catalogue.
export interface PermissionRecord {
  codename: string;
  label: string;
  category: string;
  type: string;
}

// ── School structure ─────────────────────────────────────────────────────────

// A section of a term (for example Junior Secondary), as returned by
// section/list/. `terminal` marks the school's final section: students graduate
// when they finish the final level of the final section.
export interface SectionRecord {
  id: string;
  name: string;
  abbr: string;
  promotion_order: number;
  terminal: boolean;
}

// A level of a section (for example Year 1), as returned by level/list/.
// `terminal` marks the final level of its section.
export interface LevelRecord {
  id: string;
  name: string;
  abbr: string;
  promotion_order: number;
  terminal: boolean;
}
