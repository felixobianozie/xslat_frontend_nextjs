/**
 * Global fetch utility for PUBLIC endpoints (no authentication required).
 *
 * Handles JSON serialization, base URL resolution, and error normalization.
 * Use this for endpoints like signup, login, email/phone validation, etc.
 *
 * @param endpoint - A path relative to baseURL (e.g. "auth/login/") or a full URL
 * @param options  - Optional overrides for method, headers, body, and baseURL
 * @returns        { data } on success or { error } on failure — never throws
 */

import { handleFetchErrors, type ApiResponse } from "@/lib/Handlefetcherrors";

// Options accepted by publicFetch — kept separate from RequestInit
// so we can type `body` as a plain object and handle serialization internally
type FetchOptions = {
  baseURL?: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  headers?: Record<string, string>;
  body?: Record<string, any> | null; // Plain objects only; serialized to JSON internally
  signal?: AbortSignal; // Optional abort signal for timeout / cancellation
};

// These defaults apply to every request unless explicitly overridden
const DEFAULT_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_BACKEND_BASE_URL,
  method: "GET" as const,
  headers: {
    "Content-Type": "application/json",
  },
};

async function publicFetch<T = any>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<ApiResponse<T>> {
  // Use the caller's baseURL if provided, otherwise fall back to the default
  const baseURL = options.baseURL ?? DEFAULT_CONFIG.baseURL;

  // If the endpoint is already a full URL (e.g. an external service), use it as-is
  const url = endpoint.startsWith("http") ? endpoint : `${baseURL}${endpoint}`;

  // Build the final RequestInit object, merging defaults with caller overrides.
  // Body is serialized to JSON here so callers can always pass plain objects.
  const requestConfig: RequestInit = {
    method: options.method ?? DEFAULT_CONFIG.method,
    headers: {
      ...DEFAULT_CONFIG.headers,
      ...options.headers,
    },
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
    ...(options.signal ? { signal: options.signal } : {}),
  };

  try {
    const response = await fetch(url, requestConfig);
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

export default publicFetch;
