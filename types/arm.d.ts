// ─────────────────────────────────────────────────────────────────────────────
// arm.d.ts
//
// Type extensions for the /arm detail page. Builds on top of the global types
// already declared in arms.d.ts (ClassArm, ArmLevel, ArmTeacher, etc.).
//
// Shapes mirror what the backend serializers actually return for the
// /dashboard/arm subtree:
//
//   ArmSerializer         (academics.serializers) — arm/detail/
//   SubjectSerializer     (academics.serializers) — subject/list/
//   AssessmentSerializer  (academics.serializers) — nested under arm.assessments
//
// Naming: every new type starts with `Arm…` so it doesn't collide with the
// project's existing globals (Subject, StudentUser, staffUser, etc.).
// ─────────────────────────────────────────────────────────────────────────────

// ── Grading format (from cog_grading_format / aff_grading_format / psy_grading_format) ──

interface ArmGradingFormatGrade {
  id: string;
  symbol: string;
  remark: string;
  low: number;
  high: number;
  passed: boolean;
}

interface ArmGradingFormat {
  id: string;
  name: string;
  abbr: string;
  grades: ArmGradingFormatGrade[];
}

// ── Cognitive assessment format (subject scoring units) ──────────────────────

interface ArmCogAssessmentUnit {
  id: string;
  name: string;
  abbr: string;
  display_order: number;
  max_score: number;
}

interface ArmCogAssessmentFormat {
  id: string;
  name: string;
  units: ArmCogAssessmentUnit[];
}

// ── Affective assessment format (behaviour scoring) ──────────────────────────
// Backend reference: AffectiveAssessmentBehaviourSerializer in users/serializers.py
// Read-only fields exposed by the API: id, behaviour, display_order, max_score, format.
// The label sits in the `behaviour` field — NOT `name` — because the underlying
// Django model uses `behaviour` as its column name (see the bulk_create call in
// AffectiveAssessmentFormatSerializer).

interface ArmAffAssessmentBehaviour {
  id: string;
  behaviour: string;
  display_order: number;
  max_score: number;
}

interface ArmAffAssessmentFormat {
  id: string;
  name: string;
  behaviours: ArmAffAssessmentBehaviour[];
}

// ── Psychomotor assessment format (activity scoring) ─────────────────────────
// Backend reference: PsychomotorAssessmentActivitySerializer in users/serializers.py
// Read-only fields exposed by the API: id, activity, display_order, max_score, format.
// The label sits in the `activity` field — NOT `name` — because the underlying
// Django model uses `activity` as its column name (see the bulk_create call in
// PsychomotorAssessmentFormatSerializer).

interface ArmPsyAssessmentActivity {
  id: string;
  activity: string;
  display_order: number;
  max_score: number;
}

interface ArmPsyAssessmentFormat {
  id: string;
  name: string;
  activities: ArmPsyAssessmentActivity[];
}

// ── Pass rule (from arm.pass_rule) ───────────────────────────────────────────
// Backend reference: PassRuleSerializer + PassRuleSubjectSerializer.
// Two dimensions describe the rule:
//   - `type`       — whether passing is decided by aggregate score or by the
//                    number/proportion of subjects passed.
//   - `decide_by`  — whether the threshold is a raw value or a percentage
//                    (0–1 fraction) of the maximum.
//
// `base_value` arrives as a string because Django's DecimalField is serialized
// as a string by DRF. UI code should parseFloat it before any maths.
//
// `subjects` lists per-subject prerequisite thresholds (PassRuleSubject rows)
// keyed off SubjectDefinition so they survive across terms. Each subject in
// this list must independently meet its own threshold for the student to pass.

interface ArmPassRuleSubjectDefinition {
  id: string;
  name: string;
  abbr: string;
}

interface ArmPassRuleSubject {
  id: string;
  // String (DecimalField). Interpretation matches the parent rule's decide_by.
  base_value: string;
  subject_definition: ArmPassRuleSubjectDefinition;
}

interface ArmPassRule {
  id: string;
  name: string;
  type: "score" | "count";
  decide_by: "raw" | "percentage";
  // DecimalField — string from the API. For percentage: a fraction in [0, 1].
  // For raw + score: a mark threshold. For raw + count: an integer subject count.
  base_value: string;
  active: boolean;
  // Subject-level prerequisites. May be an empty array when only the aggregate
  // rule applies.
  subjects: ArmPassRuleSubject[];
}

// ── Student record as used by this page ──────────────────────────────────────
// Matches what the student/list/?arm-id=… endpoint returns: a slimmer set of
// fields than the full StudentSerializer, focused on what's shown in lists.

interface ArmStudent {
  id: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  public_id?: string;
  gender?: "M" | "F" | "O";
  email?: string;
  phone?: string;
}

// ── Subject record (from subject/list/?term-id=…&arm=…) ──────────────────────
// Backend SubjectSerializer's representation for the arm-scoped list view:
//   include_subject_fields:        ("id", "definition", "term", "subject_arms",
//                                   "excluded_students")
//   include_subjectdefinition_fields: ("id", "name", "abbr")
//   include_term_fields:           ("id", "name")
//   include_subjectarm_fields:     ("id", "arm", "teachers")
//   include_arm_fields:            ("id", "name", "abbr")
//   include_staffportfolio_fields: ("id", "staff_profile")
//   include_staffprofile_fields:   ("id", "user")
//   include_customuser_fields:     ("id", "first_name", "last_name")
//
// `excluded_students` is a list of nested student objects (id + identity
// fields — no gender/email/phone), returned by the SubjectSerializer. The
// Subjects tab maps it down to the set of ids and filters the arm roster to
// the students who actually offer the selected subject.

interface ArmSubjectArm {
  id: string;
  arm: { id: string; name: string; abbr: string };
  // Each teacher is a full StaffPortfolio object — same shape as ArmTeacher
  // from arms.d.ts, so the Subjects tab can render names without an extra
  // staff fetch.
  teachers: ArmTeacher[];
}

interface ArmSubject {
  id: string;
  definition: { id: string; name: string; abbr: string };
  term?: { id: string; name: string };
  subject_arms: ArmSubjectArm[];
  // Students explicitly excluded from this subject. Each item is a minimal
  // student object — only `id` is needed for filtering, but the identity
  // fields are also present in case the UI ever wants to list excluded
  // students by name without an extra fetch.
  excluded_students: ArmStudent[];
}

// ── Assessment record (per student, per arm) ─────────────────────────────────
// Returned as part of arm/detail/ via the AssessmentSerializer. Each Assessment
// has at most one cognitive_record per subject the student takes; one
// affective_record total (with N behaviour-scores inside); and one
// psychomotor_record total (with N activity-scores inside).

interface ArmCognitiveScoreEntry {
  id: string;
  // Unit reference — `unit.id` is what we key on when looking up a cell value.
  unit: {
    id: string;
    name?: string;
    abbr?: string;
    display_order?: number;
    max_score?: number;
  };
  score: number;
}

interface ArmCognitiveRecord {
  id: string;
  // Subject reference — `subject.id` is how we filter records to the
  // currently-selected subject in the Subjects tab.
  subject: {
    id: string;
    definition?: { id: string; name: string; abbr: string };
  };
  scores: ArmCognitiveScoreEntry[];
}

interface ArmAffectiveScoreEntry {
  id: string;
  behaviour: {
    id: string;
    name?: string;
    abbr?: string;
    display_order?: number;
    max_score?: number;
  };
  score: number;
}

interface ArmAffectiveRecord {
  id: string;
  scores: ArmAffectiveScoreEntry[];
}

interface ArmPsychomotorScoreEntry {
  id: string;
  activity: {
    id: string;
    name?: string;
    abbr?: string;
    display_order?: number;
    max_score?: number;
  };
  score: number;
}

interface ArmPsychomotorRecord {
  id: string;
  scores: ArmPsychomotorScoreEntry[];
}

interface ArmAssessmentRecord {
  id: string;
  // Backend AssessmentSerializer's default representation for the `student`
  // FK is the full nested object (id + identity fields). UI code reads
  // `record.student.first_name` directly.
  student: ArmStudent;
  teachers_remark?: string | null;
  supervisors_remark?: string | null;
  cognitive_records: ArmCognitiveRecord[];
  affective_records: ArmAffectiveRecord[];
  psychomotor_records: ArmPsychomotorRecord[];
}

// ── ClassArm augmentation ────────────────────────────────────────────────────
// Adds the detail-only fields onto the global ClassArm interface via TypeScript
// declaration merging. The base shape comes from arms.d.ts; this just extends.

interface ClassArm {
  cog_grading_format?: ArmGradingFormat | null;
  aff_grading_format?: ArmGradingFormat | null;
  psy_grading_format?: ArmGradingFormat | null;

  cognitive_assessment_format?: ArmCogAssessmentFormat | null;
  affective_assessment_format?: ArmAffAssessmentFormat | null;
  psychomotor_assessment_format?: ArmPsyAssessmentFormat | null;

  // Pass rule governing whether a student passes the term in this arm.
  // Null when the arm has no rule configured — the Pass Rule tab surfaces a
  // CTA in that case.
  pass_rule?: ArmPassRule | null;

  // Populated by arm/detail/. Backend related_name is "assessments" (plural),
  // matching the JSON key in the response. Students with no recorded scores
  // simply don't appear in the array; the view layer joins against the class
  // roster (filtered by Subject.excluded_students) to render blank cells for
  // students who offer the subject but haven't been scored yet.
  assessments?: ArmAssessmentRecord[];
}
