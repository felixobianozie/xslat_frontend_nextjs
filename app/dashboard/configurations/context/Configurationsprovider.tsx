"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Configurationsprovider.tsx
//
// Holds what page.tsx fetched on the server for the School Policies tab, the
// tab shown first, and makes it available to the components under it through
// React context, so the data does not have to be passed down as props.
//
// Each value is the backend envelope for one endpoint, or null when that
// server fetch failed. The policy components read it with useConfigurations()
// and give it to React Query as `initialData`; React Query then owns the data
// (refetching after saves, caching between tabs). This context only carries the
// server's first snapshot, and it never changes after the page loads.
//
// Every other tab loads its own data with React Query the first time it is
// opened.
//
// Mirrors ArmDetailsProvider (arm/context/Armdetailsprovider.tsx): the context
// is an implementation detail and consumers use the hook.
// ─────────────────────────────────────────────────────────────────────────────

import { createContext, useContext, type ReactNode } from "react";

import type {
  ApiEnvelope,
  PinPolicyData,
  SchoolSettingsData,
} from "@/types/configurations";

export interface ConfigurationsPrefetch {
  /** school-settings/detail/ */
  schoolSettings: ApiEnvelope<SchoolSettingsData> | null;
  /** pins/policy/detail/ */
  pinPolicy: ApiEnvelope<PinPolicyData> | null;
}

// Kept internal to this file: consumers read it through useConfigurations().
const ConfigurationsContext = createContext<ConfigurationsPrefetch | null>(
  null,
);

interface ConfigurationsProviderProps {
  /** The server-fetched data from page.tsx. */
  prefetched: ConfigurationsPrefetch;
  children: ReactNode;
}

export function ConfigurationsProvider({
  prefetched,
  children,
}: ConfigurationsProviderProps) {
  return (
    <ConfigurationsContext.Provider value={prefetched}>
      {children}
    </ConfigurationsContext.Provider>
  );
}

// Consumer hook. Throws when used outside the provider so the failure is loud
// during development rather than a silent null at runtime.
export function useConfigurations(): ConfigurationsPrefetch {
  const ctx = useContext(ConfigurationsContext);
  if (!ctx) {
    throw new Error(
      "useConfigurations must be used inside a <ConfigurationsProvider>.",
    );
  }
  return ctx;
}
