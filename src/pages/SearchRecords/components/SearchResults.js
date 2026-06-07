// frontend/src/pages/SearchRecords/components/SearchResults.js

import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

import TableHeader from './table/TableHeader';
import TableBody from './table/TableBody';

// Import modals
import CpuDetailsModal from '../modals/CpuDetailsModal';
import DimmDetailsModal from '../modals/DimmDetailsModal';
import ReworkHistoryModal from '../modals/ReworkHistoryModal';
import TestNotesModal from '../modals/TestNotesModal';
import ReworkPhotosModal from '../modals/ReworkPhotosModal';
import FailuresModal from '../modals/FailuresModal';

// Import hooks
import useModalHandlers from '../hooks/useModalHandlers';
import useTableUtils from '../hooks/useTableUtils';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || (process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL.replace('/api', '') : 'http://localhost:5000');

const SearchResults = ({ results, loading }) => {
  const [logFileMap, setLogFileMap] = useState({});

  useEffect(() => {
    if (!results || results.length === 0) return;
    const bmcNames = results.map(r => r.bmc_name).filter(Boolean);
    if (!bmcNames.length) return;
    fetch(`${BACKEND_URL}/api/log-files-exist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bmcNames })
    })
      .then(r => r.ok ? r.json() : {})
      .then(data => setLogFileMap(data))
      .catch(() => {});
  }, [results]);

  const [collapsedSections, setCollapsedSections] = useState({
    general: false,
    systemInfo: false,
    cpuInfo: false,
    componentInfo: false,
    testing: false,
    bkcDetails: false,
    qualityIndicator: false,
    teamLocation: false,
    buildInfo: false,
    misc: false
  });

  const {
    reworkModal,
    setReworkModal,
    notesModal,
    setNotesModal,
    failuresModal,
    setFailuresModal,
    reworkPhotosModal,
    setReworkPhotosModal,
    cpuModal,
    setCpuModal,
    dimmModal,
    setDimmModal,
    loadingRework,
    loadingPhotos,
    loadingFailures,
    loadReworkHistory,
    loadTestDetails,
    loadFailureDetails,
    showReworkPhotos
  } = useModalHandlers();

  const {
    hasCollapsedSections,
    getColumnCount,
    showCpuDetails,
    showDimmDetails,
    getCpuQty,
    getStatusBadgeClass
  } = useTableUtils(results, collapsedSections, setCpuModal, setDimmModal);

  // Toggle section collapse
  const toggleSection = (section) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (loading) {
    return (
      <div className="search-results-section">
        <div className="loading-overlay">
          <FontAwesomeIcon icon={faSpinner} spin className="loading-spinner" />
          <p>Searching records...</p>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="search-results-section">
        <div className="no-results">
          <p>No records found matching your search criteria.</p>
          <p>Try adjusting your filters and search again.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="search-results-section">
        <div className="results-header">
          <div className="results-info">
            <span>Found <strong>{results.length}</strong> record(s)</span>
          </div>
        </div>

        <div className="results-table-wrapper">
          <table className={`search-results-table ${hasCollapsedSections ? 'has-collapsed-sections' : ''}`}>
            <TableHeader 
              collapsedSections={collapsedSections}
              toggleSection={toggleSection}
              getColumnCount={getColumnCount}
            />
            <TableBody
              results={results}
              collapsedSections={collapsedSections}
              hasCollapsedSections={hasCollapsedSections}
              getCpuQty={getCpuQty}
              showCpuDetails={showCpuDetails}
              showDimmDetails={showDimmDetails}
              loadTestDetails={loadTestDetails}
              loadFailureDetails={loadFailureDetails}
              loadReworkHistory={loadReworkHistory}
              getStatusBadgeClass={getStatusBadgeClass}
              logFileMap={logFileMap}
            />
          </table>
        </div>
      </div>

      {/* All Modals */}
      <CpuDetailsModal 
        cpuModal={cpuModal}
        setCpuModal={setCpuModal}
      />

      <DimmDetailsModal 
        dimmModal={dimmModal}
        setDimmModal={setDimmModal}
      />

      <ReworkHistoryModal
        reworkModal={reworkModal}
        setReworkModal={setReworkModal}
        loadingRework={loadingRework}
        showReworkPhotos={showReworkPhotos}
      />

      <TestNotesModal
        notesModal={notesModal}
        setNotesModal={setNotesModal}
        loadingPhotos={loadingPhotos}
      />

      <ReworkPhotosModal
        reworkPhotosModal={reworkPhotosModal}
        setReworkPhotosModal={setReworkPhotosModal}
      />

      <FailuresModal
        failuresModal={failuresModal}
        setFailuresModal={setFailuresModal}
        loadingFailures={loadingFailures}
      />
    </>
  );
};

export default SearchResults;