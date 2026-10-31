// Plain functions the result-sheet templates share. None of them touch React.

export function composeStudentName(
  first: string,
  middle: string | null,
  last: string,
): string {
  return [first, middle, last].filter(Boolean).join(" ");
}

// A school's full address on one line. Empty parts are left out, so a missing
// LGA or state does not leave a dangling comma.
export function composeSchoolAddress(school: {
  address: string | null;
  city: string | null;
  lga: string | null;
  state: string | null;
  country: string | null;
}): string {
  return [school.address, school.city, school.lga, school.state, school.country]
    .filter(Boolean)
    .join(", ");
}

// One score cell. A null score ("no record for this unit") prints as an empty
// cell, -1 (the backend's explicit "absent" marker) prints as "AB", and any
// other number prints as it is.
export function formatScore(score: number | null): string {
  if (score === null || score === undefined) return "—";
  if (score === -1) return "AB";
  return String(score);
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// The date a result sheet is issued, written like "24 Jul 2026".
//
// `value` is the moment the term's results were published, as the backend sends
// it (an ISO timestamp in UTC). The date printed is the calendar date in West
// Africa Time (Africa/Lagos, UTC+1), so every viewer sees the same date whatever
// their device's time zone: a result published at 12:30 am on 25 July WAT
// arrives as 23:30 UTC on 24 July and prints as "25 Jul 2026".
//
// When `value` is missing or not a valid date, today's date in WAT is used.
// `now` is only a parameter so that fallback can be tested.
export function formatIssueDate(
  value: string | null | undefined,
  now: Date = new Date(),
): string {
  const parsed = value ? new Date(value) : null;
  const moment = parsed && !Number.isNaN(parsed.getTime()) ? parsed : now;

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Lagos",
    day: "numeric",
    month: "numeric",
    year: "numeric",
  }).formatToParts(moment);
  const pick = (type: string) => parts.find((p) => p.type === type)?.value ?? "";

  // The day goes through Number() because en-GB pads it to two digits when the
  // month is numeric ("05"). The month is looked up in our own list because
  // locale data spells September "Sept" in some versions and "Sep" in others.
  return `${Number(pick("day"))} ${MONTHS[Number(pick("month")) - 1]} ${pick("year")}`;
}
