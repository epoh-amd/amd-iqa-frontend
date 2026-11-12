// frontend/src/pages/StartBuild/BkcDetailsTable.js

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheck,
  faExclamationTriangle,
  faSync,
  faSpinner,
  faTimes,
  faCamera,
  faImage
} from '@fortawesome/free-solid-svg-icons';

const BkcDetailsTable = ({
  builds,
  extractFirmwareVersions,
  handleBkcFieldChange
}) => {

  const getBuildReference = (build, buildIndex) => {
    return build.systemInfo?.bmcName || `Build ${buildIndex + 1}`;
  };

  const pasteToAll = (field, value) => {
    builds.forEach((_, i) => handleBkcFieldChange(i, field, value));
  };

  const PasteAllBtn = ({ field, value }) => {
    if (builds.length <= 1 || !value) return null;
    return (
      <button
        type="button"
        onClick={() => pasteToAll(field, value)}
        style={{
          display: 'block', marginTop: '4px', fontSize: '11px',
          padding: '2px 8px', background: '#0066cc', color: '#fff',
          border: 'none', borderRadius: '4px', cursor: 'pointer',
          whiteSpace: 'nowrap'
        }}
      >
        Paste to All
      </button>
    );
  };

  return (
    <div className="builds-table-container">
      <table className="builds-table">
        <thead>
          <tr>
            <th className="build-reference">Build Reference</th>
            <th>Extract</th>
            <th>BIOS Version</th>
            <th>SCM FPGA Version (Optional)</th>
            <th>{builds.some(b => b.systemInfo.projectName === 'MI430x') ? 'CPLD Version' : 'HPM FPGA Version'}</th>
            <th>BMC Version</th>
            <th>PLDM Version</th>
            <th>CPU Pin Condition</th>
          </tr>
        </thead>
        <tbody>
          {builds.map((build, buildIndex) => (
            <tr key={build.id} className={`build-row ${build.status}`}>
              <td className="build-reference">{getBuildReference(build, buildIndex)}</td>
              <td className="extract-cell">
                <button
                  type="button"
                  className={`extract-btn ${build.bkcExtraction.extracting ? 'extracting' : ''} ${build.bkcExtraction.extracted ? 'extracted' : ''} ${build.bkcExtraction.error ? 'error' : ''}`}
                  onClick={() => extractFirmwareVersions(buildIndex)}
                  disabled={build.bkcExtraction.extracting || !build.systemInfo.bmcName}
                  title={build.bkcExtraction.error ? build.bkcExtraction.error : ''}
                >
                  {build.bkcExtraction.extracting ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} spin />
                      <span>Extracting...</span>
                    </>
                  ) : build.bkcExtraction.extracted ? (
                    <>
                      <FontAwesomeIcon icon={faCheck} />
                      <span>Extracted</span>
                    </>
                  ) : build.bkcExtraction.error ? (
                    <>
                      <FontAwesomeIcon icon={faTimes} />
                      <span>Retry</span>
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faSync} />
                      <span>Extract</span>
                    </>
                  )}
                </button>
                {build.bkcExtraction.error && (
                  <div className="extract-error">
                    <FontAwesomeIcon icon={faExclamationTriangle} />
                    <span>{build.bkcExtraction.error}</span>
                  </div>
                )}
              </td>
              <td>
                <input
                  type="text"
                  value={build.bkcDetails.biosVersion}
                  onChange={(e) => handleBkcFieldChange(buildIndex, 'biosVersion', e.target.value)}
                  placeholder="Enter BIOS Version"
                  className={build.errors.biosVersion ? 'error' : ''}
                />
                {build.errors.biosVersion && (
                  <div className="field-error">{build.errors.biosVersion}</div>
                )}
                <PasteAllBtn field="biosVersion" value={build.bkcDetails.biosVersion} />
              </td>
              <td>
                <input
                  type="text"
                  value={build.bkcDetails.scmFpgaVersion}
                  onChange={(e) => handleBkcFieldChange(buildIndex, 'scmFpgaVersion', e.target.value)}
                  placeholder="Enter SCM FPGA Version (Optional)"
                  className={`optional-field ${build.errors.scmFpgaVersion ? 'error' : ''}`}
                />
                {build.errors.scmFpgaVersion && (
                  <div className="field-error">{build.errors.scmFpgaVersion}</div>
                )}
              </td>
              <td>
                {build.systemInfo.projectName === 'MI430x' ? (
                  <>
                    <input
                      type="text"
                      value={build.bkcDetails.cpldVersion || ''}
                      onChange={(e) => handleBkcFieldChange(buildIndex, 'cpldVersion', e.target.value)}
                      placeholder="Enter CPLD Version"
                      className={build.errors.cpldVersion ? 'error' : ''}
                    />
                    {build.errors.cpldVersion && (
                      <div className="field-error">{build.errors.cpldVersion}</div>
                    )}
                    <PasteAllBtn field="cpldVersion" value={build.bkcDetails.cpldVersion} />
                  </>
                ) : (
                  <>
                    <input
                      type="text"
                      value={build.bkcDetails.hpmFpgaVersion}
                      onChange={(e) => handleBkcFieldChange(buildIndex, 'hpmFpgaVersion', e.target.value)}
                      placeholder="Enter HPM FPGA Version"
                      className={build.errors.hpmFpgaVersion ? 'error' : ''}
                    />
                    {build.errors.hpmFpgaVersion && (
                      <div className="field-error">{build.errors.hpmFpgaVersion}</div>
                    )}
                    <PasteAllBtn field="hpmFpgaVersion" value={build.bkcDetails.hpmFpgaVersion} />
                  </>
                )}
              </td>
              <td>
                <input
                  type="text"
                  value={build.bkcDetails.bmcVersion}
                  onChange={(e) => handleBkcFieldChange(buildIndex, 'bmcVersion', e.target.value)}
                  placeholder="Enter BMC Version"
                  className={build.errors.bmcVersion ? 'error' : ''}
                />
                {build.errors.bmcVersion && (
                  <div className="field-error">{build.errors.bmcVersion}</div>
                )}
                <PasteAllBtn field="bmcVersion" value={build.bkcDetails.bmcVersion} />
              </td>
              <td>
                <input
                  type="text"
                  value={build.bkcDetails.pldmVersion || ''}
                  onChange={(e) => handleBkcFieldChange(buildIndex, 'pldmVersion', e.target.value)}
                  placeholder="Enter PLDM Version"
                  className={build.errors.pldmVersion ? 'error' : ''}
                />
                {build.errors.pldmVersion && (
                  <div className="field-error">{build.errors.pldmVersion}</div>
                )}
                <PasteAllBtn field="pldmVersion" value={build.bkcDetails.pldmVersion} />
              </td>
              <td>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    id={`cpu-pin-bkc-${build.id}`}
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const newFiles = Array.from(e.target.files);
                      if (!newFiles.length) return;
                      e.target.value = '';
                      const existing = build.bkcDetails.cpuPinPhotoFiles || [];
                      handleBkcFieldChange(buildIndex, 'cpuPinPhotoFiles', [
                        ...existing,
                        ...newFiles.map(f => ({ file: f, name: f.name }))
                      ]);
                    }}
                  />
                  <label
                    htmlFor={`cpu-pin-bkc-${build.id}`}
                    className="upload-btn-small"
                    style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}
                    title="Upload CPU pin condition photos"
                  >
                    <FontAwesomeIcon icon={faCamera} /> Upload
                  </label>
                  {(build.bkcDetails.cpuPinPhotoFiles || []).map((photoObj, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#333' }}>
                      <FontAwesomeIcon icon={faImage} />
                      <span style={{ wordBreak: 'break-all' }}>{photoObj.name}</span>
                      <button
                        type="button"
                        title="Remove photo"
                        onClick={() => {
                          const updated = (build.bkcDetails.cpuPinPhotoFiles || []).filter((_, i) => i !== idx);
                          handleBkcFieldChange(buildIndex, 'cpuPinPhotoFiles', updated);
                        }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c62828', padding: 0, fontSize: '12px' }}
                      >
                        <FontAwesomeIcon icon={faTimes} />
                      </button>
                    </div>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BkcDetailsTable;