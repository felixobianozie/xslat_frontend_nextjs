"use client";

import { useState } from "react";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Video {
  youtubeId: string; // just the video ID, e.g. "dQw4w9WgXcQ"
  title: string;
  description: string;
  duration?: string; // e.g. "3:45"
}

interface VideoCollection {
  id: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
  videos: Video[];
}

interface Term {
  id: string;
  label: string;
  session: string;
  term: string;
  collections: VideoCollection[];
}

// ── DATA ─────────────────────────────────────────────────────────────────────
// youtubeId values are placeholders using publicly available YouTube videos.
// Replace them with actual LHS video IDs when available.
// Thumbnail URL format: https://img.youtube.com/vi/{id}/hqdefault.jpg

const galleryData: Term[] = [
  {
    id: "2024-2025-first-term",
    label: "First Term 2024/2025",
    session: "2024/2025",
    term: "First Term",
    collections: [
      {
        id: "school-assembly-2024",
        title: "Morning Assembly & Devotions",
        description:
          "Clips from the morning devotion and school assembly sessions that set the tone for each school day at LHS.",
        date: "October 2024",
        tags: ["Assembly", "Devotion", "Campus Life"],
        videos: [
          {
            youtubeId: "1",
            title: "Morning Assembly Highlights",
            description:
              "Students gather for the weekly assembly: prayers, announcements, and school spirit on full display.",
            duration: "4:22",
          },
          {
            youtubeId: "2",
            title: "Chapel Devotion Recordings",
            description:
              "Weekly chapel devotion led by the school chaplain, a cornerstone of the Luthisco spiritual life.",
            duration: "6:10",
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
        id: "interhouse-sports-2024",
        title: "Interhouse Sports 2024",
        description:
          "Full coverage of the 2024 Interhouse Sports Competition: races, field events, cheerleading, and the closing ceremony.",
        date: "February 2025",
        tags: ["Sports", "Interhouse", "Competition"],
        videos: [
          {
            youtubeId: "3",
            title: "100m Sprint Finals",
            description:
              "The highly anticipated 100m sprint finals featuring representatives from all four houses.",
            duration: "2:15",
          },
          {
            youtubeId: "4",
            title: "Interhouse Relay Races",
            description:
              "Heart-stopping relay races that decided the overall interhouse championship standings.",
            duration: "5:30",
          },
          {
            youtubeId: "5",
            title: "Closing Ceremony and Awards",
            description:
              "The closing ceremony, trophy presentations, and the announcement of the overall winning house.",
            duration: "8:45",
          },
        ],
      },
      {
        id: "cultural-night-2025",
        title: "Cultural Night 2025",
        description:
          "Performances, dances, drama, and cultural displays from the annual Cultural Night celebration.",
        date: "March 2025",
        tags: ["Culture", "Performance", "Arts"],
        videos: [
          {
            youtubeId: "6",
            title: "Cultural Drama Performance",
            description:
              "The Drama Club's outstanding performance exploring themes of identity, heritage, and excellence.",
            duration: "12:00",
          },
          {
            youtubeId: "7",
            title: "Traditional Dance Display",
            description:
              "Students perform traditional dances representing the rich cultural heritage of Akwa Ibom State.",
            duration: "7:30",
          },
        ],
      },
    ],
  },
];

// ── Video thumbnail URL helper ─────────────────────────────────────────────

function getThumb(youtubeId: string) {
  return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
}

function getYouTubeUrl(youtubeId: string) {
  return `https://www.youtube.com/watch?v=${youtubeId}`;
}

// ── Video Viewer Modal ────────────────────────────────────────────────────────

function VideoViewer({
  video,
  onClose,
}: {
  video: Video;
  onClose: () => void;
}) {
  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
        {/* Top bar */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h3 className="text-white font-bold text-lg leading-tight">
              {video.title}
            </h3>
            <p className="text-slate-400 text-sm mt-0.5">{video.description}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* Open on YouTube link */}
            <a
              href={getYouTubeUrl(video.youtubeId)}
              target="_blank"
              rel="noopener noreferrer"
              title="Open on YouTube"
              className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-red-600/20 hover:bg-red-600/40 border border-red-500/30 text-red-400 text-xs font-semibold transition-colors"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path
                  d="M19.59 6.69a4.83 4.83 0 0 1-3.77-2.75 12.14 12.14 0 0 0-8.6 0 4.83 4.83 0 0 1-3.77 2.75 5 5 0 0 0-.94 3.3v4a5 5 0 0 0 .94 3.31 4.83 4.83 0 0 1 3.77 2.75 12.14 12.14 0 0 0 8.6 0 4.83 4.83 0 0 1 3.77-2.75 5 5 0 0 0 .94-3.31v-4a5 5 0 0 0-.94-3.3z"
                  opacity="0"
                />
                <path
                  d="M23 12s-4-8-11-8-11 8-11 8 4 8 11 8 11-8 11-8z"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                />
              </svg>
              YouTube
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
            {/* Close */}
            <button
              onClick={onClose}
              title="Close"
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
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

        {/* Embedded player */}
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black">
          <iframe
            src={`https://www.youtube.com/embed/${video.youtubeId}?autoplay=1&rel=0`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        </div>

        <p className="text-slate-500 text-xs text-center mt-3">
          Click outside the video or press the close button to exit
        </p>
      </div>
    </div>
  );
}

// ── Video Thumbnail Card ──────────────────────────────────────────────────────

function VideoCard({
  video,
  onPlay,
}: {
  video: Video;
  onPlay: (video: Video) => void;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-rose-200 hover:shadow-lg hover:shadow-rose-100/60 hover:-translate-y-1 transition-all duration-300 group">
      {/* Thumbnail */}
      <div
        className="relative aspect-video overflow-hidden bg-slate-100 cursor-pointer"
        onClick={() => onPlay(video)}
      >
        {/* YouTube thumbnail image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={getThumb(video.youtubeId)}
          alt={video.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Play button overlay */}
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-red-600/90 group-hover:bg-red-600 flex items-center justify-center shadow-lg transition-all group-hover:scale-110">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
        </div>

        {/* Duration badge */}
        {video.duration && (
          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/70 text-white text-xs font-mono font-semibold">
            {video.duration}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h4
          className="font-bold text-indigo-950 text-sm mb-1.5 line-clamp-2"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          {video.title}
        </h4>
        <p className="text-slate-500 text-xs leading-relaxed line-clamp-2">
          {video.description}
        </p>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function VideoGalleryPage() {
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);

  // Total video count
  const totalVideos = galleryData.reduce(
    (acc, term) =>
      acc + term.collections.reduce((a, col) => a + col.videos.length, 0),
    0,
  );
  const totalCollections = galleryData.reduce(
    (acc, term) => acc + term.collections.length,
    0,
  );

  return (
    <>
      {/* Video viewer modal */}
      {activeVideo && (
        <VideoViewer video={activeVideo} onClose={() => setActiveVideo(null)} />
      )}

      <main className="min-h-screen bg-slate-50">
        {/* Hero */}
        <div
          className="relative overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, #1e1b4b 0%, #881337 60%, #be123c 100%)",
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
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-rose-400/10 -translate-y-1/3 translate-x-1/3 pointer-events-none" />

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
                Video Gallery
              </h1>
              <p className="text-rose-200 text-lg leading-relaxed">
                Watch highlight videos from interhouse sports, cultural
                performances, graduations, and memorable events across the
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
          <span className="text-slate-600 font-medium">Video Gallery</span>
        </div>

        <div className="container mx-auto px-6 lg:px-16 pb-24 max-w-6xl">
          {/* Stats strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-12">
            {[
              { value: String(totalVideos), label: "Videos" },
              { value: String(totalCollections), label: "Collections" },
              { value: String(galleryData.length), label: "Terms covered" },
            ].map(({ value, label }) => (
              <div
                key={label}
                className="bg-white border border-slate-200 rounded-2xl p-5 text-center"
              >
                <div
                  className="text-3xl font-bold text-rose-700 mb-1"
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

          {/* Notice about YouTube */}
          <div className="bg-white border border-rose-100 rounded-2xl p-5 flex gap-4 items-start mb-10 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-xl shrink-0">
              📺
            </div>
            <div>
              <p className="font-bold text-indigo-900 text-sm mb-1">
                Watching Videos
              </p>
              <p className="text-slate-500 text-sm leading-relaxed">
                Click any video thumbnail to watch it here within the site. To
                open a video directly on YouTube, use the YouTube link button
                that appears in the video viewer.
              </p>
            </div>
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
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-rose-200 text-rose-700 text-xs font-semibold hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all duration-200 shadow-sm"
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
                  <div className="w-10 h-10 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polygon points="23 7 16 12 23 17 23 7" />
                      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
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

                {/* Collections */}
                <div className="space-y-10">
                  {term.collections.map((col) => (
                    <div key={col.id}>
                      {/* Collection header */}
                      <div className="flex items-start gap-3 mb-5">
                        <div>
                          {/* Tags */}
                          <div className="flex flex-wrap gap-1.5 mb-1.5">
                            {col.tags.map((tag) => (
                              <span
                                key={tag}
                                className="inline-block px-2 py-0.5 rounded-full bg-rose-50 border border-rose-100 text-rose-600 text-[10px] font-semibold uppercase tracking-wider"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                          <h3
                            className="font-bold text-indigo-950 text-lg"
                            style={{
                              fontFamily: "'Playfair Display', Georgia, serif",
                            }}
                          >
                            {col.title}
                          </h3>
                          <p className="text-slate-500 text-sm mt-0.5">
                            {col.description}
                          </p>
                        </div>
                        <span className="ml-auto shrink-0 text-xs text-slate-400 flex items-center gap-1.5 whitespace-nowrap">
                          <svg
                            width="11"
                            height="11"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <rect
                              x="3"
                              y="4"
                              width="18"
                              height="18"
                              rx="2"
                              ry="2"
                            />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                          {col.date}
                        </span>
                      </div>

                      {/* Video grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {col.videos.map((video) => (
                          <VideoCard
                            key={video.youtubeId}
                            video={video}
                            onPlay={setActiveVideo}
                          />
                        ))}
                      </div>
                    </div>
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
              href="/resources/photos"
              className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              Photo Gallery
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
