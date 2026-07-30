/**
 * subscriptionCatalogConfig.js
 *
 * Single place that decides, for every PER_UNIT_MONTHLY addOnCode:
 *   1. what order it appears in on the Subscription Details table and the
 *      Upgrade/Downgrade wizard (WIZARD_ADDON_ORDER), and
 *   2. whether it renders as a checkbox (on/off module) or a quantity
 *      stepper (genuinely countable unit, e.g. integration slots).
 *
 * ⚠️ VERIFY AGAINST YOUR ACTUAL AddOn SEED DATA / ENUM before shipping.
 * The codes below (MODULE_DPIA, MODULE_VENDOR_MGMT, MODULE_AI_IMPACT,
 * INTEGRATION_STANDARD) are named to match the plan described in chat
 * ("Module add-ons (DPIA, Vendor Mgmt, AI Impact) as checkboxes... Integrations:
 * INTEGRATION_STANDARD qty selector...") but I have not seen your AddOn
 * entity/enum or seed rows, so the literal strings may not match what's in
 * your database. If they don't, this is the only file you need to edit —
 * nothing else references raw addOnCode strings for control-type purposes.
 *
 * billingType is still authoritative for ONE_TIME vs CUSTOM_QUOTE vs
 * PER_UNIT_MONTHLY (that logic lives in ManageSubscription.jsx's
 * oneTimeItems/customQuoteItems filters, driven by the catalog itself, not
 * this file). This file only decides checkbox-vs-stepper *within* the
 * PER_UNIT_MONTHLY set.
 */

export const CONTROL_CHECKBOX = "CHECKBOX";
export const CONTROL_STEPPER = "STEPPER";

// Codes that should render as an on/off checkbox rather than a +/- stepper —
// these are modules you either have or don't, quantity is meaningless.
const CHECKBOX_CODES = new Set([
  "MODULE_DPIA",
  "MODULE_VENDOR_MGMT",
  "MODULE_AI_IMPACT",
]);

export function controlTypeFor(addOnCode) {
  return CHECKBOX_CODES.has(addOnCode) ? CONTROL_CHECKBOX : CONTROL_STEPPER;
}

// Display + wizard order for every PER_UNIT_MONTHLY addOnCode. Anything in
// the catalog with billingType=PER_UNIT_MONTHLY but NOT listed here simply
// won't show up in the Subscription Details table or the wizard — so when
// you add a new recurring add-on on the backend, add its code here too.
export const WIZARD_ADDON_ORDER = [
  "MODULE_DPIA",
  "MODULE_VENDOR_MGMT",
  "MODULE_AI_IMPACT",
  "INTEGRATION_STANDARD",
];

// Convenience export for IntegrationsPage.jsx / useIntegrationEntitlement —
// the one PER_UNIT_MONTHLY code that gates integration slot count, and the
// one CUSTOM_QUOTE code that means "unlimited, sales-negotiated" instead.
export const INTEGRATION_STANDARD_CODE = "INTEGRATION_STANDARD";
export const INTEGRATION_CUSTOM_CODE = "INTEGRATION_CUSTOM";
