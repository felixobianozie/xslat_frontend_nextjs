// ─────────────────────────────────────────────────────────────────────────────
// staff.d.ts
//
// Global type declarations for the Staff Management feature.
// These mirror the shapes returned by the backend serializers:
//
//   StaffPortfolio (via StaffPortfolioSerializer)
//   StaffProfReq   (via StaffProfReqSerializer)
//
// Source of truth: backend serializers.py / views.py
// ─────────────────────────────────────────────────────────────────────────────

// The user object nested inside StaffProfile.
// Mirrors CustomUserSerializer fields requested in the list view.
interface StaffUser {
  id: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  public_id: string;
  email: string;
  phone: string;
  email_is_valid: boolean;
  phone_is_valid: boolean;
  gender: string;
}

// A staff member's profile (thin wrapper around the user).
// Mirrors StaffProfileSerializer with include_staffprofile_fields: ("id", "user")
interface StaffProfile {
  id: string;
  user: StaffUser;
}

// A school object as nested in portfolio/request responses.
interface StaffSchool {
  id: string;
  name: string;
}

// A staff portfolio — the primary record returned by GET staff/portfolios/
// Mirrors StaffPortfolioSerializer with the list-view field set.
interface StaffPortfolio {
  id: string;
  status: "active" | "inactive";
  academic: boolean;
  // Employment types from the backend model choices:
  // NON=No employment type, FT=Full-time, PT=Part-time, TP=Temporary, NYSC
  employment: "NON" | "FT" | "PT" | "TP" | "NYSC";
  deleted: boolean;
  staff_profile: StaffProfile;
  school: StaffSchool;
}

// A staff profile request — returned by GET staff/requests/list/
// Mirrors StaffProfReqSerializer with the list-view field set.
interface StaffProfReq {
  id: string;
  status: "pending" | "approved" | "declined" | "blacklisted";
  refresh_count: number;
  created_on: string; // ISO date string
  school: StaffSchool;
  // The requesting user (nested CustomUser)
  user: {
    id: string;
    first_name: string;
    last_name: string;
    middle_name: string;
    gender: string;
    email: string;
    phone: string;
  };
}

// Form input shape for creating a new staff member.
// Sent to POST users/list/ (CustomUserSerializer create path).
interface CreateStaffInput {
  first_name: string;
  last_name: string;
  middle_name: string;
  email: string;
  phone: string;
  gender: "M" | "F" | "";
  joined_as: "staff";
  school_id: string;
}
