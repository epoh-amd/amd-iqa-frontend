// frontend/src/pages/MasterBuild/hooks/useMasterBuildState.js

import { useState } from 'react';

export const useMasterBuildState = () => {
  const [builds, setBuilds] = useState([]);
  const [selectedBuilds, setSelectedBuilds] = useState([]);
  const [currentStep, setCurrentStep] = useState('teamLocation');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  
  const [masterData, setMasterData] = useState({
    // Team & Location Details
    location: '',
    customLocation: '',
    teamSecurity: '',
    
    // Build & ChangeGear Information
    buildEngineer: '',
    buildName: '',
    jiraTicketNo: '',
    changegearAssetId: '',
    
    // MISC
    notes: '',
    smsOrder: '',
    costCenter: '',
    capitalization: '',
    deliveryDate: '',
    masterStatus: '',
    
    // Validation errors
    errors: {}
  });

  return {
    builds,
    setBuilds,
    selectedBuilds,
    setSelectedBuilds,
    masterData,
    setMasterData,
    currentStep,
    setCurrentStep,
    loading,
    setLoading,
    messages,
    setMessages
  };
};