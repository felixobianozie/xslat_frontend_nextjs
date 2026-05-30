"use client";

export default function AdmissionContactSection() {
  return (
    <section className="py-24 lg:py-32 bg-linear-to-b from-slate-50 to-slate-100 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-indigo-300 to-transparent" />

      <div className="container mx-auto px-6 lg:px-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-stretch">
          {/* Admission Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 lg:p-10 flex flex-col">
            {/* Status pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 w-fit mb-6">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-emerald-700 text-xs font-bold uppercase tracking-wider">
                Admissions Open
              </span>
            </div>

            <h3
              className="text-2xl lg:text-3xl font-bold text-indigo-950 mb-2"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Admission Status
            </h3>
            <p className="text-amber-600 font-semibold text-sm mb-5">
              2026 / 2027 Academic Session
            </p>

            <p className="text-slate-600 text-sm leading-relaxed mb-6 flex-1">
              Application forms for entrance examinations into{" "}
              <strong>JS1, JSS2, SS1 and SS2</strong> are on sale at a
              non-refundable fee of{" "}
              <strong className="text-indigo-700">₦3,000</strong>. Forms can be
              filled and submitted online or in person. Successful applicants
              will be scheduled for an entrance examination.
            </p>

            {/* Steps */}
            <div className="space-y-3 mb-8">
              {[
                "Purchase your application form",
                "Fill and submit online or physically",
                "Sit for the entrance examination",
                "Await admission notification",
              ].map((step, i) => (
                <div key={step} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <span className="text-slate-600 text-sm">{step}</span>
                </div>
              ))}
            </div>

            <a
              href="/admission"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-linear-to-r from-indigo-600 to-violet-600 text-white font-semibold text-sm shadow-md shadow-indigo-200 hover:shadow-indigo-300 hover:scale-105 transition-all duration-200 w-full sm:w-auto"
            >
              Start Application
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
            </a>
          </div>

          {/* Contact Card */}
          <div
            className="relative rounded-3xl overflow-hidden text-white flex flex-col justify-between p-8 lg:p-10 min-h-105"
            style={{
              background:
                "linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4c1d95 100%)",
            }}
          >
            {/* BG decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/3 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-violet-500/10 translate-y-1/3 -translate-x-1/4" />

            <div className="relative">
              <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-amber-400 mb-4">
                Get In Touch
              </span>
              <h3
                className="text-2xl lg:text-3xl font-bold mb-2"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                Contact Us Now!
              </h3>
              <p className="text-indigo-300 text-sm mb-8">
                We're available during school hours and happy to answer your
                questions.
              </p>

              {/* Contact details */}
              <div className="space-y-5">
                {[
                  {
                    icon: (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                    ),
                    label: "Address",
                    value:
                      "Lutheran High School Obot Idim, Ibesikpo Asutan L.G.A, Akwa Ibom State, Nigeria",
                  },
                  {
                    icon: (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <rect
                          x="5"
                          y="2"
                          width="14"
                          height="20"
                          rx="2"
                          ry="2"
                        />
                        <line x1="12" y1="18" x2="12.01" y2="18" />
                      </svg>
                    ),
                    label: "School Line",
                    value: "+234-7040251300",
                  },
                  {
                    icon: (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                    ),
                    label: "Phone",
                    value: "+234-8134929564",
                  },
                  {
                    icon: (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                    ),
                    label: "Email",
                    value: "admin@lutheranhighschool.ng",
                  },
                ].map(({ icon, label, value }) => (
                  <div key={label} className="flex items-start gap-4">
                    <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0 text-amber-400">
                      {icon}
                    </div>
                    <div>
                      <p className="text-indigo-400 text-xs uppercase tracking-wider mb-0.5">
                        {label}
                      </p>
                      <p className="text-white text-sm leading-snug">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Official hours */}
            <div className="relative mt-8 pt-6 border-t border-white/10">
              <div className="flex items-center justify-between text-sm">
                <span className="text-indigo-400">Official Hours</span>
                <span className="font-semibold text-amber-400">
                  7am - 2pm (WAT)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
