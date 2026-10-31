"use client";

// ──────────────────────────────────────────
// ResultSheet.tsx
//
// Draws one student's result with the template the arm is set up to use: the
// template named by `result.arm.result_template.template_key`, or the fallback
// (see registry.ts). It does no fetching and knows nothing about where the
// result came from, so any screen that holds a StudentResultResponse can show a
// sheet: the public result check, or a staff screen.
//
// The template's `config` is the arm's own (`result.arm.result_template.config`)
// unless the caller passes one.
//
// Templates other than the fallback load on first use, so a sheet shows a
// placeholder of the same size until its template arrives.
// ──────────────────────────────────────────

import { createElement, Suspense, useEffect } from "react";

import { isKnownTemplateKey, resolveTemplate } from "./registry";
import type { ResultTemplateProps } from "./types";

// A key is reported once per page load, and only in development: in production
// the fallback quietly covers it.
const reported = new Set<string>();

export default function ResultSheet({
  result,
  config,
  printRef,
}: ResultTemplateProps) {
  const templateKey = result.arm.result_template?.template_key ?? null;

  useEffect(() => {
    if (
      process.env.NODE_ENV !== "production" &&
      templateKey &&
      !isKnownTemplateKey(templateKey) &&
      !reported.has(templateKey)
    ) {
      reported.add(templateKey);
      console.warn(
        `Result template "${templateKey}" is not in this build, so the general default sheet is drawn instead.`,
      );
    }
  }, [templateKey]);

  return (
    <Suspense fallback={<SheetPlaceholder />}>
      {/* createElement, not <Template />: the template is chosen by key at
          render time, and a component picked by a function call must not be
          written as a JSX tag. */}
      {createElement(resolveTemplate(templateKey), {
        result,
        config: config ?? result.arm.result_template?.config ?? {},
        printRef,
      })}
    </Suspense>
  );
}

// The size of an A4 sheet, so the page does not jump when the template arrives.
function SheetPlaceholder() {
  return (
    <div
      role="status"
      aria-label="Loading the result sheet"
      className="mx-auto h-[297mm] w-[210mm] max-w-full animate-pulse rounded-sm bg-slate-200"
    />
  );
}
