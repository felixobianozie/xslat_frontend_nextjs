import Link from "next/link";

const sections = [
  {
    slug: "our-history",
    title: "Our History",
    subtitle: "How It All Started",
    preview:
      "The story began in 1930 when sixteen Ibesikpo villages broke from the Qua Iboe Mission and formed their own church. Within two decades, that act of faith gave birth to one of Nigeria's most celebrated secondary schools.",
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
      </svg>
    ),
    accent: "from-amber-500 to-orange-500",
    bg: "bg-amber-50",
    border: "border-amber-200",
    iconBg: "bg-amber-100 text-amber-700",
    tag: "Est. 1950",
    illustration: (
      <svg
        viewBox="0 0 200 120"
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Rolling hills */}
        <ellipse
          cx="40"
          cy="115"
          rx="60"
          ry="20"
          fill="#fef3c7"
          opacity="0.6"
        />
        <ellipse
          cx="160"
          cy="115"
          rx="60"
          ry="20"
          fill="#fde68a"
          opacity="0.5"
        />
        {/* School building */}
        <rect
          x="65"
          y="55"
          width="70"
          height="55"
          rx="2"
          fill="#fbbf24"
          opacity="0.3"
        />
        <rect
          x="75"
          y="55"
          width="50"
          height="55"
          rx="1"
          fill="#f59e0b"
          opacity="0.4"
        />
        {/* Roof */}
        <polygon points="60,55 100,25 140,55" fill="#d97706" opacity="0.5" />
        {/* Cross on top */}
        <line
          x1="100"
          y1="15"
          x2="100"
          y2="28"
          stroke="#92400e"
          strokeWidth="2.5"
          opacity="0.6"
        />
        <line
          x1="93"
          y1="20"
          x2="107"
          y2="20"
          stroke="#92400e"
          strokeWidth="2.5"
          opacity="0.6"
        />
        {/* Windows */}
        <rect
          x="80"
          y="65"
          width="14"
          height="16"
          rx="1"
          fill="#fef3c7"
          opacity="0.8"
        />
        <rect
          x="106"
          y="65"
          width="14"
          height="16"
          rx="1"
          fill="#fef3c7"
          opacity="0.8"
        />
        {/* Door */}
        <rect
          x="91"
          y="82"
          width="18"
          height="28"
          rx="2"
          fill="#92400e"
          opacity="0.4"
        />
        {/* Trees */}
        <circle cx="32" cy="75" r="14" fill="#6ee7b7" opacity="0.4" />
        <rect
          x="30"
          y="85"
          width="4"
          height="14"
          fill="#065f46"
          opacity="0.3"
        />
        <circle cx="170" cy="78" r="12" fill="#6ee7b7" opacity="0.4" />
        <rect
          x="168"
          y="87"
          width="4"
          height="12"
          fill="#065f46"
          opacity="0.3"
        />
        {/* Path */}
        <path
          d="M85 110 Q100 105 115 110"
          stroke="#d97706"
          strokeWidth="2"
          opacity="0.4"
        />
        {/* Year badge */}
        <rect
          x="148"
          y="22"
          width="42"
          height="22"
          rx="11"
          fill="#f59e0b"
          opacity="0.9"
        />
        <text
          x="169"
          y="37"
          textAnchor="middle"
          fill="white"
          fontSize="10"
          fontWeight="bold"
          fontFamily="serif"
        >
          1950
        </text>
      </svg>
    ),
  },
  {
    slug: "anthem",
    title: "School Anthem",
    subtitle: "Our Song of Excellence",
    preview:
      '"Alone gold is success; Hardwork holds the key..." Three verses that have echoed through generations of Luthiscans; a call to purpose, faith, and the relentless pursuit of excellence.',
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
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
      </svg>
    ),
    accent: "from-violet-500 to-purple-600",
    bg: "bg-violet-50",
    border: "border-violet-200",
    iconBg: "bg-violet-100 text-violet-700",
    tag: "3 Verses",
    illustration: (
      <svg
        viewBox="0 0 200 120"
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Musical staff lines */}
        {[40, 52, 64, 76, 88].map((y, i) => (
          <line
            key={i}
            x1="20"
            y1={y}
            x2="180"
            y2={y}
            stroke="#c4b5fd"
            strokeWidth="1.2"
            opacity="0.5"
          />
        ))}
        {/* Treble clef simplified */}
        <path
          d="M35 88 Q32 75 38 62 Q44 48 38 38 Q32 28 40 24 Q48 20 50 30 Q52 40 46 50 Q40 60 42 72 Q44 84 38 92"
          stroke="#7c3aed"
          strokeWidth="2"
          opacity="0.6"
          fill="none"
        />
        {/* Notes */}
        <ellipse
          cx="75"
          cy="64"
          rx="7"
          ry="5"
          fill="#8b5cf6"
          opacity="0.5"
          transform="rotate(-15 75 64)"
        />
        <line
          x1="82"
          y1="64"
          x2="82"
          y2="38"
          stroke="#8b5cf6"
          strokeWidth="1.8"
          opacity="0.5"
        />
        <ellipse
          cx="105"
          cy="52"
          rx="7"
          ry="5"
          fill="#a78bfa"
          opacity="0.5"
          transform="rotate(-15 105 52)"
        />
        <line
          x1="112"
          y1="52"
          x2="112"
          y2="28"
          stroke="#a78bfa"
          strokeWidth="1.8"
          opacity="0.5"
        />
        {/* Beam */}
        <line
          x1="82"
          y1="38"
          x2="112"
          y2="28"
          stroke="#7c3aed"
          strokeWidth="2.5"
          opacity="0.4"
        />
        <ellipse
          cx="140"
          cy="76"
          rx="7"
          ry="5"
          fill="#7c3aed"
          opacity="0.5"
          transform="rotate(-15 140 76)"
        />
        <line
          x1="147"
          y1="76"
          x2="147"
          y2="48"
          stroke="#7c3aed"
          strokeWidth="1.8"
          opacity="0.5"
        />
        {/* Stars / sparkles */}
        <circle cx="165" cy="35" r="3" fill="#f59e0b" opacity="0.7" />
        <circle cx="25" cy="105" r="2" fill="#f59e0b" opacity="0.5" />
        <circle cx="90" cy="108" r="2.5" fill="#c4b5fd" opacity="0.6" />
        {/* In Deo Stamus text base */}
        <rect
          x="55"
          y="100"
          width="90"
          height="16"
          rx="8"
          fill="#8b5cf6"
          opacity="0.15"
        />
        <text
          x="100"
          y="112"
          textAnchor="middle"
          fill="#6d28d9"
          fontSize="8"
          fontStyle="italic"
          opacity="0.8"
        >
          In Deo Stamus
        </text>
      </svg>
    ),
  },
  {
    slug: "mission-vision",
    title: "Mission & Vision",
    subtitle: "Where We're Going",
    preview:
      "To remain an international reference standard for high school education in West Africa, graduating students with exceptional abilities for innovation, resilience and excellence.",
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
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="3" />
        <line x1="12" y1="2" x2="12" y2="5" />
        <line x1="12" y1="19" x2="12" y2="22" />
        <line x1="2" y1="12" x2="5" y2="12" />
        <line x1="19" y1="12" x2="22" y2="12" />
      </svg>
    ),
    accent: "from-indigo-500 to-blue-600",
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    iconBg: "bg-indigo-100 text-indigo-700",
    tag: "Our Purpose",
    illustration: (
      <svg
        viewBox="0 0 200 120"
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Globe */}
        <circle cx="100" cy="62" r="42" fill="#eef2ff" opacity="0.7" />
        <circle
          cx="100"
          cy="62"
          r="42"
          stroke="#818cf8"
          strokeWidth="1.5"
          opacity="0.4"
        />
        {/* Latitude lines */}
        {[-20, 0, 20].map((offset, i) => (
          <ellipse
            key={i}
            cx="100"
            cy={62 + offset}
            rx="42"
            ry={14 - Math.abs(offset / 3)}
            stroke="#a5b4fc"
            strokeWidth="1"
            opacity="0.3"
          />
        ))}
        {/* Longitude lines */}
        <line
          x1="100"
          y1="20"
          x2="100"
          y2="104"
          stroke="#a5b4fc"
          strokeWidth="1"
          opacity="0.3"
        />
        <line
          x1="58"
          y1="62"
          x2="142"
          y2="62"
          stroke="#a5b4fc"
          strokeWidth="1"
          opacity="0.3"
        />
        {/* Nigeria marker */}
        <circle cx="108" cy="62" r="5" fill="#f59e0b" opacity="0.9" />
        <circle cx="108" cy="62" r="9" fill="#f59e0b" opacity="0.2" />
        {/* Rocket / arrow upward */}
        <path d="M142 30 L148 55 L136 55 Z" fill="#6366f1" opacity="0.5" />
        <rect
          x="140"
          y="53"
          width="8"
          height="10"
          rx="1"
          fill="#4f46e5"
          opacity="0.4"
        />
        <circle cx="144" cy="40" r="4" fill="#818cf8" opacity="0.5" />
        <path
          d="M136 60 L132 68"
          stroke="#f59e0b"
          strokeWidth="2"
          opacity="0.5"
        />
        <path
          d="M152 60 L156 68"
          stroke="#f59e0b"
          strokeWidth="2"
          opacity="0.5"
        />
        {/* Stars */}
        <circle cx="28" cy="25" r="2.5" fill="#fbbf24" opacity="0.7" />
        <circle cx="172" cy="28" r="2" fill="#fbbf24" opacity="0.5" />
        <circle cx="50" cy="105" r="1.5" fill="#a5b4fc" opacity="0.6" />
      </svg>
    ),
  },
  {
    slug: "prospectus",
    title: "Student Prospectus",
    subtitle: "What to Bring",
    preview:
      "Everything a new or returning student needs to know before resumption, from the day student checklist to the full boarding requirements including house dues and bedding specifications.",
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
    tag: "Day & Boarding",
    illustration: (
      <svg
        viewBox="0 0 200 120"
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Backpack */}
        <rect
          x="68"
          y="28"
          width="64"
          height="72"
          rx="12"
          fill="#99f6e4"
          opacity="0.5"
        />
        <rect
          x="68"
          y="28"
          width="64"
          height="72"
          rx="12"
          stroke="#14b8a6"
          strokeWidth="1.5"
          opacity="0.4"
        />
        {/* Strap top */}
        <path
          d="M80 28 Q80 18 100 18 Q120 18 120 28"
          stroke="#0d9488"
          strokeWidth="2"
          opacity="0.4"
          fill="none"
        />
        {/* Pocket */}
        <rect
          x="78"
          y="70"
          width="44"
          height="24"
          rx="6"
          fill="#5eead4"
          opacity="0.4"
        />
        <line
          x1="100"
          y1="70"
          x2="100"
          y2="94"
          stroke="#0d9488"
          strokeWidth="1"
          opacity="0.3"
        />
        {/* Zipper dots */}
        {[83, 90, 97, 104, 111, 118].map((x, i) => (
          <circle key={i} cx={x} cy="70" r="1.5" fill="#0d9488" opacity="0.4" />
        ))}
        {/* Checklist items floating */}
        <rect
          x="140"
          y="30"
          width="42"
          height="12"
          rx="3"
          fill="#d1fae5"
          opacity="0.7"
        />
        <circle cx="147" cy="36" r="3" fill="#10b981" opacity="0.5" />
        <rect
          x="153"
          y="33"
          width="24"
          height="2"
          rx="1"
          fill="#065f46"
          opacity="0.3"
        />
        <rect
          x="153"
          y="37"
          width="18"
          height="2"
          rx="1"
          fill="#065f46"
          opacity="0.3"
        />
        <rect
          x="140"
          y="48"
          width="42"
          height="12"
          rx="3"
          fill="#d1fae5"
          opacity="0.7"
        />
        <circle cx="147" cy="54" r="3" fill="#10b981" opacity="0.5" />
        <rect
          x="153"
          y="51"
          width="20"
          height="2"
          rx="1"
          fill="#065f46"
          opacity="0.3"
        />
        <rect
          x="153"
          y="55"
          width="28"
          height="2"
          rx="1"
          fill="#065f46"
          opacity="0.3"
        />
        <rect
          x="140"
          y="66"
          width="42"
          height="12"
          rx="3"
          fill="#d1fae5"
          opacity="0.7"
        />
        <circle cx="147" cy="72" r="3" fill="#10b981" opacity="0.5" />
        <rect
          x="153"
          y="69"
          width="26"
          height="2"
          rx="1"
          fill="#065f46"
          opacity="0.3"
        />
        {/* Bible */}
        <rect
          x="20"
          y="45"
          width="36"
          height="46"
          rx="3"
          fill="#6ee7b7"
          opacity="0.4"
        />
        <line
          x1="38"
          y1="45"
          x2="38"
          y2="91"
          stroke="#0d9488"
          strokeWidth="1"
          opacity="0.4"
        />
        <path
          d="M32 60 h12 M38 54 v12"
          stroke="#0d9488"
          strokeWidth="2"
          opacity="0.4"
        />
      </svg>
    ),
  },
  {
    slug: "uniforms",
    title: "School Uniforms",
    subtitle: "Dress with Pride",
    preview:
      "From junior school whites to senior sky-blues, and ceremonial whites for special occasions; a full breakdown of what every student wears to represent LHS with pride.",
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
        <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z" />
      </svg>
    ),
    accent: "from-sky-500 to-blue-500",
    bg: "bg-sky-50",
    border: "border-sky-200",
    iconBg: "bg-sky-100 text-sky-700",
    tag: "Regular & Ceremonial",
    illustration: (
      <svg
        viewBox="0 0 200 120"
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Boy shirt - left */}
        <path
          d="M42 38 L30 50 L38 55 L38 90 L62 90 L62 55 L70 50 L58 38 Q50 34 42 38Z"
          fill="#bae6fd"
          opacity="0.6"
        />
        <path
          d="M50 38 L50 55"
          stroke="#0ea5e9"
          strokeWidth="1.5"
          opacity="0.4"
        />
        {/* Collar */}
        <path
          d="M44 38 L50 46 L56 38"
          stroke="#0284c7"
          strokeWidth="1.5"
          fill="none"
          opacity="0.5"
        />
        {/* Boy shorts */}
        <rect
          x="38"
          y="88"
          width="12"
          height="18"
          rx="2"
          fill="#e0f2fe"
          opacity="0.6"
        />
        <rect
          x="52"
          y="88"
          width="12"
          height="18"
          rx="2"
          fill="#e0f2fe"
          opacity="0.6"
        />
        <rect
          x="36"
          y="86"
          width="28"
          height="6"
          rx="1"
          fill="#7dd3fc"
          opacity="0.5"
        />

        {/* Girl dress - right */}
        <path
          d="M130 30 L120 44 L128 50 L124 92 L156 92 L152 50 L160 44 L150 30 Q140 26 130 30Z"
          fill="#f0abfc"
          opacity="0.5"
        />
        <path
          d="M140 30 L140 50"
          stroke="#d946ef"
          strokeWidth="1.5"
          opacity="0.4"
        />
        {/* Collar girl */}
        <path
          d="M132 30 L140 40 L148 30"
          stroke="#a21caf"
          strokeWidth="1.5"
          fill="none"
          opacity="0.5"
        />
        {/* Pleats at hem */}
        {[128, 134, 140, 146, 152].map((x, i) => (
          <line
            key={i}
            x1={x}
            y1="80"
            x2={x}
            y2="92"
            stroke="#e879f9"
            strokeWidth="1"
            opacity="0.4"
          />
        ))}
        {/* Beret for girls */}
        <ellipse cx="140" cy="22" rx="14" ry="7" fill="#c026d3" opacity="0.3" />
        <circle cx="140" cy="18" r="3" fill="#a21caf" opacity="0.4" />

        {/* LHS badge center */}
        <circle cx="100" cy="55" r="20" fill="#e0e7ff" opacity="0.5" />
        <circle
          cx="100"
          cy="55"
          r="20"
          stroke="#6366f1"
          strokeWidth="1.5"
          opacity="0.3"
        />
        <text
          x="100"
          y="52"
          textAnchor="middle"
          fill="#4338ca"
          fontSize="9"
          fontWeight="bold"
          opacity="0.7"
        >
          LHS
        </text>
        <text
          x="100"
          y="63"
          textAnchor="middle"
          fill="#4338ca"
          fontSize="7"
          opacity="0.5"
        >
          OBOT IDIM
        </text>
      </svg>
    ),
  },
  {
    slug: "rules",
    title: "Golden Rules",
    subtitle: "Code of Conduct",
    preview:
      "Lutheran High School upholds a high standard of Christian discipline. From movement and feeding to phones and academic integrity; every rule is designed to build character.",
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
    accent: "from-rose-500 to-red-500",
    bg: "bg-rose-50",
    border: "border-rose-200",
    iconBg: "bg-rose-100 text-rose-700",
    tag: "14 Sections",
    illustration: (
      <svg
        viewBox="0 0 200 120"
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Scroll / parchment */}
        <rect
          x="50"
          y="15"
          width="100"
          height="90"
          rx="6"
          fill="#fff1f2"
          opacity="0.8"
        />
        <rect
          x="50"
          y="15"
          width="100"
          height="90"
          rx="6"
          stroke="#fda4af"
          strokeWidth="1.5"
          opacity="0.5"
        />
        {/* Scroll top roll */}
        <ellipse cx="100" cy="15" rx="50" ry="7" fill="#fecdd3" opacity="0.6" />
        <ellipse
          cx="100"
          cy="105"
          rx="50"
          ry="7"
          fill="#fecdd3"
          opacity="0.6"
        />
        {/* Shield */}
        <path
          d="M85 35 L100 30 L115 35 L115 52 Q115 62 100 68 Q85 62 85 52 Z"
          fill="#f43f5e"
          opacity="0.25"
        />
        <path
          d="M85 35 L100 30 L115 35 L115 52 Q115 62 100 68 Q85 62 85 52 Z"
          stroke="#e11d48"
          strokeWidth="1.5"
          opacity="0.4"
        />
        <polyline
          points="93 50 98 55 108 44"
          stroke="#e11d48"
          strokeWidth="2"
          opacity="0.5"
        />
        {/* Rule lines */}
        {[78, 86, 94].map((y, i) => (
          <line
            key={i}
            x1="65"
            y1={y}
            x2="135"
            y2={y}
            stroke="#fda4af"
            strokeWidth="1.2"
            opacity="0.4"
          />
        ))}
        <circle cx="68" cy="78" r="2.5" fill="#f43f5e" opacity="0.4" />
        <circle cx="68" cy="86" r="2.5" fill="#f43f5e" opacity="0.4" />
        <circle cx="68" cy="94" r="2.5" fill="#f43f5e" opacity="0.4" />
      </svg>
    ),
  },
  {
    slug: "board-of-governors",
    title: "Board of Governors",
    subtitle: "Our Leadership",
    preview:
      "The Lutheran School Management Board (LSMB) provides the strategic governance and oversight that has kept LHS on a consistent path of excellence for many years.",
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
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    accent: "from-slate-600 to-slate-800",
    bg: "bg-slate-50",
    border: "border-slate-200",
    iconBg: "bg-slate-100 text-slate-700",
    tag: "6 Members",
    illustration: (
      <svg
        viewBox="0 0 200 120"
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Table */}
        <rect
          x="40"
          y="70"
          width="120"
          height="8"
          rx="4"
          fill="#cbd5e1"
          opacity="0.6"
        />
        {/* 3 people seated */}
        {[65, 100, 135].map((x, i) => (
          <g key={i}>
            <circle
              cx={x}
              cy="52"
              r="10"
              fill="#94a3b8"
              opacity={0.4 + i * 0.1}
            />
            <path
              d={`M${x - 12} 70 Q${x - 8} 62 ${x} 62 Q${x + 8} 62 ${x + 12} 70`}
              fill="#94a3b8"
              opacity={0.3 + i * 0.1}
            />
          </g>
        ))}
        {/* 2 people top row */}
        {[82, 118].map((x, i) => (
          <g key={i}>
            <circle
              cx={x}
              cy="28"
              r="8"
              fill="#64748b"
              opacity={0.4 + i * 0.1}
            />
            <path
              d={`M${x - 9} 44 Q${x - 6} 38 ${x} 38 Q${x + 6} 38 ${x + 9} 44`}
              fill="#64748b"
              opacity={0.3}
            />
          </g>
        ))}
        {/* Gavel */}
        <rect
          x="152"
          y="40"
          width="26"
          height="8"
          rx="4"
          fill="#475569"
          opacity="0.5"
          transform="rotate(-30 165 44)"
        />
        <line
          x1="162"
          y1="50"
          x2="150"
          y2="68"
          stroke="#334155"
          strokeWidth="3"
          opacity="0.4"
          strokeLinecap="round"
        />
        {/* Stars of authority */}
        <circle cx="28" cy="30" r="4" fill="#fbbf24" opacity="0.5" />
        <circle cx="28" cy="44" r="3" fill="#fbbf24" opacity="0.4" />
        <circle cx="28" cy="56" r="2" fill="#fbbf24" opacity="0.3" />
      </svg>
    ),
  },
  {
    slug: "management-staff",
    title: "Management Staff",
    subtitle: "The Team Behind Excellence",
    preview:
      "Meet the dedicated administrators and educators whose daily leadership shapes the Luthisco experience, from the Vice Principals to the Compound Master and Boarding Mistress.",
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
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    ),
    accent: "from-indigo-600 to-violet-600",
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    iconBg: "bg-indigo-100 text-indigo-700",
    tag: "4 Officers",
    illustration: (
      <svg
        viewBox="0 0 200 120"
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* 4 staff cards */}
        {[20, 62, 104, 146].map((x, i) => (
          <g key={i}>
            <rect
              x={x}
              y="28"
              width="36"
              height="64"
              rx="6"
              fill="#e0e7ff"
              opacity={0.5 + i * 0.05}
            />
            <circle
              cx={x + 18}
              cy="48"
              r="12"
              fill="#818cf8"
              opacity={0.35 + i * 0.05}
            />
            <rect
              x={x + 6}
              y="64"
              width="24"
              height="3"
              rx="1.5"
              fill="#6366f1"
              opacity="0.4"
            />
            <rect
              x={x + 10}
              y="70"
              width="16"
              height="2"
              rx="1"
              fill="#a5b4fc"
              opacity="0.4"
            />
            <rect
              x={x + 8}
              y="76"
              width="20"
              height="2"
              rx="1"
              fill="#a5b4fc"
              opacity="0.3"
            />
          </g>
        ))}
        {/* Connecting line above */}
        <line
          x1="38"
          y1="28"
          x2="162"
          y2="28"
          stroke="#6366f1"
          strokeWidth="1.5"
          opacity="0.25"
          strokeDasharray="4 3"
        />
        {/* LHS badge top center */}
        <circle cx="100" cy="14" r="9" fill="#4f46e5" opacity="0.2" />
        <text
          x="100"
          y="17"
          textAnchor="middle"
          fill="#4338ca"
          fontSize="7"
          fontWeight="bold"
          opacity="0.6"
        >
          LHS
        </text>
      </svg>
    ),
  },
  {
    slug: "teaching-learning",
    title: "Teaching & Learning",
    subtitle: "Our Approach",
    preview:
      "Adaptive, real-world and technology-enhanced: four core methods guide every classroom at LHS. We cultivate critical thinkers, not rote memorisers.",
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
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
    accent: "from-emerald-500 to-teal-500",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    iconBg: "bg-emerald-100 text-emerald-700",
    tag: "4 Approaches",
    illustration: (
      <svg
        viewBox="0 0 200 120"
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Chalkboard */}
        <rect
          x="30"
          y="18"
          width="140"
          height="78"
          rx="6"
          fill="#d1fae5"
          opacity="0.6"
        />
        <rect
          x="30"
          y="18"
          width="140"
          height="78"
          rx="6"
          stroke="#34d399"
          strokeWidth="1.5"
          opacity="0.4"
        />
        {/* Frame border detail */}
        <rect
          x="36"
          y="24"
          width="128"
          height="66"
          rx="4"
          fill="none"
          stroke="#6ee7b7"
          strokeWidth="1"
          opacity="0.5"
        />
        {/* Light bulb idea */}
        <circle cx="80" cy="52" r="14" fill="#a7f3d0" opacity="0.6" />
        <path
          d="M76 57 Q76 63 80 63 Q84 63 84 57"
          fill="#10b981"
          opacity="0.3"
        />
        <line
          x1="76"
          y1="63"
          x2="84"
          y2="63"
          stroke="#059669"
          strokeWidth="1.5"
          opacity="0.5"
        />
        <path
          d="M80 38 Q80 42 80 48"
          stroke="#065f46"
          strokeWidth="2"
          opacity="0.3"
        />
        <path
          d="M72 42 Q76 46 80 48"
          stroke="#065f46"
          strokeWidth="1.5"
          opacity="0.25"
        />
        <path
          d="M88 42 Q84 46 80 48"
          stroke="#065f46"
          strokeWidth="1.5"
          opacity="0.25"
        />
        {/* Rays */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => {
          const rad = (deg * Math.PI) / 180;
          const x1 = 80 + 16 * Math.cos(rad);
          const y1 = 52 + 16 * Math.sin(rad);
          const x2 = 80 + 20 * Math.cos(rad);
          const y2 = 52 + 20 * Math.sin(rad);
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#34d399"
              strokeWidth="1.5"
              opacity="0.35"
            />
          );
        })}
        {/* Formulas / writing */}
        <line
          x1="108"
          y1="40"
          x2="152"
          y2="40"
          stroke="#6ee7b7"
          strokeWidth="1.5"
          opacity="0.5"
        />
        <line
          x1="108"
          y1="50"
          x2="145"
          y2="50"
          stroke="#6ee7b7"
          strokeWidth="1.2"
          opacity="0.4"
        />
        <line
          x1="108"
          y1="60"
          x2="150"
          y2="60"
          stroke="#6ee7b7"
          strokeWidth="1.2"
          opacity="0.4"
        />
        <line
          x1="108"
          y1="70"
          x2="135"
          y2="70"
          stroke="#6ee7b7"
          strokeWidth="1"
          opacity="0.35"
        />
        {/* Chalk tray */}
        <rect
          x="30"
          y="93"
          width="140"
          height="6"
          rx="2"
          fill="#6ee7b7"
          opacity="0.3"
        />
        <rect
          x="38"
          y="94"
          width="10"
          height="4"
          rx="1"
          fill="#f9fafb"
          opacity="0.6"
        />
        <rect
          x="54"
          y="94"
          width="7"
          height="4"
          rx="1"
          fill="#f9fafb"
          opacity="0.5"
        />
      </svg>
    ),
  },
  {
    slug: "why-lhs",
    title: "Why LHS?",
    subtitle: "We Are the Ultimate",
    preview:
      "Eighteen reasons why Lutheran High School stands apart; from full boarding and on-campus staff residency to UNESCO recognition and a 100% WAEC pass rate over decades.",
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
    accent: "from-amber-400 to-yellow-500",
    bg: "bg-amber-50",
    border: "border-amber-200",
    iconBg: "bg-amber-100 text-amber-700",
    tag: "18 Reasons",
    illustration: (
      <svg
        viewBox="0 0 200 120"
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Trophy */}
        <rect
          x="84"
          y="90"
          width="32"
          height="8"
          rx="2"
          fill="#fbbf24"
          opacity="0.5"
        />
        <rect
          x="90"
          y="80"
          width="20"
          height="12"
          rx="2"
          fill="#f59e0b"
          opacity="0.4"
        />
        <path
          d="M72 35 L72 68 Q72 78 100 78 Q128 78 128 68 L128 35 Z"
          fill="#fde68a"
          opacity="0.5"
        />
        <path
          d="M72 35 L72 68 Q72 78 100 78 Q128 78 128 68 L128 35 Z"
          stroke="#f59e0b"
          strokeWidth="1.5"
          opacity="0.4"
        />
        {/* Trophy handles */}
        <path
          d="M72 42 Q56 42 56 55 Q56 68 72 68"
          stroke="#f59e0b"
          strokeWidth="2.5"
          fill="none"
          opacity="0.4"
        />
        <path
          d="M128 42 Q144 42 144 55 Q144 68 128 68"
          stroke="#f59e0b"
          strokeWidth="2.5"
          fill="none"
          opacity="0.4"
        />
        {/* Star inside */}
        <polygon
          points="100,46 103,54 111,54 105,59 107,67 100,62 93,67 95,59 89,54 97,54"
          fill="#f59e0b"
          opacity="0.5"
        />
        {/* Sparkles around */}
        <circle cx="45" cy="30" r="4" fill="#fbbf24" opacity="0.6" />
        <circle cx="45" cy="30" r="7" fill="#fbbf24" opacity="0.15" />
        <circle cx="155" cy="35" r="3.5" fill="#fbbf24" opacity="0.5" />
        <circle cx="155" cy="35" r="6" fill="#fbbf24" opacity="0.15" />
        <circle cx="30" cy="75" r="3" fill="#fbbf24" opacity="0.4" />
        <circle cx="170" cy="72" r="3.5" fill="#fbbf24" opacity="0.4" />
        {/* Laurel leaves */}
        <path
          d="M60 90 Q50 80 55 70 Q65 78 60 90Z"
          fill="#86efac"
          opacity="0.5"
        />
        <path
          d="M60 90 Q52 82 58 73 Q67 80 60 90Z"
          fill="#4ade80"
          opacity="0.3"
        />
        <path
          d="M140 90 Q150 80 145 70 Q135 78 140 90Z"
          fill="#86efac"
          opacity="0.5"
        />
        <path
          d="M140 90 Q148 82 142 73 Q133 80 140 90Z"
          fill="#4ade80"
          opacity="0.3"
        />
        {/* Base label */}
        <rect
          x="78"
          y="95"
          width="44"
          height="18"
          rx="4"
          fill="#f59e0b"
          opacity="0.3"
        />
        <text
          x="100"
          y="108"
          textAnchor="middle"
          fill="#92400e"
          fontSize="8"
          fontWeight="bold"
          opacity="0.7"
        >
          EXCELLENCE
        </text>
      </svg>
    ),
  },
];

export default function AboutPage() {
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
        <div className="absolute top-0 right-0 w-150 h-150 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-64 h-64 rounded-full bg-amber-400/10 translate-y-1/2 pointer-events-none" />
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="relative container mx-auto px-6 lg:px-16 py-16 lg:py-24">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 text-amber-300 text-xs font-bold uppercase tracking-widest mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Established 1950
            </span>
            <h1
              className="text-5xl lg:text-6xl font-bold text-white leading-tight mb-4"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              About Lutheran <br className="hidden lg:block" />
              High School
            </h1>
            <p className="text-indigo-300 text-lg leading-relaxed">
              Over seven decades of academic excellence, Christian values, and
              transforming young minds into global leaders from Obot Idim,
              Ibesikpo Asutan, Akwa Ibom State.
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
        <span className="text-slate-600 font-medium">About Us</span>
      </div>

      {/* ── Section grid ── */}
      <div className="container mx-auto px-6 lg:px-16 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 xl:gap-8">
          {sections.map((sec) => (
            <Link
              key={sec.slug}
              href={`/about/${sec.slug}`}
              className={`group relative flex flex-col rounded-3xl border ${sec.border} ${sec.bg} overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300`}
            >
              {/* Illustration area */}
              <div className="relative h-36 overflow-hidden flex items-center justify-center p-4">
                {sec.illustration}
              </div>

              {/* Content */}
              <div className="flex flex-col flex-1 p-6 pt-0">
                {/* Tag */}
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">
                  <span
                    className={`w-1.5 h-1.5 rounded-full bg-linear-to-r ${sec.accent} inline-block`}
                  />
                  {sec.tag}
                </span>

                {/* Icon + title */}
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

                {/* Preview */}
                <p className="text-slate-500 text-sm leading-relaxed flex-1 mb-5">
                  {sec.preview}
                </p>

                {/* CTA */}
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
    </main>
  );
}
