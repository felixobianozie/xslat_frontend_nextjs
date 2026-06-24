import { jwtDecode } from "jwt-decode";
import publicFetch from "@/lib/Publicfetch";

/**
 * Requests a new access token from the backend using the stored refresh token.
 *
 * Called automatically by NextAuth when the access token has expired —
 * either on the server (via the jwt callback) or on the client
 * (via useSession().update()).
 *
 * Throws on failure so the NextAuth jwt callback can catch it and set
 * error: "RefreshAccessTokenError" on the session, which downstream
 * utilities (useClientAuthFetch, serverAuthFetch) use to trigger sign-out.
 *
 * TODO: when adding Google OAuth, this function only applies to credentials-based
 * sessions. OAuth providers manage their own token rotation separately.
 * Guard the call in authOptions.ts jwt callback with a provider check before
 * calling this, e.g:
 *
 *   // if (token.provider === "google") { handle Google refresh here }
 *   // rotateAccessToken() is only for credentials sessions
 *
 * @param token - The current NextAuth JWT token object (contains refreshToken)
 * @returns     The updated token with a new accessToken and accessTokenExpires
 * @throws      If the refresh request fails or the response cannot be decoded
 */
async function rotateAccessToken(token: any) {
  // Pass body as a plain object — publicFetch handles JSON.stringify internally
  const { data, error } = await publicFetch("token/refresh/", {
    method: "POST",
    body: { refresh: token.refreshToken },
  });

  // If the refresh request itself failed (e.g. refresh token expired or revoked),
  // throw so the jwt callback can mark the session with RefreshAccessTokenError
  if (error || !data?.access) {
    console.error("Token refresh failed within rotateAccessToken()", error);
    throw new Error("RefreshAccessTokenError");
  }

  // Decode the new access token to extract its expiry timestamp
  const decoded: any = jwtDecode(data.access);

  return {
    ...token,
    accessToken: data.access,
    // exp is in seconds — convert to milliseconds for Date.now() comparisons
    accessTokenExpires: decoded.exp * 1000,
  };
}

export default rotateAccessToken;
