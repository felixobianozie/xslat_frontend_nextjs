// ─────────────────────────────────────────────────────────────────────────────
// Staffstatusbadge.tsx
//
// A staff member's status as a small coloured pill, shared by the staff list
// and the staff profile. Active and inactive staff are still part of the
// school; the other four statuses have left.
// ─────────────────────────────────────────────────────────────────────────────

import { STAFF_STATUS_BADGES, STAFF_STATUS_LABELS } from "../staffstatus";

export default function StaffStatusBadge({ status }: { status: StaffStatus }) {
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${STAFF_STATUS_BADGES[status]}`}
    >
      {STAFF_STATUS_LABELS[status]}
    </span>
  );
}
