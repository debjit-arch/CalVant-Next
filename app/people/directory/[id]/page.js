"use client";

import { useParams } from "next/navigation";
import ProtectedPage from "@/components/ProtectedPage";
import PersonProfilePage from "@/modules/people/pages/PersonProfilePage";

export default function Page() {
  const { id } = useParams();
  return (
    <ProtectedPage>
      <PersonProfilePage personId={id} />
    </ProtectedPage>
  );
}
