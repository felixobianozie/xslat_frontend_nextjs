/**
 * Global fetch utility for PUBLIC endpoints (no authentication required).
 *
 * Handles JSON serialization, base URL resolution, and error normalization.
 * Use this for endpoints like signup, login, email/phone validation, etc.
 *
 * Response handling:
 *   - By default (`responseType: "json"`) the response is normalized by
 *     `handleFetchErrors` into { data } / { error }.
 *   - With `responseType: "blob"` a SUCCESSFUL response is returned as a raw
 *     Blob under `data`, for binary downloads such as a PDF. This skips
 *     `handleFetchErrors` on success only, because that helper reads the body as
 *     JSON, which would fail on binary data and consume the stream. Failures
 *     still go through `handleFetchErrors`, so error shapes are identical to
 *     JSON requests.
 *
 * Calling this app's own routes: pass `baseURL: ""` so the path is not appended
 * to the backend URL, for example publicFetch("/api/pdf", { baseURL: "" }).
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
  // How to read a SUCCESSFUL response. "json" (default) normalizes the
  // envelope; "blob" returns raw bytes for downloads (for example a PDF).
  responseType?: "json" | "blob";
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

  const responseType = options.responseType ?? "json";

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

  // Turns a received Response into our normalized ApiResponse. A successful blob
  // request returns the raw Blob and skips handleFetchErrors (which reads the
  // body as JSON). Every error, whatever the responseType, still flows through
  // handleFetchErrors so error shapes stay identical across the app.
  async function readResponse(res: Response): Promise<ApiResponse<T>> {
    if (responseType === "blob" && res.ok) {
      return { data: (await res.blob()) as unknown as T };
    }
    return handleFetchErrors<T>(res);
  }

  try {
    const response = await fetch(url, requestConfig);
    return readResponse(response);
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
