"use client";

import { useQuery } from "@tanstack/react-query";

import { useClientAuthFetch } from "@/lib/Useclientauthfetch";

const SCHOOL_ID = process.env.NEXT_PUBLIC_SCHOOL_ID ?? "";

interface ResultRosterResponse {
  message: string;
  data: ResultRosterStudent[];
}

/**
 * The students of an arm, as its result sheet prints them.
 *
 * Reads GET arm/result/roster/. While the arm's broadsheet is pending or
 * approved, each student's names, gender and registration number are the
 * values captured at submission, the same values arm/assessment/compute/
 * returns. For any other arm they are live. Use this hook, not
 * student/list/, to label students on result screens.
 *
 * The roster is not paginated and is already in display order: males first,
 * then females, then by last name and first name.
 *
 * The query key sits under ["arm-students", armId], so invalidating that
 * prefix after a roster change refreshes this roster too.
 *
 * Pass `enabled` as false to hold the request back, for example until a
 * panel is opened.
 */
export function useArmResultRoster(armId: string, enabled = true) {
  const { clientAuthFetch } = useClientAuthFetch();

  return useQuery<ResultRosterResponse>({
    queryKey: ["arm-students", armId, "result-roster"],
    queryFn: async () => {
      const url = `arm/result/roster/?school-id=${SCHOOL_ID}&arm-id=${armId}`;
      const { data, error } = await clientAuthFetch<ResultRosterResponse>(url);
      if (error) throw new Error(error.message);
      return data!;
    },
    enabled: enabled && !!armId,
    refetchOnWindowFocus: false,
  });
}
