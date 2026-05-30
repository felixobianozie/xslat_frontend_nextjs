"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

// Each facility entry: title, description, and image path
const facilities = [
  {
    id: "ict-laboratory",
    title: "ICT Laboratory",
    category: "Technology",
    categoryColor: "bg-violet-100 text-violet-700 border-violet-200",
    description:
      "Our fully equipped ICT laboratory houses modern computers with high-speed internet access. Students receive hands-on training in digital literacy, software applications, and programming fundamentals. The lab supports our exclusive Coding and ICT Vocational programme, preparing students for a technology-driven world.",
    image: "/images/ict_lab.jpg",
    gradient: "from-violet-600 to-indigo-600",
  },
  {
    id: "library",
    title: "Library",
    category: "Learning",
    categoryColor: "bg-indigo-100 text-indigo-700 border-indigo-200",
    description:
      "The LHS library is a comprehensive resource centre stocked with academic texts, reference journals, past examination materials, and digital resources curated specifically for secondary school learning. It provides a quiet, structured environment for independent study and research, open to all students during and after school hours.",
    image: "/images/library.jpg",
    gradient: "from-indigo-600 to-blue-600",
  },
  {
    id: "hostel-accommodation",
    title: "Hostel Accommodation",
    category: "Boarding",
    categoryColor: "bg-blue-100 text-blue-700 border-blue-200",
    description:
      "Boarding students at LHS enjoy well-structured hostel accommodation designed for comfort, safety, and academic focus. Male students are housed in four hostels, Luther, Nau, Ekong, and Konz, while female students reside in Lizzy Hall. Each hostel is supervised by resident staff to maintain order, discipline, and student wellbeing around the clock.",
    image: "/images/hostel.jpg",
    gradient: "from-blue-600 to-cyan-600",
  },
  {
    id: "hygienic-convenience",
    title: "Hygienic Convenience",
    category: "Welfare",
    categoryColor: "bg-cyan-100 text-cyan-700 border-cyan-200",
    description:
      "Sanitation and hygiene are taken seriously at LHS. Our convenience facilities are maintained to a high standard for students, staff, and visitors alike. Regular inspections ensure that cleanliness is upheld across the entire campus, contributing to a healthy and dignified environment for everyone.",
    image: "/images/convenience.jpg",
    gradient: "from-cyan-600 to-teal-600",
  },
  {
    id: "research-centre",
    title: "Research Centre",
    category: "Science",
    categoryColor: "bg-teal-100 text-teal-700 border-teal-200",
    description:
      "Our modern science laboratories and research spaces are equipped for chemistry, physics, and biology experiments at secondary school level and beyond. Students are encouraged to carry out projects and scientific inquiries that develop critical thinking and practical skills. The research centre supports both internal assessments and external examination practicals.",
    image: "/images/resource_center.jpg",
    gradient: "from-teal-600 to-emerald-600",
  },
  {
    id: "qualified-staff",
    title: "Qualified Staff",
    category: "People",
    categoryColor: "bg-amber-100 text-amber-700 border-amber-200",
    description:
      "Behind every great institution are great people. LHS is staffed by a dedicated team of experienced and qualified educators committed to academic excellence, student wellbeing, and holistic development. Our teachers are trained in modern pedagogical approaches and many are long-serving members of the Luthisco community, contributing to the school's culture of consistency and care.",
    image: "/images/staff.jpg",
    gradient: "from-violet-600 to-purple-600",
  },
];

// Lightbox component: shown when a user clicks a facility image
function Lightbox({
  facility,
  onClose,
}: {
  facility: (typeof facilities)[0];
  onClose: () => void;
}) {
  return (
    // Overlay - clicking the backdrop closes the lightbox
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      {/* Inner container - stop propagation so clicking the image itself doesn't close */}
      <div
        className="relative max-w-4xl w-full max-h-[90vh] rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image */}
        <div className="relative w-full" style={{ paddingBottom: "60%" }}>
          <Image
            src={facility.image}
            alt={facility.title}
            fill
            className="object-cover"
          />
        </div>

        {/* Caption bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/80 to-transparent px-6 py-5">
          <p
            className="text-white font-bold text-xl"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            {facility.title}
          </p>
          <span
            className={`inline-block mt-1 px-3 py-1 rounded-full border text-xs font-semibold ${facility.categoryColor}`}
          >
            {facility.category}
          </span>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 border border-white/20 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
          aria-label="Close image"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function FacilitiesPage() {
  // Track which facility image is open in the lightbox (null = closed)
  const [lightboxFacility, setLightboxFacility] = useState<
    (typeof facilities)[0] | null
  >(null);

  return (
    <>
      {/* Lightbox - rendered outside the normal flow, covering the whole screen */}
      {lightboxFacility && (
        <Lightbox
          facility={lightboxFacility}
          onClose={() => setLightboxFacility(null)}
        />
      )}

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
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
              backgroundSize: "32px 32px",
            }}
          />
          <div className="absolute top-0 right-0 w-150 h-150 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/4 pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-64 h-64 rounded-full bg-amber-400/10 translate-y-1/2 pointer-events-none" />

          <div className="relative container mx-auto px-6 lg:px-16 py-16 lg:py-24">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 text-amber-300 text-xs font-bold uppercase tracking-widest mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                Campus Life
              </span>
              <h1
                className="text-5xl lg:text-6xl font-bold text-white leading-tight mb-4"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                Our Facilities
              </h1>
              <p className="text-indigo-300 text-lg leading-relaxed">
                Every corner of the Luthisco Republic is designed to inspire
                learning, foster growth, and support the full development of
                each student.
              </p>
            </div>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="container mx-auto px-6 lg:px-16 py-5 flex items-center gap-2 text-xs text-slate-400">
          <Link href="/" className="hover:text-indigo-600 transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-slate-600 font-medium">Facilities</span>
        </div>

        {/* Intro */}
        <div className="container mx-auto px-6 lg:px-16 mb-14">
          <div className="bg-white border border-indigo-100 rounded-2xl p-6 flex gap-4 items-start shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xl shrink-0">
              🏛️
            </div>
            <p className="text-slate-600 text-sm leading-relaxed">
              Lutheran High School, Obot Idim continues to invest in world-class
              facilities that support academic excellence, student welfare, and
              co-curricular development. Click any facility image below for a
              full view.
            </p>
          </div>
        </div>

        {/* Facilities list */}
        <div className="container mx-auto px-6 lg:px-16 pb-24">
          <div className="space-y-12">
            {facilities.map((facility, index) => (
              // Alternate layout: odd items have image on left, even on right
              <div
                key={facility.id}
                id={facility.id}
                className={`group bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-lg hover:border-indigo-200 transition-all duration-300 flex flex-col ${
                  index % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"
                }`}
              >
                {/* Image panel - clickable to open lightbox */}
                <div
                  className="relative lg:w-2/5 h-64 lg:h-auto shrink-0 overflow-hidden cursor-pointer"
                  onClick={() => setLightboxFacility(facility)}
                >
                  <Image
                    src={facility.image}
                    alt={facility.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Hover overlay with zoom hint */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-white/0 group-hover:bg-white/90 flex items-center justify-center transition-all duration-300 scale-75 group-hover:scale-100">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="text-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      >
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        <line x1="11" y1="8" x2="11" y2="14" />
                        <line x1="8" y1="11" x2="14" y2="11" />
                      </svg>
                    </div>
                  </div>
                  {/* Category badge on the image */}
                  <div className="absolute top-4 left-4">
                    <span
                      className={`inline-block px-3 py-1 rounded-full border text-xs font-bold ${facility.categoryColor} backdrop-blur-sm`}
                    >
                      {facility.category}
                    </span>
                  </div>
                </div>

                {/* Content panel */}
                <div className="flex flex-col justify-center p-8 lg:p-10 flex-1">
                  {/* Decorative number */}
                  <span
                    className="text-7xl font-bold text-slate-100 leading-none mb-2 select-none"
                    style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <h2
                    className="text-2xl lg:text-3xl font-bold text-indigo-950 mb-4 -mt-4"
                    style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                  >
                    {facility.title}
                  </h2>

                  <p className="text-slate-600 text-base leading-relaxed mb-6">
                    {facility.description}
                  </p>

                  {/* Click to view hint */}
                  <button
                    onClick={() => setLightboxFacility(facility)}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-violet-600 transition-colors w-fit"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                    View photo
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom CTA */}
          <div
            className="mt-20 rounded-3xl overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4c1d95 100%)",
            }}
          >
            <div className="relative p-8 lg:p-12 text-center">
              <div
                className="absolute inset-0 opacity-[0.04]"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
                  backgroundSize: "28px 28px",
                }}
              />
              <div className="relative">
                <h3
                  className="text-3xl font-bold text-white mb-3"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  Come See for Yourself
                </h3>
                <p className="text-indigo-300 text-base mb-8 max-w-lg mx-auto">
                  Words and photos can only say so much. We welcome prospective
                  students and parents to visit the campus and experience the
                  Luthisco Republic firsthand.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link
                    href="/admission"
                    className="px-8 py-3.5 rounded-full bg-linear-to-r from-amber-500 to-amber-400 text-indigo-950 font-bold text-sm tracking-wide shadow-lg shadow-amber-900/30 hover:scale-105 transition-all duration-200"
                  >
                    Apply Now 2026/2027
                  </Link>
                  <Link
                    href="/contact"
                    className="px-8 py-3.5 rounded-full border border-indigo-500/50 text-indigo-200 font-semibold text-sm tracking-wide hover:bg-indigo-800/40 hover:border-indigo-400 transition-all duration-200"
                  >
                    Contact the School
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
