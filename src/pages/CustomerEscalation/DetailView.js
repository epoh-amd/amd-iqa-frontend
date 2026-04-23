// frontend/src/pages/CustomerEscalation/DetailView.js
// Detail view component for individual escalation

import React from 'react';
import { Edit, Send, Eye, Download } from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHistory } from '@fortawesome/free-solid-svg-icons';
import { getStatusIcon, getAvailableStatusOptions } from './statusUtils';
import { renderFileIcon } from './fileUtils';
import { isValidStatusTransition } from './utils';
import TimelineEntry from './TimelineEntry';
import api from '../../services/api';

const DetailView = ({
  selectedEscalation,
  setViewMode,
  isEditMode,
  setIsEditMode,
  showRequestForm,
  setShowRequestForm,
  requestData,
  setRequestData,
  isSubmittingRequest,
  handleSendRequest,
  editData,
  setEditData,
  flatFailureModes,
  handleFailureModeChange,
  handleUpdate,
  timelineData
}) => {
  return (
    <div className="escalation-detail">  
      <div className="detail-header">  
        <button   
          className="btn-secondary"   
          onClick={() => setViewMode('list')}  
        >  
          Back to List  
        </button>  
        <h2>Escalation Details - {selectedEscalation.ticket_id}</h2>  
        <div className="header-actions">
          {!isEditMode && (  
            <button   
              className="btn-primary"  
              onClick={() => setIsEditMode(true)}  
            >  
              <Edit size={16} /> Update Analysis
            </button>  
          )}
          <button
            className="btn-secondary"
            onClick={() => setShowRequestForm(!showRequestForm)}
          >
            <Send size={16} /> Request Info
          </button>
        </div>
      </div>

      {showRequestForm && (
        <div className="request-form">
          <h3>Request Additional Information</h3>
          <div className="form-group">
            <label>Request Type:</label>
            <select
              value={requestData.requestType}
              onChange={(e) => setRequestData({...requestData, requestType: e.target.value})}
            >
              <option value="error_log">Request Error Log</option>
              <option value="additional_info">Request Additional Information</option>
              <option value="clarification">Request Clarification</option>
            </select>
          </div>
          <div className="form-group">
            <label>Message to Customer:</label>
                          <textarea
              value={requestData.requestMessage}
              onChange={(e) => setRequestData({...requestData, requestMessage: e.target.value})}
              rows="4"
              placeholder="Please provide specific details about what you need from the customer..."
            />
          </div>
          <div className="button-group">
            <button 
              className="btn-secondary" 
              onClick={() => setShowRequestForm(false)}
            >
              Cancel
            </button>
            <button 
              className="btn-primary" 
              onClick={handleSendRequest}
              disabled={isSubmittingRequest}
            >
              {isSubmittingRequest ? 'Sending...' : 'Send Request'}
            </button>
          </div>
        </div>
      )}

      <div className="detail-content">  
        <div className="info-section">  
          <h3>Customer Information</h3>  
          <div className="info-grid">  
            <div className="info-item">  
              <label>Customer Name:</label>  
              <span>{selectedEscalation.customer_name || 'N/A'}</span>  
            </div>  
            <div className="info-item">  
              <label>Project:</label>  
              <span>{selectedEscalation.project_name || 'N/A'}</span>  
            </div>  
            <div className="info-item">  
              <label>Created Date:</label>  
              <span>  
                {selectedEscalation.created_date   
                  ? new Date(selectedEscalation.created_date).toLocaleDateString()   
                  : 'N/A'}  
              </span>  
            </div>
            <div className="info-item">  
              <label>Current Status:</label>  
              <span className={`status ${(selectedEscalation.status || '').toLowerCase()}`}>
                {getStatusIcon(selectedEscalation.status)} {selectedEscalation.status || 'Unknown'}
              </span>  
            </div>  
          </div>  
        </div>  

        <div className="info-section">  
          <h3>System Information</h3>  
          <div className="info-grid">  
            <div className="info-item">  
              <label>Chassis SN:</label>  
              <span>{selectedEscalation.chassis_sn || 'N/A'}</span>  
            </div>  
            <div className="info-item">  
              <label>AMD Part Number:</label>  
              <span>{selectedEscalation.amd_part_number || 'N/A'}</span>  
            </div>  
            <div className="info-item">  
              <label>SKU:</label>  
              <span>{selectedEscalation.evt2_sku_description || 'N/A'}</span>  
            </div>  
            <div className="info-item">  
              <label>MB SN:</label>  
              <span>{selectedEscalation.pcba_sn || 'N/A'}</span>  
            </div>  
            <div className="info-item">  
              <label>CPU P0 S/N:</label>  
              <span>{selectedEscalation.cpu_p0_sn || 'N/A'}</span>  
            </div>  
            <div className="info-item">  
              <label>CPU P1 S/N:</label>  
              <span>{selectedEscalation.cpu_p1_sn || 'N/A'}</span>  
            </div>  
            <div className="info-item">  
              <label>BIOS Version:</label>  
              <span>{selectedEscalation.bios_version || 'N/A'}</span>  
            </div>
            <div className="info-item">  
              <label>FW/BMC Version:</label>  
              <span>{selectedEscalation.fw_bmc_version || 'N/A'}</span>  
            </div>
            <div className="info-item">  
              <label>OS Version:</label>  
              <span>{selectedEscalation.os_version || 'N/A'}</span>  
            </div>
            {selectedEscalation.jira_ticket_number && (
              <div className="info-item">  
                <label>Jira Ticket:</label>  
                <span>{selectedEscalation.jira_ticket_number}</span>  
              </div>
            )}
          </div>  
        </div> 

        <div className="info-section">  
          <h3>Problem Description</h3>  
          <div className="problem-description">
            <p>{selectedEscalation.problem_description || 'No description provided'}</p>  
          </div>
        </div>  

        <div className="info-section">  
          <h3>1st level problem isolation (freq of failure) that have been done ({selectedEscalation.error_count || 0} errors)</h3>  
          {selectedEscalation.errors && Array.isArray(selectedEscalation.errors) && selectedEscalation.errors.length > 0 ? (  
            selectedEscalation.errors.map((error, index) => (  
              <div key={index} className="error-detail">  
                <h4>Error {error.error_number || index + 1}</h4>  
                <p><strong></strong> {error.problem_isolation || 'Not specified'}</p>  
                {error.error_log_text && (
                  <div className="error-log-text">
                    <strong>Original Error Log:</strong>
                    <pre>{error.error_log_text}</pre>
                  </div>
                )}
                
                {error.errorLogFiles && error.errorLogFiles.length > 0 && (
                  <div className="attachments-section">
                    <h5>Error Log Files:</h5>
                    <div className="attachment-grid">
                      {error.errorLogFiles.map((file, fileIndex) => (
                        <div key={fileIndex} className="attachment-item">
                          <div className="attachment-icon">
                            {renderFileIcon(file.file_name, file.mime_type)}
                          </div>
                          <div className="attachment-info">
                            <span className="file-name">{file.file_name}</span>
                            <span className="file-size">({(file.file_size / 1024).toFixed(1)} KB)</span>
                          </div>
                          <div className="attachment-actions">
                            {file.mime_type?.startsWith('image/') && (
                              <button 
                                className="btn-view"
                                onClick={() => window.open(api.getErrorFileUrl(file.file_path), '_blank')}
                                title="View image"
                              >
                                <Eye size={14} />
                              </button>
                            )}
                            <a 
                              href={api.getErrorFileUrl(file.file_path)}
                              download={file.file_name}
                              className="btn-download"
                              title="Download file"
                            >
                              <Download size={14} />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {error.defectivePhotos && error.defectivePhotos.length > 0 && (
                  <div className="attachments-section">
                    <h5>Defective Photos:</h5>
                    <div className="attachment-grid">
                      {error.defectivePhotos.map((photo, photoIndex) => (
                        <div key={photoIndex} className="attachment-item">
                          <div className="attachment-icon">
                            {renderFileIcon(photo.file_name, photo.mime_type)}
                          </div>
                          <div className="attachment-info">
                            <span className="file-name">{photo.file_name}</span>
                            <span className="file-size">({(photo.file_size / 1024).toFixed(1)} KB)</span>
                          </div>
                          <div className="attachment-actions">
                            {photo.mime_type?.startsWith('image/') && (
                              <button 
                                className="btn-view"
                                onClick={() => window.open(api.getErrorFileUrl(photo.file_path), '_blank')}
                                title="View image"
                              >
                                <Eye size={14} />
                              </button>
                            )}
                            <a 
                              href={api.getErrorFileUrl(photo.file_path)}
                              download={photo.file_name}
                              className="btn-download"
                              title="Download file"
                            >
                              <Download size={14} />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>  
            ))  
          ) : (  
            <p>No error details available</p>  
          )}  
        </div>

        <div className="info-section">  
          <h3><FontAwesomeIcon icon={faHistory} /> Communication Timeline</h3>
          <div className="timeline-container">
            {timelineData && timelineData.length > 0 ? (
              <div className="timeline">
                {timelineData.map(entry => <TimelineEntry key={entry.id} entry={entry} />)}
              </div>
            ) : (
              <p>No timeline data available</p>
            )}
          </div>
        </div>

        <div className="info-section technician-section">  
          <h3>Technician Analysis</h3>  
          {isEditMode ? (  
            <div className="edit-form">  
              <div className="form-group">  
                <label>Status:</label>  
                <select  
                  value={editData.status}  
                  onChange={(e) => setEditData({...editData, status: e.target.value})}  
                >  
                  {getAvailableStatusOptions(selectedEscalation.status).map(option => (
                    <option 
                      key={option.value} 
                      value={option.value}
                      disabled={option.disabled}
                      style={{
                        color: option.disabled ? '#999' : 'inherit',
                        fontStyle: option.disabled ? 'italic' : 'normal'
                      }}
                    >
                      {option.label}
                    </option>
                  ))}
                </select>  
                <div className="status-helper">
                  <small style={{ color: '#666', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    {selectedEscalation.status === 'Open' && 'Can only be closed from Open status'}
                    {selectedEscalation.status === 'Closed' && 'Can only be reopened from Closed status'}  
                    {selectedEscalation.status === 'Reopened' && 'Can only be closed from Reopened status'}
                  </small>
                </div>
              </div>  
              <div className="form-group">  
                <label>Failure Mode:</label>  
                <select  
                  value={editData.failureMode}  
                  onChange={(e) => handleFailureModeChange(e.target.value)}  
                >  
                  <option value="">Select failure mode</option>  
                  {flatFailureModes.map(mode => (  
                    <option key={`${mode.failure_mode}_${mode.failure_category}`} value={mode.failure_mode}>  
                      {mode.failure_mode}
                    </option>  
                  ))}  
                </select>  
              </div>  
              <div className="form-group">  
                <label>Failure Category:</label>  
                <input  
                  type="text"  
                  value={editData.failureCategory}  
                  readOnly  
                  className="readonly-input"  
                />  
              </div>  
              <div className="form-group">  
                <label>Analysis Notes:</label>  
                <textarea  
                  value={editData.technicianNotes}  
                  onChange={(e) => setEditData({...editData, technicianNotes: e.target.value})}  
                  rows="4"  
                  placeholder="Enter your analysis, findings, and recommendations..."
                />  
              </div>  
              <div className="button-group">  
                <button className="btn-secondary" onClick={() => setIsEditMode(false)}>  
                  Cancel  
                </button>  
                <button 
                  className="btn-primary" 
                  onClick={handleUpdate}
                  disabled={editData.status && !isValidStatusTransition(selectedEscalation.status, editData.status)}
                >  
                  Save Analysis  
                </button>  
              </div>  
            </div>  
          ) : (  
            <div className="analysis-display">  
              <div className="info-grid">  
                <div className="info-item">  
                  <label>Current Status:</label>  
                  <span className={`status ${selectedEscalation.status?.toLowerCase()}`}>
                    {getStatusIcon(selectedEscalation.status)} {selectedEscalation.status || 'Unknown'}
                  </span>
                </div>
                <div className="info-item">  
                  <label>Current Failure Mode:</label>  
                  <span>{selectedEscalation.current_failure_mode || 'Not assigned'}</span>  
                </div>  
                <div className="info-item">  
                  <label>Failure Category:</label>  
                  <span>{selectedEscalation.current_failure_category || 'Not assigned'}</span>  
                </div>  
                <div className="info-item full-width">  
                  <label>Latest Analysis Notes:</label>  
                  <p>{selectedEscalation.latest_technician_notes || 'No analysis notes added yet'}</p>  
                </div>  
              </div>  
            </div>
          )}  
        </div>  
      </div>  
    </div>
  );
};

export default DetailView;