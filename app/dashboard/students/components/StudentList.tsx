"use client";

// ─────────────────────────────────────────────────────────────────────────────
// StudentList.tsx
//
// Renders the paginated student list.
// Includes: search, filter (backend-aligned params), PDF download, print,
// Create Student slide-in panel, Assign/Change Arm slide-in panels, a Remove
// from Class confirmation modal, and bulk selection (with a contextual action
// bar that opens the Bulk Assign Arm slide-in panel).
//
// Data layer:
//  - initialData is the full server-fetched paginated envelope for page 1
//    (gathered by the parent page via serverAuthFetch). total_pages, count,
//    and the data array all come directly from the server — no client-side
//    recomputation.
//  - useQuery is the single source of truth after hydration. Pagination and
//    backend-supported filters (gender, no-arm) are sent as URL query params.
//    Portfolio-level filters (status, boarding) and text search are applied
//    client-side to the current page since the backend list endpoint does not
//    expose those as list params — a known limitation that mirrors how
//    StaffList handles text search.
//  - initialDataUpdatedAt: Date.now() tells React Query the server data is
//    fresh so it skips an immediate background refetch on mount.
//  - isPending drives the skeleton whenever there is no cached data for the
//    current query key — covers initial load, page navigation, and filter
//    changes.
//  - Mutations (assign / change / remove arm) use useMutation and invalidate
//    the list + stats queries on success. The Remove-from-class mutation
//    calls PUT arm/detail/roster/ with remove_student. Delete and Edit
//    Subjects are not yet backed by endpoints, so they surface the shared
//    "feature in the works" toast.
//
// Bulk selection:
//  - `selectedIds` is a Set<string> kept in component state. It persists
//    across page changes and filter changes because selection is keyed by
//    student ID, not by row position.
//  - The header checkbox toggles every row on the CURRENT PAGE only — it
//    shows an indeterminate state when some-but-not-all visible rows are
//    selected.
//  - When 2+ students are selected, a contextual action bar appears between
//    the toolbar and the table with a Bulk Assign Arm button.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useReactToPrint } from "react-to-print";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import {
  Search,
  Filter,
  Download,
  Printer,
  UserPlus,
  Users,
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

// ── Constants ─────────────────────────────────────────────────────────────────

const SCHOOL_ID = process.env.NEXT_PUBLIC_SCHOOL_ID ?? "";

// Shown whenever the user triggers a button whose backend endpoint isn't built
// yet. Kept centralised so the wording stays consistent everywhere.
// Mirrors the same pattern used in StaffList.tsx and ArmList.tsx.
const FEATURE_IN_WORKS = "This feature is currently in the works.";

// ── Gender labels ──────────────────────────────────────────────────────────
const GENDER_LABELS: Record<string, string> = {
  M: "Male",
  F: "Female",
  O: "Other",
};

// ── Filter options — keys map to the backend GET student/list/ filter set ─
// Backend supports: gender (M | F | O), no-arm (true/false), arm-id (uuid),
// first-name (str), last-name (str). We also surface portfolio-level filters
// (status, boarding) here — those are client-side-only for now since the
// backend doesn't list-filter on portfolio fields.
type FilterOption =
  | "all"
  | "status:active"
  | "status:inactive"
  | "gender:M"
  | "gender:F"
  | "no_arm:true"
  | "boarding:true";

const FILTER_OPTIONS: { label: string; value: FilterOption }[] = [
  { label: "All Students", value: "all" },
  { label: "Active", value: "status:active" },
  { label: "Inactive", value: "status:inactive" },
  { label: "Male", value: "gender:M" },
  { label: "Female", value: "gender:F" },
  { label: "Not Assigned to Class", value: "no_arm:true" },
  { label: "Boarding", value: "boarding:true" },
];

// ── Build the API URL from current state params ────────────────────────────
// Converts UI state (page + filter) into the backend query string.
//
// Backend GET student/list/ supports as list params:
//   gender (M | F | O), no-arm (true/false), arm-id (uuid),
//   first-name (str), last-name (str).
//
// status and boarding live on the portfolio and the backend does not list-
// filter on them, so those filter values are applied client-side below.
// Likewise the toolbar's single text search box is applied client-side
// against the current page — matching how StaffList handles text search.
function buildStudentsUrl(page: number, activeFilter: FilterOption): string {
  const params = new URLSearchParams({
    "school-id": SCHOOL_ID,
    page: String(page),
    "page-size": String(PAGE_SIZE),
  });

  if (activeFilter !== "all") {
    const [param, val] = activeFilter.split(":");
    // Only the backend-supported list filters are sent as query params.
    if (param === "gender") {
      params.set("gender", val);
    } else if (param === "no_arm") {
      params.set("no-arm", val);
    }
    // status and boarding are intentionally skipped here — applied client-side.
  }

  return `student/list/?${params.toString()}`;
}

// Apply the filters the backend does not support (status, boarding) plus the
// toolbar text search to a page of students. The result drives the table,
// bulk selection, and the print template so the user only ever interacts
// with the records actually visible after every filter.
function applyClientSideFilters(
  rawStudents: StudentRecord[],
  activeFilter: FilterOption,
  searchQuery: string,
): StudentRecord[] {
  let filtered = rawStudents;

  // status (active | inactive) — derived from the student's current portfolio
  if (activeFilter === "status:active" || activeFilter === "status:inactive") {
    const wanted = activeFilter === "status:active" ? "active" : "inactive";
    filtered = filtered.filter((s) => {
      const portfolio = s.portfolios.find((p) => p.current);
      return portfolio?.status === wanted;
    });
  }

  // boarding — true means only boarders, derived from the current portfolio
  if (activeFilter === "boarding:true") {
    filtered = filtered.filter((s) => {
      const portfolio = s.portfolios.find((p) => p.current);
      return portfolio?.boarding === true;
    });
  }

  // Text search — case-insensitive match across name, public_id, email, phone
  const q = searchQuery.trim().toLowerCase();
  if (q) {
    filtered = filtered.filter((s) => {
      const fullName =
        `${s.first_name} ${s.middle_name ?? ""} ${s.last_name}`.toLowerCase();
      return (
        fullName.includes(q) ||
        s.public_id.toLowerCase().includes(q) ||
        (s.email ?? "").toLowerCase().includes(q) ||
        (s.phone ?? "").includes(q)
      );
    });
  }

  return filtered;
}

// Format a class arm for display: "JSS 1 A" — section + level + arm
function formatArm(arm: ClassArm | null): string {
  if (!arm) return "";
  return `${arm.level.section.abbr} ${arm.level.abbr} ${arm.abbr}`;
}

// Extract the portfolio for the current school from a student record.
// Used for status, boarding, and created_on columns.
function getCurrentPortfolio(student: StudentRecord) {
  return student.portfolios.find((p) => p.current) ?? student.portfolios[0];
}

// ── Props ──────────────────────────────────────────────────────────────────
interface StudentListProps {
  /**
   * Full server-fetched paginated envelope for page 1 — used as React Query
   * initialData. The real total_pages and count come directly from the server
   * so no client-side recomputation is needed. Null when the server fetch failed.
   */
  initialData: PaginatedResponse<StudentRecord> | null;
}

export default function StudentList({ initialData }: StudentListProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { clientAuthFetch } = useClientAuthFetch();

  // ── Local UI state ─────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterOption>("all");
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Panel and dialog state
  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [showAssignArmPanel, setShowAssignArmPanel] = useState(false);
  const [showChangeArmPanel, setShowChangeArmPanel] = useState(false);
  const [showBulkAssignPanel, setShowBulkAssignPanel] = useState(false);
  const [showRemoveArmDialog, setShowRemoveArmDialog] = useState(false);

  // The student currently selected for an action (assign/change/remove/delete).
  // null when no action is in flight.
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(
    null,
  );

  // Bulk selection — set of student IDs ticked in the table. Persists across
  // page and filter changes since selection is keyed by ID, not row position.
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Refs
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  const printRef = useRef<HTMLDivElement>(null);
  // Ref for the header checkbox so we can set its `indeterminate` HTML property
  // (React doesn't expose `indeterminate` as a prop).
  const headerCheckboxRef = useRef<HTMLInputElement>(null);
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

  // ── React Query — list ─────────────────────────────────────────────────────
  // Query key includes page + filter + school so changes trigger a refetch.
  // searchQuery is NOT part of the key: text search runs client-side on the
  // current page, matching StaffList. status and boarding are also client-side
  // (see applyClientSideFilters below), so they likewise stay out of the key
  // when their value would not change the URL.
  const {
    data: queryData,
    isPending,
    isError,
    error,
  } = useQuery<PaginatedResponse<StudentRecord>>({
    queryKey: ["students", SCHOOL_ID, currentPage, activeFilter],
    queryFn: async () => {
      const url = buildStudentsUrl(currentPage, activeFilter);
      const { data, error } =
        await clientAuthFetch<PaginatedResponse<StudentRecord>>(url);

      if (error) {
        // Throwing makes React Query set isError and retry according to its policy.
        // The error message is picked up by the useEffect below for the toast.
        throw new Error(error.message);
      }

      return data!;
    },

    // Hydrate with the server-fetched envelope so there is no loading flash on
    // first render. Only applied for the initial state (page 1, no filter)
    // since that is exactly what the server fetched.
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

  // Note: a delete mutation is intentionally not defined here.
  // The backend StudentDetailView only exposes GET and PUT — there is no
  // DELETE endpoint yet — so handleDelete surfaces the FEATURE_IN_WORKS toast
  // instead of mutating. When DELETE student/detail/ ships, add the mutation
  // back and wire it into handleDelete.

  // ── Derived data ───────────────────────────────────────────────────────────
  // rawStudents is the raw page from the backend (already filtered by the
  // backend-supported list params — gender and no-arm).
  // students applies the client-side filters (status, boarding, search) and
  // drives the table, bulk selection, and the print template so the user only
  // ever interacts with records that match every active filter.
  const rawStudents = queryData?.data ?? [];
  const students = applyClientSideFilters(
    rawStudents,
    activeFilter,
    searchQuery,
  );
  const totalPages = queryData?.total_pages ?? 1;

  // ── Bulk selection derived state ───────────────────────────────────────────
  // The header checkbox tracks the CURRENT PAGE only — selecting "all" on
  // page 2 doesn't tick page 1's rows, and vice versa. The bulk action bar
  // (further down) shows the TOTAL count across pages.
  const allOnPageSelected =
    students.length > 0 && students.every((s) => selectedIds.has(s.id));
  const someOnPageSelected = students.some((s) => selectedIds.has(s.id));
  const isIndeterminate = someOnPageSelected && !allOnPageSelected;

  // Set the header checkbox's indeterminate property in sync with state.
  // React doesn't expose `indeterminate` as a prop, so we set it via ref.
  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = isIndeterminate;
    }
  }, [isIndeterminate]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleSearchChange(q: string) {
    setSearchQuery(q);
    setCurrentPage(1);
  }

  function handleFilterChange(f: FilterOption) {
    setActiveFilter(f);
    setCurrentPage(1);
    setFilterDropdownOpen(false);
  }

  // Toggle a single row's selection. Set updates must be immutable so React
  // detects the change, hence the `new Set(prev)` pattern.
  function toggleStudent(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Toggle every row on the current page. If everything visible is already
  // selected, the click acts as a "deselect page" instead.
  function toggleAllOnPage() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) {
        students.forEach((s) => next.delete(s.id));
      } else {
        students.forEach((s) => next.add(s.id));
      }
      return next;
    });
  }

  // Clear all selections — used by the "Clear" button in the bulk action bar.
  function clearSelection() {
    setSelectedIds(new Set());
  }

  // Closes the create panel and triggers a list/stats refresh.
  function handleCreatePanelClose() {
    setShowCreatePanel(false);
    queryClient.invalidateQueries({ queryKey: ["students", SCHOOL_ID] });
    queryClient.invalidateQueries({ queryKey: ["student-stats", SCHOOL_ID] });
  }

  // After arm assignment / change completes, refresh both list and stats so
  // the table and the "Active" count reflect the change.
  function handleArmPanelClose() {
    setShowAssignArmPanel(false);
    setShowChangeArmPanel(false);
    setSelectedStudent(null);
    queryClient.invalidateQueries({ queryKey: ["students", SCHOOL_ID] });
    queryClient.invalidateQueries({ queryKey: ["student-stats", SCHOOL_ID] });
  }

  // After bulk assign completes, the panel itself clears the selection. Here
  // we only close the panel and refresh queries.
  function handleBulkAssignClose() {
    setShowBulkAssignPanel(false);
    queryClient.invalidateQueries({ queryKey: ["students", SCHOOL_ID] });
    queryClient.invalidateQueries({ queryKey: ["student-stats", SCHOOL_ID] });
  }

  // ── Action menu handlers — receive a row's student and route to the right UI
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
    // The backend has no DELETE student/detail/ endpoint yet, so we surface
    // the shared FEATURE_IN_WORKS toast instead of attempting the action.
    toast.info(FEATURE_IN_WORKS);
  }

  // No PDF/export endpoint exists on the backend yet — surface the same
  // shared FEATURE_IN_WORKS toast until one ships.
  function handleDownloadPdf() {
    toast.info(FEATURE_IN_WORKS);
  }

  const activeFilterLabel =
    FILTER_OPTIONS.find((o) => o.value === activeFilter)?.label ?? "Filter";

  // Determines whether any slide-in panel is open — used to collapse the list.
  const anyPanelOpen =
    showCreatePanel ||
    showAssignArmPanel ||
    showChangeArmPanel ||
    showBulkAssignPanel;

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
          <div className="flex flex-col sm:flex-row gap-2 mb-6">
            {/* Search */}
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

            {/* Filter dropdown */}
            <div ref={filterDropdownRef} className="relative">
              <button
                onClick={() => setFilterDropdownOpen((o) => !o)}
                className={`cursor-pointer flex w-full items-center gap-1.5 px-3 py-2 text-xs border rounded-xl transition-colors ${
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
                <div className="absolute top-10 left-0 z-20 bg-white border border-slate-100 rounded-xl shadow-lg overflow-hidden w-56 py-1">
                  {FILTER_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleFilterChange(opt.value)}
                      className={`cursor-pointer w-full text-left px-4 py-2 text-xs transition-colors ${
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

              <button
                onClick={() => handlePrint()}
                className="cursor-pointer flex items-center gap-1.5 px-3 py-2 text-xs border border-slate-200 bg-white text-slate-600 rounded-xl hover:border-violet-300 transition-colors"
                title="Print"
              >
                <Printer size={12} />
                <span className="hidden sm:inline">Print</span>
              </button>

              <button
                onClick={() => setShowCreatePanel(true)}
                className="cursor-pointer flex items-center gap-1.5 px-3 py-2 text-xs bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors shadow-sm shadow-violet-200"
              >
                <UserPlus size={12} />
                <span>Create Student</span>
              </button>
            </div>
          </div>

          {/* ── Bulk action bar ─────────────────────────────────────────── */}
          {/* Appears between toolbar and table when 2+ students are selected. */}
          {/* The count reflects the FULL selection across pages. */}
          {selectedIds.size >= 2 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-violet-50 border border-violet-100 rounded-xl px-4 py-2.5 mb-4">
              <div className="flex items-center gap-2 text-violet-700">
                <Users size={14} />
                <span className="text-xs font-medium">
                  {selectedIds.size}{" "}
                  {selectedIds.size === 1 ? "student" : "students"} selected
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
                      {/* Select-all checkbox — toggles every row on the current page */}
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
                            variant={searchQuery ? "search" : "students"}
                            title={
                              searchQuery
                                ? "No results found"
                                : "No students found"
                            }
                            description={
                              searchQuery
                                ? `No students match "${searchQuery}".`
                                : "Try adjusting your filter criteria."
                            }
                          />
                        </td>
                      </tr>
                    ) : (
                      students.map((student, index) => {
                        const portfolio = getCurrentPortfolio(student);
                        const isChecked = selectedIds.has(student.id);
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
                                onChange={() => toggleStudent(student.id)}
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
                    variant={searchQuery ? "search" : "students"}
                    title={
                      searchQuery ? "No results found" : "No students found"
                    }
                  />
                ) : (
                  students.map((student) => {
                    const portfolio = getCurrentPortfolio(student);
                    const isChecked = selectedIds.has(student.id);
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
                              onChange={() => toggleStudent(student.id)}
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
          selectedIds={selectedIds}
          setSelectedIds={setSelectedIds}
        />
      </div>

      {/* ── Remove from class dialog ────────────────────────────────────── */}
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

      {/* Hidden print template — prints currently loaded students */}
      <div className="h-0 overflow-hidden">
        <StudentPrintTemplate ref={printRef} students={students} />
      </div>
    </>
  );
}
