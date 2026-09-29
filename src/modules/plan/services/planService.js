// plan/services/planService.js
//
// Extracted from the original Plan.js (PlanDashboard) monolith.
// Contains: static fallback data (FRAMEWORK_DOMAINS, DEFAULT_OBJECTIVES),
// the localStorage-backed "active plans" store, and all network/service
// calls (departments, users, organization name, default objectives).
//
// NOTE: API endpoints, payload shapes, and the localStorage key
// ('cf-active-plans') are preserved exactly as in the original file.

import api from "../../admin/api/adminAxios";
import axios from "axios";
import objectivesData from "../data/ObjectivesData.json";

// ---------------------------------------------------------------------------
// Setup plan-specific axios instance
// ---------------------------------------------------------------------------
const planApi = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_SP}/plan-service`,
});

planApi.interceptors.request.use((config) => {
  const token = typeof window !== "undefined" ? (sessionStorage.getItem("token") || localStorage.getItem("token")) : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ---------------------------------------------------------------------------
// Static fallback data (preserved verbatim from Plan.js)
// ---------------------------------------------------------------------------

export const FRAMEWORK_DOMAINS = {
  "Security": ["NIST CSF 2", "CSCRF", "ISO 27001", "PCI_DSS", "SOC 2", "ISO 27017", "DUBAI ISR"],
  "AI": ["ISO 42001", "EU AI Act"],
  "Privacy": ["HIPAA", "GDPR", "KSA PDPL", "ISO 27701", "DPDPA"]
};

export

  // ---------------------------------------------------------------------------
  // LocalStorage-backed "active plans" store (key preserved: 'cf-active-plans')
  // ---------------------------------------------------------------------------

  const ACTIVE_PLANS_KEY = 'cf-active-plans';

export async function getActivePlans(orgId) {
  if (typeof window === "undefined") return [];
  let backendPlans = [];
  if (orgId) {
    try {
      const res = await planApi.get(`/api/plans/organization/${orgId}`);
      if (Array.isArray(res.data)) {
        backendPlans = res.data;
      }
    } catch (err) {
      console.warn("Backend API unavailable for active plans, falling back to local storage:", err);
    }
  }
  try {
    const localPlans = JSON.parse(localStorage.getItem(ACTIVE_PLANS_KEY) || '[]');
    const planMap = new Map();
    localPlans.forEach(p => { if (p.id || p._id) planMap.set(p.id || p._id, p); });
    backendPlans.forEach(p => { if (p.id || p._id) planMap.set(p.id || p._id, p); });
    const allPlans = Array.from(planMap.values());

    // Deduplicate Drafts by domain: keep only the newest one
    const draftDomainMap = new Map();
    const finalPlans = [];
    allPlans.forEach(p => {
      if (p.status === "Draft") {
        const existing = draftDomainMap.get(p.domain);
        if (!existing || new Date(p.updatedAt || p.createdAt) > new Date(existing.updatedAt || existing.createdAt)) {
          draftDomainMap.set(p.domain, p);
        }
      } else {
        finalPlans.push(p);
      }
    });
    draftDomainMap.forEach(p => finalPlans.push(p));
    return finalPlans;
  } catch (e) {
    return backendPlans;
  }
}

export function saveActivePlans(plans) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACTIVE_PLANS_KEY, JSON.stringify(plans));
}

export async function getPlanById(id) {
  try {
    const res = await planApi.get(`/api/plans/${id}`);
    if (res.data) return res.data;
  } catch (err) {
    console.warn(`Backend API unavailable for plan ${id}, checking local storage:`, err);
  }
  if (typeof window !== "undefined") {
    try {
      const localPlans = JSON.parse(localStorage.getItem(ACTIVE_PLANS_KEY) || '[]');
      return localPlans.find(p => p.id === id || p._id === id) || null;
    } catch (e) {
      return null;
    }
  }
  return null;
}

export async function upsertPlan(plan) {
  try {
    let res;
    if (plan.id && !plan.id.toString().startsWith("draft-")) {
      res = await planApi.put(`/api/plans/${plan.id}`, plan);
    } else {
      res = await planApi.post("/api/plans", plan);
    }
    if (typeof window !== "undefined" && res.data) {
      try {
        const activePlans = JSON.parse(localStorage.getItem(ACTIVE_PLANS_KEY) || '[]');
        const targetId = res.data.id || res.data._id || plan.id;
        const index = activePlans.findIndex(p => (p.id || p._id) === targetId);
        if (index >= 0) activePlans[index] = res.data;
        else activePlans.push(res.data);
        localStorage.setItem(ACTIVE_PLANS_KEY, JSON.stringify(activePlans));
      } catch (e) { /* ignore local mirror error */ }
    }
    return res.data;
  } catch (err) {
    console.warn("Failed to save plan to backend. Saving to local storage fallback:", err);
    if (typeof window !== "undefined") {
      try {
        const safePlan = JSON.parse(JSON.stringify(plan));
        const activePlans = JSON.parse(localStorage.getItem(ACTIVE_PLANS_KEY) || '[]');
        const planToSave = {
          ...safePlan,
          id: safePlan.id || `plan-${Date.now()}`,
          updatedAt: new Date().toISOString()
        };
        const index = activePlans.findIndex(p => (p.id || p._id) === planToSave.id);
        if (index >= 0) activePlans[index] = planToSave;
        else activePlans.push(planToSave);
        localStorage.setItem(ACTIVE_PLANS_KEY, JSON.stringify(activePlans));
        return planToSave;
      } catch (localErr) {
        console.error("Failed to save plan to local storage fallback:", localErr);
        try {
          const minimalPlan = {
            id: plan.id || `plan-${Date.now()}`,
            domain: plan.domain || "Unknown",
            status: plan.status || "Draft",
            updatedAt: new Date().toISOString(),
            scopeData: plan.scopeData || {},
            globalRoles: plan.globalRoles || {},
            orgAssignments: plan.orgAssignments || {},
            orgObjectives: plan.orgObjectives || [],
            deptObjectives: plan.deptObjectives || []
          };
          localStorage.setItem(ACTIVE_PLANS_KEY, JSON.stringify([minimalPlan]));
          return minimalPlan;
        } catch (e2) {
          return { ...plan, id: plan.id || `plan-${Date.now()}` };
        }
      }
    }
    return { ...plan, id: plan.id || `plan-${Date.now()}` };
  }
}

export async function deletePlan(id) {
  try {
    await planApi.delete(`/api/plans/${id}`);
  } catch (err) {
    console.warn(`Backend API delete failed for plan ${id}, removing from local storage:`, err);
  }
  if (typeof window !== "undefined") {
    try {
      const activePlans = JSON.parse(localStorage.getItem(ACTIVE_PLANS_KEY) || '[]');
      const filtered = activePlans.filter(p => (p.id || p._id) !== id);
      localStorage.setItem(ACTIVE_PLANS_KEY, JSON.stringify(filtered));
    } catch (e) {
      console.error("Failed to delete plan from local storage:", e);
    }
  }
  return true;
}

// ---------------------------------------------------------------------------
// Network/service calls (preserved verbatim from Plan.js)
// ---------------------------------------------------------------------------

export async function fetchOrganizationName(user) {
  if (!user) return "";
  if (user.organization?.name) return user.organization.name;
  if (user.company_name) return user.company_name;

  const orgId = user.organization?._id || user.organization;
  if (orgId && typeof orgId === 'string') {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SP || "https://api.calvant.com"}/user-service/api/organizations/${orgId}`,
        { headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` } }
      );
      const data = await res.json();
      if (data && data.name) return data.name;
      if (data && data.organization_name) return data.organization_name;
      return orgId; // fallback
    } catch (err) {
      console.error("Error fetching org name:", err);
      return "";
    }
  }
  return "";
}

export async function fetchDepartments() {
  try {
    const { data } = await api.get("https://api.calvant.com/user-service/api/departments");
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("Failed to fetch departments:", err);
    return [];
  }
}

export async function fetchUsers() {
  try {
    const { data } = await api.get("https://api.calvant.com/user-service/api/users");
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("Failed to fetch users:", err);
    return [];
  }
}

/**
 * Fetches default objectives for a domain from the backend.
 * Removed static fallback to ensure the actual backend DB is utilized.
 */
export async function fetchDefaultObjectives(domain) {
  try {
    const res = await planApi.get(`/api/default-objectives?domain=${domain}`);
    console.log(`[fetchDefaultObjectives] Fetched domain '${domain}', got response:`, res.data);
    if (res.data && Array.isArray(res.data) && res.data.length > 0) {
      return res.data;
    }
    console.log(`[fetchDefaultObjectives] Returning empty array because response was empty or not an array.`);
    return [];
  } catch (err) {
    console.error("Backend API unavailable for default objectives:", err);
    window.alert("Failed to load objectives from backend server. Please ensure the backend is running. (Local fallback has been disabled)");
    return [];
  }
}

// ---------------------------------------------------------------------------
// Department Review API Calls (New Architecture)
// ---------------------------------------------------------------------------

export async function finalizeDepartment(planId, department, finalizedByUserId, riskOwnerId, riskOwnerName) {
  const payload = { finalizedByUserId, riskOwnerId, riskOwnerName };
  const res = await planApi.post(`/api/plans/${planId}/finalize/${encodeURIComponent(department)}`, payload);
  const saved = res.data;
  if (typeof window !== "undefined") {
    const activePlans = JSON.parse(localStorage.getItem(ACTIVE_PLANS_KEY) || '[]');
    const idToMatch = saved.id || saved._id;
    const idx = activePlans.findIndex(p => (p.id || p._id) === idToMatch);
    if (idx >= 0) activePlans[idx] = saved;
    else activePlans.push(saved);
    localStorage.setItem(ACTIVE_PLANS_KEY, JSON.stringify(activePlans));
  }
  return saved;
}

export async function getDepartmentReview(planId, department) {
  const res = await planApi.get(`/api/plans/${planId}/department/${encodeURIComponent(department)}`);
  return res.data;
}

export async function acceptDepartmentObjectives(planId, department, actedByUserId, actedByName, remarks) {
  const payload = { actedByUserId, actedByName, remarks };
  const res = await planApi.post(`/api/plans/${planId}/department/${encodeURIComponent(department)}/accept`, payload);
  const saved = res.data;
  if (typeof window !== "undefined") {
    const activePlans = JSON.parse(localStorage.getItem(ACTIVE_PLANS_KEY) || '[]');
    const idToMatch = saved.id || saved._id;
    const idx = activePlans.findIndex(p => (p.id || p._id) === idToMatch);
    if (idx >= 0) activePlans[idx] = saved;
    else activePlans.push(saved);
    localStorage.setItem(ACTIVE_PLANS_KEY, JSON.stringify(activePlans));
  }
  return saved;
}

/**
 * changeNote is REQUIRED by the backend whenever objectives are edited
 * and/or a deletion is proposed/restored. objectives may include rows with
 * `proposedForDeletion: true` (soft-delete) — they are never hard-removed
 * here; only accept() on the OTHER side ever purges them.
 */
export async function proposeDepartmentObjectivesChanges(planId, department, actedByUserId, actedByName, objectives, changeNote) {
  const payload = { actedByUserId, actedByName, changeNote, updatedObjectives: objectives };
  const res = await planApi.post(`/api/plans/${planId}/department/${encodeURIComponent(department)}/propose-changes`, payload);
  const saved = res.data;
  if (typeof window !== "undefined") {
    const activePlans = JSON.parse(localStorage.getItem(ACTIVE_PLANS_KEY) || '[]');
    const idToMatch = saved.id || saved._id;
    const idx = activePlans.findIndex(p => (p.id || p._id) === idToMatch);
    if (idx >= 0) activePlans[idx] = saved;
    else activePlans.push(saved);
    localStorage.setItem(ACTIVE_PLANS_KEY, JSON.stringify(activePlans));
  }
  return saved;
}

// ---------------------------------------------------------------------------
// Strict Plan Completion — blocked backend-side unless every involved
// department's review is ACCEPTED (approved).
// ---------------------------------------------------------------------------

export async function completePlan(planId) {
  const res = await planApi.post(`/api/plans/${planId}/complete`);
  return res.data;
}