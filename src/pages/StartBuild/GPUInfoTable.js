import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faBarcode } from '@fortawesome/free-solid-svg-icons';

const SCANNER_FIELDS = new Set(['gpuPN', 'gpuSN', 'asicPN', 'cpuSN']);

const PROJECT_OPTIONS   = ['MI350P', 'MI410P'];
const CPU_POWER_OPTIONS = ['450W', '600W', '650W'];
const HEATSINK_OPTIONS = ['AVC', 'CM'];

const GPUInfoTable = ({ builds, handleInputChange, removeBuild, isEditMode = false }) => {
  const getBuildReference = () => '';

  return (
    <div className="builds-table-container">
      <table className="builds-table">
        <thead>
          <tr>
            <th className="row-actions">Actions</th>
            <th className="build-reference">Build Reference</th>
            <th>Project Name</th>
            <th>PO</th>
            <th>GPU P/N</th>
            <th>GPU S/N</th>
            <th>Board S/N</th>
            <th>Board Manufacturer</th>
            <th>ASIC P/N</th>
            <th>CPU S/N</th>
            <th>Silicon Rev</th>
            <th>Board Rev</th>
            <th>GPU Rev</th>
            <th>Model Name</th>
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
                <td className="build-reference">{getBuildReference(build, buildIndex)}</td>
                <td>
                  <select
                    className="scanner-field"
                    value={gpu.projectName || ''}
                    onChange={e => onChange('projectName', e.target.value)}
                  >
                    <option value="">Select Project</option>
                    {PROJECT_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </td>
                {[
                  { field: 'po',           placeholder: 'Enter PO' },
                  { field: 'gpuPN',             placeholder: 'Scan GPU P/N' },
                  { field: 'gpuSN',             placeholder: 'Scan GPU S/N' },
                  { field: 'boardSN',           placeholder: 'Enter Board S/N' },
                  { field: 'boardManufacturer', placeholder: 'Enter Board Manufacturer' },
                  { field: 'asicPN',            placeholder: 'Scan ASIC P/N' },
                  { field: 'cpuSN',        placeholder: 'Scan CPU S/N' },
                  { field: 'siliconRev',   placeholder: 'Enter Silicon Rev' },
                  { field: 'boardRev',     placeholder: 'Enter Board Rev' },
                  { field: 'gpuRev',       placeholder: 'Enter GPU Rev' },
                  { field: 'modelName',    placeholder: 'Enter Model Name' },
                ].map(({ field, placeholder }) => (
                  <td key={field}>
                    <div className="scanner-input">
                      <input
                        type="text"
                        className="scanner-field"
                        value={gpu[field] || ''}
                        placeholder={placeholder}
                        onChange={e => onChange(field, e.target.value)}
                        autoComplete="off"
                        inputMode="text"
                        spellCheck="false"
                      />
                      {SCANNER_FIELDS.has(field) && (
                        <FontAwesomeIcon icon={faBarcode} className="scanner-icon" />
                      )}
                    </div>
                  </td>
                ))}
                <td>
                  <select className="scanner-field" value={gpu.cpuPowerRating || ''} onChange={e => onChange('cpuPowerRating', e.target.value)}>
                    <option value="">Select</option>
                    {CPU_POWER_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </td>
                <td>
                  <select className="scanner-field" value={gpu.heatsinkManufacturer || ''} onChange={e => onChange('heatsinkManufacturer', e.target.value)}>
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

export default GPUInfoTable;
