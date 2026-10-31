// ──────────────────────────────────────────
// registry.ts
//
// Maps a backend `template_key` to the component that draws it. The backend
// owns the keys (a ResultTemplate row names one); this file owns what each key
// looks like.
//
// Resolution (see resolveTemplate):
//   1. A known key gets its template.
//   2. A missing key, or a key this build does not know, gets
//      GeneralDefaultA4V1. That is also what guards against the backend and the
//      frontend being deployed out of step: a reader still gets a complete
//      printable sheet.
//
// GeneralDefaultA4V1 is bundled with the sheet because it is the fallback. Every
// other template is loaded when its first sheet is drawn, so a page downloads
// only the template it shows, however many are added.
//
// Adding a template:
//   1. Write templates/<Name>.tsx implementing ResultTemplateProps.
//   2. Add one entry to TEMPLATES below.
//   3. Create a ResultTemplate row with that key in the dashboard.
// Keys are versioned (`junior-default-a4v1`) and a published layout is never
// edited in place: a changed layout is a new key, so a result already issued
// keeps drawing as it was issued.
// ──────────────────────────────────────────

import { lazy, type ElementType } from "react";

import GeneralDefaultA4V1 from "./templates/GeneralDefaultA4V1";
import type { ResultTemplateProps } from "./types";

export interface ResultTemplateInfo {
  key: string;
  label: string;
  description: string;
}

type TemplateEntry = ResultTemplateInfo & {
  component: ElementType<ResultTemplateProps>;
};

// The key of the fallback template, and the one to give a backend row that
// should use it.
export const FALLBACK_TEMPLATE_KEY = "general-default-a4v1";

const TEMPLATES: Record<string, TemplateEntry> = {
  [FALLBACK_TEMPLATE_KEY]: {
    key: FALLBACK_TEMPLATE_KEY,
    label: "General Default A4 v1",
    description:
      "The default sheet and the fallback. Its accent (neutral, indigo or violet), whether the position shows, and where the grade summary sits are set in its config.",
    component: GeneralDefaultA4V1,
  },
  "junior-default-a4v1": {
    key: "junior-default-a4v1",
    label: "Junior Default A4 v1",
    description:
      "Indigo accent, the position in the identity grid, the grade summary in the cognitive table's footer.",
    component: lazy(() => import("./templates/JuniorDefaultA4V1")),
  },
  "senior-default-a4v1": {
    key: "senior-default-a4v1",
    label: "Senior Default A4 v1",
    description:
      "Violet accent, no position, the grade summary as its own band above the cognitive table.",
    component: lazy(() => import("./templates/SeniorDefaultA4V1")),
  },
};

// `key in TEMPLATES` would also say yes to "constructor" and "toString", so the
// check is on the object's own keys.
export function isKnownTemplateKey(key: string | null | undefined): boolean {
  return !!key && Object.prototype.hasOwnProperty.call(TEMPLATES, key);
}

// The component for a key. Never returns null: an unknown or missing key gets
// the fallback, so the result can always be rendered.
export function resolveTemplate(
  key: string | null | undefined,
): ElementType<ResultTemplateProps> {
  return isKnownTemplateKey(key) ? TEMPLATES[key as string].component : GeneralDefaultA4V1;
}

// The templates this build can draw, for a screen that lets someone choose one.
export function listResultTemplates(): ResultTemplateInfo[] {
  return Object.values(TEMPLATES).map(({ key, label, description }) => ({
    key,
    label,
    description,
  }));
}
