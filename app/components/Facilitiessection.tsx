"use client";
import Image from "next/image";

const facilities = [
  {
    title: "ICT Laboratory",
    description:
      "Fully equipped computer labs with high-speed internet, ensuring every student gains practical digital skills for a tech-driven world.",
    image: "/images/ict_lab.jpg",
    gradient: "from-violet-600 to-indigo-600",
    gradientBg: "from-violet-900/80 to-indigo-900/80",
  },
  {
    title: "Library",
    description:
      "A comprehensive library stocked with academic texts, journals, and digital resources curated for secondary school learning.",
    image: "/images/library.jpg",
    gradient: "from-indigo-600 to-blue-600",
    gradientBg: "from-indigo-900/80 to-blue-900/80",
  },
  {
    title: "Hostel Accommodation",
    description:
      "State-of-the-art boarding facilities offering a safe, comfortable, and structured living environment for residential students.",
    image: "/images/hostel.jpg",
    gradient: "from-blue-600 to-cyan-600",
    gradientBg: "from-blue-900/80 to-cyan-900/80",
  },
  {
    title: "Hygienic Convenience",
    description:
      "Top-rated sanitation facilities maintained to the highest standards for students, staff, and visitors.",
    image: "/images/convenience.jpg",
    gradient: "from-cyan-600 to-teal-600",
    gradientBg: "from-cyan-900/80 to-teal-900/80",
  },
  {
    title: "Research Center",
    description:
      "Modern science laboratories and research spaces equipped for experiments, projects, and college-level scientific inquiry.",
    image: "/images/resource_center.jpg",
    gradient: "from-teal-600 to-emerald-600",
    gradientBg: "from-teal-900/80 to-emerald-900/80",
  },
  {
    title: "Qualified Staff",
    description:
      "A dedicated team of experienced educators committed to academic excellence, student wellbeing, and holistic development.",
    image: "/images/staff.jpg",
    gradient: "from-violet-600 to-purple-600",
    gradientBg: "from-violet-900/80 to-purple-900/80",
  },
];

export default function FacilitiesSection() {
  return (
    // bg-linear-to-b from-slate-50 to-white
    <section className="py-24 lg:py-32 bg-slate-50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-indigo-300 to-transparent" />
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-indigo-50 blur-3xl opacity-60" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-violet-50 blur-3xl opacity-60" />

      <div className="container mx-auto px-6 lg:px-16 relative">
        {/* Section header */}
        <div className="text-center mb-16">
          <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-violet-600 mb-3">
            Campus Life
          </span>
          <h2
            className="text-4xl lg:text-5xl font-bold text-indigo-950 mb-4"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Our Facilities
          </h2>
          <p className="text-slate-500 max-w-xl mx-auto text-base lg:text-lg leading-relaxed">
            Every corner of our campus is designed to inspire learning, foster
            growth, and support the full development of each student.
          </p>
          <div className="flex items-center justify-center gap-3 mt-6">
            <div className="w-12 h-px bg-indigo-300" />
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <div className="w-12 h-px bg-indigo-300" />
          </div>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {facilities.map((facility) => (
            <div
              key={facility.title}
              className="group relative bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-100/60 hover:-translate-y-1 transition-all duration-300 overflow-hidden"
            >
              {/* Image area — fixed height thumbnail */}
              <div className="relative h-32 overflow-hidden bg-indigo-100">
                {/* Real image: swap the div below for: */}
                <Image
                  src={facility.image}
                  alt={facility.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* Fallback gradient shown when image hasn't loaded */}
                {/* <div
                  className={`absolute inset-0 bg-linear-to-br ${facility.gradient} opacity-50`}
                /> */}

                {/* Title overlay on image */}
                <div className="absolute bottom-0 left-0 right-0 px-5 py-3 bg-linear-to-t from-black/70 to-transparent">
                  <h3
                    className="text-white font-bold text-base leading-tight"
                    style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                  >
                    {facility.title}
                  </h3>
                </div>
              </div>

              {/* Card body */}
              <div className="p-5">
                {/* Description */}
                <p className="text-slate-500 text-sm leading-relaxed mb-4">
                  {facility.description}
                </p>

                {/* CTA */}
                <button className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 group-hover:text-violet-600 transition-colors uppercase tracking-wider cursor-pointer">
                  See All
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    className="group-hover:translate-x-0.5 transition-transform"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
