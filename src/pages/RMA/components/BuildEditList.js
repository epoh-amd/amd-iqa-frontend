// frontend/src/pages/EditBuildData/components/BuildEditList.js

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faSpinner } from '@fortawesome/free-solid-svg-icons';

const BuildEditList = ({ builds, selectedBuild, onBuildSelect, onEdit, loading }) => {

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Get status badge class
  const getStatusClass = (status) => {
    switch (status) {
      case 'Complete':
        return 'status-complete';
      case 'In Progress':
        return 'status-in-progress';
      case 'Fail':
        return 'status-fail';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="build-edit-section">
        <div className="loading-container">
          <FontAwesomeIcon icon={faSpinner} spin size="3x" />
          <p>Loading builds...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="build-edit-section">
      <div className="selection-header">
        <div className="selection-info">
          <span>Total Builds Found: <strong>{builds.length}</strong></span>
          {selectedBuild && (
            <span> | Selected: <strong>{selectedBuild}</strong></span>
          )}
        </div>
        <button
          className="edit-btn"
          onClick={onEdit}
          disabled={!selectedBuild}
        >
          <FontAwesomeIcon icon={faEdit} /> Edit RMA
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
              <th>Status</th>
              <th>FPY Status</th>
              <th>Last Updated</th>
            </tr>
          </thead>
          <tbody>
            {builds.length === 0 ? (
              <tr>
                <td colSpan="11" className="no-data">
                  No builds found
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
                    <span className={`status-badge ${getStatusClass(build.status)}`}>
                      {build.status || 'In Progress'}
                    </span>
                  </td>
                  <td>
                    <span className={`fpy-badge ${build.fpy_status === 'Pass' ? 'fpy-pass' : 'fpy-fail'}`}>
                      {build.fpy_status || '-'}
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

export default BuildEditList;
