"use client";

// ─────────────────────────────────────────
// app/dashboard/fees/arms/components/Feesoverview.tsx
//
// The fees overview: the whole school's collection at a glance, then one row
// per class that opens that class's fees. Classes are cards on a phone and a
// table on wide screens. Search, filters and sorting work on the loaded
// classes straight away.
// ─────────────────────────────────────────

import { useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Hourglass,
  Search,
  UserCheck,
  UserMinus,
  Wallet,
  X,
} from "lucide-react";
import EmptyState from "@/app/dashboard/components/Emptystate";
import FilterPanel, {
  type FilterGroupConfig,
  type FilterValues,
} from "@/app/dashboard/components/Filterpanel";
import ResultCount from "@/app/dashboard/components/Resultcount";
import FeesStat from "../../components/Feesstat";
import ProgressBar, { rateTone } from "../../components/Progressbar";
import ProgressRing from "../../components/Progressring";
import SampleDataBadge from "../../components/Sampledatabadge";
import {
  filterArms,
  formatNaira,
  formatNairaCompact,
  percent,
  schoolTotals,
  sortArms,
  type ArmCollectionFilter,
  type ArmSort,
} from "../../fees";
import { useFeesOverview } from "../../hooks/Usefees";

const SORT_OPTIONS: { value: ArmSort; label: string }[] = [
  { value: "class", label: "Class order" },
  { value: "owing", label: "Most owed first" },
  { value: "rate", label: "Lowest collection first" },
];

const armHref = (armId: string) => `/dashboard/fees/arm?id=${armId}`;

function OverviewSkeleton() {
  return (
    <div className="animate-pulse space-y-4" aria-busy="true" aria-label="Loading fees">
      <div className="h-44 rounded-3xl bg-slate-200/70" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((n) => (
          <div key={n} className="h-32 rounded-2xl bg-slate-200/70" />
        ))}
      </div>
      <div className="h-10 rounded-xl bg-slate-200/70" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
        {[0, 1, 2, 3].map((n) => (
          <div key={n} className="h-36 rounded-2xl bg-slate-200/70 xl:h-14" />
        ))}
      </div>
    </div>
  );
}

export default function FeesOverview() {
  const { data, isPending, isError, error, refetch } = useFeesOverview();

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<FilterValues>({});
  const [sort, setSort] = useState<ArmSort>("class");

  if (isPending) {
    return (
      <div className="space-y-6">
        <PageHeader />
        <OverviewSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader />
        <div className="rounded-2xl border border-rose-100 bg-rose-50 p-6 text-center">
          <p className="text-sm font-semibold text-rose-700">
            We could not load the fees.
          </p>
          <p className="mt-1 text-xs text-rose-600">{error.message}</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-4 cursor-pointer rounded-full bg-rose-600 px-5 py-2 text-xs font-semibold text-white transition-colors hover:bg-rose-700"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const totals = schoolTotals(data.arms);
  const sections = [...new Set(data.arms.map((row) => row.arm.section))];

  const filterGroups: FilterGroupConfig[] = [
    {
      key: "section",
      title: "Section",
      mode: "multi",
      options: sections.map((name) => ({ label: name, value: name })),
    },
    {
      key: "collection",
      title: "Collection",
      mode: "single",
      options: [
        { label: "Has debtors", value: "debtors" },
        { label: "Fully cleared", value: "cleared" },
      ],
    },
  ];

  const visible = sortArms(
    filterArms(data.arms, {
      search,
      sections: filters.section ?? [],
      collection: (filters.collection?.[0] ?? "") as ArmCollectionFilter,
    }),
    sort,
  );
  const isFiltered =
    search.trim() !== "" || Object.values(filters).some((v) => v.length > 0);

  function clearEverything() {
    setSearch("");
    setFilters({});
  }

  return (
    <div className="space-y-6">
      <PageHeader term={`${data.term.name} \u00B7 ${data.term.session}`} />

      {/* Collection summary */}
      <section
        aria-label="Collection summary"
        className="relative overflow-hidden rounded-3xl bg-linear-to-br from-indigo-950 via-indigo-900 to-violet-800 p-5 text-white shadow-lg sm:p-7"
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-amber-400/10" />

        <div className="relative flex items-center justify-between gap-5">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-indigo-200">
              Collected this term
            </p>
            <p className="mt-1 text-3xl font-bold leading-tight sm:text-4xl">
              {formatNaira(totals.collected)}
            </p>
            <p className="mt-1 text-sm text-indigo-200">
              of {formatNaira(totals.expected)} collectible
            </p>
          </div>

          <ProgressRing value={totals.rate} label={`${totals.rate}% collected`}>
            <span className="text-2xl font-bold leading-none">
              {totals.rate}%
            </span>
            <span className="mt-1 text-[10px] uppercase tracking-wide text-indigo-200">
              collected
            </span>
          </ProgressRing>
        </div>
      </section>

      {/* Key figures */}
      <section aria-label="Key figures" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <FeesStat
          label="Collectible"
          value={formatNairaCompact(totals.expected)}
          valueTitle={formatNaira(totals.expected)}
          sub="This term and arrears"
          icon={<Wallet size={18} />}
          tone="violet"
        />
        <FeesStat
          label="Still to collect"
          value={formatNairaCompact(totals.outstanding)}
          valueTitle={formatNaira(totals.outstanding)}
          sub={`${100 - totals.rate}% of the total`}
          icon={<Hourglass size={18} />}
          tone="amber"
        />
        <FeesStat
          label="Students cleared"
          value={String(totals.cleared)}
          sub={`of ${totals.students} students`}
          icon={<UserCheck size={18} />}
          tone="emerald"
        />
        <FeesStat
          label="Students owing"
          value={String(totals.indebted)}
          sub={`${percent(totals.indebted, totals.students)}% of students`}
          icon={<UserMinus size={18} />}
          tone="rose"
        />
      </section>

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
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search a class, e.g. JSS 1 or SS2"
            aria-label="Search classes"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-9 text-xs text-slate-800 placeholder:text-slate-400 focus:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-100"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded-full p-1 text-slate-400 transition-colors hover:text-slate-700"
            >
              <X size={13} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <FilterPanel
            groups={filterGroups}
            applied={filters}
            onApply={setFilters}
            onReset={() => setFilters({})}
          />
          <label className="sr-only" htmlFor="class-sort">
            Sort classes
          </label>
          <select
            id="class-sort"
            value={sort}
            onChange={(event) => setSort(event.target.value as ArmSort)}
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

      <div className="text-xs text-slate-500">
        <ResultCount
          count={visible.length}
          singular="class"
          plural="classes"
          filtered={isFiltered}
        />
      </div>

      {visible.length === 0 ? (
        <div className="space-y-3 text-center">
          <EmptyState
            title="No classes match"
            description="Try a different search, or clear the filters."
          />
          {isFiltered && (
            <button
              type="button"
              onClick={clearEverything}
              className="cursor-pointer rounded-full border border-violet-200 px-5 py-2 text-xs font-semibold text-violet-700 transition-colors hover:bg-violet-50"
            >
              Clear search and filters
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Phones and tablets: one card per class */}
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:hidden">
            {visible.map((row) => {
              const rate = percent(row.collected, row.expected);
              return (
                <li key={row.arm.id} className="min-w-0">
                  <Link
                    href={armHref(row.arm.id)}
                    className="group block rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:border-violet-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-base font-bold text-slate-800">
                          {row.arm.name}
                        </p>
                        <p className="text-xs text-slate-400">{row.arm.section}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold leading-tight text-slate-800">
                          {rate}%
                        </p>
                        <p className="text-[10px] uppercase tracking-wide text-slate-400">
                          collected
                        </p>
                      </div>
                    </div>

                    <ProgressBar
                      value={rate}
                      tone={rateTone(rate)}
                      label={`${row.arm.name} collection`}
                      className="mt-3"
                    />
                    <p className="mt-2 text-xs text-slate-500">
                      {formatNaira(row.collected)} of {formatNaira(row.expected)}
                    </p>

                    <div className="mt-3 flex items-center gap-2 text-[11px] font-semibold">
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">
                        {row.cleared} cleared
                      </span>
                      <span className="rounded-full bg-rose-50 px-2.5 py-1 text-rose-700">
                        {row.indebted} owing
                      </span>
                      <ChevronRight
                        size={16}
                        className="ml-auto text-slate-300 transition-colors group-hover:text-violet-500"
                        aria-hidden="true"
                      />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Wide screens: one table row per class */}
          <div className="hidden overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm xl:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-400">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold">Class</th>
                  <th scope="col" className="px-3 py-3 text-right font-semibold">Students</th>
                  <th scope="col" className="px-3 py-3 text-right font-semibold">Cleared</th>
                  <th scope="col" className="px-3 py-3 text-right font-semibold">Owing</th>
                  <th scope="col" className="px-3 py-3 text-right font-semibold">Collected</th>
                  <th scope="col" className="px-3 py-3 text-right font-semibold">Collectible</th>
                  <th scope="col" className="w-48 px-5 py-3 font-semibold">Progress</th>
                  <th scope="col" className="px-5 py-3"><span className="sr-only">Open</span></th>
                </tr>
              </thead>
              <tbody>
                {visible.map((row) => {
                  const rate = percent(row.collected, row.expected);
                  return (
                    <tr
                      key={row.arm.id}
                      className="border-t border-slate-100 transition-colors hover:bg-violet-50/40"
                    >
                      <td className="px-5 py-3.5">
                        <Link
                          href={armHref(row.arm.id)}
                          className="font-semibold text-slate-800 hover:text-violet-700 focus-visible:outline-none focus-visible:underline"
                        >
                          {row.arm.name}
                        </Link>
                        <p className="text-xs text-slate-400">{row.arm.section}</p>
                      </td>
                      <td className="px-3 py-3.5 text-right tabular-nums text-slate-600">
                        {row.students}
                      </td>
                      <td className="px-3 py-3.5 text-right tabular-nums font-semibold text-emerald-600">
                        {row.cleared}
                      </td>
                      <td className="px-3 py-3.5 text-right tabular-nums font-semibold text-rose-600">
                        {row.indebted}
                      </td>
                      <td className="px-3 py-3.5 text-right tabular-nums text-slate-700">
                        {formatNaira(row.collected)}
                      </td>
                      <td className="px-3 py-3.5 text-right tabular-nums text-slate-500">
                        {formatNaira(row.expected)}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <ProgressBar
                            value={rate}
                            tone={rateTone(rate)}
                            label={`${row.arm.name} collection`}
                          />
                          <span className="w-10 text-right text-xs font-semibold tabular-nums text-slate-600">
                            {rate}%
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Link
                          href={armHref(row.arm.id)}
                          aria-label={`Open ${row.arm.name} fees`}
                          className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-violet-700 transition-colors hover:bg-violet-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
                        >
                          View
                          <ChevronRight size={14} aria-hidden="true" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function PageHeader({ term }: { term?: string }) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold text-slate-800 sm:text-2xl">Fees</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          {term ?? "Fee collection by class"}
        </p>
      </div>
      <SampleDataBadge />
    </header>
  );
}
