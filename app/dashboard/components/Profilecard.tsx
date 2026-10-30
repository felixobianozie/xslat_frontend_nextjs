// ─────────────────────────────────────────────────────────────────────────────
// Profilecard.tsx
//
// The building blocks the staff profile and the user profile pages share, so
// the two read as one set:
//
//   ProfileSection  A white card with a title, an optional description and an
//                   optional action (such as an Edit button) in its header.
//   DetailRow       One label and its value. The label sits above the value on
//                   a phone and beside it from sm up. An empty value shows "—".
//   VerifiedBadge   "Verified" or "Not verified", for an email or a phone.
//   displayName     "First Middle Last", leaving out what is empty.
//   joinAddress     An address on one line, leaving out what is empty.
//   formatProfileDate  A date as "5 Mar 2026", or "—" when there is none.
// ─────────────────────────────────────────────────────────────────────────────

import type { ReactNode } from "react";

export function ProfileSection({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-slate-800">{title}</h2>
          {description && (
            <p className="mt-0.5 text-xs text-slate-400">{description}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}

export function DetailRow({
  label,
  children,
}: {
  label: string;
  children?: ReactNode;
}) {
  const isEmpty =
    children === null ||
    children === undefined ||
    children === "" ||
    children === false;

  return (
    <div className="flex flex-col gap-0.5 py-2 sm:grid sm:grid-cols-3 sm:gap-4">
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className="min-w-0 wrap-break-word text-sm text-slate-800 sm:col-span-2">
        {isEmpty ? <span className="text-slate-300">—</span> : children}
      </dd>
    </div>
  );
}

export function VerifiedBadge({ verified }: { verified: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
        verified
          ? "bg-emerald-50 text-emerald-700"
          : "bg-amber-50 text-amber-700"
      }`}
    >
      {verified ? "Verified" : "Not verified"}
    </span>
  );
}

export function displayName(
  first: string,
  middle: string,
  last: string,
): string {
  return [first, middle, last].filter((part) => part.trim()).join(" ");
}

// An address as one line: "12 Example Road, Port Harcourt, Rivers, Nigeria".
// Returns an empty string when every part is empty, so DetailRow shows "—".
export function joinAddress(parts: string[]): string {
  return parts.filter((part) => part.trim()).join(", ");
}

export function formatProfileDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
