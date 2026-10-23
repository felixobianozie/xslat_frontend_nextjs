import type { ApiError } from "@/lib/Handlefetcherrors";

/**
 * Returns the text to show a person for a failed API request.
 *
 * For a validation failure the backend sends the generic message "Something
 * went wrong." and puts the specific messages in `error.data`, keyed by the
 * field or entry that failed. This returns those messages, joined by a
 * space, and never the keys, which are request details such as
 * "teachers_remarks[0]". Any other failure returns `error.message`.
 */
export function apiErrorText(error: ApiError): string {
  const messages: string[] = [];

  for (const value of Object.values(error.data ?? {})) {
    for (const message of value) {
      // A nested error object that the fetch layer could only stringify.
      if (message.trim() && message !== "[object Object]") {
        messages.push(message);
      }
    }
  }

  return messages.length > 0 ? [...new Set(messages)].join(" ") : error.message;
}
