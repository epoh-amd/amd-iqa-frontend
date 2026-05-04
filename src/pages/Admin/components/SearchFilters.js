// frontend/src/pages/SearchRecords/components/SearchFilters.js

import React, { useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFilter,
  faChevronDown,
  faChevronUp,
  faRotateLeft,
  faSearch,
  faSpinner,
  faFileExcel
} from '@fortawesome/free-solid-svg-icons';
import MultiSelectDropdown from '../../../components/common/MultiSelectDropdown';
import '../../../components/common/MultiSelectDropdown.css';
import { exportMasterBuildsToExcel } from '../../../utils/masterBuildExport';
import api from '../../../services/api';


const LOCAL_STORAGE_KEY = 'searchFilters';

const SearchFilters = ({
  filters,
  onFilterChange,
  onSearch,
  onReset,
  showFilters,
  setShowFilters,
  loading,
  systemPNOptions = [],
  buildTechnicianOptions = [],
  searchResults = [],
  onSave,
  projectOptions = [],
  onAddProject
}) => {
  const [showAdvanced, setShowAdvanced] = React.useState(false);
  const [exporting, setExporting] = React.useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = React.useState(false);
  const [newProject, setNewProject] = React.useState('');
  const [showProjectModal, setShowProjectModal] = React.useState(false);
  const [projectMessage, setProjectMessage] = React.useState(null);
  // Clear localStorage when reset is clicked (now handled in parent)
  const handleReset = () => {
    onReset();
    setShowAdvanced(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch();
  };

  const confirmSave = () => {
    if (onSave) {
      onSave();   // 🔥 CALL REAL SAVE FUNCTION
    }

    setShowSaveConfirm(false);
  };

  const cancelSave = () => {
    setShowSaveConfirm(false);
  };

  const handleExport = async () => {
    if (searchResults.length === 0) {
      alert('No records to export. Please perform a search first.');
      return;
    }

    setExporting(true);
    try {
      await exportMasterBuildsToExcel(searchResults);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    
    <div className="search-filter-section">
      {projectMessage && (
  <div className={`project-toast ${projectMessage.type}`}>
    {projectMessage.text}
  </div>
)}
      <div className="filter-header">
        <h3>
          <FontAwesomeIcon icon={faFilter} /> Search Filters
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
        <form onSubmit={handleSubmit}>
          {/* BASIC FILTERS */}
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
              <select
                value={filters.location}
                onChange={(e) => onFilterChange('location', e.target.value)}
              >
                <option value="">All Locations</option>
                <option value="Penang">Penang</option>
                <option value="Austin">Austin</option>
              </select>
            </div>
            {/* 4. Project Name */}
            <div className="filter-group">
              <label>Project Name</label>
              <input
                type="text"
                placeholder="Enter Project Name"
                value={filters.projectName}
                onChange={(e) => onFilterChange('projectName', e.target.value)}
              />
            </div>
            {/* 5. Platform Type */}
            <div className="filter-group">
              <label>Platform Type</label>
              <input
                type="text"
                placeholder="Enter Platform Type"
                value={filters.platformType}
                onChange={(e) => onFilterChange('platformType', e.target.value)}
              />
            </div>
            {/* 6. System P/N */}
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
            {/* 7. Chassis S/N */}
            <div className="filter-group">
              <label>Chassis S/N</label>
              <input
                type="text"
                placeholder="Enter Chassis S/N"
                value={filters.chassisSN}
                onChange={(e) => onFilterChange('chassisSN', e.target.value)}
              />
            </div>
            {/* 8. CPU Vendor */}
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
            {/* 9. Status */}
            <div className="filter-group">
              <label>Status</label>
              <select
                value={filters.masterStatus}
                onChange={(e) => onFilterChange('masterStatus', e.target.value)}
              >
                <option value="">All Status (excludes Delivered & Incomplete)</option>
                <option value="Build Completed">Build Completed</option>
                <option value="Missing Information">Missing Information</option>
                <option value="Incomplete">Incomplete</option>
                <option value="Need Paperwork">Need Paperwork</option>
                <option value="Ready for Pick up">Ready for Pick up</option>
                <option value="Need CG Update">Need CG Update</option>
                <option value="Delivered Need CG Update">Delivered Need CG Update</option>
                <option value="Delivered">Delivered</option>
                <option value="Pending Rework">Pending Rework</option>
                <option value="Sent for Rework">Sent for Rework</option>
                <option value="Back from Rework">Back from Rework</option>
                <option value="Reclaimed">Reclaimed</option>
                <option value="Bad">Bad</option>
              </select>
            </div>
            {/* 10. Failure Category */}
            <div className="filter-group">
              <label>Failure Category</label>
              <select
                value={filters.failureCategory}
                onChange={(e) => onFilterChange('failureCategory', e.target.value)}
              >
                <option value="">All Categories</option>
                <option value="Mechanical Defect">Mechanical Defect</option>
                <option value="Polarity Reversed">Polarity Reversed</option>
                <option value="Missing Part">Missing Part</option>
                <option value="SN Setting Defect">SN Setting Defect</option>
                <option value="Functionality Defect">Functionality Defect</option>
              </select>
            </div>
            {/* 11. Failure Mode */}
            <div className="filter-group">
              <label>Failure Mode</label>
              <select
                value={filters.failureMode}
                onChange={(e) => onFilterChange('failureMode', e.target.value)}
              >
                <option value="">All Failure Modes</option>
                <option value="CPU socket bent pins">CPU socket bent pins</option>
                <option value="CPU socket damage">CPU socket damage</option>
                <option value="CPU socket contamination">CPU socket contamination</option>
                <option value="DIMM connector damage">DIMM connector damage</option>
                <option value="Heatsink damage">Heatsink damage</option>
                <option value="Other component damage">Other component damage</option>
                <option value="Connector bent pin">Connector bent pin</option>
                <option value="Rework failure">Rework failure</option>
                <option value="Part misorientation">Part misorientation</option>
                <option value="Missing SMT component">Missing SMT component</option>
                <option value="Missing accessory part">Missing accessory part</option>
                <option value="Mismatch product label info">Mismatch product label info</option>
                <option value="Duplicate product SN">Duplicate product SN</option>
                <option value="No boot">No boot</option>
                <option value="No power">No power</option>
                <option value="Sensor failure">Sensor failure</option>
                <option value="BMC failure">BMC failure</option>
                <option value="No display">No display</option>
                <option value="USB failure">USB failure</option>
                <option value="SSD failure">SSD failure</option>
                <option value="Other functionality defect">Other functionality defect</option>
              </select>
            </div>
          </div>

          {/* ADVANCED FILTERS TOGGLE */}
          <div style={{ margin: '15px 0' }}>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              style={{
                background: 'none',
                border: 'none',
                color: '#007bff',
                padding: '4px 0',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '500',
                textDecoration: 'underline'
              }}
            >
              <FontAwesomeIcon icon={showAdvanced ? faChevronUp : faChevronDown} />
              {' '}{showAdvanced ? 'Hide' : 'Show'} Advanced Filters
            </button>
          </div>

          {/* ADVANCED FILTERS */}
          {showAdvanced && (
            <div className="filter-content">
              {/* 1. Build Technician */}
              <div className="filter-group">
                <label>Build Technician</label>
                <MultiSelectDropdown
                  options={buildTechnicianOptions}
                  selectedValues={filters.buildEngineer}
                  onSelectionChange={(selectedValues) => onFilterChange('buildEngineer', selectedValues)}
                  placeholder="Select Build Technician..."
                  className="build-technician-dropdown"
                />
              </div>
              {/* 2. SMS Order */}
              <div className="filter-group">
                <label>SMS Order</label>
                <input
                  type="text"
                  placeholder="Enter SMS Order"
                  value={filters.smsOrder}
                  onChange={(e) => onFilterChange('smsOrder', e.target.value)}
                />
              </div>
              {/* 3. Build Name */}
              <div className="filter-group">
                <label>Build Name</label>
                <input
                  type="text"
                  placeholder="Enter Build Name"
                  value={filters.buildName}
                  onChange={(e) => onFilterChange('buildName', e.target.value)}
                />
              </div>
              {/* 4. BMC Name */}
              <div className="filter-group">
                <label>BMC Name</label>
                <input
                  type="text"
                  placeholder="Enter BMC Name"
                  value={filters.bmcName}
                  onChange={(e) => onFilterChange('bmcName', e.target.value)}
                />
              </div>
              {/* 5. FPY Status */}
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
            </div>
          )}

          {/* ACTION BUTTONS */}
          <div className="filter-actions">

            {/* Reset and Search buttons on the right */}
            <div className="filter-actions-right">
              {/* NEW SAVE BUTTON */}
              <button
                type="button"
                className="search-filter-actions-btn search-filter-save-btn"
                onClick={() => setShowSaveConfirm(true)}
              >
                Save
              </button>

              <button
                type="button"
                className="search-filter-actions-btn search-filter-reset-btn"
                onClick={handleReset}
              >
                <FontAwesomeIcon icon={faRotateLeft} /> Reset Filters
              </button>
              <button
                type="submit"
                className="search-filter-actions-btn search-filter-search-btn"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin />
                    Searching...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faSearch} />
                    Search
                  </>
                )}
              </button>
              <button
                type="button"
                className="search-filter-actions-btn"
                onClick={() => setShowProjectModal(true)}
              >
                + Add Project
              </button>
              {showProjectModal && (
                <div className="modal-overlay">
                  <div className="modal-box">
                    <h4>Project Management</h4>

                    {/* Existing Projects List */}
                    <div style={{ maxHeight: '150px', overflowY: 'auto', marginBottom: '10px' }}>
                      {projectOptions.length === 0 ? (
                        <p>No projects found</p>
                      ) : (
                        <ul>
                          {projectOptions.map((proj, idx) => (
                            <li key={idx}>{proj}</li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Add New Project */}
                    <input
                      type="text"
                      placeholder="Enter new project name"
                      value={newProject}
                      onChange={(e) => setNewProject(e.target.value)}
                      style={{ width: '100%', marginBottom: '10px' }}
                    />

                    <div className="modal-actions">
                      <button
                        className="btn cancel"
                        onClick={() => setShowProjectModal(false)}
                      >
                        Close
                      </button>

                      <button
                        className="btn confirm"
                        onClick={async () => {
                          if (!newProject.trim()) return;
                        
                          const result = await onAddProject(newProject);
                        
                          if (result.success) {
                            setProjectMessage({ type: 'success', text: result.message });
                        
                            setNewProject('');
                            setShowProjectModal(false);
                        
                            // ✅ auto hide after 2s
                            setTimeout(() => setProjectMessage(null), 2000);
                          } else {
                            setProjectMessage({ type: 'error', text: result.message });
                            setShowProjectModal(false);
                            setTimeout(() => setProjectMessage(null), 2000);
                          }
                        }}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {showSaveConfirm && (
              <div className="modal-overlay">
                <div className="modal-box">
                  <h4>Confirm Save</h4>
                  <p>Are you sure you want to save these filters?</p>

                  <div className="modal-actions">
                    <button className="btn cancel" onClick={cancelSave}>
                      Cancel
                    </button>
                    <button className="btn confirm" onClick={confirmSave}>
                      Yes, Save
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>


        </form>
      )}
    </div>
  );
};

export default SearchFilters;
