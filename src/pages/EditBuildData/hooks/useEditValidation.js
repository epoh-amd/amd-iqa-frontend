// frontend/src/pages/EditBuildData/hooks/useEditValidation.js
import api from '../../../services/api';

export const useEditValidation = (builds, setBuilds) => {

  // Validate quality details
  const validateQualityDetails = () => {
    const errors = {};
    let isValid = true;

    builds.forEach((build, index) => {
      const buildErrors = {};

      // FPY Status validation
      if (!build.qualityDetails.fpyStatus) {
        buildErrors.fpyStatus = 'First Pass Yield status is required';
        isValid = false;
      }

      // If FPY is Fail, validate failure details
      if (build.qualityDetails.fpyStatus === 'Fail') {
        // Problem Description validation
        if (!build.qualityDetails.problemDescription || build.qualityDetails.problemDescription.trim() === '') {
          buildErrors.problemDescription = 'Problem description is required when FPY fails';
          isValid = false;
        }

        if (!build.qualityDetails.numberOfFailures || build.qualityDetails.numberOfFailures < 1) {
          buildErrors.numberOfFailures = 'Number of failures is required when FPY fails';
          isValid = false;
        } else {
          const numFailures = parseInt(build.qualityDetails.numberOfFailures);
          for (let i = 0; i < numFailures; i++) {
            if (!build.qualityDetails.failureModes[i]) {
              buildErrors[`failureMode${i}`] = `Failure Mode #${i + 1} is required`;
              isValid = false;
            }
          }
        }

        if (!build.qualityDetails.canRework) {
          buildErrors.canRework = 'Please specify if smart hand team can rework this failure';
          isValid = false;
        }
      }

      if (Object.keys(buildErrors).length > 0) {
        errors[index] = buildErrors;
      }
    });

    // Update builds with errors
    const updatedBuilds = [...builds];
    updatedBuilds.forEach((build, index) => {
      build.errors = { ...build.errors, ...(errors[index] || {}) };
    });
    setBuilds(updatedBuilds);

    return isValid;
  };

  // Validate chassis info fields
  const validateChassisInfo = (build) => {
    const errors = {};
    let isValid = true;

    // Required fields
    const requiredFields = {
      projectName: 'Project Name',
      bmcMac: 'BMC MAC',
      mbSN: 'MB S/N',
      cpuSocket: 'CPU Socket'
    };

    Object.keys(requiredFields).forEach(field => {
      if (!build.systemInfo[field] || build.systemInfo[field].trim() === '') {
        errors[field] = `${requiredFields[field]} is required`;
        isValid = false;
      }
    });

    return { isValid, errors };
  };

  // Validate CPU info fields
  const validateCpuInfo = (build) => {
    const errors = {};
    let isValid = true;

    if (!build.systemInfo.cpuProgramName || build.systemInfo.cpuProgramName.trim() === '') {
      errors.cpuProgramName = 'CPU Program Name is required';
      isValid = false;
    }

    return { isValid, errors };
  };

  // Validate component info fields
  const validateComponentInfo = (build) => {
    const errors = {};
    let isValid = true;

    const requiredFields = {
      m2PN: 'M.2 P/N',
      m2SN: 'M.2 S/N',
      dimmPN: 'DIMM P/N',
      dimmQty: 'DIMM Qty'
    };

    Object.keys(requiredFields).forEach(field => {
      if (!build.systemInfo[field] || (typeof build.systemInfo[field] === 'string' && build.systemInfo[field].trim() === '')) {
        errors[field] = `${requiredFields[field]} is required`;
        isValid = false;
      }
    });

    // Validate DIMM SNs match quantity
    if (build.systemInfo.dimmQty) {
      const expectedQty = parseInt(build.systemInfo.dimmQty);
      // Count only non-empty DIMM S/Ns
      const actualQty = build.systemInfo.dimmSNs
        ? build.systemInfo.dimmSNs.filter(sn => sn && sn.trim() !== '').length
        : 0;

      if (actualQty !== expectedQty) {
        errors.dimmSNs = `Please provide exactly ${expectedQty} DIMM S/Ns (currently have ${actualQty})`;
        isValid = false;
      }
    }

    return { isValid, errors };
  };

  // Validate testing fields
  const validateTesting = (build) => {
    const errors = {};
    let isValid = true;

    const requiredTests = {
      visualInspection: 'Visual Inspection',
      bootStatus: 'Boot Status',
      dimmsDetectedStatus: 'DIMMs Detected Status',
      lomWorkingStatus: 'LOM Working Status'
    };

    Object.keys(requiredTests).forEach(field => {
      if (!build.systemInfo[field]) {
        errors[field] = `${requiredTests[field]} is required`;
        isValid = false;
      }
    });

    // Validate notes and photos for failed tests
    const testFields = [
      { test: 'visualInspection', notes: 'visualInspectionNotes', photos: 'visualInspectionPhotos' },
      { test: 'bootStatus', notes: 'bootNotes', photos: 'bootPhotos' },
      { test: 'dimmsDetectedStatus', notes: 'dimmsDetectedNotes', photos: 'dimmsDetectedPhotos' },
      { test: 'lomWorkingStatus', notes: 'lomWorkingNotes', photos: 'lomWorkingPhotos' }
    ];

    testFields.forEach(({ test, notes, photos }) => {
      const testValue = build.systemInfo[test];
      if (testValue === 'Fail' || testValue === 'No') {
        // Notes required for failed tests
        if (!build.systemInfo[notes] || build.systemInfo[notes].trim() === '') {
          errors[notes] = 'Notes are required for failed/no tests';
          isValid = false;
        }
        // Photos required for failed tests
        if (!build.systemInfo[photos] || build.systemInfo[photos].length === 0) {
          errors[photos] = 'At least one photo is required for failed/no tests';
          isValid = false;
        }
      }
    });

    return { isValid, errors };
  };

  // Validate BKC details
  const validateBkcDetails = (build) => {
    const errors = {};
    let isValid = true;

    const requiredFields = {
      biosVersion: 'BIOS Version',
      bmcVersion: 'BMC Version',
      hpmFpgaVersion: 'HPM FPGA Version'
    };

    Object.keys(requiredFields).forEach(field => {
      if (!build.bkcDetails[field] || build.bkcDetails[field].trim() === '') {
        errors[field] = `${requiredFields[field]} is required`;
        isValid = false;
      }
    });

    return { isValid, errors };
  };

  // Check for duplicates (same as StartBuild)
  const checkDuplicates = async (build) => {
    try {
      const serialNumbers = {
        chassisSN: build.systemInfo.chassisSN,
        bmcMac: build.systemInfo.bmcMac,
        mbSN: build.systemInfo.mbSN,
        ethernetMac: build.systemInfo.ethernetMac,
        cpuP0SN: build.systemInfo.cpuP0SN,
        cpuP1SN: build.systemInfo.cpuP1SN,
        m2SN: build.systemInfo.m2SN,
        dimmSNs: build.systemInfo.dimmSNs,
        buildEngineer: build.systemInfo.buildEngineer,
        jiraTicketNo: build.systemInfo.jiraTicketNo,
        cpuVendor: build.systemInfo.cpuVendor,
        isEditMode: true, // Special flag to exclude current build from duplicate check
        originalChassisSN: build.originalData?.chassis_sn // Pass original chassis SN
      };

      const response = await api.checkDuplicates(serialNumbers, false);
      return response;
    } catch (error) {
      console.error('Error checking duplicates:', error);
      throw error;
    }
  };

  // Validate for save (READ-ONLY - does not modify state)
  // For EDIT mode: Allow saving even if fields are incomplete
  // Only validate that data is consistent (e.g., if DIMM qty is set, SNs should match)
  const validateForSave = (build) => {
    // For edit mode, we only do basic validation:
    // 1. If user filled DIMM fields, they should be consistent
    // 2. If FPY is Fail, failure details should be filled
    // We don't require all fields to be filled like in StartBuild

    const errors = {};
    let isValid = true;

    // Only validate DIMM consistency if user has entered data
    if (build.systemInfo.dimmQty && build.systemInfo.dimmSNs) {
      const expectedQty = parseInt(build.systemInfo.dimmQty);
      const actualQty = build.systemInfo.dimmSNs.filter(sn => sn && sn.trim() !== '').length;

      // Only fail if there's a mismatch (allow partial fills)
      if (actualQty > 0 && actualQty !== expectedQty) {
        errors.dimmSNs = `DIMM quantity is ${expectedQty} but you have ${actualQty} serial numbers`;
        isValid = false;
      }
    }

    // Validate quality details if FPY is Fail
    if (build.qualityDetails?.fpyStatus === 'Fail') {
      if (!build.qualityDetails.problemDescription || build.qualityDetails.problemDescription.trim() === '') {
        errors.problemDescription = 'Problem description is required when FPY fails';
        isValid = false;
      }

      if (!build.qualityDetails.numberOfFailures || build.qualityDetails.numberOfFailures < 1) {
        errors.numberOfFailures = 'Number of failures is required when FPY fails';
        isValid = false;
      } else {
        const numFailures = parseInt(build.qualityDetails.numberOfFailures);
        for (let i = 0; i < numFailures; i++) {
          if (!build.qualityDetails.failureModes[i]) {
            errors[`failureMode${i}`] = `Failure Mode #${i + 1} is required`;
            isValid = false;
          }
        }
      }

      if (!build.qualityDetails.canRework) {
        errors.canRework = 'Please specify if smart hand team can rework this failure';
        isValid = false;
      }
    }

    // Debug logging
    console.log('useEditValidation - validateForSave (EDIT MODE - Relaxed):', {
      isValid,
      errors,
      note: 'Edit mode allows saving with incomplete fields - only validates consistency'
    });

    return isValid;
  };

  // Check if quality details are valid (READ-ONLY version)
  const checkQualityDetailsValid = (build) => {
    // FPY Status validation
    if (!build.qualityDetails.fpyStatus) {
      return false;
    }

    // If FPY is Fail, validate failure details
    if (build.qualityDetails.fpyStatus === 'Fail') {
      // Problem Description validation
      if (!build.qualityDetails.problemDescription || build.qualityDetails.problemDescription.trim() === '') {
        return false;
      }

      if (!build.qualityDetails.numberOfFailures || build.qualityDetails.numberOfFailures < 1) {
        return false;
      } else {
        const numFailures = parseInt(build.qualityDetails.numberOfFailures);
        for (let i = 0; i < numFailures; i++) {
          if (!build.qualityDetails.failureModes[i]) {
            return false;
          }
        }
      }

      if (!build.qualityDetails.canRework) {
        return false;
      }
    }

    return true;
  };

  // Check if all steps are completed
  const allStepsCompleted = () => {
    return builds.every(build =>
      build.stepCompleted.generalInfo &&
      build.stepCompleted.chassisInfo &&
      build.stepCompleted.cpuInfo &&
      build.stepCompleted.componentInfo &&
      build.stepCompleted.testing &&
      build.stepCompleted.bkcDetails &&
      build.stepCompleted.qualityDetails
    );
  };

  return {
    validateQualityDetails,
    validateChassisInfo,
    validateCpuInfo,
    validateComponentInfo,
    validateTesting,
    validateBkcDetails,
    checkDuplicates,
    validateForSave,
    allStepsCompleted
  };
};
