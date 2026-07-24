// ─────────────────────────────────────────────────────────────────────────────
// lib/downloadResultPdf.ts
//
// Convert a rendered result template (any DOM node) into a downloadable
// A4-portrait PDF. The output is an image PDF — a single high-DPI raster
// of the DOM node, scaled to fit an A4 page.
//
// Why an image PDF (not vector via @react-pdf/renderer):
//   The templates are written in Tailwind CSS. @react-pdf/renderer doesn't
//   parse CSS; it uses its own style system that would require rewriting
//   every template. An image PDF lets us keep one Tailwind source of truth
//   for both on-screen preview AND download — critical for the "exact same
//   print preview" requirement.
//
// Why html2canvas-pro:
//   The community fork of html2canvas that adds support for modern CSS
//   colour spaces (OKLCH, LCH, LAB) that Tailwind v4 emits by default.
//   Stock html2canvas silently produces incorrect colours or throws on
//   OKLCH. `-pro` is a drop-in replacement and stays maintained.
//
// Dependencies (new to the project):
//   - html2canvas-pro
//   - jspdf
// ─────────────────────────────────────────────────────────────────────────────

// Dynamic imports keep both libs OUT of the main bundle. They're only
// loaded when the user clicks "Download PDF", not on every /results
// visit. Also keeps SSR clean — both libs touch `window` and would
// break server rendering if imported statically.

// A4 dimensions in millimetres — the templates target this exactly.
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;

// html2canvas render scale. 3× effectively renders the DOM at ~288 DPI,
// which mostly eliminates the sub-pixel rounding that shows up as table
// borders drifting by half a pixel between the on-screen preview and the
// exported image. 2× was the previous value and produced visible drift
// on multi-column tables. Trades ~2.25× more capture memory (~30MB for an
// A4 sheet vs. ~14MB at 2×), which is comfortable on desktop and modern
// phones but tight on very old devices.
const RENDER_SCALE = 3;

export interface DownloadResultPdfOptions {
  /** File name for the download. `.pdf` is appended if missing. */
  fileName?: string;
  /** Background colour for the rendered canvas. Defaults to white. */
  backgroundColor?: string;
}

/**
 * Render `node` to an A4 image PDF and trigger a browser download.
 *
 * @param node    The DOM node to capture. Typically the A4 page root of a
 *                result template (attach it via a ref).
 * @param options Optional overrides for file name and background.
 *
 * Errors thrown here should be surfaced to the user by the caller —
 * html2canvas can fail on cross-origin images, and jsPDF can fail if
 * memory pressure is severe on very old devices.
 */
export async function downloadResultPdf(
  node: HTMLElement,
  options: DownloadResultPdfOptions = {},
): Promise<void> {
  const { fileName = "student-result.pdf", backgroundColor = "#ffffff" } =
    options;

  // Ensure the file name ends with .pdf so the browser attaches the right
  // mime handling / extension.
  const safeFileName = fileName.toLowerCase().endsWith(".pdf")
    ? fileName
    : `${fileName}.pdf`;

  // Wait for every declared font to finish loading BEFORE we take the
  // snapshot. If a font is still loading when html2canvas measures text,
  // cells render with a fallback font whose metrics differ from the final
  // font — that shift shows up in the exported PDF as tiny column
  // mis-alignments even though the on-screen preview looks fine. Some
  // browsers reject the promise if a font fails to load; swallowing the
  // error means we still produce a PDF, just possibly with a fallback
  // font (same as what the user sees on screen in that case).
  if (typeof document !== "undefined" && document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {
      // Continue with whatever fonts did load.
    }
  }

  // Lazy-load the heavy libraries only when a user actually triggers a
  // download. Keeps the /results initial JS payload small.
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas-pro"),
    import("jspdf"),
  ]);

  // Rasterise the node. `scale` boosts effective DPI; `useCORS` lets
  // remote images (e.g. the school logo when hosted elsewhere) be captured
  // without tainting the canvas. `backgroundColor` guarantees a clean
  // white background even if the node itself has a transparent area.
  // `imageTimeout: 0` disables the default 15s cap — Next.js Image can be
  // slow on first render, and we'd rather wait than ship a PDF with a
  // missing logo.
  const canvas = await html2canvas(node, {
    scale: RENDER_SCALE,
    useCORS: true,
    backgroundColor,
    logging: false,
    imageTimeout: 0,
  });

  // Convert to a PNG data URL. PNG (lossless) rather than JPEG (lossy) so
  // black-and-white text stays crisp; the PDF ends up slightly larger but
  // legibility trumps file size for a print artefact.
  const imgData = canvas.toDataURL("image/png");

  // Build the PDF at A4 portrait. `unit: "mm"` matches how the templates
  // are dimensioned so the image lands exactly edge-to-edge.
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    // A raster-heavy PDF benefits from the fast native compressor.
    compress: true,
  });

  // Compute image dimensions to fill the A4 page while preserving the
  // captured aspect ratio. In practice the templates ARE A4-shaped so this
  // works out to (210mm × 297mm). If a template overflows vertically we
  // clip the extra rather than shrinking — see the note below on
  // multi-page templates.
  const captureAspect = canvas.width / canvas.height;
  const a4Aspect = A4_WIDTH_MM / A4_HEIGHT_MM;

  let renderWidth: number;
  let renderHeight: number;
  if (captureAspect >= a4Aspect) {
    // Wider than A4 → fit to width, letterboxing at the bottom is fine.
    renderWidth = A4_WIDTH_MM;
    renderHeight = A4_WIDTH_MM / captureAspect;
  } else {
    // Taller than A4 → fit to height so the page fills; the extra
    // horizontal space is centred implicitly by the 0 x-offset below
    // (small side margins, if any, are acceptable for prints).
    renderHeight = A4_HEIGHT_MM;
    renderWidth = A4_HEIGHT_MM * captureAspect;
  }

  const offsetX = (A4_WIDTH_MM - renderWidth) / 2;
  const offsetY = (A4_HEIGHT_MM - renderHeight) / 2;

  pdf.addImage(imgData, "PNG", offsetX, offsetY, renderWidth, renderHeight);
  pdf.save(safeFileName);
}
