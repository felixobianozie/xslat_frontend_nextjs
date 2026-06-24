"use client";

// ─────────────────────────────────────────────────────────────────────────────
// StaffStatsBar.tsx
//
// Summary statistics for the staff list.
// Stats: Total Staff · Active · Academic · Non-Academic
//
// Data layer:
//  - Fetches its own data internally via useQuery — no server props needed.
//  - Calls GET staff/analytics/?school-id=<X>, which returns server-side
//    aggregate counts in a single round-trip. No client-side reduction is
//    needed: every count we show comes straight from the response payload.
//  - useQuery is the single source of truth: it handles loading, caching,
//    background refetching, and error recovery automatically.
//  - Fetch errors are surfaced to the user via a toast notification.
//    A useEffect watches the query's error state and fires the toast whenever
//    a new error is set (React Query's onError callback was removed in v5).
//
// Loading state:
//  - Renders 4 skeleton cards (matching the final layout) while the query
//    is in flight — consistent with the app's loading visual language.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users, UserCheck, BookOpen, Briefcase } from "lucide-react";
import { toast } from "react-toastify";
import { useClientAuthFetch } from "@/lib/Useclientauthfetch";
import StatCardLoader from "../../components/Statcardloader";

// ── Constants ─────────────────────────────────────────────────────────────────

const SCHOOL_ID = process.env.NEXT_PUBLIC_SCHOOL_ID ?? "";

// ── Response envelope ─────────────────────────────────────────────────────────
// Mirrors the payload returned by StaffAnalyticsView in views.py. We only
// type the fields this component actually reads; the backend also returns
// gender/employment breakdowns that aren't shown here but are safe to ignore.
interface StaffAnalyticsResponse {
  message: string;
  data: {
    total: number;
    active: number;
    inactive: number;
    academic: number;
    non_academic: number;
    male: number;
    female: number;
    others: number;
    full_time: number;
    part_time: number;
    teaching_practice: number;
    nysc: number;
    employment_not_set: number;
  };
}

export default function StaffStatsBar() {
  const { clientAuthFetch } = useClientAuthFetch();

  // Dedicated key so the stats cache can be invalidated independently of the
  // paginated list query in StaffList (which includes page/filter params).
  const {
    data: queryData,
    isLoading,
    isError,
    error,
  } = useQuery<StaffAnalyticsResponse>({
    queryKey: ["staff-analytics", SCHOOL_ID],

    queryFn: async () => {
      const { data, error } = await clientAuthFetch<StaffAnalyticsResponse>(
        `staff/analytics/?school-id=${SCHOOL_ID}`,
      );

      if (error) {
        // Throw so React Query marks the query as failed and handles retries.
        // The error message is picked up by the useEffect below for the toast.
        throw new Error(error.message);
      }

      return data!;
    },
  });

  // Surface fetch errors to the user via toast.
  // Re-runs whenever `error` changes — i.e. on each new failure.
  useEffect(() => {
    if (isError && error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load staff statistics.",
      );
    }
  }, [isError, error]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 h-18 flex items-center justify-center"
          >
            <StatCardLoader count={1} />
          </div>
        ))}
      </div>
    );
  }

  // Pull counts straight from the backend response. Fall back to 0 for any
  // missing field so the UI never renders an "NaN" or "undefined".
  const stats = {
    total: queryData?.data.total ?? 0,
    active: queryData?.data.active ?? 0,
    academic: queryData?.data.academic ?? 0,
    nonAcademic: queryData?.data.non_academic ?? 0,
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <StatCard
        label="Total Staff"
        value={stats.total}
        icon={<Users size={18} className="text-violet-600" />}
        accent="bg-violet-50"
      />
      <StatCard
        label="Active Staff"
        value={stats.active}
        icon={<UserCheck size={18} className="text-emerald-600" />}
        accent="bg-emerald-50"
      />
      <StatCard
        label="Academic Staff"
        value={stats.academic}
        icon={<BookOpen size={18} className="text-blue-600" />}
        accent="bg-blue-50"
      />
      <StatCard
        label="Non-Academic"
        value={stats.nonAcademic}
        icon={<Briefcase size={18} className="text-amber-600" />}
        accent="bg-amber-50"
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3 hover:shadow-md transition-shadow duration-200">
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${accent}`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-400 font-medium truncate">{label}</p>
        <p className="text-2xl font-bold text-slate-800 leading-tight">
          {value}
        </p>
      </div>
    </div>
  );
}
