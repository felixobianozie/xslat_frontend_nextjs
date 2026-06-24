"use client";

// ─────────────────────────────────────────────────────────────────────────────
// StudentInfoModal.tsx
//
// Reusable modal used by the broadsheet detail's row action menu for two
// distinct purposes — same chrome, different body content:
//
//   variant="performance" → student's term performance summary (totals,
//                            average, position, decision, comments).
//   variant="access"      → "report card access" info (counts of times
//                            accessed, last accessed date, cards used).
//
// The "access" variant is purely informational and shows placeholder data —
// there's no backend endpoint for result access tracking yet. We leave the
// shape consistent with what a future Term.results_access endpoint would
// likely look like so swap-in is a small change.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Lock, X, BarChart3 } from "lucide-react";

import type { StudentAssessmentResult } from "../../../arm/components/results-aggregates";

// ── Variant union ─────────────────────────────────────────────────────────
export type StudentInfoVariant = "performance" | "access";

interface StudentInfoModalProps {
  variant: StudentInfoVariant;
  student: ArmStudent;
  studentResult?: StudentAssessmentResult;
  totalClassSubjects: number;
  classSize: number;
  onClose: () => void;
}

// Full name helper — handles the optional middle_name without dangling spaces.
function fullName(s: ArmStudent): string {
  return [s.first_name, s.middle_name, s.last_name].filter(Boolean).join(" ");
}

// Variant headers — kept in one place so adding a third variant later is
// a trivial table extension.
const VARIANT_CONFIG = {
  performance: {
    title: "Performance Information",
    Icon: BarChart3,
    iconClasses: "text-violet-600 bg-violet-50 border-violet-100",
  },
  access: {
    title: "Result Access Information",
    Icon: Lock,
    iconClasses: "text-amber-600 bg-amber-50 border-amber-100",
  },
} as const;

export default function StudentInfoModal({
  variant,
  student,
  studentResult,
  totalClassSubjects,
  classSize,
  onClose,
}: StudentInfoModalProps) {
  const config = VARIANT_CONFIG[variant];
  const Icon = config.Icon;

  // Lock body scroll + Escape-to-close while the modal is open.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);

    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-9999 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="student-info-modal-title"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        className="cursor-pointer absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
      />

      {/* Card — always centred, with edge padding from the outer wrapper. */}
      <div className="relative w-full sm:max-w-md bg-white rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-9 h-9 rounded-full border flex items-center justify-center shrink-0 ${config.iconClasses}`}
            >
              <Icon size={16} />
            </div>
            <h2
              id="student-info-modal-title"
              className="text-sm font-bold text-slate-800 truncate"
            >
              {config.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors shrink-0"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 overflow-y-auto flex flex-col gap-4">
          {/* Identity block — shared across both variants. */}
          <Section title="Student">
            <Row label="Full Name" value={fullName(student)} />
            {student.public_id && (
              <Row label="Student ID" value={student.public_id} />
            )}
            <Row
              label="Gender"
              value={
                student.gender === "M"
                  ? "Male"
                  : student.gender === "F"
                    ? "Female"
                    : "Other"
              }
            />
          </Section>

          {/* Variant-specific body. */}
          {variant === "performance" ? (
            <PerformanceBody
              studentResult={studentResult}
              totalClassSubjects={totalClassSubjects}
              classSize={classSize}
            />
          ) : (
            <AccessBody />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-slate-100 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer px-4 py-2 text-xs border border-slate-200 bg-white text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ── Performance body — totals, position, decision, comments ──────────────
function PerformanceBody({
  studentResult,
  totalClassSubjects,
  classSize,
}: {
  studentResult: StudentAssessmentResult | undefined;
  totalClassSubjects: number;
  classSize: number;
}) {
  if (!studentResult) {
    return (
      <div className="text-xs text-slate-500 italic">
        No assessment records available for this student yet.
      </div>
    );
  }

  // Sum per-subject totals once so we don't repeat the reduce below.
  const totalObtained = Object.values(studentResult.subjects).reduce(
    (sum, s) => sum + s.total,
    0,
  );

  return (
    <>
      <Section title="Performance">
        <Row label="Total Obtained" value={totalObtained} />
        <Row label="Total Subjects" value={totalClassSubjects} />
        <Row
          label="Student's Average"
          value={studentResult.average.toFixed(2)}
        />
        <Row label="Class Position" value={studentResult.position} />
        <Row label="Class Size" value={classSize} />
        <Row
          label="Decision"
          value={
            <span
              className={
                studentResult.decision === "Pass"
                  ? "text-emerald-600 font-semibold"
                  : studentResult.decision === "Fail"
                    ? "text-red-500 font-semibold"
                    : "text-slate-500"
              }
            >
              {studentResult.decision}
            </span>
          }
        />
      </Section>

      {(studentResult.teachers_remark || studentResult.supervisors_remark) && (
        <Section title="Comments">
          {studentResult.teachers_remark && (
            <Comment
              label="Class Teacher's Comment"
              body={studentResult.teachers_remark}
            />
          )}
          {studentResult.supervisors_remark && (
            <Comment
              label="Administrator's Comment"
              body={studentResult.supervisors_remark}
            />
          )}
        </Section>
      )}
    </>
  );
}

// ── Access body — placeholder, no backend endpoint yet ────────────────────
function AccessBody() {
  return (
    <Section title="Access Records">
      <p className="text-[11px] text-slate-400 italic mb-2">
        Result access tracking is not yet available. The values below are
        placeholders.
      </p>
      <Row label="Total Access Count" value={0} />
      <Row label="Last Accessed On" value="—" />
      <Row label="Access Cards Issued" value={0} />
    </Section>
  );
}

// ── Layout helpers ──────────────────────────────────────────────────────

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold mb-2">
        {title}
      </h3>
      <div className="rounded-xl border border-slate-100 bg-slate-50 divide-y divide-slate-100">
        {children}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2">
      <span className="text-[11px] text-slate-500">{label}</span>
      <span className="text-xs text-slate-800 font-medium text-right">
        {value}
      </span>
    </div>
  );
}

function Comment({ label, body }: { label: string; body: string }) {
  return (
    <div className="px-3 py-2.5">
      <div className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold mb-1">
        {label}
      </div>
      <p className="text-xs text-slate-700 leading-relaxed">{body}</p>
    </div>
  );
}
