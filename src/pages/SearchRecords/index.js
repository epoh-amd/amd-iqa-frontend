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
      </div>

      {/* Messages */}
      <MessageDisplay messages={messages} onDismiss={setMessages} />

      {/* Search Filters */}
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
      />

      {/* Search Results */}
      {searched && (
        <SearchResults
          results={searchResults}
          loading={loading}
        />
      )}
    </div>
  );
};

export default SearchRecords;