// ─────────────────────────────────────────────────────────────────────────────
// staff-profile/page.tsx
//
// A staff member's profile at this school, read-only. Reached from Staff
// Management → View Profile as /dashboard/staff-profile?id=<portfolio id>.
//
// Server Component — reads the portfolio id from the address, fetches the
// profile on the server (GET staff/portfolios/profile/) and hands it to the
// client component as initialData, so the page opens filled in. If that fetch
// fails, the client component fetches again and shows the reason (no such
// profile, no permission, …).
//
// `searchParams` is async in Next 15+, so it is awaited before it is read.
// ─────────────────────────────────────────────────────────────────────────────

import { serverAuthFetch } from "@/lib/Serverauthfetch";
import EmptyState from "../components/Emptystate";
import StaffProfile from "./components/Staffprofile";

const SCHOOL_ID = process.env.NEXT_PUBLIC_SCHOOL_ID ?? "";

interface ProfileResponse {
  message: string;
  data: StaffProfileDetails;
}

async function fetchInitialProfile(
  portfolioId: string,
): Promise<StaffProfileDetails | null> {
  const { data, error } = await serverAuthFetch<ProfileResponse>(
    `staff/portfolios/profile/?portfolio-id=${encodeURIComponent(
      portfolioId,
    )}&school-id=${SCHOOL_ID}`,
  );

  if (error || !data) {
    // Return null on failure — the client component fetches again and shows
    // the reason.
    console.error("Failed to fetch the staff profile:", error?.message);
    return null;
  }

  return data.data;
}

const MAIN_CLASSES =
  "h-screen overflow-y-auto [&::-webkit-scrollbar]:hidden scrollbar-none [-ms-overflow-style:none]";

export default async function StaffProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;

  if (!id) {
    return (
      <main className={MAIN_CLASSES}>
        <EmptyState
          variant="staff"
          title="No staff member selected"
          description="Open a profile from Staff Management."
        />
      </main>
    );
  }

  const initialProfile = await fetchInitialProfile(id);

  return (
    <main className={MAIN_CLASSES}>
      <StaffProfile portfolioId={id} initialData={initialProfile} />
    </main>
  );
}
