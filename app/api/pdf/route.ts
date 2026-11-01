// ──────────────────────────────────────────
// POST /api/pdf
//
// Turns a printed page into a PDF. The browser sends the page as one complete,
// self-contained HTML document (see pdf/client/Printhtml.ts) and gets the PDF back as a
// file. Any page can use it; nothing here knows about result sheets.
//
// Request:  JSON { html: string, filename?: string }
// Response: the PDF, or JSON { message } with one of these statuses:
//   400  the request was not usable        413  the document is too large
//   403  BotID or the origin check refused 503  this instance is busy printing
//   500  the PDF could not be created
// A 429 can also come from the Vercel Firewall rate-limit rule, before this
// route runs at all.
//
// The cheap checks come first, so a refused request never starts Chromium.
// ──────────────────────────────────────────

import { checkBotId } from "botid/server";
import { NextResponse } from "next/server";

import {
  contentDisposition,
  isFromOurSite,
  MAX_HTML_BYTES,
  parsePdfRequest,
} from "@/pdf/server/pdfrequest";
import { PdfBusyError, renderPdf } from "@/pdf/server/renderPdf";

export const runtime = "nodejs"; // Chromium needs Node, not the edge runtime
export const maxDuration = 60; // seconds; caps a stuck print instead of letting it run on
export const dynamic = "force-dynamic";

// The answer for every failure: { message }, which our fetch helpers turn into error.message.
function refuse(status: number, message: string) {
  return NextResponse.json({ message }, { status });
}

export async function POST(request: Request) {
  // 1. BotID. The level must match the one in instrumentation-client.ts.
  const verification = await checkBotId({ advancedOptions: { checkLevel: "basic" } });
  if (verification.isBot) {
    return refuse(403, "We couldn't verify your browser.");
  }

  // 2. Only our own pages may ask.
  const fromOurSite = isFromOurSite({
    fetchSite: request.headers.get("sec-fetch-site"),
    origin: request.headers.get("origin"),
    host: request.headers.get("host"),
  });
  if (!fromOurSite) {
    return refuse(403, "This request did not come from our site.");
  }

  // 3. Turn away an oversized body before reading it. A little room is left for
  //    the JSON around the HTML; the exact size is checked again below.
  const declaredSize = Number(request.headers.get("content-length") ?? 0);
  if (declaredSize > MAX_HTML_BYTES + 100_000) {
    return refuse(413, "This document is too large to download as a PDF.");
  }

  // 4. Read and validate the body.
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return refuse(400, "The request was not valid.");
  }
  const parsed = parsePdfRequest(body);
  if (!parsed.ok) {
    return refuse(parsed.status, parsed.message);
  }

  // 5. Print it.
  try {
    const pdf = await renderPdf(parsed.value.html);
    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": contentDisposition(parsed.value.filename),
        "Cache-Control": "no-store", // a result is personal; never cache it
      },
    });
  } catch (error) {
    if (error instanceof PdfBusyError) {
      return refuse(503, "The PDF service is busy. Please try again in a moment.");
    }
    console.error("PDF generation failed:", error);
    return refuse(500, "We couldn't create the PDF.");
  }
}
