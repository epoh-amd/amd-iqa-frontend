// frontend/src/pages/ContinueBuild/components/BuildSelectionList.js

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faSpinner } from '@fortawesome/free-solid-svg-icons';

const BuildSelectionList = ({ builds, selectedBuild, onBuildSelect, onContinue, loading }) => {
  
  // Helper to get last completed step
  const getLastCompletedStep = (build) => {
    const steps = [
      { key: 'qualityDetails', label: 'Quality Indicator' },
      { key: 'bkcDetails', label: 'BKC Details' },
      { key: 'testing', label: 'Testing' },
      { key: 'componentInfo', label: 'Component Information' },
      { key: 'cpuInfo', label: 'CPU Information' },
      { key: 'chassisInfo', label: 'Chassis Information' },
      { key: 'generalInfo', label: 'General Information' }
    ];

    // Check from the end to find last completed step
    for (const step of steps) {
      if (build.stepCompleted && build.stepCompleted[step.key]) {
        return step.label;
      }
    }
    
    return 'Not Started';
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="build-selection-section">
        <div className="loading-container">
          <FontAwesomeIcon icon={faSpinner} spin size="3x" />
          <p>Loading in-progress builds...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="build-selection-section">
      <div className="selection-header">
        <div className="selection-info">
          <span>Total In-Progress Builds: <strong>{builds.length}</strong></span>
          {selectedBuild && (
            <span> | Selected: <strong>{selectedBuild}</strong></span>
          )}
        </div>
        <button 
          className="continue-btn"
          onClick={onContinue}
          disabled={!selectedBuild}
        >
          <FontAwesomeIcon icon={faPlay} /> Continue Build
        </button>
      </div>

      <div className="build-list-wrapper">
        <table className="build-list-table">
          <thead>
            <tr>
              <th>Select</th>
              <th>BMC Name</th>
              <th>Chassis S/N</th>
              <th>Project Name</th>
              <th>System P/N</th>
              <th>Platform Type</th>
              <th>Location</th>
              <th>Build Engineer</th>
              <th>Last Step Completed</th>
              <th>Last Updated</th>
            </tr>
          </thead>
          <tbody>
            {builds.length === 0 ? (
              <tr>
                <td colSpan="10" className="no-data">
                  No in-progress builds found
                </td>
              </tr>
            ) : (
              builds.map((build) => (
                <tr 
                  key={build.chassis_sn}
                  className={selectedBuild === build.chassis_sn ? 'selected' : ''}
                  onClick={() => onBuildSelect(build.chassis_sn)}
                >
                  <td>
                    <input
                      type="radio"
                      checked={selectedBuild === build.chassis_sn}
                      onChange={() => onBuildSelect(build.chassis_sn)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                  <td>{build.bmc_name || '-'}</td>
                  <td>{build.chassis_sn}</td>
                  <td>{build.project_name || '-'}</td>
                  <td>{build.system_pn || '-'}</td>
                  <td>{build.platform_type || '-'}</td>
                  <td>{build.location || '-'}</td>
                  <td>{build.build_engineer || '-'}</td>
                  <td>
                    <span className="last-step-badge">
                      {getLastCompletedStep(build)}
                    </span>
                  </td>
                  <td>{formatDate(build.updated_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BuildSelectionList;