import React from 'react';

const DraftsTab = ({ draftsLoading, drafts, handleEditDraft, handleDeleteDraft }) => (
  <div style={{ marginTop: '20px' }}>
    {draftsLoading ? (
      <p>Loading drafts...</p>
    ) : drafts.length === 0 ? (
      <div style={{
        textAlign: 'center', padding: '48px', color: '#aaa',
        border: '1px dashed #ddd', borderRadius: '8px', marginTop: '16px'
      }}>
        No drafts yet. Click <strong>+ Create New Waiver</strong> to start.
      </div>
    ) : (
      <table className="material-table" style={{ width: '100%' }}>
        <thead>
          <tr>
            <th>Waiver ID</th>
            <th>Product Part Number</th>
            <th>Last Updated</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {drafts.map((draft) => (
            <tr key={draft.waiver_id}>
              <td>{draft.waiver_id}</td>
              <td>{draft.part_number || '-'}</td>
              <td>
                {draft.updated_at
                  ? new Date(draft.updated_at).toLocaleDateString()
                  : '-'}
              </td>
              <td style={{ display: 'flex', gap: '8px' }}>
                <button
                  style={{ background: '#0d6efd', color: '#fff', border: '1px solid #0d6efd', padding: '4px 12px', borderRadius: '4px', fontSize: '13px', cursor: 'pointer', fontWeight: 500 }}
                  onClick={() => handleEditDraft(draft)}
                >
                  Edit
                </button>
                <button
                  style={{ background: '#0d6efd', color: '#fff', border: '1px solid #0d6efd', padding: '4px 12px', borderRadius: '4px', fontSize: '13px', cursor: 'pointer', fontWeight: 500 }}
                  onClick={() => handleDeleteDraft(draft.waiver_id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </div>
);

export default DraftsTab;
