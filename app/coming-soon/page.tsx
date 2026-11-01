"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

/* ── Target launch date — update as needed ── */
const TARGET = new Date("2026-12-30T00:00:00Z");

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
  const router = useRouter();
  const time = useCountdown(TARGET);
  const [email, setEmail] = useState("");
  const [subState, setSubState] = useState<"idle" | "done">("idle");

  // Back to the page the visitor came from. A page opened directly (a new tab or a
  // typed address) has no history to go back to, so it goes to the home page.
  function goBack() {
    if (window.history.length > 1) router.back();
    else router.push("/");
  }

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
          <div className="flex justify-start mb-8">
            <button
              type="button"
              onClick={goBack}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back
            </button>
          </div>

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

      {/* Where to go while this feature is in the works */}
      <div className="container mx-auto px-6 lg:px-16 py-16 lg:py-20">
        <div className="text-center">
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
