"use client";

// ─────────────────────────────────────────────────────────────────────────────
// ViewAssessmentPanel.tsx
//
// Read-only grid showing cognitive scores for every student in the arm who
// offers the selected subject. Each row = one student; columns = cognitive
// units (e.g. CA1, CA2, EXAM) + a TOTAL column.
//
// Offering-students rule (from the backend):
//   A student in an arm offers a subject iff the subject is linked to the arm
//   (via SubjectArm — guaranteed because we got the subject from
//   subject/list/?arm=...) AND the student's id is NOT in
//   subject.excluded_students.
//
// Score lookup:
//   For each offering student we look up their assessment row in
//   arm.assessments (plural — that's the backend's JSON key), then find the
//   cognitive_record whose subject.id matches the selected subject. Missing
//   score = blank cell. -1 = absent (rendered as "A").
//
// Empty states:
//   - cognitive_assessment_format missing on the arm  → arm config incomplete
//   - no offering students                            → nothing to show
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, Pencil } from "lucide-react";
import { toast } from "react-toastify";

import { useClientAuthFetch } from "@/lib/Useclientauthfetch";
import { useArmDetails } from "../context/Armdetailsprovider";
import EmptyState from "../../components/Emptystate";

// ── Constants ────────────────────────────────────────────────────────────────

const SCHOOL_ID = process.env.NEXT_PUBLIC_SCHOOL_ID ?? "";

// The student/list/ endpoint is paginated; pull a generous page so a typical
// class arm returns in a single request. Matches RecordAssessmentPanel so the
// shared cache key serves both modes.
const ROSTER_PAGE_SIZE = 100;

// ── Local response shape for the paginated student endpoint ──────────────────
// Mirrors xslat_backend.pagination.StandardPagination's envelope.
interface PaginatedResponse<T> {
  message: string;
  count?: number;
  total_pages?: number;
  current_page?: number;
  next?: string | null;
  previous?: string | null;
  data: T[];
}

interface ViewAssessmentPanelProps {
  show: boolean;
  subject: ArmSubject | null;
  onClose: () => void;
  onSwitchToRecord: () => void;
}

export default function ViewAssessmentPanel({
  show,
  subject,
  onClose,
  onSwitchToRecord,
}: ViewAssessmentPanelProps) {
  const { armId, arm } = useArmDetails();
  const { clientAuthFetch } = useClientAuthFetch();

  // ── Reference data: units (column definitions) ────────────────────────────
  // Sorted by display_order so columns appear left-to-right in the order the
  // teacher expects (CA1 → CA2 → EXAM).
  const units = useMemo(() => {
    const u = arm?.cognitive_assessment_format?.units ?? [];
    return [...u].sort((a, b) => a.display_order - b.display_order);
  }, [arm]);

  // Maximum total achievable across all units — used in the TOTAL column header.
  const maxTotal = useMemo(
    () => units.reduce((sum, u) => sum + u.max_score, 0),
    [units],
  );

  // ── Class roster ──────────────────────────────────────────────────────────
  // Shared cache key with RecordAssessmentPanel + ClassMembersTab so the
  // roster fetch is reused across the page.
  const {
    data: rosterData,
    isPending: rosterPending,
    isError: rosterIsError,
    error: rosterError,
  } = useQuery<PaginatedResponse<ArmStudent>>({
    queryKey: ["arm-students", armId],
    queryFn: async () => {
      const url = `student/list/?school-id=${SCHOOL_ID}&arm-id=${armId}&page=1&page-size=${ROSTER_PAGE_SIZE}`;
      const { data, error } =
        await clientAuthFetch<PaginatedResponse<ArmStudent>>(url);
      if (error) throw new Error(error.message);
      return data!;
    },
    enabled: show && !!armId,
  });

  useEffect(() => {
    if (rosterIsError && rosterError) {
      toast.error(
        rosterError instanceof Error
          ? rosterError.message
          : "Failed to load class roster.",
      );
    }
  }, [rosterIsError, rosterError]);

  // ── Build offering students + score lookup ────────────────────────────────
  // Step 1: filter roster down to students who offer this subject (NOT in
  // subject.excluded_students).
  // Step 2: build a studentId → cognitive_record map so each row can resolve
  // its scores in O(1) during render.
  const { offeringStudents, scoresByStudent } = useMemo(() => {
    const empty = {
      offeringStudents: [] as ArmStudent[],
      scoresByStudent: {} as Record<string, Record<string, number>>,
    };
    if (!subject) return empty;

    const excluded = new Set(subject.excluded_students.map((s) => s.id));
    const roster = rosterData?.data ?? [];
    const offering = roster.filter((s) => !excluded.has(s.id));

    // Build unitId → score lookup per student from arm.assessments. Students
    // without an assessment record (or without a cognitive_record for this
    // subject) stay absent from the map and render blank cells.
    const scoresMap: Record<string, Record<string, number>> = {};
    for (const record of arm?.assessments ?? []) {
      const cog = record.cognitive_records.find(
        (r) => r.subject.id === subject.id,
      );
      if (!cog) continue;
      const lookup: Record<string, number> = {};
      for (const entry of cog.scores) {
        lookup[entry.unit.id] = entry.score;
      }
      scoresMap[record.student.id] = lookup;
    }

    return { offeringStudents: offering, scoresByStudent: scoresMap };
  }, [arm, subject, rosterData]);

  const armLabel = arm
    ? `${arm.level.section.abbr} ${arm.level.abbr} ${arm.abbr}`
    : "—";

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      className={`transition-all duration-500 ease-in-out overflow-hidden ${
        show ? "w-full opacity-100" : "w-0 opacity-0 h-0"
      }`}
    >
      <div className="w-full">
        <button
          onClick={onClose}
          className="cursor-pointer flex items-center gap-1 text-xs text-red-600 hover:text-red-700 my-5 md:my-8 transition-all hover:scale-105 w-fit"
        >
          <ChevronLeft size={14} />
          <span>Back</span>
        </button>

        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm mb-10">
          {/* Header */}
          <div className="bg-slate-100 border-b border-slate-200 px-5 py-4 flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-sm font-bold text-slate-800">
                {subject?.definition.name ?? "Assessment"} : {armLabel}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Read-only view of cognitive scores.
              </p>
            </div>
            <button
              onClick={onSwitchToRecord}
              className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 text-xs bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors shadow-sm shadow-violet-200"
            >
              <Pencil size={12} />
              Switch to record mode
            </button>
          </div>

          {/* Body — empty states first, then the grid */}
          {!arm?.cognitive_assessment_format ? (
            <EmptyState
              variant="generic"
              title="Arm configuration incomplete"
              description="A cognitive assessment format hasn't been set up for this arm yet. Configure one before recording or viewing scores."
            />
          ) : rosterPending ? (
            <div className="p-5">
              <p className="text-xs text-slate-400">Loading roster…</p>
            </div>
          ) : offeringStudents.length === 0 ? (
            <EmptyState
              variant="generic"
              title="No students offer this subject"
              description="Either no students are enrolled in this arm, or every enrolled student has been excluded from this subject."
            />
          ) : (
            <div className="overflow-x-auto p-5">
              <table className="w-full text-xs min-w-150">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-200">
                    <th className="py-3 pr-4 font-semibold w-12">#</th>
                    <th className="py-3 pr-4 font-semibold">Student</th>
                    {units.map((unit) => (
                      <th
                        key={unit.id}
                        className="py-3 px-2 font-semibold text-center"
                      >
                        <div className="flex flex-col items-center">
                          <span>{unit.abbr}</span>
                          <span className="text-[9px] font-normal text-slate-400">
                            /{unit.max_score}
                          </span>
                        </div>
                      </th>
                    ))}
                    <th className="py-3 px-2 font-semibold text-center bg-violet-50 rounded-tr-lg">
                      <div className="flex flex-col items-center">
                        <span>TOTAL</span>
                        <span className="text-[9px] font-normal text-slate-400">
                          /{maxTotal}
                        </span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {offeringStudents.map((student, index) => {
                    const scoreByUnit = scoresByStudent[student.id] ?? {};
                    // Sum across the configured units only. Blank cells and -1
                    // (absent) both contribute 0 so partially-scored rows still
                    // show a meaningful total.
                    const total = units.reduce((sum, unit) => {
                      const v = scoreByUnit[unit.id];
                      if (v === undefined || v < 0) return sum;
                      return sum + v;
                    }, 0);
                    return (
                      <tr key={student.id} className="hover:bg-slate-50/40">
                        <td className="py-3 pr-4 text-slate-500">
                          {index + 1}
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex flex-col">
                            <span className="text-slate-800">
                              {student.first_name} {student.last_name}
                            </span>
                            {student.public_id && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                {student.public_id}
                              </span>
                            )}
                          </div>
                        </td>
                        {units.map((unit) => {
                          const v = scoreByUnit[unit.id];
                          return (
                            <td
                              key={unit.id}
                              className="py-3 px-2 text-center text-slate-700"
                            >
                              {v === undefined ? "—" : v === -1 ? "Abs" : v}
                            </td>
                          );
                        })}
                        <td className="py-3 px-2 text-center font-semibold text-violet-700 bg-violet-50/40">
                          {total}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
