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

function BulletItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3 py-2 border-b border-slate-100 last:border-0">
      <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0 mt-2" />
      <span className="text-slate-600 text-sm leading-snug">{children}</span>
    </li>
  );
}

function UniformCard({
  title,
  icon,
  items,
  color,
}: {
  title: string;
  icon: string;
  items: string[];
  color: "sky" | "pink" | "indigo" | "violet";
}) {
  const headerColors: Record<string, string> = {
    sky: "bg-sky-600",
    pink: "bg-pink-600",
    indigo: "bg-indigo-700",
    violet: "bg-violet-700",
  };
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <div
        className={`${headerColors[color]} px-5 py-3.5 flex items-center gap-3`}
      >
        <span className="text-xl">{icon}</span>
        <span className="text-white font-semibold text-sm">{title}</span>
      </div>
      <ul className="px-5 py-3">
        {items.map((item) => (
          <BulletItem key={item}>{item}</BulletItem>
        ))}
      </ul>
    </div>
  );
}

export default function UniformsPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div
        className="relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #0c4a6e 0%, #075985 55%, #0369a1 100%)",
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
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-sky-300/10 -translate-y-1/3 translate-x-1/3 pointer-events-none" />
        <div className="relative container mx-auto px-6 lg:px-16 pt-8 pb-16">
          <div className="max-w-2xl mt-8">
            <span className="inline-block text-xs font-bold uppercase tracking-[0.22em] text-sky-300 mb-3">
              Regular &amp; Ceremonial
            </span>
            <h1
              className="text-5xl lg:text-6xl font-bold text-white leading-tight mb-4"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              School Uniforms
            </h1>
            <p className="text-sky-100 text-lg leading-relaxed">
              Dress with pride. Every item, every occasion, a full breakdown of
              LHS uniform requirements from JSS1 to SS3.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 lg:px-16 py-16 max-w-5xl">
        {/* Policy note */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-12 flex gap-4">
          <span className="text-2xl shrink-0">⚠️</span>
          <div>
            <h4 className="font-bold text-amber-900 text-sm mb-1">
              Uniform Policy
            </h4>
            <p className="text-amber-700 text-sm leading-relaxed">
              All students must wear the correct, regulation uniform for each
              occasion. Improper dressing is a disciplinary offence.
              Non-prescribed coloured materials brought into school will be
              confiscated and held until the student's final year.
            </p>
          </div>
        </div>

        {/* ── Regular Uniform ── */}
        <div className="mb-14">
          <span className="inline-block text-xs font-bold uppercase tracking-[0.22em] text-sky-600 mb-3">
            Type 1
          </span>
          <h2
            className="text-3xl font-bold text-indigo-950 mb-2"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Regular Uniform
          </h2>
          <p className="text-slate-500 text-sm mb-8">
            Worn during normal school days and all standard activities.
          </p>

          {/* JSS Section */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center text-xs font-bold">
                JSS
              </div>
              <h3 className="font-bold text-indigo-900 text-base">
                Junior Secondary School (JSS 1 - JSS 3)
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <UniformCard
                title="Boys - JSS 1-3"
                icon="👦"
                color="sky"
                items={[
                  "Two pairs of white shorts and two white short-sleeved shirts",
                  "A pair of sky-blue short-sleeved shirt and a navy-blue short",
                  "Two pairs of navy-blue socks (to be bought in school)",
                  "Long or short-sleeve pullover (to be bought in school)",
                  "Belt and school badge (to be bought in school)",
                ]}
              />
              <UniformCard
                title="Girls - JSS 1-3"
                icon="👧"
                color="pink"
                items={[
                  "A pair of white gown with pleats",
                  "A pair of sky-blue gown with pleats",
                  "Two pairs of navy-blue socks (to be bought in school)",
                  "Long or short-sleeve pullover (to be bought in school)",
                  "Beret with school logo (to be bought in school)",
                ]}
              />
            </div>
          </div>

          {/* SSS Section */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
                SS
              </div>
              <h3 className="font-bold text-indigo-900 text-base">
                Senior Secondary School (SS 1 - SS 3)
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <UniformCard
                title="Boys - SS 1 &amp; SS 2"
                icon="👦"
                color="sky"
                items={[
                  "A pair of white trouser and white short-sleeved shirt",
                  "A pair of sky-blue short-sleeved shirt and a navy-blue trouser",
                ]}
              />
              <UniformCard
                title="Boys - SS 3"
                icon="🎓"
                color="indigo"
                items={[
                  "A pair of white trouser and white long-sleeved shirt",
                  "A pair of sky-blue long-sleeved shirt and a navy-blue trouser",
                ]}
              />
              <UniformCard
                title="Girls - SS 1-3"
                icon="👩"
                color="pink"
                items={[
                  "A pair of white skirt and white blouse",
                  "A pair of sky-blue skirt and sky-blue blouse",
                ]}
              />
            </div>
          </div>
        </div>

        {/* ── Ceremonial Wear ── */}
        <div className="mb-14">
          <span className="inline-block text-xs font-bold uppercase tracking-[0.22em] text-violet-600 mb-3">
            Type 2
          </span>
          <h2
            className="text-3xl font-bold text-indigo-950 mb-2"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Ceremonial Wear
          </h2>
          <p className="text-slate-500 text-sm mb-8">
            Worn on special occasions, graduation, solemn assemblies, and formal
            school events.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <UniformCard
              title="Boys - JSS 1 to SS 3"
              icon="👦"
              color="indigo"
              items={[
                "A pair of white trousers and white long-sleeved shirt",
                "A pair of white and navy-blue socks (to be bought in school)",
                "Belt (to be bought in school)",
                "Pullover (to be bought in school)",
                "Black sandals",
              ]}
            />
            <UniformCard
              title="Girls - JSS 1 to SS 3"
              icon="👧"
              color="violet"
              items={[
                "White gown",
                "A pair of navy-blue socks (to be bought in school)",
                "School beret with school logo (to be bought in school)",
                "Black sandals",
              ]}
            />
          </div>
        </div>

        {/* Items bought in school */}
        <div className="bg-indigo-950 rounded-2xl p-6 mb-8 text-white">
          <h4 className="font-bold text-amber-300 text-sm mb-3 uppercase tracking-wide">
            Items Available for Purchase in School
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              "Navy-blue socks",
              "School beret with logo",
              "Short-sleeve pullover",
              "Long-sleeve pullover",
              "Belt",
              "School badge",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-2 text-indigo-200 text-sm"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                {item}
              </div>
            ))}
          </div>
          <p className="text-indigo-400 text-xs mt-4">
            These items must be purchased through the school. Bringing
            non-regulation versions is not permitted.
          </p>
        </div>

        <div className="flex items-center justify-between">
          <BackLink />
          <Link
            href="/about/rules"
            className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            Next: Golden Rules
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
