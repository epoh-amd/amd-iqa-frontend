// frontend/src/pages/SearchRecords/hooks/useSearchState.js

import { useState } from 'react';

const LOCAL_STORAGE_KEY = 'searchFilters';


export const useSearchState = () => {
  const [searchResults, setSearchResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);

  const getInitialFilters = () => {
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem(LOCAL_STORAGE_KEY) : null;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure systemPN is always an array for backward compatibility
        if (parsed.systemPN && !Array.isArray(parsed.systemPN)) {
          parsed.systemPN = parsed.systemPN ? [parsed.systemPN] : [];
        }
        // Ensure buildEngineer is always an array for backward compatibility
        if (parsed.buildEngineer && !Array.isArray(parsed.buildEngineer)) {
          parsed.buildEngineer = parsed.buildEngineer ? [parsed.buildEngineer] : [];
        }
        return {
          // Build Information
          dateFrom: '',
          dateTo: '',
          location: '',
          isCustomConfig: '',
          projectName: '',
          systemPN: [], // Changed to array for multi-select
          platformType: '',
          manufacturer: '',
          cpuVendor: '',
          buildEngineer: [], // Changed to array for multi-select
          smsOrder: '',
          buildName: '',
          // System Information
          chassisSN: '',
          chassisType: '',
          bmcName: '',
          bmcMac: '',
          mbSN: '',
          ethernetMac: '',
          cpuSocket: '',
          cpuProgramName: '',
          // Component Information
          cpuP0SN: '',
          cpuP1SN: '',
          m2PN: '',
          m2SN: '',
          dimmPN: '',
          dimmQty: '',
          dimmSN: '',
          // Testing
          visualInspection: '',
          bootStatus: '',
          dimmsDetected: '',
          lomWorking: '',
          // BKC Details
          biosVersion: '',
          scmFpga: '',
          hpmFpga: '',
          bmcVersion: '',
          // Quality Indicators
          status: '',
          fpyStatus: '',
          canContinue: '',
          problemDescription: '',
          failureMode: '',
          failureCategory: '',
          // Master Build Information
          masterLocation: '',
          customLocation: '',
          teamSecurity: '',
          department: '',
          jiraTicketNo: '',
          changegearAssetId: '',
          masterStatus: '',
          notes: '',
          costCenter: '',
          capitalization: '',
          deliveryDateFrom: '',
          deliveryDateTo: '',
          ...JSON.parse(saved)
        };
      } catch (e) {
        // Ignore parse errors
      }
    }
    return {
      // Build Information
      dateFrom: '',
      dateTo: '',
      location: '',
      isCustomConfig: '',
      projectName: '',
      systemPN: [], // Changed to array for multi-select
      platformType: '',
      manufacturer: '',
      cpuVendor: '',
      buildEngineer: [], // Changed to array for multi-select
      smsOrder: '',
      buildName: '',
      // System Information
      chassisSN: '',
      chassisType: '',
      bmcName: '',
      bmcMac: '',
      mbSN: '',
      ethernetMac: '',
      cpuSocket: '',
      cpuProgramName: '',
      // Component Information
      cpuP0SN: '',
      cpuP1SN: '',
      m2PN: '',
      m2SN: '',
      dimmPN: '',
      dimmQty: '',
      dimmSN: '',
      // Testing
      visualInspection: '',
      bootStatus: '',
      dimmsDetected: '',
      lomWorking: '',
      // BKC Details
      biosVersion: '',
      scmFpga: '',
      hpmFpga: '',
      bmcVersion: '',
      // Quality Indicators
      status: '',
      fpyStatus: '',
      canContinue: '',
      problemDescription: '',
      failureMode: '',
      failureCategory: '',
      // Master Build Information
      masterLocation: '',
      customLocation: '',
      teamSecurity: '',
      department: '',
      jiraTicketNo: '',
      changegearAssetId: '',
      masterStatus: '',
      notes: '',
      costCenter: '',
      capitalization: '',
      deliveryDateFrom: '',
      deliveryDateTo: ''
    };
  };

  const [filters, setFilters] = useState(getInitialFilters);

  return {
    searchResults,
    setSearchResults,
    filters,
    setFilters,
    loading,
    setLoading,
    messages,
    setMessages,
    searched,
    setSearched
  };
};