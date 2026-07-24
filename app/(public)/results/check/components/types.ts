// ─────────────────────────────────────────────────────────────────────────────
// templates/types.ts
//
// Every result-template component (junior, senior, fallback, and any future
// additions) accepts this same shape. Consumers upstream — the /results
// preview panel, the broadsheet's "print student results" flow, or any
// future caller — assemble a `ResultTemplateProps` and hand it to the
// component picked from the registry.
//
// The `config` field mirrors ResultTemplate.config on the backend and is
// deliberately typed as `Record<string, unknown>`. Templates that want to
// consume specific keys should narrow it themselves (e.g. destructure and
// validate `accent`, `show_photo`, etc.) rather than assuming the shape.
// ─────────────────────────────────────────────────────────────────────────────

import type { StudentResultResponse } from "./results";

export interface ResultTemplateProps {
  /**
   * The full check-result payload for a single student. Templates render
   * everything they need directly from this — subjects, behaviours, skills,
   * academic context, grading legends, and cognitive units all come from
   * inside `result` (specifically `result.arm.*`).
   */
  result: StudentResultResponse;

  /**
   * Free-form per-template configuration. Backend-driven via
   * `arm.result_template.config`. Templates may read known keys (e.g.
   * `accent`, `show_photo`) and MUST tolerate absence gracefully.
   */
  config?: Record<string, unknown>;

  /**
   * Ref forwarded to the printable A4 page root. The preview panel attaches
   * it so html2canvas can rasterise exactly the right node. Optional
   * because in-app previews (e.g. broadsheet inline student view) may
   * render the template without any print/PDF flow attached.
   */
  printRef?: React.Ref<HTMLDivElement>;
}
