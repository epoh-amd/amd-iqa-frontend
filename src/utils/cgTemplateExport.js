// frontend/src/utils/cgTemplateExport.js

import * as XLSX from 'xlsx';

/**
 * Format MAC address by inserting colons every 2 characters
 * @param {string} mac - MAC address without colons
 * @returns {string} - MAC address with colons (e.g., "00:00:1A:1F:D8:F6")
 */
const formatMacAddress = (mac) => {
  if (!mac || mac.length !== 12) return mac || '';
  return mac.match(/.{1,2}/g).join(':');
};

/**
 * Extract location before colon if colon exists
 * @param {string} location - Location string that may contain colon
 * @returns {string} - Location text before colon, or full location if no colon
 */
const extractLocationBeforeColon = (location) => {
  if (!location) return '';
  const colonIndex = location.indexOf(':');
  return colonIndex !== -1 ? location.substring(0, colonIndex).trim() : location;
};

/**
 * Map project name to export value
 * @param {string} projectName - Project name from database
 * @returns {string} - Mapped project name for export
 */
const mapProjectNameForExport = (projectName) => {
  if (!projectName) return '';

  // Map Weisshorn projects to Venice
  if (projectName === 'Weisshorn SP7' || projectName === 'Weisshorn SP8') {
    return 'Venice';
  }

  // Return original value for other projects
  return projectName;
};

/**
 * Map System P/N to UDF_Backplane value
 * @param {string} systemPN - System part number
 * @returns {string} - Corresponding backplane type
 */
const getBackplaneFromSystemPN = (systemPN) => {
  if (!systemPN) return '';
  
  // Define the mapping based on your specifications
  const backplaneMapping = {
    '019KENYA11-F000': 'NVMe',
    '019NGRIA13-F000': 'Nigeria MAXIO1 CXL',
    '019NGRIA14-F000': 'Nigeria MAXIO2.1 U.2',
    '019KENYA10-F000': 'Kenya MAXIO1 CXL',
    '019KENYA12-F000': 'Kenya MAXIO2.2 E3.S'
  };
  
  // Clean the system PN and check for exact match
  const cleanSystemPN = systemPN.trim().toUpperCase();
  
  // Check for exact match first
  for (const [pn, backplane] of Object.entries(backplaneMapping)) {
    if (cleanSystemPN === pn.toUpperCase()) {
      return backplane;
    }
  }
  
  // If no exact match, try partial matching (in case of variations)
  for (const [pn, backplane] of Object.entries(backplaneMapping)) {
    if (cleanSystemPN.includes(pn.toUpperCase()) || pn.toUpperCase().includes(cleanSystemPN)) {
      return backplane;
    }
  }
  
  // Return empty string if no match found
  return '';
};

/**
 * Generate CG template XML file from selected builds
 * @param {Array} selectedBuilds - Array of selected build objects with master data
 * @returns {void} - Downloads XML file
 */
export const generateCGTemplateXML = (selectedBuilds) => {
  if (!selectedBuilds || selectedBuilds.length === 0) {
    alert('No builds selected for export');
    return;
  }
  
  // Create XML structure
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<CGTemplate>\n';
  xml += '  <Metadata>\n';
  xml += `    <ExportDate>${new Date().toISOString()}</ExportDate>\n`;
  xml += `    <TotalBuilds>${selectedBuilds.length}</TotalBuilds>\n`;
  xml += '  </Metadata>\n';
  xml += '  <Builds>\n';
  
  // Add each build as an XML element
  selectedBuilds.forEach((build, index) => {
    xml += '    <Build>\n';
    xml += `      <keys>Name</keys>\n`;
    xml += `      <UDF_projectname>${escapeXml(mapProjectNameForExport(build.project_name))}</UDF_projectname>\n`;
    xml += `      <Name>${escapeXml(build.bmc_name || '')}</Name>\n`;
    xml += `      <UDF_MotherBoardSN>${escapeXml(build.mb_sn || '')}</UDF_MotherBoardSN>\n`;
    xml += `      <UDF_PlatformRev>${escapeXml(extractPlatformRev(build.platform_type))}</UDF_PlatformRev>\n`;
    xml += `      <UDF_PlatformType>${escapeXml(extractPlatformType(build.bmc_name))}</UDF_PlatformType>\n`;
    xml += `      <Socket>${escapeXml(build.cpu_socket || '')}</Socket>\n`;
    xml += `      <LabReworkID></LabReworkID>\n`;
    xml += `      <LabReworkName></LabReworkName>\n`;
    xml += `      <UDF_ChassisName>${escapeXml(build.chassis_type || '')}</UDF_ChassisName>\n`;
    xml += `      <UDF_ChassisSN>${escapeXml(build.chassis_sn || '')}</UDF_ChassisSN>\n`;
    xml += `      <UDF_Backplane>${escapeXml(getBackplaneFromSystemPN(build.system_pn))}</UDF_Backplane>\n`;
    xml += `      <MACAddress>${escapeXml(formatMacAddress(build.ethernet_mac))}</MACAddress>\n`;
    xml += `      <UDF_BMCMac>${escapeXml(formatMacAddress(build.bmc_mac))}</UDF_BMCMac>\n`;
    xml += `      <UDF_BMC>${escapeXml(build.bmc_name ? `${build.bmc_name}.amd.com` : '')}</UDF_BMC>\n`;
    xml += `      <PDU_IP></PDU_IP>\n`;
    xml += `      <PFU_Port></PFU_Port>\n`;
    xml += `      <PDU_IP2></PDU_IP2>\n`;
    xml += `      <PDU_Port2></PDU_Port2>\n`;
    xml += `      <PDU_Vendor></PDU_Vendor>\n`;
    xml += `      <PDU_Details></PDU_Details>\n`;
    xml += `      <Status>Available</Status>\n`;
    xml += `      <Location>${escapeXml(extractLocationBeforeColon(build.master_location) || '')}</Location>\n`;
    xml += `      <AssetType>Systems</AssetType>\n`;
    xml += `      <AssetModel>AMD Server</AssetModel>\n`;
    xml += `      <SecurityTeam>${escapeXml(build.team_security || '')}</SecurityTeam>\n`;
    xml += `      <Department>${escapeXml(extractLocationBeforeColon(build.department) || '')}</Department>\n`;
    xml += `      <Workflow>AMD_Server</Workflow>\n`;
    xml += `      <EditorLayout>Systems</EditorLayout>\n`;
    xml += '    </Build>\n';
  });
  
  xml += '  </Builds>\n';
  xml += '</CGTemplate>';
  
  // Create and download the XML file
  const blob = new Blob([xml], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  
  // Generate filename with timestamp
  const timestamp = new Date().toISOString().slice(0, 10);
  link.download = `CG_Template_${timestamp}.xml`;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Escape special XML characters
 * @param {string} str - String to escape
 * @returns {string} - Escaped string
 */
const escapeXml = (str) => {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

/**
 * Show format selection dialog and generate appropriate file
 * @param {Array} selectedBuilds - Array of selected build objects with master data
 * @returns {void} - Downloads file in selected format
 */
export const generateCGTemplateWithFormat = (selectedBuilds) => {
  // Create a custom dialog for format selection
  const formatDialog = document.createElement('div');
  formatDialog.innerHTML = `
    <div style="
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      z-index: 10000;
      min-width: 300px;
    ">
      <h3 style="margin: 0 0 20px 0; color: #333;">Select Export Format</h3>
      <p style="margin: 0 0 20px 0; color: #666;">Choose the format for your CG Template export:</p>
      <div style="display: flex; gap: 10px; justify-content: center;">
        <button id="xlsx-btn" style="
          padding: 10px 20px;
          background-color: #28a745;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
        ">
          Excel (.xlsx)
        </button>
        <button id="xml-btn" style="
          padding: 10px 20px;
          background-color: #17a2b8;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
        ">
          XML (.xml)
        </button>
        <button id="cancel-btn" style="
          padding: 10px 20px;
          background-color: #6c757d;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        ">
          Cancel
        </button>
      </div>
    </div>
    <div style="
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      z-index: 9999;
    "></div>
  `;
  
  document.body.appendChild(formatDialog);
  
  // Track if dialog is already closed to prevent multiple removals
  let dialogClosed = false;
  
  // Add event listeners
  const xlsxBtn = formatDialog.querySelector('#xlsx-btn');
  const xmlBtn = formatDialog.querySelector('#xml-btn');
  const cancelBtn = formatDialog.querySelector('#cancel-btn');
  const backdrop = formatDialog.querySelector('div:last-child');
  
  const closeDialog = () => {
    // Prevent multiple calls to closeDialog
    if (dialogClosed) return;
    dialogClosed = true;
    
    // Check if the dialog is still in the DOM before removing
    if (formatDialog && formatDialog.parentNode === document.body) {
      document.body.removeChild(formatDialog);
    }
    
    // Remove keyboard event listener
    document.removeEventListener('keydown', handleKeyDown);
  };
  
  // Add keyboard event listener for Escape key
  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      closeDialog();
    }
  };
  
  document.addEventListener('keydown', handleKeyDown);
  
  xlsxBtn.addEventListener('click', () => {
    closeDialog();
    // Use setTimeout to ensure dialog is removed before starting download
    setTimeout(() => {
      generateCGTemplate(selectedBuilds);
    }, 50);
  });
  
  xmlBtn.addEventListener('click', () => {
    closeDialog();
    // Use setTimeout to ensure dialog is removed before starting download
    setTimeout(() => {
      generateCGTemplateXML(selectedBuilds);
    }, 50);
  });
  
  cancelBtn.addEventListener('click', closeDialog);
  backdrop.addEventListener('click', closeDialog);
  
  // Add hover effects with error handling
  [xlsxBtn, xmlBtn, cancelBtn].forEach(btn => {
    btn.addEventListener('mouseenter', () => {
      if (btn && btn.style) {
        btn.style.opacity = '0.9';
      }
    });
    btn.addEventListener('mouseleave', () => {
      if (btn && btn.style) {
        btn.style.opacity = '1';
      }
    });
  });
};

/**
 * Extract platform revision from platform type string
 * @param {string} platformType - Full platform type string
 * @returns {string} - Extracted platform revision (without spaces)
 */
const extractPlatformRev = (platformType) => {
  if (!platformType) return '';
  
  // Remove "Sys:" prefix if present
  const cleanedType = platformType.replace(/^Sys:\s*/, '');
  
  // Split by common delimiters
  const parts = cleanedType.split(/[\s,\-]+/).map(p => p.trim());
  
  // Define revision patterns in order of priority
  const revPatterns = [
    // Specific revision formats
    /^(EVT\d*|DVT\d*|PVT\d*|MP\d*)$/i,  // EVT, EVT2, DVT1, PVT1, MP1, etc.
    /^(Alpha|Beta|Gamma|Delta|Omega)$/i,  // Greek letters
    /^Rev\s*([A-Z0-9]+)$/i,  // Rev A, Rev B, Rev 1, etc. - CAPTURE GROUP ADDED
    /^(ES\d*|CS\d*|QS\d*)$/i,  // Engineering/Customer/Qualification Samples
    /^(Proto\d*|Prototype\d*)$/i,  // Prototype versions
    /^(POC\d*|MVP\d*)$/i,  // Proof of Concept, Minimum Viable Product
    /^V\d+$/i,  // V1, V2, etc.
  ];
  
  // First, try to find exact matches in the parts
  for (const part of parts) {
    for (let i = 0; i < revPatterns.length; i++) {
      const pattern = revPatterns[i];
      const match = part.match(pattern);
      if (match) {
        // Special handling for Rev pattern to remove space
        if (i === 2 && match[1]) { // Rev pattern index
          return `Rev${match[1]}`;
        }
        return match[1] || match[0];
      }
    }
  }
  
  // Handle special cases where revision might be part of a larger word
  // Example: "Seagull PVT1 2P" - extract PVT1
  const specialPatterns = [
    /\b(EVT\d*|DVT\d*|PVT\d*|MP\d*)\b/i,
    /\b(Alpha|Beta|Gamma|Delta|Omega)\b/i,
    /\bRev\s*([A-Z0-9]+)\b/i,  // CAPTURE GROUP ADDED for Rev pattern
    /\b(ES\d*|CS\d*|QS\d*)\b/i,
    /\b(Proto\d*|Prototype\d*)\b/i,
    /\b(POC\d*|MVP\d*)\b/i,
    /\b(V\d+)\b/i,
  ];
  
  for (let i = 0; i < specialPatterns.length; i++) {
    const pattern = specialPatterns[i];
    const match = cleanedType.match(pattern);
    if (match) {
      // Special handling for Rev pattern to remove space
      if (i === 2 && match[1]) { // Rev pattern index
        return `Rev${match[1]}`;
      }
      return match[1] || match[0];
    }
  }
  
  // If no pattern matches, check if there's a version-like string after the product name
  // Example: "Seagull PVT1" -> PVT1
  const productRevMatch = cleanedType.match(/^\w+\s+(EVT\d*|DVT\d*|PVT\d*|Alpha|Beta|Gamma|Rev\s*([A-Z0-9]+))/i);
  if (productRevMatch) {
    // Special handling for Rev pattern to remove space
    if (productRevMatch[0].includes('Rev') && productRevMatch[2]) {
      return `Rev${productRevMatch[2]}`;
    }
    return productRevMatch[1];
  }
  
  // FALLBACK: Extract the word after the system name (bird names)
  // Common AMD system names (bird names and other codenames)
  const systemNames = [
    // Bird names
    'Seagull', 'Eagle', 'Hawk', 'Falcon', 'Sparrow', 'Raven', 'Phoenix', 'Owl',
    'Pelican', 'Vulture', 'Condor', 'Albatross', 'Crane', 'Heron', 'Stork',
    'Flamingo', 'Peacock', 'Penguin', 'Parrot', 'Pigeon', 'Dove', 'Swan',
    'Canary', 'Cardinal', 'Bluejay', 'Robin', 'Crow', 'Magpie', 'Finch',
    // Geographic/Country names
    'Zambia', 'Congo', 'Kenya', 'Morocco', 'Ghana', 'Nigeria', 'Egypt',
    'Tunisia', 'Algeria', 'Sudan', 'Ethiopia', 'Tanzania', 'Uganda',
    'Zimbabwe', 'Mozambique', 'Angola', 'Namibia', 'Botswana',
    // Other potential codenames
    'Thunder', 'Lightning', 'Storm', 'Blizzard', 'Tornado', 'Hurricane',
    'Avalanche', 'Glacier', 'Volcano', 'Tsunami', 'Earthquake'
  ];
  
  // Create regex pattern to match system name followed by the next word
  const systemNamePattern = new RegExp(`\\b(${systemNames.join('|')})\\s+(\\w+)`, 'i');
  const systemMatch = cleanedType.match(systemNamePattern);
  
  if (systemMatch && systemMatch[2]) {
    // Return the word after the system name, but exclude common non-revision words
    const excludeWords = ['SP7', 'SP8', 'SP6', '2P', '1P', '4P', 'PRB', 'VRB', 'CRB'];
    const nextWord = systemMatch[2];
    
    if (!excludeWords.includes(nextWord.toUpperCase())) {
      return nextWord;
    }
  }
  
  // If still no match, return empty string
  return '';
};

/**
 * Extract platform type (first word) from BMC name
 * @param {string} bmcName - BMC name (e.g., "Kenya-0021")
 * @returns {string} - First part of BMC name (e.g., "Kenya")
 */
const extractPlatformType = (bmcName) => {
  if (!bmcName) return '';
  // Split by hyphen and take the first part
  const parts = bmcName.split('-');
  return parts[0] || '';
};

/**
 * Generate CG template Excel file from selected builds
 * @param {Array} selectedBuilds - Array of selected build objects with master data
 * @returns {void} - Downloads Excel file
 */
export const generateCGTemplate = (selectedBuilds) => {
  if (!selectedBuilds || selectedBuilds.length === 0) {
    alert('No builds selected for export');
    return;
  }
  
  // Create worksheet data
  const wsData = [];
  
  // Add header row
  const headers = [
    'keys',
    'UDF_projectname',
    'Name',
    'UDF_MotherBoardSN',
    'UDF_PlatformRev',
    'UDF_PlatformType',
    'Socket',
    'LabRework ID',
    'LabReworkName',
    'UDF_ChassisName',
    'UDF_ChassisSN',
    'UDF_Backplane',
    'MACAddress',
    'UDF_BMCMac',
    'UDF_BMC',
    'PDU IP',
    'PFU Port',
    'PDU IP2',
    'PDU Port2',
    'PDU Vendor',
    'PDU Details',
    'Status',
    'Location',
    'Asset Type',
    'Asset Model',
    'Security Team',
    'Department',
    'Workflow',
    'EditorLayout'
  ];
  
  wsData.push(headers);
  
  // Add data rows for each selected build
  selectedBuilds.forEach(build => {
    const row = [
      'Name', // keys
      mapProjectNameForExport(build.project_name), // UDF_projectname
      build.bmc_name || '', // Name
      build.mb_sn || '', // UDF_MotherBoardSN
      extractPlatformRev(build.platform_type), // UDF_PlatformRev
      extractPlatformType(build.bmc_name), // UDF_PlatformType
      build.cpu_socket || '', // Socket
      '', // LabRework ID (blank)
      '', // LabReworkName (blank)
      build.chassis_type || '', // UDF_ChassisName
      build.chassis_sn || '', // UDF_ChassisSN
      getBackplaneFromSystemPN(build.system_pn), // UDF_Backplane
      formatMacAddress(build.ethernet_mac), // MACAddress
      formatMacAddress(build.bmc_mac), // UDF_BMCMac
      build.bmc_name ? `${build.bmc_name}.amd.com` : '', // UDF_BMC
      '', // PDU IP (blank)
      '', // PFU Port (blank)
      '', // PDU IP2 (blank)
      '', // PDU Port2 (blank)
      '', // PDU Vendor (blank)
      '', // PDU Details (blank)
      'Available', // Status
      extractLocationBeforeColon(build.master_location) || '', // Location from master_builds
      'Systems', // Asset Type
      'AMD Server', // Asset Model
      build.team_security || '', // Security Team from master_builds
      extractLocationBeforeColon(build.department) || '', // Department from master_builds
      'AMD_Server', // Workflow
      'Systems' // EditorLayout
    ];
    
    wsData.push(row);
  });
  
  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  
  // Auto-size columns
  const colWidths = headers.map((header, i) => {
    const columnData = wsData.map(row => row[i] || '');
    const maxLength = Math.max(...columnData.map(val => String(val).length));
    return { wch: Math.max(maxLength + 2, 10) }; // minimum width of 10
  });
  ws['!cols'] = colWidths;
  
  // Define the table range
  const range = XLSX.utils.decode_range(ws['!ref']);
  
  // Create table object
  ws['!autofilter'] = { ref: ws['!ref'] };
  
  // Style the header row (basic formatting)
  const headerStyle = {
    font: { bold: true },
    fill: { fgColor: { rgb: "4472C4" } },
    alignment: { horizontal: "center", vertical: "center" }
  };
  
  // Apply table formatting
  // Note: XLSX-js doesn't support full Excel table formatting, but we can add autofilter
  // For true Excel table format, we'll use a workaround with autofilter and styling
  
  // Add borders and basic styling information
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const address = XLSX.utils.encode_col(C) + "1";
    if (!ws[address]) continue;
    
    // Add basic cell styling (note: styling support is limited in xlsx package)
    ws[address].s = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "4472C4" } },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } }
      }
    };
  }
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'CG Template');
  
  // Generate filename with timestamp
  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `CG_Template_${timestamp}.xlsx`;
  
  // Write and download the file with bookType xlsx to ensure compatibility
  XLSX.writeFile(wb, filename, { bookType: 'xlsx', type: 'binary' });
};

// Helper function to validate if all required master data is present
export const validateMasterDataForCG = (selectedBuilds) => {
  const missingData = [];
  
  // Check if selectedBuilds exists and is an array
  if (!selectedBuilds || !Array.isArray(selectedBuilds)) {
    console.error('validateMasterDataForCG: selectedBuilds is not a valid array', selectedBuilds);
    return missingData;
  }
  
  selectedBuilds.forEach(build => {
    const missing = [];
    if (!build.master_location) missing.push('Location');
    if (!build.team_security) missing.push('Team/Security');
    
    if (missing.length > 0) {
      missingData.push({
        chassisSN: build.chassis_sn,
        bmcName: build.bmc_name || build.chassis_sn,
        missing: missing
      });
    }
  });
  
  return missingData;
};