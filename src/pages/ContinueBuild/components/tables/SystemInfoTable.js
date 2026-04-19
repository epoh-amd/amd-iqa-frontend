// frontend/src/pages/ContinueBuild/components/tables/SystemInfoTable.js
import React, { useRef, useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBarcode,
  faCamera,
  faImage
} from '@fortawesome/free-solid-svg-icons';
import api from '../../services/api';

const SystemInfoTable = ({ 
  builds, 
  setBuilds,
  systemInfoSubStep, 
  showReview, 
  handleInputChange, 
  partNumberSuggestions, 
  scannerRefs, 
  selectedField, 
  setSelectedField, 
  selectedBuildIndex, 
  setSelectedBuildIndex, 
  handleFileSelection, 
  removePhoto,
  partNumberSearch,
  showPartNumberDropdown,
  setShowPartNumberDropdown,
  handlePartNumberSearchChange,
  selectPartNumber
}) => {
  
  // Helper function to get build reference
  const getBuildReference = (build, buildIndex) => {
    return build.systemInfo?.bmcName || `Build ${buildIndex + 1}`;
  };

  const renderPhotos = (photos, testType) => {
    if (!photos || photos.length === 0) {
      return <span style={{ color: '#6c757d', fontStyle: 'italic' }}>No photos</span>;
    }
    return (
      <div className="uploaded-files">
        {photos.map((photo, idx) => (
          <div key={idx} className="uploaded-file">
            <FontAwesomeIcon icon={faImage} />
            <span className="file-name">{photo.name || 'Photo ' + (idx + 1)}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="builds-table-container">
      <table className="builds-table">
        <thead>
          <tr>
            <th className="build-reference">Build Reference</th>
            {/*  */}
            {systemInfoSubStep === 'chassisInfo' && (
              <>
                <th>Project Name</th>
                <th>System P/N</th>
                <th>Chassis S/N</th>
                <th>BMC MAC</th>
                <th>MB S/N</th>
                <th>Ethernet MAC</th>
                <th>CPU Socket</th>
                <th>CPU Vendor</th>
                <th>Build Engineer</th>
                <th>Jira Ticket No.</th>
                {showReview && (
                  <>
                    <th>Platform Type</th>
                    <th>Manufacturer</th>
                    <th>Chassis Type</th>
                    <th>BMC Name</th>
                  </>
                )}
              </>
            )}
            
            {/* CPU Information */}
            {systemInfoSubStep === 'cpuInfo' && (
              <>
                <th>CPU Program Name</th>
                <th>CPU P0 S/N (Optional)</th>
                <th>P0 Socket Date Code (Optional)</th>
                <th>CPU P1 S/N (Optional)</th>
                <th>P1 Socket Date Code (Optional)</th>
              </>
            )}
            
            {/* Component Information */}
            {systemInfoSubStep === 'componentInfo' && (
              <>
                <th>M.2 P/N</th>
                <th>M.2 S/N</th>
                <th>DIMM P/N</th>
                <th>DIMM QTY</th>
                {/* Dynamic DIMM S/N columns */}
                {builds[0]?.systemInfo?.dimmQty && Array.from(
                  { length: parseInt(builds[0].systemInfo.dimmQty) || 0 },
                  (_, i) => <th key={`dimm-${i}`}>DIMM S/N #{i + 1}</th>
                )}
              </>
            )}
            
            {/* Testing */}
            {systemInfoSubStep === 'testing' && (
              <>
                <th>Visual Inspection</th>
                <th>Boot to OS/Shell</th>
                <th>DIMMs Detected</th>
                <th>LOM Working</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {builds.map((build, buildIndex) => (
            <tr key={build.id} className={`build-row ${build.status}`}>
              <td className="build-reference">{getBuildReference(build, buildIndex)}</td>

              {/* Chassis Information */}
              {systemInfoSubStep === 'chassisInfo' && (
                <>
                  <td><div className="read-only-value">{build.systemInfo.projectName || '-'}</div></td>
                  <td>
                    <div className="scanner-input">
                      <div className="read-only-value">{build.systemInfo.systemPN || '-'}</div>
                      <FontAwesomeIcon icon={faBarcode} className="scanner-icon" style={{ opacity: 0.3 }} />
                    </div>
                  </td>
                  <td>
                    <div className="scanner-input">
                      <div className="read-only-value">{build.systemInfo.chassisSN || '-'}</div>
                      <FontAwesomeIcon icon={faBarcode} className="scanner-icon" style={{ opacity: 0.3 }} />
                    </div>
                  </td>
                  <td>
                    <div className="scanner-input">
                      <div className="read-only-value">{build.systemInfo.bmcMac || '-'}</div>
                      <FontAwesomeIcon icon={faBarcode} className="scanner-icon" style={{ opacity: 0.3 }} />
                    </div>
                  </td>
                  <td>
                    <div className="scanner-input">
                      <div className="read-only-value">{build.systemInfo.mbSN || '-'}</div>
                      <FontAwesomeIcon icon={faBarcode} className="scanner-icon" style={{ opacity: 0.3 }} />
                    </div>
                  </td>
                  <td>
                    <div className="scanner-input">
                      <div className="read-only-value">{build.systemInfo.ethernetMac || '-'}</div>
                      <FontAwesomeIcon icon={faBarcode} className="scanner-icon" style={{ opacity: 0.3 }} />
                    </div>
                  </td>
                  <td><div className="read-only-value">{build.systemInfo.cpuSocket || '-'}</div></td>
                  <td><div className="read-only-value">{build.systemInfo.cpuVendor || '-'}</div></td>
                  <td><div className="read-only-value">{build.systemInfo.buildEngineer || '-'}</div></td>
                  <td><div className="read-only-value">{build.systemInfo.jiraTicketNo || '-'}</div></td>
                  {showReview && (
                    <>
                      <td className="auto-populated">{build.systemInfo.platformType || '-'}</td>
                      <td className="auto-populated">{build.systemInfo.manufacturer || '-'}</td>
                      <td className="auto-populated">{build.systemInfo.chassisType || '-'}</td>
                      <td className="auto-populated">{build.systemInfo.bmcName || '-'}</td>
                    </>
                  )}
                </>
              )}

              {/* CPU Information */}
              {systemInfoSubStep === 'cpuInfo' && (
                <>
                  <td><div className="read-only-value">{build.systemInfo.cpuProgramName || '-'}</div></td>
                  <td>
                    <div className="scanner-input">
                      <div className="read-only-value">{build.systemInfo.cpuP0SN || '-'}</div>
                      <FontAwesomeIcon icon={faBarcode} className="scanner-icon" style={{ opacity: 0.3 }} />
                    </div>
                  </td>
                  <td>
                    <div className="scanner-input">
                      <div className="read-only-value">{build.systemInfo.cpuP0SocketDateCode || '-'}</div>
                      <FontAwesomeIcon icon={faBarcode} className="scanner-icon" style={{ opacity: 0.3 }} />
                    </div>
                  </td>
                  <td>
                    <div className="scanner-input">
                      <div className="read-only-value">{build.systemInfo.cpuP1SN || '-'}</div>
                      <FontAwesomeIcon icon={faBarcode} className="scanner-icon" style={{ opacity: 0.3 }} />
                    </div>
                  </td>
                  <td>
                    <div className="scanner-input">
                      <div className="read-only-value">{build.systemInfo.cpuP1SocketDateCode || '-'}</div>
                      <FontAwesomeIcon icon={faBarcode} className="scanner-icon" style={{ opacity: 0.3 }} />
                    </div>
                  </td>
                </>
              )}

              {/* Component Information */}
              {systemInfoSubStep === 'componentInfo' && (
                <>
                  <td><div className="read-only-value">{build.systemInfo.m2PN || '-'}</div></td>
                  <td>
                    <div className="scanner-input">
                      <div className="read-only-value">{build.systemInfo.m2SN || '-'}</div>
                      <FontAwesomeIcon icon={faBarcode} className="scanner-icon" style={{ opacity: 0.3 }} />
                    </div>
                  </td>
                  <td><div className="read-only-value">{build.systemInfo.dimmPN || '-'}</div></td>
                  <td><div className="read-only-value">{build.systemInfo.dimmQty || '-'}</div></td>
                  {/* Dynamic DIMM S/N columns */}
                  {Array.from(
                    { length: parseInt(build.systemInfo.dimmQty) || 0 },
                    (_, i) => (
                      <td key={`dimm-sn-${buildIndex}-${i}`}>
                        <div className="scanner-input">
                          <div className="read-only-value">{build.systemInfo.dimmSNs[i] || '-'}</div>
                          <FontAwesomeIcon icon={faBarcode} className="scanner-icon" style={{ opacity: 0.3 }} />
                        </div>
                      </td>
                    )
                  )}
                </>
              )}

              {/* Testing */}
              {systemInfoSubStep === 'testing' && (
                <>
                  <td>
                    <div className="test-field">
                      <div className={`read-only-value ${build.systemInfo.visualInspection === 'Pass' ? 'status-pass' : 'status-fail'}`}>
                        {build.systemInfo.visualInspection || '-'}
                      </div>
                      {build.systemInfo.visualInspection === 'Fail' && (
                        <div className="test-fail-inputs" style={{ marginTop: '8px' }}>
                          <div className="read-only-value" style={{ fontSize: '12px', color: '#6c757d' }}>
                            {build.systemInfo.visualInspectionNotes || 'No notes'}
                          </div>
                          {renderPhotos(build.systemInfo.visualInspectionPhotos, 'visualInspection')}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="test-field">
                      <div className={`read-only-value ${build.systemInfo.bootStatus === 'Yes' ? 'status-pass' : 'status-fail'}`}>
                        {build.systemInfo.bootStatus || '-'}
                      </div>
                      {build.systemInfo.bootStatus === 'No' && (
                        <div className="test-fail-inputs" style={{ marginTop: '8px' }}>
                          <div className="read-only-value" style={{ fontSize: '12px', color: '#6c757d' }}>
                            {build.systemInfo.bootNotes || 'No notes'}
                          </div>
                          {renderPhotos(build.systemInfo.bootPhotos, 'boot')}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="test-field">
                      <div className={`read-only-value ${build.systemInfo.dimmsDetectedStatus === 'Yes' ? 'status-pass' : 'status-fail'}`}>
                        {build.systemInfo.dimmsDetectedStatus || '-'}
                      </div>
                      {build.systemInfo.dimmsDetectedStatus === 'No' && (
                        <div className="test-fail-inputs" style={{ marginTop: '8px' }}>
                          <div className="read-only-value" style={{ fontSize: '12px', color: '#6c757d' }}>
                            {build.systemInfo.dimmsDetectedNotes || 'No notes'}
                          </div>
                          {renderPhotos(build.systemInfo.dimmsDetectedPhotos, 'dimmsDetected')}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="test-field">
                      <div className={`read-only-value ${build.systemInfo.lomWorkingStatus === 'Yes' ? 'status-pass' : 'status-fail'}`}>
                        {build.systemInfo.lomWorkingStatus || '-'}
                      </div>
                      {build.systemInfo.lomWorkingStatus === 'No' && (
                        <div className="test-fail-inputs" style={{ marginTop: '8px' }}>
                          <div className="read-only-value" style={{ fontSize: '12px', color: '#6c757d' }}>
                            {build.systemInfo.lomWorkingNotes || 'No notes'}
                          </div>
                          {renderPhotos(build.systemInfo.lomWorkingPhotos, 'lomWorking')}
                        </div>
                      )}
                    </div>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SystemInfoTable;