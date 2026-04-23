// frontend/src/pages/MasterBuild/components/table/TableBody.js

import React from 'react';
import TableRow from './TableRow';

const TableBody = ({
  selectedBuilds,
  selectedRows,
  sourceRow,
  toggleRowSelection,
  collapsedSections,
  hasCollapsedSections,
  masterData,
  handleFieldChange,
  getCpuQty,
  showCpuDetails,
  showDimmDetails,
  loadTestDetails,
  loadFailureDetails,
  loadReworkHistory,
  getStatusBadgeClass,
  onRemoveBuild
}) => {
  return (
    <tbody>
      {selectedBuilds.map((build) => (
        <TableRow
          key={build.chassis_sn}
          build={build}
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
          onRemoveBuild={onRemoveBuild}
        />
      ))}
    </tbody>
  );
};

export default TableBody;