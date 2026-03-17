// frontend/src/pages/SearchRecords/hooks/useTableUtils.js

import { useMemo } from 'react';

const useTableUtils = (results, collapsedSections, setCpuModal, setDimmModal) => {
  
  // Check if any sections are collapsed
  const hasCollapsedSections = useMemo(() => {
    return Object.values(collapsedSections).some(collapsed => collapsed);
  }, [collapsedSections]);

  // Count visible columns for each section
  const getColumnCount = (section) => {
    switch (section) {
      case 'general': return 2;
      case 'systemInfo': return 10;
      case 'cpuInfo': return 2;
      case 'componentInfo': return 4;
      case 'testing': return 4;
      case 'bkcDetails': return 4;
      case 'qualityIndicator': return 5;
      case 'teamLocation': return 4;
      case 'buildInfo': return 4;
      case 'misc': return 6;
      default: return 0;
    }
  };

  // Show CPU details
  const showCpuDetails = (build) => {
    const cpus = [];
    if (build.cpu_p0_sn) {
      cpus.push({ 
        position: 'P0', 
        serialNumber: build.cpu_p0_sn,
        socketDateCode: build.cpu_p0_socket_date_code
      });
    }
    if (build.cpu_p1_sn) {
      cpus.push({ 
        position: 'P1', 
        serialNumber: build.cpu_p1_sn,
        socketDateCode: build.cpu_p1_socket_date_code
      });
    }
    
    setCpuModal({
      show: true,
      chassisSN: build.chassis_sn,
      cpus: cpus
    });
  };

  // Show DIMM details
  const showDimmDetails = (build) => {
    let dimms = [];
    if (Array.isArray(build.dimmSNs)) {
      // If dimmSNs is an array of strings, convert to expected object format
      dimms = build.dimmSNs.map((sn, idx) => ({
        position: idx + 1,
        serialNumber: sn
      }));
    } else if (build.dimm_sns) {
      // If dimm_sns is a comma-separated string, split and convert
      const dimmArray = build.dimm_sns.split(',').filter(sn => sn.trim());
      dimms = dimmArray.map((sn, idx) => ({
        position: idx + 1,
        serialNumber: sn.trim()
      }));
    }
    setDimmModal({
      show: true,
      chassisSN: build.chassis_sn,
      dimms
    });
  };

  // Calculate CPU quantity
  const getCpuQty = (build) => {
    let count = 0;
    if (build.cpu_p0_sn) count++;
    if (build.cpu_p1_sn) count++;
    return count;
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Complete':
        return 'complete';
      case 'In Progress':
        return 'in-progress';
      case 'Fail':
        return 'fail';
      default:
        return '';
    }
  };

  return {
    hasCollapsedSections,
    getColumnCount,
    showCpuDetails,
    showDimmDetails,
    getCpuQty,
    getStatusBadgeClass
  };
};

export default useTableUtils;