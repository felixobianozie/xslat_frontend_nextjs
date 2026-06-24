"use client";

// ─────────────────────────────────────────────────────────────────────────────
// ResultsMasterList.tsx
//
// Master pane — lists every class member with a search box. Clicking a row
// fires onSelect with the student record so the parent can swap the detail
// pane to that student's report.
//
// Rendered as:
//   - Desktop: fixed-width left sidebar (sticky vertical scroll inside).
//   - Mobile: full-width list; parent controls whether the list or the
//     detail pane is currently visible.
//
// State is intentionally minimal: the master list owns ONLY the search query.
// Selected student id is passed in from the parent so the highlighted row
// stays in sync across the parent's filter changes.
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo, useState } from "react";
import { Search, UserRound } from "lucide-react";
import TableLoader from "../../components/Tableloader";
import EmptyState from "../../components/Emptystate";

interface ResultsMasterListProps {
  students: ArmStudent[];
  selectedStudentId: string | null;
  onSelect: (student: ArmStudent) => void;
  isLoading: boolean;
}

function fullName(s: ArmStudent): string {
  return `${s.first_name}${s.middle_name ? ` ${s.middle_name}` : ""} ${s.last_name}`;
}

export default function ResultsMasterList({
  students,
  selectedStudentId,
  onSelect,
  isLoading,
}: ResultsMasterListProps) {
  const [search, setSearch] = useState("");

  // Apply text filter against name and public id — same search behaviour as
  // the Class Members tab so users get a consistent feel.
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) =>
        fullName(s).toLowerCase().includes(q) ||
        (s.public_id ?? "").toLowerCase().includes(q),
    );
  }, [students, search]);

  return (
    <div className="flex flex-col gap-3 text-sm">
      {/* Search */}
      <div className="relative">
        <Search
          size={13}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
        />
        <input
          type="text"
          placeholder="Search students…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-8 pr-3 py-2 text-xs text-slate-600 border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
        />
      </div>

      {/* Count strip */}
      <div className="text-[11px] text-slate-500">
        {isLoading
          ? "Loading…"
          : `${visible.length} of ${students.length} student${students.length === 1 ? "" : "s"}`}
      </div>

      {/* List */}
      {isLoading ? (
        <TableLoader rows={6} />
      ) : visible.length === 0 ? (
        <EmptyState
          variant={search ? "search" : "generic"}
          title={search ? "No results found" : "No students yet"}
          description={
            search
              ? `No students match "${search}".`
              : "Add students to this class before generating results."
          }
        />
      ) : (
        <ul className="flex flex-col gap-1.5 max-h-[70vh] md:max-h-[60vh] overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
          {visible.map((student, index) => {
            const isSelected = selectedStudentId === student.id;
            return (
              <li key={student.id}>
                <button
                  type="button"
                  onClick={() => onSelect(student)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                    isSelected
                      ? "bg-violet-50 border border-violet-200 shadow-sm"
                      : "bg-white border border-slate-100 hover:border-violet-200 hover:bg-slate-50"
                  }`}
                >
                  {/* Index badge */}
                  <span
                    className={`flex items-center justify-center text-[10px] font-semibold w-7 h-7 rounded-full border shrink-0 ${
                      isSelected
                        ? "bg-violet-100 border-violet-200 text-violet-700"
                        : "bg-slate-50 border-slate-200 text-slate-500"
                    }`}
                  >
                    {index + 1}
                  </span>

                  {/* Identity */}
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <UserRound
                      size={12}
                      className={
                        isSelected ? "text-violet-600" : "text-slate-400"
                      }
                    />
                    <div className="flex flex-col min-w-0">
                      <span
                        className={`text-xs truncate ${
                          isSelected
                            ? "text-violet-900 font-semibold"
                            : "text-slate-800"
                        }`}
                      >
                        {fullName(student)}
                      </span>
                      {student.public_id && (
                        <span className="text-[10px] text-slate-400 font-mono truncate">
                          {student.public_id}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
