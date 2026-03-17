// frontend/src/pages/StartBuild/GeneralInfoTable.js

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';

const GeneralInfoTable = ({ builds, handleInputChange, removeBuild }) => {
  
  const getBuildReference = (build, buildIndex) => {
    return build.systemInfo?.bmcName || `Build ${buildIndex + 1}`;
  };

  // Map database location codes to display names
  const getLocationDisplay = (locationCode) => {
    switch(locationCode) {
      case 'MY.PNG': return 'Penang';
      case 'US.ATX': return 'Austin';
      default: return locationCode || 'Not Set';
    }
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
                  onClick={() => removeBuild(buildIndex)}
                  disabled={builds.length === 1}  
                >  
                  <FontAwesomeIcon icon={faTrash} />  
                </button>  
              </td>
              <td className="build-reference">{getBuildReference(build, buildIndex)}</td>
              <td>
                <div className="read-only-field">
                  {getLocationDisplay(build.generalInfo.location)}
                </div>
              </td>
              <td>
                <div className="read-only-field">
                  {build.generalInfo.buildEngineer || 'Not Set'}
                </div>
              </td>
              <td>
                <select
                  value={build.generalInfo.isCustomConfig}
                  onChange={(e) => handleInputChange(buildIndex, 'generalInfo', 'isCustomConfig', e.target.value)}
                  className={build.errors.isCustomConfig ? 'error' : ''}
                >
                  <option value="">Select Configuration</option>
                  <option value="No">Standard Configuration</option>
                  <option value="Yes">Custom Configuration</option>
                </select>
                {build.errors.isCustomConfig && (
                  <div className="field-error">{build.errors.isCustomConfig}</div>
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