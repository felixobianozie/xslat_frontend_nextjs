/**
 * Global fetch utility for PROTECTED endpoints (authentication required).
 *
 * Attaches a Bearer token to every request. If the server returns 401
 * (token expired/invalid), it attempts to refresh the session once via
 * `refreshSession`, then retries the original request with the new token.
 * If the refresh itself fails, `onAuthFailure` is called (e.g. to sign the user out).
 *
 * @param endpoint - A path relative to baseURL (e.g. "users/me/") or a full URL
 * @param config   - Access token, optional refresh callbacks, request options, etc.
 * @returns        { data } on success or { error } on failure — never throws
 */

import { handleFetchErrors, type ApiResponse } from "@/lib/Handlefetcherrors";

type FetchAuthConfig = {
  accessToken: string;

  // Optional: called to request a new session (e.g. NextAuth's `update()`)
  refreshSession?: () => Promise<any>;

  // Optional: called when refresh fails — use to sign the user out
  onAuthFailure?: () => Promise<void>;

  // Optional: override the default base URL
  baseURL?: string;

  // Standard fetch options (method, headers, body, etc.)
  options?: {
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    headers?: Record<string, string>;
    body?: Record<string, any> | null;
    signal?: AbortSignal; // Optional abort signal for timeout / cancellation
  };
};

const DEFAULT_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_BACKEND_BASE_URL,
  method: "GET" as const,
  headers: {
    "Content-Type": "application/json",
  },
};

async function authFetch<T = any>(
  endpoint: string,
  {
    accessToken,
    refreshSession,
    onAuthFailure,
    baseURL,
    options = {},
  }: FetchAuthConfig,
): Promise<ApiResponse<T>> {
  const urlBase = baseURL ?? DEFAULT_CONFIG.baseURL;
  const url = endpoint.startsWith("http") ? endpoint : `${urlBase}${endpoint}`;

  // Helper: builds a RequestInit from the given token and options.
  // Defined as an inner function so we can call it again with a refreshed token
  // without duplicating the config assembly logic.
  function buildRequestConfig(token: string): RequestInit {
    return {
      method: options.method ?? DEFAULT_CONFIG.method,
      headers: {
        ...DEFAULT_CONFIG.headers,
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
      ...(options.body ? { body: JSON.stringify(options.body) } : {}),
      ...(options.signal ? { signal: options.signal } : {}),
    };
  }

  try {
    const response = await fetch(url, buildRequestConfig(accessToken));

    // Handle token expiry: attempt a session refresh and retry once
    if (response.status === 401 && refreshSession) {
      console.warn(
        "Access token may be expired. Attempting session refresh...",
      );

      const newSession = await refreshSession();

      // If the refresh itself failed (e.g. refresh token is also expired),
      // sign the user out and return the original 401 error
      if (newSession?.error === "RefreshAccessTokenError") {
        console.error("Session refresh failed. Signing user out...");

        if (onAuthFailure) {
          await onAuthFailure();
        }

        // Return the error from the original failed response
        return handleFetchErrors<T>(response);
      }

      // Refresh succeeded — retry the request with the new token.
      // We rebuild the config here to ensure the Authorization header
      // carries the updated token (not the expired one).
      const retryResponse = await fetch(
        url,
        buildRequestConfig(newSession.accessToken),
      );
      return handleFetchErrors<T>(retryResponse);
    }

    // Token was valid — process the response normally
    return handleFetchErrors<T>(response);
  } catch (error: any) {
    // This catch block only handles network-level failures (no connection, DNS failure, abort)
    // HTTP errors (4xx, 5xx) are handled inside handleFetchErrors above
    return {
      error: {
        name: "NetworkError",
        message:
          error?.name === "AbortError"
            ? "The server took too long to respond. Please try again."
            : "Unable to reach the server. Please check your internet connection.",
      },
    };
  }
}

export default authFetch;
