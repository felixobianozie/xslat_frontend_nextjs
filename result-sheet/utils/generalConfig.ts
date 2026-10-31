import { DEFAULT_ACCENT, type Accent } from "./accent";

// The options a school can set on GeneralDefaultA4V1, through the `config` of its
// result template. Every key is optional, and a missing or invalid value falls
// back to the default, so a mistyped config never breaks a sheet.
//
//   accent         "neutral" (default) | "indigo" | "violet"
//   show_position  shown by default; only a real `false` hides it
//   grade_summary  "band" (default: its own band above the cognitive table) |
//                  "footer" (a row at the foot of the cognitive table)

export type GradeSummaryPlacement = "band" | "footer";

export interface GeneralConfig {
  accent: Accent;
  showPosition: boolean;
  gradeSummary: GradeSummaryPlacement;
}

const ACCENT_VALUES: readonly string[] = ["neutral", "indigo", "violet"];

export function parseGeneralConfig(
  config: Record<string, unknown> | null | undefined,
): GeneralConfig {
  const source = config ?? {};
  const accent = source.accent;
  return {
    accent:
      typeof accent === "string" && ACCENT_VALUES.includes(accent)
        ? (accent as Accent)
        : DEFAULT_ACCENT,
    showPosition: source.show_position !== false,
    gradeSummary: source.grade_summary === "footer" ? "footer" : "band",
  };
}
