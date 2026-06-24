// ─────────────────────────────────────────────────────────────────────────────
// results-aggregates.ts
//
// Pure helpers (no React, no fetching) that turn the raw `arm.assessments` array
// plus grading formats into a UI-friendly results structure.
//
// What's computed (Phase 1 — academics only):
//   - For each student: per-subject total, grade symbol, remark, and the
//     student's overall average + class position + Pass/Fail decision.
//   - For the class: average across student averages, and total population.
//
// Conventions inherited from the original draft:
//   - A score of -1 means "absent" and contributes 0 to the subject total.
//   - Student average divides by total class subject count (not just the
//     subjects the student takes). Matches existing backend semantics.
//   - Position is by descending average, 1-based, ties broken by sort order.
//
// Pass/Fail decision:
//   - Sourced from the arm's pass rule (arm.pass_rule). The rule has four
//     shapes (type × decide_by) plus optional per-subject prerequisites.
//     See decideOutcome() below for the full evaluation flow.
//   - When the arm has no pass rule (or it's inactive), or when the student
//     has no cognitive records, the decision is "—" (undecidable).
//
// All numeric outputs round to 2 decimal places to keep the UI consistent.
//
// Backend shape adaptation:
//   Real arm.assessments records carry:
//     - cognitive_records: [{ id, subject: {id, definition:{id,…}}, scores: [{unit:{…, max_score}, score}] }]
//     - affective_records: [{ id, scores: [{behaviour, score}] }]    (1 per assessment)
//     - psychomotor_records: [{ id, scores: [{activity, score}] }]   (1 per assessment)
//
//   The output shapes below stay the same as before (flat number[] per subject
//   indexed by unit.display_order, trait maps keyed by trait id) so all
//   downstream consumers — ResultsAcademicsView, ResultsTraitsGridView,
//   ResultsGeneralView — keep working without touching their render code.
// ─────────────────────────────────────────────────────────────────────────────

export type ResultsFilterKey =
  | "ACADEMICS"
  | "BEHAVIOURS"
  | "SKILLS"
  | "GENERAL";

export interface SubjectAssessmentResult {
  subject_id: string;
  // Sparse array — scores[unit.display_order] = score. Holes are allowed for
  // units the student wasn't scored on; consumers handle them as "—".
  scores: number[];
  total: number; // sum of scores (absent = -1 contributes 0)
  grade_symbol: string | null;
  remark: string | null;
}

// Affective + psychomotor are scored one number per trait. The shape is
// identical for both, so a single TraitAssessmentResult interface covers
// both with a `kind` discriminator on usage sites that need it.
export interface TraitAssessmentResult {
  // The id of the trait (behaviour_id or activity_id).
  trait_id: string;
  // Raw score. -1 means absent; 0+ is a real rating.
  score: number;
  grade_symbol: string | null;
  remark: string | null;
  isAbsent: boolean;
}

export interface StudentAssessmentResult {
  student_id: string;
  average: number;
  position: number;
  decision: "Pass" | "Fail" | "—";
  // Map from subject id → that subject's computed assessment.
  subjects: Record<string, SubjectAssessmentResult>;
  // Map from behaviour id → that behaviour's computed result.
  behaviours: Record<string, TraitAssessmentResult>;
  // Map from activity id → that activity's computed result.
  skills: Record<string, TraitAssessmentResult>;
  // Remarks copied through from the raw record (kept here so the UI doesn't
  // need to re-traverse the original assessment array).
  teachers_remark: string;
  supervisors_remark: string;
}

export interface ClassAssessmentResult {
  class_average: number;
  student_population: number;
  // Map from student id → that student's computed assessment.
  students: Record<string, StudentAssessmentResult>;
}

// Round to 2 decimal places without floating-point drift.
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

// Sum a score array, treating -1 (absent marker) and holes as 0.
function sumScores(scores: number[]): number {
  // .reduce skips array holes natively; the `s > 0` guard handles -1 and 0.
  return scores.reduce((acc, s) => (s > 0 ? acc + s : acc), 0);
}

// Parses an API DecimalField (DRF serializes it as a string like "0.50") into
// a number. Returns NaN when the input is missing or malformed so callers can
// treat that as "undecidable" rather than silently using a wrong value.
function parseDecimal(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return NaN;
  const n = typeof value === "number" ? value : parseFloat(value);
  return Number.isFinite(n) ? n : NaN;
}

// Sums actual unit scores in one cognitive record. Mirrors sumScores'
// treatment of -1 (absent) and missing values as 0 contribution. Kept
// separate from sumScores because decideOutcome operates on the raw record
// (not the sparse flat array built inside computeClassAssessment).
function subjectTotalOf(cog: ArmCognitiveRecord): number {
  let total = 0;
  for (const entry of cog.scores) {
    if (typeof entry.score === "number" && entry.score > 0) {
      total += entry.score;
    }
  }
  return total;
}

// The maximum achievable score for one cognitive record — the sum of every
// unit's max_score. Used to translate "percentage" thresholds into the
// concrete mark value that needs to be matched.
function subjectMaxOf(cog: ArmCognitiveRecord): number {
  let max = 0;
  for (const entry of cog.scores) {
    max += entry.unit?.max_score ?? 0;
  }
  return max;
}

// Look up the grade band a score falls into. Returns null when the
// format is missing, the score is negative (absent — handled separately),
// or no band matches.
export function findGradeForScore(
  format: ArmGradingFormat | null | undefined,
  total: number,
): { symbol: string; remark: string } | null {
  if (!format || total < 0) return null;
  for (const grade of format.grades) {
    if (total >= grade.low && total <= grade.high) {
      return { symbol: grade.symbol, remark: grade.remark };
    }
  }
  return null;
}

// Does the student's total fall into a grade band marked `passed: true`?
// Used by the "count" pass rule type to decide which subjects qualify as
// passed before counting them. Returns false when the format is missing,
// the score is negative (absent), or no band matches.
function isSubjectPassed(
  format: ArmGradingFormat | null | undefined,
  total: number,
): boolean {
  if (!format || total < 0) return false;
  for (const grade of format.grades) {
    if (total >= grade.low && total <= grade.high) {
      return Boolean(grade.passed);
    }
  }
  return false;
}

// Resolve the displayable grade for a single trait score. Centralizes the
// "absent" special case so callers don't need to repeat it.
export function resolveTraitGrade(
  format: ArmGradingFormat | null | undefined,
  score: number,
): { symbol: string | null; remark: string | null; isAbsent: boolean } {
  if (score === -1) {
    return { symbol: null, remark: "Absent", isAbsent: true };
  }
  const grade = findGradeForScore(format, score);
  return {
    symbol: grade?.symbol ?? null,
    remark: grade?.remark ?? null,
    isAbsent: false,
  };
}

// Apply the arm's pass rule to one student's cognitive records to produce a
// final Pass / Fail / "—" decision.
//
// Returns "—" (undecidable) when:
//   - the arm has no pass rule, or the rule is marked inactive
//   - the student has no cognitive records to evaluate
//   - base_value is missing or malformed
//   - the rule has an unrecognised `type`
//
// Otherwise the evaluation runs in two phases:
//
//   1. Subject prerequisites — every PassRuleSubject in rule.subjects must
//      be satisfied. Each prereq is matched against the student's cognitive
//      records by SubjectDefinition id (cog.subject.definition.id), and its
//      threshold is compared against the student's total for that subject:
//        - decide_by="raw"        → threshold is the raw mark
//        - decide_by="percentage" → threshold = base_value × subject's max
//      If the student has no record for a prereq subject, the prereq fails.
//      Any failing prereq short-circuits the whole decision to "Fail".
//
//   2. Main rule — applied only after every prereq passed:
//        - type="score": compare the student's aggregate (sum of subject
//          totals) against the threshold:
//            decide_by="raw"        → threshold = base_value
//            decide_by="percentage" → threshold = base_value × max aggregate
//          where max aggregate = sum of subjectMax across the student's
//          actual records (so students excluded from a subject aren't
//          penalised against marks they couldn't have earned).
//        - type="count": count how many subjects the student passed (using
//          the cognitive grading format's grade.passed flag) and compare:
//            decide_by="raw"        → threshold = base_value (subject count)
//            decide_by="percentage" → threshold = base_value × subjects-offered
//          where subjects-offered = number of cognitive records, matching
//          the rule's natural-language phrasing "of the subjects they offer".
export function decideOutcome(
  cognitiveRecords: ArmCognitiveRecord[] | null | undefined,
  passRule: ArmPassRule | null | undefined,
  cogGradingFormat: ArmGradingFormat | null | undefined,
): "Pass" | "Fail" | "—" {
  // Cannot decide without an active rule or without anything to evaluate.
  if (!passRule || passRule.active === false) return "—";

  const records = cognitiveRecords ?? [];
  if (records.length === 0) return "—";

  // The main rule's threshold value. Parsed once up front; if it's
  // malformed the rule is effectively unusable.
  const baseValue = parseDecimal(passRule.base_value);
  if (!Number.isFinite(baseValue)) return "—";

  // ── Phase 1: subject prerequisites ─────────────────────────────────────
  // Each PassRuleSubject must be satisfied. A missing record for a prereq
  // subject counts as failing it (the student wasn't assessed on a subject
  // the school requires them to clear).
  for (const prereq of passRule.subjects ?? []) {
    const prereqDefId = prereq.subject_definition?.id;
    if (!prereqDefId) continue; // Defensive — skip malformed prereqs.

    // Match by SubjectDefinition id (PassRuleSubject is school-scoped, the
    // cognitive_record's subject is term-scoped, but both share the same
    // definition).
    const cog = records.find((r) => r.subject?.definition?.id === prereqDefId);
    if (!cog) return "Fail";

    const prereqThreshold = parseDecimal(prereq.base_value);
    if (!Number.isFinite(prereqThreshold)) continue; // Skip malformed entries.

    const studentTotal = subjectTotalOf(cog);
    const requiredMark =
      passRule.decide_by === "percentage"
        ? prereqThreshold * subjectMaxOf(cog)
        : prereqThreshold;

    if (studentTotal < requiredMark) return "Fail";
  }

  // ── Phase 2: main rule ─────────────────────────────────────────────────
  if (passRule?.type === "score") {
    // Sum the student's scores and max-possible scores across all their
    // cognitive records in one pass.
    let aggregate = 0;
    let maxAggregate = 0;
    for (const cog of records) {
      aggregate += subjectTotalOf(cog);
      maxAggregate += subjectMaxOf(cog);
    }

    const requiredMark =
      passRule.decide_by === "percentage"
        ? baseValue * maxAggregate
        : baseValue;

    return aggregate >= requiredMark ? "Pass" : "Fail";
  }

  if (passRule.type === "count") {
    // Count how many subjects the student passed (per grading format).
    let passedCount = 0;
    for (const cog of records) {
      if (isSubjectPassed(cogGradingFormat, subjectTotalOf(cog))) {
        passedCount += 1;
      }
    }

    const requiredCount =
      passRule.decide_by === "percentage"
        ? baseValue * records.length
        : baseValue;

    return passedCount >= requiredCount ? "Pass" : "Fail";
  }

  // Unknown / future rule type — be honest rather than guess.
  return "—";
}

// Main entry point — single pass over the raw assessment array, two-pass for
// position ranking (sort by average, then assign 1-based ranks).
//
// Parameters:
//   - assessment: arm.assessments array (from arm/detail/)
//   - cogGradingFormat: arm.cog_grading_format (for cognitive grade lookups
//     and the per-subject "passed" check used by count-type pass rules)
//   - affGradingFormat: arm.aff_grading_format (for behaviour grade lookups)
//   - psyGradingFormat: arm.psy_grading_format (for skill grade lookups)
//   - passRule: arm.pass_rule (drives the Pass/Fail decision per student)
//   - totalClassSubjects: count of subjects offered in the arm (used as the
//     denominator for student average — matches draft semantics)
export function computeClassAssessment(
  assessment: ArmAssessmentRecord[] | null | undefined,
  cogGradingFormat: ArmGradingFormat | null | undefined,
  affGradingFormat: ArmGradingFormat | null | undefined,
  psyGradingFormat: ArmGradingFormat | null | undefined,
  passRule: ArmPassRule | null | undefined,
  totalClassSubjects: number,
): ClassAssessmentResult {
  const students: Record<string, StudentAssessmentResult> = {};

  if (!assessment || assessment.length === 0 || totalClassSubjects === 0) {
    return { class_average: 0, student_population: 0, students };
  }

  let totalAverages = 0;

  for (const record of assessment) {
    // ── Cognitive subjects ─────────────────────────────────────────────────
    // For each cognitive_record, flatten its {unit, score} entries into a
    // sparse number[] indexed by unit.display_order so the downstream
    // ResultsAcademicsView (which reads scores[unit.display_order]) keeps
    // working without changes.
    const subjects: Record<string, SubjectAssessmentResult> = {};
    let totalScore = 0;

    for (const cog of record.cognitive_records) {
      const flat: number[] = [];
      for (const entry of cog.scores) {
        const order = entry.unit.display_order;
        if (typeof order === "number") {
          flat[order] = entry.score;
        }
      }

      const total = sumScores(flat);
      totalScore += total;
      const grade = findGradeForScore(cogGradingFormat, total);
      subjects[cog.subject.id] = {
        subject_id: cog.subject.id,
        scores: flat,
        total,
        grade_symbol: grade?.symbol ?? null,
        remark: grade?.remark ?? null,
      };
    }

    // ── Affective behaviours ───────────────────────────────────────────────
    // Backend returns ONE AffectiveRecord per assessment with multiple
    // behaviour scores inside it. We flatten every score across records
    // (defensive — in case the backend ever returns several records).
    //
    // Note: resolveTraitGrade returns the grade band keyed as `symbol`
    // (the helper's public shape, shared with ResultsTraitsGridView). The
    // persisted TraitAssessmentResult expects `grade_symbol` — so we map the
    // field explicitly here rather than relying on a spread that would drop
    // the rename and trip the type checker.
    const behaviours: Record<string, TraitAssessmentResult> = {};
    for (const aff of record.affective_records) {
      for (const entry of aff.scores) {
        const resolved = resolveTraitGrade(affGradingFormat, entry.score);
        behaviours[entry.behaviour.id] = {
          trait_id: entry.behaviour.id,
          score: entry.score,
          grade_symbol: resolved.symbol,
          remark: resolved.remark,
          isAbsent: resolved.isAbsent,
        };
      }
    }

    // ── Psychomotor skills ─────────────────────────────────────────────────
    // Same `symbol` → `grade_symbol` mapping as the behaviours block above —
    // see the note there for why we don't spread the resolveTraitGrade result.
    const skills: Record<string, TraitAssessmentResult> = {};
    for (const psy of record.psychomotor_records) {
      for (const entry of psy.scores) {
        const resolved = resolveTraitGrade(psyGradingFormat, entry.score);
        skills[entry.activity.id] = {
          trait_id: entry.activity.id,
          score: entry.score,
          grade_symbol: resolved.symbol,
          remark: resolved.remark,
          isAbsent: resolved.isAbsent,
        };
      }
    }

    // ── Student-level rollup ───────────────────────────────────────────────
    const average = round2(totalScore / totalClassSubjects);
    totalAverages += average;

    students[record.student.id] = {
      student_id: record.student.id,
      average,
      // Position is filled in below after we know everyone's average.
      position: 0,
      // Decision is driven by the arm's pass rule — see decideOutcome() for
      // the full evaluation flow across all four (type × decide_by) cases
      // and the optional subject prerequisites.
      decision: decideOutcome(
        record.cognitive_records,
        passRule,
        cogGradingFormat,
      ),
      subjects,
      behaviours,
      skills,
      teachers_remark: record.teachers_remark ?? "",
      supervisors_remark: record.supervisors_remark ?? "",
    };
  }

  const studentPopulation = assessment.length;
  const classAverage = round2(totalAverages / studentPopulation);

  // ── Rank pass — sort by descending average and assign 1-based positions.
  // Ties are broken by sort stability (same average → same effective order;
  // we don't fold ties into a shared rank to keep the draft's behaviour).
  const sortedByAverage = Object.values(students).sort(
    (a, b) => b.average - a.average,
  );
  sortedByAverage.forEach((s, index) => {
    students[s.student_id].position = index + 1;
  });

  return {
    class_average: classAverage,
    student_population: studentPopulation,
    students,
  };
}
