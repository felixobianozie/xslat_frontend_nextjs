"use client";

export default function AboutSection() {
  return (
    <section className="py-24 lg:py-32 bg-linear-to-br from-indigo-950 via-indigo-900 to-violet-950 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-violet-500/30 to-transparent" />
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: "40px 40px",
        }}
      />
      <div className="absolute top-20 right-20 w-80 h-80 rounded-full bg-violet-600/20 blur-3xl" />
      <div className="absolute bottom-20 left-10 w-64 h-64 rounded-full bg-indigo-500/15 blur-3xl" />

      <div className="container mx-auto px-6 lg:px-16 relative">
        <div className="max-w-4xl mx-auto text-center">
          {/* Label */}
          <span className="inline-block text-xs font-bold uppercase tracking-[0.25em] text-amber-400 mb-5">
            Our Story
          </span>

          {/* Opening quote mark */}
          <div
            className="text-8xl text-violet-700/50 leading-none mb-2 select-none"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            "
          </div>

          {/* Paragraphs */}
          <p
            className="text-xl lg:text-2xl text-indigo-100 leading-relaxed mb-8 font-light"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Since its founding in the 1950s, Lutheran High School, Obot Idim,
            Ibesikpo has stood as a beacon of excellence in Christian education.
            With a legacy of nurturing many prominent individuals globally, we
            continue to maintain high academic standards, foster mental
            development, and uphold moral values that have earned us
            international recognition.
          </p>

          <p className="text-base lg:text-lg text-indigo-300 leading-relaxed mb-10 max-w-3xl mx-auto">
            Our holistic approach to education extends beyond the classroom. We
            don't just teach; we mould our students into well-rounded
            individuals, empowering them to excel academically, athletically,
            and morally. At Lutheran High School, we nurture talents, reward
            outstanding behaviour, and groom future leaders.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/about"
              className="px-8 py-3.5 rounded-full bg-linear-to-r from-amber-500 to-amber-400 text-indigo-950 font-bold text-sm tracking-wide shadow-lg shadow-amber-900/30 hover:scale-105 hover:shadow-amber-700/40 transition-all duration-200"
            >
              Learn More About Us
            </a>
            <a
              href="/alumni"
              className="px-8 py-3.5 rounded-full border border-indigo-500/50 text-indigo-200 font-semibold text-sm tracking-wide hover:bg-indigo-800/40 hover:border-indigo-400 transition-all duration-200"
            >
              Meet Our Alumni
            </a>
          </div>
        </div>

        {/* Values strip */}
        <div className="mt-20 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              icon: "✝️",
              title: "Faith-Based",
              desc: "Rooted in Christian values and moral integrity",
            },
            {
              icon: "🎓",
              title: "Academic Excellence",
              desc: "Consistently top-ranking results nationally",
            },
            {
              icon: "⚽",
              title: "Holistic Growth",
              desc: "Sports, arts, and co-curricular programmes",
            },
            {
              icon: "🌍",
              title: "Global Outlook",
              desc: "Alumni making impact across the world",
            },
          ].map(({ icon, title, desc }) => (
            <div
              key={title}
              className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center hover:bg-white/10 transition-colors"
            >
              <div className="text-3xl mb-3">{icon}</div>
              <h4
                className="text-white font-semibold text-sm mb-1.5"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                {title}
              </h4>
              <p className="text-indigo-400 text-xs leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
