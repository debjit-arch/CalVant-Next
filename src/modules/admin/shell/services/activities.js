// //Working Model
// // ─── Endpoint ─────────────────────────────────────────────────────────────────
// const LOGGING_BASE_URL =
//   (typeof process !== "undefined" && process.env?.REACT_APP_LOGGING_SERVICE_URL) ||
//   (typeof import.meta !== "undefined" && import.meta.env?.VITE_LOGGING_SERVICE_URL) ||
//   "https://api.calvant.com/logging-service/api/logs";

// // ─── Action constants ─────────────────────────────────────────────────────────
// export const ACTIONS = {
//   PAGE_LOAD : "PAGE_LOAD",
//   LOGIN     : "LOGIN",
//   LOGOUT    : "LOGOUT",
//   CREATE    : "CREATE",
//   UPDATE    : "UPDATE",
//   DELETE    : "DELETE",
//   UPLOAD    : "UPLOAD",
//   DOWNLOAD  : "DOWNLOAD",
//   SELECT    : "SELECT",
//   CLICK     : "CLICK",
// };

// // ─── Module constants ─────────────────────────────────────────────────────────
// export const MODULES = {
//   AUTH       : "Auth",
//   RISK       : "Risk",
//   TASK       : "Task",
//   AUDIT      : "Audit",
//   COMPLIANCE : "Compliance",
//   TRUST      : "Trust",
//   TPRM       : "TPRM",
//   SYSTEM     : "System",
// };

// // ─── Recursion guard ──────────────────────────────────────────────────────────
// let _isSending = false;

// // ─── JWT decoder ─────────────────────────────────────────────────────────────
// /**
//  * JWT uses URL-safe Base64 (RFC 4648 §5).
//  * atob() only handles standard Base64, so we convert first.
//  */
// const decodeJwt = (token) => {
//   try {
//     if (!token) return {};
//     const base64 = token.split(".")[1];
//     if (!base64) return {};

//     // Convert URL-safe Base64 → standard Base64
//     const standard = base64.replace(/-/g, "+").replace(/_/g, "/");
//     // Pad to multiple of 4
//     const padded = standard + "=".repeat((4 - standard.length % 4) % 4);

//     return JSON.parse(atob(padded));
//   } catch {
//     return {};
//   }
// };

// // ─── User info resolver ───────────────────────────────────────────────────────
// /**
//  * Priority: JWT → sessionStorage → localStorage
//  * 
//  * Your JWT shape:
//  * { sub, role: ["root"], name, organization, iat, exp }
//  * Note: JWT key is "organization" NOT "organizationId"
//  */
// const getUserInfo = () => {
//   // 1. Try JWT first (most reliable)
//   const token = localStorage.getItem("token") || sessionStorage.getItem("token") || "";
//   const jwt   = decodeJwt(token);

//   if (jwt.sub || jwt.email) {
//     const roles = Array.isArray(jwt.role) ? jwt.role : [jwt.role].filter(Boolean);
//     return {
//       name           : jwt.name  || jwt.sub || "Unknown",
//       email          : jwt.email || jwt.sub || "",
//       role           : roles[0]  || "USER",
//       // YOUR JWT uses "organization" as the key — not "organizationId" or "orgId"
//       organizationId : jwt.organization || jwt.organizationId || jwt.orgId || "",
//     };
//   }

//   // 2. sessionStorage "user" object (set at login)
//   try {
//     const user = JSON.parse(sessionStorage.getItem("user") || "{}");
//     if (user.email) {
//       const roles = Array.isArray(user.role) ? user.role : [user.role].filter(Boolean);
//       return {
//         name           : user.name  || user.username || "Unknown",
//         email          : user.email,
//         role           : roles[0]   || "USER",
//         organizationId : user.organization || user.organizationId || user.orgId || "",
//       };
//     }
//   } catch { /* ignore */ }

//   // 3. localStorage fallbacks
//   return {
//     name           : localStorage.getItem("uname") || "Unknown",
//     email          : localStorage.getItem("email") || "",
//     role           : localStorage.getItem("role")  || "USER",
//     organizationId : localStorage.getItem("orgId") || "",
//   };
// };

// const getToken = () =>
//   localStorage.getItem("token") || sessionStorage.getItem("token") || "";

// // ─── Payload builder ──────────────────────────────────────────────────────────
// const buildPayload = ({ action, module: mod, item, url, name, email, role, organizationId }) => {
//   const user = getUserInfo();
//   return {
//     // Backend overwrites these from JWT — but we send them as fallback
//     name           : name           || user.name,
//     email          : email          || user.email,
//     role           : role           || user.role,
//     organizationId : organizationId || user.organizationId,
//     url            : url || (typeof window !== "undefined" ? window.location.pathname : "/"),
//     action         : action || ACTIONS.PAGE_LOAD,
//     module         : mod    || MODULES.SYSTEM,
//     item           : item !== undefined ? item : null,
//   };
// };

// // ─── Core: async POST ─────────────────────────────────────────────────────────
// export const captureActivity = async (params = {}) => {
//   if (_isSending) return;
//   _isSending = true;

//   try {
//     const payload = buildPayload(params);
//     const token   = getToken();

//     if (!token) {
//       // Don't log if not authenticated — avoids noise
//       return;
//     }

//     const response = await fetch(LOGGING_BASE_URL, {
//       method  : "POST",
//       headers : {
//         "Content-Type" : "application/json",
//         Authorization  : `Bearer ${token}`,
//         // Echo for gateway / direct-call compatibility
//         "X-User-Role"       : payload.role,
//         "X-Organization-Id" : payload.organizationId,
//       },
//       body: JSON.stringify(payload),
//     });

//     if (!response.ok) {
//       console.warn("[ActivityService] Log rejected:", response.status, response.statusText);
//     }
//   } catch (err) {
//     // Never crash the UI due to a logging error
//     console.warn("[ActivityService] Could not send log:", err?.message);
//   } finally {
//     _isSending = false;
//   }
// };

// // ─── Beacon (safe on page unload / tab close) ─────────────────────────────────
// export const beaconActivity = (params = {}) => {
//   try {
//     const payload = buildPayload(params);
//     const token   = getToken();
//     if (!token) return;

//     const blob = new Blob(
//       [JSON.stringify(payload)],
//       { type: "application/json" }
//     );
//     navigator.sendBeacon(LOGGING_BASE_URL, blob);
//   } catch (err) {
//     console.warn("[ActivityService] Beacon failed:", err?.message);
//   }
// };

// // ─── Convenience wrappers ─────────────────────────────────────────────────────
// export const logPageLoad = (url, mod = MODULES.SYSTEM, overrides = {}) =>
//   captureActivity({ action: ACTIONS.PAGE_LOAD, module: mod, item: null, url, ...overrides });

// export const logLogin = (overrides = {}) =>
//   captureActivity({ action: ACTIONS.LOGIN, module: MODULES.AUTH, item: null, ...overrides });

// export const logLogout = (overrides = {}) =>
//   captureActivity({ action: ACTIONS.LOGOUT, module: MODULES.AUTH, item: null, ...overrides });

// export const logCreate = (item, mod = MODULES.SYSTEM, overrides = {}) =>
//   captureActivity({ action: ACTIONS.CREATE, module: mod, item, ...overrides });

// export const logUpdate = (item, mod = MODULES.SYSTEM, overrides = {}) =>
//   captureActivity({ action: ACTIONS.UPDATE, module: mod, item, ...overrides });

// export const logDelete = (item, mod = MODULES.SYSTEM, overrides = {}) =>
//   captureActivity({ action: ACTIONS.DELETE, module: mod, item, ...overrides });

// export const logUpload = (item, mod = MODULES.SYSTEM, overrides = {}) =>
//   captureActivity({ action: ACTIONS.UPLOAD, module: mod, item, ...overrides });

// export const logDownload = (item, mod = MODULES.SYSTEM, overrides = {}) =>
//   captureActivity({ action: ACTIONS.DOWNLOAD, module: mod, item, ...overrides });

// export const logSelect = (item, mod = MODULES.SYSTEM, overrides = {}) =>
//   captureActivity({ action: ACTIONS.SELECT, module: mod, item, ...overrides });

// export const logClick = (item = null, mod = MODULES.SYSTEM, overrides = {}) =>
//   captureActivity({ action: ACTIONS.CLICK, module: mod, item, ...overrides });



//Working Model v2
// ─── Endpoint ─────────────────────────────────────────────────────────────────
// const LOGGING_BASE_URL =
//   (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_LOGGING_SERVICE_URL) ||
//   "https://api.calvant.com/logging-service/api/logs";

// // ─── Action constants ─────────────────────────────────────────────────────────
// export const ACTIONS = {
//   PAGE_LOAD : "PAGE_LOAD",
//   LOGIN     : "LOGIN",
//   LOGOUT    : "LOGOUT",
//   CREATE    : "CREATE",
//   UPDATE    : "UPDATE",
//   DELETE    : "DELETE",
//   UPLOAD    : "UPLOAD",
//   DOWNLOAD  : "DOWNLOAD",
//   SELECT    : "SELECT",
//   CLICK     : "CLICK",
// };

// // ─── Module constants ─────────────────────────────────────────────────────────
// export const MODULES = {
//   AUTH       : "Auth",
//   RISK       : "Risk",
//   TASK       : "Task",
//   AUDIT      : "Audit",
//   COMPLIANCE : "Compliance",
//   TRUST      : "Trust",
//   TPRM       : "TPRM",
//   AIIA       : "AIIA",
//   DASHBOARD  : "Dashboard",
//   SYSTEM     : "System",
// };

// // ─── JWT decoder ──────────────────────────────────────────────────────────────
// /**
//  * JWT uses URL-safe Base64 (RFC 4648 §5).
//  * atob() only handles standard Base64, so we convert first.
//  */
// const decodeJwt = (token) => {
//   try {
//     if (!token) return {};
//     const base64 = token.split(".")[1];
//     if (!base64) return {};
//     const standard = base64.replace(/-/g, "+").replace(/_/g, "/");
//     const padded   = standard + "=".repeat((4 - standard.length % 4) % 4);
//     return JSON.parse(atob(padded));
//   } catch {
//     return {};
//   }
// };

// // ─── Helpers ──────────────────────────────────────────────────────────────────
// /**
//  * Returns true only for genuine email addresses.
//  * Rejects MongoDB ObjectIds (24-char hex), empty strings,
//  * and placeholder values like "unknown@example.com".
//  */
// const isValidEmail = (val) => {
//   if (!val || typeof val !== "string") return false;
//   if (val === "unknown@example.com")   return false;
//   if (/^[a-f0-9]{24}$/i.test(val))    return false; // MongoDB ObjectId
//   return val.includes("@") && val.includes(".");
// };

// /**
//  * Returns true only for genuine display names.
//  * Rejects ObjectIds and generic fallbacks.
//  */
// const isValidName = (val) => {
//   if (!val || typeof val !== "string") return false;
//   if (val === "Unknown")               return false;
//   if (/^[a-f0-9]{24}$/i.test(val))    return false; // ObjectId stored as name
//   return val.trim().length > 0;
// };

// // ─── User info resolver ───────────────────────────────────────────────────────
// /**
//  * Priority order: sessionStorage "user" object → JWT → localStorage
//  *
//  * The "user" object set at login is the most reliable source because
//  * it was populated directly from the login API response with real field names.
//  *
//  * JWT note: your JWT sub = MongoDB ObjectId, NOT email.
//  * Only jwt.email (if present) is a real email. Never use jwt.sub as email.
//  *
//  * JWT shape: { sub: "<ObjectId>", role: ["root"], name, organization, iat, exp }
//  */
// const getUserInfo = () => {
//   // ── 1. sessionStorage "user" — set at login, most reliable ──────────────────
//   try {
//     const raw  = sessionStorage.getItem("user");
//     const user = raw ? JSON.parse(raw) : null;
//     if (user) {
//       const roles = Array.isArray(user.role) ? user.role : [user.role].filter(Boolean);
//       return {
//         name           : isValidName(user.name)    ? user.name
//                        : isValidName(user.username) ? user.username
//                        : "",
//         email          : isValidEmail(user.email)  ? user.email : "",
//         role           : roles[0] || "USER",
//         organizationId : user.organization || user.organizationId || user.orgId || "",
//       };
//     }
//   } catch { /* ignore */ }

//   // ── 2. JWT ───────────────────────────────────────────────────────────────────
//   const token = localStorage.getItem("token") || sessionStorage.getItem("token") || "";
//   const jwt   = decodeJwt(token);
//   if (token) {
//     const roles = Array.isArray(jwt.role) ? jwt.role : [jwt.role].filter(Boolean);
//     return {
//       name           : isValidName(jwt.name)    ? jwt.name : "",
//       // NEVER use jwt.sub as email — in CalVant it's a MongoDB ObjectId
//       email          : isValidEmail(jwt.email)  ? jwt.email : "",
//       role           : roles[0] || "USER",
//       organizationId : jwt.organization || jwt.organizationId || jwt.orgId || "",
//     };
//   }

//   // ── 3. localStorage last resort ───────────────────────────────────────────────
//   const lsEmail = localStorage.getItem("email") || "";
//   const lsName  = localStorage.getItem("uname") || "";
//   return {
//     name           : isValidName(lsName)   ? lsName  : "",
//     email          : isValidEmail(lsEmail) ? lsEmail : "",
//     role           : localStorage.getItem("role")  || "USER",
//     organizationId : localStorage.getItem("orgId") || "",
//   };
// };

// const getToken = () =>
//   localStorage.getItem("token") || sessionStorage.getItem("token") || "";

// // ─── Payload builder ──────────────────────────────────────────────────────────
// const buildPayload = ({ action, module: mod, item, url, name, email, role, organizationId }) => {
//   const user = getUserInfo();
//   return {
//     name           : name           || user.name           || "",
//     email          : email          || user.email          || "",
//     role           : role           || user.role           || "USER",
//     organizationId : organizationId || user.organizationId || "",
//     url            : url || (typeof window !== "undefined" ? window.location.pathname : "/"),
//     action         : action || ACTIONS.PAGE_LOAD,
//     module         : mod    || MODULES.SYSTEM,
//     item           : item !== undefined ? item : null,
//   };
// };

// // ─── Core: async POST ─────────────────────────────────────────────────────────
// /**
//  * FIX: replaced module-level _isSending boolean with a per-call debounce Map.
//  * The old boolean caused all subsequent logs to be silently dropped if any
//  * two log calls fired within the same tick (e.g. page load + click).
//  *
//  * New approach: deduplicate by (action + module + url) within a 500 ms window.
//  * This prevents duplicate logs from double-renders without blocking distinct events.
//  */
// const _recentKeys = new Map(); // key → timestamp

// const isDuplicate = (payload) => {
//   const key = `${payload.action}|${payload.module}|${payload.url}`;
//   const now  = Date.now();
//   const last = _recentKeys.get(key);
//   if (last && now - last < 500) return true; // same event within 500 ms → skip
//   _recentKeys.set(key, now);
//   // Clean up old keys to avoid memory leak
//   if (_recentKeys.size > 50) {
//     const oldest = [..._recentKeys.entries()].sort((a, b) => a[1] - b[1])[0];
//     _recentKeys.delete(oldest[0]);
//   }
//   return false;
// };

// export const captureActivity = async (params = {}) => {
//   try {
//     const token = getToken();
//     if (!token) return; // not authenticated — no noise

//     const payload = buildPayload(params);
//     if (isDuplicate(payload)) return; // suppress double-render duplicates

//     const response = await fetch(LOGGING_BASE_URL, {
//       method  : "POST",
//       headers : {
//         "Content-Type"      : "application/json",
//         Authorization       : `Bearer ${token}`,
//         "X-User-Role"       : payload.role,
//         "X-Organization-Id" : payload.organizationId,
//       },
//       body: JSON.stringify(payload),
//     });

//     if (!response.ok) {
//       console.warn("[ActivityService] Log rejected:", response.status, response.statusText);
//     }
//   } catch (err) {
//     // Never crash the UI due to a logging error
//     console.warn("[ActivityService] Could not send log:", err?.message);
//   }
// };

// // ─── Beacon (safe on page unload / tab close) ─────────────────────────────────
// export const beaconActivity = (params = {}) => {
//   try {
//     const token = getToken();
//     if (!token) return;

//     const payload = buildPayload(params);
//     const blob    = new Blob([JSON.stringify(payload)], { type: "application/json" });
//     navigator.sendBeacon(LOGGING_BASE_URL, blob);
//   } catch (err) {
//     console.warn("[ActivityService] Beacon failed:", err?.message);
//   }
// };

// // ─── Convenience wrappers ─────────────────────────────────────────────────────
// export const logPageLoad = (url, mod = MODULES.SYSTEM, overrides = {}) =>
//   captureActivity({ action: ACTIONS.PAGE_LOAD, module: mod, url, item: null, ...overrides });

// export const logLogin = (overrides = {}) =>
//   captureActivity({ action: ACTIONS.LOGIN, module: MODULES.AUTH, item: null, ...overrides });

// export const logLogout = (overrides = {}) =>
//   captureActivity({ action: ACTIONS.LOGOUT, module: MODULES.AUTH, item: null, ...overrides });

// export const logCreate = (item, mod = MODULES.SYSTEM, overrides = {}) =>
//   captureActivity({ action: ACTIONS.CREATE, module: mod, item, ...overrides });

// export const logUpdate = (item, mod = MODULES.SYSTEM, overrides = {}) =>
//   captureActivity({ action: ACTIONS.UPDATE, module: mod, item, ...overrides });

// export const logDelete = (item, mod = MODULES.SYSTEM, overrides = {}) =>
//   captureActivity({ action: ACTIONS.DELETE, module: mod, item, ...overrides });

// export const logUpload = (item, mod = MODULES.SYSTEM, overrides = {}) =>
//   captureActivity({ action: ACTIONS.UPLOAD, module: mod, item, ...overrides });

// export const logDownload = (item, mod = MODULES.SYSTEM, overrides = {}) =>
//   captureActivity({ action: ACTIONS.DOWNLOAD, module: mod, item, ...overrides });

// export const logSelect = (item, mod = MODULES.SYSTEM, overrides = {}) =>
//   captureActivity({ action: ACTIONS.SELECT, module: mod, item, ...overrides });

// export const logClick = (item = null, mod = MODULES.SYSTEM, overrides = {}) =>
//   captureActivity({ action: ACTIONS.CLICK, module: mod, item, ...overrides });

// ─── Endpoint ─────────────────────────────────────────────────────────────────
const LOGGING_BASE_URL =
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_LOGGING_SERVICE_URL) ||
  "https://api.calvant.com/logging-service/api/logs";

const USER_SERVICE_BASE =
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_BASE_URL) ||
  "https://api.calvant.com";

// ─── Action constants ─────────────────────────────────────────────────────────
export const ACTIONS = {
  PAGE_LOAD : "PAGE_LOAD",
  LOGIN     : "LOGIN",
  LOGOUT    : "LOGOUT",
  CREATE    : "CREATE",
  UPDATE    : "UPDATE",
  DELETE    : "DELETE",
  UPLOAD    : "UPLOAD",
  DOWNLOAD  : "DOWNLOAD",
  SELECT    : "SELECT",
  CLICK     : "CLICK",
};

// ─── Module constants ─────────────────────────────────────────────────────────
export const MODULES = {
  AUTH       : "Auth",
  RISK       : "Risk",
  TASK       : "Task",
  AUDIT      : "Audit",
  COMPLIANCE : "Compliance",
  TRUST      : "Trust",
  TPRM       : "TPRM",
  AIIA       : "AIIA",
  DASHBOARD  : "Dashboard",
  SYSTEM     : "System",
};

// ─── JWT decoder ──────────────────────────────────────────────────────────────
const decodeJwt = (token) => {
  try {
    if (!token) return {};
    const base64   = token.split(".")[1];
    if (!base64)   return {};
    const standard = base64.replace(/-/g, "+").replace(/_/g, "/");
    const padded   = standard + "=".repeat((4 - standard.length % 4) % 4);
    return JSON.parse(atob(padded));
  } catch {
    return {};
  }
};

// ─── Validation helpers ───────────────────────────────────────────────────────
const isValidEmail = (val) => {
  if (!val || typeof val !== "string") return false;
  if (val === "unknown@example.com")   return false;
  if (/^[a-f0-9]{24}$/i.test(val))    return false; // MongoDB ObjectId
  return val.includes("@") && val.includes(".");
};

const isValidName = (val) => {
  if (!val || typeof val !== "string") return false;
  if (val === "Unknown")               return false;
  if (/^[a-f0-9]{24}$/i.test(val))    return false;
  return val.trim().length > 0;
};

// ─── Email enrichment ─────────────────────────────────────────────────────────
/**
 * The CalVant login response does NOT include email.
 * This fetches it once from the user-service using the user's id,
 * caches it in sessionStorage as "userEmail", and enriches the stored
 * "user" object so future sessions don't need to re-fetch.
 *
 * Runs fire-and-forget — never blocks a log call.
 */
let _emailFetchAttempted = false;

const fetchAndCacheEmail = async () => {
  if (_emailFetchAttempted) return;
  _emailFetchAttempted = true;

  try {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token") || "";
    if (!token) return;

    const user = JSON.parse(sessionStorage.getItem("user") || "{}");
    const userId = user.id || user._id;
    if (!userId) return;

    // Already cached from a previous call this session
    if (isValidEmail(sessionStorage.getItem("userEmail"))) return;

    const res = await fetch(
      `${USER_SERVICE_BASE}/user-service/api/users/${userId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) return;

    const data = await res.json();

    // Find email in the response — try common field names
    const email = [data.email, data.emailId, data.userEmail, data.emailAddress, data.mail]
      .find(isValidEmail);

    if (email) {
      // Cache separately so it survives without modifying the original user object
      sessionStorage.setItem("userEmail", email);

      // Also enrich the stored user object for completeness
      const enriched = { ...user, email };
      sessionStorage.setItem("user", JSON.stringify(enriched));
    }
  } catch {
    // Never crash — this is background enrichment
  }
};

// ─── User info resolver ───────────────────────────────────────────────────────
/**
 * Login response shape (confirmed):
 * { token, id, name, role: ["root"], organization, departments, isAuditor }
 *
 * No email field — fetched async via fetchAndCacheEmail() and stored as
 * sessionStorage "userEmail".
 */
const getUserInfo = () => {
  try {
    const raw  = sessionStorage.getItem("user");
    const user = raw ? JSON.parse(raw) : null;

    if (user) {
      const roles = Array.isArray(user.role) ? user.role : [user.role].filter(Boolean);

      // Email: check enriched user object first, then the cached "userEmail" key
      const email = isValidEmail(user.email)
        ? user.email
        : (isValidEmail(sessionStorage.getItem("userEmail"))
            ? sessionStorage.getItem("userEmail")
            : "");

      const name = isValidName(user.name) ? user.name
                 : isValidName(user.username) ? user.username
                 : "";

      return {
        name,
        email,
        role           : roles[0] || "USER",
        organizationId : user.organization || user.organizationId || user.orgId || "",
      };
    }
  } catch { /* ignore */ }

  // JWT fallback
  const token = localStorage.getItem("token") || sessionStorage.getItem("token") || "";
  const jwt   = decodeJwt(token);
  if (token) {
    const roles    = Array.isArray(jwt.role) ? jwt.role : [jwt.role].filter(Boolean);
    const jwtEmail = [jwt.email, jwt.emailId, jwt.preferred_username].find(isValidEmail) || "";
    return {
      name           : isValidName(jwt.name) ? jwt.name : "",
      email          : jwtEmail,
      role           : roles[0] || "USER",
      organizationId : jwt.organization || jwt.organizationId || jwt.orgId || "",
    };
  }

  return {
    name           : "",
    email          : isValidEmail(sessionStorage.getItem("userEmail"))
                       ? sessionStorage.getItem("userEmail") : "",
    role           : "USER",
    organizationId : "",
  };
};

const getToken = () =>
  localStorage.getItem("token") || sessionStorage.getItem("token") || "";

// ─── Payload builder ──────────────────────────────────────────────────────────
const buildPayload = ({ action, module: mod, item, url, name, email, role, organizationId }) => {
  const user = getUserInfo();
  return {
    name           : name           || user.name           || "",
    email          : email          || user.email          || "",
    role           : role           || user.role           || "USER",
    organizationId : organizationId || user.organizationId || "",
    url            : url || (typeof window !== "undefined" ? window.location.pathname : "/"),
    action         : action || ACTIONS.PAGE_LOAD,
    module         : mod    || MODULES.SYSTEM,
    item           : item !== undefined ? item : null,
  };
};

// ─── Dedup guard ──────────────────────────────────────────────────────────────
// Prevents duplicate logs from React double-renders (500 ms window per unique event)
const _recentKeys = new Map();

const isDuplicate = (payload) => {
  const key  = `${payload.action}|${payload.module}|${payload.url}`;
  const now  = Date.now();
  const last = _recentKeys.get(key);
  if (last && now - last < 500) return true;
  _recentKeys.set(key, now);
  if (_recentKeys.size > 50) {
    const oldest = [..._recentKeys.entries()].sort((a, b) => a[1] - b[1])[0];
    _recentKeys.delete(oldest[0]);
  }
  return false;
};

// ─── Core: async POST ─────────────────────────────────────────────────────────
export const captureActivity = async (params = {}) => {
  try {
    const token = getToken();
    if (!token) return;

    // Kick off email enrichment in background (no-op after first attempt)
    fetchAndCacheEmail();

    const payload = buildPayload(params);
    if (isDuplicate(payload)) return;

    const response = await fetch(LOGGING_BASE_URL, {
      method  : "POST",
      headers : {
        "Content-Type"      : "application/json",
        Authorization       : `Bearer ${token}`,
        "X-User-Role"       : payload.role,
        "X-Organization-Id" : payload.organizationId,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.warn("[ActivityService] Log rejected:", response.status, response.statusText);
    }
  } catch (err) {
    console.warn("[ActivityService] Could not send log:", err?.message);
  }
};

// ─── Beacon (safe on page unload) ─────────────────────────────────────────────
export const beaconActivity = (params = {}) => {
  try {
    const token = getToken();
    if (!token) return;
    const payload = buildPayload(params);
    const blob    = new Blob([JSON.stringify(payload)], { type: "application/json" });
    navigator.sendBeacon(LOGGING_BASE_URL, blob);
  } catch (err) {
    console.warn("[ActivityService] Beacon failed:", err?.message);
  }
};

// ─── Convenience wrappers ─────────────────────────────────────────────────────
export const logPageLoad = (url, mod = MODULES.SYSTEM, overrides = {}) =>
  captureActivity({ action: ACTIONS.PAGE_LOAD, module: mod, url, item: null, ...overrides });

export const logLogin = (overrides = {}) =>
  captureActivity({ action: ACTIONS.LOGIN, module: MODULES.AUTH, item: null, ...overrides });

export const logLogout = (overrides = {}) =>
  captureActivity({ action: ACTIONS.LOGOUT, module: MODULES.AUTH, item: null, ...overrides });

export const logCreate = (item, mod = MODULES.SYSTEM, overrides = {}) =>
  captureActivity({ action: ACTIONS.CREATE, module: mod, item, ...overrides });

export const logUpdate = (item, mod = MODULES.SYSTEM, overrides = {}) =>
  captureActivity({ action: ACTIONS.UPDATE, module: mod, item, ...overrides });

export const logDelete = (item, mod = MODULES.SYSTEM, overrides = {}) =>
  captureActivity({ action: ACTIONS.DELETE, module: mod, item, ...overrides });

export const logUpload = (item, mod = MODULES.SYSTEM, overrides = {}) =>
  captureActivity({ action: ACTIONS.UPLOAD, module: mod, item, ...overrides });

export const logDownload = (item, mod = MODULES.SYSTEM, overrides = {}) =>
  captureActivity({ action: ACTIONS.DOWNLOAD, module: mod, item, ...overrides });

export const logSelect = (item, mod = MODULES.SYSTEM, overrides = {}) =>
  captureActivity({ action: ACTIONS.SELECT, module: mod, item, ...overrides });

export const logClick = (item = null, mod = MODULES.SYSTEM, overrides = {}) =>
  captureActivity({ action: ACTIONS.CLICK, module: mod, item, ...overrides });