"use client";

import Link from "next/link";

const quickLinks = [
  { label: "Home", href: "/", icon: "🏠" },
  { label: "About Us", href: "/about", icon: "📖" },
  { label: "Admission", href: "/admission", icon: "🎓" },
  { label: "Finances", href: "/finance", icon: "💳" },
  { label: "Notice Board", href: "/notice", icon: "📋" },
  { label: "Results", href: "/results", icon: "📊" },
  { label: "Contact", href: "/contact", icon: "✉️" },
  { label: "Alumni", href: "/alumni", icon: "🌍" },
];

export default function NotFoundPage() {
  return (
    <main className="min-h-screen bg-slate-50 flex flex-col">
      {/* ── Hero ── */}
      <div
        className="relative overflow-hidden flex-1 flex items-center"
        style={{
          background:
            "linear-gradient(135deg, #1e1b4b 0%, #312e81 55%, #4c1d95 100%)",
        }}
      >
        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-120 h-120 rounded-full bg-white/5 -translate-y-1/3 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-amber-400/10 translate-y-1/2 -translate-x-1/4 pointer-events-none" />

        <div className="relative w-full container mx-auto px-6 lg:px-16 py-20 lg:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left text */}
            <div>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 text-amber-300 text-xs font-bold uppercase tracking-widest mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                Error 404
              </span>

              {/* Big 404 */}
              <div
                className="text-[8rem] lg:text-[11rem] font-bold leading-none text-white/10 select-none mb-2"
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  letterSpacing: "-4px",
                }}
              >
                404
              </div>

              <h1
                className="-mt-4 text-4xl lg:text-5xl font-bold text-white leading-tight mb-4"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                Page Not Found
              </h1>
              <p className="text-indigo-300 text-base lg:text-lg leading-relaxed mb-8 max-w-md">
                It seems like you've wandered outside the Luthisco Republic. The
                page you're looking for doesn't exist or may have been moved.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-linear-to-r from-amber-500 to-amber-400 text-indigo-950 font-bold text-sm hover:scale-105 transition-transform shadow-lg"
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                  Go Home
                </Link>
                <button
                  onClick={() => window.history.back()}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/20 text-white font-semibold text-sm hover:bg-white/10 transition-colors"
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                  Go Back
                </button>
              </div>
            </div>

            {/* Right: illustration */}
            <div className="hidden lg:flex items-center justify-center">
              <div className="relative w-72 h-72">
                {/* Outer ring */}
                <div className="absolute inset-0 rounded-full border-2 border-dashed border-white/10 animate-[spin_30s_linear_infinite]" />
                {/* Middle ring */}
                <div className="absolute inset-8 rounded-full border border-violet-500/30" />
                {/* Inner circle */}
                <div className="absolute inset-16 rounded-full bg-linear-to-br from-indigo-800 to-violet-800 flex items-center justify-center shadow-2xl">
                  <div className="text-center">
                    <div
                      className="text-5xl font-bold text-white/90 leading-none"
                      style={{
                        fontFamily: "'Playfair Display', Georgia, serif",
                      }}
                    >
                      404
                    </div>
                    <div className="text-indigo-300 text-xs mt-1">
                      Not Found
                    </div>
                  </div>
                </div>
                {/* Orbiting dot */}
                <div
                  className="absolute w-4 h-4 rounded-full bg-amber-400 shadow-lg shadow-amber-400/50"
                  style={{
                    top: "50%",
                    left: "50%",
                    transform:
                      "translate(-50%, -50%) rotate(0deg) translateX(136px)",
                    animation: "spin 8s linear infinite",
                  }}
                />
                {/* LHS badge */}
                <div className="absolute -bottom-2 -right-2 w-16 h-16 rounded-2xl bg-amber-400 flex items-center justify-center shadow-lg">
                  <div className="text-center">
                    <div className="text-indigo-950 font-black text-xs leading-none">
                      LHS
                    </div>
                    <div className="text-indigo-900/60 text-[8px] leading-none mt-0.5">
                      OBOT IDIM
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick links ── */}
      <div className="container mx-auto px-6 lg:px-16 py-12 lg:py-16">
        <h2
          className="text-xl font-bold text-indigo-950 mb-6"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          You might be looking for…
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickLinks.map(({ label, href, icon }) => (
            <Link
              key={label}
              href={href}
              className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3.5 hover:border-indigo-300 hover:bg-indigo-50 hover:-translate-y-0.5 transition-all group"
            >
              <span className="text-lg">{icon}</span>
              <span className="text-slate-700 text-sm font-medium group-hover:text-indigo-700 transition-colors">
                {label}
              </span>
              <svg
                className="ml-auto text-slate-300 group-hover:text-indigo-400 transition-colors shrink-0"
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
          ))}
        </div>

        {/* Help strip */}
        <div className="mt-8 bg-linear-to-r from-indigo-950 to-violet-950 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-white font-semibold text-sm">
              Still can't find what you're looking for?
            </p>
            <p className="text-indigo-300 text-xs mt-0.5">
              Our team is available during school hours to help.
            </p>
          </div>
          <Link
            href="/contact"
            className="shrink-0 px-5 py-2.5 rounded-full bg-amber-400 text-indigo-950 font-bold text-sm hover:scale-105 transition-transform"
          >
            Contact Us →
          </Link>
        </div>
      </div>
    </main>
  );
}
