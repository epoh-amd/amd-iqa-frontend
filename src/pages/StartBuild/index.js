// frontend/src/pages/StartBuild/index.js

import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faEye,
  faExclamationTriangle,
  faCheck
} from '@fortawesome/free-solid-svg-icons';

import ProgressTracker from './ProgressTracker';
import GeneralInfoTable from './GeneralInfoTable';
import GPUInfoTable from './GPUInfoTable';
import GPUComponentTable from './GPUComponentTable';
import GPUTestingTable from './GPUTestingTable';
import GPUFirmwareTable from './GPUFirmwareTable';
import SystemInfoTable from './SystemInfoTable';
import BkcDetailsTable from './BkcDetailsTable';
import QualityIndicatorTable from './QualityIndicatorTable';
import ReworkTable from './ReworkTable';
import StepNavigation from './StepNavigation';
import SaveResults from './SaveResults';
import ReworkMode from './ReworkMode';

import { useBuildsState } from './hooks/useBuildsState';
import { useValidation } from './hooks/useValidation';
import { useNavigation } from './hooks/useNavigation';
import { useSave } from './hooks/useSave';
import { useBkcManagement } from './hooks/useBkcManagement';
import { useFileHandling } from './hooks/useFileHandling';
import { useQualityManagement } from './hooks/useQualityManagement';
import { useAutoSave } from './hooks/useAutoSave';

import { DraftRestoreBanner } from './DraftRestoreBanner';
import { AutoSaveIndicator } from './AutoSaveIndicator';
import * as XLSX from 'xlsx';
import api from '../../services/api';
import '../../assets/css/startBuild.css';

const StartBuild = () => {
  // ============ CORE STATE ============
  const [reworkData, setReworkData] = useState([]);
  const [currentStep, setCurrentStep] = useState('generalInfo');
  const [systemInfoSubStep, setSystemInfoSubStep] = useState('chassisInfo');
  const [showReview, setShowReview] = useState(false);
  const [showGPUInfo, setShowGPUInfo] = useState(false);
  const [gpuSubStep, setGpuSubStep] = useState('gpuInfo');
  const [gpuSaving, setGpuSaving] = useState(false);
  const [gpuSaveMessage, setGpuSaveMessage] = useState(null); // { type: 'success'|'error', text: '' }
  const [reworkMode, setReworkMode] = useState(false);
  const [reworkBuildIndex, setReworkBuildIndex] = useState(null);
  const [savingIndex, setSavingIndex] = useState(null);
  const [savedIndex, setSavedIndex] = useState(null);
  const [bulkImportStatus, setBulkImportStatus] = useState(null);
  const bulkImportRef = useRef(null);
  const [selectedBuildIndices, setSelectedBuildIndices] = useState([]); // empty = all selected (default)
  const allBuildsRef = useRef(null); // stores full build list before selection filter

  // ============ BUILDS STATE HOOK ============
  const {
    builds,
    setBuilds,
    selectedField,
    setSelectedField,
    selectedBuildIndex,
    setSelectedBuildIndex,
    partNumberSuggestions,
    setPartNumberSuggestions,
    partNumberSearch,
    setPartNumberSearch,
    showPartNumberDropdown,
    setShowPartNumberDropdown,
    scannerRefs,
    addNewBuild,
    removeBuild,
    handleInputChange,
    searchPartNumbers,
    handlePartNumberSearchChange,
    selectPartNumber,
    calculateFpyStatus
  } = useBuildsState(systemInfoSubStep);

  // ============ BUILD SELECTION (for bulk import) ============
  // [] = all selected, [...indices] = only those indices selected
  const toggleBuildSelection = (index) => {
    setSelectedBuildIndices(prev => {
      const buildsCount = builds.length;
      const current = prev.length === 0 ? Array.from({ length: buildsCount }, (_, i) => i) : prev;
      if (current.includes(index)) {
        if (current.length === 1) return prev; // must keep at least one
        return current.filter(i => i !== index);
      }
      const next = [...current, index];
      return next.length === buildsCount ? [] : next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedBuildIndices(prev =>
      prev.length === 0 ? [0] : []
    );
  };

  const isAllSelected = selectedBuildIndices.length === 0;
  const isBuildSelected = (index) => selectedBuildIndices.length === 0 || selectedBuildIndices.includes(index);
  const effectiveSelection = selectedBuildIndices.length === 0
    ? builds.map((_, i) => i)
    : selectedBuildIndices;

  // ============ CUSTOM HOOKS ============
  const validation = useValidation(builds, setBuilds, currentStep, systemInfoSubStep);

  const navigation = useNavigation(
    currentStep,
    setCurrentStep,
    systemInfoSubStep,
    setSystemInfoSubStep,
    builds,
    setBuilds,
    validation.validateBeforeQualityIndicator,
    setShowReview,
    {
      validateChassisInfo: validation.validateChassisInfo,
      validateCpuInfo: validation.validateCpuInfo,
      validateComponentInfo: validation.validateComponentInfo
    },
    selectedBuildIndices,
    setSelectedBuildIndices,
    allBuildsRef,
    showGPUInfo,
    gpuSubStep,
    setGpuSubStep
  );

  // ============ AUTO-SAVE & DRAFT MANAGEMENT ============
  const autoSave = useAutoSave(builds, setBuilds, reworkData, setReworkData);

  const save = useSave(builds, setBuilds, validation.allStepsCompleted, autoSave.clearDraft);

  const bkcManagement = useBkcManagement(builds, setBuilds);

  const fileHandling = useFileHandling(builds, setBuilds);

  const qualityManagement = useQualityManagement(builds, setBuilds);

  // SILENT AUTO-RESTORE on component mount - NO BANNER, NO PROMPTS
  useEffect(() => {
    console.log('Checking for draft on mount...');

    // Small delay to ensure useAutoSave is fully initialized
    const restoreTimeout = setTimeout(() => {
      if (autoSave.hasDraft()) {
        const draft = autoSave.loadDraft();
        console.log('Draft found:', draft);

        if (draft && draft.builds && draft.builds.length > 0) {
          // SILENT AUTO-RESTORE - restore data immediately without any UI prompts
          console.log('Silently restoring draft:', draft.builds.length, 'builds');

          // Use the restore function which sets the isRestoringRef flag
          autoSave.restoreDraft();

          console.log('Draft silently restored - UI will update automatically');
          // NO banner, NO prompts - user just sees their data back
        }
      } else {
        console.log('No draft found - starting fresh');
      }
    }, 100); // 100ms delay to let hooks initialize

    return () => clearTimeout(restoreTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  // Warn before leaving page with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (autoSave.hasDraft()) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [autoSave.hasDraft]);

  // ============ SAVE HANDLERS ============

  // Save single build with specific option
  const saveSingleBuildWithOption = async (buildIndex, saveOption) => {
    const build = builds[buildIndex];

    // Validate based on save option
    if (!validation.validateForSave(build, saveOption)) {
      save.setSaveResults([{
        type: 'error',
        message: `Build ${buildIndex + 1}: Please complete required fields`
      }]);
      setTimeout(() => save.setSaveResults([]), 5000);
      return;
    }

    save.setSaving(true);

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

      const buildData = {
        location: build.generalInfo.location,
        buildEngineer: build.generalInfo.buildEngineer,
        // Also add build_engineer for backend compatibility
        build_engineer: build.generalInfo.buildEngineer,
        isCustomConfig: build.generalInfo.isCustomConfig === 'Yes',
        assetId: build.systemInfo.assetId || null,
        extractLogFile: build.systemInfo.extractLogFile || null,
        systemInfo: build.systemInfo,
        qualityDetails: {
          ...build.qualityDetails,
          saveOption: saveOption
        },
        status: finalStatus // Explicitly set the status
      };

      // Upload photos if any
      const allPhotos = [
        ...(build.systemInfo.visualInspectionPhotos || []),
        ...(build.systemInfo.bootPhotos || []),
        ...(build.systemInfo.dimmsDetectedPhotos || []),
        ...(build.systemInfo.lomWorkingPhotos || [])
      ];

      if (allPhotos.length > 0) {
        const uploadedPhotos = await fileHandling.uploadPhotosForBuild(allPhotos);
        buildData.systemInfo = {
          ...buildData.systemInfo,
          uploadedPhotos: uploadedPhotos,
          visualInspectionPhotos: undefined,
          bootPhotos: undefined,
          dimmsDetectedPhotos: undefined,
          lomWorkingPhotos: undefined
        };
      }

      await api.saveBuild(buildData);
      await api.saveBkcDetails(build.systemInfo.chassisSN, build.bkcDetails);
      await api.saveQualityDetails(build.systemInfo.chassisSN, {
        ...build.qualityDetails,
        saveOption: saveOption
      });

      // 🔥 Save rework AFTER build exists
      const rework = reworkData?.[buildIndex];

      if (rework && rework.status === 'Yes') {
        try {
          await api.saveReworkPass(
            build.systemInfo.chassisSN,
            rework.notes || ''
          );
          console.log('Rework saved after build');
        } catch (err) {
          console.error('Failed to save rework:', err);
        }
      }

      // Show success message
      const buildReference = build.systemInfo?.bmcName || `Build ${buildIndex + 1}`;
      save.setSaveResults([{
        type: 'success',
        message: `${buildReference}: Saved successfully as ${finalStatus}`
      }]);

      // IMPORTANT: Clear draft after successful save
      // If this was the only build, clear entire draft
      if (builds.length === 1) {
        autoSave.clearDraft();
      }
      // If multiple builds, the auto-save hook will update with remaining builds automatically

      // Remove build from UI after 3 seconds using chassisSN to avoid stale index
      const savedChassisSN = build.systemInfo.chassisSN;
      setTimeout(() => {
        setBuilds(prev => {
          const updatedBuilds = prev.filter(b => b.systemInfo.chassisSN !== savedChassisSN);
          if (updatedBuilds.length === 0) {
            setCurrentStep('generalInfo');
            setSystemInfoSubStep('chassisInfo');
            autoSave.clearDraft();
            return [createEmptyBuild()];
          }
          return updatedBuilds;
        });
        save.setSaveResults([]);
      }, 3000);

    } catch (error) {
      console.error('Error saving build:', error);
      save.setSaveResults([{
        type: 'error',
        message: `Build ${buildIndex + 1}: Failed to save - ${error.message}`
      }]);
      setTimeout(() => save.setSaveResults([]), 5000);
    } finally {
      save.setSaving(false);
    }
  };


    const handleExtractLog = async (buildIndex) => {
    const chassisSN = builds[buildIndex]?.systemInfo?.chassisSN;

    handleInputChange(buildIndex, 'systemInfo', 'extractLogStatus', 'extracting');
    handleInputChange(buildIndex, 'systemInfo', 'extractLogError', '');

    try {
      const bmcName = builds[buildIndex]?.systemInfo?.bmcName;
      const result = await api.extractLog(chassisSN, bmcName);

      handleInputChange(buildIndex, 'systemInfo', 'extractLogStatus', 'done');
      handleInputChange(buildIndex, 'systemInfo', 'extractLogFile', result.filename);
    } catch (err) {
      handleInputChange(buildIndex, 'systemInfo', 'extractLogStatus', '');
      handleInputChange(buildIndex, 'systemInfo', 'extractLogError', 'Log could not be retrieved. Please validate the system is online.');
    }
  };


  /*
  const saveReworkPass = async (buildIndex) => {
    try {
      setSavingIndex(buildIndex);
  
      const chassisSN = builds[buildIndex]?.systemInfo?.chassisSN;
      const notes = reworkData[buildIndex]?.notes || '';
      const status = reworkData[buildIndex]?.status;
  
      if (status !== 'Yes') return;
  
      await api.saveReworkPass(chassisSN, notes);
  
      setSavedIndex(buildIndex);
  
      setTimeout(() => {
        setSavedIndex(null);
      }, 2000);
  
    } catch (error) {
      console.error('Failed to save rework pass:', error);
    } finally {
      setSavingIndex(null);
    }
  };
*/


  const saveReworkPass = async (buildIndex) => {
    try {
      setSavingIndex(buildIndex);

      const updated = [...reworkData];

      if (!updated[buildIndex]) {
        updated[buildIndex] = {};
      }

      updated[buildIndex].saved = true;

      setReworkData(updated);

      setSavedIndex(buildIndex);

      setTimeout(() => setSavedIndex(null), 2000);

    } catch (error) {
      console.error('Failed to store rework locally:', error);
    } finally {
      setSavingIndex(null);
    }
  };

  // Save GPU build with In Progress status (Continue Later)
  const handleContinueLaterGPU = async () => {
    setGpuSaving(true);
    const results = [];
    for (const build of builds) {
      const g = build.gpuInfo || {};
      if (!g.gpuSN) { results.push({ error: 'GPU S/N required' }); continue; }
      try {
        await api.saveGpuBuild({ ...Object.fromEntries(
          ['gpuSN','cpuSN','projectName','po','gpuPN','boardSN','boardManufacturer','asicPN','siliconRev','boardRev','gpuRev','modelName',
           'cpuPowerRating','heatsinkManufacturer','heatsinkPN','heatsinkSN','visualInspection','bootToOS',
           'gpuDetected','fAuditEnablement','fAuditValue','agfhcLvl3','roccRushTest','hbmTest','transferBench',
           'ifwiVersion','rmVersion'].map(k => [k, g[k] || null])
        ), status: 'In Progress', buildEngineer: build.generalInfo?.buildEngineer || null });
        results.push({ success: true, gpuSN: g.gpuSN });
      } catch (err) {
        results.push({ error: err.response?.data?.error || err.message, gpuSN: g.gpuSN });
      }
    }
    setGpuSaving(false);
    const failed = results.filter(r => r.error);
    if (failed.length === 0) {
      setGpuSaveMessage({ type: 'success', text: 'GPU build saved — you can continue later.' });
      setCurrentStep('generalInfo');
      setShowGPUInfo(false);
      setGpuSubStep('gpuInfo');
      setBuilds(prev => prev.map(b => ({ ...b, gpuInfo: { projectName:'',po:'',gpuPN:'',gpuSN:'',asicPN:'',cpuSN:'',siliconRev:'',boardRev:'',gpuRev:'',modelName:'',cpuPowerRating:'',heatsinkManufacturer:'',heatsinkPN:'',heatsinkSN:'',visualInspection:'',bootToOS:'',gpuDetected:'',fAuditEnablement:'',fAuditValue:'',agfhcLvl3:'',roccRushTest:'',hbmTest:'',transferBench:'',ifwiVersion:'',rmVersion:'' } })));
      setTimeout(() => setGpuSaveMessage(null), 5000);
    } else {
      setGpuSaveMessage({ type: 'error', text: `Errors: ${failed.map(f => `${f.gpuSN || 'Unknown'}: ${f.error}`).join(', ')}` });
      setTimeout(() => setGpuSaveMessage(null), 7000);
    }
  };

  // Save all GPU builds to the gpu_builds table
  const handleSaveGPU = async () => {
    setGpuSaving(true);
    const results = [];
    for (const build of builds) {
      const g = build.gpuInfo || {};
      if (!g.gpuSN) {
        results.push({ error: 'GPU S/N is required', build });
        continue;
      }
      try {
        await api.saveGpuBuild({
          gpuSN: g.gpuSN,
          cpuSN: g.cpuSN || null,
          projectName: g.projectName || null,
          po: g.po || null,
          gpuPN: g.gpuPN || null,
          boardSN: g.boardSN || null,
          boardManufacturer: g.boardManufacturer || null,
          asicPN: g.asicPN || null,
          siliconRev: g.siliconRev || null,
          boardRev: g.boardRev || null,
          gpuRev: g.gpuRev || null,
          modelName: g.modelName || null,
          cpuPowerRating: g.cpuPowerRating || null,
          heatsinkManufacturer: g.heatsinkManufacturer || null,
          heatsinkPN: g.heatsinkPN || null,
          heatsinkSN: g.heatsinkSN || null,
          visualInspection: g.visualInspection || null,
          visualInspectionNotes: g.visualInspectionNotes || null,
          bootToOS: g.bootToOS || null,
          bootToOSNotes: g.bootToOSNotes || null,
          gpuDetected: g.gpuDetected || null,
          gpuDetectedNotes: g.gpuDetectedNotes || null,
          fAuditEnablement: g.fAuditEnablement || null,
          fAuditEnablementNotes: g.fAuditEnablementNotes || null,
          fAuditValue: g.fAuditValue || null,
          agfhcLvl3: g.agfhcLvl3 || null,
          agfhcLvl3Notes: g.agfhcLvl3Notes || null,
          roccRushTest: g.roccRushTest || null,
          roccRushTestNotes: g.roccRushTestNotes || null,
          hbmTest: g.hbmTest || null,
          hbmTestNotes: g.hbmTestNotes || null,
          transferBench: g.transferBench || null,
          transferBenchNotes: g.transferBenchNotes || null,
          ifwiVersion: g.ifwiVersion || null,
          rmVersion: g.rmVersion || null,
          status: 'Completed',
          buildEngineer: build.generalInfo?.buildEngineer || null,
        });
        results.push({ success: true, gpuSN: g.gpuSN });
      } catch (err) {
        results.push({ error: err.response?.data?.error || err.message, gpuSN: g.gpuSN });
      }
    }
    // Upload photos for each build
    for (const build of builds) {
      const g = build.gpuInfo || {};
      const gpuSN = g.gpuSN;
      if (!gpuSN) continue;

      const photoPayload = [];
      const photoFields = ['visualInspection','bootToOS','gpuDetected','fAuditEnablement','agfhcLvl3','roccRushTest','hbmTest','transferBench'];
      for (const field of photoFields) {
        const photos = g[`${field}Photos`] || [];
        for (const photo of photos) {
          if (!photo.file) continue; // already uploaded (has path not file)
          try {
            const result = await api.uploadPhoto(photo.file, `gpu_${field}`);
            photoPayload.push({ fieldName: field, filePath: result.filePath });
          } catch (err) {
            console.error(`Failed to upload GPU photo for ${field}:`, err);
          }
        }
      }
      if (photoPayload.length > 0) {
        try { await api.saveGpuPhotos(gpuSN, photoPayload); } catch (err) {
          console.error('Failed to save GPU photo paths:', err);
        }
      }
    }

    setGpuSaving(false);

    const failed = results.filter(r => r.error);
    if (failed.length === 0) {
      setGpuSaveMessage({ type: 'success', text: `GPU build${builds.length > 1 ? 's' : ''} saved successfully.` });

      // Clear all gpuInfo fields
      const emptyGpuInfo = {
        projectName: '', po: '', gpuPN: '', gpuSN: '', asicPN: '', cpuSN: '',
        siliconRev: '', boardRev: '', gpuRev: '', modelName: '',
        cpuPowerRating: '', heatsinkManufacturer: '',
        heatsinkPN: '', heatsinkSN: '',
        visualInspection: '', bootToOS: '', gpuDetected: '',
        fAuditEnablement: '', fAuditValue: '',
        agfhcLvl3: '', roccRushTest: '', hbmTest: '', transferBench: '',
        ifwiVersion: '', rmVersion: '',
      };
      setBuilds(prev => prev.map(b => ({ ...b, gpuInfo: { ...emptyGpuInfo } })));

      setCurrentStep('generalInfo');
      setShowGPUInfo(false);
      setGpuSubStep('gpuInfo');
      setTimeout(() => setGpuSaveMessage(null), 5000);
    } else {
      setGpuSaveMessage({ type: 'error', text: `Saved with errors: ${failed.map(f => `${f.gpuSN || 'Unknown'}: ${f.error}`).join(', ')}` });
      setTimeout(() => setGpuSaveMessage(null), 7000);
    }
  };

  // Handle Save as Complete
  const handleSaveAsComplete = async (buildIndex) => {
    await saveSingleBuildWithOption(buildIndex, 'complete');
  };

  const ggg = async (buildIndex) => {
    await saveSingleBuildWithOption(buildIndex, 'complete');
  };

  // Handle Continue Later
  const handleContinueLater = async (buildIndex) => {
    await saveSingleBuildWithOption(buildIndex, 'continue');
  };

  // Handle Save as Failed
  const handleSaveAsFailed = async (buildIndex) => {
    await saveSingleBuildWithOption(buildIndex, 'failed');
  };

  // Handle Save & Rework
  const handleSaveAndRework = async (buildIndex) => {
    const build = builds[buildIndex];

    // For 2nd+ rework, don't save again if already saved
    if (build.savedToDatabase && build.status === 'success') {
      // Just enter rework mode without saving again
      setReworkBuildIndex(buildIndex);
      setReworkMode(true);
      return;
    }

    // First time save & rework
    try {
      save.setSaving(true);

      const buildData = {
        location: build.generalInfo.location,
        buildEngineer: build.generalInfo.buildEngineer,
        // Also add build_engineer for backend compatibility
        build_engineer: build.generalInfo.buildEngineer,
        isCustomConfig: build.generalInfo.isCustomConfig === 'Yes',
        assetId: build.systemInfo.assetId || null,
        systemInfo: build.systemInfo,
        qualityDetails: {
          ...build.qualityDetails,
          saveOption: 'continue' // Save as in progress first
        },
        status: 'In Progress'
      };

      // Upload photos if any
      const allPhotos = [
        ...(build.systemInfo.visualInspectionPhotos || []),
        ...(build.systemInfo.bootPhotos || []),
        ...(build.systemInfo.dimmsDetectedPhotos || []),
        ...(build.systemInfo.lomWorkingPhotos || [])
      ];

      if (allPhotos.length > 0) {
        const uploadedPhotos = await fileHandling.uploadPhotosForBuild(allPhotos);
        buildData.systemInfo = {
          ...buildData.systemInfo,
          uploadedPhotos: uploadedPhotos,
          visualInspectionPhotos: undefined,
          bootPhotos: undefined,
          dimmsDetectedPhotos: undefined,
          lomWorkingPhotos: undefined
        };
      }

      await api.saveBuild(buildData);
      await api.saveBkcDetails(build.systemInfo.chassisSN, build.bkcDetails);
      await api.saveQualityDetails(build.systemInfo.chassisSN, build.qualityDetails);

      // 🔥 Save rework AFTER build exists
      const rework = reworkData?.[buildIndex];

      if (rework && rework.status === 'Yes') {
        try {
          await api.saveReworkPass(
            build.systemInfo.chassisSN,
            rework.notes || ''
          );
          console.log('Rework saved after build');
        } catch (err) {
          console.error('Failed to save rework:', err);
        }
      }
      // Update build status locally
      const updatedBuilds = [...builds];
      updatedBuilds[buildIndex].status = 'success';
      updatedBuilds[buildIndex].savedToDatabase = true;
      setBuilds(updatedBuilds);

      // Now enter rework mode
      setReworkBuildIndex(buildIndex);
      setReworkMode(true);

    } catch (error) {
      console.error('Error saving build before rework:', error);
      save.setSaveResults([{
        type: 'error',
        message: `Build ${buildIndex + 1}: Failed to save - ${error.message}`
      }]);
    } finally {
      save.setSaving(false);
    }
  };

  // Handle rework save
  const handleSaveRework = async (reworkBuild, changedFields) => {
    try {
      // IMPORTANT: Rework mode UPDATES existing build records, never creates new ones
      // This ensures no duplicate chassis S/Ns are created during rework operations

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

      // Upload photos
      const allPhotos = [
        ...(updatedReworkBuild.systemInfo.visualInspectionPhotos || []),
        ...(updatedReworkBuild.systemInfo.bootPhotos || []),
        ...(updatedReworkBuild.systemInfo.dimmsDetectedPhotos || []),
        ...(updatedReworkBuild.systemInfo.lomWorkingPhotos || [])
      ];

      const uploadedPhotos = await fileHandling.uploadPhotosForBuild(allPhotos);

      // Prepare rework data
      const reworkData = {
        systemInfo: {
          ...updatedReworkBuild.systemInfo,
          uploadedPhotos: uploadedPhotos
        }
      };

      // Save rework to database - this PATCHES/UPDATES the existing build record
      await api.updateBuildAfterRework(updatedReworkBuild.systemInfo.chassisSN, reworkData);

      // Exit rework mode
      setReworkMode(false);
      setReworkBuildIndex(null);

      // Determine final status based on rework results
      if (newFpyStatus === 'Pass') {
        // Rework successful - mark as Complete and remove from UI
        try {
          // Update status to Complete in database
          await api.updateBuildStatus(updatedReworkBuild.systemInfo.chassisSN, 'Complete');

          save.setSaveResults([{
            type: 'success',
            message: `Build ${reworkBuildIndex + 1}: Rework successful - Build completed`
          }]);

          // Remove build from UI after delay
          setTimeout(() => {
            const remainingBuilds = builds.filter((_, idx) => idx !== reworkBuildIndex);
            if (remainingBuilds.length === 0) {
              setBuilds([createEmptyBuild()]);
              setCurrentStep('generalInfo');
              setSystemInfoSubStep('chassisInfo');
            } else {
              setBuilds(remainingBuilds);
            }
            save.setSaveResults([]);
          }, 3000);
        } catch (error) {
          console.error('Error updating build status to Complete:', error);
          save.setSaveResults([{
            type: 'error',
            message: `Build ${reworkBuildIndex + 1}: Rework saved but failed to update status - ${error.message}`
          }]);
        }
      } else {
        // Rework failed - keep as In Progress for further rework or user decision
        const updatedBuilds = [...builds];
        updatedBuilds[reworkBuildIndex] = {
          ...updatedReworkBuild,
          savedToDatabase: true,
          status: 'success'
        };

        // Reset canRework so user can select again
        updatedBuilds[reworkBuildIndex].qualityDetails.canRework = '';
        setBuilds(updatedBuilds);

        save.setSaveResults([{
          type: 'warning',
          message: `Build ${reworkBuildIndex + 1}: Rework complete but FPY still Fail - Please select can rework option again`
        }]);
      }
    } catch (error) {
      console.error('Error saving rework:', error);
      save.setSaveResults([{
        type: 'error',
        message: `Build ${reworkBuildIndex + 1}: Failed to save rework - ${error.message}`
      }]);
    }
  };

  // Handle rework cancel
  const handleCancelRework = () => {
    setReworkMode(false);
    setReworkBuildIndex(null);
  };

  // Handle bulk import from XLSX
  // Handle bulk import from XLSX/XLS
  const handleBulkImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';

    setBulkImportStatus({ type: 'loading', message: 'Reading file...' });

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

      let skipped = 0;
      const newBuilds = [];

      for (const row of rows) {
        const chassisSN = String(row['Chassis S/N'] || '').trim();
        const mbSN = String(row['MotherBoard Serial Number'] || '').trim();
        const assetName = String(row['Asset Name'] || '').trim();
        const assetId = String(row['Asset ID'] || '').trim();
        const projectName = String(row['Project name'] || '').trim();
        const socket = String(row['Socket'] || '').trim();
        const bmcMac = String(row['BMC Mac'] || row['BMC MAC'] || '').trim();
        const ethernetMac = String(row['Ethernet Mac'] || row['Ethernet MAC'] || '').trim();


        if (!chassisSN) { skipped++; continue; }

        try {
          const existing = await api.getBuild(chassisSN);
          if (existing) { skipped++; continue; }
        } catch {
          // Not found — safe to add
        }

            const PROJECT_NAME_MAP = {
          'venice': 'Weisshorn SP8',
        };
        const mappedProjectName = PROJECT_NAME_MAP[projectName.toLowerCase()] || projectName;

        const emptyBuild = createEmptyBuild();
        newBuilds.push({
          ...emptyBuild,
          generalInfo: {
            location: builds[0]?.generalInfo?.location || '',
            buildEngineer: builds[0]?.generalInfo?.buildEngineer || '',
            isCustomConfig: 'No',
          },
          systemInfo: {
            ...emptyBuild.systemInfo,
            assetId,
            chassisSN,
            mbSN,
            bmcName: assetName,
            projectName: mappedProjectName,
            cpuSocket: socket,
            bmcMac,
            ethernetMac,
          }
        });


      }

      if (newBuilds.length > 0) {
        setBuilds(prev => {
          const hasOnlyEmptyBuild = prev.length === 1 && !prev[0].systemInfo.chassisSN;
          return hasOnlyEmptyBuild ? newBuilds : [...prev, ...newBuilds];
        });
      }

      setBulkImportStatus({ type: 'success', message: `Imported ${newBuilds.length} build(s). ${skipped} skipped (duplicate or missing chassis S/N).` });
      setTimeout(() => setBulkImportStatus(null), 5000);
    } catch (err) {
      console.error('Bulk import error:', err);
      setBulkImportStatus({ type: 'error', message: 'Failed to read file. Ensure it is a valid .xls or .xlsx file.' });
      setTimeout(() => setBulkImportStatus(null), 5000);
    }
  };



  // Create empty build helper
  const createEmptyBuild = () => ({
    id: Date.now(),
    generalInfo: { location: '', buildEngineer: '', isCustomConfig: '' },
    systemInfo: {
      assetId: '',
      projectName: '', systemPN: '', platformType: '', manufacturer: '',
      chassisSN: '', chassisType: '', bmcName: '', bmcMac: '', mbSN: '',
      ethernetMac: '', cpuSocket: '', cpuProgramName: '', cpuP0SN: '',
      cpuP0SocketDateCode: '', cpuP1SN: '', cpuP1SocketDateCode: '', m2PN: '', m2SN: '', dimmPN: '', dimmQty: '', dimmSNs: [],
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
      problemDescription: '', // NEW FIELD
      numberOfFailures: '',
      failureModes: [],
      failureCategories: [],
      canRework: ''
    }
  });

  // ============ EFFECTS ============
  // Load part numbers on mount
  useEffect(() => {
    const loadPartNumbers = async () => {
      try {
        const driveParts = await api.searchPartNumbers('', 'Drive');
        const moduleParts = await api.searchPartNumbers('', 'Module');
        setPartNumberSuggestions({
          m2PN: driveParts.suggestions || [],
          dimmPN: moduleParts.suggestions || []
        });
      } catch (error) {
        console.error('Error loading part numbers:', error);
      }
    };
    loadPartNumbers();
  }, [setPartNumberSuggestions]);

  // Expose saveCustomM2PN for SystemInfoTable (window workaround)
  useEffect(() => {
    window.saveCustomM2PN = async (buildIndex) => {
      const customPN = builds[buildIndex].systemInfo.m2PNCustom;
      if (!customPN || customPN.trim() === '') return;
      try {
        await api.addPartNumber(customPN.trim(), 'Drive');
        // Optionally refresh suggestions here
        console.log('Custom M.2 P/N saved successfully:', customPN);
      } catch (error) {
        console.error('Error saving custom M.2 P/N:', error);
      }
    };
    return () => {
      delete window.saveCustomM2PN;
    };
  }, [builds]);

  // ============ COMPUTED VALUES ============
  const getProgressStatus = () => {
    const generalInfoComplete = builds.every(b => b.stepCompleted.generalInfo);
    const allSystemInfoComplete = builds.every(b =>
      b.stepCompleted.chassisInfo &&
      b.stepCompleted.cpuInfo &&
      b.stepCompleted.componentInfo &&
      b.stepCompleted.testing
    );
    const bkcDetailsComplete = builds.every(b => b.stepCompleted.bkcDetails);
    const qualityDetailsComplete = builds.every(b => b.stepCompleted.qualityDetails);

    return {
      generalInfo: generalInfoComplete ? 'completed' : 'pending',
      systemInfo: allSystemInfoComplete ? 'completed' : 'pending',
      bkcDetails: bkcDetailsComplete ? 'completed' : 'pending',
      qualityIndicator: qualityDetailsComplete ? 'completed' : 'pending'
    };
  };

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

  const progressStatus = getProgressStatus();

  // ============ RENDER ============
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
        <h1>Start Build</h1>
        <div className="header-actions">
          <button
            className="btn-secondary"
            onClick={() => setShowReview(!showReview)}
          >
            <FontAwesomeIcon icon={faEye} /> {showReview ? 'Hide' : 'Show'} Review
          </button>
          <button
            className="btn-secondary"
            onClick={() => { setShowGPUInfo(v => !v); setGpuSubStep('gpuInfo'); }}
            style={{ background: showGPUInfo ? '#1a73e8' : undefined, color: showGPUInfo ? '#fff' : undefined }}
          >
            {showGPUInfo ? 'Server Information' : 'GPU Information'}
          </button>
          <button
            className="btn-secondary"
            onClick={() => bulkImportRef.current?.click()}
          >
            Import Bulk
          </button>
          <input
            ref={bulkImportRef}
            type="file"
            accept=".xls,.xlsx"
            style={{ display: 'none' }}
            onChange={handleBulkImport}
          />
        </div>
        {bulkImportStatus && (
          <div style={{
            margin: '8px 0',
            padding: '10px 16px',
            borderRadius: '6px',
            fontSize: '13px',
            background: bulkImportStatus.type === 'success' ? '#eafaf1' : bulkImportStatus.type === 'error' ? '#fdedec' : '#eaf4fb',
            color: bulkImportStatus.type === 'success' ? '#1e8449' : bulkImportStatus.type === 'error' ? '#c0392b' : '#2471a3',
            border: `1px solid ${bulkImportStatus.type === 'success' ? '#a9dfbf' : bulkImportStatus.type === 'error' ? '#f1948a' : '#85c1e9'}`
          }}>
            {bulkImportStatus.message}
          </div>
        )}

      </div>

      <ProgressTracker
        progressStatus={progressStatus}
        currentStep={currentStep}
        showRework={currentStep === 'qualityIndicator'}
        onReworkClick={() => setCurrentStep('rework')}
        showGPUInfo={showGPUInfo}
        gpuSubStep={gpuSubStep}
      />

      <SaveResults saveResults={navigation.saveResults.concat(save.saveResults)} />

      {gpuSaveMessage && (
        <div style={{
          margin: '12px 0',
          padding: '14px 18px',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: gpuSaveMessage.type === 'success' ? '#d4edda' : '#f8d7da',
          border: `1px solid ${gpuSaveMessage.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
          color: gpuSaveMessage.type === 'success' ? '#155724' : '#721c24',
        }}>
          <span>{gpuSaveMessage.text}</span>
          <span style={{ cursor: 'pointer', marginLeft: 12, fontWeight: 700 }} onClick={() => setGpuSaveMessage(null)}>✕</span>
        </div>
      )}

      {/* Sub-step title */}
      {(currentStep === 'systemInfo' || currentStep === 'bkcDetails' || currentStep === 'qualityIndicator') && (
        <div className="sub-step-title">
          <h2>
            {currentStep === 'bkcDetails' ? 'BKC Details' :
              currentStep === 'qualityIndicator' ? 'Quality Indicator' :
              (currentStep === 'systemInfo' && showGPUInfo && gpuSubStep === 'gpuInfo') ? 'GPU Information' :
              (currentStep === 'systemInfo' && showGPUInfo && gpuSubStep === 'gpuComponent') ? 'Component/Rework Information' :
              (currentStep === 'systemInfo' && showGPUInfo && gpuSubStep === 'gpuTesting') ? 'Testing' :
              (currentStep === 'systemInfo' && showGPUInfo && gpuSubStep === 'gpuFirmware') ? 'Firmware Details' :
                getSubStepTitle()}
          </h2>
        </div>
      )}

      {/* General Information Table */}
      {currentStep === 'generalInfo' && (
        <GeneralInfoTable
          builds={builds}
          handleInputChange={handleInputChange}
          removeBuild={removeBuild}
          isBuildSelected={isBuildSelected}
          isAllSelected={isAllSelected}
          toggleBuildSelection={toggleBuildSelection}
          toggleSelectAll={toggleSelectAll}
        />
      )}

      {/* System Information Table — replaced by GPU Info when toggled */}
      {currentStep === 'systemInfo' && showGPUInfo && gpuSubStep === 'gpuInfo' && (
        <GPUInfoTable
          builds={builds}
          handleInputChange={handleInputChange}
          removeBuild={removeBuild}
        />
      )}
      {currentStep === 'systemInfo' && showGPUInfo && gpuSubStep === 'gpuComponent' && (
        <GPUComponentTable
          builds={builds}
          handleInputChange={handleInputChange}
          removeBuild={removeBuild}
        />
      )}
      {currentStep === 'systemInfo' && showGPUInfo && gpuSubStep === 'gpuTesting' && (
        <GPUTestingTable
          builds={builds}
          handleInputChange={handleInputChange}
          removeBuild={removeBuild}
          onExtractLog={handleExtractLog}
        />
      )}
      {currentStep === 'systemInfo' && showGPUInfo && gpuSubStep === 'gpuFirmware' && (
        <GPUFirmwareTable
          builds={builds}
          handleInputChange={handleInputChange}
          removeBuild={removeBuild}
          onExtractLog={handleExtractLog}
        />
      )}
      {currentStep === 'systemInfo' && !showGPUInfo && (
        <SystemInfoTable
          builds={builds}
          setBuilds={setBuilds}
          systemInfoSubStep={systemInfoSubStep}
          showReview={showReview}
          handleInputChange={handleInputChange}
          onExtractLog={handleExtractLog}
          partNumberSuggestions={partNumberSuggestions}
          scannerRefs={scannerRefs}
          selectedField={selectedField}
          setSelectedField={setSelectedField}
          selectedBuildIndex={selectedBuildIndex}
          setSelectedBuildIndex={setSelectedBuildIndex}
          handleFileSelection={fileHandling.handleFileSelection}
          removePhoto={fileHandling.removePhoto}
          partNumberSearch={partNumberSearch}
          showPartNumberDropdown={showPartNumberDropdown}
          setShowPartNumberDropdown={setShowPartNumberDropdown}
          handlePartNumberSearchChange={handlePartNumberSearchChange}
          selectPartNumber={selectPartNumber}
        />
      )}

      {/* BKC Details Table */}
      {currentStep === 'bkcDetails' && (
        <>
          <BkcDetailsTable
            builds={builds}
            extractFirmwareVersions={bkcManagement.extractFirmwareVersions}
            handleBkcFieldChange={bkcManagement.handleBkcFieldChange}
          />

          {/* BKC Note */}
          <div className="bkc-note">
            <FontAwesomeIcon icon={faExclamationTriangle} />
            <span>If extraction fails, you can manually enter the firmware versions. SCM FPGA Version is optional.</span>
          </div>
        </>
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
          saving={save.saving}
          onSaveAndRework={handleSaveAndRework}
          onContinueLater={handleContinueLater}
          onSaveAsFailed={handleSaveAsFailed}
          onSaveAsComplete={handleSaveAsComplete}
        />
      )}

      {/* 🔥 Rework Table */}
      {currentStep === 'rework' && (
        <ReworkTable
          builds={builds}
          //saving={save.saving}
          setReworkData={setReworkData}
          reworkData={reworkData}
          onSave={saveReworkPass}
          savingIndex={savingIndex}
          savedIndex={savedIndex}
          onBack={() => setCurrentStep('systemInfo')}
        />
      )}

      <StepNavigation
        currentStep={currentStep}
        systemInfoSubStep={systemInfoSubStep}
        builds={builds}
        addNewBuild={addNewBuild}
        navigatePrevious={navigation.navigatePrevious}
        navigateNext={navigation.navigateNext}
        saving={save.saving}
        showGPUInfo={showGPUInfo}
        gpuSubStep={gpuSubStep}
        onSaveGPU={handleSaveGPU}
        onContinueLaterGPU={handleContinueLaterGPU}
        gpuSaving={gpuSaving}
      />

      {/* Auto-Save Indicator */}
      <AutoSaveIndicator builds={builds} />
    </div>
  );
};

export default StartBuild;