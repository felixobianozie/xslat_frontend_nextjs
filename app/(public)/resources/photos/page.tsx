"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Photo {
  src: string;
  caption: string;
  alt: string;
}

interface Collection {
  id: string;
  title: string;
  description: string;
  date: string; // e.g. "November 2024"
  coverIndex: number; // which photo index to use as cover
  tags: string[];
  photos: Photo[];
}

interface Term {
  id: string; // anchor-link id, e.g. "2024-2025-first-term"
  label: string; // display, e.g. "First Term 2024/2025"
  session: string;
  term: string;
  collections: Collection[];
}

// ── DATA ─────────────────────────────────────────────────────────────────────
// All images reference the same /images/ folder used throughout the site.
// Add new terms or collections by following the same shape below.

const galleryData: Term[] = [
  {
    id: "2024-2025-first-term",
    label: "First Term 2024/2025",
    session: "2024/2025",
    term: "First Term",
    collections: [
      {
        id: "staff-2024",
        title: "Our Dedicated Staff",
        description:
          "A tribute to the men and women whose daily commitment shapes the Luthisco experience; from classroom teachers to boarding house officers.",
        date: "October 2024",
        coverIndex: 0,
        tags: ["Staff", "Campus"],
        photos: [
          {
            src: "/images/staff.jpg",
            caption:
              "Members of the LHS teaching staff during the 2024/2025 first term.",
            alt: "LHS staff group photo",
          },
          {
            src: "/images/ict_lab.jpg",
            caption:
              "The ICT Laboratory where teachers bring digital learning to life.",
            alt: "ICT Lab interior",
          },
          {
            src: "/images/library.jpg",
            caption: "The school library, a quiet hub of academic inquiry.",
            alt: "School library",
          },
        ],
      },
      {
        id: "facilities-2024",
        title: "Campus Facilities",
        description:
          "A visual tour of the facilities that make the Luthisco Republic a world-class learning environment.",
        date: "October 2024",
        coverIndex: 0,
        tags: ["Campus", "Facilities"],
        photos: [
          {
            src: "/images/ict_lab.jpg",
            caption:
              "The ICT Laboratory fully equipped with computers and high-speed internet.",
            alt: "ICT Laboratory",
          },
          {
            src: "/images/library.jpg",
            caption:
              "Our comprehensive library stocked with academic texts and digital resources.",
            alt: "School Library",
          },
          {
            src: "/images/hostel.jpg",
            caption:
              "The boarding hostel, home to residential students of the Luthisco Republic.",
            alt: "Boarding Hostel",
          },
          {
            src: "/images/resource_center.jpg",
            caption:
              "The Research Centre, equipped for scientific inquiry and project work.",
            alt: "Research Centre",
          },
          {
            src: "/images/convenience.jpg",
            caption:
              "Hygienic convenience facilities maintained to the highest standards.",
            alt: "Sanitation Facilities",
          },
        ],
      },
    ],
  },
  {
    id: "2024-2025-second-term",
    label: "Second Term 2024/2025",
    session: "2024/2025",
    term: "Second Term",
    collections: [
      {
        id: "interhouse-2024",
        title: "Interhouse Sports 2024",
        description:
          "Highlights and celebrations from the 2024 Interhouse Sports Competition: colour, energy, and Luthisco spirit on full display.",
        date: "February 2025",
        coverIndex: 0,
        tags: ["Sports", "Interhouse", "Students"],
        photos: [
          {
            src: "/images/interhouse_students_celebrations_2024.png",
            caption:
              "Students celebrate a winning moment at the 2024 Interhouse Sports Competition.",
            alt: "Interhouse sports celebrations 2024",
          },
          {
            src: "/images/school_girls_football.jpg",
            caption:
              "The girls' football team competing during the 2024 Interhouse Sports.",
            alt: "Girls football match",
          },
        ],
      },
      {
        id: "biology-2025",
        title: "Biology Practicals",
        description:
          "Students engaging in hands-on science learning in the biology laboratory: future doctors, researchers, and scientists at work.",
        date: "March 2025",
        coverIndex: 0,
        tags: ["Academics", "Science", "Students"],
        photos: [
          {
            src: "/images/students_biology_practicals.jpg",
            caption:
              "JSS students carry out biology practicals in the school's science laboratory.",
            alt: "Students during biology practicals",
          },
          {
            src: "/images/resource_center.jpg",
            caption:
              "The Research Centre that supports advanced science experiments.",
            alt: "Research Centre",
          },
        ],
      },
    ],
  },
];

// ── Lightbox Component ────────────────────────────────────────────────────────

function Lightbox({
  photos,
  startIndex,
  collectionTitle,
  onClose,
}: {
  photos: Photo[];
  startIndex: number;
  collectionTitle: string;
  onClose: () => void;
}) {
  const [current, setCurrent] = useState(startIndex);
  const photo = photos[current];

  function prev() {
    setCurrent((i) => (i - 1 + photos.length) % photos.length);
  }

  function next() {
    setCurrent((i) => (i + 1) % photos.length);
  }

  // Download the current image to the user's device
  async function handleDownload() {
    try {
      const res = await fetch(photo.src);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = photo.alt.replace(/\s+/g, "-").toLowerCase() + ".jpg";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // Fallback: open in new tab if direct download fails (cross-origin)
      window.open(photo.src, "_blank");
    }
  }

  return (
    /* Backdrop: clicking it closes the lightbox */
    <div
      className="fixed inset-0 z-50 bg-black/90 flex flex-col"
      onClick={onClose}
    >
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-5 py-4 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <p className="text-white font-semibold text-sm">{collectionTitle}</p>
          <p className="text-slate-400 text-xs">
            {current + 1} / {photos.length}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Download button */}
          <button
            onClick={handleDownload}
            title="Download photo"
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </button>
          {/* Close button */}
          <button
            onClick={onClose}
            title="Close"
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <svg
              width="18"
              height="18"
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

      {/* Image area */}
      <div
        className="flex-1 flex items-center justify-center relative px-16 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative w-full max-w-4xl max-h-full aspect-4/3">
          <Image
            src={photo.src}
            alt={photo.alt}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 80vw"
          />
        </div>

        {/* Prev button */}
        {photos.length > 1 && (
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}

        {/* Next button */}
        {photos.length > 1 && (
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        )}
      </div>

      {/* Caption bar */}
      <div
        className="shrink-0 px-5 py-4 border-t border-white/10 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-slate-300 text-sm leading-relaxed max-w-2xl mx-auto">
          {photo.caption}
        </p>
        {/* Dot indicators */}
        {photos.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 mt-3">
            {photos.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`transition-all rounded-full cursor-pointer ${
                  i === current
                    ? "w-6 h-2 bg-amber-400"
                    : "w-2 h-2 bg-white/30 hover:bg-white/60"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Collection Card ───────────────────────────────────────────────────────────

function CollectionCard({
  collection,
  onOpenPhoto,
}: {
  collection: Collection;
  onOpenPhoto: (photos: Photo[], index: number, title: string) => void;
}) {
  const cover = collection.photos[collection.coverIndex];
  const extra = collection.photos.length - 1; // photos beyond the cover

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-100/60 hover:-translate-y-1 transition-all duration-300 group">
      {/* Cover image */}
      <div
        className="relative h-48 overflow-hidden cursor-pointer bg-indigo-50"
        onClick={() =>
          onOpenPhoto(
            collection.photos,
            collection.coverIndex,
            collection.title,
          )
        }
      >
        <Image
          src={cover.src}
          alt={cover.alt}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {/* Photo count badge */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-xs font-semibold">
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          {collection.photos.length} photo
          {collection.photos.length !== 1 ? "s" : ""}
        </div>
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-indigo-950/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-5">
        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {collection.tags.map((tag) => (
            <span
              key={tag}
              className="inline-block px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-[10px] font-semibold uppercase tracking-wider"
            >
              {tag}
            </span>
          ))}
        </div>

        <h3
          className="font-bold text-indigo-950 text-base mb-1"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          {collection.title}
        </h3>
        <p className="text-slate-500 text-xs leading-relaxed mb-4">
          {collection.description}
        </p>

        {/* Footer row */}
        <div className="flex items-center justify-between">
          <span className="text-slate-400 text-xs flex items-center gap-1.5">
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            {collection.date}
          </span>

          {/* Thumbnail strip */}
          {extra > 0 && (
            <div className="flex items-center gap-1">
              {collection.photos.slice(1, 4).map((p, i) => (
                <button
                  key={i}
                  onClick={() =>
                    onOpenPhoto(collection.photos, i + 1, collection.title)
                  }
                  className="relative w-8 h-8 rounded-md overflow-hidden border border-white ring-1 ring-slate-200 hover:ring-indigo-400 transition-all cursor-pointer"
                >
                  <Image
                    src={p.src}
                    alt={p.alt}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
              {collection.photos.length > 4 && (
                <button
                  onClick={() =>
                    onOpenPhoto(collection.photos, 0, collection.title)
                  }
                  className="w-8 h-8 rounded-md bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 text-[10px] font-bold cursor-pointer"
                >
                  +{collection.photos.length - 4}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function PhotoGalleryPage() {
  // Lightbox state
  const [lightbox, setLightbox] = useState<{
    photos: Photo[];
    index: number;
    title: string;
  } | null>(null);

  function openLightbox(photos: Photo[], index: number, title: string) {
    setLightbox({ photos, index, title });
  }

  function closeLightbox() {
    setLightbox(null);
  }

  // Total photo count across all collections
  const totalPhotos = galleryData.reduce(
    (acc, term) =>
      acc + term.collections.reduce((a, col) => a + col.photos.length, 0),
    0,
  );

  const totalCollections = galleryData.reduce(
    (acc, term) => acc + term.collections.length,
    0,
  );

  return (
    <>
      {/* Lightbox: rendered outside main so it covers everything */}
      {lightbox && (
        <Lightbox
          photos={lightbox.photos}
          startIndex={lightbox.index}
          collectionTitle={lightbox.title}
          onClose={closeLightbox}
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
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-violet-400/10 -translate-y-1/3 translate-x-1/3 pointer-events-none" />

          <div className="relative container mx-auto px-6 lg:px-16 pt-8 pb-16">
            <div className="max-w-2xl mt-8">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 text-amber-300 text-xs font-bold uppercase tracking-widest mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                Media Archive
              </span>
              <h1
                className="text-5xl lg:text-6xl font-bold text-white leading-tight mb-4"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                Photo Gallery
              </h1>
              <p className="text-indigo-300 text-lg leading-relaxed">
                A growing collection of photo memories from sports days,
                cultural nights, campus life, and every proud moment inside the
                Luthisco Republic.
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
          <Link
            href="/resources"
            className="hover:text-indigo-600 transition-colors"
          >
            Resources
          </Link>
          <span>/</span>
          <span className="text-slate-600 font-medium">Photo Gallery</span>
        </div>

        <div className="container mx-auto px-6 lg:px-16 pb-24 max-w-6xl">
          {/* Stats strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-12">
            {[
              { value: String(totalPhotos), label: "Photos" },
              { value: String(totalCollections), label: "Collections" },
              { value: String(galleryData.length), label: "Terms covered" },
            ].map(({ value, label }) => (
              <div
                key={label}
                className="bg-white border border-slate-200 rounded-2xl p-5 text-center"
              >
                <div
                  className="text-3xl font-bold text-indigo-800 mb-1"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  {value}
                </div>
                <div className="text-slate-500 text-xs uppercase tracking-wider">
                  {label}
                </div>
              </div>
            ))}
          </div>

          {/* Term jump tags */}
          <div className="mb-10">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-4">
              Jump to term
            </p>
            <div className="flex flex-wrap gap-2">
              {galleryData.map((term) => (
                <a
                  key={term.id}
                  href={`#${term.id}`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-violet-200 text-violet-700 text-xs font-semibold hover:bg-violet-600 hover:text-white hover:border-violet-600 transition-all duration-200 shadow-sm"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  {term.label}
                </a>
              ))}
            </div>
          </div>

          {/* Terms and collections */}
          <div className="space-y-16">
            {galleryData.map((term) => (
              <section key={term.id} id={term.id} className="scroll-mt-6">
                {/* Term heading */}
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-violet-100 border border-violet-200 flex items-center justify-center text-violet-600 shrink-0">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-amber-500 mb-0.5">
                      Academic Session {term.session}
                    </p>
                    <h2
                      className="text-xl font-bold text-indigo-950"
                      style={{
                        fontFamily: "'Playfair Display', Georgia, serif",
                      }}
                    >
                      {term.term}
                    </h2>
                  </div>
                  <span className="ml-auto text-xs text-slate-400 font-medium">
                    {term.collections.length} collection
                    {term.collections.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Collection grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {term.collections.map((col) => (
                    <CollectionCard
                      key={col.id}
                      collection={col}
                      onOpenPhoto={openLightbox}
                    />
                  ))}
                </div>

                <div className="mt-10 h-px bg-slate-200" />
              </section>
            ))}
          </div>

          {/* Bottom nav */}
          <div className="flex items-center justify-between mt-10">
            <Link
              href="/resources"
              className="inline-flex items-center gap-2 text-sm text-indigo-500 hover:text-indigo-700 transition-colors"
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
              Back to Resources
            </Link>
            <Link
              href="/resources/videos"
              className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              Video Gallery
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
    </>
  );
}
