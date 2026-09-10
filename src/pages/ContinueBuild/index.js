// frontend/src/pages/ContinueBuild/index.js

import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFilter,
  faPlay,
  faSpinner,
  faArrowLeft,
  faCheck,
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';

import FilterSection from './components/FilterSection';
import BuildSelectionList from './components/BuildSelectionList';
import ContinueBuildForm from './components/ContinueBuildForm';
import MessageDisplay from './components/MessageDisplay';
import GPUEditForm from '../EditBuildData/components/GPUEditForm';
import GPUFilterSection from './components/GPUFilterSection';

import { useContinueBuildState } from './hooks/useContinueBuildState';
import { useFiltering } from './hooks/useFiltering';

import api from '../../services/api';
import '../../assets/css/continueBuild.css';

const ContinueBuild = () => {
  // State Management
  const {
    builds,
    setBuilds,
    selectedBuild,
    setSelectedBuild,
    loading,
    setLoading,
    messages,
    setMessages
  } = useContinueBuildState();

  const {
    filters,
    setFilters,
    filteredBuilds,
    handleFilterChange,
    resetFilters
  } = useFiltering(builds);

  // UI State
  const [showFilters, setShowFilters] = useState(true);
  const [continueMode, setContinueMode] = useState(false);
  const [buildData, setBuildData] = useState(null);

  // GPU mode
  const [gpuMode, setGpuMode] = useState(false);
  const [gpuBuilds, setGpuBuilds] = useState([]);
  const [selectedGpuBuild, setSelectedGpuBuild] = useState(null);
  const [gpuContinueMode, setGpuContinueMode] = useState(false);
  const [gpuBuildData, setGpuBuildData] = useState(null);
  const [showGpuFilters, setShowGpuFilters] = useState(true);
  const [gpuFilters, setGpuFilters] = useState({ projectName:'', po:'', gpuPN:'', gpuSN:'', asicPN:'', cpuSN:'' });

  const handleGpuFilterChange = (field, value) => setGpuFilters(prev => ({ ...prev, [field]: value }));
  const resetGpuFilters = () => setGpuFilters({ projectName:'', po:'', gpuPN:'', gpuSN:'', asicPN:'', cpuSN:'' });

  const filteredGpuBuilds = gpuBuilds.filter(b => {
    if (gpuFilters.projectName && b.project_name !== gpuFilters.projectName) return false;
    if (gpuFilters.po && !b.po?.toLowerCase().includes(gpuFilters.po.toLowerCase())) return false;
    if (gpuFilters.gpuPN && !b.gpu_pn?.toLowerCase().includes(gpuFilters.gpuPN.toLowerCase())) return false;
    if (gpuFilters.gpuSN && !b.gpu_sn?.toLowerCase().includes(gpuFilters.gpuSN.toLowerCase())) return false;
    if (gpuFilters.asicPN && !b.asic_pn?.toLowerCase().includes(gpuFilters.asicPN.toLowerCase())) return false;
    if (gpuFilters.cpuSN && !b.cpu_sn?.toLowerCase().includes(gpuFilters.cpuSN.toLowerCase())) return false;
    return true;
  });

  // Load in-progress builds on mount
  useEffect(() => {
    loadInProgressBuilds();
  }, []);

  const loadInProgressBuilds = async () => {
    setLoading(true);
    try {
      const response = await api.getInProgressBuilds();
      setBuilds(response);
    } catch (error) {
      console.error('Error loading in-progress builds:', error);
      setMessages([{
        type: 'error',
        text: 'Failed to load in-progress builds. Please try again.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Handle build selection
  const handleBuildSelection = (chassisSN) => {
    if (selectedBuild === chassisSN) {
      setSelectedBuild(null);
    } else {
      setSelectedBuild(chassisSN);
    }
  };

  // Continue selected build
  const continueSelectedBuild = async () => {
    if (!selectedBuild) {
      setMessages([{
        type: 'warning',
        text: 'Please select a build to continue.'
      }]);
      return;
    }

    setLoading(true);
    try {
      // Get complete build details including quality data
      const response = await api.getBuildDetails(selectedBuild);
      setBuildData(response);
      setContinueMode(true);
      setMessages([]);
    } catch (error) {
      console.error('Error loading build details:', error);
      setMessages([{
        type: 'error',
        text: 'Failed to load build details. Please try again.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Exit continue mode
  const exitContinueMode = () => {
    setContinueMode(false);
    setBuildData(null);
    setSelectedBuild(null);
  };

  const loadInProgressGpuBuilds = async () => {
    setLoading(true);
    try {
      const data = await api.getInProgressGpuBuilds();
      setGpuBuilds(data);
    } catch {
      setMessages([{ type: 'error', text: 'Failed to load in-progress GPU builds.' }]);
    } finally { setLoading(false); }
  };

  const continueSelectedGpuBuild = () => {
    if (!selectedGpuBuild) {
      setMessages([{ type: 'warning', text: 'Please select a GPU build to continue.' }]);
      return;
    }
    const build = gpuBuilds.find(b => b.gpu_sn === selectedGpuBuild);
    if (build) { setGpuBuildData(build); setGpuContinueMode(true); setMessages([]); }
  };

  // Handle successful completion
  const handleBuildCompleted = () => {
    setMessages([{
      type: 'success',
      text: 'Build continued successfully!'
    }]);
    exitContinueMode();
    loadInProgressBuilds(); // Refresh the list
  };

  return (
    <div className="continue-build-container">
      {/* Page Header */}
      <div className="continue-page-header">
        <h1>Continue Build</h1>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {!continueMode && !gpuContinueMode && (
            <button
              className="btn-secondary"
              onClick={() => {
                setGpuMode(v => !v);
                setSelectedGpuBuild(null);
                setMessages([]);
                if (!gpuMode) loadInProgressGpuBuilds();
              }}
              style={{ background: gpuMode ? '#1a73e8' : undefined, color: gpuMode ? '#fff' : undefined }}
            >
              {gpuMode ? 'Server Information' : 'GPU Information'}
            </button>
          )}
          {(continueMode || gpuContinueMode) && (
            <button className="btn-secondary" onClick={() => {
              if (gpuContinueMode) { setGpuContinueMode(false); setGpuBuildData(null); }
              else exitContinueMode();
            }}>
              <FontAwesomeIcon icon={faArrowLeft} /> Back to Selection
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <MessageDisplay messages={messages} onDismiss={setMessages} />

      {gpuContinueMode ? (
        <GPUEditForm
          buildData={gpuBuildData}
          completesOnSave={true}
          onComplete={() => {
            setGpuContinueMode(false);
            setGpuBuildData(null);
            setSelectedGpuBuild(null);
            loadInProgressGpuBuilds();
            setMessages([{ type: 'success', text: 'GPU build completed successfully!' }]);
          }}
          onCancel={() => { setGpuContinueMode(false); setGpuBuildData(null); }}
        />
      ) : !continueMode ? (
        <>
          {gpuMode ? (
            /* GPU In-Progress List */
            <>
              <GPUFilterSection
                filters={gpuFilters}
                onFilterChange={handleGpuFilterChange}
                onReset={resetGpuFilters}
                showFilters={showGpuFilters}
                setShowFilters={setShowGpuFilters}
              />
              <div className="build-selection-section">
              <div className="selection-header">
                <div className="selection-info">
                  <span>Total In-Progress GPU Builds: <strong>{filteredGpuBuilds.length}</strong></span>
                  {selectedGpuBuild && <span> | Selected: <strong>{selectedGpuBuild}</strong></span>}
                </div>
                <button
                  className="continue-btn"
                  onClick={continueSelectedGpuBuild}
                  disabled={!selectedGpuBuild || loading}
                >
                  <FontAwesomeIcon icon={faPlay} /> Continue Build
                </button>
              </div>
              {loading ? (
                <div className="loading-container"><FontAwesomeIcon icon={faSpinner} spin size="3x" /><p>Loading...</p></div>
              ) : filteredGpuBuilds.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>No in-progress GPU builds found.</div>
              ) : (
                <div className="build-list-wrapper">
                  <table className="build-list-table">
                    <thead>
                      <tr>
                        <th>Select</th>
                        <th>Build Engineer</th>
                        <th>Project</th>
                        <th>GPU S/N</th>
                        <th>CPU S/N</th>
                        <th>GPU P/N</th>
                        <th>ASIC P/N</th>
                        <th>Model</th>
                        <th>Last Updated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredGpuBuilds.map(b => (
                        <tr
                          key={b.gpu_sn}
                          className={selectedGpuBuild === b.gpu_sn ? 'selected' : ''}
                          onClick={() => setSelectedGpuBuild(selectedGpuBuild === b.gpu_sn ? null : b.gpu_sn)}
                        >
                          <td>
                            <input type="radio" checked={selectedGpuBuild === b.gpu_sn}
                              onChange={() => setSelectedGpuBuild(b.gpu_sn)} onClick={e => e.stopPropagation()} />
                          </td>
                          <td>{b.build_engineer || '-'}</td>
                          <td>{b.project_name || '-'}</td>
                          <td>{b.gpu_sn}</td>
                          <td>{b.cpu_sn || '-'}</td>
                          <td>{b.gpu_pn || '-'}</td>
                          <td>{b.asic_pn || '-'}</td>
                          <td>{b.model_name || '-'}</td>
                          <td>{b.updated_at ? new Date(b.updated_at).toLocaleDateString() : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              </div>
            </>
          ) : (
            <>
              {/* Filter Section */}
              <FilterSection
                filters={filters}
                onFilterChange={handleFilterChange}
                onReset={resetFilters}
                showFilters={showFilters}
                setShowFilters={setShowFilters}
              />
              {/* Build Selection List */}
              <BuildSelectionList
                builds={filteredBuilds}
                selectedBuild={selectedBuild}
                onBuildSelect={handleBuildSelection}
                onContinue={continueSelectedBuild}
                loading={loading}
              />
            </>
          )}
        </>
      ) : (
        <ContinueBuildForm
          buildData={buildData}
          onComplete={handleBuildCompleted}
          onCancel={exitContinueMode}
        />
      )}
    </div>
  );
};

export default ContinueBuild;