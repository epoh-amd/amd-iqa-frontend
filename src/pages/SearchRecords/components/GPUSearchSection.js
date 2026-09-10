import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faChevronDown, faChevronUp, faChevronRight, faDownload, faSpinner, faTimes } from '@fortawesome/free-solid-svg-icons';
import api from '../../../services/api';

const BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
const toFileUrl = (fp) => {
  if (!fp) return '';
  // GPU photos are in uploads/ folder; waiver attachments are in drafts/
  if (fp.startsWith('uploads/') || fp.startsWith('/uploads/')) {
    return `${BASE_URL}/${fp.replace(/^\//, '')}`;
  }
  return `${BASE_URL}${fp.replace('/drafts/', '/api/drafts/')}`;
};
const displayName = (fp) => fp.split('/').pop().replace(/^[a-z0-9]{6}_/i, '');

const PROJECT_OPTIONS = ['MI350P', 'MI410P'];

const defaultFilters = {
  projectName: '', po: '', gpuPN: '', gpuSN: '', asicPN: '', cpuSN: '',
  modelName: '', status: '',
};

const thRef  = { padding: '8px 12px', background: '#f8f9fa', fontWeight: 600, fontSize: '12px', border: '1px solid #dee2e6', whiteSpace: 'nowrap', verticalAlign: 'middle' };
const thSection = { padding: '8px 12px', background: '#e3f2fd', fontWeight: 600, fontSize: '12px', border: '1px solid #dee2e6', textAlign: 'center', cursor: 'pointer', whiteSpace: 'nowrap' };
const thSectionCollapsed = { ...thSection, background: '#bbdefb', width: '24px', textAlign: 'center' };
const thCol  = { padding: '6px 10px', background: '#f8f9fa', fontWeight: 500, fontSize: '11px', border: '1px solid #dee2e6', whiteSpace: 'nowrap', color: '#555' };
const tdRef  = { padding: '8px 12px', fontWeight: 600, border: '1px solid #dee2e6', whiteSpace: 'nowrap', background: '#fafafa' };
const td     = { padding: '8px 10px', border: '1px solid #dee2e6', whiteSpace: 'nowrap', color: '#333' };

const GPU_SECTIONS = {
  gpuInfo:   { label: 'GPU Information',              cols: ['Project','PO','GPU P/N','GPU S/N','Board S/N','Board Mfr','ASIC P/N','CPU S/N','Silicon Rev','Board Rev','GPU Rev','Model Name','Power Rating','Heatsink Mfr'] },
  component: { label: 'Component/Rework Information', cols: ['Heatsink P/N','Heatsink S/N','Heatsink Mfr'] },
  testing:   { label: 'Testing',                      cols: ['Visual Insp','Boot to OS','GPU Detected','F-Audit','F-Audit Val','AGFHC lvl3','Roccrush','HBM','TransferBench'] },
  firmware:  { label: 'Firmware Details',             cols: ['IFWI Version','RM Version'] },
};

// Fields that are "failed" when value matches trigger
const FAIL_TRIGGERS = {
  visual_inspection: 'Fail', boot_to_os: 'No', gpu_detected: 'No',
  f_audit_enablement: 'No', agfhc_lvl3: 'Fail', rocc_rush_test: 'Fail',
  hbm_test: 'Fail', transfer_bench: 'Fail',
};
const NOTES_MAP = {
  visual_inspection: 'visual_inspection_notes', boot_to_os: 'boot_to_os_notes',
  gpu_detected: 'gpu_detected_notes', f_audit_enablement: 'f_audit_enablement_notes',
  agfhc_lvl3: 'agfhc_lvl3_notes', rocc_rush_test: 'rocc_rush_test_notes',
  hbm_test: 'hbm_test_notes', transfer_bench: 'transfer_bench_notes',
};
// Map DB snake_case field to camelCase field_name stored in gpu_build_photos
const PHOTO_FIELD_MAP = {
  visual_inspection:  'visualInspection',
  boot_to_os:         'bootToOS',
  gpu_detected:       'gpuDetected',
  f_audit_enablement: 'fAuditEnablement',
  agfhc_lvl3:         'agfhcLvl3',
  rocc_rush_test:     'roccRushTest',
  hbm_test:           'hbmTest',
  transfer_bench:     'transferBench',
};
const TESTING_DB_FIELDS = [
  'visual_inspection','boot_to_os','gpu_detected','f_audit_enablement',
  'f_audit_value','agfhc_lvl3','rocc_rush_test','hbm_test','transfer_bench'
];

// Test details modal
const TestDetailsModal = ({ detail, onClose }) => {
  if (!detail) return null;
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'#fff', borderRadius:'10px', padding:'24px', maxWidth:'500px', width:'90%', maxHeight:'80vh', overflowY:'auto', position:'relative' }}>
        <button onClick={onClose} style={{ position:'absolute', top:12, right:14, background:'none', border:'none', fontSize:'18px', cursor:'pointer' }}>
          <FontAwesomeIcon icon={faTimes} />
        </button>
        <h3 style={{ fontSize:'15px', marginBottom:'14px', color:'#c62828' }}>
          ⚠ {detail.label} — {detail.value}
        </h3>
        {detail.notes && (
          <div style={{ marginBottom:'12px' }}>
            <div style={{ fontSize:'12px', fontWeight:600, color:'#555', marginBottom:'4px' }}>Notes</div>
            <div style={{ fontSize:'13px', background:'#f8f9fa', padding:'8px 10px', borderRadius:'5px', border:'1px solid #eee' }}>{detail.notes}</div>
          </div>
        )}
        {detail.photos && detail.photos.length > 0 && (
          <div>
            <div style={{ fontSize:'12px', fontWeight:600, color:'#555', marginBottom:'6px' }}>Photos</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'8px' }}>
              {detail.photos.map((p, i) => (
                <a key={i} href={toFileUrl(p.file_path)} target="_blank" rel="noreferrer">
                  <img
                    src={toFileUrl(p.file_path)}
                    alt={displayName(p.file_path)}
                    style={{ width:'100px', height:'80px', objectFit:'cover', borderRadius:'5px', border:'1px solid #ddd', cursor:'pointer' }}
                    onError={e => { e.target.style.display='none'; }}
                  />
                </a>
              ))}
            </div>
          </div>
        )}
        {!detail.notes && (!detail.photos || !detail.photos.length) && (
          <p style={{ color:'#888', fontSize:'13px' }}>No notes or photos recorded.</p>
        )}
      </div>
    </div>
  );
};

const GPUSearchSection = ({ onSearch, loading, results = [], exporting, onExport }) => {
  const [filters, setFilters] = useState(defaultFilters);
  const [showFilters, setShowFilters] = useState(true);
  const [collapsed, setCollapsed] = useState({});
  const [testDetail, setTestDetail] = useState(null);

  const toggle = (key) => setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));
  const set = (field, value) => setFilters(prev => ({ ...prev, [field]: value }));
  const reset = () => setFilters(defaultFilters);

  const FilterInput = ({ label, field, placeholder }) => (
    <div className="filter-group">
      <label>{label}</label>
      <input type="text" placeholder={placeholder || `Enter ${label}`} value={filters[field]} onChange={e => set(field, e.target.value)} />
    </div>
  );
  const FilterSelect = ({ label, field, options }) => (
    <div className="filter-group">
      <label>{label}</label>
      <select value={filters[field]} onChange={e => set(field, e.target.value)}>
        <option value="">All</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  const openTestDetail = async (r, dbField, label, value) => {
    const notes = r[NOTES_MAP[dbField]] || '';
    // Fetch photos — match by camelCase field_name stored in gpu_build_photos
    const camelField = PHOTO_FIELD_MAP[dbField];
    let photos = [];
    try {
      const allPhotos = await api.getGpuBuildPhotos(r.gpu_sn);
      photos = allPhotos.filter(p => p.field_name === camelField);
    } catch {}
    setTestDetail({ label, value, notes, photos });
  };

  // Build testing cell — colored badge, clickable if failed
  const TestCell = ({ r, dbField, label }) => {
    const value = r[dbField];
    const triggerVal = FAIL_TRIGGERS[dbField];
    const isFail = triggerVal && value === triggerVal;
    if (!value) return <td style={td}>-</td>;
    return (
      <td style={td}>
        {isFail ? (
          <span
            className="status-badge fail clickable"
            style={{ cursor:'pointer' }}
            onClick={() => openTestDetail(r, dbField, label, value)}
          >{value}</span>
        ) : (
          <span className="status-badge complete">{value}</span>
        )}
      </td>
    );
  };

  const sectionEntries = Object.entries(GPU_SECTIONS);

  return (
    <div className="search-filter-section">
      <TestDetailsModal detail={testDetail} onClose={() => setTestDetail(null)} />

      <div className="filter-header">
        <h2>Search GPU Builds</h2>
        <button className="filter-toggle" onClick={() => setShowFilters(v => !v)}>
          {showFilters ? 'Hide' : 'Show'} <FontAwesomeIcon icon={showFilters ? faChevronUp : faChevronDown} />
        </button>
      </div>

      {showFilters && (
        <div className="filter-content">
          <FilterSelect label="Project Name" field="projectName" options={PROJECT_OPTIONS} />
          <FilterInput  label="PO"          field="po" />
          <FilterInput  label="GPU P/N"     field="gpuPN" />
          <FilterInput  label="GPU S/N"     field="gpuSN" />
          <FilterInput  label="ASIC P/N"    field="asicPN" />
          <FilterInput  label="CPU S/N"     field="cpuSN" />
          <FilterInput  label="Model Name"  field="modelName" />
          <FilterSelect label="Status"      field="status" options={['In Progress','Completed']} />
        </div>
      )}

      <div className="filter-actions">
        <div>
          {results.length > 0 && (
            <button type="button" className="search-filter-actions-btn search-filter-export-btn" onClick={onExport} disabled={exporting}>
              {exporting ? <><FontAwesomeIcon icon={faSpinner} spin /> Exporting...</> : <><FontAwesomeIcon icon={faDownload} /> Export</>}
            </button>
          )}
        </div>
        <div className="filter-actions-right">
          <button type="button" className="search-filter-actions-btn search-filter-reset-btn" onClick={reset} disabled={loading}>Reset Filters</button>
          <button type="button" className="search-filter-actions-btn search-filter-search-btn" onClick={() => onSearch(filters)} disabled={loading}>
            {loading ? <><FontAwesomeIcon icon={faSpinner} spin /> Searching...</> : <><FontAwesomeIcon icon={faSearch} /> Search</>}
          </button>
        </div>
      </div>

      {results.length > 0 && (
        <div style={{ marginTop: '16px', overflowX: 'auto' }}>
          <p style={{ fontSize: '13px', color: '#555', marginBottom: '8px' }}>
            Found <strong>{results.length}</strong> GPU build(s)
          </p>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr>
                <th rowSpan={2} style={thRef}>Build Reference</th>
                <th rowSpan={2} style={thRef}>Status</th>
                <th rowSpan={2} style={thRef}>Build Engineer</th>
                {sectionEntries.map(([key, sec]) => (
                  collapsed[key] ? (
                    <th key={key} style={thSectionCollapsed} onClick={() => toggle(key)}>
                      <FontAwesomeIcon icon={faChevronRight} />
                    </th>
                  ) : (
                    <th key={key} colSpan={sec.cols.length} style={thSection} onClick={() => toggle(key)}>
                      <FontAwesomeIcon icon={faChevronDown} style={{ marginRight: 6 }} />{sec.label}
                    </th>
                  )
                ))}
              </tr>
              <tr>
                {sectionEntries.map(([key, sec]) =>
                  collapsed[key] ? null : sec.cols.map(c => <th key={c} style={thCol}>{c}</th>)
                )}
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={tdRef}></td>
                  <td style={td}>{r.status || '-'}</td>
                  <td style={td}>{r.build_engineer || '-'}</td>

                  {/* GPU Information */}
                  {!collapsed.gpuInfo ? [
                    r.project_name, r.po, r.gpu_pn, r.gpu_sn, r.board_sn, r.board_manufacturer,
                    r.asic_pn, r.cpu_sn, r.silicon_rev, r.board_rev, r.gpu_rev, r.model_name,
                    r.cpu_power_rating, r.heatsink_manufacturer
                  ].map((v, j) => <td key={`gi-${j}`} style={td}>{v || '-'}</td>)
                  : <td style={{ ...td, background: '#f0f0f0', width: 12 }} />}

                  {/* Component/Rework */}
                  {!collapsed.component ? [
                    r.heatsink_pn, r.heatsink_sn, r.heatsink_manufacturer
                  ].map((v, j) => <td key={`co-${j}`} style={td}>{v || '-'}</td>)
                  : <td style={{ ...td, background: '#f0f0f0', width: 12 }} />}

                  {/* Testing — colored badges */}
                  {!collapsed.testing ? <>
                    <TestCell r={r} dbField="visual_inspection"  label="Visual Inspection" />
                    <TestCell r={r} dbField="boot_to_os"         label="Boot to OS" />
                    <TestCell r={r} dbField="gpu_detected"       label="GPU Detected" />
                    <TestCell r={r} dbField="f_audit_enablement" label="F-Audit Enablement" />
                    <td style={td}>{r.f_audit_value || '-'}</td>
                    <TestCell r={r} dbField="agfhc_lvl3"         label="AGFHC lvl3" />
                    <TestCell r={r} dbField="rocc_rush_test"     label="Roccrush Test" />
                    <TestCell r={r} dbField="hbm_test"           label="HBM Test" />
                    <TestCell r={r} dbField="transfer_bench"     label="TransferBench" />
                  </> : <td style={{ ...td, background: '#f0f0f0', width: 12 }} />}

                  {/* Firmware */}
                  {!collapsed.firmware ? [r.ifwi_version, r.rm_version].map((v, j) => <td key={`fw-${j}`} style={td}>{v || '-'}</td>)
                  : <td style={{ ...td, background: '#f0f0f0', width: 12 }} />}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default GPUSearchSection;
