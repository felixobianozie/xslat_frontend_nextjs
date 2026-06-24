"use client";

// ─────────────────────────────────────────────────────────────────────────────
// StaffList.tsx
//
// Renders the paginated staff portfolio list.
// Includes: search, filter (backend-aligned params), PDF download, print,
// and a Create Staff slide-in panel.
//
// Data layer:
//  - initialData is the full server-fetched paginated envelope for page 1.
//    total_pages, count, and data all come directly from the server — no
//    client-side recomputation needed.
//  - useQuery is the single source of truth after hydration.
//  - Pagination and structural filters (status, academic, employment) are
//    server-side query params. Text search is client-side only — the backend
//    StaffPortfolioListView has no search param.
//  - initialDataUpdatedAt: Date.now() tells React Query the server data is
//    fresh so it skips an immediate background refetch on mount.
//  - isPending drives the skeleton whenever there is no cached data for the
//    current query key — covers initial load, page navigation, and filter
//    changes. Safer than isLoading, which requires a fetch to be in flight
//    and would not show the skeleton if the query were ever disabled.
//  - Fetch errors are surfaced to the user via toast.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useReactToPrint } from "react-to-print";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Filter,
  Download,
  Printer,
  UserPlus,
  BadgeCheck,
  BadgeX,
} from "lucide-react";
import { toast } from "react-toastify";
import { useClientAuthFetch } from "@/lib/Useclientauthfetch";
import StaffActionMenu from "./Staffactionmenu";
import StaffCreatePanel from "./Staffcreatepanel";
import StaffPrintTemplate from "./Staffprinttemplate";
import Paginator, { PAGE_SIZE } from "../../components/Paginator";
import EmptyState from "../../components/Emptystate";
import type { PaginatedResponse } from "../page";
import TableLoader from "../../components/Tableloader";

// ── Constants ─────────────────────────────────────────────────────────────────

const SCHOOL_ID = process.env.NEXT_PUBLIC_SCHOOL_ID ?? "";

// Shown whenever the user triggers a button whose backend endpoint isn't built
// yet. Kept centralised so the wording stays consistent everywhere.
// Mirrors the same pattern used in ArmList.tsx.
const FEATURE_IN_WORKS = "This feature is currently in the works.";

// ── Employment type labels ─────────────────────────────────────────────────
const EMPLOYMENT_LABELS: Record<StaffPortfolio["employment"], string> = {
  FT: "Full-time",
  PT: "Part-time",
  TP: "Temporary",
  NYSC: "NYSC",
  NON: "—",
};

// ── Gender labels ──────────────────────────────────────────────────────────
const GENDER_LABELS: Record<string, string> = {
  M: "Male",
  F: "Female",
  O: "Other",
  NOTA: "N/A",
};

// ── Filter options — keys match exact backend query param names/values ─────
// Backend staff portfolio endpoint accepts:
//   status     → "active" | "inactive"
//   academic   → "true"   | "false"
//   employment → "FT" | "PT" | "TP" | "NYSC" | "NON"
type FilterOption =
  | "all"
  | "status:active"
  | "status:inactive"
  | "academic:true"
  | "academic:false"
  | "employment:FT"
  | "employment:PT"
  | "employment:TP"
  | "employment:NYSC";

const FILTER_OPTIONS: { label: string; value: FilterOption }[] = [
  { label: "All Staff", value: "all" },
  { label: "Active", value: "status:active" },
  { label: "Inactive", value: "status:inactive" },
  { label: "Academic", value: "academic:true" },
  { label: "Non-Academic", value: "academic:false" },
  { label: "Full-time (FT)", value: "employment:FT" },
  { label: "Part-time (PT)", value: "employment:PT" },
  { label: "Temporary (TP)", value: "employment:TP" },
  { label: "NYSC", value: "employment:NYSC" },
];

// Re-alias the shared envelope type for readability within this file.
type PaginatedPortfoliosResponse = PaginatedResponse<StaffPortfolio>;

// ── Build the API URL from current state params ────────────────────────────
// Converts local UI state (page, filter, search) into the correct query string
// for the backend staff portfolios endpoint.
//
// Note: the backend StaffPortfolioListView does not expose a generic `search`
// param. Text search is handled client-side via the searchQuery state after
// the full page has been fetched. Only structural filters (status, academic,
// employment) are sent as query params.
function buildPortfoliosUrl(page: number, activeFilter: FilterOption): string {
  const params = new URLSearchParams({
    "school-id": SCHOOL_ID,
    page: String(page),
    "page-size": String(PAGE_SIZE),
  });

  // Split the encoded filter option (e.g. "status:active") into its param + value
  if (activeFilter !== "all") {
    const [param, val] = activeFilter.split(":");
    params.set(param, val);
  }

  return `staff/portfolios/list/?${params.toString()}`;
}

// ── Props ──────────────────────────────────────────────────────────────────
interface StaffListProps {
  /**
   * Full server-fetched paginated envelope for page 1 — used as React Query
   * initialData. The real total_pages and count come directly from the server
   * so no client-side recomputation is needed. Null when the server fetch failed.
   */
  initialData: PaginatedPortfoliosResponse | null;
}

export default function StaffList({ initialData }: StaffListProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { clientAuthFetch } = useClientAuthFetch();

  // ── Local UI state ─────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterOption>("all");
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Refs
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  const printRef = useRef<HTMLDivElement>(null);

  // Initialize useReactToPrint hook
  // const handlePrint = useReactToPrint({ content: () => printRef.current });
  const handlePrint = useReactToPrint({ contentRef: printRef });

  // Close filter dropdown when clicking outside it
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (
        filterDropdownRef.current &&
        !filterDropdownRef.current.contains(e.target as Node)
      ) {
        setFilterDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  // ── React Query ────────────────────────────────────────────────────────────
  // The query key includes all params sent to the backend — page, filter, and
  // school. searchQuery is excluded because text search is client-side only
  // (the backend has no search param on the portfolios endpoint).
  const {
    data: queryData,
    isPending,
    isError,
    error,
  } = useQuery<PaginatedPortfoliosResponse>({
    queryKey: ["staff", SCHOOL_ID, currentPage, activeFilter],

    queryFn: async () => {
      const url = buildPortfoliosUrl(currentPage, activeFilter);
      const { data, error } =
        await clientAuthFetch<PaginatedPortfoliosResponse>(url);

      if (error) {
        // Throwing makes React Query set isError and retry according to its policy.
        // The error message is picked up by the useEffect below for the toast.
        throw new Error(error.message);
      }

      return data!;
    },

    // Hydrate with the server-fetched envelope so there is no loading flash on
    // first render. The envelope is used as-is — total_pages, count, and data
    // all come directly from the server, no recomputation needed.
    // Only applied for the initial state (page 1, no filter) since that is
    // exactly what the server fetched.
    initialData:
      currentPage === 1 && activeFilter === "all"
        ? (initialData ?? undefined)
        : undefined,

    // Tell React Query the server data is already fresh so it does not fire an
    // immediate background refetch on mount when on the initial state.
    initialDataUpdatedAt:
      currentPage === 1 && activeFilter === "all" ? Date.now() : undefined,
  });

  // Surface fetch errors to the user via toast.
  // useEffect re-runs whenever `error` changes — i.e. on each new failure.
  useEffect(() => {
    if (isError && error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load staff list.",
      );
    }
  }, [isError, error]);

  // Derive the flat list and pagination metadata from the query result.
  // Fall back to safe defaults while the query is loading.
  const portfolios: StaffPortfolio[] = queryData?.data ?? [];
  const totalPages: number = queryData?.total_pages ?? 1;

  // ── Client-side text search ────────────────────────────────────────────────
  // The backend has no search param on the portfolios endpoint, so we filter
  // the current page's results in-memory. This means search only matches
  // against records on the currently loaded page — a known limitation until
  // the backend adds a search param.
  const visiblePortfolios = searchQuery.trim()
    ? portfolios.filter(({ staff_profile: { user: u } }) => {
        const q = searchQuery.toLowerCase();
        const fullName =
          `${u.first_name} ${u.middle_name ?? ""} ${u.last_name}`.toLowerCase();
        return (
          fullName.includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.phone.includes(q) ||
          u.public_id.toLowerCase().includes(q)
        );
      })
    : portfolios;

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleSearchChange(q: string) {
    setSearchQuery(q);
    // Reset to page 1 when the search changes so we always search from the start
    setCurrentPage(1);
  }

  function handleFilterChange(f: FilterOption) {
    setActiveFilter(f);
    // Reset to page 1 whenever the filter changes
    setCurrentPage(1);
    setFilterDropdownOpen(false);
  }

  // After creating a new staff member, invalidate the staff query so the
  // list refreshes with the new record from the server.
  function handleCreatePanelClose() {
    setShowCreatePanel(false);
    queryClient.invalidateQueries({ queryKey: ["staff", SCHOOL_ID] });
  }

  // ── Stubbed actions ────────────────────────────────────────────────────────
  // The following three actions have no backend endpoint yet:
  //   - Download PDF:       no PDF/export endpoint exists in views.py
  //   - Send Activation:    no activation/invite endpoint exists in views.py
  //   - Delete Staff:       StaffPortfolioDetailView only exposes GET and PUT
  //                         (no DELETE method)
  // Until those endpoints land, each handler surfaces the shared
  // "feature in the works" toast so the user gets clear feedback instead of a
  // silent no-op.

  function handleDownloadPdf() {
    toast.info(FEATURE_IN_WORKS);
  }

  function handleSendActivationLink(_portfolioId: string) {
    toast.info(FEATURE_IN_WORKS);
  }

  function handleDeleteStaff(_portfolioId: string) {
    toast.info(FEATURE_IN_WORKS);
  }

  const activeFilterLabel =
    FILTER_OPTIONS.find((o) => o.value === activeFilter)?.label ?? "Filter";

  return (
    <>
      <div className="flex text-sm">
        {/* ── Main list panel ─────────────────────────────────────────────── */}
        <div
          className={`transition-all duration-500 ease-in-out overflow-hidden ${
            showCreatePanel ? "w-0 opacity-0 h-0" : "w-full opacity-100"
          }`}
        >
          {/* ── Toolbar ───────────────────────────────────────────────────── */}
          {/* <div className="flex flex-wrap items-center gap-2 my-5 md:my-8"> */}
          <div className="flex flex-col sm:flex-row gap-2 mb-6">
            {/* Search */}
            {/* <div className="relative flex-1 min-w-45"> */}
            <div className="relative flex-1">
              <Search
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                type="text"
                placeholder="Search name, email, phone, ID…"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
              />
            </div>

            {/* Filter dropdown — outside-click handled via filterDropdownRef */}
            <div ref={filterDropdownRef} className="relative">
              <button
                onClick={() => setFilterDropdownOpen((o) => !o)}
                className={`flex w-full items-center gap-1.5 px-3 py-2 text-xs border rounded-xl transition-colors ${
                  activeFilter !== "all"
                    ? "border-violet-400 bg-violet-50 text-violet-700"
                    : "border-slate-200 bg-white text-slate-600 hover:border-violet-300"
                }`}
              >
                <Filter size={12} />
                <span className="hidden sm:inline">{activeFilterLabel}</span>
                <span className="sm:hidden">Filter</span>
              </button>

              {filterDropdownOpen && (
                <div className="absolute top-10 left-0 z-20 bg-white border border-slate-100 rounded-xl shadow-lg overflow-hidden w-48 py-1">
                  {FILTER_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleFilterChange(opt.value)}
                      className={`w-full text-left px-4 py-2 text-xs transition-colors ${
                        activeFilter === opt.value
                          ? "bg-violet-50 text-violet-700 font-semibold"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 justify-end">
              {/* Download PDF — backend endpoint not built yet, so the click
                  surfaces the shared "feature in the works" toast. */}
              <button
                onClick={handleDownloadPdf}
                className="flex items-center gap-1.5 px-3 py-2 text-xs border border-slate-200 bg-white text-slate-600 rounded-xl hover:border-violet-300 transition-colors"
                title="Download PDF"
              >
                <Download size={12} />
                <span className="hidden sm:inline">PDF</span>
              </button>

              {/* Print */}
              <button
                onClick={() => handlePrint()}
                className="flex items-center gap-1.5 px-3 py-2 text-xs border border-slate-200 bg-white text-slate-600 rounded-xl hover:border-violet-300 transition-colors"
                title="Print"
              >
                <Printer size={12} />
                <span className="hidden sm:inline">Print</span>
              </button>

              {/* Create Staff */}
              <button
                onClick={() => setShowCreatePanel(true)}
                className="cursor-pointer flex items-center gap-1.5 px-3 py-2 text-xs bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors shadow-sm shadow-violet-200"
              >
                <UserPlus size={12} />
                <span>Create Staff</span>
              </button>
            </div>
          </div>

          {/* ── Loading state — skeleton rows while there is no data yet ─────── */}
          {isPending ? (
            <TableLoader rows={6} className="my-4" />
          ) : (
            <>
              {/* ── Desktop table ────────────────────────────────────────── */}
              <div className="hidden md:block border border-indigo-100 rounded-2xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-left text-slate-500 border-b border-slate-200">
                      <th className="px-5 py-3 font-semibold">Staff</th>
                      <th className="px-5 py-3 font-semibold">Email</th>
                      <th className="px-5 py-3 font-semibold">Phone</th>
                      <th className="px-5 py-3 font-semibold">Gender</th>

                      <th className="px-5 py-3 font-semibold hidden lg:table-cell">
                        Academic
                      </th>
                      <th className="px-5 py-3 font-semibold hidden lg:table-cell">
                        Employment
                      </th>
                      <th className="px-5 py-3 font-semibold">Status</th>
                      <th className="px-5 py-3 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-50">
                    {visiblePortfolios.length === 0 ? (
                      <tr>
                        <td colSpan={8}>
                          <EmptyState
                            variant={searchQuery ? "search" : "staff"}
                            title={
                              searchQuery
                                ? "No results found"
                                : "No staff found"
                            }
                            description={
                              searchQuery
                                ? `No staff match "${searchQuery}".`
                                : "Try adjusting your filter criteria."
                            }
                          />
                        </td>
                      </tr>
                    ) : (
                      visiblePortfolios.map((portfolio, index) => {
                        const user = portfolio.staff_profile.user;
                        return (
                          <tr
                            key={portfolio.id}
                            className={`h-14 hover:bg-violet-50/40 transition-colors cursor-pointer ${
                              index % 2 === 0 ? "bg-white" : "bg-indigo-50/30"
                            }`}
                          >
                            {/* Name + ID */}
                            <td className="px-5">
                              <div className="flex flex-col">
                                <span className="font-medium text-slate-800">
                                  {user.first_name}{" "}
                                  {user.middle_name
                                    ? `${user.middle_name} `
                                    : ""}
                                  {user.last_name}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  {user.public_id}
                                </span>
                              </div>
                            </td>

                            {/* Email with verified/unverified pill */}
                            <td className="px-5">
                              <ContactCell
                                value={user.email}
                                verified={user.email_is_valid}
                              />
                            </td>

                            {/*
                              Phone with verified/unverified pill.
                              The phone string already includes the "+" prefix (E.164).
                              ContactCell renders value as-is — no extra "+" added here.
                            */}
                            <td className="px-5">
                              <ContactCell
                                value={user.phone}
                                verified={user.phone_is_valid}
                              />
                            </td>

                            {/* Gender */}
                            <td className="px-5 text-slate-600">
                              {GENDER_LABELS[user.gender ?? ""] ?? "—"}
                            </td>

                            {/* Academic / Non-Academic */}
                            <td className="px-5 hidden lg:table-cell">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                  portfolio.academic
                                    ? "bg-blue-50 text-blue-700"
                                    : "bg-slate-100 text-slate-500"
                                }`}
                              >
                                {portfolio.academic
                                  ? "Academic"
                                  : "Non-Academic"}
                              </span>
                            </td>

                            {/* Employment */}
                            <td className="px-5 text-slate-500 hidden lg:table-cell">
                              {EMPLOYMENT_LABELS[portfolio.employment]}
                            </td>

                            {/* Status */}
                            <td className="px-5">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                  portfolio.status === "active"
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-yellow-50 text-yellow-700"
                                }`}
                              >
                                {portfolio.status === "active"
                                  ? "Active"
                                  : "Inactive"}
                              </span>
                            </td>

                            {/* Action menu */}
                            <td
                              className="px-5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <StaffActionMenu
                                portfolioId={portfolio.id}
                                onViewProfile={() =>
                                  router.push(
                                    `/dashboard/staff-profile?id=${portfolio.id}`,
                                  )
                                }
                                onSendActivationLink={() =>
                                  handleSendActivationLink(portfolio.id)
                                }
                                onDelete={() => handleDeleteStaff(portfolio.id)}
                              />
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* ── Mobile card list ────────────────────────────────────── */}
              <div className="flex flex-col gap-3 md:hidden my-4">
                {visiblePortfolios.length === 0 ? (
                  <EmptyState
                    variant={searchQuery ? "search" : "staff"}
                    title={searchQuery ? "No results found" : "No staff found"}
                  />
                ) : (
                  visiblePortfolios.map((portfolio) => {
                    const user = portfolio.staff_profile.user;
                    return (
                      <div
                        key={portfolio.id}
                        className="bg-white border border-indigo-100 rounded-2xl overflow-hidden shadow-sm"
                      >
                        {/* Card header */}
                        <div className="flex items-center justify-between p-4 border-b border-slate-50">
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-semibold text-slate-800 truncate">
                              {user.first_name} {user.last_name}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {user.public_id}
                            </span>
                          </div>
                          <div onClick={(e) => e.stopPropagation()}>
                            <StaffActionMenu
                              portfolioId={portfolio.id}
                              onViewProfile={() =>
                                router.push(
                                  `/dashboard/staff-profile?id=${portfolio.id}`,
                                )
                              }
                              onSendActivationLink={() =>
                                handleSendActivationLink(portfolio.id)
                              }
                              onDelete={() => handleDeleteStaff(portfolio.id)}
                            />
                          </div>
                        </div>

                        {/* Contact rows — phone value already contains "+" */}
                        <div className="flex flex-col gap-2 px-4 py-3 text-xs border-b border-slate-50">
                          <ContactCell
                            value={user.email}
                            verified={user.email_is_valid}
                          />
                          <ContactCell
                            value={user.phone}
                            verified={user.phone_is_valid}
                          />
                        </div>

                        {/* Badges row */}
                        <div className="flex flex-wrap items-center gap-2 px-4 py-2.5">
                          {/* Gender */}
                          <span className="text-[11px] text-slate-500">
                            {GENDER_LABELS[user.gender ?? ""] ?? "—"}
                          </span>
                          {/* Academic badge */}
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              portfolio.academic
                                ? "bg-blue-50 text-blue-700"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {portfolio.academic ? "Academic" : "Non-Academic"}
                          </span>
                          {/* Status badge */}
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              portfolio.status === "active"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-yellow-50 text-yellow-700"
                            }`}
                          >
                            {portfolio.status === "active"
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* ── Paginator — shown only when there are results ─────────── */}
              {portfolios.length > 0 && (
                <Paginator
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              )}
            </>
          )}
        </div>

        {/* ── Create staff slide-in panel ───────────────────────────────── */}
        <StaffCreatePanel
          show={showCreatePanel}
          onClose={handleCreatePanelClose}
        />
      </div>

      {/* Hidden print template — prints all currently loaded portfolios */}
      <div className="h-0 overflow-hidden">
        <StaffPrintTemplate ref={printRef} portfolios={portfolios} />
      </div>
    </>
  );
}

// ── ContactCell ────────────────────────────────────────────────────────────
// Renders a contact value (email or phone) with a clear visual distinction
// between verified and unverified contacts.
//
//  Verified   → green "Verified" pill with a check-badge icon
//  Unverified → muted amber "Unverified" pill with an x-badge icon
//
// The phone string already carries the "+" prefix from the backend (E.164).
// This component renders value as-is — never prepends an extra "+".
function ContactCell({
  value,
  verified,
}: {
  value: string;
  verified: boolean;
}) {
  if (!value) {
    return <span className="text-slate-300 text-[11px]">—</span>;
  }

  return (
    <div className="flex gap-0.5 min-w-0">
      {/* Verification status pill — visually prominent, not just an icon */}
      {verified ? (
        <span className="inline-flex items-center gap-1 w-fit px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-medium">
          <BadgeCheck size={10} className="shrink-0" />
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 w-fit px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 text-[10px] font-medium">
          <BadgeX size={10} className="shrink-0" />
        </span>
      )}
      {/* The contact value itself */}
      <span className="truncate text-slate-700 text-[11px]">{value}</span>
    </div>
  );
}
