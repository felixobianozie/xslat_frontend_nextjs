"use client";

// ─────────────────────────────────────────────────────────────────────────────
// ArmDetailsProvider.tsx
//
// Provides the current arm's full detail record to every component on the
// /arm page via React context. React Query is the underlying data source —
// this provider just makes the query result available without prop drilling.
//
// Children read the value via useArmDetails(). Mutations elsewhere invalidate
// the ["arm-detail", armId] cache to trigger a refetch through this provider.
//
// Backend reference (GET arm/detail/?id=…&school-id=…):
//   Returns the full ClassArm with its nested level → section → term → session
//   → school chain populated. The chain is needed by downstream tabs (for the
//   term-id required by subject/list/, etc.).
// ─────────────────────────────────────────────────────────────────────────────

import { createContext, useContext, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useClientAuthFetch } from "@/lib/Useclientauthfetch";

// ── Constants ────────────────────────────────────────────────────────────────

const SCHOOL_ID = process.env.NEXT_PUBLIC_SCHOOL_ID ?? "";

// ── Shared envelope type ─────────────────────────────────────────────────────
// Standard backend envelope shape returned by every non-paginated endpoint in
// the academics + users modules. Exported so the tab components on the /arm
// page can reuse the same type without redefining it.
export interface ApiEnvelope<T> {
  message: string;
  data: T;
}

export interface ArmDetailsContextValue {
  armId: string;
  arm: ClassArm | null;
  isPending: boolean;
  isError: boolean;
  error: unknown;
}

// Kept internal to this file: consumers should read it through useArmDetails()
// rather than touching the context directly. This matches the LeftbarProvider
// pattern where the context is an implementation detail.
const ArmDetailsContext = createContext<ArmDetailsContextValue | null>(null);

interface ArmDetailsProviderProps {
  armId: string;
  children: ReactNode;
}

export function ArmDetailsProvider({
  armId,
  children,
}: ArmDetailsProviderProps) {
  const { clientAuthFetch } = useClientAuthFetch();

  // Single source of truth: the React Query cache keyed by armId. Any mutation
  // elsewhere on the page invalidates ["arm-detail", armId] and this provider
  // automatically refetches.
  const { data, isPending, isError, error } = useQuery<ApiEnvelope<ClassArm>>({
    queryKey: ["arm-detail", armId],
    queryFn: async () => {
      const url = `arm/detail/?id=${armId}&school-id=${SCHOOL_ID}`;
      const { data, error } = await clientAuthFetch<ApiEnvelope<ClassArm>>(url);

      // Throwing makes React Query set isError; consumers can react to the
      // error state themselves (e.g. ArmInfo shows a fallback message).
      if (error) throw new Error(error.message);
      return data!;
    },
    // Don't auto-refetch on focus — the arm rarely changes in the background
    // and a refetch would lose unsaved score-entry input in the record panel.
    refetchOnWindowFocus: false,
    enabled: !!armId,
  });

  const value: ArmDetailsContextValue = {
    armId,
    arm: data?.data ?? null,
    isPending,
    isError,
    error,
  };

  return (
    <ArmDetailsContext.Provider value={value}>
      {children}
    </ArmDetailsContext.Provider>
  );
}

// Consumer hook. Throws when used outside the provider so the failure mode is
// loud at development time rather than a silent null at runtime.
export function useArmDetails(): ArmDetailsContextValue {
  const ctx = useContext(ArmDetailsContext);
  if (!ctx) {
    throw new Error(
      "useArmDetails must be used inside an <ArmDetailsProvider>.",
    );
  }
  return ctx;
}
