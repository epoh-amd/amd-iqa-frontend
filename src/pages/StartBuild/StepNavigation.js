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
  saving
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
        {(currentStep === 'systemInfo' || currentStep === 'bkcDetails' || currentStep === 'qualityIndicator') && (
          <button 
            className="btn-secondary" 
            onClick={navigatePrevious}
            disabled={saving}
          >
            Previous
          </button>
        )}
        
        {/* Show Next button for all steps except final Quality Indicator */}
        {currentStep !== 'qualityIndicator' && (
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