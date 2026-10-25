// ─────────────────────────────────────────────────────────────────────────────
// staffstatus.ts
//
// How a staff member's status and employment type are named and coloured
// wherever staff are shown. The values are the backend's StaffPortfolio
// statuses and employment types. Active and inactive staff are the school's
// current staff; the other four statuses have left.
// ─────────────────────────────────────────────────────────────────────────────

// Every status, current staff first.
export const STAFF_STATUS_ORDER: StaffStatus[] = [
  "active",
  "inactive",
  "resigned",
  "retired",
  "terminated",
  "transferred",
];

export const STAFF_STATUS_LABELS: Record<StaffStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  resigned: "Resigned",
  retired: "Retired",
  terminated: "Terminated",
  transferred: "Transferred",
};

// Tailwind classes for the status badge (background and text colour).
export const STAFF_STATUS_BADGES: Record<StaffStatus, string> = {
  active: "bg-emerald-50 text-emerald-700",
  inactive: "bg-yellow-50 text-yellow-700",
  resigned: "bg-slate-100 text-slate-600",
  retired: "bg-blue-50 text-blue-700",
  terminated: "bg-red-50 text-red-600",
  transferred: "bg-indigo-50 text-indigo-700",
};

// Every status as the comma-separated value the staff list's `status`
// parameter takes. Sent when the list must include staff who have left,
// because the list shows only current staff when no status is sent.
export const ALL_STAFF_STATUSES = STAFF_STATUS_ORDER.join(",");

// The employment types, in the order they are offered. `NON` means no type has
// been set.
export const EMPLOYMENT_CHOICES: {
  value: StaffPortfolio["employment"];
  label: string;
}[] = [
  { value: "FT", label: "Full-time" },
  { value: "PT", label: "Part-time" },
  { value: "TP", label: "Temporary" },
  { value: "NYSC", label: "NYSC" },
  { value: "NON", label: "Not set" },
];
