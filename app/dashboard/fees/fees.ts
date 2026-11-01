// ─────────────────────────────────────────
// app/dashboard/fees/fees.ts
//
// The rules the fees pages share: how money and dates are shown, how a
// student's balance and status are worked out, and how class and student lists
// are filtered and sorted. Plain functions only, so the same rules hold
// whether the data comes from the sample data or from an API.
// ─────────────────────────────────────────

import { matchesPersonSearch, personName } from "@/lib/Personname";

// ── Money, dates and percentages ────────────────────────────────────────────

const NAIRA = "\u20A6";

/** "1250000" → "1,250,000" */
export function groupDigits(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** 1250000 → "₦1,250,000" */
export function formatNaira(amount: number): string {
  const digits = groupDigits(Math.round(Math.abs(amount)).toString());
  return `${amount < 0 ? "-" : ""}${NAIRA}${digits}`;
}

/** The short form for small spaces: 24200000 → "₦24.2M", 120000 → "₦120K". */
export function formatNairaCompact(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";
  // Number(...) drops a trailing ".0", so 24.0 is shown as 24.
  const short = (value: number, unit: string) =>
    `${sign}${NAIRA}${Number(value.toFixed(1))}${unit}`;

  if (abs >= 1_000_000_000) return short(abs / 1_000_000_000, "B");
  if (abs >= 1_000_000) return short(abs / 1_000_000, "M");
  if (abs >= 1_000) return short(abs / 1_000, "K");
  return `${sign}${NAIRA}${Math.round(abs)}`;
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** "2026-02-12" → "12 Feb 2026". Read from the text, so no timezone shift. */
export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  return `${day} ${MONTHS[month - 1]} ${year}`;
}

/** Today's date on this device, as YYYY-MM-DD. */
export function todayIso(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

/**
 * A whole-number percentage. It never shows 100% until the whole amount is
 * there, and never shows 0% once something has been paid.
 */
export function percent(part: number, whole: number): number {
  if (whole <= 0) return 0;
  const rounded = Math.round((part / whole) * 100);
  if (part < whole && rounded >= 100) return 99;
  if (part > 0 && rounded === 0) return 1;
  return Math.min(100, rounded);
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod | "bulk", string> = {
  cash: "Cash",
  transfer: "Bank transfer",
  pos: "POS",
  cheque: "Cheque",
  online: "Online",
  bulk: "Marked as paid",
};

/** The methods a payment can be recorded with. */
export const PAYMENT_METHODS: PaymentMethod[] = [
  "cash",
  "transfer",
  "pos",
  "cheque",
  "online",
];

function sum<T>(list: T[], pick: (item: T) => number): number {
  return list.reduce((total, item) => total + pick(item), 0);
}

// ── One student ─────────────────────────────────────────────────────────────

export type FeeStatus = "cleared" | "partial" | "owing";

export interface StudentFeeTotals {
  /** This term's fees. */
  currentDue: number;
  currentPaid: number;
  /** What is still owed from earlier terms. */
  arrearsBalance: number;
  /** Everything the student owes: this term's unpaid fees plus arrears. */
  balance: number;
  /** Everything due and everything paid, arrears included. */
  due: number;
  paid: number;
  status: FeeStatus;
}

/**
 * cleared: nothing left to pay. partial: something is owed but a payment has
 * been made. owing: something is owed and nothing has been paid.
 */
export function studentTotals(student: StudentFees): StudentFeeTotals {
  const currentDue = sum(student.items, (item) => item.due);
  const currentPaid = sum(student.items, (item) => item.paid);
  const arrearsDue = sum(student.arrears, (arrear) => arrear.due);
  const arrearsPaid = sum(student.arrears, (arrear) => arrear.paid);

  const due = currentDue + arrearsDue;
  const paid = currentPaid + arrearsPaid;
  const balance = due - paid;

  let status: FeeStatus = "owing";
  if (balance <= 0) status = "cleared";
  else if (paid > 0) status = "partial";

  return {
    currentDue,
    currentPaid,
    arrearsBalance: arrearsDue - arrearsPaid,
    balance,
    due,
    paid,
    status,
  };
}

// What a payment can be recorded against: a fee, or an old balance, that still
// has something left to pay.
export interface PaymentTarget {
  id: string;
  label: string;
  balance: number;
  group: "This term" | "Arrears";
}

export function paymentTargets(student: StudentFees): PaymentTarget[] {
  const items: PaymentTarget[] = student.items.map((item) => ({
    id: item.id,
    label: item.label,
    balance: item.due - item.paid,
    group: "This term",
  }));
  const arrears: PaymentTarget[] = student.arrears.map((arrear) => ({
    id: arrear.id,
    label: arrear.label,
    balance: arrear.due - arrear.paid,
    group: "Arrears",
  }));
  return [...items, ...arrears].filter((target) => target.balance > 0);
}

// ── One class ───────────────────────────────────────────────────────────────

export interface ArmTotals {
  students: number;
  cleared: number;
  indebted: number;
  expected: number;
  collected: number;
  outstanding: number;
  rate: number;
}

export function armTotals(students: StudentFees[]): ArmTotals {
  const totals = students.map(studentTotals);
  const expected = sum(totals, (t) => t.due);
  const collected = sum(totals, (t) => t.paid);
  const cleared = totals.filter((t) => t.status === "cleared").length;

  return {
    students: students.length,
    cleared,
    indebted: students.length - cleared,
    expected,
    collected,
    outstanding: expected - collected,
    rate: percent(collected, expected),
  };
}

export type BreakdownKey = FeeCategory | "arrears";

export interface BreakdownLine {
  key: BreakdownKey;
  label: string;
  due: number;
  paid: number;
}

const BREAKDOWN_ORDER: { key: BreakdownKey; label: string }[] = [
  { key: "tuition", label: "Tuition" },
  { key: "boarding", label: "Boarding" },
  { key: "surcharge", label: "Surcharge" },
  { key: "arrears", label: "Arrears" },
];

/** How much of each kind of fee has been collected, for the whole class. */
export function feeBreakdown(students: StudentFees[]): BreakdownLine[] {
  return BREAKDOWN_ORDER.map(({ key, label }) => {
    if (key === "arrears") {
      const arrears = students.flatMap((s) => s.arrears);
      return {
        key,
        label,
        due: sum(arrears, (a) => a.due),
        paid: sum(arrears, (a) => a.paid),
      };
    }
    const items = students
      .flatMap((s) => s.items)
      .filter((item) => item.category === key);
    return {
      key,
      label,
      due: sum(items, (i) => i.due),
      paid: sum(items, (i) => i.paid),
    };
  }).filter((line) => line.due > 0);
}

// ── Filtering and sorting a class's students ────────────────────────────────

export type StudentTypeFilter = "" | "boarding" | "day";

export interface StudentFilters {
  search: string;
  statuses: FeeStatus[];
  type: StudentTypeFilter;
  arrearsOnly: boolean;
}

export const NO_STUDENT_FILTERS: StudentFilters = {
  search: "",
  statuses: [],
  type: "",
  arrearsOnly: false,
};

export function filterStudents(
  students: StudentFees[],
  filters: StudentFilters,
): StudentFees[] {
  return students.filter((student) => {
    if (!matchesPersonSearch(student, filters.search)) return false;

    const totals = studentTotals(student);
    if (
      filters.statuses.length > 0 &&
      !filters.statuses.includes(totals.status)
    ) {
      return false;
    }
    if (filters.type === "boarding" && !student.boarder) return false;
    if (filters.type === "day" && student.boarder) return false;
    if (filters.arrearsOnly && totals.arrearsBalance <= 0) return false;
    return true;
  });
}

export type StudentSort = "balance" | "name" | "paid";

export function sortStudents(
  students: StudentFees[],
  sort: StudentSort,
): StudentFees[] {
  const byName = (a: StudentFees, b: StudentFees) =>
    personName(a).localeCompare(personName(b));

  return [...students].sort((a, b) => {
    if (sort === "name") return byName(a, b);
    const left = studentTotals(a);
    const right = studentTotals(b);
    const difference =
      sort === "balance" ? right.balance - left.balance : right.paid - left.paid;
    return difference !== 0 ? difference : byName(a, b);
  });
}

// ── Filtering and sorting the classes ───────────────────────────────────────

export type ArmCollectionFilter = "" | "debtors" | "cleared";

export interface ArmFilters {
  search: string;
  sections: string[];
  collection: ArmCollectionFilter;
}

export const NO_ARM_FILTERS: ArmFilters = {
  search: "",
  sections: [],
  collection: "",
};

// A class matches when what was typed is the start of its name, or of any word
// in it, ignoring spaces: "ss1" finds SS 1 A but not JSS 1 A, and "1a" finds
// every class that ends in 1 A.
function classNameMatches(name: string, typed: string): boolean {
  const words = name.toLowerCase().split(/\s+/);
  const query = typed.toLowerCase().replace(/\s+/g, "");
  return words.some((_, start) => words.slice(start).join("").startsWith(query));
}

export function filterArms(
  arms: ArmFeesSummary[],
  filters: ArmFilters,
): ArmFeesSummary[] {
  return arms.filter((row) => {
    if (!classNameMatches(row.arm.name, filters.search)) return false;
    if (
      filters.sections.length > 0 &&
      !filters.sections.includes(row.arm.section)
    ) {
      return false;
    }
    if (filters.collection === "debtors" && row.indebted === 0) return false;
    if (filters.collection === "cleared" && row.indebted > 0) return false;
    return true;
  });
}

export type ArmSort = "class" | "owing" | "rate";

export function sortArms(
  arms: ArmFeesSummary[],
  sort: ArmSort,
): ArmFeesSummary[] {
  const outstanding = (row: ArmFeesSummary) => row.expected - row.collected;
  const rate = (row: ArmFeesSummary) => percent(row.collected, row.expected);

  return [...arms].sort((a, b) => {
    if (sort === "owing") {
      const difference = outstanding(b) - outstanding(a);
      if (difference !== 0) return difference;
    }
    if (sort === "rate") {
      const difference = rate(a) - rate(b);
      if (difference !== 0) return difference;
    }
    return a.arm.order - b.arm.order;
  });
}

/** The whole school's figures, added up from the class rows. */
export function schoolTotals(arms: ArmFeesSummary[]) {
  const expected = sum(arms, (row) => row.expected);
  const collected = sum(arms, (row) => row.collected);
  const students = sum(arms, (row) => row.students);
  const cleared = sum(arms, (row) => row.cleared);

  return {
    expected,
    collected,
    outstanding: expected - collected,
    rate: percent(collected, expected),
    students,
    cleared,
    indebted: students - cleared,
  };
}
