// ─────────────────────────────────────────────────────────────────────────────
// /dashboard/broadsheet/arm/page.tsx
//
// Server entry point for the single-arm broadsheet detail page. Reads the
// `?id=<armId>` query param, wraps the page in BroadsheetDetailsProvider,
// and delegates rendering to its client children.
//
// Notes:
//  - `searchParams` is async in Next 15+, so we await it before reading.
//  - When no `id` is supplied (e.g. the user landed here without going
//    through the list), we show a friendly fallback rather than crashing.
// ─────────────────────────────────────────────────────────────────────────────

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { BroadsheetDetailsProvider } from "./context/BroadsheetDetailsProvider";
import BroadsheetInfo from "./components/BroadsheetInfo";
import BroadsheetDetail from "./components/BroadsheetDetail";

export const metadata: Metadata = {
  title: "Broadsheet | Class Arm",
  description: "Broadsheet for a single class arm.",
};

interface BroadsheetArmPageProps {
  searchParams: Promise<{ id?: string }>;
}

export default async function BroadsheetArmPage({
  searchParams,
}: BroadsheetArmPageProps) {
  const params = await searchParams;
  const armId = params.id ?? "";

  // Friendly fallback when the user lands here without an arm id. Linking
  // back to the arms list gives them the obvious next step.
  if (!armId) {
    return (
      <div className="space-y-6">
        <Link
          href="/dashboard/broadsheet/arms"
          className="inline-flex items-center gap-1.5 text-xs text-violet-600 hover:text-violet-700"
        >
          <ArrowLeft size={12} />
          Back to broadsheets
        </Link>

        <div className="border border-dashed border-slate-200 rounded-2xl p-10 text-center bg-slate-50">
          <p className="text-sm font-semibold text-slate-700">
            No arm selected
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Pick a class arm from the broadsheets list to view its details.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back-to-list anchor so the user can navigate up without using the
          browser's back button. */}
      <Link
        href="/dashboard/broadsheet/arms"
        className="inline-flex items-center gap-1.5 text-xs text-violet-600 hover:text-violet-700"
      >
        <ArrowLeft size={12} />
        Back to broadsheets
      </Link>

      <BroadsheetDetailsProvider armId={armId}>
        <BroadsheetInfo />
        <BroadsheetDetail />
      </BroadsheetDetailsProvider>
    </div>
  );
}
