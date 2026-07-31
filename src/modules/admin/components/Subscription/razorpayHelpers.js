// /**
//  * razorpayHelpers.js
//  *
//  * Thin wrapper around Razorpay's Checkout.js, driven entirely by whatever
//  * ProviderCheckoutSession the backend returns from either:
//  *   - POST /api/billing/subscription/checkout            (recurring)
//  *   - POST /api/billing/subscription/checkout/one-time    (Policy Pack etc.)
//  *
//  * ⚠️ VERIFY FIELD NAMES against your actual ProviderCheckoutSession DTO — I
//  * haven't seen that class, only its usage sites. This helper reads several
//  * plausible field-name variants defensively (camelCase Java-serialized
//  * fields commonly show up as orderId/keyId/amount/currency, but Jackson
//  * config or a wrapper DTO could rename any of these). If Razorpay's modal
//  * doesn't open, log `session` and adjust the `pick()` fallbacks below —
//  * everything else in this file should keep working.
//  *
//  * If the backend ever returns a hosted `checkoutUrl` instead (e.g. a future
//  * non-Razorpay provider), we redirect instead of opening the JS modal —
//  * this was called out as the intended fallback in the original plan.
//  */

// let scriptLoadPromise = null;

// function loadRazorpayScript() {
//   if (typeof window === "undefined") return Promise.reject(new Error("No window"));
//   if (window.Razorpay) return Promise.resolve();
//   if (scriptLoadPromise) return scriptLoadPromise;

//   scriptLoadPromise = new Promise((resolve, reject) => {
//     const script = document.createElement("script");
//     script.src = "https://checkout.razorpay.com/v1/checkout.js";
//     script.async = true;
//     script.onload = () => resolve();
//     script.onerror = () => reject(new Error("Failed to load Razorpay checkout script."));
//     document.body.appendChild(script);
//   });
//   return scriptLoadPromise;
// }

// // Pull the first defined value out of a list of possible key names.
// function pick(obj, keys) {
//   for (const k of keys) {
//     if (obj && obj[k] !== undefined && obj[k] !== null) return obj[k];
//   }
//   return undefined;
// }

// /**
//  * @param {object} session - the ProviderCheckoutSession returned by the backend
//  * @param {object} opts
//  * @param {string} [opts.description]
//  * @param {() => void} opts.onSuccess     - called after Razorpay reports payment success
//  * @param {() => void} [opts.onDismiss]   - called if the user closes the modal without paying
//  * @param {(err: Error) => void} opts.onError
//  */
// export async function openRazorpayCheckout(session, { description, onSuccess, onDismiss, onError } = {}) {
//   try {
//     if (!session) throw new Error("No checkout session returned by the server.");

//     // Fallback path: a hosted checkout URL, no JS modal needed.
//     const hostedUrl = pick(session, ["checkoutUrl", "hostedUrl", "url"]);
//     if (hostedUrl) {
//       window.location.href = hostedUrl;
//       return;
//     }

//     await loadRazorpayScript();

//     // Confirmed against the real ProviderCheckoutSession.java (Jackson
//     // serializes bean getters as-is): { providerKeyId, providerOrderOrSubscriptionId,
//     // checkoutUrl, recurring, mockMode }. No amount/currency/contactEmail/orgName
//     // fields exist on this DTO at all — Razorpay's Checkout.js pulls
//     // amount/currency itself from the order_id/subscription_id you pass it,
//     // so leaving those undefined below is fine, not a bug.
//     const keyId = pick(session, ["providerKeyId", "keyId", "razorpayKeyId", "key"]);
//     const checkoutId = pick(session, [
//       "providerOrderOrSubscriptionId", "orderId", "providerOrderId", "id", "providerCheckoutId",
//     ]);
//     // Recurring flows (initiateCheckout) return a Razorpay Subscription id
//     // (sub_xxx) via createCheckoutSession; one-time flows return an Order id
//     // (order_xxx). Razorpay's Checkout.js takes these under DIFFERENT keys —
//     // subscription_id vs order_id — passing a sub_xxx id as order_id is
//     // invalid for the Subscriptions checkout contract even if it happens to
//     // render. `recurring` on the session tells us which case we're in.
//     const isRecurring = Boolean(pick(session, ["recurring", "isRecurring"]));
//     const amount = pick(session, ["amount", "amountMinorUnits", "totalMinorUnits"]);
//     const currency = pick(session, ["currency"]) || "INR";
//     const prefillEmail = pick(session, ["contactEmail", "email"]);
//     const prefillName = pick(session, ["orgName", "name"]);

//     if (!keyId || !checkoutId) {
//       throw new Error(
//         "Checkout session is missing providerKeyId/providerOrderOrSubscriptionId — got: "
//         + JSON.stringify(session)
//       );
//     }

//     const rzp = new window.Razorpay({
//       key: keyId,
//       ...(isRecurring ? { subscription_id: checkoutId } : { order_id: checkoutId, amount }),
//       currency,
//       name: "CalVant",
//       description: description || "CalVant subscription",
//       prefill: {
//         email: prefillEmail,
//         name: prefillName,
//       },
//       theme: { color: "#3b82f6" },
//       handler: function () {
//         onSuccess?.();
//       },
//       modal: {
//         ondismiss: function () {
//           onDismiss?.();
//         },
//       },
//     });

//     rzp.on("payment.failed", function (response) {
//       onError?.(new Error(response?.error?.description || "Payment failed."));
//     });

//     rzp.open();
//   } catch (err) {
//     onError?.(err instanceof Error ? err : new Error(String(err)));
//   }
// }

/**
 * razorpayHelpers.js
 *
 * Thin wrapper around Razorpay's Checkout.js, driven entirely by whatever
 * ProviderCheckoutSession the backend returns from any of:
 *   - POST /api/billing/subscription/checkout                 (Starter plan)
 *   - POST /api/billing/subscription/checkout/one-time         (Policy Pack etc.)
 *   - POST /api/billing/subscription/addons/{code}/checkout    (per-add-on subscription)
 *
 * All three return the same ProviderCheckoutSession shape, so this file
 * doesn't need to know which one it's opening — the caller just passes a
 * `description` for the modal header.
 *
 * ⚠️ VERIFY FIELD NAMES against your actual ProviderCheckoutSession DTO — I
 * confirmed this against provider/dto/ProviderCheckoutSession.java in the
 * billing-service source, which exposes providerKeyId /
 * providerOrderOrSubscriptionId / checkoutUrl / recurring / mockMode. Kept
 * the defensive pick() fallbacks below in case a serialization layer ever
 * renames these.
 *
 * MOCK MODE — added: the DTO carries mockMode=true whenever
 * RazorpayProviderImpl.mockMode is on. In that case
 * providerOrderOrSubscriptionId is a synthetic id that was never registered
 * with Razorpay — opening the real Checkout.js widget with it always fails
 * with a 400. The backend already writes the (synthetic) subscription id
 * onto the Subscription record the moment the session is created — see
 * SubscriptionService.purchaseOrChangeAddOn / initiateCheckout — so in mock
 * mode there is nothing left for the client to do; just report success
 * without ever touching window.Razorpay.
 */

let scriptLoadPromise = null;

function loadRazorpayScript() {
  if (typeof window === "undefined") return Promise.reject(new Error("No window"));
  if (window.Razorpay) return Promise.resolve();
  if (scriptLoadPromise) return scriptLoadPromise;

  scriptLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay checkout script."));
    document.body.appendChild(script);
  });
  return scriptLoadPromise;
}

// Pull the first defined value out of a list of possible key names.
function pick(obj, keys) {
  for (const k of keys) {
    if (obj && obj[k] !== undefined && obj[k] !== null) return obj[k];
  }
  return undefined;
}

/**
 * @param {object} session - the ProviderCheckoutSession returned by the backend
 * @param {object} opts
 * @param {string} [opts.description]
 * @param {() => void} opts.onSuccess     - called after Razorpay reports payment success
 *                                          (or immediately, in mock mode)
 * @param {() => void} [opts.onDismiss]   - called if the user closes the modal without paying
 * @param {(err: Error) => void} opts.onError
 */
export async function openRazorpayCheckout(session, { description, onSuccess, onDismiss, onError } = {}) {
  try {
    if (!session) throw new Error("No checkout session returned by the server.");

    // Mock mode: the backend already persisted this (fake) subscription id
    // onto the Subscription record synchronously. There's no real payment to
    // collect and no real webhook coming — opening Checkout.js would just
    // 400. Report success immediately instead.
    if (pick(session, ["mockMode", "isMockMode"])) {
      onSuccess?.();
      return;
    }

    // Fallback path: a hosted checkout URL, no JS modal needed.
    const hostedUrl = pick(session, ["checkoutUrl", "hostedUrl", "url"]);
    if (hostedUrl) {
      window.location.href = hostedUrl;
      return;
    }

    await loadRazorpayScript();

    const keyId = pick(session, ["providerKeyId", "keyId", "razorpayKeyId", "key"]);
    const checkoutId = pick(session, [
      "providerOrderOrSubscriptionId", "orderId", "providerOrderId", "id", "providerCheckoutId",
    ]);
    // Recurring flows (Starter checkout, and now every per-add-on checkout)
    // return a Razorpay Subscription id (sub_xxx); one-time flows return an
    // Order id (order_xxx). Checkout.js takes these under DIFFERENT keys —
    // subscription_id vs order_id.
    const isRecurring = Boolean(pick(session, ["recurring", "isRecurring"]));
    const amount = pick(session, ["amount", "amountMinorUnits", "totalMinorUnits"]);
    const currency = pick(session, ["currency"]) || "INR";
    const prefillEmail = pick(session, ["contactEmail", "email"]);
    const prefillName = pick(session, ["orgName", "name"]);

    if (!keyId || !checkoutId) {
      throw new Error(
        "Checkout session is missing providerKeyId/providerOrderOrSubscriptionId — got: "
        + JSON.stringify(session)
      );
    }

    const rzp = new window.Razorpay({
      key: keyId,
      ...(isRecurring ? { subscription_id: checkoutId } : { order_id: checkoutId, amount }),
      currency,
      name: "CalVant",
      description: description || "CalVant subscription",
      prefill: {
        email: prefillEmail,
        name: prefillName,
      },
      theme: { color: "#3b82f6" },
      handler: function () {
        onSuccess?.();
      },
      modal: {
        ondismiss: function () {
          onDismiss?.();
        },
      },
    });

    rzp.on("payment.failed", function (response) {
      onError?.(new Error(response?.error?.description || "Payment failed."));
    });

    rzp.open();
  } catch (err) {
    onError?.(err instanceof Error ? err : new Error(String(err)));
  }
}