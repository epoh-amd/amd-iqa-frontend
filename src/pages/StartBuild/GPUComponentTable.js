import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';

const HEATSINK_OPTIONS = ['AVC', 'CM'];

const GPUComponentTable = ({ builds, handleInputChange, removeBuild }) => {
  const getBuildReference = () => '';

  return (
    <div className="builds-table-container">
      <table className="builds-table">
        <thead>
          <tr>
            <th className="row-actions">Actions</th>
            <th className="build-reference">Build Reference</th>
            <th>Heatsink P/N</th>
            <th>Heatsink S/N</th>
            <th>Heatsink Manufacturer</th>
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
                  <div className="scanner-input">
                    <input
                      type="text"
                      className="scanner-field"
                      value={gpu.heatsinkPN || ''}
                      placeholder="Enter Heatsink P/N"
                      onChange={e => onChange('heatsinkPN', e.target.value)}
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
                      value={gpu.heatsinkSN || ''}
                      placeholder="Enter Heatsink S/N"
                      onChange={e => onChange('heatsinkSN', e.target.value)}
                      autoComplete="off"
                      spellCheck="false"
                    />
                  </div>
                </td>
                <td>
                  <select
                    className="scanner-field"
                    value={gpu.heatsinkManufacturer || ''}
                    onChange={e => onChange('heatsinkManufacturer', e.target.value)}
                  >
                    <option value="">Select</option>
                    {HEATSINK_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default GPUComponentTable;
