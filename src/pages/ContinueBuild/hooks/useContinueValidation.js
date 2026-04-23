// frontend/src/pages/ContinueBuild/hooks/useContinueValidation.js
export const useContinueValidation = (builds, setBuilds) => {
  
  // Validate quality details only (since other steps are read-only)
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

  // Validate for specific save scenarios
  const validateForSave = (build, saveType) => {
    // For "Continue Later", only basic validation
    if (saveType === 'continue') {
      return build.generalInfo.location && 
             build.generalInfo.isCustomConfig !== '' &&
             build.qualityDetails?.fpyStatus;
    }
    
    // For "Save as Failed" or "Save as Complete", validate quality details
    return validateQualityDetails();
  };

  // Check if all steps are completed (for continue build, previous steps are done)
  const allStepsCompleted = () => {
    return builds.every(build => 
      build.stepCompleted.generalInfo && 
      build.stepCompleted.chassisInfo &&
      build.stepCompleted.cpuInfo &&
      build.stepCompleted.componentInfo &&
      build.stepCompleted.testing &&
      build.stepCompleted.bkcDetails
    );
  };

  return {
    validateQualityDetails,
    validateForSave,
    allStepsCompleted
  };
};