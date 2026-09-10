import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faDownload } from '@fortawesome/free-solid-svg-icons';

const GPUFirmwareTable = ({ builds, handleInputChange, removeBuild, onExtractLog }) => {
  const getBuildReference = () => '';

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
          </tr>
        </thead>
        <tbody>
          {builds.map((build, buildIndex) => {
            const gpu = build.gpuInfo || {};
            const onChange = (field, value) =>
              handleInputChange(buildIndex, 'gpuInfo', field, value);
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
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default GPUFirmwareTable;
