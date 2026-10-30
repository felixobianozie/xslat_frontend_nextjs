"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Staffprofile.tsx
//
// A staff member's profile at this school, read-only: a header card (photo,
// name, public ID, status, roles) and cards for their contact details, their
// place at the school and their addresses.
//
// Data layer:
//  - GET staff/portfolios/profile/?portfolio-id=<id>&school-id=<school> — the
//    backend returns the same fields to everyone allowed to read it.
//  - initialData is fetched by the page on the server, so the profile opens
//    filled in. The query then keeps it fresh.
//  - The query key sits under ["staff", SCHOOL_ID], the prefix the staff list
//    and its panels already invalidate, so changing someone's status,
//    employment or roles refreshes an open profile.
//  - A profile that does not exist or was removed (404) or that the viewer may
//    not read (403) shows its own message. Those are not retried.
//
// The camera button is a placeholder until photos are built.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { useClientAuthFetch } from "@/lib/Useclientauthfetch";
import EmptyState from "../../components/Emptystate";
import {
  DetailRow,
  ProfileSection,
  VerifiedBadge,
  formatProfileDate,
  joinAddress,
} from "../../components/Profilecard";
import ProfilePhoto from "../../components/Profilephoto";
import StaffStatusBadge from "../../staff/components/Staffstatusbadge";
import { EMPLOYMENT_CHOICES } from "../../staff/staffstatus";
import { personName } from "@/lib/Personname";

const SCHOOL_ID = process.env.NEXT_PUBLIC_SCHOOL_ID ?? "";

interface ProfileResponse {
  message: string;
  data: StaffProfileDetails;
}

// A failed load, carrying the HTTP status so the page can word it properly.
class ProfileLoadError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}

// What the invitation state means to a reader. No state means the staff
// member accepted, or was never sent one.
const INVITE_LABELS: Record<InviteState, string> = {
  pending: "Invitation pending",
  expired: "Invitation expired",
  locked: "Invitation locked",
  revoked: "Invitation revoked",
};

function employmentLabel(value: StaffProfileDetails["employment"]): string {
  return (
    EMPLOYMENT_CHOICES.find((choice) => choice.value === value)?.label ?? "—"
  );
}

interface StaffProfileProps {
  portfolioId: string;
  // Fetched by the page on the server; null when that fetch failed.
  initialData: StaffProfileDetails | null;
}

export default function StaffProfile({
  portfolioId,
  initialData,
}: StaffProfileProps) {
  const { clientAuthFetch } = useClientAuthFetch();

  // When the page's data was fetched: now, read once. It tells React Query the
  // server data is fresh, so it does not refetch the moment the page opens.
  const [mountedAt] = useState(() => Date.now());

  const {
    data: profile,
    isPending,
    error,
  } = useQuery<StaffProfileDetails, ProfileLoadError>({
    queryKey: ["staff", SCHOOL_ID, "profile", portfolioId],

    queryFn: async () => {
      const { data, error } = await clientAuthFetch<ProfileResponse>(
        `staff/portfolios/profile/?portfolio-id=${encodeURIComponent(
          portfolioId,
        )}&school-id=${SCHOOL_ID}`,
      );
      if (error) throw new ProfileLoadError(error.message, error.status);
      return data!.data;
    },

    initialData: initialData ?? undefined,
    initialDataUpdatedAt: initialData ? mountedAt : undefined,

    // A missing or forbidden profile will not appear by asking again.
    retry: (failureCount, err) =>
      !(err.status && err.status < 500) && failureCount < 2,
  });

  const backLink = (
    <Link
      href="/dashboard/staff"
      className="cursor-pointer flex items-center gap-1 text-xs text-red-600 hover:text-red-700 my-5 md:my-8 transition-all hover:scale-105 w-fit"
    >
      <ChevronLeft size={14} />
      <span>Back to staff</span>
    </Link>
  );

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isPending && !profile) {
    return (
      <div className="pb-10 animate-pulse">
        {backLink}
        <div className="h-56 rounded-2xl bg-slate-100" />
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="h-44 rounded-2xl bg-slate-100" />
          <div className="h-44 rounded-2xl bg-slate-100" />
        </div>
      </div>
    );
  }

  // ── Not available ──────────────────────────────────────────────────────────
  if (!profile) {
    const status = error?.status;
    return (
      <div className="pb-10">
        {backLink}
        <EmptyState
          variant="staff"
          title={
            status === 404
              ? "Profile not found"
              : status === 403
                ? "You cannot view this profile"
                : "Could not load this profile"
          }
          description={
            status === 404
              ? "This staff member does not exist or has been removed."
              : status === 403
                ? "You need permission to view staff profiles at this school."
                : (error?.message ?? "Please try again.")
          }
        />
      </div>
    );
  }

  // ── Profile ────────────────────────────────────────────────────────────────
  const user = profile.staff_profile.user;
  const fullName = personName(user);

  return (
    <div className="pb-10">
      {backLink}

      {/* Header card: banner, photo, name and the badges that say where the
          person stands. The photo overlaps the banner. */}
      <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="h-20 sm:h-24 bg-linear-to-r from-violet-500 to-indigo-500" />

        <div className="px-5 pb-5">
          <div className="-mt-12 sm:-mt-14 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <ProfilePhoto
              firstName={user.first_name}
              lastName={user.last_name}
            />
            <div className="flex flex-wrap items-center gap-2">
              <StaffStatusBadge status={profile.status} />
              {profile.is_super_admin && (
                <span className="px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 text-[10px] font-semibold">
                  Super Admin
                </span>
              )}
            </div>
          </div>

          <h1 className="mt-3 text-lg font-bold text-slate-800 wrap-break-word">
            {fullName}
          </h1>
          <p className="text-xs text-slate-400">
            {[user.public_id, profile.school.name].filter(Boolean).join(" · ")}
          </p>

          {profile.roles.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Roles">
              {profile.roles.map((role) => (
                <li
                  key={role.id}
                  className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-700"
                >
                  {role.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ProfileSection title="Contact">
          <dl className="divide-y divide-slate-50">
            <DetailRow label="Email">
              <span className="flex flex-wrap items-center gap-2">
                {user.email}
                <VerifiedBadge verified={user.email_is_valid} />
              </span>
            </DetailRow>
            <DetailRow label="Phone">
              <span className="flex flex-wrap items-center gap-2">
                {user.phone}
                <VerifiedBadge verified={user.phone_is_valid} />
              </span>
            </DetailRow>
            <DetailRow label="Gender">
              {{ M: "Male", F: "Female", O: "Other", NOTA: "" }[user.gender]}
            </DetailRow>
          </dl>
        </ProfileSection>

        <ProfileSection
          title="At this school"
          description={profile.school.name}
        >
          <dl className="divide-y divide-slate-50">
            <DetailRow label="Status">
              <StaffStatusBadge status={profile.status} />
            </DetailRow>
            <DetailRow label="Employment">
              {employmentLabel(profile.employment)}
            </DetailRow>
            <DetailRow label="Staff type">
              {profile.academic ? "Academic" : "Non-academic"}
            </DetailRow>
            <DetailRow label="Added on">
              {formatProfileDate(profile.created_on)}
            </DetailRow>
            <DetailRow label="Default login school">
              {profile.active_login ? "Yes" : "No"}
            </DetailRow>
            <DetailRow label="Invitation">
              {profile.invite_state
                ? INVITE_LABELS[profile.invite_state]
                : "Accepted"}
            </DetailRow>
          </dl>
        </ProfileSection>
      </div>

      <div className="mt-4">
        <ProfileSection title="Addresses">
          <dl className="divide-y divide-slate-50">
            <DetailRow label="Residential">
              {joinAddress([
                user.r_address,
                user.r_city,
                user.r_district,
                user.r_state,
                user.r_country,
              ])}
            </DetailRow>
            <DetailRow label="Office">
              {joinAddress([
                user.o_address,
                user.o_city,
                user.o_district,
                user.o_state,
                user.o_country,
              ])}
            </DetailRow>
          </dl>
        </ProfileSection>
      </div>
    </div>
  );
}
