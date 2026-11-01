"use client";

// ─────────────────────────────────────────
// app/dashboard/fees/arm/components/Studentfeeslist.tsx
//
// A class's students and where each stands on fees: a table on wide screens
// and a card each on a phone. The list can be searched, filtered and sorted,
// and students can be ticked so that everything they owe is marked as paid in
// one go. Ticked students stay ticked while the filters change, and a bar
// pinned to the bottom of the screen shows who is ticked and the mark as paid
// button. Nothing is paid until that button is pressed and then confirmed.
// ─────────────────────────────────────────

import { useState } from "react";
import { CheckCheck, ChevronRight, ListChecks, Search, X } from "lucide-react";
import EmptyState from "@/app/dashboard/components/Emptystate";
import FilterPanel, {
  type FilterGroupConfig,
  type FilterShortcut,
  type FilterValues,
} from "@/app/dashboard/components/Filterpanel";
import Paginator, { PAGE_SIZE } from "@/app/dashboard/components/Paginator";
import ResultCount from "@/app/dashboard/components/Resultcount";
import { personName } from "@/lib/Personname";
import FeesStatusPill from "../../components/Feesstatuspill";
import StudentAvatar from "../../components/Studentavatar";
import {
  filterStudents,
  formatNaira,
  sortStudents,
  studentTotals,
  type FeeStatus,
  type StudentSort,
  type StudentTypeFilter,
} from "../../fees";

const FILTER_GROUPS: FilterGroupConfig[] = [
  {
    key: "status",
    title: "Status",
    mode: "multi",
    options: [
      { label: "Owing", value: "owing" },
      { label: "Part-paid", value: "partial" },
      { label: "Cleared", value: "cleared" },
    ],
  },
  {
    key: "type",
    title: "Student type",
    mode: "single",
    options: [
      { label: "Boarding", value: "boarding" },
      { label: "Day", value: "day" },
    ],
  },
  {
    key: "arrears",
    title: "Arrears",
    mode: "single",
    options: [{ label: "Has arrears", value: "yes" }],
  },
];

const FILTER_SHORTCUTS: FilterShortcut[] = [
  { label: "Everyone who owes", values: { status: ["owing", "partial"] } },
];

const SORT_OPTIONS: { value: StudentSort; label: string }[] = [
  { value: "balance", label: "Highest balance" },
  { value: "name", label: "Name (A to Z)" },
  { value: "paid", label: "Most paid" },
];

interface StudentFeesListProps {
  students: StudentFees[];
  selected: Set<string>;
  onSelectedChange: (next: Set<string>) => void;
  onOpenStudent: (studentId: string) => void;
  /** Called with the ticked students who owe something, and how many ticked students owe nothing. */
  onMarkPaid: (studentIds: string[], skipped: number) => void;
}

// A tick box that can show the in-between state used by "select all".
function TickBox({
  checked,
  indeterminate = false,
  onChange,
  label,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <label className="-m-2 flex cursor-pointer items-center justify-center p-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        aria-label={label}
        ref={(element) => {
          if (element) element.indeterminate = indeterminate;
        }}
        className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-violet-600 focus:ring-2 focus:ring-violet-300"
      />
    </label>
  );
}

function TypePill({ boarder }: { boarder: boolean }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
        boarder ? "bg-indigo-50 text-indigo-700" : "bg-slate-100 text-slate-600"
      }`}
    >
      {boarder ? "Boarding" : "Day"}
    </span>
  );
}

export default function StudentFeesList({
  students,
  selected,
  onSelectedChange,
  onOpenStudent,
  onMarkPaid,
}: StudentFeesListProps) {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<FilterValues>({});
  const [sort, setSort] = useState<StudentSort>("balance");
  const [page, setPage] = useState(1);

  const filtered = sortStudents(
    filterStudents(students, {
      search,
      statuses: (filters.status ?? []) as FeeStatus[],
      type: (filters.type?.[0] ?? "") as StudentTypeFilter,
      arrearsOnly: (filters.arrears ?? []).length > 0,
    }),
    sort,
  );
  const isFiltered =
    search.trim() !== "" || Object.values(filters).some((v) => v.length > 0);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const rows = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  // Selection
  const allSelected =
    filtered.length > 0 && filtered.every((s) => selected.has(s.id));
  const someSelected = filtered.some((s) => selected.has(s.id));
  const owingInView = filtered.filter((s) => studentTotals(s).balance > 0);

  const ticked = students.filter((s) => selected.has(s.id));
  const tickedOwing = ticked.filter((s) => studentTotals(s).balance > 0);
  const tickedOwingTotal = tickedOwing.reduce(
    (total, s) => total + studentTotals(s).balance,
    0,
  );

  function toggleOne(studentId: string) {
    const next = new Set(selected);
    if (next.has(studentId)) next.delete(studentId);
    else next.add(studentId);
    onSelectedChange(next);
  }

  // Ticks, or unticks, everyone the current search and filters show.
  function toggleAllInView() {
    const next = new Set(selected);
    for (const student of filtered) {
      if (allSelected) next.delete(student.id);
      else next.add(student.id);
    }
    onSelectedChange(next);
  }

  function selectEveryoneWhoOwes() {
    const next = new Set(selected);
    for (const student of owingInView) next.add(student.id);
    onSelectedChange(next);
  }

  function changeSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function changeFilters(values: FilterValues) {
    setFilters(values);
    setPage(1);
  }

  return (
    <section aria-labelledby="students-heading" className="space-y-4">
      <h2 id="students-heading" className="text-base font-bold text-slate-800">
        Students
      </h2>

      {/* Search, filter and sort */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="text"
            value={search}
            onChange={(event) => changeSearch(event.target.value)}
            placeholder="Search name or student ID"
            aria-label="Search students by name or ID"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-9 text-xs text-slate-800 placeholder:text-slate-400 focus:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-100"
          />
          {search && (
            <button
              type="button"
              onClick={() => changeSearch("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded-full p-1 text-slate-400 transition-colors hover:text-slate-700"
            >
              <X size={13} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <FilterPanel
            groups={FILTER_GROUPS}
            applied={filters}
            onApply={changeFilters}
            onReset={() => changeFilters({})}
            shortcuts={FILTER_SHORTCUTS}
          />
          <label className="sr-only" htmlFor="student-sort">
            Sort students
          </label>
          <select
            id="student-sort"
            value={sort}
            onChange={(event) => {
              setSort(event.target.value as StudentSort);
              setPage(1);
            }}
            className="min-w-0 flex-1 cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-700 focus:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-100 sm:flex-none"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs text-slate-500">
          <ResultCount
            count={filtered.length}
            singular="student"
            plural="students"
            filtered={isFiltered}
          />
        </div>
        {selected.size === 0 && (
          <button
            type="button"
            onClick={selectEveryoneWhoOwes}
            disabled={owingInView.length === 0}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-violet-200 px-3.5 py-1.5 text-xs font-semibold text-violet-700 transition-colors hover:bg-violet-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400 disabled:hover:bg-transparent"
          >
            <ListChecks size={14} aria-hidden="true" />
            Select everyone who owes ({owingInView.length})
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="space-y-3 text-center">
          <EmptyState
            title="No students found"
            description="Try a different search, or clear the filters."
          />
          {isFiltered && (
            <button
              type="button"
              onClick={() => {
                changeSearch("");
                changeFilters({});
              }}
              className="cursor-pointer rounded-full border border-violet-200 px-5 py-2 text-xs font-semibold text-violet-700 transition-colors hover:bg-violet-50"
            >
              Clear search and filters
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Phones and tablets: one card per student */}
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:hidden">
            {rows.map((student) => {
              const totals = studentTotals(student);
              const name = personName(student);
              const isTicked = selected.has(student.id);
              return (
                <li
                  key={student.id}
                  className={`min-w-0 rounded-2xl border p-4 shadow-sm transition-colors ${
                    isTicked
                      ? "border-violet-300 bg-violet-50/60"
                      : "border-slate-100 bg-white"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="pt-2.5">
                      <TickBox
                        checked={isTicked}
                        onChange={() => toggleOne(student.id)}
                        label={`Select ${name}`}
                      />
                    </div>
                    <StudentAvatar
                      firstName={student.first_name}
                      lastName={student.last_name}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {name}
                      </p>
                      <p className="truncate text-xs text-slate-400">
                        {student.public_id}
                      </p>
                    </div>
                    <FeesStatusPill status={totals.status} />
                  </div>

                  <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <dt className="text-slate-400">Due</dt>
                      <dd className="font-semibold tabular-nums text-slate-700">
                        {formatNaira(totals.currentDue)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Paid</dt>
                      <dd className="font-semibold tabular-nums text-slate-700">
                        {formatNaira(totals.currentPaid)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Balance</dt>
                      <dd
                        className={`font-bold tabular-nums ${
                          totals.balance > 0 ? "text-rose-600" : "text-emerald-600"
                        }`}
                      >
                        {formatNaira(totals.balance)}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <TypePill boarder={student.boarder} />
                      {totals.arrearsBalance > 0 && (
                        <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700">
                          Arrears {formatNaira(totals.arrearsBalance)}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => onOpenStudent(student.id)}
                      aria-label={`View payment details for ${name}`}
                      className="inline-flex cursor-pointer items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-violet-700 transition-colors hover:bg-violet-100"
                    >
                      Details
                      <ChevronRight size={14} aria-hidden="true" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Wide screens: a table */}
          <div className="hidden overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm xl:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-400">
                <tr>
                  <th scope="col" className="w-12 px-5 py-3">
                    <TickBox
                      checked={allSelected}
                      indeterminate={someSelected && !allSelected}
                      onChange={toggleAllInView}
                      label={
                        allSelected
                          ? "Unselect everyone in this list"
                          : "Select everyone in this list"
                      }
                    />
                  </th>
                  <th scope="col" className="px-3 py-3 font-semibold">Student</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Type</th>
                  <th scope="col" className="px-3 py-3 text-right font-semibold">Due</th>
                  <th scope="col" className="px-3 py-3 text-right font-semibold">Paid</th>
                  <th scope="col" className="px-3 py-3 text-right font-semibold">Arrears</th>
                  <th scope="col" className="px-3 py-3 text-right font-semibold">Balance</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Status</th>
                  <th scope="col" className="px-5 py-3"><span className="sr-only">Details</span></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((student) => {
                  const totals = studentTotals(student);
                  const name = personName(student);
                  const isTicked = selected.has(student.id);
                  return (
                    <tr
                      key={student.id}
                      className={`border-t border-slate-100 transition-colors ${
                        isTicked ? "bg-violet-50/60" : "hover:bg-slate-50/70"
                      }`}
                    >
                      <td className="px-5 py-3">
                        <TickBox
                          checked={isTicked}
                          onChange={() => toggleOne(student.id)}
                          label={`Select ${name}`}
                        />
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-3">
                          <StudentAvatar
                            firstName={student.first_name}
                            lastName={student.last_name}
                          />
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-800">
                              {name}
                            </p>
                            <p className="text-xs text-slate-400">
                              {student.public_id}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <TypePill boarder={student.boarder} />
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums text-slate-600">
                        {formatNaira(totals.currentDue)}
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums text-slate-600">
                        {formatNaira(totals.currentPaid)}
                      </td>
                      <td
                        className={`px-3 py-3 text-right tabular-nums ${
                          totals.arrearsBalance > 0
                            ? "font-semibold text-rose-600"
                            : "text-slate-300"
                        }`}
                      >
                        {totals.arrearsBalance > 0
                          ? formatNaira(totals.arrearsBalance)
                          : "\u2014"}
                      </td>
                      <td
                        className={`px-3 py-3 text-right font-bold tabular-nums ${
                          totals.balance > 0 ? "text-rose-600" : "text-emerald-600"
                        }`}
                      >
                        {formatNaira(totals.balance)}
                      </td>
                      <td className="px-3 py-3">
                        <FeesStatusPill status={totals.status} />
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => onOpenStudent(student.id)}
                          aria-label={`View payment details for ${name}`}
                          className="inline-flex cursor-pointer items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-violet-700 transition-colors hover:bg-violet-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
                        >
                          Details
                          <ChevronRight size={14} aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <Paginator
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          )}
        </>
      )}

      {/* Pinned to the bottom of the screen while students are ticked */}
      {selected.size > 0 && (
        <div
          role="status"
          aria-live="polite"
          className="sticky bottom-4 z-20 mx-auto flex max-w-2xl flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl bg-slate-900 px-4 py-3 text-white shadow-2xl"
        >
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">{selected.size} selected</p>
            <p className="truncate text-xs text-slate-300">
              {tickedOwing.length === 0
                ? "None of them owe anything"
                : `${tickedOwing.length} owe ${formatNaira(tickedOwingTotal)}`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onSelectedChange(new Set())}
            className="cursor-pointer rounded-full px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            Clear
          </button>
          <button
            type="button"
            disabled={tickedOwing.length === 0}
            onClick={() =>
              onMarkPaid(
                tickedOwing.map((s) => s.id),
                ticked.length - tickedOwing.length,
              )
            }
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-emerald-500 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-400"
          >
            <CheckCheck size={14} aria-hidden="true" />
            Mark as paid
          </button>
        </div>
      )}
    </section>
  );
}
