import React from 'react';
import { downloadMaterialWaiverTemplate } from './materialWaiverImport';

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
}) => (
  <div className="accordion">
    <div className="accordion-header">
      Material Waiver Details
    </div>

    {openSection.includes("material") && (
      <div className="accordion-body">

        <div className="table-wrapper">
          <table className="material-table">
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
                        {!row.file ? (
                          <input
                            type="file"
                            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx"
                            onChange={(e) => handleMaterialFileChange(index, e.target.files[0])}
                          />
                        ) : (
                          <div className="file-preview">
                            <a
                              href={toFileUrl(row.file)}
                              target="_blank"
                              rel="noreferrer"
                              className="file-link"
                            >
                              {row.file.split("/").pop()}
                            </a>
                            <button
                              type="button"
                              className="replace-btn"
                              onClick={() => handleReplaceClick(index)}
                            >
                              Replace
                            </button>
                          </div>
                        )}
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
                        <textarea
                          className="table-textarea"
                          placeholder="Instructions..."
                          value={row.instructions || ""}
                          onChange={(e) => handleMaterialChange(index, "instructions", e.target.value)}
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
            style={{ marginLeft: '8px', background: '#0d6efd', borderColor: '#0d6efd' }}
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
        </div>

      </div>
    )}
  </div>
);

export default MaterialWaiverSection;
