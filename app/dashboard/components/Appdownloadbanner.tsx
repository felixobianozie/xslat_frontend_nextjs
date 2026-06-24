"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Appdownloadbanner.tsx
//
// Promotional banner advertising the EMS mobile apps. The Google Play and
// App Store buttons are placeholders for now — no real store listings exist,
// so the click handlers fire the standard "feature in the works" toast that
// the rest of the dashboard uses for not-yet-implemented actions.
//
// Converted from a server component to a client component so the buttons can
// invoke `toast.info()` on click. The rest of the layout is unchanged.
// ─────────────────────────────────────────────────────────────────────────────

import Image from "next/image";
import { toast } from "react-toastify";

const FEATURE_IN_WORKS = "This feature is currently in the works.";

export default function AppDownloadBanner() {
  const handleStoreClick = () => toast.info(FEATURE_IN_WORKS);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-linear-to-br bg-indigo-200 p-6 sm:p-8">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/30" />
        <div className="absolute -bottom-10 -left-4 w-52 h-52 rounded-full bg-white/20" />
      </div>

      <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6">
        {/* Phone illustration */}
        <div className="relative w-48 h-48">
          <Image
            src={"/images/human_mobile_illustrator.webp"}
            alt="Download mobile app illustration"
            fill
            className="object-contain"
          />
        </div>

        {/* Text content */}
        <div className="flex-1 min-w-0 text-black">
          <h3 className="font-bold text-lg sm:text-xl mb-1">
            Download the EMS mobile app
          </h3>
          <p className="text-sm leading-relaxed mb-5 max-w-md">
            Effortlessly manage and follow all academic activities at your
            school. Faster, secure, and always in your pocket, available on both
            iOS and Android.
          </p>

          <div className="flex flex-wrap gap-3">
            {/* Google Play — placeholder; no real listing yet. */}
            <button
              type="button"
              onClick={handleStoreClick}
              className="cursor-pointer flex items-center gap-2.5 bg-black/70 hover:bg-black/40 backdrop-blur-sm border border-white/20 text-white px-4 py-2.5 rounded-xl transition-all duration-200 hover:scale-105"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M3.18 23.76c.3.17.64.22.98.14L15.34 12 11.08 7.74 3.18 23.76zm16.87-9.93L17.3 12.6l-3.04 3.04 3.04 3.04 2.75-1.53c.78-.44.78-1.68 0-2.12zM2.42.28C2.16.52 2 .9 2 1.38v21.24c0 .48.16.86.42 1.1l.08.07 11.9-11.9v-.28L2.5.22 2.42.28zm9.38 9.38L3.18.24c-.34-.08-.68-.03-.98.14l7.9 16.02 1.7-6.74z" />
              </svg>
              <div className="text-left">
                <p className="text-[9px] text-violet-200 leading-none">
                  Download on
                </p>
                <p className="text-xs font-semibold leading-tight">
                  Google Play
                </p>
              </div>
            </button>

            {/* App Store — placeholder; no real listing yet. */}
            <button
              type="button"
              onClick={handleStoreClick}
              className="cursor-pointer flex items-center gap-2.5 bg-black/70 hover:bg-black/40 backdrop-blur-sm border border-white/20 text-white px-4 py-2.5 rounded-xl transition-all duration-200 hover:scale-105"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
              <div className="text-left">
                <p className="text-[9px] text-violet-200 leading-none">
                  Download on the
                </p>
                <p className="text-xs font-semibold leading-tight">App Store</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
