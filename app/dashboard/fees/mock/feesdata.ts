// ─────────────────────────────────────────
// app/dashboard/fees/mock/feesdata.ts
//
// Sample fees data for the fees pages while there is no fees API. It is built
// the same way every time (nothing random changes between loads), so the pages
// look the same on every visit, on the server and in the browser.
// Delete this folder when the API is wired in.
// ─────────────────────────────────────────

import { PAYMENT_METHODS } from "../fees";

const TERM: FeesTerm = { name: "Second Term", session: "2025/2026" };
const PREVIOUS_TERM = "First Term 2025/2026";

const BOARDING_FEE = 85_000;
const SURCHARGE_FEE = 10_000;

interface ArmSeed {
  id: string;
  name: string;
  section: string;
  students: number;
  tuition: number;
  /** Roughly how many students have paid in full (0 to 1). */
  clearedShare: number;
  /** A class where every student has paid everything. */
  everyonePaid?: boolean;
}

const JUNIOR = "Junior Secondary";
const SENIOR = "Senior Secondary";

const ARM_SEEDS: ArmSeed[] = [
  { id: "arm-jss1a", name: "JSS 1 A", section: JUNIOR, students: 24, tuition: 120_000, clearedShare: 0.55 },
  { id: "arm-jss1b", name: "JSS 1 B", section: JUNIOR, students: 22, tuition: 120_000, clearedShare: 0.4 },
  { id: "arm-jss2a", name: "JSS 2 A", section: JUNIOR, students: 26, tuition: 120_000, clearedShare: 0.62 },
  { id: "arm-jss2b", name: "JSS 2 B", section: JUNIOR, students: 21, tuition: 120_000, clearedShare: 0.35 },
  { id: "arm-jss3a", name: "JSS 3 A", section: JUNIOR, students: 28, tuition: 120_000, clearedShare: 0.5 },
  { id: "arm-ss1a", name: "SS 1 A", section: SENIOR, students: 23, tuition: 150_000, clearedShare: 0.3 },
  { id: "arm-ss2a", name: "SS 2 A", section: SENIOR, students: 19, tuition: 150_000, clearedShare: 0.58 },
  { id: "arm-ss3a", name: "SS 3 A", section: SENIOR, students: 17, tuition: 150_000, clearedShare: 1, everyonePaid: true },
];

const MALE_NAMES = [
  "Emmanuel", "Chukwuemeka", "Ayodele", "Ibrahim", "Uduak", "Ekemini", "Samuel",
  "Daniel", "Kelechi", "Tobiloba", "Mfon", "Idara", "Victor", "Joshua", "Obong",
  "Nsikak", "David", "Michael",
];
const FEMALE_NAMES = [
  "Blessing", "Ifeoma", "Aisha", "Mercy", "Grace", "Utibe", "Imaobong",
  "Chiamaka", "Oluwaseun", "Favour", "Esther", "Nneka", "Ekaette", "Precious",
  "Itoro", "Faith", "Hannah", "Glory",
];
const SURNAMES = [
  "Asuquo", "Effiong", "Etim", "Udoh", "Akpan", "Ekong", "Inyang", "Okon",
  "Umoh", "Bassey", "Ita", "Nkanga", "Okafor", "Adeyemi", "Bello", "Eze", "Obi",
  "Nwosu", "Johnson", "Ogunleye",
];

// A small seeded random number generator: the same seed always gives the same
// sequence, which is what keeps the sample data steady.
function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(list: T[], rand: () => number): T {
  return list[Math.floor(rand() * list.length)];
}

/** Rounds to the nearest `step`, e.g. to the nearest ₦5,000. */
function roundTo(value: number, step: number): number {
  return Math.round(value / step) * step;
}

/** A date inside the term, `dayOffset` days after 12 January 2026. */
function termDate(dayOffset: number): string {
  const day = new Date(Date.UTC(2026, 0, 12 + dayOffset));
  return day.toISOString().slice(0, 10);
}

// Turns an amount paid into one or two dated payments that add up to it.
function paymentsFor(
  label: string,
  total: number,
  idPrefix: string,
  rand: () => number,
): FeePayment[] {
  if (total <= 0) return [];

  const makePayment = (part: number, n: number): FeePayment => ({
    id: `${idPrefix}-pay-${n}`,
    date: termDate(Math.floor(rand() * 60)),
    amount: part,
    method: pick(PAYMENT_METHODS, rand),
    for: label,
  });

  if (total >= 40_000 && rand() < 0.5) {
    const first = Math.min(total - 5_000, roundTo(total * (0.4 + rand() * 0.3), 5_000));
    return [makePayment(first, 1), makePayment(total - first, 2)]
      .sort((a, b) => a.date.localeCompare(b.date));
  }
  return [makePayment(total, 1)];
}

function buildStudent(
  arm: ArmSeed,
  index: number,
  sequence: number,
  yearAdmitted: number,
): StudentFees {
  const rand = seededRandom(sequence * 7919 + 17);
  const id = `${arm.id}-s${index + 1}`;

  const gender: "M" | "F" = rand() < 0.5 ? "M" : "F";
  const firstName = pick(gender === "M" ? MALE_NAMES : FEMALE_NAMES, rand);
  const middleName =
    rand() < 0.7 ? pick(gender === "M" ? FEMALE_NAMES : MALE_NAMES, rand) : "";
  const boarder = rand() < 0.4;

  // How this student stands: paid in full, paid some, or paid nothing yet.
  const draw = rand();
  const partialShare = arm.clearedShare + (1 - arm.clearedShare) * 0.55;
  const standing: "cleared" | "partial" | "owing" = arm.everyonePaid
    ? "cleared"
    : draw < arm.clearedShare
      ? "cleared"
      : draw < partialShare
        ? "partial"
        : "owing";

  const items: FeeItem[] = [
    { id: `${id}-tuition`, category: "tuition", label: "Tuition", due: arm.tuition, paid: 0 },
  ];
  if (boarder) {
    items.push({ id: `${id}-boarding`, category: "boarding", label: "Boarding fee", due: BOARDING_FEE, paid: 0 });
  }
  if (standing === "owing" && rand() < 0.45) {
    items.push({ id: `${id}-surcharge`, category: "surcharge", label: "Late-payment surcharge", due: SURCHARGE_FEE, paid: 0 });
  }

  for (const item of items) {
    if (standing === "cleared") {
      item.paid = item.due;
    } else if (standing === "partial" && item.category !== "surcharge") {
      const share = item.category === "tuition" ? 0.3 + rand() * 0.55 : rand() < 0.5 ? 0.5 : 0;
      item.paid = Math.min(item.due - 5_000, roundTo(item.due * share, 5_000));
    }
  }

  // Some students still owe something from the term before.
  const arrears: FeeArrear[] = [];
  const arrearsChance = arm.everyonePaid ? 0 : standing === "cleared" ? 0.08 : 0.35;
  if (rand() < arrearsChance) {
    const due = roundTo(arm.tuition * (0.4 + rand() * 0.6), 5_000);
    const paid = rand() < 0.4 ? roundTo(due * (0.2 + rand() * 0.5), 5_000) : 0;
    arrears.push({ id: `${id}-arrears-1`, label: `Tuition - ${PREVIOUS_TERM}`, due, paid: Math.min(paid, due - 5_000) });
  }

  const payments: FeePayment[] = [
    ...items.flatMap((item) => paymentsFor(item.label, item.paid, item.id, rand)),
    ...arrears.flatMap((arrear) => paymentsFor(arrear.label, arrear.paid, arrear.id, rand)),
  ].sort((a, b) => b.date.localeCompare(a.date));

  return {
    id,
    public_id: `LHS/${yearAdmitted}/${String(sequence).padStart(4, "0")}`,
    first_name: firstName,
    middle_name: middleName,
    last_name: pick(SURNAMES, rand),
    gender,
    boarder,
    items,
    arrears,
    payments,
  };
}

export interface MockFeesDb {
  term: FeesTerm;
  arms: ArmFeesDetail[];
}

export function buildMockDb(): MockFeesDb {
  let sequence = 0;

  const arms = ARM_SEEDS.map((seed, order): ArmFeesDetail => {
    const yearAdmitted = 2025 - Math.floor(order / 2);
    const students = Array.from({ length: seed.students }, (_, index) => {
      sequence += 1;
      return buildStudent(seed, index, sequence, yearAdmitted);
    });

    return {
      arm: { id: seed.id, name: seed.name, section: seed.section, order },
      term: TERM,
      schedule: [
        { category: "tuition", label: "Tuition", amount: seed.tuition, boardersOnly: false },
        { category: "boarding", label: "Boarding fee", amount: BOARDING_FEE, boardersOnly: true },
        { category: "surcharge", label: "Late-payment surcharge", amount: SURCHARGE_FEE, boardersOnly: false },
      ],
      students,
    };
  });

  return { term: TERM, arms };
}
