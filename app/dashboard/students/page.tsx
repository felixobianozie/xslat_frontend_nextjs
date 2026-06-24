// ─────────────────────────────────────────────────────────────────────────────
// app/dashboard/student/page.tsx
//
// Server Component — page entry for /student.
//
// Layout mirrors the /staff page convention:
//   Heading → StudentStatsBar → StudentList
//
// Data layer:
//  - Server-side prefetches the first page of students using serverAuthFetch
//    so the list renders with real data on the very first paint — no loading
//    flash. StudentList consumes the envelope via React Query initialData.
//  - StudentStatsBar fetches its own data internally via useQuery, so the
//    page does not need to thread anything down to it.
// ─────────────────────────────────────────────────────────────────────────────

import { serverAuthFetch } from "@/lib/Serverauthfetch";
import StudentStatsBar from "./components/Studentstatsbar";
import StudentList from "./components/StudentList";

// ── Paginated response envelope returned by StandardPagination ────────────────
// Matches the shape documented in pagination.py.
// Exported so child components import the same type for typed responses.
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
// Required by every student endpoint as the mandatory `school-id` query param.
const SCHOOL_ID = process.env.NEXT_PUBLIC_SCHOOL_ID ?? "";

// Page size must match NEXT_PUBLIC_PAGE_SIZE so the server-fetched envelope is
// consistent with what the client will request on every subsequent page load.
const PAGE_SIZE = (() => {
  const raw = process.env.NEXT_PUBLIC_PAGE_SIZE;
  const parsed = parseInt(raw ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 10;
})();

// ── Fetch helpers ─────────────────────────────────────────────────────────────

/**
 * Fetches page 1 of students using the same page-size the client uses.
 * Returns the full paginated envelope so StudentList can hydrate total_pages,
 * count, and the data array directly from real server values — no recomputation.
 */
async function fetchInitialStudents(): Promise<PaginatedResponse<StudentRecord> | null> {
  const { data, error } = await serverAuthFetch<
    PaginatedResponse<StudentRecord>
  >(`student/list/?school-id=${SCHOOL_ID}&page=1&page-size=${PAGE_SIZE}`);

  if (error || !data) {
    // Return null on failure — StudentList falls back to an empty state and
    // React Query will fetch fresh data on the client.
    console.error("Failed to fetch initial students:", error?.message);
    return null;
  }

  return data;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function StudentPage() {
  const initialStudents = await fetchInitialStudents();

  return (
    <main className="h-screen overflow-y-auto [&::-webkit-scrollbar]:hidden scrollbar-none [-ms-overflow-style:none]">
      {/* Page heading */}
      <div className="py-4">
        <h1 className="text-xl font-bold text-slate-800">Student Management</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Manage student records, class assignments, and registration details.
        </p>
      </div>

      {/* Stats bar — fetches its own data internally via useQuery */}
      <StudentStatsBar />

      <div className="flex-1 h-1 bg-slate-300 rounded-full mb-5"></div>

      {/* Student list — handles search, filters, pagination, and create panel */}
      <StudentList initialData={initialStudents} />
    </main>
  );
}
