"use client";

import { useState } from "react";
import Link from "next/link";

const contactDetails = [
  {
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
    label: "Address",
    value: "Obot Idim, Ibesikpo Asutan L.G.A",
    sub: "Akwa Ibom State, Nigeria",
    href: "https://maps.google.com",
    color: "amber",
  },
  {
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="5" y="2" width="14" height="20" rx="2" />
        <line x1="12" y1="18" x2="12.01" y2="18" />
      </svg>
    ),
    label: "School Line",
    value: "+234 704 025 1300",
    sub: "Primary contact",
    href: "tel:+2347040251300",
    color: "violet",
  },
  {
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
    ),
    label: "Phone",
    value: "+234 813 492 9564",
    sub: "Alternate line",
    href: "tel:+2348134929564",
    color: "indigo",
  },
  {
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
    label: "Email",
    value: "admin@lutheranhighschool.ng",
    sub: "Response within 24 hours",
    href: "mailto:admin@lutheranhighschool.ng",
    color: "teal",
  },
  {
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    label: "Official Hours",
    value: "7:00 AM — 2:00 PM",
    sub: "Monday to Friday (WAT)",
    href: null,
    color: "rose",
  },
];

const colorMap: Record<string, { icon: string; ring: string; bg: string }> = {
  amber: { icon: "text-amber-500", ring: "ring-amber-200", bg: "bg-amber-50" },
  violet: {
    icon: "text-violet-500",
    ring: "ring-violet-200",
    bg: "bg-violet-50",
  },
  indigo: {
    icon: "text-indigo-500",
    ring: "ring-indigo-200",
    bg: "bg-indigo-50",
  },
  teal: { icon: "text-teal-500", ring: "ring-teal-200", bg: "bg-teal-50" },
  rose: { icon: "text-rose-500", ring: "ring-rose-200", bg: "bg-rose-50" },
};

type FormState = "idle" | "sending" | "sent" | "error";

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [state, setState] = useState<FormState>("idle");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    setState("sending");
    setTimeout(() => setState("sent"), 1800);
  };

  return (
    <main className="min-h-screen bg-slate-50">
      {/* ── Hero ── */}
      <div
        className="relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #1e1b4b 0%, #312e81 55%, #4c1d95 100%)",
        }}
      >
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="absolute top-0 right-0 w-120 h-120 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 rounded-full bg-amber-400/10 translate-y-1/2 pointer-events-none" />

        <div className="relative container mx-auto px-6 lg:px-16 py-16 lg:py-20">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-white transition-colors mb-8"
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
            Home
          </Link>
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 text-amber-300 text-xs font-bold uppercase tracking-widest mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              We're Here to Help
            </span>
            <h1
              className="text-5xl lg:text-6xl font-bold text-white leading-tight mb-4"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Get in Touch
            </h1>
            <p className="text-indigo-300 text-lg leading-relaxed">
              Have a question about admissions, fees, or student life? Our team
              is available during school hours and happy to assist.
            </p>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="container mx-auto px-6 lg:px-16 py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 xl:gap-14 items-start">
          {/* ── Left: contact details ── */}
          <div className="lg:col-span-2 space-y-4">
            <h2
              className="text-2xl font-bold text-indigo-950 mb-6"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Contact Details
            </h2>

            {contactDetails.map(({ icon, label, value, sub, href, color }) => {
              const c = colorMap[color];
              const inner = (
                <div
                  className={`flex items-start gap-4 bg-white border border-slate-200 rounded-2xl p-5 hover:border-indigo-200 hover:shadow-sm transition-all group`}
                >
                  <div
                    className={`w-11 h-11 rounded-xl ${c.bg} ring-1 ${c.ring} flex items-center justify-center shrink-0 ${c.icon}`}
                  >
                    {icon}
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                      {label}
                    </p>
                    <p className="text-indigo-950 font-semibold text-sm">
                      {value}
                    </p>
                    {sub && (
                      <p className="text-slate-400 text-xs mt-0.5">{sub}</p>
                    )}
                  </div>
                  {href && (
                    <svg
                      className="ml-auto text-slate-300 group-hover:text-indigo-500 transition-colors shrink-0 self-center"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  )}
                </div>
              );
              return href ? (
                <a
                  key={label}
                  href={href}
                  target={href.startsWith("http") ? "_blank" : undefined}
                  rel="noreferrer"
                >
                  {inner}
                </a>
              ) : (
                <div key={label}>{inner}</div>
              );
            })}

            {/* Social row */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                Follow Us
              </p>
              <div className="flex items-center gap-3">
                {[
                  {
                    label: "WhatsApp",
                    color:
                      "hover:bg-green-500 hover:border-green-500 text-green-500 hover:text-white",
                    icon: (
                      <svg
                        width="17"
                        height="17"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                      </svg>
                    ),
                  },
                  {
                    label: "YouTube",
                    color:
                      "hover:bg-red-600 hover:border-red-600 text-red-500 hover:text-white",
                    icon: (
                      <svg
                        width="17"
                        height="17"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                      </svg>
                    ),
                  },
                  {
                    label: "Facebook",
                    color:
                      "hover:bg-blue-600 hover:border-blue-600 text-blue-500 hover:text-white",
                    icon: (
                      <svg
                        width="17"
                        height="17"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                    ),
                  },
                ].map(({ label, color, icon }) => (
                  <a
                    key={label}
                    href="#"
                    aria-label={label}
                    className={`w-10 h-10 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center transition-all ${color}`}
                  >
                    {icon}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right: form ── */}
          <div className="lg:col-span-3">
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
              {/* Form header */}
              <div
                className="px-8 py-6 border-b border-slate-100"
                style={{
                  background:
                    "linear-gradient(135deg, #f8faff 0%, #f1f5ff 100%)",
                }}
              >
                <h2
                  className="text-2xl font-bold text-indigo-950"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  Send Us a Message
                </h2>
                <p className="text-slate-500 text-sm mt-1">
                  We typically respond within one business day.
                </p>
              </div>

              <div className="p-8">
                {state === "sent" ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 text-3xl mb-4">
                      ✓
                    </div>
                    <h3
                      className="text-xl font-bold text-indigo-950 mb-2"
                      style={{
                        fontFamily: "'Playfair Display', Georgia, serif",
                      }}
                    >
                      Message Sent!
                    </h3>
                    <p className="text-slate-500 text-sm max-w-xs">
                      Thank you for reaching out. A member of our team will get
                      back to you shortly.
                    </p>
                    <button
                      onClick={() => {
                        setForm({
                          name: "",
                          email: "",
                          subject: "",
                          message: "",
                        });
                        setState("idle");
                      }}
                      className="mt-6 px-6 py-2.5 rounded-full border border-indigo-300 text-indigo-600 text-sm font-semibold hover:bg-indigo-50 transition-colors cursor-pointer"
                    >
                      Send another
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          value={form.name}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, name: e.target.value }))
                          }
                          placeholder="e.g. Uduak Ekong"
                          required
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all bg-slate-50 hover:bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          value={form.email}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, email: e.target.value }))
                          }
                          placeholder="you@example.com"
                          required
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all bg-slate-50 hover:bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Subject
                      </label>
                      <select
                        value={form.subject}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, subject: e.target.value }))
                        }
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all bg-slate-50 hover:bg-white appearance-none"
                      >
                        <option value="">Select a topic…</option>
                        <option>Admissions Inquiry</option>
                        <option>Fees & Payments</option>
                        <option>Academic Results</option>
                        <option>Boarding & Welfare</option>
                        <option>Alumni Relations</option>
                        <option>General Inquiry</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Message *
                      </label>
                      <textarea
                        rows={5}
                        value={form.message}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, message: e.target.value }))
                        }
                        placeholder="Write your message here…"
                        required
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all bg-slate-50 hover:bg-white resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={state === "sending"}
                      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-linear-to-r from-indigo-600 to-violet-600 text-white font-semibold text-sm hover:scale-[1.01] hover:shadow-lg hover:shadow-indigo-200 transition-all disabled:opacity-70 disabled:scale-100 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {state === "sending" ? (
                        <>
                          <svg
                            className="animate-spin"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                          >
                            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                          </svg>
                          Sending…
                        </>
                      ) : (
                        <>
                          Send Message
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                          >
                            <line x1="22" y1="2" x2="11" y2="13" />
                            <polygon points="22 2 15 22 11 13 2 9 22 2" />
                          </svg>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
