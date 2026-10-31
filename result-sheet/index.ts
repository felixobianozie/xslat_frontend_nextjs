// The public API of the result-sheet package. Code outside this folder imports
// only from here, never from its templates, components or utils, so what is
// behind it can be rearranged without touching a caller.
//
//   ResultSheet         one student's result, drawn with the arm's template.
//   ResultSheetViewer   the same, with Print and Download as PDF.
//   listResultTemplates the templates this build can draw, for a picker.
//   types               the StudentResultResponse a sheet draws, and the
//                       shapes it is built from.
//
// To give a sheet a result, build a StudentResultResponse from whatever the
// screen fetched (see the public check's resultcheck.ts for an example).

export { default as ResultSheet } from "./ResultSheet";
export { default as ResultSheetViewer } from "./ResultSheetViewer";
export { FALLBACK_TEMPLATE_KEY, listResultTemplates } from "./registry";
export type { ResultTemplateInfo } from "./registry";
export type * from "./types";
