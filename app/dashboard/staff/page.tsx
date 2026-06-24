// app/dashboard/staff/page.tsx
//
// Server Component — fetches the first page of staff portfolios and the
// pending profile requests in parallel on the server, then passes them as
// initialData props to the respective client components.
//
// StaffStatsBar is excluded — it fetches its own data internally via useQuery.
//
// This gives us server-rendered content on first load while React Query takes
// over on the client for all subsequent fetches, cache management, and mutations.

import { serverAuthFetch } from "@/lib/Serverauthfetch";
import StaffStatsBar from "./components/Staffstatsbar";
import StaffTabArea from "./components/Stafftabarea";

// ── Paginated response envelope returned by StandardPagination ────────────────
// Matches the shape documented in pagination.py.
// Exported so StaffList can import the same type for its initialData prop.
export interface PaginatedResponse<T> {
  message: string;
  count: number;
  total_pages: number;
  current_page: number;
  next: string | null;
  previous: string | null;
  data: T[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

// The school ID this deployment is scoped to.
// Required by every staff endpoint as the mandatory `school-id` query param.
const SCHOOL_ID = process.env.NEXT_PUBLIC_SCHOOL_ID ?? "";

// Page size must match NEXT_PUBLIC_PAGE_SIZE so the server-fetched envelope
// is consistent with what the client will request on every subsequent page load.
const PAGE_SIZE = (() => {
  const raw = process.env.NEXT_PUBLIC_PAGE_SIZE;
  const parsed = parseInt(raw ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 10;
})();

// ── Fetch helpers ─────────────────────────────────────────────────────────────

/**
 * Fetches page 1 of staff portfolios using the same page-size the client uses.
 * Returns the full paginated envelope so StaffList can hydrate total_pages,
 * count, and the data array directly from real server values — no recomputation.
 */
async function fetchInitialPortfolios(): Promise<PaginatedResponse<StaffPortfolio> | null> {
  const { data, error } = await serverAuthFetch<
    PaginatedResponse<StaffPortfolio>
  >(
    `staff/portfolios/list/?school-id=${SCHOOL_ID}&page=1&page-size=${PAGE_SIZE}`,
  );

  if (error || !data) {
    // Return null on failure — StaffList falls back to an empty state and
    // React Query will fetch fresh data on the client.
    console.error("Failed to fetch initial staff portfolios:", error?.message);
    return null;
  }

  return data;
}

/**
 * Fetches pending staff profile requests for the school.
 * The `status=pending` filter is intentional — the Requests tab only shows
 * requests that need attention from the admin.
 */
async function fetchInitialRequests(): Promise<StaffProfReq[]> {
  const { data, error } = await serverAuthFetch<{ data: StaffProfReq[] }>(
    `staff/requests/list/?school-id=${SCHOOL_ID}`,
  );
  // &status=pending

  if (error || !data) {
    console.error("Failed to fetch initial staff requests:", error?.message);
    return [];
  }

  return data.data;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function StaffPage() {
  // Fetch both resources in parallel — neither depends on the other.
  const [initialPortfolios, initialRequests] = await Promise.all([
    fetchInitialPortfolios(),
    fetchInitialRequests(),
  ]);

  return (
    <main className="h-screen overflow-y-auto [&::-webkit-scrollbar]:hidden scrollbar-none [-ms-overflow-style:none]">
      {/* Page heading */}
      <div className="py-4">
        <h1 className="text-xl font-bold text-slate-800">Staff Management</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Manage school staff, roles, and profile requests.
        </p>
      </div>

      {/* Stats bar — fetches its own data internally via useQuery */}
      <StaffStatsBar />

      {/* Tab area — threads initial data down to StaffList and ProfileRequests */}
      <StaffTabArea
        initialPortfolios={initialPortfolios}
        initialRequests={initialRequests}
      />
    </main>
  );
}
