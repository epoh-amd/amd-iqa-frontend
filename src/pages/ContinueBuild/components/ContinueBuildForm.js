// frontend/src/pages/ContinueBuild/components/ContinueBuildForm.js
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCheck, 
  faLock,
  faExclamationTriangle,
  faSpinner,
  faEye
} from '@fortawesome/free-solid-svg-icons';

// Import StartBuild components directly for consistency
import ProgressTracker from '../../StartBuild/ProgressTracker';
import GeneralInfoTable from './tables/GeneralInfoTable'; // Use local read-only version
import SystemInfoTable from '../../StartBuild/SystemInfoTable';
import BkcDetailsTable from '../../StartBuild/BkcDetailsTable';
import QualityIndicatorTable from '../../StartBuild/QualityIndicatorTable';
import StepNavigation from '../../StartBuild/StepNavigation';
import SaveResults from '../../StartBuild/SaveResults';
import ReworkMode from '../../StartBuild/ReworkMode';

// Import hooks
import { useQualityManagement } from '../../StartBuild/hooks/useQualityManagement';
import { useContinueValidation } from '../hooks/useContinueValidation';
import { useContinueNavigation } from '../hooks/useContinueNavigation';
import { useContinueSave } from '../hooks/useContinueSave';

import api from '../../../services/api';
import '../../../assets/css/startBuild.css'; // Use StartBuild styles

const ContinueBuildForm = ({ buildData, onComplete, onCancel }) => {
  // Initialize build state from loaded data
  const initializeBuildFromData = () => {
    // Debug: Log buildData to verify fields
    console.log('ContinueBuildForm buildData:', buildData);
    const stepCompleted = {
      generalInfo: !!buildData.location && buildData.is_custom_config !== null,
      chassisInfo: !!buildData.chassis_sn && !!buildData.bmc_mac,
      cpuInfo: !!buildData.cpu_program_name,
      componentInfo: !!buildData.m2_sn && !!buildData.dimm_qty,
      testing: buildData.visual_inspection_status !== null,
      bkcDetails: !!buildData.bios_version,
      qualityDetails: !!buildData.fpy_status
    };

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

    console.log("📦 RAW buildData:");
    console.log(buildData);
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
        // FIXED: Properly map build_engineer from database to buildEngineer field
        cpuVendor: buildData.cpu_vendor || buildData.cpuVendor || buildData.cpu_vendor_from_build || '',
        buildEngineer: buildData.build_engineer || buildData.buildEngineer || buildData.build_engineer_from_build || '',
        jiraTicketNo: buildData.jira_ticket_no || buildData.jiraTicketNo || buildData.jira_ticket_no_from_build || '',
        po: buildData.po || '',
        cpuP0SN: buildData.cpu_p0_sn || '',
        cpuP1SN: buildData.cpu_p1_sn || '',
        cpuProgramName: buildData.cpu_program_name || '',
        m2PN: buildData.m2_pn || '',
        m2SN: buildData.m2_sn || '',
        dimmPN: buildData.dimm_pn || '',
        dimmQty: buildData.dimm_qty || '',
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
        saveOption: ''
      },
      status: 'pending',
      stepCompleted,
      errors: {},
      savedToDatabase: true // Mark as saved since it's from database
    };
  };

  // State management
  const [builds, setBuilds] = useState([initializeBuildFromData()]);
  const [currentStep, setCurrentStep] = useState('qualityIndicator');
  const [systemInfoSubStep, setSystemInfoSubStep] = useState('chassisInfo');
  const [showReview, setShowReview] = useState(false);
  const [reworkMode, setReworkMode] = useState(false);
  const [reworkBuildIndex, setReworkBuildIndex] = useState(null);

  // Part number search state for rework mode
  const [partNumberSuggestions, setPartNumberSuggestions] = useState({
    m2PN: [],
    dimmPN: []
  });
  const [showPartNumberDropdown, setShowPartNumberDropdown] = useState({
    m2PN: {},
    dimmPN: {}
  });

  // Custom hooks from StartBuild
  const qualityManagement = useQualityManagement(builds, setBuilds);
  const validation = useContinueValidation(builds, setBuilds);
  const navigation = useContinueNavigation(
    currentStep,
    setCurrentStep,
    systemInfoSubStep,
    setSystemInfoSubStep,
    builds,
    validation
  );
  const { saving, setSaving, saveResults, setSaveResults, saveSingleBuild } = useContinueSave(
    builds,
    setBuilds,
    validation.allStepsCompleted,
    onComplete
  );

  // Calculate FPY status based on testing results
  const calculateFpyStatus = (build) => {
    const testingResults = [
      build.systemInfo.visualInspection,
      build.systemInfo.bootStatus,
      build.systemInfo.dimmsDetectedStatus,
      build.systemInfo.lomWorkingStatus
    ];

    // FPY is Pass only if all tests pass
    const allTestsPass = testingResults.every(result => 
      result === 'Pass' || result === 'Yes'
    );

    return allTestsPass ? 'Pass' : 'Fail';
  };

  // Calculate FPY status based on testing results (auto-calculated)
  useEffect(() => {
    const build = builds[0];
    if (build && currentStep === 'qualityIndicator') {
      const testingResults = [
        build.systemInfo.visualInspection,
        build.systemInfo.bootStatus,
        build.systemInfo.dimmsDetectedStatus,
        build.systemInfo.lomWorkingStatus
      ];

      const allTestsPass = testingResults.every(result => 
        result === 'Pass' || result === 'Yes'
      );

      const fpyStatus = allTestsPass ? 'Pass' : 'Fail';
      
      // Only update if different
      if (build.qualityDetails.fpyStatus !== fpyStatus) {
        const updatedBuilds = [...builds];
        updatedBuilds[0].qualityDetails.fpyStatus = fpyStatus;
        
        // Reset failure details if FPY becomes Pass
        if (fpyStatus === 'Pass') {
          updatedBuilds[0].qualityDetails.problemDescription = '';
          updatedBuilds[0].qualityDetails.numberOfFailures = '';
          updatedBuilds[0].qualityDetails.failureModes = [];
          updatedBuilds[0].qualityDetails.failureCategories = [];
          updatedBuilds[0].qualityDetails.canRework = '';
        }
        
        setBuilds(updatedBuilds);
      }
    }
  }, [currentStep, builds[0]?.systemInfo]);

  // Handle save actions exactly like StartBuild
  const handleSaveAsComplete = async () => {
    await saveSingleBuildWithOption(0, 'complete');
  };

  const handleContinueLater = async () => {
    await saveSingleBuildWithOption(0, 'continue');
  };

  const handleSaveAsFailed = async () => {
    await saveSingleBuildWithOption(0, 'failed');
  };

  const handleSaveAndRework = async () => {
    const build = builds[0];
    
    // For already saved builds, just enter rework mode
    if (build.savedToDatabase && build.status === 'success') {
      setReworkBuildIndex(0);
      setReworkMode(true);
      return;
    }
    
    // Otherwise save first
    await saveSingleBuildWithOption(0, 'continue');
    
    // Then enter rework mode
    setReworkBuildIndex(0);
    setReworkMode(true);
  };

  // Save single build with option (from StartBuild logic)
  const saveSingleBuildWithOption = async (buildIndex, saveOption) => {
    const build = builds[buildIndex];
    const buildReference = build.systemInfo?.bmcName || build.systemInfo?.chassisSN || `Build ${buildIndex + 1}`;
    
    // Validate based on save option
    if (!validation.validateForSave(build, saveOption)) {
      setSaveResults([{
        type: 'error',
        message: `${buildReference}: Please complete required fields`
      }]);
      setTimeout(() => setSaveResults([]), 5000);
      return;
    }

    setSaving(true);

    try {
      // Determine final status based on saveOption
      let finalStatus;
      switch (saveOption) {
        case 'complete':
          finalStatus = 'Complete';
          break;
        case 'continue':
          finalStatus = 'In Progress';
          break;
        case 'failed':
          finalStatus = 'Fail';
          break;
        default:
          finalStatus = 'In Progress';
      }

      // Update build in database
      await api.updateBuild(build.systemInfo.chassisSN, {
        status: finalStatus,
        fpy_status: build.qualityDetails.fpyStatus,
        problem_description: build.qualityDetails.problemDescription || null,
        can_continue: build.qualityDetails.canRework === 'Yes, Need to update hardware/PCBA information' ? 'Yes' : 
                     build.qualityDetails.canRework === 'No, mark this build as a failed build' ? 'No' : null
      });

      // Save quality details
      await api.saveQualityDetails(build.systemInfo.chassisSN, {
        ...build.qualityDetails,
        saveOption: saveOption
      });

      setSaveResults([{
        type: 'success',
        message: `${buildReference}: Saved successfully as ${finalStatus}`
      }]);

      // Handle post-save actions
      if (saveOption !== 'continue' || build.qualityDetails.canRework !== 'Yes, Need to update hardware/PCBA information') {
        setTimeout(() => {
          onComplete();
        }, 2000);
      }

    } catch (error) {
      console.error('Error saving build:', error);
      setSaveResults([{
        type: 'error',
        message: `${buildReference}: Failed to save - ${error.message}`
      }]);
      setTimeout(() => setSaveResults([]), 5000);
    } finally {
      setSaving(false);
    }
  };

  // Handle rework save
  const handleSaveRework = async (reworkBuild, changedFields) => {
    try {
      // Calculate new FPY based on rework testing
      const newFpyStatus = calculateFpyStatus(reworkBuild);
      
      // Update build with new FPY
      const updatedReworkBuild = {
        ...reworkBuild,
        qualityDetails: {
          ...reworkBuild.qualityDetails,
          fpyStatus: newFpyStatus
        }
      };

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

      // Upload photos if any
      const allPhotos = [
        ...(updatedReworkBuild.systemInfo.visualInspectionPhotos || []),
        ...(updatedReworkBuild.systemInfo.bootPhotos || []),
        ...(updatedReworkBuild.systemInfo.dimmsDetectedPhotos || []),
        ...(updatedReworkBuild.systemInfo.lomWorkingPhotos || [])
      ];

      const uploadedPhotos = [];
      for (const photo of allPhotos) {
        if (photo.file) {
          const normalizedPhotoType = normalizePhotoType(photo.type);
          const uploadResult = await api.uploadPhoto(photo.file, normalizedPhotoType);
          uploadedPhotos.push({
            name: photo.name,
            path: uploadResult.filePath,
            type: normalizedPhotoType
          });
        }
      }
      
      // Prepare rework data
      const reworkData = {
        systemInfo: {
          ...updatedReworkBuild.systemInfo,
          uploadedPhotos: uploadedPhotos
        }
      };
      
      // Save rework to database
      await api.updateBuildAfterRework(updatedReworkBuild.systemInfo.chassisSN, reworkData);
      
      // Exit rework mode
      setReworkMode(false);
      setReworkBuildIndex(null);
      
      // Get build reference (BMC name or chassis SN)
      const buildReference = updatedReworkBuild.systemInfo.bmcName || updatedReworkBuild.systemInfo.chassisSN;
      
      // Determine final status based on rework results
      if (newFpyStatus === 'Pass') {
        // Update status to Complete
        await api.updateBuildStatus(updatedReworkBuild.systemInfo.chassisSN, 'Complete');
        
        setSaveResults([{
          type: 'success',
          message: `${buildReference}: Rework successful - Build completed`
        }]);
        
        setTimeout(() => {
          onComplete();
        }, 3000);
      } else {
        // Reset canRework for user to select again
        const updatedBuilds = [...builds];
        updatedBuilds[reworkBuildIndex] = {
          ...updatedReworkBuild,
          savedToDatabase: true,
          status: 'success'
        };
        updatedBuilds[reworkBuildIndex].qualityDetails.canRework = '';
        setBuilds(updatedBuilds);
        
        setSaveResults([{
          type: 'warning',
          message: `${buildReference}: Rework complete but FPY still Fail - Please select can rework option again`
        }]);
      }
    } catch (error) {
      console.error('Error saving rework:', error);
      const buildReference = builds[reworkBuildIndex]?.systemInfo?.bmcName || builds[reworkBuildIndex]?.systemInfo?.chassisSN || `Build ${reworkBuildIndex + 1}`;
      setSaveResults([{
        type: 'error',
        message: `${buildReference}: Failed to save rework - ${error.message}`
      }]);
    }
  };

  // Handle rework cancel
  const handleCancelRework = () => {
    setReworkMode(false);
    setReworkBuildIndex(null);
  };

  // Part number search handlers for rework mode (matching StartBuild implementation)
  const handlePartNumberSearchChange = async (buildIndex, field, value) => {
    // This function is not used in ReworkMode since it handles its own local search
    // But we provide it for compatibility
  };

  const selectPartNumber = (buildIndex, field, partNumber) => {
    // This function is not used in ReworkMode since it handles its own local selection
    // But we provide it for compatibility
  };

  // Progress status
  const getProgressStatus = () => {
    const build = builds[0];
    return {
      generalInfo: build?.stepCompleted?.generalInfo ? 'completed' : 'pending',
      systemInfo: build?.stepCompleted?.testing ? 'completed' : 'pending',
      bkcDetails: build?.stepCompleted?.bkcDetails ? 'completed' : 'pending',
      qualityIndicator: build?.stepCompleted?.qualityDetails ? 'completed' : 'pending'
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

  // Debug log to verify Build Engineer is properly mapped
  useEffect(() => {
    console.log('Build Engineer in systemInfo:', builds[0]?.systemInfo?.buildEngineer);
    console.log('Full systemInfo object:', builds[0]?.systemInfo);
  }, [builds]);

  // If in rework mode, show rework interface
  if (reworkMode && reworkBuildIndex !== null) {
    return (
      <ReworkMode
        originalBuild={builds[reworkBuildIndex]}
        onSaveRework={handleSaveRework}
        onCancel={handleCancelRework}
        partNumberSuggestions={partNumberSuggestions}
        handlePartNumberSearchChange={handlePartNumberSearchChange}
        selectPartNumber={selectPartNumber}
        showPartNumberDropdown={showPartNumberDropdown}
        setShowPartNumberDropdown={setShowPartNumberDropdown}
      />
    );
  }

  return (
    <div className="start-build-container">
      <div className="page-header">
        <h1>Continue Build: {builds[0]?.systemInfo.chassisSN}</h1>
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

      {/* Sub-step title */}
      {(currentStep === 'systemInfo' || currentStep === 'bkcDetails' || currentStep === 'qualityIndicator') && (
        <div className="sub-step-title">
          <h2>
            {currentStep === 'bkcDetails' ? 'BKC Details' : 
             currentStep === 'qualityIndicator' ? 'Quality Indicator' : 
             getSubStepTitle()}
          </h2>
        </div>
      )}

      {/* Show completed step notice for read-only sections */}
      {builds[0]?.stepCompleted[currentStep === 'systemInfo' ? systemInfoSubStep : currentStep] && currentStep !== 'qualityIndicator' && (
        <div className="completed-step-notice" style={{
          background: '#e7f3ff',
          border: '1px solid #b8daff',
          color: '#004085',
          padding: '12px',
          borderRadius: '4px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <FontAwesomeIcon icon={faLock} />
          <span>This step has been completed and is read-only. Navigate to Quality Indicator to make changes.</span>
        </div>
      )}

      {/* General Information Table */}
      {currentStep === 'generalInfo' && (
        <div style={{ opacity: 0.8 }}>
          <GeneralInfoTable
            builds={builds}
          />
        </div>
      )}

      {/* System Information Table */}
      {currentStep === 'systemInfo' && (
        <div style={{ pointerEvents: 'none', opacity: 0.8 }}>
          <SystemInfoTable
            builds={builds}
            setBuilds={setBuilds}
            systemInfoSubStep={systemInfoSubStep}
            showReview={showReview}
            handleInputChange={() => {}}
            partNumberSuggestions={{ m2PN: [], dimmPN: [] }}
            scannerRefs={{ current: {} }}
            selectedField={null}
            setSelectedField={() => {}}
            selectedBuildIndex={0}
            setSelectedBuildIndex={() => {}}
            handleFileSelection={() => {}}
            removePhoto={() => {}}
            partNumberSearch={{ m2PN: '', dimmPN: '' }}
            showPartNumberDropdown={{ m2PN: {}, dimmPN: {} }}
            setShowPartNumberDropdown={() => {}}
            handlePartNumberSearchChange={() => {}}
            selectPartNumber={() => {}}
          />
        </div>
      )}

      {/* BKC Details Table */}
      {currentStep === 'bkcDetails' && (
        <div style={{ pointerEvents: 'none', opacity: 0.8 }}>
          <BkcDetailsTable
            builds={builds}
            extractFirmwareVersions={() => {}}
            handleBkcFieldChange={() => {}}
          />
        </div>
      )}

      {/* Quality Indicator Table */}
      {currentStep === 'qualityIndicator' && (
        <QualityIndicatorTable
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
          onSaveAndRework={handleSaveAndRework}
          onContinueLater={handleContinueLater}
          onSaveAsFailed={handleSaveAsFailed}
          onSaveAsComplete={handleSaveAsComplete}
        />
      )}

      <StepNavigation
        currentStep={currentStep}
        systemInfoSubStep={systemInfoSubStep}
        builds={builds}
        addNewBuild={() => {}}
        navigatePrevious={navigation.navigatePrevious}
        navigateNext={navigation.navigateNext}
        saving={saving}
      />
    </div>
  );
};

export default ContinueBuildForm;