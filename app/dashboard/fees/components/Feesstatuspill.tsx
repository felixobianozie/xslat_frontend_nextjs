// ─────────────────────────────────────────
// app/dashboard/fees/components/Feesstatuspill.tsx
//
// The small coloured label that says where a student stands on fees.
// ─────────────────────────────────────────

import type { FeeStatus } from "../fees";

export const STATUS_LABELS: Record<FeeStatus, string> = {
  cleared: "Cleared",
  partial: "Part-paid",
  owing: "Owing",
};

const STATUS_CLASSES: Record<FeeStatus, string> = {
  cleared: "border-emerald-100 bg-emerald-50 text-emerald-700",
  partial: "border-amber-100 bg-amber-50 text-amber-700",
  owing: "border-rose-100 bg-rose-50 text-rose-700",
};

export default function FeesStatusPill({ status }: { status: FeeStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-semibold ${STATUS_CLASSES[status]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {STATUS_LABELS[status]}
    </span>
  );
}
