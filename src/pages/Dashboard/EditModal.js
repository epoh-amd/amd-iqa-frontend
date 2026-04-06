// frontend/src/pages/Dashboard/EditModal.js

import React, { useRef, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Save } from 'lucide-react';
import { generateWeeklyDates, ensurePorTargetsSize } from './utils';

const EditModal = ({
  editMode,
  editData,
  setEditData,
  setEditMode,
  onSave,
  onDateRangeSubmit,
  onStepNext,
  onStepPrev,
  onAddMilestone,
  onUpdateMilestone,
  onRemoveMilestone,
  onKeyDown,
  tableRef
}) => {
  const thStyle = {
    padding: '8px',
    fontWeight: 600,
    fontSize: 13,
    color: '#374151',
    background: '#F9FAFB',
    borderBottom: '1px solid #E5E7EB'
  };
  
  const tdStyle = {
    padding: '6px 8px',
    background: '#fff',
    borderBottom: '1px solid #E5E7EB'
  };
  
  const inputStyle = {
    width: '100%',
    padding: '6px 8px',
    border: '1px solid #D1D5DB',
    borderRadius: '4px',
    fontSize: '14px',
    background: '#F9FAFB'
  };

  // Ensure porTargets is properly sized when step 3 is reached
  useEffect(() => {
    if (editMode.step === 3 && editData.startDate && editData.endDate) {
      const weeks = generateWeeklyDates(editData.startDate, editData.endDate);
      const porTargets = ensurePorTargetsSize(editData.porTargets, editData.startDate, editData.endDate);

      // Only update if the array size is different
      if (!editData.porTargets || editData.porTargets.length !== weeks.length) {
        setEditData(prev => ({ ...prev, porTargets }));
      }
    }
  }, [editMode.step, editData.startDate, editData.endDate, editData.porTargets, setEditData]);

  if (!editMode.type) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
        padding: '24px',
        width: '100%',
        maxWidth: '1024px',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#1F2937',
          marginBottom: '24px'
        }}>
          Edit {editMode.type} Chart Configuration
        </h2>

        {/* Step Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
          {['Date Range', 'Milestones', 'AFE Date', 'Factory Delivery'].map((step, index) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: '500',
                backgroundColor: index <= editMode.step ? '#3B82F6' : '#E5E7EB',
                color: index <= editMode.step ? 'white' : '#6B7280'
              }}>
                {index + 1}
              </div>
              <span style={{
                marginLeft: '8px',
                fontSize: '14px',
                color: index <= editMode.step ? '#2563EB' : '#6B7280',
                fontWeight: index <= editMode.step ? '500' : 'normal'
              }}>
                {step}
              </span>
              {index < 3 && <ChevronRight style={{ margin: '0 8px', color: '#9CA3AF' }} size={16} />}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div style={{ marginBottom: '24px' }}>
          {editMode.step === 0 && (
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Set Program Date Range</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={editData.startDate}
                    onChange={(e) => {
                      setEditData(prev => {
                        const newData = { ...prev, startDate: e.target.value };
                        // Update porTargets array size when date range changes
                        if (newData.startDate && newData.endDate) {
                          newData.porTargets = ensurePorTargetsSize(prev.porTargets, newData.startDate, newData.endDate);
                        }
                        return newData;
                      });
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                    End Date
                  </label>
                  <input
                    type="date"
                    value={editData.endDate}
                    onChange={(e) => {
                      setEditData(prev => {
                        const newData = { ...prev, endDate: e.target.value };
                        // Update porTargets array size when date range changes
                        if (newData.startDate && newData.endDate) {
                          newData.porTargets = ensurePorTargetsSize(prev.porTargets, newData.startDate, newData.endDate);
                        }
                        return newData;
                      });
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {editMode.step === 1 && (
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Define Milestones (select date range for each)</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {editData.milestones.map((milestone, index) => (
                  <div key={index} style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1.5fr 1.5fr auto',
                    gap: '16px',
                    alignItems: 'center',
                    padding: '16px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '6px'
                  }}>
                    <input
                      type="text"
                      placeholder="Milestone Name"
                      value={milestone.name}
                      onChange={(e) => onUpdateMilestone(index, 'name', e.target.value)}
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #D1D5DB',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    />
                    <input
                      type="date"
                      value={milestone.startDate || ''}
                      onChange={(e) => onUpdateMilestone(index, 'startDate', e.target.value)}
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #D1D5DB',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                      title="Start Date"
                    />
                    <input
                      type="date"
                      value={milestone.endDate || ''}
                      onChange={(e) => onUpdateMilestone(index, 'endDate', e.target.value)}
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #D1D5DB',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                      title="End Date"
                    />
                    <button
                      onClick={() => onRemoveMilestone(index)}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: '#EF4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  onClick={onAddMilestone}
                  style={{
                    padding: '12px 16px',
                    backgroundColor: '#10B981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Add Milestone
                </button>
              </div>
            </div>
          )}

          {editMode.step === 2 && (
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Additional Reference Line</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {[
                  { key: 'afeDate', label: 'AFE Date' },
                  { key: 'uuDate', label: 'UU Date' },
                  { key: 'iodDate', label: 'IOD Date' },
                  { key: 'tvDate', label: 'TV Date' }
                ].map(ref => (
                  <div key={ref.key} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <label style={{ minWidth: 120, fontSize: '14px', fontWeight: '500', color: '#374151' }}>{ref.label}</label>
                    <input
                      type="date"
                      value={editData[ref.key] || ''}
                      onChange={e => setEditData(prev => ({ ...prev, [ref.key]: e.target.value }))}
                      style={{
                        width: '100%',
                        maxWidth: '384px',
                        padding: '8px 12px',
                        border: '1px solid #D1D5DB',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}


          {  /*editMode.step === 3 && (
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Set Factory Delivery Qty (by week)</h3>
              <div style={{ overflowX: 'auto', background: '#F3F4F6', borderRadius: 8, padding: 12 }} ref={tableRef}>
                <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '8px', fontWeight: 600, fontSize: 13, color: '#374151', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>Week</th>
                      <th style={{ padding: '8px', fontWeight: 600, fontSize: 13, color: '#374151', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>Factory Delivery Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const weeks = generateWeeklyDates(editData.startDate, editData.endDate);
                      // Ensure porTargets array is properly sized
                      const porTargets = ensurePorTargetsSize(editData.porTargets, editData.startDate, editData.endDate);
                      
                      return weeks.map((week, idx) => (
                        <tr key={week.date}>
                          <td style={{ padding: '6px 8px', fontSize: 13, color: '#374151', background: '#fff', borderBottom: '1px solid #E5E7EB' }}>{week.week} ({week.date})</td>
                          <td style={{ padding: '6px 8px', background: '#fff', borderBottom: '1px solid #E5E7EB' }}>
                            <input
                              type="number"
                              value={porTargets[idx] || ''}
                              onChange={e => {
                                const val = parseInt(e.target.value) || 0;
                                setEditData(prev => {
                                  const newPorTargets = ensurePorTargetsSize(prev.porTargets, prev.startDate, prev.endDate);
                                  newPorTargets[idx] = val;
                                  return { ...prev, porTargets: newPorTargets };
                                });
                              }}
                              onKeyDown={(e) => onKeyDown(e, idx)}
                              style={{
                                width: '100%',
                                padding: '6px 8px',
                                border: '1px solid #D1D5DB',
                                borderRadius: '4px',
                                fontSize: '14px',
                                background: '#F9FAFB'
                              }}
                              data-index={idx}
                            />
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          )*/}

      
          {editMode.step === 3 && (
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
                Set Factory Delivery Qty (by week)
              </h3>

              <div
                style={{ overflowX: 'auto', background: '#F3F4F6', borderRadius: 8, padding: 12 }}
                ref={tableRef}
              >
                <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Week</th>
                      <th style={thStyle}>Smart Hand</th>
                      <th style={thStyle}>Non Smart Hand</th>
                      <th style={thStyle}>Factory Delivery Qty</th>
                    </tr>
                  </thead>

                  <tbody>
                    {(() => {
                      const weeks = generateWeeklyDates(editData.startDate, editData.endDate);

                      const smartTargets = ensurePorTargetsSize(
                        editData.smartTargets || [],
                        editData.startDate,
                        editData.endDate
                      );

                      const nonSmartTargets = ensurePorTargetsSize(
                        editData.nonSmartTargets || [],
                        editData.startDate,
                        editData.endDate
                      );

                      return weeks.map((week, idx) => {
                        const total =
                          (smartTargets[idx] || 0) + (nonSmartTargets[idx] || 0);

                        return (
                          <tr key={week.date}>
                            <td style={tdStyle}>
                              {week.week} ({week.date})
                            </td>

                            {/* Smart Hand */}
                            <td style={tdStyle}>
                              <input
                                type="number"
                                value={smartTargets[idx] || ''}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 0;
                                  setEditData((prev) => {
                                    const arr = ensurePorTargetsSize(
                                      prev.smartTargets || [],
                                      prev.startDate,
                                      prev.endDate
                                    );
                                    arr[idx] = val;
                                    return { ...prev, smartTargets: arr };
                                  });
                                }}
                                style={inputStyle}
                              />
                            </td>

                            {/* Non Smart Hand */}
                            <td style={tdStyle}>
                              <input
                                type="number"
                                value={nonSmartTargets[idx] || ''}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 0;
                                  setEditData((prev) => {
                                    const arr = ensurePorTargetsSize(
                                      prev.nonSmartTargets || [],
                                      prev.startDate,
                                      prev.endDate
                                    );
                                    arr[idx] = val;
                                    return { ...prev, nonSmartTargets: arr };
                                  });
                                }}
                                style={inputStyle}
                              />
                            </td>

                            {/* Auto Total */}
                            <td style={tdStyle}>
                              <input
                                type="number"
                                value={total}
                                readOnly
                                style={{
                                  ...inputStyle,
                                  background: '#E5E7EB',
                                  fontWeight: '600'
                                }}
                              />
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            {editMode.step > 0 && (
              <button
                onClick={onStepPrev}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  backgroundColor: '#6B7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                <ChevronLeft size={16} />
                Previous
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setEditMode({ type: null, step: 0 })}
              style={{
                padding: '8px 16px',
                backgroundColor: '#E5E7EB',
                color: '#374151',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Cancel
            </button>

            {editMode.step === 0 && (
              <button
                onClick={onDateRangeSubmit}
                disabled={!editData.startDate || !editData.endDate}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  backgroundColor: !editData.startDate || !editData.endDate ? '#9CA3AF' : '#3B82F6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: !editData.startDate || !editData.endDate ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              >
                Next
                <ChevronRight size={16} />
              </button>
            )}

            {editMode.step > 0 && editMode.step < 3 && (
              <button
                onClick={onStepNext}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  backgroundColor: '#3B82F6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Next
                <ChevronRight size={16} />
              </button>
            )}

            {editMode.step === 3 && (
              <button
                onClick={onSave}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  backgroundColor: '#10B981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                <Save size={16} />
                Save Details
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditModal;