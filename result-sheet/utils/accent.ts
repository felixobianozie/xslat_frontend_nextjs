// The accent colour of a result sheet. A sheet is drawn in one accent, and each
// accent is a full set of Tailwind classes written out in this file, so the
// build can see every one of them (class names built from pieces at runtime
// would be dropped).
//
//   neutral  slate. The default: it prints cleanly in black and white.
//   indigo   the look of JuniorDefaultA4V1.
//   violet   the look of SeniorDefaultA4V1.
//
// The role names say which Tailwind class each entry is, for the indigo set:
// bg900 is bg-indigo-900, text900Soft is text-indigo-900/70, and so on.

export type Accent = "neutral" | "indigo" | "violet";

export const DEFAULT_ACCENT: Accent = "neutral";

export interface AccentClasses {
  bg900: string;
  bg50: string;
  text900: string;
  text900Soft: string;
  border200: string;
  border500: string;
  border900: string;
}

export const ACCENTS: Record<Accent, AccentClasses> = {
  neutral: {
    bg900: "bg-slate-900",
    bg50: "bg-slate-50",
    text900: "text-slate-900",
    text900Soft: "text-slate-900/70",
    border200: "border-slate-200",
    border500: "border-slate-500",
    border900: "border-slate-900",
  },
  indigo: {
    bg900: "bg-indigo-900",
    bg50: "bg-indigo-50",
    text900: "text-indigo-900",
    text900Soft: "text-indigo-900/70",
    border200: "border-indigo-200",
    border500: "border-indigo-500",
    border900: "border-indigo-900",
  },
  violet: {
    bg900: "bg-violet-900",
    bg50: "bg-violet-50",
    text900: "text-violet-900",
    text900Soft: "text-violet-900/70",
    border200: "border-violet-200",
    border500: "border-violet-500",
    border900: "border-violet-900",
  },
};
