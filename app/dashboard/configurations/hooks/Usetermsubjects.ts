"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Usetermsubjects.ts
//
// The subjects offered in one term (GET subject/list/), with the arms that
// offer each one. Shared by the Subjects tab and the Arm Settings tab, so both
// read one cache entry and one refresh updates both.
// ─────────────────────────────────────────────────────────────────────────────

import { useQuery } from "@tanstack/react-query";

import { useClientAuthFetch } from "@/lib/Useclientauthfetch";
import type { ApiEnvelope, TermSubjectRecord } from "@/types/configurations";
import {
  LoadError,
  QUERY_STALE_MS,
  SCHOOL_ID,
  TERM_SUBJECTS_KEY,
} from "../configutils";

export function useTermSubjects(termId: string | undefined) {
  const { clientAuthFetch } = useClientAuthFetch();

  return useQuery<ApiEnvelope<TermSubjectRecord[]>>({
    queryKey: [...TERM_SUBJECTS_KEY, termId],
    enabled: !!termId,
    queryFn: async () => {
      const { data, error } = await clientAuthFetch<
        ApiEnvelope<TermSubjectRecord[]>
      >(`subject/list/?school-id=${SCHOOL_ID}&term-id=${termId}`);
      if (error) throw new LoadError(error.message, error.status);
      return data!;
    },
    staleTime: QUERY_STALE_MS,
  });
}
