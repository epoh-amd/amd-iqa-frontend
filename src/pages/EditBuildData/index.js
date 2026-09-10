// frontend/src/pages/EditBuildData/index.js

import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch,
  faEdit,
  faSpinner,
  faArrowLeft,
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';

import SearchFilterSection from './components/SearchFilterSection';
import GPUSearchSection from './components/GPUSearchSection';
import GPUEditForm from './components/GPUEditForm';
import BuildEditList from './components/BuildEditList';
import EditBuildDataForm from './components/EditBuildDataForm';
import MessageDisplay from '../ContinueBuild/components/MessageDisplay';

import { useEditBuildState } from './hooks/useEditBuildState';

import api from '../../services/api';
import '../../assets/css/editBuildData.css';

const EditBuildData = () => {
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
  } = useEditBuildState();

  // UI State
  const [editMode, setEditMode] = useState(false);
  const [buildData, setBuildData] = useState(null);
  const [searchFilters, setSearchFilters] = useState({
    bmcNames: [],
    chassisSNs: []
  });

  // GPU Information mode
  const [gpuMode, setGpuMode] = useState(false);
  const [gpuSearchInput, setGpuSearchInput] = useState({ gpuSN: '', cpuSN: '' });
  const [gpuResults, setGpuResults] = useState([]);
  const [selectedGpuBuild, setSelectedGpuBuild] = useState(null);
  const [gpuEditMode, setGpuEditMode] = useState(false);
  const [gpuEditData, setGpuEditData] = useState(null);

  // Search for builds based on filters
  const searchBuilds = async (filters) => {
    if (filters.bmcNames.length === 0 && filters.chassisSNs.length === 0) {
      setMessages([{
        type: 'warning',
        text: 'Please enter at least one BMC Name or Chassis S/N to search.'
      }]);
      return;
    }

    setLoading(true);
    try {
      const response = await api.searchBuildsForEdit({
        bmcNames: filters.bmcNames,
        chassisSNs: filters.chassisSNs
      });

      setBuilds(response);

      if (response.length === 0) {
        setMessages([{
          type: 'warning',
          text: 'No builds found matching the search criteria.'
        }]);
      } else {
        setMessages([{
          type: 'success',
          text: `Found ${response.length} build(s) matching the search criteria.`
        }]);
      }
    } catch (error) {
      console.error('Error searching builds:', error);
      setMessages([{
        type: 'error',
        text: 'Failed to search builds. Please try again.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Search GPU builds by gpu_sn or cpu_sn
  const searchGpuBuilds = async ({ gpuSNs = [], cpuSNs = [] }) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      gpuSNs.forEach(s => params.append('gpuSN', s));
      cpuSNs.forEach(s => params.append('cpuSN', s));
      const pool = await api.getGpuBuilds({ gpuSNs, cpuSNs });
      setGpuResults(pool);
      if (pool.length === 0) {
        setMessages([{ type: 'warning', text: 'No GPU builds found.' }]);
      } else {
        setMessages([{ type: 'success', text: `Found ${pool.length} GPU build(s).` }]);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to search GPU builds.';
      setMessages([{ type: 'error', text: `Failed to search GPU builds: ${msg}` }]);
    } finally {
      setLoading(false);
    }
  };

  // Handle build selection for editing
  const handleBuildSelection = (chassisSN) => {
    if (selectedBuild === chassisSN) {
      setSelectedBuild(null);
    } else {
      setSelectedBuild(chassisSN);
    }
  };

  // Edit selected build
  const editSelectedBuild = async () => {
    if (!selectedBuild) {
      setMessages([{
        type: 'warning',
        text: 'Please select a build to edit.'
      }]);
      return;
    }

    setLoading(true);
    try {
      // Get complete build details including quality data
      console.log('Fetching build details for:', selectedBuild);
      const response = await api.getBuildDetails(selectedBuild);
      console.log('Build details received:', response);

      if (!response) {
        throw new Error('No data received from server');
      }

      setBuildData(response);
      setEditMode(true);
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

  // Send fail email
  const handleSendEmail = async (build, toList, ccList, emailBody) => {
    await api.sendFailBuildEmail(build, toList, ccList, emailBody);
  };

  // Exit edit mode
  const exitEditMode = () => {
    setEditMode(false);
    setBuildData(null);
    setSelectedBuild(null);
  };

  // Handle successful completion
  const handleBuildUpdated = () => {
    setMessages([{
      type: 'success',
      text: 'Build updated successfully!'
    }]);
    exitEditMode();
    // Re-search with current filters
    if (searchFilters.bmcNames.length > 0 || searchFilters.chassisSNs.length > 0) {
      searchBuilds(searchFilters);
    }
  };

  return (
    <div className="edit-build-data-container">
      {/* Page Header */}
      <div className="edit-page-header">
        <div className="header-title">
          <h1>Edit Build Data</h1>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {!editMode && !gpuEditMode && (
            <button
              className="btn-secondary"
              onClick={() => { setGpuMode(v => !v); setGpuResults([]); setMessages([]); setSelectedGpuBuild(null); }}
              style={{ background: gpuMode ? '#1a73e8' : undefined, color: gpuMode ? '#fff' : undefined }}
            >
              {gpuMode ? 'Server Information' : 'GPU Information'}
            </button>
          )}
          {gpuEditMode && (
            <button className="btn-secondary" onClick={() => { setGpuEditMode(false); setGpuEditData(null); }}>
              <FontAwesomeIcon icon={faArrowLeft} /> Back to Search
            </button>
          )}
          {editMode && (
            <button className="btn-secondary" onClick={exitEditMode}>
              <FontAwesomeIcon icon={faArrowLeft} /> Back to Search
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <MessageDisplay messages={messages} onDismiss={setMessages} />

      {gpuEditMode ? (
        <GPUEditForm
          buildData={gpuEditData}
          onComplete={(updated) => {
            setGpuEditMode(false);
            setGpuEditData(null);
            setGpuResults(prev => prev.map(r => r.gpu_sn === updated.gpu_sn ? updated : r));
            setMessages([{ type: 'success', text: 'GPU build updated successfully!' }]);
          }}
          onCancel={() => { setGpuEditMode(false); setGpuEditData(null); }}
        />
      ) : !editMode ? (
        <>
          {gpuMode ? (
            <>
              <GPUSearchSection onSearch={searchGpuBuilds} loading={loading} />

              {gpuResults.length > 0 && (
                <div className="build-edit-section" style={{ marginTop: '16px' }}>
                  <div className="selection-header">
                    <div className="selection-info">
                      <span>Total GPU Builds Found: <strong>{gpuResults.length}</strong></span>
                      {selectedGpuBuild && <span> | Selected: <strong>{selectedGpuBuild}</strong></span>}
                    </div>
                    <button
                      className="edit-btn"
                      disabled={!selectedGpuBuild}
                      onClick={() => {
                        const build = gpuResults.find(r => r.gpu_sn === selectedGpuBuild);
                        if (build) { setGpuEditData(build); setGpuEditMode(true); }
                      }}
                    >
                      <FontAwesomeIcon icon={faEdit} /> Edit Build
                    </button>
                  </div>
                  <div className="build-list-wrapper">
                    <table className="build-list-table">
                      <thead>
                        <tr>
                          <th>Select</th>
                          {['Build Engineer','GPU S/N','CPU S/N','Project','PO','GPU P/N','ASIC P/N','Silicon Rev','Board Rev','GPU Rev','Model','Power Rating','Heatsink Mfr','Heatsink P/N','Heatsink S/N','Visual Insp','Boot to OS','GPU Detected','F-Audit','F-Audit Val','AGFHC lvl3','Roccrush','HBM','TransferBench','IFWI Ver','RM Ver'].map(h => (
                            <th key={h}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {gpuResults.map((r) => (
                          <tr
                            key={r.gpu_sn}
                            className={selectedGpuBuild === r.gpu_sn ? 'selected' : ''}
                            onClick={() => setSelectedGpuBuild(selectedGpuBuild === r.gpu_sn ? null : r.gpu_sn)}
                          >
                            <td>
                              <input
                                type="radio"
                                checked={selectedGpuBuild === r.gpu_sn}
                                onChange={() => setSelectedGpuBuild(r.gpu_sn)}
                                onClick={e => e.stopPropagation()}
                              />
                            </td>
                            {[r.build_engineer,r.gpu_sn,r.cpu_sn,r.project_name,r.po,r.gpu_pn,r.asic_pn,r.silicon_rev,r.board_rev,r.gpu_rev,r.model_name,r.cpu_power_rating,r.heatsink_manufacturer,r.heatsink_pn,r.heatsink_sn,r.visual_inspection,r.boot_to_os,r.gpu_detected,r.f_audit_enablement,r.f_audit_value,r.agfhc_lvl3,r.rocc_rush_test,r.hbm_test,r.transfer_bench,r.ifwi_version,r.rm_version].map((val, j) => (
                              <td key={j}>{val || '-'}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Search/Filter Section */}
              <SearchFilterSection
                searchFilters={searchFilters}
                setSearchFilters={setSearchFilters}
                onSearch={searchBuilds}
                loading={loading}
              />

              {/* Build Selection List */}
              {builds.length > 0 && (
                <BuildEditList
                  builds={builds}
                  selectedBuild={selectedBuild}
                  onBuildSelect={handleBuildSelection}
                  onEdit={editSelectedBuild}
                  loading={loading}
                  onSendEmail={handleSendEmail}
                />
              )}
            </>
          )}
        </>
      ) : (
        /* Edit Build Form */
        buildData ? (
          <EditBuildDataForm
            buildData={buildData}
            onComplete={handleBuildUpdated}
            onCancel={exitEditMode}
          />
        ) : (
          <div className="loading-container">
            <p>Loading build data...</p>
          </div>
        )
      )}
    </div>
  );
};

export default EditBuildData;
