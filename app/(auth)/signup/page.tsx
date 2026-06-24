"use client";

import { useState } from "react";
import Image from "next/image";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import SignupForm from "./components/Signupform";

export default function SignupPage() {
  const [queryClient] = useState(() => new QueryClient());

  const features = [
    { title: "One dashboard", body: "for admissions, results, and notices." },
    { title: "Real-time alerts", body: "when something important happens." },
    { title: "Safe & secure", body: "with industry-standard encryption." },
  ];

  return (
    <>
      <main className="relative flex-1 min-h-screen flex flex-col lg:flex-row overflow-hidden bg-white">
        {/* ════════════════════════════════════════
              LEFT PANEL — white, form card
          ════════════════════════════════════════ */}
        <section className="flex-1 flex flex-col items-center justify-center px-6 py-12 sm:px-10 lg:px-16 bg-white">
          {/* Mobile-only logo + heading */}
          <div className="lg:hidden text-center mb-8">
            <div className="relative w-12 h-12 bg-white border border-gray-200 rounded-xl shadow-sm mx-auto mb-4 overflow-hidden">
              <Image
                src="/images/lhs_logo.png"
                alt="Lutheran High School logo"
                fill
                className="object-contain p-1.5"
              />
            </div>
            <h1
              className="text-2xl font-bold text-gray-900 tracking-tight"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Join the <span className="text-violet-600">LHS family.</span>
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Create your account to get started.
            </p>
          </div>

          {/* Form card */}
          <div className="w-full max-w-xl">
            {/* Divider */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-400 font-bold">
                FILL IN YOUR DETAILS TO REGISTER
              </span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            <SignupForm />
          </div>
        </section>

        {/* ════════════════════════════════════════
              RIGHT PANEL — violet gradient, marketing
              Hidden on mobile, shown from lg breakpoint
          ════════════════════════════════════════ */}
        <aside
          aria-hidden="true"
          className="hidden lg:flex lg:w-[50%] xl:w-[50%] flex-col items-center justify-center px-12 xl:px-16 relative overflow-hidden bg-[#1e1b4b]"
        >
          {/* Decorative blobs */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-20"
            style={{
              background: "radial-gradient(circle, #a78bfa, transparent 50%)",
            }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-28 -left-16 w-96 h-96 rounded-full opacity-15"
            style={{
              background: "radial-gradient(circle, #c4b5fd, transparent 50%)",
            }}
          />
          {/* Subtle grid texture */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />

          <div className="relative z-10 max-w-sm w-full">
            {/* Logo + school name */}
            <div className="flex items-center gap-3 mb-8">
              <div className="relative w-12 h-12 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl shrink-0 overflow-hidden">
                <Image
                  src="/images/lhs_logo.png"
                  alt="Lutheran High School logo"
                  fill
                  className="object-contain p-1.5"
                />
              </div>
              <div>
                <p
                  className="text-white font-semibold text-base leading-tight"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  Lutheran High School
                </p>
                <p className="text-violet-200 text-[11px]">
                  Est. 1950 · Akwa Ibom
                </p>
              </div>
            </div>

            {/* Headline */}
            <h1
              className="text-3xl xl:text-4xl font-bold text-white leading-tight tracking-tight"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Step into a{" "}
              <span className="text-violet-200">legacy of excellence.</span>
            </h1>

            <p className="mt-3 text-violet-100/80 text-sm leading-relaxed">
              Create an account to track admissions, view results, and stay
              connected with the LHS community, all in one place.
            </p>

            {/* Feature list */}
            <ul className="mt-7 space-y-3.5">
              {features.map((f) => (
                <li key={f.title} className="flex gap-3 items-start">
                  <div className="shrink-0 w-6 h-6 rounded-md bg-white/15 border border-white/20 flex items-center justify-center text-white mt-0.5">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <p className="text-sm text-violet-100 leading-snug">
                    <span className="font-semibold text-white">{f.title}</span>{" "}
                    {f.body}
                  </p>
                </li>
              ))}
            </ul>

            {/* Stats strip */}
            <div className="mt-10 flex items-center gap-6">
              {[
                { value: "5,000+", label: "Students enrolled" },
                { value: "70+", label: "Years of excellence" },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-violet-200 mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </main>
    </>
  );
}
