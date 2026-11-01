// ──────────────────────────────────────────
// pdf/server/renderPdf.ts   (server only)
//
// Prints one self-contained HTML document to a PDF with a real Chromium, so the
// PDF is the page exactly as a browser would print it: the same CSS, the page
// size the template asks for with @page, and real, selectable text.
//
// Where Chromium comes from:
//   - On Vercel: the build that ships in @sparticuz/chromium.
//   - Locally: your own Chrome, whose path goes in CHROME_EXECUTABLE_PATH (the
//     Vercel build does not run on Windows or macOS).
//
// The document is untrusted input, so the browser is locked down: JavaScript is
// off and every request except data: URLs is blocked. The document must carry
// everything it needs (see pdf/client/Printhtml.ts), which also means it renders the
// same on a protected preview deployment.
// ──────────────────────────────────────────

import { readFile } from "node:fs/promises";
import path from "node:path";

import chromium from "@sparticuz/chromium";
import puppeteer, { type Browser } from "puppeteer-core";

// Thrown when this server instance is already printing as many PDFs as it can
// hold. Each Chromium needs a good share of the function's memory.
export class PdfBusyError extends Error {}

const MAX_AT_ONCE = 2;
let printingNow = 0;

// ── Fonts ────────────────────────────────────────────────────────────────
// The templates ask for Arial, which Vercel's Chromium does not have. Arimo is
// an open-licence font with the same letter widths as Arial, so mapping the name
// "Arial" to it keeps the PDF laid out exactly like the page the visitor sees.
// The files are read once and embedded in the document as data: URLs.
let fontCss: Promise<string> | undefined;

function loadFontCss(): Promise<string> {
  fontCss ??= (async () => {
    const dir = path.join(process.cwd(), "pdf", "fonts");
    const face = async (file: string, style: "normal" | "italic") => {
      const data = (await readFile(path.join(dir, file))).toString("base64");
      return `@font-face{font-family:"Arial";font-style:${style};font-weight:400 700;src:url(data:font/ttf;base64,${data}) format("truetype");}`;
    };
    return (await face("arimo.ttf", "normal")) + (await face("arimo-italic.ttf", "italic"));
  })();
  return fontCss;
}

// ── Browser ──────────────────────────────────────────────────────────────

async function launchBrowser(): Promise<Browser> {
  if (process.env.VERCEL) {
    chromium.setGraphicsMode = false; // no WebGL needed for a printout
    return puppeteer.launch({
      args: await puppeteer.defaultArgs({ args: chromium.args, headless: "shell" }),
      executablePath: await chromium.executablePath(),
      headless: "shell",
    });
  }

  const executablePath = process.env.CHROME_EXECUTABLE_PATH;
  if (!executablePath) {
    throw new Error("Set CHROME_EXECUTABLE_PATH to your local Chrome to create PDFs in development.");
  }
  return puppeteer.launch({
    executablePath,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"], // local development only
  });
}

// ── The PDF ──────────────────────────────────────────────────────────────

// Returns the PDF for a complete HTML document (one that has a <head>).
export async function renderPdf(html: string): Promise<Uint8Array> {
  if (printingNow >= MAX_AT_ONCE) throw new PdfBusyError();
  printingNow++;

  let browser: Browser | undefined;
  try {
    browser = await launchBrowser();
    const page = await browser.newPage();
    page.setDefaultTimeout(20_000);

    // Lock the page down before any content is loaded.
    await page.setJavaScriptEnabled(false);
    await page.setRequestInterception(true);
    page.on("request", (request) => {
      if (request.url().startsWith("data:")) request.continue();
      else request.abort();
    });

    // Print rules apply while measuring, so the layout is the printed layout.
    await page.emulateMediaType("print");

    // The fonts go first in <head>, so the page's own CSS can still override them.
    const fonts = await loadFontCss();
    const fullPage = html.replace(/<head[^>]*>/i, (head) => `${head}<style>${fonts}</style>`);

    // Once the page has loaded, wait for the network to go quiet, so the embedded
    // images and fonts have been decoded before the PDF is taken.
    await page.setContent(fullPage, { waitUntil: "load" });
    await page.waitForNetworkIdle({ idleTime: 300 });

    // The template's own @page size wins; A4 is the fallback.
    return await page.pdf({ preferCSSPageSize: true, format: "A4", printBackground: true });
  } finally {
    printingNow--;
    await browser?.close(); // always, or a failed print would leave Chromium running
  }
}
