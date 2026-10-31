// ──────────────────────────────────────────
// broadsheetteachers.ts
//
// The logic behind the Teachers section of the broadsheet page (see
// components/BroadsheetTeachers.tsx): how a teacher's name is written, and how
// the subjects and their teachers are arranged for display. Plain functions, so
// they can be tested without rendering.
// ──────────────────────────────────────────

import { personName } from "@/lib/Personname";

// One subject of the arm with the names of the teachers who take it.
export interface SubjectTeacherRow {
  id: string;
  name: string;
  abbr: string;
  teachers: string[];
}

// A teacher's name as the rest of the app writes a person: last name, first
// name, then middle name. Null when there is no teacher, or the record carries
// no name, so the caller can show "Not assigned".
export function teacherDisplayName(
  teacher: ArmTeacher | null | undefined,
): string | null {
  const user = teacher?.staff_profile?.user;
  if (!user) return null;
  return personName(user) || null;
}

// The two letters on a teacher's badge: the first letters of the last and first
// name, in the order the name is written.
export function teacherInitials(teacher: ArmTeacher | null | undefined): string {
  const user = teacher?.staff_profile?.user;
  if (!user) return "";
  return [user.last_name, user.first_name]
    .map((part) => part?.trim().charAt(0).toUpperCase() ?? "")
    .join("");
}

// The arm's subjects with their teachers' names.
//   - Subjects are in alphabetical order by name, the same order as the columns
//     of the cognitive table.
//   - Each subject's teachers are in alphabetical order by displayed name, and
//     a name is listed once.
//   - Only the subject-arm rows of this arm count, so a list that also carried
//     other arms would not leak their teachers in.
//   - A subject nobody takes has an empty `teachers` list.
export function buildSubjectTeacherRows(
  subjects: ArmSubject[],
  armId: string,
): SubjectTeacherRow[] {
  return subjects
    .map((subject) => {
      const names = subject.subject_arms
        .filter((subjectArm) => subjectArm.arm?.id === armId)
        .flatMap((subjectArm) => subjectArm.teachers)
        .map(teacherDisplayName)
        .filter((name): name is string => name !== null);
      return {
        id: subject.id,
        name: subject.definition.name,
        abbr: subject.definition.abbr,
        teachers: Array.from(new Set(names)).sort((a, b) => a.localeCompare(b)),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

// How many of the rows have no teacher.
export function countWithoutTeacher(rows: SubjectTeacherRow[]): number {
  return rows.filter((row) => row.teachers.length === 0).length;
}
