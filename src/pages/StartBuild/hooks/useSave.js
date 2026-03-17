// frontend/src/pages/StartBuild/hooks/useSave.js

import { useState } from 'react';

export const useSave = (builds, setBuilds, allStepsCompleted, clearDraft) => {
  const [saving, setSaving] = useState(false);
  const [saveResults, setSaveResults] = useState([]);

  // Upload photos during save
  const uploadPhotosForBuild = async (photos) => {
    const uploadedPhotos = [];
    
    for (const photoData of photos) {
      try {
        const api = await import('../../../services/api');
        const { filePath } = await api.default.uploadPhoto(photoData.file, photoData.type);
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
    
    return uploadedPhotos;
  };

  // Validate build for save based on save option
  const validateBuildForSave = (build, buildIndex) => {
    const buildErrors = {};
    let isValid = true;
    const saveOption = build.qualityDetails?.saveOption || 'continue';

    // Basic validation for all save options
    if (!build.generalInfo.location) {
      buildErrors.location = 'Location is required';
      isValid = false;
    }
    if (build.generalInfo.isCustomConfig === '') {
      buildErrors.isCustomConfig = 'Configuration type is required';
      isValid = false;
    }

    // Quality details validation
    if (!build.qualityDetails?.fpyStatus) {
      buildErrors.fpyStatus = 'First Pass Yield status is required';
      isValid = false;
    }

    if (build.qualityDetails?.fpyStatus === 'Fail') {
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

    // Additional validation for 'complete' save option
    if (saveOption === 'complete') {
      // System Info validation
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
      if (!build.systemInfo.bmcMac) {
        buildErrors.bmcMac = 'BMC MAC is required';
        isValid = false;
      }
      if (!build.systemInfo.mbSN) {
        buildErrors.mbSN = 'MB S/N is required';
        isValid = false;
      }
      // Ethernet MAC is now optional
      if (!build.systemInfo.cpuSocket) {
        buildErrors.cpuSocket = 'CPU Socket is required';
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

      // Removed validation that M.2 S/N must start with S as per requirements

      const dimmQty = parseInt(build.systemInfo.dimmQty) || 0;
      for (let i = 0; i < dimmQty; i++) {
        if (!build.systemInfo.dimmSNs[i]) {
          buildErrors[`dimmSN${i}`] = `DIMM S/N #${i + 1} is required`;
          isValid = false;
        }
      }

      // Testing validation
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

      // BKC validation
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

      // Validate failure conditions for complete save
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
    }

    return { isValid, buildErrors };
  };

  // Get build status based on save option - CENTRALIZED STATUS MAPPING
  const getBuildStatus = (saveOption) => {
    switch (saveOption) {
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

  // Save single build
  const saveSingleBuild = async (buildIndex) => {
    // NOTE: This function is for START BUILD mode only - creates NEW records
    // For REWORK MODE, builds are updated via updateBuildAfterRework API (PATCH operation)
    
    const build = builds[buildIndex];
    const { isValid, buildErrors } = validateBuildForSave(build, buildIndex);

    if (!isValid) {
      const updatedBuilds = [...builds];
      updatedBuilds[buildIndex].errors = buildErrors;
      setBuilds(updatedBuilds);        const errorMsg = {
          type: 'error',
          message: `Build ${buildIndex + 1}: Fix validation errors first`
        };
      setSaveResults([errorMsg]);
      setTimeout(() => {
        setSaveResults(prev => prev.filter(result => result !== errorMsg));
      }, 5000);
      return;
    }

    setSaving(true);

    try {
      const api = await import('../../../services/api');

      // Check for duplicates - include BMC MAC
      const duplicateCheck = await api.default.checkDuplicates({
        chassisSN: build.systemInfo.chassisSN,
        mbSN: build.systemInfo.mbSN,
        bmcMac: build.systemInfo.bmcMac,
        cpuP0SN: build.systemInfo.cpuP0SN,
        cpuP1SN: build.systemInfo.cpuP1SN,
        m2SN: build.systemInfo.m2SN,
        dimmSNs: build.systemInfo.dimmSNs
      }); // Always false for Start Build - no existing builds allowed

      if (duplicateCheck.hasDuplicates) {
        const { duplicates } = duplicateCheck;
        let errorDetails = [];
        
        if (duplicates.chassisSN) errorDetails.push(`Chassis S/N "${build.systemInfo.chassisSN}"`);
        if (duplicates.mbSN) errorDetails.push(`MB S/N "${build.systemInfo.mbSN}"`);
        if (duplicates.bmcMac) errorDetails.push(`BMC MAC "${build.systemInfo.bmcMac}"`);
        if (duplicates.cpuP0SN) errorDetails.push(`CPU P0 S/N "${build.systemInfo.cpuP0SN}"`);
        if (duplicates.cpuP1SN) errorDetails.push(`CPU P1 S/N "${build.systemInfo.cpuP1SN}"`);
        if (duplicates.m2SN) errorDetails.push(`M.2 S/N "${build.systemInfo.m2SN}"`);
        if (duplicates.dimmSNs.length > 0) {
          errorDetails.push(`DIMM S/N(s) "${duplicates.dimmSNs.join(', ')}"`);
        }
        
        const errorMsg = {
          type: 'error',
          message: `Build ${buildIndex + 1}: Duplicate serial numbers found`
        };
        setSaveResults([errorMsg]);
        setTimeout(() => {
          setSaveResults(prev => prev.filter(result => result !== errorMsg));
        }, 5000);
        setSaving(false);
        return;
      }

      // Upload all photos
      const allPhotos = [
        ...(build.systemInfo.visualInspectionPhotos || []),
        ...(build.systemInfo.bootPhotos || []),
        ...(build.systemInfo.dimmsDetectedPhotos || []),
        ...(build.systemInfo.lomWorkingPhotos || [])
      ];

      const uploadedPhotos = await uploadPhotosForBuild(allPhotos);

      // Default save option for backward compatibility
      const saveOption = build.qualityDetails?.saveOption || 'complete';

      // Prepare build data with quality details - USE CENTRALIZED STATUS MAPPING
      const buildData = {
        location: build.generalInfo.location,
        buildEngineer: build.generalInfo.buildEngineer,
        isCustomConfig: build.generalInfo.isCustomConfig === 'Yes',
        systemInfo: {
          ...build.systemInfo,
          visualInspectionPhotos: undefined,
          bootPhotos: undefined,
          dimmsDetectedPhotos: undefined,
          lomWorkingPhotos: undefined,
          uploadedPhotos: uploadedPhotos
        },
        qualityDetails: {
          ...build.qualityDetails,
          saveOption: saveOption
        },
        status: getBuildStatus(saveOption) // USE CENTRALIZED MAPPING
      };

      await api.default.saveBuild(buildData);

      // Save BKC details
      await api.default.saveBkcDetails(build.systemInfo.chassisSN, build.bkcDetails);

      // Save quality details
      await api.default.saveQualityDetails(build.systemInfo.chassisSN, build.qualityDetails);

      // Update build status to success and mark as saved
      const updatedBuilds = [...builds];
      updatedBuilds[buildIndex].status = 'success';

      // Add a flag to indicate this build is saved and available for rework
      updatedBuilds[buildIndex].savedToDatabase = true;

      setBuilds(updatedBuilds);

      // Clear draft from localStorage after successful save
      if (clearDraft) {
        clearDraft();
      }

      const buildReference = build.systemInfo?.bmcName || `Build ${buildIndex + 1}`;
      let successMessage = `${buildReference} Saved Successfully`;

      // Add rework availability message if applicable
      if (build.qualityDetails?.canRework === 'Yes, Need to update hardware/PCBA information') {
        successMessage += ' - Rework mode now available';
      }

      const successMsg = {
        type: 'success',
        message: successMessage
      };
      setSaveResults([successMsg]);

      // Auto-clear success message after 5 seconds
      setTimeout(() => {
        setSaveResults(prev => prev.filter(result => result !== successMsg));
      }, 5000);

    } catch (error) {
      let errorMessage = `Build ${buildIndex + 1}: `;
      // Prioritize specific error message over generic error
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage += error.response.data.message;
      } else if (error.response && error.response.data && error.response.data.error) {
        errorMessage += error.response.data.error;
      } else if (error.message) {
        errorMessage += error.message;
      } else {
        errorMessage += 'Failed to save build';
      }

      const errorMsg = {
        type: 'error',
        message: errorMessage
      };
      setSaveResults([errorMsg]);
      setTimeout(() => {
        setSaveResults(prev => prev.filter(result => result !== errorMsg));
      }, 5000);
    } finally {
      setSaving(false);
    }
  };

  // Save all builds
  const saveBuilds = async () => {
    if (!allStepsCompleted()) {
      const errorMsg = {
        type: 'error',
        message: 'Complete all steps before saving'
      };
      setSaveResults([errorMsg]);
      setTimeout(() => {
        setSaveResults(prev => prev.filter(result => result !== errorMsg));
      }, 5000);
      return;
    }

    setSaving(true);
    setSaveResults([]);
    const results = [];

    try {
      const api = await import('../../../services/api');

      for (const [index, build] of builds.entries()) {
        try {
          // Validate build
          const { isValid, buildErrors } = validateBuildForSave(build, index);
          if (!isValid) {
            results.push({
              buildIndex: index,
              status: 'error',
              message: `Build ${index + 1}: Validation errors found`
            });
            continue;
          }

          // Check for duplicates - include BMC MAC
          const duplicateCheck = await api.default.checkDuplicates({
            chassisSN: build.systemInfo.chassisSN,
            mbSN: build.systemInfo.mbSN,
            bmcMac: build.systemInfo.bmcMac,
            cpuP0SN: build.systemInfo.cpuP0SN,
            cpuP1SN: build.systemInfo.cpuP1SN,
            m2SN: build.systemInfo.m2SN,
            dimmSNs: build.systemInfo.dimmSNs
          }); // Always false for Start Build - no existing builds allowed (strict duplicate prevention) (strict duplicate prevention)

          if (duplicateCheck.hasDuplicates) {
            const { duplicates } = duplicateCheck;
            let errorDetails = [];
            
            if (duplicates.chassisSN) errorDetails.push(`Chassis S/N "${build.systemInfo.chassisSN}"`);
            if (duplicates.mbSN) errorDetails.push(`MB S/N "${build.systemInfo.mbSN}"`);
            if (duplicates.bmcMac) errorDetails.push(`BMC MAC "${build.systemInfo.bmcMac}"`);
            if (duplicates.cpuP0SN) errorDetails.push(`CPU P0 S/N "${build.systemInfo.cpuP0SN}"`);
            if (duplicates.cpuP1SN) errorDetails.push(`CPU P1 S/N "${build.systemInfo.cpuP1SN}"`);
            if (duplicates.m2SN) errorDetails.push(`M.2 S/N "${build.systemInfo.m2SN}"`);
            if (duplicates.dimmSNs.length > 0) {
              errorDetails.push(`DIMM S/N(s) "${duplicates.dimmSNs.join(', ')}"`);
            }
            
            results.push({
              buildIndex: index,
              status: 'error',
              message: `Build ${index + 1}: Duplicate serial numbers found`
            });
            continue;
          }

          // Upload all photos for this build
          const allPhotos = [
            ...(build.systemInfo.visualInspectionPhotos || []),
            ...(build.systemInfo.bootPhotos || []),
            ...(build.systemInfo.dimmsDetectedPhotos || []),
            ...(build.systemInfo.lomWorkingPhotos || [])
          ];

          const uploadedPhotos = await uploadPhotosForBuild(allPhotos);

          // Default save option
          const saveOption = build.qualityDetails?.saveOption || 'complete';

          // Prepare build data - USE CENTRALIZED STATUS MAPPING
          const buildData = {
            location: build.generalInfo.location,
            buildEngineer: build.generalInfo.buildEngineer,
            isCustomConfig: build.generalInfo.isCustomConfig === 'Yes',
            systemInfo: {
              ...build.systemInfo,
              visualInspectionPhotos: undefined,
              bootPhotos: undefined,
              dimmsDetectedPhotos: undefined,
              lomWorkingPhotos: undefined,
              uploadedPhotos: uploadedPhotos
            },
            qualityDetails: {
              ...build.qualityDetails,
              saveOption: saveOption
            },
            status: getBuildStatus(saveOption) // USE CENTRALIZED MAPPING
          };

          await api.default.saveBuild(buildData);
          
          // Save BKC details
          await api.default.saveBkcDetails(build.systemInfo.chassisSN, build.bkcDetails);
          
          // Save quality details
          await api.default.saveQualityDetails(build.systemInfo.chassisSN, build.qualityDetails);
          
          const buildReference = build.systemInfo?.bmcName || `Build ${index + 1}`;
          let successMessage = `${buildReference} Saved Successfully`;
          
          // Add rework availability message if applicable
          if (build.qualityDetails?.canRework === 'Yes, Need to update hardware/PCBA information') {
            successMessage += ' - Rework mode available';
          }
          
          results.push({
            buildIndex: index,
            status: 'success',
            message: successMessage
          });

        } catch (error) {
          let errorMessage = `Build ${index + 1}: `;
          // Prioritize specific error message over generic error
          if (error.response && error.response.data && error.response.data.message) {
            errorMessage += error.response.data.message;
          } else if (error.response && error.response.data && error.response.data.error) {
            errorMessage += error.response.data.error;
          } else if (error.message) {
            errorMessage += error.message;
          } else {
            errorMessage += 'Failed to save build';
          }
          
          results.push({
            buildIndex: index,
            status: 'error',
            message: errorMessage
          });
        }
      }

      // Update build statuses and mark saved builds
      const updatedBuilds = [...builds];
      results.forEach(result => {
        updatedBuilds[result.buildIndex].status = result.status;
        if (result.status === 'success') {
          updatedBuilds[result.buildIndex].savedToDatabase = true;
        }
      });
      setBuilds(updatedBuilds);

      // Show results
      setSaveResults(results.map(r => ({
        type: r.status === 'success' ? 'success' : 'error',
        message: r.message
      })));

      // Get successful build indices
      const successfulIndices = results
        .filter(r => r.status === 'success')
        .map(r => r.buildIndex);

      // Clear draft from localStorage after successful saves
      if (successfulIndices.length > 0 && clearDraft) {
        clearDraft();
      }

      // If there are successful builds, remove them after delay (except rework builds)
      if (successfulIndices.length > 0) {
        setTimeout(() => {
          // Remove only successful builds that don't need rework
          const remainingBuilds = builds.filter((build, index) => {
            if (!successfulIndices.includes(index)) {
              return true; // Keep builds that weren't successfully saved
            }

            // Keep builds that need rework (so user can enter rework mode)
            return build.qualityDetails?.canRework === 'Yes, Need to update hardware/PCBA information';
          });

          if (remainingBuilds.length === 0) {
            // All builds were successful and no rework needed, reset to single empty build
            setBuilds([{
              id: Date.now(),
              generalInfo: { location: '', isCustomConfig: '' },
              systemInfo: {
                projectName: '', systemPN: '', platformType: '', manufacturer: '',
                chassisSN: '', chassisType: '', bmcName: '', bmcMac: '', mbSN: '',
                ethernetMac: '', cpuSocket: '', cpuProgramName: '', cpuP0SN: '', 
                cpuP1SN: '', m2PN: '', m2SN: '', dimmPN: '', dimmQty: '', dimmSNs: [],
                visualInspection: '', visualInspectionNotes: '', visualInspectionPhotos: [],
                bootStatus: '', bootNotes: '', bootPhotos: [],
                dimmsDetectedStatus: '', dimmsDetectedNotes: '', dimmsDetectedPhotos: [],
                lomWorkingStatus: '', lomWorkingNotes: '', lomWorkingPhotos: []
              },
              status: 'pending',
              errors: {},
              stepCompleted: {
                generalInfo: false,
                chassisInfo: false,
                cpuInfo: false,
                componentInfo: false,
                testing: false,
                bkcDetails: false,
                qualityDetails: false
              },
              bkcDetails: {
                biosVersion: '',
                scmFpgaVersion: '',
                hpmFpgaVersion: '',
                bmcVersion: ''
              },
              bkcExtraction: {
                extracting: false,
                extracted: false,
                error: null
              },
              qualityDetails: {
                fpyStatus: '',
                numberOfFailures: '',
                failureModes: [],
                failureCategories: [],
                canRework: '',
                saveOption: 'continue'
              }
            }]);
          } else {
            // Keep builds that need rework or failed to save
            setBuilds(remainingBuilds);
          }
          setSaveResults([]);
        }, 5000);
      }

      // Auto-clear error messages after 5 seconds
      setTimeout(() => {
        setSaveResults(prev => 
          prev.filter(result => result.type !== 'error')
        );
      }, 5000);

    } catch (error) {
      console.error('Error saving builds:', error);
      const errorMsg = {
        type: 'error',
        message: 'Unexpected error occurred. Try again.'
      };
      setSaveResults([errorMsg]);
      setTimeout(() => {
        setSaveResults(prev => prev.filter(result => result !== errorMsg));
      }, 5000);
    } finally {
      setSaving(false);
    }
  };

  return {
    saving,
    setSaving,
    saveResults,
    setSaveResults,
    saveSingleBuild,
    saveBuilds,
    uploadPhotosForBuild // Export this for use in other components
  };
};