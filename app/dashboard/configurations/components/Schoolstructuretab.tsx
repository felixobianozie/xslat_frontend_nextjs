"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Schoolstructuretab.tsx
//
// The School Structure tab: the sections, levels and arms of the current term,
// in three views switched by a segmented control.
//
//   Sections   GET section/list/. Each card shows the section's promotion order,
//              whether it is the final section, and how many levels and arms it
//              holds. Edit opens SectionEditor; "Add level" opens LevelEditor
//              with this section chosen.
//   Levels     GET level/list/, one request per section. Levels are grouped under
//              their section, and each section has its own "Add level" button.
//              Edit opens LevelEditor; "Add arm" opens ArmEditor with this level
//              chosen.
//   Arms       GET arm/list/. Arms are grouped under their section and level, and
//              each level has its own "Add arm" button. Edit opens ArmEditor
//              (name, abbreviation, display order and the score-entry window).
//              Class teachers are set on the Arms page.
//
// Only sections have a button in the toolbar, because they have no parent. A
// level or an arm is always added from the group of its section or level.
//
// The backend only lets sections, levels and arms be created or changed in the
// current term of the current session, so the tab always works on the current
// term and shows a message when the school has none. Sessions and terms are
// managed on the School Calendar tab. The backend has no delete for any of
// these, so the tab offers none.
//
// An arm whose broadsheet is submitted or approved is locked: its Edit button is
// hidden and it shows a lock label. The editors also disable the fields that the
// backend locks for a section or level that has such an arm.
//
// Saving refreshes the section, level and arm lists, and the other screens that
// show arm or subject details. The arm list shares its cache entry with the Arm
// Settings tab.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Lock, Pencil, PlusCircle } from "lucide-react";

import type { LevelRecord, SectionRecord } from "@/types/configurations";
import EmptyState from "../../components/Emptystate";
import TableLoader from "../../components/Tableloader";
import {
  ARMS_KEY,
  ARM_DETAIL_KEY,
  LEVELS_KEY,
  SECTIONS_KEY,
  TERM_SUBJECTS_KEY,
  isArmLocked,
} from "../configutils";
import { useCurrentTerm } from "../hooks/Usecurrentterm";
import {
  useLevels,
  useSections,
  useStructureArms,
} from "../hooks/Usestructure";
import ArmEditor from "./Armeditor";
import { ErrorNotice, ListToolbar } from "./Configui";
import LevelEditor from "./Leveleditor";
import SectionEditor from "./Sectioneditor";
import SlidePanelLayout from "./Slidepanellayout";

// ── Constants ────────────────────────────────────────────────────────────────

const ACTION_BUTTON =
  "cursor-pointer flex items-center gap-1 px-3 py-1.5 text-xs border border-slate-200 rounded-xl text-slate-600 hover:border-violet-300 hover:text-violet-700 transition-colors";

type View = "sections" | "levels" | "arms";

const VIEWS: { id: View; label: string }[] = [
  { id: "sections", label: "Sections" },
  { id: "levels", label: "Levels" },
  { id: "arms", label: "Arms" },
];

// What the slide-in panel is showing.
type PanelState =
  | { kind: "section"; section: SectionRecord | null }
  | { kind: "level"; level: LevelRecord | null; sectionId: string }
  | { kind: "arm"; arm: ClassArm | null; levelId: string };

// The label for an arm whose broadsheet is locked.
const LOCK_LABEL: Record<string, string> = {
  pending: "Submitted",
  approved: "Approved",
};

// A small violet label, for example "Final section".
function FinalPill({ label }: { label: string }) {
  return (
    <span className="shrink-0 rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
      {label}
    </span>
  );
}

export default function SchoolStructureTab() {
  const queryClient = useQueryClient();
  const { school, currentTerm } = useCurrentTerm();

  const [view, setView] = useState<View>("sections");
  // The panel content is kept after the panel closes so the panel still has its
  // content while it slides out.
  const [panel, setPanel] = useState<PanelState>({
    kind: "section",
    section: null,
  });
  const [panelOpen, setPanelOpen] = useState(false);

  function openPanel(next: PanelState) {
    setPanel(next);
    setPanelOpen(true);
  }

  const sectionsQuery = useSections(currentTerm?.id);
  const sections = [...(sectionsQuery.data?.data ?? [])].sort(
    (a, b) => a.promotion_order - b.promotion_order,
  );
  const levels = useLevels(sections);
  const armsQuery = useStructureArms(currentTerm?.id);
  const arms = [...(armsQuery.data?.data ?? [])].sort(
    (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0),
  );

  // Sections and levels that hold an arm with a submitted or approved
  // broadsheet; the backend locks their name, abbreviation and order.
  const lockedArms = arms.filter((arm) => isArmLocked(arm.broadsheet));
  const lockedSectionIds = new Set(
    lockedArms.map((arm) => arm.level.section.id),
  );
  const lockedLevelIds = new Set(lockedArms.map((arm) => arm.level.id));

  // Every level of the term in programme order, as options for the arm editor.
  const levelOptions = sections.flatMap((section) =>
    (levels.levelsBySection[section.id] ?? []).map((level) => ({
      value: level.id,
      label: `${section.name} · ${level.name}`,
    })),
  );

  function armsOfLevel(levelId: string): ClassArm[] {
    return arms.filter((arm) => arm.level.id === levelId);
  }

  function armsOfSection(sectionId: string): ClassArm[] {
    return arms.filter((arm) => arm.level.section.id === sectionId);
  }

  // Everything that shows sections, levels or arms is refreshed after a save.
  function handleSaved() {
    for (const queryKey of [
      SECTIONS_KEY,
      LEVELS_KEY,
      ARMS_KEY,
      ARM_DETAIL_KEY,
      ["broadsheet-arm-detail"],
      TERM_SUBJECTS_KEY,
    ]) {
      queryClient.invalidateQueries({ queryKey });
    }
    setPanelOpen(false);
  }

  function startNewLevel(sectionId: string) {
    openPanel({ kind: "level", level: null, sectionId });
  }

  function startNewArm(levelId: string) {
    openPanel({ kind: "arm", arm: null, levelId });
  }

  // ── Shared loading and empty states ────────────────────────────────────────

  // The messages shown before any view can list anything. Null when ready.
  function renderGate() {
    if (school.isPending) return <TableLoader rows={3} />;
    if (school.error) {
      return (
        <ErrorNotice
          message={school.error.message}
          onRetry={() => school.refetch()}
        />
      );
    }
    if (!currentTerm) {
      return (
        <EmptyState
          title="No current term"
          description="Set a current session and term on the School Calendar tab first. Sections, levels and arms can only be changed in the current term."
        />
      );
    }
    return null;
  }

  // Loading and error states for the queries a view depends on. Null when all
  // of them have loaded.
  function renderQueryState(needs: {
    sections?: boolean;
    levels?: boolean;
    arms?: boolean;
  }) {
    if (needs.sections && sectionsQuery.isPending) {
      return <TableLoader rows={3} />;
    }
    if (needs.sections && sectionsQuery.error) {
      return (
        <ErrorNotice
          message={sectionsQuery.error.message}
          onRetry={() => sectionsQuery.refetch()}
        />
      );
    }
    if (needs.levels && levels.isPending) return <TableLoader rows={3} />;
    if (needs.levels && levels.error) {
      return (
        <ErrorNotice
          message={levels.error.message}
          onRetry={() => levels.refetch()}
        />
      );
    }
    if (needs.arms && armsQuery.isPending) return <TableLoader rows={3} />;
    if (needs.arms && armsQuery.error) {
      return (
        <ErrorNotice
          message={armsQuery.error.message}
          onRetry={() => armsQuery.refetch()}
        />
      );
    }
    return null;
  }

  // ── Views ──────────────────────────────────────────────────────────────────

  function renderSections() {
    const notReady = renderGate() ?? renderQueryState({ sections: true });
    if (notReady) return notReady;
    if (sections.length === 0) {
      return (
        <EmptyState
          title="No sections yet"
          description='Use "New section" to add the first one, for example Junior Secondary.'
        />
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {sections.map((section) => {
          const sectionLevels = levels.levelsBySection[section.id] ?? [];

          return (
            <article
              key={section.id}
              className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-slate-800 truncate">
                    {section.name}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {section.abbr} · Order {section.promotion_order}
                  </p>
                </div>
                {section.terminal && <FinalPill label="Final section" />}
              </div>

              <p className="text-xs text-slate-500">
                {levels.isPending || armsQuery.isPending
                  ? "Counting…"
                  : `${sectionLevels.length} ${
                      sectionLevels.length === 1 ? "level" : "levels"
                    } · ${armsOfSection(section.id).length} ${
                      armsOfSection(section.id).length === 1 ? "arm" : "arms"
                    }`}
              </p>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => openPanel({ kind: "section", section })}
                  className={ACTION_BUTTON}
                >
                  <Pencil size={11} /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => startNewLevel(section.id)}
                  className={ACTION_BUTTON}
                >
                  <PlusCircle size={11} /> Add level
                </button>
              </div>
            </article>
          );
        })}
      </div>
    );
  }

  function renderLevels() {
    const notReady =
      renderGate() ??
      renderQueryState({ sections: true, levels: true, arms: true });
    if (notReady) return notReady;
    if (sections.length === 0) {
      return (
        <EmptyState
          title="No sections yet"
          description="Add a section on the Sections view first. Levels belong to a section."
        />
      );
    }

    return (
      <div className="flex flex-col gap-8">
        {sections.map((section) => {
          const sectionLevels = levels.levelsBySection[section.id] ?? [];

          return (
            <section key={section.id} className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-xs font-semibold text-slate-700">
                  {section.name}{" "}
                  <span className="font-normal text-slate-400">
                    {section.abbr}
                  </span>
                </h3>
                <button
                  type="button"
                  onClick={() => startNewLevel(section.id)}
                  className={ACTION_BUTTON}
                >
                  <PlusCircle size={11} /> Add level
                </button>
              </div>

              {sectionLevels.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-200 px-4 py-3 text-xs text-slate-400">
                  No levels in this section yet.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {sectionLevels.map((level) => {
                    const armCount = armsOfLevel(level.id).length;

                    return (
                      <article
                        key={level.id}
                        className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 flex flex-col gap-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h4 className="text-sm font-semibold text-slate-800 truncate">
                              {level.name}
                            </h4>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {level.abbr || "No abbreviation"} · Order{" "}
                              {level.promotion_order}
                            </p>
                          </div>
                          {level.terminal && <FinalPill label="Final level" />}
                        </div>

                        <p className="text-xs text-slate-500">
                          {armCount} {armCount === 1 ? "arm" : "arms"}
                        </p>

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              openPanel({
                                kind: "level",
                                level,
                                sectionId: section.id,
                              })
                            }
                            className={ACTION_BUTTON}
                          >
                            <Pencil size={11} /> Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => startNewArm(level.id)}
                            className={ACTION_BUTTON}
                          >
                            <PlusCircle size={11} /> Add arm
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>
    );
  }

  function renderArms() {
    const notReady =
      renderGate() ??
      renderQueryState({ sections: true, levels: true, arms: true });
    if (notReady) return notReady;
    if (levelOptions.length === 0) {
      return (
        <EmptyState
          title="No levels yet"
          description="Add a level on the Levels view first. Arms belong to a level."
        />
      );
    }

    return (
      <div className="flex flex-col gap-8">
        {sections.map((section) =>
          (levels.levelsBySection[section.id] ?? []).map((level) => {
            const levelArms = armsOfLevel(level.id);

            return (
              <section key={level.id} className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-xs font-semibold text-slate-700">
                    {section.name}{" "}
                    <span className="font-normal text-slate-400">·</span>{" "}
                    {level.name}
                  </h3>
                  <button
                    type="button"
                    onClick={() => startNewArm(level.id)}
                    className={ACTION_BUTTON}
                  >
                    <PlusCircle size={11} /> Add arm
                  </button>
                </div>

                {levelArms.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-200 px-4 py-3 text-xs text-slate-400">
                    No arms in this level yet.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {levelArms.map((arm) => {
                      const locked = isArmLocked(arm.broadsheet);

                      return (
                        <article
                          key={arm.id}
                          className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 flex flex-col gap-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h4 className="text-sm font-semibold text-slate-800 truncate">
                                {arm.name}
                              </h4>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                {arm.abbr} · Order {arm.display_order ?? "–"}
                              </p>
                            </div>
                            {locked && (
                              <span className="shrink-0 flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                                <Lock size={10} />
                                {LOCK_LABEL[arm.broadsheet ?? ""] ?? "Locked"}
                              </span>
                            )}
                          </div>

                          {locked ? (
                            <p className="text-[11px] text-slate-400">
                              The broadsheet is{" "}
                              {LOCK_LABEL[arm.broadsheet ?? ""]?.toLowerCase()},
                              so this arm cannot be changed. Revoke the
                              broadsheet to edit it.
                            </p>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  openPanel({
                                    kind: "arm",
                                    arm,
                                    levelId: level.id,
                                  })
                                }
                                className={ACTION_BUTTON}
                              >
                                <Pencil size={11} /> Edit
                              </button>
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          }),
        )}
      </div>
    );
  }

  // ── The panel ──────────────────────────────────────────────────────────────

  function renderPanel() {
    if (!currentTerm) return null;

    if (panel.kind === "section") {
      return (
        <SectionEditor
          key={panel.section?.id ?? "new"}
          section={panel.section}
          term={currentTerm}
          sections={sections}
          hasLockedArm={
            panel.section ? lockedSectionIds.has(panel.section.id) : false
          }
          onClose={() => setPanelOpen(false)}
          onSaved={handleSaved}
        />
      );
    }

    if (panel.kind === "level") {
      return (
        <LevelEditor
          key={panel.level?.id ?? `new-${panel.sectionId}`}
          level={panel.level}
          sectionId={panel.sectionId}
          term={currentTerm}
          sections={sections}
          levelsBySection={levels.levelsBySection}
          hasLockedArm={
            panel.level ? lockedLevelIds.has(panel.level.id) : false
          }
          onClose={() => setPanelOpen(false)}
          onSaved={handleSaved}
        />
      );
    }

    return (
      <ArmEditor
        key={panel.arm?.id ?? `new-${panel.levelId}`}
        arm={panel.arm}
        levelId={panel.levelId}
        term={currentTerm}
        levelOptions={levelOptions}
        arms={arms}
        onClose={() => setPanelOpen(false)}
        onSaved={handleSaved}
      />
    );
  }

  const termLine = currentTerm
    ? `${currentTerm.name} Term | ${currentTerm.session.name} Session. `
    : "";

  return (
    <SlidePanelLayout panelOpen={panelOpen} panel={renderPanel()}>
      <div className="pb-10">
        {/* Segmented control — scrolls sideways on very narrow screens */}
        <div
          role="tablist"
          aria-label="School structure"
          className="inline-flex max-w-full overflow-x-auto scrollbar-hide rounded-xl border border-slate-200 bg-white p-1 mb-5"
        >
          {VIEWS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={view === item.id}
              onClick={() => setView(item.id)}
              className={`cursor-pointer whitespace-nowrap rounded-lg px-4 py-1.5 text-xs font-medium transition-colors ${
                view === item.id
                  ? "bg-violet-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-violet-700"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {view === "sections" && (
          <>
            <ListToolbar
              title="Sections"
              description={`${termLine}The parts of your school's programme, for example Junior Secondary.`}
              actionLabel={currentTerm ? "New section" : undefined}
              onAction={() => openPanel({ kind: "section", section: null })}
            />
            {renderSections()}
          </>
        )}

        {view === "levels" && (
          <>
            <ListToolbar
              title="Levels"
              description={`${termLine}The years or classes inside each section.`}
            />
            {renderLevels()}
          </>
        )}

        {view === "arms" && (
          <>
            <ListToolbar
              title="Arms"
              description={`${termLine}The class groups inside each level. Class teachers are set on the Arms page.`}
            />
            {renderArms()}
          </>
        )}
      </div>
    </SlidePanelLayout>
  );
}
