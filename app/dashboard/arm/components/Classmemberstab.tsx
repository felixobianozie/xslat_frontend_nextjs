"use client";

// ─────────────────────────────────────────────────────────────────────────────
// ClassMembersTab.tsx
//
// First tab — lists every student currently enrolled in this arm and exposes
// row-level actions (view profile, edit subjects).
//
// Mirrors the /arms list pattern:
//  - Toolbar (search + print + Add Member)
//  - Desktop table + mobile card list
//  - Slide-in panels (Add Member, Edit Subjects) collapse the list while open
//
// Backend wiring:
//  - GET student/list/?school-id=…&arm-id=…       → load roster
//
// Backend gaps that surface as "feature in the works" toasts:
//  - PDF download: no server-side PDF generation endpoint exists yet.
//
// Class-arm membership changes (remove from class, change class) are
// intentionally NOT included here — the /students module owns those flows
// (ChangeArmPanel + StudentRemoveFromArmDialog). Use View Profile to jump
// into the student record and act from there.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useReactToPrint } from "react-to-print";
import {
  BookOpen,
  Users,
  Download,
  Plus,
  Printer,
  Search,
  UserRound,
} from "lucide-react";
import { toast } from "react-toastify";

import { useClientAuthFetch } from "@/lib/Useclientauthfetch";
import EmptyState from "../../components/Emptystate";
import TableLoader from "../../components/Tableloader";
import { useArmDetails } from "../context/Armdetailsprovider";
import ClassMemberActionMenu from "./Classmemberactionmenu";
import AddClassMemberPanel from "./Addclassmemberpanel";
import EditStudentSubjectsPanel from "./Editstudentsubjectspanel";

// ── Constants ────────────────────────────────────────────────────────────────

const SCHOOL_ID = process.env.NEXT_PUBLIC_SCHOOL_ID ?? "";

// Shown whenever the user triggers a button whose backend endpoint isn't built
// yet. Kept centralised so the wording stays consistent everywhere.
const FEATURE_IN_WORKS = "This feature is currently in the works.";

// The student/list/ endpoint is paginated, default page size 10. We pull a
// generous page so the roster comes back in a single request — class sizes
// above 100 would need true pagination here, which is acceptable as a future
// refinement rather than a launch blocker.
const ROSTER_PAGE_SIZE = 100;

// ── Local response shape for the paginated student endpoint ──────────────────
// Mirrors xslat_backend.pagination.StandardPagination's envelope. Note: when
// the school has no current term, the endpoint returns a flat { message, data }
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
  return `${s.first_name}${s.middle_name ? ` ${s.middle_name}` : ""} ${s.last_name}`;
}

export default function ClassMembersTab() {
  const router = useRouter();
  const { clientAuthFetch } = useClientAuthFetch();
  const { armId, arm } = useArmDetails();

  // ── UI state ──────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [showEditSubjectsPanel, setShowEditSubjectsPanel] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<ArmStudent | null>(
    null,
  );

  // Print
  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({ contentRef: printRef });

  // ── Data ──────────────────────────────────────────────────────────────────
  const { data, isPending, isError, error } = useQuery<
    PaginatedResponse<ArmStudent>
  >({
    queryKey: ["arm-students", armId],
    queryFn: async () => {
      const url = `student/list/?school-id=${SCHOOL_ID}&arm-id=${armId}&page=1&page-size=${ROSTER_PAGE_SIZE}`;
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

  // Apply client-side text search across name + public id.
  const visibleStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) => {
      return (
        fullName(s).toLowerCase().includes(q) ||
        (s.public_id ?? "").toLowerCase().includes(q)
      );
    });
  }, [students, searchQuery]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleViewProfile(student: ArmStudent) {
    // Student profile page route — adjust if the project uses a different path.
    router.push(`/dashboard/student?id=${student.id}`);
  }

  function handleEditSubjects(student: ArmStudent) {
    setSelectedStudent(student);
    setShowEditSubjectsPanel(true);
  }

  // PDF download endpoint isn't built yet — same placeholder pattern used on
  // the /arms list page.
  function handleDownloadPdf() {
    toast.info(FEATURE_IN_WORKS);
  }

  function handleEditPanelClose() {
    setShowEditSubjectsPanel(false);
    setSelectedStudent(null);
  }

  const aPanelIsOpen = showAddPanel || showEditSubjectsPanel;

  return (
    <>
      <div className="flex text-sm">
        {/* ── Main list ─────────────────────────────────────────────────── */}
        <div
          className={`transition-all duration-500 ease-in-out overflow-hidden ${
            aPanelIsOpen ? "w-0 opacity-0 h-0" : "w-full opacity-100"
          }`}
        >
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-2 mb-6">
            {/* Search */}
            <div className="relative flex-1">
              <Search
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                type="text"
                placeholder="Search by name or ID…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs text-slate-600 border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
              />
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={handleDownloadPdf}
                className="flex items-center gap-1.5 px-3 py-2 text-xs border border-slate-200 bg-white text-slate-600 rounded-xl hover:border-violet-300 transition-colors cursor-pointer"
                title="Download PDF"
              >
                <Download size={12} />
                <span className="hidden sm:inline">PDF</span>
              </button>
              <button
                onClick={() => handlePrint()}
                className="flex items-center gap-1.5 px-3 py-2 text-xs border border-slate-200 bg-white text-slate-600 rounded-xl hover:border-violet-300 transition-colors cursor-pointer"
                title="Print"
              >
                <Printer size={12} />
                <span className="hidden sm:inline">Print</span>
              </button>
              <button
                onClick={() => setShowAddPanel(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors shadow-sm shadow-violet-200 cursor-pointer"
              >
                <Plus size={12} />
                <span>Add Member</span>
              </button>
            </div>
          </div>

          {/* Count strip */}
          <div className="text-[11px] text-slate-500 mb-3 flex items-center gap-1.5">
            <Users size={11} />
            {isPending
              ? "Loading…"
              : `${visibleStudents.length} of ${students.length} student${students.length === 1 ? "" : "s"}`}
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
                      <th className="px-5 py-3 font-semibold w-24">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-50">
                    {visibleStudents.length === 0 ? (
                      <tr>
                        <td colSpan={4}>
                          <EmptyState
                            variant={searchQuery ? "search" : "generic"}
                            title={
                              searchQuery
                                ? "No results found"
                                : "No class members yet"
                            }
                            description={
                              searchQuery
                                ? `No students match "${searchQuery}".`
                                : "Add students to populate the class roster."
                            }
                          />
                        </td>
                      </tr>
                    ) : (
                      visibleStudents.map((student, index) => (
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
                          <td className="px-5">
                            <ClassMemberActionMenu
                              studentId={student.id}
                              onView={() => handleViewProfile(student)}
                              onEditSubjects={() => handleEditSubjects(student)}
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
                {visibleStudents.length === 0 ? (
                  <EmptyState
                    variant={searchQuery ? "search" : "generic"}
                    title={
                      searchQuery ? "No results found" : "No class members yet"
                    }
                    description={
                      searchQuery
                        ? `No students match "${searchQuery}".`
                        : "Add students to populate the class roster."
                    }
                  />
                ) : (
                  visibleStudents.map((student) => (
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
                          {student.public_id && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              {student.public_id}
                            </span>
                          )}
                        </div>
                      </div>
                      <ClassMemberActionMenu
                        studentId={student.id}
                        onView={() => handleViewProfile(student)}
                        onEditSubjects={() => handleEditSubjects(student)}
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

      {/* Hidden print template — reuses the student list shape */}
      <div className="h-0 overflow-hidden">
        <div ref={printRef} className="m-8">
          <h1 className="font-bold text-sm py-4 uppercase tracking-wide">
            Class Members —{" "}
            {arm
              ? `${arm.level.section.abbr} ${arm.level.abbr} ${arm.abbr}`
              : ""}
          </h1>
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border border-gray-300 text-left h-8">
                <th className="px-3">S/N</th>
                <th className="px-3">Name</th>
                <th className="px-3">Student ID</th>
              </tr>
            </thead>
            <tbody>
              {visibleStudents.map((s, index) => (
                <tr
                  key={s.id}
                  className={`h-9 border-b border-gray-200 ${
                    index % 2 === 0 ? "bg-indigo-50" : ""
                  }`}
                >
                  <td className="px-3">{index + 1}</td>
                  <td className="px-3">{fullName(s)}</td>
                  <td className="px-3">{s.public_id ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
