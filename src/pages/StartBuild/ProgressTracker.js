// frontend/src/pages/StartBuild/ProgressTracker.js

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faCircle, faWrench } from '@fortawesome/free-solid-svg-icons';

const GPU_STEPS = [
  { key: 'gpuInfo',      label: 'GPU Information' },
  { key: 'gpuComponent', label: 'Component/Rework' },
  { key: 'gpuTesting',   label: 'Testing' },
  { key: 'gpuFirmware',  label: 'Firmware Details' },
];

const GPU_ORDER = GPU_STEPS.map(s => s.key);

const ProgressTracker = ({ progressStatus, currentStep, onReworkClick, showGPUInfo = false, gpuSubStep = 'gpuInfo' }) => {

  const Step = ({ label, status }) => (
    <div className={`progress-step ${status}`}>
      <div className="step-indicator">
        {status === 'completed'
          ? <FontAwesomeIcon icon={faCheck} />
          : <FontAwesomeIcon icon={faCircle} />}
      </div>
      <span className="step-label">{label}</span>
    </div>
  );

  if (showGPUInfo) {
    const isOnGeneral = currentStep === 'generalInfo';
    const currentIdx = isOnGeneral ? -1 : GPU_ORDER.indexOf(gpuSubStep);
    const generalStatus = isOnGeneral ? 'active' : 'completed';

    return (
      <div className="progress-tracker">
        <Step label="General Information" status={generalStatus} />
        {GPU_STEPS.map((step, i) => {
          const status = i < currentIdx ? 'completed' : i === currentIdx ? 'active' : 'pending';
          return (
            <React.Fragment key={step.key}>
              <div className="progress-line"></div>
              <Step label={step.label} status={status} />
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  return (
    <div className="progress-tracker">
      <div className={`progress-step ${progressStatus.generalInfo === 'completed' ? 'completed' : currentStep === 'generalInfo' ? 'active' : 'pending'}`}>
        <div className="step-indicator">
          {progressStatus.generalInfo === 'completed' ?
            <FontAwesomeIcon icon={faCheck} /> :
            <FontAwesomeIcon icon={faCircle} />
          }
        </div>
        <span className="step-label">General Information</span>
      </div>

      <div className="progress-line"></div>

      <div className={`progress-step ${progressStatus.systemInfo === 'completed' ? 'completed' : currentStep === 'systemInfo' ? 'active' : 'pending'}`}>
        <div className="step-indicator">
          {progressStatus.systemInfo === 'completed' ?
            <FontAwesomeIcon icon={faCheck} /> :
            <FontAwesomeIcon icon={faCircle} />
          }
        </div>
        <span className="step-label">System Information</span>
      </div>

      {progressStatus.systemInfo === 'completed' && (
        <>
          <div className="progress-line"></div>
          <div className="progress-step rework clickable" onClick={onReworkClick}>
            <div className="step-indicator">
              <FontAwesomeIcon icon={faWrench} />
            </div>
            <span className="step-label">Incoming Rework</span>
          </div>
        </>
      )}

      <div className="progress-line"></div>

      <div className={`progress-step ${progressStatus.bkcDetails === 'completed' ? 'completed' : currentStep === 'bkcDetails' ? 'active' : 'pending'}`}>
        <div className="step-indicator">
          {progressStatus.bkcDetails === 'completed' ?
            <FontAwesomeIcon icon={faCheck} /> :
            <FontAwesomeIcon icon={faCircle} />
          }
        </div>
        <span className="step-label">BKC Details</span>
      </div>

      <div className="progress-line"></div>

      <div className={`progress-step ${progressStatus.qualityIndicator === 'completed' ? 'completed' : currentStep === 'qualityIndicator' ? 'active' : 'pending'}`}>
        <div className="step-indicator">
          {progressStatus.qualityIndicator === 'completed' ?
            <FontAwesomeIcon icon={faCheck} /> :
            <FontAwesomeIcon icon={faCircle} />
          }
        </div>
        <span className="step-label">Quality Indicator</span>
      </div>
    </div>
  );
};

export default ProgressTracker;