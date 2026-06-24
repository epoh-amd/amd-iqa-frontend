import React from 'react';

const VersionHistoryModal = ({ historyModal, onClose }) => {
  if (!historyModal) return null;

  const fmtDate = (v) => v ? new Date(v).toLocaleDateString() : '-';
  const arrText = (v) => Array.isArray(v) ? v.join(', ') : v || '-';
  const field = (label, value) => {
    if (!value || value === '-') return null;
    return (
      <div style={{ display: 'flex', gap: '8px', marginBottom: '4px', fontSize: '13px' }}>
        <span style={{ minWidth: '180px', color: '#666', fontWeight: 500 }}>{label}:</span>
        <span style={{ color: '#222' }}>{value}</span>
      </div>
    );
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        background: '#fff', borderRadius: '10px', padding: '28px 32px',
        maxWidth: '900px', width: '100%', maxHeight: '85vh', overflowY: 'auto',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '16px' }}>Version History — {historyModal.waiverId}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#555' }}>✕</button>
        </div>

        {historyModal.records.length === 0 ? (
          <p style={{ color: '#888' }}>No version history found.</p>
        ) : historyModal.records.map((r, i) => {
          const isCurrent = r.waiverId === historyModal.waiverId;
          return (
            <div key={r.waiverId || i} style={{
              border: `2px solid ${isCurrent ? '#1a73e8' : '#e0e0e0'}`,
              borderRadius: '8px', marginBottom: '20px', overflow: 'hidden'
            }}>
              <div style={{
                background: isCurrent ? '#e8f4fd' : '#f5f5f5',
                padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <strong style={{ fontSize: '14px', color: isCurrent ? '#1a73e8' : '#333' }}>
                  {r.waiverId} {isCurrent && <span style={{ fontSize: '11px' }}>(current)</span>}
                </strong>
                <span style={{ fontSize: '12px', color: '#555' }}>
                  Status: <strong>{r.status || '-'}</strong> · Submitted by: {r.submittedBy || '-'} · {r.updatedAt ? new Date(r.updatedAt).toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur' }) : '-'}
                </span>
              </div>

              <div style={{ padding: '16px' }}>
                <div style={{ marginBottom: '12px' }}>
                  {field('AMD Product Part Number', r.partNumber)}
                  {field('AMD Product Revision', r.revision)}
                  {field('AMD Product Description', r.description)}
                  {field('Affected Subcontractor', arrText(r.subcontractor))}
                  {field('Assembly Level', arrText(r.assemblyLevel))}
                  {field('Requestor Name', (() => { try { const p = JSON.parse(r.requestor); return Array.isArray(p) ? p.join(', ') : r.requestor; } catch { return r.requestor; } })())}
                  {field('Waiver Start Date', fmtDate(r.startDate))}
                  {field('Waiver End Date', r.endDate ? fmtDate(r.endDate) : null)}
                  {field('Waiver Type', arrText(r.waiverType))}
                  {field('Reason / Justification', r.reason)}
                  {field('Workorder', r.workorder)}
                  {field('Workorder Qty', r.workorderQty)}
                </div>

                {r.waiverType?.includes('Material Waiver') && r.materialRows?.length > 0 && (
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '6px', color: '#333' }}>Material Waiver Details</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                      <thead><tr style={{ background: '#f0f0f0' }}>
                        {['Current Part','Description','No. of Per','Refdes','To Be Part','Description','Action','Instructions'].map(h => (
                          <th key={h} style={{ padding: '6px 8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>{h}</th>
                        ))}
                      </tr></thead>
                      <tbody>{r.materialRows.map((row, ri) => (
                        <tr key={ri} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '6px 8px' }}>{row.current_part || row.currentPart || '-'}</td>
                          <td style={{ padding: '6px 8px' }}>{row.current_part_description || row.currentPartDescription || '-'}</td>
                          <td style={{ padding: '6px 8px' }}>{row.no_of_per || row.noOfPer || '-'}</td>
                          <td style={{ padding: '6px 8px' }}>{row.refdes || '-'}</td>
                          <td style={{ padding: '6px 8px' }}>{row.new_part || row.newPart || '-'}</td>
                          <td style={{ padding: '6px 8px' }}>{row.new_part_description || row.newPartDescription || '-'}</td>
                          <td style={{ padding: '6px 8px' }}>{row.action || '-'}</td>
                          <td style={{ padding: '6px 8px' }}>{row.instructions || '-'}</td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                )}

                {r.waiverType?.includes('Process Waiver') && r.processData?.areas?.length > 0 && (
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '6px', color: '#333' }}>Process Waiver Details</div>
                    {field('Areas', r.processData.areas.join(', '))}
                    {r.processData.areas.map(area => (
                      <div key={area} style={{ marginLeft: '12px', fontSize: '12px', marginBottom: '4px' }}>
                        <strong>{area}:</strong> {r.processData.areaInstructions?.[area] || '-'}
                      </div>
                    ))}
                  </div>
                )}

                {r.waiverType?.includes('Test Waiver') && r.testData?.rows?.length > 0 && (
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '6px', color: '#333' }}>Test Waiver Details</div>
                    {field('Areas', r.testData.areas?.join(', '))}
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginTop: '6px' }}>
                      <thead><tr style={{ background: '#f0f0f0' }}>
                        {['Current Part','To Be Part','Refdes'].map(h => (
                          <th key={h} style={{ padding: '6px 8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>{h}</th>
                        ))}
                      </tr></thead>
                      <tbody>{r.testData.rows.map((row, ri) => (
                        <tr key={ri} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '6px 8px' }}>{row.currentPart || '-'}</td>
                          <td style={{ padding: '6px 8px' }}>{row.toBePart || '-'}</td>
                          <td style={{ padding: '6px 8px' }}>{row.refdes || '-'}</td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                )}

                {r.waiverType?.includes('Spec Deviation') && r.specData && (
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '6px', color: '#333' }}>Spec Deviation Details</div>
                    {field('Spec Impact', r.specData.specImpact)}
                    {field('Instructions', r.specData.instructions)}
                  </div>
                )}

                {r.waiverType?.includes('Rework Waiver') && r.reworkData && (
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '6px', color: '#333' }}>Rework Waiver Details</div>
                    {field('Instructions', r.reworkData.instructions)}
                  </div>
                )}

                {r.waiverType?.includes('Label Waiver') && r.labelData && (
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '6px', color: '#333' }}>Label Waiver Details</div>
                    {field('Instructions', r.labelData.instructions)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VersionHistoryModal;
