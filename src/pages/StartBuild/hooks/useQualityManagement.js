// frontend/src/pages/StartBuild/hooks/useQualityManagement.js

import { useState, useEffect } from 'react';

export const useQualityManagement = (builds, setBuilds) => {
  const [failureModes, setFailureModes] = useState({});

  // Load failure modes from database
  useEffect(() => {
    const loadFailureModes = async () => {
      try {
        const api = await import('../../../services/api');
        const modes = await api.default.getFailureModes();
        setFailureModes(modes);
      } catch (error) {
        console.error('Error loading failure modes:', error);
      }
    };
    loadFailureModes();
  }, []);

  // Handle FPY status change
  const handleFpyStatusChange = (buildIndex, status) => {
    const updatedBuilds = [...builds];
    updatedBuilds[buildIndex].qualityDetails.fpyStatus = status;
    
    // Reset failure details if status changed to Pass
    if (status === 'Pass') {
      updatedBuilds[buildIndex].qualityDetails.problemDescription = '';
      updatedBuilds[buildIndex].qualityDetails.numberOfFailures = '';
      updatedBuilds[buildIndex].qualityDetails.failureModes = [];
      updatedBuilds[buildIndex].qualityDetails.failureCategories = [];
      updatedBuilds[buildIndex].qualityDetails.canRework = '';
    }
    
    // Clear errors
    if (updatedBuilds[buildIndex].errors.fpyStatus) {
      delete updatedBuilds[buildIndex].errors.fpyStatus;
    }
    
    setBuilds(updatedBuilds);
  };

  // Handle problem description change - NEW HANDLER
  const handleProblemDescriptionChange = (buildIndex, value) => {
    const updatedBuilds = [...builds];
    updatedBuilds[buildIndex].qualityDetails.problemDescription = value;
    
    // Clear error
    if (updatedBuilds[buildIndex].errors.problemDescription) {
      delete updatedBuilds[buildIndex].errors.problemDescription;
    }
    
    setBuilds(updatedBuilds);
  };

  // Handle number of failures change
  const handleNumberOfFailuresChange = (buildIndex, value) => {
    const updatedBuilds = [...builds];
    const numberOfFailures = parseInt(value) || 0;
    
    updatedBuilds[buildIndex].qualityDetails.numberOfFailures = value;
    
    // Resize failure arrays
    updatedBuilds[buildIndex].qualityDetails.failureModes = Array(numberOfFailures).fill('');
    updatedBuilds[buildIndex].qualityDetails.failureCategories = Array(numberOfFailures).fill('');
    
    // Clear related errors
    if (updatedBuilds[buildIndex].errors.numberOfFailures) {
      delete updatedBuilds[buildIndex].errors.numberOfFailures;
    }
    
    setBuilds(updatedBuilds);
  };

  // Handle failure mode change
  const handleFailureModeChange = (buildIndex, failureIndex, mode) => {
    const updatedBuilds = [...builds];
    updatedBuilds[buildIndex].qualityDetails.failureModes[failureIndex] = mode;
    
    // Auto-populate failure category
    const category = getFailureCategoryForMode(mode);
    updatedBuilds[buildIndex].qualityDetails.failureCategories[failureIndex] = category;
    
    // Clear error for this failure mode
    if (updatedBuilds[buildIndex].errors[`failureMode${failureIndex}`]) {
      delete updatedBuilds[buildIndex].errors[`failureMode${failureIndex}`];
    }
    
    setBuilds(updatedBuilds);
  };

  // Handle can rework change
  const handleCanReworkChange = (buildIndex, value) => {
    const updatedBuilds = [...builds];
    updatedBuilds[buildIndex].qualityDetails.canRework = value;
    
    // Clear error
    if (updatedBuilds[buildIndex].errors.canRework) {
      delete updatedBuilds[buildIndex].errors.canRework;
    }
    
    setBuilds(updatedBuilds);
  };

  // Handle save option change
  const handleSaveOptionChange = (buildIndex, option) => {
    const updatedBuilds = [...builds];
    updatedBuilds[buildIndex].qualityDetails.saveOption = option;
    setBuilds(updatedBuilds);
  };

  // Get failure category for a failure mode
  const getFailureCategoryForMode = (mode) => {
    for (const [category, modes] of Object.entries(failureModes)) {
      if (modes.includes(mode)) {
        return category;
      }
    }
    return '';
  };

  // Get all failure modes as flat array
  const getAllFailureModes = () => {
    const allModes = [];
    Object.values(failureModes).forEach(modes => {
      allModes.push(...modes);
    });
    return allModes;
  };

  // Calculate build status based on quality details
  const calculateBuildStatus = (build) => {
    if (!build.qualityDetails.saveOption) return 'In Progress';
    
    switch (build.qualityDetails.saveOption) {
      case 'continue':
        return 'In Progress';
      case 'failed':
        return 'Fail';
      case 'complete':
        return 'Complete';
      default:
        return 'In Progress';
    }
  };

  // Check if build can be saved as complete
  const canSaveAsComplete = (build) => {
    // Only Pass FPY can be saved as complete
    if (build.qualityDetails.fpyStatus !== 'Pass') {
      return false;
    }
    
    // Basic validation - all required fields must be filled
    const requiredFields = [
      build.generalInfo.location,
      build.generalInfo.isCustomConfig,
      build.systemInfo.projectName,
      build.systemInfo.systemPN,
      build.systemInfo.chassisSN,
      build.systemInfo.bmcMac,
      build.systemInfo.mbSN,
      build.systemInfo.ethernetMac,
      build.systemInfo.cpuSocket,
      build.systemInfo.cpuProgramName,
      build.systemInfo.m2PN,
      build.systemInfo.m2SN,
      // build.systemInfo.dimmPN,
      build.systemInfo.dimmQty,
      build.systemInfo.visualInspection,
      build.systemInfo.bootStatus,
      build.systemInfo.dimmsDetectedStatus,
      build.systemInfo.lomWorkingStatus,
      build.bkcDetails.biosVersion,
      build.bkcDetails.hpmFpgaVersion,
      build.bkcDetails.bmcVersion
    ];
    
    // Check if any required field is empty
    const hasEmptyFields = requiredFields.some(field => !field || field === '');
    if (hasEmptyFields) return false;
    
    // Check DIMM serial numbers
    const dimmQty = parseInt(build.systemInfo.dimmQty) || 0;
    for (let i = 0; i < dimmQty; i++) {
      if (!build.systemInfo.dimmSNs[i]) {
        return false;
      }
    }
    
    // Removed M.2 S/N format check (must start with S) as per requirements
    
    return true;
  };

  // Check if build can be saved as failed
  const canSaveAsFailed = (build) => {
    return build.qualityDetails.fpyStatus === 'Fail' && 
           build.qualityDetails.canRework === 'No, mark this build as a failed build';
  };

  return {
    failureModes,
    handleFpyStatusChange,
    handleProblemDescriptionChange, // NEW EXPORT
    handleNumberOfFailuresChange,
    handleFailureModeChange,
    handleCanReworkChange,
    handleSaveOptionChange,
    getFailureCategoryForMode,
    getAllFailureModes,
    calculateBuildStatus,
    canSaveAsComplete,
    canSaveAsFailed
  };
};