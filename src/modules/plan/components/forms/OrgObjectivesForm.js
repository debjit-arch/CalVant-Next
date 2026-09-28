import React from "react";
import { Plus, X } from "lucide-react";

/**
 * OrgObjectivesForm — Step 3 (Org Level Objectives).
 * Now displays a single unified table of all Organization Objectives without department grouping.
 */
const OrgObjectivesForm = ({
  orgObjectives,
  selectedFramework,
  corePolicyStatement,
  setCorePolicyStatement,
  handleOrgObjectiveChange,
  handleAddOrgObjective,
  handleRemoveOrgObjective,
}) => {
  return (
    <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px', color: '#0f172a' }}>Step 3: Org Level Objectives</h3>
          <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Define the core organization-level objectives for {selectedFramework?.domain}.</p>
        </div>
        <button
          onClick={() => handleAddOrgObjective()}
          style={{ background: '#e0e7ff', color: '#4f46e5', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}
        >
          <Plus size={16} /> Add Organization Objective
        </button>
      </div>

      <div style={{ marginBottom: '32px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ padding: '20px', overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: '800px', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '0 12px 12px 12px', textAlign: 'center', color: '#475569', width: '5%' }}>Select</th>
                <th style={{ padding: '0 12px 12px 12px', textAlign: 'left', color: '#475569', fontWeight: 600, width: '45%' }}>Organization Objective</th>
                <th style={{ padding: '0 12px 12px 12px', textAlign: 'left', color: '#475569', fontWeight: 600, width: '30%' }}>Metric</th>
                <th style={{ padding: '0 12px 12px 12px', textAlign: 'left', color: '#475569', fontWeight: 600, width: '20%' }}>Frequency of Review</th>
                {/* <th style={{ padding: '0 12px 12px 12px', textAlign: 'left', color: '#475569', fontWeight: 600, width: '20%' }}>Responsibility</th> */}
              </tr>
            </thead>
            <tbody>
              {(!orgObjectives || orgObjectives.length === 0) ? (
                <tr>
                  <td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>No organization objectives defined. Click "Add Organization Objective" to create one.</td>
                </tr>
              ) : (
                orgObjectives.map((row, index) => (
                  <tr key={row.id || index} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '12px', textAlign: 'center', verticalAlign: 'middle' }}>
                      <input
                        type="checkbox"
                        checked={row.selected || false}
                        onChange={(e) => handleOrgObjectiveChange(row.id, 'selected', e.target.checked)}
                        style={{ transform: 'scale(1.2)', cursor: 'pointer' }}
                      />
                    </td>
                    <td style={{ padding: '12px' }}>
                      <textarea
                        className="form-control"
                        rows={3}
                        style={{ width: '100%', resize: 'vertical', fontSize: '13px', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                        value={row.text || ""}
                        onChange={(e) => handleOrgObjectiveChange(row.id, 'text', e.target.value)}
                        placeholder="Enter objective"
                      />
                    </td>
                    <td style={{ padding: '12px' }}>
                      <textarea
                        className="form-control"
                        rows={3}
                        style={{ width: '100%', resize: 'vertical', fontSize: '13px', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                        value={row.metric || row.orgMetric || ""}
                        onChange={(e) => handleOrgObjectiveChange(row.id, 'metric', e.target.value)}
                        placeholder="Enter metric"
                      />
                    </td>
                    <td style={{ padding: '12px' }}>
                      <select
                        className="form-control"
                        style={{ width: '100%', padding: '8px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                        value={row.frequency || ""}
                        onChange={(e) => handleOrgObjectiveChange(row.id, 'frequency', e.target.value)}
                      >
                        <option value="">Select...</option>
                        <option value="Quarterly">Quarterly</option>
                        <option value="Monthly">Monthly</option>
                        <option value="Annually">Annually</option>
                      </select>
                    </td>
                    {/*
                    <td style={{ padding: '12px' }}>
                      <input
                        type="text"
                        className="form-control"
                        style={{ width: '100%', fontSize: '13px', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                        value={row.responsibility || ""}
                        onChange={(e) => handleOrgObjectiveChange(row.id, 'responsibility', e.target.value)}
                        placeholder="e.g. CISO"
                      />
                    </td>
                    */}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ marginTop: '32px', borderTop: '1px solid #e2e8f0', paddingTop: '24px' }}>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>Core Policy Statement</label>
        <textarea
          className="form-control"
          rows={4}
          style={{ width: '100%', resize: 'vertical', fontSize: '13px', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
          value={corePolicyStatement}
          onChange={(e) => setCorePolicyStatement(e.target.value)}
          placeholder="Enter the overarching Core Policy Statement for all objectives"
        />
      </div>
    </div>
  );
};

export default OrgObjectivesForm;
