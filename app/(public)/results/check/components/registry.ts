// ─────────────────────────────────────────────────────────────────────────────
// templates/registry.ts
//
// Central mapping from a backend-issued template_key to a frontend template
// component. Adding a new template is a two-line change: import the
// component and add a { key → component } entry to TEMPLATE_REGISTRY.
//
// Resolution rules (see resolveTemplate below):
//   1. If a template_key is provided AND matches a registry key, use that
//      component.
//   2. Otherwise fall back to FallbackTerminalReport, which is guaranteed
//      to render any StudentResultResponse without breaking on missing
//      config or unknown keys. This is the safety net that protects
//      /results from a backend/frontend deploy skew — the reader still
//      sees a usable printable report even if the arm's template hasn't
//      been added to this build yet.
//
// The registry lives at module scope (not in a hook or context) so it's
// evaluated once at import time and shared across every consumer — the
// /results preview, the broadsheet print-student-results flow, and any
// future caller.
// ─────────────────────────────────────────────────────────────────────────────

import type { ComponentType } from "react";

import type { ResultTemplateProps } from "./types";
import FallbackTerminalReport from "./FallbackTerminalReport";
import TerminalReportJuniorSecondary from "./TerminalReportJuniorSecondary";
import TerminalReportSeniorSecondary from "./TerminalReportSeniorSecondary";

// The registry itself. Keys MUST match the template_key values seeded on
// the backend's ResultTemplate rows for each active template. Rename here
// only when the backend seed changes.
export const TEMPLATE_REGISTRY: Record<
  string,
  ComponentType<ResultTemplateProps>
> = {
  "terminal-report-junior-secondary-v2": TerminalReportJuniorSecondary,
  "terminal-report-senior-secondary-v2": TerminalReportSeniorSecondary,
};

/**
 * Resolve a template component from a key.
 *
 * @param templateKey  The template_key string carried on
 *                     `result.arm.result_template.template_key`. May be
 *                     null/undefined when no template is assigned to the
 *                     arm — that case is handled the same as an unknown key.
 * @returns            The registered component if found; otherwise the
 *                     fallback component. Never returns null — callers can
 *                     always render the return value directly.
 */
export function resolveTemplate(
  templateKey: string | null | undefined,
): ComponentType<ResultTemplateProps> {
  if (!templateKey) return FallbackTerminalReport;
  return TEMPLATE_REGISTRY[templateKey] ?? FallbackTerminalReport;
}

// The set of template keys this build knows about — exposed for debugging
// UIs (e.g. a dev-only "template picker" toggle in the preview panel).
export const KNOWN_TEMPLATE_KEYS = Object.keys(TEMPLATE_REGISTRY);
