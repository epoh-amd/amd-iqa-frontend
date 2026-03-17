// frontend/src/pages/EditBuildData/components/EditBuildDataForm.js
import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheck,
  faExclamationTriangle,
  faSpinner,
  faEye,
  faSave,
  faExchangeAlt
} from '@fortawesome/free-solid-svg-icons';

// Import StartBuild components for consistency
import ProgressTracker from '../../StartBuild/ProgressTracker';
import GeneralInfoTable from '../../ContinueBuild/components/tables/GeneralInfoTable'; // Read-only version
import SystemInfoTable from '../../StartBuild/SystemInfoTable';
import BkcDetailsTable from '../../StartBuild/BkcDetailsTable';
import QualityIndicatorTableEdit from './QualityIndicatorTableEdit'; // Custom version with status field
import ReworkMode from '../../StartBuild/ReworkMode'; // Import Rework component
import StepNavigation from '../../StartBuild/StepNavigation';
import SaveResults from '../../StartBuild/SaveResults';

// Import hooks
import { useQualityManagement } from '../../StartBuild/hooks/useQualityManagement';
import { useEditValidation } from '../hooks/useEditValidation';
import { useEditNavigation } from '../hooks/useEditNavigation';
import { useEditSave } from '../hooks/useEditSave';

import api from '../../../services/api';
import '../../../assets/css/startBuild.css';

const EditBuildDataForm = ({ buildData, onComplete, onCancel }) => {
  // Initialize build state from loaded data
  const initializeBuildFromData = () => {
    console.log('initializeBuildFromData - buildData:', buildData);

    if (!buildData) {
      console.error('buildData is null or undefined!');
      return {
        id: Date.now(),
        generalInfo: { location: '', isCustomConfig: 'No' },
        systemInfo: {},
        bkcDetails: {},
        qualityDetails: {},
        stepCompleted: {},
        errors: {}
      };
    }

    // Parse photos from database
    const parsePhotos = (photos, type) => {
      if (!photos || photos.length === 0) return [];
      return photos
        .filter(photo => photo.photo_type === type)
        .map(photo => ({
          name: photo.file_path.split('/').pop(),
          path: photo.file_path,
          type: photo.photo_type
        }));
    };

    // Parse failure data
    const failures = buildData.failures || [];
    const failureModes = [];
    const failureCategories = [];

    failures.forEach(failure => {
      failureModes.push(failure.failure_mode);
      failureCategories.push(failure.failure_category);
    });

    return {
      id: Date.now(),
      generalInfo: {
        location: buildData.location || '',
        isCustomConfig: buildData.is_custom_config === 1 ? 'Yes' : 'No'
      },
      systemInfo: {
        projectName: buildData.project_name || '',
        systemPN: buildData.system_pn || '',
        chassisSN: buildData.chassis_sn || '',
        platformType: buildData.platform_type || '',
        manufacturer: buildData.manufacturer || '',
        chassisType: buildData.chassis_type || '',
        bmcName: buildData.bmc_name || '',
        bmcMac: buildData.bmc_mac || '',
        mbSN: buildData.mb_sn || '',
        ethernetMac: buildData.ethernet_mac || '',
        cpuSocket: buildData.cpu_socket || '',
        cpuVendor: buildData.cpu_vendor || buildData.cpuVendor || '',
        buildEngineer: buildData.build_engineer || buildData.buildEngineer || '',
        jiraTicketNo: buildData.jira_ticket_no || buildData.jiraTicketNo || '',
        cpuP0SN: buildData.cpu_p0_sn || '',
        cpuP0SocketDateCode: buildData.cpu_p0_socket_date_code || '',
        cpuP1SN: buildData.cpu_p1_sn || '',
        cpuP1SocketDateCode: buildData.cpu_p1_socket_date_code || '',
        cpuProgramName: buildData.cpu_program_name || '',
        m2PN: buildData.m2_pn || '',
        m2SN: buildData.m2_sn || '',
        dimmPN: buildData.dimm_pn || '',
        // Auto-sync dimmQty with actual number of DIMM S/Ns from database
        dimmQty: buildData.dimmSNs && buildData.dimmSNs.length > 0
          ? buildData.dimmSNs.length.toString()
          : (buildData.dimm_qty || ''),
        dimmSNs: buildData.dimmSNs || [],
        visualInspection: buildData.visual_inspection_status || '',
        visualInspectionNotes: buildData.visual_inspection_notes || '',
        visualInspectionPhotos: parsePhotos(buildData.photos, 'visual_inspection'),
        bootStatus: buildData.boot_status || '',
        bootNotes: buildData.boot_notes || '',
        bootPhotos: parsePhotos(buildData.photos, 'boot'),
        dimmsDetectedStatus: buildData.dimms_detected_status || '',
        dimmsDetectedNotes: buildData.dimms_detected_notes || '',
        dimmsDetectedPhotos: parsePhotos(buildData.photos, 'dimms_detected'),
        lomWorkingStatus: buildData.lom_working_status || '',
        lomWorkingNotes: buildData.lom_working_notes || '',
        lomWorkingPhotos: parsePhotos(buildData.photos, 'lom_working')
      },
      bkcDetails: {
        biosVersion: buildData.bios_version || '',
        scmFpgaVersion: buildData.scm_fpga_version || '',
        hpmFpgaVersion: buildData.hpm_fpga_version || '',
        bmcVersion: buildData.bmc_version || ''
      },
      bkcExtraction: {
        extracting: false,
        extracted: !!buildData.bios_version,
        error: null
      },
      qualityDetails: {
        fpyStatus: buildData.fpy_status || '',
        problemDescription: buildData.problem_description || '',
        numberOfFailures: failureModes.length > 0 ? failureModes.length.toString() : '',
        failureModes: failureModes,
        failureCategories: failureCategories,
        canRework: buildData.can_continue === 'Yes' ?
          'Yes, Need to update hardware/PCBA information' :
          buildData.can_continue === 'No' ?
            'No, mark this build as a failed build' : '',
        buildStatus: buildData.status || 'In Progress' // New field for edit
      },
      status: 'pending',
      stepCompleted: {
        generalInfo: true, // Always true for existing builds
        chassisInfo: true,
        cpuInfo: true,
        componentInfo: true,
        testing: true,
        bkcDetails: true,
        qualityDetails: !!buildData.fpy_status
      },
      errors: {},
      savedToDatabase: true,
      originalData: buildData // Store original for comparison
    };
  };

  // State management
  const [builds, setBuilds] = useState([initializeBuildFromData()]);
  const [currentStep, setCurrentStep] = useState('systemInfo');
  const [systemInfoSubStep, setSystemInfoSubStep] = useState('chassisInfo');
  const [showReview, setShowReview] = useState(false);
  const [confirmSave, setConfirmSave] = useState(false);
  const [showReworkMode, setShowReworkMode] = useState(false);

  // Part number search state
  const [partNumberSuggestions, setPartNumberSuggestions] = useState({
    m2PN: [],
    dimmPN: []
  });
  const [showPartNumberDropdown, setShowPartNumberDropdown] = useState({
    m2PN: {},
    dimmPN: {}
  });

  // Custom hooks
  const qualityManagement = useQualityManagement(builds, setBuilds);
  const validation = useEditValidation(builds, setBuilds);
  const navigation = useEditNavigation(
    currentStep,
    setCurrentStep,
    systemInfoSubStep,
    setSystemInfoSubStep,
    builds,
    validation
  );
  const { saving, setSaving, saveResults, setSaveResults, saveEditedBuild } = useEditSave(
    builds,
    setBuilds,
    validation.allStepsCompleted,
    onComplete
  );

  // Use ref to track previous testing results and FPY status to prevent infinite loop
  const prevTestingResultsRef = useRef(null);
  const prevFpyStatusRef = useRef(null);

  // Calculate FPY status based on testing results (auto-calculated)
  useEffect(() => {
    const build = builds[0];
    if (build && currentStep === 'qualityIndicator') {
      const testingResults = [
        build.systemInfo?.visualInspection,
        build.systemInfo?.bootStatus,
        build.systemInfo?.dimmsDetectedStatus,
        build.systemInfo?.lomWorkingStatus
      ];

      // Convert to string for comparison
      const currentResultsString = JSON.stringify(testingResults);
      const currentFpyStatus = build.qualityDetails?.fpyStatus;

      // Only proceed if testing results have actually changed OR we're entering this step for the first time
      if (prevTestingResultsRef.current !== currentResultsString) {
        prevTestingResultsRef.current = currentResultsString;

        const allTestsPass = testingResults.every(result =>
          result === 'Pass' || result === 'Yes'
        );

        const fpyStatus = allTestsPass ? 'Pass' : 'Fail';

        // Only update if different from current FPY status AND different from previous ref
        if (currentFpyStatus !== fpyStatus && prevFpyStatusRef.current !== fpyStatus) {
          prevFpyStatusRef.current = fpyStatus;

          setBuilds(prevBuilds => {
            const updatedBuilds = [...prevBuilds];
            updatedBuilds[0].qualityDetails.fpyStatus = fpyStatus;

            // Reset failure details if FPY becomes Pass
            if (fpyStatus === 'Pass') {
              updatedBuilds[0].qualityDetails.problemDescription = '';
              updatedBuilds[0].qualityDetails.numberOfFailures = '';
              updatedBuilds[0].qualityDetails.failureModes = [];
              updatedBuilds[0].qualityDetails.failureCategories = [];
              updatedBuilds[0].qualityDetails.canRework = '';
            }

            return updatedBuilds;
          });
        } else if (prevFpyStatusRef.current === null) {
          // Initialize the ref on first render
          prevFpyStatusRef.current = currentFpyStatus;
        }
      }
    }
  }, [
    currentStep,
    builds[0]?.systemInfo?.visualInspection,
    builds[0]?.systemInfo?.bootStatus,
    builds[0]?.systemInfo?.dimmsDetectedStatus,
    builds[0]?.systemInfo?.lomWorkingStatus
  ]);

  // Handle input changes with validation
  // Signature: handleInputChange(buildIndex, section, fieldName, value, dimmIndex = null)
  // section = 'systemInfo', 'bkcDetails', 'qualityDetails', etc.
  // fieldName = 'bmcMac', 'projectName', etc.
  const handleInputChange = (buildIndex, section, fieldName, value, dimmIndex = null) => {
    const updatedBuilds = [...builds];
    const build = updatedBuilds[buildIndex];

    // Handle DIMM S/N array updates
    if (fieldName === 'dimmSN' && dimmIndex !== null) {
      if (!build.systemInfo.dimmSNs) {
        build.systemInfo.dimmSNs = [];
      }
      build.systemInfo.dimmSNs[dimmIndex] = value;
    } else if (section) {
      // Update nested field (e.g., build.systemInfo.bmcMac)
      build[section][fieldName] = value;
    } else {
      // Direct field update (for backwards compatibility)
      build[fieldName] = value;
    }

    // Clear error for this field
    if (build.errors[fieldName]) {
      delete build.errors[fieldName];
    }

    setBuilds(updatedBuilds);
  };

  // Handle file selection for photos
  const handleFileSelection = (buildIndex, photoType, files) => {
    const updatedBuilds = [...builds];
    const build = updatedBuilds[buildIndex];

    const photoField = `${photoType}Photos`;
    const existingPhotos = build.systemInfo[photoField] || [];

    const newPhotos = Array.from(files).map(file => ({
      name: file.name,
      file: file,
      type: photoType,
      preview: URL.createObjectURL(file)
    }));

    build.systemInfo[photoField] = [...existingPhotos, ...newPhotos];
    setBuilds(updatedBuilds);
  };

  // Remove photo
  const removePhoto = (buildIndex, photoType, photoIndex) => {
    const updatedBuilds = [...builds];
    const build = updatedBuilds[buildIndex];
    const photoField = `${photoType}Photos`;

    const photos = build.systemInfo[photoField] || [];
    photos.splice(photoIndex, 1);
    build.systemInfo[photoField] = photos;

    setBuilds(updatedBuilds);
  };

  // Part number search handlers
  const handlePartNumberSearchChange = async (buildIndex, field, value) => {
    // Update the field value
    handleInputChange(buildIndex, 'systemInfo', field, value);

    // Search for part numbers if value length >= 3
    if (value.length >= 3) {
      try {
        const type = field === 'm2PN' ? 'Drive' : 'Module';
        const response = await api.searchPartNumbers(value, type);
        setPartNumberSuggestions(prev => ({
          ...prev,
          [field]: response.suggestions || []
        }));
        setShowPartNumberDropdown(prev => ({
          ...prev,
          [field]: { [buildIndex]: true }
        }));
      } catch (error) {
        console.error('Error searching part numbers:', error);
      }
    } else {
      setShowPartNumberDropdown(prev => ({
        ...prev,
        [field]: { [buildIndex]: false }
      }));
    }
  };

  const selectPartNumber = (buildIndex, field, partNumber) => {
    handleInputChange(buildIndex, 'systemInfo', field, partNumber);
    setShowPartNumberDropdown(prev => ({
      ...prev,
      [field]: { [buildIndex]: false }
    }));
  };

  // Handle save action
  const handleSave = () => {
    setConfirmSave(true);
  };

  const proceedWithSave = async () => {
    setConfirmSave(false);
    await saveEditedBuild(0);
  };

  const cancelSave = () => {
    setConfirmSave(false);
  };

  // Rework handlers
  const handleOpenRework = () => {
    setShowReworkMode(true);
  };

  const handleCancelRework = () => {
    setShowReworkMode(false);
  };

  const handleSaveRework = async (reworkedBuild, changedFields) => {
    try {
      setSaving(true);

      // Calculate new FPY based on rework testing
      const newFpyStatus = (
        reworkedBuild.systemInfo.visualInspection === 'Pass' &&
        reworkedBuild.systemInfo.bootStatus === 'Yes' &&
        reworkedBuild.systemInfo.dimmsDetectedStatus === 'Yes' &&
        reworkedBuild.systemInfo.lomWorkingStatus === 'Yes'
      ) ? 'Pass' : 'Fail';

      // Update build with new FPY
      const updatedReworkBuild = {
        ...reworkedBuild,
        qualityDetails: {
          ...reworkedBuild.qualityDetails,
          fpyStatus: newFpyStatus
        }
      };

      // Upload photos - EXACT SAME AS STARTBUILD
      // Photos are stored as { file, name, type } objects
      const allPhotos = [
        ...(updatedReworkBuild.systemInfo.visualInspectionPhotos || []),
        ...(updatedReworkBuild.systemInfo.bootPhotos || []),
        ...(updatedReworkBuild.systemInfo.dimmsDetectedPhotos || []),
        ...(updatedReworkBuild.systemInfo.lomWorkingPhotos || [])
      ];

      const uploadedPhotos = [];

      // Upload each photo using the same method as StartBuild
      for (const photoData of allPhotos) {
        try {
          // photoData structure: { file: File, name: string, type: string }
          const { filePath } = await api.uploadPhoto(photoData.file, photoData.type);
          uploadedPhotos.push({
            name: photoData.name,
            path: filePath,
            type: photoData.type
          });
        } catch (error) {
          console.error('Error uploading photo:', error);
          throw new Error(`Failed to upload ${photoData.name}`);
        }
      }

      // Prepare rework data
      const reworkData = {
        systemInfo: {
          ...updatedReworkBuild.systemInfo,
          uploadedPhotos: uploadedPhotos
        }
      };

      // Save rework to database - calls PATCH /api/builds/:chassisSN/rework
      // This creates rework_history records
      await api.updateBuildAfterRework(updatedReworkBuild.systemInfo.chassisSN, reworkData);

      // Update local state with reworked build
      setBuilds([updatedReworkBuild]);
      setShowReworkMode(false);
      setSaving(false);

      // Show success message
      setSaveResults([{
        type: 'success',
        message: `Rework saved successfully. FPY Status: ${newFpyStatus}`
      }]);

      setTimeout(() => setSaveResults([]), 3000);

    } catch (error) {
      console.error('Error saving rework:', error);
      setSaving(false);
      setSaveResults([{
        type: 'error',
        message: `Error saving rework: ${error.message}`
      }]);
      setTimeout(() => setSaveResults([]), 5000);
    }
  };

  // Progress status
  const getProgressStatus = () => {
    const build = builds[0];
    return {
      generalInfo: 'completed',
      systemInfo: 'completed',
      bkcDetails: 'completed',
      qualityIndicator: build?.qualityDetails?.fpyStatus ? 'completed' : 'pending'
    };
  };

  const progressStatus = getProgressStatus();

  // Sub-step title
  const getSubStepTitle = () => {
    switch (systemInfoSubStep) {
      case 'chassisInfo':
        return 'Chassis Information';
      case 'cpuInfo':
        return 'CPU Information';
      case 'componentInfo':
        return 'Component Information';
      case 'testing':
        return 'Testing';
      default:
        return '';
    }
  };

  // Debug logging
  console.log('EditBuildDataForm - Current Step:', currentStep);
  console.log('EditBuildDataForm - System Info SubStep:', systemInfoSubStep);
  console.log('EditBuildDataForm - Builds:', builds);

  // Debug validation
  if (currentStep === 'qualityIndicator') {
    const isValid = validation.validateForSave(builds[0]);
    console.log('EditBuildDataForm - Validation Result:', isValid);
    console.log('EditBuildDataForm - Build Data:', {
      projectName: builds[0]?.systemInfo?.projectName,
      bmcMac: builds[0]?.systemInfo?.bmcMac,
      mbSN: builds[0]?.systemInfo?.mbSN,
      cpuSocket: builds[0]?.systemInfo?.cpuSocket,
      cpuProgramName: builds[0]?.systemInfo?.cpuProgramName,
      m2PN: builds[0]?.systemInfo?.m2PN,
      m2SN: builds[0]?.systemInfo?.m2SN,
      dimmPN: builds[0]?.systemInfo?.dimmPN,
      dimmQty: builds[0]?.systemInfo?.dimmQty,
      dimmSNs: builds[0]?.systemInfo?.dimmSNs,
      fpyStatus: builds[0]?.qualityDetails?.fpyStatus
    });
  }

  return (
    <div className="start-build-container edit-mode">
      <div className="page-header">
        <h1>Edit Build: {builds[0]?.systemInfo?.chassisSN || 'Loading...'}</h1>
        <div className="header-actions">
          <button
            className="btn-secondary"
            onClick={() => setShowReview(!showReview)}
          >
            <FontAwesomeIcon icon={faEye} /> {showReview ? 'Hide' : 'Show'} Review
          </button>
        </div>
      </div>

      <ProgressTracker
        progressStatus={progressStatus}
        currentStep={currentStep}
      />

      <SaveResults saveResults={saveResults} />

      {/* Confirmation Modal */}
      {confirmSave && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Confirm Update</h3>
            <p>You are proceeding to edit the build in our database. Please click Proceed to continue.</p>
            <div className="modal-actions">
              <button className="btn-primary" onClick={proceedWithSave}>
                Proceed
              </button>
              <button className="btn-secondary" onClick={cancelSave}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sub-step title */}
      {(currentStep === 'systemInfo' || currentStep === 'bkcDetails' || currentStep === 'qualityIndicator' || currentStep === 'generalInfo') && (
        <div className="sub-step-title">
          <h2>
            {currentStep === 'generalInfo' ? 'General Information' :
              currentStep === 'bkcDetails' ? 'BKC Details' :
                currentStep === 'qualityIndicator' ? 'Quality Indicator' :
                  getSubStepTitle()}
          </h2>
        </div>
      )}

      {/* General Information Table - Read Only */}
      {currentStep === 'generalInfo' && (
        <div style={{ opacity: 0.8 }}>
          <GeneralInfoTable builds={builds} />
        </div>
      )}

      {/* System Information Table - Editable */}
      {currentStep === 'systemInfo' && (
        <SystemInfoTable
          builds={builds}
          setBuilds={setBuilds}
          systemInfoSubStep={systemInfoSubStep}
          showReview={showReview}
          handleInputChange={handleInputChange}
          partNumberSuggestions={partNumberSuggestions}
          scannerRefs={{ current: {} }}
          selectedField={null}
          setSelectedField={() => { }}
          selectedBuildIndex={0}
          setSelectedBuildIndex={() => { }}
          handleFileSelection={handleFileSelection}
          removePhoto={removePhoto}
          partNumberSearch={{ m2PN: '', dimmPN: '' }}
          showPartNumberDropdown={showPartNumberDropdown}
          setShowPartNumberDropdown={setShowPartNumberDropdown}
          handlePartNumberSearchChange={handlePartNumberSearchChange}
          selectPartNumber={selectPartNumber}
          isEditMode={true}
        />
      )}

      {/* BKC Details Table - Editable */}
      {currentStep === 'bkcDetails' && (
        <BkcDetailsTable
          builds={builds}
          extractFirmwareVersions={() => { }}
          handleBkcFieldChange={(buildIndex, field, value) => {
            handleInputChange(buildIndex, 'bkcDetails', field, value);
          }}
        />
      )}

      {/* Quality Indicator Table - EXACT StartBuild Logic */}
      {currentStep === 'qualityIndicator' && !showReworkMode && (
        <QualityIndicatorTableEdit
          builds={builds}
          showReview={showReview}
          failureModes={qualityManagement.failureModes}
          handleFpyStatusChange={qualityManagement.handleFpyStatusChange}
          handleProblemDescriptionChange={qualityManagement.handleProblemDescriptionChange}
          handleNumberOfFailuresChange={qualityManagement.handleNumberOfFailuresChange}
          handleFailureModeChange={qualityManagement.handleFailureModeChange}
          handleCanReworkChange={qualityManagement.handleCanReworkChange}
          getAllFailureModes={qualityManagement.getAllFailureModes}
          getFailureCategoryForMode={qualityManagement.getFailureCategoryForMode}
          saving={saving}
          onSaveAsComplete={handleSave}
          onSaveAndRework={handleOpenRework}
        />
      )}

      {/* Rework Mode Component */}
      {currentStep === 'qualityIndicator' && showReworkMode && (
        <div style={{ marginTop: '20px' }}>
          <ReworkMode
            originalBuild={builds[0]}
            onSaveRework={handleSaveRework}
            onCancel={handleCancelRework}
            partNumberSuggestions={partNumberSuggestions}
            handlePartNumberSearchChange={handlePartNumberSearchChange}
            selectPartNumber={selectPartNumber}
            showPartNumberDropdown={showPartNumberDropdown}
            setShowPartNumberDropdown={setShowPartNumberDropdown}
          />
        </div>
      )}

      {/* Navigation - No Save button here, it's in Quality Indicator Actions column */}
      {!showReworkMode && (
        <div className="step-navigation">
          <button
            className="btn-secondary"
            onClick={navigation.navigatePrevious}
            disabled={currentStep === 'generalInfo'}
          >
            Previous
          </button>

          <div className="nav-center">
            {/* Save button is in Quality Indicator table Actions column */}
          </div>

          <button
            className="btn-secondary"
            onClick={navigation.navigateNext}
            disabled={currentStep === 'qualityIndicator'}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default EditBuildDataForm;
