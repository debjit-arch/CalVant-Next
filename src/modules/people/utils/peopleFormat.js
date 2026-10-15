/**
 * peopleFormat.js — small shared helpers so every People-module screen renders
 * dates/statuses/roles the same way instead of each component reinventing it.
 */

export function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Tailwind color classes per status/stage value, shared across BGV, offboarding,
 * tickets, training, and policy-acceptance chips so the same word always reads
 * the same color everywhere in the module. */
export const STATUS_STYLES = {
  // Generic positive / negative / neutral / in-progress buckets
  POSITIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  NEGATIVE: "bg-rose-50 text-rose-700 border-rose-200",
  WARNING: "bg-amber-50 text-amber-700 border-amber-200",
  NEUTRAL: "bg-slate-100 text-slate-600 border-slate-200",
  INFO: "bg-blue-50 text-blue-700 border-blue-200",
};

const STATUS_MAP = {
  // BackgroundCheck.status
  CLEARED: STATUS_STYLES.POSITIVE,
  FLAGGED: STATUS_STYLES.NEGATIVE,
  IN_PROGRESS: STATUS_STYLES.INFO,
  PENDING: STATUS_STYLES.WARNING,
  // OffboardingCase.stage
  STARTED: STATUS_STYLES.WARNING,
  ACCOUNTS_REVIEWED: STATUS_STYLES.INFO,
  ACCOUNTS_DEACTIVATED: STATUS_STYLES.INFO,
  COMPLETE: STATUS_STYLES.POSITIVE,
  // LinkedAccountStatus.status
  PENDING_REVIEW: STATUS_STYLES.WARNING,
  REVIEWED_KEEP: STATUS_STYLES.NEUTRAL,
  REVIEWED_DEACTIVATE: STATUS_STYLES.WARNING,
  DEACTIVATED: STATUS_STYLES.POSITIVE,
  // LinkedTicket.status
  OPEN: STATUS_STYLES.WARNING,
  RESOLVED: STATUS_STYLES.POSITIVE,
  CLOSED: STATUS_STYLES.NEUTRAL,
  // TrainingRecord.status
  NOT_STARTED: STATUS_STYLES.NEUTRAL,
  COMPLETED: STATUS_STYLES.POSITIVE,
  // Person.lifecycleStatus / onboardingStatus
  ACTIVE: STATUS_STYLES.POSITIVE,
  ONBOARDING: STATUS_STYLES.INFO,
  OFFBOARDING: STATUS_STYLES.WARNING,
  TERMINATED: STATUS_STYLES.NEUTRAL,
  // accepted booleans get mapped by the caller, not here
};

/** Status to show for an Event Log / Disciplinary entry: once it has tasks and every one is done,
 * the entry reads "Closed" regardless of the stored ticket status. */
export const ticketDisplayStatus = (t) =>
  t && t.tasksTotal > 0 && (t.tasksCompleted || 0) >= t.tasksTotal ? "CLOSED" : t?.status;

export const statusStyle = (status) => STATUS_MAP[status] || STATUS_STYLES.NEUTRAL;

export const humanize = (value) =>
  !value
    ? "—"
    : String(value)
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase());

/** Roles that can create/update People-module data — mirrors people-service's
 * SecurityConfig.WRITE_ROLES (SUPER_ADMIN, ROOT, HR_ADMIN) exactly. Anyone else
 * with module read access (CISO, DPO, AUDITOR, AUDIT_MANAGER, PROCESS_OWNER,
 * PROCESS_MANAGER) sees the same screens read-only. */
export const WRITE_ROLES = ["super_admin", "root", "hr_admin"];

export const canWrite = (userRoles = []) =>
  (userRoles || []).some((r) => WRITE_ROLES.includes(String(r).toLowerCase()));

// ─────────────────────────────────────────────────────────────────────────────
// Shared by the Directory, Dashboard and Profile so every screen tells HR the
// same story: what needs attention, and what the three employment documents
// are called in plain language.
// ─────────────────────────────────────────────────────────────────────────────

/** Plain-language names for the three employment documents (policy types). */
export const POLICY_LABELS = {
  TERMS_OF_EMPLOYMENT: "Terms of employment",
  NDA: "Confidentiality agreement (NDA)",
  POST_TERMINATION: "Post-employment obligations",
};
export const POLICY_TYPES = Object.keys(POLICY_LABELS);

/** Every person is expected to have all three documents on record. */
export const REQUIRED_POLICY_COUNT = POLICY_TYPES.length;

/**
 * getAttention — the ONE definition of "needs attention", used by the Directory
 * rows/stat card and the Dashboard tile so the numbers always agree.
 *
 * A person needs attention when any of these is true:
 *   • background check is missing or not yet cleared
 *   • fewer than all three employment documents are on record
 *   • at least one training is not completed
 *   • at least one ticket is still open
 * People who have already left (TERMINATED) never need attention.
 *
 * `screening` semantics: undefined = still loading (ignored, so numbers don't
 * jump around), null = no check exists yet, object = the latest check.
 * To change what counts, edit only this function.
 */
export function getAttention({ person, screening, docsAccepted = 0, trainingPending = 0, openTickets = 0 }) {
  const reasons = [];
  if ((person?.lifecycleStatus || "").toUpperCase() === "TERMINATED") {
    return { count: 0, reasons };
  }

  if (screening !== undefined) {
    const status = (screening?.status || "").toUpperCase();
    if (!screening) reasons.push("Background check not started");
    else if (status !== "CLEARED") reasons.push(`Background check ${humanize(status).toLowerCase()}`);
  }

  const missingDocs = Math.max(0, REQUIRED_POLICY_COUNT - docsAccepted);
  if (missingDocs > 0) reasons.push(`${missingDocs} document${missingDocs === 1 ? "" : "s"} not recorded`);

  if (trainingPending > 0) reasons.push(`${trainingPending} training${trainingPending === 1 ? "" : "s"} pending`);
  if (openTickets > 0) reasons.push(`${openTickets} open ticket${openTickets === 1 ? "" : "s"}`);

  return { count: reasons.length, reasons };
}

export const attentionLabel = (count) => `${count} ${count === 1 ? "needs" : "need"} attention`;
