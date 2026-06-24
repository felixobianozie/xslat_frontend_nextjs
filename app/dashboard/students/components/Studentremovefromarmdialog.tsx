"use client";

// ─────────────────────────────────────────────────────────────────────────────
// StudentRemoveFromArmDialog.tsx
//
// Confirmation modal shown before removing a student from their current class
// arm. Replaces the draft's native <dialog> + DaisyUI modal with a fully
// Tailwind-styled overlay so we stay within the project's styling constraints.
//
// Backend reference (PUT arm/detail/roster/):
//   Body: { id: <arm_uuid>, school_id, remove_student: [<student_uuid>] }
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect } from "react";
import { X, AlertTriangle, CheckCircle2 } from "lucide-react";
import ButtonLoader from "../../components/Buttonloader";

interface StudentRemoveFromArmDialogProps {
  open: boolean;
  student: StudentRecord | null;
  isPending: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

function formatArm(arm: ClassArm | null | undefined): string {
  if (!arm) return "their class";
  return `${arm.level.section.abbr} ${arm.level.abbr} ${arm.abbr}`;
}

export default function StudentRemoveFromArmDialog({
  open,
  student,
  isPending,
  onClose,
  onConfirm,
}: StudentRemoveFromArmDialogProps) {
  // Close on Escape — small accessibility win for keyboard users.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !isPending) onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, isPending, onClose]);

  if (!open) return null;

  const armLabel = formatArm(student?.current_arm);

  return (
    <div
      // Fixed overlay — centred dialog on top of a translucent backdrop.
      className="fixed inset-0 z-9999 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="remove-arm-title"
      // Backdrop click closes the dialog when not in flight.
      onClick={() => {
        if (!isPending) onClose();
      }}
    >
      <div
        // stopPropagation so clicks inside the dialog don't trigger the backdrop close
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center">
              <AlertTriangle size={16} className="text-red-500" />
            </div>
            <h2
              id="remove-arm-title"
              className="text-sm font-bold text-slate-800"
            >
              Remove from Class
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={isPending}
            className="cursor-pointer text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5 text-xs text-slate-700 leading-relaxed space-y-3">
          <p>
            You are about to remove{" "}
            <span className="font-semibold text-slate-900">
              {student
                ? `${student.first_name} ${student.last_name}`
                : "this student"}
            </span>{" "}
            from{" "}
            <span className="font-semibold text-slate-900">{armLabel}</span>.
          </p>

          <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-100 rounded-xl px-3 py-2">
            <AlertTriangle
              size={13}
              className="text-yellow-600 shrink-0 mt-0.5"
            />
            <p className="text-[11px] text-yellow-700">
              <span className="font-semibold">Warning:</span> all assessment
              data for this student in {armLabel} will be permanently deleted.
            </p>
          </div>

          <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
            <CheckCircle2
              size={13}
              className="text-emerald-600 shrink-0 mt-0.5"
            />
            <p className="text-[11px] text-emerald-700">
              <span className="font-semibold">Recommendation:</span> to keep the
              existing data, use{" "}
              <span className="font-semibold">Change Class</span> instead — that
              transfers the data to the new class.
            </p>
          </div>

          <p>
            If you're sure you want to proceed, click{" "}
            <span className="font-semibold">Remove</span> to confirm.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 bg-slate-50 border-t border-slate-100 px-5 py-3">
          <button
            onClick={onClose}
            disabled={isPending}
            className="cursor-pointer px-4 py-2 text-xs border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition-colors"
          >
            Close
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="cursor-pointer relative flex items-center justify-center gap-2 px-4 py-2 text-xs bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm shadow-red-200"
          >
            <span className={isPending ? "invisible" : ""}>Remove</span>
            <span
              className={`absolute inset-0 flex items-center justify-center ${isPending ? "" : "invisible"}`}
            >
              <ButtonLoader />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
