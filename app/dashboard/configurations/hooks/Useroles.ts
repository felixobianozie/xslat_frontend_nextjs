"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Useroles.ts
//
// Data hooks for the Roles & Permissions tab:
//
//   useRoles                the school's roles (GET roles/list/), each with
//                           the permission codenames it grants.
//   usePermissionCatalogue  every permission that can be given to a role
//                           (GET permissions/).
//   useRoleMemberCounts     how many staff hold each role. There is no
//                           endpoint for this, so each role asks the staff
//                           list for one record filtered by role and reads
//                           its total count. A user who may manage roles but
//                           not view staff gets no count for a role.
// ─────────────────────────────────────────────────────────────────────────────

import { useQueries, useQuery } from "@tanstack/react-query";

import { useClientAuthFetch } from "@/lib/Useclientauthfetch";
import { ALL_STAFF_STATUSES } from "../../staff/staffstatus";
import type {
  ApiEnvelope,
  PermissionRecord,
  RoleRecord,
} from "@/types/configurations";
import {
  PERMISSION_CATALOGUE_KEY,
  QUERY_STALE_MS,
  ROLES_KEY,
  ROLE_MEMBERS_KEY,
  SCHOOL_ID,
} from "../configutils";

export function useRoles() {
  const { clientAuthFetch } = useClientAuthFetch();

  return useQuery<ApiEnvelope<RoleRecord[]>>({
    queryKey: ROLES_KEY,
    queryFn: async () => {
      const { data, error } = await clientAuthFetch<ApiEnvelope<RoleRecord[]>>(
        `roles/list/?school-id=${SCHOOL_ID}`,
      );
      if (error) throw new Error(error.message);
      return data!;
    },
    staleTime: QUERY_STALE_MS,
  });
}

export function usePermissionCatalogue() {
  const { clientAuthFetch } = useClientAuthFetch();

  return useQuery<ApiEnvelope<PermissionRecord[]>>({
    queryKey: PERMISSION_CATALOGUE_KEY,
    queryFn: async () => {
      const { data, error } =
        await clientAuthFetch<ApiEnvelope<PermissionRecord[]>>("permissions/");
      if (error) throw new Error(error.message);
      return data!;
    },
    staleTime: QUERY_STALE_MS,
  });
}

export interface RoleMemberCount {
  // The number of staff holding the role; undefined until it is known.
  count: number | undefined;
  isPending: boolean;
  isError: boolean;
}

// The member count of every role, keyed by role name. It counts everyone who
// holds the role, departed staff included: the staff list shows only current
// staff unless a status is sent, and a role stays with a person who has left,
// so the delete warning must count them.
export function useRoleMemberCounts(
  roleNames: string[],
): Record<string, RoleMemberCount> {
  const { clientAuthFetch } = useClientAuthFetch();

  const results = useQueries({
    queries: roleNames.map((name) => ({
      queryKey: [...ROLE_MEMBERS_KEY, name],
      queryFn: async () => {
        const { data, error } = await clientAuthFetch<{ count: number }>(
          `staff/portfolios/list/?school-id=${SCHOOL_ID}&status=${ALL_STAFF_STATUSES}&role=${encodeURIComponent(
            name,
          )}&page-size=1`,
        );
        if (error) throw new Error(error.message);
        return data!.count;
      },
      staleTime: QUERY_STALE_MS,
      // A refused request (no permission to view staff) will not succeed on a
      // retry.
      retry: false,
    })),
  });

  const counts: Record<string, RoleMemberCount> = {};
  roleNames.forEach((name, index) => {
    const result = results[index];
    counts[name] = {
      count: result?.data,
      isPending: result?.isPending ?? true,
      isError: result?.isError ?? false,
    };
  });
  return counts;
}
