"use client";
"use client";
import ProtectedPage from "@/components/ProtectedPage";
import Documentation from "@/modules/documentation/pages/Documentation";
export default function Page() {
  return (
    <ProtectedPage>
      <Documentation />
    </ProtectedPage>
  );
}
