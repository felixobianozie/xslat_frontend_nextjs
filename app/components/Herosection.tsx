"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

const slides = [
  {
    image: "/images/school_girls_football.jpg",
    tag: "School Spirit",
    title: "Sports And More",
    subtitle: "Student celebrations at the 2024 Interhouse Sports Competition",
  },
  {
    image: "/images/students_biology_practicals.jpg",
    tag: "Excellence",
    title: "Academic Brilliance",
    subtitle: "Fostering minds that lead the world since 1950",
  },
  {
    image: "/images/interhouse_students_celebrations_2024.png",
    tag: "Our Campus",
    title: "A Place to Grow",
    subtitle: "Modern facilities rooted in Christian values",
  },
];

export default function HeroSection() {
  const [current, setCurrent] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => goToNext(), 6000);
    return () => clearInterval(timer);
  }, [current]);

  const goToNext = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setTimeout(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
      setIsAnimating(false);
    }, 400);
  };

  const goToPrev = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setTimeout(() => {
      setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
      setIsAnimating(false);
    }, 400);
  };

  return (
    <>
      {/*
        Wrapper uses overflow-visible so the stats bar can visually
        bleed below the section boundary. The section itself clips
        the slide backgrounds but NOT this wrapper.
      */}
      <div className="relative">
        {/* Hero section — pb accounts for the half-height of the stats bar (≈ 40px) */}
        <section className="relative h-[88vh] min-h-150 max-h-225 overflow-hidden pb-10">
          {/* Slide backgrounds */}
          {slides.map((slide, i) => (
            <div
              key={i}
              className={`absolute inset-0 transition-opacity duration-700 ${
                i === current ? "opacity-100" : "opacity-0"
              }`}
            >
              {/* <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{
                  backgroundImage: `url(${slide.image}), linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)`,
                }}
              /> */}
              <Image
                src={slide.image}
                alt="School photo"
                fill={true}
                className="object-cover"
              />
              <div className="absolute inset-0 bg-linear-to-r from-indigo-950/90 via-indigo-950/60 to-transparent" />
              <div className="absolute inset-0 bg-linear-to-t from-indigo-950/80 via-transparent to-indigo-950/20" />
            </div>
          ))}

          {/* Decorative geometric accent */}
          <div className="absolute top-0 right-0 w-1/2 h-full pointer-events-none overflow-hidden">
            <div className="absolute top-12 right-12 w-72 h-72 rounded-full border border-violet-400/20 animate-pulse-slow" />
            <div className="absolute top-24 right-24 w-48 h-48 rounded-full border border-amber-400/15" />
            <div className="absolute bottom-32 right-8 w-32 h-32 rounded-full bg-violet-600/10" />
          </div>

          {/* Content */}
          <div className="relative h-full flex items-center">
            <div className="container mx-auto px-6 lg:px-16">
              <div className="max-w-2xl">
                {/* Tag pill */}
                <div
                  className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-400/40 bg-amber-400/10 mb-5 transition-all duration-500 ${
                    isAnimating
                      ? "opacity-0 -translate-y-2"
                      : "opacity-100 translate-y-0"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-amber-300 text-xs font-semibold uppercase tracking-widest">
                    {slides[current].tag}
                  </span>
                </div>

                {/* Headline */}
                <h1
                  className={`text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight mb-4 transition-all duration-500 ${
                    isAnimating
                      ? "opacity-0 -translate-y-3"
                      : "opacity-100 translate-y-0"
                  }`}
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  {slides[current].title}
                </h1>

                {/* Subtitle */}
                <p
                  className={`text-indigo-200 text-lg lg:text-xl leading-relaxed mb-7 max-w-lg transition-all duration-500 delay-75 ${
                    isAnimating
                      ? "opacity-0 translate-y-2"
                      : "opacity-100 translate-y-0"
                  }`}
                >
                  {slides[current].subtitle}
                </p>

                {/* Prev / Next arrows + dot indicators — inline row, above CTAs */}
                <div className="flex items-center gap-4 mb-7">
                  <button
                    onClick={goToPrev}
                    className="w-9 h-9 rounded-full border border-white/30 bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 hover:border-white/50 transition-all shrink-0 cursor-pointer"
                    aria-label="Previous slide"
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
                  </button>

                  {/* Dot indicators */}
                  <div className="flex gap-2">
                    {slides.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrent(i)}
                        className={`transition-all duration-300 rounded-full cursor-pointer ${
                          i === current
                            ? "w-8 h-2 bg-amber-400"
                            : "w-2 h-2 bg-white/40 hover:bg-white/70"
                        }`}
                        aria-label={`Go to slide ${i + 1}`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={goToNext}
                    className="w-9 h-9 rounded-full border border-white/30 bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 hover:border-white/50 transition-all shrink-0 cursor-pointer"
                    aria-label="Next slide"
                  >
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
                  </button>
                </div>

                {/* CTAs */}
                <div className="flex flex-wrap gap-4">
                  <a
                    href="/admission"
                    className="px-8 py-3.5 rounded-full bg-linear-to-r from-violet-600 to-indigo-600 text-white font-semibold text-sm tracking-wide shadow-lg shadow-violet-900/40 hover:shadow-violet-700/50 hover:scale-105 transition-all duration-200"
                  >
                    Apply Now 2026/2027
                  </a>
                  <a
                    href="/about"
                    className="px-8 py-3.5 rounded-full border border-white/30 text-white font-semibold text-sm tracking-wide backdrop-blur-sm hover:bg-white/10 hover:border-white/50 transition-all duration-200"
                  >
                    Discover LHS
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/*
          Stats bar lives OUTSIDE the section (so overflow is not clipped),
          positioned absolutely on the wrapper so it straddles the boundary.
          The wrapper needs bottom padding = half the stats bar height to
          reserve space for the bar in normal flow.
        */}
        <div className="absolute -bottom-16 lg:bottom-0 left-0 right-0 z-20 px-6 lg:px-16 ">
          <div className="max-w-4xl mx-auto grid grid-cols-2 lg:grid-cols-4 divide-x divide-indigo-700/50 bg-linear-to-r from-indigo-900 to-indigo-800 backdrop-blur-md border border-indigo-700/40 rounded-2xl shadow-2xl shadow-indigo-950/60 overflow-hidden">
            {[
              { value: "1950", label: "Est. Year" },
              { value: "75+", label: "Years of Excellence" },
              { value: "5,000+", label: "Alumni Worldwide" },
              { value: "100%", label: "WAEC Pass Rate" },
            ].map(({ value, label }) => (
              <div
                key={label}
                className="flex flex-col items-center justify-center py-5 px-4 text-center"
              >
                <span
                  className="text-2xl lg:text-3xl font-bold text-amber-400"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  {value}
                </span>
                <span className="text-indigo-300 text-xs mt-1 uppercase tracking-wider">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Space reservation — half of stats bar height so content below isn't hidden behind it */}
        <div className="h-13 bg-slate-50" />
      </div>
    </>
  );
}
