"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";

const mainLinks = [
  { label: "About", href: "/about" },
  { label: "Admission", href: "/admission" },
  { label: "Finances", href: "/finance" },
  { label: "Notices", href: "/notice" },
  { label: "Results", href: "/results" },
];

const moreLinks = [
  { label: "Alumni", href: "/coming-soon" },
  { label: "Facilities", href: "/facilities" },
  { label: "Resources", href: "/resources" },
  { label: "Contact", href: "/contact" },
];

export default function Navbar() {
  // Session is read once and drives both the desktop and mobile auth areas.
  // Status values: "loading" | "authenticated" | "unauthenticated".
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";
  const isAuthLoading = status === "loading";

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false); // Avatar dropdown
  const [bannerVisible, setBannerVisible] = useState(true);

  const moreRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 300); // Originally 20
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the "More" dropdown when the user clicks outside it.
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close the account dropdown when the user clicks outside it. Kept as a
  // separate effect from the "More" handler so each dropdown is independent.
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        accountRef.current &&
        !accountRef.current.contains(e.target as Node)
      ) {
        setAccountOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Logout closes any open menus first so the UI returns to a clean state,
  // then hands off to NextAuth which clears the session cookie and sends
  // the user back to the homepage.
  function handleLogout() {
    setAccountOpen(false);
    setMenuOpen(false);
    signOut({ callbackUrl: "/" });
  }

  // Placeholder avatar — a simple person silhouette. Will be replaced by a
  // user image (next/image) once profile pictures are wired up. Kept as a
  // local component to centralise the SVG and avoid duplication between the
  // desktop and mobile auth areas.
  function AvatarIcon({ size = 18 }: { size?: number }) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    );
  }

  return (
    /*
      The entire nav block (banner + header) is sticky together so the
      close button is always reachable. overflow-visible lets the More
      dropdown escape the sticky container.
    */
    <div className="sticky top-0 z-50">
      {/* ── Announcement Banner ── */}
      {bannerVisible && (
        <div className="relative bg-linear-to-r from-amber-500 to-amber-400 text-indigo-950 font-semibold py-2.5 px-10 text-center text-xs sm:text-sm">
          {/* Message — padded right so text never slides under the × button */}
          <span className="pr-8">
            🎓 2026/2027 Admission is currently ongoing!{" "}
            <Link
              href="/admission"
              className="underline underline-offset-2 hover:text-indigo-800 transition-colors"
            >
              Click here to register your ward.
            </Link>
          </span>

          {/* Close button — pinned to the far right, vertically centred */}
          <button
            onClick={() => setBannerVisible(false)}
            aria-label="Dismiss announcement"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full bg-amber-600/20 hover:bg-amber-700/40 transition-colors cursor-pointer"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {/* ── Main Header ── */}
      <header
        className={`transition-all duration-300 ${
          scrolled
            ? "bg-indigo-950/95 backdrop-blur-md shadow-lg shadow-indigo-950/40"
            : "bg-indigo-950"
        }`}
      >
        {/* ── Top bar: logo + contact info ── */}
        <div
          className={`transition-all duration-300 overflow-hidden ${
            scrolled ? "max-h-0 opacity-0 py-0" : "max-h-40 opacity-100"
          }`}
        >
          <div className="container mx-auto px-6 lg:px-16 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Logo + school name */}
            <Link href="/" className="flex items-center gap-4 group">
              <div className="relative w-16 h-16 bg-white border-2 border-blue-500 flex items-center justify-center shrink-0 shadow-md">
                {/* <span className="text-indigo-950 font-black text-lg">LHS</span> */}
                <Image
                  src="/images/lhs_logo.png"
                  alt="Lutheran High School Logo"
                  fill={true}
                  className="object-contain p-2"
                />
              </div>

              <div>
                <h1
                  className="text-xl lg:text-2xl font-bold text-white group-hover:text-amber-300 transition-colors"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  Lutheran High School
                </h1>
                <p className="text-indigo-400 text-xs">
                  Obot Idim, Ibesikpo Asutan LGA.
                </p>
                <p className="text-amber-400 text-xs italic">
                  ...upholding academic standards since 1950
                </p>
              </div>
            </Link>

            {/*
              Contact info block.
              Layout: icon on the left, value directly to its right — single column of text.
              No label text underneath; the icons communicate context.
            */}
            <div className="hidden md:flex items-center gap-5 shrink-0">
              {/* Phone */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-800/70 border border-indigo-700/50 flex items-center justify-center shrink-0 text-amber-400">
                  {/* Mobile / phone handset icon */}
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </div>
                <span className="text-white font-semibold text-sm leading-none">
                  +2347040251300
                </span>
              </div>

              <div className="w-px h-8 bg-indigo-700/70" />

              {/* Clock / hours */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-800/70 border border-indigo-700/50 flex items-center justify-center shrink-0 text-amber-400">
                  {/* Clock icon */}
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <span className="text-white font-semibold text-sm leading-none">
                  07:00am - 02:00pm
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Nav bar ── */}
        <div className="border-t border-indigo-800/60">
          <div className="container mx-auto px-6 lg:px-16">
            {/*
              Three-zone row:
                Left  → home icon (shrink-0)
                Center → nav links, hidden below lg (flex-1, justify-center)
                Right  → auth area (shrink-0, min-w-fit) + mobile hamburger
              The right zone never shrinks, so buttons cannot wrap.
            */}
            <div className="flex items-center h-14 gap-2">
              {/* Home icon */}
              <Link
                href="/"
                aria-label="Home"
                className="w-10 h-10 flex items-center justify-center rounded-lg text-indigo-300 hover:text-white hover:bg-indigo-800/60 transition-all shrink-0"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </Link>

              {/* Desktop nav links — only visible at lg+ */}
              <nav className="hidden lg:flex items-center gap-0.5 flex-1 justify-center">
                {mainLinks.map(({ label, href }) => (
                  <Link
                    key={label}
                    href={href}
                    className="px-3.5 py-2 rounded-lg text-sm font-medium text-indigo-300 hover:text-white hover:bg-indigo-800/60 transition-all whitespace-nowrap"
                  >
                    {label}
                  </Link>
                ))}

                {/* More dropdown */}
                <div ref={moreRef} className="relative">
                  <button
                    onClick={() => setMoreOpen((o) => !o)}
                    className="flex items-center gap-1 px-3.5 py-2 rounded-lg text-sm font-medium text-indigo-300 hover:text-white hover:bg-indigo-800/60 transition-all cursor-pointer"
                  >
                    More
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      className={`transition-transform duration-200 ${moreOpen ? "rotate-180" : ""}`}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>

                  {moreOpen && (
                    <div className="absolute top-full left-0 mt-2 w-44 bg-indigo-900 border border-indigo-700/60 rounded-xl shadow-xl shadow-indigo-950/60 py-1.5 z-50 overflow-hidden">
                      {moreLinks.map(({ label, href }) => (
                        <Link
                          key={label}
                          href={href}
                          onClick={() => setMoreOpen(false)}
                          className="block px-4 py-2.5 text-sm text-indigo-300 hover:text-white hover:bg-indigo-800/60 transition-all"
                        >
                          {label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </nav>

              {/*
                Spacer that pushes the right zone to the edge on mobile
                (where the nav links are hidden).
              */}
              <div className="flex-1 lg:hidden" />

              {/*
                Auth area (desktop / sm+).
                - shrink-0  → never shrink
                - min-w-fit → always reserve natural width
                Three render branches:
                  1. Loading  → subtle placeholder to prevent layout shift
                  2. Authed   → avatar pill with Dashboard / Logout dropdown
                  3. Unauthed → existing Log in / Sign up buttons
              */}
              <div className="hidden sm:flex items-center gap-2 shrink-0 min-w-fit">
                {isAuthLoading ? (
                  // Width roughly matches both the avatar pill and the
                  // login/signup pair so the surrounding layout does not
                  // shift once the session resolves.
                  <div
                    className="h-9 w-20 rounded-full bg-indigo-800/50 animate-pulse"
                    aria-hidden="true"
                  />
                ) : isAuthenticated ? (
                  <div ref={accountRef} className="relative">
                    <button
                      onClick={() => setAccountOpen((o) => !o)}
                      aria-label="Account menu"
                      aria-haspopup="menu"
                      aria-expanded={accountOpen}
                      className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border border-indigo-700/60 hover:border-indigo-500 hover:bg-indigo-800/50 transition-all cursor-pointer"
                    >
                      {/* Avatar circle — placeholder for future profile image */}
                      <span className="w-7 h-7 rounded-full bg-amber-400 text-indigo-950 flex items-center justify-center">
                        <AvatarIcon size={16} />
                      </span>
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        className={`text-indigo-300 transition-transform duration-200 ${
                          accountOpen ? "rotate-180" : ""
                        }`}
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>

                    {accountOpen && (
                      <div
                        role="menu"
                        className="absolute top-full right-0 mt-2 w-44 bg-indigo-900 border border-indigo-700/60 rounded-xl shadow-xl shadow-indigo-950/60 py-1.5 z-50 overflow-hidden"
                      >
                        <Link
                          href="/dashboard"
                          role="menuitem"
                          onClick={() => setAccountOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-indigo-300 hover:text-white hover:bg-indigo-800/60 transition-all"
                        >
                          {/* Dashboard icon */}
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <rect x="3" y="3" width="7" height="9" />
                            <rect x="14" y="3" width="7" height="5" />
                            <rect x="14" y="12" width="7" height="9" />
                            <rect x="3" y="16" width="7" height="5" />
                          </svg>
                          Dashboard
                        </Link>
                        <button
                          role="menuitem"
                          onClick={handleLogout}
                          className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-sm text-indigo-300 hover:text-white hover:bg-indigo-800/60 transition-all cursor-pointer"
                        >
                          {/* Logout icon */}
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                          </svg>
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="px-4 py-2 rounded-full border border-indigo-600 text-indigo-300 text-sm font-semibold hover:bg-indigo-800/50 hover:text-white transition-all whitespace-nowrap"
                    >
                      Log in
                    </Link>
                    <Link
                      href="/signup"
                      className="px-4 py-2 rounded-full bg-linear-to-r from-amber-500 to-amber-400 text-indigo-950 text-sm font-bold hover:scale-105 transition-transform shadow-sm whitespace-nowrap"
                    >
                      Sign up
                    </Link>
                  </>
                )}
              </div>

              {/* Mobile hamburger */}
              <button
                className="lg:hidden w-10 h-10 flex items-center justify-center text-indigo-300 hover:text-white shrink-0 cursor-pointer"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Toggle menu"
              >
                {menuOpen ? (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                ) : (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ── Mobile menu drawer ── */}
        <div
          className={`lg:hidden border-t border-indigo-800/60 overflow-hidden transition-all duration-300 ${
            menuOpen ? "max-h-screen" : "max-h-0"
          }`}
        >
          <nav className="container mx-auto px-6 py-4 flex flex-col gap-1">
            {[...mainLinks, ...moreLinks].map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                onClick={() => setMenuOpen(false)}
                className="px-4 py-3 rounded-lg text-sm font-medium text-indigo-300 hover:text-white hover:bg-indigo-800/60 transition-all"
              >
                {label}
              </Link>
            ))}

            {/*
              Mobile auth area — mirrors the desktop logic but renders as
              full-width buttons in the drawer for easy tap targets.
            */}
            <div className="flex gap-3 pt-4 border-t border-indigo-800/60 mt-2">
              {isAuthLoading ? (
                <div
                  className="flex-1 h-10 rounded-full bg-indigo-800/50 animate-pulse"
                  aria-hidden="true"
                />
              ) : isAuthenticated ? (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setMenuOpen(false)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border border-indigo-600 text-indigo-300 text-sm font-semibold hover:bg-indigo-800/50 transition-all"
                  >
                    <AvatarIcon size={16} />
                    Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex-1 text-center px-4 py-2.5 rounded-full bg-linear-to-r from-amber-500 to-amber-400 text-indigo-950 text-sm font-bold cursor-pointer"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMenuOpen(false)}
                    className="flex-1 text-center px-4 py-2.5 rounded-full border border-indigo-600 text-indigo-300 text-sm font-semibold hover:bg-indigo-800/50 transition-all"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setMenuOpen(false)}
                    className="flex-1 text-center px-4 py-2.5 rounded-full bg-linear-to-r from-amber-500 to-amber-400 text-indigo-950 text-sm font-bold"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      </header>
    </div>
  );
}
