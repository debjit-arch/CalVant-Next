"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, ArrowLeft, UserPlus, X } from "lucide-react";
import { useEffectiveOrg } from "../../../../hooks/useEffectiveOrg";
import { useFramework } from "../../../../context/FrameworkContex";
import api from "../../../admin/api/adminAxios";
import CreateDept from "../../../admin/components/Departments/CreateDept";
import CreateUser from "../../../admin/components/Users/CreateUser";

import {
  FRAMEWORK_DOMAINS,
  DEFAULT_OBJECTIVES,
  fetchOrganizationName,
  fetchDepartments as fetchDepartmentsService,
  fetchUsers as fetchUsersService,
  fetchDefaultObjectives,
  getActivePlans,
  getPlanById,
  upsertPlan,
} from "../../services/planService";

import "../../styles/PlanStyles.css";

import ScopeForm from "./ScopeForm";
import GlobalRolesForm from "./GlobalRolesForm";
import OrgObjectivesForm from "./OrgObjectivesForm";
import DeptObjectivesForm from "./DeptObjectivesForm";
import CorePolicyStatementForm from "./CorePolicyStatementForm";

/**
 * PlanMultiStepManager
 *
 * Owns all shared state and handlers for the 5-step Plan wizard
 * (Scoping, Org Structuring, Org Objectives, Dept Objectives, Metrics
 * Mapping / Core Policy Statement) and coordinates the five form
 * components. This is a behavior-preserving extraction of the "form"
 * branch of the original PlanDashboard component (Plan.js).
 *
 * `initialPlanId` (optional): when provided, the manager loads the
 * matching plan from the active-plans store (localStorage-backed via
 * planService) and resumes it — this replaces the original
 * `handleEditPlan` behavior, which is now triggered by navigation
 * from PlanDashboard.js instead of an in-place view switch.
 */
const PlanMultiStepManager = ({ initialPlanId = null }) => {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isResuming, setIsResuming] = useState(false);

  const { user, isPrivilegedRole } = useEffectiveOrg();
  const { availableFrameworks = [], frameworksLoading = false } = useFramework() || {};
  const isAdmin = isPrivilegedRole;

  const normalizeFwCode = (str) => {
    if (!str) return "";
    if (typeof str === "object") {
      str = str.label || str.code || str.id || str.name || "";
    }
    return String(str).toUpperCase().replace(/[^A-Z0-9]/g, "");
  };

  const allowedFrameworkNorms = useMemo(() => {
    const normSet = new Set();
    if (Array.isArray(availableFrameworks)) {
      availableFrameworks.forEach((fw) => {
        const norm = normalizeFwCode(fw);
        if (norm) normSet.add(norm);
      });
    }
    const userFws = user?.frameworks || user?.selectedFrameworks || user?.orgFrameworks || [];
    if (Array.isArray(userFws)) {
      userFws.forEach((fw) => {
        const norm = normalizeFwCode(fw);
        if (norm) normSet.add(norm);
      });
    }
    return normSet;
  }, [availableFrameworks, user]);

  // Framework & Plan states
  const [selectedFramework, setSelectedFramework] = useState(null);
  const [isCheckingDraft, setIsCheckingDraft] = useState(!initialPlanId);
  const [showFrameworkModal, setShowFrameworkModal] = useState(false); // will be opened if no draft is found
  const [existingFrameworkPlan, setExistingFrameworkPlan] = useState(null);
  const [frameworkError, setFrameworkError] = useState("");
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [pendingCopyPlan, setPendingCopyPlan] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");

  const [locations, setLocations] = useState(["Primary"]);
  const [actualOrgName, setActualOrgName] = useState("");

  useEffect(() => {
    if (!user) return;
    fetchOrganizationName(user).then((name) => {
      if (name) setActualOrgName(name);
    });
  }, [user]);

  const [scopeData, setScopeData] = useState(
    locations.reduce((acc, loc) => {
      acc[loc] = {
        org: actualOrgName,
        geoLine1: "",
        geoLine2: "",
        geoLoc: "",
        geoPin: "",
        depts: [],
        services: ""
      };
      return acc;
    }, {})
  );

  useEffect(() => {
    if (actualOrgName) {
      setScopeData(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(loc => {
          updated[loc] = { ...updated[loc], org: actualOrgName };
        });
        return updated;
      });
    }
  }, [actualOrgName]);

  const handleAddLocation = () => {
    const newLocName = `Location ${locations.length + 1}`;
    setLocations(prev => [...prev, newLocName]);
    setScopeData(prev => ({
      ...prev,
      [newLocName]: {
        org: actualOrgName,
        geoLine1: "",
        geoLine2: "",
        geoLoc: "",
        geoPin: "",
        depts: [],
        services: ""
      }
    }));
  };

  const [orgAssignments, setOrgAssignments] = useState({});
  const [orgViewMode, setOrgViewMode] = useState("list");

  // Cascading Objectives Data
  const [orgObjectives, setOrgObjectives] = useState([]);
  const [deptObjectives, setDeptObjectives] = useState([]);
  const [corePolicyStatement, setCorePolicyStatement] = useState("");
  const [visibleOrgObjectiveIds, setVisibleOrgObjectiveIds] = useState({});
  const [visibleDeptObjectiveIds, setVisibleDeptObjectiveIds] = useState({});

  const [availableDepartments, setAvailableDepartments] = useState([]);
  const [showAddDeptModal, setShowAddDeptModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [globalRoles, setGlobalRoles] = useState({ steeringCommittee: [], internalAuditor: [], ciso: '' });
  const removedGlobalRoleUsersRef = React.useRef({ steeringCommittee: new Set(), internalAuditor: new Set(), ciso: new Set() });

  const [allUsers, setAllUsers] = useState([]);

  const fetchDepartments = async () => {
    const data = await fetchDepartmentsService();
    setAvailableDepartments(data);
  };

  const fetchUsers = async () => {
    const data = await fetchUsersService();
    if (Array.isArray(data)) {
      setAllUsers(data);
    }
  };

  // Bi-directional auto-population watcher: auto-populates users with roles AND removes users whose role was stripped
  useEffect(() => {
    if (!allUsers || allUsers.length === 0) return;

    // SC members in allUsers
    const scUserIds = new Set(
      allUsers.filter(u => {
        const hasDeptSC = u.department && (() => {
          const dStr = typeof u.department === 'object' && u.department.name ? u.department.name : String(u.department);
          const normD = dStr.toLowerCase().replace(/ /g, '_');
          return normD === 'security_officer' || normD === 'steering_committee' || normD === 'steeringcommittee' || normD === 'steering_commitee';
        })();
        
        if (hasDeptSC) return true;

        if (!u || !u.role) return false;
        const roles = Array.isArray(u.role) ? u.role : [u.role];
        return roles.some(r => {
          const rStr = typeof r === 'object' && r.name ? r.name : String(r);
          const norm = rStr.toLowerCase().replace(/ /g, '_');
          return norm === 'steering_committee_member' || norm === 'steering_committee' || norm === 'steeringcommittee' || norm === 'steering_commitee';
        });
      }).map(u => String(u.id || u._id))
    );

    // Auditor members in allUsers
    const auditorUserIds = new Set(
      allUsers.filter(u => {
        if (!u || !u.role) return false;
        const roles = Array.isArray(u.role) ? u.role : [u.role];
        return roles.some(r => {
          const rStr = typeof r === 'object' && r.name ? r.name : String(r);
          const norm = rStr.toLowerCase().replace(/ /g, '_');
          return ['auditor', 'audit_manager', 'internal_auditor', 'internal_auditors'].includes(norm);
        });
      }).map(u => String(u.id || u._id))
    );

    // Active CISO user in allUsers
    const cisoUser = allUsers.find(u => {
      if (!u || !u.role) return false;
      const roles = Array.isArray(u.role) ? u.role : [u.role];
      return roles.some(r => {
        const rStr = typeof r === 'object' && r.name ? r.name : String(r);
        const norm = rStr.toLowerCase().replace(/ /g, '_');
        return norm === 'ciso' || norm === 'chief_information_security_officer';
      });
    });
    const cisoUserId = cisoUser ? String(cisoUser.id || cisoUser._id) : "";

    setGlobalRoles(prev => {
      const prevSC = Array.isArray(prev.steeringCommittee) ? prev.steeringCommittee : [];
      const validSC = prevSC.filter(id => {
        const u = allUsers.find(user => String(user.id || user._id) === String(id));
        return Boolean(u);
      });
      const removedSC = removedGlobalRoleUsersRef.current.steeringCommittee;
      const finalSC = Array.from(new Set([...validSC.filter(id => scUserIds.has(String(id))), ...scUserIds])).filter(id => !removedSC.has(String(id)));

      const prevAud = Array.isArray(prev.internalAuditor) ? prev.internalAuditor : [];
      const validAud = prevAud.filter(id => {
        const u = allUsers.find(user => String(user.id || user._id) === String(id));
        return Boolean(u);
      });
      const removedAud = removedGlobalRoleUsersRef.current.internalAuditor;
      const finalAud = Array.from(new Set([...validAud.filter(id => auditorUserIds.has(String(id))), ...auditorUserIds])).filter(id => !removedAud.has(String(id)));

      let finalCiso = prev.ciso;
      const removedCiso = removedGlobalRoleUsersRef.current.ciso;
      if (finalCiso) {
        const cisoUserObj = allUsers.find(user => String(user.id || user._id) === String(finalCiso));
        const stillHasCisoRole = cisoUserObj && Array.isArray(cisoUserObj.role) && cisoUserObj.role.some(r => {
          const rStr = typeof r === 'object' && r.name ? r.name : String(r);
          const norm = rStr.toLowerCase().replace(/ /g, '_');
          return norm === 'ciso' || norm === 'chief_information_security_officer';
        });
        if (!stillHasCisoRole) {
          finalCiso = (cisoUserId && !removedCiso.has(String(cisoUserId))) ? cisoUserId : '';
        }
      } else if (cisoUserId && !removedCiso.has(String(cisoUserId))) {
        finalCiso = cisoUserId;
      }

      return {
        ...prev,
        steeringCommittee: finalSC,
        internalAuditor: finalAud,
        ciso: finalCiso
      };
    });
  }, [allUsers]);

  const removeUserRoleFromCore = async (userId, roleTitle) => {
    if (!userId || !roleTitle) return;
    const targetUser = allUsers.find(u => String(u.id || u._id) === String(userId));
    if (!targetUser) return;

    const roleTitleMap = {
      steeringCommittee: "steering_committee_member",
      "Steering Committee Member": "steering_committee_member",
      "steering committee": "steering_committee_member",
      internalAuditor: "auditor",
      "Internal Auditor": "auditor",
      auditor: "auditor",
      ciso: "ciso",
      CISO: "ciso",
      riskOwner: "risk_owner",
      "Risk Owner": "risk_owner",
      riskManager: "risk_manager",
      "Risk Manager": "risk_manager",
      processOwner: "process_owner",
      "Process Owner": "process_owner"
    };

    const normRole = roleTitleMap[roleTitle] || String(roleTitle).toLowerCase().trim().replace(/ /g, '_');

    const currentRoles = Array.isArray(targetUser.role)
      ? targetUser.role
      : targetUser.role
      ? [targetUser.role]
      : [];

    const updatedRoles = currentRoles.filter(r => {
      const rStr = typeof r === 'object' && r.name ? r.name : String(r);
      const rNorm = rStr.toLowerCase().trim().replace(/ /g, '_');
      if (normRole === 'auditor') {
        return !['auditor', 'audit_manager', 'internal_auditor', 'internal_auditors'].includes(rNorm);
      }
      if (normRole === 'steering_committee_member') {
        return !['steering_committee_member', 'steering_committee', 'steeringcommittee', 'steering_commitee'].includes(rNorm);
      }
      if (normRole === 'ciso') {
        return !['ciso', 'chief_information_security_officer'].includes(rNorm);
      }
      return rNorm !== normRole;
    });

    if (updatedRoles.length !== currentRoles.length) {
      // Optimistic in-memory update
      setAllUsers(prev => prev.map(u => {
        if (String(u.id || u._id) === String(userId)) {
          return { ...u, role: updatedRoles };
        }
        return u;
      }));

      try {
        await api.post("/users/update", {
          id: targetUser.id || targetUser._id,
          role: updatedRoles
        });
        fetchUsers();
      } catch (err) {
        console.error(`Failed to remove role ${normRole} for user ${userId}:`, err);
      }
    }
  };

  const handleRemoveGlobalRoleUser = (roleKey, userId) => {
    if (!userId) return;
    const roleTitleMap = {
      steeringCommittee: "steering_committee_member",
      internalAuditor: "auditor",
      ciso: "ciso"
    };
    // Track this removal so auto-populate doesn't re-add
    if (removedGlobalRoleUsersRef.current[roleKey]) {
      removedGlobalRoleUsersRef.current[roleKey].add(String(userId));
    }
    removeUserRoleFromCore(userId, roleTitleMap[roleKey] || roleKey);

    setGlobalRoles(prev => ({
      ...prev,
      [roleKey]: roleKey === 'ciso' ? '' : (Array.isArray(prev[roleKey]) ? prev[roleKey].filter(id => String(id) !== String(userId)) : [])
    }));
  };

  const getUserName = (userId) => {
    if (!userId) return "";
    const u = allUsers.find(user => String(user.id || user._id) === String(userId));
    if (!u) return String(userId);
    return u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || String(userId);
  };

  const getDeptDetails = (deptName) => {
    if (!deptName) return null;
    const targetLower = String(deptName).trim().toLowerCase();
    const matchedDept = availableDepartments.find(d => {
      if (!d) return false;
      const dName = (d.name || "").trim().toLowerCase();
      const dId = String(d.id || d._id || "").trim().toLowerCase();
      return dName === targetLower || dId === targetLower;
    });
    return matchedDept || null;
  };

  const syncUserDepartmentToCore = async (userId, deptName) => {
    if (!userId || !deptName) return;
    const targetUser = allUsers.find(u => String(u.id || u._id) === String(userId));
    if (!targetUser) return;

    const matchedDept = getDeptDetails(deptName);
    const deptId = matchedDept ? (matchedDept.id || matchedDept._id) : deptName;
    const deptNameResolved = matchedDept?.name || deptName;

    const currentDepts = Array.isArray(targetUser.department)
      ? targetUser.department
      : targetUser.department
      ? [targetUser.department]
      : [];

    const alreadyHasDept = currentDepts.some(d => {
      if (!d) return false;
      if (typeof d === 'object' && d.name) {
        return d.name.trim().toLowerCase() === deptNameResolved.trim().toLowerCase() || String(d.id || d._id) === String(deptId);
      }
      const dStr = String(d).trim().toLowerCase();
      return dStr === deptNameResolved.trim().toLowerCase() || String(d) === String(deptId);
    });

    if (!alreadyHasDept) {
      const deptToAdd = deptId || deptNameResolved;
      const updatedDepts = [...currentDepts, deptToAdd];

      setAllUsers(prev => prev.map(u => {
        if (String(u.id || u._id) === String(userId)) {
          return { ...u, department: updatedDepts };
        }
        return u;
      }));

      try {
        await api.post("/users/update", {
          id: targetUser.id || targetUser._id,
          department: updatedDepts,
          role: targetUser.role
        });
        fetchUsers();
      } catch (err) {
        console.error(`Failed to sync department ${deptNameResolved} for user ${userId}:`, err);
      }
    }
  };

  const removeUserDepartmentFromCore = async (userId, deptName) => {
    if (!userId || !deptName) return;
    const targetUser = allUsers.find(u => String(u.id || u._id) === String(userId));
    if (!targetUser) return;

    const matchedDept = getDeptDetails(deptName);
    const deptId = matchedDept ? (matchedDept.id || matchedDept._id) : deptName;
    const deptNameResolved = matchedDept?.name || deptName;

    const currentDepts = Array.isArray(targetUser.department)
      ? targetUser.department
      : targetUser.department
      ? [targetUser.department]
      : [];

    const updatedDepts = currentDepts.filter(d => {
      if (!d) return false;
      if (typeof d === 'object' && d.name) {
        return d.name.trim().toLowerCase() !== deptNameResolved.trim().toLowerCase() && String(d.id || d._id) !== String(deptId);
      }
      const dStr = String(d).trim().toLowerCase();
      return dStr !== deptNameResolved.trim().toLowerCase() && String(d) !== String(deptId);
    });

    if (updatedDepts.length !== currentDepts.length) {
      setAllUsers(prev => prev.map(u => {
        if (String(u.id || u._id) === String(userId)) {
          return { ...u, department: updatedDepts };
        }
        return u;
      }));

      try {
        await api.post("/users/update", {
          id: targetUser.id || targetUser._id,
          department: updatedDepts,
          role: targetUser.role
        });
        fetchUsers();
      } catch (err) {
        console.error(`Failed to remove department ${deptNameResolved} for user ${userId}:`, err);
      }
    }
  };

  const syncUserRoleToCore = async (userId, roleTitle) => {
    if (!userId || !roleTitle) return;
    const targetUser = allUsers.find(u => String(u.id || u._id) === String(userId));
    if (!targetUser) return;

    const roleTitleMap = {
      steeringCommittee: "steering_committee_member",
      "Steering Committee Member": "steering_committee_member",
      "steering committee": "steering_committee_member",
      internalAuditor: "auditor",
      "Internal Auditor": "auditor",
      auditor: "auditor",
      ciso: "ciso",
      CISO: "ciso",
      riskOwner: "risk_owner",
      "Risk Owner": "risk_owner",
      riskManager: "risk_manager",
      "Risk Manager": "risk_manager",
      processOwner: "process_owner",
      "Process Owner": "process_owner"
    };

    const normRole = roleTitleMap[roleTitle] || String(roleTitle).toLowerCase().trim().replace(/ /g, '_');

    const currentRoles = Array.isArray(targetUser.role)
      ? targetUser.role
      : targetUser.role
      ? [targetUser.role]
      : [];

    const exists = currentRoles.some(r => {
      const rStr = typeof r === 'object' && r.name ? r.name : String(r);
      const rNorm = rStr.toLowerCase().trim().replace(/ /g, '_');
      if (normRole === 'auditor') {
        return ['auditor', 'audit_manager', 'internal_auditor', 'internal_auditors'].includes(rNorm);
      }
      if (normRole === 'steering_committee_member') {
        return ['steering_committee_member', 'steering_committee', 'steeringcommittee', 'steering_commitee'].includes(rNorm);
      }
      if (normRole === 'ciso') {
        return ['ciso', 'chief_information_security_officer'].includes(rNorm);
      }
      return rNorm === normRole;
    });

    if (!exists) {
      const updatedRoles = [...currentRoles, normRole];

      // Instantly update local memory state so role addition displays immediately without reload
      setAllUsers(prev => prev.map(u => {
        if (String(u.id || u._id) === String(userId)) {
          return { ...u, role: updatedRoles };
        }
        return u;
      }));

      try {
        await api.post("/users/update", {
          id: targetUser.id || targetUser._id,
          role: updatedRoles
        });
        fetchUsers();
      } catch (err) {
        console.error(`Failed to sync role ${normRole} for user ${userId}:`, err);
      }
    }
  };

  const handleAddGlobalRoleUser = (roleKey, userId) => {
    if (!userId) return;
    const roleTitleMap = {
      steeringCommittee: "steering_committee_member",
      internalAuditor: "auditor",
      ciso: "ciso"
    };
    if (roleKey === 'ciso' && globalRoles.ciso && String(globalRoles.ciso) !== String(userId)) {
      removeUserRoleFromCore(globalRoles.ciso, 'ciso');
    }
    syncUserRoleToCore(userId, roleTitleMap[roleKey] || roleKey);

    setGlobalRoles(prev => {
      if (roleKey === 'ciso') {
        return { ...prev, ciso: userId };
      }
      const currentList = Array.isArray(prev[roleKey]) ? prev[roleKey] : [];
      if (currentList.some(id => String(id) === String(userId))) return prev;
      return { ...prev, [roleKey]: [...currentList, userId] };
    });
  };

  // Orphan Cleanup: Automatically remove deleted departments from scopeData and orgAssignments
  useEffect(() => {
    if (!availableDepartments || availableDepartments.length === 0) return;
    
    const validDeptNames = availableDepartments.map(d => d.name);
    let hasOrphanDept = false;

    setScopeData(prevScopeData => {
      let scopeChanged = false;
      const cleanedScopeData = { ...prevScopeData };
      Object.keys(cleanedScopeData).forEach(location => {
        const locData = cleanedScopeData[location];
        if (locData && Array.isArray(locData.depts)) {
          const filteredDepts = locData.depts.filter(deptName => validDeptNames.includes(deptName));
          if (filteredDepts.length !== locData.depts.length) {
            locData.depts = filteredDepts;
            scopeChanged = true;
            hasOrphanDept = true;
          }
        }
      });
      return scopeChanged ? cleanedScopeData : prevScopeData;
    });

    setOrgAssignments(prevAssignments => {
      let assignmentChanged = false;
      const cleanedAssignments = { ...prevAssignments };
      Object.keys(cleanedAssignments).forEach(deptName => {
        if (!validDeptNames.includes(deptName)) {
          delete cleanedAssignments[deptName];
          assignmentChanged = true;
          hasOrphanDept = true;
        }
      });
      return assignmentChanged ? cleanedAssignments : prevAssignments;
    });

    if (hasOrphanDept) {
      console.warn("Orphaned departments detected and removed from draft.");
    }
  }, [availableDepartments]);

  // Orphan Cleanup: Automatically remove deleted users from orgAssignments
  useEffect(() => {
    if (!allUsers || allUsers.length === 0) return;
    
    const validUserIds = allUsers.map(u => String(u.id || u._id));
    let hasOrphanUser = false;

    setOrgAssignments(prevAssignments => {
      let assignmentChanged = false;
      const cleanedAssignments = { ...prevAssignments };

      Object.keys(cleanedAssignments).forEach(dept => {
        ['riskOwner', 'riskManager', 'processOwner'].forEach(role => {
          const assignedId = cleanedAssignments[dept][role];
          if (assignedId && !validUserIds.includes(String(assignedId))) {
            cleanedAssignments[dept][role] = "";
            assignmentChanged = true;
            hasOrphanUser = true;
          }
        });
      });

      return assignmentChanged ? cleanedAssignments : prevAssignments;
    });

    if (hasOrphanUser) {
      console.warn("Orphaned users detected and removed from draft assignments.");
    }
  }, [allUsers]);

  useEffect(() => {
    setMounted(true);
    fetchDepartments();
    fetchUsers();

    // Listen for window focus to instantly fetch data created in another tab (Admin Panel) without page reload
    const handleFocus = () => {
      fetchDepartments();
      fetchUsers();
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchDepartments();
        fetchUsers();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Under Steering Committee & Internal Auditor, show all users of all departments
  // except those users who have a role of ONLY 'user'.
  const deptFilteredUsers = useMemo(() => {
    if (!allUsers || allUsers.length === 0) return [];

    const nonPlainUserList = allUsers.filter(u => {
      if (!u) return false;
      if (!u.role) return true; // Include if role undefined so user is selectable
      const roles = Array.isArray(u.role) ? u.role : [u.role];
      if (roles.length === 0) return true;

      const normalizedRoles = roles.map(r => {
        const roleStr = typeof r === 'object' && r.name ? r.name : String(r);
        return roleStr.toLowerCase().trim().replace(/ /g, '_');
      });

      // Exclude ONLY if every assigned role is 'user'
      const isOnlyUser = normalizedRoles.every(r => r === 'user');
      return !isOnlyUser;
    });

    return nonPlainUserList.length > 0 ? nonPlainUserList : allUsers;
  }, [allUsers]);

  // Automatic in-progress draft saving (debounced)
  useEffect(() => {
    if (!selectedFramework || !selectedFramework.domain) return;
    if (selectedFramework.status && selectedFramework.status !== "Draft") return;

    const autoSaveTimer = setTimeout(() => {
      const orgId = user?.organization?._id || user?.organization || "UNKNOWN_ORG";
      const userId = user?._id || user?.id || "UNKNOWN_USER";

      const draftPlan = {
        id: selectedFramework?.id || `draft-${selectedFramework.domain}-${Date.now()}`,
        userId,
        organizationId: orgId,
        frameworks: selectedFramework?.frameworks || [],
        domain: selectedFramework?.domain || "Unknown",
        status: "Draft",
        createdAt: selectedFramework?.createdAt || new Date().toISOString(),
        ...selectedFramework,
        scopeData,
        orgAssignments,
        globalRoles,
        orgObjectives: orgObjectives.filter(o => o.selected),
        deptObjectives,
        corePolicyStatement,
        currentStep,
        visibleOrgObjectiveIds,
        visibleDeptObjectiveIds
      };

      if (!selectedFramework.id && draftPlan.id) {
        setSelectedFramework(prev => ({ ...prev, id: draftPlan.id }));
      }

      upsertPlan(draftPlan).catch(err => console.error("Auto-save draft error:", err));
    }, 1000);

    return () => clearTimeout(autoSaveTimer);
  }, [selectedFramework, scopeData, orgAssignments, globalRoles, orgObjectives, deptObjectives, corePolicyStatement, currentStep, user, visibleOrgObjectiveIds, visibleDeptObjectiveIds]);

  // Resume an existing plan (replaces original handleEditPlan view-switch)
  useEffect(() => {
    if (!initialPlanId) {
      setIsCheckingDraft(false);
      setShowFrameworkModal(true);
      return;
    }
    
    setIsResuming(true);
    const loadPlan = async () => {
      const plan = await getPlanById(initialPlanId);
      if (plan) {
        const loadedPlan = { ...plan, ...plan.extraProperties };

        setSelectedFramework({
          id: loadedPlan.id || loadedPlan._id,
          domain: loadedPlan.domain,
          frameworkName: (loadedPlan.frameworks && loadedPlan.frameworks.length > 0) ? loadedPlan.frameworks[0] : "",
          frameworks: loadedPlan.frameworks || [],
          status: loadedPlan.status || "Draft",
          departmentReviews: loadedPlan.departmentReviews || [],
        });
        const planLocations = loadedPlan.scopeData ? Object.keys(loadedPlan.scopeData) : ["Primary"];
        setLocations(planLocations);
        setScopeData(loadedPlan.scopeData || planLocations.reduce((acc, loc) => ({ ...acc, [loc]: { org: actualOrgName, geoLine1: "", geoLine2: "", geoLoc: "", geoPin: "", depts: [], services: "" } }), {}));
        setOrgAssignments(loadedPlan.orgAssignments || {});
        setGlobalRoles(loadedPlan.globalRoles || { steeringCommittee: [], internalAuditor: [], ciso: '' });
        
        const fetchDomain = (loadedPlan.domain && loadedPlan.domain !== "Unknown") ? loadedPlan.domain : "Security";
        const defaultRows = await fetchDefaultObjectives(fetchDomain);
        
        const initialOrgs = [];
        const initialDepts = [];
        defaultRows.forEach((o, i) => {
          const isBackendOrg = o.level === 'ORG' || o.level === 'organization';
          const isBackendDept = o.level === 'DEPT' || o.level === 'department';
          
          let orgObj = null;

          const orgText = isBackendOrg ? o.objective : (o["Organization Objective"] || o.organizationObjective || o.objective || "");
          if (orgText && !isBackendDept) {
            orgObj = initialOrgs.find(org => org.text === orgText);
            if (!orgObj) {
              const savedOrg = (loadedPlan.orgObjectives || []).find(so => (isBackendOrg && o.id && so.id === o.id) || (so.text || so.objective) === orgText);
              orgObj = {
                id: (isBackendOrg ? o.id : null) || savedOrg?.id || `org-${Date.now()}-${i}`,
                text: savedOrg ? (savedOrg.text || savedOrg.objective || orgText) : orgText,
                metric: savedOrg?.metric || o["Organization Metric (KPI)"] || o.metric || o.organizationMetric || "",
                measurement: savedOrg?.measurement || o.measurement || "",
                responsibility: savedOrg?.responsibility || o.Responsibility || o.responsibility || "",
                frequency: savedOrg?.frequency || o.frequency || o.frequencyOfReview || "Annually",
                target: savedOrg?.target || o["Metric Mapping / Target"] || o.target || o.targetOfAchievement || "100%",
                actionPlans: savedOrg?.actionPlans || o.actionPlans || "",
                actualAchievement: savedOrg?.actualAchievement || o["Actual Acievement"] || o["Actual Achievement"] || o.actualAchievement || "",
                selected: !!savedOrg
              };
              initialOrgs.push(orgObj);
            }
          }

          const deptName = (o["Department Name"] || o.department || o.dept || "").trim();
          const deptText = isBackendDept ? o.objective : (o["Department Objective"] || o.departmentObjective || "");
          
          if (deptName && deptText && !isBackendOrg) {
            if (!initialDepts.find(d => d.text === deptText && (d.department || d.dept) === deptName)) {
              const savedDept = (loadedPlan.deptObjectives || []).find(sd => 
                (isBackendDept && o.id && sd.id === o.id) || 
                ((sd.text || sd.objective) === deptText && (sd.department || sd.dept) === deptName)
              );
              const mappedOrgId = isBackendDept ? o.orgObjectiveId : (orgObj ? orgObj.id : null);
              initialDepts.push({
                id: (isBackendDept ? o.id : null) || savedDept?.id || `dept-${Date.now()}-${i}`,
                orgObjectiveId: mappedOrgId, // mapped reference
                department: deptName,
                dept: deptName,
                text: savedDept ? (savedDept.text || savedDept.objective || deptText) : deptText,
                deptMetric: savedDept?.deptMetric || savedDept?.metric || o["Department Metric (KPI)"] || o.metric || o.departmentMetric || "",
                measurement: savedDept?.measurement || o.measurement || "",
                responsibility: savedDept?.responsibility || o.Responsibility || o.responsibility || "",
                frequency: savedDept?.frequency || o.frequency || o.frequencyOfReview || "Annually",
                target: savedDept?.target || o["Metric Mapping / Target"] || o.target || o.targetOfAchievement || "100%",
                actionPlans: savedDept?.actionPlans || o.actionPlans || "",
                actualAchievement: savedDept?.actualAchievement || o["Actual Acievement"] || o["Actual Achievement"] || o.actualAchievement || "",
                selected: !!savedDept
              });
            }
          }
        });

        // Also add any custom ones that were in loadedPlan but not in defaults
        (loadedPlan.orgObjectives || []).forEach((so, i) => {
            const text = so.text || so.objective;
            const metric = so.metric || so.orgMetric || "";
            if (text && !initialOrgs.find(org => (so.id && org.id === so.id) || org.text === text)) {
                initialOrgs.push({ ...so, text, metric, selected: true, id: so.id || `custom-org-${Date.now()}-${i}` });
            }
        });
        (loadedPlan.deptObjectives || []).forEach((sd, i) => {
            const text = sd.text || sd.objective;
            const deptName = sd.department || sd.dept;
            if (text && deptName && !initialDepts.find(d => (sd.id && d.id === sd.id) || (d.text === text && (d.department || d.dept) === deptName))) {
                initialDepts.push({ ...sd, text, department: deptName, dept: deptName, selected: true, id: sd.id || `custom-dept-${Date.now()}-${i}` });
            }
        });

        if (initialOrgs.length === 0) {
          initialOrgs.push({ id: `org-${Date.now()}`, text: "", metric: "", responsibility: "", frequency: "", target: "", selected: true });
        }
        
        if (defaultRows && defaultRows.length > 0) {
          setOrgObjectives(initialOrgs);
          setDeptObjectives(initialDepts);
        } else {
          setOrgObjectives(loadedPlan.orgObjectives || []);
          setDeptObjectives(loadedPlan.deptObjectives || []);
        }

        
        setCorePolicyStatement(loadedPlan.corePolicyStatement || "");
        setCurrentStep(loadedPlan.currentStep || 1);
        
        if (loadedPlan.visibleOrgObjectiveIds) {
          setVisibleOrgObjectiveIds(loadedPlan.visibleOrgObjectiveIds);
        }
        if (loadedPlan.visibleDeptObjectiveIds) {
          const safeVisibleDeptIds = { ...loadedPlan.visibleDeptObjectiveIds };
          const backendDepts = loadedPlan.deptObjectives || [];
          // Force the visible list to exactly match reality for any department that is or was under review
          if (loadedPlan.departmentReviews) {
            loadedPlan.departmentReviews.forEach(r => {
                const deptObjs = backendDepts.filter(o => (o.dept || o.department) === r.departmentId);
                safeVisibleDeptIds[r.departmentId] = deptObjs.map(o => o.id);
            });
          }
          setVisibleDeptObjectiveIds(safeVisibleDeptIds);
        }

        setShowFrameworkModal(false);
      }
      setIsResuming(false);
    };

    const timer = setTimeout(() => {
      loadPlan();
    }, 1500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPlanId, actualOrgName]);

  const getFilteredUsers = (roleName) => {
    return deptFilteredUsers.filter(u => {
      if (!u || !u.role) return false;
      const roles = Array.isArray(u.role) ? u.role : [u.role];
      const targetLower = roleName.toLowerCase().replace(/ /g, '_');
      return roles.some(r => {
        const roleStr = typeof r === 'object' && r.name ? r.name : String(r);
        return roleStr.toLowerCase().replace(/ /g, '_') === targetLower;
      });
    });
  };

  const handleOrgAssignmentChange = (dept, roleKey, userId) => {
    const previousUserId = orgAssignments[dept]?.[roleKey];
    const roleTitleMap = {
      riskOwner: "Risk Owner",
      riskManager: "Risk Manager",
      processOwner: "Process Owner"
    };

    if (previousUserId && String(previousUserId) !== String(userId)) {
      // Check if previous user still has other roles in this department
      const deptData = orgAssignments[dept] || {};
      const stillInDeptOtherRoles = Object.entries(deptData).some(([key, val]) => {
        if (key === roleKey) return false;
        if (Array.isArray(val)) {
          return val.some(id => String(id) === String(previousUserId));
        }
        return String(val) === String(previousUserId);
      });
      if (!stillInDeptOtherRoles) {
        removeUserDepartmentFromCore(previousUserId, dept);
      }

      // Check if previous user is assigned to this role in other departments
      const isAssignedElsewhere = Object.entries(orgAssignments).some(([otherDept, roles]) => {
        if (otherDept === dept) return false;
        const assigned = roles?.[roleKey];
        if (Array.isArray(assigned)) {
          return assigned.some(id => String(id) === String(previousUserId));
        }
        return String(assigned) === String(previousUserId);
      });
      if (!isAssignedElsewhere) {
        removeUserRoleFromCore(previousUserId, roleTitleMap[roleKey] || roleKey);
      }
    }

    if (userId) {
      syncUserRoleToCore(userId, roleTitleMap[roleKey] || roleKey);
      syncUserDepartmentToCore(userId, dept);
    }

    setOrgAssignments(prev => ({
      ...prev,
      [dept]: {
        ...(prev[dept] || {}),
        [roleKey]: userId
      }
    }));
  };

  const handleAddOrgAssignmentUser = (dept, roleKey, userId) => {
    if (!userId) return;
    const roleTitleMap = {
      riskOwner: "Risk Owner",
      riskManager: "Risk Manager",
      processOwner: "Process Owner"
    };
    syncUserRoleToCore(userId, roleTitleMap[roleKey] || roleKey);
    syncUserDepartmentToCore(userId, dept);

    setOrgAssignments(prev => {
      const deptData = prev[dept] || {};
      const currentArr = Array.isArray(deptData[roleKey]) ? deptData[roleKey] : [];
      if (currentArr.some(id => String(id) === String(userId))) return prev;
      return {
        ...prev,
        [dept]: {
          ...deptData,
          [roleKey]: [...currentArr, userId]
        }
      };
    });
  };

  const handleRemoveOrgAssignmentUser = (dept, roleKey, userId) => {
    if (userId) {
      const roleTitleMap = {
        riskOwner: "Risk Owner",
        riskManager: "Risk Manager",
        processOwner: "Process Owner"
      };

      // Check if user is still assigned to this role in any other department in the plan
      const isAssignedToRoleElsewhere = Object.entries(orgAssignments).some(([otherDept, roles]) => {
        if (otherDept === dept) return false;
        const assigned = roles?.[roleKey];
        if (Array.isArray(assigned)) {
          return assigned.some(id => String(id) === String(userId));
        }
        return String(assigned) === String(userId);
      });

      if (!isAssignedToRoleElsewhere) {
        removeUserRoleFromCore(userId, roleTitleMap[roleKey] || roleKey);
      }

      // Check if user has ANY other role in THIS department
      const deptData = orgAssignments[dept] || {};
      const stillInDeptOtherRoles = Object.entries(deptData).some(([key, val]) => {
        if (key === roleKey) return false;
        if (Array.isArray(val)) {
          return val.some(id => String(id) === String(userId));
        }
        return String(val) === String(userId);
      });

      if (!stillInDeptOtherRoles) {
        removeUserDepartmentFromCore(userId, dept);
      }
    }

    setOrgAssignments(prev => {
      const deptData = prev[dept] || {};
      const currentArr = Array.isArray(deptData[roleKey]) ? deptData[roleKey] : [];
      return {
        ...prev,
        [dept]: {
          ...deptData,
          [roleKey]: currentArr.filter(id => String(id) !== String(userId))
        }
      };
    });
  };

  const handleScopeChange = (location, field, value) => {
    setScopeData(prev => ({
      ...prev,
      [location]: {
        ...prev[location],
        [field]: value
      }
    }));
  };

  const handleDeptToggle = (deptName) => {
    setScopeData(prev => {
      const firstLoc = Object.keys(prev)[0] || "Primary";
      const currentDepts = prev[firstLoc]?.depts || [];
      const newDepts = currentDepts.includes(deptName)
        ? currentDepts.filter(d => d !== deptName)
        : [...currentDepts, deptName];

      const updated = { ...prev };
      Object.keys(updated).forEach(loc => {
        updated[loc] = { ...updated[loc], depts: newDepts };
      });
      return updated;
    });
  };

  const handleGlobalServiceChange = (value) => {
    setScopeData(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(loc => {
        updated[loc] = { ...updated[loc], services: value };
      });
      return updated;
    });
  };

  const handleCreateDeptSuccess = (newDeptName) => {
    setShowAddDeptModal(false);
    fetchDepartments(); // Refetch the list to include the newly created department
  };

  const allSelectedDepts = useMemo(() => {
    const depts = new Set();
    Object.values(scopeData).forEach(locData => {
      locData.depts.forEach(d => { if (d.trim()) depts.add(d.trim()); });
    });
    return Array.from(depts);
  }, [scopeData]);

  useEffect(() => {
    if (orgObjectives.length > 0 && allSelectedDepts.length > 0) {
      setVisibleOrgObjectiveIds(prev => {
        const next = { ...prev };
        let changed = false;
        allSelectedDepts.forEach(dept => {
          if (!next[dept]) {
            const cat = availableDepartments.find(d => (d.id === dept || d._id === dept || d.name === dept))?.mapping || dept;
            const deptOrgObjs = orgObjectives.filter(o =>
              o.departments && o.departments.some(d => d.toLowerCase() === cat.toLowerCase())
            );
            if (deptOrgObjs.length > 0) {
              next[dept] = deptOrgObjs.map(o => o.id);
              changed = true;
            }
          }
        });
        return changed ? next : prev;
      });
    }
  }, [orgObjectives, allSelectedDepts, availableDepartments]);

  useEffect(() => {
    if (deptObjectives.length > 0 && allSelectedDepts.length > 0) {
      setVisibleDeptObjectiveIds(prev => {
        const next = { ...prev };
        let changed = false;
        allSelectedDepts.forEach(dept => {
          if (!next[dept]) {
            const cat = availableDepartments.find(d => (d.id === dept || d._id === dept || d.name === dept))?.mapping || dept;
            
            const getBackendDeptNames = (frontendDept) => {
              const fDept = (frontendDept || "").toLowerCase().trim();
              if (fDept === "admin" || fDept === "facilities") return ["Admin & Facilities"];
              if (fDept === "it infra") return ["IT Infrastructure"];
              if (fDept === "it applications" || fDept === "it") return ["IT Applications / Software Development"];
              if (fDept === "vendor management" || fDept === "procurement") return ["Vendor Management / Procurement"];
              if (fDept === "legal") return ["Legal & Compliance"];
              if (fDept === "hr" || fDept === "human resources") return ["Human Resources"];
              return [];
            };

            const lowerCat = cat.toLowerCase().trim();
            if (lowerCat.includes("steering committee") || lowerCat.includes("steeringcommittee") || lowerCat.includes("security officer")) {
               // Skip mapping
            } else {
              const mappedBackendNames = getBackendDeptNames(cat).map(n => n.toLowerCase());
              mappedBackendNames.push(lowerCat);
              
              const availableDeptObjs = deptObjectives.filter(dObj =>
                dObj.dept && mappedBackendNames.includes(dObj.dept.toLowerCase().trim())
              );
              if (availableDeptObjs.length > 0) {
                next[dept] = availableDeptObjs.map(o => o.id);
                changed = true;
              }
            }
          }
        });
        return changed ? next : prev;
      });
    }
  }, [deptObjectives, allSelectedDepts, availableDepartments]);

  useEffect(() => {
    if (allUsers.length > 0 && allSelectedDepts.length > 0) {
      setOrgAssignments(prev => {
        const newAssignments = { ...prev };
        let changed = false;
        allSelectedDepts.forEach(dept => {
          if (!newAssignments[dept]) newAssignments[dept] = {};

          // Clean up riskOwner if role removed or department unlinked
          if (newAssignments[dept].riskOwner) {
            const currentOwnerObj = allUsers.find(u => String(u.id || u._id) === String(newAssignments[dept].riskOwner));
            const stillHasRole = currentOwnerObj && (Array.isArray(currentOwnerObj.role) ? currentOwnerObj.role : [currentOwnerObj.role]).some(r => {
              const rStr = typeof r === 'object' && r.name ? r.name : String(r);
              return rStr.toLowerCase().replace(/ /g, '_') === 'risk_owner';
            });
            const uDept = currentOwnerObj ? (currentOwnerObj.department || currentOwnerObj.departments || currentOwnerObj.departmentId || '') : '';
            const deptNameLower = dept.trim().toLowerCase();
            const isDeptMatch = (val) => {
              if (!val) return false;
              if (typeof val === 'object' && val.name) return val.name.trim().toLowerCase() === deptNameLower;
              const valStr = String(val).trim().toLowerCase();
              if (valStr === deptNameLower) return true;
              const matchedDept = availableDepartments.find(d => (d.id || d._id) === val);
              if (matchedDept && matchedDept.name && matchedDept.name.trim().toLowerCase() === deptNameLower) return true;
              return false;
            };
            const stillHasDept = Array.isArray(uDept) ? uDept.some(isDeptMatch) : isDeptMatch(uDept);

            if (currentOwnerObj && (!stillHasRole || !stillHasDept)) {
              newAssignments[dept].riskOwner = "";
              changed = true;
            }
          }

          // Auto-populate riskOwner (single)
          if (!newAssignments[dept].riskOwner) {
            const riskOwnersInDept = allUsers.filter(u => {
              if (!u || !u.role) return false;
              const roles = Array.isArray(u.role) ? u.role : [u.role];
              const hasRole = roles.some(r => {
                const roleStr = typeof r === 'object' && r.name ? r.name : String(r);
                return roleStr.toLowerCase().replace(/ /g, '_') === 'risk_owner';
              });
              const uDept = u.department || u.departments || u.departmentId || '';

              const deptNameLower = dept.trim().toLowerCase();
              const isDeptMatch = (val) => {
                if (!val) return false;
                if (typeof val === 'object' && val.name) return val.name.trim().toLowerCase() === deptNameLower;
                const valStr = String(val).trim().toLowerCase();
                if (valStr === deptNameLower) return true;
                const matchedDept = availableDepartments.find(d => (d.id || d._id) === val);
                if (matchedDept && matchedDept.name && matchedDept.name.trim().toLowerCase() === deptNameLower) return true;
                return false;
              };

              const deptMatch = Array.isArray(uDept) ? uDept.some(isDeptMatch) : isDeptMatch(uDept);
              return hasRole && deptMatch;
            });
            if (riskOwnersInDept.length > 0) {
              newAssignments[dept].riskOwner = riskOwnersInDept[0].id || riskOwnersInDept[0]._id;
              changed = true;
            }
          }

          // Clean up processOwner array if role removed or department unlinked
          if (Array.isArray(newAssignments[dept].processOwner) && newAssignments[dept].processOwner.length > 0) {
            const validPOs = newAssignments[dept].processOwner.filter(id => {
              const uObj = allUsers.find(u => String(u.id || u._id) === String(id));
              if (!uObj) return false;
              const roles = Array.isArray(uObj.role) ? uObj.role : [uObj.role];
              const hasRole = roles.some(r => {
                const rStr = typeof r === 'object' && r.name ? r.name : String(r);
                return rStr.toLowerCase().replace(/ /g, '_') === 'process_owner';
              });
              const uDept = uObj.department || uObj.departments || uObj.departmentId || '';
              const deptNameLower = dept.trim().toLowerCase();
              const isDeptMatch = (val) => {
                if (!val) return false;
                if (typeof val === 'object' && val.name) return val.name.trim().toLowerCase() === deptNameLower;
                const valStr = String(val).trim().toLowerCase();
                if (valStr === deptNameLower) return true;
                const matchedDept = availableDepartments.find(d => (d.id || d._id) === val);
                if (matchedDept && matchedDept.name && matchedDept.name.trim().toLowerCase() === deptNameLower) return true;
                return false;
              };
              const hasDept = Array.isArray(uDept) ? uDept.some(isDeptMatch) : isDeptMatch(uDept);
              return hasRole && hasDept;
            });
            if (validPOs.length !== newAssignments[dept].processOwner.length) {
              newAssignments[dept].processOwner = validPOs;
              changed = true;
            }
          }

          // Auto-populate processOwner (array)
          if (!newAssignments[dept].processOwner) {
            newAssignments[dept].processOwner = [];
            changed = true;
          }
          const existingProcessOwners = new Set(newAssignments[dept].processOwner);
          const processOwnersInDept = allUsers.filter(u => {
            if (!u || !u.role) return false;
            const roles = Array.isArray(u.role) ? u.role : [u.role];
            const hasRole = roles.some(r => {
              const roleStr = typeof r === 'object' && r.name ? r.name : String(r);
              return roleStr.toLowerCase().replace(/ /g, '_') === 'process_owner';
            });
            const uDept = u.department || u.departments || u.departmentId || '';

            const deptNameLower = dept.trim().toLowerCase();
            const isDeptMatch = (val) => {
              if (!val) return false;
              if (typeof val === 'object' && val.name) return val.name.trim().toLowerCase() === deptNameLower;
              const valStr = String(val).trim().toLowerCase();
              if (valStr === deptNameLower) return true;
              const matchedDept = availableDepartments.find(d => (d.id || d._id) === val);
              if (matchedDept && matchedDept.name && matchedDept.name.trim().toLowerCase() === deptNameLower) return true;
              return false;
            };

            const deptMatch = Array.isArray(uDept) ? uDept.some(isDeptMatch) : isDeptMatch(uDept);
            return hasRole && deptMatch;
          });

          const newProcessOwnerIds = processOwnersInDept.map(u => u.id || u._id).filter(id => !existingProcessOwners.has(id));
          if (newProcessOwnerIds.length > 0) {
            newAssignments[dept].processOwner = [...newAssignments[dept].processOwner, ...newProcessOwnerIds];
            changed = true;
          }

          // Clean up riskManager array if role removed or department unlinked
          if (Array.isArray(newAssignments[dept].riskManager) && newAssignments[dept].riskManager.length > 0) {
            const validRMs = newAssignments[dept].riskManager.filter(id => {
              const uObj = allUsers.find(u => String(u.id || u._id) === String(id));
              if (!uObj) return false;
              const roles = Array.isArray(uObj.role) ? uObj.role : [uObj.role];
              const hasRole = roles.some(r => {
                const rStr = typeof r === 'object' && r.name ? r.name : String(r);
                return rStr.toLowerCase().replace(/ /g, '_') === 'risk_manager';
              });
              const uDept = uObj.department || uObj.departments || uObj.departmentId || '';
              const deptNameLower = dept.trim().toLowerCase();
              const isDeptMatch = (val) => {
                if (!val) return false;
                if (typeof val === 'object' && val.name) return val.name.trim().toLowerCase() === deptNameLower;
                const valStr = String(val).trim().toLowerCase();
                if (valStr === deptNameLower) return true;
                const matchedDept = availableDepartments.find(d => (d.id || d._id) === val);
                if (matchedDept && matchedDept.name && matchedDept.name.trim().toLowerCase() === deptNameLower) return true;
                return false;
              };
              const hasDept = Array.isArray(uDept) ? uDept.some(isDeptMatch) : isDeptMatch(uDept);
              return hasRole && hasDept;
            });
            if (validRMs.length !== newAssignments[dept].riskManager.length) {
              newAssignments[dept].riskManager = validRMs;
              changed = true;
            }
          }

          // Auto-populate riskManager (array)
          if (!newAssignments[dept].riskManager) {
            newAssignments[dept].riskManager = [];
            changed = true;
          }
          const existingRiskManagers = new Set(newAssignments[dept].riskManager);
          const riskManagersInDept = allUsers.filter(u => {
            if (!u || !u.role) return false;
            const roles = Array.isArray(u.role) ? u.role : [u.role];
            const hasRole = roles.some(r => {
              const roleStr = typeof r === 'object' && r.name ? r.name : String(r);
              return roleStr.toLowerCase().replace(/ /g, '_') === 'risk_manager';
            });
            const uDept = u.department || u.departments || u.departmentId || '';

            const deptNameLower = dept.trim().toLowerCase();
            const isDeptMatch = (val) => {
              if (!val) return false;
              if (typeof val === 'object' && val.name) return val.name.trim().toLowerCase() === deptNameLower;
              const valStr = String(val).trim().toLowerCase();
              if (valStr === deptNameLower) return true;
              const matchedDept = availableDepartments.find(d => (d.id || d._id) === val);
              if (matchedDept && matchedDept.name && matchedDept.name.trim().toLowerCase() === deptNameLower) return true;
              return false;
            };

            const deptMatch = Array.isArray(uDept) ? uDept.some(isDeptMatch) : isDeptMatch(uDept);
            return hasRole && deptMatch;
          });

          const newRiskManagerIds = riskManagersInDept.map(u => u.id || u._id).filter(id => !existingRiskManagers.has(id));
          if (newRiskManagerIds.length > 0) {
            newAssignments[dept].riskManager = [...newAssignments[dept].riskManager, ...newRiskManagerIds];
            changed = true;
          }
        });
        return changed ? newAssignments : prev;
      });
    }
  }, [allUsers, allSelectedDepts, availableDepartments]);

  const handleFrameworkSelect = async (frameworkName, domain) => {
    const orgId = user?.organization?._id || user?.organization;
    const activePlans = (await getActivePlans(orgId)) || [];
    const existingDomainPlan = activePlans.find(p => p.domain === domain);
    
    // Check if the user already has this specific framework in ANY of their plans for this domain
    const existingPlanWithFramework = activePlans.find(p => p.domain === domain && (p.frameworks || []).includes(frameworkName));

    if (existingPlanWithFramework) {
      setExistingFrameworkPlan(existingPlanWithFramework);
      return;
    }

    if (existingDomainPlan) {
      if (!(existingDomainPlan.frameworks || []).includes(frameworkName)) {
        setPendingCopyPlan({ frameworkName, domain, existingPlan: existingDomainPlan });
        setShowCopyModal(true);
      } else {
        setFrameworkError(`The ${frameworkName} framework is already included in your ${domain} plan.`);
      }
    } else {
      setFrameworkError("");
      setExistingFrameworkPlan(null);
      setSelectedFramework({ frameworks: [frameworkName], domain });

      // Auto-populate Step 3 & 4 data based on the domain
      const defaultRows = await fetchDefaultObjectives(domain);

      const initialOrgs = [];
      const initialDepts = [];
      defaultRows.forEach((o, i) => {
        const isBackendOrg = o.level === 'ORG' || o.level === 'organization';
        const isBackendDept = o.level === 'DEPT' || o.level === 'department';
        
        let orgObj = null;

        const orgText = isBackendOrg ? o.objective : (o["Organization Objective"] || o.organizationObjective || o.objective || "");
        if (orgText && !isBackendDept) {
            orgObj = initialOrgs.find(org => org.text === orgText);
            if (!orgObj) {
                orgObj = {
                    id: (isBackendOrg ? o.id : null) || `org-${Date.now()}-${i}`,
                    text: orgText,
                    metric: o.metric || o.organizationMetric || o["Organization Metric (KPI)"] || "",
                    measurement: o.measurement || "",
                    responsibility: o.responsibility || o.Responsibility || "",
                    frequency: o.frequency || o.frequencyOfReview || "Annually",
                    target: o.target || o.targetOfAchievement || o["Metric Mapping / Target"] || "100%",
                    actionPlans: o.actionPlans || "",
                    actualAchievement: o.actualAchievement || o["Actual Acievement"] || "",
                    selected: true
                };
                initialOrgs.push(orgObj);
            }
        }

        const deptName = (o["Department Name"] || o.department || o.dept || "").trim();
        const deptText = isBackendDept ? o.objective : (o["Department Objective"] || o.departmentObjective || "");
        if (deptName && deptText && !isBackendOrg) {
            if (!initialDepts.find(d => d.dept === deptName && d.text === deptText)) {
                const mappedOrgId = isBackendDept ? o.orgObjectiveId : (orgObj ? orgObj.id : null);
                initialDepts.push({
                    id: (isBackendDept ? o.id : null) || `dept-${Date.now()}-${i}`,
                    orgObjectiveId: mappedOrgId,
                    dept: deptName,
                    department: deptName,
                    text: deptText,
                    deptMetric: o.metric || o.departmentMetric || o["Department Metric (KPI)"] || "",
                    measurement: o.measurement || "",
                    responsibility: o.responsibility || o.Responsibility || "",
                    frequency: o.frequency || o.frequencyOfReview || "Monthly",
                    target: o.target || o.targetOfAchievement || o["Metric Mapping / Target"] || "100%",
                    actionPlans: o.actionPlans || "",
                    actualAchievement: o.actualAchievement || o["Actual Acievement"] || "",
                    selected: true
                });
            }
        }
      });
      if (initialOrgs.length === 0) {
        initialOrgs.push({ id: `org-${Date.now()}`, text: "", metric: "", responsibility: "", frequency: "", target: "", selected: true });
      }
      setOrgObjectives(initialOrgs);
      setDeptObjectives(initialDepts);

      setShowFrameworkModal(false);
      setCurrentStep(1);
    }
  };

  const handleConfirmCopy = async () => {
    if (pendingCopyPlan) {
      const { frameworkName, existingPlan } = pendingCopyPlan;
      const updatedPlan = {
        ...existingPlan,
        frameworks: [...(existingPlan.frameworks || []), frameworkName]
      };
      setSelectedFramework(updatedPlan);

      const defaultRows = await fetchDefaultObjectives(pendingCopyPlan.domain);
      const initialOrgs = [];
      const initialDepts = [];
      defaultRows.forEach((o, i) => {
        const isBackendOrg = o.level === 'ORG' || o.level === 'organization';
        const isBackendDept = o.level === 'DEPT' || o.level === 'department';
        
        let orgObj = null;

        const orgText = isBackendOrg ? o.objective : (o["Organization Objective"] || o.organizationObjective || o.objective || "");
        if (orgText && !isBackendDept) {
            orgObj = initialOrgs.find(org => org.text === orgText);
            if (!orgObj) {
                orgObj = {
                    id: (isBackendOrg ? o.id : null) || `org-${Date.now()}-${i}`,
                    text: orgText,
                    metric: o.metric || o.organizationMetric || o["Organization Metric (KPI)"] || "",
                    measurement: o.measurement || "",
                    responsibility: o.responsibility || o.Responsibility || "",
                    frequency: o.frequency || o.frequencyOfReview || "Annually",
                    target: o.target || o.targetOfAchievement || o["Metric Mapping / Target"] || "100%",
                    actionPlans: o.actionPlans || "",
                    actualAchievement: o.actualAchievement || o["Actual Acievement"] || "",
                    selected: false
                };
                initialOrgs.push(orgObj);
            }
        }

        const deptName = (o["Department Name"] || o.department || o.dept || "").trim();
        const deptText = isBackendDept ? o.objective : (o["Department Objective"] || o.departmentObjective || "");
        if (deptName && deptText && !isBackendOrg) {
            if (!initialDepts.find(d => d.dept === deptName && d.text === deptText)) {
                const mappedOrgId = isBackendDept ? o.orgObjectiveId : (orgObj ? orgObj.id : null);
                initialDepts.push({
                    id: (isBackendDept ? o.id : null) || `dept-${Date.now()}-${i}`,
                    orgObjectiveId: mappedOrgId,
                    dept: deptName,
                    department: deptName,
                    text: deptText,
                    deptMetric: o.metric || o.departmentMetric || o["Department Metric (KPI)"] || "",
                    measurement: o.measurement || "",
                    responsibility: o.responsibility || o.Responsibility || "",
                    frequency: o.frequency || o.frequencyOfReview || "Monthly",
                    target: o.target || o.targetOfAchievement || o["Metric Mapping / Target"] || "100%",
                    actionPlans: o.actionPlans || "",
                    actualAchievement: o.actualAchievement || o["Actual Acievement"] || "",
                    selected: false
                });
            }
        }
      });
      if (initialOrgs.length === 0) {
        initialOrgs.push({ id: `org-${Date.now()}`, text: "", metric: "", responsibility: "", frequency: "", target: "", selected: true });
      }
      setOrgObjectives(initialOrgs);
      setDeptObjectives(initialDepts);

      setShowCopyModal(false);
      setShowFrameworkModal(false);
      setCurrentStep(1);
      setPendingCopyPlan(null);
    }
  };

  const handleOrgObjectiveChange = (id, field, value) => {
    setOrgObjectives(prev => prev.map(obj => obj.id === id ? { ...obj, [field]: value } : obj));
  };
  const handleAddOrgObjective = () => {
    const newId = `org-${Date.now()}`;
    setOrgObjectives(prev => [...prev, { id: newId, text: "", metric: "", responsibility: "", frequency: "", target: "", selected: true }]);
  };
  const handleRemoveOrgObjective = (id) => {
    setOrgObjectives(prev => prev.filter(obj => obj.id !== id));
  };

  const handleDeptObjectiveChange = (id, field, value) => {
    setDeptObjectives(prev => prev.map(obj => obj.id === id ? { ...obj, [field]: value } : obj));
  };
  const handleAddDeptObjective = (dept, orgObjectiveId) => {
    const newId = `dept-${Date.now()}`;
    if (dept && typeof dept === 'string') {
      const cat = availableDepartments.find(d => (d.id === dept || d._id === dept || d.name === dept))?.mapping || dept;
      setDeptObjectives(prev => [...prev, { id: newId, orgObjectiveId, dept: cat, text: "", deptMetric: "", frequency: "", target: "", selected: true }]);
      setVisibleDeptObjectiveIds(prev => ({ ...prev, [dept]: [...(prev[dept] || []), newId] }));
    } else {
      setDeptObjectives(prev => [...prev, { id: newId, orgObjectiveId, dept: "", text: "", deptMetric: "", frequency: "", target: "", selected: true }]);
    }
  };
  const handleRemoveDeptObjective = (id) => {
    setDeptObjectives(prev => prev.filter(obj => obj.id !== id));
  };  const handleSubmitPlan = async () => {
    setIsSaving(true);
    setLoadingMessage("Verifying department approvals...");

    // Refetch — Risk Owners approve/reject asynchronously outside this
    // wizard, so local state can be stale by the time Submit is clicked.
    let freshPlan = null;
    try {
      freshPlan = selectedFramework?.id ? await getPlanById(selectedFramework.id) : null;
    } catch (err) {
      console.error("Failed to refresh plan before submission:", err);
    }

    const departmentReviews = freshPlan?.departmentReviews || selectedFramework?.departmentReviews || [];
    // Authoritative — already has proposedForDeletion rows purged by plan-service on accept.
    const authoritativeDeptObjectives = freshPlan?.deptObjectives || deptObjectives;

    const unapprovedDepts = [];

    allSelectedDepts.forEach(dept => {
      const cat = availableDepartments.find(d => (d.id === dept || d._id === dept || d.name === dept))?.mapping || dept;
      const lowerCat = cat.toLowerCase().trim();
      if (lowerCat.includes("steering committee") || lowerCat.includes("steeringcommittee") || lowerCat.includes("security officer")) return;

      const getBackendDeptNames = (fDept) => {
        const f = (fDept || "").toLowerCase().trim();
        if (f === "admin" || f === "facilities") return ["Admin & Facilities"];
        if (f === "it infra") return ["IT Infrastructure"];
        if (f === "it applications" || f === "it" || f === "it department" || f === "it dept") return ["IT Applications / Software Development"];
        if (f === "vendor management" || f === "procurement") return ["Vendor Management / Procurement"];
        if (f === "legal") return ["Legal & Compliance"];
        if (f === "hr" || f === "human resources") return ["Human Resources"];
        return [];
      };
      const mappedBackendNames = getBackendDeptNames(cat).map(n => n.toLowerCase());
      mappedBackendNames.push(lowerCat);

      const availableDeptObjs = authoritativeDeptObjectives.filter(dObj => (dObj.dept || dObj.department) && mappedBackendNames.includes((dObj.dept || dObj.department).toLowerCase().trim()));
      const activeIds = visibleDeptObjectiveIds[dept] || availableDeptObjs.map(o => o.id);
      const activeObjs = availableDeptObjs.filter(o => activeIds.includes(o.id));

      if (activeObjs.length > 0) {
        const review = departmentReviews.find(r => r.departmentId === dept);
        if (!review || review.reviewStatus !== "ACCEPTED") {
          unapprovedDepts.push(cat);
        }
      }
    });

    if (unapprovedDepts.length > 0) {
      setIsSaving(false);
      alert(`You cannot submit the plan until all department objectives have been reviewed and approved by their Risk Owners.\n\nUnapproved departments: ${unapprovedDepts.join(', ')}`);
      return;
    }

    const planData = {
      scopeData,
      orgAssignments,
      globalRoles,
      orgObjectives: orgObjectives.filter(o => o.selected),
      deptObjectives: authoritativeDeptObjectives, // never resubmit the stale wizard copy
      corePolicyStatement,
      visibleOrgObjectiveIds,
      visibleDeptObjectiveIds,
    };

    const orgId = user?.organization?._id || user?.organization || "UNKNOWN_ORG";
    const userId = user?._id || user?.id || "UNKNOWN_USER";

    setLoadingMessage("Submitting complete plan and finalizing objectives & roles...");

    try {
      await upsertPlan({
        id: selectedFramework?.id || null, // null for new plans
        userId: userId,
        organizationId: orgId,
        frameworks: selectedFramework?.frameworks || [],
        domain: selectedFramework?.domain || "Unknown",
        status: "Completed",
        createdAt: selectedFramework?.createdAt || new Date().toISOString(),
        ...selectedFramework,
        ...planData
      });
      alert("Plan saved successfully!");
      router.push("/plan");
    } catch (err) {
      alert(err.response?.data || "Failed to save plan. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDraft = async () => {
    const planData = {
      scopeData,
      orgAssignments,
      globalRoles,
      orgObjectives: orgObjectives.filter(o => o.selected),
      deptObjectives,
      corePolicyStatement,
      currentStep,
      visibleOrgObjectiveIds,
      visibleDeptObjectiveIds
    };

    const orgId = user?.organization?._id || user?.organization || "UNKNOWN_ORG";
    const userId = user?._id || user?.id || "UNKNOWN_USER";

    setIsSaving(true);
    setLoadingMessage(`Saving draft plan progress for ${getStepLabel(currentStep)}...`);

    try {
      await upsertPlan({
        id: selectedFramework?.id || null, // null for new plans
        userId: userId,
        organizationId: orgId,
        frameworks: selectedFramework?.frameworks || [],
        domain: selectedFramework?.domain || "Unknown",
        status: "Draft",
        createdAt: selectedFramework?.createdAt || new Date().toISOString(),
        ...selectedFramework,
        ...planData
      });

      alert("Draft saved successfully!");
      router.push("/plan");
    } catch (err) {
      alert("Failed to save draft. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const getStepLabel = (step) =>
    ["Scoping", "Org Structuring", "Org Objectives", "Dept Objectives", "Metrics Mapping"][step - 1];

  const renderFormContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <ScopeForm
            locations={locations}
            scopeData={scopeData}
            actualOrgName={actualOrgName}
            availableDepartments={availableDepartments}
            handleScopeChange={handleScopeChange}
            handleAddLocation={handleAddLocation}
            handleDeptToggle={handleDeptToggle}
            handleGlobalServiceChange={handleGlobalServiceChange}
            setShowAddDeptModal={setShowAddDeptModal}
          />
        );
      case 2:
        return (
          <GlobalRolesForm
            allSelectedDepts={allSelectedDepts}
            allUsers={deptFilteredUsers}
            globalRoles={globalRoles}
            setGlobalRoles={setGlobalRoles}
            orgAssignments={orgAssignments}
            orgViewMode={orgViewMode}
            setOrgViewMode={setOrgViewMode}
            getFilteredUsers={getFilteredUsers}
            getUserName={getUserName}
            handleAddGlobalRoleUser={handleAddGlobalRoleUser}
            handleRemoveGlobalRoleUser={handleRemoveGlobalRoleUser}
            handleOrgAssignmentChange={handleOrgAssignmentChange}
            handleAddOrgAssignmentUser={handleAddOrgAssignmentUser}
            handleRemoveOrgAssignmentUser={handleRemoveOrgAssignmentUser}
            setShowAddUserModal={setShowAddUserModal}
          />
        );
      case 3:
        return (
          <OrgObjectivesForm
            orgObjectives={orgObjectives}
            handleOrgObjectiveChange={handleOrgObjectiveChange}
            handleAddOrgObjective={handleAddOrgObjective}
            handleRemoveOrgObjective={handleRemoveOrgObjective}
          />
        );
      case 4:
        return (
          <DeptObjectivesForm
            allSelectedDepts={allSelectedDepts}
            availableDepartments={availableDepartments}
            deptObjectives={deptObjectives}
            orgObjectives={orgObjectives}
            visibleDeptObjectiveIds={visibleDeptObjectiveIds}
            setVisibleDeptObjectiveIds={setVisibleDeptObjectiveIds}
            handleDeptObjectiveChange={handleDeptObjectiveChange}
            handleAddDeptObjective={handleAddDeptObjective}
            handleRemoveDeptObjective={handleRemoveDeptObjective}
            orgAssignments={orgAssignments}
            allUsers={allUsers}
            planId={selectedFramework?.id || selectedFramework?._id}
            organizationId={user?.organization?._id || user?.organization || "UNKNOWN_ORG"}
            reporterName={user?.name || "System"}
            reporterId={user?._id || user?.id}
            departmentReviews={selectedFramework?.departmentReviews || []}
          />
        );
      case 5: {
        const activeDeptObjs = [];
        allSelectedDepts.forEach(dept => {
          const cat = availableDepartments.find(d => (d.id === dept || d._id === dept || d.name === dept))?.mapping || dept;
          const lowerCat = cat.toLowerCase().trim();
          if (lowerCat.includes("steering committee") || lowerCat.includes("steeringcommittee") || lowerCat.includes("security officer")) return;

          const getBackendDeptNames = (fDept) => {
            const f = (fDept || "").toLowerCase().trim();
            if (f === "admin" || f === "facilities") return ["Admin & Facilities"];
            if (f === "it infra") return ["IT Infrastructure"];
            if (f === "it applications" || f === "it" || f === "it department" || f === "it dept") return ["IT Applications / Software Development"];
            if (f === "vendor management" || f === "procurement") return ["Vendor Management / Procurement"];
            if (f === "legal") return ["Legal & Compliance"];
            if (f === "hr" || f === "human resources") return ["Human Resources"];
            return [];
          };
          const mappedBackendNames = getBackendDeptNames(cat).map(n => n.toLowerCase());
          mappedBackendNames.push(lowerCat);
          
          const availableDeptObjs = deptObjectives.filter(dObj => (dObj.dept || dObj.department) && mappedBackendNames.includes((dObj.dept || dObj.department).toLowerCase().trim()));
          const activeIds = visibleDeptObjectiveIds[dept] || availableDeptObjs.map(o => o.id);
          activeDeptObjs.push(...availableDeptObjs.filter(o => activeIds.includes(o.id)));
        });

        return (
          <CorePolicyStatementForm
            orgObjectives={orgObjectives.filter(o => o.selected)}
            deptObjectives={activeDeptObjs}
          />
        );
      }
      default:
        return null;
    }
  };

  if (!mounted) return null;

  if (isResuming) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f8fafc' }}>
        <Loader2 size={48} className="animate-spin text-blue-600 mb-4" />
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a' }}>Continuing from where you left off...</h2>
        <p style={{ color: '#64748b', marginTop: '8px' }}>Loading your saved progress.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/30 flex flex-col overflow-hidden">
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-2 lg:py-6 pb-20 lg:pb-26 overflow-hidden">
        {/* Top Header with Back to Dashboard button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', background: 'white', padding: '12px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <button
            onClick={() => router.push("/plan")}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              color: '#334155',
              fontSize: '13px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <ArrowLeft size={16} /> Back
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#0f172a' }}>
              Step {currentStep} of 5:
            </span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#4f46e5', background: '#e0e7ff', padding: '4px 10px', borderRadius: '20px' }}>
              {getStepLabel(currentStep)}
            </span>
          </div>
        </div>

        <div className="msf-wrapper" style={{ padding: 0 }}>
          <div className="msf-layout">
            <div className="msf-stepper" style={{ paddingBottom: '32px' }}>
              <div className="msf-stepper-line-bg"></div>
              <div
                className="msf-stepper-line-active"
                style={{ width: `${((currentStep - 1) / 4) * 80}%` }}
              ></div>

              {[1, 2, 3, 4, 5].map((step) => {
                const isCompleted = currentStep > step;
                const isActive = currentStep === step;
                return (
                  <div key={step} className="msf-step">
                    <div className={`msf-step-circle ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
                      {isCompleted ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      ) : step}
                    </div>
                    <span className={`msf-step-label ${isActive || isCompleted ? 'active' : ''}`}>
                      <span>{getStepLabel(step)}</span>
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="msf-main">{renderFormContent()}</div>
          </div>

          <div className="msf-nav">
            <div style={{ display: 'flex', gap: '12px' }}>
              {currentStep > 1 && (
                <button onClick={() => setCurrentStep(prev => prev - 1)} className="msf-btn msf-btn--prev">
                  ← Previous
                </button>
              )}
              <button onClick={handleSaveDraft} className="msf-btn" style={{ background: '#f8fafc', color: '#475569', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>
                Save Progress
              </button>
            </div>
            {currentStep < 5 ? (
              <button onClick={() => setCurrentStep(prev => prev + 1)} className="msf-btn msf-btn--next">
                Next →
              </button>
            ) : (
              <button onClick={handleSubmitPlan} className="msf-btn msf-btn--submit">
                Submit Plan
              </button>
            )}
          </div>
        </div>

        {/* Loading Overlay Animation when saving/submitting */}
        {isSaving && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
            <div style={{ background: 'white', padding: '32px 48px', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <Loader2 size={44} className="animate-spin text-blue-600 mb-4" />
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>{loadingMessage || "Saving Plan Progress..."}</h3>
              <p style={{ fontSize: '13px', color: '#64748b', marginTop: '6px', margin: 0 }}>Please wait while your data is being updated.</p>
            </div>
          </div>
        )}

        {/* Actual Admin Department Creation Modal */}
        {showAddDeptModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: 'white', borderRadius: '12px', width: '500px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 16px 0' }}>
                <button
                  onClick={() => setShowAddDeptModal(false)}
                  style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}
                >
                  &times;
                </button>
              </div>
              <div style={{ padding: '0 24px 24px' }}>
                <CreateDept
                  embedded={true}
                  existingDepartments={availableDepartments}
                  onSuccess={handleCreateDeptSuccess}
                  onCancel={() => setShowAddDeptModal(false)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Create User Modal */}
        {showAddUserModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1100,
              padding: '20px',
            }}
          >
            <div
              style={{
                background: '#ffffff',
                borderRadius: '20px',
                width: '640px',
                maxWidth: '100%',
                maxHeight: '92vh',
                overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(226, 232, 240, 0.8)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Modal Header */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                  padding: '20px 24px',
                  borderBottom: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
                      color: '#4338ca',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(99, 102, 241, 0.2)',
                    }}
                  >
                    <UserPlus size={22} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: 0, letterSpacing: '-0.3px' }}>
                      Create New User
                    </h3>
                    <p style={{ margin: '2px 0 0', fontSize: '12.5px', color: '#64748b' }}>
                      Provision user credentials and assign roles
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddUserModal(false)}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    background: '#ffffff',
                    color: '#64748b',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f1f5f9';
                    e.currentTarget.style.color = '#0f172a';
                    e.currentTarget.style.borderColor = '#cbd5e1';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#ffffff';
                    e.currentTarget.style.color = '#64748b';
                    e.currentTarget.style.borderColor = '#e2e8f0';
                  }}
                  title="Close"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div
                style={{
                  padding: '24px 28px',
                  overflowY: 'auto',
                  maxHeight: 'calc(92vh - 84px)',
                }}
              >
                <CreateUser
                  embedded={true}
                  onSuccess={() => {
                    fetchUsers();
                    setShowAddUserModal(false);
                  }}
                  onCancel={() => setShowAddUserModal(false)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Framework Selection Modal */}
        {showFrameworkModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: 'white', borderRadius: '12px', width: '600px', maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>Select Framework</h2>
                <button
                  onClick={() => { setShowFrameworkModal(false); setFrameworkError(""); router.push("/plan"); }}
                  style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#64748b' }}
                >
                  &times;
                </button>
              </div>
              <div style={{ padding: '24px' }}>
                {existingFrameworkPlan ? (
                  <div style={{ padding: '16px', background: '#e0f2fe', border: '1px solid #0ea5e9', borderRadius: '8px', color: '#0369a1', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <AlertTriangle size={20} className="flex-shrink-0" />
                      <p style={{ margin: 0, fontSize: '14px', fontWeight: 500 }}>
                        This framework already exists in a {existingFrameworkPlan.status === 'Draft' ? 'draft' : 'saved'} plan.
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button onClick={() => setExistingFrameworkPlan(null)} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #0369a1', color: '#0369a1', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                      <button onClick={() => { 
                         setShowFrameworkModal(false);
                         setExistingFrameworkPlan(null);
                         router.push(`/plan/create?id=${existingFrameworkPlan.id || existingFrameworkPlan._id}`);
                      }} style={{ padding: '8px 16px', background: '#0369a1', border: 'none', color: 'white', borderRadius: '6px', cursor: 'pointer' }}>
                        Resume Plan
                      </button>
                    </div>
                  </div>
                ) : frameworkError && (
                  <div style={{ padding: '16px', background: '#fee2e2', border: '1px solid #ef4444', borderRadius: '8px', color: '#991b1b', marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <AlertTriangle size={20} className="flex-shrink-0" />
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: 500 }}>{frameworkError}</p>
                  </div>
                )}
                
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#334155', marginBottom: '16px' }}>Select Domain</h3>
                {frameworksLoading ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', gap: '12px', color: '#64748b' }}>
                    <Loader2 className="animate-spin" size={24} />
                    <span style={{ fontSize: '14px', fontWeight: 500 }}>Loading available frameworks...</span>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '24px' }}>
                    {(() => {
                      let totalVisibleCount = 0;
                      const domainElements = Object.entries(FRAMEWORK_DOMAINS).map(([domain, frameworks]) => {
                        const visibleFrameworks = frameworks.filter(fw => {
                          const fwNorm = normalizeFwCode(fw);
                          return allowedFrameworkNorms.has(fwNorm);
                        });

                        if (visibleFrameworks.length === 0) return null;
                        totalVisibleCount += visibleFrameworks.length;

                        return (
                          <div key={domain}>
                            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#334155', marginBottom: '12px', borderBottom: '2px solid #e2e8f0', paddingBottom: '4px' }}>
                              {domain}
                            </h3>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                              {visibleFrameworks.map(fw => (
                                <button
                                  key={fw}
                                  onClick={() => handleFrameworkSelect(fw, domain)}
                                  style={{
                                    padding: '8px 16px',
                                    borderRadius: '20px',
                                    background: '#fff',
                                    border: '1px solid #3b82f6',
                                    color: '#3b82f6',
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                  }}
                                  onMouseOver={(e) => e.currentTarget.style.background = '#eff6ff'}
                                  onMouseOut={(e) => e.currentTarget.style.background = '#fff'}
                                >
                                  {fw}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      });

                      // Find any unmapped frameworks in allowedFrameworkNorms
                      const allDomainFrameworksNorms = new Set(
                        Object.values(FRAMEWORK_DOMAINS).flat().map(fw => normalizeFwCode(fw))
                      );
                      const unmappedFrameworks = Array.from(allowedFrameworkNorms).filter(
                        norm => !allDomainFrameworksNorms.has(norm)
                      );

                      if (unmappedFrameworks.length > 0) {
                        totalVisibleCount += unmappedFrameworks.length;
                      }

                      if (totalVisibleCount === 0) {
                        return (
                          <div style={{ textAlign: 'center', padding: '30px 10px', color: '#64748b' }}>
                            <p style={{ margin: 0, fontSize: '15px', fontWeight: 500 }}>
                              No frameworks are currently assigned to your organization.
                            </p>
                            <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#94a3b8' }}>
                              Please contact your organization administrator to add frameworks.
                            </p>
                          </div>
                        );
                      }

                      return (
                        <>
                          {domainElements}
                          {unmappedFrameworks.length > 0 && (
                            <div key="other-frameworks">
                              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#334155', marginBottom: '12px', borderBottom: '2px solid #e2e8f0', paddingBottom: '4px' }}>
                                Other Frameworks
                              </h3>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                {unmappedFrameworks.map(norm => {
                                  const origObj = availableFrameworks.find(f => normalizeFwCode(f) === norm);
                                  const displayName = origObj ? (origObj.label || origObj.id || origObj.code) : norm;
                                  return (
                                    <button
                                      key={norm}
                                      onClick={() => handleFrameworkSelect(displayName, "Security")}
                                      style={{
                                        padding: '8px 16px',
                                        borderRadius: '20px',
                                        background: '#fff',
                                        border: '1px solid #3b82f6',
                                        color: '#3b82f6',
                                        fontSize: '13px',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                      }}
                                      onMouseOver={(e) => e.currentTarget.style.background = '#eff6ff'}
                                      onMouseOut={(e) => e.currentTarget.style.background = '#fff'}
                                    >
                                      {displayName}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Copy Modal */}
        {showCopyModal && pendingCopyPlan && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
            <div style={{ background: 'white', borderRadius: '12px', width: '500px', maxWidth: '90%', padding: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0f172a', marginBottom: '16px' }}>Would you like to continue from where you left off?</h2>
              <p style={{ color: '#475569', fontSize: '15px', lineHeight: '1.5', marginBottom: '24px' }}>
                It seems you are selecting <strong>{pendingCopyPlan.frameworkName}</strong> from the <strong>{pendingCopyPlan.domain}</strong> domain, which already has an active plan (<em>{(pendingCopyPlan.existingPlan.frameworks || []).join(", ")}</em>).
                <br /><br />
                By industry standards, the framework that you have already worked on is getting copied to the one that you are trying to work on now.
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  onClick={() => { setShowCopyModal(false); setPendingCopyPlan(null); }}
                  style={{ padding: '10px 16px', borderRadius: '8px', background: '#f1f5f9', color: '#475569', border: 'none', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmCopy}
                  style={{ padding: '10px 20px', borderRadius: '8px', background: '#3b82f6', color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer' }}
                >
                  Apply to {pendingCopyPlan.frameworkName}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default PlanMultiStepManager;
