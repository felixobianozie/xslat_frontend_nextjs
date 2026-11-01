// ──────────────────────────────────────────
// pdf/client/Printhtml.ts   (client)
//
// Turns a printable element on the page into ONE complete, self-contained HTML
// document, which POST /api/pdf prints to a PDF with Chromium.
//
// Self-contained matters because the server's browser is locked down and has no
// network. So the document carries everything the element needs:
//   - the page's CSS, copied in as text;
//   - every loaded <img>, copied in as a data: URL.
//
// A <style> tag marked `data-pdf-exclude` is left out. Use it for rules that only
// make sense on the live page (the result viewer's print rules are one).
// ──────────────────────────────────────────

// All the CSS the page has, as one string. A stylesheet from another site cannot
// be read from script, so it is skipped.
function collectPageCss(): string {
  const css: string[] = [];
  for (const sheet of Array.from(document.styleSheets)) {
    const owner = sheet.ownerNode;
    if (owner instanceof Element && owner.hasAttribute("data-pdf-exclude")) continue;
    try {
      for (const rule of Array.from(sheet.cssRules)) css.push(rule.cssText);
    } catch {
      // cross-origin stylesheet: not readable, nothing to copy
    }
  }
  return css.join("\n");
}

// Replaces each image in `clone` with a data: URL of the same picture, taken from
// the matching image in `original` (which the browser has already loaded). An
// image that has not loaded is left alone: the template is showing its fallback.
function inlineImages(original: HTMLElement, clone: HTMLElement): void {
  const loaded = original.querySelectorAll("img");
  const copies = clone.querySelectorAll("img");

  loaded.forEach((img, index) => {
    if (!img.complete || img.naturalWidth === 0) return;
    try {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext("2d")?.drawImage(img, 0, 0);
      copies[index].src = canvas.toDataURL("image/png");
      // next/image gives the tag a srcset, which would win over the new src.
      copies[index].removeAttribute("srcset");
      copies[index].removeAttribute("sizes");
    } catch {
      // a picture from another site cannot be read back; leave it as it is
    }
  });
}

export function buildPrintHtml(node: HTMLElement): string {
  const clone = node.cloneNode(true) as HTMLElement;
  inlineImages(node, clone);

  return (
    "<!doctype html><html><head><meta charset=\"utf-8\">" +
    `<style>${collectPageCss()}</style>` +
    "<style>html,body{margin:0;padding:0}</style>" + // the template sets its own page margins
    `</head><body>${clone.outerHTML}</body></html>`
  );
}
