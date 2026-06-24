"use client";

// ─────────────────────────────────────────────────────────────────────────────
// ResultsRemarks.tsx
//
// Reusable remark editor — same shape covers both Teacher's Comment and
// Principal's Comment (the draft uses these labels). The `kind` discriminator
// picks the right mutation target and the right copy.
//
// Behaviour:
//   - Display mode: shows the remark text in a soft-bordered card, or a
//     "no comment yet" placeholder.
//   - Edit mode: textarea + Save / Cancel / Mark Absent buttons.
//   - Mark Absent fills the textarea with "Absent" (matches the draft).
//
// Backend wiring:
//   PUT arm/detail/remarks/
//     body: {
//       id: armId, school_id,
//       teachers_remarks:   [{ student: studentId, remark: text }]    // when kind="teacher"
//       // — OR —
//       supervisors_remarks: [{ student: studentId, remark: text }]   // when kind="supervisor"
//     }
//
// One editor instance per (student, kind) pair; mounting two of them lets
// the GENERAL view stack teacher above supervisor without duplication.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Save, UserX, X } from "lucide-react";
import { toast } from "react-toastify";

import { useClientAuthFetch } from "@/lib/Useclientauthfetch";
import { useArmDetails } from "../context/Armdetailsprovider";
import ButtonLoader from "../../components/Buttonloader";
import type { ApiEnvelope } from "../page";

// ── Constants ────────────────────────────────────────────────────────────────

const SCHOOL_ID = process.env.NEXT_PUBLIC_SCHOOL_ID ?? "";

interface ResultsRemarksProps {
  kind: "teacher" | "supervisor";
  student: ArmStudent;
  existingRemark: string;
}

const COPY = {
  teacher: {
    title: "Teacher's Comment",
    placeholder: "Write the teacher's comment here…",
    emptyLabel: "No comment yet",
  },
  supervisor: {
    title: "Principal's Comment",
    placeholder: "Write the principal's comment here…",
    emptyLabel: "No comment yet",
  },
} as const;

export default function ResultsRemarks({
  kind,
  student,
  existingRemark,
}: ResultsRemarksProps) {
  const { armId } = useArmDetails();
  const queryClient = useQueryClient();
  const { clientAuthFetch } = useClientAuthFetch();
  const copy = COPY[kind];

  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState("");

  // Reset the input each time we enter edit mode, or when the student changes
  // mid-edit (avoids stale text leaking between students).
  useEffect(() => {
    if (editing) setInput(existingRemark);
  }, [editing, existingRemark, student.id]);

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const text = input.trim();
      if (!text) throw new Error("Comment cannot be empty.");

      // Pick the body key based on which remark type this editor controls.
      const remarkKey =
        kind === "teacher" ? "teachers_remarks" : "supervisors_remarks";

      const { data, error } = await clientAuthFetch<ApiEnvelope<unknown>>(
        "arm/detail/remarks/",
        {
          method: "PUT",
          body: {
            id: armId,
            school_id: SCHOOL_ID,
            [remarkKey]: [{ student: student.id, remark: text }],
          },
        },
      );

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      toast.success(
        kind === "teacher"
          ? "Teacher's comment saved."
          : "Principal's comment saved.",
      );
      // Refresh the arm so arm.assessments carries the new remark on next read.
      queryClient.invalidateQueries({ queryKey: ["arm-detail", armId] });
      setEditing(false);
      setInput("");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Could not save.");
    },
  });

  function handleCancel() {
    setEditing(false);
    setInput("");
  }

  const hasChange = editing && input.trim() !== existingRemark.trim();
  const canSave = editing && input.trim().length > 0 && hasChange && !isPending;

  return (
    <section className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
          {copy.title}
          <span className="text-red-500 text-base leading-none">*</span>
        </h3>
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-slate-200 bg-white text-slate-600 rounded-xl hover:border-violet-300 transition-colors cursor-pointer"
          >
            <Pencil size={12} />
            Edit
          </button>
        )}
      </div>

      {/* Display mode */}
      {!editing && (
        <div className="border border-slate-200 rounded-xl bg-white p-4 min-h-22 text-xs text-slate-700 whitespace-pre-wrap">
          {existingRemark.trim() ? (
            existingRemark
          ) : (
            <span className="text-slate-400 italic">{copy.emptyLabel}</span>
          )}
        </div>
      )}

      {/* Edit mode */}
      {editing && (
        <div className="flex flex-col gap-2.5">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={copy.placeholder}
            rows={4}
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none transition-all bg-white focus:border-violet-400 focus:ring-2 focus:ring-violet-100 resize-y"
          />

          <div className="flex items-center justify-end gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setInput("Absent")}
              disabled={isPending}
              className="flex items-center gap-1.5 px-3 py-2 text-xs border border-slate-300 bg-slate-900 text-white rounded-xl hover:bg-slate-700 disabled:opacity-50 transition-colors mr-auto cursor-pointer"
              title="Set this comment to 'Absent'"
            >
              <UserX size={12} />
              Mark Absent
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isPending}
              className="flex items-center gap-1.5 px-3 py-2 text-xs border border-slate-200 bg-white text-slate-600 rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-colors cursor-pointer"
            >
              <X size={12} />
              Cancel
            </button>
            <button
              type="button"
              onClick={() => mutate()}
              disabled={!canSave}
              className="relative flex items-center justify-center gap-1.5 px-3 py-2 text-xs bg-violet-600 text-white rounded-xl hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm shadow-violet-200 min-w-24 cursor-pointer"
            >
              {/* Flex layout stays applied in both states so the icon +
                  gap + text always reserve their space — only `invisible`
                  toggles. Locks the button's intrinsic width across loading. */}
              <span
                className={`flex items-center gap-1.5 ${
                  isPending ? "invisible" : ""
                }`}
              >
                <Save size={12} />
                Save
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
      )}
    </section>
  );
}
