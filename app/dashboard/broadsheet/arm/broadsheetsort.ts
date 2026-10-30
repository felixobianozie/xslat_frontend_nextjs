// ─────────────────────────────────────────────────────────────────────────────
// broadsheetsort.ts
//
// How the broadsheet's students can be ordered, shared by the three tables
// and the printout so they always agree.
//
//   default         The roster's own order (males, then females, then others,
//                   then by name). Nothing is re-ordered.
//   total_desc      Highest overall total first.
//   total_asc       Lowest overall total first.
//   gender_male     Males, then females, then others.
//   gender_female   Females, then males, then others.
//
// "Overall total" is the total shown in the open table: the academic overall
// total on the cognitive table and the printout, and the behaviour or skill
// total on the affective and psychomotor tables. Each table passes its own.
//
// A tie, such as two students on the same total or the same gender, keeps the
// roster order, so the result is the same on every render. A student with no
// total yet is always placed last, whichever way the totals are sorted.
// ─────────────────────────────────────────────────────────────────────────────

export type BroadsheetSort =
  | "default"
  | "total_desc"
  | "total_asc"
  | "gender_male"
  | "gender_female";

export const DEFAULT_BROADSHEET_SORT: BroadsheetSort = "default";

export const BROADSHEET_SORT_OPTIONS: { value: BroadsheetSort; label: string }[] =
  [
    { value: "default", label: "Default order" },
    { value: "total_desc", label: "Overall total: high to low" },
    { value: "total_asc", label: "Overall total: low to high" },
    { value: "gender_male", label: "Gender: males first" },
    { value: "gender_female", label: "Gender: females first" },
  ];

export function sortStudents<T extends { id: string; gender?: string }>(
  students: T[],
  sort: BroadsheetSort,
  totals: Record<string, number | undefined>,
): T[] {
  if (sort === "default") return students;

  // Where each student sits in the roster, to settle ties.
  const rosterPosition = new Map(students.map((s, index) => [s.id, index]));
  const byRoster = (a: T, b: T) =>
    (rosterPosition.get(a.id) ?? 0) - (rosterPosition.get(b.id) ?? 0);

  if (sort === "total_desc" || sort === "total_asc") {
    const direction = sort === "total_desc" ? -1 : 1;
    return [...students].sort((a, b) => {
      const totalA = totals[a.id];
      const totalB = totals[b.id];
      if (totalA === undefined && totalB === undefined) return byRoster(a, b);
      if (totalA === undefined) return 1;
      if (totalB === undefined) return -1;
      return (totalA - totalB) * direction || byRoster(a, b);
    });
  }

  const rank: Record<string, number> =
    sort === "gender_male" ? { M: 0, F: 1, O: 2 } : { F: 0, M: 1, O: 2 };
  const rankOf = (student: T) => rank[student.gender ?? ""] ?? 3;
  return [...students].sort(
    (a, b) => rankOf(a) - rankOf(b) || byRoster(a, b),
  );
}
