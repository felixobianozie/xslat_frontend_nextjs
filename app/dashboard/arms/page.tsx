// ─────────────────────────────────────────────────────────────────────────────
// app/dashboard/arms/page.tsx
//
// Server Component for the /arms route. Responsible for resolving the
// "current term" the arms list is scoped to, fetching the reference data the
// Create Arm panel needs (levels), and pre-fetching the first arms payload so
// the table renders without a loading flash.
//
// Why each call is here (and not on the client):
//   1. school/detail/      — needed to discover the school's current term.
//                            That term-id is required by every downstream
//                            call (arms list, sections list, etc.).
//   2. section/list/       — the level/list/ endpoint requires section-id, so
//                            we need every section in the current term first.
//   3. level/list/ (×N)    — one request per section, fanned out in parallel.
//                            The flattened ArmLevel[] populates the Create Arm
//                            dropdown without the client having to refetch.
//   4. arm/list/           — pre-fetched and handed to React Query as
//                            initialData; the client takes over from there.
//
// If the school has no current term set, the page renders an explanation
// rather than calling downstream endpoints that would 400 without a term-id.
// ─────────────────────────────────────────────────────────────────────────────

import type { Metadata } from "next";
import { serverAuthFetch } from "@/lib/Serverauthfetch";
import ArmList from "./components/Armlist";

export const metadata: Metadata = {
  title: "Class Arms",
  description: "Manage class arms, assign class teachers, and view rosters.",
};

// ── Constants ────────────────────────────────────────────────────────────────

const SCHOOL_ID = process.env.NEXT_PUBLIC_SCHOOL_ID ?? "";

// Standard backend envelope shape — matches { message, data } returned by
// every non-paginated endpoint in the academics + users modules. Exported so
// client components can reuse the same type without redefining it.
export interface ApiEnvelope<T> {
  message: string;
  data: T;
}

// ── Local response types ─────────────────────────────────────────────────────
// Each interface below mirrors exactly what the corresponding endpoint returns
// given the dynamic-fields context the backend view passes to its serializer.

// SchoolDetailView passes include_school_fields with "current_term", so the
// response carries the nested current term (and session under it) or null.
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

// SectionListView returns each section as { id, name, abbr, ... } — we only
// need the id (used to look up levels) and a couple of display fields.
interface SectionRecord {
  id: string;
  name: string;
  abbr: string;
}

// ── Fetch helpers ────────────────────────────────────────────────────────────

// Resolves the school's current term. Without this we can't scope any of the
// downstream calls correctly, so a failure here short-circuits the whole page.
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

// Lists every section in the current term. Sections are the parent of levels,
// and the backend's level/list/ endpoint requires section-id — so we need
// these first before we can resolve the school's full set of levels.
async function fetchSections(termId: string): Promise<SectionRecord[]> {
  const { data, error } = await serverAuthFetch<ApiEnvelope<SectionRecord[]>>(
    `section/list/?school-id=${SCHOOL_ID}&term-id=${termId}`,
  );

  if (error || !data) {
    console.error("Failed to fetch sections:", error?.message);
    return [];
  }
  return data.data;
}

// Returns the levels belonging to a single section. Called once per section
// and the results are flattened. The shape returned here already matches
// ArmLevel (id, name, abbr, section: { id, name, abbr }) because that's what
// LevelListView's include_level_fields / include_section_fields are set to.
async function fetchLevelsForSection(sectionId: string): Promise<ArmLevel[]> {
  const { data, error } = await serverAuthFetch<ApiEnvelope<ArmLevel[]>>(
    `level/list/?school-id=${SCHOOL_ID}&section-id=${sectionId}`,
  );

  if (error || !data) {
    console.error(
      `Failed to fetch levels for section ${sectionId}:`,
      error?.message,
    );
    return [];
  }
  return data.data;
}

// Pre-fetches the arms list so React Query can hydrate on first render. Null
// is returned on failure so ArmList can fall back to an empty state and let
// React Query refetch on the client.
async function fetchInitialArms(
  termId: string,
): Promise<ApiEnvelope<ClassArm[]> | null> {
  const { data, error } = await serverAuthFetch<ApiEnvelope<ClassArm[]>>(
    `arm/list/?school-id=${SCHOOL_ID}&term-id=${termId}`,
  );

  if (error || !data) {
    console.error("Failed to fetch initial arms:", error?.message);
    return null;
  }
  return data;
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function ArmsPage() {
  // Resolve the school's current term before anything else; every downstream
  // call needs the term-id.
  const school = await fetchSchool();
  const currentTerm = school?.current_term ?? null;

  // Without a current term, none of the term-scoped endpoints will work.
  // Render an actionable explanation rather than firing off doomed requests.
  if (!currentTerm) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Class Arms</h1>
          <p className="text-sm text-slate-500 mt-1">
            This school has no current term set. Set a current term in the
            academics settings before managing class arms.
          </p>
        </div>
        <div className="flex-1 h-1 bg-slate-300 rounded-full overflow-hidden" />
      </div>
    );
  }

  // Sections must finish before levels (level/list/ needs each section's id).
  // Once we have section ids, the per-section level fetches and the initial
  // arms fetch are independent and run in parallel to minimise total wait.
  const sections = await fetchSections(currentTerm.id);
  const [levelsBySection, initialArms] = await Promise.all([
    Promise.all(sections.map((s) => fetchLevelsForSection(s.id))),
    fetchInitialArms(currentTerm.id),
  ]);

  // Flatten the per-section arrays into a single ArmLevel[]. Order is
  // preserved: sections appear in backend order, levels within each section
  // in promotion_order. Good for the Create Arm dropdown.
  const levels: ArmLevel[] = levelsBySection.flat();

  return (
    <div className="space-y-6">
      {/* Heading — matches the visual rhythm of the dashboard index page */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Class Arms</h1>
        <p className="text-sm text-slate-500 mt-1">
          View every class arm in this term, assign teachers, and create new
          arms as needed.
        </p>
      </div>

      {/* Subtle divider — keeps the accent line consistent across pages */}
      <div className="flex-1 h-1 bg-slate-300 rounded-full overflow-hidden" />

      <ArmList
        currentTermId={currentTerm.id}
        levels={levels}
        initialArms={initialArms}
      />
    </div>
  );
}
