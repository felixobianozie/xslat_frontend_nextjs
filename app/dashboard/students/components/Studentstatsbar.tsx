"use client";

// ─────────────────────────────────────────────────────────────────────────────
// StudentStatsBar.tsx
//
// Summary statistics for the student list, rendered as four compact cards on
// the same horizontal grid:
//
//   [ Active / Historic ] [ Enrolled / Unenrolled ] [ Male / Female ] [ Leavers × 4 ]
//
// "Active" reads `current_total` from the analytics endpoint — students still
// on the school's books (portfolios whose status is not one of the permanent-
// leave flavours). "Historic" reads `historic_total` — every StudentPortfolio
// the school has ever held, including graduates and departures. The trailing
// card breaks the four permanent-leave statuses out side by side (Graduated,
// Withdrawn, Expelled, Transferred) so the composition of "who has left" is
// visible at a glance without adding another row to the grid.
//
// "Male" and "Female" read `current_gender` — the same students as "Active" —
// so Male + Female (+ others) always equals the Active total. The response's
// `historic_gender` covers every student the school has ever held.
//
// Data layer:
//  - Fetches its own data internally via useQuery — no server props needed.
//  - Calls GET student/analytics/?school-id=<X>, which returns server-side
//    aggregate counts in a single round-trip. Every count rendered comes
//    straight from the response payload — no client-side reduction.
//  - Query key ["student-stats", SCHOOL_ID] is the shared convention used by
//    every mutation site in the students feature, so create / assign /
//    change / remove / bulk-assign flows all refresh this bar via
//    invalidateQueries.
//  - Fetch errors are surfaced to the user via toast. React Query v5 removed
//    the onError callback, so a useEffect watches the query's error state.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Ban,
  GraduationCap,
  History,
  LogOut,
  Mars,
  UserCheck,
  UserMinus,
  Users,
  Venus,
} from "lucide-react";
import { toast } from "react-toastify";
import { useClientAuthFetch } from "@/lib/Useclientauthfetch";
import StatCardLoader from "../../components/Statcardloader";
import { CombinedStatCard, LeaversStatCard } from "../../components/Statcards";

// ── Constants ────────────────────────────────────────────────────────────────

const SCHOOL_ID = process.env.NEXT_PUBLIC_SCHOOL_ID ?? "";

// ── Response envelope ────────────────────────────────────────────────────────
// Mirrors the payload returned by StudentAnalyticsView. Every field the
// backend returns is typed here; the bar only renders eight of them but the
// rest are kept on the type so cache readers get full IntelliSense.
interface StudentGenderCounts {
  male: number;
  female: number;
  others: number;
}

interface StudentAnalyticsResponse {
  message: string;
  data: {
    historic_total: number;
    current_total: number;
    enrolled: number;
    unenrolled: number;
    graduated: number;
    withdrawn: number;
    expelled: number;
    transferred_out: number;
    current_gender: StudentGenderCounts;
    historic_gender: StudentGenderCounts;
    boarding: number;
    day: number;
  };
}

export default function StudentStatsBar() {
  const { clientAuthFetch } = useClientAuthFetch();

  const {
    data: queryData,
    isLoading,
    isError,
    error,
  } = useQuery<StudentAnalyticsResponse>({
    queryKey: ["student-stats", SCHOOL_ID],

    queryFn: async () => {
      const { data, error } = await clientAuthFetch<StudentAnalyticsResponse>(
        `student/analytics/?school-id=${SCHOOL_ID}`,
      );

      if (error) {
        // Throwing makes React Query set isError and retry according to its
        // policy. The error message is picked up by the useEffect below.
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
    // Four skeleton cards — matches the resolved layout below so there is no
    // layout shift when the real data arrives.
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
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
  const currentTotal = queryData?.data.current_total ?? 0;
  const historicTotal = queryData?.data.historic_total ?? 0;
  const enrolled = queryData?.data.enrolled ?? 0;
  const unenrolled = queryData?.data.unenrolled ?? 0;
  const male = queryData?.data.current_gender?.male ?? 0;
  const female = queryData?.data.current_gender?.female ?? 0;
  const graduated = queryData?.data.graduated ?? 0;
  const withdrawn = queryData?.data.withdrawn ?? 0;
  const expelled = queryData?.data.expelled ?? 0;
  const transferredOut = queryData?.data.transferred_out ?? 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
      {/* Current / Historic — current on-books count vs all-time roll.
          Current is emphasised with the primary violet accent; Historic
          uses a muted slate accent to read as reference data. */}
      <CombinedStatCard
        entries={[
          {
            label: "Current Total",
            value: currentTotal,
            icon: <Users size={16} className="text-violet-600" />,
            accent: "bg-violet-50",
          },
          {
            label: "Historic Total",
            value: historicTotal,
            icon: <History size={16} className="text-slate-500" />,
            accent: "bg-slate-100",
          },
        ]}
      />

      {/* Enrolled / Unenrolled (combined) */}
      <CombinedStatCard
        entries={[
          {
            label: "Enrolled",
            value: enrolled,
            icon: <UserCheck size={16} className="text-emerald-600" />,
            accent: "bg-emerald-50",
          },
          {
            label: "Unenrolled",
            value: unenrolled,
            icon: <UserMinus size={16} className="text-amber-600" />,
            accent: "bg-amber-50",
          },
        ]}
      />

      {/* Male / Female (combined) */}
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

      {/* Leavers — the four permanent-leave statuses side by side. Semantic
          colouring: green for the positive outcome (graduated), amber for
          voluntary (withdrawn), red for disciplinary (expelled), indigo for
          neutral movement (transferred). */}
      <LeaversStatCard
        entries={[
          {
            label: "Graduated",
            value: graduated,
            Icon: GraduationCap,
            iconColorClass: "text-emerald-600",
            accent: "bg-emerald-50",
          },
          {
            label: "Withdrawn",
            value: withdrawn,
            Icon: LogOut,
            iconColorClass: "text-amber-600",
            accent: "bg-amber-50",
          },
          {
            label: "Expelled",
            value: expelled,
            Icon: Ban,
            iconColorClass: "text-red-600",
            accent: "bg-red-50",
          },
          {
            label: "Transferred",
            value: transferredOut,
            Icon: ArrowUpRight,
            iconColorClass: "text-indigo-600",
            accent: "bg-indigo-50",
          },
        ]}
      />
    </div>
  );
}
