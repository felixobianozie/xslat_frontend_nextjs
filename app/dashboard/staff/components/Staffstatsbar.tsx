"use client";

// ─────────────────────────────────────────────────────────────────────────────
// StaffStatsBar.tsx
//
// Summary statistics for the staff list, rendered as four compact cards on one
// grid, in the same style as the student stats bar:
//
//   [ Current / Historic ] [ Male / Female ]
//   [ Academic / Non-Academic ] [ Resigned · Retired · Terminated ]
//
// "Current" is `current_total`: everyone still part of the school (active or
// inactive). "Historic" is `historic_total`: current staff plus everyone who
// has left. Male and Female read `current_gender`, the same staff as
// "Current". Academic and Non-Academic count current staff only. The last card
// is a compact one for the staff who have left (resigned, retired and
// terminated).
//
// Data layer:
//  - Fetches its own data internally via useQuery — no server props needed.
//  - Calls GET staff/analytics/?school-id=<X>, which returns server-side
//    aggregate counts in a single round-trip. No client-side reduction is
//    needed: every count we show comes straight from the response payload.
//  - The query key ["staff-analytics", SCHOOL_ID] is shared with the places
//    that change staff (approving a request, setting employment), so they
//    refresh this bar with invalidateQueries.
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
import {
  Ban,
  BookOpen,
  Briefcase,
  History,
  Hourglass,
  LogOut,
  Mars,
  Users,
  Venus,
} from "lucide-react";
import { toast } from "react-toastify";
import { useClientAuthFetch } from "@/lib/Useclientauthfetch";
import StatCardLoader from "../../components/Statcardloader";
import { CombinedStatCard, LeaversStatCard } from "../../components/Statcards";

// ── Constants ─────────────────────────────────────────────────────────────────

const SCHOOL_ID = process.env.NEXT_PUBLIC_SCHOOL_ID ?? "";

// The grid: one column on a phone, two on a tablet and all four across on a
// laptop, the same as the student stats bar.
const GRID_CLASSES =
  "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8";

interface StaffGenderCounts {
  male: number;
  female: number;
  others: number;
}

interface StaffAnalyticsResponse {
  message: string;
  data: {
    historic_total: number;
    current_total: number;
    active: number;
    inactive: number;
    resigned: number;
    retired: number;
    terminated: number;
    transferred: number;
    current_gender: StaffGenderCounts;
    historic_gender: StaffGenderCounts;
    academic: number;
    non_academic: number;
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
    // Four skeleton cards — matches the resolved layout below so there is no
    // layout shift when the real data arrives.
    return (
      <div className={GRID_CLASSES}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 min-h-19 flex items-center justify-center"
          >
            <StatCardLoader count={1} />
          </div>
        ))}
      </div>
    );
  }

  // Pull counts straight from the backend response, falling back to 0 for any
  // missing field so the UI never renders "NaN" or "undefined".
  const data = queryData?.data;
  const currentTotal = data?.current_total ?? 0;
  const historicTotal = data?.historic_total ?? 0;
  const male = data?.current_gender?.male ?? 0;
  const female = data?.current_gender?.female ?? 0;
  const academic = data?.academic ?? 0;
  const nonAcademic = data?.non_academic ?? 0;
  const resigned = data?.resigned ?? 0;
  const retired = data?.retired ?? 0;
  const terminated = data?.terminated ?? 0;

  return (
    <div className={GRID_CLASSES}>
      {/* Current / Historic — staff still at the school vs everyone ever held.
          Current is emphasised with the primary violet accent; Historic uses
          a muted slate accent to read as reference data. */}
      <CombinedStatCard
        entries={[
          {
            label: "Current Staff",
            value: currentTotal,
            icon: <Users size={16} className="text-violet-600" />,
            accent: "bg-violet-50",
          },
          {
            label: "Historic Staff",
            value: historicTotal,
            icon: <History size={16} className="text-slate-500" />,
            accent: "bg-slate-100",
          },
        ]}
      />

      {/* Male / Female — current staff */}
      <CombinedStatCard
        entries={[
          {
            label: "Male",
            value: male,
            icon: <Mars size={16} className="text-blue-600" />,
            accent: "bg-blue-50",
          },
          {
            label: "Female",
            value: female,
            icon: <Venus size={16} className="text-pink-600" />,
            accent: "bg-pink-50",
          },
        ]}
      />

      {/* Academic / Non-Academic — current staff */}
      <CombinedStatCard
        entries={[
          {
            label: "Academic",
            value: academic,
            icon: <BookOpen size={16} className="text-blue-600" />,
            accent: "bg-blue-50",
          },
          {
            label: "Non-Academic",
            value: nonAcademic,
            icon: <Briefcase size={16} className="text-amber-600" />,
            accent: "bg-amber-50",
          },
        ]}
      />

      {/* Departed — staff who have left, side by side. Amber for resigning,
          blue for retiring and red for being terminated. */}
      <LeaversStatCard
        entries={[
          {
            label: "Resigned",
            value: resigned,
            Icon: LogOut,
            iconColorClass: "text-amber-600",
            accent: "bg-amber-50",
          },
          {
            label: "Retired",
            value: retired,
            Icon: Hourglass,
            iconColorClass: "text-blue-600",
            accent: "bg-blue-50",
          },
          {
            label: "Terminated",
            value: terminated,
            Icon: Ban,
            iconColorClass: "text-red-600",
            accent: "bg-red-50",
          },
        ]}
      />
    </div>
  );
}
