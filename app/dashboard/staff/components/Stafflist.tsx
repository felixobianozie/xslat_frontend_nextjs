"use client";

// ─────────────────────────────────────────────────────────────────────────────
// StaffList.tsx
//
// Renders the paginated staff portfolio list.
// Includes: search (sent with a button), multi-select filters (sent with
// Apply), sort, a badge counting the matching staff, PDF download, print, a
// Create Staff slide-in panel, an Employment slide-in panel, and invitation
// management. Search, filters and sort are all handled by the backend.
//
// What the list shows:
//  - Current staff (active and inactive) by default. In the Filter panel, tick
//    any of the six statuses (or use the Current, Departed and All shortcuts)
//    to reach departed staff, and narrow by employment, staff type and gender.
//    Nothing is requested until Apply is pressed; Reset, beside the Filter
//    button, puts every filter back. The Sort menu orders by name, date added,
//    status, employment, gender or email.
//
// Invitations:
//  - A staff member an administrator created, who has not accepted yet, shows
//    an invitation badge (pending, expired, locked or revoked) taken from the
//    portfolio's `invite_state`.
//  - Their row menu offers Resend Invitation, Change Email and Revoke
//    Invitation (see Staffactionmenu.tsx). Resend is a direct action here;
//    Change Email and Revoke open StaffInviteDialog.
//
// Employment:
//  - With staff ticked, the selection bar's "Employment" button opens
//    StaffEmploymentPanel, which sets one employment type for all of them. A
//    row's menu offers the same panel for that one staff member.
//
// Roles & permissions:
//  - Every row and card has a checkbox, and the table header has one that
//    ticks every staff member shown on the page. The selection survives page
//    changes and filter changes until it is cleared.
//  - While anyone is selected, a bar above the list shows how many and offers
//    "Roles & Permissions", which opens StaffRolesPanel for all of them.
//  - A row's menu offers the same panel for that one staff member, without
//    touching the selection.
//
// Data layer:
//  - initialData is the full server-fetched paginated envelope for page 1.
//    total_pages, count, and data all come directly from the server — no
//    client-side recomputation needed.
//  - useQuery is the single source of truth after hydration.
//  - Pagination, search, sort and filters are all server-side query params.
//    Typing in the search box sends nothing; Enter or the search button does.
//  - initialDataUpdatedAt: Date.now() tells React Query the server data is
//    fresh so it skips an immediate background refetch on mount.
//  - isPending drives the skeleton whenever there is no cached data for the
//    current query key — covers initial load, page navigation, and filter
//    changes. Safer than isLoading, which requires a fetch to be in flight
//    and would not show the skeleton if the query were ever disabled.
//  - Fetch errors are surfaced to the user via toast.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useReactToPrint } from "react-to-print";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  ArrowUpDown,
  Briefcase,
  Check,
  X,
  Download,
  Printer,
  UserPlus,
  BadgeCheck,
  BadgeX,
  ShieldCheck,
} from "lucide-react";
import { toast } from "react-toastify";
import { useClientAuthFetch } from "@/lib/Useclientauthfetch";
import StaffActionMenu from "./Staffactionmenu";
import StaffCreatePanel from "./Staffcreatepanel";
import StaffInviteDialog from "./Staffinvitedialog";
import StaffPrintTemplate from "./Staffprinttemplate";
import StaffRolesPanel from "./Staffrolespanel";
import Paginator, { PAGE_SIZE } from "../../components/Paginator";
import EmptyState from "../../components/Emptystate";
import type { PaginatedResponse } from "../page";
import TableLoader from "../../components/Tableloader";
import TriStateCheckbox from "../../components/Tristatecheckbox";
import DropdownPanel from "../../components/Dropdownpanel";
import FilterPanel, {
  type FilterGroupConfig,
  type FilterValues,
} from "../../components/Filterpanel";
import ResultCount from "../../components/Resultcount";
import StaffEmploymentPanel from "./Staffemploymentpanel";
import StaffStatusBadge from "./Staffstatusbadge";
import {
  EMPLOYMENT_CHOICES,
  STAFF_STATUS_LABELS,
  STAFF_STATUS_ORDER,
} from "../staffstatus";

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

// Re-alias the shared envelope type for readability within this file.
type PaginatedPortfoliosResponse = PaginatedResponse<StaffPortfolio>;

// ── Filters ──────────────────────────────────────────────────────────────────
// Each group maps to a parameter of GET staff/portfolios/list/. Groups combine
// with AND, and a group with nothing ticked sends nothing. With no status
// ticked the backend lists current staff (active and inactive), so staff who
// have left are reached by ticking their statuses.
const FILTER_GROUPS: FilterGroupConfig[] = [
  {
    key: "status",
    title: "Status",
    mode: "multi",
    options: STAFF_STATUS_ORDER.map((status) => ({
      label: STAFF_STATUS_LABELS[status],
      value: status,
    })),
  },
  {
    key: "employment",
    title: "Employment",
    mode: "multi",
    options: EMPLOYMENT_CHOICES.map((choice) => ({
      label: choice.label,
      value: choice.value,
    })),
  },
  {
    key: "academic",
    title: "Staff type",
    mode: "single",
    options: [
      { label: "Academic", value: "true" },
      { label: "Non-Academic", value: "false" },
    ],
  },
  {
    key: "gender",
    title: "Gender",
    mode: "single",
    options: [
      { label: "Male", value: "M" },
      { label: "Female", value: "F" },
      { label: "Other", value: "O" },
      { label: "N/A", value: "NOTA" },
    ],
  },
];

// Shortcuts that tick a whole set of statuses at once. "Current" is what the
// backend lists by default; "Departed" is everyone who has left.
const STATUS_SHORTCUTS = [
  { label: "Current", values: { status: ["active", "inactive"] } },
  {
    label: "Departed",
    values: { status: ["resigned", "retired", "terminated", "transferred"] },
  },
  { label: "All", values: { status: [...STAFF_STATUS_ORDER] } },
];

const DEFAULT_FILTERS: FilterValues = {
  status: [],
  employment: [],
  academic: [],
  gender: [],
};

function hasActiveFilters(filters: FilterValues): boolean {
  return Object.values(filters).some((values) => values.length > 0);
}

// ── Sort ─────────────────────────────────────────────────────────────────────
// Each sort maps to the backend's `ordering` value. The first one is the
// backend's own default, so it is never sent.
type SortKey =
  | "name_asc"
  | "name_desc"
  | "newest"
  | "oldest"
  | "status"
  | "employment"
  | "gender"
  | "email";

const DEFAULT_SORT: SortKey = "name_asc";

const SORT_OPTIONS: { label: string; value: SortKey; ordering: string }[] = [
  { label: "Name (A–Z)", value: "name_asc", ordering: "last_name,first_name" },
  {
    label: "Name (Z–A)",
    value: "name_desc",
    ordering: "-last_name,-first_name",
  },
  { label: "Recently added", value: "newest", ordering: "-created_on" },
  { label: "Earliest added", value: "oldest", ordering: "created_on" },
  {
    label: "Status",
    value: "status",
    ordering: "status,last_name,first_name",
  },
  {
    label: "Employment",
    value: "employment",
    ordering: "employment,last_name,first_name",
  },
  { label: "Gender", value: "gender", ordering: "gender,last_name,first_name" },
  { label: "Email (A–Z)", value: "email", ordering: "email" },
];

// ── The list's query ─────────────────────────────────────────────────────────
interface StaffListQuery {
  schoolId: string;
  page: number;
  pageSize: number;
  search: string;
  filters: FilterValues;
  sort: SortKey;
}

// True when the query is the one the server rendered for page 1 (no search,
// filters or sort), so that page can be used as the list's starting data.
function isDefaultStaffQuery(query: StaffListQuery): boolean {
  return (
    query.page === 1 &&
    query.search.trim() === "" &&
    !hasActiveFilters(query.filters) &&
    query.sort === DEFAULT_SORT
  );
}

// Turns the query into the URL of the backend list. Nothing is sent for a
// default, so the first page the server renders matches the starting state.
function buildStaffListUrl(query: StaffListQuery): string {
  const { filters } = query;
  const params = new URLSearchParams({
    "school-id": query.schoolId,
    page: String(query.page),
    "page-size": String(query.pageSize),
  });

  const search = query.search.trim();
  if (search) params.set("search", search);

  if (filters.status?.length) params.set("status", filters.status.join(","));
  if (filters.employment?.length) {
    params.set("employment", filters.employment.join(","));
  }
  if (filters.academic?.length) params.set("academic", filters.academic[0]);
  if (filters.gender?.length) params.set("gender", filters.gender[0]);

  if (query.sort !== DEFAULT_SORT) {
    const ordering = SORT_OPTIONS.find((o) => o.value === query.sort)?.ordering;
    if (ordering) params.set("ordering", ordering);
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
  // `searchInput` is what is typed and is never sent by itself;
  // `appliedSearch` is what the backend is asked for. They match again when
  // the search is submitted or cleared.
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  // The filters in effect. The filter panel keeps its own draft and hands the
  // whole selection over when Apply is pressed.
  const [filters, setFilters] = useState<FilterValues>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<SortKey>(DEFAULT_SORT);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  // The ticked staff members, by portfolio id. The records are kept so the
  // roles panel can name people who are on another page.
  const [selected, setSelected] = useState<Record<string, StaffPortfolio>>({});
  // The roles & permissions panel. `session` changes on every opening so the
  // panel starts fresh; `fromSelection` says whether it was opened for the
  // ticked staff or for one row.
  const [rolesPanel, setRolesPanel] = useState<{
    show: boolean;
    session: number;
    targets: StaffPortfolio[];
    fromSelection: boolean;
  }>({ show: false, session: 0, targets: [], fromSelection: false });
  // The employment panel, with the same fields as the roles panel above
  const [employmentPanel, setEmploymentPanel] = useState<{
    show: boolean;
    session: number;
    targets: StaffPortfolio[];
    fromSelection: boolean;
  }>({ show: false, session: 0, targets: [], fromSelection: false });
  // The invitation dialog being shown (change email / revoke), if any
  const [inviteDialog, setInviteDialog] = useState<{
    kind: "email" | "revoke";
    portfolio: StaffPortfolio;
  } | null>(null);

  // True while the typed text differs from the search already applied
  const hasUnsubmittedSearch = searchInput.trim() !== appliedSearch;

  // Refs
  // The sort button anchors its menu, which DropdownPanel draws in a portal so
  // a short list cannot clip it.
  const sortTriggerRef = useRef<HTMLButtonElement>(null);
  const printRef = useRef<HTMLDivElement>(null);

  // Initialize useReactToPrint hook
  // const handlePrint = useReactToPrint({ content: () => printRef.current });
  const handlePrint = useReactToPrint({ contentRef: printRef });

  // ── React Query ────────────────────────────────────────────────────────────
  // The query key includes everything sent to the backend: page, search,
  // filters, sort and school. Every key starts with ["staff", SCHOOL_ID], so
  // invalidating that prefix refreshes every cached page.
  const listQuery = {
    schoolId: SCHOOL_ID,
    page: currentPage,
    pageSize: PAGE_SIZE,
    search: appliedSearch,
    filters,
    sort,
  };
  const {
    data: queryData,
    isPending,
    isError,
    error,
  } = useQuery<PaginatedPortfoliosResponse>({
    queryKey: ["staff", SCHOOL_ID, listQuery],

    queryFn: async () => {
      const url = buildStaffListUrl(listQuery);
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
    // Only applied for the starting state (page 1, no search, default filters
    // and sort) since that is exactly what the server fetched.
    initialData: isDefaultStaffQuery(listQuery)
      ? (initialData ?? undefined)
      : undefined,

    // Tell React Query the server data is already fresh so it does not fire an
    // immediate background refetch on mount when on the starting state.
    initialDataUpdatedAt: isDefaultStaffQuery(listQuery)
      ? Date.now()
      : undefined,
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

  const hasSearch = appliedSearch !== "";
  const hasFilters = hasActiveFilters(filters);
  // True while a search or filter narrows the list.
  const isFiltered = hasSearch || hasFilters;

  // ── Handlers ───────────────────────────────────────────────────────────────

  // Sends the typed search to the backend. Called by the search button and by
  // pressing Enter in the input. Starts again from page 1, and does nothing
  // when the text has not changed.
  function handleSearchSubmit(e?: FormEvent) {
    e?.preventDefault();
    const text = searchInput.trim();
    if (text === appliedSearch) return;
    setAppliedSearch(text);
    setCurrentPage(1);
  }

  // Clears the input and the applied search, back to page 1.
  function handleSearchClear() {
    setSearchInput("");
    if (appliedSearch !== "") {
      setAppliedSearch("");
      setCurrentPage(1);
    }
  }

  // Called by the filter panel when Apply is pressed: one request for the
  // whole selection, starting again from page 1.
  function applyFilters(next: FilterValues) {
    setFilters(next);
    setCurrentPage(1);
  }

  function resetFilters() {
    setFilters(DEFAULT_FILTERS);
    setCurrentPage(1);
  }

  function handleSortChange(next: SortKey) {
    setSort(next);
    setCurrentPage(1);
    setSortDropdownOpen(false);
  }

  // After creating a new staff member, invalidate the staff query so the
  // list refreshes with the new record from the server.
  function handleCreatePanelClose() {
    setShowCreatePanel(false);
    queryClient.invalidateQueries({ queryKey: ["staff", SCHOOL_ID] });
  }

  // ── Selection ──────────────────────────────────────────────────────────────
  const selectedCount = Object.keys(selected).length;
  const selectedOnPage = portfolios.filter(
    (portfolio) => portfolio.id in selected,
  ).length;
  const allOnPageSelected =
    portfolios.length > 0 && selectedOnPage === portfolios.length;

  function toggleSelected(portfolio: StaffPortfolio) {
    setSelected((previous) => {
      const next = { ...previous };
      if (portfolio.id in next) delete next[portfolio.id];
      else next[portfolio.id] = portfolio;
      return next;
    });
  }

  // Ticks every staff member shown, or clears them when all are ticked.
  function toggleAllOnPage() {
    setSelected((previous) => {
      const next = { ...previous };
      for (const portfolio of portfolios) {
        if (allOnPageSelected) delete next[portfolio.id];
        else next[portfolio.id] = portfolio;
      }
      return next;
    });
  }

  function openRolesPanel(targets: StaffPortfolio[], fromSelection: boolean) {
    setRolesPanel((previous) => ({
      show: true,
      session: previous.session + 1,
      targets,
      fromSelection,
    }));
  }

  function closeRolesPanel() {
    setRolesPanel((previous) => ({ ...previous, show: false }));
  }

  function openEmploymentPanel(
    targets: StaffPortfolio[],
    fromSelection: boolean,
  ) {
    setEmploymentPanel((previous) => ({
      show: true,
      session: previous.session + 1,
      targets,
      fromSelection,
    }));
  }

  function closeEmploymentPanel() {
    setEmploymentPanel((previous) => ({ ...previous, show: false }));
  }

  // ── Resend invitation ──────────────────────────────────────────────────────
  // Gives the invitation a new code and a fresh 24-hour expiry, reactivates the
  // portfolio if it was revoked, and emails the invitation again.
  const { mutate: resendInvite } = useMutation<
    { message: string; data: { invite_sent: boolean } } | undefined,
    Error,
    string
  >({
    mutationFn: async (portfolioId) => {
      const { data, error } = await clientAuthFetch<{
        message: string;
        data: { invite_sent: boolean };
      }>("staff/invite/resend/", {
        method: "POST",
        body: { portfolio_id: portfolioId },
      });
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (response) => {
      // The new code exists either way; only the email may have failed
      if (response?.data.invite_sent === false) {
        toast.warning(response.message);
      } else {
        toast.success("Invitation resent.");
      }
      queryClient.invalidateQueries({ queryKey: ["staff", SCHOOL_ID] });
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  // The row's three-dot menu, used by both the table and the mobile cards
  function renderActionMenu(portfolio: StaffPortfolio) {
    return (
      <StaffActionMenu
        portfolioId={portfolio.id}
        inviteState={portfolio.invite_state}
        isDeleted={portfolio.deleted}
        onViewProfile={() =>
          router.push(`/dashboard/staff-profile?id=${portfolio.id}`)
        }
        onAssignRoles={() => openRolesPanel([portfolio], false)}
        onSetEmployment={() => openEmploymentPanel([portfolio], false)}
        onResendInvite={() => resendInvite(portfolio.id)}
        onChangeInviteEmail={() =>
          setInviteDialog({ kind: "email", portfolio })
        }
        onRevokeInvite={() => setInviteDialog({ kind: "revoke", portfolio })}
        onDelete={() => handleDeleteStaff(portfolio.id)}
      />
    );
  }

  // ── Stubbed actions ────────────────────────────────────────────────────────
  // These two actions have no backend endpoint yet:
  //   - Download PDF:  no PDF/export endpoint exists in views.py
  //   - Delete Staff:  StaffPortfolioDetailView only exposes GET and PUT
  //                    (no DELETE method)
  // Until those endpoints land, each handler surfaces the shared
  // "feature in the works" toast so the user gets clear feedback instead of a
  // silent no-op.

  function handleDownloadPdf() {
    toast.info(FEATURE_IN_WORKS);
  }

  function handleDeleteStaff(_portfolioId: string) {
    toast.info(FEATURE_IN_WORKS);
  }

  const activeSortLabel =
    SORT_OPTIONS.find((o) => o.value === sort)?.label ?? "Sort";

  return (
    <>
      <div className="flex text-sm">
        {/* ── Main list panel ─────────────────────────────────────────────── */}
        <div
          className={`transition-all duration-500 ease-in-out overflow-hidden ${
            showCreatePanel || rolesPanel.show || employmentPanel.show
              ? "w-0 opacity-0 h-0"
              : "w-full opacity-100"
          }`}
        >
          {/* ── Toolbar ───────────────────────────────────────────────────── */}
          {/* <div className="flex flex-wrap items-center gap-2 my-5 md:my-8"> */}
          {/* pt-2 leaves room above the buttons for the filter's reset badge,
              which sits on the button's top corner and would otherwise be cut
              off by this panel's overflow-hidden. */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2 mb-6">
            {/* Search — a form, so Enter and the button both send it. Typing
                alone never fires a request. */}
            <form
              onSubmit={handleSearchSubmit}
              className="flex gap-2 flex-1 min-w-0"
              role="search"
              aria-label="Search staff"
            >
              <div className="relative flex-1 min-w-0">
                <Search
                  size={13}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <input
                  type="text"
                  placeholder="Search name, email, phone, ID…"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  aria-label="Search staff by name, email, phone or ID"
                  className="w-full pl-8 pr-8 py-2 text-xs text-slate-800 placeholder:text-slate-400 border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
                />
                {(searchInput || appliedSearch) && (
                  <button
                    type="button"
                    onClick={handleSearchClear}
                    aria-label="Clear search"
                    className="cursor-pointer absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
              <button
                type="submit"
                disabled={!hasUnsubmittedSearch}
                aria-label="Search"
                title="Search"
                className="cursor-pointer flex items-center justify-center px-3 py-2 text-xs bg-violet-600 text-white rounded-xl hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm shadow-violet-200"
              >
                <Search size={14} />
              </button>
            </form>

            {/* Filter and sort sit side by side, also on a phone */}
            <div className="flex gap-2">
              {/* Filter — tick any combination, then press Apply. The quick
                  Reset beside the button shows while a filter is applied. */}
              <FilterPanel
                groups={FILTER_GROUPS}
                applied={filters}
                onApply={applyFilters}
                onReset={resetFilters}
                shortcuts={STATUS_SHORTCUTS}
              />

              {/* Sort — a single choice, so it applies as soon as it is picked */}
              <div className="relative flex-1 sm:flex-none">
                <button
                  ref={sortTriggerRef}
                  type="button"
                  onClick={() => setSortDropdownOpen((o) => !o)}
                  aria-haspopup="menu"
                  aria-expanded={sortDropdownOpen}
                  className={`cursor-pointer flex w-full items-center justify-center gap-1.5 px-3 py-2 text-xs border rounded-xl transition-colors ${
                    sort !== DEFAULT_SORT
                      ? "border-violet-400 bg-violet-50 text-violet-700"
                      : "border-slate-200 bg-white text-slate-600 hover:border-violet-300"
                  }`}
                >
                  <ArrowUpDown size={12} />
                  <span className="hidden sm:inline">{activeSortLabel}</span>
                  <span className="sm:hidden">Sort</span>
                </button>

                <DropdownPanel
                  open={sortDropdownOpen}
                  onClose={() => setSortDropdownOpen(false)}
                  anchorRef={sortTriggerRef}
                  width={192}
                  label="Sort staff"
                >
                  <div className="py-1">
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        role="menuitem"
                        onClick={() => handleSortChange(opt.value)}
                        className={`cursor-pointer w-full flex items-center justify-between px-4 py-2 text-left text-xs transition-colors ${
                          sort === opt.value
                            ? "bg-violet-50 font-semibold text-violet-700"
                            : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <span>{opt.label}</span>
                        {sort === opt.value && <Check size={12} />}
                      </button>
                    ))}
                  </div>
                </DropdownPanel>
              </div>
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

          {/* ── Results summary ───────────────────────────────────────── */}
          {/* How many staff the applied search and filters returned, and,
              while a search is applied, the search the results are scoped to
              with a one-click way out. */}
          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <ResultCount
              count={queryData?.count}
              singular="staff member"
              plural="staff members"
              filtered={isFiltered}
            />
            {hasSearch && (
              <>
                <span>for</span>
                <span className="inline-flex items-center gap-1.5 bg-violet-50 text-violet-700 border border-violet-100 rounded-full px-2.5 py-1 font-medium">
                  <span className="truncate max-w-55">
                    &ldquo;{appliedSearch}&rdquo;
                  </span>
                  <button
                    type="button"
                    onClick={handleSearchClear}
                    aria-label="Clear search"
                    className="cursor-pointer text-violet-500 hover:text-violet-800 transition-colors"
                  >
                    <X size={11} />
                  </button>
                </span>
              </>
            )}
          </div>

          {/* ── Selection bar — shown while any staff member is ticked ─────── */}
          {selectedCount > 0 && (
            <div className="mb-4 flex flex-col gap-2 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-violet-800">
                <span className="font-semibold tabular-nums">
                  {selectedCount}
                </span>{" "}
                {selectedCount === 1 ? "staff member" : "staff members"}{" "}
                selected
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelected({})}
                  className="cursor-pointer px-3 py-2 text-xs border border-violet-200 bg-white text-violet-700 rounded-xl hover:bg-violet-100 transition-colors"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() =>
                    openEmploymentPanel(Object.values(selected), true)
                  }
                  className="cursor-pointer flex items-center gap-1.5 px-3 py-2 text-xs border border-violet-200 bg-white text-violet-700 rounded-xl hover:bg-violet-100 transition-colors"
                >
                  <Briefcase size={12} />
                  <span>Employment</span>
                </button>
                <button
                  type="button"
                  onClick={() => openRolesPanel(Object.values(selected), true)}
                  className="cursor-pointer flex items-center gap-1.5 px-3 py-2 text-xs bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors shadow-sm shadow-violet-200"
                >
                  <ShieldCheck size={12} />
                  <span>Permissions</span>
                </button>
              </div>
            </div>
          )}

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
                      <th className="w-10 pl-5 pr-0 py-3">
                        <TriStateCheckbox
                          checked={allOnPageSelected}
                          indeterminate={selectedOnPage > 0}
                          onChange={toggleAllOnPage}
                          disabled={portfolios.length === 0}
                          ariaLabel="Select all staff on this page"
                        />
                      </th>
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
                    {portfolios.length === 0 ? (
                      <tr>
                        <td colSpan={9}>
                          <EmptyState
                            variant={hasSearch ? "search" : "staff"}
                            title={
                              hasSearch ? "No results found" : "No staff found"
                            }
                            description={
                              hasSearch
                                ? `No staff match "${appliedSearch}".`
                                : hasFilters
                                  ? "No staff match these filters."
                                  : "No current staff yet."
                            }
                          />
                        </td>
                      </tr>
                    ) : (
                      portfolios.map((portfolio, index) => {
                        const user = portfolio.staff_profile.user;
                        return (
                          <tr
                            key={portfolio.id}
                            className={`h-14 hover:bg-violet-50/40 transition-colors cursor-pointer ${
                              portfolio.id in selected
                                ? "bg-violet-50/70"
                                : index % 2 === 0
                                  ? "bg-white"
                                  : "bg-indigo-50/30"
                            }`}
                          >
                            {/* Select */}
                            <td className="w-10 pl-5 pr-0">
                              <TriStateCheckbox
                                checked={portfolio.id in selected}
                                onChange={() => toggleSelected(portfolio)}
                                ariaLabel={`Select ${user.first_name} ${user.last_name}`}
                              />
                            </td>

                            {/* Name + ID */}
                            <td className="px-5">
                              <div className="flex flex-col">
                                {/* Name with the invitation badge on the same line */}
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                  <span className="font-medium text-slate-800">
                                    {user.first_name}{" "}
                                    {user.middle_name
                                      ? `${user.middle_name} `
                                      : ""}
                                    {user.last_name}
                                  </span>
                                  {portfolio.invite_state && (
                                    <InviteBadge
                                      state={portfolio.invite_state}
                                    />
                                  )}
                                </div>
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
                              <StaffStatusBadge status={portfolio.status} />
                            </td>

                            {/* Action menu */}
                            <td
                              className="px-5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {renderActionMenu(portfolio)}
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
                {portfolios.length > 0 && (
                  <label className="flex items-center gap-2.5 px-1 text-xs text-slate-600 cursor-pointer w-fit">
                    <TriStateCheckbox
                      checked={allOnPageSelected}
                      indeterminate={selectedOnPage > 0}
                      onChange={toggleAllOnPage}
                    />
                    <span>Select all on this page</span>
                  </label>
                )}
                {portfolios.length === 0 ? (
                  <EmptyState
                    variant={hasSearch ? "search" : "staff"}
                    title={hasSearch ? "No results found" : "No staff found"}
                  />
                ) : (
                  portfolios.map((portfolio) => {
                    const user = portfolio.staff_profile.user;
                    return (
                      <div
                        key={portfolio.id}
                        className={`border rounded-2xl overflow-hidden shadow-sm ${
                          portfolio.id in selected
                            ? "bg-violet-50/40 border-violet-300"
                            : "bg-white border-indigo-100"
                        }`}
                      >
                        {/* Card header */}
                        <div className="flex items-center justify-between gap-3 p-4 border-b border-slate-50">
                          <TriStateCheckbox
                            checked={portfolio.id in selected}
                            onChange={() => toggleSelected(portfolio)}
                            ariaLabel={`Select ${user.first_name} ${user.last_name}`}
                          />
                          <div className="flex flex-col min-w-0 flex-1">
                            {/* Name with the invitation badge on the same line */}
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-sm font-semibold text-slate-800 truncate">
                                {user.first_name} {user.last_name}
                              </span>
                              {portfolio.invite_state && (
                                <InviteBadge state={portfolio.invite_state} />
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400">
                              {user.public_id}
                            </span>
                          </div>
                          <div onClick={(e) => e.stopPropagation()}>
                            {renderActionMenu(portfolio)}
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
                          <StaffStatusBadge status={portfolio.status} />
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

        {/* ── Roles & permissions slide-in panel ───────────────────────── */}
        <StaffRolesPanel
          show={rolesPanel.show}
          session={rolesPanel.session}
          targets={rolesPanel.targets}
          onClose={closeRolesPanel}
          onApplied={() => {
            closeRolesPanel();
            // Staff that were ticked for this change are done with.
            if (rolesPanel.fromSelection) setSelected({});
          }}
        />

        {/* ── Employment slide-in panel ─────────────────────────────────── */}
        <StaffEmploymentPanel
          show={employmentPanel.show}
          session={employmentPanel.session}
          targets={employmentPanel.targets}
          onClose={closeEmploymentPanel}
          onApplied={() => {
            closeEmploymentPanel();
            // Staff that were ticked for this change are done with.
            if (employmentPanel.fromSelection) setSelected({});
          }}
        />
      </div>

      {/* Invitation dialog — change email or revoke */}
      {inviteDialog && (
        <StaffInviteDialog
          kind={inviteDialog.kind}
          portfolio={inviteDialog.portfolio}
          onClose={() => setInviteDialog(null)}
        />
      )}

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

// ── InviteBadge ──────────────────────────────────────────────────────────────
// Shows where a staff member's invitation stands, beside their name. Only
// rendered when the portfolio has an unaccepted invitation (invite_state is
// not null).

const INVITE_BADGES: Record<InviteState, { label: string; style: string }> = {
  pending: { label: "Invite pending", style: "bg-amber-50 text-amber-700" },
  expired: { label: "Invite expired", style: "bg-red-50 text-red-600" },
  locked: { label: "Invite locked", style: "bg-red-50 text-red-600" },
  revoked: { label: "Invite revoked", style: "bg-slate-100 text-slate-500" },
};

function InviteBadge({ state }: { state: InviteState }) {
  const { label, style } = INVITE_BADGES[state];
  return (
    <span
      className={`shrink-0 whitespace-nowrap px-2 py-0.5 rounded-full text-[10px] font-semibold ${style}`}
    >
      {label}
    </span>
  );
}
