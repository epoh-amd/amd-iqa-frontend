// frontend/src/pages/Dashboard/index.js

import React, { useState, useRef, useMemo } from 'react';
import { Calendar, TrendingUp, AlertTriangle, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import InfoCardOnChart from './InfoCardOnChart';
import api from '../../services/api';
import {
  calculateCumulativeData,
  autoCalculateMilestoneDates,
  ensurePorTargetsSize
} from './utils';
import { useDashboardData } from './useDashboardData';
import { useAutoCursor } from './useAutoCursor';
import BuildForecastChart from './BuildForecastChart';
import QualityCharts from './QualityCharts';
import LocationAllocationChart from './LocationAllocationChart';
import EditModal from './EditModal';
import '../../assets/css/dashboard.css';

const BuildForecastDashboard = () => {
  const { user, canAccessDashboard } = useAuth();

  // --- All hooks must be called before any conditional logic ---
  // --- Page and Edit state ---
  const [currentPage, setCurrentPage] = useState(1);
  const [editMode, setEditMode] = useState({ type: null, step: 0 });
  const [editData, setEditData] = useState({
    startDate: '',
    endDate: '',
    milestones: [],
    afeDate: '',
    porTargets: []
  });
  const [showEditWarning, setShowEditWarning] = useState(false);
  const [pendingEditType, setPendingEditType] = useState(null);

  // --- Refs ---
  const chartDataWithAccumRef = useRef([]);
  const tableRef = useRef(null);

  // --- Custom hooks for data management and auto-cursor ---
  const {
    selectedProject,
    setSelectedProject,
    projects,
    chartData,
    chartConfigs,
    setChartConfigs,
    qualityData,
    loading,
    error,
    configLoading,
    dataLoading,
    loadProjectData,
    saveConfiguration,
    retryOperation
  } = useDashboardData();

  // Get chart data with accumulation for auto-cursor
  const chartDataWithAccum = useMemo(() => {
    const data = chartData['PRB'] || [];
    return calculateCumulativeData(data);
  }, [chartData]);

  chartDataWithAccumRef.current = chartDataWithAccum;

  const autoCursorProps = useAutoCursor(chartDataWithAccum, selectedProject, chartData);

  // Check if user has permission to access dashboard
  if (!canAccessDashboard()) {
    return (
      <div className="dashboard-access-denied">
        <div className="access-denied-content">
          <AlertTriangle size={48} color="#f39c12" />
          <h2>Access Not Assigned</h2>
          <p>Welcome, <strong>{user?.full_name || user?.email}</strong>!</p>
          <p>Your account has been created but you don't have access to any features yet.</p>
          <p>Please contact your system administrator to assign you a role.</p>
          <div className="user-info">
            <p><strong>Email:</strong> {user?.email}</p>
            <p><strong>Current Status:</strong> {
              user?.category === 'unassigned' ? 'Awaiting role assignment' :
                `Category ${user?.category?.replace('cat', '')}`
            }</p>
          </div>
        </div>
      </div>
    );
  }

  // --- Helper functions ---
  // Get chart data with accumulation for auto-cursor
  const getChartDataWithAccum = (type) => {
    const data = chartData[type] || [];
    return calculateCumulativeData(data);
  };

  // Helper to convert ISO date to YYYY-MM-DD format for HTML date inputs
  const formatDateForInput = (dateValue) => {
    if (!dateValue) return '';
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  };

  // Helper to auto-calculate milestone dates
  const autoMilestoneDates = (startDate, endDate, milestones) => {
    return autoCalculateMilestoneDates(startDate, endDate, milestones);
  };

  const handleEditStart = async (type) => {
    // Show warning modal first
    setPendingEditType(type);
    setShowEditWarning(true);
  };

  const handleEditConfirm = async () => {
    setShowEditWarning(false);
    const type = pendingEditType;
    setPendingEditType(null);

    // Always fetch latest config from DB for edit, and only open modal after fetch
    let config = null;
    try {
      config = await api.getForecastConfig(selectedProject, type);
    } catch {
      config = null;
    }
    const currentConfig = config || chartConfigs[selectedProject]?.[type] || {
      startDate: '',
      endDate: '',
      milestones: [],
      afeDate: '',
      porTargets: []
    };
    setEditMode({ type, step: 0 });
    setEditData({
      ...currentConfig,
      // Convert all date fields to the format expected by HTML date inputs
      startDate: formatDateForInput(currentConfig.startDate),
      endDate: formatDateForInput(currentConfig.endDate),
      afeDate: formatDateForInput(currentConfig.afeDate),
      tvDate: formatDateForInput(currentConfig.tvDate),
      iodDate: formatDateForInput(currentConfig.iodDate),
      uuDate: formatDateForInput(currentConfig.uuDate),
      milestones: (currentConfig.milestones || []).map(m => ({
        ...m,
        durationWeeks: 1,
        startDate: formatDateForInput(m.startDate),
        endDate: formatDateForInput(m.endDate)
      })),
      porTargets: ensurePorTargetsSize(currentConfig.porTargets, currentConfig.startDate, currentConfig.endDate)
    });
  };

  const handleEditCancel = () => {
    setShowEditWarning(false);
    setPendingEditType(null);
  };

  const handleStepNext = () => {
    setEditMode(prev => {
      const nextStep = prev.step + 1;
      // If moving to POR Targets step (step 3), ensure porTargets array is properly sized
      if (nextStep === 3) {
        setEditData(prevData => ({
          ...prevData,
          porTargets: ensurePorTargetsSize(prevData.porTargets, prevData.startDate, prevData.endDate)
        }));
      }
      return { ...prev, step: nextStep };
    });
  };

  const handleStepPrev = () => {
    setEditMode(prev => ({ ...prev, step: prev.step - 1 }));
  };

  const handleDateRangeSubmit = () => {
    if (editData.startDate && editData.endDate) {
      // If no milestones, create one default milestone (no porTarget - milestones are date-based only)
      let milestones = editData.milestones.length > 0 ? editData.milestones : [{ name: 'Milestone 1', durationWeeks: 1 }];
      // Auto-calculate milestone dates
      milestones = autoMilestoneDates(editData.startDate, editData.endDate, milestones);
      setEditData(prev => ({ ...prev, milestones }));
      handleStepNext();
    }
  };

  const addMilestone = () => {
    setEditData(prev => {
      const newMilestones = [...prev.milestones, { name: `Milestone ${prev.milestones.length + 1}`, durationWeeks: 1 }]; // No porTarget - milestones are date-based only
      return {
        ...prev,
        milestones: autoMilestoneDates(prev.startDate, prev.endDate, newMilestones)
      };
    });
  };

  const updateMilestone = (index, field, value) => {
    setEditData(prev => {
      const newMilestones = prev.milestones.map((milestone, i) => {
        if (i === index) {
          // For last milestone, do not allow durationWeeks change
          if (field === 'durationWeeks' && index === prev.milestones.length - 1) {
            return milestone;
          }
          return { ...milestone, [field]: field === 'durationWeeks' ? parseInt(value) || 1 : value };
        }
        return milestone;
      });
      return {
        ...prev,
        milestones: newMilestones
      };
    });
  };

  const removeMilestone = (index) => {
    setEditData(prev => {
      const newMilestones = prev.milestones.filter((_, i) => i !== index);
      return {
        ...prev,
        milestones: autoMilestoneDates(prev.startDate, prev.endDate, newMilestones)
      };
    });
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'ArrowDown' && index < editData.porTargets.length - 1) {
      e.preventDefault();
      const nextInput = tableRef.current?.querySelector(`input[data-index="${index + 1}"]`);
      nextInput?.focus();
    } else if (e.key === 'ArrowUp' && index > 0) {
      e.preventDefault();
      const prevInput = tableRef.current?.querySelector(`input[data-index="${index - 1}"]`);
      prevInput?.focus();
    }
  };

  const handleSave = async () => {
    try {
      // Save configuration to database
      await saveConfiguration(editMode.type, editData);

      // Always fetch the config again after save to ensure state is up to date
      await loadProjectData();

      // Optionally, fetch the config for the just-edited type and update editData (for modal re-open)
      let config = null;
      try {
        config = await api.getForecastConfig(selectedProject, editMode.type);
      } catch {
        config = null;
      }
      const currentConfig = config || chartConfigs[selectedProject]?.[editMode.type] || {
        startDate: '',
        endDate: '',
        milestones: [],
        afeDate: '',
        porTargets: []
      };
      setEditData({
        ...currentConfig,
        // Convert all date fields to the format expected by HTML date inputs
        startDate: formatDateForInput(currentConfig.startDate),
        endDate: formatDateForInput(currentConfig.endDate),
        afeDate: formatDateForInput(currentConfig.afeDate),
        tvDate: formatDateForInput(currentConfig.tvDate),
        iodDate: formatDateForInput(currentConfig.iodDate),
        uuDate: formatDateForInput(currentConfig.uuDate),
        milestones: (currentConfig.milestones || []).map(m => ({
          ...m,
          durationWeeks: 1,
          startDate: formatDateForInput(m.startDate),
          endDate: formatDateForInput(m.endDate)
        })),
        porTargets: ensurePorTargetsSize(currentConfig.porTargets, currentConfig.startDate, currentConfig.endDate)
      });

      setEditMode({ type: null, step: 0 });

    } catch (err) {
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        {/* Dashboard Navigation */}
        <div className="dashboard-navigation">
          <div className="navigation-header">
            <h2 className="navigation-title">Choose the dashboard you want to view</h2>
          </div>
          <div className="page-nav">
            <button
              onClick={() => setCurrentPage(1)}
              className={`page-nav-button ${currentPage === 1 ? 'active' : 'inactive'}`}
            >
              <TrendingUp size={20} />
              <div className="nav-button-content">
                <span className="nav-button-title">SH Weekly Build Delivery Dashboard</span>
                <span className="nav-button-description">Weekly build delivery Factory & SH</span>
              </div>
            </button>
            <button
              onClick={() => setCurrentPage(2)}
              className={`page-nav-button ${currentPage === 2 ? 'active' : 'inactive'}`}
            >
              <Calendar size={20} />
              <div className="nav-button-content">
                <span className="nav-button-title">SH Build Location Allocation Dashboard</span>
                <span className="nav-button-description">Build distribution across locations</span>
              </div>
            </button>
            <button
              onClick={() => setCurrentPage(3)}
              className={`page-nav-button ${currentPage === 3 ? 'active' : 'inactive'}`}
            >
              <AlertTriangle size={20} />
              <div className="nav-button-content">
                <span className="nav-button-title">Incoming Quality Dashboard</span>
                <span className="nav-button-description">Incoming quality issue breakdowns</span>
              </div>
            </button>
          </div>
        </div>

        {/* Header */}
        <div className="dashboard-card">
          <div className="dashboard-header">
            <h1 className="dashboard-title">
              {currentPage === 1 ? 'SH Weekly Build Delivery Dashboard' :
                currentPage === 2 ? 'SH Build Location Allocation Dashboard' : 'Incoming Quality Dashboard'}
            </h1>
            <div className="status-info">
              <Calendar size={20} />
              <span>Updated: {new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="loading-state">
            <div className="loading-icon">
              <Loader2 size={48} className="loading-spinner" />
            </div>
            <h3 className="loading-title">Loading Dashboard</h3>
            <p className="loading-message">
              Please wait while we fetch your project data...
            </p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="error-container">
            <div className="error-content">
              <AlertTriangle style={{ color: '#EF4444' }} size={24} />
              <div>
                <h3 className="error-title">Error Loading Data</h3>
                <p className="error-message">{error}</p>
              </div>
              <button onClick={retryOperation} className="retry-button">
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Project Selection - Show for all pages */}
        {!loading && (
          <div className="dashboard-card">
            <div className="dashboard-project-selector">
              <label className="project-label">Project Name:</label>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                disabled={dataLoading}
                className="dashboard-project-select"
                style={{ opacity: dataLoading ? 0.6 : 1 }}
              >
                <option value="">Select Project</option>
                {projects.map((project) => (
                  <option key={project} value={project}>
                    {project}
                  </option>
                ))}
              </select>
              {dataLoading && (
                <div className="loading-indicator">
                  <Loader2 size={16} className="loading-spinner" />
                  <span>Loading data...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Page 1: Build Forecast Charts */}
        {!loading && currentPage === 1 && selectedProject && !dataLoading && (
          <div className="charts-grid">

            {/* PRB Chart */}
            {chartData?.PRB && chartData.PRB.length > 0 ? (
              <BuildForecastChart
                type="PRB"
                chartData={chartData}
                chartConfigs={chartConfigs}
                selectedProject={selectedProject}
                autoCursorProps={autoCursorProps}
                onEditStart={handleEditStart}
                chartDataWithAccumRef={chartDataWithAccumRef}
              />
            ) : (
              <div className="dashboard-card">
                Note: No data meaning no PRB systems sent to Smart Hand.
              </div>
            )}

            {/* VRB Chart */}
            {chartData?.VRB && chartData.VRB.length > 0 ? (
              <BuildForecastChart
                type="VRB"
                chartData={chartData}
                chartConfigs={chartConfigs}
                selectedProject={selectedProject}
                autoCursorProps={autoCursorProps}
                onEditStart={handleEditStart}
                chartDataWithAccumRef={chartDataWithAccumRef}
              />
            ) : (
              <div className="dashboard-card">
                Note: No data meaning no VRB systems sent to Smart Hand.
              </div>
            )}

          </div>
        )}

        {/* Page 2: Location Allocation Chart */}
        {!loading && currentPage === 2 && selectedProject && !dataLoading && (
          <LocationAllocationChart
            selectedProject={selectedProject}
            projects={projects}
          />
        )}

        {/* Page 3: Quality Issue Charts */}
        {!loading && currentPage === 3 && selectedProject && !dataLoading && (
          <>
            {console.log('Full Quality Data:', qualityData)}
            {console.log('Pretty JSON:', JSON.stringify(qualityData, null, 2))}

            <QualityCharts
              qualityData={qualityData}
              selectedProject={selectedProject}
            />
          </>
        )}

        {/* Data Loading State */}
        {!loading && selectedProject && dataLoading && (
          <div className="loading-state">
            <div className="loading-icon">
              <Loader2 size={48} className="loading-spinner" />
            </div>
            <h3 className="loading-title">Loading Project Data</h3>
            <p className="loading-message">
              Fetching {currentPage === 1 ? 'build forecasts and actual data' :
                currentPage === 2 ? 'quality issues and breakdowns' :
                  'location allocation data'} for {selectedProject}...
            </p>
          </div>
        )}

        {/* No Project Selected State */}
        {!loading && !selectedProject && (
          <div className="no-selection-state">
            <div className="no-selection-icon">
              <Calendar size={64} />
            </div>
            <h3 className="no-selection-title">No Project Selected</h3>
            <p className="no-selection-message">
              Please select a project from the dropdown above to view {currentPage === 1 ? 'build forecasts and actual data' : currentPage === 2 ? 'quality issues and breakdowns' : 'location allocation data'}.
            </p>
          </div>
        )}

        {/* Edit Warning Modal */}
        {showEditWarning && (
          <div className="modal-overlay">
            <div className="edit-warning-modal">
              <div className="warning-header">
                <div className="warning-icon">
                  <AlertTriangle size={32} color="#f39c12" />
                </div>
                <h2>Dashboard Edit Warning</h2>
              </div>

              <div className="warning-content">
                <p>
                  <strong>You are about to edit the dashboard configuration.</strong>
                </p>
                <p>
                  Any changes you make will affect the dashboard view for <strong>all users</strong> in the system.
                  This includes project timelines, milestones, and forecast data.
                </p>
                <div className="warning-details">
                  <div className="detail-item">
                    <div className="detail-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <span>Changes will be visible to all team members</span>
                  </div>
                </div>
                <p className="warning-question">
                  Do you want to proceed with editing the dashboard?
                </p>
              </div>

              <div className="warning-actions">
                <button
                  className="btn-cancel"
                  onClick={handleEditCancel}
                >
                  Cancel
                </button>
                <button
                  className="btn-proceed"
                  onClick={handleEditConfirm}
                >
                  Yes, Proceed with Edit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        <EditModal
          editMode={editMode}
          editData={editData}
          setEditData={setEditData}
          setEditMode={setEditMode}
          onSave={handleSave}
          onDateRangeSubmit={handleDateRangeSubmit}
          onStepNext={handleStepNext}
          onStepPrev={handleStepPrev}
          onAddMilestone={addMilestone}
          onUpdateMilestone={updateMilestone}
          onRemoveMilestone={removeMilestone}
          onKeyDown={handleKeyDown}
          tableRef={tableRef}
        />
      </div>
    </div>
  );
};

export default BuildForecastDashboard;
