import React from 'react';
import { downloadMaterialWaiverTemplate } from './materialWaiverImport';
import PasteImageTextarea from './PasteImageTextarea';

const displayName = (fp) => fp.split('/').pop().replace(/^[a-z0-9]{6}_/i, '');

const MaterialWaiverSection = ({
  openSection, toggleSection,
  materialRows,
  materialActions,
  materialImportRef,
  handleMaterialChange,
  handleMaterialFileChange,
  handleMaterialImport,
  handleReplaceClick,
  removeMaterialRow,
  addMaterialRow,
  toFileUrl,
  materialOtherNotes,
  setMaterialOtherNotes,
  materialOtherFiles,
  handleMaterialOtherFileChange,
  handleMaterialOtherFileRemove,
}) => {
  const [showOther, setShowOther] = React.useState(false);

  React.useEffect(() => {
    if (materialOtherNotes || (materialOtherFiles && materialOtherFiles.length > 0)) {
      setShowOther(true);
    }
  }, [materialOtherNotes, materialOtherFiles]);

  return (
  <div className="accordion">
    <div className="accordion-header">
      Material Waiver Details
    </div>

    {openSection.includes("material") && (
      <div className="accordion-body">
        <div className="table-wrapper">
          <table className="material-table">
            <colgroup>
              <col style={{ width: '12%' }} />
              <col style={{ width: '18%' }} />
              <col style={{ width: '6%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '18%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '4%' }} />
            </colgroup>
            <thead>
              <tr>
                <th>Current Part Number <span style={{ color: '#dc3545' }}>*</span></th>
                <th>Description</th>
                <th>No. of Per</th>
                <th>Refdes</th>
                <th>To Be Part Number <span style={{ color: '#dc3545' }}>*</span></th>
                <th>Description</th>
                <th>Action</th>
                <th>Attachment</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {materialRows.map((row, index) => (
                <React.Fragment key={index}>
                  <tr>
                    <td>
                      <input
                        className="table-input"
                        placeholder="Current Part No"
                        value={row.currentPart || ""}
                        onChange={(e) => handleMaterialChange(index, "currentPart", e.target.value)}
                      />
                    </td>

                    <td>
                      <textarea
                        className="table-textarea small"
                        placeholder="Description"
                        value={row.currentPartDescription || ""}
                        onChange={(e) => handleMaterialChange(index, "currentPartDescription", e.target.value)}
                      />
                    </td>

                    <td>
                      <input
                        className="table-input"
                        placeholder="Qty"
                        value={row.noOfPer || ""}
                        onChange={(e) => handleMaterialChange(index, "noOfPer", e.target.value)}
                      />
                    </td>

                    <td>
                      <textarea
                        className="table-textarea small"
                        placeholder="Refdes"
                        value={row.refdes || ""}
                        onChange={(e) => handleMaterialChange(index, "refdes", e.target.value)}
                      />
                    </td>

                    <td>
                      <input
                        className="table-input"
                        placeholder="To Be Part No"
                        value={row.newPart || ""}
                        onChange={(e) => handleMaterialChange(index, "newPart", e.target.value)}
                      />
                    </td>

                    <td>
                      <textarea
                        className="table-textarea small"
                        placeholder="Description"
                        value={row.newPartDescription || ""}
                        onChange={(e) => handleMaterialChange(index, "newPartDescription", e.target.value)}
                      />
                    </td>

                    <td>
                      <select
                        className="table-select"
                        value={row.action || ""}
                        onChange={(e) => handleMaterialChange(index, "action", e.target.value)}
                      >
                        <option value="">Select</option>
                        {materialActions.map((action) => (
                          <option key={action} value={action}>{action}</option>
                        ))}
                      </select>
                    </td>

                    <td>
                      <div className="file-upload">
                        <input
                          type="file"
                          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx"
                          multiple
                          onChange={(e) => { handleMaterialFileChange(index, e.target.files); e.target.value = ''; }}
                        />
                        {(() => {
                          const cur = row.file;
                          let files = [];
                          if (Array.isArray(cur)) files = cur;
                          else if (typeof cur === 'string') {
                            try { const p = JSON.parse(cur); files = Array.isArray(p) ? p : [cur]; } catch { files = [cur]; }
                          }
                          return files.map((fp, fi) => (
                            <div key={fi} className="file-preview" style={{ marginBottom: '4px' }}>
                              <a href={toFileUrl(fp)} target="_blank" rel="noreferrer" className="file-link">
                                {displayName(fp)}
                              </a>
                              <button type="button" className="replace-btn" onClick={() => handleReplaceClick(index, fi)}>
                                Remove
                              </button>
                            </div>
                          ));
                        })()}
                      </div>
                    </td>

                    <td>
                      <button
                        type="button"
                        className="delete-btn"
                        onClick={() => removeMaterialRow(index)}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>

                  <tr>
                    <td colSpan="9" style={{ paddingTop: '4px', paddingBottom: '8px', background: '#fafafa' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <label style={{ whiteSpace: 'nowrap', fontWeight: 600, fontSize: '13px', paddingTop: '6px', minWidth: '80px' }}>
                          Instructions <span style={{ color: '#dc3545' }}>*</span>
                        </label>
                        <PasteImageTextarea
                          className="table-textarea"
                          placeholder="Instructions..."
                          value={row.instructions || ""}
                          onChange={(e) => handleMaterialChange(index, "instructions", e.target.value)}
                          toFileUrl={toFileUrl}
                          style={{ flex: 1, minHeight: '60px' }}
                        />
                      </div>
                    </td>
                  </tr>

                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        <div className="table-actions">
          <button type="button" className="add-btn" onClick={addMaterialRow}>
            + Add Row
          </button>
          <button
            type="button"
            className="add-btn"
            style={{ marginLeft: '8px', background: '#198754', borderColor: '#198754' }}
            onClick={() => materialImportRef.current && materialImportRef.current.click()}
          >
            Import
          </button>
          <input
            ref={materialImportRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            style={{ display: 'none' }}
            onChange={handleMaterialImport}
          />
          <button
            type="button"
            className="add-btn"
            style={{ marginLeft: '8px', background: '#198754', borderColor: '#198754' }}
            onClick={downloadMaterialWaiverTemplate}
          >
            Download Template
          </button>
          <button
            type="button"
            className="add-btn"
            style={{ marginLeft: '8px', ...(showOther && { background: '#dc3545', borderColor: '#dc3545' }) }}
            onClick={async () => {
              if (showOther) {
                for (let i = (materialOtherFiles || []).length - 1; i >= 0; i--) {
                  await handleMaterialOtherFileRemove(i);
                }
                setMaterialOtherNotes('');
                setShowOther(false);
              } else {
                setShowOther(true);
              }
            }}
          >
            {showOther ? 'Clear Attachment' : 'Attach'}
          </button>
        </div>

        {showOther && (
          <div style={{ marginTop: '16px', padding: '12px', border: '1px solid #e9ecef', borderRadius: '6px', background: '#fafafa' }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', fontSize: '13px' }}>Other Attachment</label>
            <textarea
              placeholder="Notes for other attachment... (optional)"
              value={materialOtherNotes || ''}
              onChange={(e) => setMaterialOtherNotes(e.target.value)}
              style={{ width: '100%', minHeight: '60px', padding: '6px 10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '13px', boxSizing: 'border-box', resize: 'vertical', marginBottom: '8px' }}
            />
            <div className="file-upload">
              <input
                type="file"
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx"
                multiple
                onChange={(e) => { handleMaterialOtherFileChange(e.target.files); e.target.value = ''; }}
              />
              {(materialOtherFiles || []).map((fp, fi) => (
                <div key={fi} className="file-preview" style={{ marginBottom: '4px' }}>
                  <a href={toFileUrl(fp)} target="_blank" rel="noreferrer" className="file-link">{displayName(fp)}</a>
                  <button type="button" className="replace-btn" onClick={() => handleMaterialOtherFileRemove(fi)}>Remove</button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    )}
  </div>
  );
};

export default MaterialWaiverSection;
