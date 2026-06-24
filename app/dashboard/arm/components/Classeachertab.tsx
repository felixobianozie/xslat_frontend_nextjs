"use client";

// ─────────────────────────────────────────────────────────────────────────────
// ClassTeacherTab.tsx
//
// Fourth tab — shows the class teacher and assistant class teacher as side-by-
// side, read-only cards with avatar, contact info, and the subjects they teach
// in this arm.
//
// Backend wiring:
//   GET subject/list/?school-id=…&term-id=…&arm=…
//
//   The subject payload nests subject_arms[].teachers as full StaffPortfolio
//   objects, so locating a teacher's subjects is a same-data filter — no
//   separate per-teacher round-trip.
//
// Teacher cards themselves read straight from `arm.class_teacher` and
// `arm.ass_class_teacher` exposed by the arm-detail fetch upstream
// (ArmDetailsProvider).
// ─────────────────────────────────────────────────────────────────────────────

import Image from "next/image";
import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Mail, Phone, UserCog } from "lucide-react";
import { toast } from "react-toastify";

import { useClientAuthFetch } from "@/lib/Useclientauthfetch";
import { useArmDetails } from "../context/Armdetailsprovider";
import type { ApiEnvelope } from "../page";

// ── Constants ────────────────────────────────────────────────────────────────

const SCHOOL_ID = process.env.NEXT_PUBLIC_SCHOOL_ID ?? "";

// Avatar selection — fall back to a gender-neutral default if gender is unknown.
// Note: the current backend response for arm.class_teacher doesn't include a
// gender field on staff_profile (or its nested user), so the lookup below
// always resolves to FEMALE_AVATAR. Preserved as-is for visual parity with
// the previous mock-using version.
const FEMALE_AVATAR = "/images/female_avatar.png";
const MALE_AVATAR = "/images/male_avatar.webp";

function teacherDisplayName(t: ArmTeacher | null | undefined): string {
  if (!t) return "—";
  const u = t.staff_profile.user;
  return `${u.first_name} ${u.last_name}`;
}

// Subjects this teacher teaches WITHIN this arm — pulled from the nested
// subject_arms[forThisArm].teachers list. Backend includes full teacher
// objects there, so we compare by `id` rather than the old string-array path.
function subjectsTaughtBy(
  teacherId: string,
  armId: string,
  subjects: ArmSubject[],
): ArmSubject[] {
  return subjects.filter((sub) => {
    const armEntry = sub.subject_arms.find((sa) => sa.arm.id === armId);
    return armEntry?.teachers.some((t) => t.id === teacherId) ?? false;
  });
}

export default function ClassTeacherTab() {
  const { armId, arm } = useArmDetails();
  const { clientAuthFetch } = useClientAuthFetch();

  // Term id comes from the arm chain — required by subject/list/.
  const termId = arm?.level.section.term?.id ?? "";

  // ── Data: arm subjects for the "Subjects taught" badges ───────────────────
  // Shared cache key with SubjectsTab + ResultsTab so cross-tab navigation
  // doesn't trigger duplicate fetches.
  const {
    data: subjectsData,
    isLoading: subjectsLoading,
    isError: subjectsError,
  } = useQuery<ApiEnvelope<ArmSubject[]>>({
    queryKey: ["arm-subjects", armId],
    queryFn: async () => {
      const url =
        `subject/list/?school-id=${SCHOOL_ID}` +
        `&term-id=${termId}` +
        `&arm=${armId}`;
      const { data, error } =
        await clientAuthFetch<ApiEnvelope<ArmSubject[]>>(url);
      if (error) throw new Error(error.message);
      return data!;
    },
    enabled: !!armId && !!termId,
  });

  useEffect(() => {
    if (subjectsError) toast.error("Could not load subjects for this arm.");
  }, [subjectsError]);

  const subjects = subjectsData?.data ?? [];

  const classTeacher = arm?.class_teacher ?? null;
  const assistantTeacher = arm?.ass_class_teacher ?? null;

  const classTeacherSubjects = useMemo(
    () =>
      classTeacher ? subjectsTaughtBy(classTeacher.id, armId, subjects) : [],
    [classTeacher, armId, subjects],
  );

  const assistantTeacherSubjects = useMemo(
    () =>
      assistantTeacher
        ? subjectsTaughtBy(assistantTeacher.id, armId, subjects)
        : [],
    [assistantTeacher, armId, subjects],
  );

  return (
    <div className="flex text-sm">
      <div className="w-full">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <TeacherCard
            label="Class Teacher"
            teacher={classTeacher}
            subjects={classTeacherSubjects}
            subjectsLoading={subjectsLoading}
          />
          <TeacherCard
            label="Assistant Class Teacher"
            teacher={assistantTeacher}
            subjects={assistantTeacherSubjects}
            subjectsLoading={subjectsLoading}
          />
        </div>
      </div>
    </div>
  );
}

// ── Single card — used twice, once per role ──────────────────────────────────

interface TeacherCardProps {
  label: string;
  teacher: ArmTeacher | null;
  subjects: ArmSubject[];
  subjectsLoading: boolean;
}

function TeacherCard({
  label,
  teacher,
  subjects,
  subjectsLoading,
}: TeacherCardProps) {
  const user = teacher?.staff_profile.user;
  // See note on FEMALE_AVATAR above — the staff_profile.gender path is
  // preserved for visual parity even though the backend doesn't currently
  // populate it. Always resolves to FEMALE_AVATAR in practice.
  const isMale = teacher?.staff_profile.user.gender === "M";
  const avatar = isMale ? MALE_AVATAR : FEMALE_AVATAR;

  return (
    <div className="flex-1 border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-white">
      {/* Header strip — role label only (read-only) */}
      <div className="flex items-center bg-slate-100 border-b border-slate-200 px-5 py-3">
        <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
          <UserCog size={12} />
          {label}
        </span>
      </div>

      {/* Identity */}
      <div className="flex flex-col md:flex-row gap-4 px-5 pt-5 pb-3">
        <div className="w-28 h-28 mx-auto md:mx-0 shrink-0 rounded-full overflow-hidden bg-slate-100 border-4 border-white shadow-md">
          <Image
            src={avatar}
            width={120}
            height={120}
            alt={teacher ? teacherDisplayName(teacher) : "No teacher assigned"}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex flex-col gap-2 text-center md:text-left flex-1 min-w-0">
          {teacher ? (
            <>
              <span className="text-base font-bold text-slate-800 truncate">
                {teacherDisplayName(teacher)}
              </span>
              <div className="flex flex-wrap gap-3 text-[11px] text-violet-700 justify-center md:justify-start">
                {user?.email && (
                  <span className="flex items-center gap-1">
                    <Mail size={10} />
                    {user.email}
                  </span>
                )}
                {user?.phone && (
                  <span className="flex items-center gap-1">
                    <Phone size={10} />
                    {user.phone}
                  </span>
                )}
              </div>
              {user?.public_id && (
                <span className="text-[10px] text-slate-400 font-mono">
                  {user.public_id}
                </span>
              )}
            </>
          ) : (
            <span className="text-base font-bold text-slate-400">
              —None Assigned—
            </span>
          )}
        </div>
      </div>

      {/* Subjects taught */}
      {teacher && (
        <div className="px-5 pb-5 pt-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
            Subject(s)
          </span>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {subjectsLoading ? (
              <span className="text-[10px] text-slate-400">Loading…</span>
            ) : subjects.length === 0 ? (
              <span className="text-[10px] text-slate-400">
                No subjects assigned in this arm
              </span>
            ) : (
              subjects.map((sub) => (
                <span
                  key={sub.id}
                  className="text-[10px] px-2 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-100"
                >
                  {sub.definition.abbr}
                </span>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
