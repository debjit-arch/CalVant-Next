/**
 * useModuleEntitlements.js
 *
 * Fulfilment-cap gating for whole modules (DPIA, AI Impact Assessment,
 * Vendor/TPRM) and for user seats — same idea as useIntegrationEntitlement.js
 * but for "on/off" module add-ons (checkbox, not a quantity stepper) plus
 * the seat count already exposed on the subscription object.
 *
 * addOnCode names (MODULE_DPIA / MODULE_AI_IMPACT / MODULE_VENDOR_MGMT) come
 * from subscriptionCatalogConfig.js's CHECKBOX_CODES set — verify against
 * real AddOn seed data if these don't match.
 *
 * A module is "entitled" if its addOn line exists on the subscription with
 * quantity > 0. Seats: adminUserCount + normalUserCount on the subscription
 * itself (see ManageSubscription.jsx), compared against the org's current
 * user count from user-service.
 */
import { useEffect, useState } from "react";
import api from "../api/adminAxios";
import { getCurrentSubscription } from "../api/adminBillingApi";

export const MODULE_DPIA_CODE = "MODULE_DPIA";
export const MODULE_AIIA_CODE = "MODULE_AI_IMPACT";
export const MODULE_VENDOR_CODE = "MODULE_VENDOR_MGMT";

const hasAddOn = (subscription, code) =>
  !!subscription?.addOns?.find((l) => l.addOnCode === code && l.quantity > 0);

// A module is entitled if it's genuinely paid for (addOns, qty > 0) OR it's
// covered by an active trial grant. trialGrant is a flat list of addOnCodes
// the backend unlocks for free until trialEndsAt — separate from addOns,
// and easy to miss (bit us once already: MODULE_VENDOR_MGMT / MODULE_AI_IMPACT
// were trial-granted but not in addOns, so the addOns-only check wrongly
// hid them during the trial window).
//
// IMPORTANT: the trial grant only applies while the subscription is
// actually still on TRIAL. Checking trialEndsAt alone isn't enough — if a
// tenant converts to a paid plan (status flips to ACTIVE) but the backend
// doesn't also clear trialEndsAt/trialGrant, trialEndsAt can still be in
// the future and every trial-granted module (e.g. Vendor Mgmt) stays free
// forever even though nothing was purchased. Requiring status === "TRIAL"
// closes that off regardless of what the backend does with those fields.
const isEntitled = (subscription, code) => {
  if (hasAddOn(subscription, code)) return true;
  const trialActive =
    subscription?.status === "TRIAL" &&
    subscription?.trialEndsAt &&
    new Date(subscription.trialEndsAt).getTime() > Date.now();
  return !!(trialActive && subscription?.trialGrant?.includes(code));
};

// Trial accounts get a flat, mandatory 5-seat cap — regardless of whatever
// adminUserCount/normalUserCount happen to be sitting on the subscription
// doc (e.g. left over from a prior paid period, or pre-set for the eventual
// starter package). Only once status flips to ACTIVE (starter bought) does
// the real seat math — starter inclusions + USER_ADMIN/USER_NORMAL add-ons —
// apply. Mirrors the same TRIAL-vs-status guard used for module entitlements
// above: checking trialEndsAt alone isn't enough once converted to paid.
const TRIAL_SEAT_CAP = 5;

const seatLimitFor = (subscription) => {
  const trialActive =
    subscription?.status === "TRIAL" &&
    subscription?.trialEndsAt &&
    new Date(subscription.trialEndsAt).getTime() > Date.now();
  if (trialActive) return TRIAL_SEAT_CAP;
  return (subscription?.adminUserCount || 0) + (subscription?.normalUserCount || 0);
};

export default function useModuleEntitlements() {
  const [state, setState] = useState({
    loading: true,
    error: "",
    dpia: false,
    aiia: false,
    vendor: false,
    seatLimit: 0,
    seatsUsed: 0,
  });

  const load = async () => {
    setState((s) => ({ ...s, loading: true, error: "" }));
    try {
      const [{ subscription }, usersRes] = await Promise.all([
        getCurrentSubscription(),
        api
          .get("https://api.calvant.com/user-service/api/users")
          .catch(() => ({ data: [] })), // don't let a users-list failure block module gating
      ]);

      const usersList = Array.isArray(usersRes?.data)
        ? usersRes.data
        : usersRes?.data?.items ?? [];

      setState({
        loading: false,
        error: "",
        dpia: isEntitled(subscription, MODULE_DPIA_CODE),
        aiia: isEntitled(subscription, MODULE_AIIA_CODE),
        vendor: isEntitled(subscription, MODULE_VENDOR_CODE),
        seatLimit: seatLimitFor(subscription),
        seatsUsed: usersList.length,
      });
    } catch (err) {
      console.error(err);
      setState({
        loading: false,
        error: err?.response?.data?.error || err?.message || "Couldn't load module entitlement.",
        dpia: false,
        aiia: false,
        vendor: false,
        seatLimit: 0,
        seatsUsed: 0,
      });
    }
  };

  useEffect(() => {
    load();
  }, []);

  return { ...state, refresh: load };
}
