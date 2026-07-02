// /// ─── Endpoint ────────────────────────────────────────────────────────────────
// const LOGGING_BASE_URL =
//   process.env.REACT_APP_LOGGING_SERVICE_URL ||
//   "https://api.calvant.com/logging-service/api/logs";

// const USER_SERVICE_BASE =
//   (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_BASE_URL) ||
//   "https://api.calvant.com";

// // ─── Action constants (FINALIZED — UAT item #2) ──────────────────────────────
// export const ACTIONS = {
//   VISITED   : "VISITED",
//   CLICK     : "CLICK",
//   CREATED   : "CREATED",
//   MODIFIED  : "MODIFIED",
//   UPDATED   : "UPDATED",
//   LOGGED_IN : "LOGGED_IN",
//   LOGOUT    : "LOGOUT",
//   DELETE    : "DELETE",
//   UPLOAD    : "UPLOAD",
//   DOWNLOAD  : "DOWNLOAD",
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

// // ─── Recursion guard ──────────────────────────────────────────────────────────
// // Prevents captureActivity from calling itself if some interceptor or
// // middleware inadvertently triggers another log while one is in-flight.
// let _isSending = false;

// // ─── Human-facing module allowlist (UAT item #3) ─────────────────────────────
// // Only these modules ever reach the logging service.
// // MODULES.SYSTEM is deliberately excluded — that is the catch-all for
// // infra / tech-layer events and must never appear in the human activity log.
// const HUMAN_MODULES = new Set([
//   MODULES.AUTH,
//   MODULES.RISK,
//   MODULES.TASK,
//   MODULES.AUDIT,
//   MODULES.COMPLIANCE,
//   MODULES.TRUST,
//   MODULES.TPRM,
//   MODULES.AIIA,
//   MODULES.DASHBOARD,
// ]);

// const SYSTEM_URL_PATTERNS = [
//   "/framework/controls",
//   "/framework/",
//   "/api/internal/",
//   "/_next/",
//   "/static/",
//   "/health",
//   "/actuator",
// ];

// const isSystemUrl = (url = "") => {
//   const u = url.toLowerCase();
//   return SYSTEM_URL_PATTERNS.some((p) => u.startsWith(p) || u.includes(p));
// };

// const isHumanEvent = (mod, url) => {
//   if (!HUMAN_MODULES.has(mod)) return false;
//   if (isSystemUrl(url)) return false;
//   return true;
// };

// // ─── JWT decoder ──────────────────────────────────────────────────────────────
// const decodeJwt = (token) => {
//   try {
//     if (!token) return {};
//     const base64 = token.split(".")[1];
//     if (!base64) return {};
//     const standard = base64.replace(/-/g, "+").replace(/_/g, "/");
//     const padded   = standard + "=".repeat((4 - (standard.length % 4)) % 4);
//     return JSON.parse(atob(padded));
//   } catch {
//     return {};
//   }
// };

// // ─── Validation helpers ───────────────────────────────────────────────────────
// const isValidEmail = (val) => {
//   if (!val || typeof val !== "string") return false;
//   if (val === "unknown@example.com") return false;
//   if (/^[a-f0-9]{24}$/i.test(val)) return false;
//   return val.includes("@") && val.includes(".");
// };

// const isValidName = (val) => {
//   if (!val || typeof val !== "string") return false;
//   if (val === "Unknown") return false;
//   if (/^[a-f0-9]{24}$/i.test(val)) return false;
//   return val.trim().length > 0;
// };

// // ─── Token helper ─────────────────────────────────────────────────────────────
// const getToken = () =>
//   localStorage.getItem("token") || sessionStorage.getItem("token") || "";

// // ─── User info resolver (FIX — UAT item #1) ──────────────────────────────────
// // JWT is ALWAYS the primary identity source. sessionStorage is only used to
// // enrich fields the JWT omits (typically the display name). This prevents
// // stale sessionStorage from a previous user's session poisoning log entries
// // in any module (Risk, Audit, or otherwise).
// //
// // Previous bug: sessionStorage was read first and JWT used only as a
// // staleness check — but the stale check only fired if BOTH sides had a
// // userId to compare. If either side was missing (common on fast page loads),
// // the check was silently skipped and wrong-user data passed through.
// const getUserInfo = () => {
//   const token = getToken();
//   const jwt   = decodeJwt(token);

//   // 1. Derive all identity fields from JWT unconditionally ──────────────────
//   const jwtRoles  = Array.isArray(jwt.role) ? jwt.role : [jwt.role].filter(Boolean);
//   const jwtEmail  = [jwt.email, jwt.emailId, jwt.preferred_username].find(isValidEmail) || "";
//   const jwtOrgId  = jwt.organization || jwt.organizationId || jwt.orgId || "";
//   const jwtUserId = jwt.id || jwt.userId || jwt.sub || "";
//   const jwtRole   = jwtRoles[0] || "USER";

//   // Start with whatever the JWT provides — these are authoritative
//   let resolvedName  = isValidName(jwt.name) ? jwt.name : "";
//   let resolvedEmail = jwtEmail; // never overridden below

//   // 2. sessionStorage: enrich name only, and only for the SAME user ─────────
//   try {
//     const raw  = sessionStorage.getItem("user");
//     const user = raw ? JSON.parse(raw) : null;

//     if (user) {
//       const storedUserId = user.id || user._id || user.userId || "";

//       // Stale if EITHER side has a userId and they don't match.
//       // Previous version required BOTH sides to have a userId — too lenient.
//       const isStale =
//         (jwtUserId || storedUserId) &&   // at least one side has an id
//         jwtUserId !== storedUserId;       // and they differ

//       if (isStale) {
//         // Wrong user in storage — clear immediately so nothing downstream
//         // can read it. All identity comes from JWT for this request.
//         console.warn(
//           "[ActivityService] Stale sessionStorage detected and cleared.",
//           `stored=${storedUserId} | jwt=${jwtUserId}`,
//         );
//         sessionStorage.removeItem("user");
//         sessionStorage.removeItem("userEmail");
//         // resolvedName and resolvedEmail already set from JWT above — fine.
//       } else {
//         // Same user: sessionStorage may have a richer display name
//         if (!resolvedName && isValidName(user.name)) {
//           resolvedName = user.name;
//         }
//         // Email: fill gap only — JWT is still authoritative
//         if (!resolvedEmail) {
//           const storedEmail = isValidEmail(user.email)
//             ? user.email
//             : isValidEmail(sessionStorage.getItem("userEmail"))
//               ? sessionStorage.getItem("userEmail")
//               : "";
//           resolvedEmail = storedEmail;
//         }
//       }
//     }
//   } catch {
//     // sessionStorage unavailable or corrupt — JWT values still valid
//   }

//   return {
//     name          : resolvedName,
//     email         : resolvedEmail,
//     role          : jwtRole,
//     organizationId: jwtOrgId,
//   };
// };

// // ─── Session reset (call on logout) ──────────────────────────────────────────
// export const resetActivitySession = () => {
//   _emailFetchAttempted = false;
// };

// // ─── Email enrichment (background, best-effort) ───────────────────────────────
// // Runs once per session to backfill email into sessionStorage if the JWT
// // doesn't carry it. Never blocks a log call.
// let _emailFetchAttempted = false;

// const fetchAndCacheEmail = async () => {
//   if (_emailFetchAttempted) return;
//   _emailFetchAttempted = true;

//   try {
//     const token = getToken();
//     if (!token) return;

//     // Only enrich for the current JWT user — not whatever is in sessionStorage
//     const jwt    = decodeJwt(token);
//     const userId = jwt.id || jwt.userId || jwt.sub || "";
//     if (!userId) return;

//     if (isValidEmail(sessionStorage.getItem("userEmail"))) return;

//     const res = await fetch(
//       `${USER_SERVICE_BASE}/user-service/api/users/${userId}`,
//       { headers: { Authorization: `Bearer ${token}` } },
//     );
//     if (!res.ok) return;

//     const data  = await res.json();
//     const email = [data.email, data.emailId, data.userEmail, data.emailAddress, data.mail]
//       .find(isValidEmail);

//     if (email) {
//       sessionStorage.setItem("userEmail", email);
//     }
//   } catch {
//     // Never crash — background enrichment only
//   }
// };

// // ─── Idempotency key ──────────────────────────────────────────────────────────
// const generateIdempotencyKey = () => {
//   if (typeof crypto !== "undefined" && crypto.randomUUID) {
//     return crypto.randomUUID();
//   }
//   return `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
// };

// // ─── Payload builder ──────────────────────────────────────────────────────────
// const buildPayload = ({ action, module: mod, item, url, name, email, role, organizationId }) => {
//   const user = getUserInfo();
//   return {
//     idempotencyKey : generateIdempotencyKey(),
//     name           : name || user.name || "",
//     email          : email || user.email || "",
//     role           : role || user.role || "USER",
//     organizationId : organizationId || user.organizationId || "",
//     url            : url || (typeof window !== "undefined" ? window.location.pathname : "/"),
//     action         : action || ACTIONS.VISITED,
//     module         : mod || MODULES.SYSTEM,
//     item           : item !== undefined ? item : null,
//   };
// };

// // ─── Dedup guard (FIX — UAT item #1, Bug B) ──────────────────────────────────
// // KEY CHANGE: the dedup key now includes the resolved email from the JWT
// // (via buildPayload → getUserInfo), not the raw sessionStorage value.
// // This means two different users visiting the same URL in quick succession
// // will have different keys (different emails) and both logs will be kept.
// //
// // Window is reduced to 300ms (was 500ms) — just enough to catch true
// // React Strict Mode double-invokes (which happen within ~10ms of each other),
// // while reducing the chance of swallowing a legitimate fast repeat action.
// const _recentKeys     = new Map();
// const DEDUP_WINDOW_MS = 300;
// const MAX_RECENT_KEYS = 200;

// const reserveIfNotDuplicate = (payload) => {
//   // Include email in the key — two different logged-in users are never dupes
//   const key = [
//     payload.action,
//     payload.module,
//     payload.url,
//     payload.email,           // was: payload.email || payload.name  (ambiguous)
//     payload.name,
//     payload.item == null ? "" : JSON.stringify(payload.item),
//   ].join("||");

//   const now  = Date.now();
//   const last = _recentKeys.get(key);

//   if (last && now - last < DEDUP_WINDOW_MS) {
//     return false; // true duplicate within window — discard
//   }

//   // Atomic reserve — no await between check and write
//   _recentKeys.set(key, now);

//   if (_recentKeys.size > MAX_RECENT_KEYS) {
//     const oldestKey = [..._recentKeys.entries()].sort((a, b) => a[1] - b[1])[0][0];
//     _recentKeys.delete(oldestKey);
//   }

//   return true;
// };

// // ─── Retry queue ──────────────────────────────────────────────────────────────
// const RETRY_CONFIG = {
//   MAX_RETRIES   : 3,
//   BASE_DELAY_MS : 2_000,
//   MAX_QUEUE_SIZE: 50,
// };

// const _retryQueue = [];
// let _flushPending = false;

// const scheduleFlush = (delayMs = RETRY_CONFIG.BASE_DELAY_MS) => {
//   if (_flushPending) return;
//   _flushPending = true;
//   setTimeout(flushRetryQueue, delayMs);
// };

// const enqueueRetry = (payload, token) => {
//   if (_retryQueue.length >= RETRY_CONFIG.MAX_QUEUE_SIZE) {
//     const dropped = _retryQueue.shift();
//     console.warn(
//       "[ActivityService] Retry queue full — dropping oldest:",
//       dropped.payload.action,
//       dropped.payload.url,
//     );
//   }
//   _retryQueue.push({
//     payload,
//     token,
//     attempts    : 0,
//     nextRetryAt : Date.now() + RETRY_CONFIG.BASE_DELAY_MS,
//   });
//   scheduleFlush(RETRY_CONFIG.BASE_DELAY_MS);
// };

// const postLog = async (payload, token) => {
//   return fetch(LOGGING_BASE_URL, {
//     method  : "POST",
//     headers : {
//       "Content-Type"      : "application/json",
//       Authorization       : `Bearer ${token}`,
//       "X-User-Role"       : payload.role,
//       "X-Organization-Id" : payload.organizationId,
//       "X-Idempotency-Key" : payload.idempotencyKey,
//     },
//     body: JSON.stringify(payload),
//   });
// };

// const flushRetryQueue = async () => {
//   _flushPending = false;
//   if (_retryQueue.length === 0) return;

//   const now      = Date.now();
//   const pending  = _retryQueue.filter((e) => e.nextRetryAt <= now);
//   const deferred = _retryQueue.filter((e) => e.nextRetryAt > now);

//   _retryQueue.length = 0;
//   _retryQueue.push(...deferred);

//   for (const entry of pending) {
//     try {
//       const res = await postLog(entry.payload, entry.token);

//       if (res.ok) {
//         console.info(
//           `[ActivityService] Retry succeeded (attempt ${entry.attempts + 1}):`,
//           entry.payload.action,
//           entry.payload.url,
//         );
//         continue;
//       }

//       throw new Error(`HTTP ${res.status}`);
//     } catch (err) {
//       entry.attempts++;

//       if (entry.attempts >= RETRY_CONFIG.MAX_RETRIES) {
//         console.warn(
//           `[ActivityService] Gave up after ${RETRY_CONFIG.MAX_RETRIES} retries:`,
//           entry.payload.action,
//           entry.payload.url,
//           "—", err?.message,
//         );
//         continue;
//       }

//       const delay       = RETRY_CONFIG.BASE_DELAY_MS * Math.pow(2, entry.attempts - 1);
//       entry.nextRetryAt = Date.now() + delay;
//       _retryQueue.push(entry);

//       console.warn(
//         `[ActivityService] Retry ${entry.attempts}/${RETRY_CONFIG.MAX_RETRIES} in ${delay / 1000}s:`,
//         entry.payload.action,
//         entry.payload.url,
//         "—", err?.message,
//       );
//     }
//   }

//   if (_retryQueue.length > 0) {
//     const nextDue = Math.min(..._retryQueue.map((e) => e.nextRetryAt));
//     scheduleFlush(Math.max(nextDue - Date.now(), 100));
//   }
// };

// // ─── Core: async POST ─────────────────────────────────────────────────────────
// export const captureActivity = async (params = {}) => {
//   try {
//     const token = getToken();
//     if (!token) return;

//     const mod = params.module || MODULES.SYSTEM;
//     const url = params.url || (typeof window !== "undefined" ? window.location.pathname : "/");

//     // UAT item #3: human-only gate — enforced at capture time, not display time
//     if (!isHumanEvent(mod, url)) return;

//     // Best-effort background email enrichment — never awaited, never blocking
//     fetchAndCacheEmail();

//     // Small delay for VISITED only — lets the JWT settle after a login redirect.
//     // The dedup reservation happens AFTER this, synchronously, so there is
//     // no race window opened by the await.
//     if (params.action === ACTIONS.VISITED) {
//       await new Promise((r) => setTimeout(r, 50));
//     }

//     const payload = buildPayload(params);

//     // Atomic check-and-reserve — no await inside, no race possible
//     if (!reserveIfNotDuplicate(payload)) return;

//     try {
//       const res = await postLog(payload, token);
//       if (!res.ok) {
//         console.warn("[ActivityService] Log rejected, queuing for retry:", res.status);
//         enqueueRetry(payload, token);
//       }
//     } catch (networkErr) {
//       console.warn("[ActivityService] Network failure, queuing for retry:", networkErr?.message);
//       enqueueRetry(payload, token);
//     }
//   } catch (err) {
//     console.warn("[ActivityService] Could not prepare log:", err?.message);
//   }
// };

// // ─── Beacon (safe on page unload) ────────────────────────────────────────────
// export const beaconActivity = (params = {}) => {
//   try {
//     const token = getToken();
//     if (!token) return;

//     const mod = params.module || MODULES.SYSTEM;
//     const url = params.url || (typeof window !== "undefined" ? window.location.pathname : "/");
//     if (!isHumanEvent(mod, url)) return;

//     const payload = buildPayload(params);
//     const blob    = new Blob([JSON.stringify(payload)], { type: "application/json" });
//     navigator.sendBeacon(LOGGING_BASE_URL, blob);
//   } catch (err) {
//     console.warn("[ActivityService] Beacon failed:", err?.message);
//   }
// };

// // ─── Convenience wrappers ─────────────────────────────────────────────────────

// /** User visited / navigated to a page */
// export const logPageLoad = (url, mod = MODULES.SYSTEM, overrides = {}) =>
//   captureActivity({ action: ACTIONS.VISITED, module: mod, url, item: null, ...overrides });

// /** User logged in */
// export const logLogin = (overrides = {}) =>
//   captureActivity({ action: ACTIONS.LOGGED_IN, module: MODULES.AUTH, item: null, ...overrides });

// /** User logged out */
// export const logLogout = (overrides = {}) =>
//   captureActivity({ action: ACTIONS.LOGOUT, module: MODULES.AUTH, item: null, ...overrides });

// /** A new record was created */
// export const logCreate = (item, mod = MODULES.SYSTEM, overrides = {}) =>
//   captureActivity({ action: ACTIONS.CREATED, module: mod, item, ...overrides });

// /** A record was fully saved / submitted */
// export const logUpdate = (item, mod = MODULES.SYSTEM, overrides = {}) =>
//   captureActivity({ action: ACTIONS.UPDATED, module: mod, item, ...overrides });

// /** A field or partial edit was modified */
// export const logModify = (item, mod = MODULES.SYSTEM, overrides = {}) =>
//   captureActivity({ action: ACTIONS.MODIFIED, module: mod, item, ...overrides });

// /** A record was deleted */
// export const logDelete = (item, mod = MODULES.SYSTEM, overrides = {}) =>
//   captureActivity({ action: ACTIONS.DELETE, module: mod, item, ...overrides });

// /** A file was uploaded */
// export const logUpload = (item, mod = MODULES.SYSTEM, overrides = {}) =>
//   captureActivity({ action: ACTIONS.UPLOAD, module: mod, item, ...overrides });

// /** A file was downloaded */
// export const logDownload = (item, mod = MODULES.SYSTEM, overrides = {}) =>
//   captureActivity({ action: ACTIONS.DOWNLOAD, module: mod, item, ...overrides });

// /** Backwards-compatible alias — writes CLICK */
// export const logSelect = (item, mod = MODULES.SYSTEM, overrides = {}) =>
//   captureActivity({ action: ACTIONS.CLICK, module: mod, item, ...overrides });

// /** A button / UI element was clicked */
// export const logClick = (item = null, mod = MODULES.SYSTEM, overrides = {}) =>
//   captureActivity({ action: ACTIONS.CLICK, module: mod, item, ...overrides });

////////////////////--------------------------------///////////////////////////////---------------------------------------------
//Duplicatelogs are showing
// /// ─── Endpoint ────────────────────────────────────────────────────────────────
// const LOGGING_BASE_URL =
//   process.env.REACT_APP_LOGGING_SERVICE_URL ||
//   "https://api.calvant.com/logging-service/api/logs";

// const USER_SERVICE_BASE =
//   (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_BASE_URL) ||
//   "https://api.calvant.com";

// // ─── Action constants (FINALIZED — UAT item #2) ──────────────────────────────
// export const ACTIONS = {
//   VISITED   : "VISITED",
//   CLICK     : "CLICK",
//   CREATED   : "CREATED",
//   MODIFIED  : "MODIFIED",
//   UPDATED   : "UPDATED",
//   LOGGED_IN : "LOGGED_IN",
//   LOGOUT    : "LOGOUT",
//   DELETE    : "DELETE",
//   UPLOAD    : "UPLOAD",
//   DOWNLOAD  : "DOWNLOAD",
// };

// // ─── Module constants ─────────────────────────────────────────────────────────
// // CHANGE: added DPIA and POLICIES, and FRAMEWORK_COMPLIANCE alongside the
// // legacy COMPLIANCE key (kept for backward compatibility with any existing
// // call sites still passing MODULES.COMPLIANCE — both resolve to the same
// // display label used by ListOfLogs.jsx's MODULE_LIST: "Framework Compliance").
// // If nothing else in the codebase still references MODULES.COMPLIANCE,
// // it's safe to remove it later and standardize on FRAMEWORK_COMPLIANCE only.
// export const MODULES = {
//   AUTH                 : "Auth",
//   RISK                 : "Risk",
//   TASK                 : "Task",
//   AUDIT                : "Audit",
//   COMPLIANCE           : "Framework Compliance", // legacy alias — same value as below
//   FRAMEWORK_COMPLIANCE : "Framework Compliance",
//   TRUST                : "Trust",
//   TPRM                 : "TPRM",
//   AIIA                 : "AIIA",
//   DASHBOARD            : "Dashboard",
//   DPIA                 : "DPIA",
//   POLICIES             : "Policies",
//   SYSTEM                : "System",
// };

// // ─── Recursion guard ──────────────────────────────────────────────────────────
// // Prevents captureActivity from calling itself if some interceptor or
// // middleware inadvertently triggers another log while one is in-flight.
// let _isSending = false;

// // ─── Human-facing module allowlist (UAT item #3) ─────────────────────────────
// // Only these modules ever reach the logging service.
// // MODULES.SYSTEM is deliberately excluded — that is the catch-all for
// // infra / tech-layer events and must never appear in the human activity log.
// //
// // CHANGE: added DPIA and POLICIES. Previously any captureActivity/logClick
// // call passing "DPIA" or "Policies" as the module would silently fail here
// // — isHumanEvent() would return false and the log would never be sent,
// // with no error surfaced anywhere.
// const HUMAN_MODULES = new Set([
//   MODULES.AUTH,
//   MODULES.RISK,
//   MODULES.TASK,
//   MODULES.AUDIT,
//   MODULES.FRAMEWORK_COMPLIANCE,
//   MODULES.TRUST,
//   MODULES.TPRM,
//   MODULES.AIIA,
//   MODULES.DASHBOARD,
//   MODULES.DPIA,
//   MODULES.POLICIES,
// ]);

// // CHANGE: narrowed the blanket "/framework/" prefix to specific admin/config
// // sub-paths only. The old blanket rule would block every Framework
// // Compliance module event from ever being sent, if that module's pages
// // live under /framework/*. Adjust the two entries below to match your
// // actual internal/admin routes if they differ.
// const SYSTEM_URL_PATTERNS = [
//   "/framework/controls",
//   "/framework/admin",
//   "/api/internal/",
//   "/_next/",
//   "/static/",
//   "/health",
//   "/actuator",
// ];

// const isSystemUrl = (url = "") => {
//   const u = url.toLowerCase();
//   return SYSTEM_URL_PATTERNS.some((p) => u.startsWith(p) || u.includes(p));
// };

// const isHumanEvent = (mod, url) => {
//   if (!HUMAN_MODULES.has(mod)) return false;
//   if (isSystemUrl(url)) return false;
//   return true;
// };

// // ─── JWT decoder ──────────────────────────────────────────────────────────────
// const decodeJwt = (token) => {
//   try {
//     if (!token) return {};
//     const base64 = token.split(".")[1];
//     if (!base64) return {};
//     const standard = base64.replace(/-/g, "+").replace(/_/g, "/");
//     const padded   = standard + "=".repeat((4 - (standard.length % 4)) % 4);
//     return JSON.parse(atob(padded));
//   } catch {
//     return {};
//   }
// };

// // ─── Validation helpers ───────────────────────────────────────────────────────
// const isValidEmail = (val) => {
//   if (!val || typeof val !== "string") return false;
//   if (val === "unknown@example.com") return false;
//   if (/^[a-f0-9]{24}$/i.test(val)) return false;
//   return val.includes("@") && val.includes(".");
// };

// const isValidName = (val) => {
//   if (!val || typeof val !== "string") return false;
//   if (val === "Unknown") return false;
//   if (/^[a-f0-9]{24}$/i.test(val)) return false;
//   return val.trim().length > 0;
// };

// // ─── Token helper ─────────────────────────────────────────────────────────────
// const getToken = () =>
//   localStorage.getItem("token") || sessionStorage.getItem("token") || "";

// // ─── User info resolver (FIX — UAT item #1) ──────────────────────────────────
// // JWT is ALWAYS the primary identity source. sessionStorage is only used to
// // enrich fields the JWT omits (typically the display name). This prevents
// // stale sessionStorage from a previous user's session poisoning log entries
// // in any module (Risk, Audit, or otherwise).
// //
// // Previous bug: sessionStorage was read first and JWT used only as a
// // staleness check — but the stale check only fired if BOTH sides had a
// // userId to compare. If either side was missing (common on fast page loads),
// // the check was silently skipped and wrong-user data passed through.
// const getUserInfo = () => {
//   const token = getToken();
//   const jwt   = decodeJwt(token);

//   // 1. Derive all identity fields from JWT unconditionally ──────────────────
//   const jwtRoles  = Array.isArray(jwt.role) ? jwt.role : [jwt.role].filter(Boolean);
//   const jwtEmail  = [jwt.email, jwt.emailId, jwt.preferred_username].find(isValidEmail) || "";
//   const jwtOrgId  = jwt.organization || jwt.organizationId || jwt.orgId || "";
//   const jwtUserId = jwt.id || jwt.userId || jwt.sub || "";
//   const jwtRole   = jwtRoles[0] || "USER";

//   // Start with whatever the JWT provides — these are authoritative
//   let resolvedName  = isValidName(jwt.name) ? jwt.name : "";
//   let resolvedEmail = jwtEmail; // never overridden below

//   // 2. sessionStorage: enrich name only, and only for the SAME user ─────────
//   try {
//     const raw  = sessionStorage.getItem("user");
//     const user = raw ? JSON.parse(raw) : null;

//     if (user) {
//       const storedUserId = user.id || user._id || user.userId || "";

//       // Stale if EITHER side has a userId and they don't match.
//       // Previous version required BOTH sides to have a userId — too lenient.
//       const isStale =
//         (jwtUserId || storedUserId) &&   // at least one side has an id
//         jwtUserId !== storedUserId;       // and they differ

//       if (isStale) {
//         // Wrong user in storage — clear immediately so nothing downstream
//         // can read it. All identity comes from JWT for this request.
//         console.warn(
//           "[ActivityService] Stale sessionStorage detected and cleared.",
//           `stored=${storedUserId} | jwt=${jwtUserId}`,
//         );
//         sessionStorage.removeItem("user");
//         sessionStorage.removeItem("userEmail");
//         // resolvedName and resolvedEmail already set from JWT above — fine.
//       } else {
//         // Same user: sessionStorage may have a richer display name
//         if (!resolvedName && isValidName(user.name)) {
//           resolvedName = user.name;
//         }
//         // Email: fill gap only — JWT is still authoritative
//         if (!resolvedEmail) {
//           const storedEmail = isValidEmail(user.email)
//             ? user.email
//             : isValidEmail(sessionStorage.getItem("userEmail"))
//               ? sessionStorage.getItem("userEmail")
//               : "";
//           resolvedEmail = storedEmail;
//         }
//       }
//     }
//   } catch {
//     // sessionStorage unavailable or corrupt — JWT values still valid
//   }

//   return {
//     name          : resolvedName,
//     email         : resolvedEmail,
//     role          : jwtRole,
//     organizationId: jwtOrgId,
//   };
// };

// // ─── Session reset (call on logout) ──────────────────────────────────────────
// export const resetActivitySession = () => {
//   _emailFetchAttempted = false;
// };

// // ─── Email enrichment (background, best-effort) ───────────────────────────────
// // Runs once per session to backfill email into sessionStorage if the JWT
// // doesn't carry it. Never blocks a log call.
// let _emailFetchAttempted = false;

// const fetchAndCacheEmail = async () => {
//   if (_emailFetchAttempted) return;
//   _emailFetchAttempted = true;

//   try {
//     const token = getToken();
//     if (!token) return;

//     // Only enrich for the current JWT user — not whatever is in sessionStorage
//     const jwt    = decodeJwt(token);
//     const userId = jwt.id || jwt.userId || jwt.sub || "";
//     if (!userId) return;

//     if (isValidEmail(sessionStorage.getItem("userEmail"))) return;

//     const res = await fetch(
//       `${USER_SERVICE_BASE}/user-service/api/users/${userId}`,
//       { headers: { Authorization: `Bearer ${token}` } },
//     );
//     if (!res.ok) return;

//     const data  = await res.json();
//     const email = [data.email, data.emailId, data.userEmail, data.emailAddress, data.mail]
//       .find(isValidEmail);

//     if (email) {
//       sessionStorage.setItem("userEmail", email);
//     }
//   } catch {
//     // Never crash — background enrichment only
//   }
// };

// // ─── Idempotency key ──────────────────────────────────────────────────────────
// const generateIdempotencyKey = () => {
//   if (typeof crypto !== "undefined" && crypto.randomUUID) {
//     return crypto.randomUUID();
//   }
//   return `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
// };

// // ─── Payload builder ──────────────────────────────────────────────────────────
// const buildPayload = ({ action, module: mod, item, url, name, email, role, organizationId }) => {
//   const user = getUserInfo();
//   return {
//     idempotencyKey : generateIdempotencyKey(),
//     name           : name || user.name || "",
//     email          : email || user.email || "",
//     role           : role || user.role || "USER",
//     organizationId : organizationId || user.organizationId || "",
//     url            : url || (typeof window !== "undefined" ? window.location.pathname : "/"),
//     action         : action || ACTIONS.VISITED,
//     module         : mod || MODULES.SYSTEM,
//     item           : item !== undefined ? item : null,
//   };
// };

// // ─── Dedup guard (FIX — UAT item #1, Bug B) ──────────────────────────────────
// // KEY CHANGE: the dedup key now includes the resolved email from the JWT
// // (via buildPayload → getUserInfo), not the raw sessionStorage value.
// // This means two different users visiting the same URL in quick succession
// // will have different keys (different emails) and both logs will be kept.
// //
// // Window is reduced to 300ms (was 500ms) — just enough to catch true
// // React Strict Mode double-invokes (which happen within ~10ms of each other),
// // while reducing the chance of swallowing a legitimate fast repeat action.
// const _recentKeys     = new Map();
// const DEDUP_WINDOW_MS = 300;
// const MAX_RECENT_KEYS = 200;

// const reserveIfNotDuplicate = (payload) => {
//   // Include email in the key — two different logged-in users are never dupes
//   const key = [
//     payload.action,
//     payload.module,
//     payload.url,
//     payload.email,           // was: payload.email || payload.name  (ambiguous)
//     payload.name,
//     payload.item == null ? "" : JSON.stringify(payload.item),
//   ].join("||");

//   const now  = Date.now();
//   const last = _recentKeys.get(key);

//   if (last && now - last < DEDUP_WINDOW_MS) {
//     return false; // true duplicate within window — discard
//   }

//   // Atomic reserve — no await between check and write
//   _recentKeys.set(key, now);

//   if (_recentKeys.size > MAX_RECENT_KEYS) {
//     const oldestKey = [..._recentKeys.entries()].sort((a, b) => a[1] - b[1])[0][0];
//     _recentKeys.delete(oldestKey);
//   }

//   return true;
// };

// // ─── Retry queue ──────────────────────────────────────────────────────────────
// const RETRY_CONFIG = {
//   MAX_RETRIES   : 3,
//   BASE_DELAY_MS : 2_000,
//   MAX_QUEUE_SIZE: 50,
// };

// const _retryQueue = [];
// let _flushPending = false;

// const scheduleFlush = (delayMs = RETRY_CONFIG.BASE_DELAY_MS) => {
//   if (_flushPending) return;
//   _flushPending = true;
//   setTimeout(flushRetryQueue, delayMs);
// };

// const enqueueRetry = (payload, token) => {
//   if (_retryQueue.length >= RETRY_CONFIG.MAX_QUEUE_SIZE) {
//     const dropped = _retryQueue.shift();
//     console.warn(
//       "[ActivityService] Retry queue full — dropping oldest:",
//       dropped.payload.action,
//       dropped.payload.url,
//     );
//   }
//   _retryQueue.push({
//     payload,
//     token,
//     attempts    : 0,
//     nextRetryAt : Date.now() + RETRY_CONFIG.BASE_DELAY_MS,
//   });
//   scheduleFlush(RETRY_CONFIG.BASE_DELAY_MS);
// };

// const postLog = async (payload, token) => {
//   return fetch(LOGGING_BASE_URL, {
//     method  : "POST",
//     headers : {
//       "Content-Type"      : "application/json",
//       Authorization       : `Bearer ${token}`,
//       "X-User-Role"       : payload.role,
//       "X-Organization-Id" : payload.organizationId,
//       "X-Idempotency-Key" : payload.idempotencyKey,
//     },
//     body: JSON.stringify(payload),
//   });
// };

// const flushRetryQueue = async () => {
//   _flushPending = false;
//   if (_retryQueue.length === 0) return;

//   const now      = Date.now();
//   const pending  = _retryQueue.filter((e) => e.nextRetryAt <= now);
//   const deferred = _retryQueue.filter((e) => e.nextRetryAt > now);

//   _retryQueue.length = 0;
//   _retryQueue.push(...deferred);

//   for (const entry of pending) {
//     try {
//       const res = await postLog(entry.payload, entry.token);

//       if (res.ok) {
//         console.info(
//           `[ActivityService] Retry succeeded (attempt ${entry.attempts + 1}):`,
//           entry.payload.action,
//           entry.payload.url,
//         );
//         continue;
//       }

//       throw new Error(`HTTP ${res.status}`);
//     } catch (err) {
//       entry.attempts++;

//       if (entry.attempts >= RETRY_CONFIG.MAX_RETRIES) {
//         console.warn(
//           `[ActivityService] Gave up after ${RETRY_CONFIG.MAX_RETRIES} retries:`,
//           entry.payload.action,
//           entry.payload.url,
//           "—", err?.message,
//         );
//         continue;
//       }

//       const delay       = RETRY_CONFIG.BASE_DELAY_MS * Math.pow(2, entry.attempts - 1);
//       entry.nextRetryAt = Date.now() + delay;
//       _retryQueue.push(entry);

//       console.warn(
//         `[ActivityService] Retry ${entry.attempts}/${RETRY_CONFIG.MAX_RETRIES} in ${delay / 1000}s:`,
//         entry.payload.action,
//         entry.payload.url,
//         "—", err?.message,
//       );
//     }
//   }

//   if (_retryQueue.length > 0) {
//     const nextDue = Math.min(..._retryQueue.map((e) => e.nextRetryAt));
//     scheduleFlush(Math.max(nextDue - Date.now(), 100));
//   }
// };

// // ─── Core: async POST ─────────────────────────────────────────────────────────
// export const captureActivity = async (params = {}) => {
//   try {
//     const token = getToken();
//     if (!token) return;

//     const mod = params.module || MODULES.SYSTEM;
//     const url = params.url || (typeof window !== "undefined" ? window.location.pathname : "/");

//     // UAT item #3: human-only gate — enforced at capture time, not display time
//     if (!isHumanEvent(mod, url)) return;

//     // Best-effort background email enrichment — never awaited, never blocking
//     fetchAndCacheEmail();

//     // Small delay for VISITED only — lets the JWT settle after a login redirect.
//     // The dedup reservation happens AFTER this, synchronously, so there is
//     // no race window opened by the await.
//     if (params.action === ACTIONS.VISITED) {
//       await new Promise((r) => setTimeout(r, 50));
//     }

//     const payload = buildPayload(params);

//     // Atomic check-and-reserve — no await inside, no race possible
//     if (!reserveIfNotDuplicate(payload)) return;

//     try {
//       const res = await postLog(payload, token);
//       if (!res.ok) {
//         console.warn("[ActivityService] Log rejected, queuing for retry:", res.status);
//         enqueueRetry(payload, token);
//       }
//     } catch (networkErr) {
//       console.warn("[ActivityService] Network failure, queuing for retry:", networkErr?.message);
//       enqueueRetry(payload, token);
//     }
//   } catch (err) {
//     console.warn("[ActivityService] Could not prepare log:", err?.message);
//   }
// };

// // ─── Beacon (safe on page unload) ────────────────────────────────────────────
// export const beaconActivity = (params = {}) => {
//   try {
//     const token = getToken();
//     if (!token) return;

//     const mod = params.module || MODULES.SYSTEM;
//     const url = params.url || (typeof window !== "undefined" ? window.location.pathname : "/");
//     if (!isHumanEvent(mod, url)) return;

//     const payload = buildPayload(params);
//     const blob    = new Blob([JSON.stringify(payload)], { type: "application/json" });
//     navigator.sendBeacon(LOGGING_BASE_URL, blob);
//   } catch (err) {
//     console.warn("[ActivityService] Beacon failed:", err?.message);
//   }
// };

// // ─── Convenience wrappers ─────────────────────────────────────────────────────

// /** User visited / navigated to a page */
// export const logPageLoad = (url, mod = MODULES.SYSTEM, overrides = {}) =>
//   captureActivity({ action: ACTIONS.VISITED, module: mod, url, item: null, ...overrides });

// /** User logged in */
// export const logLogin = (overrides = {}) =>
//   captureActivity({ action: ACTIONS.LOGGED_IN, module: MODULES.AUTH, item: null, ...overrides });

// /** User logged out */
// export const logLogout = (overrides = {}) =>
//   captureActivity({ action: ACTIONS.LOGOUT, module: MODULES.AUTH, item: null, ...overrides });

// /** A new record was created */
// export const logCreate = (item, mod = MODULES.SYSTEM, overrides = {}) =>
//   captureActivity({ action: ACTIONS.CREATED, module: mod, item, ...overrides });

// /** A record was fully saved / submitted */
// export const logUpdate = (item, mod = MODULES.SYSTEM, overrides = {}) =>
//   captureActivity({ action: ACTIONS.UPDATED, module: mod, item, ...overrides });

// /** A field or partial edit was modified */
// export const logModify = (item, mod = MODULES.SYSTEM, overrides = {}) =>
//   captureActivity({ action: ACTIONS.MODIFIED, module: mod, item, ...overrides });

// /** A record was deleted */
// export const logDelete = (item, mod = MODULES.SYSTEM, overrides = {}) =>
//   captureActivity({ action: ACTIONS.DELETE, module: mod, item, ...overrides });

// /** A file was uploaded */
// export const logUpload = (item, mod = MODULES.SYSTEM, overrides = {}) =>
//   captureActivity({ action: ACTIONS.UPLOAD, module: mod, item, ...overrides });

// /** A file was downloaded */
// export const logDownload = (item, mod = MODULES.SYSTEM, overrides = {}) =>
//   captureActivity({ action: ACTIONS.DOWNLOAD, module: mod, item, ...overrides });

// /** Backwards-compatible alias — writes CLICK */
// export const logSelect = (item, mod = MODULES.SYSTEM, overrides = {}) =>
//   captureActivity({ action: ACTIONS.CLICK, module: mod, item, ...overrides });

// /** A button / UI element was clicked */
// export const logClick = (item = null, mod = MODULES.SYSTEM, overrides = {}) =>
//   captureActivity({ action: ACTIONS.CLICK, module: mod, item, ...overrides });

////////////////////////+++++++++++++++++++++++++++++++++++++++++++++++++++++++//////////////////////////////////////////////
/// ─── Endpoint ────────────────────────────────────────────────────────────────
const LOGGING_BASE_URL =
  process.env.REACT_APP_LOGGING_SERVICE_URL ||
  "https://api.calvant.com/logging-service/api/logs";

const USER_SERVICE_BASE =
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_BASE_URL) ||
  "https://api.calvant.com";

// ─── Action constants (FINALIZED — UAT item #2) ──────────────────────────────
export const ACTIONS = {
  VISITED   : "VISITED",
  CLICK     : "CLICK",
  CREATED   : "CREATED",
  MODIFIED  : "MODIFIED",
  UPDATED   : "UPDATED",
  LOGGED_IN : "LOGGED_IN",
  LOGOUT    : "LOGOUT",
  DELETE    : "DELETE",
  UPLOAD    : "UPLOAD",
  DOWNLOAD  : "DOWNLOAD",
};

// ─── Module constants ─────────────────────────────────────────────────────────
export const MODULES = {
  AUTH                 : "Auth",
  RISK                 : "Risk",
  TASK                 : "Task",
  AUDIT                : "Audit",
  COMPLIANCE           : "Framework Compliance", // legacy alias — same value as below
  FRAMEWORK_COMPLIANCE : "Framework Compliance",
  TRUST                : "Trust",
  TPRM                 : "TPRM",
  AIIA                 : "AIIA",
  DASHBOARD            : "Dashboard",
  DPIA                 : "DPIA",
  POLICIES             : "Policies",
  SYSTEM                : "System",
};

// ─── Recursion guard ──────────────────────────────────────────────────────────
let _isSending = false;

// ─── Human-facing module allowlist (UAT item #3) ─────────────────────────────
const HUMAN_MODULES = new Set([
  MODULES.AUTH,
  MODULES.RISK,
  MODULES.TASK,
  MODULES.AUDIT,
  MODULES.FRAMEWORK_COMPLIANCE,
  MODULES.TRUST,
  MODULES.TPRM,
  MODULES.AIIA,
  MODULES.DASHBOARD,
  MODULES.DPIA,
  MODULES.POLICIES,
]);

const SYSTEM_URL_PATTERNS = [
  "/framework/controls",
  "/framework/admin",
  "/api/internal/",
  "/_next/",
  "/static/",
  "/health",
  "/actuator",
];

const isSystemUrl = (url = "") => {
  const u = url.toLowerCase();
  return SYSTEM_URL_PATTERNS.some((p) => u.startsWith(p) || u.includes(p));
};

const isHumanEvent = (mod, url) => {
  if (!HUMAN_MODULES.has(mod)) return false;
  if (isSystemUrl(url)) return false;
  return true;
};

// ─── JWT decoder ──────────────────────────────────────────────────────────────
const decodeJwt = (token) => {
  try {
    if (!token) return {};
    const base64 = token.split(".")[1];
    if (!base64) return {};
    const standard = base64.replace(/-/g, "+").replace(/_/g, "/");
    const padded   = standard + "=".repeat((4 - (standard.length % 4)) % 4);
    return JSON.parse(atob(padded));
  } catch {
    return {};
  }
};

// ─── Validation helpers ───────────────────────────────────────────────────────
const isValidEmail = (val) => {
  if (!val || typeof val !== "string") return false;
  if (val === "unknown@example.com") return false;
  if (/^[a-f0-9]{24}$/i.test(val)) return false;
  return val.includes("@") && val.includes(".");
};

const isValidName = (val) => {
  if (!val || typeof val !== "string") return false;
  if (val === "Unknown") return false;
  if (/^[a-f0-9]{24}$/i.test(val)) return false;
  return val.trim().length > 0;
};

// ─── Token helper ─────────────────────────────────────────────────────────────
const getToken = () =>
  localStorage.getItem("token") || sessionStorage.getItem("token") || "";

// ─── User info resolver (FIX — UAT item #1) ──────────────────────────────────
const getUserInfo = () => {
  const token = getToken();
  const jwt   = decodeJwt(token);

  const jwtRoles  = Array.isArray(jwt.role) ? jwt.role : [jwt.role].filter(Boolean);
  const jwtEmail  = [jwt.email, jwt.emailId, jwt.preferred_username].find(isValidEmail) || "";
  const jwtOrgId  = jwt.organization || jwt.organizationId || jwt.orgId || "";
  const jwtUserId = jwt.id || jwt.userId || jwt.sub || "";
  const jwtRole   = jwtRoles[0] || "USER";

  let resolvedName  = isValidName(jwt.name) ? jwt.name : "";
  let resolvedEmail = jwtEmail;

  try {
    const raw  = sessionStorage.getItem("user");
    const user = raw ? JSON.parse(raw) : null;

    if (user) {
      const storedUserId = user.id || user._id || user.userId || "";

      const isStale =
        (jwtUserId || storedUserId) &&
        jwtUserId !== storedUserId;

      if (isStale) {
        console.warn(
          "[ActivityService] Stale sessionStorage detected and cleared.",
          `stored=${storedUserId} | jwt=${jwtUserId}`,
        );
        sessionStorage.removeItem("user");
        sessionStorage.removeItem("userEmail");
      } else {
        if (!resolvedName && isValidName(user.name)) {
          resolvedName = user.name;
        }
        if (!resolvedEmail) {
          const storedEmail = isValidEmail(user.email)
            ? user.email
            : isValidEmail(sessionStorage.getItem("userEmail"))
              ? sessionStorage.getItem("userEmail")
              : "";
          resolvedEmail = storedEmail;
        }
      }
    }
  } catch {
    // sessionStorage unavailable or corrupt — JWT values still valid
  }

  return {
    name          : resolvedName,
    email         : resolvedEmail,
    role          : jwtRole,
    organizationId: jwtOrgId,
  };
};

// ─── Session reset (call on logout) ──────────────────────────────────────────
export const resetActivitySession = () => {
  _emailFetchAttempted = false;
};

// ─── Email enrichment (background, best-effort) ───────────────────────────────
let _emailFetchAttempted = false;

const fetchAndCacheEmail = async () => {
  if (_emailFetchAttempted) return;
  _emailFetchAttempted = true;

  try {
    const token = getToken();
    if (!token) return;

    const jwt    = decodeJwt(token);
    const userId = jwt.id || jwt.userId || jwt.sub || "";
    if (!userId) return;

    if (isValidEmail(sessionStorage.getItem("userEmail"))) return;

    const res = await fetch(
      `${USER_SERVICE_BASE}/user-service/api/users/${userId}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!res.ok) return;

    const data  = await res.json();
    const email = [data.email, data.emailId, data.userEmail, data.emailAddress, data.mail]
      .find(isValidEmail);

    if (email) {
      sessionStorage.setItem("userEmail", email);
    }
  } catch {
    // Never crash — background enrichment only
  }
};

// ─── Idempotency key ──────────────────────────────────────────────────────────
const generateIdempotencyKey = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
};

// ─── Payload builder ──────────────────────────────────────────────────────────
const buildPayload = ({ action, module: mod, item, url, name, email, role, organizationId }) => {
  const user = getUserInfo();
  return {
    idempotencyKey : generateIdempotencyKey(),
    name           : name || user.name || "",
    email          : email || user.email || "",
    role           : role || user.role || "USER",
    organizationId : organizationId || user.organizationId || "",
    url            : url || (typeof window !== "undefined" ? window.location.pathname : "/"),
    action         : action || ACTIONS.VISITED,
    module         : mod || MODULES.SYSTEM,
    item           : item !== undefined ? item : null,
  };
};

// ─── Dedup guard (FIX — this revision) ───────────────────────────────────────
// CHANGE: for VISITED events, the key no longer includes `item`.
// Reasoning: a single page view can legitimately trigger more than one
// VISITED call from different parts of a component (e.g. loadRiskStats()
// and loadSavedRisks() both logging VISITED on mount for the Risk module).
// Those calls often carry different (or no) `item` payloads even though,
// to a human reading the activity log, they're the exact same event: "user
// visited /risk-assessment". Keying on item made them look like distinct
// events and let both through. For every action OTHER than VISITED, item
// still matters (e.g. two DELETE calls on the same page with different
// items are genuinely different events) so it stays in the key there.
//
// CHANGE: VISITED gets its own, wider window (3s vs 300ms). Two loaders
// firing off separate async calls on the same mount can easily be spaced
// more than 300ms apart depending on network timing; 3s comfortably covers
// that without merging genuinely separate visits made seconds apart by a
// fast-clicking user (rare, and low-cost if it happens — better than
// showing two rows for one visit).
const _recentKeys        = new Map();
const DEDUP_WINDOW_MS         = 300;
const VISITED_DEDUP_WINDOW_MS = 3000;
const MAX_RECENT_KEYS     = 200;

const reserveIfNotDuplicate = (payload) => {
  const isVisited = payload.action === ACTIONS.VISITED;

  const keyParts = [
    payload.action,
    payload.module,
    payload.url,
    payload.email,
    payload.name,
  ];
  if (!isVisited) {
    keyParts.push(payload.item == null ? "" : JSON.stringify(payload.item));
  }
  const key = keyParts.join("||");

  const windowMs = isVisited ? VISITED_DEDUP_WINDOW_MS : DEDUP_WINDOW_MS;
  const now  = Date.now();
  const last = _recentKeys.get(key);

  if (last && now - last < windowMs) {
    return false; // true duplicate within window — discard
  }

  _recentKeys.set(key, now);

  if (_recentKeys.size > MAX_RECENT_KEYS) {
    const oldestKey = [..._recentKeys.entries()].sort((a, b) => a[1] - b[1])[0][0];
    _recentKeys.delete(oldestKey);
  }

  return true;
};

// ─── Retry queue ──────────────────────────────────────────────────────────────
const RETRY_CONFIG = {
  MAX_RETRIES   : 3,
  BASE_DELAY_MS : 2_000,
  MAX_QUEUE_SIZE: 50,
};

const _retryQueue = [];
let _flushPending = false;

const scheduleFlush = (delayMs = RETRY_CONFIG.BASE_DELAY_MS) => {
  if (_flushPending) return;
  _flushPending = true;
  setTimeout(flushRetryQueue, delayMs);
};

const enqueueRetry = (payload, token) => {
  if (_retryQueue.length >= RETRY_CONFIG.MAX_QUEUE_SIZE) {
    const dropped = _retryQueue.shift();
    console.warn(
      "[ActivityService] Retry queue full — dropping oldest:",
      dropped.payload.action,
      dropped.payload.url,
    );
  }
  _retryQueue.push({
    payload,
    token,
    attempts    : 0,
    nextRetryAt : Date.now() + RETRY_CONFIG.BASE_DELAY_MS,
  });
  scheduleFlush(RETRY_CONFIG.BASE_DELAY_MS);
};

const postLog = async (payload, token) => {
  return fetch(LOGGING_BASE_URL, {
    method  : "POST",
    headers : {
      "Content-Type"      : "application/json",
      Authorization       : `Bearer ${token}`,
      "X-User-Role"       : payload.role,
      "X-Organization-Id" : payload.organizationId,
      "X-Idempotency-Key" : payload.idempotencyKey,
    },
    body: JSON.stringify(payload),
  });
};

const flushRetryQueue = async () => {
  _flushPending = false;
  if (_retryQueue.length === 0) return;

  const now      = Date.now();
  const pending  = _retryQueue.filter((e) => e.nextRetryAt <= now);
  const deferred = _retryQueue.filter((e) => e.nextRetryAt > now);

  _retryQueue.length = 0;
  _retryQueue.push(...deferred);

  for (const entry of pending) {
    try {
      const res = await postLog(entry.payload, entry.token);

      if (res.ok) {
        console.info(
          `[ActivityService] Retry succeeded (attempt ${entry.attempts + 1}):`,
          entry.payload.action,
          entry.payload.url,
        );
        continue;
      }

      throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      entry.attempts++;

      if (entry.attempts >= RETRY_CONFIG.MAX_RETRIES) {
        console.warn(
          `[ActivityService] Gave up after ${RETRY_CONFIG.MAX_RETRIES} retries:`,
          entry.payload.action,
          entry.payload.url,
          "—", err?.message,
        );
        continue;
      }

      const delay       = RETRY_CONFIG.BASE_DELAY_MS * Math.pow(2, entry.attempts - 1);
      entry.nextRetryAt = Date.now() + delay;
      _retryQueue.push(entry);

      console.warn(
        `[ActivityService] Retry ${entry.attempts}/${RETRY_CONFIG.MAX_RETRIES} in ${delay / 1000}s:`,
        entry.payload.action,
        entry.payload.url,
        "—", err?.message,
      );
    }
  }

  if (_retryQueue.length > 0) {
    const nextDue = Math.min(..._retryQueue.map((e) => e.nextRetryAt));
    scheduleFlush(Math.max(nextDue - Date.now(), 100));
  }
};

// ─── Core: async POST ─────────────────────────────────────────────────────────
export const captureActivity = async (params = {}) => {
  try {
    const token = getToken();
    if (!token) return;

    const mod = params.module || MODULES.SYSTEM;
    const url = params.url || (typeof window !== "undefined" ? window.location.pathname : "/");

    // UAT item #3: human-only gate — enforced at capture time, not display time
    if (!isHumanEvent(mod, url)) {
      // CHANGE: surface WHY a log got dropped, in dev only. Previously this
      // failed completely silently — if a call site passed a module string
      // that didn't exactly match a MODULES.* value (typo, stale constant,
      // or a call routed through a different/stale copy of this file), the
      // log just vanished with no trace, making it very hard to find the
      // source. This does not change behavior in production.
      if (typeof process !== "undefined" && process.env?.NODE_ENV !== "production") {
        console.warn(
          "[ActivityService] Dropped (not a recognized human module/url):",
          { module: mod, url, action: params.action || ACTIONS.VISITED },
        );
      }
      return;
    }

    // Best-effort background email enrichment — never awaited, never blocking
    fetchAndCacheEmail();

    if (params.action === ACTIONS.VISITED) {
      await new Promise((r) => setTimeout(r, 50));
    }

    const payload = buildPayload(params);

    if (!reserveIfNotDuplicate(payload)) return;

    try {
      const res = await postLog(payload, token);
      if (!res.ok) {
        console.warn("[ActivityService] Log rejected, queuing for retry:", res.status);
        enqueueRetry(payload, token);
      }
    } catch (networkErr) {
      console.warn("[ActivityService] Network failure, queuing for retry:", networkErr?.message);
      enqueueRetry(payload, token);
    }
  } catch (err) {
    console.warn("[ActivityService] Could not prepare log:", err?.message);
  }
};

// ─── Beacon (safe on page unload) ────────────────────────────────────────────
export const beaconActivity = (params = {}) => {
  try {
    const token = getToken();
    if (!token) return;

    const mod = params.module || MODULES.SYSTEM;
    const url = params.url || (typeof window !== "undefined" ? window.location.pathname : "/");
    if (!isHumanEvent(mod, url)) return;

    const payload = buildPayload(params);
    const blob    = new Blob([JSON.stringify(payload)], { type: "application/json" });
    navigator.sendBeacon(LOGGING_BASE_URL, blob);
  } catch (err) {
    console.warn("[ActivityService] Beacon failed:", err?.message);
  }
};

// ─── Convenience wrappers ─────────────────────────────────────────────────────

export const logPageLoad = (url, mod = MODULES.SYSTEM, overrides = {}) =>
  captureActivity({ action: ACTIONS.VISITED, module: mod, url, item: null, ...overrides });

export const logLogin = (overrides = {}) =>
  captureActivity({ action: ACTIONS.LOGGED_IN, module: MODULES.AUTH, item: null, ...overrides });

export const logLogout = (overrides = {}) =>
  captureActivity({ action: ACTIONS.LOGOUT, module: MODULES.AUTH, item: null, ...overrides });

export const logCreate = (item, mod = MODULES.SYSTEM, overrides = {}) =>
  captureActivity({ action: ACTIONS.CREATED, module: mod, item, ...overrides });

export const logUpdate = (item, mod = MODULES.SYSTEM, overrides = {}) =>
  captureActivity({ action: ACTIONS.UPDATED, module: mod, item, ...overrides });

export const logModify = (item, mod = MODULES.SYSTEM, overrides = {}) =>
  captureActivity({ action: ACTIONS.MODIFIED, module: mod, item, ...overrides });

export const logDelete = (item, mod = MODULES.SYSTEM, overrides = {}) =>
  captureActivity({ action: ACTIONS.DELETE, module: mod, item, ...overrides });

export const logUpload = (item, mod = MODULES.SYSTEM, overrides = {}) =>
  captureActivity({ action: ACTIONS.UPLOAD, module: mod, item, ...overrides });

export const logDownload = (item, mod = MODULES.SYSTEM, overrides = {}) =>
  captureActivity({ action: ACTIONS.DOWNLOAD, module: mod, item, ...overrides });

export const logSelect = (item, mod = MODULES.SYSTEM, overrides = {}) =>
  captureActivity({ action: ACTIONS.CLICK, module: mod, item, ...overrides });

export const logClick = (item = null, mod = MODULES.SYSTEM, overrides = {}) =>
  captureActivity({ action: ACTIONS.CLICK, module: mod, item, ...overrides });