import { useMemo } from "react";

export function useEffectiveOrg() {
  const [user, setUser] = useState(null);
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("user");
      setUser(stored ? JSON.parse(stored) : null);
    } catch {
      setUser(null);
    }
  }, []);

  const isRoot = Array.isArray(user?.role)
    ? user.role.includes("root")
    : user?.role === "root";

  const isSuperAdmin = Array.isArray(user?.role)
    ? user.role.includes("super_admin")
    : user?.role === "super_admin";

  const isPartnerRoot =
    mounted &&
    isRoot &&
    !isSuperAdmin &&
    sessionStorage.getItem("isPartnerOrg") === "true";

  const managedOrgs = user?.managedOrgs || [];
  const isOrgManager = managedOrgs.length > 0;

  // True for anyone who should see ALL data in the effective org
  // (root, super_admin, dpo, ciso, aio, or org manager)
  const hasFullOrgAccess =
    isRoot ||
    isSuperAdmin ||
    isOrgManager ||
    (Array.isArray(user?.role)
      ? user.role.some((r) => ["dpo", "ciso", "aio"].includes(r))
      : ["dpo", "ciso", "aio"].includes(user?.role));

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const selectedChildOrg = useMemo(() => {
    if (!mounted) return null;
    try {
      return JSON.parse(sessionStorage.getItem("selectedChildOrg") || "null");
    } catch {
      return null;
    }
  }, [mounted]);

  const userOrgId = user?.organization?._id || user?.organization || null;

  const effectiveOrgId = useMemo(() => {
    if ((isPartnerRoot || isOrgManager) && selectedChildOrg)
      return selectedChildOrg._id || selectedChildOrg.id;
    return userOrgId;
  }, [isPartnerRoot, isOrgManager, selectedChildOrg, userOrgId]);

  const effectiveOrgIds = useMemo(() => {
    const ids = new Set([String(userOrgId)]);
    managedOrgs.forEach((id) => ids.add(String(id)));
    return ids;
  }, [userOrgId, managedOrgs]);

  return {
    effectiveOrgId,
    effectiveOrgIds,
    isPartnerRoot,
    isOrgManager,
    hasFullOrgAccess, // ← use this everywhere instead of isRoot
    managedOrgs,
    selectedChildOrg,
    userOrgId,
    user,
    isRoot,
    isSuperAdmin,
  };
}
