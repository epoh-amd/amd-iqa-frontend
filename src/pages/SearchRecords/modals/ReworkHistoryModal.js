// frontend/src/pages/SearchRecords/modals/ReworkHistoryModal.js

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faTimes, faImage } from '@fortawesome/free-solid-svg-icons';

const ReworkHistoryModal = ({ reworkModal, setReworkModal, loadingRework, showReworkPhotos }) => {
  if (!reworkModal.show) return null;

  return (
    <div className="modal-overlay" onClick={() => setReworkModal({ show: false, chassisSN: null, data: null })}>
      <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Rework History - {reworkModal.chassisSN}</h3>
          <button className="close-btn" onClick={() => setReworkModal({ show: false, chassisSN: null, data: null })}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        <div className="modal-body">
          {loadingRework ? (
            <div className="loading-container">
              <FontAwesomeIcon icon={faSpinner} spin size="2x" />
              <p>Loading rework history...</p>
            </div>
          ) : reworkModal.data && reworkModal.data.length > 0 ? (
            <div className="rework-history">
              {reworkModal.data.map((rework, index) => (
                <div key={rework.id} className="rework-item">
                  <div className="rework-header">
                    <h4>Rework #{rework.rework_number}</h4>
                    <span className="rework-date">
                      {new Date(rework.rework_date).toLocaleString()}
                    </span>
                  </div>
                  
                  {/* Component Changes */}
                  <div className="rework-section">
                    <h5>Component Changes:</h5>
                    <table className="rework-table">
                      <tbody>
                        {rework.new_mb_sn && (
                          <tr>
                            <td>Motherboard S/N:</td>
                            <td className="old-value">{rework.original_mb_sn || '-'}</td>
                            <td>→</td>
                            <td className="new-value">{rework.new_mb_sn}</td>
                          </tr>
                        )}
                        {rework.new_bmc_mac && (
                          <tr>
                            <td>BMC MAC:</td>
                            <td className="old-value">{rework.original_bmc_mac || '-'}</td>
                            <td>→</td>
                            <td className="new-value">{rework.new_bmc_mac}</td>
                          </tr>
                        )}
                        {rework.new_ethernet_mac && (
                          <tr>
                            <td>Ethernet MAC:</td>
                            <td className="old-value">{rework.original_ethernet_mac || '-'}</td>
                            <td>→</td>
                            <td className="new-value">{rework.new_ethernet_mac}</td>
                          </tr>
                        )}
                        {rework.new_cpu_p0_sn && (
                          <tr>
                            <td>CPU P0 S/N:</td>
                            <td className="old-value">{rework.original_cpu_p0_sn || '-'}</td>
                            <td>→</td>
                            <td className="new-value">{rework.new_cpu_p0_sn}</td>
                          </tr>
                        )}
                        {rework.new_cpu_p1_sn && (
                          <tr>
                            <td>CPU P1 S/N:</td>
                            <td className="old-value">{rework.original_cpu_p1_sn || '-'}</td>
                            <td>→</td>
                            <td className="new-value">{rework.new_cpu_p1_sn}</td>
                          </tr>
                        )}
                        {rework.new_m2_pn && (
                          <tr>
                            <td>M.2 P/N:</td>
                            <td className="old-value">{rework.original_m2_pn || '-'}</td>
                            <td>→</td>
                            <td className="new-value">{rework.new_m2_pn}</td>
                          </tr>
                        )}
                        {rework.new_m2_sn && (
                          <tr>
                            <td>M.2 S/N:</td>
                            <td className="old-value">{rework.original_m2_sn || '-'}</td>
                            <td>→</td>
                            <td className="new-value">{rework.new_m2_sn}</td>
                          </tr>
                        )}
                        {rework.new_dimm_pn && (
                          <tr>
                            <td>DIMM P/N:</td>
                            <td className="old-value">{rework.original_dimm_pn || '-'}</td>
                            <td>→</td>
                            <td className="new-value">{rework.new_dimm_pn}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* DIMM Changes */}
                  {rework.dimm_changes && rework.dimm_changes.length > 0 && (
                    <div className="rework-section">
                      <h5>DIMM Serial Number Changes:</h5>
                      <table className="rework-table">
                        <tbody>
                          {rework.dimm_changes.map((change, idx) => (
                            <tr key={idx}>
                              <td>DIMM Position {change.position}:</td>
                              <td className="old-value">{change.original || 'Empty'}</td>
                              <td>→</td>
                              <td className="new-value">{change.new || 'Empty'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Original Test Results */}
                  <div className="rework-section">
                    <h5>Original Test Results:</h5>
                    <div className="test-results">
                      <div className="test-item">
                        <span className="test-label">Visual Inspection:</span>
                        <span className={`status-badge ${rework.original_visual_inspection === 'Pass' ? 'complete' : 'fail'}`}>
                          {rework.original_visual_inspection || '-'}
                        </span>
                        {rework.original_visual_inspection_notes && (
                          <span className="test-notes">({rework.original_visual_inspection_notes})</span>
                        )}
                      </div>
                      <div className="test-item">
                        <span className="test-label">Boot Status:</span>
                        <span className={`status-badge ${rework.original_boot_status === 'Yes' ? 'complete' : 'fail'}`}>
                          {rework.original_boot_status || '-'}
                        </span>
                        {rework.original_boot_notes && (
                          <span className="test-notes">({rework.original_boot_notes})</span>
                        )}
                      </div>
                      <div className="test-item">
                        <span className="test-label">DIMMs Detected:</span>
                        <span className={`status-badge ${rework.original_dimms_detected === 'Yes' ? 'complete' : 'fail'}`}>
                          {rework.original_dimms_detected || '-'}
                        </span>
                        {rework.original_dimms_detected_notes && (
                          <span className="test-notes">({rework.original_dimms_detected_notes})</span>
                        )}
                      </div>
                      <div className="test-item">
                        <span className="test-label">LOM Working:</span>
                        <span className={`status-badge ${rework.original_lom_working === 'Yes' ? 'complete' : 'fail'}`}>
                          {rework.original_lom_working || '-'}
                        </span>
                        {rework.original_lom_working_notes && (
                          <span className="test-notes">({rework.original_lom_working_notes})</span>
                        )}
                      </div>
                      <div className="test-item">
                        <span className="test-label">FPY Status:</span>
                        <span className={`status-badge ${rework.original_fpy_status === 'Pass' ? 'complete' : 'fail'}`}>
                          {rework.original_fpy_status || '-'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Original Problem Description */}
                  {rework.problem_description && (
                    <div className="rework-section">
                      <h5>Original Problem Description:</h5>
                      <p className="problem-desc">{rework.problem_description}</p>
                    </div>
                  )}

                  {/* Original Failures */}
                  {rework.original_failures && rework.original_failures.length > 0 && (
                    <div className="rework-section">
                      <h5>Original Failures:</h5>
                      <table className="failure-table">
                        <thead>
                          <tr>
                            <th>Failure Mode</th>
                            <th>Failure Category</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rework.original_failures.map((failure, idx) => (
                            <tr key={idx}>
                              <td>{failure.failure_mode}</td>
                              <td>{failure.failure_category}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Rework Photos */}
                  {rework.photos && rework.photos.length > 0 && (
                    <div className="rework-section">
                      <h5>
                        Rework Photos:
                        <button 
                          className="view-photos-btn"
                          onClick={() => showReworkPhotos(rework.photos)}
                        >
                          <FontAwesomeIcon icon={faImage} /> View Photos ({rework.photos.length})
                        </button>
                      </h5>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="no-data">No rework history found for this build.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReworkHistoryModal;