"use client";
// app/dpia/page.js
import ProtectedPage from "@/components/ProtectedPage";
import FrameworkPage from "@/components/FrameworkPage";
import DpiaDashboard from "@/modules/dpia/pages/DpiaDashboard";
import ModuleUpgradeGate from "@/modules/admin/components/shared/ModuleUpgradeGate";
import useModuleEntitlements from "@/modules/admin/hooks/useModuleEntitlements";

export default function DpiaRoute() {
  const { loading, dpia } = useModuleEntitlements();
  return (
    <ProtectedPage>
      <ModuleUpgradeGate loading={loading} entitled={dpia} moduleName="DPIA">
        <FrameworkPage moduleKey="dpia">
          <DpiaDashboard />
        </FrameworkPage>
      </ModuleUpgradeGate>
    </ProtectedPage>
  );
}
