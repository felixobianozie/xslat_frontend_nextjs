"use client";

// ─────────────────────────────────────────
// app/dashboard/fees/arm/components/Markpaidmodal.tsx
//
// The confirmation before everything the ticked students owe is marked as
// paid. It shows how many students and how much money are involved, names the
// students, and keeps the confirm button locked until the person ticks that
// the money has been received, so it cannot be done by a stray click.
// ─────────────────────────────────────────

import { useState } from "react";
import { CheckCheck, X } from "lucide-react";
import { toast } from "react-toastify";
import { personName } from "@/lib/Personname";
import Overlay from "../../components/Overlay";
import { formatNaira, studentTotals } from "../../fees";
import { useMarkPaid } from "../../hooks/Usefees";

const TITLE_ID = "mark-paid-title";
const NAMES_SHOWN = 6;

interface MarkPaidModalProps {
  armId: string;
  armName: string;
  /** The ticked students who owe something. */
  students: StudentFees[];
  /** Ticked students who owe nothing, and so are left out. */
  skipped: number;
  onClose: () => void;
  /** Called after the students have been marked as paid. */
  onDone: () => void;
}

export default function MarkPaidModal({
  armId,
  armName,
  students,
  skipped,
  onClose,
  onDone,
}: MarkPaidModalProps) {
  const markPaid = useMarkPaid(armId);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = students.reduce((sum, s) => sum + studentTotals(s).balance, 0);
  const count = students.length;
  const noun = count === 1 ? "student" : "students";

  async function handleConfirm() {
    setError(null);
    try {
      const result = await markPaid.mutateAsync(students.map((s) => s.id));
      toast.success(
        `${result.students} ${result.students === 1 ? "student" : "students"} marked as paid (${formatNaira(result.amount)}).`,
      );
      onDone();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The students could not be marked as paid.",
      );
    }
  }

  return (
    <Overlay onClose={onClose} labelledBy={TITLE_ID} placement="centre">
      <header className="flex items-start gap-3 px-5 pb-3 pt-4 sm:pt-5">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"
          aria-hidden="true"
        >
          <CheckCheck size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id={TITLE_ID} className="text-base font-bold text-slate-800">
            Mark as paid in full?
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">{armName}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
        >
          <X size={18} />
        </button>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto px-5 pb-2">
        <p className="text-sm leading-relaxed text-slate-600">
          {`This records everything these ${noun} still owe, this term's fees and any arrears, as paid today.`}
        </p>

        <dl className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-slate-50 p-3.5">
            <dt className="text-[10px] uppercase tracking-wide text-slate-400">Students</dt>
            <dd className="mt-1 text-xl font-bold text-slate-800">{count}</dd>
          </div>
          <div className="rounded-2xl bg-emerald-50 p-3.5">
            <dt className="text-[10px] uppercase tracking-wide text-emerald-600">Amount to record</dt>
            <dd className="mt-1 text-xl font-bold tabular-nums text-emerald-700">
              {formatNaira(total)}
            </dd>
          </div>
        </dl>

        <ul className="max-h-40 divide-y divide-slate-100 overflow-y-auto rounded-2xl border border-slate-100 text-sm">
          {students.slice(0, NAMES_SHOWN).map((student) => (
            <li
              key={student.id}
              className="flex items-center justify-between gap-3 px-4 py-2.5"
            >
              <span className="min-w-0 truncate text-slate-700">
                {personName(student)}
              </span>
              <span className="shrink-0 text-xs font-semibold tabular-nums text-slate-500">
                {formatNaira(studentTotals(student).balance)}
              </span>
            </li>
          ))}
          {count > NAMES_SHOWN && (
            <li className="px-4 py-2.5 text-xs text-slate-400">
              and {count - NAMES_SHOWN} more
            </li>
          )}
        </ul>

        {skipped > 0 && (
          <p className="text-xs text-slate-400">
            {skipped} selected {skipped === 1 ? "student owes" : "students owe"}{" "}
            nothing and {skipped === 1 ? "is" : "are"} left out.
          </p>
        )}

        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-3.5">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(event) => setConfirmed(event.target.checked)}
            className="mt-0.5 h-4 w-4 cursor-pointer accent-amber-600"
          />
          <span className="text-sm font-medium leading-snug text-amber-900">
            I confirm that this money has been received.
          </span>
        </label>

        {error && (
          <p role="alert" className="text-xs font-medium text-rose-600">
            {error}
          </p>
        )}
      </div>

      <footer className="flex flex-col-reverse gap-2 border-t border-slate-100 px-5 py-4 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!confirmed || markPaid.isPending}
          className="cursor-pointer rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-200"
        >
          {markPaid.isPending ? "Marking\u2026" : `Mark ${count} as paid`}
        </button>
      </footer>
    </Overlay>
  );
}
