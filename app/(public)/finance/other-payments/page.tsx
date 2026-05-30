import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────────────────

interface OtherPayment {
  description: string;
  frequency: string; // e.g. "One time", "Termly"
  amount: number; // in Naira
  payTo: string; // e.g. "Principal's Office"
}

interface PaymentGroup {
  groupTitle: string; // e.g. "All Students"
  groupId: string; // used internally for table rendering
  payments: OtherPayment[];
}

interface Session {
  session: string; // e.g. "2024/2025"
  sessionId: string; // used for anchor links, e.g. "2024-2025"
  groups: PaymentGroup[];
}

// ── Other Payments Data ───────────────────────────────────────────────────────
// To add a new session, add a new object to the array below.
// Each session holds one or more groups (e.g. "All Students", "Boarding Only").

const paymentsData: Session[] = [
  {
    session: "2024/2025",
    sessionId: "2024-2025",
    groups: [
      {
        groupTitle: "All Students",
        groupId: "all-students",
        payments: [
          {
            description: "Result Booklet",
            frequency: "One time",
            amount: 1500,
            payTo: "Principal's Office",
          },
        ],
      },
      {
        groupTitle: "Boarding Students Only",
        groupId: "boarding-students",
        payments: [
          {
            description: "House Dues",
            frequency: "Termly",
            amount: 1000,
            payTo: "Boarding Officer",
          },
          {
            description: "Haircut Levy",
            frequency: "Termly",
            amount: 1000,
            payTo: "Boarding Officer",
          },
        ],
      },
    ],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatAmount(amount: number): string {
  return `₦${amount.toLocaleString("en-NG")}`;
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

export default function OtherPaymentsPage() {
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
              Levies
            </span>
            <h1
              className="text-5xl lg:text-6xl font-bold text-white leading-tight mb-4"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Other Payments
            </h1>
            <p className="text-teal-200 text-lg leading-relaxed">
              All other applicable payments and levies, organised by student
              category and session for easy reference.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 lg:px-16 py-12 max-w-4xl">
        <div className="my-4">
          <BackLink />
        </div>

        {/* Info callout */}
        <div className="bg-white border border-teal-100 rounded-2xl p-5 flex gap-4 items-start shadow-sm mb-8">
          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-xl shrink-0">
            📌
          </div>
          <div>
            <p className="font-bold text-indigo-900 text-sm mb-1">
              Payment Instructions
            </p>
            <p className="text-slate-500 text-sm leading-relaxed">
              Pay each levy to the specific office listed in the{" "}
              <strong>Pay To</strong> column. These payments are separate from
              tuition fees and must be made directly to the designated officer
              or office, not to the school bank account.
            </p>
          </div>
        </div>

        {/* ── Navigation Tags — one tag per session only ── */}
        <div className="mb-12">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-4">
            Jump to
          </p>
          <div className="flex flex-wrap gap-2">
            {paymentsData.map((session) => (
              <a
                key={session.sessionId}
                href={`#${session.sessionId}`}
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
                {session.session} Academic Session
              </a>
            ))}
          </div>
        </div>

        {/* ── Payment Tables — loop sessions, then groups inside each ── */}
        <div className="space-y-16">
          {paymentsData.map((session) => (
            // Each session gets an anchor so the nav tags above can jump to it
            <section
              key={session.sessionId}
              id={session.sessionId}
              className="scroll-mt-6"
            >
              {/* Session heading */}
              <div className="flex items-center gap-3 mb-8">
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-100 border border-teal-200 text-teal-700 text-xs font-bold uppercase tracking-wider">
                  {session.session} Academic Session
                </span>
              </div>

              {/* Groups within this session */}
              <div className="space-y-10">
                {session.groups.map((group) => {
                  const isBoarding = group.groupId === "boarding-students";
                  const accentDot = isBoarding
                    ? "bg-violet-500"
                    : "bg-teal-500";
                  const headerBg = isBoarding ? "bg-violet-50" : "bg-teal-50";
                  const borderColor = isBoarding
                    ? "border-violet-200"
                    : "border-teal-200";

                  return (
                    <div key={group.groupId}>
                      {/* Group heading */}
                      <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 rounded-xl bg-teal-100 border border-teal-200 flex items-center justify-center text-teal-600 shrink-0">
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            {/* Extra icon paths for boarding group */}
                            {isBoarding && (
                              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                            )}
                            {isBoarding && (
                              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            )}
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-widest text-teal-600 mb-0.5">
                            Payment Group
                          </p>
                          <h2
                            className="text-xl font-bold text-indigo-950"
                            style={{
                              fontFamily: "'Playfair Display', Georgia, serif",
                            }}
                          >
                            {group.groupTitle}
                          </h2>
                        </div>
                      </div>

                      {/* Desktop table */}
                      <div
                        className={`hidden sm:block bg-white border ${borderColor} rounded-2xl overflow-hidden shadow-sm`}
                      >
                        {/* Coloured category banner */}
                        <div
                          className={`px-5 py-3 border-b ${borderColor} ${headerBg} flex items-center gap-2`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${accentDot}`}
                          />
                          <span className="text-xs font-bold text-indigo-800 uppercase tracking-wider">
                            {group.groupTitle}
                          </span>
                        </div>
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-100 bg-slate-50">
                              <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                                Description
                              </th>
                              <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                                Frequency
                              </th>
                              <th className="text-right px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                                Amount
                              </th>
                              <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                                Pay To
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {group.payments.map((payment, idx) => (
                              <tr
                                key={payment.description}
                                className={`border-b border-slate-50 last:border-0 ${idx % 2 !== 0 ? "bg-slate-50/40" : ""} hover:bg-teal-50/40 transition-colors`}
                              >
                                <td className="px-5 py-4 font-semibold text-indigo-900">
                                  {payment.description}
                                </td>
                                <td className="px-5 py-4">
                                  <span
                                    className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${
                                      payment.frequency === "One time"
                                        ? "bg-blue-50 border-blue-200 text-blue-700"
                                        : "bg-amber-50 border-amber-200 text-amber-700"
                                    }`}
                                  >
                                    {payment.frequency}
                                  </span>
                                </td>
                                <td className="px-5 py-4 text-right font-semibold text-emerald-700 font-mono">
                                  {formatAmount(payment.amount)}
                                </td>
                                <td className="px-5 py-4 text-slate-500 text-xs">
                                  {payment.payTo}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile cards */}
                      <div
                        className={`sm:hidden bg-white border ${borderColor} rounded-2xl overflow-hidden shadow-sm`}
                      >
                        <div
                          className={`px-5 py-3 border-b ${borderColor} ${headerBg} flex items-center gap-2`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${accentDot}`}
                          />
                          <span className="text-xs font-bold text-indigo-800 uppercase tracking-wider">
                            {group.groupTitle}
                          </span>
                        </div>
                        <div className="divide-y divide-slate-100">
                          {group.payments.map((payment) => (
                            <div key={payment.description} className="p-4">
                              <div className="flex items-start justify-between gap-3 mb-2">
                                <p className="font-semibold text-indigo-900 text-sm">
                                  {payment.description}
                                </p>
                                <p className="font-semibold text-emerald-700 font-mono text-sm shrink-0">
                                  {formatAmount(payment.amount)}
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                <span
                                  className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${
                                    payment.frequency === "One time"
                                      ? "bg-blue-50 border-blue-200 text-blue-700"
                                      : "bg-amber-50 border-amber-200 text-amber-700"
                                  }`}
                                >
                                  {payment.frequency}
                                </span>
                                <span className="text-slate-400 text-xs">
                                  → {payment.payTo}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Divider between sessions */}
              <div className="mt-10 h-px bg-slate-200" />
            </section>
          ))}
        </div>

        {/* CTA */}
        <div
          className="mt-14 rounded-3xl overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, #0f766e 0%, #0d9488 40%, #1e1b4b 100%)",
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
                Questions?
              </p>
              <h3
                className="text-2xl font-bold text-white mb-3"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                Need More Information?
              </h3>
              <p className="text-teal-200 text-sm mb-6 max-w-sm mx-auto">
                Contact the school bursary or boarding office for further
                clarification on any levy or payment.
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-linear-to-r from-amber-500 to-amber-400 text-indigo-950 font-bold text-sm shadow-lg shadow-amber-900/30 hover:scale-105 transition-all duration-200"
              >
                Contact the School
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
        </div>

        <div className="flex items-center justify-between mt-10">
          <BackLink />
          <Link
            href="/finance/school-fees"
            className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            View School Fees
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
