"use client";

// ──────────────────────────────────────────
// pdf/client/Usepdfdownload.ts
//
// Downloads a printed page as a PDF. Any page can use it: give it the element
// that holds the printable page and a file name.
//
//   const { downloadPdf, isDownloading, error } = usePdfDownload();
//   downloadPdf({ node: printRef.current, filename: "Ada Obi.pdf" });
//
// It builds a self-contained document from the element (pdf/client/Printhtml.ts), sends
// it to POST /api/pdf through publicFetch, and saves the file that comes back.
// Failures are shown as a toast and also returned in `error`, in words that point
// the visitor to Print, which can always "Save as PDF".
// ──────────────────────────────────────────

import { useState } from "react";
import { toast } from "react-toastify";

import type { ApiError } from "@/lib/Handlefetcherrors";
import { buildPrintHtml } from "@/pdf/client/Printhtml";
import publicFetch from "@/lib/Publicfetch";

const PRINT_INSTEAD = "Use Print and choose Save as PDF instead.";

// What to tell the visitor for each way the download can fail.
export function pdfErrorMessage(error: Pick<ApiError, "status" | "message">): string {
  switch (error.status) {
    case 403:
      return `We couldn't verify your browser. ${PRINT_INSTEAD}`;
    case 413:
      return `This document is too large to download as a PDF. ${PRINT_INSTEAD}`;
    case 429:
      return "Too many downloads. Please wait a minute and try again.";
    case 503:
      return "The PDF service is busy. Please try again in a moment.";
    case undefined:
      return error.message; // no status means the network failed; its own message says so
    default:
      return `We couldn't create the PDF. ${PRINT_INSTEAD}`;
  }
}

// The name the file is saved under, in plain ASCII, always ending in .pdf. Some
// browsers ignore a download name that has accents or symbols in it and save the
// file as "download" with no extension, so "Ọlá Ṣadé — Third Term.pdf" is saved as
// "Ola Sade - Third Term.pdf". The visitor still gets a readable name.
export function toAsciiFilename(filename: string): string {
  const name = filename
    .replace(/\.pdf$/i, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // drop the accent marks: "Ọlá" becomes "Ola"
    .replace(/\s+/g, " ") // tabs, line breaks and odd spaces become one plain space
    .replace(/[^\x20-\x7e]/gu, "-") // any other character outside ASCII (an em dash, an emoji), one hyphen each
    .replace(/[\\/:*?"<>|]/g, "") // characters Windows does not allow in a file name
    .trim();
  return `${name || "document"}.pdf`;
}

// Saves a file the way a link with a download name would. The link is attached to
// the page for the click because some browsers ignore a click on a loose link.
function saveFile(file: Blob, filename: string): void {
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function usePdfDownload() {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function fail(message: string) {
    setError(message);
    toast.error(message);
  }

  async function downloadPdf({ node, filename }: { node: HTMLElement | null; filename: string }) {
    if (!node) {
      fail("Couldn't read the page to download. Please refresh and try again.");
      return;
    }

    setIsDownloading(true);
    setError(null);

    // baseURL "" sends this to our own /api/pdf route instead of the backend.
    const { data, error: apiError } = await publicFetch<Blob>("/api/pdf", {
      baseURL: "",
      method: "POST",
      body: { html: buildPrintHtml(node), filename },
      responseType: "blob",
    });

    setIsDownloading(false);

    if (apiError || !data) {
      fail(apiError ? pdfErrorMessage(apiError) : "We couldn't create the PDF.");
      return;
    }
    saveFile(data, toAsciiFilename(filename));
  }

  return { downloadPdf, isDownloading, error };
}
