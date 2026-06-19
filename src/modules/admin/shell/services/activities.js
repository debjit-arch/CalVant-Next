/**
 * activities.js
 * Sends user-activity logs to the Java Spring Boot logging-service.
 *
 * Payload shape (matches the Spring Boot controller):
 * {
 *   name   : string          – display name of the user
 *   email  : string          – user's email address
 *   url    : string          – page / route where the action occurred
 *   action : string          – PAGE_LOAD | CREATE | UPDATE | DELETE | SELECT | CLICK
 *   item   : object | array | null
 * }
 *
 * Safety rules enforced here:
 *  ① A recursion/concurrency guard prevents re-entrant log calls.
 *  ② All errors are silently swallowed so logging never breaks the UI.
 *  ③ beaconActivity uses sendBeacon (safe on page-unload / tab-close).
 */

// ─── Endpoint ────────────────────────────────────────────────────────────────
const LOGGING_BASE_URL =
  process.env.REACT_APP_LOGGING_SERVICE_URL ||
  "https://api.calvant.com/logging-service/api/logs";

// ─── Action constants ─────────────────────────────────────────────────────────
export const ACTIONS = {
  PAGE_LOAD: "PAGE_LOAD",
  CREATE:    "CREATE",
  UPDATE:    "UPDATE",
  DELETE:    "DELETE",
  SELECT:    "SELECT",
  CLICK:     "CLICK",
};

// ─── Recursion guard ──────────────────────────────────────────────────────────
// Prevents captureActivity from calling itself if some interceptor or
// middleware inadvertently triggers another log while one is in-flight.
let _isSending = false;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getUserInfo = () => {
  try {
    return JSON.parse(sessionStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
};

const getToken = () => localStorage.getItem("token") || "";

const buildPayload = ({ action, item, url, name, email }) => {
  const user = getUserInfo();
  return {
    name:   name  || user.name  || user.username || localStorage.getItem("uname") || "Unknown",
    email:  email || user.email || localStorage.getItem("email") || "unknown@example.com",
    url:    url   || (typeof window !== "undefined" ? window.location.pathname : "/"),
    action: action || ACTIONS.PAGE_LOAD,
    item:   item !== undefined ? item : null,   // explicit null when nothing clicked
  };
};

// ─── Core: async POST ─────────────────────────────────────────────────────────
/**
 * Captures a user activity and POSTs it to the logging-service.
 * ✅ The log is sent BEFORE awaiting any main-request response.
 * ✅ Even if the log POST fails the error is caught — nothing breaks.
 * ✅ Recursion guard ensures this never triggers itself again.
 *
 * @param {{ action, item?, url?, name?, email? }} params
 */
export const captureActivity = async ({ action, item, url, name, email } = {}) => {
  // ① Recursion guard
  if (_isSending) return;

  _isSending = true;
  try {
    const payload = buildPayload({ action, item, url, name, email });
    const token   = getToken();

    const response = await fetch(LOGGING_BASE_URL, {
      method:  "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.warn(
        "[ActivityService] Log rejected by server:",
        response.status,
        response.statusText
      );
    }
  } catch (err) {
    // ② Never crash the UI due to a logging error
    console.warn("[ActivityService] Could not send log:", err?.message);
  } finally {
    _isSending = false;   // ③ Always release the guard
  }
};

// ─── Fire-and-forget beacon (safe on page unload) ─────────────────────────────
/**
 * Use this inside `beforeunload` or `visibilitychange` handlers.
 * sendBeacon guarantees delivery even when the tab is closing.
 */
export const beaconActivity = ({ action, item, url, name, email } = {}) => {
  try {
    const payload = buildPayload({ action, item, url, name, email });
    const blob    = new Blob([JSON.stringify(payload)], { type: "application/json" });
    navigator.sendBeacon(LOGGING_BASE_URL, blob);
  } catch (err) {
    console.warn("[ActivityService] Beacon failed:", err?.message);
  }
};

// ─── Convenience wrappers ─────────────────────────────────────────────────────
export const logPageLoad = (url, overrides = {}) =>
  captureActivity({ action: ACTIONS.PAGE_LOAD, item: null, url, ...overrides });

export const logCreate = (item, overrides = {}) =>
  captureActivity({ action: ACTIONS.CREATE, item, ...overrides });

export const logUpdate = (item, overrides = {}) =>
  captureActivity({ action: ACTIONS.UPDATE, item, ...overrides });

export const logDelete = (item, overrides = {}) =>
  captureActivity({ action: ACTIONS.DELETE, item, ...overrides });

export const logSelect = (item, overrides = {}) =>
  captureActivity({ action: ACTIONS.SELECT, item, ...overrides });

export const logClick = (item = null, overrides = {}) =>
  captureActivity({ action: ACTIONS.CLICK, item, ...overrides });
