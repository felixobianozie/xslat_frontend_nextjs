"use client";

// ─────────────────────────────────────────────────────────────────────────────
// StudentStatsBar.tsx
//
// Summary statistics for the student list, rendered as four compact cards:
//
//   [ Total ] [ Enrolled / Unenrolled ] [ Graduated ] [ Male / Female ]
//
// Data layer:
//  - Fetches its own data internally via useQuery — no server props needed.
//  - Calls GET student/analytics/?school-id=<X>, which returns server-side
//    aggregate counts in a single round-trip. Every count rendered comes
//    straight from the response payload — no client-side reduction.
//  - Query key ["student-stats", SCHOOL_ID] is the shared convention used by
//    every mutation site in the students feature, so create/assign/change/
//    remove/bulk-assign flows all refresh this bar via invalidateQueries.
//  - Fetch errors are surfaced to the user via toast. React Query v5 removed
//    the onError callback, so a useEffect watches the query's error state.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  UserCheck,
  UserMinus,
  GraduationCap,
  Mars,
  Venus,
} from "lucide-react";
import { toast } from "react-toastify";
import { useClientAuthFetch } from "@/lib/Useclientauthfetch";
import StatCardLoader from "../../components/Statcardloader";

// ── Constants ────────────────────────────────────────────────────────────────

const SCHOOL_ID = process.env.NEXT_PUBLIC_SCHOOL_ID ?? "";

// ── Response envelope ────────────────────────────────────────────────────────
// Mirrors the payload returned by StudentAnalyticsView in views.py. Every
// field the backend returns is typed here; the bar only renders six of them
// but the rest are kept on the type so cache readers get full IntelliSense.
interface StudentAnalyticsResponse {
  message: string;
  data: {
    total: number;
    enrolled: number;
    unenrolled: number;
    graduated: number;
    male: number;
    female: number;
    others: number;
    boarding: number;
    day: number;
  };
}

// A single value shown inside a compact card row.
interface StatEntry {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent: string;
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
  const total = queryData?.data.total ?? 0;
  const enrolled = queryData?.data.enrolled ?? 0;
  const unenrolled = queryData?.data.unenrolled ?? 0;
  const graduated = queryData?.data.graduated ?? 0;
  const male = queryData?.data.male ?? 0;
  const female = queryData?.data.female ?? 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
      {/* Total (single stat) */}
      <SingleStatCard
        label="Total Students"
        value={total}
        icon={<Users size={18} className="text-violet-600" />}
        accent="bg-violet-50"
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

      {/* Graduated (single stat) */}
      <SingleStatCard
        label="Graduated"
        value={graduated}
        icon={<GraduationCap size={18} className="text-sky-600" />}
        accent="bg-sky-50"
      />
    </div>
  );
}

// ── Single-stat card ─────────────────────────────────────────────────────────
// Compact card showing one label + one big value with an accent icon square.
function SingleStatCard({
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
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3 min-h-19 hover:shadow-md transition-shadow duration-200">
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${accent}`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-400 font-medium truncate">{label}</p>
        <p className="text-2xl font-bold text-slate-800 leading-tight tabular-nums">
          {value.toLocaleString()}
        </p>
      </div>
    </div>
  );
}

// ── Combined-stat card ───────────────────────────────────────────────────────
// Compact card packing two related stats into two side-by-side halves,
// separated by a thin vertical divider. Each half mirrors the single-card
// visual language (icon square + label above value) so the whole grid reads
// as one consistent set.
function CombinedStatCard({ entries }: { entries: [StatEntry, StatEntry] }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex overflow-hidden min-h-19 hover:shadow-md transition-shadow duration-200">
      {entries.map((entry, i) => (
        <div
          key={entry.label}
          className={`flex-1 min-w-0 flex items-center gap-2.5 px-3 py-3 ${
            i === 0 ? "border-r border-slate-100" : ""
          }`}
        >
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${entry.accent}`}
          >
            {entry.icon}
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-slate-400 font-medium truncate">
              {entry.label}
            </p>
            <p className="text-xl font-bold text-slate-800 leading-tight tabular-nums truncate">
              {entry.value.toLocaleString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
