"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import useModuleEntitlements from "@/modules/admin/hooks/useModuleEntitlements";

/**
 * Route guard for DPIA / AI IA pages.
 *
 * This used to gate on which compliance framework the org had selected
 * (ISO 27701 -> DPIA, ISO 42001 -> AI IA) via useFramework()'s showDpia/
 * showAiia. That coupling was wrong: an org that bought the DPIA add-on
 * but only has ISO 27001 selected would still get bounced home. Access to
 * these modules is a billing/entitlement question, not a framework
 * question, so this now gates purely on useModuleEntitlements() — the
 * same source of truth ModuleUpgradeGate already uses on the top-level
 * /dpia and /aiia routes. This also closes a gap on the sub-routes below
 * (new/[id]/assessments/etc.) that previously had no entitlement check at
 * all, only the framework one.
 */
export default function FrameworkPage({ children, moduleKey }) {
  const { loading, dpia, aiia } = useModuleEntitlements();
  const router = useRouter();

  const allowed = moduleKey === "dpia" ? dpia : aiia;

  useEffect(() => {
    // Only redirect once entitlements have finished loading AND the
    // module is explicitly not entitled.
    if (!loading && allowed === false) {
      router.replace("/");
    }
  }, [allowed, loading, router]);

  // While loading entitlements, don't render children OR redirect.
  if (loading) return null;

  // If not allowed, don't render children (the useEffect will handle the redirect).
  if (!allowed) return null;

  return children;
}
