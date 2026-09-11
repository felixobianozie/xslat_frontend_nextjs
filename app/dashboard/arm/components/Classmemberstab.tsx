"use client";

// ─────────────────────────────────────────────────────────────────────────────
// ClassMembersTab.tsx
//
// First tab — lists every student currently enrolled in this arm and exposes
// row-level actions (view profile, edit subjects, remove from class).
//
// Toolbar:
//  - Backend-powered search with an explicit submit action (mirrors the
//    /students list). Typing alone never fires a request — only clicking the
//    submit icon or pressing Enter does. A clear (X) resets the applied
//    search and refetches.
//  - Sort dropdown backed by the ?ordering= whitelist on student/list/. The
//    default is Gender (Z → A) so male students appear before female ones.
//  - Print button, hidden below sm so the phone toolbar stays compact.
//  - Add Member (primary action) sits at the visual leftmost slot on mobile
//    via `order-first` to keep the sort dropdown near the right edge, then
//    returns to its natural rightmost slot on md+.
//
// Backend wiring:
//  - GET student/list/?school-id=…&arm-id=…[&search=…][&ordering=…]
//    Applies the search + ordering server-side; the tab renders whatever the
//    backend returns with no client-side filtering or reordering.
//  - PUT arm/detail/roster/ with remove_student to remove a member. Fires
//    from the row action menu via ClassMemberRemoveFromArmDialog.
//
// Change Class remains on the /students module — that flow owns transfers
// between arms and is not duplicated here. The remove dialog surfaces a
// link to the Students page for users who want the transfer path instead.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useReactToPrint } from "react-to-print";
import {
  ArrowUpDown,
  Check,
  Plus,
  Printer,
  Search,
  Users,
  UserRound,
  X,
} from "lucide-react";
import { toast } from "react-toastify";

import { useClientAuthFetch } from "@/lib/Useclientauthfetch";
import EmptyState from "../../components/Emptystate";
import TableLoader from "../../components/Tableloader";
import { useArmDetails } from "../context/Armdetailsprovider";
import ClassMemberActionMenu from "./Classmemberactionmenu";
import ClassMemberRemoveFromArmDialog from "./Classmemberremovefromarmdialog";
import AddClassMemberPanel from "./Addclassmemberpanel";
import EditStudentSubjectsPanel from "./Editstudentsubjectspanel";

// ── Constants ────────────────────────────────────────────────────────────────

const SCHOOL_ID = process.env.NEXT_PUBLIC_SCHOOL_ID ?? "";

// The student/list/ endpoint is paginated (default page size 10). A single
// generous request keeps the whole roster on-screen without a paginator —
// class sizes above 100 would need true pagination, which is acceptable as
// a future refinement rather than a launch blocker.
const ROSTER_PAGE_SIZE = 100;

// ── Gender labels ────────────────────────────────────────────────────────────
const GENDER_LABELS: Record<string, string> = {
  M: "Male",
  F: "Female",
  O: "Other",
};

// ── Sort options — mapped 1:1 to backend's ?ordering= whitelist ──────────────
// Backend whitelist for GET student/list/ ordering is
//   {last_name, first_name, gender, created_on}.
// A stable id tiebreaker is always appended server-side so pagination cannot
// duplicate or skip rows on ties. Set kept identical to the /students list
// so behaviour is consistent across pages.
type SortValue =
  | "name_asc"
  | "name_desc"
  | "gender_asc"
  | "gender_desc"
  | "newest"
  | "oldest";

const SORT_OPTIONS: {
  label: string;
  value: SortValue;
  ordering: string;
}[] = [
  {
    label: "Name (A → Z)",
    value: "name_asc",
    ordering: "last_name,first_name",
  },
  {
    label: "Name (Z → A)",
    value: "name_desc",
    ordering: "-last_name,-first_name",
  },
  // Gender first (F → M → O), then alphabetical within each bucket so the
  // secondary order is meaningful rather than falling back to the server's
  // id tiebreaker.
  {
    label: "Gender (A → Z)",
    value: "gender_asc",
    ordering: "gender,last_name,first_name",
  },
  // Gender reversed (O → M → F). Male appears before Female by construction,
  // matching the requested default sort for this tab.
  {
    label: "Gender (Z → A)",
    value: "gender_desc",
    ordering: "-gender,last_name,first_name",
  },
  { label: "Newest first", value: "newest", ordering: "-created_on" },
  { label: "Oldest first", value: "oldest", ordering: "created_on" },
];

// Default sort on this tab — surfaces male students first as requested.
const DEFAULT_SORT: SortValue = "gender_desc";

// ── Local response shape for the paginated student endpoint ──────────────────
// Mirrors xslat_backend.pagination.StandardPagination's envelope. When the
// school has no current term, the endpoint returns a flat { message, data }
// instead — both shapes carry `data`, so reading `response.data` still works.
interface PaginatedResponse<T> {
  message: string;
  count?: number;
  total_pages?: number;
  current_page?: number;
  next?: string | null;
  previous?: string | null;
  data: T[];
}

// Build a display-friendly full name from the nested user fields.
function fullName(s: ArmStudent): string {
  return `${s.last_name} ${s.first_name} ${s.middle_name ? ` ${s.middle_name}` : ""}`;
}

// Build the GET student/list/ URL from the tab's current state. Only params
// with a real value are appended so the URL stays minimal for the common
// "default sort, no search" case.
function buildRosterUrl(
  armId: string,
  sortValue: SortValue,
  appliedSearch: string,
): string {
  const params = new URLSearchParams({
    "school-id": SCHOOL_ID,
    "arm-id": armId,
    page: "1",
    "page-size": String(ROSTER_PAGE_SIZE),
  });

  const ordering = SORT_OPTIONS.find((s) => s.value === sortValue)?.ordering;
  if (ordering) {
    params.set("ordering", ordering);
  }

  const q = appliedSearch.trim();
  if (q) {
    params.set("search", q);
  }

  return `student/list/?${params.toString()}`;
}

// Compact "section-abbr level-abbr arm-abbr" (e.g. "JSS 2 A") — the arm's
// human-facing identifier used across the print header and its filename.
function formatArmLabel(arm: ClassArm | null): string {
  if (!arm) return "";
  return `${arm.level.section.abbr} ${arm.level.abbr} ${arm.abbr}`;
}

// Pull the school name off the arm's nested chain. Present on every
// arm/detail/ response (via include_school_fields), so this needs no
// separate backend request. Returns null when the arm hasn't loaded yet
// or the chain is unexpectedly incomplete.
function getSchoolName(arm: ClassArm | null): string | null {
  return arm?.level.section.term?.session.school.name ?? null;
}

// Build the printed document's filename / print-dialog title. Used by
// react-to-print as documentTitle. Kept concise and filename-safe: the
// arm identifier is the leading token so the file sorts by class arm
// when saved. Falls back gracefully when either piece is still loading.
function buildPrintTitle(arm: ClassArm | null): string {
  const armLabel = formatArmLabel(arm);
  const schoolName = getSchoolName(arm);
  const base = armLabel ? `${armLabel} Class Roster` : "Class Roster";
  return schoolName ? `${base} - ${schoolName}` : base;
}

// Build the printed document's on-page header. Splits the arm label from the
// rest of the line so the caller can style the arm label at a larger size
// (per the requested visual hierarchy). Returns an object rather than JSX so
// this stays a plain helper — the caller composes the actual elements.
function buildPrintHeader(arm: ClassArm | null): {
  armLabel: string;
  rest: string;
} {
  const armLabel = formatArmLabel(arm);
  const schoolName = getSchoolName(arm);
  const rest = schoolName ? `CLASS ROSTER OF ${schoolName}` : "CLASS ROSTER";
  return { armLabel, rest };
}

export default function ClassMembersTab() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { clientAuthFetch } = useClientAuthFetch();
  const { armId, arm } = useArmDetails();

  // ── UI state ──────────────────────────────────────────────────────────────

  // Two search states: `searchInput` is what the user is typing (never sent
  // to the backend by itself); `appliedSearch` is what the current backend
  // request is scoped by. They diverge while the user is typing and re-sync
  // when Submit is pressed or Clear is clicked. Keeping them separate is
  // what lets us "avoid unnecessary requests while the user is typing".
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");

  const [sortValue, setSortValue] = useState<SortValue>(DEFAULT_SORT);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

  const [showAddPanel, setShowAddPanel] = useState(false);
  const [showEditSubjectsPanel, setShowEditSubjectsPanel] = useState(false);
  const [showRemoveArmDialog, setShowRemoveArmDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<ArmStudent | null>(
    null,
  );

  // Refs
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const printRef = useRef<HTMLDivElement>(null);

  // Print — documentTitle is the print-preview name and the default filename
  // when saving to PDF. Function form keeps it current with the latest `arm`
  // (school name is read off the arm chain so no extra request is needed).
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: () => buildPrintTitle(arm),
  });

  // Close the sort dropdown when the user clicks anywhere outside it.
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (
        sortDropdownRef.current &&
        !sortDropdownRef.current.contains(e.target as Node)
      ) {
        setSortDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  // ── Data ──────────────────────────────────────────────────────────────────
  // Query key covers every param sent to the backend, so any change to the
  // arm, sort, or applied (submitted) search triggers a fresh fetch.
  // `searchInput` is deliberately NOT in the key: typing must not fire
  // requests — only Submit / Clear can.
  const { data, isPending, isError, error } = useQuery<
    PaginatedResponse<ArmStudent>
  >({
    queryKey: ["arm-students", armId, sortValue, appliedSearch],
    queryFn: async () => {
      const url = buildRosterUrl(armId, sortValue, appliedSearch);
      const { data, error } =
        await clientAuthFetch<PaginatedResponse<ArmStudent>>(url);
      if (error) throw new Error(error.message);
      return data!;
    },
    enabled: !!armId,
  });

  useEffect(() => {
    if (isError && error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load class members.",
      );
    }
  }, [isError, error]);

  const students = data?.data ?? [];
  // Total from the backend when available (paginated envelope); falls back to
  // the returned array length when the "no current term" branch trims off
  // the pagination metadata.
  const totalStudents = data?.count ?? students.length;

  // ── Handlers ──────────────────────────────────────────────────────────────

  // Submit the current search input to the backend. Called by the submit
  // button and by pressing Enter inside the input (via the wrapping form).
  function handleSearchSubmit(e?: FormEvent) {
    e?.preventDefault();
    const q = searchInput.trim();
    // Skip the round-trip when the submitted value hasn't actually changed —
    // React Query would just return the cached page anyway.
    if (q === appliedSearch) return;
    setAppliedSearch(q);
  }

  // Clear both the input and the active backend search.
  function handleSearchClear() {
    setSearchInput("");
    if (appliedSearch !== "") {
      setAppliedSearch("");
    }
  }

  function handleSortChange(s: SortValue) {
    setSortValue(s);
    setSortDropdownOpen(false);
  }

  function handleViewProfile(student: ArmStudent) {
    // Student profile page route — adjust if the project uses a different path.
    router.push(`/dashboard/student?id=${student.id}`);
  }

  function handleEditSubjects(student: ArmStudent) {
    setSelectedStudent(student);
    setShowEditSubjectsPanel(true);
  }

  function handleEditPanelClose() {
    setShowEditSubjectsPanel(false);
    setSelectedStudent(null);
  }

  // ── Remove-from-class flow ────────────────────────────────────────────────
  // The arm being removed from is always this tab's arm (from context) — no
  // per-student lookup needed. On success, invalidate every cache that
  // reflects roster membership so the tab, the arm-detail header, related
  // panels, and the /students page all update the next time they're viewed.
  const removeArmMutation = useMutation({
    mutationFn: async ({
      studentId,
      armId: targetArmId,
    }: {
      studentId: string;
      armId: string;
    }) => {
      const { data, error } = await clientAuthFetch("arm/detail/roster/", {
        method: "PUT",
        body: {
          id: targetArmId,
          school_id: SCHOOL_ID,
          remove_student: [studentId],
        },
      });
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      toast.success("Student removed from class.");
      // This tab's roster.
      queryClient.invalidateQueries({ queryKey: ["arm-students", armId] });
      // Arm-detail header (student count and any other derived values).
      queryClient.invalidateQueries({ queryKey: ["arm-detail", armId] });
      // Class assessment aggregates — a removed student's rows are gone.
      queryClient.invalidateQueries({
        queryKey: ["arm-assessment-compute", armId],
      });
      // Add Class Member panel's pool of arm-less students grows by one.
      queryClient.invalidateQueries({ queryKey: ["students-without-arm"] });
      // /students page — the student now shows as unenrolled there too.
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

  function handleRemoveFromClass(student: ArmStudent) {
    setSelectedStudent(student);
    setShowRemoveArmDialog(true);
  }

  function handleRemoveDialogClose() {
    if (removeArmMutation.isPending) return;
    setShowRemoveArmDialog(false);
    setSelectedStudent(null);
  }

  function handleRemoveDialogConfirm() {
    if (!selectedStudent || !armId) return;
    removeArmMutation.mutate({
      studentId: selectedStudent.id,
      armId,
    });
  }

  const aPanelIsOpen = showAddPanel || showEditSubjectsPanel;

  // Label for the sort dropdown button.
  const activeSortLabel =
    SORT_OPTIONS.find((o) => o.value === sortValue)?.label ?? "Sort";

  // True when the user has typed something they haven't submitted yet — used
  // to disable the submit button when it wouldn't do anything.
  const hasUnsubmittedSearch = searchInput.trim() !== appliedSearch;

  return (
    <>
      <div className="flex text-sm">
        {/* ── Main list ─────────────────────────────────────────────────── */}
        <div
          className={`transition-all duration-500 ease-in-out overflow-hidden ${
            aPanelIsOpen ? "w-0 opacity-0 h-0" : "w-full opacity-100"
          }`}
        >
          {/* ── Toolbar ─────────────────────────────────────────────────── */}
          {/* Two groups: the search form and a single right-aligned action
              row (Sort, Print, Add Member). Add Member uses `order-first` on
              mobile so it takes the leftmost visual slot, keeping the Sort
              dropdown near the right edge where its `right-0` menu has room
              to extend leftward. On md+ the natural DOM order is restored. */}
          <div className="flex flex-col lg:flex-row gap-2 mb-6">
            {/* Search input + Submit button — wrapped in a form so pressing
                Enter inside the input triggers the same submit path as the
                button. Typing alone never fires a request. */}
            <form
              onSubmit={handleSearchSubmit}
              className="flex gap-2 flex-1 min-w-0"
              role="search"
              aria-label="Search class members"
            >
              <div className="relative flex-1 min-w-0">
                <Search
                  size={13}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <input
                  type="text"
                  placeholder="Search by name or ID…"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  aria-label="Search class members by name or ID"
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

            {/* Action group — sort, print, and the primary Add Member button */}
            <div className="flex gap-2 justify-end">
              {/* Sort dropdown */}
              <div ref={sortDropdownRef} className="relative">
                <button
                  onClick={() => setSortDropdownOpen((o) => !o)}
                  aria-haspopup="menu"
                  aria-expanded={sortDropdownOpen}
                  className={`cursor-pointer flex items-center gap-1.5 px-3 py-2 text-xs border rounded-xl transition-colors ${
                    sortValue !== DEFAULT_SORT
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

              {/* Print — hidden below sm to keep the phone toolbar compact;
                  visible from small tablets up through desktop. */}
              <button
                onClick={() => handlePrint()}
                className="cursor-pointer hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs border border-slate-200 bg-white text-slate-600 rounded-xl hover:border-violet-300 transition-colors"
                title="Print"
              >
                <Printer size={12} />
                <span className="hidden sm:inline">Print</span>
              </button>

              {/* Add Member — leftmost on mobile via order-first so the sort
                  dropdown's right-0 menu has room to extend leftward. Returns
                  to its natural rightmost slot on md+. */}
              <button
                onClick={() => setShowAddPanel(true)}
                className="cursor-pointer order-first md:order-0 flex items-center gap-1.5 px-3 py-2 text-xs bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors shadow-sm shadow-violet-200"
              >
                <Plus size={12} />
                <span>Add Member</span>
              </button>
            </div>
          </div>

          {/* ── Active-search pill ──────────────────────────────────────── */}
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

          {/* Count strip */}
          <div className="text-[11px] text-slate-500 mb-3 flex items-center gap-1.5">
            <Users size={11} />
            {isPending
              ? "Loading…"
              : `${totalStudents} student${totalStudents === 1 ? "" : "s"}`}
          </div>

          {/* List */}
          {isPending ? (
            <TableLoader rows={5} />
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block border border-indigo-100 rounded-2xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-left text-slate-500 border-b border-slate-200">
                      <th className="px-5 py-3 font-semibold w-16">S/N</th>
                      <th className="px-5 py-3 font-semibold">Student</th>
                      <th className="px-5 py-3 font-semibold">Student ID</th>
                      <th className="px-5 py-3 font-semibold">Gender</th>
                      <th className="px-5 py-3 font-semibold w-24">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-50">
                    {students.length === 0 ? (
                      <tr>
                        <td colSpan={5}>
                          <EmptyState
                            variant={appliedSearch ? "search" : "generic"}
                            title={
                              appliedSearch
                                ? "No results found"
                                : "No class members yet"
                            }
                            description={
                              appliedSearch
                                ? `No students match "${appliedSearch}".`
                                : "Add students to populate the class roster."
                            }
                          />
                        </td>
                      </tr>
                    ) : (
                      students.map((student, index) => (
                        <tr
                          key={student.id}
                          className={`h-14 hover:bg-violet-50/40 transition-colors ${
                            index % 2 === 0 ? "bg-white" : "bg-indigo-50/30"
                          }`}
                        >
                          <td className="px-5 text-slate-500">{index + 1}</td>
                          <td className="px-5">
                            <div className="flex items-center gap-2">
                              <span className="border border-indigo-300 rounded-full p-1.5 text-slate-500 shrink-0">
                                <UserRound size={11} />
                              </span>
                              <span className="text-slate-800">
                                {fullName(student)}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 text-slate-500 font-mono text-[11px]">
                            {student.public_id ?? "—"}
                          </td>
                          <td className="px-5 text-slate-600">
                            {student.gender
                              ? (GENDER_LABELS[student.gender] ?? "—")
                              : "—"}
                          </td>
                          <td className="px-5">
                            <ClassMemberActionMenu
                              studentId={student.id}
                              onView={() => handleViewProfile(student)}
                              onEditSubjects={() => handleEditSubjects(student)}
                              onRemoveFromClass={() =>
                                handleRemoveFromClass(student)
                              }
                            />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="flex flex-col gap-3 md:hidden">
                {students.length === 0 ? (
                  <EmptyState
                    variant={appliedSearch ? "search" : "generic"}
                    title={
                      appliedSearch
                        ? "No results found"
                        : "No class members yet"
                    }
                    description={
                      appliedSearch
                        ? `No students match "${appliedSearch}".`
                        : "Add students to populate the class roster."
                    }
                  />
                ) : (
                  students.map((student) => (
                    <div
                      key={student.id}
                      className="bg-white border border-indigo-100 rounded-2xl p-4 shadow-sm flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="border border-indigo-300 rounded-full p-2 text-slate-500 shrink-0">
                          <UserRound size={14} />
                        </span>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm text-slate-800 truncate">
                            {fullName(student)}
                          </span>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400">
                            {student.public_id && (
                              <span className="font-mono">
                                {student.public_id}
                              </span>
                            )}
                            {student.public_id && student.gender && (
                              <span aria-hidden="true">·</span>
                            )}
                            {student.gender && (
                              <span>{GENDER_LABELS[student.gender]}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <ClassMemberActionMenu
                        studentId={student.id}
                        onView={() => handleViewProfile(student)}
                        onEditSubjects={() => handleEditSubjects(student)}
                        onRemoveFromClass={() => handleRemoveFromClass(student)}
                      />
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>

        {/* ── Slide-in panels ──────────────────────────────────────────── */}
        <AddClassMemberPanel
          show={showAddPanel}
          onClose={() => setShowAddPanel(false)}
        />
        <EditStudentSubjectsPanel
          show={showEditSubjectsPanel}
          student={selectedStudent}
          onClose={handleEditPanelClose}
        />
      </div>

      {/* ── Remove-from-class dialog ──────────────────────────────────────
          Modal (not a slide-in panel), so it's mounted outside the tab's
          main flex container and doesn't participate in the aPanelIsOpen
          collapse animation. */}
      <ClassMemberRemoveFromArmDialog
        open={showRemoveArmDialog}
        student={selectedStudent}
        arm={arm}
        isPending={removeArmMutation.isPending}
        onClose={handleRemoveDialogClose}
        onConfirm={handleRemoveDialogConfirm}
      />

      {/* Hidden print template — replicates the on-screen column structure
          (S/N, Name, Student ID, Gender) minus the row action menu.
          Layout parameters are tuned for print compactness so a typical
          class of ~50 students fits within two printed pages: tighter
          header padding and shorter row heights while keeping text-xs
          readable. */}
      <div className="h-0 overflow-hidden">
        <div ref={printRef} className="m-8">
          {/* Print header:
                <ARM LABEL>   CLASS ROSTER OF <SCHOOL NAME>
              Arm label is set in a much larger font than the rest so the
              class arm is the first thing the eye lands on when scanning a
              printed roster. `items-center` vertically centres the two
              differently-sized spans so they read as one balanced heading. */}
          {(() => {
            const { armLabel, rest } = buildPrintHeader(arm);
            return (
              <h1 className="font-bold py-2 uppercase tracking-wide flex items-center gap-3 flex-wrap">
                {armLabel && <span className="text-2xl">{armLabel}</span>}
                <span className="text-sm">{rest}</span>
              </h1>
            );
          })()}
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border border-gray-300 text-left h-7">
                <th className="px-3">S/N</th>
                <th className="px-3">Name</th>
                <th className="px-3">Student ID</th>
                <th className="px-3">Gender</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s, index) => (
                <tr
                  key={s.id}
                  className={`h-7 border-b border-gray-200 ${
                    index % 2 === 0 ? "bg-indigo-50" : ""
                  }`}
                >
                  <td className="px-3">{index + 1}</td>
                  <td className="px-3">{fullName(s)}</td>
                  <td className="px-3">{s.public_id ?? "—"}</td>
                  <td className="px-3">
                    {s.gender ? (GENDER_LABELS[s.gender] ?? "—") : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
