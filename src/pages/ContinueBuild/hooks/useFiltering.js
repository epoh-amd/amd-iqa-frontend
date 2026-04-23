// frontend/src/pages/ContinueBuild/hooks/useFiltering.js

import { useState, useMemo, useEffect } from 'react';

export const useFiltering = (builds) => {
  const FILTERS_STORAGE_KEY = 'continueBuildFilters';
  const defaultFilters = {
    dateFrom: '',
    dateTo: '',
    location: '',
    projectName: '',
    systemPN: '',
    platformType: '',
    chassisSN: '',
    bmcName: '',
    cpuSocket: '',
    lastStep: ''
  };

  // Load filters from localStorage if available, but exclude location
  const [filters, setFilters] = useState(() => {
    try {
      const saved = localStorage.getItem(FILTERS_STORAGE_KEY);
      if (saved) {
        const savedFilters = JSON.parse(saved);
        // Remove location from saved filters - always use fresh from database
        delete savedFilters.location;
        return { ...defaultFilters, ...savedFilters };
      }
      return defaultFilters;
    } catch {
      return defaultFilters;
    }
  });

  // Save filters to localStorage whenever they change, but exclude location
  useEffect(() => {
    try {
      const filtersToSave = { ...filters };
      // Remove location from saved filters - always use fresh from database
      delete filtersToSave.location;
      localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filtersToSave));
    } catch {}
  }, [filters]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
    try {
      localStorage.removeItem(FILTERS_STORAGE_KEY);
    } catch {}
  };

  const filteredBuilds = useMemo(() => {
    return builds.filter(build => {
      // Date filtering
      if (filters.dateFrom) {
        const buildDate = new Date(build.updated_at);
        const fromDate = new Date(filters.dateFrom);
        if (buildDate < fromDate) return false;
      }
      
      if (filters.dateTo) {
        const buildDate = new Date(build.updated_at);
        const toDate = new Date(filters.dateTo);
        toDate.setHours(23, 59, 59);
        if (buildDate > toDate) return false;
      }
      
      // Exact match filters
      if (filters.location && build.location !== filters.location) return false;
      if (filters.projectName && build.project_name !== filters.projectName) return false;
      if (filters.cpuSocket && build.cpu_socket !== filters.cpuSocket) return false;
      
      // Text search filtering
      if (filters.systemPN && !build.system_pn?.toLowerCase().includes(filters.systemPN.toLowerCase())) {
        return false;
      }
      
      if (filters.platformType && !build.platform_type?.toLowerCase().includes(filters.platformType.toLowerCase())) {
        return false;
      }
      
      if (filters.chassisSN && !build.chassis_sn?.toLowerCase().includes(filters.chassisSN.toLowerCase())) {
        return false;
      }
      
      if (filters.bmcName && !build.bmc_name?.toLowerCase().includes(filters.bmcName.toLowerCase())) {
        return false;
      }
      
      // Last step filter
      if (filters.lastStep) {
        const stepCompleted = build.stepCompleted || {};
        const lastCompletedStep = getLastCompletedStepKey(stepCompleted);
        if (lastCompletedStep !== filters.lastStep) return false;
      }
      
      return true;
    });
  }, [builds, filters]);

  // Helper to get last completed step key
  const getLastCompletedStepKey = (stepCompleted) => {
    const steps = ['qualityDetails', 'bkcDetails', 'testing', 'componentInfo', 'cpuInfo', 'chassisInfo', 'generalInfo'];
    for (const step of steps) {
      if (stepCompleted[step]) return step;
    }
    return null;
  };

  return {
    filters,
    setFilters,
    filteredBuilds,
    handleFilterChange,
    resetFilters
  };
}