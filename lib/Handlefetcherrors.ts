/**
 * Handles Fetch API response errors in a consistent, reusable way.
 *
 * Not all errors come from our own views — some come from DRF internals or
 * SimpleJWT, and they return different shapes. This handler detects each shape,
 * normalizes everything into a single display-ready `message` string, and
 * preserves a clean `data` object for consumers that need field-level detail.
 *
 * Shapes handled:
 *
 *   Shape 1 — Our views, simple error:
 *     { "message": "Unauthorized." }
 *
 *   Shape 2 — Our views, validation error with nested data:
 *     { "message": "Something went wrong.", "data": { "email": ["..."] } }
 *
 *   Shape 3 — DRF serializer / SimpleJWT, bare field errors (no message key):
 *     { "password": ["This field is required."] }
 *
 *   Shape 4 — Mixed: message + bare field errors at root level:
 *     { "message": "Something went wrong.", "email": ["This field is required."] }
 *
 *   Shape 5 — SimpleJWT auth/token failure (detail string):
 *     { "detail": "No active account found with the given credentials." }
 *
 *   Shape 6 — SimpleJWT token validation failure (detail + messages array):
 *     { "detail": "Given token not valid...", "code": "token_not_valid", "messages": [...] }
 *
 *   Shape 7 — Non-JSON or empty body (proxy errors, server crashes):
 *     (empty string or HTML)
 *
 * @param response - The raw Fetch API Response object
 * @returns { data } on success, or { error } on failure
 */

// The shape of every successful or failed response from the backend
export type ApiResponse<T = any> = {
  data?: T;
  error?: ApiError;
};

// Normalized error shape — consumers can always rely on these fields.
// `message` is always a single, display-ready string.
// `data` holds only field-keyed errors, normalized from whatever shape the
// backend returned. Use it for inline form validation; display `message` for everything else.
export type ApiError = {
  name: "FetchError" | "NetworkError";
  status?: number;
  message: string;
  data?: Record<string, string[]> | null;
};

// Reserved keys that are never treated as field-level errors.
// These are top-level metadata keys used by our views, DRF, and SimpleJWT.
const RESERVED_KEYS = new Set([
  "message",
  "data",
  "detail",
  "code",
  "messages",
]);

// Maps HTTP status codes to human-readable fallback messages.
// Used only when no message can be extracted from the response body.
const HTTP_ERROR_MESSAGES: Record<number, string> = {
  400: "Bad request.",
  401: "Unauthorized.",
  403: "Forbidden.",
  404: "Resource not found.",
  408: "Request timeout.",
  409: "Conflict.",
  422: "Unprocessable entity.",
  429: "Too many requests.",
  500: "Internal server error.",
  502: "Bad gateway.",
  503: "Service unavailable.",
  504: "Gateway timeout.",
};

/**
 * Normalizes a field-error map into a consistent Record<string, string[]>.
 *
 * Each value is coerced to a string array regardless of whether the backend
 * sent an array of strings or a plain string.
 *
 * Example input:  { "email": ["Required."], "phone": "Invalid format." }
 * Example output: { "email": ["Required."], "phone": ["Invalid format."] }
 */
function normalizeFieldErrors(
  fields: Record<string, any>,
): Record<string, string[]> {
  const result: Record<string, string[]> = {};

  for (const [field, value] of Object.entries(fields)) {
    if (Array.isArray(value)) {
      // Coerce each item to a string in case DRF returned non-string values
      result[field] = value.map(String);
    } else if (typeof value === "string") {
      result[field] = [value];
    } else if (value !== null && value !== undefined) {
      // Nested objects (e.g. deeply nested serializer errors) — stringify as fallback
      result[field] = [String(value)];
    }
  }

  return result;
}

/**
 * Extracts the top-level display message from a response body.
 *
 * Priority order:
 *   1. body.message     — our own views
 *   2. body.detail      — SimpleJWT / DRF internals
 *   3. fallback         — HTTP status string
 */
function resolveTopLevelMessage(body: any, fallback: string): string {
  if (typeof body?.message === "string" && body.message.trim()) {
    return body.message;
  }
  if (typeof body?.detail === "string" && body.detail.trim()) {
    return body.detail;
  }
  return fallback;
}

/**
 * Extracts all field-level errors from the body, regardless of where they appear.
 *
 * Checks two locations and merges them:
 *   1. body.data   — our views nest field errors here (Shape 2)
 *   2. Root-level keys that are not reserved — bare DRF/JWT errors (Shapes 3, 4)
 *
 * Returns null if no field errors are found.
 */
function extractFieldErrors(body: any): Record<string, string[]> | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;

  const collected: Record<string, any> = {};

  // Shape 2: field errors nested under body.data
  if (body.data && typeof body.data === "object" && !Array.isArray(body.data)) {
    Object.assign(collected, body.data);
  }

  // Shapes 3 & 4: field errors at the root level, excluding reserved keys
  for (const [key, value] of Object.entries(body)) {
    if (!RESERVED_KEYS.has(key)) {
      collected[key] = value;
    }
  }

  if (Object.keys(collected).length === 0) return null;

  return normalizeFieldErrors(collected);
}

/**
 * Builds a single display-ready message by appending field errors to the
 * top-level message. This way the consumer can always render one string
 * without needing to inspect the `data` object.
 *
 * Example output:
 *   "Something went wrong. Email: This field is required. Password: This field may not be blank."
 */
function buildDisplayMessage(
  topLevelMessage: string,
  fieldErrors: Record<string, string[]> | null,
): string {
  if (!fieldErrors || Object.keys(fieldErrors).length === 0) {
    return topLevelMessage;
  }

  const fieldMessages = Object.entries(fieldErrors)
    .map(([field, errors]) => {
      // Capitalize the field name for readability (e.g. "non_field_errors" → "Non_field_errors")
      const label = field.charAt(0).toUpperCase() + field.slice(1);
      return `${label}: ${errors.join(" ")}`;
    })
    .join(" ");

  return `${topLevelMessage} ${fieldMessages}`;
}

export async function handleFetchErrors<T = any>(
  response: Response,
): Promise<ApiResponse<T>> {
  // Always attempt to parse JSON. If parsing fails (empty body, HTML error
  // page from a proxy, etc.), body stays null and we fall back gracefully.
  let body: any = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  // Success: return the full parsed body
  if (response.ok) {
    return { data: body };
  }

  // HTTP status fallback — used when no message can be found in the body
  const fallback =
    HTTP_ERROR_MESSAGES[response.status] ?? "An unexpected error occurred.";

  const topLevelMessage = resolveTopLevelMessage(body, fallback);
  const fieldErrors = extractFieldErrors(body);
  const message = buildDisplayMessage(topLevelMessage, fieldErrors);

  return {
    error: {
      name: "FetchError",
      status: response.status,
      message, // Flattened, display-ready string — render this directly in the UI
      data: fieldErrors, // Normalized field errors — use for per-field inline validation
    },
  };
}
