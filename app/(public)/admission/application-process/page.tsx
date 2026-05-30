import Link from "next/link";

function BackLink() {
  return (
    <Link
      href="/admission"
      className="inline-flex items-center gap-2 text-sm text-indigo-300 hover:text-indigo-500 transition-colors"
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
      Back to Admissions
    </Link>
  );
}

const steps = [
  {
    num: "01",
    title: "Get Your Application Form",
    icon: "📋",
    accent: "from-indigo-500 to-violet-600",
    accentBg: "bg-indigo-50 border-indigo-200",
    accentText: "text-indigo-700",
    body: "Application forms for entrance examinations into JS1, JSS2, SS1, and SS2 are available at a non-refundable fee of ₦3,000. Forms can be obtained online via our website or physically at the school premises and other designated locations.",
    details: [
      {
        label: "Online",
        desc: "Pay ₦3,000 to the school account, fill and submit your form entirely online. Fastest and most recommended option.",
      },
      {
        label: "Physical",
        desc: "Visit the school premises. Pay ₦3,000 over the counter or to the school bank account and collect the physical form.",
      },
    ],
    banks: [
      {
        name: "GTBank",
        account: "0107355105",
        holder: "Lutheran High School, Obot Idim",
      },
      {
        name: "Zenith Bank",
        account: "1011112061",
        holder: "Lutheran High School, Obot Idim",
      },
    ],
  },
  {
    num: "02",
    title: "Fill & Submit the Form",
    icon: "✍️",
    accent: "from-violet-500 to-purple-600",
    accentBg: "bg-violet-50 border-violet-200",
    accentText: "text-violet-700",
    body: "Complete every section of the form accurately. Online applicants fill and submit directly on the website. Physical applicants return the completed form to the school or a designated submission point.",
    details: [
      {
        label: "Online submission",
        desc: "After payment, you are redirected to the secure online form. Fill all required fields and click Submit. You will receive a confirmation.",
      },
      {
        label: "Physical submission",
        desc: "Return the completed form to the school's administrative office or a designated location communicated by management.",
      },
    ],
  },
  {
    num: "03",
    title: "Await Scheduling",
    icon: "⏳",
    accent: "from-teal-500 to-emerald-500",
    accentBg: "bg-teal-50 border-teal-200",
    accentText: "text-teal-700",
    body: "After form submission, our administrative staff will process your application and schedule you for an entrance examination. You will be notified within 48 working hours by email, SMS, or phone call.",
    details: [
      {
        label: "Processing time",
        desc: "Between 1 and 48 working hours from the time of submission.",
      },
      {
        label: "Notification",
        desc: "You will be contacted via email, SMS, or phone call with your examination date, time, and venue.",
      },
    ],
  },
  {
    num: "04",
    title: "Sit for Entrance Examination",
    icon: "📝",
    accent: "from-amber-500 to-orange-500",
    accentBg: "bg-amber-50 border-amber-200",
    accentText: "text-amber-700",
    body: "Candidates are required to sit for the entrance examination on their scheduled date at the school premises or any other specified location. Multiple examination dates are available throughout the session to accommodate different schedules.",
    details: [
      {
        label: "Venue",
        desc: "School premises, Obot Idim, or any other location communicated at the time of scheduling.",
      },
      {
        label: "Note",
        desc: "We are currently working towards offering online CBT (Computer-Based Testing) examinations in the near future.",
      },
    ],
  },
  {
    num: "05",
    title: "Check Your Result",
    icon: "🔍",
    accent: "from-rose-500 to-pink-600",
    accentBg: "bg-rose-50 border-rose-200",
    accentText: "text-rose-700",
    body: "Examination results are usually available within a few days of the examination date. Successful candidates are notified by email, SMS, or phone call. Results can also be checked on our website or at the school's physical notice boards.",
    details: [
      {
        label: "Online",
        desc: "Visit the Entrance Examination section on this website and locate your examination date to check your result.",
      },
      {
        label: "Physical",
        desc: "Check the school's notice boards at the school premises.",
      },
    ],
  },
  {
    num: "06",
    title: "Pay Acceptance Fee & Confirm Admission",
    icon: "🎓",
    accent: "from-emerald-500 to-teal-600",
    accentBg: "bg-emerald-50 border-emerald-200",
    accentText: "text-emerald-700",
    body: "Candidates who pass the entrance examination will be offered a conditional admission. To validate your admission, you are required to pay a non-refundable acceptance fee of ₦3,000. This payment officially confirms your admission and makes you eligible to proceed to school fees and other applicable levies.",
    details: [
      {
        label: "Acceptance fee",
        desc: "₦3,000 non-refundable, paid to the school's official bank account.",
      },
      {
        label: "After acceptance",
        desc: "Proceed to make all applicable school fees and levy payments. Contact the school for a full breakdown.",
      },
    ],
    banks: [
      {
        name: "GTBank",
        account: "0107355105",
        holder: "Lutheran High School, Obot Idim",
      },
      {
        name: "Zenith Bank",
        account: "1011112061",
        holder: "Lutheran High School, Obot Idim",
      },
    ],
  },
];

export default function ApplicationProcessPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div
        className="relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #1e1b4b 0%, #312e81 55%, #4c1d95 100%)",
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
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white/5 -translate-y-1/3 translate-x-1/3 pointer-events-none" />
        <div className="relative container mx-auto px-6 lg:px-16 pt-8 pb-16">
          <div className="mt-8 mb-6"></div>
          <div className="max-w-2xl">
            <span className="inline-block text-xs font-bold uppercase tracking-[0.22em] text-amber-400 mb-3">
              6 Steps
            </span>
            <h1
              className="text-5xl lg:text-6xl font-bold text-white leading-tight mb-4"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Application Process
            </h1>
            <p className="text-indigo-300 text-lg leading-relaxed">
              A clear, step-by-step guide to applying for admission to Lutheran
              High School, from obtaining your form to confirming your place.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 lg:px-16 py-16 max-w-4xl">
        <div className="my-4">
          <BackLink />
        </div>

        {/* Intro callout */}
        <div className="bg-white border border-indigo-100 rounded-3xl p-7 mb-14 flex gap-5 items-start shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-2xl shrink-0">
            ℹ️
          </div>
          <div>
            <h3
              className="font-bold text-indigo-900 text-base mb-1"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Before You Begin
            </h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Admission forms are available for entry into{" "}
              <strong className="text-indigo-700">
                JS1, JSS2, SS1, and SS2
              </strong>{" "}
              at a non-refundable application fee of{" "}
              <strong className="text-indigo-700">₦3,000</strong>. Online
              applications are strongly recommended for speed and convenience.
              Have your bank details and the candidate's information ready
              before starting.
            </p>
          </div>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-linear-to-b from-indigo-400 via-violet-300 to-emerald-300 hidden lg:block" />

          <div className="space-y-8">
            {steps.map(
              ({
                num,
                title,
                icon,
                accentBg,
                accentText,
                body,
                details,
                banks,
              }) => (
                <div key={num} className="flex gap-6 relative">
                  {/* Step number bubble */}
                  <div className="shrink-0 z-10 hidden lg:flex">
                    <div className="w-12 h-12 rounded-full bg-indigo-900 border-2 border-indigo-400 flex items-center justify-center">
                      <span className="text-indigo-200 text-[10px] font-bold">
                        {num}
                      </span>
                    </div>
                  </div>

                  {/* Card */}
                  <div className="flex-1 bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-indigo-200 hover:shadow-sm transition-all">
                    {/* Card header */}
                    <div
                      className={`px-6 py-4 border-b border-slate-100 flex items-center gap-4`}
                    >
                      <span className="text-2xl">{icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span
                            className={`lg:hidden inline-flex items-center justify-center w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold`}
                          >
                            {num}
                          </span>
                          <h3
                            className="font-bold text-indigo-900 text-base"
                            style={{
                              fontFamily: "'Playfair Display', Georgia, serif",
                            }}
                          >
                            {title}
                          </h3>
                        </div>
                      </div>
                    </div>

                    {/* Card body */}
                    <div className="p-6">
                      <p className="text-slate-600 text-sm leading-relaxed mb-5">
                        {body}
                      </p>

                      {details && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                          {details.map(({ label, desc }) => (
                            <div
                              key={label}
                              className={`border rounded-xl p-4 ${accentBg}`}
                            >
                              <p
                                className={`text-xs font-bold uppercase tracking-wider ${accentText} mb-1`}
                              >
                                {label}
                              </p>
                              <p className="text-slate-600 text-xs leading-relaxed">
                                {desc}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      {banks && (
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                            Bank Details
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {banks.map(({ name, account, holder }) => (
                              <div
                                key={name}
                                className="bg-slate-50 border border-slate-200 rounded-xl p-4"
                              >
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-6 h-6 rounded-md bg-indigo-100 flex items-center justify-center">
                                    <svg
                                      width="12"
                                      height="12"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                    >
                                      <rect
                                        x="3"
                                        y="11"
                                        width="18"
                                        height="11"
                                        rx="2"
                                        ry="2"
                                      />
                                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                    </svg>
                                  </div>
                                  <span className="text-indigo-800 font-bold text-xs">
                                    {name}
                                  </span>
                                </div>
                                <p className="text-slate-700 font-mono font-semibold text-sm">
                                  {account}
                                </p>
                                <p className="text-slate-400 text-xs mt-0.5">
                                  {holder}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ),
            )}
          </div>
        </div>

        {/* CTA */}
        <div
          className="mt-14 rounded-3xl overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4c1d95 100%)",
          }}
        >
          <div className="relative p-8 lg:p-10 text-center">
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
                backgroundSize: "24px 24px",
              }}
            />
            <div className="relative">
              <p className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-3">
                Ready?
              </p>
              <h3
                className="text-2xl font-bold text-white mb-3"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                Start Your Application
              </h3>
              <p className="text-indigo-300 text-sm mb-6 max-w-sm mx-auto">
                Online applications are fast, secure, and recommended. Fill and
                submit your form from anywhere.
              </p>
              <Link
                href="/admission/fill-admission-form"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-linear-to-r from-amber-500 to-amber-400 text-indigo-950 font-bold text-sm shadow-lg shadow-amber-900/30 hover:scale-105 transition-all duration-200"
              >
                Fill Admission Form
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
        </div>

        <div className="flex items-center justify-between mt-10">
          <BackLink />
          <Link
            href="/admission/fill-admission-form"
            className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            Next: Fill Admission Form
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
