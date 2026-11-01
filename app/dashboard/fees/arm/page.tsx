import type { Metadata } from "next";
import Link from "next/link";
import EmptyState from "@/app/dashboard/components/Emptystate";
import ArmFees from "./components/Armfees";

export const metadata: Metadata = {
  title: "Fees | Class",
  description: "Fee records for one class arm.",
};

export default async function FeesArmPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;

  if (!id) {
    return (
      <div className="space-y-4 text-center">
        <EmptyState
          title="No class selected"
          description="Open a class from the fees overview to see its fee records."
        />
        <Link
          href="/dashboard/fees/arms"
          className="inline-block rounded-full border border-violet-200 px-5 py-2 text-xs font-semibold text-violet-700 transition-colors hover:bg-violet-50"
        >
          Go to the fees overview
        </Link>
      </div>
    );
  }

  return <ArmFees armId={id} />;
}
