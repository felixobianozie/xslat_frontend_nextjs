"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Onboardingsection.tsx
//
// Top "Get started" block on the dashboard. Four cards:
//   1. Verify Your Email        — opens VerifyEmailPanel; flips to "Verified"
//                                  once user.email_is_valid is true.
//   2. Verify Phone Number      — opens VerifyPhonePanel; flips to "Verified"
//                                  once user.phone_is_valid is true.
//   3. Request Staff Profile    — always actionable (user can request to
//                                  multiple schools). Opens RequestStaffProfilePanel.
//   4. Request Guardian Profile — no backend yet; clicking shows the
//                                  "feature in the works" toast.
//
// Data:
//   * userId is read from the session JWT (session.accessClaims.user_id).
//   * The user record is fetched via GET users/detail/?id=<userId> — gives us
//     the email, phone, and per-channel validation booleans.
//
// Slide panels follow the existing project pattern: the card grid and the
// panel are siblings; one collapses to w-0 while the other expands to w-full.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { Mail, Phone, UserCog, Users } from "lucide-react";
import { toast } from "react-toastify";

import { useClientAuthFetch } from "@/lib/Useclientauthfetch";
import OnboardingCard from "./Onboardingcard";
import VerifyEmailPanel from "./Verifyemailpanel";
import VerifyPhonePanel from "./Verifyphonepanel";
import RequestStaffProfilePanel from "./Requeststaffprofilepanel";

// Standard "feature in the works" toast wording — matches other pages.
const FEATURE_IN_WORKS = "This feature is currently in the works.";

// Which slide panel is currently open. `null` means the card grid is shown.
type OpenPanel = "email" | "phone" | "staff-request" | null;

// Minimal user shape — only the fields this section actually uses.
// Full CustomUserSerializer payload has many more fields.
interface CurrentUser {
  id: string;
  email: string;
  phone: string;
  email_is_valid: boolean;
  phone_is_valid: boolean;
}

interface ApiEnvelope<T> {
  message: string;
  data: T;
}

export default function OnboardingSection() {
  const { clientAuthFetch } = useClientAuthFetch();
  const { data: session } = useSession();

  // user_id is the only stable identifier in the JWT; everything else (email,
  // phone, validation status) is fetched fresh so it reflects the latest state.
  const userId = session?.accessClaims?.user_id ?? "";

  // Which slide panel is open right now.
  const [openPanel, setOpenPanel] = useState<OpenPanel>(null);

  // ── Fetch current user ───────────────────────────────────────────────────
  const { data: userData, isError } = useQuery<ApiEnvelope<CurrentUser>>({
    queryKey: ["user", userId],
    queryFn: async () => {
      const { data, error } = await clientAuthFetch<ApiEnvelope<CurrentUser>>(
        `users/detail/?id=${userId}`,
      );
      if (error) throw new Error(error.message);
      return data!;
    },
    enabled: !!userId,
  });

  useEffect(() => {
    if (isError) toast.error("Could not load your account information.");
  }, [isError]);

  const user = userData?.data;
  const emailVerified = !!user?.email_is_valid;
  const phoneVerified = !!user?.phone_is_valid;

  // Helpful UX guard: don't let users open the verify panels if we don't yet
  // have their email/phone loaded — they'd just see a blank read-only field.
  const canOpenEmailPanel = !!user?.email;
  const canOpenPhonePanel = !!user?.phone;

  const closePanel = () => setOpenPanel(null);

  return (
    <section>
      <h2 className="text-sm font-semibold text-slate-700 mb-3">Get started</h2>

      {/* Card grid — collapses to 0 when any slide panel is open. */}
      <div
        className={`transition-all duration-500 ease-in-out overflow-hidden ${
          openPanel ? "w-0 opacity-0 h-0" : "w-full opacity-100"
        }`}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Verify Email */}
          <OnboardingCard
            icon={<Mail size={22} className="text-violet-600" />}
            title="Verify Your Email"
            description="Confirm your email address to secure your account and receive important updates."
            actionLabel="Verify"
            completedLabel="Verified"
            completed={emailVerified}
            onAction={() => {
              if (!canOpenEmailPanel) {
                toast.info("Loading your account information…");
                return;
              }
              setOpenPanel("email");
            }}
          />

          {/* Verify Phone */}
          <OnboardingCard
            icon={<Phone size={22} className="text-violet-600" />}
            title="Verify Phone Number"
            description="Add and confirm your phone number to enable two-factor authentication."
            actionLabel="Verify"
            completedLabel="Verified"
            completed={phoneVerified}
            onAction={() => {
              if (!canOpenPhonePanel) {
                toast.info("Loading your account information…");
                return;
              }
              setOpenPanel("phone");
            }}
          />

          {/* Request Staff Profile — always actionable (one request per school). */}
          <OnboardingCard
            icon={<UserCog size={22} className="text-violet-600" />}
            title="Request Staff Profile"
            description="Send a request to a school to be added as a staff member. You can request to multiple schools."
            actionLabel="Request"
            onAction={() => {
              if (!userId) {
                toast.info("Loading your account information…");
                return;
              }
              setOpenPanel("staff-request");
            }}
          />

          {/* Request Guardian Profile — no backend yet. */}
          <OnboardingCard
            icon={<Users size={22} className="text-violet-600" />}
            title="Request Guardian Profile"
            description="Send a request to be added as a guardian to a school. (Coming soon.)"
            actionLabel="Request"
            onAction={() => toast.info(FEATURE_IN_WORKS)}
          />
        </div>
      </div>

      {/* Slide panels — only one can be open at a time. Each panel internally
          collapses to w-0 when its `show` prop is false, so off-state panels
          take zero space and do not interfere with layout. */}
      <VerifyEmailPanel
        show={openPanel === "email"}
        onClose={closePanel}
        email={user?.email ?? ""}
        userId={userId}
      />
      <VerifyPhonePanel
        show={openPanel === "phone"}
        onClose={closePanel}
        phone={user?.phone ?? ""}
        userId={userId}
      />
      <RequestStaffProfilePanel
        show={openPanel === "staff-request"}
        onClose={closePanel}
        userId={userId}
      />
    </section>
  );
}
