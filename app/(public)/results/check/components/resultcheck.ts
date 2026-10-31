// ──────────────────────────────────────────
// resultcheck.ts
//
// What the public result check needs apart from drawing the sheet:
//
//   - the shapes of its two backend calls (the published-terms list, and the
//     check itself),
//   - turning the check's response into the StudentResultResponse a sheet draws,
//   - choosing the session and term the form starts on,
//   - wording the errors the check can return.
//
// All of it is plain functions, so it can be tested without a browser. It is
// used by this route only.
// ──────────────────────────────────────────

import type { ApiError } from "@/lib/Handlefetcherrors";
import type {
  ResultContextResponse,
  StudentResultData,
  StudentResultResponse,
  SubjectAssessmentResult,
  TeacherRef,
} from "@/result-sheet";

// The envelope every API call in this codebase uses.
export interface ApiEnvelope<T> {
  message: string;
  data: T;
}

// ── GET student/result/terms/ ────────────────────────────────────────────
// The published terms of a school, grouped by session. Sessions are newest
// first; the terms inside a session are in the order they were created.

export interface PublishedTerm {
  id: string;
  name: string;
  abbr: string;
}

export interface PublishedTermsSession {
  id: string;
  name: string;
  terms: PublishedTerm[];
}

export interface PublishedTermsResponse {
  sessions: PublishedTermsSession[];
}

// ── POST student/result/check/ ───────────────────────────────────────────
// The visitor names the student and the term. The class is not sent: the
// backend works it out from the student's enrollment in that term.

export interface CheckStudentResultPayload {
  pin: string;
  student_public_id: string;
  term_id: string;
  ranking?: "ordinal" | "competition" | "dense";
}

// What the check returns: one student's result, with everything the sheet needs
// around it under `context`.
export type CheckStudentResultResponse = StudentResultData & {
  context: ResultContextResponse;
};

// Spread the context out and give each subject row its teachers, which is the
// object a sheet draws. A subject with no teacher in the context gets an empty
// list, and the sheet prints a dash in the Teacher ID column.
export function toStudentResult(
  check: CheckStudentResultResponse,
): StudentResultResponse {
  const { context, ...result } = check;
  if (!context) {
    throw new Error("The server returned an incomplete result.");
  }

  const teachersBySubjectId: Record<string, TeacherRef[]> = {};
  for (const contextSubject of context.subjects) {
    teachersBySubjectId[contextSubject.subject.id] = contextSubject.teachers;
  }

  // Rebuilt in the same order, so display_order-based sorts keep working.
  const subjects: Record<string, SubjectAssessmentResult> = {};
  for (const [key, subject] of Object.entries(result.subjects)) {
    subjects[key] = {
      ...subject,
      teachers: teachersBySubjectId[subject.subject_id] ?? [],
    };
  }

  return {
    ...result,
    subjects,
    arm: context.arm,
    level: context.level,
    section: context.section,
    term: context.term,
    session: context.session,
    school: context.school,
  };
}

// ── The session and term the form starts on ──────────────────────────────

// The latest term of a session: the last in the list, since terms come in the
// order they were created.
export function latestTermOf(
  session: PublishedTermsSession | undefined,
): PublishedTerm | undefined {
  return session?.terms[session.terms.length - 1];
}

// The newest session that has a term, and its latest term. Null when nothing is
// published.
export function pickDefaultTerm(
  sessions: PublishedTermsSession[],
): { sessionId: string; termId: string } | null {
  const session = sessions.find((s) => s.terms.length > 0);
  const term = latestTermOf(session);
  return session && term ? { sessionId: session.id, termId: term.id } : null;
}

// ── Errors ───────────────────────────────────────────────────────────────

export type CheckErrorKind =
  | "previous_results_pending" // 403: the school wants earlier results viewed first
  | "ambiguous_result" // 409: more than one result could be meant
  | "throttled" // 429: too many attempts
  | "not_found" // 400: no result for these details
  | "other";

// A failed check, with what kind it was so the page can show it properly.
export class CheckResultError extends Error {
  kind: CheckErrorKind;
  status?: number;

  constructor(kind: CheckErrorKind, message: string, status?: number) {
    super(message);
    this.kind = kind;
    this.status = status;
  }
}

const NOT_FOUND_MESSAGE = "No result was found for the details provided.";

// The backend's throttle reply reads "Request was throttled. Expected available
// in 57 seconds." This turns it into something a visitor can act on.
export function throttleMessage(message: string): string {
  const seconds = /(\d+)\s*seconds?/i.exec(message)?.[1];
  if (!seconds) return "Too many attempts. Please wait a minute and try again.";
  return `Too many attempts. Please wait ${seconds} second${seconds === "1" ? "" : "s"} and try again.`;
}

// Sorts a failed check by its HTTP status. The shared fetch helper drops the
// body's `code`, so the status is what tells the cases apart; on this endpoint
// 403 and 409 each have exactly one meaning.
export function describeCheckError(
  error: Pick<ApiError, "status" | "message">,
): CheckResultError {
  const { status, message } = error;

  // The school requires earlier results to be viewed first. The message already
  // lists the terms, one to a line.
  if (status === 403) {
    return new CheckResultError("previous_results_pending", message, status);
  }
  // More than one result could be this student's for the term; the school has
  // to sort it out.
  if (status === 409) {
    return new CheckResultError("ambiguous_result", message, status);
  }
  if (status === 429) {
    return new CheckResultError("throttled", throttleMessage(message), status);
  }
  if (status === 400 && message === NOT_FOUND_MESSAGE) {
    return new CheckResultError(
      "not_found",
      `${message} Check the student ID, session and term, then try again.`,
      status,
    );
  }
  return new CheckResultError("other", message, status);
}
