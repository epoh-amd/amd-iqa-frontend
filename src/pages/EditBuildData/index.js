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
        {editMode && (
          <button className="btn-secondary" onClick={exitEditMode}>
            <FontAwesomeIcon icon={faArrowLeft} /> Back to Search
          </button>
        )}
      </div>

      {/* Messages */}
      <MessageDisplay messages={messages} onDismiss={setMessages} />

      {!editMode ? (
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
            />
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
