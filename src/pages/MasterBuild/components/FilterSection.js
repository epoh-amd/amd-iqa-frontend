// frontend/src/pages/MasterBuild/components/FilterSection.js

import React, { useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter, faRotateLeft } from '@fortawesome/free-solid-svg-icons';
import MultiSelectDropdown from '../../../components/common/MultiSelectDropdown';
import '../../../components/common/MultiSelectDropdown.css';
import api from '../../../services/api';

const FilterSection = ({ filters, onFilterChange, onReset, isCollapsed, onToggle, systemPNOptions = [], buildTechnicianOptions = [] }) => {
  
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
  return (
    <div className="search-filter-section">
      <div className="filter-header" onClick={onToggle}>
        <h3>
          <FontAwesomeIcon icon={faFilter} /> Filters
        </h3>
      </div>
      
      {!isCollapsed && (
        <>
          <div className="filter-content">
            {/* 1. Date From */}
            <div className="filter-group">
              <label>Date From</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => onFilterChange('dateFrom', e.target.value)}
              />
            </div>

            {/* 2. Date To */}
            <div className="filter-group">
              <label>Date To</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => onFilterChange('dateTo', e.target.value)}
              />
            </div>

            {/* 3. Location */}
            <div className="filter-group">
              <label>Location</label>
              <div className="read-only-filter">
                {filters.location || 'Loading...'}
              </div>
            </div>

            {/* 4. Build Technician */}
            <div className="filter-group">
              <label>Build Technician</label>
              <MultiSelectDropdown
                options={buildTechnicianOptions}
                selectedValues={filters.buildTechnician}
                onSelectionChange={(selectedValues) => onFilterChange('buildTechnician', selectedValues)}
                placeholder="Select Build Technician..."
                className="build-technician-dropdown"
              />
            </div>

            {/* 5. Build Name */}
            <div className="filter-group">
              <label>Build Name</label>
              <input
                type="text"
                placeholder="Enter Build Name"
                value={filters.buildName}
                onChange={(e) => onFilterChange('buildName', e.target.value)}
              />
            </div>

            {/* 6. Project Name */}
            <div className="filter-group">
              <label>Project Name</label>
              <input
                type="text"
                placeholder="Enter Project Name"
                value={filters.projectName}
                onChange={(e) => onFilterChange('projectName', e.target.value)}
              />
            </div>

            {/* 7. Platform Type */}
            <div className="filter-group">
              <label>Platform Type</label>
              <input
                type="text"
                placeholder="Enter Platform Type"
                value={filters.platformType}
                onChange={(e) => onFilterChange('platformType', e.target.value)}
              />
            </div>

            {/* 8. System P/N */}
            <div className="filter-group">
              <label>System P/N</label>
              <MultiSelectDropdown
                options={systemPNOptions}
                selectedValues={filters.systemPN}
                onSelectionChange={(selectedValues) => onFilterChange('systemPN', selectedValues)}
                placeholder="Select System P/N..."
                className="system-pn-dropdown"
              />
            </div>

            {/* 9. Chassis S/N */}
            <div className="filter-group">
              <label>Chassis S/N</label>
              <input
                type="text"
                placeholder="Enter Chassis S/N"
                value={filters.chassisSN}
                onChange={(e) => onFilterChange('chassisSN', e.target.value)}
              />
            </div>

            {/* 10. BMC Name */}
            <div className="filter-group">
              <label>BMC Name</label>
              <input
                type="text"
                placeholder="Enter BMC Name"
                value={filters.bmcName}
                onChange={(e) => onFilterChange('bmcName', e.target.value)}
              />
            </div>

            {/* 11. MB S/N */}
            <div className="filter-group">
              <label>MB S/N</label>
              <input
                type="text"
                placeholder="Enter MB S/N"
                value={filters.mbSN}
                onChange={(e) => onFilterChange('mbSN', e.target.value)}
              />
            </div>

            {/* 12. CPU Socket */}
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

            {/* 13. CPU Vendor */}
            <div className="filter-group">
              <label>CPU Vendor</label>
              <select
                value={filters.cpuVendor}
                onChange={(e) => onFilterChange('cpuVendor', e.target.value)}
              >
                <option value="">All Vendors</option>
                <option value="Tyco">Tyco</option>
                <option value="Foxconn">Foxconn</option>
                <option value="Lotes">Lotes</option>
              </select>
            </div>

            {/* 14. SMS Order */}
            <div className="filter-group">
              <label>SMS Order</label>
              <input
                type="text"
                placeholder="Enter SMS Order"
                value={filters.smsOrder}
                onChange={(e) => onFilterChange('smsOrder', e.target.value)}
              />
            </div>

            {/* 15. FPY Status */}
            <div className="filter-group">
              <label>FPY Status</label>
              <select
                value={filters.fpyStatus}
                onChange={(e) => onFilterChange('fpyStatus', e.target.value)}
              >
                <option value="">All FPY</option>
                <option value="Pass">Pass</option>
                <option value="Fail">Fail</option>
              </select>
            </div>

            {/* 16. Rework */}
            <div className="filter-group">
              <label>Rework</label>
              <select
                value={filters.canContinue}
                onChange={(e) => onFilterChange('canContinue', e.target.value)}
              >
                <option value="">All</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>

            {/* 17. Status */}
            <div className="filter-group">
              <label>Status</label>
              <select
                value={filters.masterStatus}
                onChange={(e) => onFilterChange('masterStatus', e.target.value)}
              >
                <option value="">All Status (excludes Delivered & Incomplete)</option>
                <option value="Delivered">Delivered</option>
                <option value="Bad">Bad</option>
                <option value="Missing Information">Missing Information</option>
                <option value="Ready for Delivery">Ready for Delivery</option>
                <option value="Need Paperwork">Need Paperwork</option>
                <option value="Need CG Update">Need CG Update</option>
                <option value="Delivered - Need CG Update">Delivered - Need CG Update</option>
                <option value="Build Completed">Build Completed</option>
                <option value="Incomplete">Incomplete</option>
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