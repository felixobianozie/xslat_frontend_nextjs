"use client";

import { useState } from "react";
import Image from "next/image";

import { ACCENTS, type Accent } from "../utils/accent";

// The school logo, with a fallback. It loads /images/lhs_logo.png through
// next/image; if that fails (missing file, network, bad image) it swaps to the
// school's abbreviation in the sheet's accent colour. The choice is kept in
// state, so a re-render does not undo it.
export default function LogoWithFallback({
  abbr,
  accent,
}: {
  abbr: string;
  accent: Accent;
}) {
  const [errored, setErrored] = useState(false);

  return (
    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-visible rounded-full">
      {errored ? (
        <span
          className={`px-1 text-center text-[9px] font-semibold leading-tight ${ACCENTS[accent].text900}`}
        >
          {abbr || "LOGO"}
        </span>
      ) : (
        <Image
          src="/images/lhs_logo.png"
          alt={`${abbr} logo`}
          // Matches the 16 x 16 (Tailwind unit = 4px) parent so Next can
          // reserve exact layout space and skip runtime measurement.
          width={64}
          height={64}
          // The header logo is above the fold on every render, so it loads
          // eagerly and never flashes in late during printing or PDF capture.
          priority
          className="h-full w-full object-contain"
          onError={() => setErrored(true)}
        />
      )}
    </div>
  );
}
