import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────────────────

interface CalendarRow {
  week: string; // e.g. "One", or empty string to indicate a continuation row for the same week
  dates: string; // Date range e.g. "10th Sept. 2023"
  events: string; // Description of activities
}

interface CalendarTerm {
  termLabel: string; // e.g. "First Term 2023/2024"
  termId: string; // anchor slug e.g. "first-term-2023-2024"
  rows: CalendarRow[] | null; // null = "coming soon"
}

interface CalendarSession {
  session: string; // e.g. "2024/2025"
  terms: CalendarTerm[];
}

// ── Data ──────────────────────────────────────────────────────────────────────
// To add a new term's calendar: set rows to an array of CalendarRow objects.
// To mark a term as "coming soon": set rows to null.

const calendarData: CalendarSession[] = [
  {
    session: "2024/2025",
    terms: [
      {
        termLabel: "First Term 2024/2025",
        termId: "first-term-2024-2025",
        rows: null, // Coming soon
      },
    ],
  },
  {
    session: "2023/2024",
    terms: [
      {
        termLabel: "First Term 2023/2024",
        termId: "first-term-2023-2024",
        rows: [
          {
            week: "One",
            dates: "10th Sept. 2023",
            events: "Reception of Boarders",
          },
          {
            week: "",
            dates: "11th - 15th Sept. 2023",
            events: "Resumption of Academic Activities",
          },
          { week: "", dates: "17th Sept. 2023", events: "Opening Service" },
          {
            week: "Two",
            dates: "19th - 22nd Sept. 2023",
            events: "Academic & Club Activities",
          },
          {
            week: "",
            dates: "23rd Sept. 2023",
            events: "AKS Creation Day Celebration",
          },
          {
            week: "Three",
            dates: "25th - 29th Sept. 2023",
            events:
              "Academic Activities, Test 1, Afternoon Lessons, Club Activities",
          },
          {
            week: "",
            dates: "27th Sept. 2023",
            events: "Public Holiday (Ed El Maulud)",
          },
          {
            week: "Four",
            dates: "2nd Oct. 2023",
            events: "Nigeria Independence Day Public Holiday",
          },
          {
            week: "",
            dates: "2nd - 6th Oct. 2023",
            events: "Academic Activities, Afternoon Lessons",
          },
          { week: "", dates: "6th Oct. 2023", events: "Club Activities" },
          {
            week: "Five",
            dates: "9th - 13th Oct. 2023",
            events: "Academic Activities, Afternoon Lessons",
          },
          {
            week: "",
            dates: "13th Oct. 2023",
            events: "Club Activities, Test 2",
          },
          {
            week: "Six",
            dates: "16th - 20th Oct. 2023",
            events: "Academic Activities, Afternoon Lessons",
          },
          { week: "", dates: "20th Oct. 2023", events: "Club Activities" },
          {
            week: "Seven",
            dates: "23rd - 24th Oct. 2023",
            events: "Academic Activities, Afternoon Lessons",
          },
          {
            week: "",
            dates: "25th Oct. 2023",
            events: "PTA Meeting / Open Day by 9:00am",
          },
          {
            week: "",
            dates: "26th - 27th Oct. 2023",
            events: "Mid Term Break",
          },
          {
            week: "Eight",
            dates: "30th Oct. - 3rd Nov. 2023",
            events: "Academic Activities, Afternoon Lessons",
          },
          { week: "", dates: "3rd Nov. 2023", events: "Club Activities" },
          {
            week: "Nine",
            dates: "6th - 10th Nov. 2023",
            events: "Academic Activities, Test 3",
          },
          { week: "", dates: "10th Nov. 2023", events: "Club Activities" },
          {
            week: "Ten",
            dates: "13th - 17th Nov. 2023",
            events: "Academic Activities, Revision",
          },
          { week: "", dates: "10th Nov. 2023", events: "Club Activities" },
          {
            week: "Eleven",
            dates: "20th - 24th Nov. 2023",
            events: "First Term Examination",
          },
          {
            week: "Twelve",
            dates: "27th Nov. - 1st Dec. 2023",
            events: "First Term Examination, Result Computations",
          },
          {
            week: "Thirteen",
            dates: "4th Dec. - 8th Dec. 2023",
            events: "Result Computations",
          },
          {
            week: "Fourteen",
            dates: "11th - 14th Dec. 2023",
            events: "Result Computations, Result Authentication/Validation",
          },
          {
            week: "",
            dates: "15th Dec. 2023",
            events: "School Closing, Results Collection",
          },
        ],
      },
    ],
  },
];

// Build a flat list of all terms for the navigation tags
const allTerms: { termLabel: string; termId: string }[] = calendarData.flatMap(
  (s) => s.terms.map((t) => ({ termLabel: t.termLabel, termId: t.termId })),
);

// ── Back link ─────────────────────────────────────────────────────────────────

function BackLink() {
  return (
    <Link
      href="/notice"
      className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-600 transition-colors"
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
      Back to Notice Board
    </Link>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SchoolCalendarPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div
        className="relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #0f766e 0%, #0d9488 40%, #1e1b4b 100%)",
        }}
      >
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white/5 -translate-y-1/3 translate-x-1/3 pointer-events-none" />
        <div className="relative container mx-auto px-6 lg:px-16 pt-8 pb-16">
          <div className="max-w-2xl mt-8">
            <span className="inline-block text-xs font-bold uppercase tracking-[0.22em] text-amber-400 mb-3">
              Notice Board
            </span>
            <h1
              className="text-5xl lg:text-6xl font-bold text-white leading-tight mb-4"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              School Calendar
            </h1>
            <p className="text-teal-200 text-lg leading-relaxed">
              The week-by-week academic calendar for each term — examinations,
              PTA meetings, mid-term breaks, club days, and all scheduled school
              activities.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 lg:px-16 py-12 max-w-5xl">
        <div className="my-4">
          <BackLink />
        </div>

        {/* Term navigation tags — built from the data object */}
        <div className="mb-12">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-4">
            Jump to Term
          </p>
          <div className="flex flex-wrap gap-2">
            {allTerms.map((term) => (
              <a
                key={term.termId}
                href={`#${term.termId}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-teal-200 text-teal-700 text-xs font-semibold hover:bg-teal-600 hover:text-white hover:border-teal-600 transition-all duration-200 shadow-sm"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                {term.termLabel}
              </a>
            ))}
          </div>
        </div>

        {/* Calendar tables */}
        <div className="space-y-16">
          {calendarData.map((session) => (
            <div key={session.session}>
              {/* Session heading */}
              <div className="flex items-center gap-3 mb-8">
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-100 border border-teal-200 text-teal-700 text-xs font-bold uppercase tracking-wider">
                  {session.session} Academic Session
                </span>
              </div>

              <div className="space-y-12">
                {session.terms.map((term) => (
                  <section
                    key={term.termId}
                    id={term.termId}
                    className="scroll-mt-6"
                  >
                    {/* Term heading */}
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-teal-100 border border-teal-200 flex items-center justify-center text-teal-600 shrink-0">
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <rect
                            x="3"
                            y="4"
                            width="18"
                            height="18"
                            rx="2"
                            ry="2"
                          />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-teal-600 mb-0.5">
                          Calendar
                        </p>
                        <h2
                          className="text-xl font-bold text-indigo-950"
                          style={{
                            fontFamily: "'Playfair Display', Georgia, serif",
                          }}
                        >
                          {term.termLabel}
                        </h2>
                      </div>
                    </div>

                    {/* Coming soon placeholder */}
                    {term.rows === null ? (
                      <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center">
                        <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-2xl mx-auto mb-4">
                          ⏳
                        </div>
                        <p className="font-semibold text-indigo-900 text-sm mb-1">
                          Coming Soon
                        </p>
                        <p className="text-slate-400 text-xs">
                          The calendar for {term.termLabel} will be available
                          here once published.
                        </p>
                      </div>
                    ) : (
                      <>
                        {/* Desktop table */}
                        <div className="hidden sm:block bg-white border border-teal-200 rounded-2xl overflow-hidden shadow-sm">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-slate-100 bg-teal-50">
                                <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-teal-700 w-24">
                                  Week
                                </th>
                                <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-teal-700 w-52">
                                  Date(s)
                                </th>
                                <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-teal-700">
                                  Activities / Events
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {term.rows.map((row, idx) => (
                                <tr
                                  key={idx}
                                  className={`border-b border-slate-50 last:border-0 hover:bg-teal-50/30 transition-colors ${row.week ? "bg-white" : "bg-slate-50/40"}`}
                                >
                                  <td className="px-5 py-3.5">
                                    {row.week && (
                                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
                                        {row.week}
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-5 py-3.5 text-slate-600 text-xs font-medium">
                                    {row.dates}
                                  </td>
                                  <td className="px-5 py-3.5 text-slate-700 text-sm">
                                    {row.events}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Mobile cards */}
                        <div className="sm:hidden space-y-2">
                          {term.rows.map((row, idx) => (
                            <div
                              key={idx}
                              className="bg-white border border-slate-200 rounded-xl px-4 py-3"
                            >
                              <div className="flex items-start gap-3">
                                <div className="w-14 shrink-0">
                                  {row.week && (
                                    <span className="inline-block px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold">
                                      {row.week}
                                    </span>
                                  )}
                                </div>
                                <div className="flex-1">
                                  <p className="text-teal-700 text-xs font-semibold mb-0.5">
                                    {row.dates}
                                  </p>
                                  <p className="text-slate-600 text-sm">
                                    {row.events}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    <div className="mt-8 h-px bg-slate-200" />
                  </section>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mt-10">
          <BackLink />
          <Link
            href="/notice/events"
            className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            Events
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
