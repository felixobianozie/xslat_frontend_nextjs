"use client";

import Link from "next/link";
import { JSX } from "react";

function BackLink() {
  return (
    <Link
      href="/admission"
      className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-white transition-colors"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
      >
        <polyline points="15 18 9 12 15 6" />
      </svg>
      Back to Admissions
    </Link>
  );
}

type ExamStatus = "conducted" | "pending" | "cancelled";
type ResultStatus = "available" | "processing" | "not-available";

interface ExamRow {
  date: string;
  venue: string;
  status: ExamStatus;
  result: ResultStatus;
}

/**
 * HOW TO UPDATE THIS PAGE:
 * - Add or edit rows in the `sessions` array below.
 * - Change `status` to "conducted", "pending", or "cancelled".
 * - Change `result` to "available", "processing", or "not-available".
 * - When results are available, the "Check Result" button will automatically
 *   link to /admission/entrance-examination/result/[session slug].
 */
const sessions: { session: string; rows: ExamRow[] }[] = [
  {
    session: "2026/2027",
    rows: [
      {
        date: "Sat. 26th July",
        venue: "School Premises",
        status: "pending",
        result: "not-available",
      },
      {
        date: "Sat. 9th Aug.",
        venue: "School Premises",
        status: "pending",
        result: "not-available",
      },
      {
        date: "Sat. 23rd Aug.",
        venue: "School Premises",
        status: "pending",
        result: "not-available",
      },
      {
        date: "Sat. 6th Sept.",
        venue: "School Premises",
        status: "pending",
        result: "not-available",
      },
      {
        date: "Sat. 27th Sept.",
        venue: "School Premises",
        status: "pending",
        result: "not-available",
      },
    ],
  },
  {
    session: "2025/2026",
    rows: [
      {
        date: "Sat. 26th July",
        venue: "School Premises",
        status: "conducted",
        result: "available",
      },
      {
        date: "Sat. 9th Aug.",
        venue: "School Premises",
        status: "conducted",
        result: "available",
      },
    ],
  },
  {
    session: "2024/2025",
    rows: [
      {
        date: "Sat. 27th July",
        venue: "School Premises",
        status: "conducted",
        result: "available",
      },
      {
        date: "Sat. 10th Aug.",
        venue: "School Premises",
        status: "conducted",
        result: "available",
      },
      {
        date: "Sat. 17th Aug.",
        venue: "School Premises",
        status: "conducted",
        result: "available",
      },
      {
        date: "Sat. 7th Sept.",
        venue: "School Premises",
        status: "conducted",
        result: "not-available",
      },
      {
        date: "Sat. 28th Sept.",
        venue: "School Premises",
        status: "cancelled",
        result: "not-available",
      },
    ],
  },
];

const statusIcon: Record<ExamStatus, JSX.Element> = {
  conducted: (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-emerald-500"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  pending: (
    <span className="flex gap-0.5 items-center">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-amber-400"
          style={{ opacity: 0.5 + i * 0.25 }}
        />
      ))}
    </span>
  ),
  cancelled: (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      className="text-rose-500"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
};

function ResultButton({
  result,
  href,
}: {
  result: ResultStatus;
  href?: string;
}) {
  if (result === "available") {
    return (
      <Link
        href={href ?? "#"}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors shadow-sm whitespace-nowrap"
      >
        Check Result
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </Link>
    );
  }
  if (result === "processing") {
    return (
      <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-100 border border-amber-200 text-amber-700 text-xs font-bold whitespace-nowrap">
        <svg
          className="animate-spin"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
        Processing
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-100 border border-slate-200 text-slate-400 text-xs font-semibold whitespace-nowrap cursor-default">
      Not Available
    </span>
  );
}

const legend = [
  { icon: statusIcon["conducted"], label: "Successfully conducted" },
  { icon: statusIcon["pending"], label: "Still in view / scheduled" },
  { icon: statusIcon["cancelled"], label: "Cancelled or postponed" },
];

export default function EntranceExaminationPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div
        className="relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #78350f 100%)",
        }}
      >
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-amber-400/10 -translate-y-1/3 translate-x-1/3 pointer-events-none" />
        <div className="relative container mx-auto px-6 lg:px-16 pt-8 pb-16">
          <div className="max-w-2xl">
            <h1
              className="text-5xl lg:text-6xl font-bold text-white leading-tight mb-4"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Entrance Examination
            </h1>
            <p className="text-indigo-300 text-lg leading-relaxed">
              All scheduled examination dates for the current and past sessions,
              including venue, status, and result availability.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 lg:px-16 py-16 max-w-4xl">
        <div className="my-4">
          <BackLink />
        </div>

        {/* Info callout */}
        <div className="bg-white border border-amber-100 rounded-3xl p-6 mb-12 flex gap-4 items-start shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-xl shrink-0">
            📅
          </div>
          <div>
            <h3
              className="font-bold text-indigo-900 text-sm mb-1"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Flexible Examination Dates
            </h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Our entrance examinations are scheduled with participants in mind.
              We keep them as flexible as possible, spread across different
              dates to suit your needs. Your examination date may fall on any of
              the listed dates based on when you submitted your admission form.
              This section is updated each time our schedules change.
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-14">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
            Legend
          </p>
          <div className="flex flex-wrap gap-x-8 gap-y-3">
            {legend.map(({ icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2.5 text-sm text-slate-600"
              >
                <span className="flex items-center">{icon}</span>
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Session tables */}
        {sessions.map(({ session, rows }, sessionIndex) => {
          // Convert "2024/2025" → "2024-2025" for use in the result URL slug
          const slug = session.replace("/", "-");

          return (
            <div key={session} className="mb-12">
              <div className="flex items-center gap-3 mb-5">
                <span className="inline-block text-xs font-bold uppercase tracking-[0.22em] text-amber-500">
                  {session} Entrance Examination Details
                </span>
                {/* Mark the first session as current */}
                {sessionIndex === 0 && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Current
                  </span>
                )}
              </div>

              {/* Table — desktop */}
              <div className="hidden sm:block bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                        Date
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                        Venue
                      </th>
                      <th className="text-center px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                        Status
                      </th>
                      <th className="text-center px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                        Results
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr
                        key={i}
                        className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="px-6 py-4 font-semibold text-indigo-900">
                          {row.date}
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {row.venue}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center">
                            {statusIcon[row.status]}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center">
                            <ResultButton
                              result={row.result}
                              href={`/admission/entrance-examination/result/${slug}`}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="sm:hidden space-y-3">
                {rows.map((row, i) => (
                  <div
                    key={i}
                    className="bg-white border border-slate-200 rounded-2xl p-4"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <p className="font-semibold text-indigo-900 text-sm">
                          {row.date}
                        </p>
                        <p className="text-slate-400 text-xs mt-0.5">
                          {row.venue}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {statusIcon[row.status]}
                      </div>
                    </div>
                    <ResultButton
                      result={row.result}
                      href={`/admission/entrance-examination/result/${slug}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* CBT teaser */}
        <div
          className="rounded-3xl overflow-hidden mb-10"
          style={{
            background:
              "linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4c1d95 100%)",
          }}
        >
          <div className="relative p-8 lg:p-10">
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
                backgroundSize: "24px 24px",
              }}
            />
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-2xl shrink-0">
                💻
              </div>
              <div className="flex-1">
                <h3
                  className="text-white font-bold text-lg mb-1"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  Online CBT Coming Soon
                </h3>
                <p className="text-indigo-300 text-sm leading-relaxed">
                  We are working hard to bring you a fully online Computer-Based
                  Testing option for entrance examinations, so you can sit from
                  anywhere without travelling to the school premises.
                </p>
              </div>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-400/20 border border-amber-400/30 text-amber-300 text-xs font-bold uppercase tracking-wider shrink-0">
                In Development
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <BackLink />
          <Link
            href="/admission/application-process"
            className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            View Application Process
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        </div>
      </div>
    </main>
  );
}
