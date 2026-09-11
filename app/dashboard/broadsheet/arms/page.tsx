// ─────────────────────────────────────────────────────────────────────────────
// /dashboard/broadsheet/arms/page.tsx
//
// Server Component for the /dashboard/broadsheet/arms route. Responsible for:
//   1. Resolving the school's current term (every downstream default needs one).
//   2. Pre-fetching the arms envelope for the current term so React Query
//      hydrates without a loading flash on first paint.
//   3. Pre-fetching the full session list (with nested terms) so the client's
//      session/term filter bar renders its dropdowns immediately.
//   4. Passing all three down to BroadsheetsList.
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

// ── Shared response types ────────────────────────────────────────────────────

// Standard backend envelope shape — matches { message, data } returned by every
// non-paginated endpoint in the academics + users modules. Exported so client
// components on this subtree can reuse a single type without redefining it.
export interface ApiEnvelope<T> {
  message: string;
  data: T;
}

// Term row inside a session-list entry. Matches the field set requested by
// SessionListView's include_term_fields = ("id", "name", "current") context.
export interface SessionTermItem {
  id: string;
  name: string;
  current: boolean;
}

// Session-list row. Field set matches SessionListView's include_session_fields
// (id, name, starts, ends, current, initialized, terms).
export interface SessionListItem {
  id: string;
  name: string;
  starts: string;
  ends: string | null;
  current: boolean;
  initialized: boolean;
  terms: SessionTermItem[];
}

// Shape passed from this server component into BroadsheetsList. Carries just
// enough of the resolved current-term chain for the client to (a) seed the
// session/term selection defaults and (b) mark the live period inside the
// dropdowns.
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

// Pre-fetches the broadsheet arms list for the given term so React Query can
// hydrate on first render. Null on failure lets BroadsheetsList fall back to
// its own client fetch rather than blocking the page.
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

// Pre-fetches every session (with nested terms) for the school so the
// client's filter bar can render its dropdowns immediately. Null on failure
// lets the client query retry.
async function fetchInitialSessions(): Promise<ApiEnvelope<
  SessionListItem[]
> | null> {
  const { data, error } = await serverAuthFetch<ApiEnvelope<SessionListItem[]>>(
    `session/list/?school-id=${SCHOOL_ID}`,
  );

  if (error || !data) {
    console.error("Failed to fetch broadsheet session list:", error?.message);
    return null;
  }
  return data;
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function BroadsheetsListPage() {
  const school = await fetchSchool();
  const currentTerm = school?.current_term ?? null;

  // Without a current term, arm/list/ can't be called for the default term
  // and the "which period is live" marker downstream has nothing to point at.
  // Render an actionable explanation rather than a stuck page.
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

  // Fire arms + sessions fetches in parallel — neither depends on the other.
  const [initialArms, initialSessions] = await Promise.all([
    fetchInitialArms(currentTerm.id),
    fetchInitialSessions(),
  ]);

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
        initialSessions={initialSessions}
      />
    </div>
  );
}
