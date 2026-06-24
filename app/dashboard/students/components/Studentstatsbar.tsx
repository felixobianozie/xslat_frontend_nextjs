"use client";

// ─────────────────────────────────────────────────────────────────────────────
// StudentStatsBar.tsx
//
// Summary statistics for the student list.
// Stats: Total · Active · Inactive · Male · Female
//
// Data layer:
//  - Fetches its own data internally via useQuery — no server props needed.
//  - Calls GET student/analytics/?school-id=<X>, which returns server-side
//    aggregate counts in a single round-trip. No client-side reduction is
//    needed: every count we show comes straight from the response payload.
//  - useQuery is the single source of truth: it handles loading, caching,
//    background refetching, and error recovery automatically.
//  - Fetch errors are surfaced to the user via toast. A useEffect watches the
//    query's error state and fires the toast on each new error (React Query's
//    onError callback was removed in v5).
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users, UserCheck, UserX, Mars, Venus } from "lucide-react";
import { toast } from "react-toastify";
import { useClientAuthFetch } from "@/lib/Useclientauthfetch";
import StatCardLoader from "../../components/Statcardloader";

// ── Constants ─────────────────────────────────────────────────────────────────

const SCHOOL_ID = process.env.NEXT_PUBLIC_SCHOOL_ID ?? "";

// ── Response envelope ─────────────────────────────────────────────────────────
// Mirrors the payload returned by StudentAnalyticsView in views.py. We type
// every field the backend returns; the bar only renders five of them, but the
// rest are kept on the type so callers reading from the cache get full
// IntelliSense and so future additions don't need to revisit this interface.
interface StudentAnalyticsResponse {
  message: string;
  data: {
    total: number;
    active: number;
    inactive: number;
    male: number;
    female: number;
    others: number;
    boarding: number;
    day: number;
  };
}

export default function StudentStatsBar() {
  const { clientAuthFetch } = useClientAuthFetch();

  // Dedicated key so the stats cache can be invalidated independently of the
  // paginated list query in StudentList (which includes page/filter params).
  const {
    data: queryData,
    isLoading,
    isError,
    error,
  } = useQuery<StudentAnalyticsResponse>({
    queryKey: ["student-analytics", SCHOOL_ID],

    queryFn: async () => {
      const { data, error } = await clientAuthFetch<StudentAnalyticsResponse>(
        `student/analytics/?school-id=${SCHOOL_ID}`,
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
  useEffect(() => {
    if (isError && error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load student statistics.",
      );
    }
  }, [isError, error]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {Array.from({ length: 5 }).map((_, i) => (
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
    inactive: queryData?.data.inactive ?? 0,
    male: queryData?.data.male ?? 0,
    female: queryData?.data.female ?? 0,
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
      <StatCard
        label="Total Students"
        value={stats.total}
        icon={<Users size={18} className="text-violet-600" />}
        accent="bg-violet-50"
      />
      <StatCard
        label="Active"
        value={stats.active}
        icon={<UserCheck size={18} className="text-emerald-600" />}
        accent="bg-emerald-50"
      />
      <StatCard
        label="Inactive"
        value={stats.inactive}
        icon={<UserX size={18} className="text-amber-600" />}
        accent="bg-amber-50"
      />
      <StatCard
        label="Male"
        value={stats.male}
        icon={<Mars size={18} className="text-blue-600" />}
        accent="bg-blue-50"
      />
      <StatCard
        label="Female"
        value={stats.female}
        icon={<Venus size={18} className="text-pink-600" />}
        accent="bg-pink-50"
      />
    </div>
  );
}

// ── Reusable stat card ─────────────────────────────────────────────────────
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
