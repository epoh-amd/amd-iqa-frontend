// frontend/src/pages/MasterBuild/components/table/TableActions.js

import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faSpinner, faFileExcel, faDownload } from '@fortawesome/free-solid-svg-icons';
import { generateCGTemplateWithFormat, validateMasterDataForCG } from '../../../../utils/cgTemplateExport';
import { exportMasterBuildsToExcel } from '../../../../utils/masterBuildExport';

const TableActions = ({ onSave, saving, selectedBuilds }) => {
  const [exporting, setExporting] = useState(false);
  
  const handleDownloadCG = () => {
    // Debug log
    console.log('handleDownloadCG called with selectedBuilds:', selectedBuilds);
    
    // Check if selectedBuilds exists
    if (!selectedBuilds || selectedBuilds.length === 0) {
      alert('No builds available for export. Please ensure builds are selected.');
      return;
    }
    
    // Validate master data
    const missingData = validateMasterDataForCG(selectedBuilds);
    
    if (missingData.length > 0) {
      const missingList = missingData.map(item => 
        `${item.bmcName}: ${item.missing.join(', ')}`
      ).join('\n');
      
      const proceed = window.confirm(
        `The following builds are missing required master data:\n\n${missingList}\n\nDo you want to proceed with the export anyway?`
      );
      
      if (!proceed) {
        return;
      }
    }
    
    // Generate template with format selection dialog
    generateCGTemplateWithFormat(selectedBuilds);
  };

  const handleExportToExcel = async () => {
    // Check if selectedBuilds exists
    if (!selectedBuilds || selectedBuilds.length === 0) {
      alert('No builds available for export. Please ensure builds are selected.');
      return;
    }

    setExporting(true);
    
    try {
      await exportMasterBuildsToExcel(selectedBuilds);
    } catch (error) {
      console.error('Error during Excel export:', error);
      alert('Failed to export to Excel. Please try again.');
    } finally {
      setExporting(false);
    }
  };
  
  return (
    <div className="save-actions">
      <button 
        className="btn-secondary"
        onClick={handleExportToExcel}
        disabled={saving || exporting}
        title="Export master build data to Excel format"
      >
        {exporting ? (
          <>
            <FontAwesomeIcon icon={faSpinner} spin />
            Exporting...
          </>
        ) : (
          <>
            <FontAwesomeIcon icon={faDownload} />
            Export into xlsx
          </>
        )}
      </button>
      
      <button 
        className="btn-secondary"
        onClick={handleDownloadCG}
        disabled={saving || exporting}
        title="Download ChangeGear template"
      >
        {saving ? (
          <>
            <FontAwesomeIcon icon={faSpinner} spin />
            Saving...
          </>
        ) : (
          <>
            <FontAwesomeIcon icon={faSave} />
            Download CG Template
          </>
        )}
      </button>
      
      <button 
        className="btn-primary"
        onClick={onSave}
        disabled={saving || exporting}
      >
        {saving ? (
          <>
            <FontAwesomeIcon icon={faSpinner} spin />
            Saving...
          </>
        ) : (
          <>
            <FontAwesomeIcon icon={faSave} />
            Save Master Data
          </>
        )}
      </button>
    </div>
  );
};

export default TableActions;