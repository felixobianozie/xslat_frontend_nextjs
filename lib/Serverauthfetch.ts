import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/Authoptions";
import authFetch from "@/lib/Authfetch";
import forceLogout from "@/lib/Forcelogout";
import type { ApiResponse } from "@/lib/Handlefetcherrors";

/**
 * Server-side authenticated fetch utility for Server Components and Route Handlers.
 *
 * Reads the current session on the server, attaches the access token to the request,
 * and redirects to /login if the session is missing or unrecoverable.
 *
 * Server Components cannot update the session the way the client can — NextAuth's
 * update() is a client-only mechanism. So if a token is expired at the server level,
 * there is nothing to retry with; we force a re-authentication instead.
 *
 * Usage:
 *   const { data, error } = await serverAuthFetch("users/me/");
 *   if (error) throw new Error("Failed to load user");
 */
export async function serverAuthFetch<T = any>(
  endpoint: string,
  options: {
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    headers?: Record<string, string>;
    body?: Record<string, any> | null;
  } = {},
): Promise<ApiResponse<T>> {
  const session: any = await getServerSession(authOptions);

  // No session at all — user is not logged in
  if (!session?.accessToken) {
    forceLogout();
  }

  // Session exists but the refresh token also failed — unrecoverable
  if (session?.error === "RefreshAccessTokenError") {
    forceLogout();
  }

  return authFetch<T>(endpoint, {
    accessToken: session.accessToken,

    // Server Components cannot use NextAuth's update() to refresh the session.
    // If the token is found to be expired during the request (401 response),
    // the only safe action is to force re-authentication.
    refreshSession: async () => {
      forceLogout();
    },

    onAuthFailure: async () => {
      forceLogout();
    },

    options,
  });
}
