"use client";

// ─────────────────────────────────────────────────────────────────────────────
// ResultsDetailPane.tsx
//
// Right pane of the master-detail layout. Renders, in order:
//   1. Back link (mobile only — slides back to master list)
//   2. Term header
//   3. Prev / Next student navigation
//   4. Selected student's full name
//   5. Summary stats card (class avg, student avg, position, decision)
//   6. The active filter's content view
//
// Phase 1 implements only the ACADEMICS view. The other three filters (BEHAVIOURS,
// SKILLS, GENERAL) render a clearly-labelled placeholder so the navigation is
// usable while Phase 2 fills them in.
// ─────────────────────────────────────────────────────────────────────────────

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useArmDetails } from "../context/Armdetailsprovider";
import ResultsAcademicsView from "./Resultsacademicsview";
import ResultsTraitsGridView from "./Resultstraitsgridview";
import ResultsGeneralView from "./Resultsgeneralview";
import { ClassAssessmentResult, ResultsFilterKey } from "./results-aggregates";

interface ResultsDetailPaneProps {
  student: ArmStudent;
  // All students in the arm — used to derive the Prev/Next neighbours.
  allStudents: ArmStudent[];
  // Computed assessment data for the entire class.
  classResult: ClassAssessmentResult;
  // Currently active filter view.
  filter: ResultsFilterKey;
  // Subjects offered in this arm (used by the Academics view).
  subjects: ArmSubject[];
  // Mobile back action — caller controls whether to show the back link.
  onBack: () => void;
  // Prev / Next selection — caller decides which student becomes active.
  onSelect: (next: ArmStudent) => void;
}

function fullName(s: ArmStudent): string {
  return `${s.first_name}${s.middle_name ? ` ${s.middle_name}` : ""} ${s.last_name}`;
}

export default function ResultsDetailPane({
  student,
  allStudents,
  classResult,
  filter,
  subjects,
  onBack,
  onSelect,
}: ResultsDetailPaneProps) {
  const { arm } = useArmDetails();

  const studentResult = classResult.students[student.id];

  // Compute Prev / Next neighbours from the master list. Edges clamp.
  const currentIndex = allStudents.findIndex((s) => s.id === student.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < allStudents.length - 1;

  function handlePrev() {
    if (hasPrev) onSelect(allStudents[currentIndex - 1]);
  }
  function handleNext() {
    if (hasNext) onSelect(allStudents[currentIndex + 1]);
  }

  const termName = arm?.level.section.term?.name ?? "Current Term";

  return (
    <div className="flex flex-col gap-5">
      {/* ── Back link — mobile only ─────────────────────────────────── */}
      <button
        type="button"
        onClick={onBack}
        className="md:hidden flex items-center gap-1 text-xs text-red-600 hover:text-red-700 transition-all hover:scale-105 w-fit cursor-pointer"
      >
        <ChevronLeft size={14} />
        <span>Back to list</span>
      </button>

      {/* ── Header strip: term + prev/next ──────────────────────────── */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="text-xs text-slate-500 uppercase tracking-wide">
          {termName} Term | Report
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handlePrev}
            disabled={!hasPrev}
            className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] border border-slate-200 rounded-lg bg-white text-slate-600 hover:border-violet-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ChevronLeft size={11} />
            Prev
          </button>
          <span className="text-[10px] text-slate-400 tabular-nums px-1">
            {currentIndex >= 0 ? currentIndex + 1 : 0} / {allStudents.length}
          </span>
          <button
            type="button"
            onClick={handleNext}
            disabled={!hasNext}
            className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] border border-slate-200 rounded-lg bg-white text-slate-600 hover:border-violet-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            Next
            <ChevronRight size={11} />
          </button>
        </div>
      </div>

      {/* ── Student name ────────────────────────────────────────────── */}
      <div className="text-center md:text-left">
        <h2 className="text-lg md:text-xl font-bold text-slate-800">
          {fullName(student)}
        </h2>
        {student.public_id && (
          <p className="text-[11px] text-slate-400 font-mono mt-0.5">
            {student.public_id}
          </p>
        )}
      </div>

      {/* ── Summary stats card ──────────────────────────────────────── */}
      <SummaryCard
        classAverage={classResult.class_average}
        studentAverage={studentResult?.average}
        position={studentResult?.position}
        decision={studentResult?.decision}
        populationCount={classResult.student_population}
      />

      {/* ── Filter-specific view ────────────────────────────────────── */}
      {filter === "ACADEMICS" && (
        <ResultsAcademicsView
          student={student}
          studentResult={studentResult}
          units={arm?.cognitive_assessment_format?.units}
          subjects={subjects}
        />
      )}

      {filter === "BEHAVIOURS" && (
        <ResultsTraitsGridView
          kind="affective"
          student={student}
          traits={arm?.affective_assessment_format?.behaviours ?? []}
          gradingFormat={arm?.aff_grading_format}
          existingResults={studentResult?.behaviours ?? {}}
        />
      )}

      {filter === "SKILLS" && (
        <ResultsTraitsGridView
          kind="psychomotor"
          student={student}
          traits={arm?.psychomotor_assessment_format?.activities ?? []}
          gradingFormat={arm?.psy_grading_format}
          existingResults={studentResult?.skills ?? {}}
        />
      )}

      {filter === "GENERAL" && (
        <ResultsGeneralView
          student={student}
          studentResult={studentResult}
          subjects={subjects}
        />
      )}

      {/* ── Bottom prev/next nav ──────────────────────────────────────────
          Mirrors the action in the header strip but with a richer layout:
          each button shows the neighbour's name as a clear affordance, so
          the user can advance without scrolling back to the top after
          finishing the last section (typically the principal's comment in
          the General view). Hidden when there's only one student in the
          arm — nothing to navigate to. */}
      {allStudents.length > 1 && (
        <div className="flex items-stretch gap-2 border-t border-slate-200 pt-5">
          <button
            type="button"
            onClick={handlePrev}
            disabled={!hasPrev}
            className="flex-1 sm:flex-initial flex items-center gap-2.5 px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white text-slate-700 hover:border-violet-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-left min-w-0 cursor-pointer"
          >
            <ChevronLeft size={14} className="shrink-0 text-slate-500" />
            <span className="flex flex-col min-w-0">
              <span className="text-[9px] uppercase tracking-wide text-slate-400 font-semibold">
                Previous Student
              </span>
              <span className="truncate text-slate-700">
                {hasPrev ? fullName(allStudents[currentIndex - 1]) : "—"}
              </span>
            </span>
          </button>

          {/* Position indicator — hidden on mobile to keep the two buttons
              from squeezing each other. The header strip already shows it
              above, so this is just a convenient mid-line reference. */}
          <span className="hidden sm:flex self-center text-[11px] text-slate-400 tabular-nums px-2">
            {currentIndex + 1} / {allStudents.length}
          </span>

          <button
            type="button"
            onClick={handleNext}
            disabled={!hasNext}
            className="flex-1 sm:flex-initial flex items-center gap-2.5 px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white text-slate-700 hover:border-violet-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-right min-w-0 cursor-pointer"
          >
            <span className="flex flex-col min-w-0 ml-auto items-end">
              <span className="text-[9px] uppercase tracking-wide text-slate-400 font-semibold">
                Next Student
              </span>
              <span className="truncate text-slate-700">
                {hasNext ? fullName(allStudents[currentIndex + 1]) : "—"}
              </span>
            </span>
            <ChevronRight size={14} className="shrink-0 text-slate-500" />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Summary stats — class + student averages, position, decision ─────────────

interface SummaryCardProps {
  classAverage: number;
  studentAverage: number | undefined;
  position: number | undefined;
  decision: "Pass" | "Fail" | "—" | undefined;
  populationCount: number;
}

function SummaryCard({
  classAverage,
  studentAverage,
  position,
  decision,
  populationCount,
}: SummaryCardProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
      <Stat label="Class Average" value={classAverage.toFixed(2)} />
      <Stat
        label="Student Average"
        value={studentAverage !== undefined ? studentAverage.toFixed(2) : "—"}
      />
      <Stat
        label="Position"
        value={
          position !== undefined
            ? `${ordinal(position)} of ${populationCount}`
            : "—"
        }
      />
      <Stat
        label="Decision"
        value={decision ?? "—"}
        tone={
          decision === "Pass"
            ? "success"
            : decision === "Fail"
              ? "danger"
              : "neutral"
        }
      />
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "success" | "danger";
}) {
  const valueClass =
    tone === "success"
      ? "text-emerald-700"
      : tone === "danger"
        ? "text-red-700"
        : "text-slate-800";

  return (
    <div className="border border-slate-200 rounded-xl bg-white px-3 py-2.5">
      <div className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">
        {label}
      </div>
      <div className={`text-sm font-bold tabular-nums mt-0.5 ${valueClass}`}>
        {value}
      </div>
    </div>
  );
}

// 1 → "1st", 2 → "2nd", 11 → "11th", etc.
function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
