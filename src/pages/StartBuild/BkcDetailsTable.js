// frontend/src/pages/StartBuild/BkcDetailsTable.js

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCheck,
  faExclamationTriangle,
  faSync,
  faSpinner,
  faTimes
} from '@fortawesome/free-solid-svg-icons';

const BkcDetailsTable = ({ 
  builds, 
  extractFirmwareVersions, 
  handleBkcFieldChange
}) => {
  
  // Helper function to get build reference (BMC Name or Build #) - CONSISTENT WITH OTHER TABLES
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
                  className={`extract-btn ${build.bkcExtraction.extracting ? 'extracting' : ''} ${build.bkcExtraction.extracted ? 'extracted' : ''} ${build.bkcExtraction.error ? 'error' : ''}`}
                  onClick={() => extractFirmwareVersions(buildIndex)}
                  disabled={build.bkcExtraction.extracting || !build.systemInfo.bmcName}
                  title={build.bkcExtraction.error ? build.bkcExtraction.error : ''}
                >
                  {build.bkcExtraction.extracting ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} spin />
                      <span>Extracting...</span>
                    </>
                  ) : build.bkcExtraction.extracted ? (
                    <>
                      <FontAwesomeIcon icon={faCheck} />
                      <span>Extracted</span>
                    </>
                  ) : build.bkcExtraction.error ? (
                    <>
                      <FontAwesomeIcon icon={faTimes} />
                      <span>Retry</span>
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faSync} />
                      <span>Extract</span>
                    </>
                  )}
                </button>
                {build.bkcExtraction.error && (
                  <div className="extract-error">
                    <FontAwesomeIcon icon={faExclamationTriangle} />
                    <span>{build.bkcExtraction.error}</span>
                  </div>
                )}
              </td>
              <td>
                <input
                  type="text"
                  value={build.bkcDetails.biosVersion}
                  onChange={(e) => handleBkcFieldChange(buildIndex, 'biosVersion', e.target.value)}
                  placeholder="Enter BIOS Version"
                  className={build.errors.biosVersion ? 'error' : ''}
                />
                {build.errors.biosVersion && (
                  <div className="field-error">{build.errors.biosVersion}</div>
                )}
              </td>
              <td>
                <input
                  type="text"
                  value={build.bkcDetails.scmFpgaVersion}
                  onChange={(e) => handleBkcFieldChange(buildIndex, 'scmFpgaVersion', e.target.value)}
                  placeholder="Enter SCM FPGA Version (Optional)"
                  className={`optional-field ${build.errors.scmFpgaVersion ? 'error' : ''}`}
                />
                {build.errors.scmFpgaVersion && (
                  <div className="field-error">{build.errors.scmFpgaVersion}</div>
                )}
              </td>
              <td>
                <input
                  type="text"
                  value={build.bkcDetails.hpmFpgaVersion}
                  onChange={(e) => handleBkcFieldChange(buildIndex, 'hpmFpgaVersion', e.target.value)}
                  placeholder="Enter HPM FPGA Version"
                  className={build.errors.hpmFpgaVersion ? 'error' : ''}
                />
                {build.errors.hpmFpgaVersion && (
                  <div className="field-error">{build.errors.hpmFpgaVersion}</div>
                )}
              </td>
              <td>
                <input
                  type="text"
                  value={build.bkcDetails.bmcVersion}
                  onChange={(e) => handleBkcFieldChange(buildIndex, 'bmcVersion', e.target.value)}
                  placeholder="Enter BMC Version"
                  className={build.errors.bmcVersion ? 'error' : ''}
                />
                {build.errors.bmcVersion && (
                  <div className="field-error">{build.errors.bmcVersion}</div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BkcDetailsTable;