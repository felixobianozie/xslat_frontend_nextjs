"use client";

// ─────────────────────────────────────────────────────────────────────────────
// SubjectsTab.tsx
//
// Second tab — lists subjects offered in this arm and exposes per-subject
// actions:
//   - View Assessment   → ViewAssessmentPanel (read-only cognitive score grid)
//   - Record Assessment → RecordAssessmentPanel (editable score grid)
//   - Assign Teacher(s) → AssignSubjectTeachersPanel
//   - Remove Teacher(s) → RemoveSubjectTeachersPanel
//
// Backend wiring:
//   GET subject/list/?term-id=…&school-id=…&arm=…
//
// The backend already nests subject_arms[].teachers as full StaffPortfolio
// objects, so the row table can resolve teacher names directly from the
// subject payload — no separate staff fetch is needed here. The Assign panel
// still fetches the full school staff list separately to populate its
// "candidates to add" picker.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Search } from "lucide-react";
import { toast } from "react-toastify";

import { useClientAuthFetch } from "@/lib/Useclientauthfetch";
import EmptyState from "../../components/Emptystate";
import TableLoader from "../../components/Tableloader";
import { useArmDetails } from "../context/Armdetailsprovider";
import SubjectActionMenu from "./Subjectactionmenu";
import AssignSubjectTeachersPanel from "./Assignsubjectteacherspanel";
import RemoveSubjectTeachersPanel from "./Removesubjectteacherspanel";
import ViewAssessmentPanel from "./Viewassessmentpanel";
import RecordAssessmentPanel from "./Recordassessmentpanel";
import type { ApiEnvelope } from "../page";

// ── Constants ────────────────────────────────────────────────────────────────

const SCHOOL_ID = process.env.NEXT_PUBLIC_SCHOOL_ID ?? "";

// Pull a teacher's display name from a nested StaffPortfolio.
function teacherDisplayName(t: ArmTeacher): string {
  const u = t.staff_profile.user;
  return `${u.first_name} ${u.last_name}`;
}

export default function SubjectsTab() {
  const { armId, arm } = useArmDetails();
  const { clientAuthFetch } = useClientAuthFetch();

  const [searchQuery, setSearchQuery] = useState("");

  // Panel state — only one open at a time so the list cleanly collapses.
  const [showAssignPanel, setShowAssignPanel] = useState(false);
  const [showRemovePanel, setShowRemovePanel] = useState(false);
  const [showViewPanel, setShowViewPanel] = useState(false);
  const [showRecordPanel, setShowRecordPanel] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<ArmSubject | null>(
    null,
  );

  // The subject endpoint requires the term-id from the arm chain.
  const termId = arm?.level.section.term?.id ?? "";

  // ── Data: subjects offered in this arm ─────────────────────────────────────
  const {
    data: subjectsData,
    isPending: subjectsPending,
    isError: subjectsError,
    error: subjectsErr,
  } = useQuery<ApiEnvelope<ArmSubject[]>>({
    queryKey: ["arm-subjects", armId],
    queryFn: async () => {
      const url =
        `subject/list/?school-id=${SCHOOL_ID}` +
        `&term-id=${termId}` +
        `&arm=${armId}`;
      const { data, error } =
        await clientAuthFetch<ApiEnvelope<ArmSubject[]>>(url);
      if (error) throw new Error(error.message);
      return data!;
    },
    // Wait for both armId and termId — armId comes from the URL, termId comes
    // from the arm-detail fetch upstream. Without termId the endpoint 400s.
    enabled: !!armId && !!termId,
  });

  useEffect(() => {
    if (subjectsError && subjectsErr) {
      toast.error(
        subjectsErr instanceof Error
          ? subjectsErr.message
          : "Failed to load subjects.",
      );
    }
  }, [subjectsError, subjectsErr]);

  const subjects = subjectsData?.data ?? [];

  // Apply client-side text search against the subject's definition name/abbr.
  const visibleSubjects = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return subjects;
    return subjects.filter(
      (s) =>
        s.definition.name.toLowerCase().includes(q) ||
        s.definition.abbr.toLowerCase().includes(q),
    );
  }, [subjects, searchQuery]);

  // ── Panel handlers ────────────────────────────────────────────────────────

  function openPanel(
    panel: "view" | "record" | "assign" | "remove",
    subject: ArmSubject,
  ) {
    setSelectedSubject(subject);
    setShowViewPanel(panel === "view");
    setShowRecordPanel(panel === "record");
    setShowAssignPanel(panel === "assign");
    setShowRemovePanel(panel === "remove");
  }

  function closeAllPanels() {
    setShowViewPanel(false);
    setShowRecordPanel(false);
    setShowAssignPanel(false);
    setShowRemovePanel(false);
    setSelectedSubject(null);
  }

  // Switching between View and Record without closing — keep the subject context.
  function handleSwitchToRecord() {
    setShowViewPanel(false);
    setShowRecordPanel(true);
  }

  function handleSwitchToView() {
    setShowRecordPanel(false);
    setShowViewPanel(true);
  }

  const aPanelIsOpen =
    showAssignPanel || showRemovePanel || showViewPanel || showRecordPanel;

  return (
    <div className="flex text-sm">
      {/* ── Main list ─────────────────────────────────────────────────── */}
      <div
        className={`transition-all duration-500 ease-in-out overflow-hidden ${
          aPanelIsOpen ? "w-0 opacity-0 h-0" : "w-full opacity-100"
        }`}
      >
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-2 mb-6">
          <div className="relative flex-1">
            <Search
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search subjects…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs text-slate-600 border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
            />
          </div>
        </div>

        {/* Count strip */}
        <div className="text-[11px] text-slate-500 mb-3 flex items-center gap-1.5">
          <BookOpen size={11} />
          {subjectsPending
            ? "Loading…"
            : `${visibleSubjects.length} subject${visibleSubjects.length === 1 ? "" : "s"}`}
        </div>

        {/* List */}
        {subjectsPending ? (
          <TableLoader rows={5} />
        ) : visibleSubjects.length === 0 ? (
          <EmptyState
            variant={searchQuery ? "search" : "generic"}
            title={
              searchQuery ? "No results found" : "No subjects in this class arm"
            }
            description={
              searchQuery
                ? `No subjects match "${searchQuery}".`
                : "Link subjects to this arm to enable assessment and grading."
            }
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block border border-indigo-100 rounded-2xl overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-100 text-left text-slate-500 border-b border-slate-200">
                    <th className="px-5 py-3 font-semibold w-12">S/N</th>
                    <th className="px-5 py-3 font-semibold">Subject</th>
                    <th className="px-5 py-3 font-semibold">
                      Subject Teacher(s)
                    </th>
                    <th className="px-5 py-3 font-semibold w-24">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-50">
                  {visibleSubjects.map((subject, index) => {
                    // Locate the SubjectArm entry for THIS arm. A subject can
                    // be linked to multiple arms, so we filter to the right
                    // one before reading its teacher list.
                    const armEntry = subject.subject_arms.find(
                      (sa) => sa.arm.id === armId,
                    );
                    const teachers = armEntry?.teachers ?? [];
                    return (
                      <tr
                        key={subject.id}
                        className={`h-14 hover:bg-violet-50/40 transition-colors ${
                          index % 2 === 0 ? "bg-white" : "bg-indigo-50/30"
                        }`}
                      >
                        <td className="px-5 text-slate-500">{index + 1}</td>
                        <td className="px-5">
                          <div className="flex flex-col">
                            <span className="text-slate-800 font-medium">
                              {subject.definition.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {subject.definition.abbr}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 text-slate-600">
                          {armEntry == null ? (
                            <span className="text-slate-300 text-[11px]">
                              Not linked to this arm
                            </span>
                          ) : teachers.length === 0 ? (
                            <span className="text-slate-300 text-[11px]">
                              Not assigned
                            </span>
                          ) : (
                            <span>
                              {teachers.map(teacherDisplayName).join(", ")}
                            </span>
                          )}
                        </td>
                        <td className="px-5">
                          <SubjectActionMenu
                            subjectId={subject.id}
                            onView={() => openPanel("view", subject)}
                            onRecord={() => openPanel("record", subject)}
                            onAssign={() => openPanel("assign", subject)}
                            onUnassign={() => openPanel("remove", subject)}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="flex flex-col gap-3 md:hidden">
              {visibleSubjects.map((subject) => {
                const armEntry = subject.subject_arms.find(
                  (sa) => sa.arm.id === armId,
                );
                const teachers = armEntry?.teachers ?? [];
                return (
                  <div
                    key={subject.id}
                    className="bg-white border border-indigo-100 rounded-2xl p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm text-slate-800 font-medium truncate">
                          {subject.definition.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {subject.definition.abbr}
                        </span>
                      </div>
                      <SubjectActionMenu
                        subjectId={subject.id}
                        onView={() => openPanel("view", subject)}
                        onRecord={() => openPanel("record", subject)}
                        onAssign={() => openPanel("assign", subject)}
                        onUnassign={() => openPanel("remove", subject)}
                      />
                    </div>
                    <div className="text-[11px] text-slate-500">
                      <span className="font-medium text-slate-400 uppercase tracking-wide mr-2">
                        Teachers
                      </span>
                      {teachers.length === 0 ? (
                        <span className="text-slate-300">Not assigned</span>
                      ) : (
                        teachers.map(teacherDisplayName).join(", ")
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ── Slide-in panels (only one open at a time) ──────────────────── */}
      <ViewAssessmentPanel
        show={showViewPanel}
        subject={selectedSubject}
        onClose={closeAllPanels}
        onSwitchToRecord={handleSwitchToRecord}
      />
      <RecordAssessmentPanel
        show={showRecordPanel}
        subject={selectedSubject}
        onClose={closeAllPanels}
        onSwitchToView={handleSwitchToView}
      />
      <AssignSubjectTeachersPanel
        show={showAssignPanel}
        subject={selectedSubject}
        onClose={closeAllPanels}
      />
      <RemoveSubjectTeachersPanel
        show={showRemovePanel}
        subject={selectedSubject}
        onClose={closeAllPanels}
      />
    </div>
  );
}
