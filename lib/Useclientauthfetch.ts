"use client";

import { useSession, signOut } from "next-auth/react";
import authFetch from "@/lib/Authfetch";
import type { ApiResponse } from "@/lib/Handlefetcherrors";

/**
 * Client-side hook for making authenticated API requests from Client Components.
 *
 * Wraps authFetch with the current session's access token and wires up
 * NextAuth's session update() as the refresh mechanism. If the refresh token
 * is also expired or invalid, it signs the user out and redirects to /login.
 *
 * Usage:
 *   const { clientAuthFetch } = useClientAuthFetch();
 *   const { data, error } = await clientAuthFetch("users/me/");
 */
export function useClientAuthFetch() {
  const { data: session, update } = useSession();

  async function clientAuthFetch<T = any>(
    url: string,
    options: {
      method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
      headers?: Record<string, string>;
      body?: Record<string, any> | null;
      signal?: AbortSignal; // Optional abort signal for timeout / cancellation
    } = {},
  ): Promise<ApiResponse<T>> {
    return authFetch<T>(url, {
      // session.accessToken may be undefined if the session hasn't loaded yet.
      // authFetch will send an empty Bearer header in that case, which
      // the backend will correctly reject with a 401 and trigger a refresh attempt.
      accessToken: session?.accessToken ?? "",

      // update() triggers the NextAuth jwt callback with trigger === "update",
      // which calls rotateAccessToken() and returns the updated session
      refreshSession: update,

      onAuthFailure: async () => {
        // Refresh failed — session is unrecoverable, sign the user out
        await signOut({ callbackUrl: "/login" });
      },

      options,
    });
  }

  return { clientAuthFetch };
}
