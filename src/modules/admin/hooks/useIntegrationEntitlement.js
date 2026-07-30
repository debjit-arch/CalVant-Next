/**
 * useIntegrationEntitlement.js
 *
 * Drives the entitlement gating described in the plan:
 *   "Integrations: shows only what's entitled — INTEGRATION_STANDARD qty
 *   selector capped at what's purchased, or a single 'Custom (contact
 *   sales)' state if INTEGRATION_CUSTOM — nothing else renders."
 *
 * Intended consumer: IntegrationsPage.jsx (or its slot-limit-enforcement
 * wrapper). I have NOT seen that file, so this hook is written standalone —
 * it doesn't assume anything about how IntegrationsPage renders its list,
 * only what it needs to know to decide what to render.
 *
 * ⚠️ Same caveat as subscriptionCatalogConfig.js: INTEGRATION_STANDARD /
 * INTEGRATION_CUSTOM are placeholder addOnCodes pending confirmation against
 * your real AddOn seed data.
 */
import { useEffect, useState } from "react";
import { getCurrentSubscription, getAddOnCatalog } from "../api/adminBillingApi";
import { INTEGRATION_STANDARD_CODE, INTEGRATION_CUSTOM_CODE } from "../components/Subscription/subscriptionCatalogConfig";

export const ENTITLEMENT_NONE = "NONE";
export const ENTITLEMENT_STANDARD = "STANDARD";
export const ENTITLEMENT_CUSTOM = "CUSTOM";

/**
 * @returns {{
 *   loading: boolean,
 *   error: string,
 *   mode: "NONE" | "STANDARD" | "CUSTOM",
 *   slotLimit: number,    // only meaningful when mode === STANDARD; 0 otherwise
 *   refresh: () => void,
 * }}
 */
export default function useIntegrationEntitlement() {
  const [state, setState] = useState({
    loading: true,
    error: "",
    mode: ENTITLEMENT_NONE,
    slotLimit: 0,
  });

  const load = async () => {
    setState((s) => ({ ...s, loading: true, error: "" }));
    try {
      const [{ subscription }, catalog] = await Promise.all([
        getCurrentSubscription(),
        getAddOnCatalog(),
      ]);

      const customLine = subscription?.addOns?.find((l) => l.addOnCode === INTEGRATION_CUSTOM_CODE);
      const standardLine = subscription?.addOns?.find((l) => l.addOnCode === INTEGRATION_STANDARD_CODE);

      if (customLine && customLine.quantity > 0) {
        setState({ loading: false, error: "", mode: ENTITLEMENT_CUSTOM, slotLimit: 0 });
        return;
      }

      if (standardLine && standardLine.quantity > 0) {
        // slotLimit here assumes each purchased unit = 1 integration slot.
        // If a single INTEGRATION_STANDARD unit actually grants more than
        // one slot on the backend, multiply by that per-unit slot count
        // (check the AddOn's own metadata / SubscriptionService if it
        // exposes one — not visible from the frontend catalog response
        // alone).
        setState({ loading: false, error: "", mode: ENTITLEMENT_STANDARD, slotLimit: standardLine.quantity });
        return;
      }

      setState({ loading: false, error: "", mode: ENTITLEMENT_NONE, slotLimit: 0 });
    } catch (err) {
      console.error(err);
      setState({
        loading: false,
        error: err?.response?.data?.error || err?.message || "Couldn't load integration entitlement.",
        mode: ENTITLEMENT_NONE,
        slotLimit: 0,
      });
    }
  };

  useEffect(() => {
    load();
  }, []);

  return { ...state, refresh: load };
}
