"use client";

import Image from "next/image";

const programs = [
  {
    name: "West African Examination Council",
    short: "WAEC",
    badge: "Regular",
    badgeColor: "bg-emerald-100 text-emerald-700 border-emerald-200",
    description:
      "The gold-standard West African secondary school leaving certificate, accepted by universities across Africa and beyond.",
    icon: "🏅",
    image: "/images/waec_logo.png",
  },
  {
    name: "National Examination Council",
    short: "NECO",
    badge: "Regular",
    badgeColor: "bg-emerald-100 text-emerald-700 border-emerald-200",
    description:
      "Nigeria's national examination board certification, a widely recognised qualification for higher institution entry.",
    icon: "📜",
    image: "/images/neco_logo.png",
  },
  {
    name: "Standard Aptitude Test",
    short: "SAT",
    badge: "Exclusive",
    badgeColor: "bg-violet-100 text-violet-700 border-violet-200",
    description:
      "Preparation and sitting for the globally recognised SAT, opening doors to international universities and scholarships.",
    icon: "🌐",
    image: "/images/sat_logo.png",
  },
  {
    name: "Coding & ICT Vocationals",
    short: "ICT",
    badge: "Exclusive",
    badgeColor: "bg-violet-100 text-violet-700 border-violet-200",
    description:
      "An exclusive programme in software development, digital literacy, and ICT vocational skills for a modern career path.",
    icon: "💻",
    image: "/images/coding.png",
  },
];

export default function AcademicProgramsSection() {
  return (
    <section className="py-24 lg:py-32 bg-white relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-indigo-200 to-transparent" />

      <div className="container mx-auto px-6 lg:px-16">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-violet-600 mb-3">
            Curriculum
          </span>
          <h2
            className="text-4xl lg:text-5xl font-bold text-indigo-950 mb-4"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Academic Programs
          </h2>
          <p className="text-slate-500 max-w-xl mx-auto text-base lg:text-lg leading-relaxed">
            We offer both standard and exclusive programmes designed to give
            every student a competitive edge in higher education and beyond.
          </p>
          <div className="flex items-center justify-center gap-3 mt-6">
            <div className="w-12 h-px bg-indigo-300" />
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <div className="w-12 h-px bg-indigo-300" />
          </div>
        </div>

        {/* Programs grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {programs.map((prog) => (
            <div
              key={prog.name}
              className="group bg-linear-to-b from-white to-slate-50 rounded-2xl border border-slate-200 p-7 text-center hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-100/60 hover:-translate-y-1 transition-all duration-300"
            >
              {/* Icon */}
              <div className="relative overflow-clip w-16 h-16 rounded-2xl bg-linear-to-br from-indigo-50 to-violet-50 border border-indigo-100 flex items-center justify-center text-3xl mx-auto mb-5 group-hover:scale-110 transition-transform duration-300">
                {/* {prog.icon} */}
                <Image
                  src={prog.image}
                  alt="Program Logo"
                  fill={true}
                  className="object-contain"
                />
              </div>

              {/* Short name */}
              <div
                className="text-2xl font-bold text-indigo-800 mb-1"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                {prog.short}
              </div>

              {/* Full name */}
              <p className="text-xs text-slate-500 mb-4 leading-tight">
                {prog.name}
              </p>

              {/* Badge */}
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${prog.badgeColor} mb-4`}
              >
                {prog.badge}
              </span>

              {/* Description */}
              <p className="text-slate-500 text-xs leading-relaxed">
                {prog.description}
              </p>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-10 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block" />
            Regular: included in all enrolment packages
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-violet-400 inline-block" />
            Exclusive: available as add-on programmes
          </div>
        </div>
      </div>
    </section>
  );
}
