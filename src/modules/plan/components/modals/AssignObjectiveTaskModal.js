import React, { useState } from "react";
import { X, Send, AlertCircle } from "lucide-react";
import { upsertPlan, getPlanById, finalizeDepartment } from "../../services/planService";

const AssignObjectiveTaskModal = ({
  isOpen,
  onClose,
  department,
  riskOwnerId,
  riskOwnerName,
  objectives,
  planId,
  organizationId,
  reporterName,
  reporterId,
  onSuccess
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleAssign = async () => {
    if (!department || !riskOwnerId) {
      setError("Please select both a department and a risk owner.");
      return;
    }

    if (!objectives || objectives.length === 0) {
      setError(`Cannot assign task: No department objectives were selected or added for '${department}'. Please add at least one objective first.`);
      return;
    }

    // A valid planId must exist (either Mongo ObjectID, local draft ID, or UUID).
    // We only want to block if it's a raw framework name (like 'iso-27001' or 'soc2') 
    // which indicates the user hasn't saved the draft yet.
    if (!planId || planId === "iso-27001" || planId === "soc2" || planId === "nist" || planId === "hipaa") {
      setError("Please 'Save Progress' before assigning tasks for a new plan.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    
    try {
      // Persist the (possibly wizard-edited) objective rows for this
      // department before finalizing — finalizeDepartment reads
      // deptObjectives straight from the saved plan.
      const currentPlan = await getPlanById(planId);
      if (currentPlan) {
        const newPlan = JSON.parse(JSON.stringify(currentPlan));
        let baseDeptObjectives = newPlan.deptObjectives || newPlan.extraProperties?.deptObjectives || [];
        objectives.forEach(nObj => {
            const idx = baseDeptObjectives.findIndex(o => o.id === nObj.id);
            // Force the objective to map to the specific department being finalized
            // so the backend's finalizeDepartment check finds it successfully.
            const updatedObj = { ...nObj, dept: department, department: department, selected: true };
            if (idx !== -1) {
                baseDeptObjectives[idx] = { ...baseDeptObjectives[idx], ...updatedObj };
            } else {
                baseDeptObjectives.push(updatedObj);
            }
        });
        newPlan.deptObjectives = baseDeptObjectives;
        await upsertPlan(newPlan);
      }

      // Opens the actual review loop: creates the DepartmentObjectiveReview
      // (with real assignee/reporter identity) and the risk owner's task via
      // plan-service. Replaces the old direct taskService.saveTask() call,
      // which never touched plan-service's review state at all.
      await finalizeDepartment(planId, department, reporterId || null, riskOwnerId, riskOwnerName);

      onSuccess();
    } catch (err) {
      console.error("Failed to assign task:", err);
      setError(err?.response?.data || "Failed to assign task. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ backgroundColor: '#fff', borderRadius: '8px', width: '600px', maxWidth: '95%', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        
        {/* Header */}
        <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#0f172a' }}>Assign Objectives Review Task</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px', flex: 1 }}>
          <p style={{ color: '#475569', fontSize: '14px', marginBottom: '20px' }}>
            You are about to assign a review task for the <strong>{department}</strong> department objectives.
          </p>

          {!riskOwnerId ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#fef2f2', border: '1px solid #fecaca', padding: '12px', borderRadius: '6px', color: '#ef4444', marginBottom: '20px' }}>
              <AlertCircle size={18} />
              <span style={{ fontSize: '14px' }}>
                Currently there is no Risk Owner defined for this department. Please assign one in Step 2 to assign this task.
              </span>
            </div>
          ) : (
            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
              <span style={{ fontSize: '13px', color: '#64748b' }}>Assignee (Risk Owner):</span>
              <div style={{ fontWeight: '500', color: '#0f172a', marginTop: '4px' }}>{riskOwnerName}</div>
            </div>
          )}

          <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#334155', marginBottom: '12px' }}>Objectives to Review</h3>
          
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
            {objectives.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>No objectives selected.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '10px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Objective</th>
                    <th style={{ padding: '10px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Metric</th>
                    <th style={{ padding: '10px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Frequency</th>
                    <th style={{ padding: '10px', textAlign: 'left', fontWeight: '600', color: '#475569' }}>Target</th>
                  </tr>
                </thead>
                <tbody>
                  {objectives.map((obj, idx) => (
                    <tr key={idx} style={{ borderBottom: idx !== objectives.length - 1 ? '1px solid #e2e8f0' : 'none' }}>
                      <td style={{ padding: '10px', verticalAlign: 'top', color: '#1e293b' }}>{obj.text}</td>
                      <td style={{ padding: '10px', verticalAlign: 'top', color: '#475569' }}>{obj.deptMetric || '-'}</td>
                      <td style={{ padding: '10px', verticalAlign: 'top', color: '#475569' }}>{obj.frequency || '-'}</td>
                      <td style={{ padding: '10px', verticalAlign: 'top', color: '#475569' }}>{obj.target || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {error && (
            <div style={{ color: '#ef4444', fontSize: '13px', marginTop: '16px' }}>{error}</div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: '#f8fafc' }}>
          <button 
            onClick={onClose} 
            style={{ padding: '8px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#475569', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button 
            onClick={handleAssign} 
            style={{ padding: '8px 16px', background: '#4f46e5', border: 'none', borderRadius: '6px', color: 'white', fontSize: '14px', fontWeight: '500', cursor: !riskOwnerId || objectives.length === 0 || isSubmitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', opacity: !riskOwnerId || objectives.length === 0 || isSubmitting ? 0.6 : 1 }}
            disabled={!riskOwnerId || objectives.length === 0 || isSubmitting}
          >
            {isSubmitting ? 'Assigning...' : (
              <>
                <Send size={16} /> Assign Task
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignObjectiveTaskModal;
