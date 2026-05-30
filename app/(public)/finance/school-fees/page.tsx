import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ClassFee {
  className: string; // e.g. "JSS1"
  amount: number; // in Naira
  remarks: string;
}

interface StudentCategory {
  category: "Day Students" | "Boarding Students";
  fees: ClassFee[];
}

interface Term {
  term: string; // e.g. "First Term"
  termId: string; // used for anchor links, e.g. "first-term"
  categories: StudentCategory[];
}

interface Session {
  session: string; // e.g. "2024/2025"
  sessionId: string; // used for anchor links, e.g. "2024-2025"
  terms: Term[];
}

// ── Fees Data ─────────────────────────────────────────────────────────────────
// To add a new session or term, follow the same pattern below.

const feesData: Session[] = [
  {
    session: "2024/2025",
    sessionId: "2024-2025",
    terms: [
      {
        term: "First Term",
        termId: "first-term",
        categories: [
          {
            category: "Day Students",
            fees: [
              { className: "JSS1", amount: 35000, remarks: "—" },
              { className: "JSS2", amount: 35000, remarks: "—" },
              { className: "JSS3", amount: 35000, remarks: "—" },
              { className: "SS1", amount: 35000, remarks: "—" },
              { className: "SS2", amount: 35000, remarks: "—" },
              { className: "SS3", amount: 35000, remarks: "—" },
            ],
          },
          {
            category: "Boarding Students",
            fees: [
              { className: "JSS1", amount: 155000, remarks: "—" },
              { className: "JSS2", amount: 155000, remarks: "—" },
              { className: "JSS3", amount: 155000, remarks: "—" },
              { className: "SS1", amount: 155000, remarks: "—" },
              { className: "SS2", amount: 155000, remarks: "—" },
              { className: "SS3", amount: 155000, remarks: "—" },
            ],
          },
        ],
      },
      {
        term: "Second Term",
        termId: "second-term",
        categories: [
          {
            category: "Day Students",
            fees: [
              { className: "JSS1", amount: 35000, remarks: "—" },
              { className: "JSS2", amount: 35000, remarks: "—" },
              { className: "JSS3", amount: 35000, remarks: "—" },
              { className: "SS1", amount: 35000, remarks: "—" },
              { className: "SS2", amount: 35000, remarks: "—" },
              { className: "SS3", amount: 35000, remarks: "—" },
            ],
          },
          {
            category: "Boarding Students",
            fees: [
              { className: "JSS1", amount: 155000, remarks: "—" },
              { className: "JSS2", amount: 155000, remarks: "—" },
              { className: "JSS3", amount: 155000, remarks: "—" },
              { className: "SS1", amount: 155000, remarks: "—" },
              { className: "SS2", amount: 155000, remarks: "—" },
              { className: "SS3", amount: 155000, remarks: "—" },
            ],
          },
        ],
      },
    ],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

// Format a number as Nigerian Naira with commas e.g. 155000 → ₦155,000
function formatAmount(amount: number): string {
  return `₦${amount.toLocaleString("en-NG")}`;
}

// Build an anchor ID from session + term, e.g. "2024-2025-second-term"
function anchorId(sessionId: string, termId: string): string {
  return `${sessionId}-${termId}`;
}

// ── Back link ─────────────────────────────────────────────────────────────────

function BackLink() {
  return (
    <Link
      href="/finance"
      className="inline-flex items-center gap-2 text-sm text-indigo-300 hover:text-indigo-500 transition-colors"
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
      Back to Finance
    </Link>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SchoolFeesPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div
        className="relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #1e1b4b 0%, #312e81 55%, #4c1d95 100%)",
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
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-amber-400/10 -translate-y-1/3 translate-x-1/3 pointer-events-none" />

        <div className="relative container mx-auto px-6 lg:px-16 pt-8 pb-16">
          <div className="max-w-2xl mt-8">
            <span className="inline-block text-xs font-bold uppercase tracking-[0.22em] text-amber-400 mb-3">
              Tuition
            </span>
            <h1
              className="text-5xl lg:text-6xl font-bold text-white leading-tight mb-4"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              School Fees
            </h1>
            <p className="text-indigo-300 text-lg leading-relaxed">
              Tuition fee breakdown by session, term, and class level for day
              students and boarding students.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 lg:px-16 py-12 max-w-5xl">
        <div className="my-4">
          <BackLink />
        </div>

        {/* Official account notice */}
        <div className="bg-white border border-amber-200 rounded-2xl p-5 flex gap-4 items-start shadow-sm mb-8">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-xl shrink-0">
            🏦
          </div>
          <div>
            <p className="font-bold text-amber-900 text-sm mb-1">
              Official School Bank Accounts
            </p>
            <p className="text-amber-800 text-sm leading-relaxed mb-3">
              All school fees payments <strong>MUST</strong> be made to any of
              the accounts below. Visit the school with evidence of payment for
              collection of your official school receipt.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-3">
                <p className="text-xs font-bold text-orange-600 mb-1">GTBank</p>
                <p className="font-mono font-bold text-slate-800">0107355105</p>
                <p className="text-slate-500 text-xs">
                  Lutheran High School, Obot Idim
                </p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                <p className="text-xs font-bold text-blue-600 mb-1">
                  Zenith Bank
                </p>
                <p className="font-mono font-bold text-slate-800">1011112061</p>
                <p className="text-slate-500 text-xs">
                  Lutheran High School, Obot Idim
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Navigation Tags ── */}
        {/* Quick-jump buttons built from the fees data, one per session+term */}
        <div className="mb-12">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-4">
            Jump to
          </p>
          <div className="flex flex-wrap gap-2">
            {feesData.map((session) =>
              session.terms.map((term) => (
                <a
                  key={anchorId(session.sessionId, term.termId)}
                  href={`#${anchorId(session.sessionId, term.termId)}`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-indigo-200 text-indigo-700 text-xs font-semibold hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all duration-200 shadow-sm"
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
                  {session.session} ({term.term})
                </a>
              )),
            )}
          </div>
        </div>

        {/* ── Legend ── */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-12 flex flex-wrap gap-x-8 gap-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 w-full mb-1">
            Legend
          </p>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <div className="w-3 h-3 rounded-full bg-violet-400" />
            Boarding Students
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <div className="w-3 h-3 rounded-full bg-indigo-400" />
            Day Students
          </div>
        </div>

        {/* ── Fee Tables ── */}
        {/* Loop over each session, then each term, then each student category */}
        <div className="space-y-16">
          {feesData.map((session) => (
            <div key={session.sessionId}>
              {/* Session heading */}
              <div className="flex items-center gap-3 mb-8">
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-bold uppercase tracking-wider">
                  {session.session} Academic Session
                </span>
              </div>

              <div className="space-y-12">
                {session.terms.map((term) => (
                  // Each term section is anchor-linked from the navigation tags
                  <section
                    key={anchorId(session.sessionId, term.termId)}
                    id={anchorId(session.sessionId, term.termId)}
                    className="scroll-mt-6"
                  >
                    {/* Term heading */}
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0">
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
                        <p className="text-xs font-bold uppercase tracking-widest text-violet-600 mb-0.5">
                          Fee Breakdown
                        </p>
                        <h2
                          className="text-xl font-bold text-indigo-950"
                          style={{
                            fontFamily: "'Playfair Display', Georgia, serif",
                          }}
                        >
                          {term.term}: {session.session} Session
                        </h2>
                      </div>
                    </div>

                    {/* Category tables side by side on large screens */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {term.categories.map((cat) => {
                        const isBoarding = cat.category === "Boarding Students";
                        const accentColor = isBoarding
                          ? "bg-violet-700"
                          : "bg-indigo-700";
                        const headerBg = isBoarding
                          ? "bg-violet-50"
                          : "bg-indigo-50";
                        const borderColor = isBoarding
                          ? "border-violet-200"
                          : "border-indigo-200";

                        return (
                          <div
                            key={cat.category}
                            className={`bg-white border ${borderColor} rounded-2xl overflow-hidden shadow-sm`}
                          >
                            {/* Category header */}
                            <div
                              className={`px-5 py-4 border-b ${borderColor} ${headerBg} flex items-center gap-3`}
                            >
                              <span
                                className={`w-2.5 h-2.5 rounded-full ${accentColor} shrink-0`}
                              />
                              <h3
                                className="font-bold text-indigo-950 text-sm"
                                style={{
                                  fontFamily:
                                    "'Playfair Display', Georgia, serif",
                                }}
                              >
                                {cat.category}
                              </h3>
                              <span className="ml-auto text-xs text-slate-400 font-medium">
                                Per Term
                              </span>
                            </div>

                            {/* Desktop table */}
                            <div className="hidden sm:block">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b border-slate-100 bg-slate-50">
                                    <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                                      Class
                                    </th>
                                    <th className="text-right px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                                      Amount
                                    </th>
                                    <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                                      Remarks
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {cat.fees.map((fee, idx) => (
                                    <tr
                                      key={fee.className}
                                      className={`border-b border-slate-50 last:border-0 ${idx % 2 === 0 ? "" : "bg-slate-50/40"} hover:bg-indigo-50/40 transition-colors`}
                                    >
                                      <td className="px-5 py-3.5 font-bold text-indigo-800">
                                        {fee.className}
                                      </td>
                                      <td className="px-5 py-3.5 text-right font-semibold text-emerald-700 font-mono">
                                        {formatAmount(fee.amount)}
                                      </td>
                                      <td className="px-5 py-3.5 text-slate-400 text-xs">
                                        {fee.remarks}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            {/* Mobile cards */}
                            <div className="sm:hidden divide-y divide-slate-100">
                              {cat.fees.map((fee) => (
                                <div
                                  key={fee.className}
                                  className="flex items-center justify-between px-5 py-3.5"
                                >
                                  <span className="font-bold text-indigo-800 text-sm">
                                    {fee.className}
                                  </span>
                                  <span className="font-semibold text-emerald-700 font-mono text-sm">
                                    {formatAmount(fee.amount)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Divider between terms */}
                    <div className="mt-10 h-px bg-slate-200" />
                  </section>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div
          className="mt-14 rounded-3xl overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4c1d95 100%)",
          }}
        >
          <div className="relative p-8 lg:p-10 text-center">
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
                backgroundSize: "24px 24px",
              }}
            />
            <div className="relative">
              <p className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-3">
                Pay Now
              </p>
              <h3
                className="text-2xl font-bold text-white mb-3"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                Ready to Make a Payment?
              </h3>
              <p className="text-indigo-300 text-sm mb-6 max-w-sm mx-auto">
                Pay to our official school accounts and visit the school with
                evidence of payment to collect your receipt.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/coming-soon"
                  className="px-8 py-3.5 rounded-full bg-linear-to-r from-amber-500 to-amber-400 text-indigo-950 font-bold text-sm shadow-lg shadow-amber-900/30 hover:scale-105 transition-all duration-200"
                >
                  Pay Online
                </Link>
                <Link
                  href="/contact"
                  className="px-8 py-3.5 rounded-full border border-indigo-500/50 text-indigo-200 font-semibold text-sm hover:bg-indigo-800/40 transition-all duration-200"
                >
                  Contact Bursary
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-10">
          <BackLink />
          <Link
            href="/finance/other-payments"
            className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            Next: Other Payments
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
