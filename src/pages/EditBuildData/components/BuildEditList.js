// frontend/src/pages/EditBuildData/components/BuildEditList.js

import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faSpinner } from '@fortawesome/free-solid-svg-icons';
import api from '../../../services/api';

// Autocomplete email input
const EmailInput = ({ value, onChange, placeholder }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const debounce = useRef(null);
  const wrapRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (val) => {
    onChange(val);
    clearTimeout(debounce.current);
    if (val.trim().length < 1) { setSuggestions([]); setOpen(false); return; }
    debounce.current = setTimeout(async () => {
      const results = await api.searchUserEmails(val);
      setSuggestions(results);
      if (results.length > 0 && inputRef.current) {
        const rect = inputRef.current.getBoundingClientRect();
        setDropdownPos({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX, width: rect.width });
      }
      setOpen(results.length > 0);
    }, 250);
  };

  const select = (row) => {
    onChange(row.email);
    setSuggestions([]);
    setOpen(false);
  };

  return (
    <div ref={wrapRef} style={{ position: 'relative', flex: 1 }}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => {
          if (suggestions.length > 0 && inputRef.current) {
            const rect = inputRef.current.getBoundingClientRect();
            setDropdownPos({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX, width: rect.width });
            setOpen(true);
          }
        }}
        style={{ width: '100%', padding: '6px 10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '13px', boxSizing: 'border-box' }}
      />
      {open && (
        <ul style={{
          position: 'fixed', top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width, zIndex: 9999,
          background: '#fff', border: '1px solid #ccc', borderRadius: '4px',
          margin: '2px 0 0', padding: 0, listStyle: 'none', maxHeight: '180px', overflowY: 'auto',
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
              <span style={{ fontWeight: 500 }}>{row.full_name || row.email}</span>
              {row.full_name && <span style={{ color: '#888', marginLeft: '8px' }}>{row.email}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const BuildEditList = ({ builds, selectedBuild, onBuildSelect, onEdit, loading, onSendEmail }) => {
  const [emailModal, setEmailModal] = useState(null); // { build }
  const [toList, setToList] = useState(['']);
  const [ccList, setCcList] = useState(['']);
  const [emailBody, setEmailBody] = useState('');
  const [sending, setSending] = useState(false);
  const [successBanner, setSuccessBanner] = useState(null);
  const bannerTimer = useRef(null);
  const [showAllTo, setShowAllTo] = useState(false);

  const openEmailModal = (build) => {
    setToList([
      'BeowHwa.Yap@amd.com',
      'SLTeh.Teh@amd.com',
      'HoeSeng.Yeoh@amd.com',
      'KokKwan.Tang@amd.com',
      'YewAun.Soo@amd.com',
      'LeeLing.Ong@amd.com',
      'JerYen.Ang@amd.com',
      'TingWei.Tan@amd.com',
      'MuhammadAimanSyakir.ZamzuriAnas@amd.com',
      'XinXin.Mooi@amd.com',
      'Amanda.KoayBeeWah@amd.com',
      'Daniyal.BinRosli@amd.com',
      'QiYi.Tan@amd.com',
      'SueSan.Koh@amd.com',
      'WeiSin.Khor@amd.com',
      'LayLing.Chew@amd.com',
      'ChoonChuan.Yap@amd.com',
    ]);
    setCcList([
      'HafizSafwan.binShahimi@amd.com',
      'AhmadZafri.BinAhmadSuhaimi@amd.com',
      'MohamadNasir.BinIsmail@amd.com',
      'Izzuan.Ismail@amd.com',
    ]);
    setEmailBody('');
    setShowAllTo(false);
    setEmailModal({ build });
  };

  const closeEmailModal = () => {
    setEmailModal(null);
  };

  const handleSend = async () => {
    const toFiltered = toList.map(e => e.trim()).filter(Boolean);
    const ccFiltered = ccList.map(e => e.trim()).filter(Boolean);
    if (!toFiltered.length) { alert('Please enter at least one To recipient.'); return; }
    setSending(true);
    try {
      await onSendEmail(emailModal.build, toFiltered, ccFiltered, emailBody);
      const label = emailModal.build.bmc_name || emailModal.build.chassis_sn;
      closeEmailModal();
      clearTimeout(bannerTimer.current);
      setSuccessBanner(label);
      bannerTimer.current = setTimeout(() => setSuccessBanner(null), 4000);
    } catch {
      alert('Failed to send email.');
    } finally {
      setSending(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Get status badge class
  const getStatusClass = (status) => {
    switch (status) {
      case 'Complete':
        return 'status-complete';
      case 'In Progress':
        return 'status-in-progress';
      case 'Fail':
        return 'status-fail';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="build-edit-section">
        <div className="loading-container">
          <FontAwesomeIcon icon={faSpinner} spin size="3x" />
          <p>Loading builds...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="build-edit-section">
      {successBanner && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#d4edda', border: '1px solid #c3e6cb', color: '#155724',
          borderRadius: '6px', padding: '12px 16px', marginBottom: '12px',
          fontSize: '14px', fontWeight: 500
        }}>
          <span>&#10003; Email sent successfully for <strong>{successBanner}</strong>.</span>
          <button
            onClick={() => setSuccessBanner(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#155724', fontSize: '16px', lineHeight: 1 }}
          >&#x2715;</button>
        </div>
      )}
      <div className="selection-header">
        <div className="selection-info">
          <span>Total Builds Found: <strong>{builds.length}</strong></span>
          {selectedBuild && (
            <span> | Selected: <strong>{selectedBuild}</strong></span>
          )}
        </div>
        <button
          className="edit-btn"
          onClick={onEdit}
          disabled={!selectedBuild}
        >
          <FontAwesomeIcon icon={faEdit} /> Edit Build
        </button>
      </div>

      <div className="build-list-wrapper">
        <table className="build-list-table">
          <thead>
            <tr>
              <th>Select</th>
              <th>BMC Name</th>
              <th>Chassis S/N</th>
              <th>Project Name</th>
              <th>System P/N</th>
              <th>Platform Type</th>
              <th>Location</th>
              <th>Build Engineer</th>
              <th>Status</th>
              <th>FPY Status</th>
              <th>Last Updated</th>
              <th>Send Email</th>
            </tr>
          </thead>
          <tbody>
            {builds.length === 0 ? (
              <tr>
                <td colSpan="12" className="no-data">
                  No builds found
                </td>
              </tr>
            ) : (
              builds.map((build) => (
                <tr
                  key={build.chassis_sn}
                  className={selectedBuild === build.chassis_sn ? 'selected' : ''}
                  onClick={() => onBuildSelect(build.chassis_sn)}
                >
                  <td>
                    <input
                      type="radio"
                      checked={selectedBuild === build.chassis_sn}
                      onChange={() => onBuildSelect(build.chassis_sn)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                  <td>{build.bmc_name || '-'}</td>
                  <td>{build.chassis_sn}</td>
                  <td>{build.project_name || '-'}</td>
                  <td>{build.system_pn || '-'}</td>
                  <td>{build.platform_type || '-'}</td>
                  <td>{build.location || '-'}</td>
                  <td>{build.build_engineer || '-'}</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(build.status)}`}>
                      {build.status || 'In Progress'}
                    </span>
                  </td>
                  <td>
                    <span className={`fpy-badge ${build.fpy_status === 'Pass' ? 'fpy-pass' : 'fpy-fail'}`}>
                      {build.fpy_status || '-'}
                    </span>
                  </td>
                  <td>{formatDate(build.updated_at)}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    {build.fpy_status === 'Fail' && (
                      <button
                        className="wm-btn-reject"
                        style={{ fontSize: '12px', padding: '4px 10px' }}
                        onClick={() => openEmailModal(build)}
                      >
                        Send Email
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Email Modal */}
      {emailModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: '#fff', borderRadius: '8px', padding: '28px',
            minWidth: '480px', maxWidth: '600px', width: '90%', boxShadow: '0 4px 24px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '4px' }}>Send Email</h3>
            <p style={{ marginTop: 0, marginBottom: '20px', color: '#666', fontSize: '13px' }}>
              {emailModal.build.bmc_name || emailModal.build.chassis_sn}
            </p>

            {/* To: */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <label style={{ fontWeight: 600 }}>To:</label>
                {toList.length > 1 && (
                  <button
                    onClick={() => setShowAllTo(v => !v)}
                    style={{ background: 'none', border: '1px solid #aaa', borderRadius: '4px', padding: '2px 10px', cursor: 'pointer', fontSize: '12px', color: '#555' }}
                  >{showAllTo ? 'Collapse' : `View all (${toList.length})`}</button>
                )}
              </div>
              <div style={showAllTo ? { maxHeight: '160px', overflowY: 'auto', paddingRight: '4px' } : {}}>
              {(showAllTo ? toList : toList.slice(0, 1)).map((email, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                  <EmailInput
                    value={email}
                    placeholder="recipient@example.com"
                    onChange={(val) => {
                      const updated = [...toList];
                      updated[idx] = val;
                      setToList(updated);
                    }}
                  />
                  {toList.length > 1 && (
                    <button
                      onClick={() => setToList(toList.filter((_, i) => i !== idx))}
                      style={{ background: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 10px', cursor: 'pointer' }}
                    >✕</button>
                  )}
                </div>
              ))}
              </div>
              {!showAllTo && toList.length > 1 && (
                <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>
                  +{toList.length - 1} more recipient{toList.length - 1 > 1 ? 's' : ''}
                </div>
              )}
              <button
                onClick={() => setToList([...toList, ''])}
                style={{ background: 'none', border: '1px dashed #aaa', borderRadius: '4px', padding: '4px 12px', cursor: 'pointer', color: '#555', fontSize: '12px' }}
              >+ Add To</button>
            </div>

            {/* CC: */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>CC: (optional)</label>
              <div style={{ maxHeight: '160px', overflowY: 'auto', paddingRight: '4px' }}>
              {ccList.map((email, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                  <EmailInput
                    value={email}
                    placeholder="cc@example.com"
                    onChange={(val) => {
                      const updated = [...ccList];
                      updated[idx] = val;
                      setCcList(updated);
                    }}
                  />
                  {ccList.length > 1 && (
                    <button
                      onClick={() => setCcList(ccList.filter((_, i) => i !== idx))}
                      style={{ background: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 10px', cursor: 'pointer' }}
                    >✕</button>
                  )}
                </div>
              ))}
              </div>
              <button
                onClick={() => setCcList([...ccList, ''])}
                style={{ background: 'none', border: '1px dashed #aaa', borderRadius: '4px', padding: '4px 12px', cursor: 'pointer', color: '#555', fontSize: '12px' }}
              >+ Add CC</button>
            </div>

            {/* Email Body */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontWeight: 600, display: 'block', marginBottom: '6px' }}>Email Body (optional):</label>
              <textarea
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                placeholder="Enter additional message to include in the email..."
                rows={4}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '13px', resize: 'vertical', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={closeEmailModal}
                disabled={sending}
                style={{ padding: '8px 20px', border: '1px solid #ccc', borderRadius: '4px', background: '#fff', cursor: 'pointer' }}
              >Cancel</button>
              <button
                onClick={handleSend}
                disabled={sending}
                style={{ padding: '8px 20px', background: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', cursor: sending ? 'not-allowed' : 'pointer', opacity: sending ? 0.7 : 1 }}
              >{sending ? 'Sending...' : 'Send Email'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuildEditList;
