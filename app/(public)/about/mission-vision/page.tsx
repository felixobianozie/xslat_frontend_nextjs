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

const values = [
  {
    icon: "✝️",
    title: "Faith",
    desc: "Everything at LHS flows from a Christian foundation. Faith is not a department, it is the water we swim in, the ethic that shapes how we teach, discipline, and nurture.",
  },
  {
    icon: "📚",
    title: "Academic Excellence",
    desc: "We hold a standard that has produced the best WASC results in West Africa and consistently earns our graduates admission into top universities worldwide.",
  },
  {
    icon: "🤝",
    title: "Integrity",
    desc: "From the rules of conduct to the way staff lead, honesty and righteousness are non-negotiable expectations at every level of the Luthisco community.",
  },
  {
    icon: "⚡",
    title: "Innovation",
    desc: "Agility in the face of change: SAT preparation, ICT vocational training, e-learning and project-based pedagogy keep LHS at the frontier of modern education.",
  },
  {
    icon: "💪",
    title: "Resilience",
    desc: "We do not train students only for calm conditions. The boarding culture, disciplined structure, and co-curricular demands build graduates who thrive under pressure.",
  },
  {
    icon: "🌍",
    title: "Global Impact",
    desc: "With alumni spanning medicine, aviation, law, politics, engineering, and diplomacy across the world, LHS measures its success not just in grades, but in lives transformed.",
  },
];

const pillars = [
  {
    number: "01",
    title: "Refined Teaching",
    desc: "Using project-based, inquiry-led, and technology-enhanced methods, our teachers are trained to be adaptive, engaging, and effective for every learner.",
  },
  {
    number: "02",
    title: "Cutting-Edge Facilities",
    desc: "Well-equipped science and computer labs, a standard library, a healthcare centre, and an ICT vocational wing ensure learning happens in a world-class environment.",
  },
  {
    number: "03",
    title: "Moral Soundness",
    desc: "Character formation is inseparable from academic development at LHS. Our Christian ethos, code of conduct, and pastoral care produce graduates of both mind and soul.",
  },
  {
    number: "04",
    title: "Future Readiness",
    desc: "International examinations (WAEC, NECO, SAT), leadership training, entrepreneurship, and counselling prepare students not just for the next exam, but for life.",
  },
];

export default function MissionVisionPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div
        className="relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #1e3a8a 0%, #1e1b4b 55%, #312e81 100%)",
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
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-blue-400/10 -translate-y-1/3 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-20 w-64 h-64 rounded-full bg-indigo-400/10 translate-y-1/2 pointer-events-none" />
        <div className="relative container mx-auto px-6 lg:px-16 pt-8 pb-16">
          <div className="max-w-2xl mt-8">
            <span className="inline-block text-xs font-bold uppercase tracking-[0.22em] text-amber-400 mb-3">
              Our Purpose
            </span>
            <h1
              className="text-5xl lg:text-6xl font-bold text-white leading-tight mb-4"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Mission &amp; Vision
            </h1>
            <p className="text-blue-200 text-lg leading-relaxed">
              Where we are going, why we exist, and the values that make the
              journey meaningful. LHS aims to be West Africa's international
              reference standard for secondary education.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 lg:px-16 py-16 max-w-5xl">
        {/* Vision & Mission side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {/* Vision */}
          <div
            className="relative rounded-3xl overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #312e81 0%, #4c1d95 100%)",
            }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/5 -translate-y-1/3 translate-x-1/3 pointer-events-none" />
            <div className="relative p-8">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-2xl mb-5">
                🔭
              </div>
              <span className="inline-block text-xs font-bold uppercase tracking-[0.22em] text-amber-300 mb-3">
                Vision
              </span>
              <h2
                className="text-white font-bold text-2xl mb-4"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                International Reference Standard
              </h2>
              <p className="text-violet-200 text-base leading-relaxed">
                To remain an international reference standard for high school
                education in West Africa, providing balanced education and
                graduating students with exceptional abilities for innovation,
                resilience and excellence.
              </p>
            </div>
          </div>

          {/* Mission */}
          <div className="relative rounded-3xl overflow-hidden bg-white border border-amber-200">
            <div className="p-8">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-2xl mb-5">
                🎯
              </div>
              <span className="inline-block text-xs font-bold uppercase tracking-[0.22em] text-amber-600 mb-3">
                Mission
              </span>
              <h2
                className="text-indigo-950 font-bold text-2xl mb-4"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                Simpler, Yet Effective Learning
              </h2>
              <p className="text-slate-600 text-base leading-relaxed">
                To make learning simpler, yet effective using refined teaching
                and learning approaches; providing well-rounded education with
                cutting-edge facilities while instilling moral soundness and
                readying all our students for future greatness.
              </p>
            </div>
          </div>
        </div>

        {/* Core Values */}
        <div className="mb-16">
          <span className="inline-block text-xs font-bold uppercase tracking-[0.22em] text-amber-500 mb-3">
            Core Values
          </span>
          <h2
            className="text-3xl font-bold text-indigo-950 mb-8"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            What We Stand For
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {values.map(({ icon, title, desc }) => (
              <div
                key={title}
                className="bg-white border border-slate-200 rounded-2xl p-6 hover:border-indigo-200 hover:shadow-sm transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                  {icon}
                </div>
                <h4
                  className="font-bold text-indigo-900 text-sm mb-2"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  {title}
                </h4>
                <p className="text-slate-500 text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* How mission is achieved */}
        <div className="mb-16">
          <span className="inline-block text-xs font-bold uppercase tracking-[0.22em] text-amber-500 mb-3">
            How We Deliver
          </span>
          <h2
            className="text-3xl font-bold text-indigo-950 mb-8"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            The Four Pillars of Our Mission
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {pillars.map(({ number, title, desc }) => (
              <div
                key={number}
                className="bg-white border border-slate-200 rounded-2xl p-6 hover:border-indigo-200 hover:shadow-sm transition-all"
              >
                <div className="flex items-start gap-5">
                  <div
                    className="text-4xl font-bold text-indigo-100 leading-none shrink-0 select-none"
                    style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                  >
                    {number}
                  </div>
                  <div>
                    <h4
                      className="font-bold text-indigo-900 text-base mb-2"
                      style={{
                        fontFamily: "'Playfair Display', Georgia, serif",
                      }}
                    >
                      {title}
                    </h4>
                    <p className="text-slate-500 text-sm leading-relaxed">
                      {desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Philosophy */}
        <div
          className="rounded-3xl overflow-hidden mb-8"
          style={{
            background:
              "linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4c1d95 100%)",
          }}
        >
          <div className="p-8 lg:p-10">
            <span className="inline-block text-xs font-bold uppercase tracking-[0.22em] text-amber-400 mb-3">
              Guiding Philosophy
            </span>
            <div
              className="text-6xl text-violet-500/30 leading-none mb-3 select-none"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              "
            </div>
            <blockquote
              className="text-2xl text-white font-medium italic leading-relaxed mb-4"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              The Soul of Education is the Education of the Soul.
            </blockquote>
            <p className="text-indigo-300 text-sm leading-relaxed">
              This guiding philosophy of the Evangelical Lutheran Church has
              shaped every aspect of LHS since 1950. Academic achievement
              without character formation is not the Luthisco way. Every subject
              taught, every discipline enforced, every programme offered is
              ultimately in service of producing graduates who are whole,
              intellectually sharp, morally upright, and spiritually grounded.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <BackLink />
          <Link
            href="/about/prospectus"
            className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            Next: Student Prospectus
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
