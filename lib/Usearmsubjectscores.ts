"use client";

import { useQuery } from "@tanstack/react-query";
import { useClientAuthFetch } from "@/lib/Useclientauthfetch";

const SCHOOL_ID = process.env.NEXT_PUBLIC_SCHOOL_ID ?? "";

interface SubjectScoresResponse {
  message: string;
  data: ArmSubjectScoresRow[];
}

/**
 * The scores already recorded for ONE subject in an arm, student by student.
 *
 * Reads GET arm/subject-scores/. The arm's own detail does not carry the
 * students' assessments, because they are large and a panel needs only one
 * subject's at a time. The record and view score panels load this when they
 * open.
 *
 * Each row is { student_id, scores: { <unit_id>: score } }. A student with no
 * record for the subject has no row; show a blank for them.
 *
 * The query key is ["arm-subject-scores", armId, subjectId]. Invalidating
 * ["arm-subject-scores", armId] after a save refreshes every subject of the
 * arm that has been opened.
 *
 * Pass `enabled` as false to hold the request back, for example until a panel
 * is opened. It never refetches on window focus, so scores a person is typing
 * are not replaced under them.
 */
export function useArmSubjectScores(
  armId: string,
  subjectId: string,
  enabled = true,
) {
  const { clientAuthFetch } = useClientAuthFetch();

  return useQuery<SubjectScoresResponse>({
    queryKey: ["arm-subject-scores", armId, subjectId],
    queryFn: async () => {
      const url =
        `arm/subject-scores/?id=${armId}&school-id=${SCHOOL_ID}` +
        `&subject-id=${subjectId}`;
      const { data, error } = await clientAuthFetch<SubjectScoresResponse>(url);
      if (error) throw new Error(error.message);
      return data!;
    },
    enabled: enabled && !!armId && !!subjectId,
    refetchOnWindowFocus: false,
  });
}
