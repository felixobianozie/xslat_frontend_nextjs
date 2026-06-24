"use client";

// ─────────────────────────────────────────────────────────────────────────────
// ArmAssignTeachersPanel.tsx
//
// Slide-in panel for assigning the class teacher and assistant class teacher
// for a given class arm.
//
// Backend reference (PUT arm/detail/fields/):
//   Body: { id, school_id, class_teacher?, ass_class_teacher? }
//
//   The serializer's `ArmFieldUpdateView` validates both teachers belong to the
//   same school as the arm. We never send fields the user didn't touch so the
//   backend keeps existing values intact.
//
// Data layer:
//   - useQuery (arm detail) fetches GET arm/detail/?id=…&school-id=… so the
//     "Current Class Teacher" cards reflect what's actually in the database.
//     The list endpoint (which provided selectedArm) does NOT include teachers
//     in its payload, so without this fetch the cards would always read
//     "Not assigned" — misleading the user into overwriting real assignments.
//
//     The cache key here is ["arm-detail", armId] — the SAME shape used by
//     ArmDetailsProvider on /arm. That alignment matters: it lets a single
//     invalidation in onSuccess refresh both this panel's own card AND the
//     page-level provider that feeds the ClassTeacherTab cards.
//   - useQuery (teachers) fetches the staff portfolios list. The endpoint is
//     paginated, so we request page-size=100 in a single round-trip. Schools
//     with more than 100 staff would see a truncated list; that's an
//     acceptable trade-off for now to keep the panel snappy and avoid
//     chasing pagination cursors here.
//   - useMutation issues the PUT and invalidates both the arms list AND the
//     arm-detail cache for the selected arm so future opens see fresh data.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { ChevronLeft, UserCheck, UserPlus } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { useClientAuthFetch } from "@/lib/Useclientauthfetch";
import ButtonLoader from "../../components/Buttonloader";
import type { ApiEnvelope } from "../page";

// ── Constants ────────────────────────────────────────────────────────────────

const SCHOOL_ID = process.env.NEXT_PUBLIC_SCHOOL_ID ?? "";

// Backend pages staff portfolios in chunks (default 10, max 100). We request
// the max so a single fetch usually covers the school in one go.
const TEACHERS_PAGE_SIZE = 100;

// ── Local response shape for the paginated staff portfolios endpoint ─────────
// Mirrors xslat_backend.pagination.StandardPagination's envelope. Kept local
// to this file so the panel stays self-contained.
interface PaginatedResponse<T> {
  message: string;
  count: number;
  total_pages: number;
  current_page: number;
  next: string | null;
  previous: string | null;
  data: T[];
}

interface ArmAssignTeachersPanelProps {
  show: boolean;
  onClose: () => void;
  /** The arm whose teachers are being managed. Null when no panel is open. */
  selectedArm: ClassArm | null;
  /** Used to invalidate the right ["arms", …, termId] cache on success. */
  currentTermId: string;
}

// Display helper: "Section Abbr Level Abbr Arm Abbr" — e.g. "JSS 1 ORNG"
function formatArm(arm: ClassArm | null): string {
  if (!arm) return "—";
  return `${arm.level.section.abbr} ${arm.level.abbr} ${arm.abbr}`;
}

// Display helper: builds a teacher's full name from the nested user object.
function teacherName(teacher: ArmTeacher | null | undefined): string {
  if (!teacher) return "—";
  const u = teacher.staff_profile.user;
  return `${u.first_name} ${u.last_name}`;
}

export default function ArmAssignTeachersPanel({
  show,
  onClose,
  selectedArm,
  currentTermId,
}: ArmAssignTeachersPanelProps) {
  const queryClient = useQueryClient();
  const { clientAuthFetch } = useClientAuthFetch();

  // Selected teacher ids — start empty; the user explicitly picks new values.
  // Empty string means "no change" (we don't send the field on submit).
  const [classTeacherId, setClassTeacherId] = useState<string>("");
  const [assClassTeacherId, setAssClassTeacherId] = useState<string>("");

  // Reset selections whenever the panel opens or the target arm changes,
  // so an old selection from a previous open doesn't leak into a new one.
  useEffect(() => {
    if (show) {
      setClassTeacherId("");
      setAssClassTeacherId("");
    }
  }, [show, selectedArm?.id]);

  // ── Load the arm's current teachers ────────────────────────────────────────
  // The list endpoint omits class_teacher / ass_class_teacher, so we fetch
  // the arm detail here to populate the "Current …" cards accurately. Only
  // enabled when the panel is actually open to avoid wasted requests.
  //
  // Key shape matches ArmDetailsProvider exactly (["arm-detail", armId]) so
  // the page-level provider and this panel share a single cache entry — one
  // invalidation refreshes both surfaces.
  const {
    data: armDetailData,
    isLoading: armDetailLoading,
    isError: armDetailError,
  } = useQuery<ApiEnvelope<ClassArm>>({
    queryKey: ["arm-detail", selectedArm?.id],
    queryFn: async () => {
      const url = `arm/detail/?id=${selectedArm!.id}&school-id=${SCHOOL_ID}`;
      const { data, error } = await clientAuthFetch<ApiEnvelope<ClassArm>>(url);
      if (error) throw new Error(error.message);
      return data!;
    },
    enabled: show && !!selectedArm?.id,
  });

  useEffect(() => {
    if (armDetailError) {
      toast.error("Could not load current teacher information.");
    }
  }, [armDetailError]);

  // Fall back to the selectedArm prop if the detail fetch hasn't completed —
  // that gives us the arm header info (name / level / section) immediately
  // even while the teacher fields stream in.
  const armDetail = armDetailData?.data ?? selectedArm;

  // ── Load teacher options ───────────────────────────────────────────────────
  const {
    data: teachersData,
    isLoading: teachersLoading,
    isError: teachersError,
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
    if (teachersError) toast.error("Could not load teacher list.");
  }, [teachersError]);

  const teachers = teachersData?.data ?? [];

  // ── Assign-teachers mutation ───────────────────────────────────────────────
  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      if (!selectedArm) throw new Error("No arm selected.");

      // Build the body explicitly with the keys the backend expects. Only
      // include teacher fields the user actually changed — sending an empty
      // string would be ambiguous, and the backend treats "field absent" as
      // "leave existing value alone".
      const body: AssignTeachersInput = {
        id: selectedArm.id,
        school_id: SCHOOL_ID,
      };
      if (classTeacherId) body.class_teacher = classTeacherId;
      if (assClassTeacherId) body.ass_class_teacher = assClassTeacherId;

      const { data, error } = await clientAuthFetch<ApiEnvelope<ClassArm>>(
        "arm/detail/fields/",
        { method: "PUT", body },
      );

      if (error) throw new Error(error.message);
      return data;
    },

    onSuccess: () => {
      toast.success("Class teachers updated.");
      // Refresh the arms list (broad prefix covers the term-scoped key) and
      // the per-arm detail cache. The arm-detail key shape is shared with
      // ArmDetailsProvider, so this single call also refreshes the cards in
      // ClassTeacherTab on /arm.
      queryClient.invalidateQueries({ queryKey: ["arms", SCHOOL_ID] });
      if (selectedArm) {
        queryClient.invalidateQueries({
          queryKey: ["arm-detail", selectedArm.id],
        });
      }
      onClose();
    },

    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : "Could not update class teachers.",
      );
    },
  });

  // The submit button only enables once the user has picked at least one teacher.
  const canSubmit = !!selectedArm && (!!classTeacherId || !!assClassTeacherId);

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

        {/* Panel card */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm mb-10 text-black">
          {/* Header */}
          <div className="bg-slate-100 border-b border-slate-200 px-5 py-4">
            <h2 className="text-sm font-bold text-slate-800">
              Assign Class Teachers
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Pick a new class teacher, assistant, or both for this arm.
            </p>
          </div>

          {/* Body */}
          <div className="grid grid-cols-1 gap-5 px-5 py-6">
            {/* Class arm being managed — read-only context block */}
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-slate-500">
                Class Arm
              </span>
              <div className="text-sm text-slate-800 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
                {armDetail ? (
                  <>
                    {formatArm(armDetail)}
                    <span className="text-[10px] text-slate-400 ml-2">
                      ({armDetail.level.section.name})
                    </span>
                  </>
                ) : (
                  <span className="text-slate-400">No arm selected</span>
                )}
              </div>
            </div>

            {/* Current teachers — two responsive columns on tablet+. The
                teacher prop comes from the arm-detail fetch, not the list
                payload, so it accurately reflects the database. */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CurrentTeacherCard
                icon={<UserCheck size={14} className="text-violet-600" />}
                label="Current Class Teacher"
                teacher={armDetail?.class_teacher ?? null}
                loading={armDetailLoading}
              />
              <CurrentTeacherCard
                icon={<UserPlus size={14} className="text-violet-500" />}
                label="Current Ass. Class Teacher"
                teacher={armDetail?.ass_class_teacher ?? null}
                loading={armDetailLoading}
              />
            </div>

            {/* New teacher selectors */}
            <TeacherSelect
              id="class_teacher"
              label="New Class Teacher"
              value={classTeacherId}
              onChange={setClassTeacherId}
              teachers={teachers}
              loading={teachersLoading}
            />
            <TeacherSelect
              id="ass_class_teacher"
              label="New Ass. Class Teacher"
              value={assClassTeacherId}
              onChange={setAssClassTeacherId}
              teachers={teachers}
              loading={teachersLoading}
            />
          </div>

          {/* Footer */}
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
              <span className={isPending ? "invisible" : ""}>
                Save Teachers
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

// ── CurrentTeacherCard ───────────────────────────────────────────────────────
// Read-only block showing the teacher currently assigned to a role. Falls back
// to a muted "Not assigned" state when the role is empty, or a small loading
// hint while the arm-detail fetch is still in flight.
function CurrentTeacherCard({
  icon,
  label,
  teacher,
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  teacher: ArmTeacher | null;
  loading: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
        {icon}
        {label}
      </span>
      <div className="text-sm text-slate-700 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
        {loading ? (
          <span className="text-slate-400 text-xs">Loading…</span>
        ) : teacher ? (
          <div className="flex flex-col">
            <span>{teacherName(teacher)}</span>
            {teacher.staff_profile.user.public_id && (
              <span className="text-[10px] text-slate-400">
                {teacher.staff_profile.user.public_id}
              </span>
            )}
          </div>
        ) : (
          <span className="text-slate-400 text-xs">Not assigned</span>
        )}
      </div>
    </div>
  );
}

// ── TeacherSelect ────────────────────────────────────────────────────────────
// A simple, focused dropdown for picking a teacher. The native <select> is
// chosen on purpose — it works reliably across mobile/desktop, supports
// keyboard navigation out of the box, and matches the styling used in the
// Staff/Student create panels.
function TeacherSelect({
  id,
  label,
  value,
  onChange,
  teachers,
  loading,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (id: string) => void;
  teachers: ArmTeacher[];
  loading: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-medium text-slate-500">
        {label}
      </label>
      <select
        id={id}
        name={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading}
        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none transition-all bg-white appearance-none cursor-pointer focus:border-violet-400 focus:ring-2 focus:ring-violet-100 disabled:opacity-50"
      >
        <option value="">
          {loading ? "Loading teachers…" : "— No change —"}
        </option>
        {teachers.map((teacher) => {
          const u = teacher.staff_profile.user;
          return (
            <option key={teacher.id} value={teacher.id}>
              {u.first_name} {u.last_name}
              {u.public_id ? ` — ${u.public_id}` : ""}
            </option>
          );
        })}
      </select>
    </div>
  );
}
