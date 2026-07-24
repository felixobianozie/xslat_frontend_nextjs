// ─────────────────────────────────────────────────────────────────────────────
// config/arm-directory.ts
//
// TEMPORARY arrangement — will be replaced by a backend endpoint once one
// exists.
//
// Why this exists:
//   The /results page is a PUBLIC route (no login). The check-result
//   endpoint accepts only { pin, arm_id, student_public_id }; session and
//   term are NOT parameters, because an Arm already implies a Level →
//   Section → Term → Session → School chain on the backend.
//   Meanwhile, the session/term/arm LIST endpoints all require
//   authentication, so a signed-out visitor to /results cannot query
//   them to populate dropdowns.
//
//   To bridge that gap, the school administrator maintains this file:
//   a nested set of sessions → terms → arms that the form uses purely as
//   a UX aid. The user progressively narrows session → term → arm; only
//   the selected arm's `arm_id` (a real UUID from the backend) is sent
//   with the request.
//
//   The session and term entries can use any label the admin finds
//   convenient — these values never touch the backend. Only the `arm_id`
//   field on each Arm entry needs to be a valid UUID from the backend
//   Arm table.
//
// Maintenance workflow (until the backend endpoint lands):
//   1. Create a new arm in the admin dashboard as usual.
//   2. Copy its UUID from the URL (or a dedicated admin view).
//   3. Add an { arm_id, label } entry to the matching term below.
//   4. Deploy the frontend.
//
// This file is imported by ResultsForm.tsx and nowhere else.
// ─────────────────────────────────────────────────────────────────────────────

export interface ArmDirectoryArm {
  /**
   * The Arm's real UUID from the backend. This is the only field that
   * gets sent to the check-results endpoint. Copy verbatim from the
   * admin dashboard — case matters and there's no runtime validation
   * beyond what the backend performs on submission.
   */
  arm_id: string;

  /**
   * Human-readable label shown in the dropdown option. Convention:
   *   "JSS 2 A" — SectionAbbr LevelAbbr ArmName
   * This is display-only; you can use anything the user will recognise.
   */
  label: string;
}

export interface ArmDirectoryTerm {
  /** UI-only id — used as the option's key. Any stable string works. */
  id: string;
  /** Display label, e.g. "First Term". */
  name: string;
  /** Arms available in this term. */
  arms: ArmDirectoryArm[];
}

export interface ArmDirectorySession {
  id: string;
  /** Display label, e.g. "2024 / 2025". */
  name: string;
  terms: ArmDirectoryTerm[];
}

/**
 * The directory itself. Newest session at the top so the form's default
 * selection lands on the most likely choice.
 *
 * Replace the placeholder entries below with the school's real data.
 * Every `arm_id` MUST be a real Arm UUID from the backend.
 */
export const ARM_DIRECTORY: ArmDirectorySession[] = [
  {
    id: "session-2025-2026",
    name: "2025 / 2026",
    terms: [
      {
        id: "third-term-2025-2026",
        name: "Third Term",
        arms: [
          // Replace these placeholders with real arm UUIDs. The label is
          // displayed to the parent/student in the dropdown; the arm_id is
          // what actually gets sent to the backend.
          {
            arm_id: "00000000-0000-0000-0000-000000000001",
            label: "JSS 1 A",
          },
          {
            arm_id: "00000000-0000-0000-0000-000000000002",
            label: "JSS 1 B",
          },
          {
            arm_id: "00000000-0000-0000-0000-000000000003",
            label: "JSS 1 C",
          },
          {
            arm_id: "00000000-0000-0000-0000-000000000004",
            label: "JSS 1 D",
          },
          {
            arm_id: "00000000-0000-0000-0000-000000000005",
            label: "JSS 1 E",
          },
          {
            arm_id: "00000000-0000-0000-0000-000000000006",
            label: "JSS 1 F",
          },
          {
            arm_id: "00000000-0000-0000-0000-000000000007",
            label: "JSS 2 A",
          },
          {
            arm_id: "00000000-0000-0000-0000-000000000008",
            label: "JSS 2 B",
          },
          {
            arm_id: "00000000-0000-0000-0000-000000000009",
            label: "JSS 2 C",
          },
          {
            arm_id: "00000000-0000-0000-0000-000000000010",
            label: "JSS 2 D",
          },
          {
            arm_id: "00000000-0000-0000-0000-000000000011",
            label: "SS 1 A",
          },
          {
            arm_id: "00000000-0000-0000-0000-000000000012",
            label: "SS 1 B",
          },
          {
            arm_id: "00000000-0000-0000-0000-000000000013",
            label: "SS 1 C",
          },
        ],
      },
    ],
  },
];
