"use client";

// ─────────────────────────────────────────────────────────────────────────────
// app/results/check/page.tsx
//
// Public route: /results/check
//
// Reached from the "Check now" CTA on /results. Collects an arm, student
// public ID, and scratch card PIN, submits to the public
// academics/student/result/check/ endpoint, and renders the appropriate
// result template on success.
//
// Layout note:
//   Navbar and Footer are provided by the parent PublicLayout — this page
//   only renders its own <main>, matching the existing convention for
//   routes inside that layout.
// ─────────────────────────────────────────────────────────────────────────────

import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
// TEMP TESTING: `toast` is only used by the "not yet published" simulation
// inside the mutationFn below. Remove this import when reverting the
// USE_MOCK_RESULT block back to `return MOCK_RESULT;`.
import { toast } from "react-toastify";

import publicFetch from "@/lib/Publicfetch";

import ResultsForm from "./components/ResultsForm";
import ResultsPreview from "./components/ResultsPreview";
import type {
  ApiEnvelope,
  CheckStudentResultPayload,
  StudentResultResponse,
} from "./components/results";

// TEMP: Mock fixture used while the backend endpoint is still being built.
// Imported only for the mock branch inside the mutationFn below — remove
// this import (and delete /__fixtures__/mock-result.ts) once the real
// backend response is live and verified.
import { MOCK_RESULT } from "./components/mock-result";

// Backend endpoint path — relative to NEXT_PUBLIC_BACKEND_BASE_URL. Hoisted
// to module scope so the mutationFn body stays short and the endpoint is
// easy to spot when scanning the file.
const CHECK_RESULT_ENDPOINT = "academics/student/result/check/";

// TEMP: Flip to `false` (or delete this constant and the mock branch inside
// the mutationFn) once the backend endpoint is returning the extended
// response shape. Kept as a single obvious constant so it's impossible to
// miss during a code review.
//
// While `true`:
//   - Submitting the form skips the network entirely.
//   - After a short simulated delay, the mock fixture is returned as if it
//     came back from the server.
//   - Form validation, isPending, success rendering, and the preview flow
//     all still work exactly as they will in production.
const USE_MOCK_RESULT = true;

// How long to pretend the network took, in ms. Just enough for the form's
// "Checking…" button and the mutation's isPending state to be visible so
// the loading UX can be validated too.
const MOCK_LATENCY_MS = 600;

export default function CheckResultsPage() {
  // Mutation for the public check-result endpoint. Kept inline here (rather
  // than extracted into a hook) while it's still small and only called from
  // this component. If a second consumer appears, or the body outgrows the
  // page, lift it back into hooks/.
  //
  // Generics on useMutation are, in order:
  //   1. Success payload — what mutationFn resolves with.
  //   2. Error type       — what mutationFn throws.
  //   3. Input variables — what callers pass to `mutate(...)`.
  //
  // publicFetch is the right utility because the endpoint is AllowAny on the
  // backend; using authFetch would break the flow for signed-out visitors
  // (the whole point of this page). It returns { data, error } rather than
  // throwing, so we translate errors into throws ourselves for react-query.
  //
  // retry: false — each attempt consumes a use of the caller's scratch card
  // PIN, so an automatic retry would waste it.
  const mutation = useMutation<
    StudentResultResponse,
    Error,
    CheckStudentResultPayload
  >({
    mutationFn: async (payload) => {
      // TEMP: Mock branch — returns the fixture instead of hitting the
      // network. Delete this whole `if` block (and the imports and constants
      // at the top of the file) once the backend endpoint is live.
      if (USE_MOCK_RESULT) {
        // Pretend the network took a moment so the form's "Checking…"
        // loading state is visible during the flow.
        await new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));
        // `payload` is intentionally unused here — the mock fixture is a
        // fixed snapshot. Once the backend is live, the real fetch below
        // takes over and starts using it.
        void payload;

        // TEMP TESTING (temporary — revert after test):
        // Simulate a backend response indicating the selected term's
        // result is not yet published. This surfaces the message in both
        // the form's inline error banner (via the thrown Error) and as a
        // toast, and prevents the preview from ever mounting because
        // `mutation.data` stays undefined on failure.
        //
        // TO REVERT: delete the three lines below and restore
        //   return MOCK_RESULT;
        void MOCK_RESULT; // keeps the import above referenced during the test
        const notPublishedMessage =
          "The results for the selected term have not been published yet.";
        toast.error(notPublishedMessage);
        throw new Error(notPublishedMessage);
      }

      const { data, error } = await publicFetch<
        ApiEnvelope<StudentResultResponse>
      >(CHECK_RESULT_ENDPOINT, {
        method: "POST",
        body: payload,
      });

      if (error) throw new Error(error.message);
      if (!data) throw new Error("The server returned an empty response.");

      // The API envelope wraps every response as { message, data } — unwrap
      // once here so downstream consumers work with the flat result object.
      return data.data;
    },
    retry: false,
  });

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Breadcrumb — matches the /results landing pattern so navigating
          between the two pages feels consistent. */}
      <div className="container mx-auto px-6 lg:px-16 py-5 flex items-center gap-2 text-xs text-slate-400">
        <Link href="/" className="hover:text-indigo-600 transition-colors">
          Home
        </Link>
        <span>/</span>
        <Link
          href="/results"
          className="hover:text-indigo-600 transition-colors"
        >
          Results
        </Link>
        <span>/</span>
        <span className="text-slate-600 font-medium">Check</span>
      </div>

      {/* Form panel — hidden once a result loads so the preview is the only
          focus, and the user isn't tempted to re-submit while a valid
          response is on screen. The mutation state is preserved (React
          Query keeps `data` between renders), and mutation.reset() from
          the preview brings the form back for a fresh look-up. */}
      {!mutation.data && (
        <section className="mx-auto w-full max-w-3xl px-4 pb-8 sm:px-6 sm:pb-12">
          <header className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Terminal Results
            </p>
            <h1
              className="mt-1 text-3xl font-bold text-indigo-950 sm:text-4xl"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Check your result
            </h1>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Select the class, enter the student ID, and paste the PIN from the
              scratch card. The result will appear below for review and
              printing.
            </p>
          </header>

          <ResultsForm mutation={mutation} />
        </section>
      )}

      {/* Preview area — lives outside the form's max-width so the A4 sheet
          can extend to the full viewport width on wide screens without the
          form's container cropping it. */}
      {mutation.data && (
        <section className="w-full px-2 pb-16 sm:px-4">
          <div className="mx-auto max-w-6xl">
            <ResultsPreview
              result={mutation.data}
              onReset={() => mutation.reset()}
            />
          </div>
        </section>
      )}
    </main>
  );
}
