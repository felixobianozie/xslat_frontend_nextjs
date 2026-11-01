"use client";

// ─────────────────────────────────────────
// app/dashboard/fees/arm/components/Armfees.tsx
//
// A class's fees page. It loads the class and ties the pieces together: the
// summary, the student list, the payment panel for one student, and the
// confirmation for marking the ticked students as paid.
// ─────────────────────────────────────────

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useArmFees } from "../../hooks/Usefees";
import ArmSummary from "./Armsummary";
import MarkPaidModal from "./Markpaidmodal";
import PaymentPanel from "./Paymentpanel";
import StudentFeesList from "./Studentfeeslist";

const BACK_LINK =
  "inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-violet-700";

function BackLink() {
  return (
    <Link href="/dashboard/fees/arms" className={BACK_LINK}>
      <ArrowLeft size={16} aria-hidden="true" />
      All classes
    </Link>
  );
}

function ArmSkeleton() {
  return (
    <div className="animate-pulse space-y-4" aria-busy="true" aria-label="Loading class fees">
      <div className="h-52 rounded-3xl bg-slate-200/70" />
      <div className="grid gap-4 lg:grid-cols-3">
        {[0, 1, 2].map((n) => (
          <div key={n} className="h-44 rounded-2xl bg-slate-200/70" />
        ))}
      </div>
      <div className="h-10 rounded-xl bg-slate-200/70" />
      {[0, 1, 2].map((n) => (
        <div key={n} className="h-32 rounded-2xl bg-slate-200/70 xl:h-14" />
      ))}
    </div>
  );
}

export default function ArmFees({ armId }: { armId: string }) {
  const { data, isPending, isError, error, refetch } = useArmFees(armId);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openStudentId, setOpenStudentId] = useState<string | null>(null);
  // Set while the confirmation is open: who would be marked, and how many ticked students are left out.
  const [markRequest, setMarkRequest] = useState<{
    ids: string[];
    skipped: number;
  } | null>(null);

  if (isPending) {
    return (
      <div className="space-y-6">
        <BackLink />
        <ArmSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <BackLink />
        <div className="rounded-2xl border border-rose-100 bg-rose-50 p-6 text-center">
          <p className="text-sm font-semibold text-rose-700">
            We could not load this class.
          </p>
          <p className="mt-1 text-xs text-rose-600">{error.message}</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-4 cursor-pointer rounded-full bg-rose-600 px-5 py-2 text-xs font-semibold text-white transition-colors hover:bg-rose-700"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const openStudent = data.students.find((s) => s.id === openStudentId);
  const studentsToMark = markRequest
    ? data.students.filter((s) => markRequest.ids.includes(s.id))
    : [];

  return (
    <div className="space-y-6">
      <BackLink />
      <ArmSummary detail={data} />

      <StudentFeesList
        students={data.students}
        selected={selected}
        onSelectedChange={setSelected}
        onOpenStudent={setOpenStudentId}
        onMarkPaid={(ids, skipped) => setMarkRequest({ ids, skipped })}
      />

      {openStudent && (
        <PaymentPanel
          armId={armId}
          student={openStudent}
          onClose={() => setOpenStudentId(null)}
        />
      )}

      {markRequest && (
        <MarkPaidModal
          armId={armId}
          armName={data.arm.name}
          students={studentsToMark}
          skipped={markRequest.skipped}
          onClose={() => setMarkRequest(null)}
          onDone={() => {
            setMarkRequest(null);
            setSelected(new Set());
          }}
        />
      )}
    </div>
  );
}
