import React from 'react';
import api from '../../services/api';

const MyFormsTab = ({
  myFormsLoading,
  myForms,
  myFormsSearch,
  setMyFormsSearch,
  myFormsStatusFilter,
  setMyFormsStatusFilter,
  expandedCancelReason,
  setExpandedCancelReason,
  cancelTarget,
  setCancelTarget,
  setShowCancelConfirm,
  setHistoryModal,
  handleEditMyForm,
  handleDuplicate,
  navigate,
}) => {
  const filterForms = (forms, q, statusFilter) => {
    return forms.filter(w => {
      const subText = Array.isArray(w.subcontractor)
        ? w.subcontractor.join(' ')
        : typeof w.subcontractor === 'string'
          ? w.subcontractor.replace(/[\[\]"\\]/g, ' ')
          : '';
      const terms = q.split(/[\s,]+/).filter(Boolean);
      const matchesTerm = (t) =>
        (w.waiver_id || '').toLowerCase().includes(t) ||
        (w.part_number || '').toLowerCase().includes(t) ||
        (w.description || '').toLowerCase().includes(t) ||
        (w.workorder || '').toLowerCase().includes(t) ||
        subText.toLowerCase().includes(t) ||
        (w.reason || '').toLowerCase().includes(t);
      const matchSearch = !q || terms.some(matchesTerm);
      const matchStatus = statusFilter === 'all' || (w.status || 'New') === statusFilter;
      return matchSearch && matchStatus;
    });
  };

  const q = myFormsSearch.toLowerCase();
  const filtered = filterForms(myForms, q, myFormsStatusFilter);

  return (
    <div style={{ marginTop: '20px' }}>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
        <input
          type="text"
          placeholder="Search by Waiver ID, Part Number, Description, Workorder, Subcontractor..."
          value={myFormsSearch}
          onChange={(e) => setMyFormsSearch(e.target.value)}
          style={{
            flex: 1, padding: '9px 14px',
            border: '1px solid #ccc', borderRadius: '6px',
            fontSize: '14px', boxSizing: 'border-box'
          }}
        />
        <select
          value={myFormsStatusFilter}
          onChange={(e) => setMyFormsStatusFilter(e.target.value)}
          style={{ padding: '9px 14px', border: '1px solid #ccc', borderRadius: '6px', fontSize: '14px', cursor: 'pointer' }}
        >
          <option value="all">All Status</option>
          <option value="New">New</option>
          <option value="Pending Approval">Pending Approval</option>
          <option value="Approved">Approved</option>
          <option value="Cancelled">Cancelled</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {myFormsLoading ? (
        <p>Loading...</p>
      ) : filtered.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '48px', color: '#aaa',
          border: '1px dashed #ddd', borderRadius: '8px', marginTop: '16px'
        }}>
          {myForms.length === 0 ? 'No forms found.' : 'No results match your search.'}
        </div>
      ) : (
        <table className="material-table" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>Waiver ID</th>
              <th>Product Part Number</th>
              <th>Product Part Description</th>
              <th>Revision</th>
              <th>Reason / Justification</th>
              <th>Status</th>
              <th>Remarks</th>
              <th>Updated At</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((w) => {
              const status = w.status || 'New';
              const statusColor = {
                'New': { bg: '#e8f4fd', color: '#1a73e8' },
                'Pending Approval': { bg: '#fff8e1', color: '#f57c00' },
                'Approved': { bg: '#e8f5e9', color: '#2e7d32' },
                'Cancelled': { bg: '#fff3e0', color: '#e65100' },
                'Rejected': { bg: '#fdecea', color: '#c62828' },
              }[status] || { bg: '#cfcfcf49', color: '#555' };

              const cancelledBy = w.cancelled_by || '';
              const cancelReason = w.cancel_reason || '';
              const isApproverReject = status === 'Rejected' && cancelledBy.toLowerCase().startsWith('approver:');
              const isRequestorCancel = status === 'Cancelled' && cancelledBy.toLowerCase().startsWith('requestor:');
              const cancellerName = cancelledBy.includes(':')
                ? cancelledBy.split(':').slice(1).join(':').trim()
                : cancelledBy.trim();

              let displayText = status;
              if (isApproverReject) displayText = `Rejected by ${cancellerName}`;
              else if (isRequestorCancel) displayText = 'Cancelled (by you)';
              else if (status === 'Cancelled' && cancelledBy) displayText = `Cancelled by ${cancellerName}`;
              else if (status === 'Rejected' && cancelledBy) displayText = `Rejected by ${cancellerName}`;

              const isExpanded = expandedCancelReason === w.waiver_id;

              return (
                <tr key={w.waiver_id}>
                  <td>
                    <span className="wm-waiver-link" onClick={() => navigate(`/waiver-view?id=${w.waiver_id}`)}>
                      {w.waiver_id}
                    </span>
                  </td>
                  <td>{w.part_number || '-'}</td>
                  <td>{w.description || '-'}</td>
                  <td>{w.revision || '-'}</td>
                  <td>{w.reason || '-'}</td>
                  <td>
                    <div>
                      <span className="mf-status-badge" style={{ background: statusColor.bg, color: statusColor.color }}>
                        {displayText}
                      </span>
                      {status === 'Approved' && w.approved_by && (
                        <div>
                          <span
                            onClick={() => setExpandedCancelReason(isExpanded ? null : w.waiver_id)}
                            style={{ cursor: 'pointer', fontSize: '11px', color: '#2e7d32' }}
                          >
                            {isExpanded ? '▲' : '▼'}
                          </span>
                          {isExpanded && (
                            <div style={{ fontSize: '12px', color: '#1b5e20', marginTop: '2px' }}>
                              by {w.approved_by}
                            </div>
                          )}
                        </div>
                      )}
                      {w.modified_by && (
                        <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                          Modified by {w.modified_by}
                        </div>
                      )}
                      {(status === 'Rejected' || status === 'Cancelled') && cancelReason && (
                        <div>
                          <span className="mf-cancel-toggle" onClick={() => setExpandedCancelReason(isExpanded ? null : w.waiver_id)}>
                            {isExpanded ? 'Hide reason ▲' : 'View reason ▼'}
                          </span>
                          {isExpanded && (
                            <div style={{
                              marginTop: '4px', padding: '8px 12px', background: '#eeeeee',
                              border: '1px solid #ccc', borderLeft: '3px solid #aaa',
                              borderRadius: '4px', fontSize: '12px', color: '#444',
                              maxWidth: '220px', lineHeight: '1.5'
                            }}>
                              {cancelReason}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </td>

                  <td style={{ fontSize: '13px', color: '#555', maxWidth: '180px' }}>
                    {cancelledBy && !cancelledBy.toLowerCase().startsWith('requestor:') && status === 'New' ? (
                      <div>
                        <div style={{ fontWeight: 500, color: '#c62828' }}>
                          Rejected by {cancelledBy.includes(':') ? cancelledBy.split(':').slice(1).join(':').trim() : cancelledBy}
                        </div>
                        {w.cancel_reason && (() => {
                          const isExp = expandedCancelReason === w.waiver_id;
                          return (
                            <div>
                              <span className="mf-cancel-toggle" onClick={() => setExpandedCancelReason(isExp ? null : w.waiver_id)}>
                                {isExp ? 'Hide reason ▲' : 'View reason ▼'}
                              </span>
                              {isExp && (
                                <div style={{
                                  marginTop: '4px', padding: '8px 12px',
                                  background: '#fdecea', border: '1px solid #f5c6cb',
                                  borderLeft: '3px solid #c62828', borderRadius: '4px',
                                  fontSize: '12px', color: '#444', lineHeight: '1.5'
                                }}>
                                  {w.cancel_reason}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    ) : '-'}
                  </td>

                  <td style={{ whiteSpace: 'nowrap', fontSize: '13px', color: '#555' }}>
                    {w.updated_at ? (() => {
                      const raw = w.updated_at;
                      let date;
                      if (typeof raw === 'string' && !raw.endsWith('Z') && !raw.includes('+')) {
                        date = new Date(raw.replace(' ', 'T') + '+08:00');
                      } else {
                        date = new Date(raw);
                      }
                      return isNaN(date) ? '-' : date.toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur' });
                    })() : '-'}
                  </td>

                  <td>
                    <div style={{ display: 'flex', flexDirection: 'row', gap: '4px', flexWrap: 'nowrap' }}>
                      {(() => {
                        const canEdit = status === 'New' || status === 'Pending Approval' || status === 'Cancelled';
                        const canVersionHistory = /^WV\d+-[B-Z]$/.test(w.waiver_id);
                        const canCancel = status !== 'Cancelled' && status !== 'Rejected' && status !== 'Approved';
                        const btnBase = {
                          padding: '4px 10px', fontSize: '12px', borderRadius: '4px',
                          border: '1px solid #0d6efd', cursor: 'pointer', fontWeight: 500,
                          whiteSpace: 'nowrap'
                        };
                        const activeStyle = { ...btnBase, background: '#0d6efd', color: '#fff' };
                        const disabledStyle = { ...btnBase, background: '#e9ecef', color: '#aaa', border: '1px solid #dee2e6', cursor: 'not-allowed' };
                        return (
                          <>
                            <button
                              style={canEdit ? activeStyle : disabledStyle}
                              disabled={!canEdit}
                              onClick={() => canEdit && handleEditMyForm(w.waiver_id)}
                            >Edit</button>
                            <button
                              style={activeStyle}
                              onClick={() => handleDuplicate(w.waiver_id)}
                            >Duplicate</button>
                            <button
                              style={canCancel ? activeStyle : disabledStyle}
                              disabled={!canCancel}
                              onClick={() => canCancel && setCancelTarget(
                                cancelTarget?.waiverId === w.waiver_id
                                  ? null
                                  : { waiverId: w.waiver_id, reason: '' }
                              )}
                            >Cancel</button>
                            <button
                              style={canVersionHistory ? activeStyle : disabledStyle}
                              disabled={!canVersionHistory}
                              onClick={async () => {
                                if (!canVersionHistory) return;
                                try {
                                  const chain = await api.getWaiverHistory(w.waiver_id);
                                  const details = await Promise.all(chain.map(r => api.getWaiverDetails(r.waiver_id).catch(() => r)));
                                  setHistoryModal({ waiverId: w.waiver_id, records: details });
                                } catch { setHistoryModal({ waiverId: w.waiver_id, records: [] }); }
                              }}
                            >Revision</button>
                          </>
                        );
                      })()}
                    </div>
                    {cancelTarget?.waiverId === w.waiver_id && (
                      <div style={{ marginTop: '8px' }}>
                        <textarea
                          rows={2}
                          placeholder="Enter cancellation reason..."
                          value={cancelTarget.reason}
                          onChange={(e) => setCancelTarget({ ...cancelTarget, reason: e.target.value })}
                          style={{
                            width: '100%', padding: '6px 10px', fontSize: '13px',
                            border: '1px solid #ccc', borderRadius: '4px',
                            resize: 'vertical', boxSizing: 'border-box'
                          }}
                        />
                        <button
                          className="delete-btn"
                          style={{
                            marginTop: '4px', border: '1px solid #dc3545',
                            padding: '4px 12px', borderRadius: '4px',
                            opacity: !cancelTarget.reason.trim() ? 0.5 : 1,
                            cursor: !cancelTarget.reason.trim() ? 'not-allowed' : 'pointer'
                          }}
                          disabled={!cancelTarget.reason.trim()}
                          onClick={() => setShowCancelConfirm(true)}
                        >
                          Confirm Cancel
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default MyFormsTab;
