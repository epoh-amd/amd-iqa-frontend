import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faDownload, faSave, faTools, faClock, faTimes, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

const getBuildReference = (build) => {
  const g = build.gpuInfo || {};
  if (g.projectName && g.gpuSN) return `${g.projectName} - ${g.gpuSN.slice(-4)}`;
  return '';
};

const getGpuFpyStatus = (gpu) => {
  const testFields = [
    { field: 'visualInspection', failVal: 'Fail' },
    { field: 'bootToOS',         failVal: 'No'   },
    { field: 'gpuDetected',      failVal: 'No'   },
    { field: 'fAuditEnablement', failVal: 'No'   },
    { field: 'agfhcLvl3',        failVal: 'Fail' },
    { field: 'roccRushTest',     failVal: 'Fail' },
    { field: 'hbmTest',          failVal: 'Fail' },
    { field: 'transferBench',    failVal: 'Fail' },
  ];
  const anyFilled = testFields.some(({ field }) => gpu[field]);
  if (!anyFilled) return '';
  const anyFail = testFields.some(({ field, failVal }) => gpu[field] === failVal);
  return anyFail ? 'Fail' : 'Pass';
};

const GPUFirmwareTable = ({
  builds, handleInputChange, removeBuild, onExtractLog,
  onSaveGPU, onContinueLaterGPU, onSaveAndReworkGPU, gpuSaving = false,
  showSaveActions = true, alwaysShowAllActions = false,
}) => {

  return (
    <div className="builds-table-container">
      <table className="builds-table">
        <thead>
          <tr>
            <th className="row-actions">Actions</th>
            <th className="build-reference">Build Reference</th>
            <th>Extract</th>
            <th>IFWI Version</th>
            <th>RM Version</th>
            {showSaveActions && <th>Save Actions</th>}
          </tr>
        </thead>
        <tbody>
          {builds.map((build, buildIndex) => {
            const gpu = build.gpuInfo || {};
            const onChange = (field, value) =>
              handleInputChange(buildIndex, 'gpuInfo', field, value);
            const fpy = getGpuFpyStatus(gpu);
            return (
              <tr key={build.id} className={`build-row ${build.status}`}>
                <td className="row-actions">
                  <button
                    className="btn-icon"
                    onClick={() => removeBuild(buildIndex)}
                    disabled={builds.length === 1}
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </td>
                <td className="build-reference">{getBuildReference(build, buildIndex)}</td>
                <td>
                  <button
                    className="btn-secondary"
                    style={{ padding: '4px 10px', fontSize: '12px', whiteSpace: 'nowrap' }}
                    onClick={() => onExtractLog && onExtractLog(buildIndex)}
                    title="Extract firmware versions"
                  >
                    <FontAwesomeIcon icon={faDownload} style={{ marginRight: '4px' }} />
                    Extract
                  </button>
                </td>
                <td>
                  <div className="scanner-input">
                    <input
                      type="text"
                      className="scanner-field"
                      value={gpu.ifwiVersion || ''}
                      placeholder="Enter IFWI Version"
                      onChange={e => onChange('ifwiVersion', e.target.value)}
                      autoComplete="off"
                      spellCheck="false"
                    />
                  </div>
                </td>
                <td>
                  <div className="scanner-input">
                    <input
                      type="text"
                      className="scanner-field"
                      value={gpu.rmVersion || ''}
                      placeholder="Enter RM Version"
                      onChange={e => onChange('rmVersion', e.target.value)}
                      autoComplete="off"
                      spellCheck="false"
                    />
                  </div>
                </td>
                {showSaveActions && (
                  <td className="save-actions-cell">
                    {alwaysShowAllActions ? (
                      <div className="fail-actions">
                        <button
                          className="btn-save-rework"
                          onClick={() => onSaveAndReworkGPU && onSaveAndReworkGPU(buildIndex)}
                          disabled={gpuSaving}
                          title="Save & Rework"
                        >
                          <FontAwesomeIcon icon={faTools} /> Save & Rework
                        </button>
                        <button
                          className="btn-primary"
                          style={{ backgroundColor: '#2e7d32', borderColor: '#2e7d32' }}
                          onClick={() => onContinueLaterGPU && onContinueLaterGPU()}
                          disabled={gpuSaving}
                          title="Update Build"
                        >
                          <FontAwesomeIcon icon={faSave} /> Update Build
                        </button>
                      </div>
                    ) : fpy === 'Pass' ? (
                      <button
                        className="btn-save-build"
                        onClick={() => onSaveGPU && onSaveGPU()}
                        disabled={gpuSaving}
                        title="Save as complete build"
                      >
                        <FontAwesomeIcon icon={faSave} /> Save the Build
                      </button>
                    ) : fpy === 'Fail' ? (
                      <div className="fail-actions">
                        <button
                          className="btn-save-rework"
                          onClick={() => onSaveAndReworkGPU && onSaveAndReworkGPU(buildIndex)}
                          disabled={gpuSaving}
                          title="Save & Rework"
                        >
                          <FontAwesomeIcon icon={faTools} /> Save & Rework
                        </button>
                        <button
                          className="btn-primary"
                          style={{ backgroundColor: '#2e7d32', borderColor: '#2e7d32' }}
                          onClick={() => onContinueLaterGPU && onContinueLaterGPU()}
                          disabled={gpuSaving}
                          title="Update Build"
                        >
                          <FontAwesomeIcon icon={faClock} /> Update Build
                        </button>
                      </div>
                    ) : (
                      <span className="calculate-fpy-message">
                        <FontAwesomeIcon icon={faExclamationTriangle} />
                        Complete testing first
                      </span>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default GPUFirmwareTable;
