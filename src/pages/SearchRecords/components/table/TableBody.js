// frontend/src/pages/SearchRecords/components/table/TableBody.js

import React from 'react';
import TableRow from './TableRow';

const TableBody = ({
  results,
  collapsedSections,
  hasCollapsedSections,
  getCpuQty,
  showCpuDetails,
  showDimmDetails,
  loadTestDetails,
  loadFailureDetails,
  loadReworkHistory,
  getStatusBadgeClass
}) => {
  return (
    <tbody>
      {results.map((build) => (
        <TableRow
          key={build.chassis_sn}
          build={build}
          collapsedSections={collapsedSections}
          hasCollapsedSections={hasCollapsedSections}
          getCpuQty={getCpuQty}
          showCpuDetails={showCpuDetails}
          showDimmDetails={showDimmDetails}
          loadTestDetails={loadTestDetails}
          loadFailureDetails={loadFailureDetails}
          loadReworkHistory={loadReworkHistory}
          getStatusBadgeClass={getStatusBadgeClass}
        />
      ))}
    </tbody>
  );
};

export default TableBody;