"use client";

import dynamic from "next/dynamic";
import ProtectedPage from "@/components/ProtectedPage";

const PlanDashboard = dynamic(
  () => import("@/modules/plan/pages/PlanDashboard"),
  { ssr: false }
);

export default function Page() {
  return (
    <ProtectedPage>
      <PlanDashboard />
    </ProtectedPage>
  );
}
