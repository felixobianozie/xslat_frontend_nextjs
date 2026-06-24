"use client";

// ─────────────────────────────────────────────────────────────────────────────
// EditStudentSubjectsPanel.tsx
//
// Slide-in panel for managing a student's subject list within this arm.
//
// Two modes via a radio toggle:
//   1. "Exclude from offered" → remove subjects the student currently takes.
//      Backend: PUT subject/detail/ with { id: subject_id, exclude_students: [student_id] }
//   2. "Return to offered"    → add back subjects the student is excluded from.
//      Backend: PUT subject/detail/ with { id: subject_id, include_students: [student_id] }
//
// Backend wiring notes:
//   - The subject/list/ endpoint does NOT return `excluded_students` in its
//     payload, so we cannot derive offered vs not-offered client-side. We use
//     the dedicated `?offered-by-student=…` and `?not-offered-by-student=…`
//     query params to fetch each list separately.
//   - subject/detail/ updates ONE subject per request. To exclude/include a
//     student across N subjects, we fire N parallel PUTs (Promise.allSettled)
//     and report partial-failure counts to the user. Successful PUTs persist
//     server-side even if other PUTs fail, so the cache invalidation refreshes
//     the UI to reflect the true post-mutation state.
//
// Warning: excluding from a subject deletes the student's assessment records
// for that subject server-side. The panel surfaces this clearly before submit.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { AlertTriangle, ChevronLeft } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { useClientAuthFetch } from "@/lib/Useclientauthfetch";
import { useArmDetails, type ApiEnvelope } from "../context/Armdetailsprovider";
import ButtonLoader from "../../components/Buttonloader";

// ── Constants ────────────────────────────────────────────────────────────────

const SCHOOL_ID = process.env.NEXT_PUBLIC_SCHOOL_ID ?? "";

type Mode = "exclude" | "include";

// ── Local response shape for subject/list/ ───────────────────────────────────
// The backend returns subjects whose identity (name, abbr) lives on the nested
// `definition` object, not on the subject itself. Other fields like term and
// subject_arms also come back but aren't needed by this panel, so they're
// omitted from this minimal interface.
interface SubjectListItem {
  id: string;
  definition: {
    id: string;
    name: string;
    abbr: string;
  };
}

interface EditStudentSubjectsPanelProps {
  show: boolean;
  student: ArmStudent | null;
  onClose: () => void;
}

export default function EditStudentSubjectsPanel({
  show,
  student,
  onClose,
}: EditStudentSubjectsPanelProps) {
  const { armId, arm } = useArmDetails();
  const queryClient = useQueryClient();
  const { clientAuthFetch } = useClientAuthFetch();

  const [mode, setMode] = useState<Mode>("exclude");
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);

  // Reset state on each open + each student switch so old selections don't
  // carry over.
  useEffect(() => {
    if (show) {
      setMode("exclude");
      setSelectedSubjectIds([]);
    }
  }, [show, student?.id]);

  // The arm's term-id is required by subject/list/. Resolved via the
  // ArmDetailsProvider's already-cached arm record.
  const termId = arm?.level.section.term?.id ?? "";

  // The two list queries can only run once we have all three identifiers:
  // armId, student.id, and termId. armId and termId come from the arm detail
  // cache (loaded by ArmDetailsProvider); studentId comes from the panel prop.
  const queriesReady = show && !!student?.id && !!armId && !!termId;

  // ── Load offered subjects (subjects the student currently takes) ──────────
  const {
    data: offeredData,
    isLoading: offeredLoading,
    isError: offeredError,
  } = useQuery<ApiEnvelope<SubjectListItem[]>>({
    queryKey: ["student-offered-subjects", armId, student?.id],
    queryFn: async () => {
      const url =
        `subject/list/?school-id=${SCHOOL_ID}` +
        `&term-id=${termId}` +
        `&arm=${armId}` +
        `&offered-by-student=${student!.id}`;
      const { data, error } =
        await clientAuthFetch<ApiEnvelope<SubjectListItem[]>>(url);
      if (error) throw new Error(error.message);
      return data!;
    },
    enabled: queriesReady,
  });

  // ── Load not-offered subjects (subjects the student is excluded from) ─────
  const {
    data: notOfferedData,
    isLoading: notOfferedLoading,
    isError: notOfferedError,
  } = useQuery<ApiEnvelope<SubjectListItem[]>>({
    queryKey: ["student-not-offered-subjects", armId, student?.id],
    queryFn: async () => {
      const url =
        `subject/list/?school-id=${SCHOOL_ID}` +
        `&term-id=${termId}` +
        `&arm=${armId}` +
        `&not-offered-by-student=${student!.id}`;
      const { data, error } =
        await clientAuthFetch<ApiEnvelope<SubjectListItem[]>>(url);
      if (error) throw new Error(error.message);
      return data!;
    },
    enabled: queriesReady,
  });

  useEffect(() => {
    if (offeredError || notOfferedError) {
      toast.error("Could not load student's subjects.");
    }
  }, [offeredError, notOfferedError]);

  const offered = offeredData?.data ?? [];
  const notOffered = notOfferedData?.data ?? [];
  const subjectsLoading = offeredLoading || notOfferedLoading;

  // The list shown in the multi-select changes with the mode toggle.
  const choices = mode === "exclude" ? offered : notOffered;

  // ── Mutation ──────────────────────────────────────────────────────────────
  // The backend updates one subject per request, so we issue N parallel PUTs
  // and report partial failures honestly. Successful PUTs persist even when
  // siblings fail, so we always invalidate the affected caches afterwards.
  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      if (!student) throw new Error("No student selected.");
      if (selectedSubjectIds.length === 0) {
        throw new Error("Pick at least one subject.");
      }

      const fieldName =
        mode === "exclude" ? "exclude_students" : "include_students";
      const studentId = student.id;

      const settled = await Promise.allSettled(
        selectedSubjectIds.map(async (subjectId) => {
          const { data, error } = await clientAuthFetch<
            ApiEnvelope<SubjectListItem>
          >("subject/detail/", {
            method: "PUT",
            body: {
              id: subjectId,
              school_id: SCHOOL_ID,
              [fieldName]: [studentId],
            },
          });
          if (error) throw new Error(error.message);
          return data;
        }),
      );

      const failed = settled.filter((r) => r.status === "rejected");
      if (failed.length === 0) {
        return { total: selectedSubjectIds.length, failed: 0 };
      }

      // Surface the first failure message; the rest follow the same pattern
      // (usually a backend validation message like "broadsheet locked").
      const firstReason = (failed[0] as PromiseRejectedResult).reason;
      const firstMessage =
        firstReason instanceof Error ? firstReason.message : "Update failed.";

      if (failed.length === selectedSubjectIds.length) {
        throw new Error(firstMessage);
      }

      throw new Error(
        `${selectedSubjectIds.length - failed.length} of ${selectedSubjectIds.length} updated. ` +
          `${failed.length} failed: ${firstMessage}`,
      );
    },

    onSuccess: () => {
      toast.success(
        mode === "exclude"
          ? "Subjects excluded for student."
          : "Subjects returned to student.",
      );
      // Both lists may have changed — a subject moves from offered ↔ excluded.
      // The arm detail also depends on assessment records that are deleted on
      // exclusion, so refresh that too.
      queryClient.invalidateQueries({
        queryKey: ["student-offered-subjects", armId, student?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["student-not-offered-subjects", armId, student?.id],
      });
      queryClient.invalidateQueries({ queryKey: ["arm-detail", armId] });
      setSelectedSubjectIds([]);
    },

    onError: (err) => {
      // Even on partial failure the affected caches may now be stale, so
      // refresh them so the UI reflects what actually persisted server-side.
      queryClient.invalidateQueries({
        queryKey: ["student-offered-subjects", armId, student?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["student-not-offered-subjects", armId, student?.id],
      });
      queryClient.invalidateQueries({ queryKey: ["arm-detail", armId] });
      setSelectedSubjectIds([]);
      toast.error(
        err instanceof Error ? err.message : "Could not update subjects.",
      );
    },
  });

  // ── UI helpers ────────────────────────────────────────────────────────────

  function toggleSubject(id: string) {
    setSelectedSubjectIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  }

  const canSubmit = !!student && selectedSubjectIds.length > 0;
  const studentName = student
    ? `${student.first_name}${student.middle_name ? ` ${student.middle_name}` : ""} ${student.last_name}`
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
              Edit Student Subjects
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Manage which subjects this student takes in this class arm.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 px-5 py-6">
            {/* Student context */}
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-slate-500">
                Student
              </span>
              <div className="text-sm text-slate-800 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
                {studentName}
                {student?.public_id && (
                  <span className="text-[10px] text-slate-400 ml-2">
                    {student.public_id}
                  </span>
                )}
              </div>
            </div>

            {/* Current offered / not offered overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SubjectChipList
                label={`Offered (${offered.length})`}
                subjects={offered}
                emptyMessage="None"
                tone="success"
                loading={offeredLoading}
              />
              <SubjectChipList
                label={`Not Offered (${notOffered.length})`}
                subjects={notOffered}
                emptyMessage="None"
                tone="muted"
                loading={notOfferedLoading}
              />
            </div>

            {/* Mode toggle */}
            <fieldset className="flex flex-col md:flex-row gap-3 border-t border-slate-100 pt-4">
              <ModeRadio
                value="exclude"
                label="Exclude from offered subjects"
                tone="danger"
                checked={mode === "exclude"}
                onChange={() => {
                  setMode("exclude");
                  setSelectedSubjectIds([]);
                }}
              />
              <ModeRadio
                value="include"
                label="Return to offered subjects"
                tone="success"
                checked={mode === "include"}
                onChange={() => {
                  setMode("include");
                  setSelectedSubjectIds([]);
                }}
              />
            </fieldset>

            {/* Subject picker — checkbox list of the relevant choices */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-slate-500">
                {mode === "exclude"
                  ? "Select offered subjects to exclude"
                  : "Select excluded subjects to return"}
              </span>
              <div className="border border-slate-200 rounded-xl p-3 max-h-48 overflow-y-auto bg-white">
                {subjectsLoading ? (
                  <p className="text-xs text-slate-400">Loading subjects…</p>
                ) : choices.length === 0 ? (
                  <p className="text-xs text-slate-400">
                    {mode === "exclude"
                      ? "Student doesn't currently offer any subjects in this arm."
                      : "Student isn't excluded from any subjects in this arm."}
                  </p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {choices.map((sub) => (
                      <label
                        key={sub.id}
                        className="flex items-center gap-2 text-xs cursor-pointer hover:bg-slate-50 rounded-lg px-2 py-1.5"
                      >
                        <input
                          type="checkbox"
                          checked={selectedSubjectIds.includes(sub.id)}
                          onChange={() => toggleSubject(sub.id)}
                          className="rounded text-violet-600 focus:ring-violet-400"
                        />
                        <span className="text-slate-700">
                          {sub.definition.name}{" "}
                          <span className="text-slate-400">
                            ({sub.definition.abbr})
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Warning shown only when excluding — destructive on the backend */}
            {mode === "exclude" && (
              <div className="flex items-start gap-3 bg-amber-50 border-l-4 border-amber-400 rounded-r-lg p-3 text-xs text-amber-900">
                <AlertTriangle
                  size={16}
                  className="text-amber-500 mt-0.5 shrink-0"
                />
                <p>
                  Excluding the student from a subject deletes all of their
                  existing assessment records for that subject. This cannot be
                  undone.
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 bg-slate-50 border-t border-slate-100 px-5 py-4">
            <button
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 text-xs border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition-colors cursor-pointer"
            >
              Done
            </button>
            <button
              onClick={() => mutate()}
              disabled={!canSubmit || isPending}
              className={`relative flex items-center justify-center gap-2 px-4 py-2 text-xs text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm cursor-pointer ${
                mode === "exclude"
                  ? "bg-red-600 hover:bg-red-700 shadow-red-200"
                  : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200"
              }`}
            >
              <span className={isPending ? "invisible" : ""}>
                {mode === "exclude" ? "Exclude Subjects" : "Return Subjects"}
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

// ── Chip list for currently-offered / not-offered overview ───────────────────
function SubjectChipList({
  label,
  subjects,
  emptyMessage,
  tone,
  loading,
}: {
  label: string;
  subjects: SubjectListItem[];
  emptyMessage: string;
  tone: "success" | "muted";
  loading: boolean;
}) {
  const chipClasses =
    tone === "success"
      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
      : "bg-slate-100 text-slate-600 border-slate-200";

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <div className="flex flex-wrap gap-1.5 min-h-8">
        {loading ? (
          <span className="text-[10px] text-slate-400">Loading…</span>
        ) : subjects.length === 0 ? (
          <span className="text-[10px] text-slate-400">{emptyMessage}</span>
        ) : (
          subjects.map((sub) => (
            <span
              key={sub.id}
              className={`flex items-center text-[10px] px-2 py-1 rounded-full border  ${chipClasses}`}
            >
              {sub.definition.abbr}
            </span>
          ))
        )}
      </div>
    </div>
  );
}

// ── Radio for the exclude/include mode toggle ────────────────────────────────
function ModeRadio({
  value,
  label,
  tone,
  checked,
  onChange,
}: {
  value: Mode;
  label: string;
  tone: "danger" | "success";
  checked: boolean;
  onChange: () => void;
}) {
  const colorClass =
    tone === "danger"
      ? checked
        ? "text-red-600"
        : "text-slate-600"
      : checked
        ? "text-emerald-600"
        : "text-slate-600";

  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="radio"
        name="edit-subjects-mode"
        value={value}
        checked={checked}
        onChange={onChange}
        className="text-violet-600 focus:ring-violet-400"
      />
      <span className={`text-xs ${colorClass}`}>{label}</span>
    </label>
  );
}
