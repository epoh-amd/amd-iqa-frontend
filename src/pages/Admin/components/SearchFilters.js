// frontend/src/pages/SearchRecords/components/SearchFilters.js

import React, { useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFilter,
  faChevronDown,
  faChevronUp,
  faRotateLeft,
  faSearch,
  faSpinner,
  faFileExcel
} from '@fortawesome/free-solid-svg-icons';
import MultiSelectDropdown from '../../../components/common/MultiSelectDropdown';
import '../../../components/common/MultiSelectDropdown.css';
import { exportMasterBuildsToExcel } from '../../../utils/masterBuildExport';
import api from '../../../services/api';


const LOCAL_STORAGE_KEY = 'searchFilters';

// ── Failure Mode Modal ────────────────────────────────────────────────────────
const FailureModeModal = ({ onClose }) => {
  const [categories, setCategories] = React.useState([]);
  const [modes, setModes] = React.useState([]);
  const [newCategory, setNewCategory] = React.useState('');
  const [newMode, setNewMode] = React.useState('');
  const [newModeCategory, setNewModeCategory] = React.useState('');
  const [msg, setMsg] = React.useState(null);
  const [deleteConfirm, setDeleteConfirm] = React.useState(null);       // { id, name } for modes
  const [deleteCatConfirm, setDeleteCatConfirm] = React.useState(null); // category name string

  const load = async () => {
    const [cats, ms] = await Promise.all([api.getFailureCategories(), api.getFailureModesList()]);
    setCategories(cats.filter(Boolean));
    setModes(ms.filter(m => m.failure_mode));
  };
  React.useEffect(() => { load(); }, []);

  const flash = (type, text) => { setMsg({ type, text }); setTimeout(() => setMsg(null), 3000); };

  const addCat = async () => {
    if (!newCategory.trim()) return;
    try { await api.addFailureCategory(newCategory.trim()); setNewCategory(''); flash('success', 'Category added.'); load(); }
    catch (e) { flash('error', e.response?.data?.error || 'Failed'); }
  };

  const addMode = async () => {
    if (!newMode.trim()) return;
    try { await api.addFailureMode(newMode.trim(), newModeCategory || null); setNewMode(''); flash('success', 'Mode added.'); load(); }
    catch (e) { flash('error', e.response?.data?.error || 'Failed'); }
  };

  const assign = async (id, cat) => {
    try { await api.assignFailureMode(id, cat); load(); }
    catch { flash('error', 'Failed to assign'); }
  };

  const del = async (id, name) => {
    try { await api.deleteFailureMode(id); flash('success', `"${name}" deleted.`); load(); }
    catch { flash('error', 'Failed to delete'); }
    setDeleteConfirm(null);
  };

  const delCat = async (cat) => {
    try { await api.deleteFailureCategory(cat); flash('success', `Category "${cat}" removed. Modes unassigned.`); load(); }
    catch { flash('error', 'Failed to delete category'); }
    setDeleteCatConfirm(null);
  };

  const inp = { padding: '6px 10px', border: '1px solid #ccc', borderRadius: '5px', fontSize: '13px' };
  const btn = (bg) => ({ padding: '6px 14px', background: bg, color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 });

  return (
    <div className="modal-overlay" style={{ zIndex: 9999 }}>
      <div className="modal-box" style={{ maxWidth: '700px', width: '95%', maxHeight: '85vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h4 style={{ margin: 0 }}>⚠️ Failure Mode Management</h4>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}>✕</button>
        </div>

        {msg && <div style={{ padding: '8px 12px', borderRadius: '5px', marginBottom: '10px', fontSize: '13px', background: msg.type === 'success' ? '#d4edda' : '#f8d7da', color: msg.type === 'success' ? '#155724' : '#721c24' }}>{msg.text}</div>}

        {/* Add Category */}
        <div style={{ marginBottom: '16px', padding: '12px', background: '#f8f9fa', borderRadius: '6px' }}>
          <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '8px' }}>Add Failure Category</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input style={{ ...inp, flex: 1 }} placeholder="Category name" value={newCategory} onChange={e => setNewCategory(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCat()} />
            <button style={btn('#1a73e8')} onClick={addCat}>+ Add</button>
          </div>
          {categories.length > 0 && (
            <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
              {categories.map(c => (
                <span key={c} style={{ background: '#e8f4fd', color: '#1a73e8', padding: '2px 8px 2px 10px', borderRadius: '10px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  {c}
                  <button
                    onClick={() => setDeleteCatConfirm(c)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', fontSize: '13px', lineHeight: 1, padding: 0 }}
                    title="Remove category"
                  >✕</button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Add Failure Mode */}
        <div style={{ marginBottom: '16px', padding: '12px', background: '#f8f9fa', borderRadius: '6px' }}>
          <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '8px' }}>Add Failure Mode</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <input style={{ ...inp, flex: 1, minWidth: '160px' }} placeholder="Failure mode name" value={newMode} onChange={e => setNewMode(e.target.value)} onKeyDown={e => e.key === 'Enter' && addMode()} />
            <select style={{ ...inp, minWidth: '160px' }} value={newModeCategory} onChange={e => setNewModeCategory(e.target.value)}>
              <option value="">-- Category (optional) --</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <button style={btn('#28a745')} onClick={addMode}>+ Add</button>
          </div>
        </div>

        {/* Modes table */}
        <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '8px' }}>Failure Modes</div>
        {modes.length === 0 ? <p style={{ color: '#888', fontSize: '13px' }}>No failure modes yet.</p> : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f0f0f0' }}>
                <th style={{ padding: '6px 10px', border: '1px solid #ddd', textAlign: 'left' }}>Failure Mode</th>
                <th style={{ padding: '6px 10px', border: '1px solid #ddd', textAlign: 'left' }}>Category</th>
                <th style={{ padding: '6px 10px', border: '1px solid #ddd', width: 70 }}>Delete</th>
              </tr>
            </thead>
            <tbody>
              {modes.map(m => (
                <tr key={m.id}>
                  <td style={{ padding: '6px 10px', border: '1px solid #ddd' }}>{m.failure_mode}</td>
                  <td style={{ padding: '6px 10px', border: '1px solid #ddd' }}>
                    <select style={{ ...inp, width: '100%' }} value={m.failure_category || ''} onChange={e => assign(m.id, e.target.value)}>
                      <option value="">(Unassigned)</option>
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: '6px 10px', border: '1px solid #ddd', textAlign: 'center' }}>
                    <button style={btn('#dc3545')} onClick={() => setDeleteConfirm({ id: m.id, name: m.failure_mode })}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Category delete confirmation */}
        {deleteCatConfirm && (
          <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10001, background: 'rgba(0,0,0,0.35)' }}>
            <div style={{ background: '#fff', borderRadius: '10px', padding: '24px 28px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)', textAlign: 'center', minWidth: '280px' }}>
              <p style={{ fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>Remove Category?</p>
              <p style={{ fontSize: '13px', color: '#555', marginBottom: '6px' }}>
                "<strong>{deleteCatConfirm}</strong>" will be removed.
              </p>
              <p style={{ fontSize: '12px', color: '#888', marginBottom: '18px' }}>Failure modes in this category will be unassigned.</p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button style={btn('#dc3545')} onClick={() => delCat(deleteCatConfirm)}>Yes, Remove</button>
                <button style={btn('#6c757d')} onClick={() => setDeleteCatConfirm(null)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Delete confirmation popup — centered over the modal */}
        {deleteConfirm && (
          <div style={{
            position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 10001, background: 'rgba(0,0,0,0.35)'
          }}>
            <div style={{
              background: '#fff', borderRadius: '10px', padding: '24px 28px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)', textAlign: 'center', minWidth: '260px'
            }}>
              <p style={{ fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>Delete Failure Mode?</p>
              <p style={{ fontSize: '13px', color: '#555', marginBottom: '18px' }}>
                "<strong>{deleteConfirm.name}</strong>" will be permanently removed.
              </p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button style={btn('#dc3545')} onClick={() => del(deleteConfirm.id, deleteConfirm.name)}>Yes, Delete</button>
                <button style={btn('#6c757d')} onClick={() => setDeleteConfirm(null)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
// ── Manufacturer Modal ────────────────────────────────────────────────────────
const ManufacturerModal = ({ onClose }) => {
  const [items, setItems]           = React.useState([]);
  const [newPrefix, setNewPrefix]   = React.useState('');
  const [newName, setNewName]       = React.useState('');
  const [editing, setEditing]       = React.useState(null); // { id, platformPrefix, manufacturerName }
  const [deleteConfirm, setDeleteConfirm] = React.useState(null);
  const [msg, setMsg]               = React.useState(null);

  const load = async () => {
    try { setItems(await api.getManufacturers()); } catch { flash('error', 'Failed to load'); }
  };
  React.useEffect(() => { load(); }, []);

  const flash = (type, text) => { setMsg({ type, text }); setTimeout(() => setMsg(null), 3000); };

  const add = async () => {
    if (!newPrefix.trim() || !newName.trim()) return;
    try { await api.addManufacturer(newPrefix.trim(), newName.trim()); setNewPrefix(''); setNewName(''); flash('success', 'Manufacturer added.'); load(); }
    catch (e) { flash('error', e.response?.data?.error || 'Failed'); }
  };

  const save = async () => {
    if (!editing) return;
    try { await api.updateManufacturer(editing.originalPrefix, editing.platformPrefix, editing.manufacturerName); setEditing(null); flash('success', 'Updated.'); load(); }
    catch (e) { flash('error', e.response?.data?.error || 'Failed to update'); }
  };

  const del = async (prefix, name) => {
    try { await api.deleteManufacturer(prefix); flash('success', `"${name}" deleted.`); load(); }
    catch { flash('error', 'Failed to delete'); }
    setDeleteConfirm(null);
  };

  const inp = { padding: '6px 10px', border: '1px solid #ccc', borderRadius: '5px', fontSize: '13px' };
  const btn = (bg) => ({ padding: '6px 14px', background: bg, color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 });

  return (
    <div className="modal-overlay" style={{ zIndex: 9999 }}>
      <div className="modal-box" style={{ maxWidth: '650px', width: '95%', maxHeight: '85vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h4 style={{ margin: 0 }}>🏭 Edit Manufacturer</h4>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}>✕</button>
        </div>

        {msg && <div style={{ padding: '8px 12px', borderRadius: '5px', marginBottom: '10px', fontSize: '13px', background: msg.type === 'success' ? '#d4edda' : '#f8d7da', color: msg.type === 'success' ? '#155724' : '#721c24' }}>{msg.text}</div>}

        {/* Add Manufacturer */}
        <div style={{ marginBottom: '16px', padding: '12px', background: '#f8f9fa', borderRadius: '6px' }}>
          <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '8px' }}>Add Manufacturer</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <input style={{ ...inp, flex: 1, minWidth: '120px' }} placeholder="Platform prefix (e.g. WH)" value={newPrefix} onChange={e => setNewPrefix(e.target.value)} />
            <input style={{ ...inp, flex: 2, minWidth: '150px' }} placeholder="Manufacturer name (e.g. Foxconn)" value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} />
            <button style={btn('#1a73e8')} onClick={add}>+ Add</button>
          </div>
        </div>

        {/* Manufacturers table */}
        <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '8px' }}>Manufacturers</div>
        {items.length === 0 ? <p style={{ color: '#888', fontSize: '13px' }}>No manufacturers found.</p> : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f0f0f0' }}>
                <th style={{ padding: '6px 10px', border: '1px solid #ddd', textAlign: 'left' }}>Platform Prefix</th>
                <th style={{ padding: '6px 10px', border: '1px solid #ddd', textAlign: 'left' }}>Manufacturer Name</th>
                <th style={{ padding: '6px 10px', border: '1px solid #ddd', width: 130 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(m => (
                <tr key={m.platform_prefix}>
                  <td style={{ padding: '6px 10px', border: '1px solid #ddd' }}>
                    {editing?.originalPrefix === m.platform_prefix
                      ? <input style={{ ...inp, width: '100%' }} value={editing.platformPrefix} onChange={e => setEditing(p => ({ ...p, platformPrefix: e.target.value }))} />
                      : m.platform_prefix}
                  </td>
                  <td style={{ padding: '6px 10px', border: '1px solid #ddd' }}>
                    {editing?.originalPrefix === m.platform_prefix
                      ? <input style={{ ...inp, width: '100%' }} value={editing.manufacturerName} onChange={e => setEditing(p => ({ ...p, manufacturerName: e.target.value }))} onKeyDown={e => e.key === 'Enter' && save()} />
                      : m.manufacturer_name}
                  </td>
                  <td style={{ padding: '6px 10px', border: '1px solid #ddd', textAlign: 'center', position: 'relative' }}>
                    {editing?.originalPrefix === m.platform_prefix ? (
                      <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                        <button style={btn('#28a745')} onClick={save}>Save</button>
                        <button style={btn('#6c757d')} onClick={() => setEditing(null)}>Cancel</button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                        <button style={btn('#1a73e8')} onClick={() => setEditing({ originalPrefix: m.platform_prefix, platformPrefix: m.platform_prefix, manufacturerName: m.manufacturer_name })}>Edit</button>
                        <button style={btn('#dc3545')} onClick={() => setDeleteConfirm({ prefix: m.platform_prefix, name: m.manufacturer_name })}>Delete</button>
                      </div>
                    )}
                    {deleteConfirm?.prefix === m.platform_prefix && (
                      <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10001, background: 'rgba(0,0,0,0.35)' }}>
                        <div style={{ background: '#fff', borderRadius: '10px', padding: '24px 28px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)', textAlign: 'center', minWidth: '260px' }}>
                          <p style={{ fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>Delete Manufacturer?</p>
                          <p style={{ fontSize: '13px', color: '#555', marginBottom: '18px' }}>"<strong>{m.manufacturer_name}</strong>" will be removed.</p>
                          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                            <button style={btn('#dc3545')} onClick={() => del(m.platform_prefix, m.manufacturer_name)}>Yes, Delete</button>
                            <button style={btn('#6c757d')} onClick={() => setDeleteConfirm(null)}>Cancel</button>
                          </div>
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
// ─────────────────────────────────────────────────────────────────────────────

const SearchFilters = ({
  filters,
  onFilterChange,
  onSearch,
  onReset,
  showFilters,
  setShowFilters,
  loading,
  systemPNOptions = [],
  buildTechnicianOptions = [],
  searchResults = [],
  onSave,
  projectOptions = [],
  onAddProject,
  onRemoveProject
}) => {
  const [showAdvanced, setShowAdvanced] = React.useState(false);
  const [exporting, setExporting] = React.useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = React.useState(false);
  const [newProject, setNewProject] = React.useState('');
  const [showProjectModal, setShowProjectModal] = React.useState(false);
  const [showFailureModal, setShowFailureModal] = React.useState(false);
  const [showManufacturerModal, setShowManufacturerModal] = React.useState(false);
  const [projectMessage, setProjectMessage] = React.useState(null);
  const [removeConfirmProject, setRemoveConfirmProject] = React.useState(null);
  // Clear localStorage when reset is clicked (now handled in parent)
  const handleReset = () => {
    onReset();
    setShowAdvanced(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch();
  };

  const confirmSave = () => {
    if (onSave) {
      onSave();   // 🔥 CALL REAL SAVE FUNCTION
    }

    setShowSaveConfirm(false);
  };

  const cancelSave = () => {
    setShowSaveConfirm(false);
  };

  const handleExport = async () => {
    if (searchResults.length === 0) {
      alert('No records to export. Please perform a search first.');
      return;
    }

    setExporting(true);
    try {
      await exportMasterBuildsToExcel(searchResults);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    
    <div className="search-filter-section">
      {projectMessage && (
  <div className={`project-toast ${projectMessage.type}`}>
    {projectMessage.text}
  </div>
)}
      <div className="filter-header">
        <h3>
          <FontAwesomeIcon icon={faFilter} /> Search Filters
        </h3>
        <button
          className="filter-toggle"
          onClick={() => setShowFilters(!showFilters)}
        >
          {showFilters ? 'Hide' : 'Show'}
          <FontAwesomeIcon icon={showFilters ? faChevronUp : faChevronDown} />
        </button>
      </div>
      {showFilters && (
        <form onSubmit={handleSubmit}>
          {/* BASIC FILTERS */}
          <div className="filter-content">
            {/* 1. Date From */}
            <div className="filter-group">
              <label>Date From</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => onFilterChange('dateFrom', e.target.value)}
              />
            </div>
            {/* 2. Date To */}
            <div className="filter-group">
              <label>Date To</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => onFilterChange('dateTo', e.target.value)}
              />
            </div>
            {/* 3. Location */}
            <div className="filter-group">
              <label>Location</label>
              <select
                value={filters.location}
                onChange={(e) => onFilterChange('location', e.target.value)}
              >
                <option value="">All Locations</option>
                <option value="Penang">Penang</option>
                <option value="Austin">Austin</option>
              </select>
            </div>
            {/* 4. Project Name */}
            <div className="filter-group">
              <label>Project Name</label>
              <input
                type="text"
                placeholder="Enter Project Name"
                value={filters.projectName}
                onChange={(e) => onFilterChange('projectName', e.target.value)}
              />
            </div>
            {/* 5. Platform Type */}
            <div className="filter-group">
              <label>Platform Type</label>
              <input
                type="text"
                placeholder="Enter Platform Type"
                value={filters.platformType}
                onChange={(e) => onFilterChange('platformType', e.target.value)}
              />
            </div>
            {/* 6. System P/N */}
            <div className="filter-group">
              <label>System P/N</label>
              <MultiSelectDropdown
                options={systemPNOptions}
                selectedValues={filters.systemPN}
                onSelectionChange={(selectedValues) => onFilterChange('systemPN', selectedValues)}
                placeholder="Select System P/N..."
                className="system-pn-dropdown"
              />
            </div>
            {/* 7. Chassis S/N */}
            <div className="filter-group">
              <label>Chassis S/N</label>
              <input
                type="text"
                placeholder="Enter Chassis S/N"
                value={filters.chassisSN}
                onChange={(e) => onFilterChange('chassisSN', e.target.value)}
              />
            </div>
            {/* 8. CPU Vendor */}
            <div className="filter-group">
              <label>CPU Vendor</label>
              <select
                value={filters.cpuVendor}
                onChange={(e) => onFilterChange('cpuVendor', e.target.value)}
              >
                <option value="">All Vendors</option>
                <option value="Tyco">Tyco</option>
                <option value="Foxconn">Foxconn</option>
                <option value="Lotes">Lotes</option>
              </select>
            </div>
            {/* 9. Status */}
            <div className="filter-group">
              <label>Status</label>
              <select
                value={filters.masterStatus}
                onChange={(e) => onFilterChange('masterStatus', e.target.value)}
              >
                <option value="">All Status (excludes Delivered & Incomplete)</option>
                <option value="Build Completed">Build Completed</option>
                <option value="Missing Information">Missing Information</option>
                <option value="Incomplete">Incomplete</option>
                <option value="Need Paperwork">Need Paperwork</option>
                <option value="Ready for Pick up">Ready for Pick up</option>
                <option value="Need CG Update">Need CG Update</option>
                <option value="Delivered Need CG Update">Delivered Need CG Update</option>
                <option value="Delivered">Delivered</option>
                <option value="Pending Rework">Pending Rework</option>
                <option value="Sent for Rework">Sent for Rework</option>
                <option value="Back from Rework">Back from Rework</option>
                <option value="Reclaimed">Reclaimed</option>
                <option value="Bad">Bad</option>
              </select>
            </div>
            {/* 10. Failure Category */}
            <div className="filter-group">
              <label>Failure Category</label>
              <select
                value={filters.failureCategory}
                onChange={(e) => onFilterChange('failureCategory', e.target.value)}
              >
                <option value="">All Categories</option>
                <option value="Mechanical Defect">Mechanical Defect</option>
                <option value="Polarity Reversed">Polarity Reversed</option>
                <option value="Missing Part">Missing Part</option>
                <option value="SN Setting Defect">SN Setting Defect</option>
                <option value="Functionality Defect">Functionality Defect</option>
              </select>
            </div>
            {/* 11. Failure Mode */}
            <div className="filter-group">
              <label>Failure Mode</label>
              <select
                value={filters.failureMode}
                onChange={(e) => onFilterChange('failureMode', e.target.value)}
              >
                <option value="">All Failure Modes</option>
                <option value="CPU socket bent pins">CPU socket bent pins</option>
                <option value="CPU socket damage">CPU socket damage</option>
                <option value="CPU socket contamination">CPU socket contamination</option>
                <option value="DIMM connector damage">DIMM connector damage</option>
                <option value="Heatsink damage">Heatsink damage</option>
                <option value="Other component damage">Other component damage</option>
                <option value="Connector bent pin">Connector bent pin</option>
                <option value="Rework failure">Rework failure</option>
                <option value="Part misorientation">Part misorientation</option>
                <option value="Missing SMT component">Missing SMT component</option>
                <option value="Missing accessory part">Missing accessory part</option>
                <option value="Mismatch product label info">Mismatch product label info</option>
                <option value="Duplicate product SN">Duplicate product SN</option>
                <option value="No boot">No boot</option>
                <option value="No power">No power</option>
                <option value="Sensor failure">Sensor failure</option>
                <option value="BMC failure">BMC failure</option>
                <option value="No display">No display</option>
                <option value="USB failure">USB failure</option>
                <option value="SSD failure">SSD failure</option>
                <option value="Other functionality defect">Other functionality defect</option>
              </select>
            </div>
          </div>

          {/* ADVANCED FILTERS TOGGLE */}
          <div style={{ margin: '15px 0' }}>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              style={{
                background: 'none',
                border: 'none',
                color: '#007bff',
                padding: '4px 0',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '500',
                textDecoration: 'underline'
              }}
            >
              <FontAwesomeIcon icon={showAdvanced ? faChevronUp : faChevronDown} />
              {' '}{showAdvanced ? 'Hide' : 'Show'} Advanced Filters
            </button>
          </div>

          {/* ADVANCED FILTERS */}
          {showAdvanced && (
            <div className="filter-content">
              {/* 1. Build Technician */}
              <div className="filter-group">
                <label>Build Technician</label>
                <MultiSelectDropdown
                  options={buildTechnicianOptions}
                  selectedValues={filters.buildEngineer}
                  onSelectionChange={(selectedValues) => onFilterChange('buildEngineer', selectedValues)}
                  placeholder="Select Build Technician..."
                  className="build-technician-dropdown"
                />
              </div>
              {/* 2. SMS Order */}
              <div className="filter-group">
                <label>SMS Order</label>
                <input
                  type="text"
                  placeholder="Enter SMS Order"
                  value={filters.smsOrder}
                  onChange={(e) => onFilterChange('smsOrder', e.target.value)}
                />
              </div>
              {/* 3. Build Name */}
              <div className="filter-group">
                <label>Build Name</label>
                <input
                  type="text"
                  placeholder="Enter Build Name"
                  value={filters.buildName}
                  onChange={(e) => onFilterChange('buildName', e.target.value)}
                />
              </div>
              {/* 4. BMC Name */}
              <div className="filter-group">
                <label>BMC Name</label>
                <input
                  type="text"
                  placeholder="Enter BMC Name"
                  value={filters.bmcName}
                  onChange={(e) => onFilterChange('bmcName', e.target.value)}
                />
              </div>
              {/* 5. FPY Status */}
              <div className="filter-group">
                <label>FPY Status</label>
                <select
                  value={filters.fpyStatus}
                  onChange={(e) => onFilterChange('fpyStatus', e.target.value)}
                >
                  <option value="">All FPY</option>
                  <option value="Pass">Pass</option>
                  <option value="Fail">Fail</option>
                </select>
              </div>
            </div>
          )}

          {/* ACTION BUTTONS */}
          <div className="filter-actions">

            {/* Reset and Search buttons on the right */}
            <div className="filter-actions-right">
              {/* NEW SAVE BUTTON */}
              <button
                type="button"
                className="search-filter-actions-btn search-filter-save-btn"
                onClick={() => setShowSaveConfirm(true)}
              >
                Save
              </button>

              <button
                type="button"
                className="search-filter-actions-btn search-filter-reset-btn"
                onClick={handleReset}
              >
                <FontAwesomeIcon icon={faRotateLeft} /> Reset Filters
              </button>
              <button
                type="submit"
                className="search-filter-actions-btn search-filter-search-btn"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin />
                    Searching...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faSearch} />
                    Search
                  </>
                )}
              </button>
              <button
                type="button"
                className="search-filter-actions-btn"
                onClick={() => setShowProjectModal(true)}
              >
                + Add Project
              </button>
              <button
                type="button"
                className="search-filter-actions-btn"
                onClick={() => setShowFailureModal(true)}
              >
                Edit Failure Modes
              </button>
              <button
                type="button"
                className="search-filter-actions-btn"
                onClick={() => setShowManufacturerModal(true)}
              >
                Edit Manufacturer
              </button>
              {showProjectModal && (
                <div className="modal-overlay">
                  <div className="modal-box">
                    <h4>Project Management</h4>

                    {/* Existing Projects List */}
                    <div style={{ maxHeight: '150px', overflowY: 'auto', marginBottom: '10px' }}>
                      {projectOptions.length === 0 ? (
                        <p>No projects found</p>
                      ) : (
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                          {projectOptions.map((proj, idx) => (
                            <li key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #f0f0f0' }}>
                              <span>{proj}</span>
                              <button
                                type="button"
                                onClick={() => setRemoveConfirmProject(proj)}
                                style={{ marginLeft: '8px', fontSize: '11px', padding: '2px 8px', background: '#fff', border: '1px solid #dc3545', color: '#dc3545', borderRadius: '4px', cursor: 'pointer' }}
                              >
                                Remove
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Remove Confirmation */}
                    {removeConfirmProject && (
                      <div style={{ margin: '10px 0', padding: '10px 12px', background: '#fff3cd', border: '1px solid #ffc107', borderRadius: '6px', fontSize: '13px' }}>
                        <p style={{ margin: '0 0 8px 0' }}>Remove <strong>{removeConfirmProject}</strong>? This cannot be undone.</p>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            className="btn confirm"
                            onClick={async () => {
                              const result = await onRemoveProject(removeConfirmProject);
                              setRemoveConfirmProject(null);
                              setProjectMessage({ type: result.success ? 'success' : 'error', text: result.message });
                              setTimeout(() => setProjectMessage(null), 2000);
                            }}
                          >
                            Yes, Remove
                          </button>
                          <button className="btn cancel" onClick={() => setRemoveConfirmProject(null)}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Add New Project */}
                    <input
                      type="text"
                      placeholder="Enter new project name"
                      value={newProject}
                      onChange={(e) => setNewProject(e.target.value)}
                      style={{ width: '100%', marginBottom: '10px' }}
                    />

                    <div className="modal-actions">
                      <button
                        className="btn cancel"
                        onClick={() => setShowProjectModal(false)}
                      >
                        Close
                      </button>

                      <button
                        className="btn confirm"
                        onClick={async () => {
                          if (!newProject.trim()) return;
                        
                          const result = await onAddProject(newProject);
                        
                          if (result.success) {
                            setProjectMessage({ type: 'success', text: result.message });
                        
                            setNewProject('');
                            setShowProjectModal(false);
                        
                            // ✅ auto hide after 2s
                            setTimeout(() => setProjectMessage(null), 2000);
                          } else {
                            setProjectMessage({ type: 'error', text: result.message });
                            setShowProjectModal(false);
                            setTimeout(() => setProjectMessage(null), 2000);
                          }
                        }}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {showFailureModal && (
              <FailureModeModal onClose={() => setShowFailureModal(false)} />
            )}
            {showManufacturerModal && (
              <ManufacturerModal onClose={() => setShowManufacturerModal(false)} />
            )}

            {showSaveConfirm && (
              <div className="modal-overlay">
                <div className="modal-box">
                  <h4>Confirm Save</h4>
                  <p>Are you sure you want to save these filters?</p>

                  <div className="modal-actions">
                    <button className="btn cancel" onClick={cancelSave}>
                      Cancel
                    </button>
                    <button className="btn confirm" onClick={confirmSave}>
                      Yes, Save
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>


        </form>
      )}
    </div>
  );
};

export default SearchFilters;
