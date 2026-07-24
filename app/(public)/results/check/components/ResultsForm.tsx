"use client";

// ─────────────────────────────────────────────────────────────────────────────
// ResultsForm.tsx
//
// The form on /results. Guides the visitor from Session → Term → Arm using
// the ARM_DIRECTORY config (temporary, until a backend endpoint exists),
// then collects the student's public ID and their scratch-card PIN.
//
// Only `arm_id`, `student_public_id`, `pin`, and optional `ranking` are
// submitted — session and term are UI-only narrowing and never touch the
// backend.
//
// Submission mode:
//   The form owns the react-query mutation via `useCheckStudentResult` (a
//   hook created for this feature). The parent page reads the mutation's
//   `data`, `isPending`, and `error` to render the preview area alongside.
//
// Accessibility:
//   - Every field has a real <label htmlFor>.
//   - The submit button carries an accessible loading label via aria-busy.
//   - Native <select> and <input> so keyboard + screen-reader work
//     without JS gymnastics.
//   - Errors are announced via aria-live on the alert region so users
//     hear a screen-reader response when a submission fails.
// ─────────────────────────────────────────────────────────────────────────────

import { FormEvent, useMemo, useState } from "react";
import type { UseMutationResult } from "@tanstack/react-query";

import { ARM_DIRECTORY } from "./arm-directory";
import type {
  CheckStudentResultPayload,
  StudentResultResponse,
} from "./results";

interface ResultsFormProps {
  /**
   * Mutation controlling the actual submission. Lifted to the parent so
   * the same mutation state can drive the preview area (loading indicator,
   * error banner, and eventual result rendering).
   */
  mutation: UseMutationResult<
    StudentResultResponse,
    Error,
    CheckStudentResultPayload
  >;
}

export default function ResultsForm({ mutation }: ResultsFormProps) {
  // ── Selection state ──────────────────────────────────────────────────────
  //
  // Session and term are narrowing controls only. They filter the arm
  // dropdown but their ids are not part of the submitted payload.

  // Default to the newest session (top of the directory) so the form
  // opens on the most likely choice; the user can still switch.
  const [sessionId, setSessionId] = useState<string>(
    ARM_DIRECTORY[0]?.id ?? "",
  );

  const [termId, setTermId] = useState<string>(
    ARM_DIRECTORY[0]?.terms[0]?.id ?? "",
  );

  const [armId, setArmId] = useState<string>("");

  // ── Free text fields ─────────────────────────────────────────────────────

  const [studentPublicId, setStudentPublicId] = useState<string>("");
  const [pin, setPin] = useState<string>("");

  // Client-side validation errors. Kept separate from mutation.error so both
  // can be displayed without stepping on each other.
  const [localError, setLocalError] = useState<string | null>(null);

  // ── Derived option lists ────────────────────────────────────────────────
  // Recomputed whenever the parent selection changes. useMemo keeps the
  // lookups stable across renders — no material perf gain, but it keeps
  // the render logic obviously pure.

  const selectedSession = useMemo(
    () => ARM_DIRECTORY.find((s) => s.id === sessionId),
    [sessionId],
  );

  const termsForSession = selectedSession?.terms ?? [];

  const selectedTerm = useMemo(
    () => termsForSession.find((t) => t.id === termId),
    [termsForSession, termId],
  );

  const armsForTerm = selectedTerm?.arms ?? [];

  // Reset downstream selections when an upstream one changes, so the form
  // never presents a stale-parent + fresh-child combination.
  function handleSessionChange(nextSessionId: string) {
    setSessionId(nextSessionId);
    const nextSession = ARM_DIRECTORY.find((s) => s.id === nextSessionId);
    setTermId(nextSession?.terms[0]?.id ?? "");
    setArmId("");
  }

  function handleTermChange(nextTermId: string) {
    setTermId(nextTermId);
    setArmId("");
  }

  // ── Submission ──────────────────────────────────────────────────────────

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Client-side guardrails — the backend validates too, but showing a
    // helpful error here saves a network round trip and prevents users
    // from burning pin uses on obviously incomplete requests.
    if (!armId) {
      setLocalError("Please choose a class.");
      return;
    }
    if (!studentPublicId.trim()) {
      setLocalError("Please enter the student ID.");
      return;
    }
    if (!pin.trim()) {
      setLocalError("Please enter the scratch card PIN.");
      return;
    }

    setLocalError(null);
    mutation.mutate({
      arm_id: armId,
      student_public_id: studentPublicId.trim(),
      pin: pin.trim(),
      // ranking omitted → backend uses "competition" default. Add a
      // control here later if the school wants to expose it.
    });
  }

  const isSubmitting = mutation.isPending;

  // If the arm directory is empty (nothing configured yet), show a
  // friendly message rather than an unusable form.
  if (ARM_DIRECTORY.length === 0) {
    return (
      <div className="rounded-md border border-slate-300 bg-white p-6 text-center">
        <p className="text-sm text-slate-700">
          The results portal is not configured yet. Please check back once the
          school administrator has published this term's classes.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-md border border-slate-300 bg-white p-4 sm:p-6"
      noValidate
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Session */}
        <div>
          <label
            htmlFor="results-session"
            className="mb-1 block text-xs font-semibold uppercase tracking-widest text-slate-600"
          >
            Session
          </label>
          <select
            id="results-session"
            value={sessionId}
            onChange={(e) => handleSessionChange(e.target.value)}
            className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          >
            {ARM_DIRECTORY.map((session) => (
              <option key={session.id} value={session.id}>
                {session.name}
              </option>
            ))}
          </select>
        </div>

        {/* Term */}
        <div>
          <label
            htmlFor="results-term"
            className="mb-1 block text-xs font-semibold uppercase tracking-widest text-slate-600"
          >
            Term
          </label>
          <select
            id="results-term"
            value={termId}
            onChange={(e) => handleTermChange(e.target.value)}
            disabled={termsForSession.length === 0}
            className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:bg-slate-50 disabled:text-slate-400"
          >
            {termsForSession.length === 0 ? (
              <option value="">No terms available</option>
            ) : (
              termsForSession.map((term) => (
                <option key={term.id} value={term.id}>
                  {term.name}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Arm (class) */}
        <div className="sm:col-span-2">
          <label
            htmlFor="results-arm"
            className="mb-1 block text-xs font-semibold uppercase tracking-widest text-slate-600"
          >
            Class
          </label>
          <select
            id="results-arm"
            value={armId}
            onChange={(e) => setArmId(e.target.value)}
            disabled={armsForTerm.length === 0}
            className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:bg-slate-50 disabled:text-slate-400"
          >
            <option value="">
              {armsForTerm.length === 0
                ? "No classes available"
                : "Choose a class…"}
            </option>
            {armsForTerm.map((arm) => (
              <option key={arm.arm_id} value={arm.arm_id}>
                {arm.label}
              </option>
            ))}
          </select>
        </div>

        {/* Student public ID */}
        <div>
          <label
            htmlFor="results-student-id"
            className="mb-1 block text-xs font-semibold uppercase tracking-widest text-slate-600"
          >
            Student ID
          </label>
          <input
            id="results-student-id"
            type="text"
            value={studentPublicId}
            onChange={(e) => setStudentPublicId(e.target.value)}
            placeholder="e.g. XYZ/123456"
            autoComplete="off"
            className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </div>

        {/* Scratch card PIN */}
        <div>
          <label
            htmlFor="results-pin"
            className="mb-1 block text-xs font-semibold uppercase tracking-widest text-slate-600"
          >
            Scratch card PIN
          </label>
          <input
            id="results-pin"
            type="text"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="XXX12-YYY12"
            // Prevent password managers from grabbing this — it's not a password.
            autoComplete="off"
            // Uppercase visually to match the printed PIN — the backend
            // normalises casing internally, so this is a purely cosmetic aid.
            className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm uppercase tracking-widest text-slate-900 placeholder:normal-case placeholder:tracking-normal placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </div>
      </div>

      {/* Error banner — aria-live so screen readers announce failures. */}
      {(localError || mutation.error) && (
        <div
          role="alert"
          aria-live="polite"
          className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800"
        >
          {localError ?? mutation.error?.message}
        </div>
      )}

      <div className="mt-4 flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end">
        <p className="text-xs text-slate-500 sm:mr-auto">
          Each PIN can be used a limited number of times. Keep it safe.
        </p>
        <button
          type="submit"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
          className="rounded-md bg-indigo-900 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Checking…" : "Check result"}
        </button>
      </div>
    </form>
  );
}
