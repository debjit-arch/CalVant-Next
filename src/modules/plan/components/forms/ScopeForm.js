import React from "react";

/**
 * ScopeForm — Step 1 (Scoping).
 * Behavior and markup preserved exactly from Plan.js `renderFormContent` case 1.
 */
const ScopeForm = ({
  locations,
  scopeData,
  actualOrgName,
  availableDepartments,
  handleScopeChange,
  handleAddLocation,
  handleDeptToggle,
  handleGlobalServiceChange,
  setShowAddDeptModal,
  readOnly = false,
}) => {
  const firstLoc = locations[0] || "Primary";
  return (
    <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
      <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px', color: '#0f172a' }}>Step 1: Scope</h3>
      <p style={{ color: '#64748b', marginBottom: '24px', fontSize: '14px' }}>Configure scope for each location onboarded.</p>

      <div className="form-group" style={{ marginBottom: '24px' }}>
        <label>Organizational Scope</label>
        <input
          type="text"
          className="form-control"
          style={{ backgroundColor: '#f1f5f9', color: '#0f172a', fontWeight: '500', cursor: 'not-allowed', border: '1px solid #cbd5e1' }}
          value={scopeData[firstLoc]?.org || actualOrgName || ""}
          readOnly
          title="This field is populated from your initial onboarding organization name and cannot be edited."
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <label style={{ margin: 0, fontSize: '15px', fontWeight: 'bold', color: '#1e293b' }}>Geographical Scopes</label>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '16px' }}>
        {locations.map((loc, idx) => (
          <div key={loc} style={{ padding: '16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
            <p style={{ margin: '0 0 12px 0', fontWeight: '600', color: '#475569', fontSize: '14px' }}>{idx > 0 ? `Additional Location ${idx}` : 'Primary Location'}</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Address Line 1"
                value={scopeData[loc]?.geoLine1 || ""}
                onChange={(e) => handleScopeChange(loc, 'geoLine1', e.target.value)}
                disabled={readOnly}
                style={readOnly ? { backgroundColor: '#f1f5f9', cursor: 'not-allowed' } : {}}
              />
              <input
                type="text"
                className="form-control"
                placeholder="Address Line 2"
                value={scopeData[loc]?.geoLine2 || ""}
                onChange={(e) => handleScopeChange(loc, 'geoLine2', e.target.value)}
                disabled={readOnly}
                style={readOnly ? { backgroundColor: '#f1f5f9', cursor: 'not-allowed' } : {}}
              />
              <input
                type="text"
                className="form-control"
                placeholder="Location (City/State)"
                value={scopeData[loc]?.geoLoc || ""}
                onChange={(e) => handleScopeChange(loc, 'geoLoc', e.target.value)}
                disabled={readOnly}
                style={readOnly ? { backgroundColor: '#f1f5f9', cursor: 'not-allowed' } : {}}
              />
              <input
                type="text"
                className="form-control"
                placeholder="PIN / Zip Code"
                value={scopeData[loc]?.geoPin || ""}
                onChange={(e) => handleScopeChange(loc, 'geoPin', e.target.value)}
                disabled={readOnly}
                style={readOnly ? { backgroundColor: '#f1f5f9', cursor: 'not-allowed' } : {}}
              />
            </div>
          </div>
        ))}
      </div>

      {!readOnly && (
        <button
          onClick={handleAddLocation}
          style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '14px', cursor: 'pointer', fontWeight: 500, marginBottom: '24px' }}
        >
          + Add Another Location
        </button>
      )}

      <div className="form-group" style={{ marginTop: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <label style={{ margin: 0 }}>Department Scope</label>
          {!readOnly && <button className="add-dept-btn" onClick={() => setShowAddDeptModal(true)}>+ Create Department</button>}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px', padding: '12px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
          {availableDepartments.map((dept) => (
            <label key={dept.id || dept._id || dept.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: readOnly ? 'not-allowed' : 'pointer', fontWeight: 'normal', margin: 0 }}>
              <input
                type="checkbox"
                checked={(scopeData[firstLoc]?.depts || []).includes(dept.name)}
                onChange={() => handleDeptToggle(dept.name)}
                style={{ width: '16px', height: '16px', accentColor: '#3b82f6' }}
                disabled={readOnly}
              />
              {dept.name}
            </label>
          ))}
        </div>
      </div>

      <div className="form-group" style={{ marginTop: '20px' }}>
        <label>Services/Products Scope</label>
        <textarea
          className="form-control"
          placeholder="List services or products in scope"
          value={scopeData[firstLoc]?.services || ""}
          onChange={(e) => handleGlobalServiceChange(e.target.value)}
          rows={3}
          disabled={readOnly}
          style={readOnly ? { backgroundColor: '#f1f5f9', cursor: 'not-allowed' } : {}}
        />
      </div>
    </div>
  );
};

export default ScopeForm;
