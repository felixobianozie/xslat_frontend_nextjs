// ─────────────────────────────────────────────────────────────────────────────
// app/dashboard/configurations/page.tsx
//
// Server Component for /dashboard/configurations — one place for the school's
// rules and academic setup.
//
// Only the data for the first tab, School Policies, is fetched here, in
// parallel, and placed in ConfigurationsProvider
// (context/Configurationsprovider.tsx). The policy components give it to React
// Query as `initialData`, so that tab renders without a loading flash.
//
// Every other tab loads its data with React Query the first time it is opened
// and keeps it cached, so reloading this page costs two requests instead of one
// per tab:
//
//   School Policies     school-settings/detail/, pins/policy/detail/ (here)
//   School Profile      school/detail/
//   Grading             grading-format/list/
//   Assessment Formats  cognitive|affective|psychomotor-format/list/
//                       (each family when it is first shown)
//   Pass Rules          pass-rule/list/, subject-definition/list/ (editor)
//   Subjects            subject-definition/list/, school/detail/ (current
//                       term), subject/list/ for the current term
//   School Calendar     session/list/, school/detail/, then each session's
//                       terms when it is opened
//   School Structure    school/detail/ (current term), section/list/,
//                       level/list/ per section, arm/list/
//   Arm Settings        school/detail/ (current term), arm/list/, arm/detail/
//                       per arm, subject/list/ for the current term, and the
//                       assignable lists when the panel opens
//   Roles & Permissions roles/list/, permissions/, and staff/portfolios/list/
//                       per role for the staff counts
//
// A fetch that fails (for example a 403 for a section the user may not view)
// is logged and passed down as null; that tab then loads its own data and shows
// the backend's error message with a retry button instead of breaking the page.
// ─────────────────────────────────────────────────────────────────────────────

import type { Metadata } from "next";

import { serverAuthFetch } from "@/lib/Serverauthfetch";
import type {
  ApiEnvelope,
  PinPolicyData,
  SchoolSettingsData,
} from "@/types/configurations";
import ConfigTabArea from "./components/Configtabarea";
import { ConfigurationsProvider } from "./context/Configurationsprovider";

export const metadata: Metadata = {
  title: "Configurations",
  description:
    "Manage school policies, the school profile, grading, assessment formats, pass rules, subjects, the school calendar, the school structure, arm settings and roles and permissions.",
};

// ── Constants ────────────────────────────────────────────────────────────────

const SCHOOL_ID = process.env.NEXT_PUBLIC_SCHOOL_ID ?? "";

// ── Fetch helpers ────────────────────────────────────────────────────────────

// Fetches one endpoint. Returns null on failure so one failing section cannot
// take the whole page down.
async function fetchEnvelope<T>(
  endpoint: string,
): Promise<ApiEnvelope<T> | null> {
  const { data, error } = await serverAuthFetch<ApiEnvelope<T>>(endpoint);

  if (error || !data) {
    console.error(`Failed to fetch ${endpoint}:`, error?.message);
    return null;
  }
  return data;
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function ConfigurationsPage() {
  // The two requests are independent, so they run at once.
  const [schoolSettings, pinPolicy] = await Promise.all([
    fetchEnvelope<SchoolSettingsData>(
      `school-settings/detail/?school-id=${SCHOOL_ID}`,
    ),
    fetchEnvelope<PinPolicyData>(`pins/policy/detail/?school-id=${SCHOOL_ID}`),
  ]);

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 rounded-lg px-5 py-10">
        <h1 className="text-2xl font-bold text-white">Configurations</h1>
        <p className="text-sm text-slate-300 mt-1">
          Set the rules your school uses to grade, assess and publish results,
          manage the school calendar, and assign these settings to class arms.
        </p>
      </div>

      <ConfigurationsProvider prefetched={{ schoolSettings, pinPolicy }}>
        <ConfigTabArea />
      </ConfigurationsProvider>
    </div>
  );
}
