// frontend/src/pages/ContinueBuild/components/tables/BkcDetailsTable.js
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCheck,
  faSync
} from '@fortawesome/free-solid-svg-icons';

const BkcDetailsTable = ({ 
  builds, 
  extractFirmwareVersions, 
  handleBkcFieldChange
}) => {
  
  // Helper function to get build reference
  const getBuildReference = (build, buildIndex) => {
    return build.systemInfo?.bmcName || `Build ${buildIndex + 1}`;
  };

  return (
    <div className="builds-table-container">
      <table className="builds-table">
        <thead>
          <tr>
            <th className="build-reference">Build Reference</th>
            <th>Extract</th>
            <th>BIOS Version</th>
            <th>SCM FPGA Version (Optional)</th>
            <th>HPM FPGA Version</th>
            <th>BMC Version</th>
          </tr>
        </thead>
        <tbody>
          {builds.map((build, buildIndex) => (
            <tr key={build.id} className={`build-row ${build.status}`}>
              <td className="build-reference">{getBuildReference(build, buildIndex)}</td>
              <td className="extract-cell">
                <button
                  type="button"
                  className="extract-btn extracted"
                  disabled={true}
                  style={{ opacity: 0.5, cursor: 'not-allowed' }}
                >
                  <FontAwesomeIcon icon={faCheck} />
                  <span>Extracted</span>
                </button>
              </td>
              <td>
                <div className="read-only-value">
                  {build.bkcDetails.biosVersion || '-'}
                </div>
              </td>
              <td>
                <div className="read-only-value optional-field">
                  {build.bkcDetails.scmFpgaVersion || '-'}
                </div>
              </td>
              <td>
                <div className="read-only-value">
                  {build.bkcDetails.hpmFpgaVersion || '-'}
                </div>
              </td>
              <td>
                <div className="read-only-value">
                  {build.bkcDetails.bmcVersion || '-'}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BkcDetailsTable;