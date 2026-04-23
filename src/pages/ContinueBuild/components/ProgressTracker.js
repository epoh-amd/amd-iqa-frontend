// frontend/src/pages/ContinueBuild/components/ProgressTracker.js
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faCircle, faLock } from '@fortawesome/free-solid-svg-icons';

const ProgressTracker = ({ currentStep, systemInfoSubStep, builds }) => {
  const build = builds[0];
  
  const steps = [
    { id: 'generalInfo', label: 'General Information', completed: build?.stepCompleted?.generalInfo },
    { 
      id: 'systemInfo', 
      label: 'System Information',
      subSteps: [
        { id: 'chassisInfo', label: 'Chassis Info', completed: build?.stepCompleted?.chassisInfo },
        { id: 'cpuInfo', label: 'CPU Info', completed: build?.stepCompleted?.cpuInfo },
        { id: 'componentInfo', label: 'Component Info', completed: build?.stepCompleted?.componentInfo },
        { id: 'testing', label: 'Testing', completed: build?.stepCompleted?.testing }
      ]
    },
    { id: 'bkcDetails', label: 'BKC Details', completed: build?.stepCompleted?.bkcDetails },
    { id: 'qualityIndicator', label: 'Quality Indicator', completed: build?.stepCompleted?.qualityDetails }
  ];

  const getStepClass = (step, subStep = null) => {
    if (subStep) {
      if (currentStep === step.id && systemInfoSubStep === subStep.id) {
        return 'active';
      }
      return subStep.completed ? 'completed' : '';
    }
    
    if (currentStep === step.id) {
      return 'active';
    }
    return step.completed ? 'completed' : '';
  };

  return (
    <div className="progress-tracker">
      {steps.map((step, index) => (
        <div key={step.id} className="progress-step-container">
          <div className={`progress-step ${getStepClass(step)}`}>
            <div className="step-header">
              <div className="step-number">
                {step.completed ? (
                  <>
                    <FontAwesomeIcon icon={faCheck} />
                    {step.completed && <FontAwesomeIcon icon={faLock} className="lock-indicator" />}
                  </>
                ) : (
                  <FontAwesomeIcon icon={faCircle} />
                )}
              </div>
              <span className="step-label">{step.label}</span>
            </div>
            
            {step.subSteps && (
              <div className="sub-steps">
                {step.subSteps.map((subStep, subIndex) => (
                  <div key={subStep.id} className={`sub-step ${getStepClass(step, subStep)}`}>
                    <div className="sub-step-indicator">
                      {subStep.completed ? (
                        <>
                          <FontAwesomeIcon icon={faCheck} />
                          <FontAwesomeIcon icon={faLock} className="lock-indicator" />
                        </>
                      ) : (
                        <FontAwesomeIcon icon={faCircle} />
                      )}
                    </div>
                    <span className="sub-step-label">{subStep.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          {index < steps.length - 1 && <div className="progress-line" />}
        </div>
      ))}
    </div>
  );
};

export default ProgressTracker;