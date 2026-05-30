/**
 * app/admission/forms/page.tsx
 *
 * Admission Forms landing page — presents Online and Physical form options.
 * Links to the multi-step online form at /admission/fill-admission-form.
 */

import Link from "next/link";

// ── Back link shared component ────────────────────────────────────────────────
function BackLink() {
  return (
    <Link
      href="/admission"
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
      Back to Admissions
    </Link>
  );
}

// ── Bank account details (reused in both sections) ────────────────────────────
const bankAccounts = [
  {
    bank: "GTBank",
    account: "0107355105",
    name: "Lutheran High School, Obot Idim",
    color: "bg-orange-50 border-orange-200",
    label: "text-orange-600",
  },
  {
    bank: "Zenith Bank",
    account: "1011112061",
    name: "Lutheran High School, Obot Idim",
    color: "bg-blue-50 border-blue-200",
    label: "text-blue-600",
  },
];

export default function AdmissionFormsPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      {/* ── Hero ── */}
      <div
        className="relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #1e1b4b 0%, #312e81 55%, #4c1d95 100%)",
        }}
      >
        {/* Decorative dot grid */}
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
          <div className="max-w-2xl">
            {/* Section tag */}
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 text-amber-300 text-xs font-bold uppercase tracking-widest mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              2026 / 2027 Session
            </span>

            <h1
              className="text-5xl lg:text-6xl font-bold text-white leading-tight mb-4"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Admission Forms
            </h1>
            <p className="text-indigo-300 text-lg leading-relaxed">
              Choose your preferred method to obtain and complete your admission
              form for Lutheran High School, Obot Idim.
            </p>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="container mx-auto px-6 lg:px-16 py-16 max-w-5xl">
        <div className="my-4">
          <BackLink />
        </div>
        {/* ── Recommended badge callout ── */}
        <div className="bg-white border border-indigo-100 rounded-3xl p-6 mb-12 flex gap-4 items-start shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xl shrink-0">
            💡
          </div>
          <div>
            <h3
              className="font-bold text-indigo-900 text-base mb-1"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Quick Tip
            </h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              The <strong className="text-indigo-700">online form</strong> is
              strongly recommended: it is faster, more secure, and saves you the
              trip to school. All you need is your phone or computer and proof
              of payment.
            </p>
          </div>
        </div>

        {/* ── Two-column layout: Online | Physical ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* ── ONLINE FORM CARD ── */}
          <div
            className="relative rounded-3xl overflow-hidden flex flex-col"
            style={{
              background: "linear-gradient(135deg, #312e81 0%, #4c1d95 100%)",
            }}
          >
            {/* Decorative blob */}
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/5 -translate-y-1/3 translate-x-1/3 pointer-events-none" />

            <div className="relative p-8 flex flex-col flex-1">
              {/* Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-2xl shrink-0">
                  🌐
                </div>
                <div>
                  <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-amber-400 mb-0.5">
                    Recommended
                  </span>
                  <h2
                    className="text-white font-bold text-xl leading-tight"
                    style={{
                      fontFamily: "'Playfair Display', Georgia, serif",
                    }}
                  >
                    Online Form
                  </h2>
                </div>
              </div>

              {/* Description */}
              <p className="text-violet-200 text-sm leading-relaxed mb-6 flex-1">
                Our online admission form filling is fast and secure. You will
                be guided to make your{" "}
                <strong className="text-white">₦3,000</strong> payment to our
                school account, then immediately redirected to fill and submit
                your admission form online.
              </p>

              {/* How it works steps */}
              <div className="space-y-3 mb-7">
                {[
                  "Pay ₦3,000 to our official school account",
                  "Upload your proof of payment for validation",
                  "Fill and submit the digital admission form",
                  "We process and contact you within 1 to 48 working hours",
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-amber-400/20 border border-amber-400/40 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-amber-300 text-[10px] font-bold">
                        {i + 1}
                      </span>
                    </div>
                    <span className="text-violet-200 text-xs leading-relaxed">
                      {step}
                    </span>
                  </div>
                ))}
              </div>

              {/* Notice */}
              <div className="bg-white/10 border border-white/15 rounded-2xl p-4 mb-7">
                <p className="text-violet-200 text-xs leading-relaxed">
                  <span className="text-amber-300 font-bold">NB:</span>{" "}
                  Processing takes between{" "}
                  <strong className="text-white">1 to 48 working hours</strong>.
                  During this period, we will validate your payment, then
                  schedule and contact you for an entrance examination.
                </p>
              </div>

              {/* CTA */}
              <Link
                href="/admission/fill-admission-form"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-linear-to-r from-amber-500 to-amber-400 text-indigo-950 font-bold text-sm shadow-lg shadow-amber-900/30 hover:scale-105 hover:shadow-amber-700/50 transition-all duration-200 w-full"
              >
                Proceed to Online Form
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

          {/* ── PHYSICAL FORM CARD ── */}
          <div className="bg-white border border-slate-200 rounded-3xl p-8 flex flex-col shadow-sm">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-2xl shrink-0">
                📋
              </div>
              <div>
                <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-0.5">
                  Alternative
                </span>
                <h2
                  className="text-indigo-950 font-bold text-xl leading-tight"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  Physical Form
                </h2>
              </div>
            </div>

            {/* Description */}
            <p className="text-slate-600 text-sm leading-relaxed mb-6 flex-1">
              Physical admission forms for the{" "}
              <strong>2026/2027 academic session</strong> are currently
              available at the school premises only, at a non-refundable fee of{" "}
              <strong className="text-indigo-700">₦3,000</strong>.
            </p>

            {/* Payment instruction */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-5">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Payment Instructions
              </p>
              <p className="text-slate-600 text-xs leading-relaxed">
                Payment may be made <strong>over the counter</strong> at the
                point of collecting the form, or directly to our school bank
                account below. Come with your{" "}
                <strong>evidence of payment</strong> if you used the bank
                transfer option.
              </p>
            </div>

            {/* Bank accounts */}
            <div className="space-y-3 mb-7">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                School Bank Accounts
              </p>
              {bankAccounts.map(({ bank, account, name, color, label }) => (
                <div key={bank} className={`border rounded-2xl p-4 ${color}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-bold uppercase tracking-wider ${label}`}
                    >
                      {bank}
                    </span>
                  </div>
                  <p className="font-mono font-bold text-slate-800 text-base">
                    {account}
                  </p>
                  <p className="text-slate-500 text-xs mt-0.5">{name}</p>
                </div>
              ))}
            </div>

            {/* Location */}
            <div className="flex items-start gap-3 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl mb-7">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-indigo-500 shrink-0 mt-0.5"
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <div>
                <p className="text-xs font-bold text-indigo-700 mb-0.5">
                  School Location
                </p>
                <p className="text-indigo-600 text-xs leading-snug">
                  Lutheran High School Obot Idim,
                  <br />
                  Ibesikpo Asutan L.G.A,
                  <br />
                  Akwa Ibom State, Nigeria
                </p>
              </div>
            </div>

            {/* Contact CTA */}
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full border border-indigo-300 text-indigo-700 font-semibold text-sm hover:bg-indigo-50 transition-colors w-full"
            >
              Contact Admissions Office
              <svg
                width="14"
                height="14"
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

        {/* ── Bottom nav ── */}
        <div className="flex items-center justify-between mt-14">
          <BackLink />
          <Link
            href="/admission/fill-admission-form"
            className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            Start Online Application
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
