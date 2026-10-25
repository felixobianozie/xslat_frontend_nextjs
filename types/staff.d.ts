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

// Where a staff member's admin-sent invitation stands. null once the person has
// accepted it, and for staff who signed themselves up.
//   pending  — a valid code is waiting to be used
//   expired  — the code ran out (invitations last 24 hours)
//   locked   — too many wrong codes were entered
//   revoked  — an administrator cancelled it
type InviteState = "pending" | "expired" | "locked" | "revoked";

// Where a staff member stands at the school.
//   active, inactive      — still part of the school (the CURRENT staff).
//                           inactive means suspended. Only active staff can
//                           act in the system or be assigned as teachers.
//   resigned, retired,
//   terminated, transferred — have left the school (the DEPARTED staff).
// Current and departed staff together are the school's historic staff.
type StaffStatus =
  | "active"
  | "inactive"
  | "resigned"
  | "retired"
  | "terminated"
  | "transferred";

// A staff portfolio — the primary record returned by GET staff/portfolios/list/
// Mirrors StaffPortfolioSerializer with the list-view field set.
interface StaffPortfolio {
  id: string;
  status: StaffStatus;
  academic: boolean;
  // Employment types from the backend model choices:
  // NON=No employment type, FT=Full-time, PT=Part-time, TP=Temporary, NYSC
  employment: "NON" | "FT" | "PT" | "TP" | "NYSC";
  deleted: boolean;
  is_super_admin: boolean;
  created_on: string; // ISO date string
  invite_state: InviteState | null;
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
// Sent to POST staff/create/. The backend emails the person an invitation, so
// no password is sent.
interface CreateStaffInput {
  first_name: string;
  last_name: string;
  middle_name: string;
  email: string;
  phone: string;
  gender: "M" | "F" | "";
  school_id: string;
}
