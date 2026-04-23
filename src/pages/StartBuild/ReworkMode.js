// frontend/src/pages/StartBuild/ReworkMode.js

import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faExchangeAlt,
  faHistory,
  faSave,
  faCamera,
  faTrash,
  faSpinner,
  faCheck,
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import api from '../../services/api';
import { useQualityManagement } from './hooks/useQualityManagement';
import '../../assets/css/startBuild.css'; // Import dropdown CSS styles

// Add custom CSS for ReworkMode dropdown positioning
const reworkDropdownStyles = `
  .rework-dropdown-container {
    position: relative !important;
  }
  .rework-dropdown {
    z-index: 10000 !important;
    position: absolute !important;
    bottom: 100% !important;
    margin-bottom: 5px !important;
    left: 0 !important;
    right: 0 !important;
    background: white;
    border: 2px solid #007bff;
    border-radius: 4px;
    max-height: 200px;
    overflow-y: auto;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    min-width: 200px;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.innerText = reworkDropdownStyles;
  document.head.appendChild(styleSheet);
}

const ReworkMode = ({ 
  originalBuild, 
  onSaveRework, 
  onCancel,
  partNumberSuggestions,
  handlePartNumberSearchChange,
  selectPartNumber,
  showPartNumberDropdown,
  setShowPartNumberDropdown 
}) => {
  const [reworkBuild, setReworkBuild] = useState(() => ({
    ...originalBuild,
    systemInfo: {
      ...originalBuild.systemInfo,
      // Clear testing data for new tests
      visualInspection: '',
      visualInspectionNotes: '',
      visualInspectionPhotos: [],
      bootStatus: '',
      bootNotes: '',
      bootPhotos: [],
      dimmsDetectedStatus: '',
      dimmsDetectedNotes: '',
      dimmsDetectedPhotos: [],
      lomWorkingStatus: '',
      lomWorkingNotes: '',
      lomWorkingPhotos: [],
      problemDescription: ''
    },
    qualityDetails: {
      fpyStatus: '',
      problemDescription: '',
      numberOfFailures: '',
      failureModes: [],
      failureCategories: []
    }
  }));

  const [changedFields, setChangedFields] = useState({
    bmcMac: false,
    mbSN: false,
    ethernetMac: false,
    cpuP0SN: false,
    cpuP0SocketDateCode: false,
    cpuP1SN: false,
    cpuP1SocketDateCode: false,
    m2PN: false,
    m2SN: false,
    dimmSNs: []
  });

  const [reworkHistory, setReworkHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const m2PNInputRef = useRef(null);

  // ============ EFFECTS ============
  // Ensure part numbers are loaded when ReworkMode mounts
  useEffect(() => {
    const loadPartNumbers = async () => {
      try {
        // Check if part numbers are already loaded
        if (partNumberSuggestions.m2PN && partNumberSuggestions.m2PN.length > 0) {
          return; // Already loaded
        }

        // Load part numbers from API - note: we can't call setPartNumberSuggestions directly
        // since it's controlled by the parent component. The parent should handle this,
        // but if it doesn't, we'll trigger a search with a single character to populate suggestions
        handlePartNumberSearchChange(0, 'm2PN', 'A'); // Trigger search with 'A' to get suggestions

        // Clear the field after triggering the search
        setTimeout(() => {
          handleInputChange('m2PN', '');
        }, 100);
      } catch (error) {
        console.error('Error loading part numbers in ReworkMode:', error);
      }
    };

    // Only load if suggestions are empty
    if (!partNumberSuggestions.m2PN || partNumberSuggestions.m2PN.length === 0) {
      loadPartNumbers();
    }
  }, []); // Run only once on mount

  // Local state for part number suggestions in ReworkMode
  const [localPartNumberSuggestions, setLocalPartNumberSuggestions] = useState({
    m2PN: partNumberSuggestions.m2PN || []
  });

  // Local search function that doesn't modify parent builds array
  const localPartNumberSearch = async (value, type) => {
    if (value.length < 1) {
      setLocalPartNumberSuggestions(prev => ({
        ...prev,
        [type]: []
      }));
      return;
    }

    try {
      const response = await api.searchPartNumbers(value, type === 'm2PN' ? 'Drive' : 'Module');
      const suggestions = response.suggestions || [];

      if (type === 'm2PN') {
        if (!suggestions.includes('Other')) {
          suggestions.push('Other');
        }
      }

      // Update local suggestions state
      setLocalPartNumberSuggestions(prev => ({
        ...prev,
        [type]: suggestions
      }));
    } catch (error) {
      console.error('Error searching part numbers in ReworkMode:', error);
    }
  };

  // Update local suggestions when parent suggestions change
  useEffect(() => {
    setLocalPartNumberSuggestions(prev => ({
      ...prev,
      m2PN: partNumberSuggestions.m2PN || []
    }));
  }, [partNumberSuggestions.m2PN]);

  // Quality management hooks for failure mode handling
  const {
    failureModes,
    handleFpyStatusChange,
    handleProblemDescriptionChange,
    handleNumberOfFailuresChange,
    handleFailureModeChange,
    getFailureCategoryForMode,
    getAllFailureModes
  } = useQualityManagement([reworkBuild], (builds) => setReworkBuild(builds[0]));

  // Load rework history
  useEffect(() => {
    loadReworkHistory();
  }, []);

  const loadReworkHistory = async () => {
    try {
      const history = await api.getReworkHistory(originalBuild.systemInfo.chassisSN);
      setReworkHistory(history);
    } catch (error) {
      console.error('Error loading rework history:', error);
    }
  };

  // Handle field change toggle
  const toggleFieldChange = (field) => {
    setChangedFields(prev => ({
      ...prev,
      [field]: !prev[field]
    }));

    // If unchecking, restore original value
    if (changedFields[field]) {
      setReworkBuild(prev => ({
        ...prev,
        systemInfo: {
          ...prev.systemInfo,
          [field]: originalBuild.systemInfo[field]
        }
      }));
    }
  };

  // Handle DIMM change toggle
  const toggleDimmChange = (index) => {
    const newDimmChanges = [...changedFields.dimmSNs];
    newDimmChanges[index] = !newDimmChanges[index];
    setChangedFields(prev => ({
      ...prev,
      dimmSNs: newDimmChanges
    }));

    // If unchecking, restore original value
    if (newDimmChanges[index] === false) {
      const newDimmSNs = [...reworkBuild.systemInfo.dimmSNs];
      newDimmSNs[index] = originalBuild.systemInfo.dimmSNs[index];
      setReworkBuild(prev => ({
        ...prev,
        systemInfo: {
          ...prev.systemInfo,
          dimmSNs: newDimmSNs
        }
      }));
    }
  };

  // Handle input change
  const handleInputChange = (field, value) => {
    setReworkBuild(prev => ({
      ...prev,
      systemInfo: {
        ...prev.systemInfo,
        [field]: value
      }
    }));

    // Clear error
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Handle DIMM SN change
  const handleDimmSNChange = (index, value) => {
    const newDimmSNs = [...reworkBuild.systemInfo.dimmSNs];
    newDimmSNs[index] = value;
    setReworkBuild(prev => ({
      ...prev,
      systemInfo: {
        ...prev.systemInfo,
        dimmSNs: newDimmSNs
      }
    }));

    // Clear error
    if (errors[`dimmSN${index}`]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`dimmSN${index}`];
        return newErrors;
      });
    }
  };

  // Handle testing field change
  const handleTestingChange = (field, value) => {
    handleInputChange(field, value);
  };

  // Handle file selection
  const handleFileSelection = (testType, files) => {
    // Normalize photo type names to match database enum values
    const normalizePhotoType = (type) => {
      const typeMap = {
        'visualInspection': 'visual_inspection',
        'boot': 'boot',
        'dimmsDetected': 'dimms_detected',
        'lomWorking': 'lom_working'
      };
      return typeMap[type] || type;
    };

    const newPhotos = Array.from(files).map(file => ({
      file: file,
      name: file.name,
      type: normalizePhotoType(testType)
    }));

    setReworkBuild(prev => ({
      ...prev,
      systemInfo: {
        ...prev.systemInfo,
        [`${testType}Photos`]: [
          ...prev.systemInfo[`${testType}Photos`],
          ...newPhotos
        ]
      }
    }));
  };

  // Remove photo
  const removePhoto = (testType, photoIndex) => {
    setReworkBuild(prev => ({
      ...prev,
      systemInfo: {
        ...prev.systemInfo,
        [`${testType}Photos`]: prev.systemInfo[`${testType}Photos`].filter((_, i) => i !== photoIndex)
      }
    }));
  };

  // Validate rework
  const validateRework = () => {
    const newErrors = {};
    const { systemInfo } = reworkBuild;

    // Validate changed fields
    if (changedFields.bmcMac && !systemInfo.bmcMac) {
      newErrors.bmcMac = 'BMC MAC is required';
    }
    if (changedFields.mbSN && !systemInfo.mbSN) {
      newErrors.mbSN = 'MB S/N is required';
    }
    // Ethernet MAC is now optional
    if (changedFields.cpuP0SN && !systemInfo.cpuP0SN) {
      newErrors.cpuP0SN = 'CPU P0 S/N is required';
    }
    if (changedFields.cpuP1SN && !systemInfo.cpuP1SN) {
      newErrors.cpuP1SN = 'CPU P1 S/N is required';
    }
    if (changedFields.m2PN && !systemInfo.m2PN) {
      newErrors.m2PN = 'M.2 P/N is required';
    }
    if (changedFields.m2SN) {
      if (!systemInfo.m2SN) {
        newErrors.m2SN = 'M.2 S/N is required';
      }
    }

    // Validate DIMM SNs
    changedFields.dimmSNs.forEach((changed, index) => {
      if (changed && !systemInfo.dimmSNs[index]) {
        newErrors[`dimmSN${index}`] = `DIMM S/N #${index + 1} is required`;
      }
    });

    // Validate testing results
    if (!systemInfo.visualInspection) {
      newErrors.visualInspection = 'Visual Inspection is required';
    }
    if (!systemInfo.bootStatus) {
      newErrors.bootStatus = 'Boot Status is required';
    }
    if (!systemInfo.dimmsDetectedStatus) {
      newErrors.dimmsDetectedStatus = 'DIMMs Detected is required';
    }
    if (!systemInfo.lomWorkingStatus) {
      newErrors.lomWorkingStatus = 'LOM Working is required';
    }

    // Validate failure notes and photos
    if (systemInfo.visualInspection === 'Fail') {
      if (!systemInfo.visualInspectionNotes) {
        newErrors.visualInspectionNotes = 'Notes required for failed inspection';
      }
      if (!systemInfo.visualInspectionPhotos || systemInfo.visualInspectionPhotos.length === 0) {
        newErrors.visualInspectionPhotos = 'Photos required for failed inspection';
      }
    }

    if (systemInfo.bootStatus === 'No') {
      if (!systemInfo.bootNotes) {
        newErrors.bootNotes = 'Notes required when boot fails';
      }
      if (!systemInfo.bootPhotos || systemInfo.bootPhotos.length === 0) {
        newErrors.bootPhotos = 'Photos required when boot fails';
      }
    }

    if (systemInfo.dimmsDetectedStatus === 'No') {
      if (!systemInfo.dimmsDetectedNotes) {
        newErrors.dimmsDetectedNotes = 'Notes required when DIMMs not detected';
      }
      if (!systemInfo.dimmsDetectedPhotos || systemInfo.dimmsDetectedPhotos.length === 0) {
        newErrors.dimmsDetectedPhotos = 'Photos required when DIMMs not detected';
      }
    }

    if (systemInfo.lomWorkingStatus === 'No') {
      if (!systemInfo.lomWorkingNotes) {
        newErrors.lomWorkingNotes = 'Notes required when LOM not working';
      }
      if (!systemInfo.lomWorkingPhotos || systemInfo.lomWorkingPhotos.length === 0) {
        newErrors.lomWorkingPhotos = 'Photos required when LOM not working';
      }
    }

    // Validate problem description if any test fails
    const hasFailures = (
      systemInfo.visualInspection === 'Fail' ||
      systemInfo.bootStatus === 'No' ||
      systemInfo.dimmsDetectedStatus === 'No' ||
      systemInfo.lomWorkingStatus === 'No'
    );
    
    if (hasFailures && !systemInfo.problemDescription) {
      newErrors.problemDescription = 'Problem description required when tests fail';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save rework
  const handleSaveRework = async () => {
    if (!validateRework()) {
      return;
    }

    setSaving(true);
    try {
      // Check for duplicates in rework mode (excludes current build)
      const duplicateCheck = await api.checkDuplicates({
        chassisSN: originalBuild.systemInfo.chassisSN,
        mbSN: reworkBuild.systemInfo.mbSN,
        bmcMac: reworkBuild.systemInfo.bmcMac,
        ethernetMac: reworkBuild.systemInfo.ethernetMac,
        cpuP0SN: reworkBuild.systemInfo.cpuP0SN,
        cpuP1SN: reworkBuild.systemInfo.cpuP1SN,
        m2SN: reworkBuild.systemInfo.m2SN,
        dimmSNs: reworkBuild.systemInfo.dimmSNs
      }, true); // Pass true for rework mode

      if (duplicateCheck.hasDuplicates) {
        const { duplicates } = duplicateCheck;
        let errorDetails = [];
        
        if (duplicates.mbSN) errorDetails.push(`MB S/N "${reworkBuild.systemInfo.mbSN}"`);
        if (duplicates.bmcMac) errorDetails.push(`BMC MAC "${reworkBuild.systemInfo.bmcMac}"`);
        if (duplicates.ethernetMac) errorDetails.push(`Ethernet MAC "${reworkBuild.systemInfo.ethernetMac}"`);
        // Note: CPU P0/P1 S/N, M.2 S/N, and DIMM S/N duplicates are now allowed per requirements
        
        setErrors({
          general: `Duplicate serial numbers found: ${errorDetails.join(', ')}`
        });
        setSaving(false);
        return;
      }

      await onSaveRework(reworkBuild, changedFields);
    } catch (error) {
      console.error('Error saving rework:', error);
      setErrors({
        general: error.message || 'Failed to save rework'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rework-mode-container">
      <div className="rework-header">
        <h2>Rework Mode - {originalBuild.systemInfo.bmcName || originalBuild.systemInfo.chassisSN}</h2>
        <button 
          className="btn-secondary"
          onClick={() => setShowHistory(!showHistory)}
        >
          <FontAwesomeIcon icon={faHistory} /> Rework History ({reworkHistory.length})
        </button>
      </div>

      {showHistory && (
        <div className="rework-history">
          <h3>Rework History</h3>
          {reworkHistory.length === 0 ? (
            <p>No previous rework history</p>
          ) : (
            <div className="history-list">
              {reworkHistory.map((rework) => (
                <div key={rework.id} className="history-item">
                  <div className="history-header">
                    <strong>Rework #{rework.rework_number}</strong> - {new Date(rework.rework_date).toLocaleString()}
                  </div>
                  <div className="history-details">
                    {rework.new_mb_sn && (
                      <div>MB S/N: {rework.original_mb_sn} → {rework.new_mb_sn}</div>
                    )}
                    {rework.new_bmc_mac && (
                      <div>BMC MAC: {rework.original_bmc_mac} → {rework.new_bmc_mac}</div>
                    )}
                    {rework.new_ethernet_mac && (
                      <div>Ethernet MAC: {rework.original_ethernet_mac} → {rework.new_ethernet_mac}</div>
                    )}
                    {rework.new_cpu_p0_sn && (
                      <div>CPU P0 S/N: {rework.original_cpu_p0_sn} → {rework.new_cpu_p0_sn}</div>
                    )}
                    {rework.new_cpu_p1_sn && (
                      <div>CPU P1 S/N: {rework.original_cpu_p1_sn} → {rework.new_cpu_p1_sn}</div>
                    )}
                    {rework.new_m2_pn && (
                      <div>M.2 P/N: {rework.original_m2_pn} → {rework.new_m2_pn}</div>
                    )}
                    {rework.new_m2_sn && (
                      <div>M.2 S/N: {rework.original_m2_sn} → {rework.new_m2_sn}</div>
                    )}
                    {rework.dimm_changes && rework.dimm_changes.length > 0 && (
                      <div>
                        DIMM Changes:
                        {rework.dimm_changes.map(change => (
                          <div key={change.position} style={{ marginLeft: '20px' }}>
                            Position {change.position + 1}: {change.original || 'N/A'} → {change.new || 'N/A'}
                          </div>
                        ))}
                      </div>
                    )}
                    <div>FPY Status: {rework.original_fpy_status}</div>
                    {rework.problem_description && (
                      <div>Problem: {rework.problem_description}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="rework-content">
        <h3>Component Changes</h3>
        <table className="rework-table">
          <thead>
            <tr>
              <th>Component</th>
              <th>Original Value</th>
              <th>Change?</th>
              <th>New Value</th>
            </tr>
          </thead>
          <tbody>
            {/* BMC MAC */}
            <tr>
              <td>BMC MAC</td>
              <td className="original-value">{originalBuild.systemInfo.bmcMac}</td>
              <td>
                <button 
                  className={`change-btn ${changedFields.bmcMac ? 'active' : ''}`}
                  onClick={() => toggleFieldChange('bmcMac')}
                >
                  <FontAwesomeIcon icon={faExchangeAlt} /> Change?
                </button>
              </td>
              <td>
                {changedFields.bmcMac ? (
                  <>
                    <input
                      type="text"
                      value={reworkBuild.systemInfo.bmcMac}
                      onChange={(e) => handleInputChange('bmcMac', e.target.value)}
                      placeholder="Enter new BMC MAC"
                      className={errors.bmcMac ? 'error' : ''}
                    />
                    {errors.bmcMac && <div className="field-error">{errors.bmcMac}</div>}
                  </>
                ) : (
                  <span className="no-change">No change</span>
                )}
              </td>
            </tr>

            {/* MB S/N */}
            <tr>
              <td>MB S/N</td>
              <td className="original-value">{originalBuild.systemInfo.mbSN}</td>
              <td>
                <button 
                  className={`change-btn ${changedFields.mbSN ? 'active' : ''}`}
                  onClick={() => toggleFieldChange('mbSN')}
                >
                  <FontAwesomeIcon icon={faExchangeAlt} /> Change?
                </button>
              </td>
              <td>
                {changedFields.mbSN ? (
                  <>
                    <input
                      type="text"
                      value={reworkBuild.systemInfo.mbSN}
                      onChange={(e) => handleInputChange('mbSN', e.target.value)}
                      placeholder="Enter new MB S/N"
                      className={errors.mbSN ? 'error' : ''}
                    />
                    {errors.mbSN && <div className="field-error">{errors.mbSN}</div>}
                  </>
                ) : (
                  <span className="no-change">No change</span>
                )}
              </td>
            </tr>

            {/* Ethernet MAC */}
            <tr>
              <td>Ethernet MAC</td>
              <td className="original-value">{originalBuild.systemInfo.ethernetMac}</td>
              <td>
                <button 
                  className={`change-btn ${changedFields.ethernetMac ? 'active' : ''}`}
                  onClick={() => toggleFieldChange('ethernetMac')}
                >
                  <FontAwesomeIcon icon={faExchangeAlt} /> Change?
                </button>
              </td>
              <td>
                {changedFields.ethernetMac ? (
                  <>
                    <input
                      type="text"
                      value={reworkBuild.systemInfo.ethernetMac}
                      onChange={(e) => handleInputChange('ethernetMac', e.target.value)}
                      placeholder="Enter new Ethernet MAC"
                      className={errors.ethernetMac ? 'error' : ''}
                    />
                    {errors.ethernetMac && <div className="field-error">{errors.ethernetMac}</div>}
                  </>
                ) : (
                  <span className="no-change">No change</span>
                )}
              </td>
            </tr>

            {/* CPU P0 S/N */}
            <tr>
              <td>CPU P0 S/N</td>
              <td className="original-value">{originalBuild.systemInfo.cpuP0SN || 'N/A'}</td>
              <td>
                <button 
                  className={`change-btn ${changedFields.cpuP0SN ? 'active' : ''}`}
                  onClick={() => toggleFieldChange('cpuP0SN')}
                >
                  <FontAwesomeIcon icon={faExchangeAlt} /> Change?
                </button>
              </td>
              <td>
                {changedFields.cpuP0SN ? (
                  <>
                    <input
                      type="text"
                      value={reworkBuild.systemInfo.cpuP0SN}
                      onChange={(e) => handleInputChange('cpuP0SN', e.target.value)}
                      placeholder="Enter new CPU P0 S/N"
                      className={errors.cpuP0SN ? 'error' : ''}
                    />
                    {errors.cpuP0SN && <div className="field-error">{errors.cpuP0SN}</div>}
                  </>
                ) : (
                  <span className="no-change">No change</span>
                )}
              </td>
            </tr>

            {/* CPU P1 S/N */}
            <tr>
              <td>CPU P1 S/N</td>
              <td className="original-value">{originalBuild.systemInfo.cpuP1SN || 'N/A'}</td>
              <td>
                <button 
                  className={`change-btn ${changedFields.cpuP1SN ? 'active' : ''}`}
                  onClick={() => toggleFieldChange('cpuP1SN')}
                >
                  <FontAwesomeIcon icon={faExchangeAlt} /> Change?
                </button>
              </td>
              <td>
                {changedFields.cpuP1SN ? (
                  <>
                    <input
                      type="text"
                      value={reworkBuild.systemInfo.cpuP1SN}
                      onChange={(e) => handleInputChange('cpuP1SN', e.target.value)}
                      placeholder="Enter new CPU P1 S/N"
                      className={errors.cpuP1SN ? 'error' : ''}
                    />
                    {errors.cpuP1SN && <div className="field-error">{errors.cpuP1SN}</div>}
                  </>
                ) : (
                  <span className="no-change">No change</span>
                )}
              </td>
            </tr>

            {/* CPU P0 Socket Date Code */}
            <tr>
              <td>P0 Socket Date Code</td>
              <td className="original-value">{originalBuild.systemInfo.cpuP0SocketDateCode || 'N/A'}</td>
              <td>
                <button 
                  className={`change-btn ${changedFields.cpuP0SocketDateCode ? 'active' : ''}`}
                  onClick={() => toggleFieldChange('cpuP0SocketDateCode')}
                >
                  <FontAwesomeIcon icon={faExchangeAlt} /> Change?
                </button>
              </td>
              <td>
                {changedFields.cpuP0SocketDateCode ? (
                  <>
                    <input
                      type="text"
                      value={reworkBuild.systemInfo.cpuP0SocketDateCode}
                      onChange={(e) => handleInputChange('cpuP0SocketDateCode', e.target.value)}
                      placeholder="Enter new P0 Socket Date Code"
                      className={errors.cpuP0SocketDateCode ? 'error' : ''}
                    />
                    {errors.cpuP0SocketDateCode && <div className="field-error">{errors.cpuP0SocketDateCode}</div>}
                  </>
                ) : (
                  <span className="no-change">No change</span>
                )}
              </td>
            </tr>

            {/* CPU P1 Socket Date Code */}
            <tr>
              <td>P1 Socket Date Code</td>
              <td className="original-value">{originalBuild.systemInfo.cpuP1SocketDateCode || 'N/A'}</td>
              <td>
                <button 
                  className={`change-btn ${changedFields.cpuP1SocketDateCode ? 'active' : ''}`}
                  onClick={() => toggleFieldChange('cpuP1SocketDateCode')}
                >
                  <FontAwesomeIcon icon={faExchangeAlt} /> Change?
                </button>
              </td>
              <td>
                {changedFields.cpuP1SocketDateCode ? (
                  <>
                    <input
                      type="text"
                      value={reworkBuild.systemInfo.cpuP1SocketDateCode}
                      onChange={(e) => handleInputChange('cpuP1SocketDateCode', e.target.value)}
                      placeholder="Enter new P1 Socket Date Code"
                      className={errors.cpuP1SocketDateCode ? 'error' : ''}
                    />
                    {errors.cpuP1SocketDateCode && <div className="field-error">{errors.cpuP1SocketDateCode}</div>}
                  </>
                ) : (
                  <span className="no-change">No change</span>
                )}
              </td>
            </tr>

            {/* M.2 P/N */}
            <tr>
              <td>M.2 P/N</td>
              <td className="original-value">{originalBuild.systemInfo.m2PN}</td>
              <td>
                <button 
                  className={`change-btn ${changedFields.m2PN ? 'active' : ''}`}
                  onClick={() => toggleFieldChange('m2PN')}
                >
                  <FontAwesomeIcon icon={faExchangeAlt} /> Change?
                </button>
              </td>
              <td>
                {changedFields.m2PN ? (
                  <div className="part-number-dropdown rework-dropdown-container">
                    <input
                      type="text"
                      value={reworkBuild.systemInfo.m2PN}
                      ref={m2PNInputRef}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Only update the reworkBuild state - don't call handlePartNumberSearchChange
                        // as it modifies the parent builds array which affects originalBuild
                        handleInputChange('m2PN', value);

                        // Trigger local search to update suggestions
                        localPartNumberSearch(value, 'm2PN');

                        // Show dropdown if value has content
                        const shouldShow = value.length > 0;
                        setShowPartNumberDropdown(prev => ({
                          ...prev,
                          m2PN: { ...prev.m2PN, 0: shouldShow }
                        }));
                      }}
                      onFocus={() => {
                        setShowPartNumberDropdown(prev => ({
                          ...prev,
                          m2PN: { ...prev.m2PN, 0: true }
                        }));
                      }}
                      onBlur={() => setTimeout(() => {
                        setShowPartNumberDropdown(prev => ({
                          ...prev,
                          m2PN: { ...prev.m2PN, 0: false }
                        }));
                      }, 150)}
                      placeholder="Type M.2 P/N..."
                      className={errors.m2PN ? 'error' : ''}
                    />
                    {errors.m2PN && <div className="field-error">{errors.m2PN}</div>}
                    {showPartNumberDropdown.m2PN?.[0] && localPartNumberSuggestions.m2PN.length > 0 && (
                      <div className="part-dropdown-list rework-dropdown">
                        {localPartNumberSuggestions.m2PN.slice(0, 8).map((pn, idx) => (
                          <div
                            key={idx}
                            className="part-dropdown-item"
                            onMouseDown={() => {
                              // Only update the reworkBuild state, don't call selectPartNumber
                              // as it modifies parent state which affects originalBuild
                              handleInputChange('m2PN', pn);

                              // Hide dropdown after selection
                              setShowPartNumberDropdown(prev => ({
                                ...prev,
                                m2PN: { ...prev.m2PN, 0: false }
                              }));

                              // Clear local suggestions
                              setLocalPartNumberSuggestions(prev => ({
                                ...prev,
                                m2PN: []
                              }));
                            }}
                          >
                            {pn}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="no-change">No change</span>
                )}
              </td>
            </tr>

            {/* M.2 S/N */}
            <tr>
              <td>M.2 S/N</td>
              <td className="original-value">{originalBuild.systemInfo.m2SN}</td>
              <td>
                <button 
                  className={`change-btn ${changedFields.m2SN ? 'active' : ''}`}
                  onClick={() => toggleFieldChange('m2SN')}
                >
                  <FontAwesomeIcon icon={faExchangeAlt} /> Change?
                </button>
              </td>
              <td>
                {changedFields.m2SN ? (
                  <>
                    <input
                      type="text"
                      value={reworkBuild.systemInfo.m2SN}
                      onChange={(e) => handleInputChange('m2SN', e.target.value)}
                      placeholder="Enter new M.2 S/N (Must start with S)"
                      className={errors.m2SN ? 'error' : ''}
                    />
                    {errors.m2SN && <div className="field-error">{errors.m2SN}</div>}
                  </>
                ) : (
                  <span className="no-change">No change</span>
                )}
              </td>
            </tr>


            {/* DIMM S/Ns */}
            {originalBuild.systemInfo.dimmSNs.map((dimmSN, index) => (
              <tr key={`dimm-${index}`}>
                <td>DIMM S/N #{index + 1}</td>
                <td className="original-value">{dimmSN}</td>
                <td>
                  <button 
                    className={`change-btn ${changedFields.dimmSNs[index] ? 'active' : ''}`}
                    onClick={() => toggleDimmChange(index)}
                  >
                    <FontAwesomeIcon icon={faExchangeAlt} /> Change?
                  </button>
                </td>
                <td>
                  {changedFields.dimmSNs[index] ? (
                    <>
                      <input
                        type="text"
                        value={reworkBuild.systemInfo.dimmSNs[index] || ''}
                        onChange={(e) => handleDimmSNChange(index, e.target.value)}
                        placeholder={`Enter new DIMM S/N #${index + 1}`}
                        className={errors[`dimmSN${index}`] ? 'error' : ''}
                      />
                      {errors[`dimmSN${index}`] && <div className="field-error">{errors[`dimmSN${index}`]}</div>}
                    </>
                  ) : (
                    <span className="no-change">No change</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <h3>Testing Results (Required)</h3>
        <div className="testing-section">
          {/* Problem Description for Failed Testing */}
          {(reworkBuild.systemInfo.visualInspection === 'Fail' || 
            reworkBuild.systemInfo.bootStatus === 'No' || 
            reworkBuild.systemInfo.dimmsDetectedStatus === 'No' || 
            reworkBuild.systemInfo.lomWorkingStatus === 'No') && (
            <div className="test-row">
              <label>Problem Description:</label>
              <textarea
                value={reworkBuild.systemInfo.problemDescription || ''}
                onChange={(e) => handleTestingChange('problemDescription', e.target.value)}
                placeholder="Describe the issues found during testing..."
                className={errors.problemDescription ? 'error' : ''}
                rows="3"
              />
              {errors.problemDescription && <div className="field-error">{errors.problemDescription}</div>}
            </div>
          )}
          
          {/* Visual Inspection */}
          <div className="test-row">
            <label>Visual Inspection:</label>
            <select
              value={reworkBuild.systemInfo.visualInspection}
              onChange={(e) => handleTestingChange('visualInspection', e.target.value)}
              className={errors.visualInspection ? 'error' : ''}
            >
              <option value="">Select</option>
              <option value="Pass">Pass</option>
              <option value="Fail">Fail</option>
            </select>
            {errors.visualInspection && <div className="field-error">{errors.visualInspection}</div>}
            
            {reworkBuild.systemInfo.visualInspection === 'Fail' && (
              <div className="test-fail-inputs">
                <textarea
                  value={reworkBuild.systemInfo.visualInspectionNotes}
                  onChange={(e) => handleTestingChange('visualInspectionNotes', e.target.value)}
                  placeholder="Notes (required)"
                  className={errors.visualInspectionNotes ? 'error' : ''}
                />
                {errors.visualInspectionNotes && <div className="field-error">{errors.visualInspectionNotes}</div>}
                <div className="photo-upload">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleFileSelection('visualInspection', e.target.files)}
                    id="visual-rework"
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="visual-rework" className="upload-btn-small">
                    <FontAwesomeIcon icon={faCamera} /> Photo
                  </label>
                  {reworkBuild.systemInfo.visualInspectionPhotos && reworkBuild.systemInfo.visualInspectionPhotos.length > 0 && (
                    <div className="uploaded-files">
                      {reworkBuild.systemInfo.visualInspectionPhotos.map((photo, idx) => (
                        <div key={idx} className="uploaded-file">
                          <span className="file-name">{photo.name}</span>
                          <button
                            type="button"
                            className="remove-photo-btn"
                            onClick={() => removePhoto('visualInspection', idx)}
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {errors.visualInspectionPhotos && <div className="field-error">{errors.visualInspectionPhotos}</div>}
              </div>
            )}
          </div>

          {/* Boot Status */}
          <div className="test-row">
            <label>Boot to OS/Shell:</label>
            <select
              value={reworkBuild.systemInfo.bootStatus}
              onChange={(e) => handleTestingChange('bootStatus', e.target.value)}
              className={errors.bootStatus ? 'error' : ''}
            >
              <option value="">Select</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
            {errors.bootStatus && <div className="field-error">{errors.bootStatus}</div>}
            
            {reworkBuild.systemInfo.bootStatus === 'No' && (
              <div className="test-fail-inputs">
                <textarea
                  value={reworkBuild.systemInfo.bootNotes}
                  onChange={(e) => handleTestingChange('bootNotes', e.target.value)}
                  placeholder="Notes (required)"
                  className={errors.bootNotes ? 'error' : ''}
                />
                {errors.bootNotes && <div className="field-error">{errors.bootNotes}</div>}
                <div className="photo-upload">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleFileSelection('boot', e.target.files)}
                    id="boot-rework"
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="boot-rework" className="upload-btn-small">
                    <FontAwesomeIcon icon={faCamera} /> Photo
                  </label>
                  {reworkBuild.systemInfo.bootPhotos && reworkBuild.systemInfo.bootPhotos.length > 0 && (
                    <div className="uploaded-files">
                      {reworkBuild.systemInfo.bootPhotos.map((photo, idx) => (
                        <div key={idx} className="uploaded-file">
                          <span className="file-name">{photo.name}</span>
                          <button
                            type="button"
                            className="remove-photo-btn"
                            onClick={() => removePhoto('boot', idx)}
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {errors.bootPhotos && <div className="field-error">{errors.bootPhotos}</div>}
              </div>
            )}
          </div>

          {/* DIMMs Detected */}
          <div className="test-row">
            <label>DIMMs Detected:</label>
            <select
              value={reworkBuild.systemInfo.dimmsDetectedStatus}
              onChange={(e) => handleTestingChange('dimmsDetectedStatus', e.target.value)}
              className={errors.dimmsDetectedStatus ? 'error' : ''}
            >
              <option value="">Select</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
            {errors.dimmsDetectedStatus && <div className="field-error">{errors.dimmsDetectedStatus}</div>}
            
            {reworkBuild.systemInfo.dimmsDetectedStatus === 'No' && (
              <div className="test-fail-inputs">
                <textarea
                  value={reworkBuild.systemInfo.dimmsDetectedNotes}
                  onChange={(e) => handleTestingChange('dimmsDetectedNotes', e.target.value)}
                  placeholder="Notes (required)"
                  className={errors.dimmsDetectedNotes ? 'error' : ''}
                />
                {errors.dimmsDetectedNotes && <div className="field-error">{errors.dimmsDetectedNotes}</div>}
                <div className="photo-upload">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleFileSelection('dimmsDetected', e.target.files)}
                    id="dimms-rework"
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="dimms-rework" className="upload-btn-small">
                    <FontAwesomeIcon icon={faCamera} /> Photo
                  </label>
                  {reworkBuild.systemInfo.dimmsDetectedPhotos && reworkBuild.systemInfo.dimmsDetectedPhotos.length > 0 && (
                    <div className="uploaded-files">
                      {reworkBuild.systemInfo.dimmsDetectedPhotos.map((photo, idx) => (
                        <div key={idx} className="uploaded-file">
                          <span className="file-name">{photo.name}</span>
                          <button
                            type="button"
                            className="remove-photo-btn"
                            onClick={() => removePhoto('dimmsDetected', idx)}
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {errors.dimmsDetectedPhotos && <div className="field-error">{errors.dimmsDetectedPhotos}</div>}
              </div>
            )}
          </div>

          {/* LOM Working */}
          <div className="test-row">
            <label>LOM Working:</label>
            <select
              value={reworkBuild.systemInfo.lomWorkingStatus}
              onChange={(e) => handleTestingChange('lomWorkingStatus', e.target.value)}
              className={errors.lomWorkingStatus ? 'error' : ''}
            >
              <option value="">Select</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
            {errors.lomWorkingStatus && <div className="field-error">{errors.lomWorkingStatus}</div>}
            
            {reworkBuild.systemInfo.lomWorkingStatus === 'No' && (
              <div className="test-fail-inputs">
                <textarea
                  value={reworkBuild.systemInfo.lomWorkingNotes}
                  onChange={(e) => handleTestingChange('lomWorkingNotes', e.target.value)}
                  placeholder="Notes (required)"
                  className={errors.lomWorkingNotes ? 'error' : ''}
                />
                {errors.lomWorkingNotes && <div className="field-error">{errors.lomWorkingNotes}</div>}
                <div className="photo-upload">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleFileSelection('lomWorking', e.target.files)}
                    id="lom-rework"
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="lom-rework" className="upload-btn-small">
                    <FontAwesomeIcon icon={faCamera} /> Photo
                  </label>
                  {reworkBuild.systemInfo.lomWorkingPhotos && reworkBuild.systemInfo.lomWorkingPhotos.length > 0 && (
                    <div className="uploaded-files">
                      {reworkBuild.systemInfo.lomWorkingPhotos.map((photo, idx) => (
                        <div key={idx} className="uploaded-file">
                          <span className="file-name">{photo.name}</span>
                          <button
                            type="button"
                            className="remove-photo-btn"
                            onClick={() => removePhoto('lomWorking', idx)}
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {errors.lomWorkingPhotos && <div className="field-error">{errors.lomWorkingPhotos}</div>}
              </div>
            )}
          </div>
        </div>

        <div className="rework-actions">
          {/* Show general error if exists */}
          {errors.general && (
            <div className="rework-general-error">
              <FontAwesomeIcon icon={faExclamationTriangle} />
              <span>{errors.general}</span>
            </div>
          )}
          
          <button 
            className="btn-secondary"
            onClick={onCancel}
            disabled={saving}
          >
            Cancel
          </button>
          <button 
            className="btn-primary"
            onClick={handleSaveRework}
            disabled={saving}
          >
            {saving ? (
              <>
                <FontAwesomeIcon icon={faSpinner} spin /> Saving...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faSave} /> Save Rework
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReworkMode;