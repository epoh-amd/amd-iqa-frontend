import React from 'react';
import api from '../../services/api';
import MaterialWaiverSection from './MaterialWaiverSection';
import ProcessWaiverSection from './ProcessWaiverSection';
import TestWaiverSection from './TestWaiverSection';

const RequestorInput = ({ value, onChange, showNotFoundMessage = false }) => {
  const [suggestions, setSuggestions] = React.useState([]);
  const [open, setOpen] = React.useState(false);
  const [noResults, setNoResults] = React.useState(false);
  const [dropPos, setDropPos] = React.useState({ top: 0, left: 0, width: 0 });
  const debounce = React.useRef(null);
  const inputRef = React.useRef(null);
  const wrapRef = React.useRef(null);
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  React.useEffect(() => {
    const handler = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) { setOpen(false); setNoResults(false); } };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleChange = (val) => {
    onChange(val);
    clearTimeout(debounce.current);
    if (!val.trim()) { setSuggestions([]); setOpen(false); setNoResults(false); return; }
    debounce.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API_URL}/users/search-email?q=${encodeURIComponent(val)}`);
        const data = await res.json();
        setSuggestions(data);
        if (inputRef.current) {
          const rect = inputRef.current.getBoundingClientRect();
          setDropPos({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX, width: rect.width });
        }
        setNoResults(data.length === 0);
        setOpen(true);
      } catch { setSuggestions([]); setOpen(false); setNoResults(false); }
    }, 250);
  };

  const select = (row) => {
    onChange(row.full_name || row.email);
    setSuggestions([]);
    setOpen(false);
    setNoResults(false);
  };

  return (
    <div ref={wrapRef} style={{ position: 'relative', flex: 1 }}>
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => {
          if (suggestions.length > 0 && inputRef.current) {
            const rect = inputRef.current.getBoundingClientRect();
            setDropPos({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX, width: rect.width });
            setOpen(true);
          }
        }}
        style={{ width: '100%', boxSizing: 'border-box' }}
      />
      {open && suggestions.length > 0 && (
        <ul style={{
          position: 'fixed', top: dropPos.top, left: dropPos.left, width: dropPos.width, zIndex: 9999,
          background: '#fff', border: '1px solid #ccc', borderRadius: '4px',
          margin: '2px 0 0', padding: 0, listStyle: 'none', maxHeight: '200px', overflowY: 'auto',
          boxShadow: '0 4px 12px rgba(0,0,0,0.12)'
        }}>
          {suggestions.map((row, i) => (
            <li
              key={i}
              onMouseDown={() => select(row)}
              style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0', fontSize: '13px' }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
            >
              <span style={{ fontWeight: 500 }}>{row.full_name}</span>
              {row.email && <span style={{ color: '#888', marginLeft: '8px', fontSize: '12px' }}>{row.email}</span>}
            </li>
          ))}
        </ul>
      )}
      {showNotFoundMessage && noResults && value.trim() && (
        <div style={{
          marginTop: '4px', fontSize: '12px', color: '#c62828',
          lineHeight: '1.5'
        }}>
          Name not found, please email <a href="mailto:iqadashboard.support@amd.com" style={{ color: '#1a73e8' }}>iqadashboard.support@amd.com</a> to get the user access to this PDQD dashboard.
        </div>
      )}
    </div>
  );
};

const MultiSelectDropdown = ({ options, value = [], onChange, placeholder = 'Select...' }) => {
  const [open, setOpen] = React.useState(false);
  const [dropPos, setDropPos] = React.useState({ top: 0, left: 0, width: 0 });
  const triggerRef = React.useRef(null);
  const ref = React.useRef(null);

  React.useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpen = () => {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropPos({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX, width: rect.width });
    }
    setOpen(v => !v);
  };

  const toggle = (item) => {
    const next = value.includes(item) ? value.filter(v => v !== item) : [...value, item];
    onChange(next);
  };

  const displayText = value.length === 0 ? placeholder : value.join(', ');

  return (
    <div ref={ref} style={{ position: 'relative', flex: 1, minWidth: 0 }}>
      <div ref={triggerRef} onClick={handleOpen} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '6px 10px', border: '1px solid #ccc', borderRadius: '4px',
        background: '#fff', cursor: 'pointer', fontSize: '13px',
      }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayText}</span>
        <span style={{ marginLeft: '8px', flexShrink: 0 }}>&#9660;</span>
      </div>
      {open && (
        <div style={{
          position: 'fixed', top: dropPos.top, left: dropPos.left, width: dropPos.width,
          zIndex: 9999, background: '#fff', border: '1px solid #ccc', borderRadius: '4px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)', maxHeight: '200px', overflowY: 'scroll',
        }}>
          {options.map(item => (
            <label key={item} style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 12px', cursor: 'pointer', fontSize: '13px',
              borderBottom: '1px solid #f0f0f0', width: 'auto', margin: 0
            }}
              onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'}
              onMouseLeave={e => e.currentTarget.style.background = '#fff'}
            >
              <input type="checkbox" checked={value.includes(item)} onChange={() => toggle(item)} style={{ cursor: 'pointer' }} />
              {item}
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

const WaiverFormView = ({
  emailSentBanner, setEmailSentBanner,
  approverEditMode, approverAmendMode, requestorEditMode, rejectedEditMode,
  navigate, setShowForm, setActiveTab, fetchMyForms, setRejectedEditMode, handleBackToList,
  waiverStatus, formData, setFormData, handleChange, handleSubmit,
  subcontractors, assemblyLevels,
  waiverId, sendingEmailIdx, setSendingEmailIdx, emailBannerTimer, requestorEditMode: reqEdit,
  openSection, toggleSection,
  materialRows, materialActions, materialImportRef,
  handleMaterialChange, handleMaterialFileChange, handleMaterialImport,
  handleReplaceClick, removeMaterialRow, addMaterialRow, toFileUrl,
  processData, setProcessData, PROCESS_AREAS, handleFileChange, handleReplace,
  testData, setTestData, TEST_AREAS,
  submitMessage, submitting,
}) => (
  <>
    {emailSentBanner && (
      <div style={{
        position: 'fixed', top: '24px', left: '50%', transform: 'translateX(-50%)',
        zIndex: 9999, display: 'flex', alignItems: 'center', gap: '12px',
        background: '#d4edda', border: '1px solid #c3e6cb', color: '#155724',
        borderRadius: '8px', padding: '12px 20px', fontSize: '14px', fontWeight: 500,
        boxShadow: '0 4px 16px rgba(0,0,0,0.15)', minWidth: '280px'
      }}>
        <span>&#10003; {emailSentBanner}</span>
        <button
          onClick={() => setEmailSentBanner(null)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#155724', fontSize: '16px', marginLeft: 'auto' }}
        >&#x2715;</button>
      </div>
    )}

    <div className="title-header">
      <h4 className="waiver-title" style={{ textAlign: 'center' }}>AMD Waiver Request Form</h4>
    </div>

    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '16px 0' }}>
      <button
        type="button"
        onClick={
          (approverEditMode || approverAmendMode) ? () => navigate(-1) :
            (requestorEditMode || rejectedEditMode) ? () => { setShowForm(false); setActiveTab('myforms'); fetchMyForms(); setRejectedEditMode(false); } :
              handleBackToList
        }
        style={{
          padding: '8px 16px', cursor: 'pointer',
          background: '#f0f0f0', border: '1px solid #ccc', borderRadius: '6px',
          fontSize: '13px', fontWeight: 500
        }}
      >
        {(approverEditMode || approverAmendMode) ? '← Back to Management' : (requestorEditMode || rejectedEditMode) ? '← Back to All Forms' : '← Back to Drafts'}
      </button>
      {waiverStatus && (
        <span style={{
          padding: '5px 14px', borderRadius: '12px', fontSize: '12px', fontWeight: 700,
          background: { 'New': '#e8f4fd', 'Approved': '#e8f5e9', 'Cancelled': '#fff3e0', 'Rejected': '#fdecea', 'Closed': '#f0f0f0' }[waiverStatus] || '#f0f0f0',
          color: { 'New': '#1a73e8', 'Approved': '#2e7d32', 'Cancelled': '#e65100', 'Rejected': '#c62828', 'Closed': '#555' }[waiverStatus] || '#555',
          border: '1px solid currentColor'
        }}>
          {waiverStatus}
        </span>
      )}
    </div>

    <form onSubmit={handleSubmit}>
      <p style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>
        <span style={{ color: '#dc3545', fontWeight: 700 }}>*</span> indicates required fields
      </p>

      {/* Product Info */}
      <div className="form-section">
        <div className="waiver-id-row">
          <span className="waiver-label">Waiver ID:</span>
          <span className="waiver-value">{formData.waiverId}</span>
        </div>
        <div className="field-inline">
          <label>AMD Product Part Number: <span style={{ color: '#dc3545' }}>*</span></label>
          <input name="partNumber" value={formData.partNumber || ""} onChange={handleChange} />
        </div>
        <div className="field-inline">
          <label>AMD Product Revision: <span style={{ color: '#dc3545' }}>*</span></label>
          <input name="revision" value={formData.revision || ""} onChange={handleChange} />
        </div>
        <div className="field-inline">
          <label>AMD Product Description: <span style={{ color: '#dc3545' }}>*</span></label>
          <input name="description" value={formData.description || ""} onChange={handleChange} />
        </div>
      </div>

      {/* Subcontractor */}
      <div className="form-section">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label style={{ whiteSpace: 'nowrap', marginBottom: 0 }}>Affected Subcontractor <span style={{ color: '#dc3545' }}>*</span></label>
          <MultiSelectDropdown
            options={subcontractors}
            value={Array.isArray(formData.subcontractor) ? formData.subcontractor : formData.subcontractor ? [formData.subcontractor] : []}
            onChange={(selected) => setFormData(prev => ({ ...prev, subcontractor: selected }))}
            placeholder="Select subcontractor..."
          />
        </div>
      </div>

      {/* Assembly */}
      <div className="form-section">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label style={{ whiteSpace: 'nowrap', marginBottom: 0 }}>Assembly Level <span style={{ color: '#dc3545' }}>*</span></label>
          <MultiSelectDropdown
            options={assemblyLevels}
            value={Array.isArray(formData.assemblyLevel) ? formData.assemblyLevel : formData.assemblyLevel ? [formData.assemblyLevel] : []}
            onChange={(selected) => setFormData(prev => ({ ...prev, assemblyLevel: selected }))}
            placeholder="Select assembly level..."
          />
        </div>
      </div>

      {/* Requestor */}
      <div className="form-section">
        <label>Requestor Name: <span style={{ color: '#dc3545' }}>*</span></label>
        {requestorEditMode && (
          <p style={{ fontSize: '12px', color: '#888', margin: '2px 0 8px' }}>
            For requestor name edits, you may click Add/Remove Requestor and Send Email to notify requestors.
          </p>
        )}
        {(Array.isArray(formData.requestor) ? formData.requestor : [formData.requestor || '']).map((val, idx) => (
          <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '6px', alignItems: 'center' }}>
            <RequestorInput
              value={val || ''}
              showNotFoundMessage={true}
              onChange={(v) => {
                const updated = [...(Array.isArray(formData.requestor) ? formData.requestor : [formData.requestor || ''])];
                updated[idx] = v;
                setFormData(prev => ({ ...prev, requestor: updated }));
              }}
            />
            {requestorEditMode && val?.trim() && (
              <button
                type="button"
                title={`Send email to ${val}`}
                onClick={async () => {
                  setSendingEmailIdx(idx);
                  try {
                    await api.sendRequestorNotification({
                      waiverId,
                      partNumber: formData.partNumber,
                      description: formData.description,
                      revision: formData.revision,
                      assemblyLevel: formData.assemblyLevel,
                      reason: formData.reason,
                      submittedBy: '',
                      requestors: [val],
                    });
                    clearTimeout(emailBannerTimer.current);
                    setEmailSentBanner(`Email sent to ${val}`);
                    emailBannerTimer.current = setTimeout(() => setEmailSentBanner(null), 4000);
                  } catch {
                    setEmailSentBanner('Failed to send email.');
                  } finally {
                    setSendingEmailIdx(null);
                  }
                }}
                disabled={sendingEmailIdx === idx}
                style={{ background: '#1a73e8', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 10px', cursor: sendingEmailIdx === idx ? 'not-allowed' : 'pointer', flexShrink: 0, fontSize: '12px', opacity: sendingEmailIdx === idx ? 0.7 : 1 }}
              >{sendingEmailIdx === idx ? 'Sending...' : '✉ Send'}</button>
            )}
            {(Array.isArray(formData.requestor) ? formData.requestor : [formData.requestor]).length > 1 && (
              <button
                type="button"
                onClick={() => {
                  const updated = (Array.isArray(formData.requestor) ? formData.requestor : [formData.requestor]).filter((_, i) => i !== idx);
                  setFormData(prev => ({ ...prev, requestor: updated }));
                }}
                style={{ background: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 10px', cursor: 'pointer', flexShrink: 0 }}
              >✕</button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => setFormData(prev => ({ ...prev, requestor: [...(Array.isArray(prev.requestor) ? prev.requestor : [prev.requestor || '']), ''] }))}
          style={{ background: 'none', border: '1px dashed #aaa', borderRadius: '4px', padding: '4px 12px', cursor: 'pointer', color: '#555', fontSize: '12px', marginTop: '4px' }}
        >+ Add Requestor</button>
      </div>

      {/* Dates */}
      <div className="form-section">
        <div className="field-inline">
          <label>Waiver Start Date <span style={{ color: '#dc3545' }}>*</span></label>
          <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} {...(!requestorEditMode && !approverEditMode && !rejectedEditMode && !approverAmendMode ? { min: new Date().toISOString().split('T')[0] } : {})} />
        </div>
      </div>

      {/* Waiver Type */}
      <div className="form-section">
        <label>Waiver Type <span style={{ color: '#dc3545' }}>*</span></label>
        {["Material Waiver", "Process Waiver", "Test Waiver"].map((item) => (
          <label key={item} style={{ width: 'fit-content' }}>
            <input
              type="checkbox"
              name="waiverType"
              value={item}
              checked={formData.waiverType.includes(item)}
              onChange={handleChange}
            />
            {item}
          </label>
        ))}
      </div>

      {/* Reason */}
      <div className="form-section">
        <div className="field-inline">
          <label>Reason / Justification <span style={{ color: '#dc3545' }}>*</span></label>
          <textarea name="reason" value={formData.reason || ""} onChange={handleChange}></textarea>
        </div>
      </div>

      {/* Workorder */}
      <div className="form-section-row">
        <div className="field-inline">
          <label>Workorder:</label>
          <input name="workorder" value={formData.workorder || ""} onChange={handleChange} />
        </div>
        <div className="field-inline">
          <label>Workorder Qty:</label>
          <input type="number" name="workorderQty" value={formData.workorderQty || ""} onChange={handleChange} />
        </div>
      </div>

      {/* Material Waiver Section */}
      <MaterialWaiverSection
        openSection={openSection}
        toggleSection={toggleSection}
        materialRows={materialRows}
        materialActions={materialActions}
        materialImportRef={materialImportRef}
        handleMaterialChange={handleMaterialChange}
        handleMaterialFileChange={handleMaterialFileChange}
        handleMaterialImport={handleMaterialImport}
        handleReplaceClick={handleReplaceClick}
        removeMaterialRow={removeMaterialRow}
        addMaterialRow={addMaterialRow}
        toFileUrl={toFileUrl}
      />

      {/* Process Waiver Section */}
      <ProcessWaiverSection
        openSection={openSection}
        toggleSection={toggleSection}
        processData={processData}
        setProcessData={setProcessData}
        PROCESS_AREAS={PROCESS_AREAS}
        toFileUrl={toFileUrl}
        handleFileChange={handleFileChange}
        handleReplace={handleReplace}
      />

      {/* Test Waiver Section */}
      <TestWaiverSection
        openSection={openSection}
        toggleSection={toggleSection}
        testData={testData}
        setTestData={setTestData}
        TEST_AREAS={TEST_AREAS}
        toFileUrl={toFileUrl}
      />

      {/* Submit message */}
      {submitMessage && (
        <div className={`alert ${submitMessage.type}`} style={{
          marginTop: '16px', padding: '12px 16px', borderRadius: '6px', whiteSpace: 'pre-line',
          background: submitMessage.type === 'success' ? '#d4edda' : '#f8d7da',
          color: submitMessage.type === 'success' ? '#155724' : '#721c24',
          border: `1px solid ${submitMessage.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`
        }}>
          {submitMessage.text}
        </div>
      )}

      <button type="submit" className="submit-btn" disabled={submitting}>
        {submitting
          ? (approverAmendMode ? 'Submitting...' : requestorEditMode && waiverStatus === 'Pending Approval' ? 'Updating...' : !requestorEditMode && !rejectedEditMode && !approverEditMode ? 'Creating...' : 'Submitting...')
          : (approverAmendMode ? 'SUBMIT' : requestorEditMode && waiverStatus === 'Pending Approval' ? 'UPDATE' : !requestorEditMode && !rejectedEditMode && !approverEditMode ? 'Create Form' : 'SUBMIT')}
      </button>

    </form>
  </>
);

export default WaiverFormView;
