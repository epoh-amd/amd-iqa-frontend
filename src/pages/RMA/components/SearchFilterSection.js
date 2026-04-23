// frontend/src/pages/EditBuildData/components/SearchFilterSection.js

import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faTimes, faPlus } from '@fortawesome/free-solid-svg-icons';

const SearchFilterSection = ({ searchFilters, setSearchFilters, onSearch, loading }) => {
  const [bmcNameInput, setBmcNameInput] = useState('');
  const [chassisSNInput, setChassisSNInput] = useState('');

  // Add BMC Name to filter
  const addBmcName = () => {
    const trimmed = bmcNameInput.trim();
    if (trimmed && !searchFilters.bmcNames.includes(trimmed)) {
      setSearchFilters({
        ...searchFilters,
        bmcNames: [...searchFilters.bmcNames, trimmed]
      });
      setBmcNameInput('');
    }
  };

  // Remove BMC Name from filter
  const removeBmcName = (name) => {
    setSearchFilters({
      ...searchFilters,
      bmcNames: searchFilters.bmcNames.filter(n => n !== name)
    });
  };

  // Add Chassis S/N to filter
  const addChassisSN = () => {
    const trimmed = chassisSNInput.trim();
    if (trimmed && !searchFilters.chassisSNs.includes(trimmed)) {
      setSearchFilters({
        ...searchFilters,
        chassisSNs: [...searchFilters.chassisSNs, trimmed]
      });
      setChassisSNInput('');
    }
  };

  // Remove Chassis S/N from filter
  const removeChassisSN = (sn) => {
    setSearchFilters({
      ...searchFilters,
      chassisSNs: searchFilters.chassisSNs.filter(s => s !== sn)
    });
  };

  // Handle Enter key press
  const handleBmcNameKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addBmcName();
    }
  };

  const handleChassisSNKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addChassisSN();
    }
  };

  // Execute search
  const handleSearch = () => {
    onSearch(searchFilters);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchFilters({
      bmcNames: [],
      chassisSNs: []
    });
    setBmcNameInput('');
    setChassisSNInput('');
  };

  return (
    <div className="search-filter-section">
      <div className="filter-header">
        <h2>Search Builds</h2>
      </div>

      <div className="filter-content">
        {/* BMC Name Filter */}
        <div className="filter-group">
          <label>BMC Name(s)</label>
          <div className="multi-input-group">
            <input
              type="text"
              value={bmcNameInput}
              onChange={(e) => setBmcNameInput(e.target.value)}
              onKeyPress={handleBmcNameKeyPress}
              placeholder="Enter BMC Name and press Enter or click Add"
              className="filter-input"
            />
            <button
              className="btn-add-filter"
              onClick={addBmcName}
              disabled={!bmcNameInput.trim()}
            >
              <FontAwesomeIcon icon={faPlus} /> Add
            </button>
          </div>

          {/* Display added BMC Names */}
          {searchFilters.bmcNames.length > 0 && (
            <div className="filter-tags">
              {searchFilters.bmcNames.map((name, index) => (
                <span key={index} className="filter-tag">
                  {name}
                  <button
                    className="remove-tag"
                    onClick={() => removeBmcName(name)}
                    aria-label="Remove"
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Chassis S/N Filter */}
        <div className="filter-group">
          <label>Chassis S/N(s)</label>
          <div className="multi-input-group">
            <input
              type="text"
              value={chassisSNInput}
              onChange={(e) => setChassisSNInput(e.target.value)}
              onKeyPress={handleChassisSNKeyPress}
              placeholder="Enter Chassis S/N and press Enter or click Add"
              className="filter-input"
            />
            <button
              className="btn-add-filter"
              onClick={addChassisSN}
              disabled={!chassisSNInput.trim()}
            >
              <FontAwesomeIcon icon={faPlus} /> Add
            </button>
          </div>

          {/* Display added Chassis S/Ns */}
          {searchFilters.chassisSNs.length > 0 && (
            <div className="filter-tags">
              {searchFilters.chassisSNs.map((sn, index) => (
                <span key={index} className="filter-tag">
                  {sn}
                  <button
                    className="remove-tag"
                    onClick={() => removeChassisSN(sn)}
                    aria-label="Remove"
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="filter-actions">
        <button
          className="btn-search"
          onClick={handleSearch}
          disabled={loading || (searchFilters.bmcNames.length === 0 && searchFilters.chassisSNs.length === 0)}
        >
          <FontAwesomeIcon icon={faSearch} /> Search Builds
        </button>
        <button
          className="btn-clear"
          onClick={clearAllFilters}
          disabled={loading || (searchFilters.bmcNames.length === 0 && searchFilters.chassisSNs.length === 0)}
        >
          Reset Filters
        </button>
      </div>
    </div>
  );
};

export default SearchFilterSection;
