"use client";

import Link from "next/link";

const admissionStatus: {
  status: "open" | "opening-soon" | "closing-soon" | "closed";
  session: string;
  message: string;
} = {
  status: "open", // "open" | "opening-soon" | "closing-soon" | "closed"
  session: "2026 / 2027",
  message: "Admission is currently open for the 2026/2027 academic session.",
};

const statusConfig = {
  open: {
    label: "Admissions Open",
    dot: "bg-emerald-500 animate-pulse",
    pill: "bg-emerald-50 border-emerald-200 text-emerald-700",
    banner: "from-emerald-900/30 to-emerald-800/10 border-emerald-700/40",
    accent: "text-emerald-400",
  },
  "opening-soon": {
    label: "Opening Soon",
    dot: "bg-amber-400 animate-pulse",
    pill: "bg-amber-50 border-amber-200 text-amber-700",
    banner: "from-amber-900/30 to-amber-800/10 border-amber-700/40",
    accent: "text-amber-400",
  },
  "closing-soon": {
    label: "Closing Soon",
    dot: "bg-orange-500 animate-pulse",
    pill: "bg-orange-50 border-orange-200 text-orange-700",
    banner: "from-orange-900/30 to-orange-800/10 border-orange-700/40",
    accent: "text-orange-400",
  },
  closed: {
    label: "Admissions Closed",
    dot: "bg-slate-400",
    pill: "bg-slate-100 border-slate-300 text-slate-600",
    banner: "from-slate-800/30 to-slate-700/10 border-slate-600/40",
    accent: "text-slate-400",
  },
};

const sections = [
  {
    slug: "application-process",
    title: "Application Process",
    subtitle: "Step-by-step guide to joining LHS",
    preview:
      "From purchasing your application form to receiving your admission notification — a clear, detailed walkthrough of every stage in the LHS admissions process.",
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
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
    accent: "from-indigo-500 to-violet-600",
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    iconBg: "bg-indigo-100 text-indigo-700",
    tag: "6 Steps",
    illustration: (
      <svg
        viewBox="0 0 200 120"
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Steps ladder */}
        {[
          { x: 20, y: 90, w: 30, h: 20 },
          { x: 52, y: 72, w: 30, h: 38 },
          { x: 84, y: 54, w: 30, h: 56 },
          { x: 116, y: 36, w: 30, h: 74 },
          { x: 148, y: 18, w: 30, h: 92 },
        ].map((r, i) => (
          <rect
            key={i}
            x={r.x}
            y={r.y}
            width={r.w}
            height={r.h}
            rx="4"
            fill="#818cf8"
            opacity={0.15 + i * 0.07}
          />
        ))}
        {/* Check marks on steps */}
        {[
          { cx: 35, cy: 83 },
          { cx: 67, cy: 65 },
          { cx: 99, cy: 47 },
        ].map((c, i) => (
          <g key={i}>
            <circle cx={c.cx} cy={c.cy} r="7" fill="#6366f1" opacity="0.3" />
            <polyline
              points={`${c.cx - 3},${c.cy} ${c.cx - 1},${c.cy + 2} ${c.cx + 3},${c.cy - 2}`}
              stroke="#4f46e5"
              strokeWidth="1.8"
              opacity="0.6"
            />
          </g>
        ))}
        {/* Arrow going up */}
        <path
          d="M163 22 L163 10 L170 17 M163 10 L156 17"
          stroke="#f59e0b"
          strokeWidth="2"
          opacity="0.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Flag at top */}
        <rect
          x="163"
          y="8"
          width="1.5"
          height="20"
          fill="#f59e0b"
          opacity="0.4"
        />
        <polygon
          points="164.5,8 178,13 164.5,18"
          fill="#f59e0b"
          opacity="0.5"
        />
      </svg>
    ),
  },
  {
    slug: "forms",
    title: "Admission Forms",
    subtitle: "Apply from anywhere",
    preview:
      "Complete your application physically or entirely online. Pay the non-refundable ₦3,000 form fee, fill out your details, and submit your application.",
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
    accent: "from-teal-500 to-emerald-500",
    bg: "bg-teal-50",
    border: "border-teal-200",
    iconBg: "bg-teal-100 text-teal-700",
    tag: "Online",
    illustration: (
      <svg
        viewBox="0 0 200 120"
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Form document */}
        <rect
          x="50"
          y="15"
          width="100"
          height="90"
          rx="6"
          fill="#ccfbf1"
          opacity="0.5"
        />
        <rect
          x="50"
          y="15"
          width="100"
          height="90"
          rx="6"
          stroke="#14b8a6"
          strokeWidth="1.5"
          opacity="0.35"
        />
        {/* Form lines */}
        {[38, 50, 62, 74, 86].map((y, i) => (
          <rect
            key={i}
            x="65"
            y={y}
            width={i % 2 === 0 ? 55 : 42}
            height="7"
            rx="3"
            fill="#5eead4"
            opacity="0.3"
          />
        ))}
        {/* Label stubs */}
        {[38, 50, 62, 74, 86].map((y, i) => (
          <rect
            key={i}
            x="65"
            y={y}
            width="16"
            height="7"
            rx="3"
            fill="#0d9488"
            opacity="0.25"
          />
        ))}
        {/* Pen */}
        <rect
          x="138"
          y="60"
          width="6"
          height="22"
          rx="2"
          fill="#f59e0b"
          opacity="0.5"
          transform="rotate(30 141 71)"
        />
        <polygon
          points="138,82 144,82 141,90"
          fill="#f59e0b"
          opacity="0.4"
          transform="rotate(30 141 71)"
        />
        {/* Sparkle */}
        <circle cx="155" cy="30" r="3" fill="#fbbf24" opacity="0.6" />
        <circle cx="48" cy="100" r="2" fill="#fbbf24" opacity="0.4" />
      </svg>
    ),
  },
  {
    slug: "entrance-examination",
    title: "Entrance Examination",
    subtitle: "Dates, venues & results",
    preview:
      "All scheduled entrance examination dates for the current session, their venues, and result status. Flexible dates are spread across the session to suit your schedule.",
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
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    accent: "from-amber-500 to-orange-500",
    bg: "bg-amber-50",
    border: "border-amber-200",
    iconBg: "bg-amber-100 text-amber-700",
    tag: "2026/2027 Session",
    illustration: (
      <svg
        viewBox="0 0 200 120"
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Calendar */}
        <rect
          x="30"
          y="20"
          width="140"
          height="90"
          rx="8"
          fill="#fef3c7"
          opacity="0.5"
        />
        <rect
          x="30"
          y="20"
          width="140"
          height="28"
          rx="8"
          fill="#f59e0b"
          opacity="0.25"
        />
        <rect
          x="30"
          y="20"
          width="140"
          height="90"
          rx="8"
          stroke="#f59e0b"
          strokeWidth="1.5"
          opacity="0.4"
        />
        {/* Calendar grid */}
        {[0, 1, 2, 3, 4, 5, 6].map((col) =>
          [0, 1, 2, 3].map((row) => {
            const x = 42 + col * 18;
            const y = 58 + row * 14;
            const highlight =
              (col === 1 && row === 0) ||
              (col === 3 && row === 1) ||
              (col === 5 && row === 2);
            return (
              <rect
                key={`${col}-${row}`}
                x={x - 5}
                y={y - 5}
                width="11"
                height="11"
                rx="3"
                fill={highlight ? "#f59e0b" : "#fde68a"}
                opacity={highlight ? 0.7 : 0.3}
              />
            );
          }),
        )}
        {/* Check marks on highlighted */}
        {[
          [42 + 18, 58],
          [42 + 54, 72],
          [42 + 90, 86],
        ].map(([x, y], i) => (
          <polyline
            key={i}
            points={`${x - 2},${y + 1} ${x},${y + 3} ${x + 3},${y - 1}`}
            stroke="#92400e"
            strokeWidth="1.5"
            opacity="0.7"
          />
        ))}
        {/* Header dots */}
        {[42, 60, 78, 96, 114, 132, 150].map((x, i) => (
          <rect
            key={i}
            x={x - 5}
            y="32"
            width="11"
            height="7"
            rx="2"
            fill="#f59e0b"
            opacity="0.3"
          />
        ))}
      </svg>
    ),
  },
];

export default function AdmissionPage() {
  const cfg = statusConfig[admissionStatus.status];

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
        <div className="absolute top-0 right-0 w-120 h-120 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 rounded-full bg-amber-400/10 translate-y-1/2 pointer-events-none" />

        <div className="relative container mx-auto px-6 lg:px-16 py-16 lg:py-20">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 text-amber-300 text-xs font-bold uppercase tracking-widest mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Admissions
            </span>
            <h1
              className="text-5xl lg:text-6xl font-bold text-white leading-tight mb-4"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Join the
              <br className="hidden lg:block" /> Luthisco Family
            </h1>
            <p className="text-indigo-300 text-lg leading-relaxed">
              Everything you need to apply to Lutheran High School, admission
              status, application guide, online forms, and entrance examination
              details.
            </p>
          </div>
        </div>
      </div>

      {/* ── Admission Status Banner ── */}
      <div className="container mx-auto px-6 lg:px-16 -mt-6 relative z-10 mb-10">
        <div
          className={`rounded-2xl border bg-linear-to-r ${cfg.banner} p-5 lg:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4`}
          style={{
            background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)",
          }}
        >
          <div className="flex items-center gap-3 flex-1 flex-col sm:flex-row">
            <div
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${cfg.pill} shrink-0`}
            >
              <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
              <span className="text-xs font-bold uppercase tracking-wider">
                {cfg.label}
              </span>
            </div>
            <div>
              <p className="text-white font-semibold text-sm">
                {admissionStatus.session} Academic Session
              </p>
              <p className="text-indigo-300 text-xs mt-0.5">
                {admissionStatus.message}
              </p>
            </div>
          </div>
          <Link
            href="/admission/fill-admission-form"
            className="px-5 py-2.5 rounded-full bg-linear-to-r from-amber-500 to-amber-400 text-indigo-950 font-bold text-sm hover:scale-105 transition-transform shadow-sm whitespace-nowrap shrink-0"
          >
            Apply Now →
          </Link>
        </div>
      </div>

      {/* ── Quick stats ── */}
      <div className="container mx-auto px-6 lg:px-16 mb-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { value: "₦3,000", label: "Form Fee", sub: "Non-refundable" },
            {
              value: "JS1-SS2",
              label: "Entry Classes",
              sub: "All levels open",
            },
            {
              value: "48 hrs",
              label: "Processing Time",
              sub: "After submission",
            },
            {
              value: "Online",
              label: "Form Available",
              sub: "Fill from anywhere",
            },
          ].map(({ value, label, sub }) => (
            <div
              key={label}
              className="bg-white border border-slate-200 rounded-2xl p-5 text-center hover:border-indigo-200 hover:shadow-sm transition-all"
            >
              <div
                className="text-2xl font-bold text-indigo-800 mb-1"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                {value}
              </div>
              <div className="text-slate-700 font-semibold text-xs">
                {label}
              </div>
              <div className="text-slate-400 text-xs mt-0.5">{sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Section cards ── */}
      <div className="container mx-auto px-6 lg:px-16 pb-20">
        <div className="text-center mb-12">
          <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-violet-600 mb-3">
            Navigation
          </span>
          <h2
            className="text-4xl lg:text-5xl font-bold text-indigo-950 mb-4"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Admissions Guide
          </h2>
          <p className="text-slate-500 max-w-xl mx-auto text-base leading-relaxed">
            Select a section below for full details on any part of the
            admissions process.
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
              href={`/admission/${sec.slug}`}
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
                  Read more
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

      {/* ── Bottom CTA ── */}
      <div className="container mx-auto px-6 lg:px-16 pb-24">
        <div
          className="rounded-3xl overflow-hidden"
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
                Ready to Begin?
              </h3>
              <p className="text-indigo-300 text-base mb-8 max-w-lg mx-auto">
                Admission forms are available online and at the school premises.
                Start your application today and take the first step into the
                Luthisco Republic.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/admission/fill-admission-form"
                  className="px-8 py-3.5 rounded-full bg-linear-to-r from-amber-500 to-amber-400 text-indigo-950 font-bold text-sm tracking-wide shadow-lg shadow-amber-900/30 hover:scale-105 transition-all duration-200"
                >
                  Fill Admission Form Online
                </Link>
                <Link
                  href="/contact"
                  className="px-8 py-3.5 rounded-full border border-indigo-500/50 text-indigo-200 font-semibold text-sm tracking-wide hover:bg-indigo-800/40 hover:border-indigo-400 transition-all duration-200"
                >
                  Contact Admissions Office
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
