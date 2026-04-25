// frontend/src/pages/MasterBuild/components/table/TableRow.js

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../../../contexts/AuthContext.js';


const TableRow = ({
  build,
  selectedRows,
  sourceRow,
  toggleRowSelection,
  collapsedSections,
  hasCollapsedSections,
  masterData,
  handleFieldChange,
  getCpuQty,
  showCpuDetails,
  showDimmDetails,
  loadTestDetails,
  loadFailureDetails,
  loadReworkHistory,
  getStatusBadgeClass,
  onRemoveBuild
}) => {

  const { user } = useAuth();

  const canEditFinanceFields = user?.department === 'Systems Design Eng';
  const isRestricted = !canEditFinanceFields;
  const isSelected = selectedRows.includes(build.chassis_sn);
  const isSource = sourceRow === build.chassis_sn;

  // Determine background color: purple for source, blue for selected, white for others
  let backgroundColor = 'white';
  if (isSource) {
    backgroundColor = '#f3e7ff'; // Light purple tone (same style as blue #e7f3ff)
  } else if (isSelected) {
    backgroundColor = '#e7f3ff'; // Light blue
  }

  return (
    <tr
      onClick={() => toggleRowSelection(build.chassis_sn)}
      style={{
        cursor: 'pointer',
        backgroundColor: backgroundColor
      }}
    >
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

      {/* Master Build Fields - Editable - REMOVED ALL ERROR CLASSES */}
      {/* Team & Location */}
      {!collapsedSections.teamLocation && (
        <>
          <td className="col-standard">
          <div className="input-wrapper" title={isRestricted ? "Only department SPSE Data Center can edit" : ""}>
            <select
              value={masterData.builds?.[build.chassis_sn]?.location || build.master_location || ''}
              onChange={(e) => handleFieldChange(build.chassis_sn, 'location', e.target.value)}
              onClick={(e) => e.stopPropagation()}
              disabled={!canEditFinanceFields}
              style={{ maxHeight: '200px', overflowY: 'auto' }}
            >
              <option value="">Select Location</option>

              {/* Major Cities */}
              <optgroup label="Major Locations">
                <option value="Austin">Austin</option>
                <option value="Austin : Ceva-offsite Storage">Austin : Ceva-offsite Storage</option>
                <option value="Bangalore">Bangalore</option>
                <option value="Bangalore : BLR - Engineering Room">Bangalore : BLR - Engineering Room</option>
                <option value="Bangalore : BLR - Lab 11">Bangalore : BLR - Lab 11</option>
                <option value="Bangalore : BLR - Lab 12">Bangalore : BLR - Lab 12</option>
                <option value="Bangalore : BLR - Server Room">Bangalore : BLR - Server Room</option>
                <option value="Bangalore : BLR- ODC_ServerRoom">Bangalore : BLR- ODC_ServerRoom</option>
                <option value="Bangalore : BLR- ODC_Workbench">Bangalore : BLR- ODC_Workbench</option>
                <option value="Bangalore : BLR-Server-Lab-AMD.1.1A301.1-Rack33">Bangalore : BLR-Server-Lab-AMD.1.1A301.1-Rack33</option>
                <option value="Bellevue">Bellevue</option>
                <option value="Boston">Boston</option>
                <option value="Dallas">Dallas</option>
                <option value="Dallas : Dallas-Colocation">Dallas : Dallas-Colocation</option>
                <option value="Dallas : Dallas-Colocation : Dallas-Colocation-SOS-Rack-118">Dallas : Dallas-Colocation : Dallas-Colocation-SOS-Rack-118</option>
                <option value="Dallas : Dallas-Colocation : Dallas-Colocation-SOS-Rack-120">Dallas : Dallas-Colocation : Dallas-Colocation-SOS-Rack-120</option>
                <option value="Dallas : Dallas-Colocation : Dallas-Colocation-SOS-Rack-122">Dallas : Dallas-Colocation : Dallas-Colocation-SOS-Rack-122</option>
                <option value="Dallas : Dallas-Colocation : Dallas-Colocation-SOS-Rack-222">Dallas : Dallas-Colocation : Dallas-Colocation-SOS-Rack-222</option>
                <option value="Dallas : Dallas-Colocation : Dallas-Colocation-SOS-Rack-232">Dallas : Dallas-Colocation : Dallas-Colocation-SOS-Rack-232</option>
                <option value="Dallas : Equinix">Dallas : Equinix</option>
                <option value="Georgia">Georgia</option>
                <option value="Markham">Markham</option>
                <option value="Oregon">Oregon</option>
                <option value="Penang">Penang</option>
                <option value="Plano">Plano</option>
                <option value="Plano : Aligned">Plano : Aligned</option>
                <option value="Santa Clara">Santa Clara</option>
                <option value="Taiwan">Taiwan</option>
              </optgroup>

              {/* Greater China */}
              <optgroup label="Greater China">
                <option value="Greater China">Greater China</option>
                <option value="Greater China : BJ">Greater China : BJ</option>
                <option value="Greater China : SHA">Greater China : SHA</option>
                <option value="Greater China : SHZ">Greater China : SHZ</option>
                <option value="Greater China : TPE">Greater China : TPE</option>
              </optgroup>

              {/* Special Locations */}
              <optgroup label="Special Locations">
                <option value="Customer Site">Customer Site</option>
                <option value="Extron">Extron</option>
                <option value="ODC">ODC</option>
                <option value="MetCenter">MetCenter</option>
              </optgroup>

              {/* MetCenter Racks - B800.1C.102.xxx */}
              <optgroup label="MetCenter B800.1C.102 (001-185)">
                {Array.from({ length: 185 }, (_, i) => {
                  const num = String(i + 1).padStart(3, '0');
                  const value = `B800.1C.102.${num}`;
                  return <option key={value} value={value}>{value}</option>;
                })}
              </optgroup>

              {/* MetCenter Racks - B800.1C.103.xxx */}
              <optgroup label="MetCenter B800.1C.103 (001-030)">
                {Array.from({ length: 30 }, (_, i) => {
                  const num = String(i + 1).padStart(3, '0');
                  const value = `B800.1C.103.${num}`;
                  return <option key={value} value={value}>{value}</option>;
                })}
              </optgroup>

              {/* MetCenter Racks - B800.1C.503.xxx */}
              <optgroup label="MetCenter B800.1C.503 (001-023)">
                {Array.from({ length: 23 }, (_, i) => {
                  const num = String(i + 1).padStart(3, '0');
                  const value = `B800.1C.503.${num}`;
                  return <option key={value} value={value}>{value}</option>;
                })}
              </optgroup>

              {/* MetCenter Server Racks - B800.1C.502.SRxxx */}
              <optgroup label="MetCenter B800.1C.502.SR (001-040)">
                {Array.from({ length: 40 }, (_, i) => {
                  const num = String(i + 1).padStart(3, '0');
                  const value = `B800.1C.502.SR${num}`;
                  return <option key={value} value={value}>{value}</option>;
                })}
              </optgroup>

              {/* MetCenter Server Racks - B800.1C.100.SRxxx */}
              <optgroup label="MetCenter B800.1C.100.SR (102-243)">
                {Array.from({ length: 142 }, (_, i) => {
                  const num = String(i + 102).padStart(3, '0');
                  const value = `B800.1C.100.SR${num}`;
                  return <option key={value} value={value}>{value}</option>;
                })}
              </optgroup>

              {/* MetCenter Server Racks - B800.1C.506.SRxxx */}
              <optgroup label="MetCenter B800.1C.506.SR (001-040)">
                {Array.from({ length: 40 }, (_, i) => {
                  const num = String(i + 1).padStart(3, '0');
                  const value = `B800.1C.506.SR${num}`;
                  return <option key={value} value={value}>{value}</option>;
                })}
              </optgroup>

              {/* MetCenter Racks - B800.1C.500.xxx */}
              <optgroup label="MetCenter B800.1C.500 (001-070)">
                {Array.from({ length: 70 }, (_, i) => {
                  const num = String(i + 1).padStart(3, '0');
                  const value = `B800.1C.500.${num}`;
                  return <option key={value} value={value}>{value}</option>;
                })}
              </optgroup>
            </select>
            </div>
          </td>
          <td className="col-standard">
          <div className="input-wrapper" title={isRestricted ? "Only department SPSE Data Center can edit" : ""}>
            <input
              type="text"
              value={masterData.builds?.[build.chassis_sn]?.customLocation || build.custom_location || ''}
              onChange={(e) => handleFieldChange(build.chassis_sn, 'customLocation', e.target.value)}
              placeholder="Custom location"
              onClick={(e) => e.stopPropagation()}
              disabled={!canEditFinanceFields}
            />
            </div>
          </td>
          <td className="col-standard">
          <div className="input-wrapper" title={isRestricted ? "Only department SPSE Data Center can edit" : ""}>
            <select
              value={masterData.builds?.[build.chassis_sn]?.teamSecurity || build.team_security || ''}
              onChange={(e) => handleFieldChange(build.chassis_sn, 'teamSecurity', e.target.value)}
              onClick={(e) => e.stopPropagation()}
              disabled={!canEditFinanceFields}
              style={{ maxHeight: '200px', overflowY: 'auto' }}
            >
              <option value="">Select Team</option>
              <option value="AMD PGSite">AMD PGSite</option>
              <option value="AMD SPSE">AMD SPSE</option>
              <option value="AMD-CEE-GC">AMD-CEE-GC</option>
              <option value="AMI-ServerFirmware">AMI-ServerFirmware</option>
              <option value="Apex Team">Apex Team</option>
              <option value="Automation Infrastructure">Automation Infrastructure</option>
              <option value="ATSV">ATSV</option>
              <option value="BIOS-ServerFirmware">BIOS-ServerFirmware</option>
              <option value="Boards Team">Boards Team</option>
              <option value="CDFD">CDFD</option>
              <option value="CI Team">CI Team</option>
              <option value="CISE">CISE</option>
              <option value="Core Austin - Silicon Design Team">Core Austin - Silicon Design Team</option>
              <option value="Core Boston - Silicon Design Team">Core Boston - Silicon Design Team</option>
              <option value="Core Santa Clara - Silicon Design Team">Core Santa Clara - Silicon Design Team</option>
              <option value="Core software group(CSG)">Core software group(CSG)</option>
              <option value="Core Validation">Core Validation</option>
              <option value="Customer Enablement">Customer Enablement</option>
              <option value="Customer Site">Customer Site</option>
              <option value="CXL Developers">CXL Developers</option>
              <option value="Debug Team">Debug Team</option>
              <option value="DEAE">DEAE</option>
              <option value="DEAE Labs">DEAE Labs</option>
              <option value="DPPM-Aligned">DPPM-Aligned</option>
              <option value="DPPM-Equinix">DPPM-Equinix</option>
              <option value="EV Team">EV Team</option>
              <option value="FAE">FAE</option>
              <option value="FCVal">FCVal</option>
              <option value="Genoa Post-PR Stress">Genoa Post-PR Stress</option>
              <option value="IOVal Team">IOVal Team</option>
              <option value="LSE">LSE</option>
              <option value="Management Team">Management Team</option>
              <option value="MPDMA">MPDMA</option>
              <option value="Non-Platform Engineering">Non-Platform Engineering</option>
              <option value="Open BMC">Open BMC</option>
              <option value="PMM/PDAT">PMM/PDAT</option>
              <option value="Program Manager">Program Manager</option>
              <option value="PSP/SEV/PFO-ServerFirmware">PSP/SEV/PFO-ServerFirmware</option>
              <option value="QA-ServerFirmware">QA-ServerFirmware</option>
              <option value="RAS Validation">RAS Validation</option>
              <option value="RevA-ServerFirmware">RevA-ServerFirmware</option>
              <option value="SCPI US Debug">SCPI US Debug</option>
              <option value="SCPI US PAE Team">SCPI US PAE Team</option>
              <option value="SCPI-BA_CustomerEngineeringTools">SCPI-BA_CustomerEngineeringTools</option>
              <option value="SCPI-CISE">SCPI-CISE</option>
              <option value="Server MemVal">Server MemVal</option>
              <option value="Server Firmware Security">Server Firmware Security</option>
              <option value="Server Platform Team">Server Platform Team</option>
              <option value="Server Validation Team">Server Validation Team</option>
              <option value="SEVAL">SEVAL</option>
              <option value="Shared Bios">Shared Bios</option>
              <option value="SIP">SIP</option>
              <option value="SIPI">SIPI</option>
              <option value="Smart Hands Team">Smart Hands Team</option>
              <option value="SMU-ServerFirmware">SMU-ServerFirmware</option>
              <option value="SOS">SOS</option>
              <option value="SPE(Server Performance Engineering)">SPE(Server Performance Engineering)</option>
              <option value="SPG(Server Performance Group)">SPG(Server Performance Group)</option>
              <option value="SPM(Server Power Management)">SPM(Server Power Management)</option>
              <option value="SPPO">SPPO</option>
              <option value="Stress Capabilities">Stress Capabilities</option>
              <option value="SV_Reset">SV_Reset</option>
              <option value="SVDS">SVDS</option>
              <option value="SVT">SVT</option>
              <option value="TPM Security">TPM Security</option>
              <option value="Voldemort">Voldemort</option>
              <option value="Volume Validation">Volume Validation</option>
              <option value="VV Automation">VV Automation</option>
            </select>
            </div>
          </td>
          <td className="col-standard column-group-separator">
          <div className="input-wrapper" title={isRestricted ? "Only department SPSE Data Center can edit" : ""}>
            <select
              value={masterData.builds?.[build.chassis_sn]?.department || build.department || ''}
              onChange={(e) => handleFieldChange(build.chassis_sn, 'department', e.target.value)}
              onClick={(e) => e.stopPropagation()}
              disabled={!canEditFinanceFields}
              style={{ maxHeight: '200px', overflowY: 'auto' }}
            >
              <option value="">Select Department</option>

              {/* AMD PG Site */}
              <optgroup label="AMD PG Site">
                <option value="AMD PG Site">AMD PG Site</option>
                <option value="AMD PG Site : SHPE">AMD PG Site : SHPE</option>
                <option value="AMD PG Site : SHPE : EV">AMD PG Site : SHPE : EV</option>
                <option value="AMD PG Site : SHPE : Platform HW">AMD PG Site : SHPE : Platform HW</option>
                <option value="AMD PG Site : SHPE : PMPD">AMD PG Site : SHPE : PMPD</option>
                <option value="AMD PG Site : Sys Debug">AMD PG Site : Sys Debug</option>
                <option value="AMD PG Site : Validation">AMD PG Site : Validation</option>
              </optgroup>

              {/* AMD-SCPI */}
              <optgroup label="AMD-SCPI">
                <option value="AMD-SCPI">AMD-SCPI</option>
                <option value="AMD-SCPI : CEE-GC">AMD-SCPI : CEE-GC</option>
                <option value="AMD-SCPI : SCPI US Debug">AMD-SCPI : SCPI US Debug</option>
                <option value="AMD-SCPI : SCPI US PAE">AMD-SCPI : SCPI US PAE</option>
                <option value="AMD-SCPI : SCPI-BA-CustomerEngineeringTools">AMD-SCPI : SCPI-BA-CustomerEngineeringTools</option>
                <option value="AMD-SCPI : SCPI-BA-CustomerEngineeringTools : CustomerEngineeringTools-CPU">AMD-SCPI : SCPI-BA-CustomerEngineeringTools : CustomerEngineeringTools-CPU</option>
                <option value="AMD-SCPI : SCPI-BA-CustomerEngineeringTools : CustomerEngineeringTools-DTE">AMD-SCPI : SCPI-BA-CustomerEngineeringTools : CustomerEngineeringTools-DTE</option>
                <option value="AMD-SCPI : SCPI-BA-CustomerEngineeringTools : CustomerEngineeringTools-GPU">AMD-SCPI : SCPI-BA-CustomerEngineeringTools : CustomerEngineeringTools-GPU</option>
                <option value="AMD-SCPI : SCPI-CISE">AMD-SCPI : SCPI-CISE</option>
                <option value="AMD-SCPI : SCPI-CPDS">AMD-SCPI : SCPI-CPDS</option>
              </optgroup>

              {/* Core Software Group */}
              <optgroup label="Core Software Group">
                <option value="Core software group(CSG)">Core software group(CSG)</option>
                <option value="Core software group(CSG) : CSG_Compilers">Core software group(CSG) : CSG_Compilers</option>
                <option value="Core software group(CSG) : CSG_Diagnostics">Core software group(CSG) : CSG_Diagnostics</option>
                <option value="Core software group(CSG) : CSG_Driver dev">Core software group(CSG) : CSG_Driver dev</option>
                <option value="Core software group(CSG) : CSG_Driver DQ">Core software group(CSG) : CSG_Driver DQ</option>
                <option value="Core software group(CSG) : CSG_Hardware debug tools">Core software group(CSG) : CSG_Hardware debug tools</option>
                <option value="Core software group(CSG) : CSG_Libraries">Core software group(CSG) : CSG_Libraries</option>
                <option value="Core software group(CSG) : CSG_PSP">Core software group(CSG) : CSG_PSP</option>
                <option value="Core software group(CSG) : CSG_Shoreline">Core software group(CSG) : CSG_Shoreline</option>
              </optgroup>

              {/* CSEE/SIP */}
              <optgroup label="CSEE/SIP">
                <option value="CSEE/SIP">CSEE/SIP</option>
                <option value="CSEE/SIP : SIP">CSEE/SIP : SIP</option>
                <option value="CSEE/SIP : SIP : CDFX">CSEE/SIP : SIP : CDFX</option>
                <option value="CSEE/SIP : SIP : Control-Fabric">CSEE/SIP : SIP : Control-Fabric</option>
                <option value="CSEE/SIP : SIP : DF">CSEE/SIP : SIP : DF</option>
                <option value="CSEE/SIP : SIP : FAILSAFE">CSEE/SIP : SIP : FAILSAFE</option>
                <option value="CSEE/SIP : SIP : RAS">CSEE/SIP : SIP : RAS</option>
                <option value="CSEE/SIP : SIP : SOC-Next">CSEE/SIP : SIP : SOC-Next</option>
                <option value="CSEE/SIP : SIP : UMC">CSEE/SIP : SIP : UMC</option>
              </optgroup>

              {/* Customer Facing Engineer */}
              <optgroup label="Customer Facing Engineer">
                <option value="Customer facing Engineer">Customer facing Engineer</option>
                <option value="Customer facing Engineer : Customer Engineer - Austin Team">Customer facing Engineer : Customer Engineer - Austin Team</option>
                <option value="Customer facing Engineer : Customer Engineer - Bellview Team">Customer facing Engineer : Customer Engineer - Bellview Team</option>
                <option value="Customer facing Engineer : Customer Engineering - Santa Clara">Customer facing Engineer : Customer Engineering - Santa Clara</option>
              </optgroup>

              {/* DEAE */}
              <optgroup label="DEAE">
                <option value="DEAE">DEAE</option>
                <option value="DEAE : IHV">DEAE : IHV</option>
                <option value="DEAE : OSV">DEAE : OSV</option>
                <option value="DEAE : OSV Upstream">DEAE : OSV Upstream</option>
              </optgroup>

              {/* DPPM */}
              <optgroup label="DPPM">
                <option value="DPPM">DPPM</option>
                <option value="DPPM : TTF-A1">DPPM : TTF-A1</option>
                <option value="DPPM : TTF-B0">DPPM : TTF-B0</option>
              </optgroup>

              {/* HW Ops */}
              <optgroup label="HW Ops">
                <option value="HW Ops">HW Ops</option>
                <option value="HW Ops Non SPSE">HW Ops Non SPSE</option>
                <option value="HW Ops Non-SPSE : Tools">HW Ops Non-SPSE : Tools</option>
                <option value="HW Ops Non-SPSE : ICT">HW Ops Non-SPSE : ICT</option>
                <option value="HW Ops Non-SPSE : Embedded">HW Ops Non-SPSE : Embedded</option>
                <option value="HW Ops Non-SPSE : DIAGs">HW Ops Non-SPSE : DIAGs</option>
              </optgroup>

              {/* LSE */}
              <optgroup label="LSE">
                <option value="LSE">LSE</option>
                <option value="LSE : Customer Enablement">LSE : Customer Enablement</option>
                <option value="LSE : DF">LSE : DF</option>
                <option value="LSE : Diags">LSE : Diags</option>
                <option value="LSE : FCH H/W IPSE">LSE : FCH H/W IPSE</option>
                <option value="LSE : FSA">LSE : FSA</option>
              </optgroup>

              {/* PHPE */}
              <optgroup label="PHPE">
                <option value="PHPE">PHPE</option>
                <option value="PHPE : EV">PHPE : EV</option>
                <option value="PHPE : PMPD">PHPE : PMPD</option>
                <option value="PHPE : PMPD : PMM">PHPE : PMPD : PMM</option>
                <option value="PHPE : PMPD : PDAT">PHPE : PMPD : PDAT</option>
                <option value="PHPE : PMPD : SIPI">PHPE : PMPD : SIPI</option>
                <option value="PHPE : SIPI">PHPE : SIPI</option>
              </optgroup>

              {/* PSSOCV */}
              <optgroup label="PSSOCV">
                <option value="PSSOCV">PSSOCV</option>
                <option value="PSSOCV : Server System Validation">PSSOCV : Server System Validation</option>
                <option value="PSSOCV : Server System Validation : System Validation Testing">PSSOCV : Server System Validation : System Validation Testing</option>
                <option value="PSSOCV : Server System Validation : Volume Validation">PSSOCV : Server System Validation : Volume Validation</option>
                <option value="PSSOCV : SVDS">PSSOCV : SVDS</option>
                <option value="PSSOCV : MemVal">PSSOCV : MemVal</option>
                <option value="PSSOCV : IOVal">PSSOCV : IOVal</option>
                <option value="PSSOCV : FCVal_CEng : FCVal">PSSOCV : FCVal_CEng : FCVal</option>
                <option value="PSSOCV:RASVal">PSSOCV:RASVal</option>
              </optgroup>

              {/* Server Firmware */}
              <optgroup label="Server Firmware">
                <option value="Server Firmware">Server Firmware</option>
                <option value="Server Firmware : ABL-MEM">Server Firmware : ABL-MEM</option>
                <option value="Server Firmware : AMI">Server Firmware : AMI</option>
                <option value="Server Firmware : AMI BMC">Server Firmware : AMI BMC</option>
                <option value="Server Firmware : BIOS Team">Server Firmware : BIOS Team</option>
                <option value="Server Firmware : BIOS Team : AGESA">Server Firmware : BIOS Team : AGESA</option>
                <option value="Server Firmware : EDKII">Server Firmware : EDKII</option>
                <option value="Server Firmware : Extended Weekly Testing">Server Firmware : Extended Weekly Testing</option>
                <option value="Server Firmware : FCH/x86">Server Firmware : FCH/x86</option>
                <option value="Server Firmware : Insyde">Server Firmware : Insyde</option>
                <option value="Server Firmware : Insyde BMC">Server Firmware : Insyde BMC</option>
                <option value="Server Firmware : MPDMA">Server Firmware : MPDMA</option>
                <option value="Server Firmware : MPIO/ NBIO/CXL (PFO)">Server Firmware : MPIO/ NBIO/CXL (PFO)</option>
                <option value="Server Firmware : OpenBMC">Server Firmware : OpenBMC</option>
                <option value="Server Firmware : PSP">Server Firmware : PSP</option>
                <option value="Server Firmware : QA Team">Server Firmware : QA Team</option>
                <option value="Server Firmware : QA Team : CI Team">Server Firmware : QA Team : CI Team</option>
                <option value="Server Firmware : RAS">Server Firmware : RAS</option>
                <option value="Server Firmware : SEV">Server Firmware : SEV</option>
                <option value="Server Firmware : SEV-On-TEE">Server Firmware : SEV-On-TEE</option>
                <option value="Server Firmware : Shared Pool">Server Firmware : Shared Pool</option>
                <option value="Server Firmware : SMU">Server Firmware : SMU</option>
                <option value="Server Firmware : VV Automation">Server Firmware : VV Automation</option>
              </optgroup>

              {/* Server Validation Team */}
              <optgroup label="Server Validation Team">
                <option value="Server Validation Team">Server Validation Team</option>
                <option value="Server Validation Team : Automation">Server Validation Team : Automation</option>
                <option value="Server Validation Team : Automation : Development">Server Validation Team : Automation : Development</option>
                <option value="Server Validation Team : Automation : Val - Execution">Server Validation Team : Automation : Val - Execution</option>
                <option value="Server Validation Team : DDR">Server Validation Team : DDR</option>
                <option value="Server Validation Team : Full Chip">Server Validation Team : Full Chip</option>
                <option value="Server Validation Team : Functional Validation">Server Validation Team : Functional Validation</option>
                <option value="Server Validation Team : IO">Server Validation Team : IO</option>
                <option value="Server Validation Team : PMM">Server Validation Team : PMM</option>
              </optgroup>

              {/* Other Departments */}
              <optgroup label="Other Departments">
                <option value="Apex">Apex</option>
                <option value="Boards">Boards</option>
                <option value="CISE">CISE</option>
                <option value="Core Validation">Core Validation</option>
                <option value="DebugCap">DebugCap</option>
                <option value="FAE">FAE</option>
                <option value="LPAD">LPAD</option>
                <option value="NBIO Design">NBIO Design</option>
                <option value="PCQV">PCQV</option>
                <option value="Server Performance Group">Server Performance Group</option>
                <option value="Server Performance Group : IDC">Server Performance Group : IDC</option>
                <option value="Server Platform">Server Platform</option>
                <option value="Server Power Management">Server Power Management</option>
                <option value="SPPO">SPPO</option>
                <option value="Stress Capabilities">Stress Capabilities</option>
              </optgroup>
            </select>
            </div>
          </td>
        </>
      )}
      {collapsedSections.teamLocation && (
        <td className="collapsed-cell master-section col-collapsed"></td>
      )}

      {/* Build & ChangeGear */}
      {!collapsedSections.buildInfo && (
        <>
          <td className="col-standard">
            {/* UPDATED: Build Engineer - READ-ONLY */}
            <div className="read-only-field" title="Build Engineer">
              <input
                type="text"
                value={build.build_engineer || ''}
                readOnly
                className="read-only-input"
                placeholder="Build Engineer"
              />
            </div>
          </td>
          <td className="col-standard">
          <div className="input-wrapper" title={isRestricted ? "Only department SPSE Data Center can edit" : ""}>
            <input
              type="text"
              value={masterData.builds?.[build.chassis_sn]?.buildName || build.build_name || ''}
              onChange={(e) => handleFieldChange(build.chassis_sn, 'buildName', e.target.value)}
              placeholder="Build Name"
              onClick={(e) => e.stopPropagation()}
              disabled={!canEditFinanceFields}
            />
            </div>
          </td>
          <td className="col-standard">
          <div className="input-wrapper" title={isRestricted ? "Only department SPSE Data Center can edit" : ""}>
            {/* UPDATED: Jira Ticket No - READ-ONLY */}
            <div className="read-only-field" title="Jira Ticket No">
              <input
                type="text"
                value={build.jira_ticket_no || ''}
                readOnly
                className="read-only-input"
                placeholder="Jira Ticket No"
              />
            </div>
            </div>
          </td>
          <td className="col-standard column-group-separator">
          <div className="input-wrapper" title={isRestricted ? "Only department SPSE Data Center can edit" : ""}>
            <input
              type="text"
              value={masterData.builds?.[build.chassis_sn]?.changegearAssetId || build.changegear_asset_id || ''}
              onChange={(e) => handleFieldChange(build.chassis_sn, 'changegearAssetId', e.target.value)}
              placeholder="CG Asset ID"
              onClick={(e) => e.stopPropagation()}
              disabled={!canEditFinanceFields}
            />
            </div>
          </td>
        </>
      )}
      {collapsedSections.buildInfo && (
        <td className="collapsed-cell master-section col-collapsed"></td>
      )}



      {/* MISC */}
      {!collapsedSections.misc && (
        <>
          <td className="col-notes">
          <div className="input-wrapper" title={isRestricted ? "Only department SPSE Data Center can edit" : ""}>
            <textarea
              value={masterData.builds?.[build.chassis_sn]?.notes || build.master_notes || ''}
              onChange={(e) => handleFieldChange(build.chassis_sn, 'notes', e.target.value)}
              placeholder="Notes"
              rows="2"
              onClick={(e) => e.stopPropagation()}
              disabled={!canEditFinanceFields}
            />
            </div>
          </td>
          <td className="col-standard">
          <div className="input-wrapper" title={isRestricted ? "Only department SPSE Data Center can edit" : ""}>
            <input
              type="text"
              value={masterData.builds?.[build.chassis_sn]?.smsOrder || build.sms_order || ''}
              onChange={(e) => handleFieldChange(build.chassis_sn, 'smsOrder', e.target.value)}
              placeholder="SMS Order"
              onClick={(e) => e.stopPropagation()}
              disabled={!canEditFinanceFields}
            />
          </div>
          </td>
          <td className="col-standard">
              <input
                type="text"
                value={masterData.builds?.[build.chassis_sn]?.costCenter || build.cost_center || ''}
                onChange={(e) => handleFieldChange(build.chassis_sn, 'costCenter', e.target.value)}
                placeholder="Cost Center"
                onClick={(e) => e.stopPropagation()}
              />
          </td>
          <td className="col-standard">
              <input
                type="text"
                value={masterData.builds?.[build.chassis_sn]?.capitalization || build.capitalization || ''}
                onChange={(e) => handleFieldChange(build.chassis_sn, 'capitalization', e.target.value)}
                placeholder="Capitalization"
                onClick={(e) => e.stopPropagation()}
              />
          </td>
          <td className="col-standard">
      
            <input
              type="date"
              value={masterData.builds?.[build.chassis_sn]?.deliveryDate || build.delivery_date || ''}
              onChange={(e) => handleFieldChange(build.chassis_sn, 'deliveryDate', e.target.value)}
              onClick={(e) => e.stopPropagation()}
              
            />
          
          </td>
          <td className="col-standard">
          
            <select
              value={masterData.builds?.[build.chassis_sn]?.masterStatus || build.master_status || ''}
              onChange={(e) => handleFieldChange(build.chassis_sn, 'masterStatus', e.target.value)}
              onClick={(e) => e.stopPropagation()}
             
            >
              <option value="">All Status (excludes Delivered & Incomplete)</option>
                <option value="Build Completed">Build Completed</option>
                <option value="Missing Information">Missing Information</option>
                <option value="Incomplete">Incomplete</option>
                <option value="Need Paperwork">Need Paperwork</option>
                <option value="Ready for Delivery">Ready for Delivery</option>
                <option value="Need CG Update">Need CG Update</option>
                <option value="Delivered Need CG Update">Delivered Need CG Update</option>
                <option value="Delivered">Delivered</option>
                <option value="Pending Rework">Pending Rework</option>
                <option value="Sent for Rework">Sent for Rework</option>
                <option value="Back from Rework">Back from Rework</option>
                <option value="Reclaimed">Reclaimed</option>
                <option value="Bad">Bad</option>
            </select>
            
          </td>
        </>
      )}
      {collapsedSections.misc && (
        <td className="collapsed-cell master-section col-collapsed"></td>
      )}

      {/* Remove Button - At the end */}
      <td style={{ width: '50px', textAlign: 'center', backgroundColor: 'white', borderLeft: '2px solid #dee2e6' }}>
        <button
          className="btn-remove"
          onClick={(e) => {
            e.stopPropagation();
            onRemoveBuild(build.chassis_sn);
          }}
          title="Remove from bulk entry"
        >
          <FontAwesomeIcon icon={faTrash} />
        </button>
      </td>
    </tr>
  );
};

export default TableRow;