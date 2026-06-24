"use client";

// ─────────────────────────────────────────────────────────────────────────────
// ResultsGeneralView.tsx
//
// "GENERAL" filter view — the home of the term-end remark writing flow.
//
// Layout:
//   1. Academic results (read-only) — full per-subject cognitive table so the
//      remark writer can see exactly how the student performed across every
//      subject (scores, total, grade, remark) before drafting comments.
//   2. Behaviours (read-only) — full trait grid so the remark writer can
//      reference each affective score, grade, and band remark while drafting.
//   3. Skills (read-only) — same shape for psychomotor traits.
//   4. Teacher's Comment editor.
//   5. Principal's Comment editor.
//
// The summary stats card directly above this view (in ResultsDetailPane) still
// shows class average, student average, position, and decision at a glance; the
// academics block here is the full breakdown.
//
// Sub-sections are rendered via the same dedicated view components used by the
// ACADEMICS / BEHAVIOURS / SKILLS filters (with trait grids in readonly mode)
// so the visual shape stays consistent — no duplicate display logic to
// maintain.
// ─────────────────────────────────────────────────────────────────────────────

import { useArmDetails } from "../context/Armdetailsprovider";
import ResultsAcademicsView from "./Resultsacademicsview";
import ResultsRemarks from "./Resultsremarks";
import ResultsTraitsGridView from "./Resultstraitsgridview";
import { StudentAssessmentResult } from "./results-aggregates";

interface ResultsGeneralViewProps {
  student: ArmStudent;
  studentResult: StudentAssessmentResult | undefined;
  // Arm subjects — forwarded to the academics block so subject names/abbrs
  // can be rendered next to each row of cognitive scores.
  subjects: ArmSubject[];
}

export default function ResultsGeneralView({
  student,
  studentResult,
  subjects,
}: ResultsGeneralViewProps) {
  const { arm } = useArmDetails();

  return (
    <div className="flex flex-col gap-6">
      {/* ── Academic results (read-only) ─────────────────────────────── */}
      <ResultsAcademicsView
        student={student}
        studentResult={studentResult}
        units={arm?.cognitive_assessment_format?.units}
        subjects={subjects}
      />

      {/* ── Behaviours (read-only) ───────────────────────────────────── */}
      <ResultsTraitsGridView
        readonly
        kind="affective"
        student={student}
        traits={arm?.affective_assessment_format?.behaviours ?? []}
        gradingFormat={arm?.aff_grading_format}
        existingResults={studentResult?.behaviours ?? {}}
      />

      {/* ── Skills (read-only) ───────────────────────────────────────── */}
      <ResultsTraitsGridView
        readonly
        kind="psychomotor"
        student={student}
        traits={arm?.psychomotor_assessment_format?.activities ?? []}
        gradingFormat={arm?.psy_grading_format}
        existingResults={studentResult?.skills ?? {}}
      />

      {/* ── Remarks ──────────────────────────────────────────────────── */}
      <ResultsRemarks
        kind="teacher"
        student={student}
        existingRemark={studentResult?.teachers_remark ?? ""}
      />
      <ResultsRemarks
        kind="supervisor"
        student={student}
        existingRemark={studentResult?.supervisors_remark ?? ""}
      />
    </div>
  );
}
