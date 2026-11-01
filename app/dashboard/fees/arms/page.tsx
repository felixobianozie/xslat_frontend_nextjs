import type { Metadata } from "next";
import FeesOverview from "./components/Feesoverview";

export const metadata: Metadata = {
  title: "Fees | Classes",
  description: "Fee collection across all class arms.",
};

export default function FeesArmsPage() {
  return <FeesOverview />;
}
