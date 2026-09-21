"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Analyticsstatsbar.tsx
//
// Top-level stat grid for the /dashboard/analytics page.
// Cards: Current Students · Historic Students · Total Staff · Total Class
//        Arms · Total Subjects
//
// Data layer:
//  - Four independent useQuery hooks — one per data source (student, staff,
//    arm, subject). The student query backs two cards (Current + Historic),
//    since both numbers come from the same student/analytics/ response.
//    Each query fires immediately and resolves on its own timeline; no card
//    waits on another.
//  - All requests go through clientAuthFetch via the useClientAuthFetch
//    hook (project's standard client-side auth wrapper).
//  - Fetch errors are surfaced as toasts. React Query v5 removed onError,
//    so a useEffect per query watches isError + error and fires the toast
//    on each new failure.
//
// Backend endpoints:
//   GET student/analytics/?school-id=<id>   → { data.current_total, data.historic_total, … }
//   GET staff/analytics/?school-id=<id>     → { data.total, … }
//   GET arm/analytics/?school-id=<id>       → { data.total, data.has_current_term, … }
//   GET subject/analytics/?school-id=<id>   → { data.total, data.has_current_term, … }
//
// Students cards:
//   The backend tracks both current_total (enrolled right now) and
//   historic_total (every student ever enrolled, including those since
//   withdrawn/graduated/transferred out). Each gets its own card rather
//   than being combined into one, matching how every other metric on this
//   grid gets its own card. Further breakdown fields (enrolled, unenrolled,
//   graduated, withdrawn, expelled, transferred_out, male, female, others,
//   boarding, day) are already typed below for when a richer view is
//   needed.
//
// Arms/subjects and the current term:
//   arm/analytics/ and subject/analytics/ both resolve the school's current
//   term SERVER-SIDE (School.get_current_term()) — no term id is supplied
//   by this component, and no separate school/detail/ fetch is needed to
//   discover one. `has_current_term` in each response distinguishes "the
//   school has no current term" (every count is 0, shown as "—") from "the
//   current term genuinely has zero arms/subjects" (shown as "0").
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  GraduationCap,
  History,
  Users,
  LayoutGrid,
  BookOpen,
} from "lucide-react";
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

// Shape from GET student/analytics/. Only `historic_total` and
// `current_total` are rendered on this page for now; the rest of the
// breakdown is typed so the response is self-documenting and available to
// future cards.
interface StudentAnalytics {
  historic_total: number;
  current_total: number;
  enrolled: number;
  unenrolled: number;
  graduated: number;
  withdrawn: number;
  expelled: number;
  transferred_out: number;
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

// Shape from GET arm/analytics/. Only `total` and `has_current_term` are
// consumed on this page; the broadsheet/class-teacher breakdowns are typed
// for self-documentation and available to future cards on this page.
interface ArmAnalytics {
  has_current_term: boolean;
  total: number;
  broadsheet_none: number;
  broadsheet_pending: number;
  broadsheet_revoked: number;
  broadsheet_approved: number;
  without_class_teacher: number;
}

// Shape from GET subject/analytics/. Only `total` and `has_current_term`
// are consumed on this page.
interface SubjectAnalytics {
  has_current_term: boolean;
  total: number;
  offered_in_arms: number;
  not_yet_offered: number;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function AnalyticsStatsBar() {
  const { clientAuthFetch } = useClientAuthFetch();

  // ── 1. Student analytics ─────────────────────────────────────────────────
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

  // ── 2. Staff analytics ───────────────────────────────────────────────────
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

  // ── 3. Class arms analytics ───────────────────────────────────────────────
  // The backend resolves the school's current term internally — this card
  // no longer depends on a prior school/detail/ fetch to discover a term id.
  const armsQuery = useQuery<ApiEnvelope<ArmAnalytics>>({
    queryKey: ["analytics-arms", SCHOOL_ID],
    queryFn: async () => {
      const { data, error } = await clientAuthFetch<ApiEnvelope<ArmAnalytics>>(
        `arm/analytics/?school-id=${SCHOOL_ID}`,
      );
      if (error) throw new Error(error.message);
      return data!;
    },
  });

  // ── 4. Subjects analytics ─────────────────────────────────────────────────
  // Same independence as arms — no term id supplied, no school/detail/
  // dependency.
  const subjectsQuery = useQuery<ApiEnvelope<SubjectAnalytics>>({
    queryKey: ["analytics-subjects", SCHOOL_ID],
    queryFn: async () => {
      const { data, error } = await clientAuthFetch<
        ApiEnvelope<SubjectAnalytics>
      >(`subject/analytics/?school-id=${SCHOOL_ID}`);
      if (error) throw new Error(error.message);
      return data!;
    },
  });

  // ── Error toasts ─────────────────────────────────────────────────────────
  // One useEffect per query — each re-runs when that query's error changes,
  // so the user gets a fresh toast on every distinct failure.
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
          : "Failed to load class arm analytics.",
      );
    }
  }, [armsQuery.isError, armsQuery.error]);

  useEffect(() => {
    if (subjectsQuery.isError) {
      toast.error(
        subjectsQuery.error instanceof Error
          ? subjectsQuery.error.message
          : "Failed to load subject analytics.",
      );
    }
  }, [subjectsQuery.isError, subjectsQuery.error]);

  // Arms and subjects share the same "no current term" condition (both
  // endpoints resolve the same school's current term independently), so one
  // warning — gated on the arms response — covers both cards rather than
  // firing twice for the same underlying cause.
  useEffect(() => {
    if (armsQuery.data && armsQuery.data.data.has_current_term === false) {
      toast.warning(
        "This school has no active term — class arms and subjects unavailable.",
      );
    }
  }, [armsQuery.data]);

  // ── Derived per-card values ──────────────────────────────────────────────
  // Numbers are formatted with thousand separators (matches the original
  // mock's "1,248" presentation). "—" is shown on error or when the school
  // has no current term (has_current_term === false) — a genuine zero count
  // under an active term is shown as "0", not "—".
  // Both cards read from the same studentQuery response — current_total and
  // historic_total are two fields on one payload, not two separate fetches.
  const studentsLoading = studentQuery.isLoading;
  const currentStudentsValue =
    studentQuery.data?.data.current_total?.toLocaleString() ?? "—";
  const historicStudentsValue =
    studentQuery.data?.data.historic_total?.toLocaleString() ?? "—";

  const staffLoading = staffQuery.isLoading;
  const staffValue = staffQuery.data?.data.total?.toLocaleString() ?? "—";

  const armsLoading = armsQuery.isLoading;
  const armsValue =
    armsQuery.data?.data.has_current_term === false
      ? "—"
      : (armsQuery.data?.data.total?.toLocaleString() ?? "—");

  const subjectsLoading = subjectsQuery.isLoading;
  const subjectsValue =
    subjectsQuery.data?.data.has_current_term === false
      ? "—"
      : (subjectsQuery.data?.data.total?.toLocaleString() ?? "—");

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <AnalyticsCard
        label="Current Students"
        value={currentStudentsValue}
        loading={studentsLoading}
        icon={<GraduationCap size={20} />}
        color="violet"
      />
      <AnalyticsCard
        label="Historic Students"
        value={historicStudentsValue}
        loading={studentsLoading}
        icon={<History size={20} />}
        color="slate"
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
  color: "violet" | "blue" | "emerald" | "amber" | "slate";
}) {
  if (loading) {
    return <StatCardLoader count={1} cols="grid-cols-1" />;
  }

  return <StatCard label={label} value={value} icon={icon} color={color} />;
}
