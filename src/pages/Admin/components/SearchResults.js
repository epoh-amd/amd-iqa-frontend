// frontend/src/pages/SearchRecords/components/SearchResults.js

import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

import TableHeader from './table/TableHeader';
import TableBody from './table/TableBody';
import api from '../../../services/api';

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

const SearchResults = ({ results, loading, editedRows, setEditedRows}) => {
  const [projectOptions, setProjectOptions] = useState([]);
  useEffect(() => {
    //console.log("useEffect triggered");
    const loadProjects = async () => {
      try {
        const data = await api.getProjects(); // NO chassis_sn
        //console.log('API returned:', data);
        setProjectOptions(data);
      } catch (err) {
        console.error(err);
      }
    };
  
    loadProjects();
  }, []);

  const [tableData, setTableData] = useState(results);
  //const [editedRows, setEditedRows] = useState({});

  useEffect(() => {
    setTableData(results);
  }, [results]);

  const onFieldChange = (chassis_sn, field, value) => {
    setTableData(prev =>
      prev.map(row => {
        if (row.chassis_sn !== chassis_sn) return row;
  
        let updatedRow = {
          ...row,
          [field]: value
        };
  
        // ✅ Handle DIMM QTY logic
        if (field === 'dimm_qty') {
          const qty = parseInt(value) || 0;
          let dimms = row.dimmSNs || [];
  
          if (dimms.length > qty) {
            dimms = dimms.slice(0, qty);
          } else if (dimms.length < qty) {
            dimms = [
              ...dimms,
              ...Array(qty - dimms.length).fill('')
            ];
          }
  
          updatedRow.dimmSNs = dimms;
          updatedRow.dimm_sns = dimms.join(','); // keep DB format synced
          updatedRow.dimm_qty = qty;
        }
  
        // ✅ Handle individual SN updates
        if (field === 'dimmSNs') {
          updatedRow.dimmSNs = value;
          updatedRow.dimm_sns = value.join(',');
        }
  
        return updatedRow;
      })
    );
  
    // keep editedRows in sync
    setEditedRows(prev => ({
      ...prev,
      [chassis_sn]: {
        ...prev[chassis_sn],
        [field]: value
      }
    }));
  };



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
    misc: false,
    rma: false
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
              results={tableData}
              projectOptions={projectOptions}
              collapsedSections={collapsedSections}
              hasCollapsedSections={hasCollapsedSections}
              getCpuQty={getCpuQty}
              showCpuDetails={showCpuDetails}
              showDimmDetails={showDimmDetails}
              loadTestDetails={loadTestDetails}
              loadFailureDetails={loadFailureDetails}
              loadReworkHistory={loadReworkHistory}
              getStatusBadgeClass={getStatusBadgeClass}
              onFieldChange={onFieldChange}
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