// frontend/src/pages/StartBuild/ProgressTracker.js

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faCircle, faWrench } from '@fortawesome/free-solid-svg-icons';

const ProgressTracker = ({ progressStatus, currentStep, onReworkClick }) => {
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

      {/* 🔥 Rework Step (ONLY SHOW HERE) */}
      {progressStatus.systemInfo === 'completed' && (
        <>
          <div className="progress-line"></div>

          <div
            className="progress-step rework clickable"
            onClick={onReworkClick}
          >
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