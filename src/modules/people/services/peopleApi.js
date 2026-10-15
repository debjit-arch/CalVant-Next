/**
 * peopleApi.js
 *
 * Thin fetch wrapper around people-service (port 4030 behind the gateway,
 * base path /people-service/api/people — same "https://api.calvant.com/<service>"
 * convention as adminTrustCentreApi.js / adminBillingApi.js). Every function here
 * maps 1:1 onto one controller endpoint in people-service; see each controller's
 * javadoc for the exact server-side contract this mirrors.
 *
 * Auth: token from sessionStorage, same as the rest of the app. Tenant scoping
 * happens server-side from the JWT (TenantContext) — nothing tenant-specific is
 * ever sent from here.
 */

const SERVICE_BASE = process.env.NEXT_PUBLIC_SP
  ? `${process.env.NEXT_PUBLIC_SP}/people-service`
  : "https://api.calvant.com/people-service";

const API = `${SERVICE_BASE}/api/people`;

const USER_BASE = process.env.NEXT_PUBLIC_SP
  ? `${process.env.NEXT_PUBLIC_SP}/user-service`
  : "https://api.calvant.com/user-service";

const getToken = () =>
  (typeof window !== "undefined" &&
    (sessionStorage.getItem("token") || localStorage.getItem("token"))) ||
  "";

const authHeaders = (extra = {}) => ({
  Authorization: `Bearer ${getToken()}`,
  ...extra,
});

/** Every non-2xx response is turned into an Error whose .message is the
 * backend's error text where available (Spring's ResponseStatusException
 * reason, surfaced by the default error body), so callers can show it
 * directly instead of a generic "request failed". */
async function handle(res) {
  if (res.status === 204) return null;
  const isJson = (res.headers.get("content-type") || "").includes("application/json");
  const body = isJson ? await res.json().catch(() => null) : await res.text().catch(() => "");
  if (!res.ok) {
    const message =
      (body && (body.message || body.error)) ||
      (typeof body === "string" && body) ||
      `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }
  return body;
}

const getJson = (url) => fetch(url, { headers: authHeaders() }).then(handle);

const sendJson = (url, method, payload) =>
  fetch(url, {
    method,
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: payload !== undefined ? JSON.stringify(payload) : undefined,
  }).then(handle);

// ── Organisation users (user-service) — who a task can be assigned to ───────

/** Users of the organisation. assignable=true limits it to users flagged as assignable (canView). */
export const listOrgUsers = (orgId, assignableOnly = true) =>
  getJson(
    `${USER_BASE}/api/users?${orgId ? `organization=${encodeURIComponent(orgId)}&` : ""}${assignableOnly ? "assignable=true" : ""}`.replace(/[?&]$/, ""),
  );

// ── Persons ──────────────────────────────────────────────────────────────────

export const listPersons = () => getJson(`${API}/persons`);
export const getPerson = (id) => getJson(`${API}/persons/${id}`);
/** Manual entry only — contractors / anyone not synced from Keka. */
export const createPerson = (person) => sendJson(`${API}/persons`, "POST", person);
export const updatePerson = (id, person) => sendJson(`${API}/persons/${id}`, "PATCH", person);

// ── Background checks (Screening) ───────────────────────────────────────────

export const listBackgroundChecksForPerson = (personId) =>
  getJson(`${API}/background-checks/person/${personId}`);
export const getBackgroundCheck = (id) => getJson(`${API}/background-checks/${id}`);
/** 403s if BGV isn't required for the tenant's current framework selection. */
export const initiateBackgroundCheck = (personId, personName, personEmail) =>
  sendJson(`${API}/background-checks`, "POST", { personId, personName, personEmail });
export const updateBackgroundCheckManual = (id, { status, notes, reportFileId, checkedAt }) =>
  sendJson(`${API}/background-checks/${id}`, "PATCH", { status, notes, reportFileId, checkedAt });
export const refreshBackgroundCheck = (id) =>
  sendJson(`${API}/background-checks/${id}/refresh`, "POST");

// ── Policy acceptances (T&C of Employment / NDA / Post-termination) ────────

/** policyType: TERMS_OF_EMPLOYMENT | NDA | POST_TERMINATION — omit for all. */
export const listPolicyAcceptances = (policyType) =>
  getJson(policyType ? `${API}/policy-acceptances?policyType=${policyType}` : `${API}/policy-acceptances`);
export const listPolicyAcceptancesForPerson = (personId) =>
  getJson(`${API}/policy-acceptances/person/${personId}`);
export const recordPolicyAcceptance = (input) => sendJson(`${API}/policy-acceptances`, "POST", input);
export const updatePolicyAcceptance = (id, input) =>
  sendJson(`${API}/policy-acceptances/${id}`, "PATCH", input);

// ── Offboarding ──────────────────────────────────────────────────────────────

export const listOffboardingCases = () => getJson(`${API}/offboarding`);
export const getOffboardingCase = (id) => getJson(`${API}/offboarding/${id}`);
export const initiateOffboarding = (personId, linkedAccounts, notes) =>
  sendJson(`${API}/offboarding`, "POST", { personId, linkedAccounts, notes });
export const reviewOffboardingAccount = (caseId, { system, accountIdentifier, decision, notes }) =>
  sendJson(`${API}/offboarding/${caseId}/accounts/review`, "POST", {
    system,
    accountIdentifier,
    decision,
    notes,
  });
export const deactivateOffboardingAccount = (caseId, { system, accountIdentifier }) =>
  sendJson(`${API}/offboarding/${caseId}/accounts/deactivate`, "POST", { system, accountIdentifier });
export const markOffboardingAccountsReviewed = (caseId) =>
  sendJson(`${API}/offboarding/${caseId}/advance/accounts-reviewed`, "POST");
export const markOffboardingAccountsDeactivated = (caseId) =>
  sendJson(`${API}/offboarding/${caseId}/advance/accounts-deactivated`, "POST");
export const completeOffboarding = (caseId) =>
  sendJson(`${API}/offboarding/${caseId}/advance/complete`, "POST");

// ── Linked tickets (Disciplinary actions / Event log) ──────────────────────

/** category: DISCIPLINARY | SECURITY_EVENT */
export const listTickets = (category) => getJson(`${API}/tickets/${category}`);
export const listTicketsForPerson = (personId) => getJson(`${API}/tickets/person/${personId}`);
export const getTicket = (id) => getJson(`${API}/tickets/detail/${id}`);
/** actionTaken: Disciplinary only — free text, what action was taken. */
export const createTicket = (category, { personId, summary, ticketingConfig, actionTaken }) =>
  sendJson(`${API}/tickets/${category}`, "POST", { personId, summary, ticketingConfig, actionTaken });
export const updateTicketStatus = (id, status, resolutionSummary) =>
  sendJson(`${API}/tickets/detail/${id}/status`, "PATCH", { status, resolutionSummary });
// Event Log tasks — { ticket, tasks } comes back from both calls, so the caller can update
// the row (status + progress) and the task list from one response.
export const getTicketTasks = (ticketId) => getJson(`${API}/tickets/detail/${ticketId}/tasks`);
/** task: { description, assigneePersonId, dueDate?, priority? } */
export const addTicketTask = (ticketId, task) =>
  sendJson(`${API}/tickets/detail/${ticketId}/tasks`, "POST", task);
/** Pulls the latest status for every ticketing-synced ticket in a category. */
export const refreshTickets = (category) => sendJson(`${API}/tickets/${category}/refresh`, "POST");

// ── Training records (Learning) ─────────────────────────────────────────────

/** category: SECURITY | PRIVACY | AI — omit for all. */
export const listTraining = (category) =>
  getJson(category ? `${API}/training?category=${category}` : `${API}/training`);
export const listTrainingForPerson = (personId) => getJson(`${API}/training/person/${personId}`);
export const createTraining = (input) => sendJson(`${API}/training`, "POST", input);
export const updateTraining = (id, input) => sendJson(`${API}/training/${id}`, "PATCH", input);

// ── Documents (manual-upload evidence: T&C / NDA / post-termination / BGV report) ──

/** category: TERMS_OF_EMPLOYMENT | NDA | POST_TERMINATION | BGV_REPORT.
 * Returns { fileId } — attach to PolicyAcceptance.documentFileId or
 * BackgroundCheck.reportFileId. */
export const uploadDocument = async (file, category) => {
  const form = new FormData();
  form.append("file", file);
  form.append("category", category);
  const res = await fetch(`${API}/documents`, {
    method: "POST",
    headers: authHeaders(),
    body: form,
  });
  return handle(res);
};

export const documentDownloadUrl = (fileId) => `${API}/documents/${fileId}`;
