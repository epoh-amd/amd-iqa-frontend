// frontend/src/pages/StartBuild/StepNavigation.js

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';

const StepNavigation = ({
  currentStep,
  systemInfoSubStep,
  builds,
  addNewBuild,
  navigatePrevious,
  navigateNext,
  saving,
  showGPUInfo = false,
  gpuSubStep = 'gpuInfo',
  onSaveGPU,
  gpuSaving = false,
  onContinueLaterGPU,
}) => {
  
  return (
    <div className="step-navigation">
      <div className="nav-left">
        {currentStep === 'generalInfo' && (
          <button className="btn-secondary" onClick={addNewBuild}>
            <FontAwesomeIcon icon={faPlus} /> Add New Build
          </button>
        )}
      </div>
      <div className="nav-right">
        {(currentStep === 'systemInfo' || currentStep === 'bkcDetails' || currentStep === 'qualityIndicator'|| currentStep ==='rework') && (
          <button 
            className="btn-secondary" 
            onClick={navigatePrevious}
            disabled={saving}
          >
            Previous
          </button>
        )}
        
        {/* Continue Later + Save buttons on Firmware Details page */}
        {showGPUInfo && gpuSubStep === 'gpuFirmware' && (
          <>
            <button
              className="btn-secondary"
              onClick={onContinueLaterGPU}
              disabled={gpuSaving || saving}
            >
              Continue Later
            </button>
            <button
              className="btn-primary"
              onClick={onSaveGPU}
              disabled={gpuSaving || saving}
            >
              {gpuSaving ? 'Saving...' : 'Save'}
            </button>
          </>
        )}

        {/* Hide Next on final GPU page (Firmware Details) and on Quality Indicator */}
        {currentStep !== 'qualityIndicator' &&
         !(showGPUInfo && gpuSubStep === 'gpuFirmware') && (
          <button
            className="btn-primary"
            onClick={navigateNext}
            disabled={saving}
          >
            Next
          </button>
        )}
        
        {/* No action buttons in Quality Indicator - handled in the table */}
      </div>  
    </div>
  );
};

export default StepNavigation;