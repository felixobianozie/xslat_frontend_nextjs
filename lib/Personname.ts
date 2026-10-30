/**
 * How a person is written, and found, across the app.
 *
 *   personName          Last name, first name, then middle name ("Obi Ada
 *                       Grace"), with no comma. Any part that is missing or
 *                       blank is left out, so there is never a gap or the word
 *                       "undefined".
 *   matchesPersonSearch Whether a person matches what is typed in a search box,
 *                       for lists that filter in the browser.
 *
 * Both work for any record that carries the three name parts: a student, a
 * staff member's user, a join request's user. The middle name is optional,
 * because some endpoints do not send it.
 */

export interface PersonNameParts {
  first_name: string;
  middle_name?: string | null;
  last_name: string;
}

export function personName(person: PersonNameParts): string {
  return [person.last_name, person.first_name, person.middle_name]
    .filter((part) => part && part.trim())
    .join(" ");
}

/**
 * Search by words, in any order: every word typed must appear somewhere in the
 * person's name or public ID (case-insensitive, partial), so "ada obi" and
 * "obi ada" both find Obi Ada. A blank search matches everyone.
 *
 * This is the same rule the staff, student and user lists apply on the server,
 * so a search behaves the same wherever it is typed.
 */
export function matchesPersonSearch(
  person: PersonNameParts & { public_id?: string | null },
  query: string,
): boolean {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;

  const searchable = `${personName(person)} ${person.public_id ?? ""}`.toLowerCase();
  return words.every((word) => searchable.includes(word));
}
