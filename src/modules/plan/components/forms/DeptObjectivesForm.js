import React, { useState } from "react";
import { Plus, X, Send, Lock, CheckCircle2 } from "lucide-react";
import AssignObjectiveTaskModal from "../modals/AssignObjectiveTaskModal";

/**
 * DeptObjectivesForm — Step 4 (Dept Level Objectives).
 * Now completely decoupled from Organization Objectives mapping.
 *
 * ── NEW ──────────────────────────────────────────────────────────────
 * `departmentReviews` (optional, default []): the plan's
 * `departmentReviews` array as returned by plan-service
 * (Plan.departmentReviews / GET /api/plans/{id}). Each entry looks like
 * { departmentId, reviewStatus, ... }. A department whose reviewStatus is
 * "ACCEPTED" is APPROVED — the officially-updated copy of that
 * department's objectives now lives on the plan, and its Step 4 section
 * becomes fully read-only: inputs/selects are disabled, the "Submit for
 * Review" and "Add Custom Dept Objective" buttons are hidden, the row
 * delete (X) button is hidden, and a green "Approved" badge is shown next
 * to the department name.
 */
const DeptObjectivesForm = ({
  allSelectedDepts,
  availableDepartments,
  deptObjectives,
  orgObjectives,
  visibleDeptObjectiveIds,
  setVisibleDeptObjectiveIds,
  handleDeptObjectiveChange,
  handleAddDeptObjective,
  handleRemoveDeptObjective,
  orgAssignments = {},
  allUsers = [],
  planId,
  organizationId,
  reporterName,
  reporterId,
  departmentReviews = [],
  onReviewUpdated,
  isEditingCompletedPlan = false,
  readOnly = false
}) => {
  const [modalState, setModalState] = useState({ isOpen: false, department: "", objectives: [], riskOwnerId: "", riskOwnerName: "" });
  const [expandedDepts, setExpandedDepts] = useState({});
  // Track departments that were just assigned in this session (for immediate UI feedback
  // before departmentReviews prop is refreshed from the parent)
  const [justAssignedDepts, setJustAssignedDepts] = useState(new Set());
  const [successModal, setSuccessModal] = useState({ isOpen: false, department: null });

  // ── approval / review lookup ------------------------------------------------
  const isDeptApproved = (dept) => {
    const review = (departmentReviews || []).find(r => r.departmentId === dept);
    const isAccepted = !!review && review.reviewStatus === "ACCEPTED";

    if (isEditingCompletedPlan) {
      // In edit mode, old approvals are ignored so they can be edited.
      // We only lock it again if it was re-assigned and approved in THIS session.
      return isAccepted && justAssignedDepts.has(dept);
    }
    return isAccepted;
  };

  // A review entry exists for this department (any status: PENDING_REVIEW, IN_REVIEW, ACCEPTED, etc.)
  // OR it was just assigned in this session before the prop refreshes.
  const isDeptReviewStarted = (dept) => {
    if (justAssignedDepts.has(dept)) return true;
    if (isEditingCompletedPlan) return false; // Ignore old reviews during edit mode to show "Submit for Review"
    const review = (departmentReviews || []).find(r => r.departmentId === dept);
    return !!review;
  };

  const openAssignModal = (dept, activeObjs) => {
    const riskOwnerId = orgAssignments[dept]?.riskOwner || "";
    const riskOwnerObj = allUsers.find(u => String(u.id || u._id) === String(riskOwnerId));
    const riskOwnerName = riskOwnerObj ? riskOwnerObj.name : "";

    setModalState({
      isOpen: true,
      department: dept,
      objectives: activeObjs,
      riskOwnerId,
      riskOwnerName
    });
  };

  const closeAssignModal = () => {
    setModalState({ isOpen: false, department: "", objectives: [], riskOwnerId: "", riskOwnerName: "" });
  };

  const selectedOrgs = orgObjectives?.filter(org => org.selected !== false) || [];

  return (
    <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px', color: '#0f172a' }}>Step 4: Department Level Objectives</h3>
        <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Define specific objectives and metrics for each department, mapped to organizational objectives.</p>
      </div>

      {allSelectedDepts.length === 0 ? (
        <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', border: '1px solid #e2e8f0', borderRadius: '8px' }}>No departments selected. Please go back to Step 2.</div>
      ) : (
        allSelectedDepts.map(dept => {
          const cat = availableDepartments.find(d => (d.id === dept || d._id === dept || d.name === dept))?.mapping || dept;

          const getBackendDeptNames = (frontendDept) => {
            const fDept = (frontendDept || "").toLowerCase().trim();
            if (fDept === "admin" || fDept === "facilities") return ["Admin & Facilities"];
            if (fDept === "it infra") return ["IT Infrastructure"];
            if (fDept === "it applications" || fDept === "it" || fDept === "it department" || fDept === "it dept") return ["IT Applications / Software Development"];
            if (fDept === "vendor management" || fDept === "procurement") return ["Vendor Management / Procurement"];
            if (fDept === "legal") return ["Legal & Compliance"];
            if (fDept === "hr" || fDept === "human resources") return ["Human Resources"];
            return [];
          };

          // If the department is mapped to SC or Security Officer, skip it (do not show it)
          const lowerCat = cat.toLowerCase().trim();
          if (lowerCat.includes("steering committee") || lowerCat.includes("steeringcommittee") || lowerCat.includes("security officer")) {
            return null;
          }

          const mappedBackendNames = getBackendDeptNames(cat).map(n => n.toLowerCase());
          // Also include the raw category name so custom added objectives match
          mappedBackendNames.push(lowerCat);

          const selectedOrgIds = selectedOrgs.map(org => org.id);

          const availableDeptObjs = deptObjectives.filter(dObj => {
            const matchesDept = dObj.dept && mappedBackendNames.includes(dObj.dept.toLowerCase().trim());
            if (!matchesDept) return false;

            // Only show if it maps to a selected org objective, or if it's a custom objective
            if (dObj.orgObjectiveId && dObj.orgObjectiveId !== "generic-org-id") {
              return selectedOrgIds.includes(dObj.orgObjectiveId);
            }
            return true;
          });

          // If the department is approved, we ignore visibleDeptObjectiveIds and show ONLY what was 
          // finalized in the backend (o.selected === true maps directly to rows in the DB).
          const approved = isDeptApproved(dept);
          const activeDeptIds = approved
            ? availableDeptObjs.filter(o => o.selected).map(o => o.id)
            : (!visibleDeptObjectiveIds[dept] || visibleDeptObjectiveIds[dept].length === 0)
              ? availableDeptObjs.filter(o => o.selected).map(o => o.id)
              : visibleDeptObjectiveIds[dept];
          const activeObjs = availableDeptObjs.filter(o => activeDeptIds.includes(o.id));
          const hiddenObjs = availableDeptObjs.filter(o => !activeDeptIds.includes(o.id));


          const rowsAreReadOnly = readOnly || (approved && !isEditingCompletedPlan) || isDeptReviewStarted(dept);

          return (
            <div key={dept} style={{
              marginBottom: '32px',
              border: approved ? '1px solid #86efac' : '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '24px',
              background: approved ? '#f0fdf4' : 'white'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#334155', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  Department: <span style={{ color: '#4f46e5' }}>{dept}</span>
                  {approved && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                      background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0',
                      borderRadius: '20px', padding: '3px 10px', fontSize: '11px', fontWeight: 700
                    }}>
                      <CheckCircle2 size={12} /> Approved
                    </span>
                  )}
                </h4>
                {!readOnly && (!approved || isEditingCompletedPlan) && (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {isDeptReviewStarted(dept) ? (
                      <button
                        disabled
                        style={{ background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', cursor: 'not-allowed', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, opacity: 0.9 }}
                      >
                        <CheckCircle2 size={14} /> Task Assigned
                      </button>
                    ) : (
                      <>
                        <button onClick={() => openAssignModal(dept, activeObjs)} style={{ background: 'white', color: '#4f46e5', border: '1px solid #4f46e5', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Send size={14} /> Submit for Review
                        </button>
                        {/* Hidden when plan is completed and user edits the plan (isEditingCompletedPlan) so they cannot add custom objectives at this stage */}
                        {!isEditingCompletedPlan && (
                          <button onClick={() => handleAddDeptObjective(dept, "generic-org-id")} style={{ background: '#4f46e5', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Plus size={14} /> Add Custom Dept Objective
                          </button>
                        )}
                      </>
                    )}
                  </div>
                )}
                {approved && !isEditingCompletedPlan && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#166534', fontSize: '12px', fontWeight: 600 }}>
                    <Lock size={13} /> Locked — objectives finalized
                  </span>
                )}
              </div>

              <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '480px', border: '1px solid #e2e8f0', borderRadius: '8px', background: 'white' }}>
                <table style={{ width: '100%', minWidth: '900px', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 2 }}>
                      <th style={{ padding: '12px', textAlign: 'center', color: '#475569', fontWeight: 600, width: '5%' }}>Sl. No.</th>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#475569', fontWeight: 600, width: '20%' }}>Organization Objective</th>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#475569', fontWeight: 600, width: '25%' }}>Department Objective</th>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#475569', fontWeight: 600, width: '20%' }}>Department Metric</th>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#475569', fontWeight: 600, width: '15%' }}>Frequency of Review</th>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#475569', fontWeight: 600, width: '10%' }}>Target</th>
                      {/* {!approved && <th style={{ padding: '12px', textAlign: 'center', color: '#475569', width: '5%' }}></th>} */}
                    </tr>
                  </thead>
                  <tbody>
                    {activeObjs.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>No department objectives assigned. You can add one or select from the dropdown below.</td>
                      </tr>
                    ) : (
                      activeObjs.map((row, idx) => {
                        const mappedOrgObj = orgObjectives?.find(org => org.id === row.orgObjectiveId);
                        const orgObjText = mappedOrgObj ? mappedOrgObj.text : (row.orgObjectiveId === "generic-org-id" ? "Custom/Generic" : "Not Mapped");
                        return (
                          <tr key={row.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                            <td style={{ padding: '12px', textAlign: 'center', verticalAlign: 'middle', color: '#64748b', fontWeight: 500 }}>
                              {idx + 1}
                            </td>
                            <td style={{ padding: '8px', verticalAlign: 'top' }}>
                              <textarea className="form-control" rows={3} style={{ width: '100%', resize: 'vertical', fontSize: '13px', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#f8fafc', color: '#475569', cursor: 'not-allowed' }} value={orgObjText} readOnly />
                            </td>
                            <td style={{ padding: '8px', verticalAlign: 'top' }}>
                              <textarea
                                className="form-control"
                                rows={3}
                                style={{
                                  width: '100%', resize: 'vertical', fontSize: '13px', padding: '8px',
                                  border: '1px solid #cbd5e1', borderRadius: '6px',
                                  background: rowsAreReadOnly ? '#f8fafc' : 'white',
                                  color: rowsAreReadOnly ? '#475569' : 'inherit',
                                  cursor: rowsAreReadOnly ? 'not-allowed' : 'text'
                                }}
                                value={row.text || ""}
                                onChange={(e) => handleDeptObjectiveChange(row.id, 'text', e.target.value)}
                                placeholder="Enter Dept Objective"
                                disabled={rowsAreReadOnly}
                              />
                            </td>
                            <td style={{ padding: '8px', verticalAlign: 'top' }}>
                              <textarea
                                className="form-control"
                                rows={3}
                                style={{
                                  width: '100%', resize: 'vertical', fontSize: '13px', padding: '8px',
                                  border: '1px solid #cbd5e1', borderRadius: '6px',
                                  background: rowsAreReadOnly ? '#f8fafc' : 'white',
                                  color: rowsAreReadOnly ? '#475569' : 'inherit',
                                  cursor: rowsAreReadOnly ? 'not-allowed' : 'text'
                                }}
                                value={row.deptMetric || ""}
                                onChange={(e) => handleDeptObjectiveChange(row.id, 'deptMetric', e.target.value)}
                                placeholder="Enter Dept Metric"
                                disabled={rowsAreReadOnly}
                              />
                            </td>
                            <td style={{ padding: '8px', verticalAlign: 'top' }}>
                              <select
                                className="form-control"
                                style={{
                                  width: '100%', padding: '8px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '6px',
                                  background: rowsAreReadOnly ? '#f8fafc' : 'white',
                                  color: rowsAreReadOnly ? '#475569' : 'inherit',
                                  cursor: rowsAreReadOnly ? 'not-allowed' : 'pointer'
                                }}
                                value={row.frequency || ""}
                                onChange={(e) => handleDeptObjectiveChange(row.id, 'frequency', e.target.value)}
                                disabled={rowsAreReadOnly}
                              >
                                <option value="">Select...</option>
                                <option value="Quarterly">Quarterly</option>
                                <option value="Monthly">Monthly</option>
                                <option value="Annually">Annually</option>
                              </select>
                            </td>
                            <td style={{ padding: '8px', verticalAlign: 'top' }}>
                              <input
                                type="text"
                                className="form-control"
                                style={{
                                  width: '100%', fontSize: '13px', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px',
                                  background: rowsAreReadOnly ? '#f8fafc' : 'white',
                                  color: rowsAreReadOnly ? '#475569' : 'inherit',
                                  cursor: rowsAreReadOnly ? 'not-allowed' : 'text'
                                }}
                                value={row.target || ""}
                                onChange={(e) => handleDeptObjectiveChange(row.id, 'target', e.target.value)}
                                placeholder="e.g. 100%"
                                disabled={rowsAreReadOnly}
                              />
                            </td>
                            {/* {!approved && (
                              <td style={{ padding: '8px', textAlign: 'center', verticalAlign: 'middle' }}>
                                <button
                                  onClick={() => {
                                    setVisibleDeptObjectiveIds(prev => {
                                      const existing = prev[dept] || availableDeptObjs.map(o => o.id);
                                      return { ...prev, [dept]: existing.filter(id => id !== row.id) };
                                    });
                                  }}
                                  style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                                >
                                  <X size={18} />
                                </button>
                              </td>
                            )} */}
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>

                {/* {!approved && !isDeptReviewStarted(dept) && hiddenObjs.length > 0 && (
                  <div style={{ padding: '16px', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                    <button
                      onClick={() => setExpandedDepts(prev => ({ ...prev, [dept]: !prev[dept] }))}
                      style={{ background: 'none', border: 'none', color: '#4f46e5', fontWeight: 600, fontSize: '13px', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '4px', marginBottom: expandedDepts[dept] ? '12px' : '0' }}
                    >
                      {expandedDepts[dept] ? "Show less" : `Show more (${hiddenObjs.length})`}
                    </button>

                    {expandedDepts[dept] && (
                      <>
                        <p style={{ fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px', marginTop: 0 }}>Available Objectives (Click to add):</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {hiddenObjs.map(ho => (
                            <button
                              key={ho.id}
                              onClick={() => {
                                setVisibleDeptObjectiveIds(prev => {
                                  const existing = prev[dept] || availableDeptObjs.map(o => o.id);
                                  if (!existing.includes(ho.id)) {
                                    return { ...prev, [dept]: [...existing, ho.id] };
                                  }
                                  return prev;
                                });
                              }}
                              style={{ textAlign: 'left', background: 'white', border: '1px dashed #cbd5e1', padding: '8px 12px', borderRadius: '6px', fontSize: '13px', color: '#4f46e5', cursor: 'pointer', transition: 'all 0.2s' }}
                              onMouseOver={(e) => e.currentTarget.style.borderColor = '#4f46e5'}
                              onMouseOut={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
                            >
                              <Plus size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
                              {ho.text || "Untitled Department Objective"}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )} */}
              </div>
            </div>
          );
        })
      )}

      <AssignObjectiveTaskModal
        isOpen={modalState.isOpen}
        onClose={closeAssignModal}
        department={modalState.department}
        riskOwnerId={modalState.riskOwnerId}
        riskOwnerName={modalState.riskOwnerName}
        objectives={modalState.objectives}
        planId={planId}
        organizationId={organizationId}
        reporterName={reporterName}
        reporterId={reporterId}
        onSuccess={(latestPlan) => {
          setJustAssignedDepts(prev => new Set([...prev, modalState.department]));
          if (latestPlan && latestPlan.departmentReviews && onReviewUpdated) {
            onReviewUpdated(latestPlan);
          }
          setSuccessModal({ isOpen: true, department: modalState.department });
          closeAssignModal();
        }}
      />

      {/* Success Modal */}
      {successModal.isOpen && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          background: "rgba(0, 0, 0, 0.4)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999
        }}>
          <div style={{
            background: "white", padding: "30px", borderRadius: "12px", width: "400px", maxWidth: "90%",
            textAlign: "center", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
              <div style={{ background: '#dcfce7', color: '#166534', padding: '16px', borderRadius: '50%' }}>
                <CheckCircle2 size={32} />
              </div>
            </div>
            <h3 style={{ margin: "0 0 10px 0", fontSize: "20px", fontWeight: "bold", color: "#1e293b" }}>Task Assigned Successfully</h3>
            <p style={{ margin: "0 0 24px 0", fontSize: "14px", color: "#64748b", lineHeight: "1.5" }}>
              The department objectives for <strong style={{ color: "#334155" }}>{successModal.department}</strong> have been submitted for review. The risk owner will be notified.
            </p>
            <button
              onClick={() => setSuccessModal({ isOpen: false, department: null })}
              style={{
                background: "#4f46e5", color: "white", border: "none", padding: "10px 24px",
                borderRadius: "8px", fontSize: "14px", fontWeight: "600", cursor: "pointer", width: "100%",
                transition: "background 0.2s"
              }}
              onMouseEnter={e => e.target.style.background = "#4338ca"}
              onMouseLeave={e => e.target.style.background = "#4f46e5"}
            >
              Okay, got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeptObjectivesForm;