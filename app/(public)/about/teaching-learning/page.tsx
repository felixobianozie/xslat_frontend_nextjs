import Link from "next/link";

function BackLink() {
  return (
    <Link
      href="/about"
      className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-white transition-colors"
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
      Back to About
    </Link>
  );
}

const approaches = [
  {
    number: "01",
    icon: "🔬",
    title: "Project-Based Learning",
    tagline: "Real problems. Real solutions.",
    body: "Students at LHS engage with tangible, real-world challenges through structured projects. Rather than passive absorption of information, they plan, build, test, and present, developing critical thinking, collaboration, and problem-solving skills that serve them for life.",
    examples: [
      "Science projects addressing community health challenges",
      "ICT solutions developed in the computer laboratory",
      "Agricultural projects in the Young Farmer's Club",
      "Research presentations in the Science and Literary clubs",
    ],
    color: "emerald",
  },
  {
    number: "02",
    icon: "💡",
    title: "Inquiry-Based Learning",
    tagline: "Ask. Explore. Discover.",
    body: "LHS teachers are trained to be catalysts, not lecturers. Students are encouraged to ask questions, challenge assumptions, and pursue answers through guided independent research. Our well-equipped library and research centre exist precisely for this purpose, giving students the freedom to follow their curiosity.",
    examples: [
      "Guided independent research sessions in the library",
      "Laboratory experiments that precede theory",
      "Student-driven debate on current affairs",
      "Science and mathematics exploration beyond the syllabus",
    ],
    color: "violet",
  },
  {
    number: "03",
    icon: "🤝",
    title: "Collaborative Learning",
    tagline: "Together, we go further.",
    body: "No great achievement is truly individual. LHS deliberately designs learning activities where students must work in teams, negotiating ideas, dividing tasks, and collectively producing a result no single student could achieve alone. This mirrors the dynamics of every professional environment they will enter.",
    examples: [
      "Group laboratory practicals in science subjects",
      "Choral and cultural club performances",
      "Interhouse sports competitions and team events",
      "Class project groups and peer tutoring initiatives",
    ],
    color: "indigo",
  },
  {
    number: "04",
    icon: "💻",
    title: "Technology-Enhanced Learning",
    tagline: "Modern tools. Modern minds.",
    body: "The world students will graduate into is digital. LHS prepares them for it, with a fully equipped ICT laboratory, audio-visual teaching aids, e-learning infrastructure, and an exclusive ICT vocational programme. Technology is not an afterthought; it is woven into how we teach every subject.",
    examples: [
      "Audio-visual presentations and digital teaching aids",
      "Computer lab sessions for practical ICT skills",
      "SAT digital preparation tools",
      "ICT vocational programme for advanced students",
    ],
    color: "sky",
  },
];

const colorMap: Record<
  string,
  { border: string; bg: string; badge: string; header: string; dot: string }
> = {
  emerald: {
    border: "border-emerald-200",
    bg: "bg-emerald-50",
    badge: "bg-emerald-100 text-emerald-700",
    header: "bg-emerald-700",
    dot: "bg-emerald-500",
  },
  violet: {
    border: "border-violet-200",
    bg: "bg-violet-50",
    badge: "bg-violet-100 text-violet-700",
    header: "bg-violet-700",
    dot: "bg-violet-500",
  },
  indigo: {
    border: "border-indigo-200",
    bg: "bg-indigo-50",
    badge: "bg-indigo-100 text-indigo-700",
    header: "bg-indigo-700",
    dot: "bg-indigo-500",
  },
  sky: {
    border: "border-sky-200",
    bg: "bg-sky-50",
    badge: "bg-sky-100 text-sky-700",
    header: "bg-sky-700",
    dot: "bg-sky-500",
  },
};

export default function TeachingLearningPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div
        className="relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #064e3b 0%, #065f46 55%, #134e4a 100%)",
        }}
      >
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-emerald-300/10 -translate-y-1/3 translate-x-1/3 pointer-events-none" />
        <div className="relative container mx-auto px-6 lg:px-16 pt-8 pb-16">
          <div className="max-w-2xl mt-8">
            <span className="inline-block text-xs font-bold uppercase tracking-[0.22em] text-emerald-300 mb-3">
              4 Approaches
            </span>
            <h1
              className="text-5xl lg:text-6xl font-bold text-white leading-tight mb-4"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Teaching &amp; Learning
            </h1>
            <p className="text-emerald-100 text-lg leading-relaxed">
              Adaptive, engaging, and built for the modern world. How we teach
              at LHS is as important as what we teach.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 lg:px-16 py-16 max-w-4xl">
        {/* Philosophy */}
        <div className="bg-white border border-slate-200 rounded-3xl p-8 mb-14">
          <span className="inline-block text-xs font-bold uppercase tracking-[0.22em] text-emerald-600 mb-3">
            Our Philosophy
          </span>
          <h2
            className="text-2xl font-bold text-indigo-950 mb-4"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Adaptive Teaching for Every Learner
          </h2>
          <p className="text-slate-600 text-base leading-relaxed mb-4">
            There is no one-size-fits-all approach to teaching and learning, but
            our teachers are trained to be adaptive, adopting the best practices
            that are most effective for reaching positive learning outcomes in
            every circumstance.
          </p>
          <p className="text-slate-600 text-base leading-relaxed mb-4">
            Our goal is to make learning relevant and engaging. We encourage
            teachers to use real-world examples and allow students to explore
            topics that interest them, granting guided access to our facilities
            for independent research. We continuously create a safe and
            supportive environment where students feel comfortable asking
            questions and making mistakes.
          </p>
          <p className="text-slate-600 text-base leading-relaxed">
            Overall, we encourage critical thinking and independent learning,
            rather than just rote memorisation. A student who has learned to
            think has an education that lasts a lifetime.
          </p>
        </div>

        {/* The 4 approaches */}
        <div className="mb-14">
          <span className="inline-block text-xs font-bold uppercase tracking-[0.22em] text-amber-500 mb-3">
            Core Methods
          </span>
          <h2
            className="text-3xl font-bold text-indigo-950 mb-8"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Our Four Core Teaching Approaches
          </h2>

          <div className="space-y-6">
            {approaches.map(
              ({ number, icon, title, tagline, body, examples, color }) => {
                const c = colorMap[color];
                return (
                  <div
                    key={number}
                    className={`bg-white border ${c.border} rounded-3xl overflow-hidden`}
                  >
                    {/* Header */}
                    <div
                      className={`${c.header} px-6 py-5 flex items-start gap-4`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center text-2xl shrink-0">
                        {icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-0.5">
                          <span className="text-white/60 font-bold text-sm">
                            {number}
                          </span>
                          <h3
                            className="text-white font-bold text-lg"
                            style={{
                              fontFamily: "'Playfair Display', Georgia, serif",
                            }}
                          >
                            {title}
                          </h3>
                        </div>
                        <p className="text-white/70 text-sm italic">
                          {tagline}
                        </p>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="p-6 lg:p-8">
                      <p className="text-slate-600 text-sm leading-relaxed mb-5">
                        {body}
                      </p>
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                          In practice at LHS
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {examples.map((ex) => (
                            <div
                              key={ex}
                              className={`flex items-start gap-2.5 rounded-xl p-3 ${c.bg}`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${c.dot} shrink-0 mt-1.5`}
                              />
                              <span className="text-slate-600 text-xs leading-snug">
                                {ex}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              },
            )}
          </div>
        </div>

        {/* Environment */}
        <div className="mb-14">
          <div className="bg-linear-to-br from-indigo-950 via-indigo-900 to-violet-950 rounded-3xl p-8 text-white">
            <span className="inline-block text-xs font-bold uppercase tracking-[0.22em] text-amber-400 mb-3">
              The Environment
            </span>
            <h2
              className="text-2xl font-bold mb-4"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              A Campus Designed for Learning
            </h2>
            <p className="text-indigo-200 text-sm leading-relaxed mb-6">
              Great teaching needs great infrastructure. At LHS, every facility
              exists in service of learning.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                "Well-equipped Science Laboratories",
                "Fully equipped Computer Labs",
                "Well-stocked standard Library",
                "Research Centre",
                "Audio-Visual Teaching Aids",
                "ICT Vocational Programme",
                "Standard Healthcare Centre",
                "Food & Nutrition Laboratory",
                "Serene Nature-Friendly Campus",
              ].map((f) => (
                <div
                  key={f}
                  className="flex items-start gap-2 bg-white/10 border border-white/10 rounded-xl p-3"
                >
                  <span className="text-emerald-400 shrink-0 text-sm">✓</span>
                  <span className="text-indigo-100 text-xs leading-snug">
                    {f}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <BackLink />
          <Link
            href="/about/why-lhs"
            className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            Next: Why LHS?
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
