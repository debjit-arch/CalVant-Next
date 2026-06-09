import { useState, useEffect, useMemo } from "react";
import axios from "axios";

export function useEffectiveOrg() {
  const [user, setUser] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [selectedChildOrg, setSelectedChildOrg] = useState(null);
  const [isPartnerOrg, setIsPartnerOrg] = useState(false);

  useEffect(() => {
    const loadOrg = async () => {
      try {
        const user = JSON.parse(sessionStorage.getItem("user") || "{}");

        console.log("User from session:", user);

        if (!user?.organization) return;

        const token = sessionStorage.getItem("token");

        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_SP}/user-service/api/organizations/${user.organization}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        console.log("Organization response:", res.data);

        setIsPartnerOrg(res.data.partner === true);
      } catch (err) {
        console.error("Failed to load org", err);
      }
    };

    loadOrg();
  }, []);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = sessionStorage.getItem("user");
      setUser(stored ? JSON.parse(stored) : null);
    } catch {
      setUser(null);
    }
    try {
      const raw = sessionStorage.getItem("selectedChildOrg");
      setSelectedChildOrg(raw ? JSON.parse(raw) : null);
    } catch {
      setSelectedChildOrg(null);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const handler = () => {
      try {
        const raw = sessionStorage.getItem("selectedChildOrg");
        setSelectedChildOrg(raw ? JSON.parse(raw) : null);
      } catch {
        setSelectedChildOrg(null);
      }
    };
    window.addEventListener("childOrgChanged", handler);
    return () => window.removeEventListener("childOrgChanged", handler);
  }, [mounted]);

  // ── role derivations ──────────────────────────────────────────────────────

  const isRoot = useMemo(
    () =>
      Array.isArray(user?.role)
        ? user.role.includes("root")
        : user?.role === "root",
    [user],
  );

  const isSuperAdmin = useMemo(
    () =>
      Array.isArray(user?.role)
        ? user.role.includes("super_admin")
        : user?.role === "super_admin",
    [user],
  );

  const isPartnerRoot = isPartnerOrg && user?.role?.includes("root");

  const managedOrgs = useMemo(() => user?.managedOrgs || [], [user]);

  const isOrgManager = !isRoot && !isSuperAdmin && managedOrgs.length > 0;

  const isPrivilegedRole = useMemo(
    () =>
      isRoot ||
      isSuperAdmin ||
      (Array.isArray(user?.role)
        ? user.role.some((r) => ["dpo", "ciso", "aio"].includes(r))
        : ["dpo", "ciso", "aio"].includes(user?.role)),
    [isRoot, isSuperAdmin, user],
  );

  const hasFullOrgAccess = isPrivilegedRole || isOrgManager;

  // ── org / identity ────────────────────────────────────────────────────────

  const userOrgId = useMemo(
    () => user?.organization?._id || user?.organization || null,
    [user],
  );

  // ── effectiveOrgId must come before isDepartmentScoped ───────────────────

  const effectiveOrgId = useMemo(() => {
    const candidateId = selectedChildOrg?._id || selectedChildOrg?.id || null;

    if (isPartnerRoot && candidateId) return candidateId;

    if (isOrgManager && candidateId) {
      const allowed = managedOrgs.map(String);
      // only honour the selection if it's an actually assigned org
      return allowed.includes(String(candidateId)) ? candidateId : userOrgId;
    }

    return userOrgId;
  }, [isPartnerRoot, isOrgManager, selectedChildOrg, managedOrgs, userOrgId]);

  const partnerChildOrgIds = useMemo(() => {
    try {
      const raw = sessionStorage.getItem("partnerChildOrgs");
      const orgs = raw ? JSON.parse(raw) : [];

      return orgs.map((o) => String(o.id || o._id));
    } catch {
      return [];
    }
  }, []);

  const isViewingManagedOrg = useMemo(() => {
    if (!isOrgManager) return false;
    return managedOrgs.map(String).includes(String(effectiveOrgId));
  }, [isOrgManager, managedOrgs, effectiveOrgId]);

  const effectiveOrgIds = useMemo(() => {
    // Partner root viewing a specific child
    if (isPartnerRoot && selectedChildOrg && effectiveOrgId) {
      return new Set([String(effectiveOrgId)]);
    }

    // Partner root viewing ALL children
    if (isPartnerRoot && !selectedChildOrg) {
      try {
        const raw = sessionStorage.getItem("partnerChildOrgs");
        const orgs = raw ? JSON.parse(raw) : [];

        return new Set(orgs.map((o) => String(o._id || o.id)));
      } catch {
        return new Set();
      }
    }

    const ids = new Set();

    if (userOrgId) {
      ids.add(String(userOrgId));
    }

    if (isOrgManager) {
      managedOrgs.forEach((id) => ids.add(String(id)));
    }

    return ids;
  }, [
    isPartnerRoot,
    selectedChildOrg,
    effectiveOrgId,
    userOrgId,
    isOrgManager,
    managedOrgs,
  ]);

  console.log("Effective Org Debug", {
    isPartnerOrg,
    isPartnerRoot,
    isRoot,
    userOrgId,
    effectiveOrgId,
    effectiveOrgIds: [...effectiveOrgIds],
    selectedChildOrg,
    managedOrgs,
  });
  // ── department ────────────────────────────────────────────────────────────

  const userDepartmentIds = useMemo(() => {
    const depts = user?.department;
    if (!depts) return [];
    const arr = Array.isArray(depts) ? depts : [depts];
    return arr.map((d) => String(d?._id || d)).filter(Boolean);
  }, [user]);

  // Department scoping only applies when:
  // - not a privileged role
  // - not viewing one of their managed orgs (root-equivalent there)
  // - has department assignments
  const isDepartmentScoped = useMemo(() => {
    if (isPrivilegedRole) return false;
    if (isViewingManagedOrg) return false; // root-equivalent in managed org
    return userDepartmentIds.length > 0; // dept-scoped in home org
  }, [isPrivilegedRole, isViewingManagedOrg, userDepartmentIds]);

  // ── data filter bag ───────────────────────────────────────────────────────

  const dataFilterParams = useMemo(() => {
    const base = { orgId: effectiveOrgId };
    if (isDepartmentScoped) {
      base.departmentIds = userDepartmentIds;
    }
    return base;
  }, [effectiveOrgId, isDepartmentScoped, userDepartmentIds]);

  return {
    effectiveOrgId,
    effectiveOrgIds,
    userOrgId,
    selectedChildOrg,
    isRoot,
    isSuperAdmin,
    isPartnerRoot,
    isOrgManager,
    isViewingManagedOrg, // ← new
    isPrivilegedRole,
    hasFullOrgAccess,
    userDepartmentIds,
    isDepartmentScoped,
    dataFilterParams,
    managedOrgs,
    user,
    mounted,
  };
}
