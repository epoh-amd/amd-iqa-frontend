import React, { useState, useEffect, useCallback } from 'react';
import { getAllConfig, saveConfig } from './waiverConfig';
import '../../assets/css/waiver.css';
import '../../assets/css/editBuildData.css';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';


const SECTIONS = [
  {
    configKey: 'notifiers',
    label: 'Notifiers',
    description: 'Users who will be notified when a waiver is submitted.',
    type: 'email',
    icon: '🔔',
    color: '#3498db',
    bg: '#eaf4fb',
  },
  {
    configKey: 'approvers',
    label: 'Approvers',
    description: 'Users who have authority to approve waiver requests.',
    type: 'email',
    icon: '✅',
    color: '#27ae60',
    bg: '#eafaf1',
  },
  {
    configKey: 'subcontractors',
    label: 'Affected Subcontractor',
    description: 'Subcontractor options shown in the waiver form.',
    type: 'text',
    icon: '🏭',
    color: '#8e44ad',
    bg: '#f5eef8',
  },
  {
    configKey: 'assemblyLevels',
    label: 'Assembly Level',
    description: 'Assembly level options shown in the waiver form.',
    type: 'text',
    icon: '🔧',
    color: '#e67e22',
    bg: '#fef5e7',
  },
  {
    configKey: 'materialActions',
    label: 'Material Waiver Actions',
    description: 'Action dropdown options in the Material Waiver details table.',
    type: 'text',
    icon: '📦',
    color: '#c0392b',
    bg: '#fdedec',
  },
];

const ManageSection = ({ configKey, label, description, type, icon, color, bg, initialItems, onUpdate }) => {
  const [items, setItems] = useState(initialItems || []);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setItems(initialItems || []);
  }, [initialItems]);

  const persist = async (updated) => {
    setSaving(true);
    try {
      await saveConfig(configKey, updated);
      setItems(updated);
      onUpdate(configKey, updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch (e) {
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const add = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    if (type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Enter a valid email address.');
      return;
    }
    if (items.includes(trimmed)) {
      setError('Already in list.');
      return;
    }
    setError('');
    persist([...items, trimmed]);
    setInput('');
  };

  const remove = (item) => persist(items.filter((i) => i !== item));

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); add(); }
  };

  return (
    <div className="wm-card">
      <div className="wm-card-header" style={{ background: bg, borderBottomColor: color }}>
        <span className="wm-card-icon">{icon}</span>
        <div className="wm-card-header-text">
          <h3>{label}</h3>
          <p>{description}</p>
        </div>
        {saving && <span className="wm-badge-saved" style={{ background: '#fff3cd', color: '#856404' }}>Saving...</span>}
        {saved && <span className="wm-badge-saved">✓ Saved</span>}
        <span className="wm-badge-count" style={{ background: color }}>
          {items.length} {items.length === 1 ? 'item' : 'items'}
        </span>
      </div>

      <div className="wm-card-body">
        <div className="wm-input-row">
          <input
            type={type === 'email' ? 'email' : 'text'}
            value={input}
            onChange={(e) => { setInput(e.target.value); setError(''); }}
            onKeyPress={handleKeyPress}
            placeholder={type === 'email' ? 'Enter email address...' : 'Enter value...'}
            className={`wm-input${error ? ' wm-input-error' : ''}`}
            disabled={saving}
          />
          <button
            className="wm-add-btn"
            onClick={add}
            disabled={!input.trim() || saving}
            style={{ background: input.trim() && !saving ? color : undefined }}
          >
            + Add
          </button>
        </div>

        {error && <p className="wm-error">{error}</p>}

        {items.length === 0 ? (
          <div className="wm-empty">No items added yet. Use the input above to add one.</div>
        ) : (
          <div className="wm-tags">
            {items.map((item, i) => (
              <div key={i} className="wm-tag" style={{ background: bg, borderColor: `${color}33` }}>
                {type === 'email' && <span className="wm-tag-icon" style={{ color }}>✉</span>}
                {item}
                <button className="wm-tag-remove" onClick={() => remove(item)} title="Remove" disabled={saving}>
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const ALLOWED_USER_MANAGEMENT_EMAILS = [
  'ErnQi.Poh@amd.com',
  'LayLing.Chew@amd.com',
  'SLTeh.Teh@amd.com',
  'BeowHwa.Yap@amd.com'

];

const WaiverManagement = () => {
  const { user } = useAuth();

  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showApprovals, setShowApprovals] = useState(true);
  const [approvals, setApprovals] = useState([]);
  const [approvalsLoading, setApprovalsLoading] = useState(false);
  const [approvalsFilter, setApprovalsFilter] = useState('New');
  const [approvalsSearch, setApprovalsSearch] = useState('');
   const [expandedCancelReason, setExpandedCancelReason] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null); // { waiverId, reason }
  const [actionLoading, setActionLoading] = useState(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [approveTarget, setApproveTarget] = useState(null); // waiverId
  const [closedTarget, setClosedTarget] = useState(null);   // waiverId
  const navigate = useNavigate();


  useEffect(() => {
    const fetchConfig = async () => {
      const data = await getAllConfig();
      setConfig(data);
      setLoading(false);
    };
    fetchConfig();
    fetchApprovals();
  }, []);


  const handleUpdate = useCallback((key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  }, []);

  const fetchApprovals = async () => {
    setApprovalsLoading(true);
    try {
      const data = await api.getWaiversForApproval();
      setApprovals(data);
    } catch (err) {
      console.error('Failed to load approvals:', err);
    } finally {
      setApprovalsLoading(false);
    }
  };

  const handleApprovalsBtn = () => {
    const next = !showApprovals;
    setShowApprovals(next);
    if (next) fetchApprovals();
  };

  const handleAction = async (waiverId, status, reason = null) => {
    setActionLoading(waiverId);
    try {
      const cancelledBy = status === 'Rejected' ? `Approver: ${user?.full_name || ''}` : null;
      const approvedBy = status === 'Approved' ? (user?.full_name || '') : null;
      await api.updateWaiverStatus(waiverId, status, reason, cancelledBy, approvedBy);
      setApprovals(prev => prev.filter(w => w.waiver_id !== waiverId));
      setCancelTarget(null);
      if (status === 'Approved' || status === 'Rejected') {
        api.sendWaiverStatusNotification({
          waiverId,
          status,
          actionBy: user?.full_name || '',
          cancelReason: reason || null,
        });
      }
    } catch (err) {
      console.error('Action failed:', err);
    } finally {
      setActionLoading(null);
    }
  };


  const people = SECTIONS.slice(0, 2);
  const formOpts = SECTIONS.slice(2);

  if (loading) return <div className="edit-build-data-container"><p>Loading configuration...</p></div>;

  return (
    <div className="edit-build-data-container">
      <div className="edit-page-header">
        <div className="header-title">
          <h1>Waiver Management</h1>
        </div>
        <button className="wm-approvals-btn" onClick={handleApprovalsBtn}>
          {showApprovals ? 'User Management' : '← Back to Approvals'}
        </button>

      </div>

      {/* Approvals Section */}
      {showApprovals && (() => {
        const isApprover = Array.isArray(config?.approvers) &&
          config.approvers.some(email => email.toLowerCase() === (user?.email || '').toLowerCase());

        return (
          <div className="wm-approvals-section">
            <h2>Waiver Approvals</h2>
            {!isApprover ? (
              <div className="wm-approvals-locked">
                <span className="wm-lock-icon">🔒</span>
                <p>Access restricted. Only designated approvers can view this section.</p>
              </div>
            ) : approvalsLoading ? (
              <p>Loading...</p>
            ) : (
              <>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
                  <input
                    type="text"
                    placeholder="Search by Waiver ID, Part Number or Submitted By..."
                    value={approvalsSearch}
                    onChange={(e) => setApprovalsSearch(e.target.value)}
                    style={{
                      flex: 1, padding: '8px 14px', border: '1px solid #ccc',
                      borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box'
                    }}
                  />
                  <select
                    value={approvalsFilter}
                    onChange={(e) => setApprovalsFilter(e.target.value)}
                    style={{
                      padding: '8px 14px', border: '1px solid #ccc',
                      borderRadius: '6px', fontSize: '14px', cursor: 'pointer'
                    }}
                  >
                    <option value="all">All Status</option>
                    <option value="New">New</option>
                    <option value="Approved">Approved</option>
                    <option value="Closed">Closed</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
                {approvals.filter(w => {
                  const q = approvalsSearch.toLowerCase();
                  const matchSearch = !q ||
                    (w.waiver_id || '').toLowerCase().includes(q) ||
                    (w.part_number || '').toLowerCase().includes(q) ||
                    (w.submitted_by || '').toLowerCase().includes(q);
                  const matchStatus = approvalsFilter === 'all' || w.status === approvalsFilter;
                  return matchSearch && matchStatus;
                }).length === 0 ? (
                  <div className="wm-approvals-empty">No records found.</div>
                ) : (
                  <table className="wm-approvals-table">
                    <thead>

                      <tr>
                        <th>Waiver ID</th>
                        <th>Product Part Number</th>
                        <th>Submitted By</th>
                        <th>Submitted Date</th>
                        <th>Approved By</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {approvals.filter(w => {
                        const q = approvalsSearch.toLowerCase();
                        const matchSearch = !q ||
                          (w.waiver_id || '').toLowerCase().includes(q) ||
                          (w.part_number || '').toLowerCase().includes(q) ||
                          (w.submitted_by || '').toLowerCase().includes(q);
                        const matchStatus = approvalsFilter === 'all' || w.status === approvalsFilter;
                        return matchSearch && matchStatus;
                      }).map((w) => (

                        <tr key={w.waiver_id}>
                          <td>
                            <span
                              className="wm-waiver-link"
                              onClick={() => navigate(`/waiver-view?id=${w.waiver_id}`)}

                            >
                              {w.waiver_id}
                            </span>
                          </td>


                          <td>{w.part_number || '-'}</td>
                          <td>{w.submitted_by || '-'}</td>
                          <td>{w.submitted_at ? new Date(w.submitted_at).toLocaleDateString() : '-'}</td>
                          <td style={{ fontSize: '13px', color: w.approved_by ? '#2e7d32' : '#aaa' }}>
                            {w.approved_by || '-'}
                          </td>
                          <td>
                        {w.status === 'Rejected' ? (() => {
                          const cancelledBy = w.cancelled_by || '';
                          const cancelReason = w.cancel_reason || '';
                          const cancellerName = cancelledBy.includes(':')
                            ? cancelledBy.split(':').slice(1).join(':').trim()
                            : cancelledBy;
                          const isExpanded = expandedCancelReason === w.waiver_id;
                          return (
                            <div>
                              <span style={{ fontSize: '13px', color: '#555' }}>
                                {cancellerName ? `Rejected by ${cancellerName}` : '-'}
                              </span>
                              {cancelReason && (
                                <div>
                                  <span
                                    className="mf-cancel-toggle"
                                    onClick={() => setExpandedCancelReason(isExpanded ? null : w.waiver_id)}
                                  >
                                    {isExpanded ? 'Hide reason ▲' : 'View reason ▼'}
                                  </span>
                                  {isExpanded && (
                                    <div style={{
                                      marginTop: '4px', padding: '8px 12px',
                                      background: '#eeeeee', border: '1px solid #ccc',
                                      borderLeft: '3px solid #aaa', borderRadius: '4px',
                                      fontSize: '12px', color: '#444',
                                      maxWidth: '220px', lineHeight: '1.5'
                                    }}>
                                      {cancelReason}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })() : w.status === 'Closed' ? (
                          <span style={{ color: '#aaa' }}>-</span>
                        ) : (
                          <div className="wm-action-btns">
                            {w.status === 'New' && (
                              <button
                                className="add-btn"
                                style={{ padding: '4px 12px', fontSize: '13px' }}
                                onClick={() => navigate(`/waiver-form?approverEdit=true&id=${w.waiver_id}`)}
                              >
                                Edit
                              </button>
                            )}
                            {w.status === 'New' && (
                              <button
                                className="wm-btn-approve"
                                disabled={actionLoading === w.waiver_id}
                                onClick={() => setApproveTarget(w.waiver_id)}
                              >
                                Approve
                              </button>
                            )}
                            {w.status === 'Approved' && (
                              <button
                                className="wm-btn-cancel"
                                disabled={actionLoading === w.waiver_id}
                                onClick={() => setClosedTarget(w.waiver_id)}
                              >
                                Closed
                              </button>
                            )}
                            {(w.status === 'New' || w.status === 'Approved') && (
                              <button
                                className="wm-btn-reject"
                                onClick={() =>
                                  setCancelTarget(
                                    cancelTarget?.waiverId === w.waiver_id
                                      ? null
                                      : { waiverId: w.waiver_id, reason: '' }
                                  )
                                }
                              >
                                Reject
                              </button>
                            )}
                          </div>
                        )}



                            {/* Cancel expand */}
                            {cancelTarget?.waiverId === w.waiver_id && (
                              <div className="wm-cancel-expand">
                                <textarea
                                  placeholder="Enter rejection reason..."
                                  value={cancelTarget.reason}
                                  onChange={(e) =>
                                    setCancelTarget({ ...cancelTarget, reason: e.target.value })
                                  }
                                />
                                <button
                                  className="wm-cancel-confirm-btn"
                                  disabled={!cancelTarget.reason.trim() || actionLoading === w.waiver_id}
                                  onClick={() => setShowCancelConfirm(true)}
                                >
                                  Confirm Reject
                                </button>

                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            )}
          </div>
        );
      })()}


      {/* Config Layout - hidden when approvals is shown */}
      {!showApprovals && (() => {
        const canManage = ALLOWED_USER_MANAGEMENT_EMAILS.some(
          email => email.toLowerCase() === (user?.email || '').toLowerCase()
        );

        if (!canManage) return (
          <div className="wm-approvals-locked" style={{ marginTop: '24px' }}>
            <span className="wm-lock-icon">🔒</span>
            <p>Access restricted. You do not have permission to manage waiver settings.</p>
          </div>
        );

        return (
          <div className="wm-layout">

            <div>
              <div className="wm-column-title"><span>👥</span><h2>People</h2></div>
              {people.map((s) => (
                <ManageSection key={s.configKey} {...s} initialItems={config[s.configKey]} onUpdate={handleUpdate} />
              ))}
            </div>
            <div>
              <div className="wm-column-title"><span>⚙️</span><h2>Form Options</h2></div>
              {formOpts.map((s) => (
                <ManageSection key={s.configKey} {...s} initialItems={config[s.configKey]} onUpdate={handleUpdate} />
              ))}
            </div>
          </div>
        );
      })()}

      {showCancelConfirm && (
        <div className="waiver-modal-overlay">
          <div className="waiver-modal">
            <h3>Reject Waiver</h3>
            <p>Confirm reject — <strong>this action cannot be undone.</strong></p>
            <div className="waiver-modal-actions">
              <button className="waiver-modal-cancel" onClick={() => setShowCancelConfirm(false)}>Go Back</button>
              <button
                className="waiver-modal-delete"
                onClick={() => {
                  setShowCancelConfirm(false);
                  handleAction(cancelTarget.waiverId, 'Rejected', cancelTarget.reason);
                }}
              >
                Yes, Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {approveTarget && (
        <div className="waiver-modal-overlay">
          <div className="waiver-modal">
            <h3>Approve Waiver</h3>
            <p>Confirm approval for <strong>{approveTarget}</strong> — this action cannot be undone.</p>
            <div className="waiver-modal-actions">
              <button className="waiver-modal-cancel" onClick={() => setApproveTarget(null)}>Go Back</button>
              <button
                className="wm-btn-approve"
                onClick={() => {
                  const id = approveTarget;
                  setApproveTarget(null);
                  handleAction(id, 'Approved');
                }}
              >
                Yes, Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {closedTarget && (
        <div className="waiver-modal-overlay">
          <div className="waiver-modal">
            <h3>Close Waiver</h3>
            <p>Confirm closing <strong>{closedTarget}</strong> — this action cannot be undone.</p>
            <div className="waiver-modal-actions">
              <button className="waiver-modal-cancel" onClick={() => setClosedTarget(null)}>Go Back</button>
              <button
                className="waiver-modal-delete"
                onClick={() => {
                  const id = closedTarget;
                  setClosedTarget(null);
                  handleAction(id, 'Closed');
                }}
              >
                Yes, Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );


};

export default WaiverManagement;

