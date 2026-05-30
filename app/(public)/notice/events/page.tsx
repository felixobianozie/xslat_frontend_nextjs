import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────────────────

interface SchoolEvent {
  id: string;
  title: string;
  // ISO date string used for comparison e.g. "2024-09-03"
  isoDate: string;
  // Display-friendly date e.g. "3rd Sept, 2024"
  displayDate: string;
  frequency: string; // e.g. "Yearly", "Termly", "Random"
  timeRange: string; // e.g. "9:00am - 1:00pm"
  venue: string; // e.g. "School Chapel"
  description: string;
  // Optional image path. Leave as empty string "" for fallback SVG.
  image: string;
  // Colour theme for the fallback SVG illustration
  color: "indigo" | "amber" | "teal" | "violet" | "rose";
}

interface EventTermGroup {
  termLabel: string; // e.g. "First Term 2024/2025"
  termId: string; // anchor slug
  events: SchoolEvent[];
}

// ── Data ──────────────────────────────────────────────────────────────────────
// To add an event: add to the relevant term's events array.
// isoDate drives the "Upcoming" / "Past" badge automatically.

const eventData: EventTermGroup[] = [
  {
    termLabel: "First Term 2024/2025",
    termId: "first-term-2024-2025",
    events: [
      {
        id: "teacher-training-sept-2024",
        title: "Professional Teachers Training",
        isoDate: "2024-09-03",
        displayDate: "3rd - 5th Sept, 2024",
        frequency: "Random",
        timeRange: "9:00am - 4:00pm",
        venue: "School Chapel",
        description:
          "Lutheran High School teachers training as organised by the Alumni was successfully held from Tuesday 3rd September to Thursday 5th September, 2024.",
        image: "",
        color: "indigo",
      },
    ],
  },
  {
    termLabel: "Third Term 2023/2024",
    termId: "third-term-2023-2024",
    events: [
      {
        id: "graduation-aug-2024",
        title: "Graduation Ceremony",
        isoDate: "2024-08-13",
        displayDate: "13th Aug, 2024",
        frequency: "Yearly",
        timeRange: "9:00am - 1:00pm",
        venue: "School Chapel",
        description:
          "Graduation ceremony and award presentations for the 2023/2024 academic session and graduands.",
        image: "",
        color: "amber",
      },
    ],
  },
  {
    termLabel: "First Term 2023/2024",
    termId: "first-term-2023-2024",
    events: [
      {
        id: "opening-service-sept-2023",
        title: "Opening Service",
        isoDate: "2023-09-17",
        displayDate: "17th Sept, 2023",
        frequency: "Termly",
        timeRange: "9:00am - 12:00pm",
        venue: "School Chapel",
        description:
          "First term opening service for all teachers and students. Parents and guardians are highly invited.",
        image: "",
        color: "teal",
      },
    ],
  },
];

// Build flat term list for navigation tags
const allTerms = eventData.map((t) => ({
  termLabel: t.termLabel,
  termId: t.termId,
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

// Compare isoDate string to today to determine badge type
function getEventStatus(isoDate: string): "upcoming" | "past" {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const eventDate = new Date(isoDate);
  return eventDate >= today ? "upcoming" : "past";
}

// Fallback SVG illustrations keyed by color theme
function FallbackIllustration({
  color,
  title,
}: {
  color: SchoolEvent["color"];
  title: string;
}) {
  const palettes = {
    indigo: {
      bg: "#eef2ff",
      stroke: "#6366f1",
      fill: "#a5b4fc",
      accent: "#4338ca",
    },
    amber: {
      bg: "#fefce8",
      stroke: "#f59e0b",
      fill: "#fde68a",
      accent: "#b45309",
    },
    teal: {
      bg: "#f0fdfa",
      stroke: "#14b8a6",
      fill: "#99f6e4",
      accent: "#0f766e",
    },
    violet: {
      bg: "#f5f3ff",
      stroke: "#8b5cf6",
      fill: "#c4b5fd",
      accent: "#6d28d9",
    },
    rose: {
      bg: "#fff1f2",
      stroke: "#f43f5e",
      fill: "#fda4af",
      accent: "#be123c",
    },
  };
  const p = palettes[color];

  return (
    <svg
      viewBox="0 0 400 200"
      className="w-full h-full"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="400" height="200" fill={p.bg} />
      {/* Decorative shapes */}
      <circle cx="320" cy="40" r="60" fill={p.fill} opacity="0.3" />
      <circle cx="80" cy="160" r="50" fill={p.fill} opacity="0.2" />
      {/* Star */}
      <polygon
        points="200,50 210,80 240,80 218,98 226,128 200,112 174,128 182,98 160,80 190,80"
        fill={p.fill}
        stroke={p.stroke}
        strokeWidth="1.5"
        opacity="0.6"
      />
      {/* Title text */}
      <text
        x="200"
        y="158"
        textAnchor="middle"
        fill={p.accent}
        fontSize="13"
        fontWeight="bold"
        fontFamily="'Playfair Display', Georgia, serif"
        opacity="0.7"
      >
        {title.length > 28 ? title.slice(0, 26) + "…" : title}
      </text>
      {/* Bottom line */}
      <line
        x1="120"
        y1="168"
        x2="280"
        y2="168"
        stroke={p.stroke}
        strokeWidth="1"
        opacity="0.3"
      />
    </svg>
  );
}

// Frequency badge
function FrequencyBadge({ frequency }: { frequency: string }) {
  const styles: Record<string, string> = {
    Yearly: "bg-indigo-100 text-indigo-700 border-indigo-200",
    Termly: "bg-teal-100 text-teal-700 border-teal-200",
    Random: "bg-slate-100 text-slate-600 border-slate-200",
    Monthly: "bg-violet-100 text-violet-700 border-violet-200",
    Weekly: "bg-amber-100 text-amber-700 border-amber-200",
  };
  const cls =
    styles[frequency] ?? "bg-slate-100 text-slate-600 border-slate-200";
  return (
    <span
      className={`inline-block px-2.5 py-0.5 rounded-full border text-xs font-semibold ${cls}`}
    >
      {frequency}
    </span>
  );
}

// ── Back link ─────────────────────────────────────────────────────────────────

function BackLink() {
  return (
    <Link
      href="/notice"
      className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-600 transition-colors"
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
      Back to Notice Board
    </Link>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function EventsPage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div
        className="relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #78350f 100%)",
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
              Notice Board
            </span>
            <h1
              className="text-5xl lg:text-6xl font-bold text-white leading-tight mb-4"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Events
            </h1>
            <p className="text-indigo-300 text-lg leading-relaxed">
              Graduation ceremonies, opening services, sports days, teacher
              training, and all notable school events — upcoming and past.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 lg:px-16 py-12 max-w-5xl">
        <div className="my-4">
          <BackLink />
        </div>

        {/* Legend */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-10 flex flex-wrap gap-x-8 gap-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 w-full mb-1">
            Status Legend
          </p>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
              Upcoming
            </span>
            Event is yet to take place
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-500 text-xs font-bold">
              Past
            </span>
            Event has already taken place
          </div>
        </div>

        {/* Term navigation tags */}
        <div className="mb-12">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-4">
            Jump to Term
          </p>
          <div className="flex flex-wrap gap-2">
            {allTerms.map((term) => (
              <a
                key={term.termId}
                href={`#${term.termId}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-amber-200 text-amber-700 text-xs font-semibold hover:bg-amber-500 hover:text-white hover:border-amber-500 transition-all duration-200 shadow-sm"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                {term.termLabel}
              </a>
            ))}
          </div>
        </div>

        {/* Event sections by term */}
        <div className="space-y-16">
          {eventData.map((term) => (
            <section key={term.termId} id={term.termId} className="scroll-mt-6">
              {/* Term heading */}
              <div className="flex items-center gap-3 mb-8">
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 border border-amber-200 text-amber-700 text-xs font-bold uppercase tracking-wider">
                  {term.termLabel}
                </span>
              </div>

              {/* Event cards grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {term.events.map((event) => {
                  const status = getEventStatus(event.isoDate);

                  return (
                    <div
                      key={event.id}
                      className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-amber-200 hover:shadow-lg hover:shadow-amber-100/50 hover:-translate-y-0.5 transition-all duration-300"
                    >
                      {/* Thumbnail / image area */}
                      <div className="relative h-44 overflow-hidden bg-slate-100">
                        {event.image ? (
                          /* Real image — uses Next.js Image in a real project, kept as <img> here for portability */
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={event.image}
                            alt={event.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          /* Fallback SVG illustration */
                          <FallbackIllustration
                            color={event.color}
                            title={event.title}
                          />
                        )}

                        {/* Status badge overlay */}
                        <div className="absolute top-3 right-3">
                          {status === "upcoming" ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-bold shadow-md">
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse inline-block" />
                              Upcoming
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/70 text-white text-xs font-semibold backdrop-blur-sm">
                              Past
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Card body */}
                      <div className="p-5">
                        {/* Date badge — day / month / year format */}
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-100 border border-indigo-200 flex flex-col items-center justify-center shrink-0">
                            <span className="text-indigo-700 font-bold text-xs leading-none">
                              {new Date(event.isoDate).toLocaleString("en-GB", {
                                day: "2-digit",
                              })}
                            </span>
                            <span className="text-indigo-500 text-[10px] font-semibold uppercase leading-none mt-0.5">
                              {new Date(event.isoDate).toLocaleString("en-GB", {
                                month: "short",
                              })}
                            </span>
                          </div>
                          <div>
                            <p className="text-slate-500 text-xs">
                              {event.displayDate}
                            </p>
                            <p className="text-slate-400 text-xs">
                              {event.timeRange}
                            </p>
                          </div>
                        </div>

                        <h3
                          className="font-bold text-indigo-950 text-base leading-snug mb-2"
                          style={{
                            fontFamily: "'Playfair Display', Georgia, serif",
                          }}
                        >
                          {event.title}
                        </h3>

                        <p className="text-slate-500 text-xs leading-relaxed mb-4">
                          {event.description}
                        </p>

                        {/* Meta row */}
                        <div className="flex flex-wrap items-center gap-2">
                          <FrequencyBadge frequency={event.frequency} />
                          <span className="flex items-center gap-1 text-slate-400 text-xs">
                            <svg
                              width="11"
                              height="11"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                              <circle cx="12" cy="10" r="3" />
                            </svg>
                            {event.venue}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-10 h-px bg-slate-200" />
            </section>
          ))}
        </div>

        <div className="flex items-center justify-between mt-10">
          <BackLink />
          <Link
            href="/notice/announcements"
            className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            Announcements
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
