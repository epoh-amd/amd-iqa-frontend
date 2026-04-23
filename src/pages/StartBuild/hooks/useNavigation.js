// frontend/src/pages/StartBuild/hooks/useNavigation.js

import { useState } from 'react';

export const useNavigation = (
  currentStep,
  setCurrentStep,
  systemInfoSubStep,
  setSystemInfoSubStep,
  builds,
  setBuilds,
  validateBeforeQualityIndicator,
  setShowReview,
  validationFunctions
) => {
  const [saveResults, setSaveResults] = useState([]);

  // Check if BKC data already exists for builds
  const checkExistingBkcData = async () => {
    const updatedBuilds = [...builds];
    
    for (let i = 0; i < updatedBuilds.length; i++) {
      if (updatedBuilds[i].systemInfo.chassisSN) {
        try {
          const api = await import('../../../services/api');
          const result = await api.default.getBuildDetails(updatedBuilds[i].systemInfo.chassisSN);
          if (result.bios_version || result.scm_fpga_version || result.hpm_fpga_version || result.bmc_version) {
            updatedBuilds[i].bkcDetails = {
              biosVersion: result.bios_version || '',
              scmFpgaVersion: result.scm_fpga_version || '',
              hpmFpgaVersion: result.hpm_fpga_version || '',
              bmcVersion: result.bmc_version || ''
            };
            updatedBuilds[i].bkcExtraction.extracted = true;
          }
        } catch (error) {
          console.log('No existing BKC data for build', i);
        }
      }
    }
    
    setBuilds(updatedBuilds);
  };

  // STRICT VALIDATION: Validate General Information
  const validateGeneralInfo = () => {
    const errors = [];
    
    for (let i = 0; i < builds.length; i++) {
      const build = builds[i];
      
      // Check required fields
      if (!build.generalInfo.location) {
        errors.push(`Build ${i + 1}: Location is required`);
      }
      if (!build.generalInfo.buildEngineer) {
        errors.push(`Build ${i + 1}: Build Engineer is required`);
      }
      if (!build.generalInfo.isCustomConfig) {
        errors.push(`Build ${i + 1}: Configuration type is required`);
      }
    }
    
    return errors;
  };

  // Validate chassis information step including duplicate check
  const validateChassisInfo = async () => {
    // IMPORTANT: Check cross-build duplicates first (RESTORED)
    const { checkCrossBuildDuplicates } = await import('./useValidation');
    const hasNoCrossBuildDuplicates = checkCrossBuildDuplicates(builds, setBuilds);
    
    if (!hasNoCrossBuildDuplicates) {
      return ['Please resolve duplicate serial numbers between builds before proceeding'];
    }

    const errors = [];
    
    for (let i = 0; i < builds.length; i++) {
      const build = builds[i];
      
      // Check required fields
      if (!build.systemInfo.projectName) {
        errors.push(`Build ${i + 1}: Project name required`);
      }
      if (!build.systemInfo.systemPN) {
        errors.push(`Build ${i + 1}: System P/N required`);
      }

      // Validate auto-populated hidden fields that are required for database
      if (build.systemInfo.systemPN && !build.systemInfo.platformType) {
        errors.push(`Build ${i + 1}: Platform Type not populated. Please verify System P/N is valid.`);
      }
      if (build.systemInfo.systemPN && !build.systemInfo.chassisType) {
        errors.push(`Build ${i + 1}: Chassis Type not populated. Please verify System P/N format.`);
      }
      if (build.systemInfo.systemPN && !build.systemInfo.manufacturer) {
        errors.push(`Build ${i + 1}: Manufacturer not populated. Please verify System P/N is valid.`);
      }

      if (!build.systemInfo.chassisSN) {
        errors.push(`Build ${i + 1}: Chassis S/N required`);
      }

      // Validate BMC Name (requires both System P/N and Chassis S/N)
      if (build.systemInfo.systemPN && build.systemInfo.chassisSN && !build.systemInfo.bmcName) {
        errors.push(`Build ${i + 1}: BMC Name not populated. Please verify both System P/N and Chassis S/N are valid.`);
      }
      if (!build.systemInfo.bmcMac) {
        errors.push(`Build ${i + 1}: BMC MAC required`);
      }
      if (!build.systemInfo.mbSN) {
        errors.push(`Build ${i + 1}: MB S/N required`);
      }
      // Ethernet MAC is now optional
      if (!build.systemInfo.cpuSocket) {
        errors.push(`Build ${i + 1}: CPU Socket required`);
      }
      if (!build.systemInfo.jiraTicketNo) {
        errors.push(`Build ${i + 1}: Jira Ticket No required`);
      }
      if (!build.systemInfo.cpuVendor) {
        errors.push(`Build ${i + 1}: CPU Vendor required`);
      }
      
      // IMPORTANT: Check for existing duplicate errors (RESTORED)
      if (build.errors && build.errors.chassisSN && build.errors.chassisSN.includes('already exists')) {
        errors.push(`Build ${i + 1}: ${build.errors.chassisSN}`);
      }
      
      // IMPORTANT: Check for duplicates if chassis S/N is provided (RESTORED)
      if (build.systemInfo.chassisSN && build.systemInfo.chassisSN.trim()) {
        try {
          const api = await import('../../../services/api');
          const duplicateCheck = await api.default.checkDuplicates({
            chassisSN: build.systemInfo.chassisSN.trim()
          });
          
          if (duplicateCheck.hasDuplicates && duplicateCheck.duplicates.chassisSN) {
            errors.push(`Build ${i + 1}: Chassis S/N already exists`);
          }
        } catch (error) {
          console.error('Error checking duplicates:', error);
        }
      }
    }
    
    return errors;
  };

  // STRICT VALIDATION: Validate CPU information step
  const validateCpuInfo = async () => {
    // IMPORTANT: First check cross-build duplicates (RESTORED)
    const { checkCrossBuildDuplicates } = await import('./useValidation');
    const hasNoCrossBuildDuplicates = checkCrossBuildDuplicates(builds, setBuilds);
    
    if (!hasNoCrossBuildDuplicates) {
      return ['Please resolve duplicate serial numbers between builds before proceeding'];
    }
    
    const errors = [];
    
    for (let i = 0; i < builds.length; i++) {
      const build = builds[i];
      
      if (!build.systemInfo.cpuProgramName) {
        errors.push(`Build ${i + 1}: CPU Program Name required`);
      }
      // CPU P0 and P1 S/N are optional

      // IMPORTANT: Skip checking for existing duplicate errors since checkCrossBuildDuplicates 
      // already handles this and returns false if duplicates exist
      // The previous logic was causing race conditions where errors weren't properly cleared
    }
    
    return errors;
  };

  // STRICT VALIDATION: Validate component information step
  const validateComponentInfo = async () => {
    // IMPORTANT: First check cross-build duplicates (RESTORED)
    const { checkCrossBuildDuplicates } = await import('./useValidation');
    const hasNoCrossBuildDuplicates = checkCrossBuildDuplicates(builds, setBuilds);
    
    if (!hasNoCrossBuildDuplicates) {
      return ['Please resolve duplicate serial numbers between builds before proceeding'];
    }

    const errors = [];
    
    for (let i = 0; i < builds.length; i++) {
      const build = builds[i];
      
      if (!build.systemInfo.m2PN && (!build.systemInfo.m2PNOther || !build.systemInfo.m2PNCustom)) {
        errors.push(`Build ${i + 1}: M.2 P/N required`);
      }
      if (!build.systemInfo.m2SN) {
        errors.push(`Build ${i + 1}: M.2 S/N required`);
      }
      if (!build.systemInfo.dimmQty) {
        errors.push(`Build ${i + 1}: DIMM Quantity required`);
      }
      
      // Validate DIMM S/Ns
      const dimmQty = parseInt(build.systemInfo.dimmQty) || 0;
      for (let j = 0; j < dimmQty; j++) {
        if (!build.systemInfo.dimmSNs[j]) {
          errors.push(`Build ${i + 1}: DIMM S/N #${j + 1} required`);
        }
      }
      
      // IMPORTANT: Skip checking for existing duplicate errors since checkCrossBuildDuplicates 
      // already handles this and returns false if duplicates exist
      // The previous logic was causing race conditions where errors weren't properly cleared
    }
    
    return errors;
  };

  // STRICT VALIDATION: Validate testing step - UPDATED TO BE MANDATORY
  const validateTesting = async () => {
    const errors = [];
    
    for (let i = 0; i < builds.length; i++) {
      const build = builds[i];
      
      // Check required testing fields - ALL MANDATORY
      if (!build.systemInfo.visualInspection) {
        errors.push(`Build ${i + 1}: Visual Inspection is required`);
      }
      if (!build.systemInfo.bootStatus) {
        errors.push(`Build ${i + 1}: Boot Status is required`);
      }
      if (!build.systemInfo.dimmsDetectedStatus) {
        errors.push(`Build ${i + 1}: DIMMs Detected is required`);
      }
      if (!build.systemInfo.lomWorkingStatus) {
        errors.push(`Build ${i + 1}: LOM Working is required`);
      }

      // MANDATORY: Validate failure notes and photos
      if (build.systemInfo.visualInspection === 'Fail') {
        if (!build.systemInfo.visualInspectionNotes) {
          errors.push(`Build ${i + 1}: Notes required for failed visual inspection`);
        }
        if (!build.systemInfo.visualInspectionPhotos || build.systemInfo.visualInspectionPhotos.length === 0) {
          errors.push(`Build ${i + 1}: Photos required for failed visual inspection`);
        }
      }

      if (build.systemInfo.bootStatus === 'No') {
        if (!build.systemInfo.bootNotes) {
          errors.push(`Build ${i + 1}: Notes required when boot fails`);
        }
        if (!build.systemInfo.bootPhotos || build.systemInfo.bootPhotos.length === 0) {
          errors.push(`Build ${i + 1}: Photos required when boot fails`);
        }
      }

      if (build.systemInfo.dimmsDetectedStatus === 'No') {
        if (!build.systemInfo.dimmsDetectedNotes) {
          errors.push(`Build ${i + 1}: Notes required when DIMMs not detected`);
        }
        if (!build.systemInfo.dimmsDetectedPhotos || build.systemInfo.dimmsDetectedPhotos.length === 0) {
          errors.push(`Build ${i + 1}: Photos required when DIMMs not detected`);
        }
      }

      if (build.systemInfo.lomWorkingStatus === 'No') {
        if (!build.systemInfo.lomWorkingNotes) {
          errors.push(`Build ${i + 1}: Notes required when LOM not working`);
        }
        if (!build.systemInfo.lomWorkingPhotos || build.systemInfo.lomWorkingPhotos.length === 0) {
          errors.push(`Build ${i + 1}: Photos required when LOM not working`);
        }
      }
    }
    
    return errors;
  };

  // STRICT VALIDATION: Validate BKC Details step - NEWLY ADDED
  const validateBkcDetails = async () => {
    const errors = [];
    
    for (let i = 0; i < builds.length; i++) {
      const build = builds[i];
      
      // Check required BKC fields
      if (!build.bkcDetails.biosVersion) {
        errors.push(`Build ${i + 1}: BIOS Version is required`);
      }
      if (!build.bkcDetails.hpmFpgaVersion) {
        errors.push(`Build ${i + 1}: HPM FPGA Version is required`);
      }
      if (!build.bkcDetails.bmcVersion) {
        errors.push(`Build ${i + 1}: BMC Version is required`);
      }
      // Note: scmFpgaVersion is OPTIONAL per UI placeholder
    }
    
    return errors;
  };

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

  // Initialize quality details for builds
  const initializeQualityDetails = () => {
    const updatedBuilds = [...builds];
    updatedBuilds.forEach(build => {
      const fpyStatus = calculateFpyStatus(build);
      build.qualityDetails = {
        fpyStatus: fpyStatus,
        numberOfFailures: '',
        failureModes: [],
        failureCategories: [],
        canRework: ''
      };
    });
    setBuilds(updatedBuilds);
  };

  // UPDATED: Navigate to next step/sub-step with STRICT validation
  const navigateNext = async () => {
    let validationErrors = [];
    
    // IMPORTANT: Validate current step before proceeding (MATCHING ORIGINAL LOGIC)
    if (currentStep === 'systemInfo') {
      if (systemInfoSubStep === 'chassisInfo') {
        validationErrors = await validateChassisInfo();
      } else if (systemInfoSubStep === 'cpuInfo') {
        validationErrors = await validateCpuInfo();
      } else if (systemInfoSubStep === 'componentInfo') {
        validationErrors = await validateComponentInfo();
      } else if (systemInfoSubStep === 'testing') {
        // IMPORTANT: Now validate testing step as mandatory (CHANGED FROM ORIGINAL)
        validationErrors = await validateTesting();
      }
    } else if (currentStep === 'bkcDetails') {
      // NEWLY ADDED: Validate BKC Details before proceeding to Quality Indicator
      validationErrors = await validateBkcDetails();
      
      // If BKC validation fails, don't run the comprehensive validation
      if (validationErrors.length === 0) {
        // Only run comprehensive validation if BKC details are complete
        if (!validateBeforeQualityIndicator()) {
          setSaveResults([{
            type: 'error',
            message: 'Complete all previous steps before proceeding'
          }]);
          setTimeout(() => setSaveResults([]), 5000);
          return;
        }
      }
    }
    // IMPORTANT: General Info step has NO validation in original - only enforced in this new version
    
    // STRICT BLOCKING: Show validation errors and prevent navigation if any exist
    if (validationErrors.length > 0) {
      setSaveResults(validationErrors.map(error => ({
        type: 'error',
        message: error
      })));
      setTimeout(() => setSaveResults([]), 7000);
      return; // BLOCK NAVIGATION
    }

    // IMPORTANT: Rest of navigation logic is IDENTICAL to original
    if (currentStep === 'generalInfo') {
      // ADDED: Validate General Info before proceeding (NEW REQUIREMENT)
      const generalInfoErrors = validateGeneralInfo();
      if (generalInfoErrors.length > 0) {
        setSaveResults(generalInfoErrors.map(error => ({
          type: 'error',
          message: error
        })));
        setTimeout(() => setSaveResults([]), 7000);
        return;
      }
      
      const updatedBuilds = [...builds];
      updatedBuilds.forEach(build => {
        build.stepCompleted.generalInfo = true;
      });
      setBuilds(updatedBuilds);
      setCurrentStep('systemInfo');
      setSystemInfoSubStep('chassisInfo');
    } else if (currentStep === 'systemInfo') {
      const updatedBuilds = [...builds];
      updatedBuilds.forEach(build => {
        build.stepCompleted[systemInfoSubStep] = true;
      });
      setBuilds(updatedBuilds);

      // Move to next sub-step
      if (systemInfoSubStep === 'chassisInfo') {
        setSystemInfoSubStep('cpuInfo');
      } else if (systemInfoSubStep === 'cpuInfo') {
        setSystemInfoSubStep('componentInfo');
      } else if (systemInfoSubStep === 'componentInfo') {
        setSystemInfoSubStep('testing');
      } else if (systemInfoSubStep === 'testing') {
        // Check if all builds have BKC data already (from previous save)
        checkExistingBkcData();
        // After testing, go to BKC Details
        setCurrentStep('bkcDetails');
      }
    } else if (currentStep === 'bkcDetails') {
      // Mark BKC Details as completed
      const updatedBuilds = [...builds];
      updatedBuilds.forEach(build => {
        build.stepCompleted.bkcDetails = true;
      });
      setBuilds(updatedBuilds);
      
      // Initialize quality details based on testing results
      initializeQualityDetails();
      
      // Go to Quality Indicator step
      setCurrentStep('qualityIndicator');
    } else if (currentStep === 'qualityIndicator') {
      // Mark Quality Indicator as completed
      const updatedBuilds = [...builds];
      updatedBuilds.forEach(build => {
        build.stepCompleted.qualityDetails = true;
      });
      setBuilds(updatedBuilds);
      
      // Ready to save - show review
      setShowReview(true);
    }
  };

  // Navigate to previous step/sub-step
  const navigatePrevious = () => {
    if (currentStep === 'systemInfo') {
      if (systemInfoSubStep === 'chassisInfo') {
        setCurrentStep('generalInfo');
      } else if (systemInfoSubStep === 'cpuInfo') {
        setSystemInfoSubStep('chassisInfo');
      } else if (systemInfoSubStep === 'componentInfo') {
        setSystemInfoSubStep('cpuInfo');
      } else if (systemInfoSubStep === 'testing') {
        setSystemInfoSubStep('componentInfo');
      }
    } else if (currentStep === 'rework') {
      setCurrentStep('systemInfo');
      setSystemInfoSubStep('testing');
    } else if (currentStep === 'bkcDetails') {
      setCurrentStep('systemInfo');
      setSystemInfoSubStep('testing');
    } else if (currentStep === 'qualityIndicator') {
      setCurrentStep('bkcDetails');
    }
  };

  return {
    navigateNext,
    navigatePrevious,
    saveResults,
    setSaveResults,
    calculateFpyStatus
  };
};