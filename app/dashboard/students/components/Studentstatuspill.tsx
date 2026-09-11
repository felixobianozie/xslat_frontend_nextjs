"use client";

// ─────────────────────────────────────────────────────────────────────────────
// StudentStatusPill.tsx
//
// Colored pill rendering a student portfolio's status. One config entry per
// value of the backend StudentPortfolio.STATUS enum (9 variants across the
// active and inactive families). Missing or unknown values fall back to a
// neutral "Unknown" pill so callers don't need to null-check and a data
// oddity stays visible rather than silently rendering blank.
//
// The label helper is exported separately so plain-text consumers — the
// print template, exports, tooltips — can reuse the same "Transferred Out"
// / "Transferred In" formatting without spinning up a React tree.
// ─────────────────────────────────────────────────────────────────────────────

// Full set of status values a StudentPortfolio can hold. Kept in sync with
// StudentPortfolio.status in types/student.d.ts, which mirrors the backend
// StudentPortfolio.STATUS enum.
type StudentStatus = StudentPortfolio["status"];

interface StatusConfig {
  label: string;
  pillClasses: string;
}

// Per-status label + colour classes. Palette is chosen for scannability
// in the list view:
//   emerald → active / currently enrolled
//   slate   → neutral baseline (inactive)
//   sky     → graduated (positive academic outcome)
//   amber   → withdrawn (voluntary departure)
//   orange  → suspended (temporary disciplinary)
//   red     → expelled (permanent disciplinary)
//   violet  → transferred in (new arrival)
//   indigo  → transferred out (moved elsewhere)
//   yellow  → probation (watch-list)
// Colours line up with the semantic groupings the Leavers card uses on the
// student stats bar, so the same status reads the same across the feature.
const STATUS_CONFIG: Record<StudentStatus, StatusConfig> = {
  active: {
    label: "Active",
    pillClasses: "bg-emerald-50 text-emerald-700",
  },
  inactive: {
    label: "Inactive",
    pillClasses: "bg-slate-100 text-slate-600",
  },
  graduated: {
    label: "Graduated",
    pillClasses: "bg-sky-50 text-sky-700",
  },
  withdrawn: {
    label: "Withdrawn",
    pillClasses: "bg-amber-50 text-amber-700",
  },
  suspended: {
    label: "Suspended",
    pillClasses: "bg-orange-50 text-orange-700",
  },
  expelled: {
    label: "Expelled",
    pillClasses: "bg-red-50 text-red-700",
  },
  transferred_in: {
    label: "Transferred In",
    pillClasses: "bg-violet-50 text-violet-700",
  },
  transferred_out: {
    label: "Transferred Out",
    pillClasses: "bg-indigo-50 text-indigo-700",
  },
  probation: {
    label: "Probation",
    pillClasses: "bg-yellow-50 text-yellow-700",
  },
};

// Fallback pill for missing / unknown status. A visible "Unknown" pill
// surfaces data issues rather than hiding them behind an empty cell.
const UNKNOWN_CONFIG: StatusConfig = {
  label: "Unknown",
  pillClasses: "bg-slate-100 text-slate-500",
};

/**
 * Human-friendly label for a student portfolio status. Returns "Unknown"
 * when the input is missing or doesn't match a known variant. Kept as a
 * standalone export so plain-text consumers (print template, exports) can
 * render the same wording without instantiating the pill component.
 */
export function getStudentStatusLabel(
  status: StudentStatus | null | undefined,
): string {
  if (!status) return UNKNOWN_CONFIG.label;
  return STATUS_CONFIG[status]?.label ?? UNKNOWN_CONFIG.label;
}

interface StudentStatusPillProps {
  status: StudentStatus | null | undefined;
}

export default function StudentStatusPill({ status }: StudentStatusPillProps) {
  const cfg = (status && STATUS_CONFIG[status]) ?? UNKNOWN_CONFIG;
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap ${cfg.pillClasses}`}
    >
      {cfg.label}
    </span>
  );
}
