// ─────────────────────────────────────────────────────────────────────────────
// /dashboard/broadsheet/arms/page.tsx
//
// Server entry point for the broadsheets list page. Renders a small heading
// stack and delegates the actual list rendering to BroadsheetsList — a
// client component that owns the React Query subscription and modals.
//
// Kept server-only on purpose: there's no per-user data here that benefits
// from a server-side prefetch (the page is one client query against a
// mock helper), so we just ship the wrapper and let the client component
// load its data.
// ─────────────────────────────────────────────────────────────────────────────

import type { Metadata } from "next";
import BroadsheetsList from "./components/BroadsheetsList";

export const metadata: Metadata = {
  title: "Broadsheets | Class Arms",
  description: "Review, approve, and revoke class arm broadsheets.",
};

export default function BroadsheetsListPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Manage Broadsheets</h1>
        <p className="text-sm text-slate-500 mt-1">
          Review each class arm's submitted results and approve or revoke them
          for the current term.
        </p>
      </div>

      <BroadsheetsList />
    </div>
  );
}
