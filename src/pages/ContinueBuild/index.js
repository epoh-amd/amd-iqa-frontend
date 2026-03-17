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
        {continueMode && (
          <button className="btn-secondary" onClick={exitContinueMode}>
            <FontAwesomeIcon icon={faArrowLeft} /> Back to Selection
          </button>
        )}
      </div>

      {/* Messages */}
      <MessageDisplay messages={messages} onDismiss={setMessages} />

      {!continueMode ? (
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
      ) : (
        /* Continue Build Form */
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