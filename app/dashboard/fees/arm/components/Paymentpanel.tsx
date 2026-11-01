"use client";

// ─────────────────────────────────────────
// app/dashboard/fees/arm/components/Paymentpanel.tsx
//
// One student's fees in detail: what they owe and have paid for this term and
// from earlier terms, a form to record a payment, and the history of payments.
// It opens from the student list as a panel at the right edge on large screens
// and as a sheet from the bottom on a phone.
//
// It is given the student from the latest class data, so it updates by itself
// as soon as a payment has been recorded.
// ─────────────────────────────────────────

import { useState, type FormEvent } from "react";
import { Check, X } from "lucide-react";
import { toast } from "react-toastify";
import { personName } from "@/lib/Personname";
import FeesStatusPill from "../../components/Feesstatuspill";
import Overlay from "../../components/Overlay";
import ProgressBar from "../../components/Progressbar";
import StudentAvatar from "../../components/Studentavatar";
import {
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  formatDate,
  formatNaira,
  groupDigits,
  paymentTargets,
  studentTotals,
  todayIso,
} from "../../fees";
import { useRecordPayment } from "../../hooks/Usefees";

const TITLE_ID = "payment-panel-title";
const FIELD =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-100";

// While an amount is typed it is shown with thousands separators, so 120000
// reads 120,000. Anything that is not a plain number is left as typed, so the
// form can say what is wrong with it instead of quietly changing it.
function formatAmountInput(raw: string): string {
  if (!/^[\d,\s]*$/.test(raw)) return raw;
  return groupDigits(raw.replace(/\D/g, ""));
}

interface PaymentPanelProps {
  armId: string;
  student: StudentFees;
  onClose: () => void;
}

// One fee, or one old balance, with how much of it has been paid.
function FeeLine({
  label,
  due,
  paid,
}: {
  label: string;
  due: number;
  paid: number;
}) {
  const balance = due - paid;
  return (
    <li className="py-3">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="min-w-0 truncate font-medium text-slate-700">{label}</span>
        <span className="shrink-0 text-xs tabular-nums text-slate-400">
          {formatNaira(paid)} of {formatNaira(due)}
        </span>
      </div>
      <ProgressBar
        value={due === 0 ? 0 : (paid / due) * 100}
        tone={balance === 0 ? "emerald" : "violet"}
        label={`${label} paid`}
        className="mt-2"
      />
      <p
        className={`mt-1.5 flex items-center gap-1 text-xs font-medium ${
          balance === 0 ? "text-emerald-600" : "text-rose-600"
        }`}
      >
        {balance === 0 ? (
          <>
            <Check size={12} aria-hidden="true" /> Paid in full
          </>
        ) : (
          `${formatNaira(balance)} left to pay`
        )}
      </p>
    </li>
  );
}

export default function PaymentPanel({
  armId,
  student,
  onClose,
}: PaymentPanelProps) {
  const totals = studentTotals(student);
  const targets = paymentTargets(student);
  const record = useRecordPayment(armId);
  const name = personName(student);

  // An empty targetId means "the first fee that still has a balance".
  const [targetId, setTargetId] = useState("");
  const [amount, setAmount] = useState(() =>
    formatAmountInput(String(targets[0]?.balance ?? "")),
  );
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [date, setDate] = useState(todayIso);
  const [error, setError] = useState<string | null>(null);

  const target = targets.find((t) => t.id === targetId) ?? targets[0];

  function chooseTarget(id: string) {
    setTargetId(id);
    setAmount(
      formatAmountInput(String(targets.find((t) => t.id === id)?.balance ?? "")),
    );
    setError(null);
  }

  // The amount in whole Naira, or the reason it cannot be used.
  function checkForm(): { amount: number } | { problem: string } {
    const digits = amount.replace(/[,\s]/g, "");
    if (!/^\d+$/.test(digits)) {
      return { problem: "Enter a whole amount in Naira, for example 25000." };
    }
    const value = Number(digits);
    if (value <= 0) return { problem: "Enter an amount greater than zero." };
    if (value > target.balance) {
      return {
        problem: `The most you can record for this fee is ${formatNaira(target.balance)}.`,
      };
    }
    if (!date) return { problem: "Choose the date the payment was made." };
    if (date > todayIso()) {
      return { problem: "The payment date cannot be in the future." };
    }
    return { amount: value };
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const checked = checkForm();
    if ("problem" in checked) {
      setError(checked.problem);
      return;
    }

    try {
      await record.mutateAsync({
        studentId: student.id,
        input: { targetId: target.id, amount: checked.amount, method, date },
      });
      toast.success(`Recorded ${formatNaira(checked.amount)} for ${name}.`);
      setTargetId("");
      setAmount("");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The payment could not be recorded.",
      );
    }
  }

  return (
    <Overlay onClose={onClose} labelledBy={TITLE_ID} placement="side">
      <header className="flex items-start gap-3 border-b border-slate-100 px-5 pb-4 pt-4">
        <StudentAvatar
          firstName={student.first_name}
          lastName={student.last_name}
          size="lg"
        />
        <div className="min-w-0 flex-1">
          <h2 id={TITLE_ID} className="truncate text-base font-bold text-slate-800">
            {name}
          </h2>
          <p className="text-xs text-slate-400">{student.public_id}</p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <FeesStatusPill status={totals.status} />
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
              {student.boarder ? "Boarding" : "Day"}
            </span>
          </div>
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

      <div className="flex-1 space-y-6 overflow-y-auto px-5 pb-8 pt-5">
        <dl className="grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-slate-50 p-3">
            <dt className="text-[10px] uppercase tracking-wide text-slate-400">Balance</dt>
            <dd
              className={`mt-1 text-sm font-bold tabular-nums ${
                totals.balance > 0 ? "text-rose-600" : "text-emerald-600"
              }`}
            >
              {formatNaira(totals.balance)}
            </dd>
          </div>
          <div className="rounded-2xl bg-slate-50 p-3">
            <dt className="text-[10px] uppercase tracking-wide text-slate-400">Paid</dt>
            <dd className="mt-1 text-sm font-bold tabular-nums text-slate-700">
              {formatNaira(totals.paid)}
            </dd>
          </div>
          <div className="rounded-2xl bg-slate-50 p-3">
            <dt className="text-[10px] uppercase tracking-wide text-slate-400">Total due</dt>
            <dd className="mt-1 text-sm font-bold tabular-nums text-slate-700">
              {formatNaira(totals.due)}
            </dd>
          </div>
        </dl>

        <section aria-labelledby="this-term-heading">
          <h3 id="this-term-heading" className="text-sm font-semibold text-slate-700">
            This term
          </h3>
          <ul className="divide-y divide-slate-100">
            {student.items.map((item) => (
              <FeeLine key={item.id} label={item.label} due={item.due} paid={item.paid} />
            ))}
          </ul>
        </section>

        {student.arrears.length > 0 && (
          <section aria-labelledby="arrears-heading">
            <h3 id="arrears-heading" className="text-sm font-semibold text-slate-700">
              Arrears from earlier terms
            </h3>
            <ul className="divide-y divide-slate-100">
              {student.arrears.map((arrear) => (
                <FeeLine
                  key={arrear.id}
                  label={arrear.label}
                  due={arrear.due}
                  paid={arrear.paid}
                />
              ))}
            </ul>
          </section>
        )}

        <section aria-labelledby="record-heading">
          <h3 id="record-heading" className="text-sm font-semibold text-slate-700">
            Record a payment
          </h3>

          {!target ? (
            <p className="mt-3 flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              <Check size={16} aria-hidden="true" />
              Nothing left to pay. This student is cleared.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="mt-3 space-y-3" noValidate>
              <div>
                <label htmlFor="pay-for" className="mb-1 block text-xs font-medium text-slate-500">
                  Payment for
                </label>
                <select
                  id="pay-for"
                  value={target.id}
                  onChange={(event) => chooseTarget(event.target.value)}
                  className={`${FIELD} cursor-pointer`}
                >
                  {(["This term", "Arrears"] as const).map((group) => {
                    const options = targets.filter((t) => t.group === group);
                    if (options.length === 0) return null;
                    return (
                      <optgroup key={group} label={group}>
                        {options.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.label} ({formatNaira(t.balance)} left)
                          </option>
                        ))}
                      </optgroup>
                    );
                  })}
                </select>
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label htmlFor="pay-amount" className="text-xs font-medium text-slate-500">
                    Amount (Naira)
                  </label>
                  <button
                    type="button"
                    onClick={() => setAmount(formatAmountInput(String(target.balance)))}
                    className="cursor-pointer text-xs font-semibold text-violet-700 hover:underline"
                  >
                    Full balance
                  </button>
                </div>
                <input
                  id="pay-amount"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={amount}
                  onChange={(event) => {
                    setAmount(formatAmountInput(event.target.value));
                    setError(null);
                  }}
                  placeholder={`Up to ${formatNaira(target.balance)}`}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? "pay-error" : undefined}
                  className={FIELD}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="pay-method" className="mb-1 block text-xs font-medium text-slate-500">
                    Method
                  </label>
                  <select
                    id="pay-method"
                    value={method}
                    onChange={(event) => setMethod(event.target.value as PaymentMethod)}
                    className={`${FIELD} cursor-pointer`}
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m} value={m}>
                        {PAYMENT_METHOD_LABELS[m]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="pay-date" className="mb-1 block text-xs font-medium text-slate-500">
                    Date paid
                  </label>
                  <input
                    id="pay-date"
                    type="date"
                    value={date}
                    max={todayIso()}
                    onChange={(event) => setDate(event.target.value)}
                    className={FIELD}
                  />
                </div>
              </div>

              {error && (
                <p id="pay-error" role="alert" className="text-xs font-medium text-rose-600">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={record.isPending}
                className="w-full cursor-pointer rounded-xl bg-violet-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-violet-300"
              >
                {record.isPending ? "Recording\u2026" : "Record payment"}
              </button>
            </form>
          )}
        </section>

        <section aria-labelledby="history-heading">
          <h3 id="history-heading" className="text-sm font-semibold text-slate-700">
            Payment history
          </h3>
          {student.payments.length === 0 ? (
            <p className="mt-2 text-sm text-slate-400">No payments yet.</p>
          ) : (
            <ul className="mt-2 divide-y divide-slate-100 rounded-2xl border border-slate-100">
              {student.payments.map((payment) => (
                <li
                  key={payment.id}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-700">
                      {payment.for}
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatDate(payment.date)} &middot;{" "}
                      {PAYMENT_METHOD_LABELS[payment.method]}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-bold tabular-nums text-emerald-600">
                    {formatNaira(payment.amount)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </Overlay>
  );
}
