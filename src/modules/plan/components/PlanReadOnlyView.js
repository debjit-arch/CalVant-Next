"use client";
import React, { useState, useEffect } from 'react';
import taskService from '../../taskManagement/services/taskService';
import {
  Building2,
  Users,
  ShieldCheck,
  Globe,
  Calendar,
  Target,
  FileText,
  CheckCircle2,
  List,
  Network,
  ArrowDown,
  Clock,
  Layers,
  X,
  AlertCircle
} from 'lucide-react';

/**
 * PlanReadOnlyView
 * 
 * Displays a complete 3-part view of a Plan:
 * 1. Scoping Details (Domain, Frameworks, Locations, Services, In-Scope Departments)
 * 2. Organizational Hierarchy (Tree View showing Internal Auditors, Steering Committee, CISO, and Departments with Risk Owner, Risk Manager, Process Owner)
 * 3. Selected Objectives & Metrics (Organization Objectives with associated Department Objectives and Metrics/Targets)
 * 
 * Supports both Draft and Completed plans (for Drafts, shows what has been configured so far).
 */
const PlanReadOnlyView = ({ plan = {}, allUsers = [], onClose }) => {
  // Helper to resolve user names from IDs
  const getUserName = (userId) => {
    if (!userId) return "Unassigned";
    const user = allUsers.find(u => (u.id || u._id) === userId);
    if (!user) return userId;
    return user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || userId;
  };

  const [mergedPlan, setMergedPlan] = useState(plan);
  const [loadingTasks, setLoadingTasks] = useState(true);

  useEffect(() => {
    if (plan) {
      setMergedPlan(plan);
    }
    setLoadingTasks(false);
  }, [plan]);

  // Safely extract properties (handling dynamic properties map if any)
  const domain = mergedPlan.domain || mergedPlan.extraProperties?.domain || "Security";
  const frameworks = mergedPlan.frameworks || mergedPlan.extraProperties?.frameworks || [];
  const status = mergedPlan.status || "Completed";
  const isDraft = status === "Draft";
  const scopeData = mergedPlan.scopeData || mergedPlan.extraProperties?.scopeData || {};
  const globalRoles = mergedPlan.globalRoles || mergedPlan.extraProperties?.globalRoles || { steeringCommittee: [], internalAuditor: [], ciso: "" };
  const orgAssignments = mergedPlan.orgAssignments || mergedPlan.extraProperties?.orgAssignments || {};
  const orgObjectives = mergedPlan.orgObjectives || mergedPlan.extraProperties?.orgObjectives || [];
  const deptObjectives = mergedPlan.deptObjectives || mergedPlan.extraProperties?.deptObjectives || [];

  // Extract all unique selected departments from scopeData
  const allSelectedDepts = Array.from(new Set(
    Object.values(scopeData).flatMap(loc => loc.depts || []).filter(Boolean)
  ));

  // Extract visibleOrgObjectiveIds map from plan if available
  const visibleOrgObjectiveIds = plan.visibleOrgObjectiveIds || plan.extraProperties?.visibleOrgObjectiveIds || {};

  // Filter organization objectives to ONLY include those belonging to selected departments
  const filteredOrgObjectives = orgObjectives.filter(orgObj => {
    if (!allSelectedDepts || allSelectedDepts.length === 0) return false;

    // Strictly check if this orgObj ID is listed in visibleOrgObjectiveIds for any selected department
    const isVisibleInSelectedDept = allSelectedDepts.some(dept => {
      const activeIds = visibleOrgObjectiveIds[dept] || [];
      return activeIds.some(id => String(id) === String(orgObj.id));
    });

    return isVisibleInSelectedDept;
  });

  if (loadingTasks) {
    return (
      <div className="w-full bg-slate-50 min-h-[50vh] p-8 flex flex-col items-center justify-center text-slate-500">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
        <p className="font-medium">Loading finalized plan objectives...</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-50 min-h-screen p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-200/80 overflow-hidden">

        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 md:p-8 relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${isDraft ? "bg-amber-500/20 text-amber-300 border border-amber-500/40" : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                }`}>
                {isDraft ? "Draft Plan" : "Completed Plan"}
              </span>
              <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 text-xs font-bold">
                {domain} Domain
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <FileText className="w-7 h-7 text-blue-400" />
              {frameworks.length > 0 ? frameworks.join(" + ") : "Compliance Plan"}
            </h1>
            <p className="text-slate-300 text-sm mt-1">
              Created: {plan.createdAt ? (plan.createdAt.includes("T") ? new Date(plan.createdAt).toLocaleDateString() : plan.createdAt) : "Recently"}
            </p>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all duration-200 flex items-center justify-center"
              title="Close View"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <div className="p-6 md:p-8 space-y-10">

          {/* ================= PART 1: SCOPING DETAILS ================= */}
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">1</div>
                Part 1: Scoping Details
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Domain & Frameworks</label>
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="font-semibold text-slate-800">{domain}:</span>
                  {frameworks.map(fw => (
                    <span key={fw} className="bg-slate-100 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-md text-xs font-semibold">
                      {fw}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">In-Scope Departments ({allSelectedDepts.length})</label>
                <div className="flex flex-wrap gap-1.5">
                  {allSelectedDepts.length > 0 ? (
                    allSelectedDepts.map(dept => (
                      <span key={dept} className="bg-indigo-50 border border-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full text-xs font-medium">
                        {dept}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400 italic text-sm">No departments specified yet.</span>
                  )}
                </div>
              </div>

              {/* Location & Services Breakdown */}
              <div className="md:col-span-2 mt-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Scope Breakdown by Location</label>
                {Object.keys(scopeData).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(scopeData).map(([locName, data]) => (
                      <div key={locName} className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Globe className="w-4 h-4 text-blue-500" />
                          <h4 className="font-bold text-slate-800 text-sm">{locName}</h4>
                        </div>
                        {data.services && (
                          <p className="text-xs text-slate-600 mb-2">
                            <span className="font-semibold text-slate-700">Services:</span> {data.services}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-1">
                          {(data.depts || []).map(d => (
                            <span key={d} className="bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded text-[11px]">
                              {d}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 italic text-sm">No location scope data available.</p>
                )}
              </div>
            </div>
          </section>


          {/* ================= PART 2: TREE VIEW (ORG STRUCTURE) ================= */}
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">2</div>
                Part 2: Organizational Structure (Tree View)
              </h2>
            </div>

            <div className="p-6 bg-gradient-to-b from-slate-50 to-slate-100/70 rounded-xl border border-slate-200 overflow-x-auto relative">
              <div className="flex flex-col items-center min-w-max mx-auto">

                {/* Top Roles */}
                <div className="flex justify-center gap-14 relative mb-2">
                  <div className="flex flex-col items-center z-10">
                    <div className="bg-white border border-dashed border-slate-300 text-slate-800 px-6 py-4 rounded-xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] flex flex-col items-center gap-1 transition-all">
                      <div className="flex items-center gap-2 font-bold text-xs text-slate-600 uppercase tracking-wider">
                        <Users size={16} className="text-slate-500" /> Internal Auditor
                      </div>
                      <div className="text-xs font-semibold text-slate-800 max-w-[200px] text-center truncate">
                        {(globalRoles.internalAuditor || []).length > 0
                          ? (globalRoles.internalAuditor || []).map(id => getUserName(id)).join(", ")
                          : "Unassigned"}
                      </div>
                    </div>
                  </div>

                  {/* Dotted Line Connection */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 border-t-2 border-dashed border-slate-300 z-0"></div>

                  <div className="flex flex-col items-center z-10">
                    <div className="bg-gradient-to-br from-slate-700 to-slate-900 border border-slate-800 text-white px-6 py-4 rounded-xl shadow-lg ring-4 ring-slate-100/50 flex flex-col items-center gap-1 transition-all">
                      <div className="flex items-center gap-2 font-bold text-xs text-slate-300 uppercase tracking-wider">
                        <Users size={16} className="text-indigo-400" /> ISMS Steering Committee
                      </div>
                      <div className="text-xs font-semibold text-slate-100 max-w-[200px] text-center truncate">
                        {(globalRoles.steeringCommittee || []).length > 0
                          ? (globalRoles.steeringCommittee || []).map(id => getUserName(id)).join(", ")
                          : "Unassigned"}
                      </div>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-0.5 h-4 bg-slate-300"></div>
                      <ArrowDown size={14} className="text-slate-400 -mt-0.5" />
                    </div>
                  </div>
                </div>

                {/* CISO Node */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3.5 rounded-xl shadow-lg ring-4 ring-blue-50/80 flex flex-col items-center gap-1 my-1 ml-[314px] transition-all">
                  <div className="flex items-center gap-2 font-bold text-xs text-blue-200 uppercase tracking-wider">
                    <ShieldCheck size={18} className="text-white" /> Chief Information Security Officer (CISO)
                  </div>
                  <div className="text-sm font-bold text-white max-w-[250px] text-center truncate">
                    {globalRoles.ciso ? getUserName(globalRoles.ciso) : "Unassigned"}
                  </div>
                </div>

                {/* Split Line to Risk Owner and Process Owner */}
                <div className="flex flex-col items-center w-full ml-[314px]">
                  <div className="flex flex-col items-center">
                    <div className="w-0.5 h-4 bg-slate-300"></div>
                  </div>
                  <div className="h-0.5 bg-slate-300 w-[400px]"></div>

                  {/* Level 3: Risk Owner and Process Owner Branches */}
                  <div className="flex justify-center gap-24 mt-0">

                    {/* Risk Owner Branch */}
                    <div className="flex flex-col items-center w-[300px]">
                      <div className="flex flex-col items-center relative">
                        <div className="w-0.5 h-3 bg-slate-300"></div>
                        <ArrowDown size={14} className="text-slate-400 -mt-0.5" />
                      </div>

                      {/* Risk Owner Header Bar */}
                      <div className="bg-gradient-to-r from-sky-500 to-blue-600 border border-blue-500 text-white px-4 py-2.5 rounded-lg w-full text-center font-bold shadow-md z-10 text-sm tracking-wide mt-1 ring-2 ring-sky-50 transition-all">
                        Risk Owner
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="w-0.5 h-3 bg-slate-300"></div>
                        <ArrowDown size={14} className="text-slate-400 -mt-0.5 mb-1" />
                      </div>

                      {/* Dotted Container for Departments under Risk Owner */}
                      <div className="border border-dashed border-blue-300 rounded-xl p-4 flex flex-col gap-3 w-full bg-blue-50/30">
                        {allSelectedDepts.map(dept => {
                          const rO = allUsers.find(u => (u.id || u._id) === orgAssignments[dept]?.riskOwner);
                          return (
                            <div key={dept} className="bg-white border-l-4 border-l-amber-400 border border-y-slate-200 border-r-slate-200 text-slate-800 p-3 rounded-lg text-center shadow-sm hover:shadow-md transition-shadow">
                              <div className="font-bold text-slate-800 text-sm mb-1">{dept}</div>
                              <div className="text-xs font-semibold text-slate-500">
                                {rO ? (rO.name || rO.email) : 'Unassigned'}
                              </div>
                            </div>
                          );
                        })}
                        {allSelectedDepts.length === 0 && (
                          <div className="text-center text-slate-400 text-xs py-2">No departments</div>
                        )}
                      </div>
                    </div>

                    {/* Process Owner Branch */}
                    <div className="flex flex-col items-center w-[300px]">
                      <div className="flex flex-col items-center relative">
                        <div className="w-0.5 h-3 bg-slate-300"></div>
                        <ArrowDown size={14} className="text-slate-400 -mt-0.5" />
                      </div>

                      {/* Process Owner Header Bar */}
                      <div className="bg-gradient-to-r from-sky-500 to-blue-600 border border-blue-500 text-white px-4 py-2.5 rounded-lg w-full text-center font-bold shadow-md z-10 text-sm tracking-wide mt-1 ring-2 ring-sky-50 transition-all">
                        Process Owner
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="w-0.5 h-3 bg-slate-300"></div>
                        <ArrowDown size={14} className="text-slate-400 -mt-0.5 mb-1" />
                      </div>

                      {/* Dotted Container for Departments under Process Owner */}
                      <div className="border border-dashed border-blue-300 rounded-xl p-4 flex flex-col gap-3 w-full bg-blue-50/30">
                        {allSelectedDepts.map(dept => {
                          const pOIds = Array.isArray(orgAssignments[dept]?.processOwner) ? orgAssignments[dept].processOwner : (orgAssignments[dept]?.processOwner ? [orgAssignments[dept].processOwner] : []);
                          const pOUsers = pOIds.map(id => allUsers.find(u => (u.id || u._id) === id)).filter(Boolean);

                          return (
                            <div key={dept} className="bg-white border-l-4 border-l-amber-400 border border-y-slate-200 border-r-slate-200 text-slate-800 p-3 rounded-lg text-center shadow-sm hover:shadow-md transition-shadow">
                              <div className="font-bold text-slate-800 text-sm mb-1">{dept}</div>
                              <div className="text-xs font-semibold text-slate-500">
                                {pOUsers.length > 0 ? pOUsers.map(u => u.name || u.email).join(', ') : 'Unassigned'}
                              </div>
                            </div>
                          );
                        })}
                        {allSelectedDepts.length === 0 && (
                          <div className="text-center text-slate-400 text-xs py-2">No departments</div>
                        )}
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            </div>
          </section>


          {/* ================= PART 3: OBJECTIVES & METRICS ================= */}
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-sm">3</div>
                Part 3: Objectives & Metrics View
              </h2>
            </div>

            {filteredOrgObjectives.length > 0 || deptObjectives.length > 0 ? (
              <div className="space-y-6">
                {filteredOrgObjectives.map((orgObj, i) => {
                  const linkedDeptObjs = deptObjectives.filter(d => {
                    // MUST match this organization objective
                    if (String(d.orgObjectiveId) !== String(orgObj.id)) return false;

                    if (allSelectedDepts.length > 0) {
                      if (!d.dept) return false;
                      return allSelectedDepts.some(selDept => selDept.toLowerCase() === String(d.dept).toLowerCase());
                    }
                    return true;
                  });

                  return (
                    <div key={orgObj.id || i} className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-xs">
                      {/* Organization Level Objective & Metric (Written ONCE) */}
                      <div className="border-b border-slate-200/80 pb-3 mb-4">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div>
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full inline-block mb-1.5">
                              Organization Objective
                            </span>
                            <h3 className="font-bold text-slate-800 text-base md:text-lg">
                              {orgObj.text || orgObj.orgObj}
                            </h3>
                          </div>
                        </div>

                        <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs text-slate-700 mt-2">
                          <span className="font-bold text-slate-500 uppercase tracking-wider block mb-0.5">Organization Metric:</span>
                          <span className="font-semibold text-slate-800">{orgObj.metric || orgObj.orgMetric || "N/A"}</span>
                        </div>
                      </div>

                      {/* Department Level Objectives under this Org Objective */}
                      {linkedDeptObjs.length > 0 ? (
                        <div className="space-y-3">
                          {linkedDeptObjs.map((deptObj, j) => (
                            <div key={deptObj.id || j} className="bg-white border border-slate-200 rounded-lg p-4 relative shadow-2xs">
                              {/* Top Right Corner: Department Name */}
                              <div className="absolute top-3 right-3">
                                <span className="bg-indigo-100 text-indigo-800 border border-indigo-200 font-bold text-xs px-3 py-1 rounded-md shadow-2xs flex items-center gap-1">
                                  <Building2 size={12} /> {deptObj.dept || "Department"}
                                </span>
                              </div>

                              <div className="pr-32">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                                  Department Level Objective
                                  {deptObj.proposedForDeletion && (
                                    <span className="ml-2 bg-red-100 text-red-600 px-1.5 py-0.5 rounded-sm">Proposed for Deletion</span>
                                  )}
                                </span>
                                <h4 className={`font-semibold text-slate-800 text-sm mb-3 ${deptObj.proposedForDeletion ? "line-through opacity-60" : ""}`}>
                                  {deptObj.text || deptObj.deptObj}
                                </h4>
                              </div>

                              <div className={`grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-md border border-slate-100 ${deptObj.proposedForDeletion ? "opacity-60" : ""}`}>
                                <div>
                                  <span className="font-bold text-slate-500 block mb-0.5">Department Metric:</span>
                                  <span className="font-medium text-slate-800">{deptObj.deptMetric || deptObj.metric || "N/A"}</span>
                                </div>
                                <div>
                                  <span className="font-bold text-slate-500 block mb-0.5">Metric / Mapping Target:</span>
                                  <span className="font-medium text-slate-800">{deptObj.target || "100%"}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs italic text-slate-400 pt-1">No department objectives assigned to this Organization Objective yet.</p>
                      )}
                    </div>
                  );
                })}

                {/* Custom / Unmapped Department Objectives */}
                {(() => {
                  const unmappedDeptObjs = deptObjectives.filter(d => {
                    if (allSelectedDepts.length > 0 && d.dept) {
                      if (!allSelectedDepts.some(selDept => selDept.toLowerCase() === String(d.dept).toLowerCase())) {
                        return false;
                      }
                    }
                    const isMapped = filteredOrgObjectives.some(orgObj => String(d.orgObjectiveId) === String(orgObj.id));
                    return !isMapped;
                  });

                  if (unmappedDeptObjs.length === 0) return null;

                  return (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-xs mt-6">
                      <div className="border-b border-slate-200/80 pb-3 mb-4">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div>
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-700 bg-indigo-100 px-2.5 py-0.5 rounded-full inline-block mb-1.5">
                              Custom / Extra Objectives
                            </span>
                            <h3 className="font-bold text-slate-800 text-base md:text-lg">
                              Department-Specific Objectives
                            </h3>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {unmappedDeptObjs.map((deptObj, j) => (
                          <div key={deptObj.id || j} className="bg-white border border-slate-200 rounded-lg p-4 relative shadow-2xs">
                            <div className="absolute top-3 right-3">
                              <span className="bg-indigo-100 text-indigo-800 border border-indigo-200 font-bold text-xs px-3 py-1 rounded-md shadow-2xs flex items-center gap-1">
                                <Building2 size={12} /> {deptObj.dept || "Department"}
                              </span>
                            </div>

                            <div className="pr-32">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                                Department Level Objective
                                {deptObj.proposedForDeletion && (
                                  <span className="ml-2 bg-red-100 text-red-600 px-1.5 py-0.5 rounded-sm">Proposed for Deletion</span>
                                )}
                              </span>
                              <h4 className={`font-semibold text-slate-800 text-sm mb-3 ${deptObj.proposedForDeletion ? "line-through opacity-60" : ""}`}>
                                {deptObj.text || deptObj.deptObj}
                              </h4>
                            </div>

                            <div className={`grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-md border border-slate-100 ${deptObj.proposedForDeletion ? "opacity-60" : ""}`}>
                              <div>
                                <span className="font-bold text-slate-500 block mb-0.5">Department Metric:</span>
                                <span className="font-medium text-slate-800">{deptObj.deptMetric || deptObj.metric || "N/A"}</span>
                              </div>
                              <div>
                                <span className="font-bold text-slate-500 block mb-0.5">Metric / Mapping Target:</span>
                                <span className="font-medium text-slate-800">{deptObj.target || "100%"}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

              </div>
            ) : (
              <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500 font-medium text-sm">
                  {isDraft ? "Draft in progress — Objectives and metrics have not been selected yet." : "No objectives available for this plan."}
                </p>
              </div>
            )}
          </section>

        </div>
      </div>
    </div>
  );
};

export default PlanReadOnlyView;
