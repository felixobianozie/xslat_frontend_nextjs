"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Usestructure.ts
//
// Data hooks for the School Structure tab, all for the current term:
//
//   useSections      the term's sections (GET section/list/), by promotion order.
//   useLevels        the levels of every section (GET level/list/). The
//                    endpoint takes one section at a time, so each section has
//                    its own request and the results are put together here.
//   useStructureArms the term's arms (GET arm/list/). Shares its cache entry
//                    with the Arm Settings tab.
// ─────────────────────────────────────────────────────────────────────────────

import { useQueries, useQuery } from "@tanstack/react-query";

import { useClientAuthFetch } from "@/lib/Useclientauthfetch";
import type {
  ApiEnvelope,
  LevelRecord,
  SectionRecord,
} from "@/types/configurations";
import {
  ARMS_KEY,
  LEVELS_KEY,
  LoadError,
  QUERY_STALE_MS,
  SCHOOL_ID,
  SECTIONS_KEY,
} from "../configutils";

export function useSections(termId: string | undefined) {
  const { clientAuthFetch } = useClientAuthFetch();

  return useQuery<ApiEnvelope<SectionRecord[]>>({
    queryKey: [...SECTIONS_KEY, termId],
    enabled: !!termId,
    queryFn: async () => {
      const { data, error } = await clientAuthFetch<
        ApiEnvelope<SectionRecord[]>
      >(`section/list/?school-id=${SCHOOL_ID}&term-id=${termId}`);
      if (error) throw new Error(error.message);
      return data!;
    },
    staleTime: QUERY_STALE_MS,
  });
}

export interface LevelsBySection {
  // The levels of each section, by promotion order, keyed by section id.
  levelsBySection: Record<string, LevelRecord[]>;
  // True while any section's levels are still loading.
  isPending: boolean;
  // The first error among the sections' requests, if any.
  error: Error | null;
  refetch: () => void;
}

export function useLevels(sections: SectionRecord[]): LevelsBySection {
  const { clientAuthFetch } = useClientAuthFetch();

  const results = useQueries({
    queries: sections.map((section) => ({
      queryKey: [...LEVELS_KEY, section.id],
      queryFn: async () => {
        const { data, error } = await clientAuthFetch<
          ApiEnvelope<LevelRecord[]>
        >(`level/list/?school-id=${SCHOOL_ID}&section-id=${section.id}`);
        if (error) throw new Error(error.message);
        return data!;
      },
      staleTime: QUERY_STALE_MS,
    })),
  });

  const levelsBySection: Record<string, LevelRecord[]> = {};
  sections.forEach((section, index) => {
    levelsBySection[section.id] = [...(results[index]?.data?.data ?? [])].sort(
      (a, b) => a.promotion_order - b.promotion_order,
    );
  });

  return {
    levelsBySection,
    isPending: results.some((result) => result.isPending),
    error: results.find((result) => result.error)?.error ?? null,
    refetch: () => results.forEach((result) => result.refetch()),
  };
}

export function useStructureArms(termId: string | undefined) {
  const { clientAuthFetch } = useClientAuthFetch();

  return useQuery<ApiEnvelope<ClassArm[]>>({
    queryKey: [...ARMS_KEY, termId],
    enabled: !!termId,
    queryFn: async () => {
      const { data, error } = await clientAuthFetch<ApiEnvelope<ClassArm[]>>(
        `arm/list/?school-id=${SCHOOL_ID}&term-id=${termId}`,
      );
      if (error) throw new LoadError(error.message, error.status);
      return data!;
    },
    staleTime: QUERY_STALE_MS,
  });
}
