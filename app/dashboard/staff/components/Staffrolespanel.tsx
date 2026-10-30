"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Staffrolespanel.tsx
//
// Slide-in panel that assigns roles and permissions to one or several staff
// members, or removes them.
//
// Two modes, one at a time, chosen with the switch at the top:
//
//   Assign   Every role and permission is listed. Tick the ones to give to all
//            the selected staff. Ones that every selected staff member already
//            has show ticked and cannot be changed; ones only some have say
//            how many.
//   Remove   Only the roles and permissions that at least one selected staff
//            member holds are listed, with how many hold each. Tick the ones to
//            take away from the staff who hold them.
//
// Changing mode clears the ticks, so a tick never means anything but the mode
// on screen. Whatever is not ticked stays as it is for every staff member, so
// a bulk change never wipes what a staff member already has. The rules live in
// ../staffaccess.ts.
//
// Roles come first. Individual permissions are given directly to a staff
// member on top of their roles; they sit in a collapsible section because
// roles should cover most access.
//
// Saving. The panel loads each selected staff member's current roles and
// direct permissions (GET staff/portfolios/access/). The backend replaces a
// staff member's whole role list and whole permission list on every save (PUT
// staff/portfolios/detail/), so for each staff member the panel reads their
// lists again, works out the final lists, and saves only the lists that
// differ. Staff members are saved a few at a time. One failing does not stop
// the others; the panel stays open and lists each failure, and the staff that
// did save keep their changes.
//
// Roles come from roles/list/ and permissions from permissions/, shared with
// the Roles & Permissions tab on the Configurations page.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronLeft } from "lucide-react";
import { toast } from "react-toastify";

import { useClientAuthFetch } from "@/lib/Useclientauthfetch";
import ButtonLoader from "../../components/Buttonloader";
import TableLoader from "../../components/Tableloader";
import {
  ErrorNotice,
  PublicationNotice,
} from "../../configurations/components/Configui";
import PermissionChecklist from "../../configurations/components/Permissionchecklist";
import { ROLE_MEMBERS_KEY } from "../../configurations/configutils";
import {
  usePermissionCatalogue,
  useRoles,
} from "../../configurations/hooks/Useroles";
import {
  applyChange,
  countStaffAffected,
  holderCount,
  inGroupsOf,
  sameItems,
  type Mode,
} from "../staffaccess";

// ── Constants ────────────────────────────────────────────────────────────────

const SCHOOL_ID = process.env.NEXT_PUBLIC_SCHOOL_ID ?? "";

// How many staff members are saved at the same time.
const SAVE_BATCH_SIZE = 4;

// How many names the header lists before it says "+N more".
const MAX_NAMES_SHOWN = 8;

// Followed by the portfolio id: one staff member's current roles and
// permissions.
const ACCESS_KEY = ["staff-portfolio-access", SCHOOL_ID];

const MODES: { id: Mode; label: string }[] = [
  { id: "assign", label: "Assign" },
  { id: "remove", label: "Remove" },
];

// ── Types ────────────────────────────────────────────────────────────────────

// GET staff/portfolios/access/. Roles carry their clean names and permissions
// their codenames.
interface PortfolioAccessResponse {
  message: string;
  data: {
    id: string;
    roles: { id: number; name: string }[];
    permissions: { codename: string; app_label: string }[];
  };
}

interface PortfolioAccess {
  roles: string[];
  permissions: string[];
}

interface ApplyResult {
  changed: number;
  unchanged: number;
  failures: string[];
}

interface StaffRolesPanelProps {
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

export default function StaffRolesPanel({
  show,
  session,
  targets,
  onClose,
  onApplied,
}: StaffRolesPanelProps) {
  return (
    <div
      className={`transition-all duration-500 ease-in-out overflow-hidden ${
        show ? "w-full opacity-100" : "w-0 opacity-0 h-0"
      }`}
    >
      {/* The body is keyed by the opening, so its choices reset every time. */}
      {targets.length > 0 && (
        <PanelBody
          key={session}
          show={show}
          targets={targets}
          onClose={onClose}
          onApplied={onApplied}
        />
      )}
    </div>
  );
}

function PanelBody({
  show,
  targets,
  onClose,
  onApplied,
}: Omit<StaffRolesPanelProps, "session">) {
  const queryClient = useQueryClient();
  const { clientAuthFetch } = useClientAuthFetch();

  const [mode, setMode] = useState<Mode>("assign");
  const [pickedRoles, setPickedRoles] = useState<string[]>([]);
  const [pickedPermissions, setPickedPermissions] = useState<string[]>([]);
  const [showPermissions, setShowPermissions] = useState(false);
  const [failures, setFailures] = useState<string[]>([]);

  const rolesQuery = useRoles();
  const catalogueQuery = usePermissionCatalogue();
  const roles = rolesQuery.data?.data ?? [];
  const catalogue = catalogueQuery.data?.data ?? [];

  async function fetchAccess(portfolioId: string): Promise<PortfolioAccess> {
    const { data, error } = await clientAuthFetch<PortfolioAccessResponse>(
      `staff/portfolios/access/?portfolio-id=${portfolioId}&school-id=${SCHOOL_ID}`,
    );
    if (error) throw new Error(error.message);

    return {
      roles: data!.data.roles.map((role) => role.name),
      permissions: data!.data.permissions.map((item) => item.codename),
    };
  }

  // What each selected staff member holds now. Always read again when the
  // panel opens.
  const accessQueries = useQueries({
    queries: targets.map((target) => ({
      queryKey: [...ACCESS_KEY, target.id],
      queryFn: () => fetchAccess(target.id),
      enabled: show,
      staleTime: 0,
    })),
  });

  const isLoadingAccess = accessQueries.some((query) => query.isPending);
  const failedAccess = accessQueries.filter((query) => query.isError);
  const accessReady = accessQueries.every((query) => query.isSuccess);

  // One list per staff member, in the order of `targets`.
  const roleHoldings = accessQueries.map((query) => query.data?.roles ?? []);
  const permissionHoldings = accessQueries.map(
    (query) => query.data?.permissions ?? [],
  );

  const total = targets.length;
  const isBulk = total > 1;
  const isRemove = mode === "remove";

  const staffAffected = countStaffAffected(
    roleHoldings,
    pickedRoles,
    permissionHoldings,
    pickedPermissions,
    mode,
  );
  const pickedCount = pickedRoles.length + pickedPermissions.length;

  function changeMode(next: Mode) {
    setMode(next);
    setPickedRoles([]);
    setPickedPermissions([]);
    setFailures([]);
  }

  function toggleRole(name: string) {
    setPickedRoles((previous) =>
      previous.includes(name)
        ? previous.filter((item) => item !== name)
        : [...previous, name],
    );
  }

  // ── Saving ─────────────────────────────────────────────────────────────────
  const { mutate, isPending } = useMutation<ApplyResult, Error, void>({
    mutationFn: async () => {
      const result: ApplyResult = { changed: 0, unchanged: 0, failures: [] };

      for (const group of inGroupsOf(targets, SAVE_BATCH_SIZE)) {
        await Promise.all(
          group.map(async (target) => {
            try {
              // Read the staff member's lists again, so a change made since
              // the panel opened is not overwritten.
              const current = await fetchAccess(target.id);
              const finalRoles = applyChange(current.roles, pickedRoles, mode);
              const finalPermissions = applyChange(
                current.permissions,
                pickedPermissions,
                mode,
              );

              const body: Record<string, unknown> = {
                portfolio_id: target.id,
                school_id: SCHOOL_ID,
              };
              if (!sameItems(finalRoles, current.roles)) {
                body.roles = finalRoles;
              }
              if (!sameItems(finalPermissions, current.permissions)) {
                body.permissions = finalPermissions;
              }

              if (!("roles" in body) && !("permissions" in body)) {
                result.unchanged += 1;
                return;
              }

              const { error } = await clientAuthFetch(
                "staff/portfolios/detail/",
                { method: "PUT", body },
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
    onSuccess: ({ changed, unchanged, failures: problems }) => {
      if (changed > 0 || problems.length > 0) {
        queryClient.invalidateQueries({ queryKey: ACCESS_KEY });
        queryClient.invalidateQueries({ queryKey: ROLE_MEMBERS_KEY });
        queryClient.invalidateQueries({ queryKey: ["staff", SCHOOL_ID] });
      }

      if (problems.length === 0) {
        const verb = isRemove ? "Removed from" : "Assigned to";
        toast.success(
          changed === 0
            ? "Nothing needed to change."
            : `${verb} ${plural(changed, "staff member", "staff members")}.` +
                (unchanged > 0 ? ` ${unchanged} needed no change.` : ""),
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

  // ── Roles list ─────────────────────────────────────────────────────────────
  function renderRoles() {
    if (rolesQuery.isPending) return <TableLoader rows={2} />;
    if (rolesQuery.error) {
      return (
        <ErrorNotice
          message={rolesQuery.error.message}
          onRetry={() => rolesQuery.refetch()}
        />
      );
    }

    // Remove mode only lists roles somebody holds.
    const listed = roles
      .map((role) => ({ role, holders: holderCount(role.name, roleHoldings) }))
      .filter(({ holders }) => !isRemove || holders > 0);

    if (listed.length === 0) {
      return (
        <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-500">
          {isRemove
            ? `${isBulk ? "None of the selected staff hold" : "This staff member holds"} any roles.`
            : "The school has no roles yet. Create roles on the Roles & Permissions tab of the Configurations page."}
        </p>
      );
    }

    return (
      <ul className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
        {listed.map(({ role, holders }) => {
          // In assign mode a role every selected staff member holds is fixed.
          const locked = !isRemove && holders === total;
          const picked = pickedRoles.includes(role.name);

          let note = plural(
            role.permissions.length,
            "permission",
            "permissions",
          );
          if (isRemove && isBulk) note += ` · held by ${holders} of ${total}`;
          if (!isRemove && locked) {
            note += isBulk
              ? ` · all ${total} already have this`
              : " · already assigned";
          }
          if (!isRemove && !locked && holders > 0) {
            note += ` · ${holders} of ${total} already have this`;
          }

          return (
            <li key={role.id}>
              <label
                className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors ${
                  locked
                    ? "cursor-not-allowed border-slate-100 bg-slate-50 opacity-60"
                    : picked
                      ? isRemove
                        ? "cursor-pointer border-red-300 bg-red-50/50"
                        : "cursor-pointer border-violet-300 bg-violet-50/50"
                      : "cursor-pointer border-slate-200 bg-white hover:border-violet-200"
                }`}
              >
                <input
                  type="checkbox"
                  checked={locked || picked}
                  disabled={locked || isPending}
                  onChange={() => toggleRole(role.name)}
                  className={`h-4 w-4 shrink-0 ${
                    isRemove ? "accent-red-600" : "accent-violet-600"
                  }`}
                />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-slate-800 truncate">
                    {role.name}
                  </span>
                  <span className="block text-[11px] text-slate-400">
                    {note}
                  </span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    );
  }

  // ── Individual permissions list ────────────────────────────────────────────
  function renderPermissions() {
    if (catalogueQuery.isPending) return <TableLoader rows={2} />;
    if (catalogueQuery.error) {
      return (
        <ErrorNotice
          message={catalogueQuery.error.message}
          onRetry={() => catalogueQuery.refetch()}
        />
      );
    }

    // Remove mode only lists permissions somebody holds directly.
    const listed = isRemove
      ? catalogue.filter(
          (permission) =>
            holderCount(permission.codename, permissionHoldings) > 0,
        )
      : catalogue;

    if (listed.length === 0) {
      return (
        <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-500">
          {isBulk
            ? "None of the selected staff have individual permissions."
            : "This staff member has no individual permissions."}
        </p>
      );
    }

    const locked: string[] = [];
    const notes: Record<string, string> = {};
    for (const permission of listed) {
      const holders = holderCount(permission.codename, permissionHoldings);

      if (isRemove) {
        if (isBulk)
          notes[permission.codename] = `Held by ${holders} of ${total}`;
      } else if (holders === total) {
        locked.push(permission.codename);
        notes[permission.codename] = isBulk
          ? `All ${total} already have this`
          : "Already assigned";
      } else if (holders > 0) {
        notes[permission.codename] = `${holders} of ${total} already have this`;
      }
    }

    return (
      <PermissionChecklist
        catalogue={listed}
        selected={pickedPermissions}
        locked={locked}
        notes={notes}
        disabled={isPending}
        onChange={setPickedPermissions}
      />
    );
  }

  // ── Footer summary ─────────────────────────────────────────────────────────
  const summaryParts = [
    pickedRoles.length > 0 ? plural(pickedRoles.length, "role", "roles") : null,
    pickedPermissions.length > 0
      ? plural(pickedPermissions.length, "permission", "permissions")
      : null,
  ].filter((part): part is string => part !== null);

  const actionLabel = isRemove
    ? isBulk
      ? `Remove from ${total} staff`
      : "Remove"
    : isBulk
      ? `Assign to ${total} staff`
      : "Assign";

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
          <h2 className="text-sm font-bold text-slate-800">
            Roles & Permissions
          </h2>
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

        <div className="flex flex-col gap-6 px-5 py-6">
          {/* Mode switch */}
          <div className="flex flex-col gap-2">
            <div
              role="group"
              aria-label="Assign or remove"
              className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 text-xs sm:w-72"
            >
              {MODES.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => changeMode(option.id)}
                  disabled={isPending}
                  aria-pressed={mode === option.id}
                  className={`cursor-pointer rounded-lg px-3 py-1.5 font-medium transition-colors disabled:opacity-50 ${
                    mode === option.id
                      ? option.id === "remove"
                        ? "bg-white text-red-600 shadow-sm"
                        : "bg-white text-violet-700 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              {isRemove
                ? `Take the ticked roles and permissions away from ${
                    isBulk
                      ? "the selected staff who hold them"
                      : "this staff member"
                  }. Everything else stays as it is.`
                : `Give the ticked roles and permissions to ${
                    isBulk ? "all the selected staff" : "this staff member"
                  }. What they already have stays as it is.`}
            </p>
          </div>

          {isRemove && (
            <PublicationNotice>
              {isBulk ? "These staff lose" : "This staff member loses"} the
              access the ticked items give as soon as you save. You can assign
              them again at any time.
            </PublicationNotice>
          )}

          {isLoadingAccess ? (
            <div>
              <p className="text-xs text-slate-500 mb-2">
                Loading what {isBulk ? "they" : "this staff member"} currently{" "}
                {isBulk ? "have" : "has"}…
              </p>
              <TableLoader rows={3} />
            </div>
          ) : failedAccess.length > 0 ? (
            <ErrorNotice
              message={
                failedAccess.length === total
                  ? "Could not load the current roles and permissions."
                  : `Could not load the current roles and permissions of ${plural(
                      failedAccess.length,
                      "staff member",
                      "staff members",
                    )}.`
              }
              onRetry={() => failedAccess.forEach((query) => query.refetch())}
            />
          ) : (
            <>
              {/* Roles */}
              <section className="flex flex-col gap-3">
                <div>
                  <h3 className="text-xs font-semibold text-slate-700">
                    Roles
                    {pickedRoles.length > 0 && (
                      <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-slate-600">
                        {pickedRoles.length} ticked
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    A role gives a set of permissions.
                  </p>
                </div>
                {renderRoles()}
              </section>

              {/* Individual permissions */}
              <section className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => setShowPermissions((open) => !open)}
                  aria-expanded={showPermissions}
                  className="cursor-pointer flex w-full items-center justify-between gap-3 text-left bg-slate-100 p-3 rounded-lg"
                >
                  <span>
                    <span className="block text-xs font-semibold text-slate-700">
                      Individual permissions
                      {pickedPermissions.length > 0 && (
                        <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-slate-600">
                          {pickedPermissions.length} ticked
                        </span>
                      )}
                    </span>
                    <span className="block text-[11px] text-slate-400 mt-0.5">
                      Given directly, on top of any roles. Use for exceptions.
                    </span>
                  </span>
                  <ChevronDown
                    size={16}
                    className={`shrink-0 text-slate-400 transition-transform duration-200 ${
                      showPermissions ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {showPermissions && renderPermissions()}
              </section>
            </>
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
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-3 bg-slate-50 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 text-[11px] text-slate-500">
            {accessReady && pickedCount > 0 ? (
              <>
                <p className="text-slate-700">
                  {isRemove ? "Remove" : "Assign"} {summaryParts.join(" and ")}.
                </p>
                <p>
                  {staffAffected === 0
                    ? isRemove
                      ? "None of the selected staff hold these."
                      : "Everyone already has these."
                    : `${plural(staffAffected, "staff member", "staff members")} will change.`}
                </p>
              </>
            ) : (
              <p>Nothing ticked yet.</p>
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
                setFailures([]);
                mutate();
              }}
              disabled={!accessReady || staffAffected === 0 || isPending}
              className={`cursor-pointer relative flex items-center justify-center gap-2 px-4 py-2 text-xs text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm ${
                isRemove
                  ? "bg-red-600 hover:bg-red-700 shadow-red-200"
                  : "bg-violet-600 hover:bg-violet-700 shadow-violet-200"
              }`}
            >
              <span className={isPending ? "invisible" : ""}>
                {actionLabel}
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
