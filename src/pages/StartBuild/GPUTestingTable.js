import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faFileAlt, faCamera } from '@fortawesome/free-solid-svg-icons';

const PASS_FAIL = ['Pass', 'Fail'];
const YES_NO    = ['Yes', 'No'];

// Fields that trigger photo upload on failure/no
const TRIGGER_FIELDS = {
  visualInspection: 'Fail',
  bootToOS:         'No',
  gpuDetected:      'No',
  fAuditEnablement: 'No',
  agfhcLvl3:        'Fail',
  roccRushTest:     'Fail',
  hbmTest:          'Fail',
  transferBench:    'Fail',
};

const PhotoUpload = ({ buildIndex, field, photos = [], onAdd, onRemove }) => {
  const inputId = `gpu-photo-${buildIndex}-${field}`;
  return (
    <div className="photo-upload" style={{ marginTop: '6px' }}>
      <input
        type="file"
        accept="image/*"
        multiple
        id={inputId}
        style={{ display: 'none' }}
        onChange={e => { onAdd(e.target.files); e.target.value = ''; }}
      />
      <label htmlFor={inputId} className="upload-btn-small">
        <FontAwesomeIcon icon={faCamera} /> Photo (optional)
      </label>
      {photos.length > 0 && (
        <div className="uploaded-files">
          {photos.map((photo, idx) => (
            <div key={idx} className="uploaded-file">
              <span className="file-name">{photo.name}</span>
              <button type="button" className="remove-photo-btn" onClick={() => onRemove(idx)}>
                <FontAwesomeIcon icon={faTrash} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const GPUTestingTable = ({ builds, handleInputChange, removeBuild, onExtractLog }) => {
  const getBuildReference = () => '';

  const onPhotoAdd = (buildIndex, field, files) => {
    const newPhotos = Array.from(files).map(f => ({ name: f.name, file: f }));
    handleInputChange(buildIndex, 'gpuInfo', `${field}Photos`,
      [...((builds[buildIndex].gpuInfo?.[`${field}Photos`]) || []), ...newPhotos]
    );
  };

  const onPhotoRemove = (buildIndex, field, photoIdx) => {
    const updated = [...((builds[buildIndex].gpuInfo?.[`${field}Photos`]) || [])];
    updated.splice(photoIdx, 1);
    handleInputChange(buildIndex, 'gpuInfo', `${field}Photos`, updated);
  };

  return (
    <div className="builds-table-container">
      <table className="builds-table">
        <thead>
          <tr>
            <th className="row-actions">Actions</th>
            <th className="build-reference">Build Reference</th>
            <th>Visual Inspection</th>
            <th>Boot to OS</th>
            <th>GPU Detected</th>
            <th>F-audit Enablement</th>
            <th>F-audit Value</th>
            <th>AGFHC lvl3</th>
            <th>Roccrush Test</th>
            <th>HBM Test</th>
            <th>TransferBench</th>
            <th>Extract Log</th>
          </tr>
        </thead>
        <tbody>
          {builds.map((build, buildIndex) => {
            const gpu = build.gpuInfo || {};
            const onChange = (field, value) =>
              handleInputChange(buildIndex, 'gpuInfo', field, value);

            // Inline renderer — NOT a component (avoids remount-on-render that loses focus)
            const renderTestField = (field, options) => {
              const triggerVal = TRIGGER_FIELDS[field];
              const showExtras = triggerVal && gpu[field] === triggerVal;
              const notesField = `${field}Notes`;
              return (
                <div className="test-field">
                  <select
                    className="scanner-field"
                    value={gpu[field] || ''}
                    onChange={e => onChange(field, e.target.value)}
                  >
                    <option value="">Select</option>
                    {options.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                  {showExtras && (
                    <div className="test-fail-inputs">
                      <textarea
                        value={gpu[notesField] || ''}
                        onChange={e => onChange(notesField, e.target.value)}
                        placeholder="Notes (optional)"
                      />
                      <PhotoUpload
                        buildIndex={buildIndex}
                        field={field}
                        photos={gpu[`${field}Photos`] || []}
                        onAdd={files => onPhotoAdd(buildIndex, field, files)}
                        onRemove={idx => onPhotoRemove(buildIndex, field, idx)}
                      />
                    </div>
                  )}
                </div>
              );
            };

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
                <td>{renderTestField('visualInspection', PASS_FAIL)}</td>
                <td>{renderTestField('bootToOS', YES_NO)}</td>
                <td>{renderTestField('gpuDetected', YES_NO)}</td>
                <td>{renderTestField('fAuditEnablement', YES_NO)}</td>
                <td>
                  <div className="scanner-input">
                    <input
                      type="text"
                      className="scanner-field"
                      value={gpu.fAuditValue || ''}
                      placeholder="e.g. 0xf/0x11"
                      onChange={e => onChange('fAuditValue', e.target.value)}
                      autoComplete="off"
                      spellCheck="false"
                    />
                  </div>
                </td>
                <td>{renderTestField('agfhcLvl3', PASS_FAIL)}</td>
                <td>{renderTestField('roccRushTest', PASS_FAIL)}</td>
                <td>{renderTestField('hbmTest', PASS_FAIL)}</td>
                <td>{renderTestField('transferBench', PASS_FAIL)}</td>
                <td>
                  <button
                    className="btn-secondary"
                    style={{ padding: '4px 10px', fontSize: '12px', whiteSpace: 'nowrap' }}
                    onClick={() => onExtractLog && onExtractLog(buildIndex)}
                    title="Extract Log"
                  >
                    <FontAwesomeIcon icon={faFileAlt} style={{ marginRight: '4px' }} />
                    Extract Log
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default GPUTestingTable;
