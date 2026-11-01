// ─────────────────────────────────────────
// app/dashboard/fees/arm/components/Armsummary.tsx
//
// The top of a class's fees page: a header with the class's collection, how
// many students have cleared their fees, how much of each kind of fee has been
// collected, and the class's fee schedule.
// ─────────────────────────────────────────

import ProgressBar, { rateTone } from "../../components/Progressbar";
import ProgressRing from "../../components/Progressring";
import DebtDonut from "../../components/Debtdonut";
import SampleDataBadge from "../../components/Sampledatabadge";
import {
  armTotals,
  feeBreakdown,
  formatNaira,
  formatNairaCompact,
  percent,
} from "../../fees";

const CARD = "rounded-2xl border border-slate-100 bg-white p-5 shadow-sm";

// An amount that is shortened on a phone and written in full from `sm` up.
function Amount({ value }: { value: number }) {
  return (
    <>
      <span className="sm:hidden" title={formatNaira(value)}>
        {formatNairaCompact(value)}
      </span>
      <span className="hidden sm:inline">{formatNaira(value)}</span>
    </>
  );
}

export default function ArmSummary({ detail }: { detail: ArmFeesDetail }) {
  const totals = armTotals(detail.students);
  const breakdown = feeBreakdown(detail.students);
  const boarders = detail.students.filter((student) => student.boarder).length;
  const dayStudents = detail.students.length - boarders;

  return (
    <>
      <section
        aria-label="Class collection summary"
        className="relative overflow-hidden rounded-3xl bg-linear-to-br from-indigo-950 via-indigo-900 to-violet-800 p-5 text-white shadow-lg sm:p-7"
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-amber-400/10" />

        <div className="relative flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-indigo-200">
              {detail.term.name} &middot; {detail.term.session}
            </p>
            <h1 className="mt-1 text-3xl font-bold leading-tight sm:text-4xl">
              {detail.arm.name}
            </h1>
            <p className="mt-1 text-sm text-indigo-200">
              {`${detail.students.length} students \u00B7 ${boarders} boarding \u00B7 ${dayStudents} day`}
            </p>
            <div className="mt-3">
              <SampleDataBadge />
            </div>
          </div>

          <ProgressRing
            value={totals.rate}
            size={96}
            strokeWidth={9}
            label={`${totals.rate}% collected`}
          >
            <span className="text-xl font-bold leading-none">{totals.rate}%</span>
            <span className="mt-1 text-[9px] uppercase tracking-wide text-indigo-200">
              collected
            </span>
          </ProgressRing>
        </div>

        <dl className="relative mt-5 grid grid-cols-3 gap-2 sm:gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
            <dt className="text-[10px] uppercase tracking-wide text-indigo-200">
              Collectible
            </dt>
            <dd className="mt-1 text-sm font-bold sm:text-lg">
              <Amount value={totals.expected} />
            </dd>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
            <dt className="text-[10px] uppercase tracking-wide text-indigo-200">
              Received
            </dt>
            <dd className="mt-1 text-sm font-bold text-emerald-300 sm:text-lg">
              <Amount value={totals.collected} />
            </dd>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
            <dt className="text-[10px] uppercase tracking-wide text-indigo-200">
              Remaining
            </dt>
            <dd className="mt-1 text-sm font-bold text-amber-300 sm:text-lg">
              <Amount value={totals.outstanding} />
            </dd>
          </div>
        </dl>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className={CARD} aria-labelledby="status-heading">
          <h2 id="status-heading" className="text-sm font-semibold text-slate-700">
            Payment status
          </h2>
          <div className="mt-4 flex items-center gap-5">
            <DebtDonut cleared={totals.cleared} indebted={totals.indebted} />
            <dl className="min-w-0 flex-1 space-y-3 text-sm">
              <div>
                <dt className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" aria-hidden="true" />
                  Cleared
                </dt>
                <dd className="font-bold text-slate-800">
                  {totals.cleared}{" "}
                  <span className="text-xs font-medium text-slate-400">
                    ({percent(totals.cleared, totals.students)}%)
                  </span>
                </dd>
              </div>
              <div>
                <dt className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-400" aria-hidden="true" />
                  Still owing
                </dt>
                <dd className="font-bold text-slate-800">
                  {totals.indebted}{" "}
                  <span className="text-xs font-medium text-slate-400">
                    ({percent(totals.indebted, totals.students)}%)
                  </span>
                </dd>
              </div>
            </dl>
          </div>
        </section>

        <section className={CARD} aria-labelledby="breakdown-heading">
          <h2 id="breakdown-heading" className="text-sm font-semibold text-slate-700">
            Collected by fee type
          </h2>
          <ul className="mt-4 space-y-4">
            {breakdown.map((line) => {
              const rate = percent(line.paid, line.due);
              return (
                <li key={line.key}>
                  <div className="flex items-baseline justify-between gap-2 text-xs">
                    <span className="font-semibold text-slate-700">{line.label}</span>
                    <span className="truncate text-slate-400">
                      {formatNairaCompact(line.paid)} of {formatNairaCompact(line.due)}
                    </span>
                  </div>
                  <ProgressBar
                    value={rate}
                    tone={rateTone(rate)}
                    label={`${line.label} collected`}
                    className="mt-1.5"
                  />
                </li>
              );
            })}
          </ul>
        </section>

        <section className={CARD} aria-labelledby="schedule-heading">
          <h2 id="schedule-heading" className="text-sm font-semibold text-slate-700">
            Fee schedule
          </h2>
          <ul className="mt-2 divide-y divide-slate-100">
            {detail.schedule.map((line) => (
              <li
                key={line.category}
                className="flex items-center justify-between gap-3 py-3 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-medium text-slate-700">{line.label}</p>
                  {line.boardersOnly && (
                    <p className="text-[11px] text-slate-400">Boarders only</p>
                  )}
                </div>
                <p className="font-bold tabular-nums text-slate-800">
                  {formatNaira(line.amount)}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
