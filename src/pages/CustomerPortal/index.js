import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import api from '../../services/api';
import { useToast } from '../../components/Toast';
import { useAuth } from '../../contexts/AuthContext';
import { 
  faBarcode, 
  faTrash, 
  faUpload, 
  faCheckCircle, 
  faSearch, 
  faSpinner,
  faFileAlt,
  faCamera,
  faExclamationTriangle,
  faTicketAlt,
  faClipboardList,
  faEdit,
  faFile,
  faImage,
  faUser,
  faUserTie,
  faReply,
  faClock,
  faHistory,
  faInfoCircle,
  faDesktop,
  faSync,
  faDownload,
  faEye
} from '@fortawesome/free-solid-svg-icons';
import '../../assets/css/customerPortal.css';

const CustomerPortal = () => {
  const { success, error, warning } = useToast();
  const { user } = useAuth();
  const [mode, setMode] = useState(null); // null, 'submit', 'track'
  const [formData, setFormData] = useState({
    customerName: '',
    jiraTicketNumber: '',
    problemDescription: '',
    projectName: '',
    amdPartNumber: '',
    evt2SkuDescription: '',
    chassisSN: '',
    fwBmcVersion: '',
    osVersion: '',
    biosVersion: '',
    pcbaSN: '',
    cpuP0SN: '',
    cpuP1SN: '',
    errorCount: 1,
    alreadyUploadedToJira: null // Changed to null (no default selection)
  });
  const [errors, setErrors] = useState([{
    problemIsolation: '',
    errorLogType: 'file',
    errorLogText: '',
    errorLogFiles: [],
    defectivePhotos: []
  }]);
  const [amdPartNumbers, setAmdPartNumbers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [trackingTicketId, setTrackingTicketId] = useState('');
  const [trackingResult, setTrackingResult] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [timelineData, setTimelineData] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isLoadingBuildData, setIsLoadingBuildData] = useState(false);
  const [buildDataMessage, setBuildDataMessage] = useState('');
  const [userTickets, setUserTickets] = useState([]);
  const [costCenterTickets, setCostCenterTickets] = useState([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  const [isLoadingCostCenterTickets, setIsLoadingCostCenterTickets] = useState(false);
  const [showClosedUserTickets, setShowClosedUserTickets] = useState(false);
  const [showClosedCostCenterTickets, setShowClosedCostCenterTickets] = useState(false);
  
  // Auto-refresh interval reference
  const refreshIntervalRef = useRef(null);

  // State to track if chassis SN has been filled and build data fetched
  const [showSystemFields, setShowSystemFields] = useState(false);

  useEffect(() => {
    fetchAmdPartNumbers();
  }, []);

  // Set customer name from user profile when user data is available
  useEffect(() => {
    if (user && user.full_name) {
      setFormData(prev => ({
        ...prev,
        customerName: user.full_name
      }));
    }
  }, [user]);

  // Fetch tickets when track mode is activated
  useEffect(() => {
    if (mode === 'track' && user) {
      fetchUserTickets();
    }
  }, [mode, user]);

  useEffect(() => {
    const newErrors = Array(parseInt(formData.errorCount) || 1).fill(null).map((_, index) => 
      errors[index] || { 
        problemIsolation: '', 
        errorLogType: 'file',
        errorLogText: '',
        errorLogFiles: [], 
        defectivePhotos: [] 
      }
    );
    setErrors(newErrors);
  }, [formData.errorCount]);

  // Auto-refresh functionality
  useEffect(() => {
    if (trackingResult && autoRefresh && mode === 'track') {
      refreshIntervalRef.current = setInterval(() => {
        refreshTrackingData();
      }, 10000);

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [trackingResult, autoRefresh, mode, trackingTicketId]);

  const fetchAmdPartNumbers = async () => {
    try {
      const data = await api.getAmdPartNumbers();
      setAmdPartNumbers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching AMD part numbers:', error);
      setAmdPartNumbers([]);
    }
  };
  
  const fetchBuildData = async (chassisSN) => {
    if (!chassisSN || chassisSN.trim() === '') {
      setBuildDataMessage('');
      setShowSystemFields(false);
      return;
    }
  
    setIsLoadingBuildData(true);
    setBuildDataMessage('');
  
    try {
      const buildData = await api.getBuildData(chassisSN);
      
      setFormData(prev => ({
        ...prev,
        fwBmcVersion: buildData.bmc_version || prev.fwBmcVersion,
        biosVersion: buildData.bios_version || prev.biosVersion,
        pcbaSN: buildData.mb_sn || prev.pcbaSN, // Auto-populate PCBA SN from mb_sn
        cpuP0SN: buildData.cpu_p0_sn || prev.cpuP0SN,
        cpuP1SN: buildData.cpu_p1_sn || prev.cpuP1SN
      }));
  
      const populatedFields = [];
      if (buildData.bmc_version) populatedFields.push('FW/BMC Version');
      if (buildData.bios_version) populatedFields.push('BIOS Version');
      if (buildData.mb_sn) populatedFields.push('PCBA SN'); // Add PCBA SN to populated fields
      if (buildData.cpu_p0_sn) populatedFields.push('CPU P0 S/N');
      if (buildData.cpu_p1_sn) populatedFields.push('CPU P1 S/N');
  
      if (populatedFields.length > 0) {
        setBuildDataMessage(`✓ Auto-populated: ${populatedFields.join(', ')}`);
      } else {
        setBuildDataMessage('⚠ No build data found. Please enter manually.');
      }
      
      // Show the system fields after data is fetched
      setShowSystemFields(true);
    } catch (error) {
      console.error('Error fetching build data:', error);
      if (error.response?.status === 404) {
        setBuildDataMessage('⚠ No build data found for this chassis. Please enter manually.');
      } else {
        setBuildDataMessage('⚠ Error fetching build data. Please enter manually.');
      }
      // Still show the fields even if no data found
      setShowSystemFields(true);
    } finally {
      setIsLoadingBuildData(false);
    }
  };

  // Fetch tickets for the user and their cost center
  const fetchUserTickets = async () => {
    if (!user) return;
    
    setIsLoadingTickets(true);
    try {
      // Fetch user's own tickets
      const userTicketsData = await api.getUserTickets(user.email);
      setUserTickets(Array.isArray(userTicketsData) ? userTicketsData : []);

      // Fetch cost center tickets if user has cost center number
      if (user.cost_center_number) {
        const costCenterTicketsData = await api.getCostCenterTickets(user.cost_center_number);
        setCostCenterTickets(Array.isArray(costCenterTicketsData) ? costCenterTicketsData : []);
      } else {
        setCostCenterTickets([]);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
      setUserTickets([]);
      setCostCenterTickets([]);
    } finally {
      setIsLoadingTickets(false);
    }
  };
  
  const handleFileChange = async (index, type, files) => {
    if (!files || files.length === 0) return;
  
    const fileArray = Array.from(files);
    const newErrors = [...errors];
    
    for (const file of fileArray) {
      try {
        const data = await api.uploadEscalationFile(file);
        const fileInfo = {
          name: data.originalName,
          path: data.filePath,
          size: data.size,
          type: data.mimeType
        };
        
        if (type === 'errorLog') {
          newErrors[index].errorLogFiles.push(fileInfo);
        } else {
          newErrors[index].defectivePhotos.push(fileInfo);
        }
      } catch (error) {
        console.error('Error uploading file:', error);
      }
    }
    
    setErrors(newErrors);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
  
    setIsSubmitting(true);
  
    try {
      const data = await api.submitCustomerEscalation({
        ...formData,
        errors: formData.alreadyUploadedToJira ? [] : errors.map(e => ({
          problemIsolation: e.problemIsolation,
          errorLogType: e.errorLogType,
          errorLogText: e.errorLogText,
          errorLogFiles: e.errorLogFiles,
          defectivePhotos: e.defectivePhotos
        }))
      });
      setSubmissionResult(data);
      resetForm();
    } catch (error) {
      console.error('Error submitting escalation:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleTrack = async () => {
    if (!trackingTicketId) {
      setFormErrors({ tracking: 'Please enter a ticket ID' });
      return;
    }
  
    setIsTracking(true);
    setFormErrors({});
    
    try {
      const data = await api.trackEscalation(trackingTicketId);
      setTrackingResult(data);
      setTimelineData(data.timeline);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error tracking escalation:', error);
      if (error.response?.status === 404) {
        setFormErrors({ tracking: 'Ticket not found. Please check the ticket ID and try again.' });
      } else {
        setFormErrors({ tracking: 'Failed to track escalation. Please try again.' });
      }
      setTrackingResult(null);
    } finally {
      setIsTracking(false);
    }
  };
  
  const refreshTrackingData = async () => {
    if (!trackingTicketId) return;
    
    try {
      const data = await api.trackEscalation(trackingTicketId);
      setTrackingResult(data);
      setTimelineData(data.timeline);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };
  
  const handleRespondToRequest = async (requestId) => {
    if (!responseText.trim() && selectedFiles.length === 0) {
      warning('Please provide a response or upload files');
      return;
    }
  
    setIsSubmittingResponse(true);
  
    try {
      const formData = new FormData();
      formData.append('parentTimelineId', requestId);
      formData.append('responseText', responseText);
      formData.append('customerName', trackingResult.customer_name);
  
      selectedFiles.forEach(file => {
        formData.append('files', file);
      });
  
      await api.submitCustomerResponse(trackingTicketId, formData);
      success('Response submitted successfully!');
      setResponseText('');
      setSelectedFiles([]);
      refreshTrackingData();
    } catch (error) {
      console.error('Error submitting response:', error);
      error('Failed to submit response');
    } finally {
      setIsSubmittingResponse(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => ({ ...prev, [name]: newValue }));
    setFormErrors(prev => ({ ...prev, [name]: '' }));

    if (name === 'amdPartNumber' && value) {
      const selected = amdPartNumbers.find(p => p.amd_part_number === value);
      if (selected) {
        setFormData(prev => ({
          ...prev,
          evt2SkuDescription: selected.evt2_sku_description
        }));
      }
    }

    // Reset error count when Jira upload status changes
    if (name === 'alreadyUploadedToJira') {
      setFormData(prev => ({
        ...prev,
        errorCount: 1
      }));
    }

    // Fetch build data when chassis SN is entered
    if (name === 'chassisSN' && value && value.length >= 3) {
      const timeoutId = setTimeout(() => {
        fetchBuildData(value);
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  };

  const handleErrorChange = (index, field, value) => {
    const newErrors = [...errors];
    newErrors[index][field] = value;
    setErrors(newErrors);
    setFormErrors(prev => ({ ...prev, [`error_${index}_${field}`]: '' }));
  };

  const renderFileIcon = (fileName, mimeType) => {
    if (mimeType && mimeType.startsWith('image/')) {
      return <FontAwesomeIcon icon={faImage} className="file-icon image" />;
    }
    
    const extension = fileName.split('.').pop().toLowerCase();
    switch (extension) {
      case 'pdf':
        return <FontAwesomeIcon icon={faFileAlt} className="file-icon pdf" />;
      case 'doc':
      case 'docx':
        return <FontAwesomeIcon icon={faFileAlt} className="file-icon doc" />;
      case 'txt':
      case 'log':
        return <FontAwesomeIcon icon={faFileAlt} className="file-icon txt" />;
      default:
        return <FontAwesomeIcon icon={faFile} className="file-icon default" />;
    }
  };

  const handleRemoveFile = (errorIndex, fileType, fileIndex) => {
    const newErrors = [...errors];
    
    if (fileType === 'errorLog') {
      newErrors[errorIndex].errorLogFiles.splice(fileIndex, 1);
    } else if (fileType === 'defectivePhoto') {
      newErrors[errorIndex].defectivePhotos.splice(fileIndex, 1);
    }
    
    setErrors(newErrors);
  };

  const validateForm = () => {
    const newFormErrors = {};
    const requiredFields = [
      'customerName', 'problemDescription', 'projectName', 'amdPartNumber',
      'chassisSN', 'fwBmcVersion', 'osVersion', 'biosVersion', 'pcbaSN'
    ];

    for (const field of requiredFields) {
      if (!formData[field]) {
        newFormErrors[field] = `${field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} is required`;
      }
    }

    // Only validate error details if not uploaded to Jira
    if (!formData.alreadyUploadedToJira) {
      for (let i = 0; i < errors.length; i++) {
        if (!errors[i].problemIsolation) {
          newFormErrors[`error_${i}_problemIsolation`] = `Problem isolation for error ${i + 1} is required`;
        }
        
        if (errors[i].defectivePhotos.length === 0) {
          newFormErrors[`error_${i}_defectivePhoto`] = `Please upload at least one defective photo for error ${i + 1}`;
        }
      }
    }

    setFormErrors(newFormErrors);
    return Object.keys(newFormErrors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      customerName: user?.full_name || '',
      jiraTicketNumber: '',
      problemDescription: '',
      projectName: '',
      amdPartNumber: '',
      evt2SkuDescription: '',
      chassisSN: '',
      fwBmcVersion: '',
      osVersion: '',
      biosVersion: '',
      pcbaSN: '',
      cpuP0SN: '',
      cpuP1SN: '',
      errorCount: 1,
      alreadyUploadedToJira: null
    });
    setErrors([{ 
      problemIsolation: '', 
      errorLogType: 'file',
      errorLogText: '',
      errorLogFiles: [], 
      defectivePhotos: [] 
    }]);
    setFormErrors({});
    setBuildDataMessage('');
    setShowSystemFields(false);
  };

  const renderTimelineEntry = (entry, level = 0) => {
    const getTimelineIcon = (type, actorType) => {
      switch (type) {
        case 'initial_submission':
          return <FontAwesomeIcon icon={faClipboardList} className="timeline-icon initial" />;
        case 'technician_request':
          return <FontAwesomeIcon icon={faUserTie} className="timeline-icon technician" />;
        case 'customer_response':
          return <FontAwesomeIcon icon={faReply} className="timeline-icon customer" />;
        case 'technician_update':
          return <FontAwesomeIcon icon={faEdit} className="timeline-icon technician" />;
        case 'status_change':
          return <FontAwesomeIcon icon={faHistory} className="timeline-icon status" />;
        default:
          return <FontAwesomeIcon icon={faClock} className="timeline-icon default" />;
      }
    };

    const formatTimelineContent = (entry) => {
      switch (entry.timeline_type) {
        case 'initial_submission':
          return (
            <div className="timeline-content">
              <h4>Initial Escalation Submitted</h4>
              <p>{entry.response_text}</p>
            </div>
          );
        case 'technician_request':
          return (
            <div className="timeline-content">
              <h4>Technician Request - {entry.request_type?.replace('_', ' ').toUpperCase()}</h4>
              <p>{entry.request_message}</p>
              {level === 0 && !entry.children?.length && (
                <div className="response-form">
                  <textarea
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder="Type your response here..."
                    rows="3"
                  />
                  <div className="file-upload">
                    <input
                      type="file"
                      multiple
                      onChange={(e) => setSelectedFiles(Array.from(e.target.files))}
                      style={{ display: 'none' }}
                      id={`response-files-${entry.id}`}
                    />
                    <label htmlFor={`response-files-${entry.id}`} className="upload-btn">
                      <FontAwesomeIcon icon={faUpload} /> Attach Files
                    </label>
                    {selectedFiles.length > 0 && (
                      <span className="file-count">{selectedFiles.length} file(s) selected</span>
                    )}
                  </div>
                  <button
                    className="btn-primary respond-btn"
                    onClick={() => handleRespondToRequest(entry.id)}
                    disabled={isSubmittingResponse}
                  >
                    {isSubmittingResponse ? 'Submitting...' : 'Submit Response'}
                  </button>
                </div>
              )}
            </div>
          );
        case 'customer_response':
          return (
            <div className="timeline-content">
              <h4>Customer Response</h4>
              {entry.response_text && <p>{entry.response_text}</p>}
              {entry.error_number && <p><strong>Related to Error #{entry.error_number}</strong></p>}
            </div>
          );
        case 'technician_update':
          return (
            <div className="timeline-content">
              <h4>Technician Analysis Update</h4>
              {entry.old_status && entry.new_status && entry.old_status !== entry.new_status && (
                <p><strong>Status Changed:</strong> From <span className="status-old">{entry.old_status}</span> to <span className="status-new">{entry.new_status}</span></p>
              )}
              {entry.failure_mode && <p><strong>Failure Mode:</strong> {entry.failure_mode}</p>}
              {entry.failure_category && <p><strong>Category:</strong> {entry.failure_category}</p>}
              {entry.technician_notes && <p><strong>Notes:</strong> {entry.technician_notes}</p>}
            </div>
          );
        case 'status_change':
          return (
            <div className="timeline-content">
              <h4>Status Changed</h4>
              <p>From <span className="status-old">{entry.old_status}</span> to <span className="status-new">{entry.new_status}</span></p>
            </div>
          );
        default:
          return <div className="timeline-content"><p>Unknown timeline entry</p></div>;
      }
    };

    return (
      <div key={entry.id} className={`timeline-entry level-${level}`}>
        <div className="timeline-item">
          <div className="timeline-marker">
            {getTimelineIcon(entry.timeline_type, entry.actor_type)}
          </div>
          <div className="timeline-card">
            <div className="timeline-header">
              <div className="timeline-actor">
                <FontAwesomeIcon icon={entry.actor_type === 'customer' ? faUser : faUserTie} />
                <span>{entry.actor_name}</span>
              </div>
              <div className="timeline-date">
                {new Date(entry.created_at).toLocaleString()}
              </div>
            </div>
            {formatTimelineContent(entry)}
            {entry.attachments && entry.attachments.length > 0 && (
              <div className="timeline-attachments">
                <h5>Attachments:</h5>
                <div className="attachment-grid">
                  {entry.attachments.map(file => (
                    <div key={file.id} className="attachment-item">
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
                            onClick={() => window.open(`api.getTimelineFileUrl(file.file_path)`, '_blank')}
                          >
                            <FontAwesomeIcon icon={faEye} />
                          </button>
                        )}
                        <a 
                          href={`api.getTimelineFileUrl(file.file_path)`}
                          download={file.file_name}
                          className="btn-download"
                        >
                          <FontAwesomeIcon icon={faDownload} />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        {entry.children && entry.children.length > 0 && (
          <div className="timeline-children">
            {entry.children.map(child => renderTimelineEntry(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // Main selection screen
  if (!mode) {
    return (
      <div className="customer-portal">
        <div className="portal-header">
          <h1>Customer Line Fallout - Customer Portal</h1>
          <p className="portal-subtitle">Select an option to proceed</p>
        </div>
        
        <div className="portal-cards">
          <div className="portal-card" onClick={() => setMode('submit')}>
            <div className="card-icon">
              <FontAwesomeIcon icon={faClipboardList} size="3x" />
            </div>
            <h2>Submit CLF</h2>
            <p>Report a new issue or problem with your system</p>
            <button className="card-btn">Get Started</button>
          </div>
          
          <div className="portal-card" onClick={() => setMode('track')}>
            <div className="card-icon">
              <FontAwesomeIcon icon={faTicketAlt} size="3x" />
            </div>
            <h2>Track & Respond</h2>
            <p>Check status and respond to technician requests</p>
            <button className="card-btn">Track Now</button>
          </div>
        </div>
      </div>
    );
  }

  // Success screen
  if (submissionResult) {
    return (
      <div className="customer-portal">
        <div className="submission-success">
          <FontAwesomeIcon icon={faCheckCircle} size="4x" className="success-icon" />
          <h2>Escalation Submitted Successfully!</h2>
          <div className="ticket-info">
            <p><strong>Ticket ID:</strong> {submissionResult.ticketId}</p>
            <p><strong>Created Date:</strong> {new Date(submissionResult.createdDate).toLocaleDateString('en-US')}</p>
          </div>
          <p className="info-text">
            Please save your ticket ID for tracking purposes. 
            Our technicians will review your escalation and may request additional information.
          </p>
          <div className="button-group">
            <button 
              className="btn-primary"
              onClick={() => {
                setSubmissionResult(null);
                setMode('submit');
              }}
            >
              Submit Another Escalation
            </button>
            <button 
              className="btn-secondary"
              onClick={() => {
                setSubmissionResult(null);
                setMode(null);
              }}
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="customer-portal">
      <div className="portal-header">
        <div className="header-content">
          <h1>{mode === 'submit' ? 'Submit CLF' : 'Track & Respond'}</h1>
          <button className="btn-back" onClick={() => setMode(null)}>
            ← Back to Home
          </button>
        </div>
      </div>
  
      {mode === 'submit' ? (
        <form className="escalation-form" onSubmit={handleSubmit}>
          <div className="form-section">
            <h3>Customer Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Customer Name <span className="required">*</span></label>
                <input
                  type="text"
                  name="customerName"
                  value={formData.customerName}
                  readOnly
                  className={`readonly ${formErrors.customerName ? 'error' : ''}`}
                  title="Customer name is automatically populated from your profile"
                />
                {formErrors.customerName && (
                  <span className="field-error">{formErrors.customerName}</span>
                )}
              </div>
              <div className="form-group">
                <label>Jira Ticket Number <span className="optional">(Optional)</span></label>
                <input
                  type="text"
                  name="jiraTicketNumber"
                  value={formData.jiraTicketNumber}
                  onChange={handleInputChange}
                  placeholder="Enter Jira Ticket No."
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group full-width">
                <label>Project Name <span className="required">*</span></label>
                <select
                  name="projectName"
                  value={formData.projectName}
                  onChange={handleInputChange}
                  className={formErrors.projectName ? 'error' : ''}
                >
                  <option value="">Select Project</option>
                  <option value="Weisshorn SP7">Weisshorn SP7</option>
                  <option value="Weisshorn SP8">Weisshorn SP8</option>
                  <option value="Turin">Turin</option>
                </select>
                {formErrors.projectName && (
                  <span className="field-error">{formErrors.projectName}</span>
                )}
              </div>
            </div>
            
            <div className="form-group">
              <label>Problem Description <span className="required">*</span></label>
              <textarea
                name="problemDescription"
                value={formData.problemDescription}
                onChange={handleInputChange}
                rows="4"
                className={formErrors.problemDescription ? 'error' : ''}
              />
              {formErrors.problemDescription && (
                <span className="field-error">{formErrors.problemDescription}</span>
              )}
            </div>
          </div>
  
          <div className="form-section">
            <h3>System Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label>AMD Part Number <span className="required">*</span></label>
                <select
                  name="amdPartNumber"
                  value={formData.amdPartNumber}
                  onChange={handleInputChange}
                  className={formErrors.amdPartNumber ? 'error' : ''}
                >
                  <option value="">Select AMD Part Number</option>
                  {Array.isArray(amdPartNumbers) ? amdPartNumbers.map(part => (
                    <option key={part.amd_part_number} value={part.amd_part_number}>
                      {part.amd_part_number}
                    </option>
                  )) : null}
                </select>
                {formErrors.amdPartNumber && (
                  <span className="field-error">{formErrors.amdPartNumber}</span>
                )}
              </div>
              <div className="form-group">
                <label>SKU</label>
                <input
                  type="text"
                  name="evt2SkuDescription"
                  value={formData.evt2SkuDescription}
                  readOnly
                  className="readonly"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Chassis SN <span className="required">*</span></label>
                <input
                  type="text"
                  name="chassisSN"
                  value={formData.chassisSN}
                  onChange={handleInputChange}
                  className={formErrors.chassisSN ? 'error' : ''}
                  placeholder="Click here and scan barcode or type manually"
                />
                {formErrors.chassisSN && (
                  <span className="field-error">{formErrors.chassisSN}</span>
                )}
                {isLoadingBuildData && (
                  <span className="loading-message">
                    <FontAwesomeIcon icon={faSpinner} spin /> Loading build data...
                  </span>
                )}
                {buildDataMessage && (
                  <span className={`build-data-message ${buildDataMessage.startsWith('✓') ? 'success' : 'warning'}`}>
                    {buildDataMessage}
                  </span>
                )}
              </div>
              <div className="form-group">
                <label>OS Version <span className="required">*</span></label>
                <input
                  type="text"
                  name="osVersion"
                  value={formData.osVersion}
                  onChange={handleInputChange}
                  className={formErrors.osVersion ? 'error' : ''}
                />
                {formErrors.osVersion && (
                  <span className="field-error">{formErrors.osVersion}</span>
                )}
              </div>
            </div>

            {/* Hidden system fields that appear after chassis SN is filled */}
            {showSystemFields && (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label>MB SN<span className="required">*</span></label>
                    <input
                      type="text"
                      name="pcbaSN"
                      value={formData.pcbaSN}
                      onChange={handleInputChange}
                      className={formErrors.pcbaSN ? 'error' : ''}
                      placeholder="Click here and scan barcode or type manually"
                    />
                    {formErrors.pcbaSN && (
                      <span className="field-error">{formErrors.pcbaSN}</span>
                    )}
                  </div>
                  <div className="form-group">
                    <label>FW/BMC Version <span className="required">*</span></label>
                    <input
                      type="text"
                      name="fwBmcVersion"
                      value={formData.fwBmcVersion}
                      onChange={handleInputChange}
                      className={formErrors.fwBmcVersion ? 'error' : ''}
                    />
                    {formErrors.fwBmcVersion && (
                      <span className="field-error">{formErrors.fwBmcVersion}</span>
                    )}
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>BIOS Version <span className="required">*</span></label>
                    <input
                      type="text"
                      name="biosVersion"
                      value={formData.biosVersion}
                      onChange={handleInputChange}
                      className={formErrors.biosVersion ? 'error' : ''}
                    />
                    {formErrors.biosVersion && (
                      <span className="field-error">{formErrors.biosVersion}</span>
                    )}
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>CPU P0 S/N <span className="optional">(Optional)</span></label>
                    <input
                      type="text"
                      name="cpuP0SN"
                      value={formData.cpuP0SN}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>CPU P1 S/N <span className="optional">(Optional)</span></label>
                    <input
                      type="text"
                      name="cpuP1SN"
                      value={formData.cpuP1SN}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
  
          <div className="form-section">
            <h3>Error Information</h3>
            
            {/* Simple Jira Upload Question */}
            <div className="form-group">
              <label>Have you already uploaded error details to Jira?</label>
              <div className="radio-group">
                <label className="radio-option">
                  <input
                    type="radio"
                    name="alreadyUploadedToJira"
                    value="false"
                    checked={formData.alreadyUploadedToJira === false}
                    onChange={() => setFormData(prev => ({ ...prev, alreadyUploadedToJira: false }))}
                  />
                  No, I need to provide error details here
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    name="alreadyUploadedToJira"
                    value="true"
                    checked={formData.alreadyUploadedToJira === true}
                    onChange={() => setFormData(prev => ({ ...prev, alreadyUploadedToJira: true }))}
                  />
                  Yes, I have uploaded to Jira
                </label>
              </div>
            </div>

            {/* Conditional Error Details Section - only show when user selects "No" */}
            {formData.alreadyUploadedToJira === false && (
              <>
                <div className="form-group">
                  <label>Number of Errors <span className="required">*</span></label>
                  <input
                    type="number"
                    name="errorCount"
                    value={formData.errorCount}
                    onChange={handleInputChange}
                    min="1"
                    max="10"
                  />
                </div>
    
                {errors.map((error, index) => (
                  <div key={index} className="error-section">
                    <h4>Error {index + 1}</h4>
                    <div className="form-group">
                      <label>1st Level Problem Isolation (Frequency of Failure) <span className="required">*</span></label>
                      <textarea
                        value={error.problemIsolation}
                        onChange={(e) => handleErrorChange(index, 'problemIsolation', e.target.value)}
                        rows="3"
                        className={formErrors[`error_${index}_problemIsolation`] ? 'error' : ''}
                      />
                      {formErrors[`error_${index}_problemIsolation`] && (
                        <span className="field-error">{formErrors[`error_${index}_problemIsolation`]}</span>
                      )}
                    </div>
                    
                    <div className="form-group">
                      <label>Error Log (Optional)</label>
                      <div className="log-input-toggle">
                        <label>
                          <input
                            type="radio"
                            name={`errorLogType_${index}`}
                            value="file"
                            checked={error.errorLogType === 'file'}
                            onChange={() => handleErrorChange(index, 'errorLogType', 'file')}
                          />
                          Upload File(s)
                        </label>
                        <label>
                          <input
                            type="radio"
                            name={`errorLogType_${index}`}
                            value="text"
                            checked={error.errorLogType === 'text'}
                            onChange={() => handleErrorChange(index, 'errorLogType', 'text')}
                          />
                          Paste Text
                        </label>
                      </div>
                      
                      {error.errorLogType === 'file' ? (
                        <div className="file-upload-area">
                          <input
                            type="file"
                            id={`errorLog_${index}`}
                            onChange={(e) => handleFileChange(index, 'errorLog', e.target.files)}
                            multiple
                            accept="*/*"
                            style={{ display: 'none' }}
                          />
                          <label htmlFor={`errorLog_${index}`} className="upload-label">
                            <FontAwesomeIcon icon={faUpload} />
                            <span>Click to upload error log files</span>
                            <small>Any file type accepted</small>
                          </label>
                          
                          {error.errorLogFiles.length > 0 && (
                            <div className="uploaded-files">
                              {error.errorLogFiles.map((file, fileIndex) => (
                                <div key={fileIndex} className="attachment-item">
                                  <div className="attachment-icon">
                                    {renderFileIcon(file.name, file.type)}
                                  </div>
                                  <div className="attachment-info">
                                    <span className="file-name">{file.name}</span>
                                    <span className="file-size">({(file.size / 1024).toFixed(1)} KB)</span>
                                  </div>
                                  <div className="attachment-actions">
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveFile(index, 'errorLog', fileIndex)}
                                      className="btn-remove"
                                    >
                                      <FontAwesomeIcon icon={faTrash} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <textarea
                          value={error.errorLogText}
                          onChange={(e) => handleErrorChange(index, 'errorLogText', e.target.value)}
                          rows="6"
                          placeholder="Paste your error log here..."
                          className={formErrors[`error_${index}_errorLogText`] ? 'error' : ''}
                        />
                      )}
                    </div>
                    
                    <div className="form-group">
                      <label>Defective Photo(s) <span className="required">*</span></label>
                      <div className="file-upload-area">
                        <input
                          type="file"
                          id={`defectivePhoto_${index}`}
                          onChange={(e) => handleFileChange(index, 'defectivePhoto', e.target.files)}
                          accept="image/*"
                          multiple
                          style={{ display: 'none' }}
                        />
                        <label htmlFor={`defectivePhoto_${index}`} className="upload-label">
                          <FontAwesomeIcon icon={faCamera} />
                          <span>Click to upload defective photos</span>
                          <small>Multiple images accepted</small>
                        </label>
                        
                        {error.defectivePhotos.length > 0 && (
                          <div className="uploaded-files">
                            {error.defectivePhotos.map((photo, photoIndex) => (
                              <div key={photoIndex} className="attachment-item">
                                <div className="attachment-icon">
                                  {renderFileIcon(photo.name, photo.type)}
                                </div>
                                <div className="attachment-info">
                                  <span className="file-name">{photo.name}</span>
                                  <span className="file-size">({(photo.size / 1024).toFixed(1)} KB)</span>
                                </div>
                                <div className="attachment-actions">
                                  {photo.type && photo.type.startsWith('image/') && (
                                    <button
                                      type="button"
                                      className="btn-view"
                                      onClick={() => window.open(`api.getEscalationFileUrl(photo.path)`, '_blank')}
                                      title="View image"
                                    >
                                      <FontAwesomeIcon icon={faEye} />
                                    </button>
                                  )}
                                  <a
                                    href={`api.getEscalationFileUrl(photo.path)`}
                                    download={photo.name}
                                    className="btn-download"
                                    title="Download file"
                                  >
                                    <FontAwesomeIcon icon={faDownload} />
                                  </a>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveFile(index, 'defectivePhoto', photoIndex)}
                                    className="btn-remove"
                                  >
                                    <FontAwesomeIcon icon={faTrash} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      {formErrors[`error_${index}_defectivePhoto`] && (
                        <span className="field-error">{formErrors[`error_${index}_defectivePhoto`]}</span>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Message when Jira upload is selected */}
            {formData.alreadyUploadedToJira === true && (
              <div className="jira-message">
                <FontAwesomeIcon icon={faInfoCircle} />
                <span>Error details will be referenced from Jira. No additional error information needed here.</span>
              </div>
            )}
          </div>
  
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => setMode(null)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} spin /> Submitting...
                </>
              ) : (
                'Submit CLF'
              )}
            </button>
          </div>
        </form>
      ) : (
        <div className="tracking-section">
          <div className="tracking-main-layout">
            {/* Center - Search Container */}
            <div className="search-container">
              <div className="search-form">
                <h2>Enter Your Ticket ID</h2>
                <p>Track the status and respond to technician requests</p>
                
                <div className="search-input-group">
                  <input
                    type="text"
                    placeholder="e.g., C-00001"
                    value={trackingTicketId}
                    onChange={(e) => {
                      setTrackingTicketId(e.target.value);
                      setFormErrors({});
                    }}
                    className={formErrors.tracking ? 'error' : ''}
                  />
                  <button 
                    className="btn-primary"
                    onClick={handleTrack}
                    disabled={isTracking}
                  >
                    {isTracking ? (
                      <FontAwesomeIcon icon={faSpinner} spin />
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faSearch} /> Track
                      </>
                    )}
                  </button>
                </div>
                
                {formErrors.tracking && (
                  <div className="error-message">
                    <FontAwesomeIcon icon={faExclamationTriangle} />
                    <span>{formErrors.tracking}</span>
                  </div>
                )}
              </div>
              
              {/* Escalation Results Container */}
              {trackingResult && (
                <div className="escalation-results-container">
                  <div className="tracking-result">
                    {/* Ticket Header */}
                    <div className="escalation-header">
                      <div>
                        <h3>Escalation {trackingResult.ticket_id}</h3>
                        <p className="customer-name">Customer: {trackingResult.customer_name}</p>
                      </div>
                      <div className="escalation-meta">
                        <span className={`status-badge ${trackingResult.status.toLowerCase()}`}>
                          {trackingResult.status}
                        </span>
                        <span className="created-date">
                          Created: {new Date(trackingResult.created_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Auto-refresh controls */}
                    <div className="refresh-controls">
                      <label className="auto-refresh-toggle">
                        <input
                          type="checkbox"
                          checked={autoRefresh}
                          onChange={(e) => setAutoRefresh(e.target.checked)}
                        />
                        Auto-refresh every 10 seconds
                      </label>
                      <button 
                        className="btn-secondary"
                        onClick={refreshTrackingData}
                      >
                        <FontAwesomeIcon icon={faSync} /> Refresh Now
                      </button>
                      {lastUpdated && (
                        <span className="last-updated">
                          Last updated: {lastUpdated.toLocaleTimeString()}
                        </span>
                      )}
                    </div>

                    {/* System Information Section */}
                    <div className="info-section">
                      <h3><FontAwesomeIcon icon={faDesktop} /> System Information</h3>
                      <div className="info-grid">
                        <div className="info-item">
                          <label>Project Name:</label>
                          <span>{trackingResult.project_name}</span>
                        </div>
                        <div className="info-item">
                          <label>AMD Part Number:</label>
                          <span>{trackingResult.amd_part_number}</span>
                        </div>
                        <div className="info-item">
                          <label>SKU:</label>
                          <span>{trackingResult.evt2_sku_description}</span>
                        </div>
                        <div className="info-item">
                          <label>Chassis SN:</label>
                          <span>{trackingResult.chassis_sn}</span>
                        </div>
                        <div className="info-item">
                          <label>MB SN:</label>
                          <span>{trackingResult.pcba_sn}</span>
                        </div>
                        <div className="info-item">
                          <label>CPU P0 S/N:</label>
                          <span>{trackingResult.cpu_p0_sn || 'N/A'}</span>
                        </div>
                        <div className="info-item">
                          <label>CPU P1 S/N:</label>
                          <span>{trackingResult.cpu_p1_sn || 'N/A'}</span>
                        </div>
                        <div className="info-item">
                          <label>BIOS Version:</label>
                          <span>{trackingResult.bios_version}</span>
                        </div>
                        <div className="info-item">
                          <label>FW/BMC Version:</label>
                          <span>{trackingResult.fw_bmc_version}</span>
                        </div>
                        <div className="info-item">
                          <label>OS Version:</label>
                          <span>{trackingResult.os_version}</span>
                        </div>
                        {trackingResult.jira_ticket_number && (
                          <div className="info-item">
                            <label>Jira Ticket:</label>
                            <span>{trackingResult.jira_ticket_number}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Problem Description */}
                    <div className="info-section">
                      <h3><FontAwesomeIcon icon={faExclamationTriangle} /> Problem Description</h3>
                      <div className="problem-description">
                        <p>{trackingResult.problem_description}</p>
                      </div>
                    </div>

                    {/* Timeline */}
                    {timelineData && timelineData.length > 0 && (
                      <div className="timeline-container">
                        <h4><FontAwesomeIcon icon={faClock} /> Timeline</h4>
                        <div className="timeline">
                          {timelineData.map(entry => renderTimelineEntry(entry))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Sidebar - Ticket Panels */}
            <div className="tickets-right-sidebar">
              {/* User's Own Tickets */}
              <div className="ticket-section">
                <div className="section-header">
                  <h3>Your Tickets</h3>
                  <span className="ticket-count">{userTickets.length}</span>
                </div>
                
                {/* Open Tickets - Always Visible */}
                <div className="tickets-subsection">
                  <div className="subsection-header">
                    <h4>Open</h4>
                  </div>
                  <div className="subsection-content">
                    {isLoadingTickets ? (
                      <div className="loading-minimal">Loading...</div>
                    ) : userTickets.filter(t => t.status === 'Open' || t.status === 'Reopened').length === 0 ? (
                      <div className="empty-minimal">No open tickets</div>
                    ) : (
                      <div className="ticket-list-minimal">
                        {userTickets
                          .filter(t => t.status === 'Open' || t.status === 'Reopened')
                          .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
                          .map(ticket => (
                            <div 
                              key={ticket.ticket_id} 
                              className="ticket-item-minimal"
                              onClick={() => {
                                setTrackingTicketId(ticket.ticket_id);
                                handleTrack();
                              }}
                            >
                              <div className="ticket-id-minimal">{ticket.ticket_id}</div>
                              <div className="ticket-project-minimal">{ticket.project_name}</div>
                              <div className="ticket-date-minimal">{new Date(ticket.created_date).toLocaleDateString()}</div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Closed Tickets - Collapsible */}
                <div className="tickets-subsection">
                  <div 
                    className="subsection-header clickable"
                    onClick={() => setShowClosedUserTickets(!showClosedUserTickets)}
                  >
                    <h4>Closed</h4>
                    <span className="expand-icon">{showClosedUserTickets ? '−' : '+'}</span>
                  </div>
                  {showClosedUserTickets && (
                    <div className="subsection-content">
                      {userTickets.filter(t => t.status === 'Closed').length === 0 ? (
                        <div className="empty-minimal">No closed tickets</div>
                      ) : (
                        <div className="ticket-list-minimal">
                          {userTickets
                            .filter(t => t.status === 'Closed')
                            .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
                            .map(ticket => (
                              <div 
                                key={ticket.ticket_id} 
                                className="ticket-item-minimal closed"
                                onClick={() => {
                                  setTrackingTicketId(ticket.ticket_id);
                                  handleTrack();
                                }}
                              >
                                <div className="ticket-id-minimal">{ticket.ticket_id}</div>
                                <div className="ticket-project-minimal">{ticket.project_name}</div>
                                <div className="ticket-date-minimal">{new Date(ticket.created_date).toLocaleDateString()}</div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Cost Center Tickets */}
              <div className="ticket-section">
                <div className="section-header">
                  <h3>Cost Center Tickets</h3>
                  <span className="ticket-count">{costCenterTickets.length}</span>
                </div>
                
                {/* Open Tickets - Always Visible */}
                <div className="tickets-subsection">
                  <div className="subsection-header">
                    <h4>Open</h4>
                  </div>
                  <div className="subsection-content">
                    {!user?.cost_center_number ? (
                      <div className="empty-minimal">No cost center assigned</div>
                    ) : isLoadingCostCenterTickets ? (
                      <div className="loading-minimal">Loading...</div>
                    ) : costCenterTickets.filter(t => t.status === 'Open' || t.status === 'Reopened').length === 0 ? (
                      <div className="empty-minimal">No open tickets</div>
                    ) : (
                      <div className="ticket-list-minimal">
                        {costCenterTickets
                          .filter(t => t.status === 'Open' || t.status === 'Reopened')
                          .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
                          .map(ticket => (
                            <div 
                              key={ticket.ticket_id} 
                              className="ticket-item-minimal"
                              onClick={() => {
                                setTrackingTicketId(ticket.ticket_id);
                                handleTrack();
                              }}
                            >
                              <div className="ticket-id-minimal">{ticket.ticket_id}</div>
                              <div className="ticket-customer-minimal">{ticket.customer_name}</div>
                              <div className="ticket-date-minimal">{new Date(ticket.created_date).toLocaleDateString()}</div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Closed Tickets - Collapsible */}
                <div className="tickets-subsection">
                  <div 
                    className="subsection-header clickable"
                    onClick={() => setShowClosedCostCenterTickets(!showClosedCostCenterTickets)}
                  >
                    <h4>Closed</h4>
                    <span className="expand-icon">{showClosedCostCenterTickets ? '−' : '+'}</span>
                  </div>
                  {showClosedCostCenterTickets && (
                    <div className="subsection-content">
                      {costCenterTickets.filter(t => t.status === 'Closed').length === 0 ? (
                        <div className="empty-minimal">No closed tickets</div>
                      ) : (
                        <div className="ticket-list-minimal">
                          {costCenterTickets
                            .filter(t => t.status === 'Closed')
                            .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
                            .map(ticket => (
                              <div 
                                key={ticket.ticket_id} 
                                className="ticket-item-minimal closed"
                                onClick={() => {
                                  setTrackingTicketId(ticket.ticket_id);
                                  handleTrack();
                                }}
                              >
                                <div className="ticket-id-minimal">{ticket.ticket_id}</div>
                                <div className="ticket-customer-minimal">{ticket.customer_name}</div>
                                <div className="ticket-date-minimal">{new Date(ticket.created_date).toLocaleDateString()}</div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerPortal;
