import Link from "next/link";

// Finance section cards shown on the landing page
const sections = [
  {
    slug: "school-fees",
    title: "School Fees",
    subtitle: "Tuition per term & session",
    preview:
      "A full breakdown of tuition fees for day students and boarding students across all class levels. Organised by session and term for easy reference.",
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
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
      </svg>
    ),
    accent: "from-indigo-500 to-violet-600",
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    iconBg: "bg-indigo-100 text-indigo-700",
    tag: "Tuition",
    illustration: (
      <svg
        viewBox="0 0 200 120"
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Stack of bills */}
        <rect
          x="42"
          y="68"
          width="116"
          height="32"
          rx="5"
          fill="#c7d2fe"
          opacity="0.5"
        />
        <rect
          x="38"
          y="62"
          width="116"
          height="32"
          rx="5"
          fill="#a5b4fc"
          opacity="0.4"
        />
        <rect
          x="34"
          y="56"
          width="116"
          height="32"
          rx="5"
          fill="#818cf8"
          opacity="0.3"
        />
        {/* Top bill detail */}
        <rect
          x="34"
          y="56"
          width="116"
          height="32"
          rx="5"
          stroke="#6366f1"
          strokeWidth="1.2"
          opacity="0.4"
        />
        <line
          x1="50"
          y1="65"
          x2="100"
          y2="65"
          stroke="#6366f1"
          strokeWidth="1.2"
          opacity="0.4"
        />
        <circle
          cx="125"
          cy="72"
          r="8"
          fill="#e0e7ff"
          opacity="0.6"
          stroke="#6366f1"
          strokeWidth="1"
        />
        {/* Naira symbol */}
        <text
          x="120"
          y="76"
          textAnchor="middle"
          fill="#4338ca"
          fontSize="10"
          fontWeight="bold"
          opacity="0.7"
        >
          ₦
        </text>
        {/* Small coins */}
        <circle cx="55" cy="38" r="12" fill="#fde68a" opacity="0.5" />
        <circle
          cx="55"
          cy="38"
          r="12"
          stroke="#f59e0b"
          strokeWidth="1.2"
          opacity="0.4"
        />
        <text
          x="55"
          y="42"
          textAnchor="middle"
          fill="#92400e"
          fontSize="9"
          fontWeight="bold"
          opacity="0.7"
        >
          ₦
        </text>
        <circle cx="82" cy="32" r="9" fill="#fde68a" opacity="0.4" />
        <text
          x="82"
          y="36"
          textAnchor="middle"
          fill="#92400e"
          fontSize="7"
          fontWeight="bold"
          opacity="0.6"
        >
          ₦
        </text>
      </svg>
    ),
  },
  {
    slug: "other-payments",
    title: "Other Payments",
    subtitle: "Levies & one-time charges",
    preview:
      "Details of all other applicable payments including result booklets, house dues, haircut levies, and more — broken down by student category and frequency.",
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
      </svg>
    ),
    accent: "from-teal-500 to-emerald-500",
    bg: "bg-teal-50",
    border: "border-teal-200",
    iconBg: "bg-teal-100 text-teal-700",
    tag: "Levies",
    illustration: (
      <svg
        viewBox="0 0 200 120"
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Receipt */}
        <rect
          x="58"
          y="15"
          width="84"
          height="90"
          rx="4"
          fill="#ccfbf1"
          opacity="0.5"
        />
        <rect
          x="58"
          y="15"
          width="84"
          height="90"
          rx="4"
          stroke="#14b8a6"
          strokeWidth="1.2"
          opacity="0.4"
        />
        {/* Zig-zag bottom */}
        <path
          d="M58 100 l7-6 l7 6 l7-6 l7 6 l7-6 l7 6 l7-6 l7 6 l7-6 l7 6 l7-6 l7 6"
          stroke="#14b8a6"
          strokeWidth="1.2"
          opacity="0.3"
          fill="none"
        />
        {/* Lines */}
        {[35, 48, 61, 74, 87].map((y, i) => (
          <rect
            key={i}
            x="70"
            y={y}
            width={i % 2 === 0 ? 52 : 38}
            height="6"
            rx="2"
            fill="#5eead4"
            opacity="0.3"
          />
        ))}
        {/* Checkmark */}
        <circle cx="152" cy="38" r="14" fill="#d1fae5" opacity="0.6" />
        <polyline
          points="146,38 151,43 159,33"
          stroke="#10b981"
          strokeWidth="2"
          opacity="0.7"
        />
      </svg>
    ),
  },
  {
    slug: "/coming-soon",
    title: "Pay Online",
    subtitle: "Secure digital payments",
    preview:
      "Make your school fees and levy payments online from anywhere. Fast, secure, and convenient — no need to visit the bank or school premises.",
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
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
    accent: "from-amber-500 to-orange-500",
    bg: "bg-amber-50",
    border: "border-amber-200",
    iconBg: "bg-amber-100 text-amber-700",
    tag: "Coming Soon",
    illustration: (
      <svg
        viewBox="0 0 200 120"
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Card */}
        <rect
          x="30"
          y="30"
          width="140"
          height="60"
          rx="8"
          fill="#fef3c7"
          opacity="0.5"
        />
        <rect
          x="30"
          y="30"
          width="140"
          height="60"
          rx="8"
          stroke="#f59e0b"
          strokeWidth="1.2"
          opacity="0.4"
        />
        <rect
          x="30"
          y="30"
          width="140"
          height="22"
          rx="8"
          fill="#fbbf24"
          opacity="0.25"
        />
        {/* Chip */}
        <rect
          x="48"
          y="60"
          width="22"
          height="18"
          rx="3"
          fill="#fde68a"
          opacity="0.6"
          stroke="#f59e0b"
          strokeWidth="1"
        />
        {/* Numbers */}
        {[85, 105, 125, 145].map((x, i) => (
          <rect
            key={i}
            x={x}
            y="63"
            width="14"
            height="5"
            rx="2"
            fill="#f59e0b"
            opacity="0.3"
          />
        ))}
        {/* Lock icon */}
        <circle cx="155" cy="42" r="9" fill="#d1fae5" opacity="0.7" />
        <path
          d="M151 42 h8 M151 40 Q151 36 155 36 Q159 36 159 40"
          stroke="#10b981"
          strokeWidth="1.5"
          opacity="0.7"
        />
        {/* Wifi / signal */}
        {[6, 9, 12].map((r, i) => (
          <path
            key={i}
            d={`M48 ${96 - r} Q60 ${90 - r} 72 ${96 - r}`}
            stroke="#f59e0b"
            strokeWidth="1.5"
            opacity={0.3 + i * 0.15}
            fill="none"
          />
        ))}
      </svg>
    ),
  },
];

export default function FinancePage() {
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
            <h1
              className="text-5xl lg:text-6xl font-bold text-white leading-tight mb-4"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Finance &amp; Payments
            </h1>
            <p className="text-indigo-300 text-lg leading-relaxed">
              All school fees, levies, and payment information in one place.
              Transparent, up-to-date, and easy to navigate.
            </p>
          </div>
        </div>
      </div>

      {/* ── Breadcrumb ── */}
      <div className="container mx-auto px-6 lg:px-16 py-5 flex items-center gap-2 text-xs text-slate-400">
        <Link href="/" className="hover:text-indigo-600 transition-colors">
          Home
        </Link>
        <span>/</span>
        <span className="text-slate-600 font-medium">Finance</span>
      </div>

      {/* ── Important notice ── */}
      <div className="container mx-auto px-6 lg:px-16 mb-10">
        <div className="bg-white border border-amber-200 rounded-2xl p-5 flex gap-4 items-start shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-xl shrink-0">
            ⚠️
          </div>
          <div>
            <p className="font-bold text-amber-900 text-sm mb-1">
              Official Payment Notice
            </p>
            <p className="text-amber-800 text-sm leading-relaxed">
              All school fees payments <strong>MUST</strong> be made to the
              school's official bank accounts only. Visit the school with
              evidence of payment for collection of your official school
              receipt.
            </p>
          </div>
        </div>
      </div>

      {/* ── Official bank accounts ── */}
      <div className="container mx-auto px-6 lg:px-16 mb-16">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
          Official School Bank Accounts
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-orange-600 mb-2">
              GTBank
            </p>
            <p className="font-mono font-bold text-slate-800 text-xl mb-0.5">
              0107355105
            </p>
            <p className="text-slate-500 text-xs">
              Lutheran High School, Obot Idim
            </p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-2">
              Zenith Bank
            </p>
            <p className="font-mono font-bold text-slate-800 text-xl mb-0.5">
              1011112061
            </p>
            <p className="text-slate-500 text-xs">
              Lutheran High School, Obot Idim
            </p>
          </div>
        </div>
      </div>

      {/* ── Section cards ── */}
      <div className="container mx-auto px-6 lg:px-16 pb-24">
        <div className="text-center mb-12">
          <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-violet-600 mb-3">
            Navigation
          </span>
          <h2
            className="text-4xl lg:text-5xl font-bold text-indigo-950 mb-4"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Finance Guide
          </h2>
          <p className="text-slate-500 max-w-xl mx-auto text-base leading-relaxed">
            Select a section below for full details on fees, levies, or online
            payment.
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
              key={sec.slug}
              href={
                sec.slug.startsWith("/") ? sec.slug : `/finance/${sec.slug}`
              }
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
                  View details
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
      </div>
    </main>
  );
}
