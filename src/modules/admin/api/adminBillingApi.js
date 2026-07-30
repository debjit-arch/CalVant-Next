/**
 * adminBillingApi.js
 * Authenticated billing-service calls for the Manage Subscription admin page,
 * the Upgrade/Downgrade Add-Ons wizard, and the /admin/integrations
 * slot-limit check. Uses adminAxios (already attaches Bearer token) exactly
 * like every other admin module — see ListOrg.jsx / OnboardingModule.jsx.
 *
 * IMPORTANT: never send an x-org / tenant header as the "which tenant" signal
 * for these billing-service calls — SubscriptionController resolves tenantId
 * server-side from the verified JWT (see its class javadoc). adminAxios still
 * attaches x-org/x-role for other services' benefit; billing-service simply
 * ignores those and reads the JWT instead.
 *
 * Export names below are the actual contract consumed by
 * ManageSubscription.jsx and UpgradeAddOnsWizard.jsx — keep them stable,
 * these two files destructure by name.
 */
import adminAxios from "./adminAxios";

const BILLING_BASE = process.env.NEXT_PUBLIC_SP
  ? `${process.env.NEXT_PUBLIC_SP}/billing-service`
  : "https://api.calvant.com/billing-service";

const API = `${BILLING_BASE}/api/billing`;

/** GET /api/billing/subscription -> { subscription, resolvedPriceMinorUnits } */
export async function getCurrentSubscription() {
  const { data } = await adminAxios.get(`${API}/subscription`);
  return data;
}

/** GET /api/billing/addons -> AddOn[] (full catalog, all billingTypes) */
export async function getAddOnCatalog() {
  const { data } = await adminAxios.get(`${API}/addons`);
  return data;
}

/** GET /api/billing/starter-package -> StarterPackage */
export async function getStarterPackage() {
  const { data } = await adminAxios.get(`${API}/starter-package`);
  return data;
}

/** PATCH /api/billing/subscription/addons — full replace of PER_UNIT_MONTHLY lines. */
export async function updateAddOns(addOns) {
  const { data } = await adminAxios.patch(`${API}/subscription/addons`, { addOns });
  return data;
}

/** PATCH /api/billing/subscription/seats — absolute seat counts, not deltas. */
export async function updateSeats(adminUserCount, normalUserCount) {
  const { data } = await adminAxios.patch(`${API}/subscription/seats`, {
    adminUserCount,
    normalUserCount,
  });
  return data;
}

/** POST /api/billing/subscription/cancel */
export async function cancelSubscription() {
  const { data } = await adminAxios.post(`${API}/subscription/cancel`);
  return data;
}

/**
 * POST /api/billing/subscription/checkout — starts a Razorpay checkout for the
 * tenant's CURRENT billingCycle + addOns (whatever was last saved via
 * updateAddOns/updateSeats). This is the recurring-plan checkout — trial
 * conversion, re-subscribing after INACTIVE, or an immediate mid-cycle
 * upgrade charge. Named startCheckout (not initiateCheckout) to match what
 * ManageSubscription.jsx / UpgradeAddOnsWizard.jsx already import.
 */
export async function startCheckout() {
  const { data } = await adminAxios.post(`${API}/subscription/checkout`);
  return data;
}

/**
 * POST /api/billing/subscription/checkout/one-time — for ONE_TIME catalog
 * items (SERVICE_POLICY_PACK, SERVICE_CONSULTANT_DAY today). Requires the
 * backend-patch/SubscriptionService_and_Controller.patch.java addition —
 * without it this 404s. startCheckout() above can't be reused for this
 * because it always prices off the tenant's recurring plan, never a
 * standalone item.
 */
export async function initiateOneTimeCheckout(addOnCode, quantity = 1) {
  const { data } = await adminAxios.post(`${API}/subscription/checkout/one-time`, {
    addOnCode,
    quantity,
  });
  return data;
}

export default {
  getCurrentSubscription,
  getAddOnCatalog,
  getStarterPackage,
  updateAddOns,
  updateSeats,
  cancelSubscription,
  startCheckout,
  initiateOneTimeCheckout,
};
