// frontend/src/pages/EditBuildData/components/QualityIndicatorTableEdit.js
// EXACT LOGIC FROM STARTBUILD - Quality Indicator with Actions based on FPY and Can Rework

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faExclamationTriangle,
  faSave,
  faTools,
  faClock,
  faTimes
} from '@fortawesome/free-solid-svg-icons';

const QualityIndicatorTableEdit = ({
  builds,
  showReview,
  failureModes,
  handleFpyStatusChange,
  handleProblemDescriptionChange,
  handleNumberOfFailuresChange,
  handleFailureModeChange,
  handleCanReworkChange,
  getAllFailureModes,
  getFailureCategoryForMode,
  saving,
  onSaveAsComplete,
  onSaveAndRework
}) => {

  // Helper function to get build reference
  const getBuildReference = (build, buildIndex) => {
    return build.systemInfo?.bmcName || build.systemInfo?.chassisSN || `Build ${buildIndex + 1}`;
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

                {/* FPY Status - Auto-calculated */}
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

                {/* Problem Description - EDITABLE when FPY is Fail */}
                <td>
                  {build.qualityDetails?.fpyStatus === 'Fail' ? (
                    <>
                      <textarea
                        value={build.qualityDetails?.problemDescription || ''}
                        onChange={(e) => handleProblemDescriptionChange(buildIndex, e.target.value)}
                        placeholder="Describe the problem..."
                        rows="3"
                        className={build.errors?.problemDescription ? 'error' : ''}
                      />
                      {build.errors?.problemDescription && (
                        <div className="field-error">{build.errors.problemDescription}</div>
                      )}
                    </>
                  ) : (
                    <span className="not-applicable">N/A (FPY Pass)</span>
                  )}
                </td>

                {/* Number of Failures - EDITABLE when FPY is Fail */}
                <td>
                  {build.qualityDetails?.fpyStatus === 'Fail' ? (
                    <>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={build.qualityDetails?.numberOfFailures || ''}
                        onChange={(e) => handleNumberOfFailuresChange(buildIndex, e.target.value)}
                        placeholder="1-10"
                        className={build.errors?.numberOfFailures ? 'error' : ''}
                      />
                      {build.errors?.numberOfFailures && (
                        <div className="field-error">{build.errors.numberOfFailures}</div>
                      )}
                    </>
                  ) : (
                    <span className="not-applicable">N/A</span>
                  )}
                </td>

                {/* Dynamic Failure Mode Columns - EDITABLE when FPY is Fail */}
                {Array.from({ length: maxFailures }, (_, failureIndex) => {
                  const showFailure = build.qualityDetails?.fpyStatus === 'Fail' &&
                    failureIndex < numberOfFailures;

                  return (
                    <React.Fragment key={`failure-${failureIndex}`}>
                      <td>
                        {showFailure ? (
                          <>
                            <select
                              value={build.qualityDetails?.failureModes?.[failureIndex] || ''}
                              onChange={(e) => handleFailureModeChange(buildIndex, failureIndex, e.target.value)}
                              className={build.errors?.[`failureMode${failureIndex}`] ? 'error' : ''}
                            >
                              <option value="">Select Failure Mode</option>
                              {getAllFailureModes().map((mode, idx) => (
                                <option key={idx} value={mode}>{mode}</option>
                              ))}
                            </select>
                            {build.errors?.[`failureMode${failureIndex}`] && (
                              <div className="field-error">{build.errors[`failureMode${failureIndex}`]}</div>
                            )}
                          </>
                        ) : (
                          <span className="not-applicable">-</span>
                        )}
                      </td>

                      {showReview && (
                        <td>
                          {showFailure && build.qualityDetails?.failureModes?.[failureIndex] ? (
                            <input
                              type="text"
                              value={getFailureCategoryForMode(build.qualityDetails.failureModes[failureIndex])}
                              readOnly
                              className="auto-populated"
                              placeholder="Auto-populated"
                            />
                          ) : (
                            <span className="not-applicable">-</span>
                          )}
                        </td>
                      )}
                    </React.Fragment>
                  );
                })}

                {/* Can Rework - Radio Buttons - EDITABLE when FPY is Fail */}
                <td>
                  {build.qualityDetails?.fpyStatus === 'Fail' ? (
                    <>
                      <div className="rework-options-radio">
                        <label className="radio-label">
                          <input
                            type="radio"
                            name={`canRework-${buildIndex}`}
                            value="Yes, Need to update hardware/PCBA information"
                            checked={build.qualityDetails?.canRework === 'Yes, Need to update hardware/PCBA information'}
                            onChange={(e) => handleCanReworkChange(buildIndex, e.target.value)}
                          />
                          <span>Yes, Need to update hardware/PCBA information</span>
                        </label>
                        <label className="radio-label">
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
                    <span className="not-applicable">N/A</span>
                  )}
                </td>

                {/* Actions Column - EDIT MODE: Always show both Update Build and Save & Rework */}
                <td className="save-actions-cell">
                  <div className="edit-mode-actions" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {/* Always show Update Build button */}
                    <button
                      className="btn-save-build"
                      onClick={() => onSaveAsComplete && onSaveAsComplete(buildIndex)}
                      disabled={saving}
                      title="Update build with current edits"
                    >
                      <FontAwesomeIcon icon={faSave} /> Update Build
                    </button>

                    {/* Always show Save & Rework button */}
                    <button
                      className="btn-save-rework"
                      onClick={() => onSaveAndRework && onSaveAndRework(buildIndex)}
                      disabled={saving || (build.qualityDetails?.fpyStatus === 'Fail' && (!build.qualityDetails.numberOfFailures || !build.qualityDetails.failureModes[0]))}
                      title={build.qualityDetails?.fpyStatus === 'Fail' ? "Save and rework (must fill failure details first)" : "Save and rework"}
                    >
                      <FontAwesomeIcon icon={faTools} /> Save & Rework
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default QualityIndicatorTableEdit;
