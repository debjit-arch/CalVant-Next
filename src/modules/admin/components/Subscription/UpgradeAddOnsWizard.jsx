// 'use client'

// import React, { useMemo, useState } from "react";
// import { X, ChevronLeft, Loader2, CheckCircle2 } from "lucide-react";
// import { updateAddOns, updateSeats, startCheckout } from "../../api/adminBillingApi";
// import { formatINR, perCycleRateFor } from "@/modules/billing/utils/billingFormat";
// import { openRazorpayCheckout } from "./razorpayHelpers";
// import { controlTypeFor, CONTROL_CHECKBOX, WIZARD_ADDON_ORDER } from "./subscriptionCatalogConfig";
// import "./ManageSubscription.css";

// const STEPS = ["Upgrade Add-Ons", "Confirm Order", "Confirmation"];

// /**
//  * mode: "upgrade" | "downgrade" — only changes the step-1 title/copy and
//  * whether the seat/quantity steppers are allowed to move up or down; the
//  * save logic (updateSeats + updateAddOns + conditional checkout) is
//  * identical either way, since the backend itself decides immediate-vs-queued
//  * per contract §5 (policy.isAddOnIncreaseImmediate/DecreaseImmediate).
//  */
// export default function UpgradeAddOnsWizard({ mode = "upgrade", sub, starter, catalog, billingCycle, onClose, onComplete }) {
//   const [step, setStep] = useState(1);
//   const [seats, setSeats] = useState({
//     adminUserCount: sub?.adminUserCount ?? starter?.includedAdminUsers ?? 1,
//     normalUserCount: sub?.normalUserCount ?? starter?.includedNormalUsers ?? 4,
//   });
//   const [qty, setQty] = useState(() => {
//     const q = {};
//     (sub?.addOns || []).forEach((line) => { q[line.addOnCode] = line.quantity; });
//     return q;
//   });
//   const [saving, setSaving] = useState(false);
//   const [error, setError] = useState("");
//   const [resultSub, setResultSub] = useState(null);
//   const [chargesNow, setChargesNow] = useState(0);

//   const orderedCatalog = useMemo(() => {
//     const byCode = {};
//     (catalog || []).forEach((a) => { if (a.billingType === "PER_UNIT_MONTHLY") byCode[a.addOnCode] = a; });
//     return WIZARD_ADDON_ORDER.map((code) => byCode[code]).filter(Boolean);
//   }, [catalog]);

//   const adminCatalogItem = useMemo(
//     () => (catalog || []).find((a) => a.addOnCode === "USER_ADMIN"),
//     [catalog]
//   );
//   const normalCatalogItem = useMemo(
//     () => (catalog || []).find((a) => a.addOnCode === "USER_NORMAL"),
//     [catalog]
//   );

//   const startingAdmin = sub?.adminUserCount ?? starter?.includedAdminUsers ?? 1;
//   const startingNormal = sub?.normalUserCount ?? starter?.includedNormalUsers ?? 4;
//   const minAdmin = mode === "downgrade" ? (starter?.includedAdminUsers ?? 1) : startingAdmin;
//   const maxAdmin = mode === "downgrade" ? startingAdmin : Infinity;
//   const minNormal = mode === "downgrade" ? (starter?.includedNormalUsers ?? 4) : startingNormal;
//   const maxNormal = mode === "downgrade" ? startingNormal : Infinity;

//   const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

//   const currentTotal = useMemo(() => {
//     let t = starter ? (billingCycle === "ANNUAL" ? starter.priceAnnual : starter.priceHalfYearly) : 0;

//     // 1. Calculate cost for current extra seats beyond included base
//     const currentExtraAdmin = Math.max(0, startingAdmin - (starter?.includedAdminUsers ?? 1));
//     const currentExtraNormal = Math.max(0, startingNormal - (starter?.includedNormalUsers ?? 4));

//     if (adminCatalogItem && currentExtraAdmin > 0) {
//       t += (perCycleRateFor(adminCatalogItem, billingCycle) || 0) * currentExtraAdmin;
//     }
//     if (normalCatalogItem && currentExtraNormal > 0) {
//       t += (perCycleRateFor(normalCatalogItem, billingCycle) || 0) * currentExtraNormal;
//     }

//     // 2. Add-on items (excluding seat codes to prevent double counting if present)
//     (sub?.addOns || []).forEach((line) => {
//       const item = (catalog || []).find((a) => a.addOnCode === line.addOnCode);
//       if (item && item.addOnCode !== "USER_ADMIN" && item.addOnCode !== "USER_NORMAL") {
//         t += (perCycleRateFor(item, billingCycle) || 0) * line.quantity;
//       }
//     });

//     return t;
//   }, [sub, catalog, starter, billingCycle, startingAdmin, startingNormal, adminCatalogItem, normalCatalogItem]);

//   const newTotal = useMemo(() => {
//     let t = starter ? (billingCycle === "ANNUAL" ? starter.priceAnnual : starter.priceHalfYearly) : 0;

//     // 1. Calculate cost for new selected extra seats beyond included base
//     const newExtraAdmin = Math.max(0, seats.adminUserCount - (starter?.includedAdminUsers ?? 1));
//     const newExtraNormal = Math.max(0, seats.normalUserCount - (starter?.includedNormalUsers ?? 4));

//     if (adminCatalogItem && newExtraAdmin > 0) {
//       t += (perCycleRateFor(adminCatalogItem, billingCycle) || 0) * newExtraAdmin;
//     }
//     if (normalCatalogItem && newExtraNormal > 0) {
//       t += (perCycleRateFor(normalCatalogItem, billingCycle) || 0) * newExtraNormal;
//     }

//     // 2. Standard module add-on items from ordered catalog
//     for (const item of orderedCatalog) {
//       const q = qty[item.addOnCode] || 0;
//       if (q > 0) t += (perCycleRateFor(item, billingCycle) || 0) * q;
//     }

//     return t;
//   }, [orderedCatalog, qty, starter, billingCycle, seats, adminCatalogItem, normalCatalogItem]);

//   const delta = newTotal - currentTotal;
//   const seatsChanged = seats.adminUserCount !== startingAdmin || seats.normalUserCount !== startingNormal;
//   const addOnsChanged = orderedCatalog.some((item) => (qty[item.addOnCode] || 0) !== (sub?.addOns?.find((l) => l.addOnCode === item.addOnCode)?.quantity || 0));
//   const hasChanges = seatsChanged || addOnsChanged;

//   const setItemQty = (code, v) => setQty((q) => ({ ...q, [code]: Math.max(0, v) }));
//   const toggleCheckbox = (code) => setItemQty(code, (qty[code] || 0) > 0 ? 0 : 1);

//   const afterLabel = (oldV, newV, checkbox) => {
//     if (oldV === newV) return "—";
//     if (checkbox) return newV > 0 ? <span className="ms-after-badge">Added</span> : <span className="ms-after-badge ms-after-badge--removed">Removed</span>;
//     return <span className="ms-after-badge">{oldV} → {newV}</span>;
//   };

//   const handleProceedFromStep1 = () => setStep(2);

//   const handleConfirm = async () => {
//     setSaving(true);
//     setError("");
//     try {
//       let updated = sub;
//       if (seatsChanged) {
//         updated = await updateSeats(seats.adminUserCount, seats.normalUserCount);
//       }
//       if (addOnsChanged) {
//         const payload = orderedCatalog
//           .map((item) => ({ addOnCode: item.addOnCode, quantity: qty[item.addOnCode] || 0 }))
//           .filter((l) => l.quantity > 0);
//         // Preserve any existing lines not shown in this wizard (defensive —
//         // shouldn't happen given WIZARD_ADDON_ORDER covers every
//         // PER_UNIT_MONTHLY code, but never silently drop an entitlement).
//         updated = await updateAddOns(payload);
//       }

//       const appliedImmediately =
//         (!seatsChanged || updated.adminUserCount === seats.adminUserCount) &&
//         (!addOnsChanged || !updated.pendingAddOnChange);

//       if (delta > 0 && appliedImmediately) {
//         const session = await startCheckout();
//         await new Promise((resolve, reject) => {
//           openRazorpayCheckout(session, {
//             description: mode === "upgrade" ? "Subscription upgrade" : "Subscription change",
//             onSuccess: resolve,
//             onDismiss: () => reject(new Error("Payment window closed before completing.")),
//             onError: reject,
//           });
//         });
//         setChargesNow(delta);
//       } else {
//         setChargesNow(0);
//       }

//       setResultSub(updated);
//       setStep(3);
//     } catch (err) {
//       console.error(err);
//       setError(err?.response?.data?.error || err?.message || "Couldn't save your changes. Please try again.");
//     } finally {
//       setSaving(false);
//     }
//   };

//   const handleDone = () => {
//     onComplete?.(resultSub);
//   };

//   return (
//     <div className="ms-modal-overlay" role="dialog" aria-modal="true">
//       <div className="ms-modal">
//         <button className="ms-modal-close" onClick={onClose} aria-label="Close">
//           <X size={18} />
//         </button>

//         <h2 className="ms-modal-title">
//           Manage your CalVant Subscription
//         </h2>

//         <div className="ms-stepper">
//           {STEPS.map((label, i) => (
//             <React.Fragment key={label}>
//               <div className={`ms-step ${step === i + 1 ? "ms-step--active" : step > i + 1 ? "ms-step--done" : ""}`}>
//                 <span className="ms-step-dot" />
//                 <span className="ms-step-label">{i === 0 ? (mode === "downgrade" ? "Downgrade Add-Ons" : label) : label}</span>
//               </div>
//               {i < STEPS.length - 1 && <span className="ms-step-line" />}
//             </React.Fragment>
//           ))}
//         </div>

//         {error && <div className="ms-error">{error}</div>}

//         {step === 1 && (
//           <>
//             <div className="ms-table-wrap">
//               <table className="ms-table">
//                 <thead>
//                   <tr>
//                     <th>ITEM</th>
//                     <th>NO. OF UNITS</th>
//                     <th>AFTER ADDITION</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   <tr>
//                     <td>
//                       <div className="ms-item-name">Additional admin users</div>
//                       <div className="ms-item-sub">Included: {starter?.includedAdminUsers ?? 1}</div>
//                     </td>
//                     <td>
//                       <NumberStepper
//                         value={seats.adminUserCount}
//                         min={minAdmin}
//                         max={maxAdmin}
//                         onChange={(v) => setSeats((s) => ({ ...s, adminUserCount: clamp(v, minAdmin, maxAdmin) }))}
//                       />
//                     </td>
//                     <td>{afterLabel(startingAdmin, seats.adminUserCount, false)}</td>
//                   </tr>
//                   <tr>
//                     <td>
//                       <div className="ms-item-name">Additional normal users</div>
//                       <div className="ms-item-sub">Included: {starter?.includedNormalUsers ?? 4}</div>
//                     </td>
//                     <td>
//                       <NumberStepper
//                         value={seats.normalUserCount}
//                         min={minNormal}
//                         max={maxNormal}
//                         onChange={(v) => setSeats((s) => ({ ...s, normalUserCount: clamp(v, minNormal, maxNormal) }))}
//                       />
//                     </td>
//                     <td>{afterLabel(startingNormal, seats.normalUserCount, false)}</td>
//                   </tr>

//                   {orderedCatalog.map((item) => {
//                     const isCheckbox = controlTypeFor(item.addOnCode) === CONTROL_CHECKBOX;
//                     const oldQty = sub?.addOns?.find((l) => l.addOnCode === item.addOnCode)?.quantity || 0;
//                     const curQty = qty[item.addOnCode] || 0;
//                     const rate = perCycleRateFor(item, billingCycle);
//                     return (
//                       <tr key={item.addOnCode}>
//                         <td>
//                           <div className="ms-item-name">{item.displayName}</div>
//                           <div className="ms-item-sub">
//                             {formatINR(rate)} / {billingCycle === "ANNUAL" ? "yr" : "6mo"}
//                             {isCheckbox ? "" : " per unit"}
//                           </div>
//                         </td>
//                         <td>
//                           {isCheckbox ? (
//                             <label className="ms-checkbox">
//                               <input
//                                 type="checkbox"
//                                 checked={curQty > 0}
//                                 disabled={mode === "downgrade" && oldQty === 0}
//                                 onChange={() => toggleCheckbox(item.addOnCode)}
//                               />
//                             </label>
//                           ) : (
//                             <NumberStepper
//                               value={curQty}
//                               min={mode === "downgrade" ? 0 : oldQty}
//                               max={mode === "downgrade" ? oldQty : Infinity}
//                               onChange={(v) => setItemQty(item.addOnCode, v)}
//                             />
//                           )}
//                         </td>
//                         <td>{afterLabel(oldQty, curQty, isCheckbox)}</td>
//                       </tr>
//                     );
//                   })}
//                 </tbody>
//               </table>
//             </div>

//             <div className="ms-amount-block">
//               <div className="ms-amount-label">
//                 {delta > 0 ? "Amount to be paid now" : delta < 0 ? "Credit — applied at renewal" : "No change in amount"}
//               </div>
//               <div className="ms-amount-value">{formatINR(Math.abs(delta))}</div>
//             </div>

//             <div className="ms-modal-actions">
//               <button className="ms-btn ms-btn--outline" onClick={onClose}>CANCEL</button>
//               <button className="ms-btn ms-btn--primary" disabled={!hasChanges} onClick={handleProceedFromStep1}>
//                 PROCEED
//               </button>
//             </div>
//           </>
//         )}

//         {step === 2 && (
//           <>
//             <button className="ms-back-link" onClick={() => setStep(1)}>
//               <ChevronLeft size={15} /> Back
//             </button>
//             <div className="ms-confirm-summary">
//               <h3>Review your changes</h3>
//               {seatsChanged && (
//                 <div className="ms-confirm-row">
//                   <span>Admin users</span>
//                   <span>{startingAdmin} → {seats.adminUserCount}</span>
//                 </div>
//               )}
//               {seatsChanged && (
//                 <div className="ms-confirm-row">
//                   <span>Normal users</span>
//                   <span>{startingNormal} → {seats.normalUserCount}</span>
//                 </div>
//               )}
//               {orderedCatalog.filter((item) => (qty[item.addOnCode] || 0) !== (sub?.addOns?.find((l) => l.addOnCode === item.addOnCode)?.quantity || 0)).map((item) => (
//                 <div className="ms-confirm-row" key={item.addOnCode}>
//                   <span>{item.displayName}</span>
//                   <span>{sub?.addOns?.find((l) => l.addOnCode === item.addOnCode)?.quantity || 0} → {qty[item.addOnCode] || 0}</span>
//                 </div>
//               ))}
//               <div className="ms-confirm-row ms-confirm-row--total">
//                 <span>{delta >= 0 ? "New per-cycle total" : "New per-cycle total (lower)"}</span>
//                 <span>{formatINR(newTotal)}</span>
//               </div>
//               <div className="ms-confirm-note">
//                 {delta > 0
//                   ? `You'll be charged ${formatINR(delta)} now if this takes effect immediately, or at your next renewal if it's queued.`
//                   : delta < 0
//                   ? "Reductions apply at the end of your current billing period, per your plan terms."
//                   : "No billing impact."}
//               </div>
//             </div>
//             <div className="ms-modal-actions">
//               <button className="ms-btn ms-btn--outline" onClick={onClose}>CANCEL</button>
//               <button className="ms-btn ms-btn--primary" disabled={saving} onClick={handleConfirm}>
//                 {saving ? <Loader2 size={15} className="ms-spin" /> : "CONFIRM & PROCEED"}
//               </button>
//             </div>
//           </>
//         )}

//         {step === 3 && (
//           <div className="ms-confirmation">
//             <CheckCircle2 size={44} className="ms-confirmation-icon" />
//             <h3>{mode === "downgrade" ? "Downgrade scheduled" : "Subscription updated"}</h3>
//             <p>
//               {chargesNow > 0
//                 ? `${formatINR(chargesNow)} was charged and your changes are live.`
//                 : mode === "downgrade"
//                 ? "Your reduced plan will take effect at the end of the current billing period."
//                 : "Your changes have been saved."}
//             </p>
//             <button className="ms-btn ms-btn--primary" onClick={handleDone}>Done</button>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// function NumberStepper({ value, min = 0, max = Infinity, onChange }) {
//   return (
//     <div className="ms-stepper-control">
//       <button type="button" disabled={value <= min} onClick={() => onChange(Math.max(min, value - 1))}>−</button>
//       <span>{value}</span>
//       <button type="button" disabled={value >= max} onClick={() => onChange(Math.min(max, value + 1))}>+</button>
//     </div>
//   );
// }

'use client'

import React, { useMemo, useState } from "react";
import { X, ChevronLeft, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { updateSeats, purchaseOrChangeAddOn, removeAddOn } from "../../api/adminBillingApi";
import { formatINR, perCycleRateFor } from "@/modules/billing/utils/billingFormat";
import { openRazorpayCheckout } from "./razorpayHelpers";
import { controlTypeFor, CONTROL_CHECKBOX, WIZARD_ADDON_ORDER } from "./subscriptionCatalogConfig";
import "./ManageSubscription.css";

const STEPS = ["Upgrade Add-Ons", "Confirm Order", "Confirmation"];

/**
 * mode: "upgrade" | "downgrade" — only changes the step-1 title/copy and
 * which direction the seat/quantity steppers are allowed to move; what
 * actually happens on confirm is identical either way (see handleConfirm).
 *
 * ── Why this file looks different from the old single-PATCH-then-checkout
 * version ──────────────────────────────────────────────────────────────────
 * Razorpay can't reconfigure a running subscription's quantity mid-cycle.
 * The backend now reflects that split:
 *
 *  - Seats (USER_ADMIN/USER_NORMAL) stay on the Starter subscription and are
 *    delta-charged server-side against the existing mandate
 *    (updateSeats → RazorpayProviderImpl.handleSubscriptionUpdate uses
 *    Razorpay's Subscription Add-on API, not a plan swap). No modal here.
 *
 *  - Every other catalog add-on (MODULE_DPIA, MODULE_VENDOR_MGMT,
 *    MODULE_AI_IMPACT, INTEGRATION_STANDARD) is its OWN Razorpay
 *    Subscription. Any nonzero quantity change — new, increased, or
 *    decreased — cancels the old one and creates a fresh one, which needs a
 *    fresh Checkout.js authorization. Dropping to zero is the one case
 *    that's just a cancellation (DELETE, no modal).
 *
 * That means a single "Confirm" click can now trigger: one silent PATCH for
 * seats, then a strictly sequential series of Razorpay popups — one per
 * changed add-on. We surface which item is being authorized via
 * `processingLabel` so this doesn't look like the UI has frozen, and we
 * keep going through the rest of the queue even if one item fails or is
 * dismissed, then report per-item results on the confirmation screen
 * instead of throwing the whole thing away.
 *
 * ⚠️ Known backend gap (flag for backend, not fixable from here):
 * purchaseOrChangeAddOn only writes Subscription.addOnSubscriptions, not
 * Subscription.addOns — and pricing/display (resolveTotalMinorUnits, this
 * wizard's own currentTotal/newTotal, ManageSubscription's details table)
 * all read Subscription.addOns. Until the backend keeps both in sync (or
 * pricing is repointed at addOnSubscriptions), the Net Total / per-cycle
 * totals shown here and on the main page will under-count add-ons bought
 * through this new flow. We refetch after every run so the UI shows
 * whatever the backend actually has — this is not a client-side caching bug.
 */
export default function UpgradeAddOnsWizard({ mode = "upgrade", sub, starter, catalog, billingCycle, onClose, onComplete }) {
  const [step, setStep] = useState(1);
  const [seats, setSeats] = useState({
    adminUserCount: sub?.adminUserCount ?? starter?.includedAdminUsers ?? 1,
    normalUserCount: sub?.normalUserCount ?? starter?.includedNormalUsers ?? 4,
  });
  const [qty, setQty] = useState(() => {
    const q = {};
    (sub?.addOns || []).forEach((line) => { q[line.addOnCode] = line.quantity; });
    return q;
  });
  const [saving, setSaving] = useState(false);
  const [processingLabel, setProcessingLabel] = useState("");
  const [error, setError] = useState("");
  const [itemResults, setItemResults] = useState([]); // [{ label, status: "ok"|"failed", detail? }]
  const [chargesNow, setChargesNow] = useState(0);

  const orderedCatalog = useMemo(() => {
    const byCode = {};
    (catalog || []).forEach((a) => { if (a.billingType === "PER_UNIT_MONTHLY") byCode[a.addOnCode] = a; });
    return WIZARD_ADDON_ORDER.map((code) => byCode[code]).filter(Boolean);
  }, [catalog]);

  const adminCatalogItem = useMemo(
    () => (catalog || []).find((a) => a.addOnCode === "USER_ADMIN"),
    [catalog]
  );
  const normalCatalogItem = useMemo(
    () => (catalog || []).find((a) => a.addOnCode === "USER_NORMAL"),
    [catalog]
  );

  const startingAdmin = sub?.adminUserCount ?? starter?.includedAdminUsers ?? 1;
  const startingNormal = sub?.normalUserCount ?? starter?.includedNormalUsers ?? 4;
  const minAdmin = mode === "downgrade" ? (starter?.includedAdminUsers ?? 1) : startingAdmin;
  const maxAdmin = mode === "downgrade" ? startingAdmin : Infinity;
  const minNormal = mode === "downgrade" ? (starter?.includedNormalUsers ?? 4) : startingNormal;
  const maxNormal = mode === "downgrade" ? startingNormal : Infinity;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const currentTotal = useMemo(() => {
    let t = starter ? (billingCycle === "ANNUAL" ? starter.priceAnnual : starter.priceHalfYearly) : 0;

    const currentExtraAdmin = Math.max(0, startingAdmin - (starter?.includedAdminUsers ?? 1));
    const currentExtraNormal = Math.max(0, startingNormal - (starter?.includedNormalUsers ?? 4));

    if (adminCatalogItem && currentExtraAdmin > 0) {
      t += (perCycleRateFor(adminCatalogItem, billingCycle) || 0) * currentExtraAdmin;
    }
    if (normalCatalogItem && currentExtraNormal > 0) {
      t += (perCycleRateFor(normalCatalogItem, billingCycle) || 0) * currentExtraNormal;
    }

    (sub?.addOns || []).forEach((line) => {
      const item = (catalog || []).find((a) => a.addOnCode === line.addOnCode);
      if (item && item.addOnCode !== "USER_ADMIN" && item.addOnCode !== "USER_NORMAL") {
        t += (perCycleRateFor(item, billingCycle) || 0) * line.quantity;
      }
    });

    return t;
  }, [sub, catalog, starter, billingCycle, startingAdmin, startingNormal, adminCatalogItem, normalCatalogItem]);

  const newTotal = useMemo(() => {
    let t = starter ? (billingCycle === "ANNUAL" ? starter.priceAnnual : starter.priceHalfYearly) : 0;

    const newExtraAdmin = Math.max(0, seats.adminUserCount - (starter?.includedAdminUsers ?? 1));
    const newExtraNormal = Math.max(0, seats.normalUserCount - (starter?.includedNormalUsers ?? 4));

    if (adminCatalogItem && newExtraAdmin > 0) {
      t += (perCycleRateFor(adminCatalogItem, billingCycle) || 0) * newExtraAdmin;
    }
    if (normalCatalogItem && newExtraNormal > 0) {
      t += (perCycleRateFor(normalCatalogItem, billingCycle) || 0) * newExtraNormal;
    }

    for (const item of orderedCatalog) {
      const q = qty[item.addOnCode] || 0;
      if (q > 0) t += (perCycleRateFor(item, billingCycle) || 0) * q;
    }

    return t;
  }, [orderedCatalog, qty, starter, billingCycle, seats, adminCatalogItem, normalCatalogItem]);

  const delta = newTotal - currentTotal;
  const seatsChanged = seats.adminUserCount !== startingAdmin || seats.normalUserCount !== startingNormal;

  // Per-add-on change list, computed once so step 1/2/confirm all agree on
  // exactly the same set of items.
  const addOnChanges = useMemo(() => {
    const changes = [];
    for (const item of orderedCatalog) {
      const oldQty = sub?.addOns?.find((l) => l.addOnCode === item.addOnCode)?.quantity || 0;
      const newQty = qty[item.addOnCode] || 0;
      if (newQty === oldQty) continue;
      changes.push({ item, oldQty, newQty, action: newQty === 0 ? "remove" : "checkout" });
    }
    return changes;
  }, [orderedCatalog, qty, sub]);

  const addOnsChanged = addOnChanges.length > 0;
  const hasChanges = seatsChanged || addOnsChanged;

  const setItemQty = (code, v) => setQty((q) => ({ ...q, [code]: Math.max(0, v) }));
  const toggleCheckbox = (code) => setItemQty(code, (qty[code] || 0) > 0 ? 0 : 1);

  const afterLabel = (oldV, newV, checkbox) => {
    if (oldV === newV) return "—";
    if (checkbox) return newV > 0 ? <span className="ms-after-badge">Added</span> : <span className="ms-after-badge ms-after-badge--removed">Removed</span>;
    return <span className="ms-after-badge">{oldV} → {newV}</span>;
  };

  const handleProceedFromStep1 = () => setStep(2);

  const handleConfirm = async () => {
    setSaving(true);
    setError("");
    const results = [];
    let seatsChargedNow = 0;

    try {
      // 1. Seats — one PATCH, charged (or queued) server-side. No popup.
      if (seatsChanged) {
        setProcessingLabel("Updating seats…");
        try {
          await updateSeats(seats.adminUserCount, seats.normalUserCount);
          const seatDelta =
            (adminCatalogItem ? (perCycleRateFor(adminCatalogItem, billingCycle) || 0)
              * (Math.max(0, seats.adminUserCount - (starter?.includedAdminUsers ?? 1))
                - Math.max(0, startingAdmin - (starter?.includedAdminUsers ?? 1))) : 0)
            + (normalCatalogItem ? (perCycleRateFor(normalCatalogItem, billingCycle) || 0)
              * (Math.max(0, seats.normalUserCount - (starter?.includedNormalUsers ?? 4))
                - Math.max(0, startingNormal - (starter?.includedNormalUsers ?? 4))) : 0);
          if (seatDelta > 0) seatsChargedNow = seatDelta;
          results.push({ label: "Seats", status: "ok" });
        } catch (err) {
          results.push({
            label: "Seats",
            status: "failed",
            detail: err?.response?.data?.error || err?.message || "Couldn't update seats.",
          });
        }
      }

      // 2. Removals — plain cancel-at-cycle-end, no payment, safe to do first.
      for (const { item } of addOnChanges.filter((c) => c.action === "remove")) {
        setProcessingLabel(`Removing ${item.displayName}…`);
        try {
          await removeAddOn(item.addOnCode);
          results.push({ label: item.displayName, status: "ok" });
        } catch (err) {
          results.push({
            label: item.displayName,
            status: "failed",
            detail: err?.response?.data?.error || err?.message || "Couldn't remove this add-on.",
          });
        }
      }

      // 3. New / changed quantities — each is its own Razorpay Subscription,
      // so each needs its own checkout + authorization. Strictly sequential:
      // Checkout.js only ever shows one modal at a time, and firing several
      // createAddOnSubscription calls in parallel would race on
      // Subscription.addOnSubscriptions writes.
      for (const { item, newQty } of addOnChanges.filter((c) => c.action === "checkout")) {
        setProcessingLabel(`Authorizing ${item.displayName}…`);
        try {
          const session = await purchaseOrChangeAddOn(item.addOnCode, newQty);
          await new Promise((resolve, reject) => {
            openRazorpayCheckout(session, {
              description: item.displayName,
              onSuccess: resolve,
              onDismiss: () => reject(new Error("Payment window closed before completing.")),
              onError: reject,
            });
          });
          results.push({ label: item.displayName, status: "ok" });
        } catch (err) {
          results.push({
            label: item.displayName,
            status: "failed",
            detail: err?.message || "Couldn't complete this add-on's payment.",
          });
          // Deliberately keep going — one declined/dismissed add-on shouldn't
          // block the rest of the queue (e.g. a seat change that already
          // succeeded, or other add-ons already authorized).
        }
      }

      setItemResults(results);
      setChargesNow(seatsChargedNow);
      setStep(3);
    } finally {
      setSaving(false);
      setProcessingLabel("");
    }
  };

  const handleDone = async () => {
    // Always refetch on the way out — some items may have partially
    // succeeded even if others failed, and totals depend on what the
    // backend actually persisted (see file header re: addOns vs
    // addOnSubscriptions).
    await onComplete?.(itemResults);
  };

  const anyFailed = itemResults.some((r) => r.status === "failed");

  return (
    <div className="ms-modal-overlay" role="dialog" aria-modal="true">
      <div className="ms-modal">
        <button className="ms-modal-close" onClick={onClose} aria-label="Close" disabled={saving}>
          <X size={18} />
        </button>

        <h2 className="ms-modal-title">
          Manage your CalVant Subscription
        </h2>

        <div className="ms-stepper">
          {STEPS.map((label, i) => (
            <React.Fragment key={label}>
              <div className={`ms-step ${step === i + 1 ? "ms-step--active" : step > i + 1 ? "ms-step--done" : ""}`}>
                <span className="ms-step-dot" />
                <span className="ms-step-label">{i === 0 ? (mode === "downgrade" ? "Downgrade Add-Ons" : label) : label}</span>
              </div>
              {i < STEPS.length - 1 && <span className="ms-step-line" />}
            </React.Fragment>
          ))}
        </div>

        {error && <div className="ms-error">{error}</div>}

        {step === 1 && (
          <>
            <div className="ms-table-wrap">
              <table className="ms-table">
                <thead>
                  <tr>
                    <th>ITEM</th>
                    <th>NO. OF UNITS</th>
                    <th>AFTER ADDITION</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <div className="ms-item-name">Additional admin users</div>
                      <div className="ms-item-sub">Included: {starter?.includedAdminUsers ?? 1}</div>
                    </td>
                    <td>
                      <NumberStepper
                        value={seats.adminUserCount}
                        min={minAdmin}
                        max={maxAdmin}
                        onChange={(v) => setSeats((s) => ({ ...s, adminUserCount: clamp(v, minAdmin, maxAdmin) }))}
                      />
                    </td>
                    <td>{afterLabel(startingAdmin, seats.adminUserCount, false)}</td>
                  </tr>
                  <tr>
                    <td>
                      <div className="ms-item-name">Additional normal users</div>
                      <div className="ms-item-sub">Included: {starter?.includedNormalUsers ?? 4}</div>
                    </td>
                    <td>
                      <NumberStepper
                        value={seats.normalUserCount}
                        min={minNormal}
                        max={maxNormal}
                        onChange={(v) => setSeats((s) => ({ ...s, normalUserCount: clamp(v, minNormal, maxNormal) }))}
                      />
                    </td>
                    <td>{afterLabel(startingNormal, seats.normalUserCount, false)}</td>
                  </tr>

                  {orderedCatalog.map((item) => {
                    const isCheckbox = controlTypeFor(item.addOnCode) === CONTROL_CHECKBOX;
                    const oldQty = sub?.addOns?.find((l) => l.addOnCode === item.addOnCode)?.quantity || 0;
                    const curQty = qty[item.addOnCode] || 0;
                    const rate = perCycleRateFor(item, billingCycle);
                    return (
                      <tr key={item.addOnCode}>
                        <td>
                          <div className="ms-item-name">{item.displayName}</div>
                          <div className="ms-item-sub">
                            {formatINR(rate)} / {billingCycle === "ANNUAL" ? "yr" : "6mo"}
                            {isCheckbox ? "" : " per unit"}
                          </div>
                        </td>
                        <td>
                          {isCheckbox ? (
                            <label className="ms-checkbox">
                              <input
                                type="checkbox"
                                checked={curQty > 0}
                                disabled={mode === "downgrade" && oldQty === 0}
                                onChange={() => toggleCheckbox(item.addOnCode)}
                              />
                            </label>
                          ) : (
                            <NumberStepper
                              value={curQty}
                              min={mode === "downgrade" ? 0 : oldQty}
                              max={mode === "downgrade" ? oldQty : Infinity}
                              onChange={(v) => setItemQty(item.addOnCode, v)}
                            />
                          )}
                        </td>
                        <td>{afterLabel(oldQty, curQty, isCheckbox)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="ms-amount-block">
              <div className="ms-amount-label">
                {delta > 0 ? "Estimated new per-cycle total" : delta < 0 ? "Estimated new per-cycle total (lower)" : "No change in amount"}
              </div>
              <div className="ms-amount-value">{formatINR(Math.abs(delta))}</div>
            </div>

            <div className="ms-modal-actions">
              <button className="ms-btn ms-btn--outline" onClick={onClose}>CANCEL</button>
              <button className="ms-btn ms-btn--primary" disabled={!hasChanges} onClick={handleProceedFromStep1}>
                PROCEED
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <button className="ms-back-link" onClick={() => setStep(1)}>
              <ChevronLeft size={15} /> Back
            </button>
            <div className="ms-confirm-summary">
              <h3>Review your changes</h3>
              {seatsChanged && (
                <>
                  <div className="ms-confirm-row">
                    <span>Admin users</span>
                    <span>{startingAdmin} → {seats.adminUserCount}</span>
                  </div>
                  <div className="ms-confirm-row">
                    <span>Normal users</span>
                    <span>{startingNormal} → {seats.normalUserCount}</span>
                  </div>
                  <div className="ms-confirm-note">
                    Charged (or credited) automatically against your card/mandate on file — no separate payment screen.
                  </div>
                </>
              )}
              {addOnChanges.map(({ item, oldQty, newQty, action }) => (
                <div className="ms-confirm-row" key={item.addOnCode}>
                  <span>{item.displayName}</span>
                  <span>{oldQty} → {newQty}</span>
                </div>
              ))}
              {addOnsChanged && (
                <div className="ms-confirm-note">
                  {addOnChanges.filter((c) => c.action === "checkout").length > 0 && (
                    <>Each new or changed add-on above opens its own quick Razorpay payment
                      screen, one after another — that's a Razorpay requirement, not a bug,
                      since each add-on is billed as its own subscription. </>
                  )}
                  {addOnChanges.some((c) => c.action === "remove") && (
                    <>Removed add-ons are cancelled immediately, effective at the end of
                      the current billing period — nothing to authorize.</>
                  )}
                </div>
              )}
              <div className="ms-confirm-row ms-confirm-row--total">
                <span>Estimated new per-cycle total</span>
                <span>{formatINR(newTotal)}</span>
              </div>
            </div>
            <div className="ms-modal-actions">
              <button className="ms-btn ms-btn--outline" onClick={onClose} disabled={saving}>CANCEL</button>
              <button className="ms-btn ms-btn--primary" disabled={saving} onClick={handleConfirm}>
                {saving ? (
                  <span className="ms-processing">
                    <Loader2 size={15} className="ms-spin" /> {processingLabel || "Processing…"}
                  </span>
                ) : "CONFIRM & PROCEED"}
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <div className="ms-confirmation">
            {anyFailed ? (
              <AlertTriangle size={44} className="ms-confirmation-icon ms-confirmation-icon--warn" />
            ) : (
              <CheckCircle2 size={44} className="ms-confirmation-icon" />
            )}
            <h3>{anyFailed ? "Some changes need another look" : mode === "downgrade" ? "Downgrade scheduled" : "Subscription updated"}</h3>

            {itemResults.length > 0 && (
              <ul className="ms-result-list">
                {itemResults.map((r, i) => (
                  <li key={i} className={r.status === "failed" ? "ms-result-item--failed" : "ms-result-item--ok"}>
                    <span>{r.label}</span>
                    <span>{r.status === "ok" ? "Done" : (r.detail || "Failed")}</span>
                  </li>
                ))}
              </ul>
            )}

            <p>
              {chargesNow > 0 && `${formatINR(chargesNow)} was charged for your seat change. `}
              {anyFailed
                ? "You can retry the failed item(s) from Manage Subscription — everything else above already took effect."
                : "Your changes have been saved."}
            </p>
            <button className="ms-btn ms-btn--primary" onClick={handleDone}>Done</button>
          </div>
        )}
      </div>
    </div>
  );
}

function NumberStepper({ value, min = 0, max = Infinity, onChange }) {
  return (
    <div className="ms-stepper-control">
      <button type="button" disabled={value <= min} onClick={() => onChange(Math.max(min, value - 1))}>−</button>
      <span>{value}</span>
      <button type="button" disabled={value >= max} onClick={() => onChange(Math.min(max, value + 1))}>+</button>
    </div>
  );
}