// ─────────────────────────────────────────────────────────────────────────────
// Access Token Claims
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The decoded payload of the JWT access token issued by your backend.
 *
 * These claims are set by CustomJWTSerializer.get_token() and reflect the
 * user's identity and their resolved authentication scope (user type, school,
 * roles, and permissions) at the time of login.
 *
 * auth_school is null for general logins (no school context).
 * roles and permissions are empty arrays for general logins with no
 * Django-level groups or permissions assigned.
 */
export interface AccessClaims {
  // Standard JWT metadata
  token_type: string;
  exp: number; // Expiry timestamp in seconds (multiply by 1000 for Date.now())
  iat: number; // Issued-at timestamp in seconds
  jti: string; // Unique token identifier

  // User identity
  user_id: string; // UUID string of the CustomUser
  first_name: string;
  last_name: string;
  email: string;
  is_superuser: boolean;

  // Authentication scope — resolved by CustomJWTSerializer._resolve_portfolio()
  auth_user_type: "general" | "student" | "staff" | "guardian" | "alumni";
  auth_school: string | null; // UUID string of the school, or null for general logins

  // Portfolio-derived authorization
  roles: string[]; // Clean role names e.g. ["SchoolAdmin", "Teacher"]
  permissions: string[]; // Permission codenames e.g. ["school_manage"]
}

// export interface AuthUser {
//   id: string;
//   name: string;
//   email: string;
//   role: string;
// }
