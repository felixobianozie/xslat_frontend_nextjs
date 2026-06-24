import { AccessClaims } from "@/types/auth";
import "next-auth";
import "next-auth/jwt";

// ─────────────────────────────────────────────────────────────────────────────
// NextAuth Module Augmentation
// ─────────────────────────────────────────────────────────────────────────────

declare module "next-auth" {
  interface Session {
    // The decoded JWT claims — primary source of user identity and authorization.
    // Prefer reading from accessClaims over accessToken wherever possible.
    accessClaims?: AccessClaims;

    // The raw access token string — passed as Bearer token in API requests.
    // Managed by useClientAuthFetch and serverAuthFetch; rarely needed directly.
    accessToken?: string;

    // Set to "RefreshAccessTokenError" when token rotation fails.
    // Signals useClientAuthFetch / serverAuthFetch to sign the user out.
    error?: "RefreshAccessTokenError";
  }

  interface User {
    // Returned by CredentialsProvider.authorize() after a successful login.
    // These are your backend's tokens, not NextAuth's internal session tokens.
    accessToken?: string;
    refreshToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    // Your backend's tokens, stored inside NextAuth's encrypted JWT cookie.
    accessToken?: string;
    refreshToken?: string;

    // Expiry of the backend access token in milliseconds (decoded from JWT exp * 1000).
    // Used by the jwt callback in authOptions to decide when to call rotateAccessToken().
    accessTokenExpires?: number;

    // Decoded claims from the access token — attached on login and carried
    // through the session callback to Session.accessClaims.
    accessClaims?: AccessClaims;

    // Mirrors Session.error — propagated from the jwt callback to the session callback.
    error?: "RefreshAccessTokenError";
  }
}
