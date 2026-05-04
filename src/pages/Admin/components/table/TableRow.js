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
  getStatusBadgeClass,
  onFieldChange,
  projectOptions = []
}) => {
  const handleChange = (field, value) => {
    onFieldChange(build.chassis_sn, field, value);
  };

  console.log('options:', projectOptions);
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
          <td className="read-only-cell col-standard">  <select
            value={build.location || ''}

            onChange={(e) => handleChange('location', e.target.value)}
          >
            <option value="">Select Location</option>
            <option value="Penang">Penang</option>
            <option value="Austin">Austin</option>
          </select></td>
          <td className="read-only-cell col-standard">{build.is_custom_config ? 'Custom' : 'Standard'}</td>
        </>
      )}
      {collapsedSections.general && (
        <td className="collapsed-cell col-collapsed"></td>
      )}

      {/* System Information */}
      {!collapsedSections.systemInfo && (
        <>
          <td className="read-only-cell col-standard"><select
            value={build.project_name || ''}
            onChange={(e) => handleChange('project_name', e.target.value)}
          >
            <option value="">Select Project</option>

            {(projectOptions || []).map((project, idx) => (
              <option key={idx} value={project}>
                {project}
              </option>
            ))}
          </select></td>
          <td className="read-only-cell col-standard"><input
            value={build.system_pn || ''}
            onChange={(e) => handleChange('system_pn', e.target.value)}

          /></td>
          <td className="read-only-cell col-standard">{build.platform_type || '-'}</td>
          <td className="read-only-cell col-standard">{build.manufacturer || '-'}</td>
          <td className="read-only-cell col-standard"><input
            value={build.chassis_sn || ''}
            onChange={(e) => handleChange('chassis_sn', e.target.value)}

          /></td>
          <td className="read-only-cell col-standard">  <select
            value={build.chassis_type || ''}
            onChange={(e) => handleChange('chassis_type', e.target.value)}
          >
            <option value="">Select Type</option>
            <option value="Rackmount">Rackmount</option>
            <option value="Benchtop">Benchtop</option>
          </select></td>
          <td className="read-only-cell col-standard"><input
            value={build.po || ''}
            onChange={(e) => handleChange('po', e.target.value)}

          /></td>
          <td className="read-only-cell col-standard"> <input
            type="text"
            value={build.bmc_mac || ''}
            onChange={(e) => handleChange('bmc_mac', e.target.value)}

          /></td>
          <td className="read-only-cell col-standard"><input
            type="text"
            value={build.mb_sn || ''}
            onChange={(e) => handleChange('mb_sn', e.target.value)}

          /></td>
          <td className="read-only-cell col-standard"><input
            type="text"
            value={build.ethernet_mac || ''}
            onChange={(e) => handleChange('ethernet_mac', e.target.value)}

          /></td>
          <td className="read-only-cell col-standard"> <select
            value={build.cpu_socket || ''}
            onChange={(e) => handleChange('cpu_socket', e.target.value)}

          >
            <option value="">-</option>
            <option value="SP7">SP7</option>
            <option value="SP8">SP8</option>
          </select></td>
          <td className="read-only-cell col-standard column-group-separator"> <select
            value={build.cpu_vendor || ''}
            onChange={(e) => handleChange('cpu_vendor', e.target.value)}

          >
            <option value="">-</option>
            <option value="Tyco">Tyco</option>
            <option value="Foxconn">Foxconn</option>
            <option value="Lotes">Lotes</option>
          </select></td>
        </>
      )}
      {collapsedSections.systemInfo && (
        <td className="collapsed-cell col-collapsed"></td>
      )}

      {/* CPU Information */}
      {!collapsedSections.cpuInfo && (
        <>
          <td className="read-only-cell col-standard">{build.cpu_program_name || '-'}</td>
          <td className="read-only-cell col-standard"><input
            type="text"
            value={build.cpu_p0_sn || ''}
            placeholder="-"
            onChange={(e) => handleChange('cpu_p0_sn', e.target.value)}
          /></td>

          <td className="read-only-cell col-standard">  <input
            type="text"
            value={build.cpu_p0_socket_date_code || ''}
            placeholder="-"
            onChange={(e) => handleChange('cpu_p0_socket_date_code', e.target.value)}
          /></td>

          <td className="read-only-cell col-standard"> <input
            type="text"
            value={build.cpu_p1_sn || ''}
            placeholder="-"
            onChange={(e) => handleChange('cpu_p1_sn', e.target.value)}
          />
          </td>

          <td className="read-only-cell col-standard"> <input
            type="text"
            value={build.cpu_p1_socket_date_code || ''}
            placeholder="-"
            onChange={(e) => handleChange('cpu_p1_socket_date_code', e.target.value)}
          /></td>


        </>
      )}
      {collapsedSections.cpuInfo && (
        <td className="collapsed-cell col-collapsed"></td>
      )}

      {/* Component Information */}
      {!collapsedSections.componentInfo && (
        <>
          <td className="read-only-cell col-standard"><input
            type="text"
            value={build.m2_pn || ''}
            placeholder="-"
            onChange={(e) => handleChange('m2_pn', e.target.value)}
          /></td>

          <td className="read-only-cell col-standard"> <input
            type="text"
            value={build.m2_sn || ''}
            placeholder="-"
            onChange={(e) => handleChange('m2_sn', e.target.value)}
          /></td>

          <td className="read-only-cell col-standard"><input
            type="text"
            value={build.dimm_pn || ''}
            placeholder="-"
            onChange={(e) => handleChange('dimm_pn', e.target.value)}
          /></td>

          <td className="read-only-cell col-standard column-group-separator">
            <input
              type="number"
              min="0"
              value={build.dimm_qty || 0}
              onChange={(e) => handleChange('dimm_qty', parseInt(e.target.value) || 0)}
              style={{ width: '60px' }}
            />
          </td>
          {build.dimm_qty > 0 && (
            <td className="read-only-cell col-wide">
              <div className="dimm-serial-container">
                {Array.from({ length: build.dimm_qty }).map((_, idx) => (
                  <input
                    key={idx}
                    type="text"
                    placeholder={`SN ${idx + 1}`}
                    value={(build.dimmSNs && build.dimmSNs[idx]) || ''}
                    onChange={(e) => {
                      const updatedSNs = [...(build.dimmSNs || [])];
                      updatedSNs[idx] = e.target.value;

                      handleChange('dimmSNs', updatedSNs);

                      // Optional: also keep DB string format updated
                      handleChange('dimm_sns', updatedSNs.join(','));
                    }}
                    style={{ display: 'block', marginBottom: '4px' }}
                  />
                ))}
              </div>
            </td>
          )}
        </>
      )}
      {collapsedSections.componentInfo && (
        <td className="collapsed-cell col-collapsed"></td>
      )}

      {/*
  {!collapsedSections.testing && (
    <>
      <td className="read-only-cell col-standard">
        <select
          value={build.visual_inspection_status || ''}
          onChange={(e) =>
            handleChange('visual_inspection_status', e.target.value)
          }
        >
          <option value="">-</option>
          <option value="Pass">Pass</option>
          <option value="Fail">Fail</option>
        </select>
      </td>

      <td className="read-only-cell col-standard">
        <select
          value={build.boot_status || ''}
          onChange={(e) =>
            handleChange('boot_status', e.target.value)
          }
        >
          <option value="">-</option>
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>
      </td>

      <td className="read-only-cell col-standard">
        <select
          value={build.dimms_detected_status || ''}
          onChange={(e) =>
            handleChange('dimms_detected_status', e.target.value)
          }
        >
          <option value="">-</option>
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>
      </td>

      <td className="read-only-cell col-standard column-group-separator">
        <select
          value={build.lom_working_status || ''}
          onChange={(e) =>
            handleChange('lom_working_status', e.target.value)
          }
        >
          <option value="">-</option>
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>
      </td>
    </>
  )}

  {collapsedSections.testing && (
    <td className="collapsed-cell col-collapsed"></td>
  )}
*/}
      {/* BKC Details */}
      {!collapsedSections.bkcDetails && (
        <>
          <td className="read-only-cell col-standard"><input
            type="text"
            value={build.bios_version || ''}
            placeholder="-"
            onChange={(e) => handleChange('bios_version', e.target.value)}
          /></td>
          <td className="read-only-cell col-standard">
            <input
              type="text"
              value={build.scm_fpga_version || ''}
              placeholder="-"
              onChange={(e) => handleChange('scm_fpga_version', e.target.value)}
            />
          </td>
          <td className="read-only-cell col-standard">
            <input
              type="text"
              value={build.hpm_fpga_version || ''}
              placeholder="-"
              onChange={(e) => handleChange('hpm_fpga_version', e.target.value)}
            />
          </td>
          <td className="read-only-cell col-standard column-group-separator">
            <input
              type="text"
              value={build.bmc_version || ''}
              placeholder="-"
              onChange={(e) => handleChange('bmc_version', e.target.value)}
            />
          </td>
        </>
      )}
      {collapsedSections.bkcDetails && (
        <td className="collapsed-cell col-collapsed"></td>
      )}

      {/*
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
*/}
      {/*
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

  {!collapsedSections.rma && (
    <>
      <td className="read-only-cell col-standard">
        {build.rma_pass_fail || '-'}
      </td>

      <td className="read-only-cell col-wide">
        {build.rma_notes || '-'}
      </td>

      <td className="read-only-cell col-standard">
        {build.rma_dimm || '-'}
      </td>

      <td className="read-only-cell col-standard">
        {build.rma_bmc || '-'}
      </td>

      <td className="read-only-cell col-standard">
        {build.rma_m2 || '-'}
      </td>

      <td className="read-only-cell col-standard">
        {build.rma_liquid_cooler || '-'}
      </td>

      <td className="read-only-cell col-standard">
        {build.rma_location || '-'}
      </td>

      <td className="read-only-cell col-standard">
        {build.rma_reference || '-'}
      </td>

      <td className="read-only-cell col-standard column-group-separator">
        {build.rma_status || '-'}
      </td>
    </>
  )}

  {collapsedSections.rma && (
    <td className="collapsed-cell master-section col-collapsed"></td>
  )}
*/}
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