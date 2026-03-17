// frontend/src/pages/MasterBuild/hooks/useTableUtils.js

import { useMemo } from 'react';

const useTableUtils = (selectedBuilds, selectedRows, sourceRow, masterData, setMasterData, setBulkMatchMessage, collapsedSections, setCpuModal, setDimmModal) => {

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

  // Match bulk entry - UPDATED to work with multiple selected rows
  const handleBulkMatch = () => {
    if (selectedRows.length === 0) {
      setBulkMatchMessage('Please select at least one row to populate');
      setTimeout(() => setBulkMatchMessage(''), 3000);
      return;
    }

    if (!sourceRow) {
      setBulkMatchMessage('Please select a source row to copy values from');
      setTimeout(() => setBulkMatchMessage(''), 3000);
      return;
    }

    const sourceData = masterData.builds[sourceRow];
    if (!sourceData) {
      setBulkMatchMessage('Source row data not found');
      setTimeout(() => setBulkMatchMessage(''), 3000);
      return;
    }

    const updatedBuilds = { ...masterData.builds };

    // Only update the selected rows
    selectedRows.forEach(chassisSN => {
      if (chassisSN !== sourceRow) {
        // Copy all data except changegearAssetId and masterStatus to preserve individual values
        const { changegearAssetId, master_status, masterStatus, ...dataWithoutAssetIdAndStatus } = sourceData;

        // Preserve the original changegear asset ID
        const currentAssetId = masterData.builds[chassisSN]?.changegearAssetId ||
                              selectedBuilds.find(b => b.chassis_sn === chassisSN)?.changegear_asset_id || '';

        // Preserve the original masterStatus
        const currentMasterStatus = masterData.builds[chassisSN]?.masterStatus ||
                                    masterData.builds[chassisSN]?.master_status ||
                                    selectedBuilds.find(b => b.chassis_sn === chassisSN)?.masterStatus ||
                                    selectedBuilds.find(b => b.chassis_sn === chassisSN)?.master_status || '';

        updatedBuilds[chassisSN] = {
          ...dataWithoutAssetIdAndStatus,
          changegearAssetId: currentAssetId,
          masterStatus: currentMasterStatus
        };
      }
    });

    setMasterData(prev => ({
      ...prev,
      builds: updatedBuilds
    }));

    const targetCount = selectedRows.filter(sn => sn !== sourceRow).length;
    setBulkMatchMessage(`Copied values from ${sourceRow} to ${targetCount} selected row${targetCount !== 1 ? 's' : ''} (excluding Changegear Asset ID & Master Status)`);
    setTimeout(() => setBulkMatchMessage(''), 3000);
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
    const dimms = [];
    if (build.dimm_sns) {
      const dimmArray = build.dimm_sns.split(',').filter(sn => sn.trim());
      dimmArray.forEach((sn, index) => {
        dimms.push({
          position: index + 1,
          serialNumber: sn.trim()
        });
      });
    }
    
    setDimmModal({
      show: true,
      chassisSN: build.chassis_sn,
      dimms: dimms
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
    handleBulkMatch,
    showCpuDetails,
    showDimmDetails,
    getCpuQty,
    getStatusBadgeClass
  };
};

export default useTableUtils;