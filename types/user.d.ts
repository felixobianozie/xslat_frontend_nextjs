// ─────────────────────────────────────────────────────────────────────────────
// user.d.ts
//
// Global type declarations for the two profile pages. They mirror what the
// backend returns:
//
//   UserMe              GET users/me/                      (a person's own profile)
//   StaffProfileDetails GET staff/portfolios/profile/      (a staff member at one school)
//
// Source of truth: backend users/views.py (USER_PROFILE_FIELDS and the
// StaffPortfolioProfileView field set).
// ─────────────────────────────────────────────────────────────────────────────

// Not specified, male, female, other.
type ProfileGender = "NOTA" | "M" | "F" | "O";

// A role, with its name cleaned of the school prefix.
interface ProfileRole {
  id: number;
  name: string;
}

interface ProfileSchool {
  id: string;
  name: string;
}

// One school a person holds a staff portfolio in, as listed on their own
// profile. `id` is the portfolio id; with `school.id` it opens the staff
// profile for that portfolio.
interface UserPortfolioSummary {
  id: string;
  status: StaffStatus;
  academic: boolean;
  employment: StaffPortfolio["employment"];
  is_super_admin: boolean;
  // True for the school the person lands in when they sign in.
  active_login: boolean;
  roles: ProfileRole[];
  created_on: string;
  school: ProfileSchool;
}

// The addresses, residential then office.
interface ProfileAddresses {
  r_address: string;
  r_city: string;
  r_district: string;
  r_state: string;
  r_country: string;
  o_address: string;
  o_city: string;
  o_district: string;
  o_state: string;
  o_country: string;
}

// The signed-in person's own profile.
interface UserMe extends ProfileAddresses {
  id: string;
  public_id: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  gender: ProfileGender;
  email: string;
  phone: string;
  email_is_valid: boolean;
  phone_is_valid: boolean;
  joined_as: string;
  signup_type: string;
  default_user_type: string;
  date_joined: string;
  last_login: string | null;
  created_on: string;
  portfolios: UserPortfolioSummary[];
}

// The person inside a staff profile.
interface StaffProfileUser extends ProfileAddresses {
  id: string;
  public_id: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  gender: ProfileGender;
  email: string;
  phone: string;
  email_is_valid: boolean;
  phone_is_valid: boolean;
}

// A staff member's profile at one school.
interface StaffProfileDetails {
  id: string;
  status: StaffStatus;
  academic: boolean;
  employment: StaffPortfolio["employment"];
  is_super_admin: boolean;
  active_login: boolean;
  invite_state: InviteState | null;
  roles: ProfileRole[];
  created_on: string;
  school: ProfileSchool;
  staff_profile: {
    id: string;
    user: StaffProfileUser;
  };
}
