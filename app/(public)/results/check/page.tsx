"use client";

// ─────────────────────────────────────────────────────────────────────────────
// app/results/check/page.tsx
//
// Public route: /results/check
//
// Reached from the "Check now" CTA on /results. Collects an arm, student
// public ID, and scratch card PIN. On submit, fires two public backend
// requests in parallel:
//
//   - GET  student/result/context/  (arm config + teachers)
//   - POST student/result/check/    (per-student result)
//
// The two responses are merged into a single StudentResultResponse and
// handed to the appropriate template component (junior, senior, or the
// safe fallback).
//
// Layout note:
//   Navbar and Footer are provided by the parent PublicLayout — this page
//   only renders its own <main>, matching the existing convention for
//   routes inside that layout.
// ─────────────────────────────────────────────────────────────────────────────

import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";

import publicFetch from "@/lib/Publicfetch";

import ResultsForm from "./components/ResultsForm";
import ResultsPreview from "./components/ResultsPreview";
import type {
  ApiEnvelope,
  CheckStudentResultPayload,
  CheckStudentResultResponse,
  ResultContextResponse,
  StudentResultResponse,
  SubjectAssessmentResult,
  TeacherRef,
} from "./components/results";

// Backend endpoint paths — relative to NEXT_PUBLIC_BACKEND_BASE_URL. Hoisted
// to module scope so the mutationFn body stays short and the endpoints are
// easy to spot when scanning the file.
const CHECK_RESULT_ENDPOINT = "student/result/check/";
const RESULT_CONTEXT_ENDPOINT = "student/result/context/";

// School ID injected at build time via env. Every context request needs it
// alongside the arm ID; the backend validates that the arm belongs to this
// school before returning anything. If the variable is missing, the
// mutation surfaces a friendly error instead of firing a request with an
// undefined query parameter.
const SCHOOL_ID = process.env.NEXT_PUBLIC_SCHOOL_ID;

export default function CheckResultsPage() {
  // Mutation for the public check-result flow. Two parallel requests fire
  // when the user submits:
  //
  //   1. GET  /student/result/context/?school-id=…&arm-id=…
  //      Returns the arm's assessment format, grading formats, result
  //      template metadata, school address parts, and the arm's subjects
  //      with their assigned teachers. Stable per arm — safe to cache.
  //
  //   2. POST /student/result/check/
  //      Redeems the scratch-card PIN and returns the per-student result
  //      (subjects/behaviours/skills/decision/position/remarks). Consumes
  //      a use of the PIN on success.
  //
  // On success both responses are merged into a single StudentResultResponse
  // that the templates consume — the enriched arm + school from the context
  // response, plus each subject row hydrated with its teacher list.
  //
  // Both requests fire in parallel because either one failing means the
  // template can't render; there's no benefit to sequencing them.
  //
  // retry: false — each attempt consumes a PIN use on success, and even on
  // failure an automatic retry would fire the context endpoint again for
  // no gain.
  const mutation = useMutation<
    StudentResultResponse,
    Error,
    CheckStudentResultPayload
  >({
    mutationFn: async (payload) => {
      if (!SCHOOL_ID) {
        throw new Error(
          "This school hasn't been configured for the results portal yet. Please contact the school administrator.",
        );
      }

      // Build the context URL with query params. Backend expects the
      // hyphenated names `school-id` and `arm-id` (NOT the snake_case
      // variants — verified against the endpoint's 400 response body).
      // encodeURIComponent guards against unexpected characters even
      // though both values are UUIDs.
      const contextUrl =
        `${RESULT_CONTEXT_ENDPOINT}` +
        `?school-id=${encodeURIComponent(SCHOOL_ID)}` +
        `&arm-id=${encodeURIComponent(payload.arm_id)}`;

      const [contextResult, checkResult] = await Promise.all([
        publicFetch<ApiEnvelope<ResultContextResponse>>(contextUrl, {
          method: "GET",
        }),
        publicFetch<ApiEnvelope<CheckStudentResultResponse>>(
          CHECK_RESULT_ENDPOINT,
          {
            method: "POST",
            body: payload,
          },
        ),
      ]);

      // Surface the check endpoint's error message first when both fail —
      // it's the one tied to the credential the user just typed, so it's
      // usually the more actionable one ("wrong PIN", "PIN exhausted",
      // "student not found"). Context errors ("arm not found") are much
      // less common in practice because the arm comes from a configured
      // list, not from user input.
      if (checkResult.error) throw new Error(checkResult.error.message);
      if (contextResult.error) throw new Error(contextResult.error.message);
      if (!contextResult.data || !checkResult.data) {
        throw new Error("The server returned an empty response.");
      }

      return mergeResultAndContext(
        checkResult.data.data,
        contextResult.data.data,
      );
    },
    // Mirror the inline error banner to a toast so the user sees the
    // failure even if they've scrolled past the form. Fires once per
    // failed submission (react-query's onError doesn't re-fire on
    // re-renders), so there's no risk of duplicate toasts.
    onError: (error) => {
      toast.error(error.message);
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
              Select the session, term and class, enter the student ID, and
              enter the PIN from the scratch card. The result will appear in a
              short while for review, download or printing.
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

// ─────────────────────────────────────────────────────────────────────────────
// mergeResultAndContext
//
// Combine the raw check-endpoint response with the arm context into a single
// StudentResultResponse that the templates already know how to consume.
//
// Two enrichments happen here:
//   1. `arm` and `school` are swapped for the enriched versions from the
//      context response. The check endpoint returns them as basic
//      {id, name, abbr} references; templates need the full arm config
//      (grading formats, units, template_key) and the school's address
//      parts.
//   2. Each subject in `subjects` is hydrated with a `teachers` list keyed
//      by `subject_id`. If a subject has no teachers assigned in context,
//      the list is left empty and the template renders "—" in the
//      Teacher ID column.
//
// Everything else — behaviours, skills, grading summary, remarks, level /
// section / term / session basics — passes through unchanged.
// ─────────────────────────────────────────────────────────────────────────────
function mergeResultAndContext(
  check: CheckStudentResultResponse,
  context: ResultContextResponse,
): StudentResultResponse {
  // Build a lookup so we can attach teachers to each subject in O(1).
  const teachersBySubjectId: Record<string, TeacherRef[]> = {};
  for (const ctxSubject of context.subjects) {
    teachersBySubjectId[ctxSubject.subject.id] = ctxSubject.teachers;
  }

  // Rebuild the subjects map with each row's teachers attached. Preserves
  // the original insertion order so display_order-based sorts still work.
  const enrichedSubjects: Record<string, SubjectAssessmentResult> = {};
  for (const [key, subject] of Object.entries(check.subjects)) {
    enrichedSubjects[key] = {
      ...subject,
      teachers: teachersBySubjectId[subject.subject_id] ?? [],
    };
  }

  return {
    ...check,
    arm: context.arm,
    school: context.school,
    subjects: enrichedSubjects,
  };
}
