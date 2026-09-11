"use client";

// ─────────────────────────────────────────────────────────────────────────────
// ClassMemberRemoveFromArmDialog.tsx
//
// Confirmation modal shown before removing a student from the class arm they
// currently belong to. Mirrors StudentRemoveFromArmDialog on the /students
// module for visual + copy consistency, with two key differences:
//   - The arm being removed from comes from the arm-detail page's context
//     rather than the student record. Every row on this tab is already
//     scoped to the same arm, so the caller passes that arm in directly.
//   - The "Change Class" recommendation points to the /students page,
//     because Change Class is owned by the students module and isn't
//     available from the arm side.
//
// Backend reference (PUT arm/detail/roster/):
//   Body: { id: <arm_uuid>, school_id, remove_student: [<student_uuid>] }
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect } from "react";
import Link from "next/link";
import { X, AlertTriangle, CheckCircle2 } from "lucide-react";
import ButtonLoader from "../../components/Buttonloader";

interface ClassMemberRemoveFromArmDialogProps {
  open: boolean;
  /** The student being removed. Null while no row action is in flight. */
  student: ArmStudent | null;
  /** The arm the student is being removed from — resolved from the arm-detail
   *  page context by the caller. Null before the arm has loaded. */
  arm: ClassArm | null;
  isPending: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

// Compact "SEC-abbr LVL-abbr ARM-abbr" (e.g. "JSS 2 A"). Falls back to a
// friendly generic when the arm chain isn't available yet so downstream
// copy still reads naturally.
function formatArm(arm: ClassArm | null): string {
  if (!arm) return "their class";
  return `${arm.level.section.abbr} ${arm.level.abbr} ${arm.abbr}`;
}

export default function ClassMemberRemoveFromArmDialog({
  open,
  student,
  arm,
  isPending,
  onClose,
  onConfirm,
}: ClassMemberRemoveFromArmDialogProps) {
  // Close on Escape — small accessibility win for keyboard users. Ignored
  // while the mutation is in flight so a stray keypress can't dismiss the
  // dialog mid-request and leave the user unsure whether it succeeded.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !isPending) onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, isPending, onClose]);

  if (!open) return null;

  const armLabel = formatArm(arm);
  const studentName = student
    ? `${student.last_name} ${student.first_name} ${student.middle_name}`
    : "this student";

  return (
    <div
      // Fixed overlay — centred dialog on top of a translucent backdrop.
      className="fixed inset-0 z-9999 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="class-member-remove-title"
      // Backdrop click closes the dialog when not in flight.
      onClick={() => {
        if (!isPending) onClose();
      }}
    >
      <div
        // stopPropagation so clicks inside the dialog don't trigger the
        // backdrop close.
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
              id="class-member-remove-title"
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
            <span className="font-semibold text-slate-900">{studentName}</span>{" "}
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
              existing data, use Change Class from the{" "}
              <Link
                href="/dashboard/students"
                className="font-semibold underline underline-offset-2 hover:text-emerald-800"
              >
                Students page
              </Link>{" "}
              instead. It transfers the data to the new class.
            </p>
          </div>

          <p>
            If you're sure you still want to proceed with the removal, click{" "}
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
