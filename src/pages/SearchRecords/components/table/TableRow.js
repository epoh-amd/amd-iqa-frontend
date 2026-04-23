// frontend/src/pages/SearchRecords/components/table/TableRow.js

import React from 'react';

const TableRow = ({
  build,
  collapsedSections,
  hasCollapsedSections,
  getCpuQty,
  showCpuDetails,
  showDimmDetails,
  loadTestDetails,
  loadFailureDetails,
  loadReworkHistory,
  getStatusBadgeClass
}) => {
  return (
    <tr>
      {/* Reference - Always visible */}
      <td className={`bmc-name-cell col-bmc-name ${hasCollapsedSections ? 'with-collapsed' : ''}`}>
        {build.bmc_name || build.chassis_sn}
      </td>
      <td className={`read-only-cell col-created-date ${hasCollapsedSections ? 'with-collapsed' : ''}`}>
        {build.created_at ? new Date(build.created_at).toLocaleDateString() : '-'}
      </td>
      
      {/* General Information */}
      {!collapsedSections.general && (
        <>
          <td className="read-only-cell col-standard">{build.location || '-'}</td>
          <td className="read-only-cell col-standard">{build.is_custom_config ? 'Custom' : 'Standard'}</td>
        </>
      )}
      {collapsedSections.general && (
        <td className="collapsed-cell col-collapsed"></td>
      )}
      
      {/* System Information */}
      {!collapsedSections.systemInfo && (
        <>
          <td className="read-only-cell col-standard">{build.project_name || '-'}</td>
          <td className="read-only-cell col-standard">{build.system_pn || '-'}</td>
          <td className="read-only-cell col-standard">{build.platform_type || '-'}</td>
          <td className="read-only-cell col-standard">{build.manufacturer || '-'}</td>
          <td className="read-only-cell col-standard">{build.chassis_sn}</td>
          <td className="read-only-cell col-standard">{build.chassis_type || '-'}</td>
          <td className="read-only-cell col-standard">{build.po || '-'}</td>
          <td className="read-only-cell col-standard">{build.bmc_mac || '-'}</td>
          <td className="read-only-cell col-standard">{build.mb_sn || '-'}</td>
          <td className="read-only-cell col-standard">{build.ethernet_mac || '-'}</td>
          <td className="read-only-cell col-standard">{build.cpu_socket || '-'}</td>
          <td className="read-only-cell col-standard column-group-separator">{build.cpu_vendor || '-'}</td>
        </>
      )}
      {collapsedSections.systemInfo && (
        <td className="collapsed-cell col-collapsed"></td>
      )}
      
      {/* CPU Information */}
      {!collapsedSections.cpuInfo && (
        <>
          <td className="read-only-cell col-standard">{build.cpu_program_name || '-'}</td>
          <td className="read-only-cell col-standard column-group-separator">
            {getCpuQty(build) > 0 ? (
              <span 
                className="qty-link"
                onClick={(e) => {
                  e.stopPropagation();
                  showCpuDetails(build);
                }}
              >
                {getCpuQty(build)}
              </span>
            ) : (
              '0'
            )}
          </td>
        </>
      )}
      {collapsedSections.cpuInfo && (
        <td className="collapsed-cell col-collapsed"></td>
      )}
      
      {/* Component Information */}
      {!collapsedSections.componentInfo && (
        <>
          <td className="read-only-cell col-standard">{build.m2_pn || '-'}</td>
          <td className="read-only-cell col-standard">{build.m2_sn || '-'}</td>
          <td className="read-only-cell col-standard">{build.dimm_pn || '-'}</td>
          <td className="read-only-cell col-standard column-group-separator">
            {build.dimm_qty > 0 ? (
              <span 
                className="qty-link"
                onClick={(e) => {
                  e.stopPropagation();
                  showDimmDetails(build);
                }}
              >
                {build.dimm_qty}
              </span>
            ) : (
              '0'
            )}
          </td>
        </>
      )}
      {collapsedSections.componentInfo && (
        <td className="collapsed-cell col-collapsed"></td>
      )}
      
      {/* Testing */}
      {!collapsedSections.testing && (
        <>
          <td className="read-only-cell col-standard">
            {build.visual_inspection_status === 'Fail' ? (
              <span 
                className="status-badge fail clickable"
                onClick={(e) => {
                  e.stopPropagation();
                  loadTestDetails(build.chassis_sn, 'visual_inspection', build.visual_inspection_notes);
                }}
              >
                Fail
              </span>
            ) : (
              <span className="status-badge complete">
                {build.visual_inspection_status || '-'}
              </span>
            )}
          </td>
          <td className="read-only-cell col-standard">
            {build.boot_status === 'No' ? (
              <span 
                className="status-badge fail clickable"
                onClick={(e) => {
                  e.stopPropagation();
                  loadTestDetails(build.chassis_sn, 'boot', build.boot_notes);
                }}
              >
                No
              </span>
            ) : (
              <span className="status-badge complete">
                {build.boot_status || '-'}
              </span>
            )}
          </td>
          <td className="read-only-cell col-standard">
            {build.dimms_detected_status === 'No' ? (
              <span 
                className="status-badge fail clickable"
                onClick={(e) => {
                  e.stopPropagation();
                  loadTestDetails(build.chassis_sn, 'dimms_detected', build.dimms_detected_notes);
                }}
              >
                No
              </span>
            ) : (
              <span className="status-badge complete">
                {build.dimms_detected_status || '-'}
              </span>
            )}
          </td>
          <td className="read-only-cell col-standard column-group-separator">
            {build.lom_working_status === 'No' ? (
              <span 
                className="status-badge fail clickable"
                onClick={(e) => {
                  e.stopPropagation();
                  loadTestDetails(build.chassis_sn, 'lom_working', build.lom_working_notes);
                }}
              >
                No
              </span>
            ) : (
              <span className="status-badge complete">
                {build.lom_working_status || '-'}
              </span>
            )}
          </td>
        </>
      )}
      {collapsedSections.testing && (
        <td className="collapsed-cell col-collapsed"></td>
      )}
      
      {/* BKC Details */}
      {!collapsedSections.bkcDetails && (
        <>
          <td className="read-only-cell col-standard">{build.bios_version || '-'}</td>
          <td className="read-only-cell col-standard">{build.scm_fpga_version || '-'}</td>
          <td className="read-only-cell col-standard">{build.hpm_fpga_version || '-'}</td>
          <td className="read-only-cell col-standard column-group-separator">{build.bmc_version || '-'}</td>
        </>
      )}
      {collapsedSections.bkcDetails && (
        <td className="collapsed-cell col-collapsed"></td>
      )}
      
      {/* Quality Indicator */}
      {!collapsedSections.qualityIndicator && (
        <>
          <td className="read-only-cell col-standard">
            <span className={`status-badge ${build.fpy_status === 'Pass' ? 'complete' : 'fail'}`}>
              {build.fpy_status || '-'}
            </span>
          </td>
          <td className="read-only-cell col-standard">
            <span className={`status-badge ${getStatusBadgeClass(build.status)}`}>
              {build.status || '-'}
            </span>
          </td>
          <td className="read-only-cell col-wide">{build.problem_description || '-'}</td>
          <td className="read-only-cell col-standard">
            {build.fpy_status === 'Fail' && (
              <span 
                className="link-text"
                onClick={(e) => {
                  e.stopPropagation();
                  loadFailureDetails(build.chassis_sn);
                }}
              >
                View Failures
              </span>
            )}
          </td>
          <td className="read-only-cell col-standard column-group-separator">
            {build.has_rework === 'Yes' ? (
              <span 
                className="link-text"
                onClick={(e) => {
                  e.stopPropagation();
                  loadReworkHistory(build.chassis_sn);
                }}
                title={`${build.rework_count || 0} rework(s) performed`}
              >
                Yes ({build.rework_count || 0})
              </span>
            ) : (
              'No'
            )}
          </td>
        </>
      )}
      {collapsedSections.qualityIndicator && (
        <td className="collapsed-cell col-collapsed"></td>
      )}
      
      {/* Master Build Fields - Read Only */}
      {/* Team & Location */}
      {!collapsedSections.teamLocation && (
        <>
          <td className="read-only-cell col-standard">{build.master_location || '-'}</td>
          <td className="read-only-cell col-standard">{build.custom_location || '-'}</td>
          <td className="read-only-cell col-standard">{build.team_security || '-'}</td>
          <td className="read-only-cell col-wide column-group-separator">{build.department || '-'}</td>
        </>
      )}
      {collapsedSections.teamLocation && (
        <td className="collapsed-cell master-section col-collapsed"></td>
      )}
      
      {/* Build & ChangeGear */}
      {!collapsedSections.buildInfo && (
        <>
          <td className="read-only-cell col-standard">{build.build_engineer_from_build || build.build_engineer || '-'}</td>
          <td className="read-only-cell col-wide">{build.build_name || '-'}</td>
          <td className="read-only-cell col-standard">{build.jira_ticket_no_from_build || build.jira_ticket_no || '-'}</td>
          <td className="read-only-cell col-standard column-group-separator">{build.changegear_asset_id || '-'}</td>
        </>
      )}
      {collapsedSections.buildInfo && (
        <td className="collapsed-cell master-section col-collapsed"></td>
      )}
      
      {/* MISC */}
      {!collapsedSections.misc && (
        <>
          <td className="read-only-cell col-notes">{build.master_notes || '-'}</td>
          <td className="read-only-cell col-standard">{build.sms_order || '-'}</td>
          <td className="read-only-cell col-standard">{build.cost_center || '-'}</td>
          <td className="read-only-cell col-standard">{build.capitalization || '-'}</td>
          <td className="read-only-cell col-standard">
            {build.delivery_date ? new Date(build.delivery_date).toLocaleDateString() : '-'}
          </td>
          <td className="read-only-cell col-standard">
            {build.master_status ? (
              <span className={`status-badge ${getMasterStatusBadgeClass(build.master_status)}`}>
                {build.master_status}
              </span>
            ) : '-'}
          </td>
        </>
      )}
      {collapsedSections.misc && (
        <td className="collapsed-cell master-section col-collapsed"></td>
      )}
    </tr>
  );
};

// Helper function for master status badge class
const getMasterStatusBadgeClass = (status) => {
  switch (status) {
    case 'Delivered':
      return 'complete';
    case 'Ready for Delivery':
    case 'Build Completed':
      return 'in-progress';
    case 'Bad':
    case 'Missing Information':
    case 'Need Paperwork':
    case 'Need CG Update':
    case 'Delivered - Need CG Update':
      return 'fail';
    default:
      return '';
  }
};

export default TableRow;