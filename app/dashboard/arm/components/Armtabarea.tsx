"use client";

// ─────────────────────────────────────────────────────────────────────────────
// ArmTabArea.tsx
//
// Owns the active-tab index and renders the corresponding tab content.
// Heavier tabs (Subjects, Results, ClassTeacher, GradingSystem, PassRule) are
// loaded via next/dynamic so the initial page paint isn't blocked by their
// imports.
//
// The default tab is "Class Members" (index 0), matching the draft.
// ─────────────────────────────────────────────────────────────────────────────

import dynamic from "next/dynamic";
import { useState } from "react";
import ArmTabs from "./Armtabs";
import ClassMembersTab from "./Classmemberstab";
import TableLoader from "../../components/Tableloader";

// Dynamic imports — each tab loads on demand. The fallback uses your shared
// TableLoader so the loading state looks like the rest of the dashboard.
const SubjectsTab = dynamic(() => import("./Subjectstab"), {
  loading: () => <TableLoader rows={4} />,
});
const ResultsTab = dynamic(() => import("./Resultstab"), {
  loading: () => <TableLoader rows={4} />,
});
const ClassTeacherTab = dynamic(() => import("./Classeachertab"), {
  loading: () => <TableLoader rows={2} />,
});
const GradingSystemTab = dynamic(() => import("./Gradingsystemtab"), {
  loading: () => <TableLoader rows={3} />,
});
const PassRuleTab = dynamic(() => import("./Passruletab"), {
  loading: () => <TableLoader rows={3} />,
});

export default function ArmTabArea() {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div>
      <ArmTabs activeIndex={activeIndex} onChange={setActiveIndex} />

      {/* Only the active tab is rendered so each tab can manage its own slide-in
          panels without affecting sibling tabs. */}
      {activeIndex === 0 && <ClassMembersTab />}
      {activeIndex === 1 && <SubjectsTab />}
      {activeIndex === 2 && <ResultsTab />}
      {activeIndex === 3 && <ClassTeacherTab />}
      {activeIndex === 4 && <GradingSystemTab />}
      {activeIndex === 5 && <PassRuleTab />}
    </div>
  );
}
