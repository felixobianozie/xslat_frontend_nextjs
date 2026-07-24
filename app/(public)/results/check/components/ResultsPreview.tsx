"use client";

// ─────────────────────────────────────────────────────────────────────────────
// ResultsPreview.tsx
//
// Renders the resolved result template for a successful check-result
// response, and exposes the two output flows:
//
//   1. Print (browser dialog) — window.print() honours the templates'
//      inline @page { size: A4 portrait; margin: 0; } rule so the
//      browser's Save-as-PDF produces vector output.
//   2. Download PDF (image) — html2canvas-pro rasterises the same DOM
//      node and jsPDF wraps it into an A4 file. Same visual, different
//      internal representation.
//
// The template node lives behind `printRef` so html2canvas has an exact
// handle on the printable page. Attaching the ref to the outer wrapper
// (rather than a child of the template) means everything the template
// renders — including its inline <style> — is inside the captured node.
//
// Mobile-first note:
//   The template itself is a fixed-width 210mm sheet (as required for
//   print fidelity). On phones we don't try to reflow it; we wrap it in
//   a horizontally-scrollable container so it remains readable and the
//   PDF output stays predictable. The Print / Download buttons sit
//   above the scroll area so they're always reachable.
// ─────────────────────────────────────────────────────────────────────────────

import { useRef, useState } from "react";
import { toast } from "react-toastify";

import { resolveTemplate } from "./registry";
import { downloadResultPdf } from "./downloadResultPdf";
import type { StudentResultResponse } from "./results";

// Print-orchestration CSS. Injected as an inline <style> block so it's only
// active while the preview is mounted, and so it lives alongside the
// component that owns the print flow.
//
// The templates themselves already carry the @page rule and their own
// print-time chrome resets (shadow, page margins). This block adds the
// missing piece: hiding every element in the document that isn't part of
// the .result-page tree, so window.print() produces a single A4 sheet with
// nothing else on it.
//
// Selector logic:
//   body *:not(.result-page):not(:has(.result-page)):not(.result-page *)
//   → matches every element under body that:
//       - isn't the .result-page itself,
//       - isn't an ancestor of .result-page (has(...)),
//       - isn't a descendant of .result-page.
//   Everything matching that filter gets display: none in print. Ancestors
//   remain visible as invisible containers so the .result-page still has
//   somewhere to render.
//
// Positioning:
//   .result-page is pinned absolute at (0, 0). Its containing block during
//   print is the page itself (no positioned ancestor), so the sheet lands
//   flush with page origin regardless of ancestor padding — including the
//   preview's scroll wrapper and section spacing.
//
// Browser support: :has() is available in every current evergreen browser
// (Chrome 105+, Safari 15.4+, Firefox 121+). Older browsers gracefully
// degrade to today's behaviour: the whole page prints.
const PRINT_ORCHESTRATION_STYLES = `
  @media print {
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: #fff !important;
    }
    body *:not(.result-page):not(:has(.result-page)):not(.result-page *) {
      display: none !important;
    }
    .result-page {
      position: absolute !important;
      left: 0 !important;
      top: 0 !important;
    }
  }
`;

interface ResultsPreviewProps {
  result: StudentResultResponse;
  /**
   * Optional. When provided, the preview header shows a "Check another
   * result" button that calls this callback. The parent typically wires
   * it to `mutation.reset()` so the form comes back and the user can
   * look up a different student without navigating away from the page.
   */
  onReset?: () => void;
}

export default function ResultsPreview({
  result,
  onReset,
}: ResultsPreviewProps) {
  // Pick the component from the registry using the arm's template_key.
  // resolveTemplate() always returns a valid component, so no null-check
  // is needed further down.
  const Template = resolveTemplate(result.arm.result_template?.template_key);
  const templateConfig = result.arm.result_template?.config ?? {};

  // The rendered A4 page's DOM node — captured for PDF rasterisation.
  const printRef = useRef<HTMLDivElement | null>(null);

  // Local pending state for the async PDF generation. Kept separate from
  // any react-query state so it doesn't affect the check-result mutation.
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  // Build a stable file name from the student and academic context so
  // parents downloading multiple children's results don't stack up
  // `student-result (1).pdf` files.
  const fileName = buildFileName(result);

  async function handleDownload() {
    if (!printRef.current) {
      // Should never happen in normal use — the button is only visible when a
      // result has rendered, which sets the ref. Show a message rather than
      // silently exiting so any future regression (e.g. a template missing
      // its ref wiring) is visible to the user instead of just "nothing
      // happens on click".
      const msg =
        "Couldn't read the result sheet. Please refresh and try again.";
      setDownloadError(msg);
      toast.error(msg);
      return;
    }
    setIsDownloading(true);
    setDownloadError(null);
    try {
      await downloadResultPdf(printRef.current, { fileName });
    } catch (err) {
      // Surface the error in the panel — html2canvas can fail on
      // cross-origin images or very large captures. Keeping the caught
      // error's message helps diagnose in the wild. Mirrored to a toast so
      // the user sees the failure even if they've scrolled past the panel.
      const msg =
        err instanceof Error
          ? err.message
          : "Something went wrong while creating the PDF.";
      setDownloadError(msg);
      toast.error(msg);
    } finally {
      setIsDownloading(false);
    }
  }

  function handlePrint() {
    // The templates already carry the @page CSS to size themselves for
    // A4 portrait. Invoking window.print() lets the browser show its
    // native dialog (which supports Save-as-PDF everywhere).
    window.print();
  }

  return (
    <section aria-label="Result preview" className="mt-6">
      {/* Print-orchestration styles — see PRINT_ORCHESTRATION_STYLES above.
          Kept as an inline <style> tag rather than a global CSS file so the
          rules only exist while the preview is mounted, and cannot affect
          the print behaviour of any other route. */}
      <style dangerouslySetInnerHTML={{ __html: PRINT_ORCHESTRATION_STYLES }} />
      {/* Header strip: title + controls. Sticky on scroll so the buttons
          remain reachable while the user browses a long report.

          top-16 (64px) parks the strip 8px below the parent Navbar's
          fixed 56px main row (h-14). The Navbar is z-50, this strip is
          z-10, so if the announcement banner is showing the Navbar still
          wins visually — dismissing the banner brings this strip flush to
          the Navbar's bottom edge. */}
      <div className="sticky top-16 z-10 flex flex-col gap-3 border-b border-slate-200 bg-white/95 px-2 py-3 backdrop-blur sm:flex-row sm:items-center sm:justify-between print:hidden">
        {/* Left cluster — just the "Preview" title + description now. */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 py-2">
            Preview
          </p>
          <p className="text-sm text-slate-700">
            <span className="text-slate-900">NB: </span> If you leave this page
            without printing or downloading, viewing it again will consume
            another PIN usage count.
          </p>
        </div>

        {/* Right cluster — Print, Download, and Check another (when
            supplied). Order matches the visual reading order requested:
              Desktop (sm:flex-row): [ Print ] [ Download PDF ] [ Check another ]
              Mobile  (flex-col):    Print → Download PDF → Check another
            Check another wears the same neutral-secondary styling as
            Print so the three buttons form a visually consistent group. */}
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={handlePrint}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300"
          >
            Print
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading}
            aria-busy={isDownloading}
            className="rounded-md bg-indigo-900 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDownloading ? "Preparing PDF…" : "Download As PDF"}
          </button>
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300"
            >
              Check another
            </button>
          )}
        </div>
      </div>

      {/* Error banner — printed content on the wrapper is hidden in print
          so this never appears in the exported PDF or paper output. */}
      {downloadError && (
        <div
          role="alert"
          aria-live="polite"
          className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800 print:hidden"
        >
          {downloadError}
        </div>
      )}

      {/* Scroll container — the A4 sheet is 210mm wide (~794px @ 96dpi)
          which overflows on phones. Horizontal scroll keeps the sheet
          exactly the right size for print fidelity while still being
          usable on a small screen. */}
      <div className="mt-3 w-full overflow-x-auto bg-slate-100 py-4 print:mt-0 print:overflow-visible print:bg-white print:py-0">
        <Template result={result} config={templateConfig} printRef={printRef} />
      </div>
    </section>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Compose a readable, filesystem-safe filename from the response payload.
// Windows and macOS both reject '/', so we strip those from the student
// public_id (which conventionally contains slashes on this project).
function buildFileName(result: StudentResultResponse): string {
  const student = [
    result.student_last_name,
    result.student_first_name,
    result.student_middle_name,
  ]
    .filter(Boolean)
    .join(" ");

  const term = result.term.name;
  const session = result.session.name.replace(/\//g, "-");

  const safeStudent = student.replace(/[^\w\s-]/g, "").trim() || "student";
  const safeTerm = term.replace(/[^\w\s-]/g, "").trim() || "term";

  return `${safeStudent} — ${safeTerm} ${session}.pdf`;
}
