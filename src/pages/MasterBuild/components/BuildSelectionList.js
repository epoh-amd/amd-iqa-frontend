// frontend/src/pages/MasterBuild/components/BuildSelectionList.js

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faTable } from '@fortawesome/free-solid-svg-icons';

const BuildSelectionList = ({ 
  builds, 
  selectedBuilds, 
  onBuildSelect, 
  onSelectAll,
  onStartEntry,
  loading 
}) => {
  
  const isAllSelected = builds.length > 0 && 
    builds.every(build => selectedBuilds.includes(build.chassis_sn));

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  const getMasterStatusBadgeClass = (status) => {
    switch (status) {
      case 'Build Completed':
        return 'complete';
      case 'Incomplete':
        return 'in-progress';
      case 'Bad':
        return 'fail';
      case 'Delivered':
      case 'Ready for Delivery':
        return 'delivered';
      case 'Missing Information':
      case 'Need Paperwork':
      case 'Need CG Update':
      case 'Delivered - Need CG Update':
        return 'warning';
      default:
        return '';
    }
  };

  return (
    <div className="build-selection-section">
      <div className="selection-header">
        <div className="selection-info">
          <span>{builds.length} builds found</span>
          {selectedBuilds.length > 0 && (
            <span> • <strong>{selectedBuilds.length}</strong> selected</span>
          )}
        </div>
        <button 
          className="start-entry-btn"
          onClick={onStartEntry}
          disabled={selectedBuilds.length === 0}
        >
          <FontAwesomeIcon icon={faTable} />
          Start Entering Details
        </button>
      </div>

      {loading ? (
        <div className="loading-overlay">
          <FontAwesomeIcon icon={faSpinner} spin className="loading-spinner" />
        </div>
      ) : (
        <div className="build-list-wrapper">
          <table className="build-list-table">
            <thead>
              <tr>
                <th style={{ width: '50px' }}>
                  <input
                    type="checkbox"
                    className="select-checkbox"
                    checked={isAllSelected}
                    onChange={(e) => onSelectAll(e.target.checked)}
                  />
                </th>
                <th>BMC Name</th>
                <th>Build Name</th>
                <th>Build Engineer</th>
                <th>Platform Type</th>
                <th>Chassis Type</th>
                <th>SMS Order</th>
                <th>Jira Ticket No.</th>
                <th>Changegear Asset ID</th>
                <th>Status</th>
                <th>Build Date</th>
              </tr>
            </thead>
            <tbody>
              {builds.map((build) => (
                <tr
                  key={build.chassis_sn}
                  className={selectedBuilds.includes(build.chassis_sn) ? 'selected' : ''}
                  onClick={() => onBuildSelect(build.chassis_sn, !selectedBuilds.includes(build.chassis_sn))}
                  style={{ cursor: 'pointer' }}
                >
                  <td onClick={e => e.stopPropagation()} style={{ textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      className="select-checkbox"
                      checked={selectedBuilds.includes(build.chassis_sn)}
                      onChange={e => {
                        e.stopPropagation();
                        onBuildSelect(build.chassis_sn, !selectedBuilds.includes(build.chassis_sn));
                      }}
                      style={{ cursor: 'pointer' }}
                    />
                  </td>
                  <td className="monospace">{build.bmc_name || '-'}</td>
                  <td>{build.build_name || '-'}</td>
                  <td>{build.build_engineer || '-'}</td>
                  <td>{build.platform_type || '-'}</td>
                  <td>{build.chassis_type || '-'}</td>
                  <td>{build.sms_order || '-'}</td>
                  <td>{build.jira_ticket_no || '-'}</td>
                  <td>{build.changegear_asset_id || '-'}</td>
                  <td>
                    {build.master_status ? (
                      <span className={`status-badge ${getMasterStatusBadgeClass(build.master_status)}`}>
                        {build.master_status}
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>{formatDate(build.created_at)}</td>
                </tr>
              ))}
              {builds.length === 0 && (
                <tr>
                  <td colSpan="11" style={{ textAlign: 'center', padding: '30px', color: '#666' }}>
                    No builds found matching the filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default BuildSelectionList;