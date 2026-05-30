"use client";

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

const verses = [
  {
    num: "I",
    lines: [
      "Alone gold is success;",
      "Hardwork holds the key",
      "A center of knowledge accesses;",
      "Good aims from our toil;",
      "Because in God we stand;",
      "Ours is a known of all mark of",
      "excellence well grounded in truth.",
    ],
  },
  {
    num: "II",
    lines: [
      "Purpose and high aims to empower us",
      "to climb any height and stand",
      "apart and shine like a",
      "day star because in God we stand.",
    ],
  },
  {
    num: "III",
    lines: [
      "Let's put our feet in the footsteps",
      "of our forbearers and learning light",
      "In order to be what we can be",
      "Let's hold high our aims because in",
      "God we stand.",
    ],
  },
];

const themes = [
  {
    icon: "✝️",
    title: "Faith as Foundation",
    verse: "Verse I & III",
    desc: '"Because in God we stand", the anthem\'s refrain is not decoration. It is the bedrock of everything LHS stands for: a conviction that authentic excellence is rooted in faith, not merely in effort.',
  },
  {
    icon: "💪",
    title: "Effort & Discipline",
    verse: "Verse I",
    desc: '"Hardwork holds the key." The anthem wastes no time signalling that results follow diligence. For over 70 years, the Luthisco work ethic has been forged in classrooms, on sports fields, and in morning prep sessions.',
  },
  {
    icon: "⭐",
    title: "Aspiration",
    verse: "Verse II",
    desc: '"Climb any height and stand apart and shine like a day star." Students are called to reach beyond the ordinary, to be luminaries in their fields, not mere participants.',
  },
  {
    icon: "🏛️",
    title: "Legacy & Continuity",
    verse: "Verse III",
    desc: '"Let\'s put our feet in the footsteps of our forbearers." Each generation of Luthiscans inherits a responsibility, to honour those who built the institution and to pass that flame to those who follow.',
  },
];

export default function AnthemPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div
        className="relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #2e1065 0%, #4c1d95 55%, #1e1b4b 100%)",
        }}
      >
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
        {/* Decorative music notes */}
        <div
          className="absolute top-8 right-16 text-violet-400/20 text-8xl select-none pointer-events-none"
          style={{ fontFamily: "serif" }}
        >
          ♪
        </div>
        <div
          className="absolute bottom-8 right-40 text-violet-400/10 text-6xl select-none pointer-events-none"
          style={{ fontFamily: "serif" }}
        >
          ♫
        </div>
        <div
          className="absolute top-20 right-56 text-amber-400/10 text-5xl select-none pointer-events-none"
          style={{ fontFamily: "serif" }}
        >
          ♩
        </div>
        <div className="relative container mx-auto px-6 lg:px-16 pt-8 pb-16">
          <div className="max-w-2xl mt-8">
            <span className="inline-block text-xs font-bold uppercase tracking-[0.22em] text-amber-400 mb-3">
              3 Verses
            </span>
            <h1
              className="text-5xl lg:text-6xl font-bold text-white leading-tight mb-4"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              School Anthem
            </h1>
            <p className="text-violet-300 text-lg leading-relaxed">
              Three verses that have echoed through assembly halls and
              graduation ceremonies for over 70 years, a song of purpose, faith,
              and the relentless pursuit of excellence.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 lg:px-16 py-16 max-w-4xl">
        {/* Motto callout */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-3 bg-white border border-violet-200 rounded-full px-6 py-3 shadow-sm">
            <span className="text-2xl">✝️</span>
            <div>
              <span className="text-indigo-950 font-bold text-sm tracking-wide">
                In Deo Stamus
              </span>
              <span className="text-slate-400 text-xs ml-3 italic">
                In God We Stand
              </span>
            </div>
          </div>
          <p className="text-slate-500 text-sm mt-4 max-w-md mx-auto">
            The school motto, Latin for <em>"In God We Stand"</em>, is the
            heartbeat of the anthem. Every verse circles back to this unchanging
            conviction.
          </p>
        </div>

        {/* Full Anthem */}
        <div
          className="relative rounded-3xl overflow-hidden mb-14"
          style={{
            background:
              "linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4c1d95 100%)",
          }}
        >
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
              backgroundSize: "24px 24px",
            }}
          />
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-violet-500/10 -translate-y-1/3 translate-x-1/3 pointer-events-none" />

          <div className="relative p-8 lg:p-14">
            <div className="text-center mb-10">
              <div
                className="text-7xl text-violet-500/30 leading-none mb-1 select-none"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                ♪
              </div>
              <h2
                className="text-white font-bold text-2xl"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                Lutheran High School Anthem
              </h2>
              <p className="text-violet-400 text-xs mt-1 uppercase tracking-widest">
                Obot Idim, Ibesikpo Asutan
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {verses.map(({ num, lines }) => (
                <div key={num} className="text-center">
                  <div className="inline-flex w-8 h-8 rounded-full bg-amber-400/20 border border-amber-400/30 items-center justify-center text-amber-400 text-xs font-bold mb-4">
                    {num}
                  </div>
                  <div className="space-y-1.5">
                    {lines.map((line, i) => (
                      <p
                        key={i}
                        className="text-indigo-100 text-sm leading-relaxed italic"
                        style={{
                          fontFamily: "'Playfair Display', Georgia, serif",
                        }}
                      >
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 text-center">
              <div className="inline-block border-t border-violet-600/40 pt-4">
                <p className="text-violet-300 text-xs uppercase tracking-[0.3em]">
                  In Deo Stamus
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Themes */}
        <div className="mb-14">
          <span className="inline-block text-xs font-bold uppercase tracking-[0.22em] text-amber-500 mb-3">
            Analysis
          </span>
          <h2
            className="text-3xl font-bold text-indigo-950 mb-8"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Themes in the Anthem
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {themes.map(({ icon, title, verse, desc }) => (
              <div
                key={title}
                className="bg-white border border-slate-200 rounded-2xl p-6 hover:border-violet-200 hover:shadow-sm transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center text-2xl shrink-0">
                    {icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4
                        className="font-bold text-indigo-900 text-sm"
                        style={{
                          fontFamily: "'Playfair Display', Georgia, serif",
                        }}
                      >
                        {title}
                      </h4>
                      <span className="text-[10px] text-violet-500 font-semibold bg-violet-50 border border-violet-100 px-2 py-0.5 rounded-full">
                        {verse}
                      </span>
                    </div>
                    <p className="text-slate-500 text-xs leading-relaxed">
                      {desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Verse by verse breakdown */}
        <div className="mb-14">
          <span className="inline-block text-xs font-bold uppercase tracking-[0.22em] text-amber-500 mb-3">
            Verse by Verse
          </span>
          <h2
            className="text-3xl font-bold text-indigo-950 mb-8"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Line by Line
          </h2>
          <div className="space-y-6">
            {[
              {
                verse: "Verse I",
                summary: "The Commitment to Excellence",
                highlight:
                  '"Ours is a known of all mark of excellence well grounded in truth."',
                body: "The opening verse frames success as something earned, through hardwork and good aims. The imagery of 'gold' as a standard sets an aspirational tone, while 'because in God we stand' anchors ambition in humility and faith.",
              },
              {
                verse: "Verse II",
                summary: "The Call to Rise",
                highlight:
                  '"...shine like a day star because in God we stand."',
                body: "This shortest verse carries the greatest charge, to rise to any height, stand apart, and shine. The 'day star' metaphor calls every Luthiscan to be a point of light in their community, profession, and nation. Empowerment, not arrogance.",
              },
              {
                verse: "Verse III",
                summary: "The Inheritance of Purpose",
                highlight:
                  '"Let\'s put our feet in the footsteps of our forbearers..."',
                body: "The final verse is a covenant with history. Generations of Luthiscans have gone before, building a legacy that demands honour. Students are not starting from scratch, they are inheriting something precious, and the anthem asks them to keep the flame burning.",
              },
            ].map(({ verse, summary, highlight, body }) => (
              <div
                key={verse}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden"
              >
                <div className="bg-linear-to-r from-violet-600 to-indigo-700 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="text-amber-300 font-bold text-sm">
                      {verse}
                    </span>
                    <span className="text-violet-200 text-sm">·</span>
                    <span
                      className="text-white font-semibold text-sm"
                      style={{
                        fontFamily: "'Playfair Display', Georgia, serif",
                      }}
                    >
                      {summary}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <blockquote className="border-l-3 border-violet-300 pl-4 text-violet-700 italic text-sm mb-3 font-medium">
                    {highlight}
                  </blockquote>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <BackLink />
          <Link
            href="/about/mission-vision"
            className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            Next: Mission & Vision
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
