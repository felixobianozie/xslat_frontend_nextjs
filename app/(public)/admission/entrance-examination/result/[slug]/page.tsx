/**
 * app/admission/entrance-examination/result/[slug]/page.tsx
 *
 * Displays entrance examination results for a given academic session.
 * The [slug] maps to a file in /contents/results/ e.g.:
 *   slug "2024-2025"  →  contents/results/2024-2025.tsx
 *   slug "2026-2027"  →  contents/results/2026-2027.tsx
 *
 * HOW TO ADD A NEW SESSION:
 * 1. Create a new file at contents/results/YYYY-YYYY.tsx
 *    (copy an existing one as a template)
 * 2. Add the new slug to the `slugs` array in generateStaticParams() below.
 * 3. Import the new data file in the getResultData() function below.
 * That's it — the page handles everything else automatically.
 */

import Link from "next/link";
import { notFound } from "next/navigation";

// ── Import result data files ──────────────────────────────────────────────────
// When you add a new session file, add its import here.
import data2024_2025 from "@/contents/results/2024-2025";
import data2025_2026 from "@/contents/results/2025-2026";
import data2026_2027 from "@/contents/results/2026-2027";

import type { ResultData } from "@/contents/results/2024-2025";

// ── Map slugs to their data ───────────────────────────────────────────────────
// When you add a new session, add an entry here too.
function getResultData(slug: string): ResultData | null {
  const map: Record<string, ResultData> = {
    "2024-2025": data2024_2025,
    "2025-2026": data2025_2026,
    "2026-2027": data2026_2027,
  };
  return map[slug] ?? null;
}

// ── Static params for build-time generation ───────────────────────────────────
// Add a new slug string here whenever you create a new session file.
export async function generateStaticParams() {
  return [{ slug: "2024-2025" }, { slug: "2025-2026" }, { slug: "2026-2027" }];
}

// ── Page metadata ─────────────────────────────────────────────────────────────
// params is a Promise in Next.js 15 — must be awaited before accessing properties
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = getResultData(slug);
  if (!data) return { title: "Results Not Found" };
  return {
    title: `Entrance Exam Results ${data.session} | Lutheran High School`,
    description: `List of successful candidates in the ${data.session} entrance examination.`,
  };
}

// ── Remarks badge colour helper ───────────────────────────────────────────────
function RemarksBadge({ text }: { text: string }) {
  if (!text) return <span className="text-slate-400 text-xs">—</span>;

  let style = "bg-slate-100 text-slate-600 border-slate-200";
  if (
    text.toLowerCase().includes("admitted") &&
    text.toLowerCase().includes("boarder")
  ) {
    style = "bg-violet-100 text-violet-700 border-violet-200";
  } else if (text.toLowerCase().includes("admitted")) {
    style = "bg-emerald-100 text-emerald-700 border-emerald-200";
  } else if (text.toLowerCase().includes("reserve")) {
    style = "bg-amber-100 text-amber-700 border-amber-200";
  }

  return (
    <span
      className={`inline-block px-2.5 py-0.5 rounded-full border text-xs font-semibold ${style}`}
    >
      {text}
    </span>
  );
}

// ── Back link ─────────────────────────────────────────────────────────────────
function BackLink() {
  return (
    <Link
      href="/admission/entrance-examination"
      className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-500 transition-colors"
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
      Back to Entrance Examination
    </Link>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
// params is a Promise in Next.js 15 — must be awaited before accessing properties
export default async function ResultPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = getResultData(slug);

  // Show 404 if the slug doesn't match any known session
  if (!data) notFound();

  // Format slug back to a session display string e.g. "2024-2025" → "2024/2025"
  const sessionDisplay = slug.replace("-", "/");

  // Check if there are any results published yet
  const hasResults =
    data.examDates.length > 0 &&
    data.examDates.some((d) => d.classes.length > 0);

  return (
    <main className="min-h-screen bg-slate-50">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #1e1b4b 0%, #312e81 55%, #4c1d95 100%)",
        }}
      >
        {/* Dot grid background */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-amber-400/10 -translate-y-1/3 translate-x-1/3 pointer-events-none" />

        <div className="relative container mx-auto px-6 lg:px-16 pt-8 pb-14">
          <div className="max-w-3xl">
            <h1
              className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-3"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Entrance Examination Results
            </h1>
            {/* Session badge */}
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 text-amber-300 text-xs font-bold uppercase tracking-widest mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              {sessionDisplay} Academic Session
            </span>
            <p className="text-indigo-300 text-base leading-relaxed">
              Lutheran High School, Obot Idim Session
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 lg:px-16 py-12 max-w-4xl">
        <div className="my-4">
          <BackLink />
        </div>
        {/* ── Notice Board ─────────────────────────────────────────────────── */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-10">
          <div className="flex gap-4 items-start">
            <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-xl shrink-0">
              📌
            </div>
            <div>
              <h3
                className="font-bold text-amber-900 text-base mb-2"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                Important Notice
              </h3>
              <div className="text-amber-800 text-sm leading-relaxed space-y-1.5">
                <p>
                  <strong>NB:</strong> Any candidate whose name is not published
                  on the list below for the named exam date was unsuccessful and
                  as such <strong>SHOULD NOT proceed</strong> with the next
                  steps listed afterwards.
                </p>
                <p>
                  Examination scores for the candidates listed are available at
                  the <strong>Principal&apos;s Office</strong> for interested
                  parents and guardians.
                </p>
                <p>
                  For other findings or enquiries,{" "}
                  <Link
                    href="/contact"
                    className="underline font-semibold hover:text-amber-900 transition-colors"
                  >
                    click here to contact us
                  </Link>
                  .
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Results section ───────────────────────────────────────────────── */}
        {!hasResults ? (
          // Empty state — no results published yet
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-14 text-center mb-10">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-3xl mx-auto mb-5">
              ⏳
            </div>
            <h2
              className="text-2xl font-bold text-indigo-950 mb-2"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Results Not Yet Published
            </h2>
            <p className="text-slate-500 text-sm leading-relaxed max-w-md mx-auto">
              Results for the <strong>{sessionDisplay}</strong> session have not
              been published yet. Please check back after your examination date,
              or contact the school for more information.
            </p>
          </div>
        ) : (
          <>
            {/* ── Date Navigation Tags ─────────────────────────────────────── */}
            {/* Quick-jump buttons — one per exam date */}
            <div className="mb-10">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-4">
                Jump to Examination Date
              </p>
              <div className="flex flex-wrap gap-2">
                {data.examDates.map((examDate) => (
                  <a
                    key={examDate.id}
                    href={`#${examDate.id}`}
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
                    {examDate.label}
                  </a>
                ))}
              </div>
            </div>

            {/* ── Heading ──────────────────────────────────────────────────── */}
            <div className="flex items-center gap-3 mb-8">
              <div className="h-px flex-1 bg-indigo-200" />
              <h2
                className="text-xl font-bold text-indigo-950 px-2"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                List of Successful Candidates
              </h2>
              <div className="h-px flex-1 bg-indigo-200" />
            </div>

            {/* ── Results by Exam Date ──────────────────────────────────────── */}
            <div className="space-y-14">
              {data.examDates.map((examDate) => (
                // Each section is anchor-linked from the navigation tags above
                <section
                  key={examDate.id}
                  id={examDate.id}
                  className="scroll-mt-6"
                >
                  {/* Exam date header */}
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
                        Examination Date
                      </p>
                      <h3
                        className="text-xl font-bold text-indigo-950"
                        style={{
                          fontFamily: "'Playfair Display', Georgia, serif",
                        }}
                      >
                        {examDate.label}
                      </h3>
                    </div>
                  </div>

                  {/* Classes under this exam date */}
                  <div className="space-y-8">
                    {examDate.classes.map((cls) => (
                      <div key={cls.className}>
                        {/* Class label */}
                        <div className="flex items-center gap-3 mb-3">
                          <span className="inline-block px-3 py-1 rounded-full bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider">
                            {cls.className}
                          </span>
                          <span className="text-slate-400 text-xs">
                            {cls.candidates.length} successful candidate
                            {cls.candidates.length !== 1 ? "s" : ""}
                          </span>
                        </div>

                        {/* Desktop table */}
                        <div className="hidden sm:block bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-400 w-14">
                                  S/N
                                </th>
                                <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                                  Full Name
                                </th>
                                <th className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                                  Remarks
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {cls.candidates.map((c, idx) => (
                                <tr
                                  key={c.name}
                                  className="border-b border-slate-50 last:border-0 hover:bg-indigo-50/40 transition-colors"
                                >
                                  <td className="px-5 py-3.5 text-slate-400 font-mono text-xs">
                                    {String(idx + 1).padStart(2, "0")}
                                  </td>
                                  <td className="px-5 py-3.5 font-semibold text-indigo-950">
                                    {c.name}
                                  </td>
                                  <td className="px-5 py-3.5">
                                    <RemarksBadge text={c.remarks} />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Mobile cards */}
                        <div className="sm:hidden space-y-2">
                          {cls.candidates.map((c, idx) => (
                            <div
                              key={c.name}
                              className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-center justify-between gap-3"
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-slate-400 font-mono text-xs w-5 shrink-0">
                                  {String(idx + 1).padStart(2, "0")}
                                </span>
                                <span className="font-semibold text-indigo-950 text-sm">
                                  {c.name}
                                </span>
                              </div>
                              <RemarksBadge text={c.remarks} />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Divider between exam dates */}
                  <div className="mt-10 h-px bg-slate-200" />
                </section>
              ))}
            </div>
          </>
        )}

        {/* ── Next Steps ───────────────────────────────────────────────────── */}
        <div
          className="mt-14 rounded-3xl overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4c1d95 100%)",
          }}
        >
          <div className="relative p-8 lg:p-10">
            {/* Dot grid */}
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
                backgroundSize: "24px 24px",
              }}
            />
            <div className="relative">
              <span className="inline-block text-xs font-bold uppercase tracking-[0.22em] text-amber-400 mb-3">
                Next Steps
              </span>
              <h3
                className="text-2xl font-bold text-white mb-3"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                For Successful Candidates
              </h3>
              <p className="text-indigo-300 text-sm leading-relaxed mb-6 max-w-lg">
                If your name appears on the list above, congratulations! Please
                proceed with the steps outlined in our Application Process guide
                — specifically the steps after admission is offered.
              </p>
              <Link
                href="/admission/application-process"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-linear-to-r from-amber-500 to-amber-400 text-indigo-950 font-bold text-sm shadow-lg shadow-amber-900/30 hover:scale-105 transition-all duration-200"
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
        </div>

        {/* ── Bottom nav ───────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mt-10">
          <BackLink />
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            Contact School
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
