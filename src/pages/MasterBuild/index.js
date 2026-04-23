// frontend/src/pages/MasterBuild/index.js

import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFilter,
  faTable,
  faSave,
  faSpinner,
  faArrowLeft,
  faUpload,
  faDownload
} from '@fortawesome/free-solid-svg-icons';

import FilterSection from './components/FilterSection';
import BuildSelectionList from './components/BuildSelectionList';
import TableEntryView from './components/TableEntryView';
import MessageDisplay from './components/MessageDisplay';

import { useMasterBuildState } from './hooks/useMasterBuildState';
import { useFiltering } from './hooks/useFiltering';
import { useSaveHandlers } from './hooks/useSaveHandlers';

import api from '../../services/api';
import { logger } from '../../utils/logger';
import '../../assets/css/masterBuild.css';

const MasterBuild = () => {
  // State Management
  const {
    builds,
    setBuilds,
    selectedBuilds, // This is an array of chassis serial numbers (strings)
    setSelectedBuilds,
    masterData,
    setMasterData,
    loading,
    setLoading,
    messages,
    setMessages
  } = useMasterBuildState();

  const {
    filters,
    setFilters,
    filteredBuilds,
    systemPNOptions,
    buildTechnicianOptions,
    handleFilterChange,
    resetFilters
  } = useFiltering(builds);

  // UI State
  const [showFilters, setShowFilters] = useState(true);
  const [entryMode, setEntryMode] = useState(false);

  // Offline Upload State
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState(null);
  const [showOfflineUpload, setShowOfflineUpload] = useState(false);

  // Get selected build objects (convert chassis SNs to build objects)
  const getSelectedBuildsData = () => {
    console.log('getSelectedBuildsData called');
    console.log('selectedBuilds (chassis SNs):', selectedBuilds);
    console.log('builds (all builds):', builds);

    const selectedBuildObjects = builds.filter(build => selectedBuilds.includes(build.chassis_sn));
    console.log('selectedBuildObjects:', selectedBuildObjects);

    return selectedBuildObjects;
  };

  // Get the actual build objects for the save handler
  const selectedBuildObjects = getSelectedBuildsData();
  console.log('selectedBuildObjects for save handler:', selectedBuildObjects);

  const {
    saving,
    saveMasterData,
    saveMasterDataAndContinue
  } = useSaveHandlers(masterData, setMasterData, selectedBuildObjects, setMessages);

  // Load builds on mount
  useEffect(() => {
    loadBuilds();
    console.log("BUILDS STATE UPDATED:", builds);
  }, []);


  // Clear selections when filters change (Option 1: Clear on filter change)
  // Create a stable string representation of filter values to detect actual changes
  const filterValuesString = JSON.stringify(filters);

  useEffect(() => {
    // Skip on initial mount (when no filters have been set yet)
    const isInitialMount = filterValuesString === JSON.stringify({
      dateFrom: '',
      dateTo: '',
      chassisSN: '',
      location: '',
      projectName: '',
      systemPN: [],
      platformType: '',
      bmcName: '',
      mbSN: '',
      cpuSocket: '',
      cpuVendor: '',
      buildTechnician: [],
      smsOrder: '',
      buildName: '',
      fpyStatus: '',
      canContinue: '',
      masterStatus: ''
    });

    // Only clear if:
    // 1. NOT initial mount (filters have changed)
    // 2. NOT in entry mode (don't clear while user is working)
    // 3. Selections exist (optimization)
    if (!isInitialMount && !entryMode && selectedBuilds.length > 0) {
      console.log('Filter changed, clearing selections. Previous selections:', selectedBuilds);
      setSelectedBuilds([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterValuesString]); // ONLY watch filter values, NOT entryMode

  const loadBuilds = async () => {
    setLoading(true);
    try {
      const response = await api.getAllBuilds();
      console.log('Loaded builds from API:', response);
      setBuilds(response);
    } catch (error) {
      logger.error('Error loading builds:', error);
      setMessages([{
        type: 'error',
        text: 'Failed to load builds. Please try again.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Handle build selection (works with chassis serial numbers)
  const handleBuildSelection = (chassisSN, isSelected) => {
    logger.log('handleBuildSelection:', { chassisSN, isSelected });
    if (isSelected) {
      setSelectedBuilds([...selectedBuilds, chassisSN]);
    } else {
      setSelectedBuilds(selectedBuilds.filter(sn => sn !== chassisSN));
    }
  };

  const handleSelectAll = (isSelected) => {
    if (isSelected) {
      const chassisSnList = filteredBuilds.map(build => build.chassis_sn);
      console.log('Select all - chassis SNs:', chassisSnList);
      setSelectedBuilds(chassisSnList);
    } else {
      setSelectedBuilds([]);
    }
  };

  // Start entering details
  const startEnteringDetails = () => {
    if (selectedBuilds.length === 0) {
      setMessages([{
        type: 'warning',
        text: 'Please select at least one build to enter details.'
      }]);
      return;
    }
    console.log('Starting entry mode with selected builds:', selectedBuilds);
    setEntryMode(true);
    setMessages([]);
  };

  // Exit entry mode
  const exitEntryMode = () => {
    setEntryMode(false);
    // Optionally clear selections
    // setSelectedBuilds([]);
    // setMasterData({});
  };

  // UPDATED: Handle removal of builds during entry mode
  const handleUpdateSelectedBuilds = (updatedChassisSnList) => {
    console.log('handleUpdateSelectedBuilds called with chassis SNs:', updatedChassisSnList);
    setSelectedBuilds(updatedChassisSnList);
  };

  // UPDATED: Alternative handler that accepts build objects and converts to chassis SNs
  const handleSetSelectedBuilds = (updatedBuilds) => {
    console.log('handleSetSelectedBuilds called with builds:', updatedBuilds);
    const chassisSnList = updatedBuilds.map(build => build.chassis_sn);
    console.log('Converted to chassis SNs:', chassisSnList);
    setSelectedBuilds(chassisSnList);
  };

  // Offline Upload Handlers
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    setUploadResults(null);
    setMessages([]);

    try {
      const result = await api.uploadOfflineBuilds(file);

      if (result.success) {
        setUploadResults(result.results);
        setMessages([{
          type: 'success',
          text: `Upload successful! ${result.results.successful} builds processed, ${result.results.failed} failed.`
        }]);

        // Close upload panel and refresh the builds list
        setShowOfflineUpload(false);
        loadBuilds();
      } else {
        setMessages([{
          type: 'error',
          text: result.message || 'Upload failed'
        }]);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setMessages([{
        type: 'error',
        text: 'Network error during upload. Please try again.'
      }]);
    } finally {
      setUploading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const triggerFileUpload = () => {
    document.getElementById('offline-upload-input').click();
  };

  const downloadTemplate = () => {
    window.open(api.getOfflineTemplateUrl(), '_blank');
  };

  return (
    <div className="master-build-container">
      {/* Page Header */}
      <div className="master-page-header">
        <h1>Build Allocation Management</h1>
        <div className="header-actions">
          {entryMode ? (
            <button className="btn-secondary" onClick={exitEntryMode}>
              <FontAwesomeIcon icon={faArrowLeft} /> Back to Selection
            </button>
          ) : (
            <button
              className="btn-offline-upload"
              onClick={() => setShowOfflineUpload(!showOfflineUpload)}
              title="Upload builds from offline template"
            >
              <div className="offline-upload-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span>Offline Upload</span>
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <MessageDisplay messages={messages} onDismiss={setMessages} />

      {/* Offline Upload Panel */}
      {showOfflineUpload && !entryMode && (
        <div className="offline-upload-panel">
          <div className="panel-header">
            <div className="panel-title">
              <div className="panel-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M16 13H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M16 17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M10 9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3>Offline Build Entry Upload</h3>
            </div>
            <button
              className="panel-close"
              onClick={() => setShowOfflineUpload(false)}
              title="Close panel"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          <div className="panel-content">
            <div className="upload-description">
              <p>
                Upload builds that were recorded offline using the Excel template. This feature is designed for situations when the web system is unavailable.
              </p>
              <div className="upload-steps">
                <div className="step">
                  <div className="step-number">1</div>
                  <div className="step-content">
                    <strong>Download Template</strong>
                    <span>Get the standardized Excel template with validation rules</span>
                  </div>
                </div>
                <div className="step">
                  <div className="step-number">2</div>
                  <div className="step-content">
                    <strong>Fill Data</strong>
                    <span>Complete build information offline, one row per build</span>
                  </div>
                </div>
                <div className="step">
                  <div className="step-number">3</div>
                  <div className="step-content">
                    <strong>Upload File</strong>
                    <span>Upload the completed Excel file to process all builds</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="upload-actions">
              <div className="action-group">
                <button
                  className="btn-template-download"
                  onClick={downloadTemplate}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Download Template
                </button>

                <div className="upload-divider">
                  <span>or</span>
                </div>

                <button
                  className="btn-file-upload"
                  onClick={triggerFileUpload}
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} spin />
                      Processing Upload...
                    </>
                  ) : (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M17 8L12 3L7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M12 3V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Upload Excel File
                    </>
                  )}
                </button>
                <input
                  id="offline-upload-input"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              </div>

              <div className="upload-info">
                <div className="info-item">
                  <strong>Supported formats:</strong> Excel (.xlsx, .xls) and CSV files
                </div>
                <div className="info-item">
                  <strong>File size limit:</strong> Maximum 10MB per file
                </div>
                <div className="info-item">
                  <strong>Data validation:</strong> All builds are validated before saving to database
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Results */}
      {uploadResults && (
        <div className="upload-results-section">
          <h3>Upload Results</h3>
          <div className="upload-summary">
            <div className="result-stats">
              <span className="stat successful">{uploadResults.successful} Successful</span>
              <span className="stat failed">{uploadResults.failed} Failed</span>
              <span className="stat total">{uploadResults.total} Total</span>
            </div>
          </div>

          {uploadResults.successfulBuilds && uploadResults.successfulBuilds.length > 0 && (
            <div className="successful-builds">
              <h4>Successfully Processed:</h4>
              <div className="build-list">
                {uploadResults.successfulBuilds.map((chassisSN, index) => (
                  <span key={index} className="build-tag success">{chassisSN}</span>
                ))}
              </div>
            </div>
          )}

          {uploadResults.errors && uploadResults.errors.length > 0 && (
            <div className="failed-builds">
              <h4>Failed to Process:</h4>
              <div className="error-list">
                {uploadResults.errors.map((error, index) => (
                  <div key={index} className="error-item">
                    <span className="build-tag error">{error.chassisSN}</span>
                    <span className="error-message">Row {error.row}: {error.error}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            className="btn-secondary"
            onClick={() => setUploadResults(null)}
            style={{ marginTop: '16px' }}
          >
            Dismiss Results
          </button>
        </div>
      )}

      {!entryMode ? (
        <>
          {/* Filter Section */}
          <FilterSection
            filters={filters}
            onFilterChange={handleFilterChange}
            onReset={resetFilters}
            isCollapsed={!showFilters}
            onToggle={() => setShowFilters(!showFilters)}
            systemPNOptions={systemPNOptions}
            buildTechnicianOptions={buildTechnicianOptions}
          />
         
          {/* Build Selection List */}
          <BuildSelectionList
            builds={filteredBuilds}
            selectedBuilds={selectedBuilds} // Array of chassis SNs
            onBuildSelect={handleBuildSelection}
            onSelectAll={handleSelectAll}
            onStartEntry={startEnteringDetails}
            loading={loading}
          />
        </>
      ) : (
        /* Table Entry View - CORRECTED: Pass build objects, not chassis SNs */
        <TableEntryView
          selectedBuilds={selectedBuildObjects}
          masterData={masterData}
          setMasterData={setMasterData}
          onSave={saveMasterData}
          onSaveAndContinue={saveMasterDataAndContinue} // Add this
          saving={saving}
          onUpdateSelectedBuilds={handleUpdateSelectedBuilds}
          setSelectedBuilds={handleSetSelectedBuilds}
        />
      )}
    </div>
  );
};

export default MasterBuild;