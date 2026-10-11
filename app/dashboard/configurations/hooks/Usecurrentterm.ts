"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Usecurrentterm.ts
//
// The school's current term, read from the school record (school/detail/).
// The cache entry is shared with the dashboard top bar and the other
// Configurations tabs, so using this hook costs no extra request.
// ─────────────────────────────────────────────────────────────────────────────

import { useQuery } from "@tanstack/react-query";

import { useClientAuthFetch } from "@/lib/Useclientauthfetch";
import type { ApiEnvelope, SchoolDetailData } from "@/types/configurations";
import { QUERY_STALE_MS, SCHOOL_ID, SCHOOL_KEY } from "../configutils";

export function useCurrentTerm() {
  const { clientAuthFetch } = useClientAuthFetch();

  const school = useQuery<ApiEnvelope<SchoolDetailData>>({
    queryKey: SCHOOL_KEY,
    queryFn: async () => {
      const { data, error } = await clientAuthFetch<
        ApiEnvelope<SchoolDetailData>
      >(`school/detail/?id=${SCHOOL_ID}`);
      if (error) throw new Error(error.message);
      return data!;
    },
    staleTime: QUERY_STALE_MS,
  });

  return { school, currentTerm: school.data?.data.current_term ?? null };
}
