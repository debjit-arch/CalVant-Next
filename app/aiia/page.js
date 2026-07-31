"use client";

import ProtectedPage from "@/components/ProtectedPage";
import FrameworkPage from "@/components/FrameworkPage";
import AiiaDashboard from "@/modules/aiia/pages/AiiaDashboard";
import ModuleUpgradeGate from "@/modules/admin/components/shared/ModuleUpgradeGate";
import useModuleEntitlements from "@/modules/admin/hooks/useModuleEntitlements";

export default function Page() {
  const { loading, aiia } = useModuleEntitlements();
  return (
    <ProtectedPage>
      <ModuleUpgradeGate loading={loading} entitled={aiia} moduleName="AI Impact Assessment">
        <FrameworkPage moduleKey="aiia">
          <AiiaDashboard />
        </FrameworkPage>
      </ModuleUpgradeGate>
    </ProtectedPage>
  );
}
