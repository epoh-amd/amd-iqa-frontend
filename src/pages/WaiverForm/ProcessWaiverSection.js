import React from 'react';
import api from '../../services/api';

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

const ProcessWaiverSection = ({
  openSection, toggleSection,
  processData,
  setProcessData,
  PROCESS_AREAS,
  toFileUrl,
  handleFileChange,
  handleReplace,
}) => (
  <div className="accordion">
    <div className="accordion-header">
      Process Waiver Details
    </div>

    {openSection.includes("process") && (
      <div className="accordion-body">

        {/* Area multi-select */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <label style={{ whiteSpace: 'nowrap', marginBottom: 0 }}>Area <span style={{ color: '#dc3545' }}>*</span></label>
          <MultiSelectDropdown
            options={PROCESS_AREAS}
            value={processData.areas || []}
            onChange={(selected) => {
              const newAreaInstructions = { ...processData.areaInstructions };
              Object.keys(newAreaInstructions).forEach(k => { if (!selected.includes(k)) delete newAreaInstructions[k]; });
              setProcessData({ ...processData, areas: selected, areaInstructions: newAreaInstructions });
            }}
            placeholder="Select area(s)..."
          />
        </div>

        {/* Per-area instructions + file — sorted by PROCESS_AREAS order */}
        {[...(processData.areas || [])].sort((a, b) => PROCESS_AREAS.indexOf(a) - PROCESS_AREAS.indexOf(b)).map(area => (
          <div key={area} style={{ marginBottom: '16px', padding: '12px', border: '1px solid #e9ecef', borderRadius: '6px', background: '#fafafa' }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '6px', fontSize: '13px' }}>
              Instructions ({area}) <span style={{ color: '#dc3545' }}>*</span>
            </label>
            <textarea
              value={processData.areaInstructions?.[area] || ''}
              onChange={(e) => setProcessData({
                ...processData,
                areaInstructions: { ...processData.areaInstructions, [area]: e.target.value }
              })}
              placeholder={`Instructions for ${area}...`}
              style={{ width: '100%', minHeight: '70px', padding: '6px 10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '13px', boxSizing: 'border-box', resize: 'vertical', marginBottom: '8px' }}
            />
            <div className="file-upload">
              <input
                type="file"
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx"
                multiple
                onChange={async (e) => {
                  const files = Array.from(e.target.files);
                  e.target.value = '';
                  for (const file of files) {
                    const fd = new FormData();
                    fd.append('file', file);
                    try {
                      const res = await api.uploadDraft(fd);
                      setProcessData(prev => {
                        const cur = prev.areaFiles?.[area];
                        const existing = Array.isArray(cur) ? cur : cur ? [cur] : [];
                        return { ...prev, areaFiles: { ...prev.areaFiles, [area]: [...existing, res.filePath] } };
                      });
                    } catch (err) { console.error('Upload failed:', err); }
                  }
                }}
              />
              {(() => {
                const cur = processData.areaFiles?.[area];
                const files = Array.isArray(cur) ? cur : cur ? [cur] : [];
                return files.map((fp, fi) => (
                  <div key={fi} className="file-preview" style={{ marginBottom: '4px' }}>
                    <a href={toFileUrl(fp)} target="_blank" rel="noreferrer" className="file-link">
                      {fp.split('/').pop()}
                    </a>
                    <button type="button" className="replace-btn" onClick={async () => {
                      try { await api.deleteDraftFile({ filePath: fp }); } catch {}
                      setProcessData(prev => {
                        const c = prev.areaFiles?.[area];
                        const arr = Array.isArray(c) ? c : c ? [c] : [];
                        const updated = arr.filter((_, i) => i !== fi);
                        return { ...prev, areaFiles: { ...prev.areaFiles, [area]: updated.length ? updated : null } };
                      });
                    }}>Remove</button>
                  </div>
                ));
              })()}
            </div>
          </div>
        ))}

        <div className="file-upload" style={{ display: 'none' }}>
          {!processData.file ? (
            <input type="file" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx" onChange={(e) => handleFileChange(e.target.files[0], processData, setProcessData)} />
          ) : (
            <div className="file-preview">
              <a href={toFileUrl(processData.file)} target="_blank" rel="noreferrer" className="file-link">
                {processData.file.split("/").pop()}
              </a>
              <button type="button" className="replace-btn" onClick={() => handleReplace(processData, setProcessData)}>Replace</button>
            </div>
          )}
        </div>

      </div>
    )}
  </div>
);

export default ProcessWaiverSection;
