// frontend/src/pages/SearchRecords/index.js

import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch,
  faFilter,
  faSpinner
} from '@fortawesome/free-solid-svg-icons';

import SearchFilters from './components/SearchFilters';
import SearchResults from './components/SearchResults';
import MessageDisplay from './components/MessageDisplay';
import GPUSearchSection from './components/GPUSearchSection';

import { useSearchState } from './hooks/useSearchState';
import { useSearchHandlers } from './hooks/useSearchHandlers';

import api from '../../services/api';
import '../../assets/css/searchRecords.css';


const LOCAL_STORAGE_KEY = 'searchFilters';

const SearchRecords = () => {
  // State Management
  const {
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
  } = useSearchState();

  // System P/N options state
  const [systemPNOptions, setSystemPNOptions] = useState([]);
  const [buildTechnicianOptions, setBuildTechnicianOptions] = useState([]);
  const [changeGearOptions, setChangeGearOptions] = useState([]);



  // On mount, restore filters from localStorage if present
  useEffect(() => {
    const saved = window.localStorage.getItem(LOCAL_STORAGE_KEY);
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
        setFilters((prev) => ({ ...prev, ...parsed }));
      } catch (e) {
        // Ignore parse errors
      }
    }
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    const fetchChangeGearOptions = async () => {
      try {
        const data = await api.getChangeGearOptions();
        setChangeGearOptions(
          data.map(item => ({
            label: item,
            value: item
          }))
        );
        console.log("RAW DATA change gear:", data);
        //console.log('changeGearOptions:', changeGearOptions);
      } catch (error) {
        console.error('Failed to load ChangeGear options:', error);
      }
    };
  
    fetchChangeGearOptions();
  }, []);

  // Save filters to localStorage whenever they change
  useEffect(() => {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filters));
  }, [filters]);

  const {
    handleSearch,
    resetFilters,
    handleFilterChange
  } = useSearchHandlers(filters, setFilters, setSearchResults, setLoading, setMessages, setSearched);

  // UI State
  const [showFilters, setShowFilters] = useState(true);

  // GPU mode
  const [gpuMode, setGpuMode] = useState(false);
  const [gpuResults, setGpuResults] = useState([]);
  const [gpuLoading, setGpuLoading] = useState(false);
  const [gpuExporting, setGpuExporting] = useState(false);

  const handleGpuSearch = async (filters) => {
    setGpuLoading(true);
    try {
      // Fetch all GPU builds then filter client-side
      const response = await api.getAllGpuBuilds();
      console.log('[GPU search] response count:', response.length, '| sample project_name:', response[0]?.project_name, '| filter.projectName:', filters.projectName);
      // Client-side filter remaining fields
      const filtered = response.filter(b => {
        if (filters.projectName && b.project_name !== filters.projectName) return false;
        if (filters.po && !b.po?.toLowerCase().includes(filters.po.toLowerCase())) return false;
        if (filters.gpuSN && !b.gpu_sn?.toLowerCase().includes(filters.gpuSN.toLowerCase())) return false;
        if (filters.cpuSN && !b.cpu_sn?.toLowerCase().includes(filters.cpuSN.toLowerCase())) return false;
        if (filters.gpuPN && !b.gpu_pn?.toLowerCase().includes(filters.gpuPN.toLowerCase())) return false;
        if (filters.asicPN && !b.asic_pn?.toLowerCase().includes(filters.asicPN.toLowerCase())) return false;
        if (filters.siliconRev && !b.silicon_rev?.toLowerCase().includes(filters.siliconRev.toLowerCase())) return false;
        if (filters.boardRev && !b.board_rev?.toLowerCase().includes(filters.boardRev.toLowerCase())) return false;
        if (filters.gpuRev && !b.gpu_rev?.toLowerCase().includes(filters.gpuRev.toLowerCase())) return false;
        if (filters.modelName && !b.model_name?.toLowerCase().includes(filters.modelName.toLowerCase())) return false;
        if (filters.cpuPowerRating && b.cpu_power_rating !== filters.cpuPowerRating) return false;
        if (filters.heatsinkManufacturer && b.heatsink_manufacturer !== filters.heatsinkManufacturer) return false;
        if (filters.heatsinkPN && !b.heatsink_pn?.toLowerCase().includes(filters.heatsinkPN.toLowerCase())) return false;
        if (filters.heatsinkSN && !b.heatsink_sn?.toLowerCase().includes(filters.heatsinkSN.toLowerCase())) return false;
        if (filters.visualInspection && b.visual_inspection !== filters.visualInspection) return false;
        if (filters.bootToOS && b.boot_to_os !== filters.bootToOS) return false;
        if (filters.gpuDetected && b.gpu_detected !== filters.gpuDetected) return false;
        if (filters.agfhcLvl3 && b.agfhc_lvl3 !== filters.agfhcLvl3) return false;
        if (filters.roccRushTest && b.rocc_rush_test !== filters.roccRushTest) return false;
        if (filters.hbmTest && b.hbm_test !== filters.hbmTest) return false;
        if (filters.transferBench && b.transfer_bench !== filters.transferBench) return false;
        if (filters.ifwiVersion && !b.ifwi_version?.toLowerCase().includes(filters.ifwiVersion.toLowerCase())) return false;
        if (filters.rmVersion && !b.rm_version?.toLowerCase().includes(filters.rmVersion.toLowerCase())) return false;
        if (filters.status && b.status !== filters.status) return false;
        return true;
      });
      setGpuResults(filtered);
      if (filtered.length === 0) setMessages([{ type: 'warning', text: 'No GPU builds found.' }]);
      else setMessages([{ type: 'success', text: `Found ${filtered.length} GPU build(s).` }]);
    } catch (err) {
      console.error('GPU search error:', err.response?.data || err.message);
      setMessages([{ type: 'error', text: `Failed to search GPU builds: ${err.response?.data?.message || err.message}` }]);
    } finally {
      setGpuLoading(false);
    }
  };

  const handleGpuExport = async () => {
    if (!gpuResults.length) return;
    setGpuExporting(true);
    try {
      const XLSX = await import('xlsx');

      // Section header row (Build Engineer is standalone — no section label)
      const sectionRow = [
        'Build Reference', 'Status', 'Build Engineer',                         //  3  (cols 0-2)
        'GPU Information','','','','','','','','','','','','',                   // 13  (cols 3-15)
        'Component/Rework Information','','',                                   //  3  (cols 16-18)
        'Testing','','','','','','','','',                                      //  9  (cols 19-27)
        'Firmware Details','',                                                  //  2  (cols 28-29)
      ];

      // Column name row
      const colRow = ['','Status','Build Engineer',
        'Project Name','PO','GPU P/N','GPU S/N','Board S/N','Board Manufacturer','ASIC P/N','CPU S/N','Silicon Rev','Board Rev','GPU Rev','Model Name','CPU Power Rating',
        'Heatsink P/N','Heatsink S/N','Heatsink Manufacturer',
        'Visual Inspection','Boot to OS','GPU Detected','F-Audit Enablement','F-Audit Value','AGFHC lvl3','Roccrush Test','HBM Test','TransferBench',
        'IFWI Version','RM Version',
      ];

      // Data rows
      const dataRows = gpuResults.map(r => [
        '', r.status || '', r.build_engineer || '',
        r.project_name || '', r.po || '', r.gpu_pn || '', r.gpu_sn || '',
        r.board_sn || '', r.board_manufacturer || '', r.asic_pn || '', r.cpu_sn || '',
        r.silicon_rev || '', r.board_rev || '', r.gpu_rev || '', r.model_name || '',
        r.cpu_power_rating || '',
        r.heatsink_pn || '', r.heatsink_sn || '', r.heatsink_manufacturer || '',
        r.visual_inspection || '', r.boot_to_os || '', r.gpu_detected || '',
        r.f_audit_enablement || '', r.f_audit_value || '', r.agfhc_lvl3 || '',
        r.rocc_rush_test || '', r.hbm_test || '', r.transfer_bench || '',
        r.ifwi_version || '', r.rm_version || '',
      ]);

      const aoa = [sectionRow, colRow, ...dataRows];
      const ws = XLSX.utils.aoa_to_sheet(aoa);

      // Merge section header cells
      ws['!merges'] = [
        { s: { r: 0, c: 3 },  e: { r: 0, c: 15 } }, // GPU Information      cols 3-15  (13: Project→CPU Power Rating)
        { s: { r: 0, c: 16 }, e: { r: 0, c: 18 } }, // Component/Rework     cols 16-18 (3)
        { s: { r: 0, c: 19 }, e: { r: 0, c: 27 } }, // Testing              cols 19-27 (9)
        { s: { r: 0, c: 28 }, e: { r: 0, c: 29 } }, // Firmware Details     cols 28-29 (2)
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'GPU Builds');
      XLSX.writeFile(wb, `gpu_builds_${new Date().toISOString().slice(0,10)}.xlsx`);
    } catch (err) { console.error(err); alert('Export failed.'); }
    finally { setGpuExporting(false); }
  };

  // Load initial data for dropdowns
  useEffect(() => {
    loadDropdownData();
  }, []);

  const loadDropdownData = async () => {
    try {
      // Fetch all builds to extract unique System P/N and Build Technician values
      const builds = await api.getAllBuilds();

      // Extract unique System P/N values
      const uniqueSystemPNs = [...new Set(
        builds
          .map(build => build.system_pn)
          .filter(pn => pn && pn.trim() !== '')
      )].sort();

      // Convert to options format
      const systemPNOpts = uniqueSystemPNs.map(pn => ({
        value: pn,
        label: pn
      }));

      setSystemPNOptions(systemPNOpts);

      // Extract unique Build Technician values
      const uniqueTechnicians = [...new Set(
        builds
          .map(build => build.build_engineer)
          .filter(tech => tech && tech.trim() !== '')
      )].sort();

      // Convert to options format
      const techOpts = uniqueTechnicians.map(tech => ({
        value: tech,
        label: tech
      }));

      setBuildTechnicianOptions(techOpts);
    } catch (error) {
      console.error('Error loading dropdown options:', error);
    }
  };

  return (
    <div className="search-records-container">
      {/* Page Header */}
      <div className="search-page-header">
        <h1>
          <FontAwesomeIcon icon={faSearch} /> Search Records
        </h1>
        <button
          className="btn-secondary"
          onClick={() => { setGpuMode(v => !v); setGpuResults([]); setMessages([]); }}
          style={{ background: gpuMode ? '#1a73e8' : undefined, color: gpuMode ? '#fff' : undefined }}
        >
          {gpuMode ? 'Server Information' : 'GPU Information'}
        </button>
      </div>

      {/* Messages */}
      <MessageDisplay messages={messages} onDismiss={setMessages} />

      {/* GPU Search Section */}
      {gpuMode && (
        <GPUSearchSection
          onSearch={handleGpuSearch}
          loading={gpuLoading}
          results={gpuResults}
          exporting={gpuExporting}
          onExport={handleGpuExport}
        />
      )}

      {/* Search Filters */}
      {!gpuMode && (
        <>
          <SearchFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            onSearch={handleSearch}
            onReset={() => {
              window.localStorage.removeItem(LOCAL_STORAGE_KEY);
              resetFilters();
            }}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            loading={loading}
            systemPNOptions={systemPNOptions}
            buildTechnicianOptions={buildTechnicianOptions}
            searchResults={searchResults}
            changeGearOptions={changeGearOptions}
          />
          {searched && (
            <SearchResults
              results={searchResults}
              loading={loading}
            />
          )}
        </>
      )}
    </div>
  );
};

export default SearchRecords;