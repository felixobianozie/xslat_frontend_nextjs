"use client";

// ─────────────────────────────────────────────────────────────────────────────
// ArmList.tsx
//
// Renders the class arm list page.
// Includes: search, filter (by section), Print, and a Create Arm slide-in panel.
// Each row exposes an action menu with View / Assign Teachers / Delete.
//
// Data layer:
//  - useQuery is the single source of truth. The query calls the real backend
//    GET arm/list/?school-id=…&term-id=… via clientAuthFetch.
//  - initialArms (from the server component) is handed to React Query as
//    initialData so there is no loading flash on first paint.
//  - Filtering by section and text search are purely client-side because the
//    backend's GET arm/list/ does not list-filter by section, and it has no
//    full-text search param. Backend filters that DO exist (level, broadsheet,
//    name) are not exposed here — the draft only scopes the filter to section.
//  - Mutations on the create/assign-teachers panels invalidate the broad
//    ["arms", SCHOOL_ID] key so every variant of the cached list refreshes.
//
// Backend gaps that surface as "feature in the works" toasts:
//  - Delete arm: no DELETE endpoint exists in academics.views yet.
//  - PDF download: no server-side PDF generation endpoint exists yet.
//
// Note on the list response shape:
//  ArmListView's include_arm_fields tuple is ("id", "name", "abbr", "level"),
//  so class_teacher / ass_class_teacher are NOT in the list payload. The
//  teacher columns therefore render their "Not assigned" fallback for every
//  row; the dedicated Assign Teachers panel fetches the arm detail to show
//  accurate current-teacher information when it opens.
// ─────────────────────────────────────────────────────────────────────────────

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useReactToPrint } from "react-to-print";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Download,
  Filter,
  PlusCircle,
  Printer,
  Search,
  UserRound,
} from "lucide-react";
import { toast } from "react-toastify";

import { useClientAuthFetch } from "@/lib/Useclientauthfetch";
import EmptyState from "../../components/Emptystate";
import TableLoader from "../../components/Tableloader";
import ArmActionMenu from "./Armactionmenu";
import ArmCreatePanel from "./Armcreatepanel";
import ArmAssignTeachersPanel from "./Armassignteacherspanel";
import ArmPrintTemplate from "./Armprinttemplate";
import type { ApiEnvelope } from "../page";

// ── Constants ────────────────────────────────────────────────────────────────

const SCHOOL_ID = process.env.NEXT_PUBLIC_SCHOOL_ID ?? "";

// Shown whenever the user triggers a button whose backend endpoint isn't built
// yet. Kept centralised so the wording stays consistent everywhere.
const FEATURE_IN_WORKS = "This feature is currently in the works.";

// Filter options key off section abbreviations present in the data. "all" is
// the default no-op. New section abbreviations are derived from the result set
// at render time so the dropdown reflects only what's actually available.
type FilterOption = "all" | `section:${string}`;

// ── Display helpers ──────────────────────────────────────────────────────────

// "JSS 1 ORNG" — the full identifier the user sees in tables and headings.
function formatArm(arm: ClassArm): string {
  return `${arm.level.section.abbr} ${arm.level.abbr} ${arm.abbr}`;
}

// Builds a teacher's full name from the nested staff_profile.user. Returns an
// empty string when no teacher is assigned so callers can decide the fallback.
function teacherName(teacher: ArmTeacher | null | undefined): string {
  if (!teacher) return "";
  const u = teacher.staff_profile.user;
  return `${u.first_name} ${u.last_name}`;
}

// ── Props ────────────────────────────────────────────────────────────────────

interface ArmListProps {
  /** Current term id, resolved server-side from school.current_term.id. */
  currentTermId: string;
  /** Flat list of every level in the current term — passed to the Create
   *  panel so its dropdown can render without an extra fetch. */
  levels: ArmLevel[];
  /** Pre-fetched arms envelope, used as React Query initialData. */
  initialArms: ApiEnvelope<ClassArm[]> | null;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function ArmList({
  currentTermId,
  levels,
  initialArms,
}: ArmListProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { clientAuthFetch } = useClientAuthFetch();

  // ── Local UI state ─────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterOption>("all");
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);

  // Panel state — only one panel can be open at a time so the underlying list
  // collapses out of view via the width transition.
  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [showAssignTeachersPanel, setShowAssignTeachersPanel] = useState(false);

  // The arm currently selected for an action — used by the Assign Teachers
  // panel.
  const [selectedArm, setSelectedArm] = useState<ClassArm | null>(null);

  // Refs
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({ contentRef: printRef });

  // Close the filter dropdown when the user clicks outside it.
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

  // ── React Query: arms list ─────────────────────────────────────────────────
  // The query key includes currentTermId so switching terms (if that ever gets
  // exposed in UI) doesn't stale-serve the previous term's arms.
  const {
    data: queryData,
    isPending,
    isError,
    error,
  } = useQuery<ApiEnvelope<ClassArm[]>>({
    queryKey: ["arms", SCHOOL_ID, currentTermId],

    queryFn: async () => {
      const url = `arm/list/?school-id=${SCHOOL_ID}&term-id=${currentTermId}`;
      const { data, error } =
        await clientAuthFetch<ApiEnvelope<ClassArm[]>>(url);

      // Throwing makes React Query mark the query as errored; the toast below
      // surfaces the message to the user.
      if (error) throw new Error(error.message);
      return data!;
    },

    // Hydrate from the server-fetched envelope so the table renders instantly
    // on first paint. initialDataUpdatedAt tells React Query the data is
    // fresh so it doesn't fire an immediate background refetch on mount.
    initialData: initialArms ?? undefined,
    initialDataUpdatedAt: initialArms ? Date.now() : undefined,
  });

  // Surface fetch errors via toast so the user knows the list didn't load.
  useEffect(() => {
    if (isError && error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load class arms.",
      );
    }
  }, [isError, error]);

  // ── Derived data ───────────────────────────────────────────────────────────

  const arms: ClassArm[] = queryData?.data ?? [];

  // Build the unique list of section abbreviations from the current result set.
  // The Set + sort keeps the order stable across renders.
  const sectionOptions = useMemo(() => {
    const abbrs = new Set(arms.map((a) => a.level.section.abbr));
    return Array.from(abbrs).sort();
  }, [arms]);

  // Apply the active section filter, then the text search. Both are client-side
  // since the backend list endpoint doesn't expose section or full-text filters.
  const visibleArms = useMemo(() => {
    let filtered = arms;

    if (activeFilter !== "all") {
      const wanted = activeFilter.slice("section:".length);
      filtered = filtered.filter((a) => a.level.section.abbr === wanted);
    }

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      filtered = filtered.filter((a) => {
        return (
          a.name.toLowerCase().includes(q) ||
          a.abbr.toLowerCase().includes(q) ||
          formatArm(a).toLowerCase().includes(q) ||
          teacherName(a.class_teacher).toLowerCase().includes(q) ||
          teacherName(a.ass_class_teacher).toLowerCase().includes(q)
        );
      });
    }

    return filtered;
  }, [arms, activeFilter, searchQuery]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleFilterChange(filter: FilterOption) {
    setActiveFilter(filter);
    setFilterDropdownOpen(false);
  }

  // Navigate to the single-arm detail page. The /arm route exists separately
  // and reads ?id from the URL.
  function handleView(arm: ClassArm) {
    router.push(`/dashboard/arm?id=${arm.id}`);
  }

  function handleAssignTeachers(arm: ClassArm) {
    setSelectedArm(arm);
    setShowAssignTeachersPanel(true);
  }

  // No DELETE endpoint exists at academics/views.py yet, so this action just
  // tells the user it's coming.
  function handleDelete(_arm: ClassArm) {
    toast.info(FEATURE_IN_WORKS);
  }

  // PDF download endpoint is not built yet either — see the staff page for
  // the same placeholder pattern.
  function handleDownloadPdf() {
    toast.info(FEATURE_IN_WORKS);
  }

  function handleCreatePanelClose() {
    setShowCreatePanel(false);
  }

  function handleAssignTeachersPanelClose() {
    setShowAssignTeachersPanel(false);
    setSelectedArm(null);
  }

  // Human-readable label for the active filter — shown on desktop in the
  // dropdown button.
  const activeFilterLabel =
    activeFilter === "all"
      ? "All Sections"
      : `Section: ${activeFilter.slice("section:".length)}`;

  // Whether any panel is open — drives the main list's collapse transition so
  // the page focuses on the active panel.
  const aPanelIsOpen = showCreatePanel || showAssignTeachersPanel;

  return (
    <>
      <div className="flex text-sm">
        {/* ── Main list panel ───────────────────────────────────────────── */}
        <div
          className={`transition-all duration-500 ease-in-out overflow-hidden ${
            aPanelIsOpen ? "w-0 opacity-0 h-0" : "w-full opacity-100"
          }`}
        >
          {/* ── Toolbar ────────────────────────────────────────────────── */}
          {/* Mobile-first: stacked column, then row on sm+. Action buttons
              wrap on small screens so they never overflow. */}
          <div className="flex flex-col sm:flex-row gap-2 mb-6">
            {/* Search */}
            <div className="relative flex-1">
              <Search
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                type="text"
                placeholder="Search arm, abbreviation, or teacher…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs text-slate-600 border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
              />
            </div>

            {/* Filter dropdown — section filter only; backend supports level
                and broadsheet too, but the draft scopes the filter to section. */}
            <div ref={filterDropdownRef} className="relative">
              <button
                onClick={() => setFilterDropdownOpen((open) => !open)}
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
                <div className="absolute top-10 left-0 z-20 bg-white border border-slate-100 rounded-xl shadow-lg overflow-hidden w-48 py-1">
                  <FilterOptionButton
                    label="All Sections"
                    active={activeFilter === "all"}
                    onClick={() => handleFilterChange("all")}
                  />
                  {sectionOptions.map((abbr) => (
                    <FilterOptionButton
                      key={abbr}
                      label={`Section: ${abbr}`}
                      active={activeFilter === `section:${abbr}`}
                      onClick={() => handleFilterChange(`section:${abbr}`)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Action buttons — Download / Print / Create */}
            <div className="flex items-center gap-2 justify-end">
              {/* Download PDF is a placeholder — no backend endpoint yet,
                  so the click handler just surfaces the in-works toast. */}
              <button
                onClick={handleDownloadPdf}
                className="cursor-pointer flex items-center gap-1.5 px-3 py-2 text-xs border border-slate-200 bg-white text-slate-600 rounded-xl hover:border-violet-300 transition-colors"
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
                <PlusCircle size={12} />
                <span>Create Arm</span>
              </button>
            </div>
          </div>

          {/* ── Loading state — skeleton rows ─────────────────────────── */}
          {isPending ? (
            <TableLoader rows={6} className="my-4" />
          ) : (
            <>
              {/* ── Desktop table — md+ ───────────────────────────────── */}
              <div className="hidden md:block border border-indigo-100 rounded-2xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-left text-slate-500 border-b border-slate-200">
                      <th className="px-5 py-3 font-semibold">S/N</th>
                      <th className="px-5 py-3 font-semibold">Class</th>
                      <th className="px-5 py-3 font-semibold">Section</th>
                      <th className="px-5 py-3 font-semibold">Class Teacher</th>
                      <th className="px-5 py-3 font-semibold hidden lg:table-cell">
                        Assistant
                      </th>
                      <th className="px-5 py-3 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-50">
                    {visibleArms.length === 0 ? (
                      <tr>
                        <td colSpan={6}>
                          <EmptyState
                            variant={searchQuery ? "search" : "generic"}
                            title={
                              searchQuery
                                ? "No results found"
                                : "No class arms found"
                            }
                            description={
                              searchQuery
                                ? `No arms match "${searchQuery}".`
                                : "Create a class arm to get started."
                            }
                          />
                        </td>
                      </tr>
                    ) : (
                      visibleArms.map((arm, index) => (
                        <tr
                          key={arm.id}
                          className={`h-14 hover:bg-violet-50/40 transition-colors cursor-pointer ${
                            index % 2 === 0 ? "bg-white" : "bg-indigo-50/30"
                          }`}
                        >
                          <td className="px-5 text-slate-500">{index + 1}</td>

                          {/* Class — links to the detail page */}
                          <td className="px-5">
                            <Link href={`/dashboard/arm?id=${arm.id}`}>
                              <div className="flex flex-col hover:text-violet-700">
                                <span className="font-medium text-slate-800">
                                  {formatArm(arm)}
                                </span>
                                {/* <span className="text-[10px] text-slate-400">
                                  {arm.name}
                                </span> */}
                              </div>
                            </Link>
                          </td>

                          {/* Section */}
                          <td className="px-5 text-slate-600">
                            {arm.level.section.name}
                          </td>

                          {/* Class teacher */}
                          <td className="px-5">
                            <TeacherCell teacher={arm.class_teacher} />
                          </td>

                          {/* Assistant — hidden on md, shown on lg+ to keep the
                              md table from overflowing on tablet widths */}
                          <td className="px-5 hidden lg:table-cell">
                            <TeacherCell teacher={arm.ass_class_teacher} />
                          </td>

                          {/* Action menu */}
                          <td
                            className="px-5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ArmActionMenu
                              armId={arm.id}
                              onView={() => handleView(arm)}
                              onAssignTeachers={() => handleAssignTeachers(arm)}
                              onDelete={() => handleDelete(arm)}
                            />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* ── Mobile card list — below md ─────────────────────────── */}
              <div className="flex flex-col gap-3 md:hidden my-4">
                {visibleArms.length === 0 ? (
                  <EmptyState
                    variant={searchQuery ? "search" : "generic"}
                    title={
                      searchQuery ? "No results found" : "No class arms found"
                    }
                    description={
                      searchQuery
                        ? `No arms match "${searchQuery}".`
                        : "Create a class arm to get started."
                    }
                  />
                ) : (
                  visibleArms.map((arm) => (
                    <div
                      key={arm.id}
                      className="bg-white border border-indigo-100 rounded-2xl overflow-hidden shadow-sm"
                    >
                      {/* Header — class identifier + action menu */}
                      <div className="flex items-center justify-between p-4 border-b border-slate-50">
                        <Link
                          href={`/dashboard/arm?id=${arm.id}`}
                          className="flex flex-col min-w-0"
                        >
                          <span className="text-sm font-semibold text-slate-800 truncate">
                            {formatArm(arm)}
                          </span>
                          <span className="text-[10px] text-slate-400 truncate">
                            {arm.level.section.name}
                          </span>
                        </Link>
                        <div onClick={(e) => e.stopPropagation()}>
                          <ArmActionMenu
                            armId={arm.id}
                            onView={() => handleView(arm)}
                            onAssignTeachers={() => handleAssignTeachers(arm)}
                            onDelete={() => handleDelete(arm)}
                          />
                        </div>
                      </div>

                      {/* Teachers — stacked so labels stay legible on narrow screens */}
                      <div className="flex flex-col gap-2 px-4 py-3 text-xs">
                        <MobileTeacherRow
                          label="Class teacher"
                          teacher={arm.class_teacher}
                        />
                        <MobileTeacherRow
                          label="Assistant"
                          teacher={arm.ass_class_teacher}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>

        {/* ── Create panel ─────────────────────────────────────────────── */}
        <ArmCreatePanel
          show={showCreatePanel}
          onClose={handleCreatePanelClose}
          levels={levels}
          currentTermId={currentTermId}
        />

        {/* ── Assign Teachers panel ────────────────────────────────────── */}
        <ArmAssignTeachersPanel
          show={showAssignTeachersPanel}
          onClose={handleAssignTeachersPanelClose}
          selectedArm={selectedArm}
          currentTermId={currentTermId}
        />
      </div>

      {/* Hidden print template — receives the currently visible arms */}
      <div className="h-0 overflow-hidden">
        <ArmPrintTemplate ref={printRef} arms={visibleArms} />
      </div>
    </>
  );
}

// ── TeacherCell ──────────────────────────────────────────────────────────────
// Used by the desktop table to render a teacher or a muted "Not assigned" state.
function TeacherCell({ teacher }: { teacher: ArmTeacher | null | undefined }) {
  if (!teacher) {
    return <span className="text-slate-300 text-[11px]">Not assigned</span>;
  }
  const u = teacher.staff_profile.user;
  return (
    <div className="flex items-center gap-2 min-w-0">
      <span className="border border-indigo-300 rounded-full p-1.5 shrink-0 text-slate-500">
        <UserRound size={11} />
      </span>
      <div className="flex flex-col min-w-0">
        <span className="text-slate-700 truncate">
          {u.first_name} {u.last_name}
        </span>
        {u.public_id && (
          <span className="text-[10px] text-slate-400 truncate">
            {u.public_id}
          </span>
        )}
      </div>
    </div>
  );
}

// ── MobileTeacherRow ─────────────────────────────────────────────────────────
// Compact two-line row for the mobile cards. Keeps the label and the value
// on the same row so the card stays short.
function MobileTeacherRow({
  label,
  teacher,
}: {
  label: string;
  teacher: ArmTeacher | null | undefined;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[10px] uppercase tracking-wide text-slate-400">
        {label}
      </span>
      {teacher ? (
        <span className="text-slate-700 text-xs truncate">
          {teacher.staff_profile.user.first_name}{" "}
          {teacher.staff_profile.user.last_name}
        </span>
      ) : (
        <span className="text-slate-300 text-xs">Not assigned</span>
      )}
    </div>
  );
}

// ── FilterOptionButton ───────────────────────────────────────────────────────
// Single dropdown item — extracted so the filter list stays readable.
function FilterOptionButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`cursor-pointer w-full text-left px-4 py-2 text-xs transition-colors ${
        active
          ? "bg-violet-50 text-violet-700 font-semibold"
          : "text-slate-600 hover:bg-slate-50"
      }`}
    >
      {label}
    </button>
  );
}
