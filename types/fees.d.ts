// The shapes the fees pages work with. The pages run on sample data for now;
// these are the shapes a fees API would be expected to return, so the pages do
// not change when it arrives. All amounts are whole Naira.

type FeeCategory = "tuition" | "boarding" | "surcharge";

// One fee a student owes for the current term.
interface FeeItem {
  id: string;
  category: FeeCategory;
  label: string;
  due: number;
  paid: number;
}

// What a student still owes from an earlier term.
interface FeeArrear {
  id: string;
  label: string;
  due: number;
  paid: number;
}

type PaymentMethod = "cash" | "transfer" | "pos" | "cheque" | "online";

interface FeePayment {
  id: string;
  /** YYYY-MM-DD */
  date: string;
  amount: number;
  /** "bulk" is a balance cleared with the Mark as paid action. */
  method: PaymentMethod | "bulk";
  /** The label of the fee the payment went towards. */
  for: string;
}

interface StudentFees {
  id: string;
  public_id: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  gender: "M" | "F";
  boarder: boolean;
  items: FeeItem[];
  arrears: FeeArrear[];
  payments: FeePayment[];
}

interface FeesArm {
  id: string;
  name: string;
  section: string;
  /** Position of the class in the school, lowest class first. */
  order: number;
}

interface FeesTerm {
  name: string;
  session: string;
}

// One line of a class's fee schedule.
interface FeeScheduleLine {
  category: FeeCategory;
  label: string;
  amount: number;
  boardersOnly: boolean;
}

// Everything the class page needs about one class arm.
interface ArmFeesDetail {
  arm: FeesArm;
  term: FeesTerm;
  schedule: FeeScheduleLine[];
  students: StudentFees[];
}

// One row of the classes overview.
interface ArmFeesSummary {
  arm: FeesArm;
  students: number;
  /** Students with nothing left to pay. */
  cleared: number;
  /** Students who still owe something. */
  indebted: number;
  /** Everything collectible: this term's fees plus arrears. */
  expected: number;
  collected: number;
}

interface FeesOverviewData {
  term: FeesTerm;
  arms: ArmFeesSummary[];
}
