// frontend/src/pages/ContinueBuild/components/StepNavigation.js
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft, 
  faArrowRight, 
  faSpinner
} from '@fortawesome/free-solid-svg-icons';

const StepNavigation = ({
  currentStep,
  systemInfoSubStep,
  builds,
  navigatePrevious,
  navigateNext,
  saving,
  canNavigateNext,
  isQualityStep
}) => {
  const showPrevious = currentStep !== 'generalInfo' || 
    (currentStep === 'systemInfo' && systemInfoSubStep !== 'chassisInfo');
  
  const showNext = !isQualityStep && canNavigateNext;

  return (
    <div className="step-navigation">
      <div className="nav-left">
        {showPrevious && (
          <button 
            className="btn-secondary"
            onClick={navigatePrevious}
            disabled={saving}
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            Previous
          </button>
        )}
      </div>
      
      <div className="nav-right">
        {showNext && (
          <button 
            className="btn-primary"
            onClick={navigateNext}
            disabled={saving}
          >
            Next
            <FontAwesomeIcon icon={faArrowRight} />
          </button>
        )}
      </div>
    </div>
  );
};

export default StepNavigation;