"use client";

import ProtectedPage from "@/components/ProtectedPage";
import PeopleDashboard from "@/modules/people/pages/PeopleDashboard";

export default function Page() {
  return (
    <ProtectedPage>
      <PeopleDashboard />
    </ProtectedPage>
  );
}
