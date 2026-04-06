import React, { useRef, useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import api from '../../services/api';

import { 
  faBarcode,
  faCheck,
  faExclamationTriangle,
  faCamera,
  faTrash,
  faChevronDown
} from '@fortawesome/free-solid-svg-icons';




const SystemInfoTable = ({
  builds,
  setBuilds,
  systemInfoSubStep,
  showReview,
  handleInputChange,
  partNumberSuggestions,
  scannerRefs,
  selectedField,
  setSelectedField,
  selectedBuildIndex,
  setSelectedBuildIndex,
  handleFileSelection,
  removePhoto,
  // Part number search props
  partNumberSearch,
  showPartNumberDropdown,
  setShowPartNumberDropdown,
  handlePartNumberSearchChange,
  selectPartNumber,
  // Edit mode flag
  isEditMode = false
}) => {
  
  const [projects, setProjects] = useState([]);
useEffect(() => {
  const fetchProjects = async () => {
    try {
      const data = await api.getProjects();
      setProjects(data);
    } catch (error) {
      console.error("Failed to load projects:", error);
    }
  };

  fetchProjects();
}, []);

  // Store references to currently focused input elements
  const activeInputRefs = useRef({});
  
  // Helper function to get build reference (BMC Name or Build #) - CONSISTENT WITH OTHER TABLES
  const getBuildReference = (build, buildIndex) => {
    return build.systemInfo?.bmcName || `Build ${buildIndex + 1}`;
  };

  // Enhanced scanner input handler with better focus management
  const handleScannerFocus = (buildIndex, field, dimmIndex = null) => {
    setSelectedBuildIndex(buildIndex);
    
    if (field === 'dimmSN' && dimmIndex !== null) {
      setSelectedField(`${field}-${dimmIndex}`);
    } else {
      setSelectedField(field);
    }
  };

  // Enhanced scanner input with barcode detection
  const handleScannerInput = (buildIndex, field, value, event, dimmIndex = null) => {
    // Call the enhanced input change handler from useBuildsState
    handleInputChange(buildIndex, 'systemInfo', field, value, dimmIndex);
  };

  // Handle keyboard navigation for scanner fields
  const handleKeyDown = (event, buildIndex, field, dimmIndex = null) => {
    // Allow normal keyboard shortcuts
    if (event.ctrlKey || event.altKey || event.metaKey) {
      return;
    }

    // Handle Enter key for quick navigation
    if (event.key === 'Enter') {
      event.preventDefault();
      
      // Trigger navigation logic if there's a value
      const currentValue = event.target.value;
      if (currentValue && currentValue.trim()) {
        // The enhanced handleInputChange will handle navigation automatically
        handleScannerInput(buildIndex, field, currentValue, event, dimmIndex);
      }
    }
  };

  // Simple positioning for fixed dropdown above input
  const positionDropdown = (buildIndex, type) => {
    const inputElement = activeInputRefs.current[`${type}-${buildIndex}`];
    const dropdownElement = document.querySelector(`[data-dropdown="${type}-${buildIndex}"]`);

    if (inputElement && dropdownElement) {
      const inputRect = inputElement.getBoundingClientRect();

      // Position dropdown so its bottom edge touches the input top edge (no gap)
      dropdownElement.style.top = `${inputRect.top - 200}px`;
      dropdownElement.style.left = `${inputRect.left}px`;
      dropdownElement.style.width = `${inputRect.width}px`;
    }
  };

  // Handle dropdown focus
  const handleDropdownFocus = (buildIndex, type, event) => {
    // Store the input element reference
    activeInputRefs.current[`${type}-${buildIndex}`] = event.target;

    setShowPartNumberDropdown(prev => ({
      ...prev,
      [type]: { ...prev[type], [buildIndex]: true }
    }));

    // Position dropdown after it's shown
    setTimeout(() => positionDropdown(buildIndex, type), 10);
  };

  // Handle input change
  const handleInputChangeWithPosition = (buildIndex, type, value, event) => {
    // Store/update the input element reference
    activeInputRefs.current[`${type}-${buildIndex}`] = event.target;

    // Call original search handler
    handlePartNumberSearchChange(buildIndex, type, value);

    // Show dropdown when typing
    setShowPartNumberDropdown(prev => ({
      ...prev,
      [type]: { ...prev[type], [buildIndex]: true }
    }));

    // Position dropdown after content updates
    setTimeout(() => positionDropdown(buildIndex, type), 10);
  };

  // Handle dropdown blur
  const handleDropdownBlur = (buildIndex, type) => {
    setTimeout(() => {
      setShowPartNumberDropdown(prev => ({
        ...prev,
        [type]: { ...prev[type], [buildIndex]: false }
      }));
    }, 150);
  };

  return (
    <div className="builds-table-container">
      <table className="builds-table">
        <thead>
          <tr>
            <th className="build-reference">Build Reference</th>
            
            {/* Chassis Information */}
            {systemInfoSubStep === 'chassisInfo' && (
              <>
                <th>Project Name</th>
                <th>System P/N</th>
                <th>Chassis S/N</th>
                <th>Jira Ticket No</th>
                <th>PO</th>
                <th>BMC MAC</th>
                <th>MB S/N</th>
                <th>Ethernet MAC</th>
                <th>CPU Socket</th>
                <th>CPU Vendor</th>
                {showReview && (
                  <>
                    <th>Platform Type</th>
                    <th>Manufacturer</th>
                    <th>Chassis Type</th>
                    <th>BMC Name</th>
                  </>
                )}
              </>
            )}
            
            {/* CPU Information */}
            {systemInfoSubStep === 'cpuInfo' && (
              <>
                <th>CPU Program Name</th>
                <th>CPU P0 S/N (Optional)</th>
                <th>P0 Socket Date Code (Optional)</th>
                <th>CPU P1 S/N (Optional)</th>
                <th>P1 Socket Date Code (Optional)</th>
              </>
            )}
            
            {/* Component Information */}
            {systemInfoSubStep === 'componentInfo' && (
              <>
                <th>M.2 P/N</th>
                <th>M.2 S/N</th>
                {showReview && <th>DIMM P/N</th>}
                <th>DIMM QTY</th>
                {/* Dynamic DIMM S/N headers based on quantity */}
                    {builds.length > 0 && Array.from(
                      { length: Math.max(...builds.map(b => parseInt(b.systemInfo.dimmQty) || 0)) },
                      (_, i) => <th key={`dimm-sn-header-${i}`}>DIMM S/N #{i + 1}</th>
                    )}
                  </>
                )}
            
            {/* Testing */}
            {systemInfoSubStep === 'testing' && (
              <>
                <th>Visual Inspection</th>
                <th>Boot to OS/Shell</th>
                <th>DIMMs Detected</th>
                <th>LOM Working</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {builds.map((build, buildIndex) => (
            <tr key={build.id} className={`build-row ${build.status}`}>
              <td className="build-reference">{getBuildReference(build, buildIndex)}</td>

              {/* Chassis Information */}
              {systemInfoSubStep === 'chassisInfo' && (
                <>
                  <td>
                    <select
                      value={build.systemInfo.projectName}
                      onChange={(e) =>
                        handleInputChange(buildIndex, 'systemInfo', 'projectName', e.target.value)
                      }
                      className={build.errors.projectName ? 'error' : ''}
                    >
                      <option value="">Select Project</option>
                    
                      {projects.map((project, index) => (
                        <option key={index} value={project}>
                          {project}
                        </option>
                      ))}
                    </select>
                    {build.errors.projectName && (
                      <div className="field-error">{build.errors.projectName}</div>
                    )}
                  </td>
                  
                  <td>
                    <div className="scanner-input">
                      <input
                        ref={scannerRefs.current[`systemPN-${buildIndex}`]}
                        type="text"
                        value={build.systemInfo.systemPN}
                        onChange={!isEditMode ? (e) => handleScannerInput(buildIndex, 'systemPN', e.target.value, e) : undefined}
                        onFocus={!isEditMode ? () => handleScannerFocus(buildIndex, 'systemPN') : undefined}
                        onKeyDown={!isEditMode ? (e) => handleKeyDown(e, buildIndex, 'systemPN') : undefined}
                        placeholder="Scan System P/N"
                        className={`scanner-field ${build.errors.systemPN ? 'error' : ''}`}
                        autoComplete="off"
                        inputMode="text"
                        spellCheck="false"
                        readOnly={isEditMode}
                        style={isEditMode ? { backgroundColor: '#f8f9fa', cursor: 'not-allowed' } : {}}
                      />
                      <FontAwesomeIcon icon={faBarcode} className="scanner-icon" />
                    </div>
                    {build.errors.systemPN && (
                      <div className="field-error">{build.errors.systemPN}</div>
                    )}
                  </td>

                  <td>
                    <div className="scanner-input">
                      <input
                        ref={scannerRefs.current[`chassisSN-${buildIndex}`]}
                        type="text"
                        value={build.systemInfo.chassisSN}
                        onChange={!isEditMode ? (e) => handleScannerInput(buildIndex, 'chassisSN', e.target.value, e) : undefined}
                        onFocus={!isEditMode ? () => handleScannerFocus(buildIndex, 'chassisSN') : undefined}
                        onKeyDown={!isEditMode ? (e) => handleKeyDown(e, buildIndex, 'chassisSN') : undefined}
                        placeholder="Scan Chassis S/N"
                        className={`scanner-field ${build.errors.chassisSN ? 'error' : ''}`}
                        autoComplete="off"
                        inputMode="text"
                        spellCheck="false"
                        readOnly={isEditMode}
                        style={isEditMode ? { backgroundColor: '#f8f9fa', cursor: 'not-allowed' } : {}}
                      />
                      <FontAwesomeIcon icon={faBarcode} className="scanner-icon" />
                    </div>
                    {build.errors.chassisSN && (
                      <div className="field-error">{build.errors.chassisSN}</div>
                    )}
                  </td>
                  
                  <td>
                    <input
                      type="text"
                      value={build.systemInfo.jiraTicketNo || ''}
                      onChange={(e) => handleInputChange(buildIndex, 'systemInfo', 'jiraTicketNo', e.target.value)}
                      placeholder="Enter Jira Ticket No"
                      className={build.errors.jiraTicketNo ? 'error' : ''}
                    />
                    {build.errors.jiraTicketNo && (
                      <div className="field-error">{build.errors.jiraTicketNo}</div>
                    )}
                  </td>

                  <td>
                    <div className="scanner-input">
                      <input
                        ref={scannerRefs.current[`po-${buildIndex}`]}
                        type="text"
                        value={build.systemInfo.po}
                        onChange={(e) => handleScannerInput(buildIndex, 'po', e.target.value, e)}
                        onFocus={() => handleScannerFocus(buildIndex, 'po')}
                        onKeyDown={(e) => handleKeyDown(e, buildIndex, 'po')}
                        placeholder="Scan PO"
                        className={`scanner-field ${build.errors.po ? 'error' : ''}`}
                        autoComplete="off"
                        inputMode="text"
                        spellCheck="false"
                      />
                      <FontAwesomeIcon icon={faBarcode} className="scanner-icon" />
                    </div>
                    {build.errors.po && (
                      <div className="field-error">{build.errors.po}</div>
                    )}
                  </td>
                  
                  <td>
                    <div className="scanner-input">
                      <input
                        ref={scannerRefs.current[`bmcMac-${buildIndex}`]}
                        type="text"
                        value={build.systemInfo.bmcMac}
                        onChange={(e) => handleScannerInput(buildIndex, 'bmcMac', e.target.value, e)}
                        onFocus={() => handleScannerFocus(buildIndex, 'bmcMac')}
                        onKeyDown={(e) => handleKeyDown(e, buildIndex, 'bmcMac')}
                        placeholder="Scan BMC MAC"
                        className={`scanner-field ${build.errors.bmcMac ? 'error' : ''}`}
                        autoComplete="off"
                        inputMode="text"
                        spellCheck="false"
                      />
                      <FontAwesomeIcon icon={faBarcode} className="scanner-icon" />
                    </div>
                    {build.errors.bmcMac && (
                      <div className="field-error">{build.errors.bmcMac}</div>
                    )}
                  </td>
                  
                  <td>
                    <div className="scanner-input">
                      <input
                        ref={scannerRefs.current[`mbSN-${buildIndex}`]}
                        type="text"
                        value={build.systemInfo.mbSN}
                        onChange={(e) => handleScannerInput(buildIndex, 'mbSN', e.target.value, e)}
                        onFocus={() => handleScannerFocus(buildIndex, 'mbSN')}
                        onKeyDown={(e) => handleKeyDown(e, buildIndex, 'mbSN')}
                        placeholder="Scan MB S/N"
                        className={`scanner-field ${build.errors.mbSN ? 'error' : ''}`}
                        autoComplete="off"
                        inputMode="text"
                        spellCheck="false"
                      />
                      <FontAwesomeIcon icon={faBarcode} className="scanner-icon" />
                    </div>
                    {build.errors.mbSN && (
                      <div className="field-error">{build.errors.mbSN}</div>
                    )}
                  </td>
                  
                  <td>
                    <div className="scanner-input">
                      <input
                        ref={scannerRefs.current[`ethernetMac-${buildIndex}`]}
                        type="text"
                        value={build.systemInfo.ethernetMac}
                        onChange={(e) => handleScannerInput(buildIndex, 'ethernetMac', e.target.value, e)}
                        onFocus={() => handleScannerFocus(buildIndex, 'ethernetMac')}
                        onKeyDown={(e) => handleKeyDown(e, buildIndex, 'ethernetMac')}
                        placeholder="Scan Ethernet MAC"
                        className={`scanner-field ${build.errors.ethernetMac ? 'error' : ''}`}
                        autoComplete="off"
                        inputMode="text"
                        spellCheck="false"
                      />
                      <FontAwesomeIcon icon={faBarcode} className="scanner-icon" />
                    </div>
                    {build.errors.ethernetMac && (
                      <div className="field-error">{build.errors.ethernetMac}</div>
                    )}
                  </td>
                  
                  <td>
                    <select
                      value={build.systemInfo.cpuSocket}
                      onChange={(e) => handleInputChange(buildIndex, 'systemInfo', 'cpuSocket', e.target.value)}
                      className={build.errors.cpuSocket ? 'error' : ''}
                    >
                      <option value="">Select Socket</option>
                      <option value="SP7">SP7</option>
                      <option value="SP8">SP8</option>
                    </select>
                    {build.errors.cpuSocket && (
                      <div className="field-error">{build.errors.cpuSocket}</div>
                    )}
                  </td>
                  
                  <td>
                    <select
                      value={build.systemInfo.cpuVendor || ''}
                      onChange={(e) => handleInputChange(buildIndex, 'systemInfo', 'cpuVendor', e.target.value)}
                      className={build.errors.cpuVendor ? 'error' : ''}
                    >
                      <option value="">Select CPU Vendor</option>
                      <option value="Tyco">Tyco</option>
                      <option value="Foxconn">Foxconn</option>
                      <option value="Lotes">Lotes</option>
                    </select>
                    {build.errors.cpuVendor && (
                      <div className="field-error">{build.errors.cpuVendor}</div>
                    )}
                  </td>
                  
                  {showReview && (
                    <>
                      <td className="auto-populated">{build.systemInfo.platformType || '-'}</td>
                      <td className="auto-populated">{build.systemInfo.manufacturer || '-'}</td>
                      <td className="auto-populated">{build.systemInfo.chassisType || '-'}</td>
                      <td className="auto-populated">{build.systemInfo.bmcName || '-'}</td>
                    </>
                  )}
                </>
              )}

              {/* CPU Information */}
              {systemInfoSubStep === 'cpuInfo' && (
                <>
                  <td>
                    <select
                      value={build.systemInfo.cpuProgramName}
                      onChange={(e) => handleInputChange(buildIndex, 'systemInfo', 'cpuProgramName', e.target.value)}
                      className={build.errors.cpuProgramName ? 'error' : ''}
                    >
                      <option value="">Select Program</option>
                      <option value="Weisshorn">Weisshorn</option>
                    </select>
                    {build.errors.cpuProgramName && (
                      <div className="field-error">{build.errors.cpuProgramName}</div>
                    )}
                  </td>
                  
                  <td>
                    <div className="scanner-input">
                      <input
                        ref={scannerRefs.current[`cpuP0SN-${buildIndex}`]}
                        type="text"
                        value={build.systemInfo.cpuP0SN}
                        onChange={(e) => handleScannerInput(buildIndex, 'cpuP0SN', e.target.value, e)}
                        onFocus={() => handleScannerFocus(buildIndex, 'cpuP0SN')}
                        onKeyDown={(e) => handleKeyDown(e, buildIndex, 'cpuP0SN')}
                        placeholder="Scan CPU P0 S/N (Optional)"
                        className={`scanner-field ${build.errors.cpuP0SN ? 'error' : ''}`}
                        autoComplete="off"
                        inputMode="text"
                        spellCheck="false"
                      />
                        <FontAwesomeIcon icon={faBarcode} className="scanner-icon" />
                      </div>
                      {build.errors.cpuP0SN && (  // ✅ ADD ERROR MESSAGE DISPLAY
                        <div className="field-error">{build.errors.cpuP0SN}</div>
                      )}
                    </td>

                  <td>
                    <div className="scanner-input">
                      <input
                        ref={scannerRefs.current[`cpuP0SocketDateCode-${buildIndex}`]}
                        type="text"
                        value={build.systemInfo.cpuP0SocketDateCode}
                        onChange={(e) => handleScannerInput(buildIndex, 'cpuP0SocketDateCode', e.target.value, e)}
                        onFocus={() => handleScannerFocus(buildIndex, 'cpuP0SocketDateCode')}
                        onKeyDown={(e) => handleKeyDown(e, buildIndex, 'cpuP0SocketDateCode')}
                        placeholder="Enter P0 Socket Date Code (Optional)"
                        className={`scanner-field ${build.errors.cpuP0SocketDateCode ? 'error' : ''}`}
                        autoComplete="off"
                        inputMode="text"
                        spellCheck="false"
                      />
                        <FontAwesomeIcon icon={faBarcode} className="scanner-icon" />
                      </div>
                      {build.errors.cpuP0SocketDateCode && (
                        <div className="field-error">{build.errors.cpuP0SocketDateCode}</div>
                      )}
                    </td>

                  <td>
                    <div className="scanner-input">
                      <input
                        ref={scannerRefs.current[`cpuP1SN-${buildIndex}`]}
                        type="text"
                        value={build.systemInfo.cpuP1SN}
                        onChange={(e) => handleScannerInput(buildIndex, 'cpuP1SN', e.target.value, e)}
                        onFocus={() => handleScannerFocus(buildIndex, 'cpuP1SN')}
                        onKeyDown={(e) => handleKeyDown(e, buildIndex, 'cpuP1SN')}
                        placeholder="Scan CPU P1 S/N (Optional)"
                        className={`scanner-field ${build.errors.cpuP1SN ? 'error' : ''}`}
                        autoComplete="off"
                        inputMode="text"
                        spellCheck="false"
                      />
                        <FontAwesomeIcon icon={faBarcode} className="scanner-icon" />
                      </div>
                      {build.errors.cpuP1SN && (  // ✅ ADD ERROR MESSAGE DISPLAY
                        <div className="field-error">{build.errors.cpuP1SN}</div>
                      )}
                    </td>

                  <td>
                    <div className="scanner-input">
                      <input
                        ref={scannerRefs.current[`cpuP1SocketDateCode-${buildIndex}`]}
                        type="text"
                        value={build.systemInfo.cpuP1SocketDateCode}
                        onChange={(e) => handleScannerInput(buildIndex, 'cpuP1SocketDateCode', e.target.value, e)}
                        onFocus={() => handleScannerFocus(buildIndex, 'cpuP1SocketDateCode')}
                        onKeyDown={(e) => handleKeyDown(e, buildIndex, 'cpuP1SocketDateCode')}
                        placeholder="Enter P1 Socket Date Code (Optional)"
                        className={`scanner-field ${build.errors.cpuP1SocketDateCode ? 'error' : ''}`}
                        autoComplete="off"
                        inputMode="text"
                        spellCheck="false"
                      />
                        <FontAwesomeIcon icon={faBarcode} className="scanner-icon" />
                      </div>
                      {build.errors.cpuP1SocketDateCode && (
                        <div className="field-error">{build.errors.cpuP1SocketDateCode}</div>
                      )}
                    </td>
                </>
              )}

              {/* Component Information */}
              {systemInfoSubStep === 'componentInfo' && (
                <>
                  <td>
                    <div className="part-number-dropdown systeminfo-dropdown-container">
                      {build.systemInfo.m2PNOther ? (
                        // Show custom input field when "Other" is selected
                        <div className="custom-pn-input">
                          <div className="scanner-input">
                            <input
                              ref={scannerRefs.current[`m2PNCustom-${buildIndex}`]}
                              type="text"
                              value={build.systemInfo.m2PNCustom}
                              onChange={(e) => {
                                // Update the custom P/N value
                                const updatedBuilds = [...builds];
                                updatedBuilds[buildIndex].systemInfo.m2PNCustom = e.target.value;
                                updatedBuilds[buildIndex].systemInfo.m2PN = e.target.value;
                                setBuilds(updatedBuilds);
                              }}
                              onFocus={() => handleScannerFocus(buildIndex, 'm2PNCustom')}
                              onBlur={async () => {
                                // Save custom P/N to database
                                const customPN = builds[buildIndex].systemInfo.m2PNCustom;
                                // Save custom P/N to database via parent handler (index.js)
                                if (customPN && customPN.trim() && typeof window.saveCustomM2PN === 'function') {
                                  await window.saveCustomM2PN(buildIndex);
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  // Save and navigate to next field
                                  const customPN = builds[buildIndex].systemInfo.m2PNCustom;
                                  if (customPN && customPN.trim() && typeof window.saveCustomM2PN === 'function') {
                                    window.saveCustomM2PN(buildIndex);
                                  }
                                  // Navigate to M.2 S/N field
                                  handleScannerFocus(buildIndex, 'm2SN');
                                  const m2SNRef = scannerRefs.current[`m2SN-${buildIndex}`];
                                  if (m2SNRef) {
                                    m2SNRef.focus();
                                  }
                                } else {
                                  handleKeyDown(e, buildIndex, 'm2PNCustom');
                                }
                              }}
                              placeholder="Scan or type custom M.2 P/N..."
                              className={`scanner-field ${build.errors.m2PN ? 'error' : ''}`}
                              autoComplete="off"
                              inputMode="text"
                              spellCheck="false"
                            />
                            <FontAwesomeIcon icon={faBarcode} className="scanner-icon" />
                          </div>
                          <button 
                            className="change-selection-btn"
                            onClick={() => {
                              const updatedBuilds = [...builds];
                              updatedBuilds[buildIndex].systemInfo.m2PNOther = false;
                              updatedBuilds[buildIndex].systemInfo.m2PN = '';
                              updatedBuilds[buildIndex].systemInfo.m2PNCustom = '';
                              setBuilds(updatedBuilds);
                            }}
                            title="Back to dropdown"
                          >
                            <FontAwesomeIcon icon={faChevronDown} />
                          </button>
                        </div>
                      ) : (
                        // Show dropdown for regular part number selection
                        <>
                          <input
                            type="text"
                            value={build.systemInfo.m2PN}
                            onChange={(e) => handleInputChangeWithPosition(buildIndex, 'm2PN', e.target.value, e)}
                            onFocus={(e) => handleDropdownFocus(buildIndex, 'm2PN', e)}
                            onBlur={() => handleDropdownBlur(buildIndex, 'm2PN')}
                            placeholder="Type M.2 P/N..."
                            className={build.errors.m2PN ? 'error' : ''}
                          />
                          {build.errors.m2PN && <div className="field-error">{build.errors.m2PN}</div>}
                          {showPartNumberDropdown.m2PN?.[buildIndex] && partNumberSuggestions.m2PN.length > 0 && (
                            <div
                              className="part-dropdown-list systeminfo-dropdown"
                              data-dropdown={`m2PN-${buildIndex}`}
                            >
                              {partNumberSuggestions.m2PN.slice(0, 10).map((pn, idx) => (
                                <div
                                  key={idx}
                                  className={`part-dropdown-item ${pn === 'Other' ? 'other-option' : ''}`}
                                  onMouseDown={() => selectPartNumber(buildIndex, 'm2PN', pn)}
                                >
                                  {pn === 'Other' ? '+ Other (Custom Entry)' : pn}
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                  
                  <td>
                    <div className="scanner-input">
                      <input
                        ref={scannerRefs.current[`m2SN-${buildIndex}`]}
                        type="text"
                        value={build.systemInfo.m2SN}
                        onChange={(e) => handleScannerInput(buildIndex, 'm2SN', e.target.value, e)}
                        onFocus={() => handleScannerFocus(buildIndex, 'm2SN')}
                        onKeyDown={(e) => handleKeyDown(e, buildIndex, 'm2SN')}
                        placeholder="Scan M.2 S/N"
                        className={`scanner-field ${build.errors.m2SN ? 'error' : ''}`}
                        autoComplete="off"
                        inputMode="text"
                        spellCheck="false"
                      />
                      <FontAwesomeIcon icon={faBarcode} className="scanner-icon" />
                    </div>
                    {build.errors.m2SN && (
                      <div className="field-error">{build.errors.m2SN}</div>
                    )}
                  </td>
                  
                  {showReview && (
                    <td>
                      <input
                        type="text"
                        value={build.systemInfo.dimmPN}
                        readOnly={!isEditMode}
                        onChange={isEditMode ? (e) => handleInputChange(buildIndex, 'systemInfo', 'dimmPN', e.target.value) : undefined}
                        placeholder={isEditMode ? "Enter DIMM P/N" : "Auto-populated from DIMM S/N"}
                        className={build.errors.dimmPN ? 'error' : ''}
                        style={!isEditMode ? { backgroundColor: '#f8f9fa', cursor: 'not-allowed' } : {}}
                      />
                      {build.errors.dimmPN && (
                        <div className="field-error">{build.errors.dimmPN}</div>
                      )}
                    </td>
                  )}
                  
                  <td>
                    <input
                      type="number"
                      value={build.systemInfo.dimmQty}
                      onChange={(e) => handleInputChange(buildIndex, 'systemInfo', 'dimmQty', e.target.value)}
                      min="1"
                      max="16"
                      placeholder="QTY"
                      className={build.errors.dimmQty ? 'error' : ''}
                    />
                    {build.errors.dimmQty && (
                      <div className="field-error">{build.errors.dimmQty}</div>
                    )}
                  </td>
                  
                  {/* Dynamic DIMM S/N columns */}
                  {Array.from(
                    { length: parseInt(build.systemInfo.dimmQty) || 0 },
                    (_, i) => (
                      <td key={`dimm-sn-${buildIndex}-${i}`}>
                        <div className="scanner-input">
                          <input
                            ref={scannerRefs.current[`dimmSN-${buildIndex}-${i}`]}
                            type="text"
                            value={build.systemInfo.dimmSNs[i] || ''}
                            onChange={(e) => handleScannerInput(buildIndex, 'dimmSN', e.target.value, e, i)}
                            onFocus={() => handleScannerFocus(buildIndex, 'dimmSN', i)}
                            onKeyDown={(e) => handleKeyDown(e, buildIndex, 'dimmSN', i)}
                            placeholder={`DIMM S/N #${i + 1}`}
                            className={`scanner-field ${build.errors[`dimmSN${i}`] ? 'error' : ''}`}
                            autoComplete="off"
                            inputMode="text"
                            spellCheck="false"
                          />
                          <FontAwesomeIcon icon={faBarcode} className="scanner-icon" />
                        </div>
                        {build.errors[`dimmSN${i}`] && (
                          <div className="field-error">{build.errors[`dimmSN${i}`]}</div>
                        )}
                      </td>
                    )
                  )}
                </>
              )}

              {/* Testing */}
              {systemInfoSubStep === 'testing' && (
                <>
                  <td>
                    <div className="test-field">
                      <select
                        value={build.systemInfo.visualInspection}
                        onChange={(e) => handleInputChange(buildIndex, 'systemInfo', 'visualInspection', e.target.value)}
                        className={build.errors.visualInspection ? 'error' : ''}
                        disabled={isEditMode}
                        style={isEditMode ? { backgroundColor: '#f8f9fa', cursor: 'not-allowed' } : {}}
                      >
                        <option value="">Select</option>
                        <option value="Pass">Pass</option>
                        <option value="Fail">Fail</option>
                      </select>
                      {build.errors.visualInspection && (
                        <div className="field-error">{build.errors.visualInspection}</div>
                      )}
                      {build.systemInfo.visualInspection === 'Fail' && (
                        <div className="test-fail-inputs">
                          <textarea
                            value={build.systemInfo.visualInspectionNotes}
                            onChange={(e) => handleInputChange(buildIndex, 'systemInfo', 'visualInspectionNotes', e.target.value)}
                            placeholder="Notes (required)"
                            className={build.errors.visualInspectionNotes ? 'error' : ''}
                          />
                          {build.errors.visualInspectionNotes && (
                            <div className="field-error">{build.errors.visualInspectionNotes}</div>
                          )}
                          <div className="photo-upload">
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={(e) => handleFileSelection(buildIndex, 'visualInspection', e.target.files)}
                              id={`visual-${buildIndex}`}
                              style={{ display: 'none' }}
                            />
                            <label htmlFor={`visual-${buildIndex}`} className="upload-btn-small">
                              <FontAwesomeIcon icon={faCamera} /> Photo
                            </label>
                            {build.systemInfo.visualInspectionPhotos && build.systemInfo.visualInspectionPhotos.length > 0 && (
                              <div className="uploaded-files">
                                {build.systemInfo.visualInspectionPhotos.map((photo, idx) => (
                                  <div key={idx} className="uploaded-file">
                                    <span className="file-name">{photo.name}</span>
                                    <button
                                      type="button"
                                      className="remove-photo-btn"
                                      onClick={() => removePhoto(buildIndex, 'visualInspection', idx)}
                                    >
                                      <FontAwesomeIcon icon={faTrash} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          {build.errors.visualInspectionPhotos && (
                            <div className="field-error">{build.errors.visualInspectionPhotos}</div>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  
                  <td>
                    <div className="test-field">
                      <select
                        value={build.systemInfo.bootStatus}
                        onChange={(e) => handleInputChange(buildIndex, 'systemInfo', 'bootStatus', e.target.value)}
                        className={build.errors.bootStatus ? 'error' : ''}
                        disabled={isEditMode}
                        style={isEditMode ? { backgroundColor: '#f8f9fa', cursor: 'not-allowed' } : {}}
                      >
                        <option value="">Select</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                      {build.errors.bootStatus && (
                        <div className="field-error">{build.errors.bootStatus}</div>
                      )}
                      {build.systemInfo.bootStatus === 'No' && (
                        <div className="test-fail-inputs">
                          <textarea
                            value={build.systemInfo.bootNotes}
                            onChange={(e) => handleInputChange(buildIndex, 'systemInfo', 'bootNotes', e.target.value)}
                            placeholder="Notes (required)"
                            className={build.errors.bootNotes ? 'error' : ''}
                          />
                          {build.errors.bootNotes && (
                            <div className="field-error">{build.errors.bootNotes}</div>
                          )}
                          <div className="photo-upload">
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={(e) => handleFileSelection(buildIndex, 'boot', e.target.files)}
                              id={`boot-${buildIndex}`}
                              style={{ display: 'none' }}
                            />
                            <label htmlFor={`boot-${buildIndex}`} className="upload-btn-small">
                              <FontAwesomeIcon icon={faCamera} /> Photo
                            </label>
                            {build.systemInfo.bootPhotos && build.systemInfo.bootPhotos.length > 0 && (
                              <div className="uploaded-files">
                                {build.systemInfo.bootPhotos.map((photo, idx) => (
                                  <div key={idx} className="uploaded-file">
                                    <span className="file-name">{photo.name}</span>
                                    <button
                                      type="button"
                                      className="remove-photo-btn"
                                      onClick={() => removePhoto(buildIndex, 'boot', idx)}
                                    >
                                      <FontAwesomeIcon icon={faTrash} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          {build.errors.bootPhotos && (
                            <div className="field-error">{build.errors.bootPhotos}</div>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  
                  <td>
                    <div className="test-field">
                      <select
                        value={build.systemInfo.dimmsDetectedStatus}
                        onChange={(e) => handleInputChange(buildIndex, 'systemInfo', 'dimmsDetectedStatus', e.target.value)}
                        className={build.errors.dimmsDetectedStatus ? 'error' : ''}
                        disabled={isEditMode}
                        style={isEditMode ? { backgroundColor: '#f8f9fa', cursor: 'not-allowed' } : {}}
                      >
                        <option value="">Select</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                      {build.errors.dimmsDetectedStatus && (
                        <div className="field-error">{build.errors.dimmsDetectedStatus}</div>
                      )}
                      {build.systemInfo.dimmsDetectedStatus === 'No' && (
                        <div className="test-fail-inputs">
                          <textarea
                            value={build.systemInfo.dimmsDetectedNotes}
                            onChange={(e) => handleInputChange(buildIndex, 'systemInfo', 'dimmsDetectedNotes', e.target.value)}
                            placeholder="Notes (required)"
                            className={build.errors.dimmsDetectedNotes ? 'error' : ''}
                          />
                          {build.errors.dimmsDetectedNotes && (
                            <div className="field-error">{build.errors.dimmsDetectedNotes}</div>
                          )}
                          <div className="photo-upload">
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={(e) => handleFileSelection(buildIndex, 'dimmsDetected', e.target.files)}
                              id={`dimms-${buildIndex}`}
                              style={{ display: 'none' }}
                            />
                            <label htmlFor={`dimms-${buildIndex}`} className="upload-btn-small">
                              <FontAwesomeIcon icon={faCamera} /> Photo
                            </label>
                            {build.systemInfo.dimmsDetectedPhotos && build.systemInfo.dimmsDetectedPhotos.length > 0 && (
                              <div className="uploaded-files">
                                {build.systemInfo.dimmsDetectedPhotos.map((photo, idx) => (
                                  <div key={idx} className="uploaded-file">
                                    <span className="file-name">{photo.name}</span>
                                    <button
                                      type="button"
                                      className="remove-photo-btn"
                                      onClick={() => removePhoto(buildIndex, 'dimmsDetected', idx)}
                                    >
                                      <FontAwesomeIcon icon={faTrash} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          {build.errors.dimmsDetectedPhotos && (
                            <div className="field-error">{build.errors.dimmsDetectedPhotos}</div>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  
                  <td>
                    <div className="test-field">
                      <select
                        value={build.systemInfo.lomWorkingStatus}
                        onChange={(e) => handleInputChange(buildIndex, 'systemInfo', 'lomWorkingStatus', e.target.value)}
                        className={build.errors.lomWorkingStatus ? 'error' : ''}
                        disabled={isEditMode}
                        style={isEditMode ? { backgroundColor: '#f8f9fa', cursor: 'not-allowed' } : {}}
                      >
                        <option value="">Select</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                      {build.errors.lomWorkingStatus && (
                        <div className="field-error">{build.errors.lomWorkingStatus}</div>
                      )}
                      {build.systemInfo.lomWorkingStatus === 'No' && (
                        <div className="test-fail-inputs">
                          <textarea
                            value={build.systemInfo.lomWorkingNotes}
                            onChange={(e) => handleInputChange(buildIndex, 'systemInfo', 'lomWorkingNotes', e.target.value)}
                            placeholder="Notes (required)"
                            className={build.errors.lomWorkingNotes ? 'error' : ''}
                          />
                          {build.errors.lomWorkingNotes && (
                            <div className="field-error">{build.errors.lomWorkingNotes}</div>
                          )}
                          <div className="photo-upload">
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={(e) => handleFileSelection(buildIndex, 'lomWorking', e.target.files)}
                              id={`lom-${buildIndex}`}
                              style={{ display: 'none' }}
                            />
                            <label htmlFor={`lom-${buildIndex}`} className="upload-btn-small">
                              <FontAwesomeIcon icon={faCamera} /> Photo
                            </label>
                            {build.systemInfo.lomWorkingPhotos && build.systemInfo.lomWorkingPhotos.length > 0 && (
                              <div className="uploaded-files">
                                {build.systemInfo.lomWorkingPhotos.map((photo, idx) => (
                                  <div key={idx} className="uploaded-file">
                                    <span className="file-name">{photo.name}</span>
                                    <button
                                      type="button"
                                      className="remove-photo-btn"
                                      onClick={() => removePhoto(buildIndex, 'lomWorking', idx)}
                                    >
                                      <FontAwesomeIcon icon={faTrash} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          {build.errors.lomWorkingPhotos && (
                            <div className="field-error">{build.errors.lomWorkingPhotos}</div>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SystemInfoTable;