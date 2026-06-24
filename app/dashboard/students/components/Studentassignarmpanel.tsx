"use client";

// ─────────────────────────────────────────────────────────────────────────────
// StudentAssignArmPanel.tsx
//
// Slide-in panel for assigning a class arm to a student that has no current
// arm. Replaces the draft AssignArmBoard.
//
// Backend reference (PUT arm/detail/roster/):
//   Body: { id: <arm_uuid>, school_id: <uuid>, add_student: [<student_uuid>] }
//
// Data layer:
//   useQuery loads the class arms for the current term via GET arm/list/.
//   useMutation calls PUT arm/detail/roster/ with the single student id.
//   On success the parent's handleArmPanelClose runs through onClose() and
//   invalidates the students + student-stats query caches.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { ChevronLeft, CheckCircle2 } from "lucide-react";
import { toast } from "react-toastify";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useClientAuthFetch } from "@/lib/Useclientauthfetch";
import type { PaginatedResponse } from "../page";
import ButtonLoader from "../../components/Buttonloader";

// ── Constants ─────────────────────────────────────────────────────────────────

const SCHOOL_ID = process.env.NEXT_PUBLIC_SCHOOL_ID ?? "";

// ── Types ─────────────────────────────────────────────────────────────────────

// Minimal shape from GET school/detail/. We only need the current_term id to
// pass to the arm list endpoint, so the rest of the school payload is ignored.
interface SchoolDetailResponse {
  message: string;
  data: {
    current_term: { id: string } | null;
  };
}

interface StudentAssignArmPanelProps {
  show: boolean;
  onClose: () => void;
  /** The student being assigned. Null when no panel is open. */
  student: StudentRecord | null;
}

// Format a class arm for display in the dropdown — "JSS 1 A".
function formatArm(arm: ClassArm): string {
  return `${arm.level.section.abbr} ${arm.level.abbr} ${arm.abbr}`;
}

export default function StudentAssignArmPanel({
  show,
  onClose,
  student,
}: StudentAssignArmPanelProps) {
  const { clientAuthFetch } = useClientAuthFetch();

  // The selected arm UUID — empty while the user hasn't chosen yet.
  const [armId, setArmId] = useState<string>("");

  // Reset the arm selection whenever the panel opens or the student changes.
  // Prevents a stale selection from a previous open.
  useEffect(() => {
    if (show) setArmId("");
  }, [show, student?.id]);

  // ── Fetch school's current term ────────────────────────────────────────────
  // The arm list endpoint requires both `school-id` and `term-id`. The current
  // term comes from the school detail endpoint. We query it once and
  // share the cache across all arm panels via the ["school", SCHOOL_ID] key.
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

  // ── Fetch class arms ───────────────────────────────────────────────────────
  // Gated on both `show` and a resolved current term — the backend rejects
  // arm/list/ requests without a term-id. The query key includes the term
  // so the cache is correctly partitioned if the term ever changes.
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

  // Extract the arm list from the paginated envelope for downstream use.
  const arms = armsData?.data ?? [];

  // Combined loading state — true while either dependency is in flight so the
  // dropdown's "Loading…" placeholder covers the whole school-then-arms chain.
  const armsLoading = schoolLoading || armsQueryLoading;

  // Surface error states via toast.
  useEffect(() => {
    if (schoolError) toast.error("Could not load school information.");
  }, [schoolError]);

  useEffect(() => {
    // Only fire once the school has loaded successfully but has no active term.
    if (schoolData && !currentTermId) {
      toast.error("This school has no active term — class arms unavailable.");
    }
  }, [schoolData, currentTermId]);

  useEffect(() => {
    if (armsError) toast.error("Could not load class arms.");
  }, [armsError]);

  // ── Assign-arm mutation ────────────────────────────────────────────────────
  // PUT arm/detail/roster/ with add_student wraps the single student id in
  // an array — the backend handles both single and bulk through the same shape.
  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      if (!student) throw new Error("No student selected.");
      if (!armId) throw new Error("Please select a class arm.");

      const { data, error } = await clientAuthFetch("arm/detail/roster/", {
        method: "PUT",
        body: {
          id: armId,
          school_id: SCHOOL_ID,
          add_student: [student.id],
        },
      });
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      toast.success(`Class assigned to ${student?.first_name ?? "student"}.`);
      // Parent's handleArmPanelClose invalidates the list and stats queries.
      onClose();
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : "Failed to assign class arm.",
      );
    },
  });

  // Helpful "all good to submit" gate
  const canSubmit = !!armId && !!student && !isPending;

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
          className="cursor-pointer flex items-center gap-1 text-xs text-red-600 hover:text-red-700 my-5 md:my-8 transition-all hover:scale-105 w-fit"
        >
          <ChevronLeft size={14} />
          <span>Back</span>
        </button>

        {/* Panel card */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm mb-10 text-black">
          {/* Header */}
          <div className="bg-slate-100 border-b border-slate-200 px-5 py-4">
            <h2 className="text-sm font-bold text-slate-800">
              Assign Class Arm
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Pick the class arm to assign this student to.
            </p>
          </div>

          {/* Body */}
          <div className="grid grid-cols-1 gap-5 px-5 py-6">
            {/* Student details (read-only block) */}
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-slate-500">
                Student
              </span>
              <div className="text-sm text-slate-800 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
                {student ? (
                  <>
                    {student.first_name}{" "}
                    {student.middle_name ? `${student.middle_name} ` : ""}
                    {student.last_name}{" "}
                    <span className="text-[10px] text-slate-400 ml-1">
                      ({student.public_id})
                    </span>
                  </>
                ) : (
                  <span className="text-slate-400">No student selected</span>
                )}
              </div>
            </div>

            {/* Class arm selector */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor="arm"
                className="flex items-center gap-1.5 text-xs font-medium text-slate-500"
              >
                New Class Arm <span className="text-red-500">*</span>
                {armId && (
                  <CheckCircle2 size={12} className="text-emerald-500" />
                )}
              </label>
              <select
                id="arm"
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
              <span className={isPending ? "invisible" : ""}>Assign Arm</span>
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
