"use client";

// ─────────────────────────────────────────────────────────────────────────────
// RecordAssessmentPanel.tsx
//
// Editable cognitive score grid. One row per student in the arm who OFFERS the
// selected subject, one input column per cognitive unit (CA1 / CA2 / EXAM / …),
// plus a running TOTAL.
//
// Layout notes:
//   - Mobile (< md): stacked card list. Each student sits in their own card
//     with a numbered avatar, name, running total, and a grid of touch-friendly
//     score tiles — one per unit. Chosen to eliminate horizontal scrolling on
//     phones while keeping every field one thumb-tap away.
//   - md and up: original table layout is preserved unchanged.
//   Both layouts share the same state, handlers, validation, and totals
//   calculation — only the presentation differs.
//
// Offering-students rule (from the backend):
//   A student in an arm offers a subject iff the subject is linked to the arm
//   (guaranteed because we only enter this panel from a subject in the arm)
//   AND the student's id is NOT in subject.excluded_students. Students who
//   don't offer the subject are filtered out of the list entirely.
//
// Validation rules per cell:
//   - Empty input is allowed (no entry yet — backend leaves existing score
//     untouched if the unit is omitted from the payload).
//   - -1 is the absent marker — explicitly valid.
//   - 0 ≤ score ≤ unit.max_score for normal entries.
//   - Other negatives, non-numbers, or values over max are flagged red and
//     block submission for the touched row.
//
// Data sources:
//   - Class roster: ["arm-students", armId] cache (shared with ClassMembersTab
//     and ViewAssessmentPanel so the cache is usually hot already).
//   - Existing scores: arm.assessments from the upstream arm-detail fetch —
//     used to seed initial cell values. Students without a record start blank.
//
// Submit (PUT arm/detail/scores/):
//   {
//     id: armId, school_id,
//     cognitive: [{
//       subject: subjectId,
//       entries: [
//         { student: studentId, scores: [{ unit: unitId, score: N }, …] }
//       ]
//     }]
//   }
//
//   Only edited rows are included, and within each edited row only cells the
//   user actually filled in are sent — empty cells are omitted so the backend
//   leaves any existing score in place. This prevents silent overwrites that
//   the previous flat-array implementation was prone to.
//
// Empty states:
//   - cognitive_assessment_format missing on the arm  → arm config incomplete
//   - no offering students                            → nothing to score
// ─────────────────────────────────────────────────────────────────────────────

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { ChevronLeft, Eye, Save } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { useClientAuthFetch } from "@/lib/Useclientauthfetch";
import { useArmDetails } from "../context/Armdetailsprovider";
import ButtonLoader from "../../components/Buttonloader";
import EmptyState from "../../components/Emptystate";
import type { ApiEnvelope } from "../page";

// ── Constants ────────────────────────────────────────────────────────────────

const SCHOOL_ID = process.env.NEXT_PUBLIC_SCHOOL_ID ?? "";
const STUDENTS_PAGE_SIZE = 100;

// ── Local response shape for the paginated student endpoint ──────────────────
interface PaginatedResponse<T> {
  message: string;
  count: number;
  total_pages: number;
  current_page: number;
  next: string | null;
  previous: string | null;
  data: T[];
}

interface RecordAssessmentPanelProps {
  show: boolean;
  subject: ArmSubject | null;
  onClose: () => void;
  onSwitchToView: () => void;
}

// Cell-level row representation — unit.id keyed so we don't rely on array index
// alignment between the form state and the unit order.
type ScoreRow = Record<string, number | "">;

export default function RecordAssessmentPanel({
  show,
  subject,
  onClose,
  onSwitchToView,
}: RecordAssessmentPanelProps) {
  const { armId, arm } = useArmDetails();
  const queryClient = useQueryClient();
  const { clientAuthFetch } = useClientAuthFetch();

  // ── Reference data: units, roster, existing scores ────────────────────────

  // Cognitive units sorted by display_order so the column layout matches
  // CA1 → CA2 → EXAM regardless of insertion order.
  const units = useMemo(() => {
    const u = arm?.cognitive_assessment_format?.units ?? [];
    return [...u].sort((a, b) => a.display_order - b.display_order);
  }, [arm]);

  // Class roster — same query key as ClassMembersTab so React Query reuses
  // its cache when the user has already visited that tab.
  const { data: rosterData, isLoading: rosterLoading } = useQuery<
    PaginatedResponse<ArmStudent>
  >({
    queryKey: ["arm-students", armId],
    queryFn: async () => {
      const url = `student/list/?school-id=${SCHOOL_ID}&arm-id=${armId}&page-size=${STUDENTS_PAGE_SIZE}`;
      const { data, error } =
        await clientAuthFetch<PaginatedResponse<ArmStudent>>(url);
      if (error) throw new Error(error.message);
      return data!;
    },
    enabled: show && !!armId,
  });

  const rosterStudents = rosterData?.data ?? [];

  // Filter the roster down to students who actually offer this subject. A
  // student offers a subject when their id is NOT in subject.excluded_students.
  // Done in a memo so the Set is built once per roster/subject change.
  const offeringStudents = useMemo(() => {
    if (!subject) return [] as ArmStudent[];
    const excluded = new Set(subject.excluded_students.map((s) => s.id));
    return rosterStudents.filter((s) => !excluded.has(s.id));
  }, [rosterStudents, subject]);

  // Build the initial editable rows from existing assessment records. Each
  // student gets a row keyed by unit.id; missing scores stay "" so the cell
  // renders blank.
  const initialRows = useMemo(() => {
    const rows: Record<string, ScoreRow> = {};
    if (!subject) return rows;

    // Lookup table: studentId → cognitive_record for the selected subject.
    const cogByStudent: Record<string, ArmCognitiveRecord | undefined> = {};
    for (const record of arm?.assessments ?? []) {
      const cog = record.cognitive_records.find(
        (r) => r.subject.id === subject.id,
      );
      if (cog) cogByStudent[record.student.id] = cog;
    }

    // Seed every offering student — even those without records yet — so the
    // table row appears with blank cells. Students who don't offer the subject
    // are excluded entirely.
    for (const student of offeringStudents) {
      const cog = cogByStudent[student.id];
      const row: ScoreRow = {};
      for (const unit of units) {
        const entry = cog?.scores.find((s) => s.unit.id === unit.id);
        row[unit.id] = entry ? entry.score : "";
      }
      rows[student.id] = row;
    }

    return rows;
  }, [arm, subject, offeringStudents, units]);

  // Editable state + touched-row tracking.
  const [rowData, setRowData] = useState<Record<string, ScoreRow>>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());

  // Re-seed when the panel opens, the subject changes, or the roster fills in.
  useEffect(() => {
    if (show) {
      setRowData(initialRows);
      setTouched(new Set());
    }
  }, [show, initialRows]);

  // ── Validation ────────────────────────────────────────────────────────────
  // Returns { studentId: { unitId: errorMsg } } so cells can show their own
  // error state via the existing peer-focus styling pattern.
  const cellErrors = useMemo(() => {
    const errors: Record<string, Record<string, string>> = {};
    for (const [studentId, row] of Object.entries(rowData)) {
      for (const unit of units) {
        const value = row[unit.id];
        if (value === "" || value === undefined) continue; // empty allowed
        const numeric = Number(value);
        if (Number.isNaN(numeric)) {
          errors[studentId] ??= {};
          errors[studentId][unit.id] = "Number required";
        } else if (numeric === -1) {
          // Absent marker — valid.
        } else if (numeric < 0) {
          errors[studentId] ??= {};
          errors[studentId][unit.id] = "Use -1 for absent";
        } else if (numeric > unit.max_score) {
          errors[studentId] ??= {};
          errors[studentId][unit.id] = `≤ ${unit.max_score}`;
        }
      }
    }
    return errors;
  }, [rowData, units]);

  // Only block save if a TOUCHED row has errors. Pre-existing problems on
  // untouched rows (e.g. legacy data the user hasn't edited) don't get in
  // the way of saving a different correction.
  const touchedHasErrors = useMemo(() => {
    for (const studentId of touched) {
      const errs = cellErrors[studentId];
      if (errs && Object.keys(errs).length > 0) return true;
    }
    return false;
  }, [touched, cellErrors]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleCellChange(studentId: string, unitId: string, raw: string) {
    const parsed: number | "" = raw === "" ? "" : Number(raw);
    setRowData((prev) => {
      const existing = prev[studentId] ?? {};
      return { ...prev, [studentId]: { ...existing, [unitId]: parsed } };
    });
    setTouched((prev) => new Set(prev).add(studentId));
  }

  // ── Mutation ──────────────────────────────────────────────────────────────
  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      if (!subject) throw new Error("No subject selected.");
      if (touchedHasErrors) {
        throw new Error("Fix invalid scores in edited rows before saving.");
      }

      // Build the per-student entries from touched rows. Skip cells the user
      // left blank — the backend leaves any existing score intact when a unit
      // is omitted from the scores list.
      const entries: {
        student: string;
        scores: { unit: string; score: number }[];
      }[] = [];
      for (const studentId of touched) {
        const row = rowData[studentId];
        if (!row) continue;
        const scores: { unit: string; score: number }[] = [];
        for (const unit of units) {
          const value = row[unit.id];
          if (value === "" || value === undefined) continue;
          scores.push({ unit: unit.id, score: Number(value) });
        }
        if (scores.length > 0) {
          entries.push({ student: studentId, scores });
        }
      }

      if (entries.length === 0) {
        throw new Error("No changes to save.");
      }

      const { data, error } = await clientAuthFetch<ApiEnvelope<unknown>>(
        "arm/detail/scores/",
        {
          method: "PUT",
          body: {
            id: armId,
            school_id: SCHOOL_ID,
            cognitive: [
              {
                subject: subject.id,
                entries,
              },
            ],
          },
        },
      );

      if (error) throw new Error(error.message);
      return data;
    },

    onSuccess: () => {
      toast.success("Assessment saved.");
      // Refresh the arm detail so the assessment array reflects the new
      // scores on the next open / view-mode switch.
      queryClient.invalidateQueries({ queryKey: ["arm-detail", armId] });
      setTouched(new Set());
    },

    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : "Could not save scores.",
      );
    },
  });

  const armLabel = arm
    ? `${arm.level.section.abbr} ${arm.level.abbr} ${arm.abbr}`
    : "—";

  const maxTotal = units.reduce((sum, u) => sum + u.max_score, 0);

  // Score-tile column count. The vast majority of formats use 3 units
  // (CA1/CA2/EXAM); a 2-unit format gets a wider 2-column grid so tiles
  // don't leave an odd empty slot. Anything larger falls back to 3 columns
  // and simply wraps to the next row — still touch-friendly.
  const mobileGridCols = units.length === 2 ? "grid-cols-2" : "grid-cols-3";

  return (
    <div
      // `overflow-clip` (not `overflow-hidden`) clips the slide-in animation
      // without establishing a scroll container. `overflow: hidden` would
      // make this wrapper the sticky footer's scroll ancestor and — since
      // it never actually scrolls — permanently un-stick the footer. Clip
      // has the same visual clipping behaviour without that side-effect.
      className={`transition-all duration-500 ease-in-out overflow-clip ${
        show ? "w-full opacity-100" : "w-0 opacity-0 h-0"
      }`}
    >
      <div className="w-full">
        <button
          onClick={onClose}
          className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 my-5 md:my-8 transition-all hover:scale-105 w-fit cursor-pointer"
        >
          <ChevronLeft size={14} />
          <span>Back</span>
        </button>

        <div className="border border-slate-200 rounded-2xl shadow-sm mb-10">
          {/* Header */}
          <div className="bg-slate-100 border-b border-slate-200 rounded-t-2xl px-4 md:px-5 py-4 flex items-center justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-slate-800">
                Record {subject?.definition.name ?? "Assessment"} : {armLabel}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Enter cognitive scores for each student. Blank cells are left
                untouched; only edited rows are submitted.
              </p>
            </div>
            <button
              onClick={onSwitchToView}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-slate-200 bg-white text-slate-600 rounded-xl hover:border-violet-300 transition-colors cursor-pointer"
            >
              <Eye size={12} />
              View mode
            </button>
          </div>

          {/* Grid */}
          {!arm?.cognitive_assessment_format ? (
            <EmptyState
              variant="generic"
              title="Arm configuration incomplete"
              description="A cognitive assessment format hasn't been set up for this arm yet. Configure one before recording scores."
            />
          ) : rosterLoading ? (
            <div className="p-5">
              <p className="text-xs text-slate-400">Loading roster…</p>
            </div>
          ) : offeringStudents.length === 0 ? (
            <EmptyState
              variant="generic"
              title="No students offer this subject"
              description="Either no students are enrolled in this arm, or every enrolled student has been excluded from this subject."
            />
          ) : (
            <>
              {/* ── Mobile: stacked card list (visible below md) ─────────
                  Each student sits in a card with a numbered avatar,
                  identity block, running total, and a grid of score tiles.
                  All state, handlers, and validation are shared with the
                  desktop table below. */}
              <div className="md:hidden divide-y divide-slate-100">
                {offeringStudents.map((student, index) => {
                  const row = rowData[student.id] ?? {};
                  const rowErrors = cellErrors[student.id] ?? {};
                  const isTouched = touched.has(student.id);
                  const hasErrors = Object.keys(rowErrors).length > 0;

                  // Sum only cells that hold a usable positive number.
                  // Empty, -1 (absent), and invalid each contribute 0.
                  const total = units.reduce<number>((sum, unit) => {
                    const v = row[unit.id];
                    if (v === "" || v === undefined) return sum;
                    const n = Number(v);
                    if (Number.isNaN(n) || n < 0) return sum;
                    return sum + n;
                  }, 0);

                  return (
                    <div
                      key={student.id}
                      // `group` + `focus-within:*` lets the card react when
                      // any of its score inputs receives focus, so children
                      // (avatar, name, total) can highlight without extra
                      // React state. Pure CSS — no re-render on focus.
                      className="p-4 group transition-colors focus-within:bg-violet-50/40"
                    >
                      {/* Student header: numbered avatar + name/id + total */}
                      <div className="flex items-center gap-3 mb-4">
                        <div
                          className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold transition-all group-focus-within:bg-violet-600 group-focus-within:text-white group-focus-within:ring-2 group-focus-within:ring-violet-200 ${
                            isTouched && hasErrors
                              ? "bg-red-100 text-red-600 ring-1 ring-red-200"
                              : isTouched
                                ? "bg-violet-600 text-white"
                                : "bg-violet-50 text-violet-600"
                          }`}
                        >
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm font-semibold truncate transition-colors group-focus-within:text-violet-700 ${
                              isTouched && !hasErrors
                                ? "text-violet-700"
                                : "text-slate-800"
                            }`}
                          >
                            {student.last_name} {student.first_name}{" "}
                            {student?.middle_name ?? ""}
                          </p>
                          {student.public_id && (
                            <p className="text-[11px] text-slate-400 font-mono truncate transition-colors group-focus-within:text-violet-500">
                              {student.public_id}
                            </p>
                          )}
                        </div>
                        {/* Compact running total pinned to the right of the
                            header row — matches the desktop TOTAL column.
                            The /{maxTotal} suffix sits with the "Total" label
                            so the score itself gets full visual weight. */}
                        <div className="shrink-0 text-right leading-tight">
                          <div className="text-[9px] uppercase tracking-wide text-slate-400 transition-colors group-focus-within:text-violet-500">
                            Total{" "}
                            <span className="normal-case tracking-normal">
                              /{maxTotal}
                            </span>
                          </div>
                          <div
                            className={`text-xl font-bold mt-0.5 transition-colors group-focus-within:text-violet-700 ${
                              isTouched ? "text-violet-700" : "text-slate-800"
                            }`}
                          >
                            {total}
                          </div>
                        </div>
                      </div>

                      {/* Score tiles — one per cognitive unit */}
                      <div className={`grid ${mobileGridCols} gap-2.5`}>
                        {units.map((unit) => {
                          const value = row[unit.id] ?? "";
                          const error = rowErrors[unit.id];
                          const inputId = `m-in-${student.id}-${unit.id}`;
                          const errorId = `m-err-${student.id}-${unit.id}`;

                          return (
                            <div key={unit.id} className="relative">
                              {/* Floating pill label: unit abbr + max score.
                                  Sits on top of the tile border so it reads
                                  as an inline label rather than a header. */}
                              <label
                                htmlFor={inputId}
                                className={`absolute -top-2 left-2.5 px-1.5 text-[10px] font-medium bg-white rounded z-10 ${
                                  error
                                    ? "text-red-500"
                                    : isTouched
                                      ? "text-violet-600"
                                      : "text-slate-500"
                                }`}
                              >
                                {unit.abbr}
                                <span className="text-slate-400 font-normal ml-0.5">
                                  /{unit.max_score}
                                </span>
                              </label>
                              <input
                                id={inputId}
                                type="number"
                                inputMode="numeric"
                                // -1 is the valid absent marker; arrow-key
                                // stepping clamps at -1 on the low end.
                                min={-1}
                                max={unit.max_score}
                                value={value}
                                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                  handleCellChange(
                                    student.id,
                                    unit.id,
                                    e.target.value,
                                  )
                                }
                                aria-invalid={!!error}
                                aria-describedby={error ? errorId : undefined}
                                // Larger, touch-friendly tile. Spinner
                                // arrows hidden via the same arbitrary
                                // selectors used in the desktop table.
                                className={`w-full text-center px-2 py-3 text-sm font-medium text-slate-700 border-2 rounded-xl outline-none transition-all bg-white [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield] placeholder:text-slate-300 ${
                                  error
                                    ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                                    : isTouched
                                      ? "border-violet-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                                      : "border-slate-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                                }`}
                              />
                              {error && (
                                <span
                                  id={errorId}
                                  className="block text-[10px] text-red-500 mt-1 text-center leading-tight"
                                >
                                  {error}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ── Desktop / tablet: original table (unchanged) ───────── */}
              <div className="hidden md:block overflow-x-auto p-5">
                <table className="w-full text-xs min-w-150">
                  <thead>
                    <tr className="text-left text-slate-500 border-b border-slate-200">
                      <th className="py-3 pr-4 font-semibold w-12">#</th>
                      <th className="py-3 pr-4 font-semibold">Student</th>
                      {units.map((unit) => (
                        <th
                          key={unit.id}
                          className="py-3 px-2 font-semibold text-center"
                        >
                          <div className="flex flex-col items-center">
                            <span>{unit.abbr}</span>
                            <span className="text-[9px] font-normal text-slate-400">
                              /{unit.max_score}
                            </span>
                          </div>
                        </th>
                      ))}
                      <th className="py-3 px-2 font-semibold text-center bg-violet-50 rounded-tr-lg">
                        <div className="flex flex-col items-center">
                          <span>TOTAL</span>
                          <span className="text-[9px] font-normal text-slate-400">
                            /{maxTotal}
                          </span>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {offeringStudents.map((student, index) => {
                      const row = rowData[student.id] ?? {};
                      const rowErrors = cellErrors[student.id] ?? {};
                      // Sum only cells that hold a usable positive number.
                      // Empty, -1 (absent), and invalid each contribute 0.
                      const total = units.reduce<number>((sum, unit) => {
                        const v = row[unit.id];
                        if (v === "" || v === undefined) return sum;
                        const n = Number(v);
                        if (Number.isNaN(n) || n < 0) return sum;
                        return sum + n;
                      }, 0);
                      return (
                        <tr
                          key={student.id}
                          // Same `group` + `focus-within:*` pattern as the
                          // mobile card: whenever any score input in this row
                          // has focus, the row-level identity cells (serial,
                          // name, public_id) light up in violet so the user
                          // can tell at a glance which student they're
                          // editing. Pure CSS — no extra React state.
                          className="group transition-colors hover:bg-slate-50/40 focus-within:bg-violet-50/50"
                        >
                          <td className="py-2.5 pr-4 text-slate-500 transition-colors group-focus-within:text-violet-700 group-focus-within:font-semibold">
                            {index + 1}
                          </td>
                          <td className="py-2.5 pr-4">
                            <div className="flex flex-col">
                              <span className="text-slate-800 transition-colors group-focus-within:text-violet-700 group-focus-within:font-semibold">
                                {student.last_name} {student.first_name}{" "}
                                {student?.middle_name ?? ""}
                              </span>
                              {student.public_id && (
                                <span className="text-[10px] text-slate-400 font-mono transition-colors group-focus-within:text-violet-500">
                                  {student.public_id}
                                </span>
                              )}
                            </div>
                          </td>
                          {units.map((unit) => {
                            const value = row[unit.id] ?? "";
                            const error = rowErrors[unit.id];
                            return (
                              <td
                                key={unit.id}
                                className="py-2.5 px-1 text-center"
                              >
                                {/* Wrap input + error so peer-focus on the error
                                    span tracks the input's focus state. */}
                                <div className="flex flex-col items-center">
                                  <input
                                    type="number"
                                    inputMode="numeric"
                                    // -1 is the valid absent marker; arrow-key
                                    // stepping clamps at -1 on the low end.
                                    min={-1}
                                    max={unit.max_score}
                                    value={value}
                                    onChange={(
                                      e: ChangeEvent<HTMLInputElement>,
                                    ) =>
                                      handleCellChange(
                                        student.id,
                                        unit.id,
                                        e.target.value,
                                      )
                                    }
                                    // peer so the sibling error span can react
                                    // to focus. Spinner arrows hidden via
                                    // arbitrary selectors (WebKit + Firefox).
                                    className={`peer w-16 text-center px-2 py-1 text-xs text-slate-600 border rounded-lg outline-none transition-all bg-white border-slate-200 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield] ${
                                      error
                                        ? "focus:border-red-300 focus:ring-2 focus:ring-red-100"
                                        : "focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                                    }`}
                                    aria-invalid={!!error}
                                    aria-describedby={
                                      error
                                        ? `err-${student.id}-${unit.id}`
                                        : undefined
                                    }
                                  />
                                  {error && (
                                    <span
                                      id={`err-${student.id}-${unit.id}`}
                                      className="hidden peer-focus:block text-[9px] text-red-500 mt-0.5"
                                    >
                                      {error}
                                    </span>
                                  )}
                                </div>
                              </td>
                            );
                          })}
                          <td className="py-2.5 px-2 text-center font-semibold text-violet-700 bg-violet-50/40 transition-colors group-focus-within:bg-violet-100">
                            {total}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Combined sticky footer.
              Pins to the bottom of the viewport while the panel is being
              scrolled through, then rejoins the flow when the panel's
              bottom scrolls into view. Row-count / error hint sits on the
              left; primary + secondary actions sit on the right. On mobile
              the two stack so the status is always readable above the
              buttons.

              Note: the outer card had its `overflow-hidden` removed —
              `position: sticky` needs an ancestor that doesn't clip it —
              so the header and this footer now carry their own rounded
              corners to preserve the card's rounded look. */}
          <div className="sticky bottom-0 z-10 bg-slate-50/95 backdrop-blur-sm border-t border-slate-200 rounded-b-2xl px-4 md:px-5 py-3 md:py-4 shadow-[0_-4px_12px_-6px_rgba(15,23,42,0.08)]">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              {/* Status area — a small coloured dot carries the state
                  (neutral / progress / error) so the row reads at a glance
                  without having to parse the sentence. */}
              <div className="text-[11px] flex items-center gap-x-3 gap-y-1 flex-wrap min-w-0">
                {touched.size === 0 ? (
                  <span className="inline-flex items-center gap-1.5 text-slate-500">
                    <span
                      aria-hidden
                      className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0"
                    />
                    No changes yet
                  </span>
                ) : (
                  <>
                    <span className="inline-flex items-center gap-1.5 text-slate-600">
                      <span
                        aria-hidden
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          touchedHasErrors ? "bg-red-500" : "bg-violet-500"
                        }`}
                      />
                      <span className="font-semibold text-slate-700">
                        {touched.size}
                      </span>
                      <span>{touched.size === 1 ? "row" : "rows"} edited</span>
                    </span>
                    {touchedHasErrors && (
                      <span className="text-red-500">
                        Fix invalid scores before saving
                      </span>
                    )}
                  </>
                )}
              </div>

              {/* Action buttons — right-aligned on desktop; right-aligned
                  in their own row below the status on mobile. */}
              <div className="flex items-center justify-end gap-2 shrink-0">
                <button
                  onClick={onClose}
                  disabled={isPending}
                  className="px-4 py-2 text-xs border border-slate-200 bg-white rounded-xl text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => mutate()}
                  // Active as long as the user has edited at least one row.
                  // Validation errors surface through the click path
                  // (mutationFn throws → onError toast) so the button's
                  // enabled state stays predictable: edited = active.
                  disabled={touched.size === 0 || isPending}
                  className="relative flex items-center justify-center gap-2 px-4 py-2 text-xs bg-violet-600 text-white rounded-xl hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm shadow-violet-200 cursor-pointer"
                >
                  <span
                    className={`flex items-center gap-1.5 ${
                      isPending ? "invisible" : ""
                    }`}
                  >
                    <Save size={12} />
                    Save Assessment
                  </span>
                  <span
                    className={`absolute inset-0 flex items-center justify-center ${
                      isPending ? "" : "invisible"
                    }`}
                  >
                    <ButtonLoader />
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
