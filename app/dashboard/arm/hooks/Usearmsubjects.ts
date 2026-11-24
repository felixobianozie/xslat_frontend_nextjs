// ─────────────────────────────────────────────────────────────────────────────
// Usearmsubjects.ts
//
// The subjects offered in the current arm, with each subject's arms and
// teachers and the students excluded from it:
//   GET subject/list/?school-id=…&term-id=…&arm=…
//
// Shared by the Subjects, Class Members and Class Teacher tabs under one cache
// key, so moving between them does not fetch again. Anything that changes an
// arm's subjects, their teachers or their excluded students invalidates
// ["arm-subjects", armId].
//
// The request waits for the arm detail, which supplies the term; without the
// term the endpoint answers 400.
// ─────────────────────────────────────────────────────────────────────────────

import { useQuery } from "@tanstack/react-query";

import { useClientAuthFetch } from "@/lib/Useclientauthfetch";
import { useArmDetails, type ApiEnvelope } from "../context/Armdetailsprovider";

const SCHOOL_ID = process.env.NEXT_PUBLIC_SCHOOL_ID ?? "";

export function useArmSubjects() {
  const { armId, arm } = useArmDetails();
  const { clientAuthFetch } = useClientAuthFetch();
  const termId = arm?.level.section.term?.id ?? "";

  return useQuery<ApiEnvelope<ArmSubject[]>>({
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
}
