"use client";

// ─────────────────────────────────────────────────────────────────────────────
// RemoveSubjectTeachersPanel.tsx
//
// Slide-in panel to remove teachers from a subject within THIS arm.
//
// Backend wiring:
//   PUT subject/detail/
//     body: {
//       id: subjectId,
//       school_id,
//       remove_teachers: [{ arm: armId, teachers: [staffPortfolioId, …] }]
//     }
//
// Mirror image of the Assign panel: the picker shows only currently-assigned
// teachers (the candidates the user can actually remove). Currently-assigned
// teachers come directly from the selected subject's nested subject_arms
// payload — no extra fetch is required.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, UserMinus } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { useClientAuthFetch } from "@/lib/Useclientauthfetch";
import { useArmDetails } from "../context/Armdetailsprovider";
import ButtonLoader from "../../components/Buttonloader";
import type { ApiEnvelope } from "../page";

// ── Constants ────────────────────────────────────────────────────────────────

const SCHOOL_ID = process.env.NEXT_PUBLIC_SCHOOL_ID ?? "";

interface RemoveSubjectTeachersPanelProps {
  show: boolean;
  subject: ArmSubject | null;
  onClose: () => void;
}

function teacherName(t: ArmTeacher): string {
  const u = t.staff_profile.user;
  return `${u.first_name} ${u.last_name}`;
}

export default function RemoveSubjectTeachersPanel({
  show,
  subject,
  onClose,
}: RemoveSubjectTeachersPanelProps) {
  const { armId, arm } = useArmDetails();
  const queryClient = useQueryClient();
  const { clientAuthFetch } = useClientAuthFetch();

  const [selectedTeacherIds, setSelectedTeacherIds] = useState<string[]>([]);

  useEffect(() => {
    if (show) setSelectedTeacherIds([]);
  }, [show, subject?.id]);

  // Currently-assigned teachers — read straight from the subject prop's
  // arm entry. No separate fetch needed since SubjectsTab already nested them.
  const currentlyAssigned = useMemo(() => {
    if (!subject) return [];
    const armEntry = subject.subject_arms.find((sa) => sa.arm.id === armId);
    return armEntry?.teachers ?? [];
  }, [subject, armId]);

  // ── Mutation: remove teachers ─────────────────────────────────────────────
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
            remove_teachers: [
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
      toast.success("Teachers removed.");
      queryClient.invalidateQueries({ queryKey: ["arm-subjects", armId] });
      onClose();
    },

    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : "Could not remove teachers.",
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
              Remove Subject Teachers
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-5 px-5 py-6">
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
                    </span>
                    <span className="text-[10px] text-slate-400 ml-2">
                      · {armLabel}
                    </span>
                  </>
                ) : (
                  "—"
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-slate-500">
                Select Teacher(s) to Remove
              </span>
              <div className="border border-slate-200 rounded-xl p-3 max-h-56 overflow-y-auto bg-white">
                {currentlyAssigned.length === 0 ? (
                  <p className="text-xs text-slate-400">
                    No teachers are assigned to this subject in this arm.
                  </p>
                ) : (
                  <div className="flex flex-col gap-1">
                    {currentlyAssigned.map((t) => (
                      <label
                        key={t.id}
                        className="flex items-center gap-2 text-xs cursor-pointer hover:bg-slate-50 rounded-lg px-2 py-1.5"
                      >
                        <input
                          type="checkbox"
                          checked={selectedTeacherIds.includes(t.id)}
                          onChange={() => toggleTeacher(t.id)}
                          className="rounded text-red-600 focus:ring-red-400"
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
              className="relative flex items-center justify-center gap-2 px-4 py-2 text-xs bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm shadow-red-200 cursor-pointer"
            >
              <span
                className={`flex items-center gap-1.5 ${
                  isPending ? "invisible" : ""
                }`}
              >
                <UserMinus size={12} />
                Remove Teachers
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
