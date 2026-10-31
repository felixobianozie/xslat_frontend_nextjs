"use client";

// ──────────────────────────────────────────
// BroadsheetTeachers.tsx
//
// Who teaches this arm, shown under the grading systems on the broadsheet page:
//
//   1. Class Teachers: the class teacher and the assistant class teacher, side
//      by side.
//   2. Subject Teachers: the arm's subjects, each with the teachers who take it,
//      in the same alphabetical order as the cognitive table's columns.
//
// Both headings, and the space between the sections, follow the grading
// reference above them: text-sm semibold slate-800 with mb-3 under a heading, and
// space-y-6 between sections.
//
// A teacher who is not assigned is shown as "Not assigned" in a dashed tile, not
// left blank, so a gap is easy to see. When some subjects have no teacher, the
// subject heading says how many.
//
// Everything comes from the page's context: `arm` carries the class teachers and
// `subjects` carries each subject's teachers, so there is no extra request. Only
// names are shown, never a teacher's email or phone. A teacher stays listed for as
// long as they are assigned, including one who has since left, because the data
// carries no marker for that.
//
// Mobile-first: one column on a phone, two for the class teachers from `sm`, and
// two then three for the subjects from `sm` and `lg`.
// ──────────────────────────────────────────

import { useMemo } from "react";

import {
  buildSubjectTeacherRows,
  countWithoutTeacher,
  teacherDisplayName,
  teacherInitials,
} from "../broadsheetteachers";
import { useBroadsheetDetails } from "../context/BroadsheetDetailsProvider";

export default function BroadsheetTeachers() {
  const { arm, armId, subjects, subjectsPending, subjectsIsError } =
    useBroadsheetDetails();

  const rows = useMemo(
    () => buildSubjectTeacherRows(subjects, armId),
    [subjects, armId],
  );

  if (!arm) return null;

  const withoutTeacher = countWithoutTeacher(rows);

  return (
    <section aria-label="Teachers" className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-slate-800 mb-3">
          Class Teachers
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <TeacherTile
            role="Class teacher"
            teacher={arm.class_teacher ?? null}
          />
          <TeacherTile
            role="Assistant class teacher"
            teacher={arm.ass_class_teacher ?? null}
          />
        </div>
      </div>

      <div>
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h3 className="text-sm font-semibold text-slate-800">
            Subject Teachers
          </h3>
          {!subjectsPending && !subjectsIsError && withoutTeacher > 0 && (
            <p className="text-[11px] font-medium text-amber-700">
              {withoutTeacher}{" "}
              {withoutTeacher === 1 ? "subject has" : "subjects have"} no
              teacher assigned
            </p>
          )}
        </div>

        {subjectsPending ? (
          <ul
            role="status"
            aria-busy="true"
            aria-label="Loading subject teachers"
            className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3"
          >
            {Array.from({ length: 6 }, (_, index) => (
              <li
                key={index}
                className="h-12 animate-pulse rounded-xl bg-slate-100"
              />
            ))}
          </ul>
        ) : subjectsIsError ? (
          <div
            role="alert"
            className="rounded-2xl border border-dashed border-rose-200 bg-rose-50 p-4 text-center text-xs text-rose-700"
          >
            Couldn&apos;t load the subject teachers.
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-xs text-slate-500">
            No subjects have been added to this arm yet.
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((row) => (
              <li
                key={row.id}
                className={`flex items-start justify-between gap-3 rounded-xl border px-3 py-2 ${
                  row.teachers.length > 0
                    ? "border-slate-200 bg-white"
                    : "border-dashed border-slate-300 bg-slate-50"
                }`}
              >
                <div className="min-w-0">
                  <p
                    className="truncate text-xs font-semibold text-slate-800"
                    title={row.name}
                  >
                    {row.name}
                  </p>
                  <p className="text-[10px] uppercase tracking-widest text-slate-400">
                    {row.abbr}
                  </p>
                </div>
                {row.teachers.length > 0 ? (
                  <div className="text-right text-xs text-slate-700">
                    {row.teachers.map((name) => (
                      <p key={name}>{name}</p>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs italic text-slate-400">Not assigned</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

// One class-teacher role: a badge with the teacher's initials and their name, or a
// dashed "Not assigned" tile when the role is empty.
function TeacherTile({
  role,
  teacher,
}: {
  role: string;
  teacher: ArmTeacher | null;
}) {
  const name = teacherDisplayName(teacher);
  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border px-3 py-2.5 ${
        name
          ? "border-indigo-100 bg-white"
          : "border-dashed border-slate-300 bg-slate-50"
      }`}
    >
      <span
        aria-hidden="true"
        className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
          name ? "bg-indigo-50 text-indigo-700" : "bg-slate-100 text-slate-400"
        }`}
      >
        {name ? teacherInitials(teacher) : "–"}
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          {role}
        </p>
        {name ? (
          <p className="truncate text-sm font-semibold text-slate-900">
            {name}
          </p>
        ) : (
          <p className="text-sm italic text-slate-400">Not assigned</p>
        )}
      </div>
    </div>
  );
}
