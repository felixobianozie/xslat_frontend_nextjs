// ─────────────────────────────────────────────────────────────────────────────
// staffaccess.ts
//
// The rules behind the Roles & Permissions panel on the Staff page, as plain
// functions with no React in them.
//
// The panel works in one of two modes at a time:
//
//   assign   the ticked roles and permissions are given to every selected
//            staff member. What a staff member already has stays as it is.
//   remove   the ticked roles and permissions are taken from every selected
//            staff member who holds them. Everything else stays as it is.
//
// The backend replaces a staff member's whole role list and whole permission
// list on every save, so the panel works out each staff member's final lists
// from their own current lists (applyChange) rather than sending one shared
// list to everybody.
// ─────────────────────────────────────────────────────────────────────────────

export type Mode = "assign" | "remove";

// How many of the staff hold the item. `holdings` has one list per staff
// member.
export function holderCount(item: string, holdings: string[][]): number {
  return holdings.filter((held) => held.includes(item)).length;
}

// One staff member's final list after the picked items are assigned to them or
// removed from them.
export function applyChange(
  current: string[],
  picked: string[],
  mode: Mode,
): string[] {
  if (mode === "assign") {
    return [...current, ...picked.filter((item) => !current.includes(item))];
  }
  return current.filter((item) => !picked.includes(item));
}

// True when both lists hold the same items, in any order.
export function sameItems(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sortedB = [...b].sort();
  return [...a].sort().every((item, index) => item === sortedB[index]);
}

// How many staff members would end up with a different list. The two lists
// per staff member are their roles and their direct permissions.
export function countStaffAffected(
  roleHoldings: string[][],
  pickedRoles: string[],
  permissionHoldings: string[][],
  pickedPermissions: string[],
  mode: Mode,
): number {
  return roleHoldings.filter((roles, index) => {
    const permissions = permissionHoldings[index] ?? [];
    return (
      !sameItems(roles, applyChange(roles, pickedRoles, mode)) ||
      !sameItems(permissions, applyChange(permissions, pickedPermissions, mode))
    );
  }).length;
}

// Splits a list into groups of at most `size`, so requests can run a few at a
// time.
export function inGroupsOf<T>(items: T[], size: number): T[][] {
  const groups: T[][] = [];
  for (let start = 0; start < items.length; start += size) {
    groups.push(items.slice(start, start + size));
  }
  return groups;
}
