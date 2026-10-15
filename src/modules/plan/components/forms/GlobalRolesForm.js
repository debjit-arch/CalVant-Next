import React from "react";
import { List, Network, Plus, Users, ShieldCheck, Building2, ArrowDown } from "lucide-react";

/**
 * GlobalRolesForm — Step 2 (Org Structuring).
 * Behavior and markup preserved exactly from Plan.js `renderFormContent` case 2,
 * including the List View / Tree View toggle.
 */
const GlobalRolesForm = ({
  allSelectedDepts,
  allUsers = [],
  deptFilteredUsers = [],
  globalRoles,
  setGlobalRoles,
  orgAssignments,
  orgViewMode,
  setOrgViewMode,
  getFilteredUsers,
  getUserName,
  handleAddGlobalRoleUser,
  handleRemoveGlobalRoleUser,
  handleOrgAssignmentChange,
  handleAddOrgAssignmentUser,
  handleRemoveOrgAssignmentUser,
  setShowAddUserModal,
  readOnly = false,
}) => {
  const selectableUsers = (deptFilteredUsers && deptFilteredUsers.length > 0) ? deptFilteredUsers : allUsers;

  const isAutoPopulatedSCUser = (userId) => {
    if (!userId) return false;
    const u = allUsers.find(user => String(user.id || user._id) === String(userId));
    if (!u) return false;

    const hasDeptSC = u.department && (() => {
      const dStr = typeof u.department === 'object' && u.department.name ? u.department.name : String(u.department);
      const normD = dStr.toLowerCase().replace(/ /g, '_');
      return normD === 'security_officer' || normD === 'steering_committee' || normD === 'steeringcommittee' || normD === 'steering_commitee';
    })();

    if (hasDeptSC) return true;

    if (!u.role) return false;
    const roles = Array.isArray(u.role) ? u.role : [u.role];
    return roles.some(r => {
      const roleStr = typeof r === 'object' && r.name ? r.name : String(r);
      const norm = roleStr.toLowerCase().replace(/ /g, '_');
      return norm === 'steering_committee_member' || norm === 'steering_committee' || norm === 'steeringcommittee' || norm === 'steering_commitee';
    });
  };

  const isAutoPopulatedAuditorUser = (userId) => {
    if (!userId) return false;
    const u = allUsers.find(user => String(user.id || user._id) === String(userId));
    if (!u || !u.role) return false;
    const roles = Array.isArray(u.role) ? u.role : [u.role];
    return roles.some(r => {
      const roleStr = typeof r === 'object' && r.name ? r.name : String(r);
      const norm = roleStr.toLowerCase().replace(/ /g, '_');
      return ['auditor', 'audit_manager', 'internal_auditor', 'internal_auditors'].includes(norm);
    });
  };

  const isAutoPopulatedCisoUser = (userId) => {
    if (!userId) return false;
    const u = allUsers.find(user => String(user.id || user._id) === String(userId));
    if (!u || !u.role) return false;
    const roles = Array.isArray(u.role) ? u.role : [u.role];
    return roles.some(r => {
      const roleStr = typeof r === 'object' && r.name ? r.name : String(r);
      const norm = roleStr.toLowerCase().replace(/ /g, '_');
      return norm === 'ciso' || norm === 'chief_information_security_officer';
    });
  };

  const riskOwners = getFilteredUsers("Risk Owner");
  const riskManagers = getFilteredUsers("Risk Manager");
  const processOwners = getFilteredUsers("Process Owner");

  return (
    <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', ...(readOnly ? { pointerEvents: 'none', opacity: 0.85 } : {}) }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px', color: '#0f172a' }}>Step 2: Organizational structure</h3>
          <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Define ownership hierarchy for selected departments.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', background: '#f1f5f9', padding: '4px', borderRadius: '8px' }}>
          <button
            onClick={() => setOrgViewMode("list")}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer',
              background: orgViewMode === 'list' ? 'white' : 'transparent',
              boxShadow: orgViewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              color: orgViewMode === 'list' ? '#0f172a' : '#64748b',
              fontWeight: orgViewMode === 'list' ? 600 : 400
            }}
          >
            <List size={16} /> List View
          </button>
          <button
            onClick={() => setOrgViewMode("tree")}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer',
              background: orgViewMode === 'tree' ? 'white' : 'transparent',
              boxShadow: orgViewMode === 'tree' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              color: orgViewMode === 'tree' ? '#0f172a' : '#64748b',
              fontWeight: orgViewMode === 'tree' ? 600 : 400
            }}
          >
            <Network size={16} /> Tree View
          </button>
        </div>
      </div>

      {allSelectedDepts.length === 0 ? (
        <div style={{ padding: '20px', background: '#fffbeb', color: '#b45309', borderRadius: '6px', textAlign: 'center' }}>
          Please define at least one department in Step 1.
        </div>
      ) : orgViewMode === "list" ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

          {/* Section A: Organization-wide Roles */}
          <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
            <div style={{ background: 'linear-gradient(90deg, #f8fafc 0%, #f1f5f9 100%)', padding: '14px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ background: '#e0e7ff', color: '#4f46e5', padding: '8px', borderRadius: '8px', display: 'flex' }}>
                <Users size={18} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>Organization-wide Roles</h4>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Global governance, oversight, and security management</span>
              </div>
            </div>

            <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>

              {/* Steering Committee Card */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <label style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b', margin: 0 }}>Steering Committee</label>
                    <span style={{ fontSize: '11px', background: '#e0e7ff', color: '#3730a3', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>Global</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>Oversight & governance committee</div>

                  {globalRoles.steeringCommittee.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                      {globalRoles.steeringCommittee.map(userId => (
                        <span key={userId} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#e0e7ff', color: '#3730a3', padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                          {getUserName(userId)}
                          <button onClick={() => handleRemoveGlobalRoleUser('steeringCommittee', userId)} style={{ background: 'none', border: 'none', color: '#4338ca', cursor: 'pointer', padding: '0', lineHeight: 1, fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center' }}>&times;</button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic', marginBottom: '12px' }}>No members assigned</div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                  <select
                    className="form-control"
                    style={{ flex: 1, height: '38px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    value=""
                    onChange={(e) => { handleAddGlobalRoleUser('steeringCommittee', e.target.value); }}
                  >
                    <option value="">Select user to add...</option>
                    {selectableUsers.filter(u => !(globalRoles.steeringCommittee || []).some(id => String(id) === String(u.id || u._id))).map(u => (
                      <option key={u.id || u._id} value={u.id || u._id}>{u.name || `${u.firstName} ${u.lastName}`.trim()}</option>
                    ))}
                  </select>
                  <button onClick={() => setShowAddUserModal(true)} style={{ height: '38px', padding: '0 12px', background: '#e0e7ff', color: '#4f46e5', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Add User">
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              {/* Internal Auditor Card */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <label style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b', margin: 0 }}>Internal Auditor</label>
                    <span style={{ fontSize: '11px', background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>Audit</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>Independent compliance auditors</div>

                  {globalRoles.internalAuditor.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                      {globalRoles.internalAuditor.map(userId => (
                        <span key={userId} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#fef3c7', color: '#92400e', padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                          {getUserName(userId)}
                          <button onClick={() => handleRemoveGlobalRoleUser('internalAuditor', userId)} style={{ background: 'none', border: 'none', color: '#b45309', cursor: 'pointer', padding: '0', lineHeight: 1, fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center' }}>&times;</button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic', marginBottom: '12px' }}>No auditors assigned</div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                  <select
                    className="form-control"
                    style={{ flex: 1, height: '38px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    value=""
                    onChange={(e) => { handleAddGlobalRoleUser('internalAuditor', e.target.value); }}
                  >
                    <option value="">Select user to add...</option>
                    {selectableUsers.filter(u => !(globalRoles.internalAuditor || []).some(id => String(id) === String(u.id || u._id))).map(u => (
                      <option key={u.id || u._id} value={u.id || u._id}>{u.name || `${u.firstName} ${u.lastName}`.trim()}</option>
                    ))}
                  </select>
                  <button onClick={() => setShowAddUserModal(true)} style={{ height: '38px', padding: '0 12px', background: '#e0e7ff', color: '#4f46e5', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Add User">
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              {/* CISO Card */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <label style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b', margin: 0 }}>CISO</label>
                    <span style={{ fontSize: '11px', background: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>Executive</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>Chief Information Security Officer (Single Role)</div>

                  {globalRoles.ciso ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '12px' }}>
                      <ShieldCheck size={18} style={{ color: '#2563eb' }} />
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{getUserName(globalRoles.ciso)}</span>
                      <button
                        onClick={() => handleRemoveGlobalRoleUser('ciso', globalRoles.ciso)}
                        style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0', fontSize: '16px', fontWeight: 700 }}
                        title="Remove CISO"
                      >
                        &times;
                      </button>
                    </div>
                  ) : (
                    <div style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic', marginBottom: '12px' }}>No CISO assigned</div>
                  )}
                </div>

                {!globalRoles.ciso && (
                  <select
                    className="form-control"
                    style={{ width: '100%', height: '38px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: 'auto' }}
                    value={globalRoles.ciso || ""}
                    onChange={(e) => handleAddGlobalRoleUser('ciso', e.target.value)}
                  >
                    <option value="">Select CISO...</option>
                    {selectableUsers.map(u => (
                      <option key={u.id || u._id} value={u.id || u._id}>{u.name || `${u.firstName} ${u.lastName}`.trim()}</option>
                    ))}
                  </select>
                )}
              </div>

            </div>
          </div>

          {/* Section B: Department Roles (Stacked Layout - One below another) */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Building2 size={20} style={{ color: '#4f46e5' }} />
              <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Department Roles</h4>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {allSelectedDepts.map(dept => (
                <div key={dept} style={{
                  background: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                  overflow: 'hidden'
                }}>
                  {/* Department Header */}
                  <div style={{
                    background: 'linear-gradient(90deg, #f8fafc 0%, #f1f5f9 100%)',
                    padding: '14px 20px',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    justify: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ background: '#e0e7ff', color: '#4f46e5', padding: '8px', borderRadius: '8px', display: 'flex' }}>
                        <Building2 size={18} />
                      </div>
                      <div>
                        <h5 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>{dept}</h5>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>Department Ownership Hierarchy</span>
                      </div>
                    </div>
                  </div>

                  {/* Roles Stacked Vertically (One below another) */}
                  <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                    {/* 1. Risk Owner */}
                    <div style={{
                      background: '#f8fafc',
                      padding: '14px 16px',
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0',
                      display: 'grid',
                      gridTemplateColumns: '220px 1fr',
                      alignItems: 'center',
                      gap: '16px'
                    }}>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>Risk Owner</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>Primary owner for department risks</div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <select
                          className="form-control"
                          style={{ flex: 1, height: '38px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                          value={orgAssignments[dept]?.riskOwner || ""}
                          onChange={(e) => handleOrgAssignmentChange(dept, 'riskOwner', e.target.value)}
                        >
                          <option value="">Select Risk Owner...</option>
                          {riskOwners.map(u => (
                            <option key={u.id || u._id} value={u.id || u._id}>{u.name || `${u.firstName} ${u.lastName}`.trim()}</option>
                          ))}
                        </select>
                        {!orgAssignments[dept]?.riskOwner && (
                          <button
                            onClick={() => setShowAddUserModal(true)}
                            style={{ height: '38px', padding: '0 12px', background: '#e0e7ff', color: '#4f46e5', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            title="Create New User"
                          >
                            <Plus size={16} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* 2. Risk Manager */}
                    <div style={{
                      background: '#f8fafc',
                      padding: '14px 16px',
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0',
                      display: 'grid',
                      gridTemplateColumns: '220px 1fr',
                      alignItems: 'flex-start',
                      gap: '16px'
                    }}>
                      <div style={{ paddingTop: '6px' }}>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>Risk Manager</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>Managers responsible for risk mitigation</div>
                      </div>
                      <div>
                        {Array.isArray(orgAssignments[dept]?.riskManager) && orgAssignments[dept].riskManager.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                            {orgAssignments[dept].riskManager.map(userId => (
                              <span key={userId} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#dbeafe', color: '#1e40af', padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                {getUserName(userId)}
                                <button onClick={() => handleRemoveOrgAssignmentUser(dept, 'riskManager', userId)} style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', padding: '0', lineHeight: 1, fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center' }}>&times;</button>
                              </span>
                            ))}
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <select
                            className="form-control"
                            style={{ flex: 1, height: '38px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                            value=""
                            onChange={(e) => handleAddOrgAssignmentUser(dept, 'riskManager', e.target.value)}
                          >
                            <option value="">Select Risk Manager to add...</option>
                            {riskManagers.filter(u => !(orgAssignments[dept]?.riskManager || []).some(id => String(id) === String(u.id || u._id))).map(u => (
                              <option key={u.id || u._id} value={u.id || u._id}>{u.name || `${u.firstName} ${u.lastName}`.trim()}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => setShowAddUserModal(true)}
                            style={{ height: '38px', padding: '0 12px', background: '#e0e7ff', color: '#4f46e5', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            title="Create New User"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* 3. Process Owner */}
                    {/* <div style={{
                      background: '#f8fafc',
                      padding: '14px 16px',
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0',
                      display: 'grid',
                      gridTemplateColumns: '220px 1fr',
                      alignItems: 'flex-start',
                      gap: '16px'
                    }}>
                      <div style={{ paddingTop: '6px' }}>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>Process Owner</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>Owners overseeing process execution</div>
                      </div>
                      <div>
                        {Array.isArray(orgAssignments[dept]?.processOwner) && orgAssignments[dept].processOwner.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                            {orgAssignments[dept].processOwner.map(userId => (
                              <span key={userId} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#e0e7ff', color: '#3730a3', padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                {getUserName(userId)}
                                <button onClick={() => handleRemoveOrgAssignmentUser(dept, 'processOwner', userId)} style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', padding: '0', lineHeight: 1, fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center' }}>&times;</button>
                              </span>
                            ))}
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <select
                            className="form-control"
                            style={{ flex: 1, height: '38px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                            value=""
                            onChange={(e) => handleAddOrgAssignmentUser(dept, 'processOwner', e.target.value)}
                          >
                            <option value="">Select Process Owner to add...</option>
                            {processOwners.filter(u => !(orgAssignments[dept]?.processOwner || []).some(id => String(id) === String(u.id || u._id))).map(u => (
                              <option key={u.id || u._id} value={u.id || u._id}>{u.name || `${u.firstName} ${u.lastName}`.trim()}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => setShowAddUserModal(true)}
                            style={{ height: '38px', padding: '0 12px', background: '#e0e7ff', color: '#4f46e5', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            title="Create New User"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>
                    </div> */}

                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      ) : (
        <div style={{ padding: '40px 24px', background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)', borderRadius: '12px', border: '1px solid #e2e8f0', overflowX: 'auto', position: 'relative' }}>
          {/* Org Chart Tree View */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 'max-content', paddingBottom: '40px' }}>

            {/* Level 1: Internal Auditors & Steering Committee */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '60px', position: 'relative' }}>

              {/* Internal Auditor */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2 }}>
                <div className="tree-node" style={{ background: 'white', color: '#1e293b', border: '1px dashed #94a3b8', padding: '16px 24px', borderRadius: '12px', boxShadow: '0 2px 10px -3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', transition: 'all 0.2s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
                    <Users size={18} style={{ color: '#64748b' }} /> Internal Auditor
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 500, maxWidth: '200px', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={(globalRoles.internalAuditor || []).length > 0 ? (globalRoles.internalAuditor || []).map(id => getUserName(id)).join(', ') : 'Unassigned'}>
                    {(globalRoles.internalAuditor || []).length > 0 ? (globalRoles.internalAuditor || []).map(id => getUserName(id)).join(', ') : 'Unassigned'}
                  </div>
                </div>
              </div>

              {/* Dotted Line Connection */}
              <div style={{ position: 'absolute', top: '50%', left: 'calc(50% - 130px)', width: '60px', height: '2px', borderTop: '2px dashed #94a3b8', zIndex: 1 }}></div>

              {/* Steering Committee */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2 }}>
                <div className="tree-node" style={{ background: 'linear-gradient(135deg, #334155 0%, #0f172a 100%)', color: 'white', padding: '16px 24px', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', border: '1px solid #1e293b', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', transition: 'all 0.2s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
                    <Users size={18} style={{ color: '#94a3b8' }} /> ISMS Steering Committee
                  </div>
                  <div style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 500, maxWidth: '200px', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={(globalRoles.steeringCommittee || []).length > 0 ? (globalRoles.steeringCommittee || []).map(id => getUserName(id)).join(', ') : 'Unassigned'}>
                    {(globalRoles.steeringCommittee || []).length > 0 ? (globalRoles.steeringCommittee || []).map(id => getUserName(id)).join(', ') : 'Unassigned'}
                  </div>
                </div>
                {/* Line down to CISO */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div className="tree-line" style={{ width: '3px', height: '20px', background: '#94a3b8' }}></div>
                  <ArrowDown size={14} style={{ color: '#94a3b8', marginTop: '-2px' }} />
                </div>
              </div>
            </div>

            {/* Level 2: CISO */}
            <div className="tree-node" style={{ background: 'linear-gradient(90deg, #2563eb 0%, #4f46e5 100%)', color: 'white', padding: '14px 24px', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.4)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', zIndex: 2, marginLeft: '298px', transition: 'all 0.2s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
                <ShieldCheck size={20} style={{ color: '#bfdbfe' }} /> Chief Information Security Officer (CISO)
              </div>
              <div style={{ fontSize: '13px', color: '#e0e7ff', fontWeight: 500, maxWidth: '250px', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={globalRoles.ciso ? getUserName(globalRoles.ciso) : 'Unassigned'}>
                {globalRoles.ciso ? getUserName(globalRoles.ciso) : 'Unassigned'}
              </div>
            </div>

            {/* Split Line to Risk Owner and Process Owner (Shifted Right under CISO) */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', marginLeft: '298px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div className="tree-line" style={{ width: '3px', height: '20px', background: 'linear-gradient(180deg, #94a3b8 0%, #cbd5e1 100%)' }}></div>
              </div>
              <div style={{ width: '400px', height: '3px', background: '#cbd5e1' }}></div>

              {/* Level 3: Risk Owner and Process Owner Branches */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '100px', marginTop: '0', paddingTop: '0' }}>

                {/* Risk Owner Branch */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '300px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                    <div style={{ width: '3px', height: '15px', background: '#cbd5e1' }}></div>
                    <ArrowDown size={14} style={{ color: '#94a3b8', marginTop: '-2px' }} />
                  </div>

                  {/* Risk Owner Header Bar */}
                  <div style={{ background: 'linear-gradient(90deg, #0ea5e9 0%, #2563eb 100%)', border: '1px solid #3b82f6', color: 'white', padding: '10px 16px', borderRadius: '8px', width: '100%', textAlign: 'center', fontWeight: 'bold', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', zIndex: 2, marginTop: '4px' }}>
                    Risk Owner
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: '3px', height: '15px', background: '#cbd5e1' }}></div>
                    <ArrowDown size={14} style={{ color: '#94a3b8', marginTop: '-2px', marginBottom: '4px' }} />
                  </div>

                  {/* Dotted Container for Departments under Risk Owner */}
                  <div style={{ border: '1px dashed #93c5fd', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', background: 'rgba(239, 246, 255, 0.5)' }}>
                    {allSelectedDepts.map(dept => {
                      const rO = allUsers.find(u => (u.id || u._id) === orgAssignments[dept]?.riskOwner);
                      return (
                        <div key={dept} style={{ background: 'white', borderLeft: '4px solid #fbbf24', borderTop: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', color: '#1e293b', padding: '12px', borderRadius: '8px', textAlign: 'center', fontWeight: 600, fontSize: '13px', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', transition: 'box-shadow 0.2s' }}>
                          <div style={{ marginBottom: '4px', color: '#1e293b' }}>{dept}</div>
                          <div style={{ fontSize: '12px', fontWeight: 500, color: '#64748b' }}>
                            {rO ? (rO.name || rO.email) : 'Unassigned'}
                          </div>
                        </div>
                      );
                    })}
                    {allSelectedDepts.length === 0 && (
                      <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px', padding: '10px' }}>No departments</div>
                    )}
                  </div>
                </div>

                {/* Process Owner Branch */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '300px' }}>
                  {/* <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                    <div style={{ width: '3px', height: '15px', background: '#cbd5e1' }}></div>
                    <ArrowDown size={14} style={{ color: '#94a3b8', marginTop: '-2px' }} />
                  </div> */}

                  {/* Process Owner Header Bar */}
                  {/* <div style={{ background: 'linear-gradient(90deg, #0ea5e9 0%, #2563eb 100%)', border: '1px solid #3b82f6', color: 'white', padding: '10px 16px', borderRadius: '8px', width: '100%', textAlign: 'center', fontWeight: 'bold', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', zIndex: 2, marginTop: '4px' }}>
                    Process Owner
                  </div> */}
                  {/* <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: '3px', height: '15px', background: '#cbd5e1' }}></div>
                    <ArrowDown size={14} style={{ color: '#94a3b8', marginTop: '-2px', marginBottom: '4px' }} />
                  </div> */}

                  {/* Dotted Container for Departments under Process Owner */}
                  {/* <div style={{ border: '1px dashed #93c5fd', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', background: 'rgba(239, 246, 255, 0.5)' }}>
                    {allSelectedDepts.map(dept => {
                      const pOIds = Array.isArray(orgAssignments[dept]?.processOwner) ? orgAssignments[dept].processOwner : (orgAssignments[dept]?.processOwner ? [orgAssignments[dept].processOwner] : []);
                      const pOUsers = pOIds.map(id => allUsers.find(u => (u.id || u._id) === id)).filter(Boolean);

                      return (
                        <div key={dept} style={{ background: 'white', borderLeft: '4px solid #fbbf24', borderTop: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', color: '#1e293b', padding: '12px', borderRadius: '8px', textAlign: 'center', fontWeight: 600, fontSize: '13px', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', transition: 'box-shadow 0.2s' }}>
                          <div style={{ marginBottom: '4px', color: '#1e293b' }}>{dept}</div>
                          <div style={{ fontSize: '12px', fontWeight: 500, color: '#64748b' }}>
                            {pOUsers.length > 0 ? pOUsers.map(u => u.name || u.email).join(', ') : 'Unassigned'}
                          </div>
                        </div>
                      );
                    })}
                    {allSelectedDepts.length === 0 && (
                      <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px', padding: '10px' }}>No departments</div>
                    )}
                  </div> */}
                </div>

              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default GlobalRolesForm;
