// frontend/src/utils/masterBuildExport.js

import * as XLSX from 'xlsx';
import api from '../services/api';

/**
 * Export master build data to Excel format with specific structure
 * @param {Array} selectedBuilds - Array of selected build objects with master data
 * @returns {void} - Downloads Excel file
 */
export const exportMasterBuildsToExcel = async (selectedBuilds) => {
  if (!selectedBuilds || selectedBuilds.length === 0) {
    alert('No builds selected for export');
    return;
  }

  try {
    // Fetch additional data for builds that might be missing details
    const buildsWithDetails = await Promise.all(
      selectedBuilds.map(async (build) => {
        try {
          // Get failure details for each build if FPY status is Fail
          let failures = [];
          if (build.fpy_status === 'Fail') {
            const buildDetails = await api.getBuildDetails(build.chassis_sn);
            failures = buildDetails.failures || [];
          }

          // Get DIMM serial numbers
          let dimmSNs = [];
          if (build.dimm_sns) {
            dimmSNs = build.dimm_sns.split(',').filter(sn => sn && sn.trim());
          }

          return {
            ...build,
            failures,
            dimmSNs
          };
        } catch (error) {
          console.error(`Error fetching details for build ${build.chassis_sn}:`, error);
          return {
            ...build,
            failures: [],
            dimmSNs: []
          };
        }
      })
    );

    // Create workbook
    const wb = XLSX.utils.book_new();
    
    // Create worksheet data
    const wsData = [];
    
    // Define section headers and their columns
    const sections = [
      {
        title: 'Build and ChangeGear Information',
        columns: [
          { header: 'Build Engineer', key: 'build_engineer' },
          { header: 'Build Name', key: 'build_name' },
          { header: 'Jira Ticket No.', key: 'jira_ticket_no' },
          { header: 'Changegear Asset ID', key: 'changegear_asset_id' }
        ]
      },
      {
        title: 'System Information',
        columns: [
          { header: 'Project Name', key: 'project_name' },
          { header: 'System P/N', key: 'system_pn' },
          { header: 'Platform Type', key: 'platform_type' },
          { header: 'Manufacturer', key: 'manufacturer' },
          { header: 'Chassis S/N', key: 'chassis_sn' },
          { header: 'Chassis Type', key: 'chassis_type' },
          { header: 'PO', key: 'po' },
          { header: 'BMC Name', key: 'bmc_name' },
          { header: 'BMC MAC', key: 'bmc_mac' },
          { header: 'MB S/N', key: 'mb_sn' },
          { header: 'Ethernet MAC', key: 'ethernet_mac' },
          { header: 'CPU Socket', key: 'cpu_socket' },
          { header: 'CPU Vendor', key: 'cpu_vendor' },
          { header: 'CPU Program Name', key: 'cpu_program_name' },
          { header: 'CPU P0 S/N', key: 'cpu_p0_sn' },
          { header: 'CPU P0 Socket Date Code', key: 'cpu_p0_socket_date_code' },
          { header: 'CPU P1 S/N', key: 'cpu_p1_sn' },
          { header: 'CPU P1 Socket Date Code', key: 'cpu_p1_socket_date_code' },
          { header: 'M.2 P/N', key: 'm2_pn' },
          { header: 'M.2 S/N', key: 'm2_sn' },
          { header: 'DIMM P/N', key: 'dimm_pn' },
          { header: 'DIMM QTY', key: 'dimm_qty' },
          { header: 'DIMM S/N', key: 'dimm_sns_combined' },
          { header: 'Visual Inspection', key: 'visual_inspection_status' },
          { header: 'Visual Inspection Note', key: 'visual_inspection_notes' },
          { header: 'Boot Status', key: 'boot_status' },
          { header: 'Boot Status Note', key: 'boot_notes' },
          { header: 'DIMMs Detected', key: 'dimms_detected_status' },
          { header: 'DIMMs Detected Note', key: 'dimms_detected_notes' },
          { header: 'LOM Working', key: 'lom_working_status' },
          { header: 'LOM Working Note', key: 'lom_working_notes' }
        ]
      },
      {
        title: 'Team and Location Details',
        columns: [
          { header: 'Location', key: 'master_location' },
          { header: 'Custom Location', key: 'custom_location' },
          { header: 'Team/Security', key: 'team_security' },
          { header: 'Department', key: 'department' }
        ]
      },
      {
        title: 'BKC',
        columns: [
          { header: 'BIOS Version', key: 'bios_version' },
          { header: 'SCM FPGA', key: 'scm_fpga_version' },
          { header: 'HPM FPGA', key: 'hpm_fpga_version' },
          { header: 'BMC Version', key: 'bmc_version' }
        ]
      },
      {
        title: 'Quality Indicator',
        columns: [
          { header: 'Problem Description', key: 'problem_description' },
          { header: 'FPY Status', key: 'fpy_status' },
          { header: 'Failure Mode', key: 'failure_modes_combined' },
          { header: 'Failure Category', key: 'failure_categories_combined' },
          { header: 'Rework', key: 'has_rework' }
        ]
      },
      {
        title: 'MISC',
        columns: [
          { header: 'Notes', key: 'master_notes' },
          { header: 'SMS Order', key: 'sms_order' },
          { header: 'Cost Center', key: 'cost_center' },
          { header: 'Capitalization', key: 'capitalization' },
          { header: 'Build Date', key: 'build_date' },
          { header: 'Delivery Date', key: 'delivery_date' },
          { header: 'Status', key: 'master_status' }
        ]
      }
    ];

    // Create title row (first row)
    const titleRow = [];
    let currentCol = 0;
    sections.forEach(section => {
      titleRow[currentCol] = section.title;
      // Fill remaining columns for this section with empty strings
      for (let i = 1; i < section.columns.length; i++) {
        titleRow[currentCol + i] = '';
      }
      currentCol += section.columns.length;
    });
    wsData.push(titleRow);

    // Create header row (second row)
    const headerRow = [];
    sections.forEach(section => {
      section.columns.forEach(col => {
        headerRow.push(col.header);
      });
    });
    wsData.push(headerRow);

    // Process each build and create data rows
    buildsWithDetails.forEach(build => {
      const row = [];
      
      sections.forEach(section => {
        section.columns.forEach(col => {
          let value = '';
          
          // Handle special cases
          switch (col.key) {
            case 'dimm_sns_combined':
              // Combine all DIMM S/Ns into one cell
              value = build.dimmSNs ? build.dimmSNs.join(', ') : '';
              break;
              
            case 'failure_modes_combined':
              // Combine all failure modes into one cell
              if (build.failures && build.failures.length > 0) {
                value = build.failures.map(f => f.failure_mode || f.mode).filter(Boolean).join(', ');
              }
              break;
              
            case 'failure_categories_combined':
              // Combine all failure categories into one cell
              if (build.failures && build.failures.length > 0) {
                value = build.failures.map(f => f.failure_category || f.category).filter(Boolean).join(', ');
              }
              break;
              
            case 'delivery_date':
              // Format delivery date
              if (build.delivery_date) {
                const date = new Date(build.delivery_date);
                if (!isNaN(date.getTime())) {
                  value = date.toISOString().split('T')[0]; // YYYY-MM-DD format
                }
              }
              break;
              
            case 'build_date':
              // Format build date (same as created date)
              if (build.created_at) {
                const date = new Date(build.created_at);
                if (!isNaN(date.getTime())) {
                  value = date.toISOString().split('T')[0]; // YYYY-MM-DD format
                }
              }
              break;
              
            case 'has_rework':
              // Format rework status to include count
              if (build.has_rework === 'Yes') {
                value = `Yes (${build.rework_count || 0})`;
              } else {
                value = 'No';
              }
              break;
              
            default:
              // Default case - get value from build object
              value = build[col.key] || '';
              break;
          }
          
          row.push(value);
        });
      });
      
      wsData.push(row);
    });

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Set column widths
    const totalCols = sections.reduce((sum, section) => sum + section.columns.length, 0);
    const colWidths = [];
    
    let colIndex = 0;
    sections.forEach(section => {
      section.columns.forEach(col => {
        // Calculate width based on header length and content
        const headerLength = col.header.length;
        const maxContentLength = Math.max(
          ...wsData.slice(2).map(row => String(row[colIndex] || '').length)
        );
        const width = Math.max(headerLength + 2, maxContentLength + 2, 10);
        colWidths.push({ wch: Math.min(width, 50) }); // Cap at 50 characters
        colIndex++;
      });
    });
    
    ws['!cols'] = colWidths;

    // Merge cells for section titles
    const merges = [];
    let startCol = 0;
    sections.forEach(section => {
      const endCol = startCol + section.columns.length - 1;
      if (section.columns.length > 1) {
        merges.push({
          s: { r: 0, c: startCol },
          e: { r: 0, c: endCol }
        });
      }
      startCol += section.columns.length;
    });
    ws['!merges'] = merges;

    // Style the title row (first row)
    for (let c = 0; c < totalCols; c++) {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c });
      if (!ws[cellRef]) ws[cellRef] = { v: '', t: 's' };
      ws[cellRef].s = {
        font: { bold: true, color: { rgb: "FFFFFF" }, size: 12 },
        fill: { fgColor: { rgb: "366092" } },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } }
        }
      };
    }

    // Style the header row (second row)
    for (let c = 0; c < totalCols; c++) {
      const cellRef = XLSX.utils.encode_cell({ r: 1, c });
      if (!ws[cellRef]) ws[cellRef] = { v: '', t: 's' };
      ws[cellRef].s = {
        font: { bold: true, color: { rgb: "000000" }, size: 11 },
        fill: { fgColor: { rgb: "D9E1F2" } },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } }
        }
      };
    }

    // Add borders to data rows
    for (let r = 2; r < wsData.length; r++) {
      for (let c = 0; c < totalCols; c++) {
        const cellRef = XLSX.utils.encode_cell({ r, c });
        if (!ws[cellRef]) ws[cellRef] = { v: '', t: 's' };
        if (!ws[cellRef].s) ws[cellRef].s = {};
        ws[cellRef].s.border = {
          top: { style: "thin", color: { rgb: "CCCCCC" } },
          bottom: { style: "thin", color: { rgb: "CCCCCC" } },
          left: { style: "thin", color: { rgb: "CCCCCC" } },
          right: { style: "thin", color: { rgb: "CCCCCC" } }
        };
      }
    }

    // Set row heights
    ws['!rows'] = [
      { hpx: 25 }, // Title row height
      { hpx: 20 }  // Header row height
    ];

    // Add autofilter starting from the header row
    ws['!autofilter'] = { 
      ref: XLSX.utils.encode_range({
        s: { r: 1, c: 0 },
        e: { r: wsData.length - 1, c: totalCols - 1 }
      })
    };

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Master Build Data');

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `Master_Build_Data_${timestamp}.xlsx`;

    // Write and download the file
    XLSX.writeFile(wb, filename, { bookType: 'xlsx', type: 'binary' });

    console.log(`Excel file exported successfully: ${filename}`);

  } catch (error) {
    console.error('Error exporting to Excel:', error);
    alert('Failed to export to Excel. Please try again.');
  }
};