"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Armassignpanel.tsx
//
// Assigns school settings to the arms chosen on the Arm Settings tab.
//
// Each setting has a drop-down that starts on "Keep current". Only the
// settings the admin changes are sent:
//
//   Grading, formats, pass rule  one PUT arm/detail/config/ per arm, carrying
//                                all of the changed settings together
//   Result template              one PUT result-template/assign/ listing every
//                                chosen arm in `arm_ids`
//
// Requests run one after another. An arm that fails its settings request does
// not stop the others; the panel stays open and lists each failure, while the
// arms that succeeded are already saved and are reported to the tab so only
// their details reload.
//
// The template request is all or nothing: if any chosen arm is refused (for
// example its broadsheet is locked), no arm gets the template and the backend's
// message names the arm. The backend also refuses inactive templates, so only
// active ones are offered here. Assigning needs the "assign result template"
// permission in the school; it does not allow editing a template.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { LayoutTemplate } from "lucide-react";
import { toast } from "react-toastify";

import { useClientAuthFetch } from "@/lib/Useclientauthfetch";
import type {
  AffectiveFormatRecord,
  ApiEnvelope,
  CognitiveFormatRecord,
  GradingFormatRecord,
  PassRuleRecord,
  PsychomotorFormatRecord,
  ResultTemplateListItem,
} from "@/types/configurations";
import {
  AFFECTIVE_FORMATS_KEY,
  ASSIGNMENT_PARAMETERS,
  COGNITIVE_FORMATS_KEY,
  GRADING_FORMATS_KEY,
  QUERY_STALE_MS,
  PASS_RULES_KEY,
  PSYCHOMOTOR_FORMATS_KEY,
  RESULT_TEMPLATES_KEY,
  SCHOOL_ID,
  armLabel,
  type AssignmentKey,
} from "../configutils";
import ConfigPanel from "./Configpanel";
import { PublicationNotice, SelectField } from "./Configui";
import TemplatePreviewModal from "./Templatepreviewmodal";

type FormState = Record<AssignmentKey, string>;

const EMPTY_FORM: FormState = {
  result_template: "",
  cog_grading_format: "",
  aff_grading_format: "",
  psy_grading_format: "",
  cognitive_assessment_format: "",
  affective_assessment_format: "",
  psychomotor_assessment_format: "",
  pass_rule: "",
};

interface ArmAssignPanelProps {
  /** The arms the settings will be assigned to. */
  arms: ClassArm[];
  onClose: () => void;
  /** Called with the ids of the arms that were changed, so only their details are refreshed. */
  onChanged: (armIds: string[]) => void;
}

export default function ArmAssignPanel({
  arms,
  onClose,
  onChanged,
}: ArmAssignPanelProps) {
  const { clientAuthFetch } = useClientAuthFetch();

  // Loads one list the drop-downs are built from. Each query uses the same key
  // and URL as the tab that edits that list, so a list that tab already loaded
  // is reused.
  async function fetchList<T>(endpoint: string): Promise<ApiEnvelope<T[]>> {
    const { data, error } = await clientAuthFetch<ApiEnvelope<T[]>>(
      `${endpoint}?school-id=${SCHOOL_ID}`,
    );
    if (error) throw new Error(error.message);
    return data!;
  }

  const gradingFormats = useQuery({
    queryKey: GRADING_FORMATS_KEY,
    queryFn: () => fetchList<GradingFormatRecord>("grading-format/list/"),
    staleTime: QUERY_STALE_MS,
  });
  const cognitiveFormats = useQuery({
    queryKey: COGNITIVE_FORMATS_KEY,
    queryFn: () => fetchList<CognitiveFormatRecord>("cognitive-format/list/"),
    staleTime: QUERY_STALE_MS,
  });
  const affectiveFormats = useQuery({
    queryKey: AFFECTIVE_FORMATS_KEY,
    queryFn: () => fetchList<AffectiveFormatRecord>("affective-format/list/"),
    staleTime: QUERY_STALE_MS,
  });
  const psychomotorFormats = useQuery({
    queryKey: PSYCHOMOTOR_FORMATS_KEY,
    queryFn: () =>
      fetchList<PsychomotorFormatRecord>("psychomotor-format/list/"),
    staleTime: QUERY_STALE_MS,
  });
  const passRules = useQuery({
    queryKey: PASS_RULES_KEY,
    queryFn: () => fetchList<PassRuleRecord>("pass-rule/list/"),
    staleTime: QUERY_STALE_MS,
  });
  const resultTemplates = useQuery({
    queryKey: RESULT_TEMPLATES_KEY,
    queryFn: () => fetchList<ResultTemplateListItem>("result-template/list/"),
    staleTime: QUERY_STALE_MS,
  });

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [failures, setFailures] = useState<string[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Drop-down choices: "Keep current" first, then the list's items by name.
  function optionsFor(items: { id: string; name: string }[] | undefined) {
    return [
      { value: "", label: "Keep current" },
      ...(items ?? []).map((item) => ({ value: item.id, label: item.name })),
    ];
  }

  const optionsByKey: Record<AssignmentKey, ReturnType<typeof optionsFor>> = {
    // Only active templates can be assigned.
    result_template: optionsFor(
      resultTemplates.data?.data.filter((template) => template.is_active),
    ),
    cog_grading_format: optionsFor(gradingFormats.data?.data),
    aff_grading_format: optionsFor(gradingFormats.data?.data),
    psy_grading_format: optionsFor(gradingFormats.data?.data),
    cognitive_assessment_format: optionsFor(cognitiveFormats.data?.data),
    affective_assessment_format: optionsFor(affectiveFormats.data?.data),
    psychomotor_assessment_format: optionsFor(psychomotorFormats.data?.data),
    pass_rule: optionsFor(
      passRules.data?.data.map((rule) => ({
        id: rule.id,
        name: rule.active ? rule.name : `${rule.name} (inactive)`,
      })),
    ),
  };

  const changedKeys = ASSIGNMENT_PARAMETERS.map((p) => p.key).filter(
    (key) => form[key] !== "",
  );

  const { mutate, isPending } = useMutation<
    { failures: string[]; changedArmIds: string[] },
    Error,
    FormState
  >({
    mutationFn: async (values) => {
      const problems: string[] = [];
      const changedArmIds = new Set<string>();

      // Grading, formats and pass rule: one request per arm.
      const configChanges: Record<string, string> = {};
      for (const { key } of ASSIGNMENT_PARAMETERS) {
        if (key !== "result_template" && values[key]) {
          configChanges[key] = values[key];
        }
      }

      if (Object.keys(configChanges).length > 0) {
        for (const arm of arms) {
          const { error } = await clientAuthFetch("arm/detail/config/", {
            method: "PUT",
            body: { id: arm.id, school_id: SCHOOL_ID, ...configChanges },
          });
          if (error) problems.push(`${armLabel(arm)}: ${error.message}`);
          else changedArmIds.add(arm.id);
        }
      }

      // Result template: one request for every chosen arm.
      if (values.result_template) {
        const { error } = await clientAuthFetch("result-template/assign/", {
          method: "PUT",
          body: {
            id: values.result_template,
            arm_ids: arms.map((arm) => arm.id),
          },
        });
        if (error) problems.push(`Result template: ${error.message}`);
        else arms.forEach((arm) => changedArmIds.add(arm.id));
      }

      return { failures: problems, changedArmIds: Array.from(changedArmIds) };
    },
    onSuccess: ({ failures: problems, changedArmIds }) => {
      const savedAny = changedArmIds.length > 0;
      if (savedAny) onChanged(changedArmIds);

      if (problems.length === 0) {
        toast.success("Settings assigned.");
        onClose();
        return;
      }
      setFailures(problems);
      toast.error(
        savedAny
          ? "Some assignments were not saved."
          : "No assignments were saved.",
      );
    },
  });

  return (
    <ConfigPanel
      title="Assign settings"
      subtitle={`${arms.length} ${arms.length === 1 ? "arm" : "arms"} selected: ${arms
        .map(armLabel)
        .join(", ")}`}
      submitLabel="Assign"
      isPending={isPending}
      canSubmit={changedKeys.length > 0}
      onSubmit={() => {
        setFailures([]);
        mutate(form);
      }}
      onClose={onClose}
    >
      <PublicationNotice>
        Arms whose broadsheet is submitted or approved are locked and cannot be
        changed. The server will reject any such arm and say so below.
      </PublicationNotice>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {ASSIGNMENT_PARAMETERS.map((parameter) => {
          const field = (
            <SelectField
              key={parameter.key}
              id={`assign-${parameter.key}`}
              label={parameter.label}
              value={form[parameter.key]}
              onChange={(value) =>
                setForm((previous) => ({ ...previous, [parameter.key]: value }))
              }
              options={optionsByKey[parameter.key]}
              disabled={isPending}
              className={
                parameter.key === "result_template"
                  ? "flex-1 min-w-0"
                  : undefined
              }
            />
          );

          if (parameter.key !== "result_template") return field;

          // The result template drop-down has a button beside it that opens
          // the read-only gallery of templates. It spans the full row so the
          // button has room.
          return (
            <div
              key={parameter.key}
              className="flex items-end gap-2 sm:col-span-2"
            >
              {field}
              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
                disabled={!resultTemplates.data}
                aria-label="View result templates"
                className="cursor-pointer shrink-0 flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 transition-colors hover:border-violet-300 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <LayoutTemplate size={14} />
                <span className="hidden sm:inline">View templates</span>
              </button>
            </div>
          );
        })}
      </div>

      {previewOpen && (
        <TemplatePreviewModal
          templates={resultTemplates.data?.data ?? []}
          selectedId={form.result_template}
          onClose={() => setPreviewOpen(false)}
        />
      )}

      {failures.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5">
          <p className="text-[11px] font-semibold text-red-700 mb-1.5">
            These were not saved:
          </p>
          <ul className="flex flex-col gap-1 text-[11px] text-red-700">
            {failures.map((failure, index) => (
              <li key={index}>{failure}</li>
            ))}
          </ul>
        </div>
      )}
    </ConfigPanel>
  );
}
