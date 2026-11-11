// ─────────────────────────────────────────────────────────────────────────────
// staffsubjects.ts
//
// Plain rules for the Assign Subjects and Unassign Subjects panels
// (Staffsubjectspanel.tsx). A staff member teaches a subject in an arm when
// their portfolio id is in that subject arm's `teachers`.
//
// The panels save one request per subject (PUT subject/detail/), each listing
// every arm to change for that subject, so these rules group the changes by
// subject.
// ─────────────────────────────────────────────────────────────────────────────

import type { TermSubjectRecord } from "@/types/configurations";

export type SubjectsMode = "assign" | "unassign";

// The arms of one level, in the order the backend returned them.
export interface ArmGroup {
  levelId: string;
  label: string;
  arms: ClassArm[];
}

// What saving will do for one subject.
export interface SubjectChange {
  subject: TermSubjectRecord;
  // Arms the request changes.
  armIds: string[];
  // Ticked arms left out because the subject is not offered there.
  notOfferedArmIds: string[];
  // Ticked arms left out because the staff member already teaches the
  // subject there.
  alreadyAssignedArmIds: string[];
}

// "JSS 1", the level part of armLabel() in configutils.ts.
export function levelLabel(arm: ClassArm): string {
  return `${arm.level.section.abbr} ${arm.level.abbr}`;
}

export function groupArmsByLevel(arms: ClassArm[]): ArmGroup[] {
  const groups: ArmGroup[] = [];

  for (const arm of arms) {
    let group = groups.find((item) => item.levelId === arm.level.id);
    if (!group) {
      group = { levelId: arm.level.id, label: levelLabel(arm), arms: [] };
      groups.push(group);
    }
    group.arms.push(arm);
  }

  return groups;
}

function teachesIn(
  subjectArm: TermSubjectRecord["subject_arms"][number],
  portfolioId: string,
): boolean {
  return (subjectArm.teachers ?? []).some(
    (teacher) => teacher.id === portfolioId,
  );
}

// Assign mode: every ticked subject with every ticked arm, skipping the arms
// that do not offer the subject and the ones the staff member already teaches
// it in. Subjects keep the order of `subjects`.
export function planAssignments(
  subjects: TermSubjectRecord[],
  pickedSubjectIds: string[],
  pickedArmIds: string[],
  portfolioId: string,
): SubjectChange[] {
  return subjects
    .filter((subject) => pickedSubjectIds.includes(subject.id))
    .map((subject) => {
      const change: SubjectChange = {
        subject,
        armIds: [],
        notOfferedArmIds: [],
        alreadyAssignedArmIds: [],
      };

      for (const armId of pickedArmIds) {
        const subjectArm = subject.subject_arms.find(
          (item) => item.arm.id === armId,
        );
        if (!subjectArm) change.notOfferedArmIds.push(armId);
        else if (teachesIn(subjectArm, portfolioId)) {
          change.alreadyAssignedArmIds.push(armId);
        } else change.armIds.push(armId);
      }

      return change;
    });
}

// Unassign mode: the subjects the staff member teaches this term, each with
// the arms they teach it in.
export function currentAssignments(
  subjects: TermSubjectRecord[],
  portfolioId: string,
): { subject: TermSubjectRecord; armIds: string[] }[] {
  return subjects
    .map((subject) => ({
      subject,
      armIds: subject.subject_arms
        .filter((subjectArm) => teachesIn(subjectArm, portfolioId))
        .map((subjectArm) => subjectArm.arm.id),
    }))
    .filter((assignment) => assignment.armIds.length > 0);
}

// The key a ticked subject-and-arm pair is stored under in unassign mode.
export function pairKey(subjectId: string, armId: string): string {
  return `${subjectId}:${armId}`;
}

// Unassign mode: the ticked pairs grouped into one change per subject.
export function planRemovals(
  assignments: { subject: TermSubjectRecord; armIds: string[] }[],
  pickedPairs: string[],
): SubjectChange[] {
  return assignments
    .map(({ subject, armIds }) => ({
      subject,
      armIds: armIds.filter((armId) =>
        pickedPairs.includes(pairKey(subject.id, armId)),
      ),
      notOfferedArmIds: [],
      alreadyAssignedArmIds: [],
    }))
    .filter((change) => change.armIds.length > 0);
}
