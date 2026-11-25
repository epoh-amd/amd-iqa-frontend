import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faBarcode } from '@fortawesome/free-solid-svg-icons';

const SCANNER_FIELDS = new Set(['gpuPN', 'gpuSN', 'asicPN', 'boardSN']);

const PROJECT_OPTIONS = ['MI350P', 'MI410P', 'MI430x'];

const getBuildReference = (build) => {
  const g = build.gpuInfo || {};
  if (g.projectName && g.gpuSN) return `${g.projectName} - ${g.gpuSN.slice(-4)}`;
  return '';
};

const GPUInfoTable = ({ builds, handleInputChange, removeBuild, isEditMode = false }) => {

  return (
    <div className="builds-table-container">
      <table className="builds-table">
        <thead>
          <tr>
            <th className="row-actions">Actions</th>
            <th>Server Reference</th>
            <th>Project Name</th>
            {builds.some(b => (b.gpuInfo?.projectName) === 'MI430x') && <th>EAM P/N</th>}
            {builds.some(b => (b.gpuInfo?.projectName) === 'MI430x') && <th>EAM S/N</th>}
            {builds.some(b => (b.gpuInfo?.projectName) === 'MI430x') && <th>PCBA S/N</th>}
            {builds.some(b => b.gpuInfo?.projectName !== 'MI430x') && <th>PO</th>}
            {builds.some(b => b.gpuInfo?.projectName !== 'MI430x') && <th>GPU P/N</th>}
            {builds.some(b => b.gpuInfo?.projectName !== 'MI430x') && <th>GPU S/N</th>}
            {builds.some(b => b.gpuInfo?.projectName !== 'MI430x') && <th>Board S/N</th>}
            {builds.some(b => b.gpuInfo?.projectName !== 'MI430x') && <th>Board Manufacturer</th>}
            {builds.some(b => b.gpuInfo?.projectName !== 'MI430x') && <th>ASIC P/N</th>}
            {builds.some(b => b.gpuInfo?.projectName !== 'MI430x') && <th>Board Rev</th>}
            {builds.some(b => b.gpuInfo?.projectName !== 'MI430x') && <th>GPU Rev</th>}
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
                <td>
                  <div className="scanner-input">
                    <input
                      type="text"
                      className="scanner-field"
                      value={gpu.hostname || ''}
                      placeholder="Enter Server Reference"
                      onChange={e => onChange('hostname', e.target.value)}
                      autoComplete="off"
                      spellCheck="false"
                    />
                  </div>
                </td>
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
                {gpu.projectName === 'MI430x' && (
                  <td>
                    <div className="scanner-input">
                      <input
                        type="text"
                        className="scanner-field"
                        value={gpu.eamPN || ''}
                        placeholder="Enter EAM P/N"
                        onChange={e => onChange('eamPN', e.target.value)}
                        autoComplete="off"
                        spellCheck="false"
                      />
                    </div>
                  </td>
                )}
                {gpu.projectName === 'MI430x' && (
                  <td>
                    <div className="scanner-input">
                      <input
                        type="text"
                        className={`scanner-field ${build.errors?.eamSN ? 'error' : ''}`}
                        value={gpu.eamSN || ''}
                        placeholder="Enter EAM S/N"
                        onChange={e => onChange('eamSN', e.target.value)}
                        autoComplete="off"
                        spellCheck="false"
                      />
                    </div>
                    {build.errors?.eamSN && <div className="field-error">{build.errors.eamSN}</div>}
                  </td>
                )}
                {gpu.projectName === 'MI430x' && (
                  <td>
                    <div className="scanner-input">
                      <input
                        type="text"
                        className={`scanner-field ${build.errors?.pcbaSN ? 'error' : ''}`}
                        value={gpu.pcbaSN || ''}
                        placeholder="Enter PCBA S/N"
                        onChange={e => onChange('pcbaSN', e.target.value)}
                        autoComplete="off"
                        spellCheck="false"
                      />
                    </div>
                    {build.errors?.pcbaSN && <div className="field-error">{build.errors.pcbaSN}</div>}
                  </td>
                )}
                {[
                  { field: 'po',                placeholder: 'Enter PO',                   hideForMI430x: true },
                  { field: 'gpuPN',             placeholder: 'Scan GPU P/N',               hideForMI430x: true },
                  { field: 'gpuSN',             placeholder: 'Scan GPU S/N',               hideForMI430x: true },
                  { field: 'boardSN',           placeholder: 'Enter Board S/N',            hideForMI430x: true },
                  { field: 'boardManufacturer', placeholder: 'Enter Board Manufacturer',   hideForMI430x: true },
                  { field: 'asicPN',            placeholder: 'Scan ASIC P/N',              hideForMI430x: true },
                  { field: 'boardRev',          placeholder: 'Enter Board Rev',            hideForMI430x: true },
                  { field: 'gpuRev',            placeholder: 'Enter GPU Rev',              hideForMI430x: true },
                ].filter(({ hideForMI430x }) => !(hideForMI430x && gpu.projectName === 'MI430x'))
                 .map(({ field, placeholder }) => (
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
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default GPUInfoTable;
