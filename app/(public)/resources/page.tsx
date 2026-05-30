import Link from "next/link";

const sections = [
  {
    slug: "photos",
    title: "Photo Gallery",
    subtitle: "Memories in frames",
    preview:
      "A growing archive of photo collections from sports days, cultural nights, graduation ceremonies, campus life, and much more inside the Luthisco Republic.",
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
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    ),
    accent: "from-violet-500 to-indigo-600",
    bg: "bg-violet-50",
    border: "border-violet-200",
    iconBg: "bg-violet-100 text-violet-700",
    tag: "Collections",
    illustration: (
      <svg
        viewBox="0 0 200 120"
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background card */}
        <rect
          x="20"
          y="30"
          width="80"
          height="60"
          rx="6"
          fill="#e0e7ff"
          opacity="0.5"
        />
        <rect
          x="20"
          y="30"
          width="80"
          height="60"
          rx="6"
          stroke="#818cf8"
          strokeWidth="1.2"
          opacity="0.4"
        />
        {/* Mountains inside */}
        <polygon points="30,78 55,48 80,78" fill="#a5b4fc" opacity="0.4" />
        <polygon points="50,78 70,55 90,78" fill="#818cf8" opacity="0.3" />
        {/* Sun */}
        <circle cx="75" cy="44" r="7" fill="#fbbf24" opacity="0.5" />
        {/* Overlapping card 2 */}
        <rect
          x="75"
          y="22"
          width="80"
          height="60"
          rx="6"
          fill="#ddd6fe"
          opacity="0.6"
        />
        <rect
          x="75"
          y="22"
          width="80"
          height="60"
          rx="6"
          stroke="#7c3aed"
          strokeWidth="1.2"
          opacity="0.35"
        />
        {/* Simple portrait in card 2 */}
        <circle cx="115" cy="40" r="10" fill="#c4b5fd" opacity="0.5" />
        <path d="M98 75 Q115 60 132 75" fill="#a78bfa" opacity="0.3" />
        {/* Overlapping card 3 */}
        <rect
          x="48"
          y="50"
          width="80"
          height="58"
          rx="6"
          fill="#ede9fe"
          opacity="0.7"
        />
        <rect
          x="48"
          y="50"
          width="80"
          height="58"
          rx="6"
          stroke="#6d28d9"
          strokeWidth="1.2"
          opacity="0.35"
        />
        {/* Grid of dots representing photo grid */}
        {[0, 1, 2].map((col) =>
          [0, 1].map((row) => (
            <rect
              key={`${col}-${row}`}
              x={60 + col * 22}
              y={62 + row * 20}
              width="16"
              height="14"
              rx="2"
              fill="#8b5cf6"
              opacity="0.25"
            />
          )),
        )}
        {/* Camera icon */}
        <rect
          x="148"
          y="78"
          width="30"
          height="22"
          rx="4"
          fill="#7c3aed"
          opacity="0.2"
        />
        <circle cx="163" cy="89" r="6" fill="#6d28d9" opacity="0.3" />
        <rect
          x="155"
          y="74"
          width="10"
          height="5"
          rx="1"
          fill="#7c3aed"
          opacity="0.2"
        />
      </svg>
    ),
  },
  {
    slug: "videos",
    title: "Video Gallery",
    subtitle: "Moments in motion",
    preview:
      "Watch video highlights from interhouse sports, cultural performances, graduation ceremonies, and other memorable events across the Luthisco Republic.",
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
        <polygon points="23 7 16 12 23 17 23 7" />
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
      </svg>
    ),
    accent: "from-rose-500 to-orange-500",
    bg: "bg-rose-50",
    border: "border-rose-200",
    iconBg: "bg-rose-100 text-rose-700",
    tag: "YouTube",
    illustration: (
      <svg
        viewBox="0 0 200 120"
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Main video frame */}
        <rect
          x="25"
          y="22"
          width="150"
          height="76"
          rx="8"
          fill="#fee2e2"
          opacity="0.5"
        />
        <rect
          x="25"
          y="22"
          width="150"
          height="76"
          rx="8"
          stroke="#f87171"
          strokeWidth="1.2"
          opacity="0.4"
        />
        {/* Play button */}
        <circle cx="100" cy="60" r="20" fill="#ef4444" opacity="0.25" />
        <circle
          cx="100"
          cy="60"
          r="20"
          stroke="#ef4444"
          strokeWidth="1.5"
          opacity="0.4"
        />
        <polygon points="94,52 94,68 112,60" fill="#ef4444" opacity="0.5" />
        {/* Progress bar */}
        <rect
          x="35"
          y="86"
          width="130"
          height="4"
          rx="2"
          fill="#fecaca"
          opacity="0.5"
        />
        <rect
          x="35"
          y="86"
          width="55"
          height="4"
          rx="2"
          fill="#f87171"
          opacity="0.6"
        />
        <circle cx="90" cy="88" r="4" fill="#ef4444" opacity="0.5" />
        {/* Film strip top */}
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <rect
            key={i}
            x={25 + i * 22}
            y="22"
            width="14"
            height="8"
            rx="1"
            fill="#f87171"
            opacity="0.1"
          />
        ))}
        {/* YouTube logo hint */}
        <rect
          x="154"
          y="25"
          width="18"
          height="13"
          rx="3"
          fill="#ef4444"
          opacity="0.4"
        />
        <polygon points="160,29 160,35 167,32" fill="white" opacity="0.6" />
      </svg>
    ),
  },
];

export default function ResourcesPage() {
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
              Media Archive
            </span>
            <h1
              className="text-5xl lg:text-6xl font-bold text-white leading-tight mb-4"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Resources
            </h1>
            <p className="text-indigo-300 text-lg leading-relaxed">
              Photos, videos, and media collections celebrating the spirit,
              culture, and achievements of Lutheran High School, Obot Idim.
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
        <span className="text-slate-600 font-medium">Resources</span>
      </div>

      {/* Section cards */}
      <div className="container mx-auto px-6 lg:px-16 pb-24">
        <div className="text-center mb-14">
          <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-violet-600 mb-3">
            Media
          </span>
          <h2
            className="text-4xl lg:text-5xl font-bold text-indigo-950 mb-4"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Our Gallery
          </h2>
          <p className="text-slate-500 max-w-xl mx-auto text-base lg:text-lg leading-relaxed">
            Browse our growing archive of photos and videos documenting life
            inside the Luthisco Republic.
          </p>
          <div className="flex items-center justify-center gap-3 mt-6">
            <div className="w-12 h-px bg-indigo-300" />
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <div className="w-12 h-px bg-indigo-300" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {sections.map((sec) => (
            <Link
              key={sec.slug}
              href={`/resources/${sec.slug}`}
              className={`group relative flex flex-col rounded-3xl border ${sec.border} ${sec.bg} overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300`}
            >
              {/* Illustration */}
              <div className="relative h-44 overflow-hidden flex items-center justify-center p-4">
                {sec.illustration}
              </div>

              {/* Content */}
              <div className="flex flex-col flex-1 p-7 pt-0">
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
                      className="text-indigo-950 font-bold text-xl leading-tight"
                      style={{
                        fontFamily: "'Playfair Display', Georgia, serif",
                      }}
                    >
                      {sec.title}
                    </h2>
                    <p className="text-slate-400 text-xs">{sec.subtitle}</p>
                  </div>
                </div>

                <p className="text-slate-500 text-sm leading-relaxed flex-1 mb-6">
                  {sec.preview}
                </p>

                <div className="flex items-center gap-1.5 text-sm font-semibold text-indigo-600 group-hover:text-indigo-800 transition-colors">
                  Browse gallery
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
