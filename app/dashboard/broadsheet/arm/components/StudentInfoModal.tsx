"use client";

// ─────────────────────────────────────────────────────────────────────────────
// StudentInfoModal.tsx
//
// Reusable modal used by the broadsheet detail's row action menu for two
// distinct purposes — same chrome, different body content:
//
//   variant="performance" → student's term performance summary (totals,
//                            average, position, decision, comments).
//   variant="access"      → pin-issued result-access analytics for this
//                            student's assessment: total accesses, unique
//                            pins used, when it was last accessed, and the
//                            list of pin serials that have bound to it.
//
// The access variant reads from GET pins/stats/assessment/ and handles the
// three response cases: loading (spinner), no row yet (`data: null` — the
// assessment has never been accessed via a pin), and populated. The query
// only fires when the modal is mounted in "access" mode and an
// assessment_id is available on the passed-in studentResult.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Lock, X } from "lucide-react";

import { useClientAuthFetch } from "@/lib/Useclientauthfetch";
import ButtonLoader from "../../../components/Buttonloader";
import type { ApiEnvelope } from "../context/BroadsheetDetailsProvider";

// ── Variant union ─────────────────────────────────────────────────────────
export type StudentInfoVariant = "performance" | "access";

// ── Per-assessment pin usage shape ───────────────────────────────────────
// Matches the ResultAccessStatSerializer response. The nested `assessment`
// carries the student + arm (via the include_*_fields context set by the
// pins view); we don't consume the assessment sub-tree in the UI today,
// so it's typed loosely as `unknown` to avoid a redundant nested type
// declaration here.
interface AssessmentPinUsage {
  id: string;
  assessment: unknown;
  school: { id: string; name: string; abbr?: string };
  term: { id: string; name: string };
  session: { id: string; name: string };
  total_accesses: number;
  total_unique_pins: number;
  unique_pins: string[];
  last_accessed_at: string | null;
}

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

// Format an ISO datetime for display. Returns "—" for null / invalid input.
function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
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
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        className="cursor-pointer absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
      />

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
            <AccessBody assessmentId={studentResult?.assessment_id ?? null} />
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

// ── Access body — real pin usage fetch ───────────────────────────────────
// Fires once the modal mounts in access mode (this component is only
// rendered when variant === "access"). Handles three response states:
//   1. loading  → centred ButtonLoader in the section body
//   2. null     → "not yet accessed" message (endpoint returned data:null)
//   3. present  → total accesses / unique pins / last accessed + the
//                 list of pin serials that have bound to this assessment.
function AccessBody({ assessmentId }: { assessmentId: string | null }) {
  const { clientAuthFetch } = useClientAuthFetch();

  const { data, isPending, isError, error } = useQuery<
    ApiEnvelope<AssessmentPinUsage | null>
  >({
    queryKey: ["assessment-pin-usage", assessmentId],
    queryFn: async () => {
      const url = `pins/stats/assessment/?assessment-id=${assessmentId}`;
      const { data, error } =
        await clientAuthFetch<ApiEnvelope<AssessmentPinUsage | null>>(url);
      if (error) throw new Error(error.message);
      return data!;
    },
    enabled: !!assessmentId,
    refetchOnWindowFocus: false,
  });

  // No assessment_id at all — usually means the compute endpoint hasn't
  // produced a row for this student yet, so pin analytics can't be looked
  // up. Surface a friendly line rather than a spinner that never ends.
  if (!assessmentId) {
    return (
      <Section title="Access Records">
        <div className="px-3 py-2 text-xs text-slate-500 italic">
          No assessment record available for this student yet — access analytics
          are not applicable.
        </div>
      </Section>
    );
  }

  if (isPending) {
    return (
      <Section title="Access Records">
        <div className="flex items-center justify-center gap-2 px-3 py-6">
          <ButtonLoader />
          <span className="text-xs text-slate-500">
            Loading access records…
          </span>
        </div>
      </Section>
    );
  }

  if (isError) {
    return (
      <Section title="Access Records">
        <div className="px-3 py-2 text-xs text-red-600">
          Could not load access records:{" "}
          {error instanceof Error ? error.message : "unknown error."}
        </div>
      </Section>
    );
  }

  const stat = data?.data ?? null;

  if (!stat) {
    // Endpoint returned data:null — this assessment has never been accessed
    // through a pin. Not an error; just an absence of activity.
    return (
      <Section title="Access Records">
        <Row label="Total Accesses" value={0} />
        <Row label="Unique Pins Used" value={0} />
        <Row label="Last Accessed" value="—" />
        <div className="px-3 py-2 text-[11px] text-slate-400 italic">
          This student&apos;s result has not been accessed via a pin yet.
        </div>
      </Section>
    );
  }

  return (
    <>
      <Section title="Access Records">
        <Row label="Total Accesses" value={stat.total_accesses} />
        <Row label="Unique Pins Used" value={stat.total_unique_pins} />
        <Row
          label="Last Accessed"
          value={formatDateTime(stat.last_accessed_at)}
        />
      </Section>

      {/* Pin serials list — only render when there is at least one, and
          keep it visually compact (the list can grow). Serials are
          rendered as tiny mono-style chips to look like credentials. */}
      {stat.unique_pins.length > 0 && (
        <Section title="Pins Bound to This Assessment">
          <div className="px-3 py-2 flex flex-wrap gap-1.5">
            {stat.unique_pins.map((serial) => (
              <span
                key={serial}
                className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-mono border border-slate-200"
              >
                {serial}
              </span>
            ))}
          </div>
        </Section>
      )}
    </>
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
