// ─────────────────────────────────────────────────────────────────────────────
// StudentPrintTemplate.tsx
//
// Hidden print-only template rendered off-screen and referenced by
// useReactToPrint in StudentList. Produces a clean table for browser printing.
//
// forwardRef is required so useReactToPrint can attach a ref to this DOM node.
// ─────────────────────────────────────────────────────────────────────────────

import { forwardRef } from "react";

const GENDER_LABELS: Record<string, string> = {
  M: "Male",
  F: "Female",
  O: "Other",
};

// Display "JSS 1 A" — section + level + arm abbreviations.
function formatArm(arm: ClassArm | null): string {
  if (!arm) return "—";
  return `${arm.level.section.abbr} ${arm.level.abbr} ${arm.abbr}`;
}

interface StudentPrintTemplateProps {
  students: StudentRecord[];
}

const StudentPrintTemplate = forwardRef<
  HTMLDivElement,
  StudentPrintTemplateProps
>(({ students }, ref) => {
  return (
    <div ref={ref} className="m-8">
      <h1 className="font-bold text-sm py-4 uppercase tracking-wide">
        Student List — Lutheran High School, Obot Idim
      </h1>
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="border border-gray-300 text-left h-8">
            <th className="px-3">S/N</th>
            <th className="px-3">Name</th>
            <th className="px-3">Student ID</th>
            <th className="px-3">Gender</th>
            <th className="px-3">Class</th>
            <th className="px-3">Phone</th>
            <th className="px-3">Email</th>
            <th className="px-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student, index) => {
            // Pull the current-school portfolio for the status column
            const portfolio =
              student.portfolios.find((p) => p.current) ??
              student.portfolios[0];
            return (
              <tr
                key={student.id}
                className={`h-9 border-b border-gray-200 ${
                  index % 2 === 0 ? "bg-indigo-50" : ""
                }`}
              >
                <td className="px-3">{index + 1}</td>
                <td className="px-3">
                  {student.first_name} {student.last_name}
                </td>
                <td className="px-3 font-mono">{student.public_id}</td>
                <td className="px-3">{GENDER_LABELS[student.gender] ?? "—"}</td>
                <td className="px-3">{formatArm(student.current_arm)}</td>
                <td className="px-3">{student.phone || "—"}</td>
                <td className="px-3">{student.email || "—"}</td>
                <td className="px-3 capitalize">{portfolio?.status ?? "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
});

StudentPrintTemplate.displayName = "StudentPrintTemplate";
export default StudentPrintTemplate;
