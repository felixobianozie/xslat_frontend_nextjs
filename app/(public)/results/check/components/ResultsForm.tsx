"use client";

// ──────────────────────────────────────────
// ResultsForm.tsx
//
// The public result-check form: session, term, student ID and the scratch card
// PIN. The class is not asked for. It is worked out from the student's
// enrollment in the term.
//
// The sessions and terms come from the backend (GET student/result/terms/), which
// lists only the published terms of this school, so the form never offers a term
// that cannot be opened. The list is fetched in the visitor's own browser, so
// the backend's rate limit counts each visitor and not this site's server.
//
// The form starts on the newest session and its latest term. Choosing another
// session moves the term to that session's latest. Nothing is remembered between
// visits, and the PIN is never stored.
//
// The session and term selects hide the browser's own arrow (appearance-none) so
// they look the same on every device, and SelectField draws a chevron on them so
// they read as dropdowns.
//
// Accessibility:
//   - Every field has a real <label htmlFor>.
//   - The error and guidance boxes use role="alert" with aria-live so screen
//     readers announce them.
// ──────────────────────────────────────────

import { FormEvent, ReactNode, useMemo, useState } from "react";
import { useQuery, type UseMutationResult } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { toast } from "react-toastify";

import publicFetch from "@/lib/Publicfetch";
import type { StudentResultResponse } from "@/result-sheet";

import {
  latestTermOf,
  pickDefaultTerm,
  throttleMessage,
  type ApiEnvelope,
  type CheckResultError,
  type CheckStudentResultPayload,
  type PublishedTermsResponse,
} from "./resultcheck";

const SCHOOL_ID = process.env.NEXT_PUBLIC_SCHOOL_ID;
const TERMS_ENDPOINT = "student/result/terms/";

interface ResultsFormProps {
  mutation: UseMutationResult<
    StudentResultResponse,
    CheckResultError,
    CheckStudentResultPayload
  >;
}

const LABEL_CLASSES =
  "mb-1 block text-xs font-semibold uppercase tracking-widest text-slate-600";
const SELECT_CLASSES =
  "block w-full rounded-md border border-slate-300 bg-white py-2 pl-3 pr-9 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:bg-slate-50 disabled:text-slate-400 appearance-none";
const CARD_CLASSES =
  "rounded-md border border-slate-300 bg-white p-6 text-center";

export default function ResultsForm({ mutation }: ResultsFormProps) {
  // ── The published terms ──────────────────────────────────────────────────
  const termsQuery = useQuery<PublishedTermsResponse, Error>({
    queryKey: ["public-result-terms", SCHOOL_ID],
    queryFn: async () => {
      const { data, error } = await publicFetch<
        ApiEnvelope<PublishedTermsResponse>
      >(`${TERMS_ENDPOINT}?school-id=${encodeURIComponent(SCHOOL_ID ?? "")}`);
      if (error) {
        throw new Error(
          error.status === 429 ? throttleMessage(error.message) : error.message,
        );
      }
      return data!.data;
    },
    enabled: !!SCHOOL_ID,
    // The list changes only when a school publishes, so a visitor going back to
    // the form need not wait for it again.
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const sessions = useMemo(
    () => termsQuery.data?.sessions ?? [],
    [termsQuery.data],
  );

  // ── What is selected ─────────────────────────────────────────────────────
  // `null` means "the visitor has not chosen", and the default shows. The
  // default is worked out from the list while rendering, so there is no effect
  // to wait for when the list arrives.
  const [chosenSessionId, setChosenSessionId] = useState<string | null>(null);
  const [chosenTermId, setChosenTermId] = useState<string | null>(null);
  const [studentPublicId, setStudentPublicId] = useState("");
  const [pin, setPin] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const defaults = useMemo(() => pickDefaultTerm(sessions), [sessions]);
  const sessionId = chosenSessionId ?? defaults?.sessionId ?? "";
  const selectedSession = sessions.find((s) => s.id === sessionId);
  const termsForSession = selectedSession?.terms ?? [];
  const termId =
    chosenTermId && termsForSession.some((t) => t.id === chosenTermId)
      ? chosenTermId
      : (latestTermOf(selectedSession)?.id ?? "");

  function handleSessionChange(nextSessionId: string) {
    setChosenSessionId(nextSessionId);
    setChosenTermId(null); // the new session's latest term
  }

  // ── Submission ───────────────────────────────────────────────────────────
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Client-side guardrails. The backend validates too, but a clear message
    // here saves a round trip and stops a visitor spending a PIN use on an
    // obviously incomplete request. Each one is also shown as a toast, so it is
    // seen even if the visitor has scrolled the box out of view.
    const problem = !termId
      ? "Please choose a session and term."
      : !studentPublicId.trim()
        ? "Please enter the student ID."
        : !pin.trim()
          ? "Please enter the scratch card PIN."
          : null;
    if (problem) {
      setLocalError(problem);
      toast.error(problem);
      return;
    }

    setLocalError(null);
    mutation.mutate({
      term_id: termId,
      student_public_id: studentPublicId.trim(),
      pin: pin.trim(),
      // ranking is omitted, so the backend uses "competition".
    });
  }

  const isSubmitting = mutation.isPending;

  // ── Before the form can be shown ─────────────────────────────────────────
  if (!SCHOOL_ID) {
    return (
      <div className={CARD_CLASSES}>
        <p className="text-sm text-slate-700">
          This school hasn&apos;t been configured for the results portal yet.
          Please contact the school administrator.
        </p>
      </div>
    );
  }

  if (termsQuery.isPending) {
    return (
      <div className={CARD_CLASSES} role="status" aria-busy="true">
        <p className="text-sm text-slate-500">Loading sessions and terms…</p>
      </div>
    );
  }

  if (termsQuery.isError) {
    return (
      <div className={CARD_CLASSES} role="alert">
        <p className="text-sm text-rose-800">{termsQuery.error.message}</p>
        <button
          type="button"
          onClick={() => termsQuery.refetch()}
          disabled={termsQuery.isFetching}
          className="mt-3 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {termsQuery.isFetching ? "Trying…" : "Try again"}
        </button>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className={CARD_CLASSES}>
        <p className="text-sm text-slate-700">
          No results have been published yet. Please check back later.
        </p>
      </div>
    );
  }

  const failure = mutation.error;
  const isGuidance = failure?.kind === "previous_results_pending";

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-md border border-slate-300 bg-white p-4 sm:p-6"
      noValidate
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Session */}
        <SelectField
          id="results-session"
          label="Session"
          value={sessionId}
          onChange={handleSessionChange}
        >
          {sessions.map((session) => (
            <option key={session.id} value={session.id}>
              {session.name}
            </option>
          ))}
        </SelectField>

        {/* Term */}
        <SelectField
          id="results-term"
          label="Term"
          value={termId}
          onChange={setChosenTermId}
          disabled={termsForSession.length === 0}
        >
          {termsForSession.map((term) => (
            <option key={term.id} value={term.id}>
              {term.name}
            </option>
          ))}
        </SelectField>

        {/* Student public ID */}
        <div>
          <label htmlFor="results-student-id" className={LABEL_CLASSES}>
            Student ID
          </label>
          <input
            id="results-student-id"
            type="text"
            value={studentPublicId}
            onChange={(e) => setStudentPublicId(e.target.value)}
            placeholder="e.g. XYZ/000000"
            autoComplete="off"
            className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </div>

        {/* Scratch card PIN */}
        <div>
          <label htmlFor="results-pin" className={LABEL_CLASSES}>
            Scratch card PIN
          </label>
          <input
            id="results-pin"
            type="text"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="XXX12-YYY12"
            // Not a password, so keep password managers away from it.
            autoComplete="off"
            // Uppercase on screen to match the printed PIN. The backend ignores
            // case, so this is only a visual aid.
            className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm uppercase tracking-widest text-slate-900 placeholder:normal-case placeholder:tracking-normal placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </div>
      </div>

      {/* Failure. The school's "view earlier results first" rule is guidance,
          not a mistake, so it gets its own box, with the message's line breaks
          kept. The student ID and PIN stay filled in for the next try. */}
      {(localError || failure) &&
        (!localError && isGuidance ? (
          <div
            role="alert"
            aria-live="polite"
            className="mt-4 whitespace-pre-line rounded-md border border-amber-300 bg-amber-50 px-3 py-3 text-sm leading-relaxed text-amber-900"
          >
            {failure.message}
          </div>
        ) : (
          <div
            role="alert"
            aria-live="polite"
            className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800"
          >
            {localError ?? failure?.message}
          </div>
        ))}

      <div className="mt-4 flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end">
        <p className="text-xs text-slate-500 sm:mr-auto">
          Each PIN opens one result and can be used a limited number of times.
          You will need a separate PIN for each earlier term. Keep it safe.
        </p>
        {/* From `sm` the button sits in a row beside the helper text. min-w-fit and
            shrink-0 stop that text from squeezing it, and whitespace-nowrap keeps
            the label on one line. */}
        <button
          type="submit"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
          className="whitespace-nowrap rounded-md bg-indigo-900 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-fit sm:shrink-0"
        >
          {isSubmitting ? "Checking…" : "Check result"}
        </button>
      </div>
    </form>
  );
}

// A labelled select with a chevron on its right edge, so it reads as a dropdown.
// The chevron does not take clicks (the select under it does), is hidden from
// screen readers (the select already announces itself), and dims with the select
// when it is disabled.
function SelectField({
  id,
  label,
  value,
  onChange,
  disabled,
  children,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className={LABEL_CLASSES}>
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={`peer ${SELECT_CLASSES}`}
        >
          {children}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 peer-disabled:text-slate-300"
        />
      </div>
    </div>
  );
}
