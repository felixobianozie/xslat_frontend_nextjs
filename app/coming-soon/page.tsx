"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

/* ── Target launch date — update as needed ── */
const TARGET = new Date("2026-06-08T00:00:00Z");

function useCountdown(target: Date) {
  const calc = () => {
    const diff = target.getTime() - Date.now();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    return {
      days: Math.floor(diff / 86400000),
      hours: Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
      seconds: Math.floor((diff % 60000) / 1000),
    };
  };
  const [time, setTime] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

const upcoming = [
  {
    icon: "🏆",
    title: "Alumni Portal",
    desc: "A dedicated space for old students to reconnect, share achievements, and give back.",
    eta: "In Development",
  },
  {
    icon: "💳",
    title: "Online Fee Payment",
    desc: "Seamlessly pay school fees, view payment history, and download receipts from anywhere.",
    eta: "Coming Soon",
  },
  {
    icon: "📊",
    title: "Student Results Portal",
    desc: "Check terminal results, transcripts, and academic progress reports securely online.",
    eta: "Beta Phase",
  },
  {
    icon: "📸",
    title: "Photo Gallery",
    desc: "Memories from sports day, graduation, cultural events, and life inside the Luthisco Republic.",
    eta: "In Development",
  },
];

const etaBadge: Record<string, string> = {
  "Coming Soon": "bg-amber-100 text-amber-700 border-amber-200",
  "In Development": "bg-violet-100 text-violet-700 border-violet-200",
  "Beta Phase": "bg-emerald-100 text-emerald-700 border-emerald-200",
};

function Pad(n: number) {
  return String(n).padStart(2, "0");
}

function CountUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div
        className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-2xl sm:text-3xl font-bold text-white tabular-nums"
        style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
      >
        {Pad(value)}
      </div>
      <span className="text-indigo-300 text-[10px] uppercase tracking-widest mt-2">
        {label}
      </span>
    </div>
  );
}

export default function ComingSoonPage() {
  const time = useCountdown(TARGET);
  const [email, setEmail] = useState("");
  const [subState, setSubState] = useState<"idle" | "done">("idle");

  return (
    <main className="min-h-screen bg-slate-50">
      {/* ── Hero ── */}
      <div
        className="relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)",
        }}
      >
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="absolute top-0 right-0 w-125 h-125 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-amber-400/10 translate-y-1/2 -translate-x-1/4 pointer-events-none" />

        {/* Animated stars */}
        {[
          { cx: "8%", cy: "20%", r: 3, delay: "0s" },
          { cx: "90%", cy: "15%", r: 2, delay: "0.8s" },
          { cx: "75%", cy: "70%", r: 2, delay: "1.4s" },
          { cx: "18%", cy: "75%", r: 2.5, delay: "0.4s" },
          { cx: "50%", cy: "88%", r: 1.5, delay: "1.8s" },
        ].map((s, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-amber-300 animate-pulse"
            style={{
              left: s.cx,
              top: s.cy,
              width: s.r * 2,
              height: s.r * 2,
              animationDelay: s.delay,
            }}
          />
        ))}

        <div className="relative container mx-auto px-6 lg:px-16 py-16 lg:py-24 text-center">
          <h1
            className="text-5xl lg:text-7xl font-bold text-white leading-tight mb-4"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Coming Soon
          </h1>
          <p className="text-indigo-300 text-lg max-w-xl mx-auto mb-10">
            This feature is still in the works... New features and content are
            on their way to the Luthisco digital platform.
          </p>

          {/* Countdown */}
          <div className="flex items-start justify-center gap-3 sm:gap-5 mb-12">
            <CountUnit value={time.days} label="Days" />
            <div className="text-white/30 text-3xl font-bold mt-3">:</div>
            <CountUnit value={time.hours} label="Hours" />
            <div className="text-white/30 text-3xl font-bold mt-3">:</div>
            <CountUnit value={time.minutes} label="Minutes" />
            <div className="text-white/30 text-3xl font-bold mt-3">:</div>
            <CountUnit value={time.seconds} label="Seconds" />
          </div>

          {/* Notify form */}
          {subState === "done" ? (
            <div className="inline-flex items-center gap-3 bg-emerald-500/20 border border-emerald-400/30 rounded-full px-6 py-3 text-emerald-300 text-sm font-semibold">
              <span className="text-lg">✓</span>
              You're on the list. We'll notify you when it's ready!
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-3 max-w-md mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email for updates"
                className="flex-1 w-full px-5 py-3 rounded-full border border-white/20 bg-white/10 text-white placeholder-indigo-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
              />
              <button
                onClick={() => {
                  if (email) setSubState("done");
                }}
                className="px-6 py-3 rounded-full bg-linear-to-r from-amber-500 to-amber-400 text-indigo-950 font-bold text-sm whitespace-nowrap hover:scale-105 transition-transform shadow-lg cursor-pointer"
              >
                Notify Me
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Upcoming features ── */}
      <div className="container mx-auto px-6 lg:px-16 py-16 lg:py-20">
        <div className="text-center mb-12">
          <span className="inline-block text-xs font-bold uppercase tracking-[0.22em] text-violet-600 mb-3">
            What's Coming
          </span>
          <h2
            className="text-3xl lg:text-4xl font-bold text-indigo-950"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Features in the Pipeline
          </h2>
          <div className="flex items-center justify-center gap-3 mt-4">
            <div className="w-10 h-px bg-indigo-200" />
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <div className="w-10 h-px bg-indigo-200" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {upcoming.map(({ icon, title, desc, eta }) => (
            <div
              key={title}
              className="bg-white border border-slate-200 rounded-2xl p-6 hover:border-indigo-200 hover:shadow-md hover:-translate-y-0.5 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                {icon}
              </div>
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3
                  className="font-bold text-indigo-950 text-base"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  {title}
                </h3>
                <span
                  className={`inline-block shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold border ${etaBadge[eta]}`}
                >
                  {eta}
                </span>
              </div>
              <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <p className="text-slate-500 text-sm mb-4">
            In the meantime, you can still
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/admission"
              className="px-6 py-3 rounded-full bg-linear-to-r from-indigo-600 to-violet-600 text-white font-semibold text-sm hover:scale-105 transition-transform shadow-md"
            >
              Apply for Admission →
            </Link>
            <Link
              href="/contact"
              className="px-6 py-3 rounded-full border border-indigo-300 text-indigo-600 font-semibold text-sm hover:bg-indigo-50 transition-colors"
            >
              Contact Us
            </Link>
            <Link
              href="/about"
              className="px-6 py-3 rounded-full border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-100 transition-colors"
            >
              Learn About LHS
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
