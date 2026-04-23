// frontend/src/pages/ContinueBuild/components/GeneralInfoTable.js
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock } from '@fortawesome/free-solid-svg-icons';

const GeneralInfoTable = ({ builds }) => {
  
  // Helper function to get build reference
  const getBuildReference = (build, buildIndex) => {
    return build.systemInfo?.bmcName || build.systemInfo?.chassisSN || `Build ${buildIndex + 1}`;
  };

  // Render read-only field with lock icon
  const renderReadOnlyField = (value) => {
    return (
      <div className="read-only-field" style={{
        display: 'flex',
        alignItems: 'center',
        padding: '8px 12px',
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '4px',
        color: '#495057'
      }}>
        <FontAwesomeIcon 
          icon={faLock} 
          style={{ 
            marginRight: '8px', 
            color: '#6c757d',
            fontSize: '14px'
          }} 
        />
        <span className="field-value">{value || '-'}</span>
      </div>
    );
  };

  return (
    <div className="builds-table-container">
      <table className="builds-table">
        <thead>
          <tr>
            <th className="build-reference">Build Reference</th>
            <th>Location</th>
            <th>Build Engineer</th>
            <th>Configuration</th>
          </tr>
        </thead>
        <tbody>
          {builds.map((build, buildIndex) => (
            <tr key={build.id || buildIndex} className={`build-row ${build.status || ''}`}>
              <td className="build-reference">
                <strong>{getBuildReference(build, buildIndex)}</strong>
              </td>
              <td>
                {renderReadOnlyField(build.generalInfo?.location)}
              </td>
              <td>
                {renderReadOnlyField(build.systemInfo?.buildEngineer)}
              </td>
              <td>
                {renderReadOnlyField(
                  build.generalInfo?.isCustomConfig === 'Yes' ? 
                    'Custom Configuration' : 
                    'Standard Configuration'
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