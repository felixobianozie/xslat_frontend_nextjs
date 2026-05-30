import Link from "next/link";

const sections = [
  {
    slug: "announcements",
    title: "Announcements",
    subtitle: "School notices & updates",
    preview:
      "Official communications from school management — fee reminders, term newsletters, policy changes, and important notices for parents, guardians, and students.",
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
        <path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0" />
      </svg>
    ),
    accent: "from-indigo-500 to-violet-600",
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    iconBg: "bg-indigo-100 text-indigo-700",
    tag: "Latest Updates",
    illustration: (
      <svg
        viewBox="0 0 200 120"
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Bell */}
        <path
          d="M100 20 Q100 16 104 16 Q108 16 108 20"
          stroke="#818cf8"
          strokeWidth="2"
          opacity="0.5"
        />
        <path
          d="M78 70 Q78 42 100 42 Q122 42 122 70 L126 80 H74 Z"
          fill="#c7d2fe"
          opacity="0.4"
          stroke="#6366f1"
          strokeWidth="1.5"
        />
        <path
          d="M74 80 H126"
          stroke="#6366f1"
          strokeWidth="1.5"
          opacity="0.5"
        />
        <path
          d="M95 80 Q95 86 100 86 Q105 86 105 80"
          stroke="#6366f1"
          strokeWidth="1.5"
          opacity="0.5"
          fill="none"
        />
        {/* Lines representing text */}
        {[32, 40, 48, 56].map((y, i) => (
          <rect
            key={i}
            x="140"
            y={y}
            width={i % 2 === 0 ? 42 : 30}
            height="5"
            rx="2"
            fill="#818cf8"
            opacity="0.25"
          />
        ))}
        {/* Notification dot */}
        <circle cx="122" cy="38" r="8" fill="#f59e0b" opacity="0.8" />
        <text
          x="122"
          y="42"
          textAnchor="middle"
          fill="white"
          fontSize="9"
          fontWeight="bold"
        >
          !
        </text>
        {/* Paper notes */}
        <rect
          x="28"
          y="55"
          width="38"
          height="48"
          rx="4"
          fill="#e0e7ff"
          opacity="0.5"
          stroke="#818cf8"
          strokeWidth="1"
        />
        <rect
          x="34"
          y="62"
          width="26"
          height="4"
          rx="2"
          fill="#818cf8"
          opacity="0.4"
        />
        <rect
          x="34"
          y="70"
          width="22"
          height="3"
          rx="1.5"
          fill="#818cf8"
          opacity="0.3"
        />
        <rect
          x="34"
          y="77"
          width="24"
          height="3"
          rx="1.5"
          fill="#818cf8"
          opacity="0.3"
        />
      </svg>
    ),
  },
  {
    slug: "school-calendar",
    title: "School Calendar",
    subtitle: "Term dates & academic schedule",
    preview:
      "Week-by-week academic calendar for each term — examinations, PTA meetings, mid-term breaks, club days, and all scheduled school events at a glance.",
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
    accent: "from-teal-500 to-emerald-500",
    bg: "bg-teal-50",
    border: "border-teal-200",
    iconBg: "bg-teal-100 text-teal-700",
    tag: "Academic Year",
    illustration: (
      <svg
        viewBox="0 0 200 120"
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="30"
          y="18"
          width="140"
          height="90"
          rx="8"
          fill="#ccfbf1"
          opacity="0.4"
          stroke="#14b8a6"
          strokeWidth="1.5"
        />
        <rect
          x="30"
          y="18"
          width="140"
          height="26"
          rx="8"
          fill="#5eead4"
          opacity="0.3"
        />
        {/* Calendar header pins */}
        <rect
          x="60"
          y="12"
          width="8"
          height="14"
          rx="4"
          fill="#0d9488"
          opacity="0.5"
        />
        <rect
          x="132"
          y="12"
          width="8"
          height="14"
          rx="4"
          fill="#0d9488"
          opacity="0.5"
        />
        {/* Day grid */}
        {[0, 1, 2, 3, 4, 5, 6].map((col) =>
          [0, 1, 2, 3].map((row) => {
            const x = 44 + col * 19;
            const y = 54 + row * 16;
            const highlighted =
              (col === 1 && row === 1) ||
              (col === 3 && row === 0) ||
              (col === 5 && row === 2);
            return (
              <rect
                key={`${col}-${row}`}
                x={x - 6}
                y={y - 6}
                width="12"
                height="12"
                rx="3"
                fill={highlighted ? "#14b8a6" : "#a7f3d0"}
                opacity={highlighted ? 0.7 : 0.3}
              />
            );
          }),
        )}
        {/* Month label */}
        <text
          x="100"
          y="34"
          textAnchor="middle"
          fill="#0d9488"
          fontSize="9"
          fontWeight="bold"
          opacity="0.6"
        >
          ACADEMIC CALENDAR
        </text>
      </svg>
    ),
  },
  {
    slug: "events",
    title: "Events",
    subtitle: "Ceremonies, programmes & activities",
    preview:
      "Graduation ceremonies, opening services, sports days, teacher training, PTA meetings, and all notable school events — upcoming and past.",
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
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
    accent: "from-amber-500 to-orange-500",
    bg: "bg-amber-50",
    border: "border-amber-200",
    iconBg: "bg-amber-100 text-amber-700",
    tag: "Upcoming & Past",
    illustration: (
      <svg
        viewBox="0 0 200 120"
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Stage / podium */}
        <rect
          x="60"
          y="75"
          width="80"
          height="30"
          rx="4"
          fill="#fde68a"
          opacity="0.4"
          stroke="#f59e0b"
          strokeWidth="1.5"
        />
        <rect
          x="75"
          y="65"
          width="50"
          height="14"
          rx="3"
          fill="#fbbf24"
          opacity="0.4"
        />
        <rect
          x="85"
          y="55"
          width="30"
          height="14"
          rx="3"
          fill="#f59e0b"
          opacity="0.4"
        />
        {/* Stars */}
        <circle cx="40" cy="30" r="5" fill="#fbbf24" opacity="0.6" />
        <circle cx="40" cy="30" r="8" fill="#fbbf24" opacity="0.15" />
        <circle cx="160" cy="35" r="4" fill="#fbbf24" opacity="0.5" />
        <circle cx="155" cy="55" r="3" fill="#fbbf24" opacity="0.4" />
        <circle cx="45" cy="60" r="3" fill="#fbbf24" opacity="0.4" />
        {/* Bunting flags */}
        {[50, 70, 90, 110, 130, 150].map((x, i) => (
          <polygon
            key={i}
            points={`${x},18 ${x + 8},18 ${x + 4},30`}
            fill={i % 2 === 0 ? "#f59e0b" : "#818cf8"}
            opacity="0.4"
          />
        ))}
        <line
          x1="50"
          y1="18"
          x2="158"
          y2="18"
          stroke="#94a3b8"
          strokeWidth="1"
          opacity="0.3"
        />
        {/* Mic */}
        <rect
          x="96"
          y="42"
          width="8"
          height="14"
          rx="4"
          fill="#6366f1"
          opacity="0.4"
        />
        <path
          d="M92 52 Q92 60 100 60 Q108 60 108 52"
          stroke="#6366f1"
          strokeWidth="1.5"
          fill="none"
          opacity="0.4"
        />
        <line
          x1="100"
          y1="60"
          x2="100"
          y2="68"
          stroke="#6366f1"
          strokeWidth="1.5"
          opacity="0.3"
        />
      </svg>
    ),
  },
];

export default function NoticePage() {
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
              Stay Informed
            </span>
            <h1
              className="text-5xl lg:text-6xl font-bold text-white leading-tight mb-4"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Notice Board
            </h1>
            <p className="text-indigo-300 text-lg leading-relaxed">
              Official announcements, the academic calendar, and school events —
              everything you need to stay connected with Lutheran High School,
              Obot Idim.
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
        <span className="text-slate-600 font-medium">Notice Board</span>
      </div>

      {/* Section grid */}
      <div className="container mx-auto px-6 lg:px-16 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 xl:gap-8">
          {sections.map((sec) => (
            <Link
              key={sec.slug}
              href={`/notice/${sec.slug}`}
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
                  View {sec.title}
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
