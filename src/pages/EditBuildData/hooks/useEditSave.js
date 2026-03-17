// frontend/src/pages/EditBuildData/hooks/useEditSave.js
import { useState } from 'react';
import api from '../../../services/api';

export const useEditSave = (builds, setBuilds, allStepsCompleted, onComplete) => {
  const [saving, setSaving] = useState(false);
  const [saveResults, setSaveResults] = useState([]);

  // Upload photos during save
  const uploadPhotosForBuild = async (photos) => {
    const uploadedPhotos = [];

    for (const photoData of photos) {
      // Only upload new photos (those with file property)
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
      } else {
        // Keep existing photo (already in database)
        uploadedPhotos.push({
          name: photoData.name,
          path: photoData.path,
          type: photoData.type
        });
      }
    }

    return uploadedPhotos;
  };

  // Save edited build
  // In Edit mode: FPY Pass = Complete, FPY Fail = Fail (no In Progress)
  const saveEditedBuild = async (buildIndex) => {
    const build = builds[buildIndex];
    const buildReference = build.systemInfo?.bmcName || build.systemInfo?.chassisSN || `Build ${buildIndex + 1}`;

    setSaving(true);

    try {
      // Determine build status based on FPY status (Edit mode logic)
      // FPY Pass → Complete, FPY Fail → Fail
      const buildStatus = build.qualityDetails.fpyStatus === 'Pass' ? 'Complete' : 'Fail';

      console.log(`Saving edited build - FPY: ${build.qualityDetails.fpyStatus}, Status: ${buildStatus}`);

      // For edit mode, skip duplicate check since we're updating an existing build
      // The chassis_sn is the primary key and won't change
      // Other fields can be updated without duplicate concerns in edit mode

      // Upload all photos (new and existing)
      const allPhotos = [
        ...(build.systemInfo.visualInspectionPhotos || []),
        ...(build.systemInfo.bootPhotos || []),
        ...(build.systemInfo.dimmsDetectedPhotos || []),
        ...(build.systemInfo.lomWorkingPhotos || [])
      ];

      const uploadedPhotos = await uploadPhotosForBuild(allPhotos);

      // Prepare update data
      const updateData = {
        // General Information (read-only but include for completeness)
        location: build.generalInfo.location,
        isCustomConfig: build.generalInfo.isCustomConfig === 'Yes' ? 1 : 0,

        // Chassis Information (editable)
        projectName: build.systemInfo.projectName,
        jiraTicketNo: build.systemInfo.jiraTicketNo,
        bmcMac: build.systemInfo.bmcMac,
        mbSN: build.systemInfo.mbSN,
        ethernetMac: build.systemInfo.ethernetMac,
        cpuSocket: build.systemInfo.cpuSocket,
        cpuVendor: build.systemInfo.cpuVendor,

        // CPU Information (editable)
        cpuProgramName: build.systemInfo.cpuProgramName,
        cpuP0SN: build.systemInfo.cpuP0SN,
        cpuP0SocketDateCode: build.systemInfo.cpuP0SocketDateCode,
        cpuP1SN: build.systemInfo.cpuP1SN,
        cpuP1SocketDateCode: build.systemInfo.cpuP1SocketDateCode,

        // Component Information (editable)
        m2PN: build.systemInfo.m2PN,
        m2SN: build.systemInfo.m2SN,
        dimmPN: build.systemInfo.dimmPN,
        dimmQty: build.systemInfo.dimmQty,
        dimmSNs: build.systemInfo.dimmSNs,

        // Testing (editable)
        visualInspection: build.systemInfo.visualInspection,
        visualInspectionNotes: build.systemInfo.visualInspectionNotes,
        visualInspectionPhotos: uploadedPhotos.filter(p => p.type === 'visual_inspection'),
        bootStatus: build.systemInfo.bootStatus,
        bootNotes: build.systemInfo.bootNotes,
        bootPhotos: uploadedPhotos.filter(p => p.type === 'boot'),
        dimmsDetectedStatus: build.systemInfo.dimmsDetectedStatus,
        dimmsDetectedNotes: build.systemInfo.dimmsDetectedNotes,
        dimmsDetectedPhotos: uploadedPhotos.filter(p => p.type === 'dimms_detected'),
        lomWorkingStatus: build.systemInfo.lomWorkingStatus,
        lomWorkingNotes: build.systemInfo.lomWorkingNotes,
        lomWorkingPhotos: uploadedPhotos.filter(p => p.type === 'lom_working'),

        // BKC Details (editable)
        biosVersion: build.bkcDetails.biosVersion,
        bmcVersion: build.bkcDetails.bmcVersion,
        scmFpgaVersion: build.bkcDetails.scmFpgaVersion,
        hpmFpgaVersion: build.bkcDetails.hpmFpgaVersion,

        // Quality Details (editable)
        fpyStatus: build.qualityDetails.fpyStatus,
        problemDescription: build.qualityDetails.problemDescription || null,
        canContinue: build.qualityDetails.canRework === 'Yes, Need to update hardware/PCBA information' ? 'Yes' :
          build.qualityDetails.canRework === 'No, mark this build as a failed build' ? 'No' : null,

        // Build Status - determined by FPY in edit mode
        status: buildStatus,

        // Failure modes
        failureModes: build.qualityDetails.failureModes || [],
        failureCategories: build.qualityDetails.failureCategories || []
      };

      // Call edit build API
      const response = await api.updateEditedBuild(build.systemInfo.chassisSN, updateData);

      setSaveResults([{
        type: 'success',
        message: `${buildReference}: Updated successfully as ${buildStatus}`
      }]);

      // Notify parent component
      setTimeout(() => {
        setSaveResults([]);
        if (onComplete) {
          onComplete();
        }
      }, 2000);

    } catch (error) {
      console.error('Error saving edited build:', error);
      setSaveResults([{
        type: 'error',
        message: `${buildReference}: Failed to save - ${error.message}`
      }]);
      setTimeout(() => setSaveResults([]), 5000);
    } finally {
      setSaving(false);
    }
  };

  return {
    saving,
    setSaving,
    saveResults,
    setSaveResults,
    saveEditedBuild,
    uploadPhotosForBuild,
    allStepsCompleted: () => true
  };
};
