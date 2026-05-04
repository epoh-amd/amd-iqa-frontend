// frontend/src/pages/MasterBuild/components/TableEntryView.js

import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faSpinner, faCopy, faCheck, faFileImport } from '@fortawesome/free-solid-svg-icons';
import * as XLSX from 'xlsx';

// Import modals
import CpuDetailsModal from './modals/CpuDetailsModal';
import DimmDetailsModal from './modals/DimmDetailsModal';
import ReworkHistoryModal from './modals/ReworkHistoryModal';
import TestNotesModal from './modals/TestNotesModal';
import ReworkPhotosModal from './modals/ReworkPhotosModal';
import FailuresModal from './modals/FailuresModal';

// Import table components
import TableHeader from './table/TableHeader';
import TableBody from './table/TableBody';
import TableActions from './table/TableActions';

// Import hooks
import useTableEntryState from '../hooks/useTableEntryState';
import useModalHandlers from '../hooks/useModalHandlers';
import useTableUtils from '../hooks/useTableUtils';

const TableEntryView = ({ 
  selectedBuilds, 
  masterData, 
  setMasterData, 
  onSave, 
  saving, 
  onUpdateSelectedBuilds,
  setSelectedBuilds,
  onSaveAndContinue
}) => {
  const [importMessage, setImportMessage] = useState('');
  const fileInputRef = useRef(null);
  
  const {
    selectedRows,
    setSelectedRows,
    sourceRow,
    setSourceRow,
    toggleRowSelection,
    bulkMatchMessage,
    setBulkMatchMessage,
    collapsedSections,
    toggleSection
  } = useTableEntryState();

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
    handleBulkMatch,
    showCpuDetails,
    showDimmDetails,
    getCpuQty,
    getStatusBadgeClass
  } = useTableUtils(selectedBuilds, selectedRows, sourceRow, masterData, setMasterData, setBulkMatchMessage, collapsedSections, setCpuModal, setDimmModal);

  // useEffect that initializes master data
  useEffect(() => {
    if (!masterData.builds) {
      const initialData = {};
      selectedBuilds.forEach(build => {
        // Helper function to format date for input[type="date"]
        const formatDateForInput = (dateString) => {
          if (!dateString) return '';
          
          // Handle different date formats
          let date;
          if (dateString instanceof Date) {
            date = dateString;
          } else if (typeof dateString === 'string') {
            // Handle MySQL datetime format (YYYY-MM-DD HH:MM:SS)
            if (dateString.includes(' ')) {
              date = new Date(dateString.split(' ')[0]);
            } else {
              date = new Date(dateString);
            }
          } else {
            return '';
          }
          
          // Check if date is valid
          if (isNaN(date.getTime())) {
            console.warn('Invalid date:', dateString);
            return '';
          }
          
          // Format as YYYY-MM-DD for input[type="date"]
          return date.toISOString().split('T')[0];
        };
        
        console.log('Processing build:', build.chassis_sn, {
          delivery_date_raw: build.delivery_date,
          delivery_date_formatted: formatDateForInput(build.delivery_date)
        });
        
        // Check if build has existing master data
        if (build.master_location || build.master_status) {
          initialData[build.chassis_sn] = {
            location: build.master_location || '',
            customLocation: build.custom_location || '',
            teamSecurity: build.team_security || '',
            department: build.department || '',
            // UPDATED: These fields are now read-only from builds table
            buildEngineer: build.build_engineer || '',
            buildName: build.build_name || '',
            jiraTicketNo: build.jira_ticket_no || '',
            changegearAssetId: build.changegear_asset_id || '',
            notes: build.master_notes || '',
            smsOrder: build.sms_order || '',
            costCenter: build.cost_center || '',
            capitalization: build.capitalization || '',
            deliveryDate: formatDateForInput(build.delivery_date), // Use formatted date
            masterStatus: build.master_status || '',
            isExisting: true // Flag to track existing records
          };
        } else {
          initialData[build.chassis_sn] = {
            location: '',
            customLocation: '',
            teamSecurity: '',
            department: '',
            // UPDATED: These fields are now read-only from builds table
            buildEngineer: build.build_engineer || '',
            buildName: '',
            jiraTicketNo: build.jira_ticket_no || '',
            changegearAssetId: '',
            notes: '',
            smsOrder: '',
            costCenter: '',
            capitalization: '',
            deliveryDate: '', // Empty for new builds
            masterStatus: '',
            isExisting: false
          };
        }
      });
      
      console.log('Master data initialized:', initialData);
      setMasterData({ builds: initialData });
    }
  }, [selectedBuilds, masterData.builds, setMasterData]);

  // Handle field change for specific build
  const handleFieldChange = (chassisSN, field, value) => {
    // UPDATED: Prevent editing of Build Engineer and Jira Ticket No fields
    if (field === 'buildEngineer' || field === 'jiraTicketNo') {
      console.warn(`${field} is read-only and cannot be edited in Master Build view`);
      return;
    }

    setMasterData(prev => ({
      ...prev,
      builds: {
        ...prev.builds,
        [chassisSN]: {
          ...prev.builds[chassisSN],
          [field]: value
        }
      }
    }));
  };

  // Handle remove build from bulk entry - FIXED VERSION
  const handleRemoveBuild = (chassisSN) => {
    const buildToRemove = selectedBuilds.find(build => build.chassis_sn === chassisSN);
    const buildName = buildToRemove ? (buildToRemove.bmc_name || buildToRemove.chassis_sn) : chassisSN;
    
    if (window.confirm(`Remove ${buildName} from bulk entry?`)) {
      console.log('Removing build:', chassisSN);
      
      // Filter out the removed build
      const updatedBuilds = selectedBuilds.filter(build => build.chassis_sn !== chassisSN);
      console.log('Updated builds:', updatedBuilds.map(b => b.chassis_sn));
      
      // Update parent component's selectedBuilds via callback
      if (setSelectedBuilds) {
        setSelectedBuilds(updatedBuilds);
        console.log('Called setSelectedBuilds with updated builds');
      }
      
      // Also update selectedBuilds array (chassis_sn list) if the callback exists
      if (onUpdateSelectedBuilds) {
        onUpdateSelectedBuilds(updatedBuilds.map(b => b.chassis_sn));
        console.log('Called onUpdateSelectedBuilds with chassis SNs');
      }
      
      // Remove from master data
      setMasterData(prev => {
        const newBuilds = { ...prev.builds };
        delete newBuilds[chassisSN];
        console.log('Removed from master data:', chassisSN);
        return {
          ...prev,
          builds: newBuilds,
          errors: prev.errors ? (() => {
            const newErrors = { ...prev.errors };
            delete newErrors[chassisSN];
            return newErrors;
          })() : {}
        };
      });
      
      // Clear from selected rows if it was removed
      if (selectedRows.includes(chassisSN)) {
        setSelectedRows(prev => prev.filter(sn => sn !== chassisSN));
        console.log('Removed from selected rows');
      }

      // Clear source row if it was removed
      if (sourceRow === chassisSN) {
        const remainingSelected = selectedRows.filter(sn => sn !== chassisSN);
        setSourceRow(remainingSelected.length > 0 ? remainingSelected[0] : null);
        console.log('Cleared/updated source row');
      }
      
      // Show success message
      setImportMessage(`Successfully removed ${buildName} from bulk entry`);
      setTimeout(() => setImportMessage(''), 3000);
    }
  };

  // Handle Import Changegear Asset ID
  const handleImportCGAssetId = () => {
    fileInputRef.current.click();
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Clear the input value to allow re-selecting the same file
    event.target.value = '';

    try {
      const data = await readExcelFile(file);
      if (!data || data.length === 0) {
        setImportMessage('No data found in the Excel file');
        setTimeout(() => setImportMessage(''), 3000);
        return;
      }

      // Find BMC Name and Changegear Asset ID columns with flexible matching
      const headers = Object.keys(data[0]);
      
      // Helper function to normalize header names
      const normalizeHeader = (header) => {
        return header.toLowerCase().replace(/[\s_-]/g, '').trim();
      };
      
      // Find BMC Name column - can be "BMC Name", "Name", "System Name", etc.
      const bmcNameColumn = headers.find(header => {
        const normalized = normalizeHeader(header);
        return normalized.includes('bmc') || 
               normalized.includes('name') || 
               normalized.includes('system') ||
               normalized.includes('hostname');
      });

      // Find Changegear Asset ID column
      const cgAssetIdColumn = headers.find(header => {
        const normalized = normalizeHeader(header);
        return normalized.includes('changegear') || 
               normalized.includes('asset') ||
               normalized.includes('cg') ||
               normalized.includes('id');
      });

      if (!bmcNameColumn || !cgAssetIdColumn) {
        setImportMessage(`Could not find required columns. Expected: BMC Name and Changegear Asset ID. Found: ${headers.join(', ')}`);
        setTimeout(() => setImportMessage(''), 5000);
        return;
      }

      console.log('Using columns:', { bmcNameColumn, cgAssetIdColumn });

      // Create mapping of BMC Name to Changegear Asset ID
      const cgMapping = {};
      data.forEach(row => {
        const bmcName = row[bmcNameColumn];
        const cgAssetId = row[cgAssetIdColumn];
        
        if (bmcName && cgAssetId) {
          // Normalize the BMC name for matching
          const normalizedBmcName = bmcName.toString().toLowerCase().trim();
          cgMapping[normalizedBmcName] = cgAssetId.toString().trim();
        }
      });

      console.log('CG Mapping created:', Object.keys(cgMapping).length, 'entries');
      console.log('Sample entries:', Object.entries(cgMapping).slice(0, 3));

      // Update the master data with matched Changegear Asset IDs
      let matchedCount = 0;
      let notMatchedBuilds = [];

      const updatedMasterData = { ...masterData };
      selectedBuilds.forEach(build => {
        const bmcName = build.bmc_name || build.chassis_sn;
        const normalizedBmcName = bmcName.toLowerCase().trim();
        
        // Try different variations for matching
        let matchedCgAssetId = null;
        
        // Try exact match first
        if (cgMapping[normalizedBmcName]) {
          matchedCgAssetId = cgMapping[normalizedBmcName];
        } 
        // Try without special characters
        else if (cgMapping[normalizedBmcName.replace(/[-_]/g, '')]) {
          matchedCgAssetId = cgMapping[normalizedBmcName.replace(/[-_]/g, '')];
        }
        // Try partial match (for cases where Excel might have additional info)
        else {
          // Find if any key in cgMapping is contained in the BMC name or vice versa
          const matchedKey = Object.keys(cgMapping).find(key => 
            normalizedBmcName.includes(key) || key.includes(normalizedBmcName)
          );
          if (matchedKey) {
            matchedCgAssetId = cgMapping[matchedKey];
          }
        }
        
        if (!matchedCgAssetId) {
          console.log("NOT MATCHED:", {
            buildValue: bmcName,
            normalized: normalizedBmcName,
            availableKeys: Object.keys(cgMapping).slice(0, 10)
          });
        }
        
        if (matchedCgAssetId) {
          if (!updatedMasterData.builds[build.chassis_sn]) {
            updatedMasterData.builds[build.chassis_sn] = {};
          }
          updatedMasterData.builds[build.chassis_sn].changegearAssetId = matchedCgAssetId;
          matchedCount++;
        } else {
          notMatchedBuilds.push(bmcName);
        }
      });

      setMasterData(updatedMasterData);

      // Set import message
      let message = `Successfully imported ${matchedCount} Changegear Asset ID(s)`;
      if (notMatchedBuilds.length > 0) {
        message += `. ${notMatchedBuilds.length} build(s) not matched: ${notMatchedBuilds.slice(0, 3).join(', ')}${notMatchedBuilds.length > 3 ? '...' : ''}`;
      }
      setImportMessage(message);
      setTimeout(() => setImportMessage(''), 5000);

    } catch (error) {
      console.error('Error importing file:', error);
      setImportMessage('Error reading the Excel file. Please check the file format.');
      setTimeout(() => setImportMessage(''), 3000);
    }
  };

  // Read Excel file
  const readExcelFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Get the first worksheet
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // Convert to JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            raw: false, // Convert all values to strings
            defval: '' // Default value for empty cells
          });
          
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  // Update getColumnCount for teamLocation
  const getColumnCountUpdated = (section) => {
    switch (section) {
      case 'general': return 2;
      case 'systemInfo': return 10;
      case 'cpuInfo': return 2;
      case 'componentInfo': return 4;
      case 'testing': return 4;
      case 'bkcDetails': return 4;
      case 'qualityIndicator': return 5;
      case 'teamLocation': return 4; // Updated from 3 to 4
      case 'buildInfo': return 4;
      case 'misc': return 6;
      default: return 0;
    }
  };

  return (
    <>
      <div className="master-table-container">
        <div className="master-table-header">
          <div className="table-header-info">
            <span>Entering details for <strong>{selectedBuilds.length}</strong> build(s)</span>
            {selectedRows.length > 0 && (
              <span style={{ marginLeft: '15px', color: '#007bff' }}>
                Selected: {selectedRows.length} row{selectedRows.length !== 1 ? 's' : ''}
                {sourceRow && <span style={{ marginLeft: '5px' }}>(Source: {sourceRow})</span>}
              </span>
            )}
          </div>
          <div className="table-header-actions">
            <button 
              className="bulk-import-btn"
              onClick={handleImportCGAssetId}
              title="Import Changegear Asset IDs from Excel file"
            >
              <FontAwesomeIcon icon={faFileImport} />
              Import Changegear Asset ID
            </button>
            <button 
              className="bulk-match-btn"
              onClick={handleBulkMatch}
              title="Copy values from selected row to all other rows"
            >
              <FontAwesomeIcon icon={faCopy} />
              Match Bulk Entry
            </button>
          </div>
        </div>

        {bulkMatchMessage && (
          <div style={{ padding: '10px 20px', backgroundColor: '#d4edda', color: '#155724', fontSize: '13px' }}>
            <FontAwesomeIcon icon={faCheck} /> {bulkMatchMessage}
          </div>
        )}

        {importMessage && (
          <div style={{ 
            padding: '10px 20px', 
            backgroundColor: importMessage.includes('not matched') || importMessage.includes('Error') ? '#fff3cd' : '#d4edda', 
            color: importMessage.includes('not matched') || importMessage.includes('Error') ? '#856404' : '#155724', 
            fontSize: '13px' 
          }}>
            <FontAwesomeIcon icon={importMessage.includes('not matched') || importMessage.includes('Error') ? faFileImport : faCheck} /> {importMessage}
          </div>
        )}

        <div className="master-table-wrapper">
          <table className={`master-data-table ${hasCollapsedSections ? 'has-collapsed-sections' : ''}`}>
            <TableHeader 
              collapsedSections={collapsedSections}
              toggleSection={toggleSection}
              getColumnCount={getColumnCountUpdated}
            />
            <TableBody
              selectedBuilds={selectedBuilds}
              selectedRows={selectedRows}
              sourceRow={sourceRow}
              toggleRowSelection={toggleRowSelection}
              collapsedSections={collapsedSections}
              hasCollapsedSections={hasCollapsedSections}
              masterData={masterData}
              handleFieldChange={handleFieldChange}
              getCpuQty={getCpuQty}
              showCpuDetails={showCpuDetails}
              showDimmDetails={showDimmDetails}
              loadTestDetails={loadTestDetails}
              loadFailureDetails={loadFailureDetails}
              loadReworkHistory={loadReworkHistory}
              getStatusBadgeClass={getStatusBadgeClass}
              onRemoveBuild={handleRemoveBuild}
            />
          </table>
        </div>

        <TableActions
          onSave={onSave}
          saving={saving}
          selectedBuilds={selectedBuilds}
          onSaveAndContinue={onSaveAndContinue}
        />
      </div>

      {/* Hidden file input for Excel import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />

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

export default TableEntryView;