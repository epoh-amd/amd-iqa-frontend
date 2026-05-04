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
    console.log('Searching with filters:', filters);

    // ✅ 1. Fetch builds (existing)
    const response = await api.searchBuilds(filters);

    // ✅ 2. Fetch RMA (new)
    const rmaData = await api.getRma();

    console.log("rmadata", rmaData);

    // ✅ 3. Create fast lookup map
    const rmaMap = {};
    rmaData.forEach(item => {
      rmaMap[item.chassis_sn] = item;
    });

    // ✅ 4. Merge RMA into builds
    const merged = response.map(build => {
      const rma = rmaMap[build.chassis_sn];

      return {
        ...build,
        rma_pass_fail: rma?.pass_fail || '-',
        rma_notes: rma?.notes || '-',
        rma_dimm: rma?.dimm || '-',
        rma_bmc: rma?.bmc || '-',
        rma_m2: rma?.m2 || '-',
        rma_liquid_cooler: rma?.liquid_cooler || '-',
        rma_location: rma?.location || '-',
        rma_reference: rma?.rma || '-',
        rma_status: rma?.status || '-'
      };
    });

    console.log('Merged results:', merged);

    // ✅ 5. Set merged results
    setSearchResults(merged);

    if (merged.length === 0) {
      setMessages([{
        type: 'info',
        text: 'No records found matching your search criteria.'
      }]);
    } else {
      setMessages([{
        type: 'success',
        text: `Found ${merged.length} record(s) matching your search criteria.`
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