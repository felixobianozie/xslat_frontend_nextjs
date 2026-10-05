"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Policiestab.tsx
//
// The School Policies tab: school settings and the result PIN policy, each its own
// form with its own Save button. Both forms read their server-fetched data
// from ConfigurationsProvider.
// ─────────────────────────────────────────────────────────────────────────────

import PinPolicy from "./Pinpolicy";
import SchoolSettingsPolicy from "./Schoolsettingspolicy";

export default function PoliciesTab() {
  return (
    <div className="flex flex-col gap-20 pb-10">
      <SchoolSettingsPolicy />
      <PinPolicy />
    </div>
  );
}
