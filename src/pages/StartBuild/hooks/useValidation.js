// frontend/src/pages/StartBuild/hooks/useValidation.js
// UPDATED: Strict validation for required fields - blocks navigation if any required field is missing

import { useState } from 'react';

export const useValidation = (builds, setBuilds) => {
  const [detailedErrors, setDetailedErrors] = useState({});

  // STRICT VALIDATION: Validate General Information - BLOCKS navigation if incomplete
  const validateGeneralInfo = () => {
    const errors = {};
    let isValid = true;

    builds.forEach((build, index) => {
      const buildErrors = {};
      
      // ALL REQUIRED - cannot proceed without these
      if (!build.generalInfo.location) {
        buildErrors.location = 'Location is required';
        isValid = false;
      }
      
      if (!build.generalInfo.buildEngineer) {
        buildErrors.buildEngineer = 'Build Engineer is required';
        isValid = false;
      }
      
      if (!build.generalInfo.isCustomConfig) {
        buildErrors.isCustomConfig = 'Configuration is required';
        isValid = false;
      }

      if (Object.keys(buildErrors).length > 0) {
        errors[index] = buildErrors;
      }
    });

    const updatedBuilds = [...builds];
    updatedBuilds.forEach((build, index) => {
      build.errors = { ...build.errors, ...(errors[index] || {}) };
    });
    setBuilds(updatedBuilds);

    return isValid;
  };

  // STRICT VALIDATION: Validate Chassis Info - BLOCKS navigation if incomplete
  const validateChassisInfo = () => {
    // IMPORTANT: Check cross-build duplicates first (RESTORED)
    const hasNoCrossBuildDuplicates = checkCrossBuildDuplicates(builds, setBuilds);
    
    if (!hasNoCrossBuildDuplicates) {
      return false; // Block navigation if duplicates found
    }

    const errors = {};
    let isValid = true;

    builds.forEach((build, index) => {
      const buildErrors = {};
      
      // ALL REQUIRED - cannot proceed without these
      if (!build.systemInfo.projectName) {
        buildErrors.projectName = 'Project Name is required';
        isValid = false;
      }
      if (!build.systemInfo.systemPN) {
        buildErrors.systemPN = 'System P/N is required';
        isValid = false;
      }
      if (!build.systemInfo.chassisSN) {
        buildErrors.chassisSN = 'Chassis S/N is required';
        isValid = false;
      }
      if (!build.systemInfo.jiraTicketNo) {
        buildErrors.jiraTicketNo = 'Jira Ticket No is required';
        isValid = false;
      }
      if (!build.systemInfo.bmcMac) {
        buildErrors.bmcMac = 'BMC MAC is required';
        isValid = false;
      }
      if (!build.systemInfo.mbSN) {
        buildErrors.mbSN = 'MB S/N is required';
        isValid = false;
      }
      if (!build.systemInfo.cpuSocket) {
        buildErrors.cpuSocket = 'CPU Socket is required';
        isValid = false;
      }
      if (!build.systemInfo.cpuVendor) {
        buildErrors.cpuVendor = 'CPU Vendor is required';
        isValid = false;
      }
      // Note: ethernetMac is OPTIONAL per requirements

      if (Object.keys(buildErrors).length > 0) {
        errors[index] = buildErrors;
      }
    });

    const updatedBuilds = [...builds];
    updatedBuilds.forEach((build, index) => {
      build.errors = { ...build.errors, ...(errors[index] || {}) };
    });
    setBuilds(updatedBuilds);

    return isValid;
  };

  // STRICT VALIDATION: Validate CPU Info - BLOCKS navigation if incomplete
  const validateCpuInfo = () => {
    // IMPORTANT: Check cross-build duplicates first (RESTORED)
    const hasNoCrossBuildDuplicates = checkCrossBuildDuplicates(builds, setBuilds);
    
    if (!hasNoCrossBuildDuplicates) {
      return false; // Block navigation if duplicates found
    }
    
    const errors = {};
    let isValid = true;

    builds.forEach((build, index) => {
      const buildErrors = {};
      
      // REQUIRED field
      if (!build.systemInfo.cpuProgramName) {
        buildErrors.cpuProgramName = 'CPU Program Name is required';
        isValid = false;
      }
      // Note: CPU P0 and P1 S/N are OPTIONAL per requirements

      if (Object.keys(buildErrors).length > 0) {
        errors[index] = buildErrors;
      }
    });

    const updatedBuilds = [...builds];
    updatedBuilds.forEach((build, index) => {
      build.errors = { ...build.errors, ...(errors[index] || {}) };
    });
    setBuilds(updatedBuilds);

    return isValid;
  };

  // STRICT VALIDATION: Validate Component Info - BLOCKS navigation if incomplete
  const validateComponentInfo = () => {
    // IMPORTANT: Check cross-build duplicates first (RESTORED)
    const hasNoCrossBuildDuplicates = checkCrossBuildDuplicates(builds, setBuilds);
    
    if (!hasNoCrossBuildDuplicates) {
      return false; // Block navigation if duplicates found
    }

    const errors = {};
    let isValid = true;

    builds.forEach((build, index) => {
      const buildErrors = {};
      
      // ALL REQUIRED - cannot proceed without these
      // Updated validation for M.2 P/N to handle custom entries
      if (!build.systemInfo.m2PN && (!build.systemInfo.m2PNOther || !build.systemInfo.m2PNCustom)) {
        buildErrors.m2PN = 'M.2 P/N is required';
        isValid = false;
      }
      
      if (!build.systemInfo.m2SN) {
        buildErrors.m2SN = 'M.2 S/N is required';
        isValid = false;
      }
      if (!build.systemInfo.dimmQty) {
        buildErrors.dimmQty = 'DIMM Quantity is required';
        isValid = false;
      }

      // Validate ALL DIMM S/Ns based on quantity
      const dimmQty = parseInt(build.systemInfo.dimmQty) || 0;
      for (let i = 0; i < dimmQty; i++) {
        if (!build.systemInfo.dimmSNs[i]) {
          buildErrors[`dimmSN${i}`] = `DIMM S/N #${i + 1} is required`;
          isValid = false;
        }
      }

      if (Object.keys(buildErrors).length > 0) {
        errors[index] = buildErrors;
      }
    });

    const updatedBuilds = [...builds];
    updatedBuilds.forEach((build, index) => {
      build.errors = { ...build.errors, ...(errors[index] || {}) };
    });
    setBuilds(updatedBuilds);

    return isValid;
  };

  // STRICT VALIDATION: Validate Testing - BLOCKS navigation if incomplete
  const validateTesting = () => {
    const errors = {};
    let isValid = true;

    builds.forEach((build, index) => {
      const buildErrors = {};
      
      // ALL TESTING FIELDS ARE REQUIRED - cannot proceed without these
      if (!build.systemInfo.visualInspection) {
        buildErrors.visualInspection = 'Visual Inspection is required';
        isValid = false;
      }
      if (!build.systemInfo.bootStatus) {
        buildErrors.bootStatus = 'Boot Status is required';
        isValid = false;
      }
      if (!build.systemInfo.dimmsDetectedStatus) {
        buildErrors.dimmsDetectedStatus = 'DIMMs Detected is required';
        isValid = false;
      }
      if (!build.systemInfo.lomWorkingStatus) {
        buildErrors.lomWorkingStatus = 'LOM Working is required';
        isValid = false;
      }

      // MANDATORY: Validate failure documentation - REQUIRED when test fails
      if (build.systemInfo.visualInspection === 'Fail') {
        if (!build.systemInfo.visualInspectionNotes) {
          buildErrors.visualInspectionNotes = 'Notes required for failed inspection';
          isValid = false;
        }
        if (!build.systemInfo.visualInspectionPhotos || build.systemInfo.visualInspectionPhotos.length === 0) {
          buildErrors.visualInspectionPhotos = 'Photos required for failed inspection';
          isValid = false;
        }
      }

      if (build.systemInfo.bootStatus === 'No') {
        if (!build.systemInfo.bootNotes) {
          buildErrors.bootNotes = 'Notes required when boot fails';
          isValid = false;
        }
        if (!build.systemInfo.bootPhotos || build.systemInfo.bootPhotos.length === 0) {
          buildErrors.bootPhotos = 'Photos required when boot fails';
          isValid = false;
        }
      }

      if (build.systemInfo.dimmsDetectedStatus === 'No') {
        if (!build.systemInfo.dimmsDetectedNotes) {
          buildErrors.dimmsDetectedNotes = 'Notes required when DIMMs not detected';
          isValid = false;
        }
        if (!build.systemInfo.dimmsDetectedPhotos || build.systemInfo.dimmsDetectedPhotos.length === 0) {
          buildErrors.dimmsDetectedPhotos = 'Photos required when DIMMs not detected';
          isValid = false;
        }
      }

      if (build.systemInfo.lomWorkingStatus === 'No') {
        if (!build.systemInfo.lomWorkingNotes) {
          buildErrors.lomWorkingNotes = 'Notes required when LOM not working';
          isValid = false;
        }
        if (!build.systemInfo.lomWorkingPhotos || build.systemInfo.lomWorkingPhotos.length === 0) {
          buildErrors.lomWorkingPhotos = 'Photos required when LOM not working';
          isValid = false;
        }
      }

      if (Object.keys(buildErrors).length > 0) {
        errors[index] = buildErrors;
      }
    });

    const updatedBuilds = [...builds];
    updatedBuilds.forEach((build, index) => {
      build.errors = { ...build.errors, ...(errors[index] || {}) };
    });
    setBuilds(updatedBuilds);

    return isValid;
  };

  // STRICT VALIDATION: Validate BKC Details - NEWLY ADDED
  // Previously had no validation, now enforces required fields
  const validateBkcDetails = () => {
    const errors = {};
    let isValid = true;

    builds.forEach((build, index) => {
      const buildErrors = {};
      
      // REQUIRED BKC fields - cannot proceed without these
      if (!build.bkcDetails.biosVersion) {
        buildErrors.biosVersion = 'BIOS Version is required';
        isValid = false;
      }
      if (!build.bkcDetails.hpmFpgaVersion) {
        buildErrors.hpmFpgaVersion = 'HPM FPGA Version is required';
        isValid = false;
      }
      if (!build.bkcDetails.bmcVersion) {
        buildErrors.bmcVersion = 'BMC Version is required';
        isValid = false;
      }
      // Note: scmFpgaVersion is OPTIONAL per UI specifications

      if (Object.keys(buildErrors).length > 0) {
        errors[index] = buildErrors;
      }
    });

    const updatedBuilds = [...builds];
    updatedBuilds.forEach((build, index) => {
      build.errors = { ...build.errors, ...(errors[index] || {}) };
    });
    setBuilds(updatedBuilds);

    return isValid;
  };

  // STRICT VALIDATION: Validate Quality Indicators - BLOCKS final save if incomplete
  const validateQualityIndicators = () => {
    const errors = {};
    let isValid = true;

    builds.forEach((build, index) => {
      const buildErrors = {};
      
      // REQUIRED for quality step
      if (!build.qualityDetails.fpyStatus) {
        buildErrors.fpyStatus = 'FPY Status is required';
        isValid = false;
      }

      // REQUIRED fields when FPY fails
      if (build.qualityDetails.fpyStatus === 'Fail') {
        if (!build.qualityDetails.problemDescription) {
          buildErrors.problemDescription = 'Problem description required for failed FPY';
          isValid = false;
        }
        if (!build.qualityDetails.canRework) {
          buildErrors.canRework = 'Rework option is required for failed FPY';
          isValid = false;
        }
      }

      // REQUIRED for final save
      if (!build.qualityDetails.saveOption) {
        buildErrors.saveOption = 'Save option is required';
        isValid = false;
      }

      if (Object.keys(buildErrors).length > 0) {
        errors[index] = buildErrors;
      }
    });

    const updatedBuilds = [...builds];
    updatedBuilds.forEach((build, index) => {
      build.errors = { ...build.errors, ...(errors[index] || {}) };
    });
    setBuilds(updatedBuilds);

    return isValid;
  };

  // COMPREHENSIVE: Validate all steps before Quality Indicator
  const validateBeforeQualityIndicator = () => {
    console.log('Validating all steps before Quality Indicator...');

    // Check cross-build duplicates first
    const hasNoCrossBuildDuplicates = checkCrossBuildDuplicates(builds, setBuilds);
    
    if (!hasNoCrossBuildDuplicates) {
      console.log('Cross-build duplicates found - blocking navigation');
      return false;
    }
    
    // Check if all builds have completed all required steps
    let allValid = true;
    const stepValidationErrors = [];

    builds.forEach((build, index) => {
      const buildRef = `Build ${index + 1}`;
      
      // STRICT: Check General Info completion - ALL REQUIRED
      if (!build.stepCompleted.generalInfo) {
        if (!build.generalInfo.location) {
          stepValidationErrors.push(`${buildRef}: Location is required`);
          allValid = false;
        }
        if (!build.generalInfo.buildEngineer) {
          stepValidationErrors.push(`${buildRef}: Build Engineer is required`);
          allValid = false;
        }
        if (!build.generalInfo.isCustomConfig) {
          stepValidationErrors.push(`${buildRef}: Configuration type is required`);
          allValid = false;
        }
      }

      // STRICT: Check Chassis Info completion - ALL REQUIRED
      if (!build.stepCompleted.chassisInfo) {
        if (!build.systemInfo.projectName) {
          stepValidationErrors.push(`${buildRef}: Project Name is required`);
          allValid = false;
        }
        if (!build.systemInfo.systemPN) {
          stepValidationErrors.push(`${buildRef}: System P/N is required`);
          allValid = false;
        }
        if (!build.systemInfo.chassisSN) {
          stepValidationErrors.push(`${buildRef}: Chassis S/N is required`);
          allValid = false;
        }
        if (!build.systemInfo.jiraTicketNo) {
          stepValidationErrors.push(`${buildRef}: Jira Ticket No is required`);
          allValid = false;
        }
        if (!build.systemInfo.bmcMac) {
          stepValidationErrors.push(`${buildRef}: BMC MAC is required`);
          allValid = false;
        }
        if (!build.systemInfo.mbSN) {
          stepValidationErrors.push(`${buildRef}: MB S/N is required`);
          allValid = false;
        }
        if (!build.systemInfo.cpuSocket) {
          stepValidationErrors.push(`${buildRef}: CPU Socket is required`);
          allValid = false;
        }
        if (!build.systemInfo.cpuVendor) {
          stepValidationErrors.push(`${buildRef}: CPU Vendor is required`);
          allValid = false;
        }
        // Note: ethernetMac is OPTIONAL
      }

      // STRICT: Check CPU Info completion - REQUIRED
      if (!build.stepCompleted.cpuInfo) {
        if (!build.systemInfo.cpuProgramName) {
          stepValidationErrors.push(`${buildRef}: CPU Program Name is required`);
          allValid = false;
        }
        // Note: CPU P0/P1 S/N are OPTIONAL
      }

      // STRICT: Check Component Info completion - ALL REQUIRED
      if (!build.stepCompleted.componentInfo) {
        if (!build.systemInfo.m2PN && (!build.systemInfo.m2PNOther || !build.systemInfo.m2PNCustom)) {
          stepValidationErrors.push(`${buildRef}: M.2 P/N is required`);
          allValid = false;
        }
        if (!build.systemInfo.m2SN) {
          stepValidationErrors.push(`${buildRef}: M.2 S/N is required`);
          allValid = false;
        }
        if (!build.systemInfo.dimmQty) {
          stepValidationErrors.push(`${buildRef}: DIMM Quantity is required`);
          allValid = false;
        }

        // Validate ALL DIMM S/Ns
        const dimmQty = parseInt(build.systemInfo.dimmQty) || 0;
        for (let i = 0; i < dimmQty; i++) {
          if (!build.systemInfo.dimmSNs[i]) {
            stepValidationErrors.push(`${buildRef}: DIMM S/N #${i + 1} is required`);
            allValid = false;
          }
        }
      }

      // STRICT: Check Testing completion - ALL REQUIRED
      if (!build.stepCompleted.testing) {
        if (!build.systemInfo.visualInspection) {
          stepValidationErrors.push(`${buildRef}: Visual Inspection is required`);
          allValid = false;
        }
        if (!build.systemInfo.bootStatus) {
          stepValidationErrors.push(`${buildRef}: Boot Status is required`);
          allValid = false;
        }
        if (!build.systemInfo.dimmsDetectedStatus) {
          stepValidationErrors.push(`${buildRef}: DIMMs Detected is required`);
          allValid = false;
        }
        if (!build.systemInfo.lomWorkingStatus) {
          stepValidationErrors.push(`${buildRef}: LOM Working is required`);
          allValid = false;
        }

        // STRICT: Validate failure documentation - REQUIRED when tests fail
        if (build.systemInfo.visualInspection === 'Fail') {
          if (!build.systemInfo.visualInspectionNotes) {
            stepValidationErrors.push(`${buildRef}: Notes required for failed visual inspection`);
            allValid = false;
          }
          if (!build.systemInfo.visualInspectionPhotos || build.systemInfo.visualInspectionPhotos.length === 0) {
            stepValidationErrors.push(`${buildRef}: Photos required for failed visual inspection`);
            allValid = false;
          }
        }

        if (build.systemInfo.bootStatus === 'No') {
          if (!build.systemInfo.bootNotes) {
            stepValidationErrors.push(`${buildRef}: Notes required when boot fails`);
            allValid = false;
          }
          if (!build.systemInfo.bootPhotos || build.systemInfo.bootPhotos.length === 0) {
            stepValidationErrors.push(`${buildRef}: Photos required when boot fails`);
            allValid = false;
          }
        }

        if (build.systemInfo.dimmsDetectedStatus === 'No') {
          if (!build.systemInfo.dimmsDetectedNotes) {
            stepValidationErrors.push(`${buildRef}: Notes required when DIMMs not detected`);
            allValid = false;
          }
          if (!build.systemInfo.dimmsDetectedPhotos || build.systemInfo.dimmsDetectedPhotos.length === 0) {
            stepValidationErrors.push(`${buildRef}: Photos required when DIMMs not detected`);
            allValid = false;
          }
        }

        if (build.systemInfo.lomWorkingStatus === 'No') {
          if (!build.systemInfo.lomWorkingNotes) {
            stepValidationErrors.push(`${buildRef}: Notes required when LOM not working`);
            allValid = false;
          }
          if (!build.systemInfo.lomWorkingPhotos || build.systemInfo.lomWorkingPhotos.length === 0) {
            stepValidationErrors.push(`${buildRef}: Photos required when LOM not working`);
            allValid = false;
          }
        }
      }

      // STRICT: Check BKC Details completion - NEWLY REQUIRED
      if (!build.stepCompleted.bkcDetails) {
        if (!build.bkcDetails.biosVersion) {
          stepValidationErrors.push(`${buildRef}: BIOS Version is required`);
          allValid = false;
        }
        if (!build.bkcDetails.hpmFpgaVersion) {
          stepValidationErrors.push(`${buildRef}: HPM FPGA Version is required`);
          allValid = false;
        }
        if (!build.bkcDetails.bmcVersion) {
          stepValidationErrors.push(`${buildRef}: BMC Version is required`);
          allValid = false;
        }
        // Note: scmFpgaVersion is OPTIONAL
      }
    });

    // Log validation results
    if (allValid) {
      console.log('All validation checks passed!');
    } else {
      console.log('Validation errors found:', stepValidationErrors);
    }

    return allValid;
  };

  // STRICT VALIDATION: Complete validation for final save
  const validateForSave = (build, saveOption = 'continue') => {
    if (!build) {
      console.error('No build provided for validation');
      return false;
    }

    const buildErrors = {};
    let isValid = true;
    
    // ALWAYS REQUIRED: General Info validation
    if (!build.generalInfo.location) {
      buildErrors.location = 'Location is required';
      isValid = false;
    }
    if (!build.generalInfo.buildEngineer) {
      buildErrors.buildEngineer = 'Build Engineer is required';
      isValid = false;
    }
    if (!build.generalInfo.isCustomConfig) {
      buildErrors.isCustomConfig = 'Configuration is required';
      isValid = false;
    }

    // STRICT: Additional validation for 'complete' save option
    if (saveOption === 'complete') {
      // ALL System Info fields REQUIRED for complete save
      if (!build.systemInfo.projectName) {
        buildErrors.projectName = 'Project name is required';
        isValid = false;
      }
      if (!build.systemInfo.systemPN) {
        buildErrors.systemPN = 'System P/N is required';
        isValid = false;
      }
      if (!build.systemInfo.chassisSN) {
        buildErrors.chassisSN = 'Chassis S/N is required';
        isValid = false;
      }
      if (!build.systemInfo.jiraTicketNo) {
        buildErrors.jiraTicketNo = 'Jira Ticket No is required';
        isValid = false;
      }
      if (!build.systemInfo.bmcMac) {
        buildErrors.bmcMac = 'BMC MAC is required';
        isValid = false;
      }
      if (!build.systemInfo.mbSN) {
        buildErrors.mbSN = 'MB S/N is required';
        isValid = false;
      }
      if (!build.systemInfo.cpuSocket) {
        buildErrors.cpuSocket = 'CPU Socket is required';
        isValid = false;
      }
      if (!build.systemInfo.cpuVendor) {
        buildErrors.cpuVendor = 'CPU Vendor is required';
        isValid = false;
      }
      if (!build.systemInfo.cpuProgramName) {
        buildErrors.cpuProgramName = 'CPU Program Name is required';
        isValid = false;
      }
      if (!build.systemInfo.m2PN && (!build.systemInfo.m2PNOther || !build.systemInfo.m2PNCustom)) {
        buildErrors.m2PN = 'M.2 P/N is required';
        isValid = false;
      }
      if (!build.systemInfo.m2SN) {
        buildErrors.m2SN = 'M.2 S/N is required';
        isValid = false;
      }
      if (!build.systemInfo.dimmQty) {
        buildErrors.dimmQty = 'DIMM Quantity is required';
        isValid = false;
      }

      // Validate ALL DIMM S/Ns for complete save
      const dimmQty = parseInt(build.systemInfo.dimmQty) || 0;
      for (let i = 0; i < dimmQty; i++) {
        if (!build.systemInfo.dimmSNs[i]) {
          buildErrors[`dimmSN${i}`] = `DIMM S/N #${i + 1} is required`;
          isValid = false;
        }
      }

      // ALL Testing fields REQUIRED for complete save
      if (!build.systemInfo.visualInspection) {
        buildErrors.visualInspection = 'Visual Inspection is required';
        isValid = false;
      }
      if (!build.systemInfo.bootStatus) {
        buildErrors.bootStatus = 'Boot Status is required';
        isValid = false;
      }
      if (!build.systemInfo.dimmsDetectedStatus) {
        buildErrors.dimmsDetectedStatus = 'DIMMs Detected is required';
        isValid = false;
      }
      if (!build.systemInfo.lomWorkingStatus) {
        buildErrors.lomWorkingStatus = 'LOM Working is required';
        isValid = false;
      }

      // STRICT: BKC Details REQUIRED for complete save
      if (!build.bkcDetails.biosVersion) {
        buildErrors.biosVersion = 'BIOS Version is required';
        isValid = false;
      }
      if (!build.bkcDetails.hpmFpgaVersion) {
        buildErrors.hpmFpgaVersion = 'HPM FPGA Version is required';
        isValid = false;
      }
      if (!build.bkcDetails.bmcVersion) {
        buildErrors.bmcVersion = 'BMC Version is required';
        isValid = false;
      }
      // Note: scmFpgaVersion is OPTIONAL per UI specifications

      // Quality details REQUIRED for complete save
      if (!build.qualityDetails.fpyStatus) {
        buildErrors.fpyStatus = 'FPY Status is required';
        isValid = false;
      }

      // Failure documentation REQUIRED when tests fail
      if (build.systemInfo.visualInspection === 'Fail') {
        if (!build.systemInfo.visualInspectionNotes) {
          buildErrors.visualInspectionNotes = 'Notes required for failed visual inspection';
          isValid = false;
        }
        if (!build.systemInfo.visualInspectionPhotos || build.systemInfo.visualInspectionPhotos.length === 0) {
          buildErrors.visualInspectionPhotos = 'Photos required for failed visual inspection';
          isValid = false;
        }
      }

      if (build.systemInfo.bootStatus === 'No') {
        if (!build.systemInfo.bootNotes) {
          buildErrors.bootNotes = 'Notes required when boot fails';
          isValid = false;
        }
        if (!build.systemInfo.bootPhotos || build.systemInfo.bootPhotos.length === 0) {
          buildErrors.bootPhotos = 'Photos required when boot fails';
          isValid = false;
        }
      }

      if (build.systemInfo.dimmsDetectedStatus === 'No') {
        if (!build.systemInfo.dimmsDetectedNotes) {
          buildErrors.dimmsDetectedNotes = 'Notes required when DIMMs not detected';
          isValid = false;
        }
        if (!build.systemInfo.dimmsDetectedPhotos || build.systemInfo.dimmsDetectedPhotos.length === 0) {
          buildErrors.dimmsDetectedPhotos = 'Photos required when DIMMs not detected';
          isValid = false;
        }
      }

      if (build.systemInfo.lomWorkingStatus === 'No') {
        if (!build.systemInfo.lomWorkingNotes) {
          buildErrors.lomWorkingNotes = 'Notes required when LOM not working';
          isValid = false;
        }
        if (!build.systemInfo.lomWorkingPhotos || build.systemInfo.lomWorkingPhotos.length === 0) {
          buildErrors.lomWorkingPhotos = 'Photos required when LOM not working';
          isValid = false;
        }
      }
    }

    // Update build errors if build is part of builds array
    if (builds.some(b => b.id === build.id)) {
      const updatedBuilds = [...builds];
      const buildIndex = updatedBuilds.findIndex(b => b.id === build.id);
      if (buildIndex !== -1) {
        updatedBuilds[buildIndex].errors = { ...updatedBuilds[buildIndex].errors, ...buildErrors };
        setBuilds(updatedBuilds);
      }
    }

    return isValid;
  };

  return {
    validateGeneralInfo,
    validateChassisInfo,
    validateCpuInfo,
    validateComponentInfo,
    validateTesting,
    validateBkcDetails,
    validateQualityIndicators,
    validateBeforeQualityIndicator,
    validateForSave,
    detailedErrors,
    setDetailedErrors,
  };
};

// Cross-build duplicate validation functions (exported separately)
export const validateCrossBuildDuplicates = (builds) => {
  const duplicateErrors = {};
  const serialNumberMap = new Map();
  
  // Control fields that need to be unique across builds
  const controlFields = [
    'chassisSN', 'mbSN', 'bmcMac', 'ethernetMac', 
    'cpuP0SN', 'cpuP1SN', 'm2SN'
  ];

  // Check each control field across all builds
  controlFields.forEach(field => {
    const fieldMap = new Map();
    
    builds.forEach((build, buildIndex) => {
      const value = build.systemInfo[field];
      
      if (value && value.trim()) {
        const trimmedValue = value.trim().toLowerCase();
        
        if (fieldMap.has(trimmedValue)) {
          // Found duplicate
          const firstBuildIndex = fieldMap.get(trimmedValue);
          
          // Add error to first build
          if (!duplicateErrors[firstBuildIndex]) {
            duplicateErrors[firstBuildIndex] = {};
          }
          duplicateErrors[firstBuildIndex][field] = `Duplicate found in Build ${buildIndex + 1}`;
          
          // Add error to current build
          if (!duplicateErrors[buildIndex]) {
            duplicateErrors[buildIndex] = {};
          }
          duplicateErrors[buildIndex][field] = `Duplicate found in Build ${firstBuildIndex + 1}`;
        } else {
          fieldMap.set(trimmedValue, buildIndex);
        }
      }
    });
  });

  // Check DIMM serial numbers across builds - use separate map for DIMM tracking
  const dimmSerialNumberMap = new Map();
  
  builds.forEach((build, buildIndex) => {
    const dimmSNs = build.systemInfo.dimmSNs || [];
    
    dimmSNs.forEach((dimmSN, dimmIndex) => {
      if (dimmSN && dimmSN.trim()) {
        const trimmedDimmSN = dimmSN.trim().toLowerCase();
        
        if (dimmSerialNumberMap.has(trimmedDimmSN)) {
          const firstOccurrence = dimmSerialNumberMap.get(trimmedDimmSN);
          
          // Add error to first build - ensure consistent field naming
          if (!duplicateErrors[firstOccurrence.buildIndex]) {
            duplicateErrors[firstOccurrence.buildIndex] = {};
          }
          duplicateErrors[firstOccurrence.buildIndex][`dimmSN${firstOccurrence.dimmIndex}`] = 
            `Duplicate DIMM S/N found in Build ${buildIndex + 1}`;
          
          // Add error to current build - ensure consistent field naming
          if (!duplicateErrors[buildIndex]) {
            duplicateErrors[buildIndex] = {};
          }
          duplicateErrors[buildIndex][`dimmSN${dimmIndex}`] = 
            `Duplicate DIMM S/N found in Build ${firstOccurrence.buildIndex + 1}`;
        } else {
          dimmSerialNumberMap.set(trimmedDimmSN, { buildIndex, dimmIndex });
        }
      }
    });
  });

  return duplicateErrors;
};

export const checkCrossBuildDuplicates = (builds, setBuilds) => {
  console.log('🔍 Starting cross-build duplicate check...');
  
  const crossBuildErrors = validateCrossBuildDuplicates(builds);
  console.log('🔍 Cross-build errors found:', crossBuildErrors);
  
  // Control fields that need to be cleared of duplicate errors
  const controlFields = [
    'chassisSN', 'mbSN', 'bmcMac', 'ethernetMac', 
    'cpuP0SN', 'cpuP1SN', 'm2SN'
  ];
  
  // Clear ALL existing duplicate errors first from ALL builds - more aggressive clearing
  const updatedBuilds = builds.map((build, index) => {
    const clearedErrors = { ...build.errors };
    const originalErrorCount = Object.keys(clearedErrors).length;
    
    // Remove duplicate errors for control fields
    controlFields.forEach(field => {
      if (clearedErrors[field] && 
          (clearedErrors[field].includes('Duplicate') || clearedErrors[field].includes('duplicate'))) {
        console.log(`🧹 Clearing duplicate error for ${field} in build ${index + 1}`);
        delete clearedErrors[field];
      }
    });
    
    // Remove ALL DIMM duplicate errors - more aggressive clearing
    Object.keys(clearedErrors).forEach(key => {
      // Clear any field that starts with 'dimmSN' and has duplicate-related errors
      if (key.startsWith('dimmSN') && clearedErrors[key]) {
        const errorMsg = clearedErrors[key].toLowerCase();
        if (errorMsg.includes('duplicate') || errorMsg.includes('found in build')) {
          console.log(`🧹 Clearing DIMM duplicate error for ${key} in build ${index + 1}: "${clearedErrors[key]}"`);
          delete clearedErrors[key];
        }
      }
    });
    
    const finalErrorCount = Object.keys(clearedErrors).length;
    if (originalErrorCount !== finalErrorCount) {
      console.log(`🧹 Build ${index + 1}: Cleared ${originalErrorCount - finalErrorCount} duplicate errors`);
    }
    
    return {
      ...build,
      errors: clearedErrors
    };
  });
  
  // Now apply only the NEW duplicate errors found
  const finalBuilds = updatedBuilds.map((build, index) => ({
    ...build,
    errors: {
      ...build.errors,
      ...(crossBuildErrors[index] || {})
    }
  }));
  
  setBuilds(finalBuilds);
  
  // Return true if NO duplicates found, false if duplicates exist
  const hasDuplicates = Object.keys(crossBuildErrors).length > 0;
  console.log('🔍 Final result - has duplicates:', hasDuplicates);
  
  return !hasDuplicates;
};