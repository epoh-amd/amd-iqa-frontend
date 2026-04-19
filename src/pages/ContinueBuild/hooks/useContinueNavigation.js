// frontend/src/pages/ContinueBuild/hooks/useContinueNavigation.js
export const useContinueNavigation = (
    currentStep,
    setCurrentStep,
    systemInfoSubStep,
    setSystemInfoSubStep,
    builds,
    validation
  ) => {
    
    // Get next navigation step
    const getNextStep = () => {
      if (currentStep === 'generalInfo') {
        return { step: 'systemInfo', subStep: 'chassisInfo' };
      } else if (currentStep === 'systemInfo') {
        switch (systemInfoSubStep) {
          case 'chassisInfo':
            return { step: 'systemInfo', subStep: 'cpuInfo' };
          case 'cpuInfo':
            return { step: 'systemInfo', subStep: 'componentInfo' };
          case 'componentInfo':
            return { step: 'systemInfo', subStep: 'testing' };
          case 'testing':
            return { step: 'bkcDetails', subStep: null };
          default:
            return null;
        }
      } else if (currentStep === 'bkcDetails') {
        return { step: 'qualityIndicator', subStep: null };
      }
      return null;
    };
  
    // Get previous navigation step
    const getPreviousStep = () => {
      if (currentStep === 'qualityIndicator') {
        return { step: 'bkcDetails', subStep: null };
      } else if (currentStep === 'bkcDetails') {
        return { step: 'systemInfo', subStep: 'testing' };
      } else if (currentStep === 'systemInfo') {
        switch (systemInfoSubStep) {
          case 'testing':
            return { step: 'systemInfo', subStep: 'componentInfo' };
          case 'componentInfo':
            return { step: 'systemInfo', subStep: 'cpuInfo' };
          case 'cpuInfo':
            return { step: 'systemInfo', subStep: 'chassisInfo' };
          case 'chassisInfo':
            return { step: 'generalInfo', subStep: null };
          default:
            return null;
        }
      }
      return null;
    };
  
    // Navigate to next step
    const navigateNext = () => {
      const next = getNextStep();
      if (next) {
        setCurrentStep(next.step);
        if (next.subStep) {
          setSystemInfoSubStep(next.subStep);
        }
      }
    };
  
    // Navigate to previous step
    const navigatePrevious = () => {    
      const prev = getPreviousStep();
      if (prev) {
        setCurrentStep(prev.step);
        if (prev.subStep) {
          setSystemInfoSubStep(prev.subStep);
        }
      }
    };
  
    // Check if can navigate to next step
    const canNavigateNext = () => {
      // For continue build, always allow navigation through read-only steps
      return currentStep !== 'qualityIndicator';
    };
  
    return {
      navigateNext,
      navigatePrevious,
      canNavigateNext,
      getNextStep,
      getPreviousStep
    };
  };