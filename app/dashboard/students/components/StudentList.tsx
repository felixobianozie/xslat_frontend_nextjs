"use client";

// ─────────────────────────────────────────────────────────────────────────────
// StudentList.tsx
//
// Renders the paginated student list.
// Includes: backend-driven search (submit-on-demand), backend filter, backend
// sort, print, Create Student slide-in panel, Assign/Change Arm slide-in
// panels, a Remove from Class confirmation modal, and bulk selection (with a
// contextual action bar that opens the Bulk Assign Arm slide-in panel).
//
// Data layer:
//  - initialData is the full server-fetched paginated envelope for page 1 with
//    no filter, no sort, and no search. total_pages, count, and the data array
//    all come directly from the server — no client-side recomputation.
//  - useQuery is the single source of truth after hydration. Search, filter,
//    sort, and pagination are all sent as URL query params, so the query key
//    includes every one of them and any change triggers a fresh backend fetch.
//  - initialDataUpdatedAt is captured once at mount via a useState initializer
//    (kept pure — the value is stable across re-renders) and tells React Query
//    the server-supplied data is fresh so it skips an immediate background
//    refetch when hydrating the initial state.
//  - isPending drives the skeleton whenever there is no cached data for the
//    current query key — covers initial load, page navigation, filter/sort
//    changes, and search submissions.
//  - Mutations (assign / change / remove arm) use useMutation and invalidate
//    the list + stats queries on success. The Remove-from-class mutation
//    calls PUT arm/detail/roster/ with remove_student. Delete is not yet
//    backed by an endpoint, so it surfaces the shared "feature in the works"
//    toast.
//
// Bulk selection:
//  - `selectedStudents` is a Map<id, StudentRecord> kept in component state.
//    Storing full records (not just ids) lets the Bulk Assign Arm panel
//    filter by arm status without a separate lookup fetch. Selection
//    persists across page and filter changes because entries are keyed by
//    student id, not row position; when a previously-selected row rerenders
//    on a later fetch, its stored record is refreshed so the panel sees the
//    freshest data for currently-visible selections.
//  - The header checkbox toggles every row on the current page only — it
//    shows an indeterminate state when some-but-not-all visible rows are
//    selected.
//  - When 2+ students are selected, a contextual action bar appears between
//    the toolbar and the table with a Bulk Assign Arm button.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useReactToPrint } from "react-to-print";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import {
  Search,
  Filter,
  ArrowUpDown,
  Printer,
  UserPlus,
  Users,
  X,
  Check,
} from "lucide-react";
import { toast } from "react-toastify";
import { useClientAuthFetch } from "@/lib/Useclientauthfetch";
import StudentActionMenu from "./Studentactionmenu";
import StudentCreatePanel from "./Studentcreatepanel";
import StudentAssignArmPanel from "./Studentassignarmpanel";
import StudentChangeArmPanel from "./Studentchangearmpanel";
import StudentBulkAssignArmPanel from "./Studentbulkassignarmpanel";
import StudentRemoveFromArmDialog from "./Studentremovefromarmdialog";
import StudentPrintTemplate from "./Studentprinttemplate";
import Paginator, { PAGE_SIZE } from "../../components/Paginator";
import EmptyState from "../../components/Emptystate";
import TableLoader from "../../components/Tableloader";
import type { PaginatedResponse } from "../page";

// ── Constants ────────────────────────────────────────────────────────────────

const SCHOOL_ID = process.env.NEXT_PUBLIC_SCHOOL_ID ?? "";

// Shown whenever the user triggers a button whose backend endpoint isn't
// available. Kept centralised so the wording stays consistent everywhere.
const FEATURE_IN_WORKS = "This feature is currently in the works.";

// ── Gender labels ────────────────────────────────────────────────────────────
const GENDER_LABELS: Record<string, string> = {
  M: "Male",
  F: "Female",
  O: "Other",
};

// ── Filter options — every option maps to a real GET student/list/ param ─────
// Backend supports gender=<M|F|O> and no-arm=true as list-scoping filters, so
// only those combinations are exposed here.
type FilterOption = "all" | "gender:M" | "gender:F" | "no_arm:true";

const FILTER_OPTIONS: { label: string; value: FilterOption }[] = [
  { label: "All Students", value: "all" },
  { label: "Male", value: "gender:M" },
  { label: "Female", value: "gender:F" },
  { label: "Unenrolled", value: "no_arm:true" },
];

// ── Sort options — every option maps to a real GET student/list/ ordering ────
// Backend whitelist for ?ordering= is {last_name, first_name, gender,
// created_on}. The "default" option omits the param and lets the backend
// apply its own default order (last_name, first_name asc + id tiebreaker),
// which matches "Name (A → Z)". A stable id tiebreaker is always appended
// server-side so pagination cannot duplicate or skip rows on ties.
type SortValue =
  | "default"
  | "name_desc"
  | "gender_asc"
  | "gender_desc"
  | "newest"
  | "oldest";

const SORT_OPTIONS: {
  label: string;
  value: SortValue;
  ordering: string | null;
}[] = [
  { label: "Name (A → Z)", value: "default", ordering: null },
  {
    label: "Name (Z → A)",
    value: "name_desc",
    ordering: "-last_name,-first_name",
  },
  // Gender first (F → M → O), then alphabetical within each gender bucket so
  // the secondary order is meaningful instead of falling back to the server's
  // id tiebreaker.
  {
    label: "Gender (A → Z)",
    value: "gender_asc",
    ordering: "gender,last_name,first_name",
  },
  // Gender reversed (O → M → F). Names stay ascending inside each bucket so
  // rows remain easy to scan visually.
  {
    label: "Gender (Z → A)",
    value: "gender_desc",
    ordering: "-gender,last_name,first_name",
  },
  { label: "Newest first", value: "newest", ordering: "-created_on" },
  { label: "Oldest first", value: "oldest", ordering: "created_on" },
];

// ── Build the API URL from current state params ──────────────────────────────
// Converts UI state (page, filter, sort, submitted search) into the backend
// query string. Only params with a real value are appended, so the URL stays
// minimal for the common "no filter, no sort, no search" case.
function buildStudentsUrl(
  page: number,
  activeFilter: FilterOption,
  sortValue: SortValue,
  appliedSearch: string,
): string {
  const params = new URLSearchParams({
    "school-id": SCHOOL_ID,
    page: String(page),
    "page-size": String(PAGE_SIZE),
  });

  // Filter — split the encoded value (e.g. "gender:M") into param + value.
  if (activeFilter !== "all") {
    const [param, val] = activeFilter.split(":");
    if (param === "gender") {
      params.set("gender", val);
    } else if (param === "no_arm") {
      params.set("no-arm", val);
    }
  }

  // Sort — only append when the option has an ordering string.
  const ordering = SORT_OPTIONS.find((s) => s.value === sortValue)?.ordering;
  if (ordering) {
    params.set("ordering", ordering);
  }

  // Search — only send when the user has actually submitted a query.
  const q = appliedSearch.trim();
  if (q) {
    params.set("search", q);
  }

  return `student/list/?${params.toString()}`;
}

// ── Formatting helpers ───────────────────────────────────────────────────────

// Format a class arm for display: "JSS 1 A" — section + level + arm abbrs.
function formatArm(arm: ClassArm | null): string {
  if (!arm) return "";
  return `${arm.level.section.abbr} ${arm.level.abbr} ${arm.abbr}`;
}

// Extract the portfolio for the current school from a student record. Used
// for status and created_on columns. Falls back to the first portfolio if
// no current-flagged one is present.
function getCurrentPortfolio(student: StudentRecord) {
  return student.portfolios.find((p) => p.current) ?? student.portfolios[0];
}

// ── Props ────────────────────────────────────────────────────────────────────
interface StudentListProps {
  /**
   * Full server-fetched paginated envelope for page 1 — used as React Query
   * initialData for the clean initial state (no filter, no sort, no search).
   * Null when the server fetch failed; React Query then fetches on mount.
   */
  initialData: PaginatedResponse<StudentRecord> | null;
}

export default function StudentList({ initialData }: StudentListProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { clientAuthFetch } = useClientAuthFetch();

  // ── Local UI state ─────────────────────────────────────────────────────────

  // Two search states: `searchInput` is what the user is typing (never sent
  // to the backend by itself); `appliedSearch` is what the current backend
  // request is scoped by. They diverge while the user is typing and re-sync
  // when Submit is pressed or Clear is clicked. Keeping them separate is
  // what lets us "avoid unnecessary requests while the user is typing".
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");

  const [activeFilter, setActiveFilter] = useState<FilterOption>("all");
  const [sortValue, setSortValue] = useState<SortValue>("default");
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Captured once at mount and passed to useQuery as `initialDataUpdatedAt`
  // so React Query treats the server-supplied envelope as fresh (no immediate
  // background refetch on first mount). Using a useState initializer keeps
  // the render pure — the timestamp is computed exactly once.
  const [initialDataTimestamp] = useState<number>(() => Date.now());

  // Panel and dialog state
  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [showAssignArmPanel, setShowAssignArmPanel] = useState(false);
  const [showChangeArmPanel, setShowChangeArmPanel] = useState(false);
  const [showBulkAssignPanel, setShowBulkAssignPanel] = useState(false);
  const [showRemoveArmDialog, setShowRemoveArmDialog] = useState(false);

  // The student currently selected for an action (assign/change/remove/
  // delete). Null when no action is in flight.
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(
    null,
  );

  // Bulk selection — map from student id to the full record. Storing records
  // (not just ids) lets the Bulk Assign Arm panel filter by arm status
  // without a separate lookup fetch. Persists across page and filter changes
  // since entries are keyed by id, not row position.
  const [selectedStudents, setSelectedStudents] = useState<
    Map<string, StudentRecord>
  >(new Map());

  // Refs
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const printRef = useRef<HTMLDivElement>(null);
  // Ref for the header checkbox so we can set its `indeterminate` HTML
  // property (React doesn't expose `indeterminate` as a prop).
  const headerCheckboxRef = useRef<HTMLInputElement>(null);
  const handlePrint = useReactToPrint({ contentRef: printRef });

  // Close either dropdown when the user clicks anywhere outside it. Both
  // dropdowns share one listener so we don't register two mousedown handlers.
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        filterDropdownRef.current &&
        !filterDropdownRef.current.contains(target)
      ) {
        setFilterDropdownOpen(false);
      }
      if (
        sortDropdownRef.current &&
        !sortDropdownRef.current.contains(target)
      ) {
        setSortDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  // ── React Query — list ─────────────────────────────────────────────────────
  // The query key covers every param sent to the backend, so any change to
  // page, filter, sort, or the applied (submitted) search triggers a fetch.
  // `searchInput` is deliberately NOT in the key: typing must not fire
  // requests — only Submit / Clear can.
  const {
    data: queryData,
    isPending,
    isError,
    error,
  } = useQuery<PaginatedResponse<StudentRecord>>({
    queryKey: [
      "students",
      SCHOOL_ID,
      currentPage,
      activeFilter,
      sortValue,
      appliedSearch,
    ],
    queryFn: async () => {
      const url = buildStudentsUrl(
        currentPage,
        activeFilter,
        sortValue,
        appliedSearch,
      );
      const { data, error } =
        await clientAuthFetch<PaginatedResponse<StudentRecord>>(url);

      if (error) {
        // Throwing makes React Query set isError and retry according to its
        // policy. The error message is picked up by the useEffect below.
        throw new Error(error.message);
      }

      return data!;
    },

    // Hydrate with the server-fetched envelope so there is no loading flash
    // on first render. The envelope is used as-is — total_pages, count, and
    // data all come directly from the server. Only applied for the clean
    // initial state since that is exactly what the server fetched.
    initialData:
      currentPage === 1 &&
      activeFilter === "all" &&
      sortValue === "default" &&
      appliedSearch === ""
        ? (initialData ?? undefined)
        : undefined,

    // Tell React Query the server data is already fresh so it does not fire
    // an immediate background refetch on mount when on the initial state.
    initialDataUpdatedAt:
      currentPage === 1 &&
      activeFilter === "all" &&
      sortValue === "default" &&
      appliedSearch === ""
        ? initialDataTimestamp
        : undefined,
  });

  // Surface fetch errors to the user via toast.
  useEffect(() => {
    if (isError && error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load student list.",
      );
    }
  }, [isError, error]);

  // ── Mutations ──────────────────────────────────────────────────────────────

  // Remove the selected student from their current arm.
  // Backend body shape (PUT arm/detail/roster/):
  //   { id: <arm_uuid>, school_id, remove_student: [<student_uuid>] }
  const removeArmMutation = useMutation({
    mutationFn: async ({
      studentId,
      armId,
    }: {
      studentId: string;
      armId: string;
    }) => {
      const { data, error } = await clientAuthFetch("arm/detail/roster/", {
        method: "PUT",
        body: {
          id: armId,
          school_id: SCHOOL_ID,
          remove_student: [studentId],
        },
      });
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      toast.success("Student removed from class.");
      queryClient.invalidateQueries({ queryKey: ["students", SCHOOL_ID] });
      queryClient.invalidateQueries({ queryKey: ["student-stats", SCHOOL_ID] });
      setShowRemoveArmDialog(false);
      setSelectedStudent(null);
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : "Could not remove student.",
      );
    },
  });

  // A delete mutation is intentionally not defined here. StudentDetailView
  // exposes GET and PUT only — no DELETE — so handleDelete surfaces the
  // FEATURE_IN_WORKS toast. Add the mutation and wire it into handleDelete
  // when DELETE student/detail/ ships.

  // ── Derived data ───────────────────────────────────────────────────────────
  // The backend already applies every filter, search, and sort we sent, so
  // this array drives the table, bulk selection, and the print template as-is
  // with no further client-side reduction.
  const students = queryData?.data ?? [];
  const totalPages = queryData?.total_pages ?? 1;

  // ── Bulk selection derived state ───────────────────────────────────────────
  // The header checkbox tracks the CURRENT PAGE only — selecting "all" on
  // page 2 doesn't tick page 1's rows, and vice versa. The bulk action bar
  // (further down) shows the TOTAL count across pages.
  const allOnPageSelected =
    students.length > 0 && students.every((s) => selectedStudents.has(s.id));
  const someOnPageSelected = students.some((s) => selectedStudents.has(s.id));
  const isIndeterminate = someOnPageSelected && !allOnPageSelected;

  // React doesn't expose `indeterminate` as a prop, so we set it via ref
  // whenever the derived flag changes.
  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = isIndeterminate;
    }
  }, [isIndeterminate]);

  // Refresh stored records with the freshest data whenever a currently-
  // visible row is also selected. React Query's structural sharing means
  // this effect only fires when `students` actually changes, and each row
  // comparison is a cheap reference check. Rows on other pages aren't
  // touched — their records stay as they were at selection time.
  useEffect(() => {
    if (students.length === 0) return;
    setSelectedStudents((prev) => {
      if (prev.size === 0) return prev;
      let changed = false;
      const next = new Map(prev);
      students.forEach((s) => {
        if (next.has(s.id) && next.get(s.id) !== s) {
          next.set(s.id, s);
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [students]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  // Submit the current search input to the backend. Called by the Submit
  // button and by pressing Enter inside the input (via the wrapping form).
  // Resets to page 1 so results always start from the beginning.
  function handleSearchSubmit(e?: FormEvent) {
    e?.preventDefault();
    const q = searchInput.trim();
    // Skip the round-trip when the submitted value hasn't actually changed —
    // React Query would just return the cached page anyway, but keeping the
    // guard here avoids resetting the current page for no reason.
    if (q === appliedSearch) return;
    setAppliedSearch(q);
    setCurrentPage(1);
  }

  // Clear both the input and the active backend search, and drop back to
  // page 1 so the user sees the unfiltered list again.
  function handleSearchClear() {
    setSearchInput("");
    if (appliedSearch !== "") {
      setAppliedSearch("");
      setCurrentPage(1);
    }
  }

  function handleFilterChange(f: FilterOption) {
    setActiveFilter(f);
    setCurrentPage(1);
    setFilterDropdownOpen(false);
  }

  function handleSortChange(s: SortValue) {
    setSortValue(s);
    setCurrentPage(1);
    setSortDropdownOpen(false);
  }

  // Toggle a single row's selection. The full record is stored (not just
  // its id) so the panel can read arm status directly. Map updates must be
  // immutable for React to detect the change, hence the `new Map(prev)`.
  function toggleStudent(student: StudentRecord) {
    setSelectedStudents((prev) => {
      const next = new Map(prev);
      if (next.has(student.id)) next.delete(student.id);
      else next.set(student.id, student);
      return next;
    });
  }

  // Toggle every row on the current page. If everything visible is already
  // selected, the click acts as a "deselect page" instead.
  function toggleAllOnPage() {
    setSelectedStudents((prev) => {
      const next = new Map(prev);
      if (allOnPageSelected) {
        students.forEach((s) => next.delete(s.id));
      } else {
        students.forEach((s) => next.set(s.id, s));
      }
      return next;
    });
  }

  // Clear all selections — used by the "Clear" button in the bulk action bar.
  function clearSelection() {
    setSelectedStudents(new Map());
  }

  // Closes the create panel and refreshes both list and stats so the table
  // and the counts reflect any newly created student.
  function handleCreatePanelClose() {
    setShowCreatePanel(false);
    queryClient.invalidateQueries({ queryKey: ["students", SCHOOL_ID] });
    queryClient.invalidateQueries({ queryKey: ["student-stats", SCHOOL_ID] });
  }

  // Runs after either arm-assignment panel closes; refreshes both list and
  // stats so the table and enrolled/unenrolled counts stay accurate.
  function handleArmPanelClose() {
    setShowAssignArmPanel(false);
    setShowChangeArmPanel(false);
    setSelectedStudent(null);
    queryClient.invalidateQueries({ queryKey: ["students", SCHOOL_ID] });
    queryClient.invalidateQueries({ queryKey: ["student-stats", SCHOOL_ID] });
  }

  // Runs after bulk assign closes; the panel itself clears the selection.
  // Refresh list + stats so the table reflects the new placements.
  function handleBulkAssignClose() {
    setShowBulkAssignPanel(false);
    queryClient.invalidateQueries({ queryKey: ["students", SCHOOL_ID] });
    queryClient.invalidateQueries({ queryKey: ["student-stats", SCHOOL_ID] });
  }

  // ── Action-menu handlers — receive a row's student and route to UI ─────────
  function handleViewProfile(student: StudentRecord) {
    router.push(`/dashboard/student-profile?id=${student.id}`);
  }

  function handleAssignClass(student: StudentRecord) {
    setSelectedStudent(student);
    setShowAssignArmPanel(true);
  }

  function handleChangeClass(student: StudentRecord) {
    setSelectedStudent(student);
    setShowChangeArmPanel(true);
  }

  function handleRemoveFromClass(student: StudentRecord) {
    setSelectedStudent(student);
    setShowRemoveArmDialog(true);
  }

  function handleDelete(_student: StudentRecord) {
    // Backend has no DELETE student/detail/ endpoint, so surface the shared
    // FEATURE_IN_WORKS toast instead of attempting the action.
    toast.info(FEATURE_IN_WORKS);
  }

  // Labels for the two dropdown buttons.
  const activeFilterLabel =
    FILTER_OPTIONS.find((o) => o.value === activeFilter)?.label ?? "Filter";
  const activeSortLabel =
    SORT_OPTIONS.find((o) => o.value === sortValue)?.label ?? "Sort";

  // Determines whether any slide-in panel is open — used to collapse the list.
  const anyPanelOpen =
    showCreatePanel ||
    showAssignArmPanel ||
    showChangeArmPanel ||
    showBulkAssignPanel;

  // True when the user has typed something they haven't submitted yet.
  // Shown as a small hint next to the Submit button so it's obvious the
  // current results still reflect the previous search.
  const hasUnsubmittedSearch = searchInput.trim() !== appliedSearch;

  return (
    <>
      <div className="flex text-sm">
        {/* ── Main list panel ─────────────────────────────────────────────── */}
        <div
          className={`transition-all duration-500 ease-in-out overflow-hidden ${
            anyPanelOpen ? "w-0 opacity-0 h-0" : "w-full opacity-100"
          }`}
        >
          {/* ── Toolbar ───────────────────────────────────────────────────── */}
          {/* Two groups: the search form and a single right-aligned action row
              containing Filter, Sort, Print and Create. On mobile they stack;
              on lg+ they lay out inline. Create uses CSS `order` to sit at
              the leftmost slot of the action row on mobile so Filter and
              Sort stay near the right edge and their `right-0`-positioned
              menus never extend past the left side of the viewport. */}
          <div className="flex flex-col lg:flex-row gap-2 mb-6">
            {/* Search input + Submit button — wrapped in a form so pressing
                Enter inside the input triggers the same submit path as the
                button. Typing alone never fires a request. */}
            <form
              onSubmit={handleSearchSubmit}
              className="flex gap-2 flex-1 min-w-0"
              role="search"
              aria-label="Search students"
            >
              <div className="relative flex-1 min-w-0">
                <Search
                  size={13}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <input
                  type="text"
                  placeholder="Search name or student ID…"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  aria-label="Search students by name or ID"
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
              {/* Icon-only submit — the input's placeholder + label carry the
                  "search" meaning, so the button just needs an aria-label. */}
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

            {/* Filter, Sort, Print and Create — one right-aligned group. On
                mobile Create jumps to the visual leftmost slot via
                `order-first`, which keeps Filter and Sort near the right edge
                so their `right-0`-positioned menus never clip past the left
                side of the viewport. On md+ the natural DOM order is
                restored via `md:order-none` and Create returns to its usual
                rightmost position. Print is hidden below md. */}
            <div className="flex gap-2 justify-end">
              {/* Filter dropdown — outside-click handled by the shared effect */}
              <div ref={filterDropdownRef} className="relative">
                <button
                  onClick={() => {
                    setFilterDropdownOpen((o) => !o);
                    setSortDropdownOpen(false);
                  }}
                  aria-haspopup="menu"
                  aria-expanded={filterDropdownOpen}
                  className={`cursor-pointer flex items-center gap-1.5 px-3 py-2 text-xs border rounded-xl transition-colors ${
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
                  <div
                    role="menu"
                    className="absolute top-10 right-0 z-20 bg-white border border-slate-100 rounded-xl shadow-lg overflow-hidden w-44 sm:w-52 py-1"
                  >
                    {FILTER_OPTIONS.map((opt) => {
                      const isActive = activeFilter === opt.value;
                      return (
                        <button
                          key={opt.value}
                          role="menuitem"
                          onClick={() => handleFilterChange(opt.value)}
                          className={`cursor-pointer w-full flex items-center justify-between text-left px-4 py-2 text-xs transition-colors ${
                            isActive
                              ? "bg-violet-50 text-violet-700 font-semibold"
                              : "text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          <span>{opt.label}</span>
                          {isActive && <Check size={12} />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Sort dropdown — same interaction pattern as the filter */}
              <div ref={sortDropdownRef} className="relative">
                <button
                  onClick={() => {
                    setSortDropdownOpen((o) => !o);
                    setFilterDropdownOpen(false);
                  }}
                  aria-haspopup="menu"
                  aria-expanded={sortDropdownOpen}
                  className={`cursor-pointer flex items-center gap-1.5 px-3 py-2 text-xs border rounded-xl transition-colors ${
                    sortValue !== "default"
                      ? "border-violet-400 bg-violet-50 text-violet-700"
                      : "border-slate-200 bg-white text-slate-600 hover:border-violet-300"
                  }`}
                >
                  <ArrowUpDown size={12} />
                  <span className="hidden sm:inline">{activeSortLabel}</span>
                  <span className="sm:hidden">Sort</span>
                </button>

                {sortDropdownOpen && (
                  <div
                    role="menu"
                    className="absolute top-10 right-0 z-20 bg-white border border-slate-100 rounded-xl shadow-lg overflow-hidden w-44 sm:w-52 py-1"
                  >
                    {SORT_OPTIONS.map((opt) => {
                      const isActive = sortValue === opt.value;
                      return (
                        <button
                          key={opt.value}
                          role="menuitem"
                          onClick={() => handleSortChange(opt.value)}
                          className={`cursor-pointer w-full flex items-center justify-between text-left px-4 py-2 text-xs transition-colors ${
                            isActive
                              ? "bg-violet-50 text-violet-700 font-semibold"
                              : "text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          <span>{opt.label}</span>
                          {isActive && <Check size={12} />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Print — hidden below md to keep the mobile toolbar compact */}
              <button
                onClick={() => handlePrint()}
                className="cursor-pointer hidden md:inline-flex items-center gap-1.5 px-3 py-2 text-xs border border-slate-200 bg-white text-slate-600 rounded-xl hover:border-violet-300 transition-colors"
                title="Print"
              >
                <Printer size={12} />
                <span className="hidden sm:inline">Print</span>
              </button>

              {/* Create Student — leftmost on mobile via order-first, natural
                  rightmost slot on md+ via order-none. Label shortens below sm
                  so the whole group fits comfortably on narrow viewports. */}
              <button
                onClick={() => setShowCreatePanel(true)}
                className="cursor-pointer order-first md:order-0 flex items-center gap-1.5 px-3 py-2 text-xs bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors shadow-sm shadow-violet-200"
              >
                <UserPlus size={12} />
                <span className="sm:hidden">Create</span>
                <span className="hidden sm:inline">Create Student</span>
              </button>
            </div>
          </div>

          {/* ── Active-search pill ───────────────────────────────────────── */}
          {/* Confirms to the user which query the current results are scoped
              to and offers a one-click way out. Shown only when there's an
              active backend search in effect. */}
          {appliedSearch && (
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
              <span>Showing results for</span>
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
            </div>
          )}

          {/* ── Bulk action bar ─────────────────────────────────────────── */}
          {/* Appears between toolbar and table when 2+ students are selected.
              The count reflects the FULL selection across pages. */}
          {selectedStudents.size >= 2 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-violet-50 border border-violet-100 rounded-xl px-4 py-2.5 mb-4">
              <div className="flex items-center gap-2 text-violet-700">
                <Users size={14} />
                <span className="text-xs font-medium">
                  {selectedStudents.size}{" "}
                  {selectedStudents.size === 1 ? "student" : "students"}{" "}
                  selected
                </span>
              </div>
              <div className="flex items-center gap-2 justify-end">
                <button
                  onClick={clearSelection}
                  className="cursor-pointer text-xs text-slate-500 hover:text-slate-700 transition-colors px-3 py-1.5"
                >
                  Clear
                </button>
                <button
                  onClick={() => setShowBulkAssignPanel(true)}
                  className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 text-xs bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors shadow-sm shadow-violet-200"
                >
                  <UserPlus size={12} />
                  <span>Bulk Assign Arm</span>
                </button>
              </div>
            </div>
          )}

          {/* ── Loading state — skeleton rows while there is no data yet ─── */}
          {isPending ? (
            <TableLoader rows={6} className="my-4" />
          ) : (
            <>
              {/* ── Desktop table ────────────────────────────────────────── */}
              <div className="hidden md:block border border-indigo-100 rounded-2xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-left text-slate-500 border-b border-slate-200">
                      {/* Select-all checkbox — toggles every row on this page */}
                      <th className="px-5 py-3 font-semibold w-10">
                        <input
                          ref={headerCheckboxRef}
                          type="checkbox"
                          checked={allOnPageSelected}
                          onChange={toggleAllOnPage}
                          disabled={students.length === 0}
                          aria-label="Select all students on this page"
                          className="accent-violet-600 cursor-pointer disabled:cursor-not-allowed"
                        />
                      </th>
                      <th className="px-5 py-3 font-semibold">Student</th>
                      <th className="px-5 py-3 font-semibold">Gender</th>
                      <th className="px-5 py-3 font-semibold">Class</th>
                      <th className="px-5 py-3 font-semibold hidden lg:table-cell">
                        Date Created
                      </th>
                      <th className="px-5 py-3 font-semibold">Status</th>
                      <th className="px-5 py-3 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-50">
                    {students.length === 0 ? (
                      <tr>
                        <td colSpan={7}>
                          <EmptyState
                            variant={appliedSearch ? "search" : "students"}
                            title={
                              appliedSearch
                                ? "No results found"
                                : "No students found"
                            }
                            description={
                              appliedSearch
                                ? `No students match "${appliedSearch}".`
                                : "Try adjusting your filter or sort criteria."
                            }
                          />
                        </td>
                      </tr>
                    ) : (
                      students.map((student, index) => {
                        const portfolio = getCurrentPortfolio(student);
                        const isChecked = selectedStudents.has(student.id);
                        return (
                          <tr
                            key={student.id}
                            className={`h-14 hover:bg-violet-50/40 transition-colors ${
                              index % 2 === 0 ? "bg-white" : "bg-indigo-50/30"
                            } ${isChecked ? "bg-violet-50/50" : ""}`}
                          >
                            {/* Row checkbox */}
                            <td
                              className="px-5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleStudent(student)}
                                aria-label={`Select ${student.last_name} ${student.first_name}`}
                                className="accent-violet-600 cursor-pointer"
                              />
                            </td>

                            {/* Name + ID */}
                            <td className="px-5">
                              <div className="flex flex-col">
                                <span className="font-medium text-slate-800">
                                  {student.last_name} {student.first_name}{" "}
                                  {student.middle_name
                                    ? `${student.middle_name} `
                                    : ""}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  {student.public_id}
                                </span>
                              </div>
                            </td>

                            {/* Gender */}
                            <td className="px-5 text-slate-600">
                              {GENDER_LABELS[student.gender] ?? "—"}
                            </td>

                            {/* Class — shows "Not Set" in red when no arm */}
                            <td className="px-5 text-slate-600">
                              {student.current_arm ? (
                                <span>{formatArm(student.current_arm)}</span>
                              ) : (
                                <span className="text-red-500 text-[11px]">
                                  Not Set
                                </span>
                              )}
                            </td>

                            {/* Date created (slice ISO to YYYY-MM-DD) */}
                            <td className="px-5 text-slate-500 hidden lg:table-cell">
                              {portfolio?.created_on?.slice(0, 10) ?? "—"}
                            </td>

                            {/* Status */}
                            <td className="px-5">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                  portfolio?.status === "active"
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-yellow-50 text-yellow-700"
                                }`}
                              >
                                {portfolio?.status === "active"
                                  ? "Active"
                                  : "Inactive"}
                              </span>
                            </td>

                            {/* Action menu */}
                            <td
                              className="px-5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <StudentActionMenu
                                studentId={student.id}
                                hasArm={student.current_arm !== null}
                                onViewProfile={() => handleViewProfile(student)}
                                onAssignClass={() => handleAssignClass(student)}
                                onChangeClass={() => handleChangeClass(student)}
                                onRemoveFromClass={() =>
                                  handleRemoveFromClass(student)
                                }
                                onDelete={() => handleDelete(student)}
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
                {students.length === 0 ? (
                  <EmptyState
                    variant={appliedSearch ? "search" : "students"}
                    title={
                      appliedSearch ? "No results found" : "No students found"
                    }
                    description={
                      appliedSearch
                        ? `No students match "${appliedSearch}".`
                        : "Try adjusting your filter or sort criteria."
                    }
                  />
                ) : (
                  students.map((student) => {
                    const portfolio = getCurrentPortfolio(student);
                    const isChecked = selectedStudents.has(student.id);
                    return (
                      <div
                        key={student.id}
                        className={`bg-white border rounded-2xl overflow-hidden shadow-sm transition-colors ${
                          isChecked
                            ? "border-violet-300 bg-violet-50/30"
                            : "border-indigo-100"
                        }`}
                      >
                        {/* Card header */}
                        <div className="flex items-center justify-between p-4 border-b border-slate-50 gap-3">
                          {/* Checkbox + name block */}
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleStudent(student)}
                              aria-label={`Select ${student.first_name} ${student.last_name}`}
                              className="accent-violet-600 cursor-pointer shrink-0"
                            />
                            <div className="flex flex-col min-w-0">
                              <span className="text-sm font-semibold text-slate-800 truncate">
                                {student.last_name} {student.first_name}{" "}
                                {student.middle_name
                                  ? `${student.middle_name} `
                                  : ""}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {student.public_id}
                              </span>
                            </div>
                          </div>
                          <div onClick={(e) => e.stopPropagation()}>
                            <StudentActionMenu
                              studentId={student.id}
                              hasArm={student.current_arm !== null}
                              onViewProfile={() => handleViewProfile(student)}
                              onAssignClass={() => handleAssignClass(student)}
                              onChangeClass={() => handleChangeClass(student)}
                              onRemoveFromClass={() =>
                                handleRemoveFromClass(student)
                              }
                              onDelete={() => handleDelete(student)}
                            />
                          </div>
                        </div>

                        {/* Detail rows */}
                        <div className="flex flex-col gap-2 px-4 py-3 text-xs border-b border-slate-50">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Gender</span>
                            <span className="text-slate-700">
                              {GENDER_LABELS[student.gender] ?? "—"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Class</span>
                            {student.current_arm ? (
                              <span className="text-slate-700">
                                {formatArm(student.current_arm)}
                              </span>
                            ) : (
                              <span className="text-red-500">Not Set</span>
                            )}
                          </div>
                        </div>

                        {/* Status pill */}
                        <div className="flex items-center px-4 py-2.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              portfolio?.status === "active"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-yellow-50 text-yellow-700"
                            }`}
                          >
                            {portfolio?.status === "active"
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
              {students.length > 0 && (
                <Paginator
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              )}
            </>
          )}
        </div>

        {/* ── Slide-in panels ───────────────────────────────────────────── */}

        <StudentCreatePanel
          show={showCreatePanel}
          onClose={handleCreatePanelClose}
        />

        <StudentAssignArmPanel
          show={showAssignArmPanel}
          onClose={handleArmPanelClose}
          student={selectedStudent}
        />

        <StudentChangeArmPanel
          show={showChangeArmPanel}
          onClose={handleArmPanelClose}
          student={selectedStudent}
        />

        <StudentBulkAssignArmPanel
          show={showBulkAssignPanel}
          onClose={handleBulkAssignClose}
          selectedStudents={selectedStudents}
          setSelectedStudents={setSelectedStudents}
        />
      </div>

      {/* ── Remove-from-class dialog ────────────────────────────────────── */}
      <StudentRemoveFromArmDialog
        open={showRemoveArmDialog}
        student={selectedStudent}
        isPending={removeArmMutation.isPending}
        onClose={() => {
          setShowRemoveArmDialog(false);
          setSelectedStudent(null);
        }}
        onConfirm={() => {
          // The "Remove from class" action is only available when the student
          // has a current_arm, so this guard should normally pass.
          if (selectedStudent?.current_arm) {
            removeArmMutation.mutate({
              studentId: selectedStudent.id,
              armId: selectedStudent.current_arm.id,
            });
          }
        }}
      />

      {/* Hidden print template — prints the students currently on screen */}
      <div className="h-0 overflow-hidden">
        <StudentPrintTemplate ref={printRef} students={students} />
      </div>
    </>
  );
}
