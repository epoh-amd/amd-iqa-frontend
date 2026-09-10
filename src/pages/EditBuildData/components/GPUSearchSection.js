import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faTimes, faPlus } from '@fortawesome/free-solid-svg-icons';

const GPUSearchSection = ({ onSearch, loading }) => {
  const [gpuSNInput, setGpuSNInput] = useState('');
  const [cpuSNInput, setCpuSNInput] = useState('');
  const [gpuSNs, setGpuSNs] = useState([]);
  const [cpuSNs, setCpuSNs] = useState([]);

  const addGpuSN = () => {
    const trimmed = gpuSNInput.trim();
    if (trimmed && !gpuSNs.includes(trimmed)) {
      setGpuSNs(prev => [...prev, trimmed]);
      setGpuSNInput('');
    }
  };

  const addCpuSN = () => {
    const trimmed = cpuSNInput.trim();
    if (trimmed && !cpuSNs.includes(trimmed)) {
      setCpuSNs(prev => [...prev, trimmed]);
      setCpuSNInput('');
    }
  };

  const handleSearch = () => {
    onSearch({ gpuSNs, cpuSNs });
  };

  const clearAll = () => {
    setGpuSNs([]);
    setCpuSNs([]);
    setGpuSNInput('');
    setCpuSNInput('');
  };

  return (
    <div className="search-filter-section">
      <div className="filter-header">
        <h2>Search GPU Builds</h2>
      </div>

      <div className="filter-content">
        {/* GPU S/N Filter */}
        <div className="filter-group">
          <label>GPU S/N(s)</label>
          <div className="multi-input-group">
            <input
              type="text"
              value={gpuSNInput}
              onChange={e => setGpuSNInput(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addGpuSN())}
              placeholder="Enter GPU S/N and press Enter or click Add"
              className="filter-input"
            />
            <button className="btn-add-filter" onClick={addGpuSN} disabled={!gpuSNInput.trim()}>
              <FontAwesomeIcon icon={faPlus} /> Add
            </button>
          </div>
          {gpuSNs.length > 0 && (
            <div className="filter-tags">
              {gpuSNs.map((sn, i) => (
                <span key={i} className="filter-tag">
                  {sn}
                  <button className="remove-tag" onClick={() => setGpuSNs(prev => prev.filter((_, j) => j !== i))} aria-label="Remove">
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* CPU S/N Filter */}
        <div className="filter-group">
          <label>CPU S/N(s)</label>
          <div className="multi-input-group">
            <input
              type="text"
              value={cpuSNInput}
              onChange={e => setCpuSNInput(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addCpuSN())}
              placeholder="Enter CPU S/N and press Enter or click Add"
              className="filter-input"
            />
            <button className="btn-add-filter" onClick={addCpuSN} disabled={!cpuSNInput.trim()}>
              <FontAwesomeIcon icon={faPlus} /> Add
            </button>
          </div>
          {cpuSNs.length > 0 && (
            <div className="filter-tags">
              {cpuSNs.map((sn, i) => (
                <span key={i} className="filter-tag">
                  {sn}
                  <button className="remove-tag" onClick={() => setCpuSNs(prev => prev.filter((_, j) => j !== i))} aria-label="Remove">
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="filter-actions">
        <button
          className="btn-search"
          onClick={handleSearch}
          disabled={loading || (gpuSNs.length === 0 && cpuSNs.length === 0)}
        >
          <FontAwesomeIcon icon={faSearch} /> Search Builds
        </button>
        <button
          className="btn-clear"
          onClick={clearAll}
          disabled={loading || (gpuSNs.length === 0 && cpuSNs.length === 0)}
        >
          Reset Filters
        </button>
      </div>
    </div>
  );
};

export default GPUSearchSection;
