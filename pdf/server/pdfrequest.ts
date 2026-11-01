// ──────────────────────────────────────────
// pdf/server/pdfrequest.ts
//
// The checks POST /api/pdf makes on a request before anything expensive happens
// (starting Chromium costs real time and memory). Plain functions with no
// framework in them, so they can be tested without a server.
// ──────────────────────────────────────────

// The largest document accepted. Vercel refuses request bodies over 4.5 MB, so
// this stays below that and lets us answer with a clear message instead.
export const MAX_HTML_BYTES = 3 * 1024 * 1024;

export interface PdfRequest {
  html: string;
  filename: string;
}

export type ParsedPdfRequest =
  | { ok: true; value: PdfRequest }
  | { ok: false; status: number; message: string };

// The Origin header names the page that made the request. Browsers send it on
// cross-site requests, but not always on a plain same-origin one.
export function isSameOrigin(origin: string | null, host: string | null): boolean {
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

// Whether the request was made by one of our own pages, and not by another
// website using a visitor's browser. The browser reports this itself in the
// Sec-Fetch-Site header, which a web page cannot forge or change, so that is
// trusted first. The Origin header is only the fallback for the few browsers that
// do not send Sec-Fetch-Site. A script can send any headers it likes, so this does
// not stop scripts: BotID and the rate limit do that.
export function isFromOurSite(headers: {
  fetchSite: string | null;
  origin: string | null;
  host: string | null;
}): boolean {
  if (headers.fetchSite) return headers.fetchSite === "same-origin";
  return isSameOrigin(headers.origin, headers.host);
}

// A file name that is safe in a header and on any operating system: letters (of
// any language), digits, spaces, dots, dashes and underscores, at most 100
// characters, and always ending in .pdf.
export function safeFilename(raw: unknown): string {
  const name = (typeof raw === "string" ? raw : "")
    .replace(/\.pdf$/i, "")
    .replace(/[^\p{L}\p{N}\s._-]/gu, "") // drops slashes, quotes, control characters
    .replace(/\s+/g, " ")
    .replace(/^[.\s]+/, "") // no leading dots, so it can never be a hidden file or ".."
    .slice(0, 100)
    .trim();
  return `${name || "document"}.pdf`;
}

// The Content-Disposition header: a plain ASCII name for old software, plus the
// real UTF-8 name so accents survive. `filename` has already been through
// safeFilename, so it holds none of the characters that would need escaping.
export function contentDisposition(filename: string): string {
  const ascii = filename.replace(/[^\x20-\x7e]/g, "_");
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

// Checks the JSON body of a request. Returns the cleaned request, or the status
// and message to answer with.
export function parsePdfRequest(body: unknown): ParsedPdfRequest {
  const { html, filename } = (body ?? {}) as { html?: unknown; filename?: unknown };

  if (typeof html !== "string" || html.trim() === "") {
    return { ok: false, status: 400, message: "There was nothing to turn into a PDF." };
  }
  if (new TextEncoder().encode(html).length > MAX_HTML_BYTES) {
    return {
      ok: false,
      status: 413,
      message: "This document is too large to download as a PDF.",
    };
  }
  // renderPdf adds the fonts inside <head>, so the page must have one.
  if (!/<head[\s>]/i.test(html)) {
    return { ok: false, status: 400, message: "The document is not a complete page." };
  }
  return { ok: true, value: { html, filename: safeFilename(filename) } };
}
