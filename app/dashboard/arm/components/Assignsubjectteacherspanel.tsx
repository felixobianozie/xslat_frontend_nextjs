"use client";

// ─────────────────────────────────────────────────────────────────────────────
// AssignSubjectTeachersPanel.tsx
//
// Slide-in panel to assign teachers to a subject within THIS arm.
//
// Backend wiring:
//   - Candidates picker: GET staff/portfolios/list/?school-id=…&page-size=100
//   - Assignment write:  PUT subject/detail/
//       body: {
//         id: subjectId,
//         school_id,
//         add_teachers: [{ arm: armId, teachers: [staffPortfolioId, …] }]
//       }
//
// The currently-assigned teachers are read straight from the selected
// subject's `subject_arms[forThisArm].teachers` — the SubjectsTab fetch
// already nests them as full StaffPortfolio objects, so no extra read is
// required for the "Current Teacher(s)" chip list.
//
// The candidates picker excludes anyone already assigned so the user only
// sees adds they can actually make. Multi-select via checkbox list.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, UserPlus } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { useClientAuthFetch } from "@/lib/Useclientauthfetch";
import { useArmDetails } from "../context/Armdetailsprovider";
import ButtonLoader from "../../components/Buttonloader";
import type { ApiEnvelope } from "../page";

// ── Constants ────────────────────────────────────────────────────────────────

const SCHOOL_ID = process.env.NEXT_PUBLIC_SCHOOL_ID ?? "";
const TEACHERS_PAGE_SIZE = 100;

// ── Local response shape for the paginated staff endpoint ────────────────────
interface PaginatedResponse<T> {
  message: string;
  count: number;
  total_pages: number;
  current_page: number;
  next: string | null;
  previous: string | null;
  data: T[];
}

interface AssignSubjectTeachersPanelProps {
  show: boolean;
  subject: ArmSubject | null;
  onClose: () => void;
}

// Pull a teacher's display name from the nested StaffPortfolio.
function teacherName(t: ArmTeacher): string {
  const u = t.staff_profile.user;
  return `${u.first_name} ${u.last_name}`;
}

export default function AssignSubjectTeachersPanel({
  show,
  subject,
  onClose,
}: AssignSubjectTeachersPanelProps) {
  const { armId, arm } = useArmDetails();
  const queryClient = useQueryClient();
  const { clientAuthFetch } = useClientAuthFetch();

  const [selectedTeacherIds, setSelectedTeacherIds] = useState<string[]>([]);

  // Reset selection on each open / subject change so a stale pick doesn't
  // leak across panel reopens.
  useEffect(() => {
    if (show) setSelectedTeacherIds([]);
  }, [show, subject?.id]);

  // ── Load all staff for the picker ─────────────────────────────────────────
  const {
    data: staffData,
    isLoading: staffLoading,
    isError: staffError,
  } = useQuery<PaginatedResponse<ArmTeacher>>({
    queryKey: ["arm-teacher-options", SCHOOL_ID],
    queryFn: async () => {
      const url = `staff/portfolios/list/?school-id=${SCHOOL_ID}&page-size=${TEACHERS_PAGE_SIZE}`;
      const { data, error } =
        await clientAuthFetch<PaginatedResponse<ArmTeacher>>(url);
      if (error) throw new Error(error.message);
      return data!;
    },
    enabled: show,
  });

  useEffect(() => {
    if (staffError) toast.error("Could not load teacher list.");
  }, [staffError]);

  const allTeachers = staffData?.data ?? [];

  // Currently-assigned teacher ids — read straight from the selected subject's
  // arm entry. The SubjectsTab fetch already nested these.
  const currentlyAssigned = useMemo(() => {
    if (!subject) return [];
    const armEntry = subject.subject_arms.find((sa) => sa.arm.id === armId);
    return armEntry?.teachers ?? [];
  }, [subject, armId]);

  const assignedIds = useMemo(
    () => new Set(currentlyAssigned.map((t) => t.id)),
    [currentlyAssigned],
  );

  // Candidates — everyone NOT already assigned to this subject in this arm.
  const candidates = useMemo(
    () => allTeachers.filter((t) => !assignedIds.has(t.id)),
    [allTeachers, assignedIds],
  );

  // ── Mutation: assign teachers ─────────────────────────────────────────────
  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      if (!subject) throw new Error("No subject selected.");
      if (selectedTeacherIds.length === 0) {
        throw new Error("Pick at least one teacher.");
      }

      const { data, error } = await clientAuthFetch<ApiEnvelope<unknown>>(
        "subject/detail/",
        {
          method: "PUT",
          body: {
            id: subject.id,
            school_id: SCHOOL_ID,
            // Backend accepts an array of arm-entries so multiple arms could be
            // updated in one request, but the UI is scoped to one arm at a time.
            add_teachers: [
              {
                arm: armId,
                teachers: selectedTeacherIds,
              },
            ],
          },
        },
      );
      if (error) throw new Error(error.message);
      return data;
    },

    onSuccess: () => {
      toast.success("Teachers assigned.");
      // Refresh the subjects list so the row's teacher column updates, and
      // the per-student offered/not-offered caches (used by the Class Members
      // tab's Edit Subjects panel) in case assignment affects offerings.
      queryClient.invalidateQueries({ queryKey: ["arm-subjects", armId] });
      onClose();
    },

    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : "Could not assign teachers.",
      );
    },
  });

  function toggleTeacher(id: string) {
    setSelectedTeacherIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  }

  const canSubmit = !!subject && selectedTeacherIds.length > 0;
  const armLabel = arm
    ? `${arm.level.section.abbr} ${arm.level.abbr} ${arm.abbr}`
    : "—";

  return (
    <div
      className={`transition-all duration-500 ease-in-out overflow-hidden ${
        show ? "w-full opacity-100" : "w-0 opacity-0 h-0"
      }`}
    >
      <div className="w-full">
        <button
          onClick={onClose}
          className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 my-5 md:my-8 transition-all hover:scale-105 w-fit cursor-pointer"
        >
          <ChevronLeft size={14} />
          <span>Back</span>
        </button>

        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm mb-10 text-black">
          <div className="bg-slate-100 border-b border-slate-200 px-5 py-4">
            <h2 className="text-sm font-bold text-slate-800">
              Assign Subject Teachers
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-5 px-5 py-6">
            {/* Subject + arm context */}
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-slate-500">
                Subject
              </span>
              <div className="text-sm text-slate-800 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
                {subject ? (
                  <>
                    {subject.definition.name}{" "}
                    <span className="text-slate-400">
                      ({subject.definition.abbr})
                    </span>{" "}
                    <span className="text-[10px] text-slate-400 ml-2">
                      · {armLabel}
                    </span>
                  </>
                ) : (
                  "—"
                )}
              </div>
            </div>

            {/* Current teachers */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-slate-500">
                Current Teacher(s) ({currentlyAssigned.length})
              </span>
              <div className="flex flex-wrap gap-1.5 min-h-8">
                {currentlyAssigned.length === 0 ? (
                  <span className="text-[10px] text-slate-400">
                    Not assigned
                  </span>
                ) : (
                  currentlyAssigned.map((t) => (
                    <span
                      key={t.id}
                      className="text-[10px] px-2 py-1 rounded-full border bg-violet-50 text-violet-700 border-violet-100"
                    >
                      {teacherName(t)}
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Teacher picker */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-slate-500">
                Select Teacher(s) to Add
              </span>
              <div className="border border-slate-200 rounded-xl p-3 max-h-56 overflow-y-auto bg-white">
                {staffLoading ? (
                  <p className="text-xs text-slate-400">Loading staff…</p>
                ) : candidates.length === 0 ? (
                  <p className="text-xs text-slate-400">
                    Every teacher is already assigned to this subject.
                  </p>
                ) : (
                  <div className="flex flex-col gap-1">
                    {candidates.map((t) => (
                      <label
                        key={t.id}
                        className="flex items-center gap-2 text-xs cursor-pointer hover:bg-slate-50 rounded-lg px-2 py-1.5"
                      >
                        <input
                          type="checkbox"
                          checked={selectedTeacherIds.includes(t.id)}
                          onChange={() => toggleTeacher(t.id)}
                          className="rounded text-violet-600 focus:ring-violet-400"
                        />
                        <span className="text-slate-700">
                          {teacherName(t)}
                          {t.staff_profile.user.public_id && (
                            <span className="text-slate-400 ml-2">
                              {t.staff_profile.user.public_id}
                            </span>
                          )}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 bg-slate-50 border-t border-slate-100 px-5 py-4">
            <button
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 text-xs border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => mutate()}
              disabled={!canSubmit || isPending}
              className="relative flex items-center justify-center gap-2 px-4 py-2 text-xs bg-violet-600 text-white rounded-xl hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm shadow-violet-200 cursor-pointer"
            >
              <span
                className={`flex items-center gap-1.5 ${
                  isPending ? "invisible" : ""
                }`}
              >
                <UserPlus size={12} />
                Assign Teachers
              </span>
              <span
                className={`absolute inset-0 flex items-center justify-center ${
                  isPending ? "" : "invisible"
                }`}
              >
                <ButtonLoader />
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
