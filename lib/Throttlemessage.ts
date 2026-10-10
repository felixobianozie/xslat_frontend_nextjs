// ─────────────────────────────────────────────────────────────────────────────
// Throttlemessage.ts
//
// Turns a "too many requests" error (HTTP 429) into a friendly sentence.
//
// When a limit is passed, the backend's reply reads like:
//   "Request was throttled. Expected available in 2144 seconds."
// That is accurate but not pleasant to read. This helper reads the number of
// seconds and says how long to wait in minutes or hours instead, for example:
//   "Too many sign-up attempts. Please wait about 36 minutes and try again."
//
// It only recognises throttle errors. For any other error it returns null, so
// the caller keeps showing the normal message.
// ─────────────────────────────────────────────────────────────────────────────

interface ThrottleError {
  status?: number;
  message?: string;
}

/**
 * @param error  The error returned by the fetch utilities.
 * @param action What was being attempted, for the sentence, e.g. "sign-up attempts".
 * @returns      A friendly message, or null when the error is not a throttle error.
 */
export function friendlyThrottleMessage(
  error: ThrottleError | null | undefined,
  action: string,
): string | null {
  if (!error || error.status !== 429) return null;

  const match = error.message?.match(/(\d+)\s*seconds?/i);
  if (!match) {
    return `Too many ${action}. Please wait a little while and try again.`;
  }

  const minutes = Math.max(1, Math.ceil(Number(match[1]) / 60));
  const wait =
    minutes < 60
      ? `${minutes} minute${minutes === 1 ? "" : "s"}`
      : `${Math.ceil(minutes / 60)} hour${Math.ceil(minutes / 60) === 1 ? "" : "s"}`;

  return `Too many ${action}. Please wait about ${wait} and try again.`;
}
