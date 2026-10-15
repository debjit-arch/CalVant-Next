"use client";

import dynamic from "next/dynamic";
import ProtectedPage from "@/components/ProtectedPage";

const CreatePlan = dynamic(
  () => import("@/modules/plan/pages/CreatePlan"),
  { ssr: false }
);

export default function Page() {
  return (
    <ProtectedPage>
      <CreatePlan />
    </ProtectedPage>
  );
}
