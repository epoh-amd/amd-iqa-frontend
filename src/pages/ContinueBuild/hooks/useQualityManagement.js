// frontend/src/pages/ContinueBuild/hooks/useQualityManagement.js
import { useState } from 'react';

export const useQualityManagement = (builds, setBuilds) => {
  // Failure modes data
  const failureModes = {
    'CPU': [
      'CPU not detected',
      'CPU error during POST',
      'CPU overheating',
      'CPU socket damage'
    ],
    'Memory': [
      'Memory not detected',
      'Memory error during test',
      'Memory slot damage',
      'Memory configuration error'
    ],
    'Storage': [
      'Drive not detected',
      'Drive error',
      'RAID configuration failure',
      'Boot device error'
    ],
    'Network': [
      'NIC not detected',
      'Link failure',
      'MAC address issue',
      'Network performance issue'
    ],
    'Power': [
      'PSU failure',
      'Power on failure',
      'Voltage regulation issue',
      'Power connector damage'
    ],
    'Cooling': [
      'Fan failure',
      'Thermal sensor error',
      'Inadequate cooling',
      'Fan noise issue'
    ],
    'BMC/IPMI': [
      'BMC not responding',
      'IPMI connection failure',
      'Sensor reading error',
      'Firmware corruption'
    ],
    'Other': [
      'Physical damage',
      'Configuration error',
      'Component incompatibility',
      'Unknown error'
    ]
  };

  // Handle input changes (for editable fields only)
  const handleInputChange = (buildIndex, section, field, value) => {
    const updatedBuilds = [...builds];
    updatedBuilds[buildIndex][section][field] = value;
    
    // Clear related errors
    if (updatedBuilds[buildIndex].errors?.[field]) {
      delete updatedBuilds[buildIndex].errors[field];
    }
    
    setBuilds(updatedBuilds);
  };

  // Handle FPY status change
  const handleFpyStatusChange = (buildIndex, value) => {
    const updatedBuilds = [...builds];
    updatedBuilds[buildIndex].qualityDetails.fpyStatus = value;
    
    // Reset failure details if changing to Pass
    if (value === 'Pass') {
      updatedBuilds[buildIndex].qualityDetails.problemDescription = '';
      updatedBuilds[buildIndex].qualityDetails.numberOfFailures = 0;
      updatedBuilds[buildIndex].qualityDetails.failureModes = [];
      updatedBuilds[buildIndex].qualityDetails.canRework = '';
    }
    
    // Clear errors
    if (updatedBuilds[buildIndex].errors?.fpyStatus) {
      delete updatedBuilds[buildIndex].errors.fpyStatus;
    }
    
    setBuilds(updatedBuilds);
  };

  // Handle problem description change
  const handleProblemDescriptionChange = (buildIndex, value) => {
    const updatedBuilds = [...builds];
    updatedBuilds[buildIndex].qualityDetails.problemDescription = value;
    
    // Clear error
    if (updatedBuilds[buildIndex].errors?.problemDescription) {
      delete updatedBuilds[buildIndex].errors.problemDescription;
    }
    
    setBuilds(updatedBuilds);
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

  // Handle number of failures change
  const handleNumberOfFailuresChange = (buildIndex, value) => {
    const updatedBuilds = [...builds];
    const numFailures = parseInt(value) || 0;
    
    updatedBuilds[buildIndex].qualityDetails.numberOfFailures = numFailures;
    
    // Adjust failure modes array
    const currentModes = updatedBuilds[buildIndex].qualityDetails.failureModes || [];
    if (numFailures > currentModes.length) {
      // Add empty slots
      updatedBuilds[buildIndex].qualityDetails.failureModes = [
        ...currentModes,
        ...Array(numFailures - currentModes.length).fill('')
      ];
    } else {
      // Trim excess
      updatedBuilds[buildIndex].qualityDetails.failureModes = currentModes.slice(0, numFailures);
    }
    
    // Clear error
    if (updatedBuilds[buildIndex].errors?.numberOfFailures) {
      delete updatedBuilds[buildIndex].errors.numberOfFailures;
    }
    
    setBuilds(updatedBuilds);
  };

  // Handle failure mode change
  const handleFailureModeChange = (buildIndex, modeIndex, value) => {
    const updatedBuilds = [...builds];
    updatedBuilds[buildIndex].qualityDetails.failureModes[modeIndex] = value;
    
    // Clear error for this specific failure mode
    const errorKey = `failureMode${modeIndex}`;
    if (updatedBuilds[buildIndex].errors?.[errorKey]) {
      delete updatedBuilds[buildIndex].errors[errorKey];
    }
    
    setBuilds(updatedBuilds);
  };

  // Handle can rework change
  const handleCanReworkChange = (buildIndex, value) => {
    const updatedBuilds = [...builds];
    updatedBuilds[buildIndex].qualityDetails.canRework = value;
    
    // Clear error
    if (updatedBuilds[buildIndex].errors?.canRework) {
      delete updatedBuilds[buildIndex].errors.canRework;
    }
    
    setBuilds(updatedBuilds);
  };

  // Get failure category for a mode
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

  return {
    handleInputChange,
    handleFpyStatusChange,
    handleProblemDescriptionChange,
    handleNumberOfFailuresChange,
    handleFailureModeChange,
    handleCanReworkChange,
    failureModes,
    getFailureCategoryForMode,
    getAllFailureModes,
    calculateFpyStatus
  };
};