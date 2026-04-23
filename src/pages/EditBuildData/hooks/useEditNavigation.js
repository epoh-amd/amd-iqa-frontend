// frontend/src/pages/EditBuildData/hooks/useEditNavigation.js
export const useEditNavigation = (
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
    } else if (currentStep === 'generalInfo') {
      return null;
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
    if (currentStep === 'rework') {
      setCurrentStep('qualityIndicator');
      return;
    }
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
