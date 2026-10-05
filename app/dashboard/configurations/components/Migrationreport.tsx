"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Migrationreport.tsx
//
// Shows what a term migration did (the `data` of POST term/migrate/): how much
// was created, then every item the admin should review.
//
// Sections that have nothing to report are left out. The backend advises
// reviewing everything in "Created automatically", because those names and
// settings are copies of the source and may not match the school's intent.
// ─────────────────────────────────────────────────────────────────────────────

import type { ReactNode } from "react";

import type { MigrationReportData } from "@/types/configurations";
import { PublicationNotice } from "./Configui";

// "no_matching_arm" → "no matching arm"
function readable(text: string): string {
  return text.replace(/_/g, " ");
}

function ReportSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-slate-700 mb-2">{title}</h3>
      <ul className="flex flex-col gap-1.5 text-[11px] text-slate-600">
        {children}
      </ul>
    </div>
  );
}

export default function MigrationReport({
  report,
}: {
  report: MigrationReportData;
}) {
  const counts: { label: string; value: number }[] = [
    { label: "Sections", value: report.sections_created },
    { label: "Levels", value: report.levels_created },
    { label: "Arms", value: report.arms_created },
    { label: "Subjects", value: report.subjects_created },
    { label: "Subject arms", value: report.subject_arms_created },
    { label: "Enrollments", value: report.enrollments_created },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PublicationNotice>
        Migration completed. Review the items below before you continue.
      </PublicationNotice>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {counts.map((count) => (
          <div
            key={count.label}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5"
          >
            <p className="text-lg font-bold text-slate-800">{count.value}</p>
            <p className="text-[11px] text-slate-500">{count.label} created</p>
          </div>
        ))}
      </div>

      {report.auto_created.length > 0 && (
        <ReportSection title="Created automatically (please review)">
          {report.auto_created.map((item, index) => (
            <li key={index}>
              <span className="font-medium">{item.name}</span> ({item.kind}) in{" "}
              {item.parent_label}, copied from {item.source_label} —{" "}
              {readable(item.reason)}
            </li>
          ))}
        </ReportSection>
      )}

      {report.unmigrated_students.length > 0 && (
        <ReportSection title="Students not migrated">
          {report.unmigrated_students.map((item) => (
            <li key={item.student_id}>
              <span className="font-medium">{item.student_name}</span> (
              {item.source_arm_label}) — {readable(item.reason)}
            </li>
          ))}
        </ReportSection>
      )}

      {report.repeated_students.length > 0 && (
        <ReportSection title="Students repeating their level">
          {report.repeated_students.map((item) => (
            <li key={item.student_id}>
              <span className="font-medium">{item.student_name}</span> from{" "}
              {item.source_arm_label} to {item.destination_arm_label}
            </li>
          ))}
        </ReportSection>
      )}

      {report.dropped_staff_fks.length > 0 && (
        <ReportSection title="Staff assignments not copied">
          {report.dropped_staff_fks.map((item, index) => (
            <li key={index}>
              {item.arm_label} — {readable(item.role)}
              {item.subject_name ? ` (${item.subject_name})` : ""}:{" "}
              {readable(item.reason)}
            </li>
          ))}
        </ReportSection>
      )}

      {report.dropped_subject_exclusions.length > 0 && (
        <ReportSection title="Subject exclusions not copied">
          {report.dropped_subject_exclusions.map((item, index) => (
            <li key={index}>
              {item.student_name} — {item.subject_name}:{" "}
              {readable(item.reason)}
            </li>
          ))}
        </ReportSection>
      )}

      {report.notes.length > 0 && (
        <ReportSection title="Notes">
          {report.notes.map((note, index) => (
            <li key={index}>{note}</li>
          ))}
        </ReportSection>
      )}
    </div>
  );
}
