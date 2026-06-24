// ─────────────────────────────────────────────────────────────────────────────
// StaffPrintTemplate.tsx
//
// Hidden print-only template rendered off-screen and referenced by
// useReactToPrint in StaffList. Produces a clean table for browser printing.
//
// forwardRef is required so useReactToPrint can attach a ref to this DOM node.
// ─────────────────────────────────────────────────────────────────────────────

import { forwardRef } from "react";

const EMPLOYMENT_LABELS: Record<StaffPortfolio["employment"], string> = {
  FT: "Full-time",
  PT: "Part-time",
  TP: "Temporary",
  NYSC: "NYSC",
  NON: "—",
};

interface StaffPrintTemplateProps {
  portfolios: StaffPortfolio[];
}

const StaffPrintTemplate = forwardRef<HTMLDivElement, StaffPrintTemplateProps>(
  ({ portfolios }, ref) => {
    return (
      <div ref={ref} className="m-8">
        <h1 className="font-bold text-sm py-4 uppercase tracking-wide">
          Staff List — Lutheran High School, Obot Idim
        </h1>
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border border-gray-300 text-left h-8">
              <th className="px-3">S/N</th>
              <th className="px-3">Name</th>
              <th className="px-3">Staff ID</th>
              <th className="px-3">Type</th>
              <th className="px-3">Employment</th>
              <th className="px-3">Phone</th>
              <th className="px-3">Email</th>
              <th className="px-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {portfolios.map((portfolio, index) => {
              const { user } = portfolio.staff_profile;
              return (
                <tr
                  key={portfolio.id}
                  className={`h-9 border-b border-gray-200 ${index % 2 === 0 ? "bg-indigo-50" : ""}`}
                >
                  <td className="px-3">{index + 1}</td>
                  <td className="px-3">
                    {user.first_name} {user.last_name}
                  </td>
                  <td className="px-3 font-mono">{user.public_id}</td>
                  <td className="px-3">{portfolio.academic ? "Academic" : "Non-Academic"}</td>
                  <td className="px-3">{EMPLOYMENT_LABELS[portfolio.employment]}</td>
                  <td className="px-3">+{user.phone || "—"}</td>
                  <td className="px-3">{user.email || "—"}</td>
                  <td className="px-3 capitalize">{portfolio.status}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  },
);

StaffPrintTemplate.displayName = "StaffPrintTemplate";
export default StaffPrintTemplate;
