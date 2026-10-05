"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Schoolsettingspolicy.tsx
//
// The school's rules for results, edited as one form.
//
// Backend reference (school-settings/detail/):
//   GET ?school-id=…  returns the saved settings, or the defaults when the
//                     school has never saved any.
//   PUT { school_id, …switches }  updates only the switches that are sent.
//
// Data layer:
//   • The settings are fetched on the server in page.tsx and read from
//     ConfigurationsProvider as React Query `initialData`, so the switches
//     render on first paint.
//   • The form keeps a draft of the switches the user changed. Save sends only
//     those, then replaces the cached settings with the response.
//
// Switches are grouped by what they control: result visibility, broadsheet
// submission, and publishing.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { useClientAuthFetch } from "@/lib/Useclientauthfetch";
import type { ApiEnvelope, SchoolSettingsData } from "@/types/configurations";
import TableLoader from "../../components/Tableloader";
import { useConfigurations } from "../context/Configurationsprovider";
import { ErrorNotice, ToggleRow } from "./Configui";
import { SettingsFooter, SettingsSection } from "./Settingslayout";

// ── Constants ────────────────────────────────────────────────────────────────

const SCHOOL_ID = process.env.NEXT_PUBLIC_SCHOOL_ID ?? "";

// How long server-fetched data counts as fresh before a refetch is allowed.
const INITIAL_DATA_STALE_MS = 60 * 1000;
const SCHOOL_SETTINGS_KEY = ["school-settings", SCHOOL_ID];

type SettingKey =
  | "allow_teacher_view_after_publish"
  | "require_prev_term_result_before_current"
  | "require_psychomotor_for_arm_broadsheet_submission"
  | "require_affective_for_arm_broadsheet_submission"
  | "require_all_arms_approved_for_publish";

interface SettingGroup {
  title: string;
  settings: { key: SettingKey; label: string; description: string }[];
}

const SETTING_GROUPS: SettingGroup[] = [
  {
    title: "Result visibility",
    settings: [
      {
        key: "allow_teacher_view_after_publish",
        label: "Class teachers can view results after publishing",
        description:
          "When off, teachers lose access to their arm's results once the term's results are published. School administrators are not affected.",
      },
      {
        key: "require_prev_term_result_before_current",
        label: "Require the previous term's result first",
        description:
          "When on, the previous term's result must be accessed before the current term's result can be opened.",
      },
    ],
  },
  {
    title: "Broadsheet submission",
    settings: [
      {
        key: "require_psychomotor_for_arm_broadsheet_submission",
        label: "Require psychomotor scores before submission",
        description:
          "When off, missing psychomotor scores are recorded as −1 (no score) when a broadsheet is submitted. Approval always checks for complete scores.",
      },
      {
        key: "require_affective_for_arm_broadsheet_submission",
        label: "Require affective scores before submission",
        description:
          "When off, missing affective scores are recorded as −1 (no score) when a broadsheet is submitted. Approval always checks for complete scores.",
      },
    ],
  },
  {
    title: "Publishing",
    settings: [
      {
        key: "require_all_arms_approved_for_publish",
        label: "Require every arm to be approved before publishing",
        description:
          "When off, results can be published for the approved arms only. A term still cannot be closed until every arm is approved or removed.",
      },
    ],
  },
];

const ALL_KEYS = SETTING_GROUPS.flatMap((group) =>
  group.settings.map((setting) => setting.key),
);

// ── Component ────────────────────────────────────────────────────────────────

export default function SchoolSettingsPolicy() {
  // Server-fetched settings. Null when that fetch failed.
  const { schoolSettings: initialData } = useConfigurations();
  const queryClient = useQueryClient();
  const { clientAuthFetch } = useClientAuthFetch();

  // Switches the user has changed and not yet saved.
  const [draft, setDraft] = useState<Partial<Record<SettingKey, boolean>>>({});

  const { data, isPending, isError, error, refetch } = useQuery<
    ApiEnvelope<SchoolSettingsData>
  >({
    queryKey: SCHOOL_SETTINGS_KEY,
    queryFn: async () => {
      const { data, error } = await clientAuthFetch<
        ApiEnvelope<SchoolSettingsData>
      >(`school-settings/detail/?school-id=${SCHOOL_ID}`);
      if (error) throw new Error(error.message);
      return data!;
    },
    initialData: initialData ?? undefined,
    // Treat the server-fetched data as fresh so it is not refetched on mount.
    staleTime: INITIAL_DATA_STALE_MS,
  });

  const { mutate, isPending: isSaving } = useMutation({
    mutationFn: async (changes: Partial<Record<SettingKey, boolean>>) => {
      const { data, error } = await clientAuthFetch<
        ApiEnvelope<SchoolSettingsData>
      >("school-settings/detail/", {
        method: "PUT",
        body: { school_id: SCHOOL_ID, ...changes },
      });
      if (error) throw new Error(error.message);
      return data!;
    },
    onSuccess: (response) => {
      toast.success("School settings saved.");
      // Show the saved settings straight away instead of waiting for a refetch.
      queryClient.setQueryData(SCHOOL_SETTINGS_KEY, response);
      setDraft({});
    },
    onError: (err: Error) => {
      toast.error(err.message || "Could not save school settings.");
    },
  });

  if (isPending) return <TableLoader rows={4} />;
  if (isError || !data) {
    return (
      <ErrorNotice
        message={error?.message ?? "Could not load school settings."}
        onRetry={() => refetch()}
      />
    );
  }

  const saved = data.data;

  // A switch counts as changed only when its draft differs from the saved value.
  function isChanged(key: SettingKey): boolean {
    return draft[key] !== undefined && draft[key] !== saved[key];
  }

  const hasChanges = ALL_KEYS.some(isChanged);

  function handleSave() {
    const changes: Partial<Record<SettingKey, boolean>> = {};
    for (const key of ALL_KEYS) {
      if (isChanged(key)) changes[key] = draft[key];
    }
    mutate(changes);
  }

  return (
    <div>
      {SETTING_GROUPS.map((group) => (
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
