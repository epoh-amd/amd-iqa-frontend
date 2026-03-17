// frontend/src/pages/MasterBuild/hooks/useTableEntryState.js

import { useState } from 'react';

const useTableEntryState = () => {
  const [selectedRows, setSelectedRows] = useState([]); // Changed from single to multiple
  const [sourceRow, setSourceRow] = useState(null); // Track the last clicked row as source
  const [bulkMatchMessage, setBulkMatchMessage] = useState('');
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

  // Toggle section collapse
  const toggleSection = (section) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Toggle row selection (multi-select)
  const toggleRowSelection = (chassisSN) => {
    setSelectedRows(prev => {
      if (prev.includes(chassisSN)) {
        // Deselect
        const updated = prev.filter(sn => sn !== chassisSN);
        // If deselecting the source row, clear source or set to first selected
        if (sourceRow === chassisSN) {
          setSourceRow(updated.length > 0 ? updated[0] : null);
        }
        return updated;
      } else {
        // Select
        setSourceRow(chassisSN); // Last clicked becomes source
        return [...prev, chassisSN];
      }
    });
  };

  return {
    selectedRows,
    setSelectedRows,
    sourceRow,
    setSourceRow,
    toggleRowSelection,
    bulkMatchMessage,
    setBulkMatchMessage,
    collapsedSections,
    setCollapsedSections,
    toggleSection
  };
};

export default useTableEntryState;