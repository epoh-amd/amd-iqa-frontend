import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye } from '@fortawesome/free-solid-svg-icons';

import ProgressTracker from '../../StartBuild/ProgressTracker';
import StepNavigation from '../../StartBuild/StepNavigation';
import SaveResults from '../../StartBuild/SaveResults';
import GPUInfoTable from '../../StartBuild/GPUInfoTable';
import GPUComponentTable from '../../StartBuild/GPUComponentTable';
import GPUTestingTable from '../../StartBuild/GPUTestingTable';
import GPUFirmwareTable from '../../StartBuild/GPUFirmwareTable';

import api from '../../../services/api';
import '../../../assets/css/startBuild.css';

const GPU_SUB_STEPS = ['gpuInfo', 'gpuComponent', 'gpuTesting', 'gpuFirmware'];

const GPUEditForm = ({ buildData, onComplete, onCancel, completesOnSave = false }) => {
  const [gpuSubStep, setGpuSubStep] = useState('gpuInfo');
  const [saving, setSaving] = useState(false);
  const [saveResults, setSaveResults] = useState([]);

  // Build the gpuInfo state from the DB row
  const [builds, setBuilds] = useState([{
    id: Date.now(),
    status: '',
    systemInfo: { bmcName: buildData.gpu_sn },
    gpuInfo: {
      projectName:          buildData.project_name || '',
      po:                   buildData.po || '',
      gpuPN:                buildData.gpu_pn || '',
      gpuSN:                buildData.gpu_sn || '',
      boardSN:              buildData.board_sn || '',
      boardManufacturer:    buildData.board_manufacturer || '',
      asicPN:               buildData.asic_pn || '',
      cpuSN:                buildData.cpu_sn || '',
      siliconRev:           buildData.silicon_rev || '',
      boardRev:             buildData.board_rev || '',
      gpuRev:               buildData.gpu_rev || '',
      modelName:            buildData.model_name || '',
      cpuPowerRating:       buildData.cpu_power_rating || '',
      heatsinkManufacturer: buildData.heatsink_manufacturer || '',
      heatsinkPN:           buildData.heatsink_pn || '',
      heatsinkSN:           buildData.heatsink_sn || '',
      visualInspection:     buildData.visual_inspection || '',
      visualInspectionNotes: buildData.visual_inspection_notes || '',
      bootToOS:             buildData.boot_to_os || '',
      bootToOSNotes:        buildData.boot_to_os_notes || '',
      gpuDetected:          buildData.gpu_detected || '',
      gpuDetectedNotes:     buildData.gpu_detected_notes || '',
      fAuditEnablement:     buildData.f_audit_enablement || '',
      fAuditEnablementNotes: buildData.f_audit_enablement_notes || '',
      fAuditValue:          buildData.f_audit_value || '',
      agfhcLvl3:            buildData.agfhc_lvl3 || '',
      agfhcLvl3Notes:       buildData.agfhc_lvl3_notes || '',
      roccRushTest:         buildData.rocc_rush_test || '',
      roccRushTestNotes:    buildData.rocc_rush_test_notes || '',
      hbmTest:              buildData.hbm_test || '',
      hbmTestNotes:         buildData.hbm_test_notes || '',
      transferBench:        buildData.transfer_bench || '',
      transferBenchNotes:   buildData.transfer_bench_notes || '',
      ifwiVersion:          buildData.ifwi_version || '',
      rmVersion:            buildData.rm_version || '',
    },
    errors: {},
  }]);

  // Load existing photos from gpu_build_photos table
  useEffect(() => {
    const loadPhotos = async () => {
      try {
        const photos = await api.getGpuBuildPhotos(buildData.gpu_sn);
        if (!photos.length) return;
        // Group photos by field_name and convert to { name, path } format
        const grouped = {};
        photos.forEach(p => {
          if (!grouped[p.field_name]) grouped[p.field_name] = [];
          grouped[p.field_name].push({ name: p.file_path.split('/').pop(), path: p.file_path });
        });
        setBuilds(prev => {
          const updated = [...prev];
          const existing = { ...updated[0].gpuInfo };
          Object.entries(grouped).forEach(([field, fieldPhotos]) => {
            existing[`${field}Photos`] = fieldPhotos;
          });
          updated[0] = { ...updated[0], gpuInfo: existing };
          return updated;
        });
      } catch (err) {
        console.error('Failed to load GPU photos:', err);
      }
    };
    loadPhotos();
  }, [buildData.gpu_sn]);

  const handleInputChange = (buildIndex, section, field, value) => {
    if (section !== 'gpuInfo') return;
    setBuilds(prev => {
      const updated = [...prev];
      updated[buildIndex] = { ...updated[buildIndex], gpuInfo: { ...updated[buildIndex].gpuInfo, [field]: value } };
      return updated;
    });
  };

  const navigatePrevious = () => {
    const idx = GPU_SUB_STEPS.indexOf(gpuSubStep);
    if (idx > 0) setGpuSubStep(GPU_SUB_STEPS[idx - 1]);
    else onCancel();
  };

  const navigateNext = () => {
    const idx = GPU_SUB_STEPS.indexOf(gpuSubStep);
    if (idx < GPU_SUB_STEPS.length - 1) setGpuSubStep(GPU_SUB_STEPS[idx + 1]);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveResults([]);
    const g = builds[0].gpuInfo;
    try {
      await api.updateGpuBuild(buildData.gpu_sn, {
        gpuSN: g.gpuSN,
        cpuSN: g.cpuSN,
        projectName: g.projectName, po: g.po, gpuPN: g.gpuPN,
        boardSN: g.boardSN, boardManufacturer: g.boardManufacturer, asicPN: g.asicPN,
        siliconRev: g.siliconRev, boardRev: g.boardRev, gpuRev: g.gpuRev, modelName: g.modelName,
        cpuPowerRating: g.cpuPowerRating, heatsinkManufacturer: g.heatsinkManufacturer,
        heatsinkPN: g.heatsinkPN, heatsinkSN: g.heatsinkSN,
        visualInspection: g.visualInspection, visualInspectionNotes: g.visualInspectionNotes,
        bootToOS: g.bootToOS, bootToOSNotes: g.bootToOSNotes,
        gpuDetected: g.gpuDetected, gpuDetectedNotes: g.gpuDetectedNotes,
        fAuditEnablement: g.fAuditEnablement, fAuditEnablementNotes: g.fAuditEnablementNotes,
        fAuditValue: g.fAuditValue,
        agfhcLvl3: g.agfhcLvl3, agfhcLvl3Notes: g.agfhcLvl3Notes,
        roccRushTest: g.roccRushTest, roccRushTestNotes: g.roccRushTestNotes,
        hbmTest: g.hbmTest, hbmTestNotes: g.hbmTestNotes,
        transferBench: g.transferBench, transferBenchNotes: g.transferBenchNotes,
        ifwiVersion: g.ifwiVersion, rmVersion: g.rmVersion,
        status: completesOnSave ? 'Completed' : undefined,
        buildEngineer: buildData.build_engineer || null,
      });

      // Sync photos: upload new ones, delete removed ones via replace-all on gpu_build_photos
      const photoFields = ['visualInspection','bootToOS','gpuDetected','fAuditEnablement',
                           'agfhcLvl3','roccRushTest','hbmTest','transferBench'];
      const photoPayload = [];
      for (const field of photoFields) {
        const photos = g[`${field}Photos`] || [];
        for (const photo of photos) {
          if (photo.file) {
            // New photo — upload it
            try {
              const result = await api.uploadPhoto(photo.file, `gpu_${field}`);
              photoPayload.push({ fieldName: field, filePath: result.filePath });
            } catch {}
          } else if (photo.path) {
            // Existing photo still in state — keep it
            photoPayload.push({ fieldName: field, filePath: photo.path });
          }
        }
      }
      // saveGpuPhotos does DELETE + INSERT so removed photos are dropped
      await api.saveGpuPhotos(buildData.gpu_sn, photoPayload);

      setSaveResults([{ type: 'success', message: `GPU build ${g.gpuSN} updated successfully.` }]);
      setTimeout(() => onComplete({ ...buildData, gpu_sn: g.gpuSN }), 1200);
    } catch (err) {
      setSaveResults([{ type: 'error', message: err.response?.data?.error || err.message || 'Failed to save.' }]);
    } finally {
      setSaving(false);
    }
  };

  const currentIdx  = GPU_SUB_STEPS.indexOf(gpuSubStep);
  const subStepTitles = {
    gpuInfo:      'GPU Information',
    gpuComponent: 'Component/Rework Information',
    gpuTesting:   'Testing',
    gpuFirmware:  'Firmware Details',
  };

  // Build a fake progressStatus so ProgressTracker renders GPU steps
  const progressStatus = { generalInfo: 'completed', systemInfo: 'pending', bkcDetails: 'pending', qualityIndicator: 'pending' };

  return (
    <div className="start-build-container edit-mode">
      <div className="page-header">
        <h1>Edit GPU Build: {buildData.gpu_sn}</h1>
        <div className="header-actions">
          <button className="btn-secondary" onClick={onCancel}>← Back to Search</button>
        </div>
      </div>

      <ProgressTracker
        progressStatus={progressStatus}
        currentStep="systemInfo"
        showGPUInfo={true}
        gpuSubStep={gpuSubStep}
      />

      <SaveResults saveResults={saveResults} />

      <div className="sub-step-title">
        <h2>{subStepTitles[gpuSubStep]}</h2>
      </div>

      {gpuSubStep === 'gpuInfo' && (
        <GPUInfoTable builds={builds} handleInputChange={handleInputChange} removeBuild={() => {}} isEditMode={true} />
      )}
      {gpuSubStep === 'gpuComponent' && (
        <GPUComponentTable builds={builds} handleInputChange={handleInputChange} removeBuild={() => {}} />
      )}
      {gpuSubStep === 'gpuTesting' && (
        <GPUTestingTable builds={builds} handleInputChange={handleInputChange} removeBuild={() => {}} />
      )}
      {gpuSubStep === 'gpuFirmware' && (
        <GPUFirmwareTable builds={builds} handleInputChange={handleInputChange} removeBuild={() => {}} />
      )}

      {/* Navigation */}
      <div className="step-navigation">
        <div className="nav-left" />
        <div className="nav-right">
          <button className="btn-secondary" onClick={navigatePrevious} disabled={saving}>
            Previous
          </button>
          {gpuSubStep !== 'gpuFirmware' ? (
            <button className="btn-primary" onClick={navigateNext} disabled={saving}>
              Next
            </button>
          ) : (
            <button className="btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GPUEditForm;
