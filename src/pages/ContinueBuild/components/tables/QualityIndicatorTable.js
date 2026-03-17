// frontend/src/pages/StartBuild/GeneralInfoTable.js
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faLock } from '@fortawesome/free-solid-svg-icons';

const GeneralInfoTable = ({ builds, handleInputChange, removeBuild, isReadOnly = false }) => {
  
  // Helper function to get build reference
  const getBuildReference = (build, buildIndex) => {
    return build.systemInfo?.bmcName || `Build ${buildIndex + 1}`;
  };

  // Render field based on read-only status
  const renderField = (value, fieldType = 'text', options = []) => {
    if (isReadOnly) {
      // For read-only mode, just display the value
      return (
        <div className="read-only-field">
          <FontAwesomeIcon icon={faLock} className="lock-icon" style={{ marginRight: '8px', color: '#6c757d' }} />
          <span className="field-value">{value || '-'}</span>
        </div>
      );
    }

    // For editable mode, render appropriate input
    if (fieldType === 'select') {
      return (
        <select value={value || ''} disabled>
          <option value="">{value || 'Select...'}</option>
          {options.map(option => (
            <option key={option.value || option} value={option.value || option}>
              {option.label || option}
            </option>
          ))}
        </select>
      );
    }

    return (
      <input 
        type="text" 
        value={value || ''} 
        disabled
        style={{ backgroundColor: '#f8f9fa', color: '#6c757d' }}
      />
    );
  };

  return (
    <div className="builds-table-container">
      <table className="builds-table">
        <thead>
          <tr>
            <th className="row-actions">Actions</th>
            <th className="build-reference">Build Reference</th>
            <th>Location</th>
            <th>Build Engineer</th>
            <th>Configuration</th>
          </tr>
        </thead>
        <tbody>
          {builds.map((build, buildIndex) => (
            <tr key={build.id} className={`build-row ${build.status}`}>
              <td className="row-actions">
                <button 
                  className="btn-icon"
                  disabled={true}
                  style={{ opacity: 0.5, cursor: 'not-allowed' }}
                >  
                  <FontAwesomeIcon icon={faTrash} />  
                </button>  
              </td>
              <td className="build-reference">{getBuildReference(build, buildIndex)}</td>
              <td>
                {renderField(
                  build.generalInfo.location,
                  'select',
                  [
                    { value: 'Penang', label: 'Penang' },
                    { value: 'Austin', label: 'Austin' }
                  ]
                )}
              </td>
              <td>
                {renderField(
                  build.systemInfo?.buildEngineer,
                  'select',
                  [] // Engineers would be populated here in normal mode
                )}
              </td>
              <td>
                {renderField(
                  build.generalInfo.isCustomConfig === 'Yes' ? 'Custom Configuration' : 'Standard Configuration',
                  'select',
                  [
                    { value: 'Standard Configuration', label: 'Standard Configuration' },
                    { value: 'Custom Configuration', label: 'Custom Configuration' }
                  ]
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default GeneralInfoTable;