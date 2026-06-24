"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Analyticsstatsbar.tsx
//
// Top-level stat grid for the /dashboard/analytics page.
// Cards: Total Students · Total Staff · Total Class Arms · Total Subjects
//
// Data layer:
//  - Five independent useQuery hooks — one per card, plus one for the
//    school detail (needed to resolve the current term id used by
//    arm/list/ and subject/list/).
//  - Each card resolves on its own timeline rather than waiting for the
//    slowest fetch, so students/staff appear immediately while the
//    school → arms / subjects chain finishes.
//  - All requests go through clientAuthFetch via the useClientAuthFetch
//    hook (project's standard client-side auth wrapper).
//  - Fetch errors are surfaced as toasts. React Query v5 removed onError,
//    so a useEffect per query watches isError + error and fires the toast
//    on each new failure.
//
// Backend endpoints:
//   GET school/detail/?id=<school>           → school.current_term.id
//   GET student/analytics/?school-id=<id>    → { data.total, … }
//   GET staff/analytics/?school-id=<id>      → { data.total, … }
//   GET arm/list/?school-id=…&term-id=…      → { data: Arm[] }      (unpaginated)
//   GET subject/list/?school-id=…&term-id=…  → { data: Subject[] }  (unpaginated)
//
// Note on counts for arms/subjects:
//   Neither endpoint has a dedicated count endpoint, so the card value
//   is derived from the length of the returned array.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { GraduationCap, Users, LayoutGrid, BookOpen } from "lucide-react";
import { toast } from "react-toastify";

import { useClientAuthFetch } from "@/lib/Useclientauthfetch";
import StatCard from "@/app/dashboard/components/Statcard";
import StatCardLoader from "@/app/dashboard/components/Statcardloader";

// ── Constants ────────────────────────────────────────────────────────────────

const SCHOOL_ID = process.env.NEXT_PUBLIC_SCHOOL_ID ?? "";

// ── Types ────────────────────────────────────────────────────────────────────
// Standard envelope returned by every non-paginated endpoint in the backend
// (matches ApiEnvelope in ArmDetailsProvider.tsx).
interface ApiEnvelope<T> {
  message: string;
  data: T;
}

// Minimal shape from GET school/detail/. We only need current_term.id to
// pass to arm/list/ and subject/list/, so the rest of the school payload
// is intentionally ignored here.
interface SchoolDetail {
  current_term: { id: string } | null;
}

// Shape from GET student/analytics/. Only `total` is rendered on this page,
// but the full shape is typed so the response is self-documenting.
interface StudentAnalytics {
  total: number;
  active: number;
  inactive: number;
  male: number;
  female: number;
  others: number;
  boarding: number;
  day: number;
}

// Shape from GET staff/analytics/. Only `total` is consumed here — other
// fields the endpoint may return (active, academic, etc.) are not relied on.
interface StaffAnalytics {
  total: number;
}

// arm/list/ and subject/list/ return full nested records; we only need the
// length of the array, so the inner shape is reduced to `id` here.
interface ArmRecord {
  id: string;
}
interface SubjectRecord {
  id: string;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function AnalyticsStatsBar() {
  const { clientAuthFetch } = useClientAuthFetch();

  // ── 1. School detail (resolves the current term id) ──────────────────────
  // arm/list/ and subject/list/ BOTH require term-id, which lives on
  // school.current_term. The cache key matches the convention used in
  // Studentassignarmpanel so the same response can be shared across pages.
  const schoolQuery = useQuery<ApiEnvelope<SchoolDetail>>({
    queryKey: ["school", SCHOOL_ID],
    queryFn: async () => {
      const { data, error } = await clientAuthFetch<ApiEnvelope<SchoolDetail>>(
        `school/detail/?id=${SCHOOL_ID}`,
      );
      if (error) throw new Error(error.message);
      return data!;
    },
  });

  const currentTermId = schoolQuery.data?.data.current_term?.id ?? null;

  // ── 2. Student analytics ─────────────────────────────────────────────────
  // One round-trip to the dedicated aggregate endpoint — much cheaper than
  // fetching the full student list and counting client-side.
  const studentQuery = useQuery<ApiEnvelope<StudentAnalytics>>({
    queryKey: ["analytics-students", SCHOOL_ID],
    queryFn: async () => {
      const { data, error } = await clientAuthFetch<
        ApiEnvelope<StudentAnalytics>
      >(`student/analytics/?school-id=${SCHOOL_ID}`);
      if (error) throw new Error(error.message);
      return data!;
    },
  });

  // ── 3. Staff analytics ───────────────────────────────────────────────────
  const staffQuery = useQuery<ApiEnvelope<StaffAnalytics>>({
    queryKey: ["analytics-staff", SCHOOL_ID],
    queryFn: async () => {
      const { data, error } = await clientAuthFetch<
        ApiEnvelope<StaffAnalytics>
      >(`staff/analytics/?school-id=${SCHOOL_ID}`);
      if (error) throw new Error(error.message);
      return data!;
    },
  });

  // ── 4. Class arms count (derived from arm/list/ length) ──────────────────
  // Gated on currentTermId — the backend rejects arm/list/ without a
  // term-id. Once the school query resolves with a term, this fires.
  const armsQuery = useQuery<ApiEnvelope<ArmRecord[]>>({
    queryKey: ["analytics-arms", SCHOOL_ID, currentTermId],
    queryFn: async () => {
      const { data, error } = await clientAuthFetch<ApiEnvelope<ArmRecord[]>>(
        `arm/list/?school-id=${SCHOOL_ID}&term-id=${currentTermId}`,
      );
      if (error) throw new Error(error.message);
      return data!;
    },
    enabled: !!currentTermId,
  });

  // ── 5. Subjects count (derived from subject/list/ length) ────────────────
  // Same gating + count pattern as arms.
  const subjectsQuery = useQuery<ApiEnvelope<SubjectRecord[]>>({
    queryKey: ["analytics-subjects", SCHOOL_ID, currentTermId],
    queryFn: async () => {
      const { data, error } = await clientAuthFetch<
        ApiEnvelope<SubjectRecord[]>
      >(`subject/list/?school-id=${SCHOOL_ID}&term-id=${currentTermId}`);
      if (error) throw new Error(error.message);
      return data!;
    },
    enabled: !!currentTermId,
  });

  // ── Error toasts ─────────────────────────────────────────────────────────
  // One useEffect per query — each re-runs when that query's error changes,
  // so the user gets a fresh toast on every distinct failure.
  useEffect(() => {
    if (schoolQuery.isError) {
      toast.error("Could not load school information.");
    }
  }, [schoolQuery.isError]);

  useEffect(() => {
    // Special case: school loaded successfully but has no active term.
    // arm/list/ and subject/list/ cannot run, so those cards will show "—".
    if (schoolQuery.data && !currentTermId) {
      toast.warning(
        "This school has no active term — class arms and subjects unavailable.",
      );
    }
  }, [schoolQuery.data, currentTermId]);

  useEffect(() => {
    if (studentQuery.isError) {
      toast.error(
        studentQuery.error instanceof Error
          ? studentQuery.error.message
          : "Failed to load student analytics.",
      );
    }
  }, [studentQuery.isError, studentQuery.error]);

  useEffect(() => {
    if (staffQuery.isError) {
      toast.error(
        staffQuery.error instanceof Error
          ? staffQuery.error.message
          : "Failed to load staff analytics.",
      );
    }
  }, [staffQuery.isError, staffQuery.error]);

  useEffect(() => {
    if (armsQuery.isError) {
      toast.error(
        armsQuery.error instanceof Error
          ? armsQuery.error.message
          : "Failed to load class arms.",
      );
    }
  }, [armsQuery.isError, armsQuery.error]);

  useEffect(() => {
    if (subjectsQuery.isError) {
      toast.error(
        subjectsQuery.error instanceof Error
          ? subjectsQuery.error.message
          : "Failed to load subjects.",
      );
    }
  }, [subjectsQuery.isError, subjectsQuery.error]);

  // ── Derived per-card values ──────────────────────────────────────────────
  // Numbers are formatted with thousand separators (matches the original
  // mock's "1,248" presentation). "—" is shown when data is unavailable
  // (error, or no active term for arms/subjects).
  //
  // isLoading (not isPending) is used so that a query disabled by `enabled:
  // false` is NOT treated as loading — that case correctly falls through to
  // the "—" placeholder.
  const studentsLoading = studentQuery.isLoading;
  const studentsValue =
    studentQuery.data?.data.total?.toLocaleString() ?? "—";

  const staffLoading = staffQuery.isLoading;
  const staffValue = staffQuery.data?.data.total?.toLocaleString() ?? "—";

  // Arms/subjects depend on the school query resolving first. While school
  // is loading, the chain is loading. Once the school has the term id and
  // the gated query fires, isLoading flips to true on that query.
  const armsLoading = schoolQuery.isLoading || armsQuery.isLoading;
  const armsValue = armsQuery.data?.data.length?.toLocaleString() ?? "—";

  const subjectsLoading = schoolQuery.isLoading || subjectsQuery.isLoading;
  const subjectsValue =
    subjectsQuery.data?.data.length?.toLocaleString() ?? "—";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <AnalyticsCard
        label="Total Students"
        value={studentsValue}
        loading={studentsLoading}
        icon={<GraduationCap size={20} />}
        color="violet"
      />
      <AnalyticsCard
        label="Total Staff"
        value={staffValue}
        loading={staffLoading}
        icon={<Users size={20} />}
        color="blue"
      />
      <AnalyticsCard
        label="Total Class Arms"
        value={armsValue}
        loading={armsLoading}
        icon={<LayoutGrid size={20} />}
        color="emerald"
      />
      <AnalyticsCard
        label="Total Subjects"
        value={subjectsValue}
        loading={subjectsLoading}
        icon={<BookOpen size={20} />}
        color="amber"
      />
    </div>
  );
}

// ── Per-card wrapper ─────────────────────────────────────────────────────────
// Renders either a single-cell StatCardLoader skeleton or the real StatCard,
// so each card can resolve independently inside the parent grid. cols is set
// to "grid-cols-1" so the loader collapses into one cell — the parent grid
// (in AnalyticsStatsBar above) is what controls the overall column layout.
function AnalyticsCard({
  label,
  value,
  loading,
  icon,
  color,
}: {
  label: string;
  value: string;
  loading: boolean;
  icon: React.ReactNode;
  color: "violet" | "blue" | "emerald" | "amber";
}) {
  if (loading) {
    return <StatCardLoader count={1} cols="grid-cols-1" />;
  }

  return <StatCard label={label} value={value} icon={icon} color={color} />;
}
