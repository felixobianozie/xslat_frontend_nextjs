"use client";

// ─────────────────────────────────────────────────────────────────────────────
// PrintableBroadsheet.tsx
//
// Print-only version of the cognitive broadsheet, sized for A4 landscape.
// The on-screen broadsheet is fine for review, but printing it directly
// produces poor results — too many columns on one page, no headings,
// repeated body rows when the table wraps. This template solves all three
// by paginating subjects across multiple printable sheets.
//
// How pagination works:
//   - SUBJECTS_PER_PAGE controls how many subject columns fit on one page.
//     With a typical CA1/CA2/EXAM unit set + a TOTAL + a GRADE per subject,
//     5 subjects per page keeps the table within A4 landscape comfortably.
//   - Each page starts with a fresh table header so the printout reads
//     naturally page-by-page.
//   - `break-before-page` puts a Tailwind-driven page break between sheets.
//
// react-to-print integration:
//   The parent (BroadsheetDetail) forwards a ref into this component via
//   `forwardRef`, so it can hand the same ref to useReactToPrint without
//   needing a wrapping div.
// ─────────────────────────────────────────────────────────────────────────────

import { forwardRef, Fragment, useMemo } from "react";

import { useBroadsheetDetails } from "../context/BroadsheetDetailsProvider";

// How many subjects to show per printed page. Tweak alongside the
// per-cell padding if you ever change the unit count.
const SUBJECTS_PER_PAGE = 5;

const PrintableBroadsheet = forwardRef<HTMLDivElement>(function PrintableBroadsheet(
  _props,
  ref,
) {
  const { arm, students, subjects, classResult } = useBroadsheetDetails();

  // Ordered units + subjects — same logic as the on-screen view.
  const units = useMemo(() => {
    const list = arm?.cognitive_assessment_format?.units ?? [];
    return [...list].sort((a, b) => a.display_order - b.display_order);
  }, [arm?.cognitive_assessment_format]);

  const orderedSubjects = useMemo(() => {
    return [...subjects].sort((a, b) =>
      a.definition.name.localeCompare(b.definition.name),
    );
  }, [subjects]);

  // Split subjects into chunks of SUBJECTS_PER_PAGE so each page covers a
  // bounded number of columns. The last page also carries the class-wide
  // summary columns.
  const subjectPages = useMemo(() => {
    const pages: ArmSubject[][] = [];
    for (let i = 0; i < orderedSubjects.length; i += SUBJECTS_PER_PAGE) {
      pages.push(orderedSubjects.slice(i, i + SUBJECTS_PER_PAGE));
    }
    return pages;
  }, [orderedSubjects]);

  // Don't render anything if the data isn't ready or the arm has no
  // subjects/units. (react-to-print will simply produce a blank sheet.)
  if (!arm || units.length === 0 || orderedSubjects.length === 0) {
    return <div ref={ref} />;
  }

  const headerLabel = `${arm.level.section.abbr} ${arm.level.abbr} ${arm.abbr} — ${
    arm.level.section.term?.name ?? "Term"
  } Term Broadsheet`;

  return (
    <div ref={ref} className="text-[10px] text-black">
      {subjectPages.map((pageSubjects, pageIndex) => {
        const isLastPage = pageIndex === subjectPages.length - 1;

        return (
          <div
            key={pageIndex}
            // Tailwind's print page break utility — second and subsequent
            // pages start on a fresh sheet.
            className={pageIndex > 0 ? "break-before-page" : ""}
          >
            {/* Page title — repeats on every printed sheet. */}
            <div className="text-center font-bold text-sm mb-2">
              {headerLabel}
              {subjectPages.length > 1 && (
                <span className="text-[10px] font-normal text-slate-500 ml-2">
                  (Page {pageIndex + 1} of {subjectPages.length})
                </span>
              )}
            </div>

            <table className="table-auto w-full border-collapse">
              <thead>
                <tr className="bg-indigo-900 text-white">
                  <th className="border border-indigo-900 px-1 py-1" rowSpan={2}>
                    SN
                  </th>
                  <th
                    className="border border-indigo-900 px-2 py-1 text-left"
                    rowSpan={2}
                  >
                    FULL NAME
                  </th>
                  {/* Bio columns appear only on page 1 to save horizontal
                      space on subsequent pages. The full name column is
                      kept on every page so each page is self-identifying. */}
                  {pageIndex === 0 && (
                    <>
                      <th
                        className="border border-indigo-900 px-1 py-1"
                        rowSpan={2}
                      >
                        ID
                      </th>
                      <th
                        className="border border-indigo-900 px-1 py-1"
                        rowSpan={2}
                      >
                        SEX
                      </th>
                    </>
                  )}

                  {/* Subject group headers — span all units + TOTAL + GRADE. */}
                  {pageSubjects.map((subject) => (
                    <th
                      key={subject.id}
                      colSpan={units.length + 2}
                      className="border border-indigo-900 px-1 py-1 text-center whitespace-nowrap"
                    >
                      {subject.definition.abbr || subject.definition.name}
                    </th>
                  ))}

                  {/* Summary columns appear on the LAST page only. */}
                  {isLastPage && (
                    <>
                      <th
                        className="border border-indigo-900 px-1 py-1"
                        rowSpan={2}
                      >
                        TOTAL
                      </th>
                      <th
                        className="border border-indigo-900 px-1 py-1"
                        rowSpan={2}
                      >
                        AVG
                      </th>
                      <th
                        className="border border-indigo-900 px-1 py-1"
                        rowSpan={2}
                      >
                        POS
                      </th>
                      <th
                        className="border border-indigo-900 px-1 py-1"
                        rowSpan={2}
                      >
                        DEC
                      </th>
                    </>
                  )}
                </tr>

                {/* Second header row — per-unit labels. */}
                <tr className="bg-indigo-900 text-white">
                  {pageSubjects.map((subject) => (
                    <Fragment key={`prn-hdr2-${subject.id}`}>
                      {units.map((unit) => (
                        <th
                          key={`${subject.id}-${unit.id}`}
                          className="border border-indigo-900 px-1 py-1 text-center"
                        >
                          {unit.abbr}
                        </th>
                      ))}
                      <th
                        key={`${subject.id}-total`}
                        className="border border-indigo-900 px-1 py-1 text-center"
                      >
                        T
                      </th>
                      <th
                        key={`${subject.id}-grade`}
                        className="border border-indigo-900 px-1 py-1 text-center"
                      >
                        G
                      </th>
                    </Fragment>
                  ))}
                </tr>
              </thead>

              <tbody>
                {students.map((student, rowIndex) => {
                  const studentResult = classResult.students[student.id];

                  // Compute the overall total across ALL subjects (not just
                  // the page's subset) so the summary on the last page is
                  // class-wide rather than page-wide.
                  const totalObtained = studentResult
                    ? Object.values(studentResult.subjects).reduce(
                        (sum, s) => sum + s.total,
                        0,
                      )
                    : 0;

                  return (
                    <tr
                      key={student.id}
                      className={rowIndex % 2 === 0 ? "bg-white" : "bg-slate-50"}
                    >
                      <td className="border border-slate-300 px-1 py-1 text-center">
                        {rowIndex + 1}
                      </td>
                      <td className="border border-slate-300 px-2 py-1 whitespace-nowrap">
                        {student.first_name} {student.last_name}
                      </td>
                      {pageIndex === 0 && (
                        <>
                          <td className="border border-slate-300 px-1 py-1 text-center whitespace-nowrap">
                            {student.public_id ?? "—"}
                          </td>
                          <td className="border border-slate-300 px-1 py-1 text-center">
                            {student.gender ?? "—"}
                          </td>
                        </>
                      )}

                      {pageSubjects.map((subject) => {
                        const subjectResult = studentResult?.subjects[subject.id];
                        return (
                          <Fragment key={`prn-${student.id}-${subject.id}-group`}>
                            {units.map((unit) => {
                              const raw =
                                subjectResult?.scores[unit.display_order];
                              return (
                                <td
                                  key={`${student.id}-${subject.id}-${unit.id}`}
                                  className="border border-slate-300 px-1 py-1 text-center"
                                >
                                  {raw === -1 ? "ABS" : (raw ?? "—")}
                                </td>
                              );
                            })}
                            <td
                              key={`${student.id}-${subject.id}-total`}
                              className="border border-slate-300 px-1 py-1 text-center font-semibold"
                            >
                              {subjectResult?.total ?? "—"}
                            </td>
                            <td
                              key={`${student.id}-${subject.id}-grade`}
                              className="border border-slate-300 px-1 py-1 text-center"
                            >
                              {subjectResult?.grade_symbol ?? "—"}
                            </td>
                          </Fragment>
                        );
                      })}

                      {isLastPage && (
                        <>
                          <td className="border border-slate-300 px-1 py-1 text-center font-semibold">
                            {totalObtained}
                          </td>
                          <td className="border border-slate-300 px-1 py-1 text-center">
                            {studentResult?.average.toFixed(2) ?? "—"}
                          </td>
                          <td className="border border-slate-300 px-1 py-1 text-center">
                            {studentResult?.position ?? "—"}
                          </td>
                          <td className="border border-slate-300 px-1 py-1 text-center">
                            {studentResult?.decision ?? "—"}
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
});

export default PrintableBroadsheet;
