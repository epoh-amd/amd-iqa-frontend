// frontend/src/pages/ContinueBuild/components/FilterSection.js

import React, {useRef, useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter, faChevronDown, faChevronUp, faRotateLeft } from '@fortawesome/free-solid-svg-icons';
import api from '../../../services/api';

const FilterSection = ({ filters, onFilterChange, onReset, showFilters, setShowFilters }) => {
  
  // Auto-populate location from user profile
  useEffect(() => {
    const initializeUserLocation = async () => {
      try {
        const profileResponse = await api.getProfile();
        if (profileResponse.success && profileResponse.data) {
          const userData = profileResponse.data;
          
          // Map location code to display name
          const locationMapping = {
            'MY.PNG': 'Penang',
            'US.ATX': 'Austin'
          };
          
          const mappedLocation = locationMapping[userData.location] || userData.location || '';
          
          // Set location filter if we have a valid location
          if (mappedLocation) {
            onFilterChange('location', mappedLocation);
          }
        }
      } catch (error) {
        console.error('Failed to fetch user profile for location filter:', error);
      }
    };
    
    // Always initialize location to ensure it reflects current user profile
    initializeUserLocation();
  }, [filters.location, onFilterChange]);

  const [projects, setProjects] = useState([]);
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await api.getProjects();
        setProjects(data);
      } catch (error) {
        console.error("Failed to load projects:", error);
      }
    };
  
    fetchProjects();
  }, []);

  return (
    <div className="filter-section">
      <div className="filter-header">
        <h3>
          <FontAwesomeIcon icon={faFilter} /> Filters
        </h3>
        <button 
          className="filter-toggle"
          onClick={() => setShowFilters(!showFilters)}
        >
          {showFilters ? 'Hide' : 'Show'}
          <FontAwesomeIcon icon={showFilters ? faChevronUp : faChevronDown} />
        </button>
      </div>
      
      {showFilters && (
        <>
          <div className="filter-content">
            {/* Date Range */}
            <div className="filter-group">
              <label>Date From</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => onFilterChange('dateFrom', e.target.value)}
              />
            </div>
            
            <div className="filter-group">
              <label>Date To</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => onFilterChange('dateTo', e.target.value)}
              />
            </div>
            
            {/* Location */}
            <div className="filter-group">
              <label>Location</label>
              <div className="read-only-filter">
                {filters.location || 'Loading...'}
              </div>
            </div>
            
            {/* Project Name */}
            <div className="filter-group">
              <label>Project Name</label>
              <select
               value={filters.projectName}
               onChange={(e) => onFilterChange('projectName', e.target.value)}
             >
               <option value="">All Projects</option>
             
               {projects.map((project, index) => (
                 <option key={index} value={project}>
                   {project}
                 </option>
               ))}
                
              </select>
            </div>
            
            {/* System P/N */}
            <div className="filter-group">
              <label>System P/N</label>
              <input
                type="text"
                placeholder="Enter System P/N"
                value={filters.systemPN}
                onChange={(e) => onFilterChange('systemPN', e.target.value)}
              />
            </div>
            
            {/* Platform Type */}
            <div className="filter-group">
              <label>Platform Type</label>
              <input
                type="text"
                placeholder="Enter Platform Type"
                value={filters.platformType}
                onChange={(e) => onFilterChange('platformType', e.target.value)}
              />
            </div>
            
            {/* Chassis S/N */}
            <div className="filter-group">
              <label>Chassis S/N</label>
              <input
                type="text"
                placeholder="Enter Chassis S/N"
                value={filters.chassisSN}
                onChange={(e) => onFilterChange('chassisSN', e.target.value)}
              />
            </div>
            
            {/* BMC Name */}
            <div className="filter-group">
              <label>BMC Name</label>
              <input
                type="text"
                placeholder="Enter BMC Name"
                value={filters.bmcName}
                onChange={(e) => onFilterChange('bmcName', e.target.value)}
              />
            </div>
            
            {/* CPU Socket */}
            <div className="filter-group">
              <label>CPU Socket</label>
              <select
                value={filters.cpuSocket}
                onChange={(e) => onFilterChange('cpuSocket', e.target.value)}
              >
                <option value="">All Sockets</option>
                <option value="SP7">SP7</option>
                <option value="SP8">SP8</option>
              </select>
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

export default FilterSection;