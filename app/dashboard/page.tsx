import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/Authoptions";

import OnboardingSection from "@/app/dashboard/components/Onboardingsection";
import AppDownloadBanner from "@/app/dashboard/components/Appdownloadbanner";
import ProfileRequestsSent from "@/app/dashboard/components/Profilerequestssent";

// Server component — pulls the user's first name from the session JWT claims
// so the greeting is personalised without an extra round-trip.
//
// session.accessClaims is populated by the NextAuth jwt + session callbacks
// (see Authoptions.ts) from the backend-issued access token. The claims set
// is documented in CustomJWTSerializer:
//   user_id, first_name, last_name, email, is_superuser,
//   auth_user_type, auth_school, roles, permissions.
export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  // Fall back to a friendly generic if the claim is missing for any reason
  // (e.g. token issued by an older backend version without first_name).
  const firstName = session?.accessClaims?.first_name ?? "there";

  return (
    <div className="space-y-8">
      {/* Heading */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Welcome, {firstName}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Here are a few things you can get started with to unlock the full
          experience.
        </p>
      </div>

      <div className="flex-1 h-1 bg-slate-300 rounded-full" />

      {/* Onboarding (cards + slide panels for verify / request flows) */}
      <OnboardingSection />

      {/* App download banner */}
      <AppDownloadBanner />

      {/* Profile requests sent by the current user */}
      <ProfileRequestsSent />
    </div>
  );
}
