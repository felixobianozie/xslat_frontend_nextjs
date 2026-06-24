// ─────────────────────────────────────────────────────────────────────────────
// arms.d.ts
//
// Global type declarations for the Class Arm Management feature.
// Shapes mirror what the backend serializers actually return:
//
//   ArmSerializer       (academics.serializers)
//   LevelSerializer     (academics.serializers)
//   SectionSerializer   (academics.serializers)
//   StaffPortfolioSerializer (users.serializers — used for class_teacher)
//
// Source of truth: academics/views.py & academics/serializers.py.
//
// Note on the list response shape:
//   ArmListView's `include_arm_fields` is currently ("id", "name", "abbr",
//   "level") — so class_teacher / ass_class_teacher are NOT in the list payload
//   as of today. The list table here still surfaces those columns (matching the
//   /arms draft), so on integration either include them in the backend's
//   include_arm_fields OR add a secondary fetch. The fields are typed as
//   optional below to keep the type honest about what actually arrives.
// ─────────────────────────────────────────────────────────────────────────────

// ── Foundational chain: Session → Term → Section → Level ──────────────────────
// The chain mirrors the backend ORM relationship arm.level.section.term.session.school.
// Each link is intentionally minimal to match the dynamic-fields contexts the
// backend list/detail views actually request.

interface ArmSchool {
  id: string;
  name: string;
  abbr: string;
}

interface ArmSession {
  id: string;
  name: string;
  abbr: string;
  school: ArmSchool;
}

interface ArmTerm {
  id: string;
  name: string;
  abbr: string;
  session: ArmSession;
}

interface ArmSectionRef {
  id: string;
  name: string;
  abbr: string;
  // term may be omitted depending on the include_section_fields the caller used.
  term?: ArmTerm;
}

interface ArmLevel {
  id: string;
  name: string;
  abbr: string;
  section: ArmSectionRef;
}

// ── Class teacher shape (subset of StaffPortfolio returned by the backend) ───
// Matches what ArmFieldUpdateView returns when class_teacher is included:
//   include_staffportfolio_fields: ("id", "staff_profile")
//   include_staffprofile_fields:   ("id", "user")
//   include_customuser_fields:     ("id", "first_name", "last_name")
// public_id is added here because list/print/UI surfaces it; on integration
// remember to add "public_id" to the include_customuser_fields tuple.

interface ArmTeacherUser {
  id: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  public_id?: string;
  email?: string;
  phone?: string;
  gender?: string;
}

interface ArmTeacherProfile {
  id: string;
  user: ArmTeacherUser;
}

interface ArmTeacher {
  id: string;
  staff_profile: ArmTeacherProfile;
}

// ── Class Arm — primary record used across the list and panels ───────────────

interface ClassArm {
  id: string;
  name: string;
  abbr: string;
  level: ArmLevel;

  // Optional — present on detail/update responses, and in our mock data so the
  // list table can render the teacher columns shown in the /arms draft.
  display_order?: number;
  score_entry_starts?: string | null;
  score_entry_ends?: string | null;
  class_teacher?: ArmTeacher | null;
  ass_class_teacher?: ArmTeacher | null;
  broadsheet?: "none" | "pending" | "revoked" | "approved";
}

// ── Form input shape for creating a new arm ──────────────────────────────────
// Maps to POST arm/list/ (ArmSerializer create path).
interface CreateArmInput {
  name: string;
  abbr: string;
  level: string; // Level UUID
  display_order: number;
  // Optional on create; the dedicated assign-teachers panel handles these in
  // the typical flow, but the backend will accept them at create time too.
  class_teacher?: string;
  ass_class_teacher?: string;
}

// ── Form input shape for the assign-teachers PUT (arm/detail/fields/) ────────
// Backend ArmFieldUpdateView accepts arbitrary subset of editable arm fields
// alongside the required { id, school_id }. We only touch teachers here.
interface AssignTeachersInput {
  id: string; // Arm UUID
  school_id: string; // From NEXT_PUBLIC_SCHOOL_ID
  class_teacher?: string | null;
  ass_class_teacher?: string | null;
}
