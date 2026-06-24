// ─────────────────────────────────────────────────────────────────────────────
// BroadsheetStatusBadge.tsx
//
// Small reusable pill that renders the broadsheet status with the right
// colour and icon. Kept here (next to the list) because the list and the
// detail header are the only two places that surface this status visually.
//
// Status mapping (from the backend Arm.broadsheet field):
//   - "none"      — grey "Not Submitted"
//   - "pending"   — amber "Pending Review"
//   - "approved"  — emerald "Approved"
//   - "revoked"   — red "Revoked"
// ─────────────────────────────────────────────────────────────────────────────

import { CheckCircle2, Clock, FileMinus, XCircle } from "lucide-react";

// All the broadsheet status values we render. `undefined` is treated as "none"
// so callers can pass `arm.broadsheet` directly without a fallback.
type BroadsheetStatus = ClassArm["broadsheet"] | undefined;

interface BroadsheetStatusBadgeProps {
  status: BroadsheetStatus;
  // Compact = smaller text + smaller padding. Used in dense rows; default
  // (false) is the bigger size used in headers.
  compact?: boolean;
}

// Visual config per status — colours, icon, label all live in one place so
// adding a new status later is a single-table change.
const STATUS_CONFIG = {
  none: {
    label: "Not Submitted",
    Icon: FileMinus,
    classes: "bg-slate-50 text-slate-600 border-slate-200",
  },
  pending: {
    label: "Pending Review",
    Icon: Clock,
    classes: "bg-amber-50 text-amber-800 border-amber-200",
  },
  approved: {
    label: "Approved",
    Icon: CheckCircle2,
    classes: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
  revoked: {
    label: "Revoked",
    Icon: XCircle,
    classes: "bg-red-50 text-red-700 border-red-200",
  },
} as const;

export default function BroadsheetStatusBadge({
  status,
  compact = false,
}: BroadsheetStatusBadgeProps) {
  // Normalise undefined to "none" so the lookup never falls through.
  const key = (status ?? "none") as keyof typeof STATUS_CONFIG;
  const { label, Icon, classes } = STATUS_CONFIG[key];

  // Compact variant uses smaller paddings for table-row density.
  const sizeClasses = compact
    ? "px-2 py-0.5 text-[10px] gap-1"
    : "px-2.5 py-1 text-xs gap-1.5";

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium whitespace-nowrap ${sizeClasses} ${classes}`}
      role="status"
      aria-label={`Broadsheet status: ${label}`}
    >
      <Icon size={compact ? 10 : 12} />
      {label}
    </span>
  );
}
