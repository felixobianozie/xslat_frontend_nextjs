"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Schoolprofiletab.tsx
//
// The School Profile tab: the school's identity, location and web addresses,
// edited as one form.
//
// Backend reference (school/detail/):
//   GET ?id=…            returns the school record
//   PUT { school_id, … } updates only the fields that are sent and returns the
//                        full school record
//
// Data layer:
//   • The school record is loaded with React Query. The cache entry is shared
//     with the dashboard top bar and the other tabs that need the current term,
//     so it is often already cached when this tab opens.
//   • The form keeps a draft of the fields the user changed. Save sends only
//     those, then merges the saved profile fields into the cached school
//     record, so the current term in the cache is left alone.
//
// Validation runs only on fields the user has changed, so a field the server
// did not return never blocks saving another one.
//
// Name, abbreviation, address, city, LGA, state and country appear on result
// sheets. The backend refuses to change them once any arm has a submitted or
// approved broadsheet.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { useClientAuthFetch } from "@/lib/Useclientauthfetch";
import type { ApiEnvelope, SchoolDetailData } from "@/types/configurations";
import TableLoader from "../../components/Tableloader";
import {
  QUERY_STALE_MS,
  SCHOOL_ID,
  SCHOOL_KEY,
  SaveError,
  fieldMessage,
  type FieldErrors,
} from "../configutils";
import { ErrorNotice, PublicationNotice, TextField } from "./Configui";
import { SettingsFooter, SettingsSection } from "./Settingslayout";

// ── Fields ───────────────────────────────────────────────────────────────────

type ProfileKey =
  | "name"
  | "abbr"
  | "address"
  | "city"
  | "lga"
  | "state"
  | "country"
  | "latt"
  | "long"
  | "school_website"
  | "custom_url";

type ProfileValues = Record<ProfileKey, string>;

interface FieldDefinition {
  key: ProfileKey;
  label: string;
  required?: boolean;
  maxLength?: number;
  // How the value is checked beyond length.
  kind?: "url" | "latitude" | "longitude";
  placeholder?: string;
  hint?: string;
  // Spans both columns on larger screens.
  wide?: boolean;
}

interface FieldGroup {
  title: string;
  fields: FieldDefinition[];
}

const FIELD_GROUPS: FieldGroup[] = [
  {
    title: "School identity",
    fields: [
      { key: "name", label: "School name", required: true, maxLength: 255 },
      {
        key: "abbr",
        label: "Abbreviation",
        required: true,
        maxLength: 50,
        hint: "Must be unique. No spaces; use underscores instead.",
      },
    ],
  },
  {
    title: "Location",
    fields: [
      { key: "address", label: "Address", maxLength: 255, wide: true },
      { key: "city", label: "City", required: true, maxLength: 100 },
      { key: "lga", label: "Local government area", maxLength: 100 },
      { key: "state", label: "State", maxLength: 100 },
      { key: "country", label: "Country", required: true, maxLength: 100 },
      {
        key: "latt",
        label: "Latitude",
        kind: "latitude",
        placeholder: "6.524379",
        hint: "Between -90 and 90, up to 6 decimals.",
      },
      {
        key: "long",
        label: "Longitude",
        kind: "longitude",
        placeholder: "3.379206",
        hint: "Between -180 and 180, up to 6 decimals.",
      },
    ],
  },
  {
    title: "Web addresses",
    fields: [
      {
        key: "school_website",
        label: "School website",
        kind: "url",
        placeholder: "https://www.example.com",
        wide: true,
      },
      {
        key: "custom_url",
        label: "Custom domain",
        kind: "url",
        placeholder: "https://results.example.com",
        hint: "A custom domain linked to the school's page on this platform.",
        wide: true,
      },
    ],
  },
];

const ALL_FIELDS = FIELD_GROUPS.flatMap((group) => group.fields);
const PROFILE_KEYS = ALL_FIELDS.map((field) => field.key);

// ── Helpers ──────────────────────────────────────────────────────────────────

// The saved value of every field as text. A field the server did not return
// counts as empty.
function readSavedValues(school: SchoolDetailData): ProfileValues {
  const values = {} as ProfileValues;
  for (const key of PROFILE_KEYS) {
    values[key] = String(school[key] ?? "");
  }
  return values;
}

// "6.500000" and "6.5" are the same coordinate, so numbers are compared by value.
function normalise(key: ProfileKey, value: string): string {
  const text = value.trim();
  if ((key === "latt" || key === "long") && text !== "") {
    return String(Number(text));
  }
  return text;
}

// Returns a message when the value is not acceptable, otherwise undefined.
function validateField(
  field: FieldDefinition,
  value: string,
): string | undefined {
  const text = value.trim();

  if (!text) {
    return field.required
      ? `Enter the ${field.label.toLowerCase()}.`
      : undefined;
  }
  if (field.maxLength && text.length > field.maxLength) {
    return `Maximum ${field.maxLength} characters.`;
  }
  if (field.key === "abbr" && /\s/.test(text)) {
    return "No spaces. Use underscores instead.";
  }

  if (field.kind === "url") {
    try {
      const url = new URL(text);
      if (url.protocol !== "http:" && url.protocol !== "https:")
        throw new Error();
    } catch {
      return "Enter a full address starting with http:// or https://.";
    }
  }

  if (field.kind === "latitude" || field.kind === "longitude") {
    const limit = field.kind === "latitude" ? 90 : 180;
    const looksRight = /^-?\d{1,3}(\.\d{1,6})?$/.test(text);
    if (!looksRight || Math.abs(Number(text)) > limit) {
      return `Enter a number between -${limit} and ${limit}, with up to 6 decimals.`;
    }
  }

  return undefined;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function SchoolProfileTab() {
  const queryClient = useQueryClient();
  const { clientAuthFetch } = useClientAuthFetch();

  // Fields the user has changed and not yet saved.
  const [draft, setDraft] = useState<Partial<ProfileValues>>({});
  // Messages the backend sent back for individual fields.
  const [serverErrors, setServerErrors] = useState<FieldErrors>({});

  const { data, isPending, isError, error, refetch } = useQuery<
    ApiEnvelope<SchoolDetailData>
  >({
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

  const { mutate, isPending: isSaving } = useMutation<
    ApiEnvelope<SchoolDetailData>,
    SaveError,
    Record<string, string | null>
  >({
    mutationFn: async (changes) => {
      const { data, error } = await clientAuthFetch<
        ApiEnvelope<SchoolDetailData>
      >("school/detail/", {
        method: "PUT",
        body: { school_id: SCHOOL_ID, ...changes },
      });
      if (error) throw new SaveError(error.message, error.data);
      return data!;
    },
    onSuccess: (response) => {
      toast.success("School profile saved.");

      // Copy only the profile fields from the response into the cached school
      // record. The response's current term has a different shape from the one
      // the rest of the dashboard reads, so it is not copied.
      const saved = Object.fromEntries(
        PROFILE_KEYS.map((key) => [key, response.data[key]]),
      );
      queryClient.setQueryData<ApiEnvelope<SchoolDetailData>>(
        SCHOOL_KEY,
        (previous) =>
          previous
            ? { ...previous, data: { ...previous.data, ...saved } }
            : previous,
      );

      setDraft({});
      setServerErrors({});
    },
    onError: (err) => {
      setServerErrors(err.fieldErrors);
      toast.error(err.message);
    },
  });

  if (isPending) return <TableLoader rows={4} />;
  if (isError || !data) {
    return (
      <ErrorNotice
        message={error?.message ?? "Could not load the school profile."}
        onRetry={() => refetch()}
      />
    );
  }

  const saved = readSavedValues(data.data);

  // What the input shows: the draft when there is one, otherwise the saved value.
  function valueOf(key: ProfileKey): string {
    return draft[key] ?? saved[key];
  }

  // A field counts as changed only when its draft differs from the saved value.
  function isChanged(key: ProfileKey): boolean {
    const text = draft[key];
    return (
      text !== undefined && normalise(key, text) !== normalise(key, saved[key])
    );
  }

  function handleChange(key: ProfileKey, value: string) {
    setDraft((previous) => ({ ...previous, [key]: value }));
    setServerErrors((previous) => ({ ...previous, [key]: [] }));
  }

  // Problems are checked on changed fields only.
  const problems: Partial<Record<ProfileKey, string>> = {};
  for (const field of ALL_FIELDS) {
    if (isChanged(field.key)) {
      problems[field.key] = validateField(field, valueOf(field.key));
    }
  }

  const hasChanges = PROFILE_KEYS.some(isChanged);
  const hasProblems = Object.values(problems).some(Boolean);

  function handleSave() {
    if (hasProblems) {
      toast.error("Fix the highlighted fields before saving.");
      return;
    }

    const changes: Record<string, string | null> = {};
    for (const key of PROFILE_KEYS) {
      if (!isChanged(key)) continue;
      const text = valueOf(key).trim();
      // An emptied coordinate is sent as null, which clears it.
      changes[key] =
        (key === "latt" || key === "long") && text === "" ? null : text;
    }
    mutate(changes);
  }

  return (
    <div>
      <div className="mb-4">
        <PublicationNotice>
          School name, abbreviation, address, city, LGA, state and country
          appear on result sheets. They cannot be changed once an arm has a
          submitted or approved broadsheet. The server will reject the save if
          that applies.
        </PublicationNotice>
      </div>

      {FIELD_GROUPS.map((group) => (
        <SettingsSection key={group.title} title={group.title}>
          <div className="grid grid-cols-1 gap-5 py-5 sm:grid-cols-2">
            {group.fields.map((field) => (
              <TextField
                key={field.key}
                id={`school-${field.key}`}
                label={field.label}
                required={field.required}
                type={field.kind === "url" ? "url" : "text"}
                value={valueOf(field.key)}
                onChange={(value) => handleChange(field.key, value)}
                placeholder={field.placeholder}
                hint={field.hint}
                disabled={isSaving}
                error={
                  problems[field.key] ?? fieldMessage(serverErrors, field.key)
                }
                className={field.wide ? "sm:col-span-2" : undefined}
              />
            ))}
          </div>
        </SettingsSection>
      ))}

      <SettingsFooter
        hasChanges={hasChanges}
        isSaving={isSaving}
        onReset={() => {
          setDraft({});
          setServerErrors({});
        }}
        onSave={handleSave}
      />
    </div>
  );
}
