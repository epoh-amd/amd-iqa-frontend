// frontend/src/pages/SearchRecords/hooks/useSearchHandlers.js

import { useCallback } from 'react';
import api from '../../../services/api';

export const useSearchHandlers = (filters, setFilters, setSearchResults, setLoading, setMessages, setSearched) => {
  
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetFilters = () => {
    setFilters({
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
      buildEngineer: '',
      buildName: '',
      jiraTicketNo: '',
      changegearAssetId: '',
      masterStatus: '',
      notes: '',
      smsOrder: '',
      costCenter: '',
      capitalization: '',
      deliveryDateFrom: '',
      deliveryDateTo: ''
    });
    setSearchResults([]);
    setSearched(false);
  };

  const handleSearch = async () => {
    setLoading(true);
    setMessages([]);
    setSearched(true);
    
    try {
      // Call the search API with all filters - FIXED: Use correct endpoint
      console.log('Searching with filters:', filters);
      const response = await api.searchBuilds(filters);
      console.log('Search response:', response);
      
      setSearchResults(response);
      
      if (response.length === 0) {
        setMessages([{
          type: 'info',
          text: 'No records found matching your search criteria.'
        }]);
      } else {
        setMessages([{
          type: 'success',
          text: `Found ${response.length} record(s) matching your search criteria.`
        }]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setMessages([{
        type: 'error',
        text: error.response?.data?.error || 'Search failed. Please try again.'
      }]);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  return {
    handleSearch,
    resetFilters,
    handleFilterChange
  };
};