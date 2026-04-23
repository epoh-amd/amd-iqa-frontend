// frontend/src/pages/ContinueBuild/hooks/useContinueSave.js
import { useState } from 'react';
import api from '../../../services/api';

export const useContinueSave = (builds, setBuilds, allStepsCompleted, onComplete) => {
  const [saving, setSaving] = useState(false);
  const [saveResults, setSaveResults] = useState([]);

  // Validate build for save based on save option
  const validateForSave = (build, saveType) => {
    // For "Continue Later", only basic info is required
    if (saveType === 'continue') {
      return build.generalInfo.location && 
             build.generalInfo.isCustomConfig !== '' &&
             build.qualityDetails?.fpyStatus;
    }
    
    // For "Save as Failed" or "Save the Build", quality validation is done separately
    return true;
  };

  // Upload photos during save
  const uploadPhotosForBuild = async (photos) => {
    const uploadedPhotos = [];
    
    for (const photoData of photos) {
      if (photoData.file) {
        try {
          const result = await api.uploadPhoto(photoData.file, photoData.type);
          uploadedPhotos.push({
            name: photoData.name,
            path: result.filePath,
            type: photoData.type
          });
        } catch (error) {
          console.error('Error uploading photo:', error);
          throw new Error(`Failed to upload ${photoData.name}`);
        }
      }
    }
    
    return uploadedPhotos;
  };

  // Save single build with specific option
  const saveSingleBuildWithOption = async (buildIndex, saveOption) => {
    const build = builds[buildIndex];
    
    // Validate based on save option
    if (!validateForSave(build, saveOption)) {
      setSaveResults([{
        type: 'error',
        message: `Build ${buildIndex + 1}: Please complete required fields`
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

      console.log(`Saving build ${buildIndex + 1} with status: ${finalStatus}`);

      // For continue build, we use PATCH to update existing record
      const updateData = {
        status: finalStatus,
        fpy_status: build.qualityDetails.fpyStatus,
        problem_description: build.qualityDetails.problemDescription || null,
        can_continue: build.qualityDetails.canRework === 'Yes, Need to update hardware/PCBA information' ? 'Yes' :
                     build.qualityDetails.canRework === 'No, mark this build as a failed build' ? 'No' : null
      };

      // Update build
      await api.updateBuild(build.systemInfo.chassisSN, updateData);

      // Save quality details if changed
      if (build.qualityDetails.fpyStatus) {
        await api.saveQualityDetails(build.systemInfo.chassisSN, {
          ...build.qualityDetails,
          saveOption: saveOption
        });
      }

      // Show success message
      setSaveResults([{
        type: 'success',
        message: `Build ${buildIndex + 1}: Saved successfully as ${finalStatus}`
      }]);

      // Handle post-save navigation
      setTimeout(() => {
        setSaveResults([]);
        if (onComplete) {
          onComplete();
        }
      }, 2000);

    } catch (error) {
      console.error('Error saving build:', error);
      setSaveResults([{
        type: 'error',
        message: `Build ${buildIndex + 1}: Failed to save - ${error.message}`
      }]);
      setTimeout(() => setSaveResults([]), 5000);
    } finally {
      setSaving(false);
    }
  };

  // Save single build (exposed for use by form)
  const saveSingleBuild = async (buildIndex) => {
    const build = builds[buildIndex];
    const saveOption = build.qualityDetails?.saveOption || 'continue';
    await saveSingleBuildWithOption(buildIndex, saveOption);
  };

  return {
    saving,
    setSaving,
    saveResults,
    setSaveResults,
    saveSingleBuild,
    saveSingleBuildWithOption,
    uploadPhotosForBuild,
    validateForSave,
    allStepsCompleted: () => true // For continue build, previous steps are already completed
  };
};