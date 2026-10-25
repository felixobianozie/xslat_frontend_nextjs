"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Staffemploymentpanel.tsx
//
// Slide-in panel that sets the employment type of one or several staff
// members at once: full-time, part-time, temporary, NYSC or not set.
//
// Pick one type. The panel shows how many of the chosen staff already have
// each type, and how many will change. Staff who already have the picked type
// are left alone, so nothing is saved for them.
//
// Saving. Each staff member is saved with PUT staff/portfolios/detail/ and
// only the employment is sent, so their roles, permissions and every other
// field stay as they are. Staff members are saved a few at a time. One
// failing does not stop the others; the panel stays open and lists each
// failure, and the staff that did save keep their change.
//
// The staff list is refreshed after saving, and so is the staff analytics.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { toast } from "react-toastify";
import { useClientAuthFetch } from "@/lib/Useclientauthfetch";
import ButtonLoader from "../../components/Buttonloader";
import { inGroupsOf } from "../staffaccess";
import { EMPLOYMENT_CHOICES } from "../staffstatus";

// ── Constants ────────────────────────────────────────────────────────────────

const SCHOOL_ID = process.env.NEXT_PUBLIC_SCHOOL_ID ?? "";

// How many staff members are saved at the same time.
const SAVE_BATCH_SIZE = 4;

// How many names the header lists before it says "+N more".
const MAX_NAMES_SHOWN = 8;

// ── Types ────────────────────────────────────────────────────────────────────

type Employment = StaffPortfolio["employment"];

interface ApplyResult {
  changed: number;
  failures: string[];
}

interface StaffEmploymentPanelProps {
  show: boolean;
  // Changes each time the panel opens, so every opening starts fresh.
  session: number;
  targets: StaffPortfolio[];
  onClose: () => void;
  // Called after every staff member was saved or had nothing to change.
  onApplied: () => void;
}

function staffName(portfolio: StaffPortfolio): string {
  const { first_name, last_name } = portfolio.staff_profile.user;
  return `${first_name} ${last_name}`;
}

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

// ── Panel ────────────────────────────────────────────────────────────────────

export default function StaffEmploymentPanel({
  show,
  session,
  targets,
  onClose,
  onApplied,
}: StaffEmploymentPanelProps) {
  return (
    <div
      className={`transition-all duration-500 ease-in-out overflow-hidden ${
        show ? "w-full opacity-100" : "w-0 opacity-0 h-0"
      }`}
    >
      {/* The body is keyed by the opening, so its choice resets every time. */}
      {targets.length > 0 && (
        <PanelBody
          key={session}
          targets={targets}
          onClose={onClose}
          onApplied={onApplied}
        />
      )}
    </div>
  );
}

function PanelBody({
  targets,
  onClose,
  onApplied,
}: Omit<StaffEmploymentPanelProps, "session" | "show">) {
  const queryClient = useQueryClient();
  const { clientAuthFetch } = useClientAuthFetch();

  const [picked, setPicked] = useState<Employment | null>(null);
  const [failures, setFailures] = useState<string[]>([]);

  const total = targets.length;
  const isBulk = total > 1;
  const pickedLabel =
    EMPLOYMENT_CHOICES.find((choice) => choice.value === picked)?.label ?? "";

  // The staff whose type is different from the one picked.
  const toChange =
    picked === null
      ? []
      : targets.filter((target) => target.employment !== picked);
  const alreadyThere = picked === null ? 0 : total - toChange.length;

  // ── Saving ─────────────────────────────────────────────────────────────────
  const { mutate, isPending } = useMutation<ApplyResult, Error, Employment>({
    mutationFn: async (employment) => {
      const result: ApplyResult = { changed: 0, failures: [] };
      const staffToSave = targets.filter(
        (target) => target.employment !== employment,
      );

      for (const group of inGroupsOf(staffToSave, SAVE_BATCH_SIZE)) {
        await Promise.all(
          group.map(async (target) => {
            try {
              const { error } = await clientAuthFetch(
                "staff/portfolios/detail/",
                {
                  method: "PUT",
                  body: {
                    portfolio_id: target.id,
                    school_id: SCHOOL_ID,
                    employment,
                  },
                },
              );
              if (error) throw new Error(error.message);
              result.changed += 1;
            } catch (err) {
              result.failures.push(
                `${staffName(target)}: ${
                  err instanceof Error ? err.message : "Could not be saved."
                }`,
              );
            }
          }),
        );
      }

      return result;
    },
    onSuccess: ({ changed, failures: problems }) => {
      if (changed > 0 || problems.length > 0) {
        queryClient.invalidateQueries({ queryKey: ["staff", SCHOOL_ID] });
        queryClient.invalidateQueries({
          queryKey: ["staff-analytics", SCHOOL_ID],
        });
      }

      if (problems.length === 0) {
        toast.success(
          changed === 0
            ? "Nothing needed to change."
            : `Employment set to ${pickedLabel} for ${plural(
                changed,
                "staff member",
                "staff members",
              )}.` +
                (alreadyThere > 0 ? ` ${alreadyThere} already had it.` : ""),
        );
        onApplied();
        return;
      }

      setFailures(problems);
      toast.error(
        changed > 0
          ? `Saved ${changed}, but ${problems.length} could not be saved.`
          : "No changes were saved.",
      );
    },
  });

  const names = targets.map(staffName);
  const shownNames = names.slice(0, MAX_NAMES_SHOWN);
  const hiddenCount = names.length - shownNames.length;

  return (
    <div className="w-full">
      {/* Back link */}
      <button
        type="button"
        onClick={onClose}
        disabled={isPending}
        className="cursor-pointer flex items-center gap-1 text-xs text-red-600 hover:text-red-700 my-5 md:my-8 transition-all hover:scale-105 w-fit disabled:opacity-50"
      >
        <ChevronLeft size={14} />
        <span>Back</span>
      </button>

      {/* Panel card */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm mb-10 text-black">
        {/* Header */}
        <div className="bg-slate-100 border-b border-slate-200 px-5 py-4">
          <h2 className="text-sm font-bold text-slate-800">Employment type</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {isBulk ? `${total} staff members selected.` : names[0]}
          </p>
          {isBulk && (
            <ul className="flex flex-wrap gap-1.5 mt-3">
              {shownNames.map((name, index) => (
                <li
                  key={`${name}-${index}`}
                  className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] text-slate-600"
                >
                  {name}
                </li>
              ))}
              {hiddenCount > 0 && (
                <li className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] text-slate-600">
                  +{hiddenCount} more
                </li>
              )}
            </ul>
          )}
        </div>

        <div className="flex flex-col gap-4 px-5 py-6">
          <p className="text-xs text-slate-500 leading-relaxed">
            Choose the employment type to give to{" "}
            {isBulk ? "all the selected staff" : "this staff member"}. Their
            roles, permissions and everything else stay as they are.
          </p>

          <div
            role="radiogroup"
            aria-label="Employment type"
            className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3"
          >
            {EMPLOYMENT_CHOICES.map((choice) => {
              const holders = targets.filter(
                (target) => target.employment === choice.value,
              ).length;
              const selected = picked === choice.value;
              return (
                <button
                  key={choice.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={isPending}
                  onClick={() => {
                    setPicked(choice.value);
                    setFailures([]);
                  }}
                  className={`cursor-pointer flex flex-col items-start gap-0.5 rounded-xl border px-4 py-3 text-left transition-colors disabled:opacity-50 ${
                    selected
                      ? "border-violet-600 bg-violet-50"
                      : "border-slate-200 bg-white hover:border-violet-300"
                  }`}
                >
                  <span
                    className={`text-xs font-semibold ${
                      selected ? "text-violet-700" : "text-slate-700"
                    }`}
                  >
                    {choice.label}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {isBulk
                      ? `${holders} of ${total} have this now`
                      : holders === 1
                        ? "Current type"
                        : "Not the current type"}
                  </span>
                </button>
              );
            })}
          </div>

          {failures.length > 0 && (
            <div
              role="alert"
              className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-700"
            >
              <p className="font-semibold mb-1">Some could not be saved:</p>
              <ul className="list-disc pl-4 space-y-0.5">
                {failures.map((failure, index) => (
                  <li key={index}>{failure}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-3 bg-slate-50 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 text-[11px] text-slate-500">
            {picked === null ? (
              <p>No type chosen yet.</p>
            ) : (
              <>
                <p className="text-slate-700">Set {pickedLabel}.</p>
                <p>
                  {toChange.length === 0
                    ? isBulk
                      ? "Everyone already has this."
                      : "This staff member already has this."
                    : `${plural(toChange.length, "staff member", "staff members")} will change.`}
                </p>
              </>
            )}
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="cursor-pointer px-4 py-2 text-xs border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                if (picked === null) return;
                setFailures([]);
                mutate(picked);
              }}
              disabled={picked === null || toChange.length === 0 || isPending}
              className="cursor-pointer relative flex items-center justify-center gap-2 px-4 py-2 text-xs text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm bg-violet-600 hover:bg-violet-700 shadow-violet-200"
            >
              <span className={isPending ? "invisible" : ""}>
                {isBulk ? `Apply to ${total} staff` : "Apply"}
              </span>
              <span
                className={`absolute inset-0 flex items-center justify-center ${
                  isPending ? "" : "invisible"
                }`}
              >
                <ButtonLoader />
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
