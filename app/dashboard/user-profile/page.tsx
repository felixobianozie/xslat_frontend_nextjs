// ─────────────────────────────────────────────────────────────────────────────
// user-profile/page.tsx
//
// The signed-in person's own profile: their details, which they can edit
// (name, gender and addresses), and the schools they belong to. Reached from
// the profile icon in the top bar and the right sidebar.
//
// Server Component — fetches GET users/me/ on the server and hands the whole
// response to the client component as initialData, so the page opens filled
// in. If that fetch fails, the client component fetches again and shows the
// reason.
// ─────────────────────────────────────────────────────────────────────────────

import { serverAuthFetch } from "@/lib/Serverauthfetch";
import UserProfile from "./components/Userprofile";

interface UserMeResponse {
  message: string;
  data: UserMe;
}

async function fetchInitialProfile(): Promise<UserMeResponse | null> {
  const { data, error } = await serverAuthFetch<UserMeResponse>("users/me/");

  if (error || !data) {
    // Return null on failure — the client component fetches again.
    console.error("Failed to fetch the user profile:", error?.message);
    return null;
  }

  return data;
}

export default async function UserProfilePage() {
  const initialProfile = await fetchInitialProfile();

  return (
    <main className="h-screen overflow-y-auto [&::-webkit-scrollbar]:hidden scrollbar-none [-ms-overflow-style:none]">
      <UserProfile initialData={initialProfile} />
    </main>
  );
}
