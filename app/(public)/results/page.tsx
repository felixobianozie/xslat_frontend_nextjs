import Link from "next/link";

// Section cards for the results landing page
const sections = [
  {
    slug: "/coming-soon",
    title: "Check Results",
    subtitle: "View your examination results",
    preview:
      "Check your WAEC, NECO, and internal examination results online. Enter your candidate number to access your result slip and subject scores instantly.",
    icon: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
    accent: "from-indigo-500 to-violet-600",
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    iconBg: "bg-indigo-100 text-indigo-700",
    tag: "Online",
    illustration: (
      <svg
        viewBox="0 0 200 120"
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Document */}
        <rect
          x="50"
          y="18"
          width="100"
          height="84"
          rx="6"
          fill="#e0e7ff"
          opacity="0.5"
        />
        <rect
          x="50"
          y="18"
          width="100"
          height="84"
          rx="6"
          stroke="#6366f1"
          strokeWidth="1.5"
          opacity="0.35"
        />
        {/* Lines */}
        {[38, 52, 66, 80].map((y, i) => (
          <rect
            key={i}
            x="65"
            y={y}
            width={i % 2 === 0 ? 55 : 40}
            height="7"
            rx="3"
            fill="#a5b4fc"
            opacity="0.35"
          />
        ))}
        {/* Score badges */}
        <rect
          x="130"
          y="36"
          width="18"
          height="10"
          rx="3"
          fill="#22c55e"
          opacity="0.5"
        />
        <rect
          x="130"
          y="50"
          width="18"
          height="10"
          rx="3"
          fill="#22c55e"
          opacity="0.4"
        />
        <rect
          x="130"
          y="64"
          width="18"
          height="10"
          rx="3"
          fill="#f59e0b"
          opacity="0.5"
        />
        <rect
          x="130"
          y="78"
          width="18"
          height="10"
          rx="3"
          fill="#22c55e"
          opacity="0.4"
        />
        {/* Magnifying glass */}
        <circle cx="152" cy="30" r="14" fill="#e0e7ff" opacity="0.6" />
        <circle
          cx="152"
          cy="30"
          r="8"
          stroke="#6366f1"
          strokeWidth="1.8"
          opacity="0.5"
        />
        <line
          x1="157"
          y1="36"
          x2="163"
          y2="42"
          stroke="#6366f1"
          strokeWidth="2"
          opacity="0.5"
          strokeLinecap="round"
        />
        {/* Stars */}
        <circle cx="38" cy="28" r="3" fill="#fbbf24" opacity="0.6" />
        <circle cx="165" cy="90" r="2.5" fill="#fbbf24" opacity="0.4" />
      </svg>
    ),
  },
  {
    slug: "/coming-soon",
    title: "Validate Results",
    subtitle: "Verify the authenticity of results",
    preview:
      "Employers, institutions, and other parties can verify the authenticity of any LHS result or certificate. Fast, secure, and tamper-proof validation.",
    icon: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <polyline points="9 12 11 14 15 10" />
      </svg>
    ),
    accent: "from-emerald-500 to-teal-500",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    iconBg: "bg-emerald-100 text-emerald-700",
    tag: "Secure",
    illustration: (
      <svg
        viewBox="0 0 200 120"
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Shield */}
        <path
          d="M60 28 L100 15 L140 28 L140 68 Q140 95 100 108 Q60 95 60 68 Z"
          fill="#d1fae5"
          opacity="0.5"
        />
        <path
          d="M60 28 L100 15 L140 28 L140 68 Q140 95 100 108 Q60 95 60 68 Z"
          stroke="#10b981"
          strokeWidth="1.5"
          opacity="0.4"
        />
        {/* Check inside shield */}
        <polyline
          points="80,62 95,77 122,50"
          stroke="#059669"
          strokeWidth="3"
          opacity="0.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Tick marks around */}
        {[0, 60, 120, 180, 240, 300].map((deg, i) => {
          const rad = (deg * Math.PI) / 180;
          const x1 = 100 + 52 * Math.cos(rad);
          const y1 = 62 + 52 * Math.sin(rad);
          const x2 = 100 + 58 * Math.cos(rad);
          const y2 = 62 + 58 * Math.sin(rad);
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#34d399"
              strokeWidth="1.5"
              opacity="0.3"
            />
          );
        })}
        <circle
          cx="100"
          cy="62"
          r="54"
          stroke="#34d399"
          strokeWidth="1"
          opacity="0.2"
          strokeDasharray="4 3"
        />
        <circle cx="38" cy="35" r="3" fill="#fbbf24" opacity="0.5" />
        <circle cx="165" cy="88" r="2.5" fill="#fbbf24" opacity="0.4" />
      </svg>
    ),
  },
  {
    slug: "/coming-soon",
    title: "Generate Transcript",
    subtitle: "Official academic transcripts",
    preview:
      "Request an official academic transcript for university applications, scholarships, or employment. Generated and sealed by the school registrar.",
    icon: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
    accent: "from-amber-500 to-orange-500",
    bg: "bg-amber-50",
    border: "border-amber-200",
    iconBg: "bg-amber-100 text-amber-700",
    tag: "Official",
    illustration: (
      <svg
        viewBox="0 0 200 120"
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Scroll */}
        <rect
          x="46"
          y="20"
          width="108"
          height="80"
          rx="4"
          fill="#fef3c7"
          opacity="0.6"
        />
        <rect
          x="46"
          y="20"
          width="108"
          height="80"
          rx="4"
          stroke="#f59e0b"
          strokeWidth="1.5"
          opacity="0.4"
        />
        <ellipse cx="100" cy="20" rx="54" ry="8" fill="#fde68a" opacity="0.5" />
        <ellipse
          cx="100"
          cy="100"
          rx="54"
          ry="8"
          fill="#fde68a"
          opacity="0.5"
        />
        {/* LHS header */}
        <rect
          x="70"
          y="30"
          width="60"
          height="8"
          rx="3"
          fill="#f59e0b"
          opacity="0.4"
        />
        {/* Content lines */}
        {[46, 58, 70, 82].map((y, i) => (
          <rect
            key={i}
            x="62"
            y={y}
            width={i % 2 === 0 ? 50 : 38}
            height="6"
            rx="2"
            fill="#fde68a"
            opacity="0.4"
          />
        ))}
        {/* Grade column */}
        {[46, 58, 70, 82].map((y, i) => (
          <rect
            key={i}
            x="120"
            y={y}
            width="22"
            height="6"
            rx="2"
            fill="#f59e0b"
            opacity="0.35"
          />
        ))}
        {/* Seal */}
        <circle
          cx="145"
          cy="88"
          r="12"
          fill="#fde68a"
          opacity="0.5"
          stroke="#f59e0b"
          strokeWidth="1"
        />
        <circle cx="145" cy="88" r="7" fill="#f59e0b" opacity="0.2" />
        <text
          x="145"
          y="92"
          textAnchor="middle"
          fill="#92400e"
          fontSize="7"
          fontWeight="bold"
          opacity="0.6"
        >
          LHS
        </text>
        <circle cx="42" cy="32" r="3" fill="#fbbf24" opacity="0.5" />
        <circle cx="162" cy="30" r="2.5" fill="#fbbf24" opacity="0.4" />
      </svg>
    ),
  },
];

export default function ResultsPage() {
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
        <div className="absolute top-0 right-0 w-150 h-150 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-64 h-64 rounded-full bg-amber-400/10 translate-y-1/2 pointer-events-none" />

        <div className="relative container mx-auto px-6 lg:px-16 py-16 lg:py-24">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 text-amber-300 text-xs font-bold uppercase tracking-widest mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Academic Records
            </span>
            <h1
              className="text-5xl lg:text-6xl font-bold text-white leading-tight mb-4"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Results &amp; Records
            </h1>
            <p className="text-indigo-300 text-lg leading-relaxed">
              Check your examination results, validate certificates, and
              generate official transcripts, all in one place.
            </p>
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="container mx-auto px-6 lg:px-16 py-5 flex items-center gap-2 text-xs text-slate-400">
        <Link href="/" className="hover:text-indigo-600 transition-colors">
          Home
        </Link>
        <span>/</span>
        <span className="text-slate-600 font-medium">Results</span>
      </div>

      {/* Info callout */}
      <div className="container mx-auto px-6 lg:px-16 mb-10">
        <div className="bg-white border border-indigo-100 rounded-2xl p-5 flex gap-4 items-start shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xl shrink-0">
            ℹ️
          </div>
          <div>
            <p className="font-bold text-indigo-900 text-sm mb-1">
              Coming Soon
            </p>
            <p className="text-slate-500 text-sm leading-relaxed">
              Our online results portal is currently under development. All
              three services below will be available very soon. In the meantime,
              contact the school directly for result enquiries.
            </p>
          </div>
        </div>
      </div>

      {/* Section cards */}
      <div className="container mx-auto px-6 lg:px-16 pb-24">
        <div className="text-center mb-12">
          <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-violet-600 mb-3">
            Services
          </span>
          <h2
            className="text-4xl lg:text-5xl font-bold text-indigo-950 mb-4"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Results Portal
          </h2>
          <p className="text-slate-500 max-w-xl mx-auto text-base leading-relaxed">
            Select a service below to get started. Each service is designed to
            be fast, secure, and accessible from anywhere.
          </p>
          <div className="flex items-center justify-center gap-3 mt-6">
            <div className="w-12 h-px bg-indigo-300" />
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <div className="w-12 h-px bg-indigo-300" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 xl:gap-8">
          {sections.map((sec) => (
            <Link
              key={sec.title}
              href={sec.slug}
              className={`group relative flex flex-col rounded-3xl border ${sec.border} ${sec.bg} overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300`}
            >
              {/* Illustration */}
              <div className="relative h-36 overflow-hidden flex items-center justify-center p-4">
                {sec.illustration}
              </div>

              {/* Content */}
              <div className="flex flex-col flex-1 p-6 pt-0">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">
                  <span
                    className={`w-1.5 h-1.5 rounded-full bg-linear-to-r ${sec.accent} inline-block`}
                  />
                  {sec.tag}
                </span>

                <div className="flex items-start gap-3 mb-3">
                  <div
                    className={`w-11 h-11 rounded-xl ${sec.iconBg} flex items-center justify-center shrink-0`}
                  >
                    {sec.icon}
                  </div>
                  <div>
                    <h2
                      className="text-indigo-950 font-bold text-lg leading-tight"
                      style={{
                        fontFamily: "'Playfair Display', Georgia, serif",
                      }}
                    >
                      {sec.title}
                    </h2>
                    <p className="text-slate-400 text-xs">{sec.subtitle}</p>
                  </div>
                </div>

                <p className="text-slate-500 text-sm leading-relaxed flex-1 mb-5">
                  {sec.preview}
                </p>

                <div className="flex items-center gap-1.5 text-sm font-semibold text-indigo-600 group-hover:text-indigo-800 transition-colors">
                  Get started
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    className="group-hover:translate-x-1 transition-transform"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Bottom CTA */}
        <div
          className="mt-16 rounded-3xl overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4c1d95 100%)",
          }}
        >
          <div className="relative p-8 lg:p-12 text-center">
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
                backgroundSize: "28px 28px",
              }}
            />
            <div className="relative">
              <h3
                className="text-3xl font-bold text-white mb-3"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                Need Help?
              </h3>
              <p className="text-indigo-300 text-base mb-8 max-w-lg mx-auto">
                For urgent result enquiries, contact the school registrar
                directly during official hours.
              </p>
              <Link
                href="/contact"
                className="px-8 py-3.5 rounded-full bg-linear-to-r from-amber-500 to-amber-400 text-indigo-950 font-bold text-sm tracking-wide shadow-lg shadow-amber-900/30 hover:scale-105 transition-all duration-200"
              >
                Contact the School
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
