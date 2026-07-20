// ─────────────────────────────────────────────────────────────────────────────
// trait-grade.ts
//
// Pure UI helpers for live grade lookup. The backend computes every persisted
// grade (via arm/assessment/compute/), but the trait edit grid needs to show
// a grade band the INSTANT the user types a new score — before it's saved.
// This file exists solely for that live preview; nothing here is called
// during normal read-only rendering.
//
// No React, no fetching. Two functions:
//   - findGradeForScore: raw grade-band lookup for a score.
//   - resolveTraitGrade: the trait-specific wrapper that folds in the
//     "absent" (-1) special case so callers don't repeat it.
// ─────────────────────────────────────────────────────────────────────────────

// Look up which grade band a score falls into for the given grading format.
// Returns null when the format is missing, the score is negative (absent —
// handled by the trait wrapper below), or no band covers the score.
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

// Live-preview shape — a strict subset of the grade-related fields on a
// backend TraitAssessmentResult, so the helper's return can slot straight
// into the row's rendering alongside a real (persisted) row.
type TraitGradeLookup = Pick<
  TraitAssessmentResult,
  "grade_symbol" | "remark" | "is_absent"
>;

// Resolve the displayable grade for a single trait score. Handles the
// "absent" case (-1) here so callers don't need to repeat the check.
export function resolveTraitGrade(
  format: ArmGradingFormat | null | undefined,
  score: number,
): TraitGradeLookup {
  if (score === -1) {
    return { grade_symbol: null, remark: "Absent", is_absent: true };
  }
  const grade = findGradeForScore(format, score);
  return {
    grade_symbol: grade?.symbol ?? null,
    remark: grade?.remark ?? null,
    is_absent: false,
  };
}
