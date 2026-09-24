import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faBarcode } from '@fortawesome/free-solid-svg-icons';

const CPU_POWER_OPTIONS  = ['450W', '600W', '650W'];
const HEATSINK_OPTIONS   = ['AVC', 'CM'];

const getBuildReference = (build) => {
  const g = build.gpuInfo || {};
  if (g.projectName && g.gpuSN) return `${g.projectName} - ${g.gpuSN.slice(-4)}`;
  return '';
};

const GPUSiliconTable = ({ builds, handleInputChange, removeBuild }) => {
  return (
    <div className="builds-table-container">
      <table className="builds-table">
        <thead>
          <tr>
            <th className="row-actions">Actions</th>
            <th className="build-reference">Build Reference</th>
            <th>CPU S/N</th>
            <th>Silicon Rev</th>
            <th>CPU Power Rating</th>
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
                <td className="build-reference">{getBuildReference(build)}</td>
                <td>
                  <div className="scanner-input">
                    <input
                      type="text"
                      className="scanner-field"
                      value={gpu.cpuSN || ''}
                      placeholder="Scan CPU S/N"
                      onChange={e => onChange('cpuSN', e.target.value)}
                      autoComplete="off"
                      spellCheck="false"
                    />
                    <FontAwesomeIcon icon={faBarcode} className="scanner-icon" />
                  </div>
                </td>
                <td>
                  <div className="scanner-input">
                    <input
                      type="text"
                      className="scanner-field"
                      value={gpu.siliconRev || ''}
                      placeholder="Enter Silicon Rev"
                      onChange={e => onChange('siliconRev', e.target.value)}
                      autoComplete="off"
                      spellCheck="false"
                    />
                  </div>
                </td>
                <td>
                  <select
                    className="scanner-field"
                    value={gpu.cpuPowerRating || ''}
                    onChange={e => onChange('cpuPowerRating', e.target.value)}
                  >
                    <option value="">Select</option>
                    {CPU_POWER_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
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

export default GPUSiliconTable;
