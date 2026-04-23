import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave } from '@fortawesome/free-solid-svg-icons';

const ReworkTable = ({ builds, saving, reworkData, setReworkData, onSave, savingIndex, savedIndex }) => {
    const getBuildReference = (build, buildIndex) => {
        return build.systemInfo?.bmcName || `Build ${buildIndex + 1}`;
    };

    const handleChange = (buildIndex, field, value) => {
        setReworkData(prev => ({
            ...prev,
            [buildIndex]: {
                ...prev[buildIndex],
                [field]: value
            }
        }));
    };

    return (
        <div className="builds-table-container">
            <table className="builds-table">

                {/* HEADER */}
                <thead>
                    <tr>
                        <th className="build-reference">Build Reference</th>
                        <th>Rework</th>

                        {/* NOTES COLUMN ONLY LABEL (dynamic visibility handled per row) */}
                        <th>Notes</th>

                        {/*
<th className="save-actions-header">Actions</th>
*/}
                    </tr>
                </thead>

                <tbody>
                    {builds.map((build, buildIndex) => {
                        const status = reworkData[buildIndex]?.status || 'No';

                        return (
                            <tr key={build.id} className="build-row">

                                {/* BUILD */}
                                <td className="build-reference">
                                    {getBuildReference(build, buildIndex)}
                                </td>

                                {/* YES / NO */}
                                <td>
                                    <select
                                        value={status}
                                        onChange={(e) =>
                                            handleChange(buildIndex, 'status', e.target.value)
                                        }
                                    >
                                        <option value="No">No</option>
                                        <option value="Yes">Yes</option>
                                    </select>
                                </td>

                                {/* NOTES COLUMN (ONLY SHOW WHEN YES) */}
                                <td>
                                    {status === 'Yes' ? (
                                        <textarea
                                            value={reworkData[buildIndex]?.notes || ''}
                                            onChange={(e) =>
                                                handleChange(buildIndex, 'notes', e.target.value)
                                            }
                                            placeholder="Enter rework notes..."
                                            rows={3}
                                            className="problem-description"
                                        />
                                    ) : (
                                        <span className="na-field">-</span>
                                    )}
                                </td>

                                {/*
<td className="save-actions-cell">
    <button
        className="btn-save-build"
        onClick={() => onSave(buildIndex)}
        disabled={savingIndex === buildIndex || reworkData[buildIndex]?.status !== 'Yes'}
    >
        <FontAwesomeIcon
            icon={faSave}
            spin={savingIndex === buildIndex}
        />

        {savingIndex === buildIndex ? ' Saving...' : ' Save Rework'}
    </button>

    <div style={{ color: 'green', fontSize: '12px', marginTop: '4px' }}>
        Saved Success.
    </div>
</td>
*/}

                            </tr>
                        );
                    })}
                </tbody>

            </table>
        </div>
    );
};

export default ReworkTable;