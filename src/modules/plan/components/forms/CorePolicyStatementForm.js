import React from "react";

/**
 * CorePolicyStatementForm — Step 5 (Objectives to Metrics Mapping).
 *
 * NOTE ON NAMING: the target module layout given for this refactor names
 * the Step 5 file "CorePolicyStatementForm.js". In the original Plan.js,
 * however, Step 5 is the read-only "Objectives to Metrics Mapping" table
 * (getStepLabel(5) === "Metrics Mapping"), and the Core Policy Statement
 * textarea actually lives at the end of Step 3 (see OrgObjectivesForm.js).
 * To preserve behavior and step order exactly as required, this file's
 * content is the original Step 5 Metrics Mapping table; only the filename
 * follows the requested structure.
 */
const CorePolicyStatementForm = ({ orgObjectives, deptObjectives }) => {
  return (
    <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px', color: '#0f172a' }}>Step 5: Objectives to Metrics Mapping</h3>
        <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Define metrics and targets to measure your objectives.</p>
      </div>

      <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
        <table style={{ width: '100%', minWidth: '1000px', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '12px', textAlign: 'left', color: '#475569', fontWeight: 600, width: '20%' }}>Organization Objective</th>
              <th style={{ padding: '12px', textAlign: 'left', color: '#475569', fontWeight: 600, width: '15%' }}>Organization Metric</th>
              <th style={{ padding: '12px', textAlign: 'left', color: '#475569', fontWeight: 600, width: '15%' }}>Department</th>
              <th style={{ padding: '12px', textAlign: 'left', color: '#475569', fontWeight: 600, width: '20%' }}>Department Objective</th>
              <th style={{ padding: '12px', textAlign: 'left', color: '#475569', fontWeight: 600, width: '20%' }}>Department Metric</th>
              <th style={{ padding: '12px', textAlign: 'left', color: '#475569', fontWeight: 600, width: '10%' }}>Target Mapping</th>
            </tr>
          </thead>
          <tbody>
            {deptObjectives.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>No metrics mapping available. Complete previous steps.</td>
              </tr>
            ) : (
              deptObjectives.map((deptRow) => {
                const orgRow = orgObjectives.find(o => o.id === (deptRow.orgObjectiveId || deptRow.orgId));
                return (
                  <tr key={deptRow.id} style={{ borderBottom: '1px solid #e2e8f0', background: 'white' }}>
                    <td style={{ padding: '12px', color: '#334155', fontWeight: 500, verticalAlign: 'top' }}>
                      {orgRow?.text || "—"}
                    </td>
                    <td style={{ padding: '12px', color: '#64748b', verticalAlign: 'top' }}>
                      {orgRow?.metric || "—"}
                    </td>
                    <td style={{ padding: '12px', color: '#64748b', fontWeight: 600, verticalAlign: 'top' }}>
                      {deptRow.dept || "—"}
                    </td>
                    <td style={{ padding: '12px', color: '#334155', verticalAlign: 'top' }}>
                      {deptRow.text || deptRow.objective || "—"}
                    </td>
                    <td style={{ padding: '12px', color: '#64748b', verticalAlign: 'top' }}>
                      {deptRow.deptMetric || deptRow.metric || "—"}
                    </td>
                    <td style={{ padding: '12px', color: '#0f172a', fontWeight: 600, verticalAlign: 'top' }}>
                      {deptRow.target || "—"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CorePolicyStatementForm;
