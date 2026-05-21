"use client";
"use client";
import ProtectedPage from "@/components/ProtectedPage";
import RiskAssessment from "@/modules/riskAssesment/pages/RiskAssessment";
export default function Page() {
  return (
    <ProtectedPage>
      <RiskAssessment />
    </ProtectedPage>
  );
}
