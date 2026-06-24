// ─────────────────────────────────────────────────────────────────────────────
// page.tsx — /dashboard/arm
//
// Server component entry for the arm detail page. Reads the arm id from the
// ?id query parameter (the /arms list links here with that pattern) and
// passes it down to ArmDetailsProvider, which fetches the arm and exposes it
// via context to every tab.
//
// The page wrapper itself is intentionally lean — Topbar / Leftbar / Rightbar
// are provided by the dashboard layout, so this file only renders the
// page-specific content (header card + tabbed area).
//
// ApiEnvelope is exported here (mirroring /arms/page.tsx) so every client
// component on the /arm subtree can import the same shared response shape
// without redefining it per file.
// ─────────────────────────────────────────────────────────────────────────────

import type { Metadata } from "next";
import { ArmDetailsProvider } from "./context/Armdetailsprovider";
import ArmInfo from "./components/Arminfo";
import ArmTabArea from "./components/Armtabarea";

export const metadata: Metadata = {
  title: "Class Arm",
  description:
    "View and manage a class arm — members, subjects, results, teachers, and grading.",
};

// Standard backend envelope shape — matches { message, data } returned by
// every non-paginated endpoint in academics + users. Exported so components
// under /dashboard/arm can share a single type definition.
export interface ApiEnvelope<T> {
  message: string;
  data: T;
}

interface ArmPageProps {
  // Next.js 15: searchParams is a promise on server components.
  searchParams: Promise<{ id?: string }>;
}

export default async function ArmDetailPage({ searchParams }: ArmPageProps) {
  const { id } = await searchParams;

  // No id → render a friendly error in-place instead of throwing. The list
  // link generator should always supply id, so reaching here usually means a
  // direct URL visit or a bookmark from before id was wired.
  if (!id) {
    return (
      <div className="rounded-2xl bg-amber-50 border border-amber-200 p-6 text-amber-900 text-sm">
        <p className="font-semibold mb-1">Missing arm identifier</p>
        <p className="text-xs">
          Open this page from the class arms list, or include
          <code className="mx-1 px-1 bg-white rounded">?id=&lt;arm-id&gt;</code>
          in the URL.
        </p>
      </div>
    );
  }

  return (
    <ArmDetailsProvider armId={id}>
      <ArmInfo />
      <ArmTabArea />
    </ArmDetailsProvider>
  );
}
