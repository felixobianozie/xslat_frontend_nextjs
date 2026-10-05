"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Termmigratepanel.tsx
//
// Copies one term's setup into the school's current term (POST term/migrate/).
//
//   Source       any other term of the school
//   Destination  the current term. It is fixed, because the backend only
//                accepts a destination that is current and whose session is
//                current, and the destination must still be empty.
//
// Two modes set the main behaviour:
//   same_session      copy the structure and students into the new term
//   session_rollover  also promote students to the next level
//                     ("Only promote students who passed" is on by default;
//                     students who did not pass repeat their level)
//
// "Choose what to copy" switches each part of the setup on or off. A part that
// needs another part is greyed out while that other part is off, and turning a
// part off turns off the parts that depend on it:
//
//   sections → levels → arms → arm configuration, arm staff, enrollments
//   subjects → subject arms (also needs arms) → subject teachers, categories
//   subjects → subject exclusions
//
// After a successful run the form is replaced by the report of what happened.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { toast } from "react-toastify";

import { useClientAuthFetch } from "@/lib/Useclientauthfetch";
import type {
  ApiEnvelope,
  MigrationReportData,
  SchoolDetailData,
  SessionRecord,
  TermMigrationMode,
} from "@/types/configurations";
import { SCHOOL_ID, SaveError } from "../configutils";
import ConfigPanel from "./Configpanel";
import { PublicationNotice, SelectField, ToggleRow } from "./Configui";
import MigrationReport from "./Migrationreport";

// ── Copy options ─────────────────────────────────────────────────────────────

type FlagKey =
  | "include_sections"
  | "include_levels"
  | "include_arms"
  | "include_arm_config"
  | "include_arm_staff"
  | "include_enrollments"
  | "include_subjects"
  | "include_subject_arms"
  | "include_subject_teachers"
  | "include_subject_categories"
  | "include_subject_exclusions";

interface FlagOption {
  key: FlagKey;
  label: string;
  // Options that must be on before this one can be on.
  needs: FlagKey[];
}

const FLAG_OPTIONS: FlagOption[] = [
  { key: "include_sections", label: "Sections", needs: [] },
  { key: "include_levels", label: "Levels", needs: ["include_sections"] },
  { key: "include_arms", label: "Arms", needs: ["include_levels"] },
  {
    key: "include_arm_config",
    label: "Arm settings (grading, formats, pass rule)",
    needs: ["include_arms"],
  },
  {
    key: "include_arm_staff",
    label: "Class teachers",
    needs: ["include_arms"],
  },
  {
    key: "include_enrollments",
    label: "Student enrollments",
    needs: ["include_arms"],
  },
  { key: "include_subjects", label: "Subjects", needs: [] },
  {
    key: "include_subject_arms",
    label: "Subjects offered by each arm",
    needs: ["include_subjects", "include_arms"],
  },
  {
    key: "include_subject_teachers",
    label: "Subject teachers",
    needs: ["include_subject_arms"],
  },
  {
    key: "include_subject_categories",
    label: "Subject categories",
    needs: ["include_subject_arms"],
  },
  {
    key: "include_subject_exclusions",
    label: "Subject exclusions",
    needs: ["include_subjects"],
  },
];

type FlagState = Record<FlagKey, boolean>;

// Everything is copied except subject exclusions.
const DEFAULT_FLAGS: FlagState = {
  include_sections: true,
  include_levels: true,
  include_arms: true,
  include_arm_config: true,
  include_arm_staff: true,
  include_enrollments: true,
  include_subjects: true,
  include_subject_arms: true,
  include_subject_teachers: true,
  include_subject_categories: true,
  include_subject_exclusions: false,
};

// Returns a copy of `flags` with `key` switched off, along with every option
// that depends on it, directly or through another option.
function switchOff(flags: FlagState, key: FlagKey): FlagState {
  const next = { ...flags, [key]: false };
  for (const option of FLAG_OPTIONS) {
    if (option.needs.includes(key) && next[option.key]) {
      return switchOff(next, option.key);
    }
  }
  return next;
}

const MODE_OPTIONS: { value: TermMigrationMode; label: string }[] = [
  {
    value: "same_session",
    label: "Same session (copy setup and students)",
  },
  {
    value: "session_rollover",
    label:
      "New session (copy setup and students; promote students to the next applicable level)",
  },
];

// ── Component ────────────────────────────────────────────────────────────────

interface TermMigratePanelProps {
  sessions: SessionRecord[];
  /** The school's current term, or null when none is set. */
  destination: SchoolDetailData["current_term"];
  onClose: () => void;
  /** Called once a migration has succeeded, so cached data can be refreshed. */
  onMigrated: () => void;
}

export default function TermMigratePanel({
  sessions,
  destination,
  onClose,
  onMigrated,
}: TermMigratePanelProps) {
  const { clientAuthFetch } = useClientAuthFetch();

  const [sourceId, setSourceId] = useState("");
  const [mode, setMode] = useState<TermMigrationMode>("same_session");
  const [requirePass, setRequirePass] = useState(true);
  const [flags, setFlags] = useState<FlagState>(DEFAULT_FLAGS);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [report, setReport] = useState<MigrationReportData | null>(null);

  // Every term of the school except the destination, labelled with its session.
  const sourceOptions = [
    { value: "", label: "Select a term" },
    ...sessions.flatMap((session) =>
      session.terms
        .filter((term) => term.id !== destination?.id)
        .map((term) => ({
          value: term.id,
          label: `${term.name} | ${session.name}`,
        })),
    ),
  ];

  function handleFlagChange(option: FlagOption, on: boolean) {
    setFlags((previous) =>
      on
        ? { ...previous, [option.key]: true }
        : switchOff(previous, option.key),
    );
  }

  const { mutate, isPending } = useMutation<
    ApiEnvelope<MigrationReportData>,
    SaveError,
    void
  >({
    mutationFn: async () => {
      const { data, error } = await clientAuthFetch<
        ApiEnvelope<MigrationReportData>
      >("term/migrate/", {
        method: "POST",
        body: {
          school_id: SCHOOL_ID,
          source_term_id: sourceId,
          destination_term_id: destination?.id,
          mode,
          require_pass_to_promote: requirePass,
          ...flags,
        },
      });
      if (error) throw new SaveError(error.message, error.data);
      return data!;
    },
    onSuccess: (response) => {
      toast.success(response.message);
      setReport(response.data);
      onMigrated();
    },
    onError: (err) => {
      setErrorMessage(err.message);
      toast.error(err.message);
    },
  });

  // After a migration the panel only shows the report.
  if (report) {
    return (
      <ConfigPanel
        title="Migration report"
        subtitle={destination ? `Copied into ${destination.name}` : undefined}
        submitLabel="Done"
        isPending={false}
        canSubmit
        onSubmit={onClose}
        onClose={onClose}
      >
        <MigrationReport report={report} />
      </ConfigPanel>
    );
  }

  return (
    <ConfigPanel
      title="Migrate term"
      subtitle="Copy a term's setup into the current term."
      submitLabel="Start migration"
      isPending={isPending}
      canSubmit={!!destination && !!sourceId}
      onSubmit={() => {
        setErrorMessage(null);
        mutate();
      }}
      onClose={onClose}
    >
      {!destination ? (
        <PublicationNotice>
          There is no current term. Set a current session and term on the
          calendar first, then come back to migrate.
        </PublicationNotice>
      ) : (
        <>
          <PublicationNotice>
            The current term must be empty. Once anything has been added to it,
            it can no longer receive a migration.
          </PublicationNotice>

          <SelectField
            id="migrate-source"
            label="Copy from"
            required
            value={sourceId}
            onChange={setSourceId}
            options={sourceOptions}
          />

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
            <p className="text-[11px] text-slate-400">
              Copy into (current term)
            </p>
            <p className="text-xs font-medium text-slate-800">
              {destination.name} | {destination.session.name}
            </p>
          </div>

          <SelectField
            id="migrate-mode"
            label="Migration type"
            value={mode}
            onChange={(value) => setMode(value as TermMigrationMode)}
            options={MODE_OPTIONS}
          />

          {mode === "session_rollover" && (
            <ToggleRow
              compact
              label="Only promote students who passed"
              description="Students who did not pass repeat their level instead of moving up."
              checked={requirePass}
              onChange={setRequirePass}
            />
          )}

          {/* What to copy */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setOptionsOpen((open) => !open)}
              aria-expanded={optionsOpen}
              className="cursor-pointer w-full flex items-center justify-between px-3 py-2.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <span>Choose what to copy</span>
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${
                  optionsOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {optionsOpen && (
              <div className="px-3 divide-y divide-slate-100">
                {FLAG_OPTIONS.map((option) => (
                  <div key={option.key} className="py-3">
                    <ToggleRow
                      compact
                      label={option.label}
                      checked={flags[option.key]}
                      disabled={
                        isPending ||
                        option.needs.some((needed) => !flags[needed])
                      }
                      onChange={(on) => handleFlagChange(option, on)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {errorMessage && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700">
              {errorMessage}
            </p>
          )}
        </>
      )}
    </ConfigPanel>
  );
}
