"use client";

// ─────────────────────────────────────────────────────────────────────────────
// AddClassMemberPanel.tsx
//
// Slide-in panel that lets the user add a student (who has no current-term arm
// assignment) into THIS arm.
//
// Backend wiring:
//   GET student/list/?school-id=…&no-arm=true → eligible students
//   PUT arm/detail/roster/                    → add_student: [student_id]
//
// Data layer:
//   useQuery loads the unassigned-student pool, scoped to the school's current
//   term server-side (the endpoint returns [] if no current term is set).
//   useMutation calls arm/detail/roster/ on submit and invalidates
//   ["arm-detail", armId] + ["arm-students", armId] + ["students-without-arm"]
//   so the header assessment, the members list, and the eligible pool all
//   refresh.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { useClientAuthFetch } from "@/lib/Useclientauthfetch";
import { useArmDetails, type ApiEnvelope } from "../context/Armdetailsprovider";
import ButtonLoader from "../../components/Buttonloader";

// ── Constants ────────────────────────────────────────────────────────────────

const SCHOOL_ID = process.env.NEXT_PUBLIC_SCHOOL_ID ?? "";

// Same constant as the roster — keeps the dropdown to a single request even
// for schools with many unassigned students. If a school routinely has more
// than 100 unassigned, we'd add real pagination here.
const POOL_PAGE_SIZE = 100;

// ── Local response shape ─────────────────────────────────────────────────────
// student/list/ is paginated by StandardPagination — except when no-arm=true
// and the school has no current term, where it falls back to a flat envelope.
// Both shapes carry `data`, so reading `response.data` works for either.
interface PaginatedResponse<T> {
  message: string;
  count?: number;
  total_pages?: number;
  current_page?: number;
  next?: string | null;
  previous?: string | null;
  data: T[];
}

interface AddClassMemberPanelProps {
  show: boolean;
  onClose: () => void;
}

export default function AddClassMemberPanel({
  show,
  onClose,
}: AddClassMemberPanelProps) {
  const { armId, arm } = useArmDetails();
  const queryClient = useQueryClient();
  const { clientAuthFetch } = useClientAuthFetch();

  const [selectedStudentId, setSelectedStudentId] = useState("");

  // Reset selection whenever the panel opens so a previous selection doesn't
  // leak into a fresh open of the same panel.
  useEffect(() => {
    if (show) setSelectedStudentId("");
  }, [show]);

  // ── Load unassigned students ──────────────────────────────────────────────
  const {
    data: studentsData,
    isLoading: studentsLoading,
    isError: studentsError,
  } = useQuery<PaginatedResponse<ArmStudent>>({
    queryKey: ["students-without-arm"],
    queryFn: async () => {
      const url = `student/list/?school-id=${SCHOOL_ID}&no-arm=true&page=1&page-size=${POOL_PAGE_SIZE}`;
      const { data, error } =
        await clientAuthFetch<PaginatedResponse<ArmStudent>>(url);
      if (error) throw new Error(error.message);
      return data!;
    },
    enabled: show,
  });

  useEffect(() => {
    if (studentsError) toast.error("Could not load eligible students.");
  }, [studentsError]);

  const students = studentsData?.data ?? [];

  // ── Mutation ──────────────────────────────────────────────────────────────
  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      if (!selectedStudentId) throw new Error("Please select a student.");

      const { data, error } = await clientAuthFetch<ApiEnvelope<ClassArm>>(
        "arm/detail/roster/",
        {
          method: "PUT",
          body: {
            id: armId,
            school_id: SCHOOL_ID,
            add_student: [selectedStudentId],
          },
        },
      );
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      toast.success("Student added to class.");
      queryClient.invalidateQueries({ queryKey: ["arm-detail", armId] });
      queryClient.invalidateQueries({ queryKey: ["arm-students", armId] });
      queryClient.invalidateQueries({ queryKey: ["students-without-arm"] });
      onClose();
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : "Could not add student.",
      );
    },
  });

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
          className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 my-5 md:my-8 transition-all hover:scale-105 w-fit cursor-pointer"
        >
          <ChevronLeft size={14} />
          <span>Back</span>
        </button>

        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm mb-10 text-black">
          <div className="bg-slate-100 border-b border-slate-200 px-5 py-4">
            <h2 className="text-sm font-bold text-slate-800">
              Add Class Member
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Choose a student with no current-term class arm assignment.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 px-5 py-6">
            {/* Class arm context */}
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-slate-500">
                Class Arm
              </span>
              <div className="text-sm text-slate-800 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
                {arm
                  ? `${arm.level.section.abbr} ${arm.level.abbr} ${arm.abbr}`
                  : "—"}
              </div>
            </div>

            {/* Student selector */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor="student"
                className="text-xs font-medium text-slate-500"
              >
                Select Student <span className="text-red-500">*</span>
              </label>
              <select
                id="student"
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                disabled={studentsLoading}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none transition-all bg-white appearance-none cursor-pointer focus:border-violet-400 focus:ring-2 focus:ring-violet-100 disabled:opacity-50"
              >
                <option value="">
                  {studentsLoading
                    ? "Loading students…"
                    : students.length === 0
                      ? "— No unassigned students —"
                      : "— Select a student —"}
                </option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.first_name}{" "}
                    {student.middle_name ? `${student.middle_name} ` : ""}
                    {student.last_name}
                    {student.public_id ? ` — ${student.public_id}` : ""}
                  </option>
                ))}
              </select>
              {!studentsLoading && students.length === 0 && (
                <p className="text-[10px] text-slate-400 mt-1">
                  Every student already has a class arm. Remove a student from
                  their current arm before reassigning.
                </p>
              )}
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
              disabled={!selectedStudentId || isPending}
              className="relative flex items-center justify-center gap-2 px-4 py-2 text-xs bg-violet-600 text-white rounded-xl hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm shadow-violet-200 cursor-pointer"
            >
              <span className={isPending ? "invisible" : ""}>Add Student</span>
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
