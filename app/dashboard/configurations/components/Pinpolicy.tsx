"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Pinpolicy.tsx
//
// The school's rules for result PINs, edited as one form.
//
// Backend reference (pins/policy/detail/):
//   GET ?school-id=…  returns the saved policy, or the defaults when the
//                     school has never saved one.
//   PUT { school_id, …switches }  updates only the switches that are sent.
//
// Data layer and behaviour match Schoolsettingspolicy.tsx: server-fetched
// `initialData` read from ConfigurationsProvider, a draft of unsaved switches,
// and a Save that sends only the changed switches.
//
// Switches are grouped into: whether a PIN is required, and which PIN
// batches (school-specific or universal) are accepted.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { useClientAuthFetch } from "@/lib/Useclientauthfetch";
import type { ApiEnvelope, PinPolicyData } from "@/types/configurations";
import TableLoader from "../../components/Tableloader";
import { useConfigurations } from "../context/Configurationsprovider";
import { ErrorNotice, ToggleRow } from "./Configui";
import { SettingsFooter, SettingsSection } from "./Settingslayout";

// ── Constants ────────────────────────────────────────────────────────────────

const SCHOOL_ID = process.env.NEXT_PUBLIC_SCHOOL_ID ?? "";

// How long server-fetched data counts as fresh before a refetch is allowed.
const INITIAL_DATA_STALE_MS = 60 * 1000;
const PIN_POLICY_KEY = ["pin-policy", SCHOOL_ID];

type PolicyKey =
  | "require_pin"
  | "require_school_scoped_result_pins"
  | "require_school_scoped_validation_pins";

interface PolicyGroup {
  title: string;
  settings: { key: PolicyKey; label: string; description: string }[];
}

const POLICY_GROUPS: PolicyGroup[] = [
  {
    title: "PIN requirement",
    settings: [
      {
        key: "require_pin",
        label: "Require a PIN to view results",
        description: "When on, results cannot be viewed without a valid PIN.",
      },
    ],
  },
  {
    title: "PIN scope",
    settings: [
      {
        key: "require_school_scoped_result_pins",
        label: "Accept school-specific result PINs only",
        description:
          "When on, universal result PINs are rejected and only PINs issued for this school can open results.",
      },
      {
        key: "require_school_scoped_validation_pins",
        label: "Accept school-specific validation PINs only",
        description:
          "When on, universal validation PINs are rejected and only PINs issued for this school can be used.",
      },
    ],
  },
];

const ALL_KEYS = POLICY_GROUPS.flatMap((group) =>
  group.settings.map((setting) => setting.key),
);

// ── Component ────────────────────────────────────────────────────────────────

export default function PinPolicy() {
  // Server-fetched policy. Null when that fetch failed.
  const { pinPolicy: initialData } = useConfigurations();
  const queryClient = useQueryClient();
  const { clientAuthFetch } = useClientAuthFetch();

  // Switches the user has changed and not yet saved.
  const [draft, setDraft] = useState<Partial<Record<PolicyKey, boolean>>>({});

  const { data, isPending, isError, error, refetch } = useQuery<
    ApiEnvelope<PinPolicyData>
  >({
    queryKey: PIN_POLICY_KEY,
    queryFn: async () => {
      const { data, error } = await clientAuthFetch<ApiEnvelope<PinPolicyData>>(
        `pins/policy/detail/?school-id=${SCHOOL_ID}`,
      );
      if (error) throw new Error(error.message);
      return data!;
    },
    initialData: initialData ?? undefined,
    // Treat the server-fetched data as fresh so it is not refetched on mount.
    staleTime: INITIAL_DATA_STALE_MS,
  });

  const { mutate, isPending: isSaving } = useMutation({
    mutationFn: async (changes: Partial<Record<PolicyKey, boolean>>) => {
      const { data, error } = await clientAuthFetch<ApiEnvelope<PinPolicyData>>(
        "pins/policy/detail/",
        {
          method: "PUT",
          body: { school_id: SCHOOL_ID, ...changes },
        },
      );
      if (error) throw new Error(error.message);
      return data!;
    },
    onSuccess: (response) => {
      toast.success("PIN policy saved.");
      queryClient.setQueryData(PIN_POLICY_KEY, response);
      setDraft({});
    },
    onError: (err: Error) => {
      toast.error(err.message || "Could not save the PIN policy.");
    },
  });

  if (isPending) return <TableLoader rows={3} />;
  if (isError || !data) {
    return (
      <ErrorNotice
        message={error?.message ?? "Could not load the PIN policy."}
        onRetry={() => refetch()}
      />
    );
  }

  const saved = data.data;

  function isChanged(key: PolicyKey): boolean {
    return draft[key] !== undefined && draft[key] !== saved[key];
  }

  const hasChanges = ALL_KEYS.some(isChanged);

  function handleSave() {
    const changes: Partial<Record<PolicyKey, boolean>> = {};
    for (const key of ALL_KEYS) {
      if (isChanged(key)) changes[key] = draft[key];
    }
    mutate(changes);
  }

  return (
    <div>
      {POLICY_GROUPS.map((group) => (
        <SettingsSection key={group.title} title={group.title}>
          {group.settings.map((setting) => (
            <ToggleRow
              key={setting.key}
              label={setting.label}
              description={setting.description}
              checked={draft[setting.key] ?? saved[setting.key]}
              changed={isChanged(setting.key)}
              disabled={isSaving}
              onChange={(next) =>
                setDraft((previous) => ({ ...previous, [setting.key]: next }))
              }
            />
          ))}
        </SettingsSection>
      ))}

      <SettingsFooter
        hasChanges={hasChanges}
        isSaving={isSaving}
        onReset={() => setDraft({})}
        onSave={handleSave}
      />
    </div>
  );
}
