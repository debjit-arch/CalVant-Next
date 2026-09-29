"use client";

import ProtectedPage from "@/components/ProtectedPage";
import PeopleDirectoryPage from "@/modules/people/pages/PeopleDirectoryPage";

export default function Page() {
  return (
    <ProtectedPage>
      <PeopleDirectoryPage />
    </ProtectedPage>
  );
}
