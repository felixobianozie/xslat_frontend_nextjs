"use client";

// ─────────────────────────────────────────────────────────────────────────────
// StudentBulkAssignArmPanel.tsx
//
// Slide-in panel for assigning a single class arm to many students at once.
// Opened from the Bulk Assign Arm button in StudentList's contextual action
// bar (shown when 2+ rows are checked).
//
// Behaviour notes:
//  - The "selected students" shown in this panel are derived from the parent
//    selection AND filtered down to arm-less students only. Students who
//    already have a class arm are silently dropped from the visible list,
//    matching the agreed UX rule: bulk-assign is a "fill empty seats" tool.
//    Those students stay checked in the table but aren't operated on here.
//  - X buttons remove a student from the parent selection so the table
//    checkboxes update in lockstep.
//  - To add more students, close the panel, tick more rows in the table, and
//    reopen the panel. We deliberately avoid an in-panel search list because
//    it would not scale gracefully to schools with hundreds of students.
//  - On successful submit, the parent selection is cleared entirely (including
//    any with-arm IDs that weren't visible here).
//
// Backend reference (PUT arm/detail/roster/):
//   Body: { id: <arm_uuid>, school_id: <uuid>, add_student: [<student_uuids>] }
//
// Data layer:
//   - arms via GET arm/list/ (paginated envelope)
//   - allStudents via GET student/list/?page-size=100 (paginated envelope) so
//     the panel can resolve names + arm status from any selected ID, even when
//     selected on a different page of the paginated table.
//   - assign via PUT arm/detail/roster/ with all arm-less student ids.
// ─────────────────────────────────────────────────────────────────────────────

import { Dispatch, SetStateAction, useEffect, useMemo, useState } from "react";
import { ChevronLeft, CheckCircle2, AlertTriangle, X } from "lucide-react";
import { toast } from "react-toastify";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useClientAuthFetch } from "@/lib/Useclientauthfetch";
import type { PaginatedResponse } from "../page";
import ButtonLoader from "../../components/Buttonloader";

// ── Constants ─────────────────────────────────────────────────────────────────

const SCHOOL_ID = process.env.NEXT_PUBLIC_SCHOOL_ID ?? "";

// ── Types ────────────────────────────────────────────────────────────────────

// Minimal shape from GET school/detail/. We only need the current_term id to
// pass to the arm list endpoint, so the rest of the school payload is ignored.
interface SchoolDetailResponse {
  message: string;
  data: {
    current_term: { id: string } | null;
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

// Format a class arm for display: "JSS 1 A".
function formatArm(arm: ClassArm): string {
  return `${arm.level.section.abbr} ${arm.level.abbr} ${arm.abbr}`;
}

// ── Props ────────────────────────────────────────────────────────────────────
interface StudentBulkAssignArmPanelProps {
  show: boolean;
  onClose: () => void;
  /** Parent's full selection (table checkboxes). May contain with-arm students. */
  selectedIds: Set<string>;
  /** Setter so the panel's add/remove keeps the table checkboxes in sync. */
  setSelectedIds: Dispatch<SetStateAction<Set<string>>>;
}

export default function StudentBulkAssignArmPanel({
  show,
  onClose,
  selectedIds,
  setSelectedIds,
}: StudentBulkAssignArmPanelProps) {
  const queryClient = useQueryClient();
  const { clientAuthFetch } = useClientAuthFetch();

  // Panel-local state — reset on each open.
  const [armId, setArmId] = useState<string>("");

  useEffect(() => {
    if (show) {
      setArmId("");
    }
  }, [show]);

  // ── Queries ────────────────────────────────────────────────────────────────
  // All queries are gated on `show` so the panel doesn't fetch until opened.

  // School detail — used to resolve the current term id for the arm list
  // endpoint. Cached under ["school", SCHOOL_ID] so all arm
  // panels share the same network call.
  const {
    data: schoolData,
    isLoading: schoolLoading,
    isError: schoolError,
  } = useQuery<SchoolDetailResponse>({
    queryKey: ["school", SCHOOL_ID],
    queryFn: async () => {
      const { data, error } = await clientAuthFetch<SchoolDetailResponse>(
        `school/detail/?id=${SCHOOL_ID}`,
      );
      if (error) throw new Error(error.message);
      return data!;
    },
    enabled: show,
  });

  const currentTermId = schoolData?.data?.current_term?.id ?? null;

  // Arms — gated on having both `show` AND a resolved current term. The backend
  // arm/list/ endpoint rejects requests without a term-id. The query key
  // includes the term so the cache is correctly partitioned across terms.
  const {
    data: armsData,
    isLoading: armsQueryLoading,
    isError: armsError,
  } = useQuery<PaginatedResponse<ClassArm>>({
    queryKey: ["arms", SCHOOL_ID, currentTermId],
    queryFn: async () => {
      const { data, error } = await clientAuthFetch<
        PaginatedResponse<ClassArm>
      >(
        `arm/list/?school-id=${SCHOOL_ID}&term-id=${currentTermId}&page=1&page-size=100`,
      );
      if (error) throw new Error(error.message);
      return data!;
    },
    enabled: show && !!currentTermId,
  });

  // page-size=100 mirrors the stats-bar pattern — sufficient for resolving
  // selected ids whose detail rows may live on other pages of the table.
  const { data: allStudentsData, isLoading: studentsLoading } = useQuery<
    PaginatedResponse<StudentRecord>
  >({
    queryKey: ["all-students", SCHOOL_ID],
    queryFn: async () => {
      const { data, error } = await clientAuthFetch<
        PaginatedResponse<StudentRecord>
      >(`student/list/?school-id=${SCHOOL_ID}&page=1&page-size=100`);
      if (error) throw new Error(error.message);
      return data!;
    },
    enabled: show,
  });

  // Extract arrays from the paginated envelopes.
  const arms = armsData?.data ?? [];
  const allStudents = allStudentsData?.data;

  // Combined loading state — true while either school or arms is in flight,
  // so the dropdown's "Loading…" placeholder covers the whole dependency chain.
  const armsLoading = schoolLoading || armsQueryLoading;

  // Surface error states via toast.
  useEffect(() => {
    if (schoolError) toast.error("Could not load school information.");
  }, [schoolError]);

  useEffect(() => {
    if (schoolData && !currentTermId) {
      toast.error("This school has no active term — class arms unavailable.");
    }
  }, [schoolData, currentTermId]);

  useEffect(() => {
    if (armsError) toast.error("Could not load class arms.");
  }, [armsError]);

  // ── Derived: selected students (filtered to arm-less only) ─────────────────
  // These are the students that will actually be assigned. With-arm students
  // in `selectedIds` are silently excluded from the panel by this filter.
  const armlessSelected = useMemo(() => {
    if (!allStudents) return [];
    return allStudents.filter(
      (s) => selectedIds.has(s.id) && s.current_arm === null,
    );
  }, [allStudents, selectedIds]);

  // ── Mutation ───────────────────────────────────────────────────────────────
  // Single PUT to the arm roster with every arm-less id. The backend treats
  // single-vs-many through the same `add_student` array shape.
  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      if (!armId) throw new Error("Please select a class arm.");
      if (armlessSelected.length === 0)
        throw new Error("Select at least one student without a class arm.");

      const { data, error } = await clientAuthFetch("arm/detail/roster/", {
        method: "PUT",
        body: {
          id: armId,
          school_id: SCHOOL_ID,
          add_student: armlessSelected.map((s) => s.id),
        },
      });
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      toast.success(
        `Assigned ${armlessSelected.length} ${
          armlessSelected.length === 1 ? "student" : "students"
        } to class.`,
      );

      // Clear the FULL parent selection (including any with-arm IDs that
      // weren't visible in the panel) so the table goes back to a clean state.
      setSelectedIds(new Set());

      // Refresh the panel-local all-students cache so a follow-up open shows
      // the just-assigned students as no-longer-arm-less. Parent's
      // handleBulkAssignClose refreshes the table list + stats.
      queryClient.invalidateQueries({ queryKey: ["all-students", SCHOOL_ID] });

      onClose();
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Bulk assign failed.");
    },
  });

  // ── Handlers ───────────────────────────────────────────────────────────────

  // Remove a single student from the parent selection (also unchecks the row).
  function removeSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  // Submit gate — need both an arm and at least one arm-less student.
  const canSubmit = !!armId && armlessSelected.length > 0 && !isPending;

  return (
    <div
      className={`transition-all duration-500 ease-in-out overflow-hidden ${
        show ? "w-full opacity-100" : "w-0 opacity-0 h-0"
      }`}
    >
      <div className="w-full">
        {/* Back link */}
        <button
          onClick={onClose}
          className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 my-5 md:my-8 transition-all hover:scale-105 w-fit"
        >
          <ChevronLeft size={14} />
          <span>Back</span>
        </button>

        {/* Panel card */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm mb-10 text-black">
          {/* Header */}
          <div className="bg-slate-100 border-b border-slate-200 px-5 py-4">
            <h2 className="text-sm font-bold text-slate-800">
              Bulk Assign Class Arm
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Assign one class arm to multiple students in a single action.
            </p>
          </div>

          {/* Body */}
          <div className="px-5 py-6 space-y-5">
            {/* ── Section 1: Selected students chips ─────────────────────── */}
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                Selected Students
                <span className="text-[10px] text-slate-400 font-normal">
                  ({armlessSelected.length}{" "}
                  {armlessSelected.length === 1 ? "student" : "students"})
                </span>
              </label>

              <div className="min-h-12 bg-slate-50 border border-slate-100 rounded-xl p-3">
                {studentsLoading ? (
                  <span className="text-[11px] text-slate-400 italic">
                    Loading…
                  </span>
                ) : armlessSelected.length === 0 ? (
                  <span className="text-[11px] text-slate-400 italic">
                    No arm-less students selected. Close this panel and tick
                    more rows in the table to add them here.
                  </span>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {armlessSelected.map((s) => (
                      <span
                        key={s.id}
                        className="inline-flex items-center gap-1 bg-violet-100 text-violet-700 rounded-full pl-2.5 pr-1 py-0.5 text-[11px]"
                      >
                        <span className="font-medium">
                          {s.first_name} {s.last_name}
                        </span>
                        <span className="text-violet-400 text-[9px]">
                          {s.public_id}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeSelected(s.id)}
                          className="cursor-pointer hover:bg-violet-200 rounded-full p-0.5 transition-colors"
                          aria-label={`Remove ${s.first_name} ${s.last_name}`}
                        >
                          <X size={11} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── Section 2: Class arm dropdown ───────────────────────────── */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor="bulk-arm"
                className="flex items-center gap-1.5 text-xs font-medium text-slate-500"
              >
                New Class Arm <span className="text-red-500">*</span>
                {armId && (
                  <CheckCircle2 size={12} className="text-emerald-500" />
                )}
              </label>
              <select
                id="bulk-arm"
                name="arm"
                value={armId}
                onChange={(e) => setArmId(e.target.value)}
                disabled={armsLoading}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none transition-all bg-white appearance-none cursor-pointer focus:border-violet-400 focus:ring-2 focus:ring-violet-100 disabled:opacity-50"
              >
                <option value="">
                  {armsLoading ? "Loading…" : "— Select —"}
                </option>
                {arms.map((arm) => (
                  <option key={arm.id} value={arm.id}>
                    {formatArm(arm)}
                  </option>
                ))}
              </select>
            </div>

            {/* Info note — explains the silent-drop rule when relevant */}
            {selectedIds.size > armlessSelected.length && allStudents && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                <AlertTriangle
                  size={14}
                  className="text-amber-600 shrink-0 mt-0.5"
                />
                <p className="text-[11px] text-amber-700 leading-relaxed">
                  {selectedIds.size - armlessSelected.length} of your selected
                  students already have a class arm and aren't included here.
                  Use <span className="font-semibold">Change Class</span> from
                  the row menu to move them individually.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 bg-slate-50 border-t border-slate-100 px-5 py-4">
            <button
              onClick={onClose}
              disabled={isPending}
              className="cursor-pointer px-4 py-2 text-xs border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => mutate()}
              disabled={!canSubmit}
              className="cursor-pointer relative flex items-center justify-center gap-2 px-4 py-2 text-xs bg-violet-600 text-white rounded-xl hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm shadow-violet-200"
            >
              <span className={isPending ? "invisible" : ""}>
                Assign Arm
                {armlessSelected.length > 0 && (
                  <span className="ml-1 opacity-90">
                    ({armlessSelected.length})
                  </span>
                )}
              </span>
              <span
                className={`absolute inset-0 flex items-center justify-center ${isPending ? "" : "invisible"}`}
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
