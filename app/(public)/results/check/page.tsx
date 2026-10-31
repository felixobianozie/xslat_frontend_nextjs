"use client";

// ──────────────────────────────────────────
// app/(public)/results/check/page.tsx
//
// Public route: /results/check
//
// Reached from the "Check now" CTA on /results. Collects the session and term,
// the student's public ID and the scratch card PIN. On submit it sends one
// request, POST student/result/check/, whose response is the student's result
// with everything the sheet needs around it (`context`). resultcheck.ts turns
// that into the StudentResultResponse that the result-sheet package draws with
// the arm's template (or the general default).
//
// A failed check is sorted by kind (see describeCheckError): the school's
// "view earlier results first" rule is shown as guidance in the form, the other
// failures as an error.
//
// Layout note:
//   Navbar and Footer come from the parent PublicLayout; this page only renders
//   its own <main>, matching the other routes inside that layout.
// ──────────────────────────────────────────

import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";

import publicFetch from "@/lib/Publicfetch";
import { ResultSheetViewer, type StudentResultResponse } from "@/result-sheet";

import ResultsForm from "./components/ResultsForm";
import {
  CheckResultError,
  describeCheckError,
  toStudentResult,
  type ApiEnvelope,
  type CheckStudentResultPayload,
  type CheckStudentResultResponse,
} from "./components/resultcheck";

const CHECK_RESULT_ENDPOINT = "student/result/check/";

export default function CheckResultsPage() {
  // retry: false. A success consumes a use of the PIN, and none of the failures
  // would be cured by asking again.
  const mutation = useMutation<
    StudentResultResponse,
    CheckResultError,
    CheckStudentResultPayload
  >({
    mutationFn: async (payload) => {
      const { data, error } = await publicFetch<
        ApiEnvelope<CheckStudentResultResponse>
      >(CHECK_RESULT_ENDPOINT, { method: "POST", body: payload });

      if (error) throw describeCheckError(error);
      if (!data) {
        throw new CheckResultError(
          "other",
          "The server returned an empty response.",
        );
      }
      return toStudentResult(data.data);
    },
    // The failure is also shown in the form, so a toast is for the visitor who
    // has scrolled past it. The "earlier results first" message is long and
    // lists terms, so its toast is short and the guidance box carries the rest.
    onError: (error) => {
      toast.error(
        error.kind === "previous_results_pending"
          ? "Please view your earlier results first."
          : error.message,
      );
    },
    retry: false,
  });

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Breadcrumb, matching the /results landing page. */}
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

      {/* Form panel. Hidden once a result loads, so the sheet is the only focus
          and the visitor is not tempted to submit again with a result on screen.
          React Query keeps `data` between renders, and the viewer's "Check
          another" button calls mutation.reset() to bring the form back. */}
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
              Select the session and term, enter the student ID, and enter the
              PIN from the scratch card. The result will appear in a short while
              for review, download or printing.
            </p>
          </header>

          <ResultsForm mutation={mutation} />
        </section>
      )}

      {/* The sheet sits outside the form's max-width, so the A4 page can use the
          full width of a wide screen. */}
      {mutation.data && (
        <section className="w-full px-2 pb-16 sm:px-4">
          <div className="mx-auto max-w-6xl">
            <ResultSheetViewer
              result={mutation.data}
              onReset={() => mutation.reset()}
              notice={
                <>
                  <span className="text-slate-900">NB: </span> If you leave this
                  page without printing or downloading, viewing it again will
                  consume another PIN usage count.
                </>
              }
            />
          </div>
        </section>
      )}
    </main>
  );
}
