// ─────────────────────────────────────────────────────────────────────────────
// student.d.ts
//
// Global type declarations for the Student Management feature.
// These mirror the shapes returned by the backend serializers:
//
//   Student            (via StudentSerializer)
//   StudentPortfolio   (via StudentPortfolioSerializer)
//   Arm                (via ArmSerializer, used for class arm assignment)
//
// Source of truth: backend serializers.py / views.py
// ─────────────────────────────────────────────────────────────────────────────

// The school object as nested in a student portfolio.
interface StudentSchool {
  id: string;
  name: string;
}

// A student portfolio — one record per (student, school) pair.
// Mirrors StudentPortfolioSerializer with the list-view field set.
// `status` is "inactive" by default until the student is assigned to an arm.
// `current` marks which portfolio is the active one for the student.
interface StudentPortfolio {
  id: string;
  reg_numb: string | null;
  status: "active" | "inactive";
  boarding: boolean;
  current: boolean;
  school: StudentSchool;
  created_on: string; // ISO date string
  modified_on: string; // ISO date string
}

// Nested term inside a class arm's section.
interface ArmTerm {
  id: string;
  name: string;
  abbr: string;
}

// Nested section inside a class arm's level.
interface ArmSection {
  id: string;
  name: string;
  abbr: string;
  term: ArmTerm;
}

// Nested level inside a class arm.
interface ArmLevel {
  id: string;
  name: string;
  abbr: string;
  section: ArmSection;
}

// A class arm — returned by GET arm/list/.
// Used both for the assign/change arm dropdowns and for showing a student's
// current class. The `section.abbr level.abbr arm.abbr` triple is the common
// display format (e.g. "JSS 1 A").
interface ClassArm {
  id: string;
  name: string;
  abbr: string;
  level: ArmLevel;
}

// A student record — primary record returned by GET student/list/.
// Mirrors StudentSerializer with the include_student_fields list-view set.
//
// `current_arm` is a UI-side convenience computed from the student's current
// arm enrollment. The backend returns enrollments separately via the
// `enrollments` field; we surface the active one here for easy table rendering.
interface StudentRecord {
  id: string;
  public_id: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  gender: "M" | "F" | "O";
  dob: string; // ISO date string (YYYY-MM-DD)
  email: string;
  phone: string;
  portfolios: StudentPortfolio[];
  current_arm: ClassArm | null;
}

// Form input shape for creating a new student.
// Sent to POST student/list/ (StudentSerializer create path).
//
// Required: first_name, last_name, gender, current_school
// Optional: middle_name, email, phone (E.164), dob, reg_numb, boarding
interface CreateStudentInput {
  first_name: string;
  last_name: string;
  middle_name: string;
  email: string;
  phone: string; // E.164 format (e.g. +2348012345678)
  gender: "M" | "F" | "O" | "";
  dob: string; // YYYY-MM-DD
  reg_numb: string;
  boarding: boolean;
  current_school: string; // School UUID — sent as the SCHOOL_ID env var
}
