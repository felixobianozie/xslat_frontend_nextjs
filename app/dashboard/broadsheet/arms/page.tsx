// ─────────────────────────────────────────────────────────────────────────────
// /dashboard/broadsheet/arms/page.tsx
//
// Server Component for the /dashboard/broadsheet/arms route. Responsible for:
//   1. Resolving the school's current term (every downstream call needs a term-id).
//   2. Pre-fetching the arms envelope so React Query hydrates without a flash.
//   3. Passing the resolved term + initial arms down to BroadsheetsList.
//
// Design mirrors /dashboard/arms/page.tsx (same fetch pattern, same fallback for
// "no current term set", same ApiEnvelope contract). Differences:
//   - We don't need sections/levels here: there's no Create Arm panel on this
//     page — arms are pre-existing and only their broadsheet state gets acted on.
//   - We surface the current session + term names so BroadsheetsList can render
//     its placeholder session/term filter chips without an extra fetch.
// ─────────────────────────────────────────────────────────────────────────────

import type { Metadata } from "next";
import { serverAuthFetch } from "@/lib/Serverauthfetch";
import BroadsheetsList from "./components/BroadsheetsList";

export const metadata: Metadata = {
  title: "Broadsheets | Class Arms",
  description: "Review, approve, and revoke class arm broadsheets.",
};

// ── Constants ────────────────────────────────────────────────────────────────

const SCHOOL_ID = process.env.NEXT_PUBLIC_SCHOOL_ID ?? "";

// Standard backend envelope shape — matches { message, data } returned by every
// non-paginated endpoint in the academics + users modules. Exported so client
// components on this subtree can reuse a single type without redefining it.
export interface ApiEnvelope<T> {
  message: string;
  data: T;
}

// Shape passed from this server component into BroadsheetsList. Carries just
// enough of the resolved current-term chain for the client to (a) key the arm
// query by term-id and (b) render the session/term filter placeholder labels.
export interface CurrentTerm {
  id: string;
  name: string;
  session: { id: string; name: string };
}

// ── Local response types ─────────────────────────────────────────────────────
// SchoolDetailView returns current_term (with nested session) when the school
// has one configured, or null otherwise.
interface SchoolDetail {
  id: string;
  name: string;
  abbr: string;
  current_term: {
    id: string;
    name: string;
    abbr: string;
    session: { id: string; name: string };
  } | null;
}

// ── Fetch helpers ────────────────────────────────────────────────────────────

// Resolves the school's current term. Without this the arm/list/ call has no
// term-id to scope by, so a failure here short-circuits the whole page.
async function fetchSchool(): Promise<SchoolDetail | null> {
  const { data, error } = await serverAuthFetch<ApiEnvelope<SchoolDetail>>(
    `school/detail/?id=${SCHOOL_ID}`,
  );

  if (error || !data) {
    console.error("Failed to fetch school detail:", error?.message);
    return null;
  }
  return data.data;
}

// Pre-fetches the broadsheet arms list so React Query can hydrate on first
// render. Null on failure lets BroadsheetsList fall back to its own client
// fetch (React Query will retry once mounted) rather than blocking the page.
async function fetchInitialArms(
  termId: string,
): Promise<ApiEnvelope<ClassArm[]> | null> {
  const { data, error } = await serverAuthFetch<ApiEnvelope<ClassArm[]>>(
    `arm/list/?school-id=${SCHOOL_ID}&term-id=${termId}`,
  );

  if (error || !data) {
    console.error("Failed to fetch initial broadsheet arms:", error?.message);
    return null;
  }
  return data;
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function BroadsheetsListPage() {
  const school = await fetchSchool();
  const currentTerm = school?.current_term ?? null;

  // Without a current term, arm/list/ can't be called. Render an actionable
  // explanation rather than firing off a doomed request.
  if (!currentTerm) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Manage Broadsheets
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            This school has no current term set. Set a current term in the
            academics settings before managing broadsheets.
          </p>
        </div>
        <div className="flex-1 h-1 bg-slate-300 rounded-full overflow-hidden" />
      </div>
    );
  }

  const initialArms = await fetchInitialArms(currentTerm.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Manage Broadsheets
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Review each class arm's submitted results and approve or revoke them
          for the current term.
        </p>
      </div>

      <BroadsheetsList
        currentTerm={{
          id: currentTerm.id,
          name: currentTerm.name,
          session: currentTerm.session,
        }}
        initialArms={initialArms}
      />
    </div>
  );
}
