import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const FailureModeManagement = () => {
  const [categories, setCategories]   = useState([]);
  const [modes, setModes]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [message, setMessage]         = useState(null);

  // Add category form
  const [newCategory, setNewCategory] = useState('');

  // Add failure mode form
  const [newMode, setNewMode]         = useState('');
  const [newModeCategory, setNewModeCategory] = useState('');

  // Assign mode form
  const [assignId, setAssignId]       = useState('');
  const [assignCategory, setAssignCategory] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [cats, ms] = await Promise.all([api.getFailureCategories(), api.getFailureModesList()]);
      setCategories(cats.filter(Boolean));
      setModes(ms.filter(m => m.failure_mode)); // exclude placeholder rows
    } catch { setMessage({ type: 'error', text: 'Failed to load data.' }); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const flash = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    try {
      await api.addFailureCategory(newCategory.trim());
      setNewCategory('');
      flash('success', `Category "${newCategory.trim()}" added.`);
      load();
    } catch (err) { flash('error', err.response?.data?.error || 'Failed to add category.'); }
  };

  const handleAddMode = async () => {
    if (!newMode.trim()) return;
    try {
      await api.addFailureMode(newMode.trim(), newModeCategory || null);
      setNewMode('');
      flash('success', `Failure mode "${newMode.trim()}" added.`);
      load();
    } catch (err) { flash('error', err.response?.data?.error || 'Failed to add failure mode.'); }
  };

  const handleAssign = async (id, category) => {
    try {
      await api.assignFailureMode(id, category);
      flash('success', 'Assignment updated.');
      load();
    } catch (err) { flash('error', 'Failed to update assignment.'); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete failure mode "${name}"?`)) return;
    try {
      await api.deleteFailureMode(id);
      flash('success', `"${name}" deleted.`);
      load();
    } catch (err) { flash('error', 'Failed to delete.'); }
  };

  const inputStyle = { padding: '7px 10px', border: '1px solid #ccc', borderRadius: '6px', fontSize: '13px', minWidth: '200px' };
  const btnStyle   = { padding: '7px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600 };
  const cardStyle  = { background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '20px', marginBottom: '20px' };

  // Group modes by category for display
  const grouped = modes.reduce((acc, m) => {
    const cat = m.failure_category || '(Unassigned)';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(m);
    return acc;
  }, {});

  return (
    <div style={{ padding: '24px', maxWidth: '900px' }}>
      <h2 style={{ marginBottom: '20px' }}>Failure Mode Management</h2>

      {message && (
        <div style={{
          padding: '10px 16px', borderRadius: '6px', marginBottom: '16px', fontSize: '13px',
          background: message.type === 'success' ? '#d4edda' : '#f8d7da',
          color: message.type === 'success' ? '#155724' : '#721c24',
          border: `1px solid ${message.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`
        }}>{message.text}</div>
      )}

      {/* Add Category */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: '15px', marginBottom: '14px' }}>Add Failure Category</h3>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input style={inputStyle} placeholder="e.g. Hardware, Software..." value={newCategory}
            onChange={e => setNewCategory(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddCategory()} />
          <button style={{ ...btnStyle, background: '#1a73e8', color: '#fff' }} onClick={handleAddCategory}>
            + Add Category
          </button>
        </div>
        {categories.length > 0 && (
          <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {categories.map(c => (
              <span key={c} style={{ background: '#e8f4fd', color: '#1a73e8', padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>{c}</span>
            ))}
          </div>
        )}
      </div>

      {/* Add Failure Mode */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: '15px', marginBottom: '14px' }}>Add Failure Mode</h3>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input style={inputStyle} placeholder="Failure mode name" value={newMode}
            onChange={e => setNewMode(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddMode()} />
          <select style={inputStyle} value={newModeCategory} onChange={e => setNewModeCategory(e.target.value)}>
            <option value="">-- Assign to category (optional) --</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button style={{ ...btnStyle, background: '#28a745', color: '#fff' }} onClick={handleAddMode}>
            + Add Mode
          </button>
        </div>
      </div>

      {/* Current failure modes grouped by category */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: '15px', marginBottom: '14px' }}>Failure Modes by Category</h3>
        {loading ? <p>Loading...</p> : Object.keys(grouped).length === 0 ? (
          <p style={{ color: '#888', fontSize: '13px' }}>No failure modes found.</p>
        ) : (
          Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([cat, items]) => (
            <div key={cat} style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#1a73e8', marginBottom: '8px', padding: '4px 0', borderBottom: '1px solid #e0e0e0' }}>
                {cat}
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#f8f9fa' }}>
                    <th style={{ padding: '6px 10px', textAlign: 'left', border: '1px solid #dee2e6' }}>Failure Mode</th>
                    <th style={{ padding: '6px 10px', textAlign: 'left', border: '1px solid #dee2e6' }}>Assign to Category</th>
                    <th style={{ padding: '6px 10px', border: '1px solid #dee2e6', width: '80px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(m => (
                    <tr key={m.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '7px 10px', border: '1px solid #dee2e6' }}>{m.failure_mode}</td>
                      <td style={{ padding: '7px 10px', border: '1px solid #dee2e6' }}>
                        <select
                          style={{ ...inputStyle, minWidth: '160px' }}
                          value={m.failure_category || ''}
                          onChange={e => handleAssign(m.id, e.target.value)}
                        >
                          <option value="">(Unassigned)</option>
                          {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </td>
                      <td style={{ padding: '7px 10px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                        <button
                          style={{ ...btnStyle, background: '#dc3545', color: '#fff', padding: '4px 10px', fontSize: '12px' }}
                          onClick={() => handleDelete(m.id, m.failure_mode)}
                        >Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FailureModeManagement;
