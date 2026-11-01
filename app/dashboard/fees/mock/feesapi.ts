// ─────────────────────────────────────────
// app/dashboard/fees/mock/feesapi.ts
//
// Stands in for the fees API: the same four calls the pages need, answered
// from the sample data held in memory. A payment recorded here shows up on
// every page until the browser tab is refreshed, which resets the sample data.
// When the real API exists, only the hooks in hooks/Usefees.ts change.
// Delete this folder when the API is wired in.
// ─────────────────────────────────────────

import { armTotals, formatNaira, studentTotals, todayIso } from "../fees";
import { buildMockDb } from "./feesdata";

let db = buildMockDb();
let paymentCounter = 0;
let latencyMs = 250;

/** Puts the sample data back as it started. */
export function resetMockFees(): void {
  db = buildMockDb();
  paymentCounter = 0;
}

/** How long each call takes, so loading states can be seen. */
export function setMockLatency(ms: number): void {
  latencyMs = ms;
}

const wait = () => new Promise<void>((resolve) => setTimeout(resolve, latencyMs));

// Callers get copies, so changing what a call returned never changes the
// sample data itself.
const copy = <T,>(value: T): T => structuredClone(value);

function findArm(armId: string): ArmFeesDetail {
  const arm = db.arms.find((candidate) => candidate.arm.id === armId);
  if (!arm) throw new Error("This class was not found.");
  return arm;
}

function summarize(detail: ArmFeesDetail): ArmFeesSummary {
  const totals = armTotals(detail.students);
  return {
    arm: detail.arm,
    students: totals.students,
    cleared: totals.cleared,
    indebted: totals.indebted,
    expected: totals.expected,
    collected: totals.collected,
  };
}

export async function fetchFeesOverview(): Promise<FeesOverviewData> {
  await wait();
  return copy({ term: db.term, arms: db.arms.map(summarize) });
}

export async function fetchArmFees(armId: string): Promise<ArmFeesDetail> {
  await wait();
  return copy(findArm(armId));
}

export interface PaymentInput {
  /** The id of the fee, or old balance, the payment is for. */
  targetId: string;
  amount: number;
  method: PaymentMethod;
  /** YYYY-MM-DD */
  date: string;
}

export async function recordPayment(
  armId: string,
  studentId: string,
  input: PaymentInput,
): Promise<void> {
  await wait();

  const student = findArm(armId).students.find((s) => s.id === studentId);
  if (!student) throw new Error("This student was not found.");

  const target =
    student.items.find((item) => item.id === input.targetId) ??
    student.arrears.find((arrear) => arrear.id === input.targetId);
  if (!target) throw new Error("That fee was not found for this student.");

  const balance = target.due - target.paid;
  if (!Number.isInteger(input.amount) || input.amount <= 0) {
    throw new Error("Enter a whole amount greater than zero.");
  }
  if (input.amount > balance) {
    throw new Error(`The amount is more than the ${formatNaira(balance)} still owed.`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
    throw new Error("Choose a valid payment date.");
  }

  target.paid += input.amount;
  paymentCounter += 1;
  student.payments.unshift({
    id: `pay-new-${paymentCounter}`,
    date: input.date,
    amount: input.amount,
    method: input.method,
    for: target.label,
  });
}

/**
 * Clears everything the chosen students owe, this term and arrears alike, and
 * records it as one payment each. Students who owe nothing are skipped.
 */
export async function markStudentsPaid(
  armId: string,
  studentIds: string[],
): Promise<{ students: number; amount: number }> {
  await wait();

  const chosen = new Set(studentIds);
  let students = 0;
  let amount = 0;

  for (const student of findArm(armId).students) {
    if (!chosen.has(student.id)) continue;

    const { balance } = studentTotals(student);
    if (balance <= 0) continue;

    for (const item of student.items) item.paid = item.due;
    for (const arrear of student.arrears) arrear.paid = arrear.due;

    paymentCounter += 1;
    student.payments.unshift({
      id: `pay-new-${paymentCounter}`,
      date: todayIso(),
      amount: balance,
      method: "bulk",
      for: "Full balance",
    });
    students += 1;
    amount += balance;
  }

  if (students === 0) throw new Error("None of the selected students owe anything.");
  return { students, amount };
}
