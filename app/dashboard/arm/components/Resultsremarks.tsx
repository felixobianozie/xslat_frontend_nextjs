"use client";

// ─────────────────────────────────────────────────────────────────────────────
// ResultsRemarks.tsx
//
// Reusable remark editor — same shape covers both Teacher's Comment and
// Principal's Comment (the draft uses these labels). The `kind` discriminator
// picks the right mutation target, the right title, and the right toast copy.
// Every other affordance is identical across the two variants.
//
// Behaviour:
//   - Display mode: shows the remark text in a soft-bordered card, or a
//     "no comment yet" placeholder.
//   - Edit mode: textarea + a single-row toolbar. Left group is three
//     icon-only tools (Mark Absent, Good Performance, Needs Improvement).
//     Right group is Cancel + Save. The row does NOT wrap — buttons stay
//     on one line across mobile and desktop.
//   - Mark Absent fills the textarea with "None".
//   - Good Performance / Needs Improvement each open a centred modal
//     listing preset comments; selecting a preset replaces the textarea
//     content. Presets are configured via REMARK_PRESETS below.
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

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Lightbulb, Pencil, Save, Sparkles, UserX, X } from "lucide-react";
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

// ── Configurable preset comments ─────────────────────────────────────────────
// Edit these strings to change what appears in the insight-modal pickers.
// Each entry is a full sentence (or two) that will replace the textarea
// content when selected. No other file needs to change to add / remove /
// reword a preset — this is the single source of truth for the picker copy.
const REMARK_PRESETS = {
  good: [
    "Excellent performance this term. Keep up the outstanding work and aim even higher next term.",
    "You have shown remarkable improvement this term. Continue building on this success next term.",
    "Your participation and positive attitude toward learning are truly commendable. Keep it up next term.",
    "Your hard work has produced an excellent result. Stay committed and achieve even greater success next term.",
    "Keep striving for excellence, and maintain this impressive momentum in the coming term.",
    "Congratulations on your promotion to the next class!",
  ],
  improve: [
    "Put in more effort toward your studies to achieve better results next term.",
    "You can perform much better with improved focus, consistency, and commitment next term.",
    "Pay closer attention during lessons and complete all assignments to improve your performance next term.",
    "Stay focused, work harder, and strive for better results in the coming term.",
    "Repeat the current class.",
    "Promoted to the next class on trial. Greater dedication and improved performance are expected next term.",
  ],
} as const;

// Static metadata for each insight modal — kept next to the presets so
// title / helper copy live in one place. Keys mirror REMARK_PRESETS.
const INSIGHT_META = {
  good: {
    title: "Good Performance Comments",
    description:
      "Pick a preset to insert into this comment. You can edit it further before saving.",
  },
  improve: {
    title: "Needs Improvement Comments",
    description:
      "Pick a preset to insert into this comment. You can edit it further before saving.",
  },
} as const;

type InsightKind = keyof typeof REMARK_PRESETS;

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

  // Which insight-preset modal (if any) is currently open. Shared across
  // both variants — the Principal's Comment section uses the same picker.
  const [openInsight, setOpenInsight] = useState<InsightKind | null>(null);

  // Stable handlers so PresetsModal's useEffect deps don't re-fire on every
  // parent re-render (e.g. as the textarea updates on each keystroke).
  const handlePresetSelect = useCallback((text: string) => {
    setInput(text);
  }, []);
  const closeInsight = useCallback(() => {
    setOpenInsight(null);
  }, []);

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
      // Refresh arm-detail (raw arm.assessments) AND the compute payload
      // (which carries teachers_remark / supervisors_remark alongside the
      // aggregated grades). Both queries hold a copy of the remark, so
      // both need invalidating for the UI to stay consistent.
      queryClient.invalidateQueries({ queryKey: ["arm-detail", armId] });
      queryClient.invalidateQueries({
        queryKey: ["arm-assessment-compute", armId],
      });
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
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none transition-all bg-white focus:border-violet-400 focus:ring-2 focus:ring-violet-100 resize-y"
          />

          {/* Toolbar. `flex-nowrap` keeps everything on a single row across
              desktop and mobile — icon-only left buttons are compact enough
              that even a 320-wide viewport fits them alongside Cancel + Save.
              The inner left-group uses `mr-auto` to pin itself left. */}
          <div className="flex items-center justify-end gap-2 flex-nowrap">
            <div className="flex items-center gap-2 mr-auto">
              <button
                type="button"
                onClick={() => setInput("None")}
                disabled={isPending}
                title="Set this comment to 'None'"
                aria-label="Set to none"
                className="flex items-center justify-center p-2 border border-slate-300 bg-slate-900 text-white rounded-xl hover:bg-slate-700 disabled:opacity-50 transition-colors cursor-pointer"
              >
                <UserX size={14} />
              </button>

              <button
                type="button"
                onClick={() => setOpenInsight("good")}
                disabled={isPending}
                title="Insert a good-performance preset comment"
                aria-label="Good performance comment"
                className="flex items-center justify-center p-2 border border-emerald-200 bg-emerald-50 text-emerald-700 rounded-xl hover:bg-emerald-100 disabled:opacity-50 transition-colors cursor-pointer"
              >
                <Sparkles size={14} />
              </button>

              <button
                type="button"
                onClick={() => setOpenInsight("improve")}
                disabled={isPending}
                title="Insert a needs-improvement preset comment"
                aria-label="Needs improvement comment"
                className="flex items-center justify-center p-2 border border-red-200 bg-red-50 text-red-700 rounded-xl hover:bg-red-100 disabled:opacity-50 transition-colors cursor-pointer"
              >
                <Lightbulb size={14} />
              </button>
            </div>

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

      {/* Insight-preset picker modal. Only mounted while an insight kind is
          selected; unmounting is what removes the keydown listener and
          restores body scroll. */}
      {openInsight && (
        <PresetsModal
          title={INSIGHT_META[openInsight].title}
          description={INSIGHT_META[openInsight].description}
          presets={REMARK_PRESETS[openInsight]}
          onSelect={handlePresetSelect}
          onClose={closeInsight}
        />
      )}
    </section>
  );
}

// ── Presets modal ────────────────────────────────────────────────────────────
// Small portal-based picker: centred card with a scrollable list of preset
// comments. Selecting a preset calls onSelect(text) and closes. Backdrop
// click, X button, and Escape all close.
function PresetsModal({
  title,
  description,
  presets,
  onSelect,
  onClose,
}: {
  title: string;
  description: string;
  presets: readonly string[];
  onSelect: (text: string) => void;
  onClose: () => void;
}) {
  // Wire Escape and body-scroll lock while the modal is mounted. Cleanup
  // runs on unmount (i.e. when the parent stops rendering this component),
  // which is how backdrop / X / Escape all end up restoring scroll.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  // Guard against SSR — createPortal needs a live document. This branch is
  // essentially unreachable in the browser but keeps Next.js server-render
  // happy if the tree ever renders on the server.
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
    >
      {/* stopPropagation so backdrop clicks close but card clicks don't. */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-100">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">{description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 -mr-1 -mt-1 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body — scrollable list of preset options. */}
        <div className="flex-1 overflow-y-auto px-5 py-3">
          <ul className="flex flex-col gap-2">
            {presets.map((preset, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(preset);
                    onClose();
                  }}
                  className="w-full text-left text-xs text-slate-700 leading-relaxed p-3 border border-slate-200 rounded-xl bg-white hover:border-violet-300 hover:bg-violet-50/40 transition-colors cursor-pointer"
                >
                  {preset}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer hint — makes the replace-not-append behaviour clear. */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50">
          <p className="text-[11px] text-slate-500">
            Selecting a comment replaces any text you&apos;ve typed. You can
            edit it further before saving.
          </p>
        </div>
      </div>
    </div>,
    document.body,
  );
}
