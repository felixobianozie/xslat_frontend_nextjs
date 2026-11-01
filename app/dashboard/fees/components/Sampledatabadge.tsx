// ─────────────────────────────────────────
// app/dashboard/fees/components/Sampledatabadge.tsx
//
// Tells the reader that the figures on the page are examples. Removed from the
// pages when the fees pages run on real data.
// ─────────────────────────────────────────

import { FlaskConical } from "lucide-react";

export default function SampleDataBadge() {
  return (
    <span
      title="The figures on this page are examples. They are not real payments."
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700"
    >
      <FlaskConical size={12} aria-hidden="true" />
      Sample data
    </span>
  );
}
