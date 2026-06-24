// ─────────────────────────────────────────────────────────────────────────────
// ArmPrintTemplate.tsx
//
// Hidden print-only template rendered off-screen and referenced by
// useReactToPrint in ArmList. Produces a clean table for browser printing.
//
// forwardRef is required so useReactToPrint can attach a ref to this DOM node.
// ─────────────────────────────────────────────────────────────────────────────

import { forwardRef } from "react";

interface ArmPrintTemplateProps {
  arms: ClassArm[];
}

// Formats an arm header for the print row — "JSS 1 ORNG" style.
function formatArm(arm: ClassArm): string {
  return `${arm.level.section.abbr} ${arm.level.abbr} ${arm.abbr}`;
}

// Formats a teacher's full name, or a dash when the role is unfilled.
function teacherName(teacher: ArmTeacher | null | undefined): string {
  if (!teacher) return "—";
  const u = teacher.staff_profile.user;
  return `${u.first_name} ${u.last_name}`;
}

const ArmPrintTemplate = forwardRef<HTMLDivElement, ArmPrintTemplateProps>(
  ({ arms }, ref) => {
    return (
      <div ref={ref} className="m-8">
        <h1 className="font-bold text-sm py-4 uppercase tracking-wide">
          Class Arms — {arms[0]?.level.section.term?.session.school.name ?? ""}
        </h1>
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border border-gray-300 text-left h-8">
              <th className="px-3">S/N</th>
              <th className="px-3">Class</th>
              <th className="px-3">Section</th>
              <th className="px-3">Class Teacher</th>
              <th className="px-3">Assistant</th>
              <th className="px-3">Order</th>
            </tr>
          </thead>
          <tbody>
            {arms.map((arm, index) => (
              <tr
                key={arm.id}
                className={`h-9 border-b border-gray-200 ${
                  index % 2 === 0 ? "bg-indigo-50" : ""
                }`}
              >
                <td className="px-3">{index + 1}</td>
                <td className="px-3">{formatArm(arm)}</td>
                <td className="px-3">{arm.level.section.name}</td>
                <td className="px-3">{teacherName(arm.class_teacher)}</td>
                <td className="px-3">{teacherName(arm.ass_class_teacher)}</td>
                <td className="px-3">{arm.display_order ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  },
);

ArmPrintTemplate.displayName = "ArmPrintTemplate";
export default ArmPrintTemplate;
