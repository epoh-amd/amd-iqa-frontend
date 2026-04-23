
import { useState, useMemo, useEffect } from 'react';

export const useFiltering = (builds) => {
  // Key for localStorage
  const FILTERS_STORAGE_KEY = 'masterBuildFilters';

  // Load initial filters from localStorage if available, but exclude location
  const getInitialFilters = () => {
    try {
      const saved = localStorage.getItem(FILTERS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Remove location from saved filters - always use fresh from database
        delete parsed.location;
        // Ensure systemPN is always an array for backward compatibility
        if (parsed.systemPN && !Array.isArray(parsed.systemPN)) {
          parsed.systemPN = parsed.systemPN ? [parsed.systemPN] : [];
        }
        // Ensure buildTechnician is always an array for backward compatibility
        if (parsed.buildTechnician && !Array.isArray(parsed.buildTechnician)) {
          parsed.buildTechnician = parsed.buildTechnician ? [parsed.buildTechnician] : [];
        }
        return { ...getDefaultFilters(), ...parsed };
      }
    } catch (e) {
      // ignore parse errors
    }
    return getDefaultFilters();
  };

  const getDefaultFilters = () => ({
    dateFrom: '',
    dateTo: '',
    chassisSN: '',
    location: '',
    projectName: '',
    systemPN: [], // Changed to array for multi-select
    platformType: '',
    bmcName: '',
    mbSN: '',
    cpuSocket: '',
    cpuVendor: '',
    buildTechnician: [], // Changed to array for multi-select
    smsOrder: '',
    buildName: '',
    fpyStatus: '',
    canContinue: '',
    masterStatus: ''
  });

  const [filters, setFilters] = useState(getInitialFilters);

  const handleFilterChange = (field, value) => {
    setFilters(prev => {
      const updated = {
        ...prev,
        [field]: value
      };
      // Save to localStorage, but exclude location
      try {
        const filtersToSave = { ...updated };
        // Remove location from saved filters - always use fresh from database
        delete filtersToSave.location;
        localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filtersToSave));
      } catch (e) {
        // ignore storage errors
      }
      return updated;
    });
  };

  const resetFilters = () => {
    const cleared = getDefaultFilters();
    setFilters(cleared);
    // Remove from localStorage
    try {
      localStorage.removeItem(FILTERS_STORAGE_KEY);
    } catch (e) {
      // ignore storage errors
    }
  };

  // On mount, restore filters from localStorage if present (in case setFilters is replaced by React)
  useEffect(() => {
    const saved = localStorage.getItem(FILTERS_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Remove location from saved filters - always use fresh from database
        delete parsed.location;
        // Ensure systemPN is always an array for backward compatibility
        if (parsed.systemPN && !Array.isArray(parsed.systemPN)) {
          parsed.systemPN = parsed.systemPN ? [parsed.systemPN] : [];
        }
        // Ensure buildTechnician is always an array for backward compatibility
        if (parsed.buildTechnician && !Array.isArray(parsed.buildTechnician)) {
          parsed.buildTechnician = parsed.buildTechnician ? [parsed.buildTechnician] : [];
        }
        setFilters(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        // ignore parse errors
      }
    }
    // eslint-disable-next-line
  }, []);

  const filteredBuilds = useMemo(() => {
    return builds.filter(build => {
      // Date From filter

      if (filters.dateFrom && build.created_at) {
        const buildDate = new Date(build.created_at).toISOString().split('T')[0];
        if (buildDate < filters.dateFrom) {
          return false;
        }
      }

      // Date To filter
      if (filters.dateTo && build.created_at) {
        const buildDate = new Date(build.created_at).toISOString().split('T')[0];
        if (buildDate > filters.dateTo) {
          return false;
        }
      }


      // Chassis S/N filter
      if (filters.chassisSN && !build.chassis_sn.toLowerCase().includes(String(filters.chassisSN).toLowerCase())) {
        return false;
      }

      //Location filter
      if (filters.location && build.location !== filters.location) {
        console.log("Filter location:", filters.location);
        console.log("Build location:", build.location);
        return false;
      }


      // Project Name filter
       if (filters.projectName && (!build.project_name || !build.project_name.toLowerCase().includes(String(filters.projectName).toLowerCase()))) {
        return false;
      }


      // System P/N filter - Updated for multi-select
      if (filters.systemPN && filters.systemPN.length > 0 && !filters.systemPN.some(pn =>
        build.system_pn && build.system_pn.toLowerCase().includes(pn.toLowerCase())
      )) {
        return false;
      }

      // Platform Type filter
      if (filters.platformType && (!build.platform_type || !build.platform_type.toLowerCase().includes(String(filters.platformType).toLowerCase()))) {
        return false;
      }

      // BMC Name filter
      if (filters.bmcName && (!build.bmc_name || !build.bmc_name.toLowerCase().includes(String(filters.bmcName).toLowerCase()))) {
        return false;
      }

      // MB S/N filter
      if (filters.mbSN && (!build.mb_sn || !build.mb_sn.toLowerCase().includes(String(filters.mbSN).toLowerCase()))) {
        return false;
      }

      // CPU Socket filter
      if (filters.cpuSocket && build.cpu_socket !== filters.cpuSocket) {
        return false;
      }

      // CPU Vendor filter
      if (filters.cpuVendor && build.cpu_vendor !== filters.cpuVendor) {
        return false;
      }

      // Build Technician filter - Handle array (multi-select)
      if (filters.buildTechnician && filters.buildTechnician.length > 0 && !filters.buildTechnician.some(tech =>
        build.build_engineer && build.build_engineer.toLowerCase().includes(tech.toLowerCase())
      )) {
        return false;
      }

      // SMS Order filter
      if (filters.smsOrder && (!build.sms_order || !build.sms_order.toLowerCase().includes(String(filters.smsOrder).toLowerCase()))) {
        return false;
      }



      // Build Name filter
      if (filters.buildName && (!build.build_name || !build.build_name.toLowerCase().includes(String(filters.buildName).toLowerCase()))) {
        return false;
      }

      // FPY Status filter
      if (filters.fpyStatus && build.fpy_status !== filters.fpyStatus) {
        return false;
      }


      // Can Continue filter
      if (filters.canContinue && build.can_continue !== filters.canContinue) {
        return false;
      }


      // Master Status filter
      if (filters.masterStatus && build.master_status !== filters.masterStatus) {
        return false;
      }

      // DEFAULT EXCLUSION: Exclude "Delivered" and "Incomplete" builds unless explicitly filtered
      // Only apply this exclusion when masterStatus filter is NOT set (i.e., user hasn't chosen a specific status)
      if (!filters.masterStatus) {
        if (build.master_status === 'Delivered' || build.master_status === 'Incomplete') {
          return false;
        }
      }


      return true;
    });
  }, [builds, filters]);

  // Generate unique System P/N options from builds
  const systemPNOptions = useMemo(() => {
    const uniqueSystemPNs = [...new Set(
      builds
        .map(build => build.system_pn)
        .filter(pn => pn && pn.trim() !== '')
    )].sort();

    return uniqueSystemPNs.map(pn => ({
      value: pn,
      label: pn
    }));
  }, [builds]);

  // Generate unique Build Technician options from builds
  const buildTechnicianOptions = useMemo(() => {
    const uniqueTechnicians = [...new Set(
      builds
        .map(build => build.build_engineer)
        .filter(tech => tech && tech.trim() !== '')
    )].sort();

    return uniqueTechnicians.map(tech => ({
      value: tech,
      label: tech
    }));
  }, [builds]);

  return {
    filters,
    setFilters,
    filteredBuilds,
    systemPNOptions,
    buildTechnicianOptions,
    handleFilterChange,
    resetFilters
  };
};