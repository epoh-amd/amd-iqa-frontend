import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter, faChevronDown, faChevronUp, faRotateLeft } from '@fortawesome/free-solid-svg-icons';

const PROJECT_OPTIONS = ['MI350P', 'MI410P'];

const GPUFilterSection = ({ filters, onFilterChange, onReset, showFilters, setShowFilters }) => {
  return (
    <div className="filter-section">
      <div className="filter-header">
        <h3><FontAwesomeIcon icon={faFilter} /> Filters</h3>
        <button className="filter-toggle" onClick={() => setShowFilters(!showFilters)}>
          {showFilters ? 'Hide' : 'Show'}
          <FontAwesomeIcon icon={showFilters ? faChevronUp : faChevronDown} />
        </button>
      </div>

      {showFilters && (
        <>
          <div className="filter-content">
            <div className="filter-group">
              <label>Project Name</label>
              <select value={filters.projectName} onChange={e => onFilterChange('projectName', e.target.value)}>
                <option value="">All Projects</option>
                {PROJECT_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div className="filter-group">
              <label>PO</label>
              <input type="text" placeholder="Enter PO" value={filters.po}
                onChange={e => onFilterChange('po', e.target.value)} />
            </div>
            <div className="filter-group">
              <label>GPU P/N</label>
              <input type="text" placeholder="Enter GPU P/N" value={filters.gpuPN}
                onChange={e => onFilterChange('gpuPN', e.target.value)} />
            </div>
            <div className="filter-group">
              <label>GPU S/N</label>
              <input type="text" placeholder="Enter GPU S/N" value={filters.gpuSN}
                onChange={e => onFilterChange('gpuSN', e.target.value)} />
            </div>
            <div className="filter-group">
              <label>ASIC P/N</label>
              <input type="text" placeholder="Enter ASIC P/N" value={filters.asicPN}
                onChange={e => onFilterChange('asicPN', e.target.value)} />
            </div>
            <div className="filter-group">
              <label>CPU S/N</label>
              <input type="text" placeholder="Enter CPU S/N" value={filters.cpuSN}
                onChange={e => onFilterChange('cpuSN', e.target.value)} />
            </div>
          </div>

          <div className="filter-actions">
            <button className="btn-secondary" onClick={onReset}>
              <FontAwesomeIcon icon={faRotateLeft} /> Reset Filters
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default GPUFilterSection;
