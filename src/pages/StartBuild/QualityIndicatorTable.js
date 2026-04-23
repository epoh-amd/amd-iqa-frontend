// frontend/src/pages/StartBuild/QualityIndicatorTable.js

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCheck,
  faExclamationTriangle,
  faSave,
  faTools,
  faClock,
  faTimes
} from '@fortawesome/free-solid-svg-icons';

const QualityIndicatorTable = ({ 
  builds, 
  showReview,
  failureModes,
  handleFpyStatusChange,
  handleProblemDescriptionChange, // NEW handler
  handleNumberOfFailuresChange,
  handleFailureModeChange,
  handleCanReworkChange,
  getAllFailureModes,
  getFailureCategoryForMode,
  saving,
  onSaveAndRework,
  onContinueLater,
  onSaveAsFailed,
  onSaveAsComplete
}) => {
  
  // Helper function to get build reference
  const getBuildReference = (build, buildIndex) => {
    return build.systemInfo?.bmcName || `Build ${buildIndex + 1}`;
  };

  // Generate dynamic columns for failure modes
  const getMaxFailures = () => {
    return Math.max(...builds.map(build => 
      parseInt(build.qualityDetails?.numberOfFailures) || 0
    ), 1);
  };

  const maxFailures = getMaxFailures();

  return (
    <div className="builds-table-container">
      <table className="builds-table">
        <thead>
          <tr>
            <th className="build-reference">Build Reference</th>
            <th>First Pass Yield</th>
            <th>Problem Description</th>
            <th>Number of Failures</th>
            
            {/* Dynamic Failure Mode columns */}
            {Array.from({ length: maxFailures }, (_, i) => (
              <React.Fragment key={`failure-header-${i}`}>
                <th>Failure Mode #{i + 1}</th>
                {showReview && <th>Failure Category #{i + 1}</th>}
              </React.Fragment>
            ))}
            
            <th>Can Rework?</th>
            <th className="save-actions-header">Actions</th>
          </tr>
        </thead>
        <tbody>
          {builds.map((build, buildIndex) => {
            const numberOfFailures = parseInt(build.qualityDetails?.numberOfFailures) || 0;
            
            return (
              <tr key={build.id} className={`build-row ${build.status}`}>
                <td className="build-reference">{getBuildReference(build, buildIndex)}</td>
                
                {/* FPY Status */}
                <td>
                  <select
                    value={build.qualityDetails?.fpyStatus || ''}
                    onChange={(e) => handleFpyStatusChange(buildIndex, e.target.value)}
                    className={`fpy-status ${build.qualityDetails?.fpyStatus?.toLowerCase()} ${build.errors?.fpyStatus ? 'error' : ''}`}
                    disabled // Auto-calculated based on testing
                  >
                    <option value="">Auto-calculated</option>
                    <option value="Pass">Pass</option>
                    <option value="Fail">Fail</option>
                  </select>
                  {build.errors?.fpyStatus && (
                    <div className="field-error">{build.errors.fpyStatus}</div>
                  )}
                </td>
                
                {/* Problem Description - NEW FIELD */}
                <td>
                  {build.qualityDetails?.fpyStatus === 'Fail' ? (
                    <>
                      <textarea
                        value={build.qualityDetails?.problemDescription || ''}
                        onChange={(e) => handleProblemDescriptionChange(buildIndex, e.target.value)}
                        placeholder="Describe the problem..."
                        className={`problem-description ${build.errors?.problemDescription ? 'error' : ''}`}
                        rows="3"
                      />
                      {build.errors?.problemDescription && (
                        <div className="field-error">{build.errors.problemDescription}</div>
                      )}
                    </>
                  ) : (
                    <span className="na-field">N/A</span>
                  )}
                </td>
                
                {/* Number of Failures */}
                <td>
                  {build.qualityDetails?.fpyStatus === 'Fail' ? (
                    <>
                      <input
                        type="number"
                        value={build.qualityDetails?.numberOfFailures || ''}
                        onChange={(e) => handleNumberOfFailuresChange(buildIndex, e.target.value)}
                        min="1"
                        max="10"
                        placeholder="# Failures"
                        className={build.errors?.numberOfFailures ? 'error' : ''}
                      />
                      {build.errors?.numberOfFailures && (
                        <div className="field-error">{build.errors.numberOfFailures}</div>
                      )}
                    </>
                  ) : (
                    <span className="na-field">N/A</span>
                  )}
                </td>
                
                {/* Dynamic Failure Mode columns */}
                {Array.from({ length: maxFailures }, (_, failureIndex) => (
                  <React.Fragment key={`failure-${buildIndex}-${failureIndex}`}>
                    {/* Failure Mode */}
                    <td>
                      {build.qualityDetails?.fpyStatus === 'Fail' && failureIndex < numberOfFailures ? (
                        <>
                          <select
                            value={build.qualityDetails?.failureModes?.[failureIndex] || ''}
                            onChange={(e) => handleFailureModeChange(buildIndex, failureIndex, e.target.value)}
                            className={build.errors?.[`failureMode${failureIndex}`] ? 'error' : ''}
                          >
                            <option value="">Select Failure Mode</option>
                            {getAllFailureModes().map(mode => (
                              <option key={mode} value={mode}>{mode}</option>
                            ))}
                          </select>
                          {build.errors?.[`failureMode${failureIndex}`] && (
                            <div className="field-error">{build.errors[`failureMode${failureIndex}`]}</div>
                          )}
                        </>
                      ) : (
                        <span className="na-field">N/A</span>
                      )}
                    </td>
                    
                    {/* Failure Category (shown only when showReview is true) */}
                    {showReview && (
                      <td>
                        {build.qualityDetails?.fpyStatus === 'Fail' && failureIndex < numberOfFailures ? (
                          <input
                            type="text"
                            value={build.qualityDetails?.failureCategories?.[failureIndex] || ''}
                            readOnly
                            className="auto-populated"
                            placeholder="Auto-populated"
                          />
                        ) : (
                          <span className="na-field">N/A</span>
                        )}
                      </td>
                    )}
                  </React.Fragment>
                ))}
                
                {/* Can Rework */}
                <td>
                  {build.qualityDetails?.fpyStatus === 'Fail' ? (
                    <>
                      <div className="radio-group">
                        <label>
                          <input
                            type="radio"
                            name={`canRework-${buildIndex}`}
                            value="Yes, Need to update hardware/PCBA information"
                            checked={build.qualityDetails?.canRework === 'Yes, Need to update hardware/PCBA information'}
                            onChange={(e) => handleCanReworkChange(buildIndex, e.target.value)}
                          />
                          <span>Yes, Need to update hardware/PCBA information</span>
                        </label>
                        <label>
                          <input
                            type="radio"
                            name={`canRework-${buildIndex}`}
                            value="No, mark this build as a failed build"
                            checked={build.qualityDetails?.canRework === 'No, mark this build as a failed build'}
                            onChange={(e) => handleCanReworkChange(buildIndex, e.target.value)}
                          />
                          <span>No, mark this build as a failed build</span>
                        </label>
                      </div>
                      {build.errors?.canRework && (
                        <div className="field-error">{build.errors.canRework}</div>
                      )}
                    </>
                  ) : (
                    <span className="na-field">N/A</span>
                  )}
                </td>
                
                {/* Actions Column */}
                <td className="save-actions-cell">
                  {build.qualityDetails?.fpyStatus === 'Pass' ? (
                    // FPY Pass - Save as Complete
                    <button 
                      className="btn-save-build"
                      onClick={() => onSaveAsComplete && onSaveAsComplete(buildIndex)}
                      disabled={saving || build.status === 'success'}
                      title="Save as complete build"
                    >
                      <FontAwesomeIcon icon={faSave} /> Save the Build
                    </button>
                  ) : build.qualityDetails?.fpyStatus === 'Fail' ? (
                    // FPY Fail - Dynamic buttons based on can rework selection
                    <div className="fail-actions">
                      {build.qualityDetails?.canRework === 'Yes, Need to update hardware/PCBA information' ? (
                        <button 
                          className="btn-save-rework"
                          onClick={() => onSaveAndRework && onSaveAndRework(buildIndex)}
                          disabled={saving || !build.qualityDetails.numberOfFailures || !build.qualityDetails.failureModes[0]}
                          title="Save build and enter rework mode"
                        >
                          <FontAwesomeIcon icon={faTools} /> Save & Rework
                        </button>
                      ) : build.qualityDetails?.canRework === 'No, mark this build as a failed build' ? (
                        <div className="fail-save-options">
                          <button 
                            className="btn-continue-later"
                            onClick={() => onContinueLater && onContinueLater(buildIndex)}
                            disabled={saving}
                            title="Save progress and continue later"
                          >
                            <FontAwesomeIcon icon={faClock} /> Continue Later
                          </button>
                          <button 
                            className="btn-save-failed"
                            onClick={() => onSaveAsFailed && onSaveAsFailed(buildIndex)}
                            disabled={saving}
                            title="Save as failed build"
                          >
                            <FontAwesomeIcon icon={faTimes} /> Save as Failed
                          </button>
                        </div>
                      ) : (
                        <span className="select-option-message">
                          <FontAwesomeIcon icon={faExclamationTriangle} />
                          Please select can rework option
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="calculate-fpy-message">
                      <FontAwesomeIcon icon={faExclamationTriangle} />
                      Complete testing to calculate FPY
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default QualityIndicatorTable;