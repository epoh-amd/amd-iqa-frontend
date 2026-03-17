// frontend/src/pages/MasterBuild/hooks/useModalHandlers.js

import { useState } from 'react';
import api from '../../../services/api';

const useModalHandlers = () => {
  const [reworkModal, setReworkModal] = useState({ show: false, chassisSN: null, data: null });
  const [notesModal, setNotesModal] = useState({ show: false, type: null, notes: '', photos: [] });
  const [failuresModal, setFailuresModal] = useState({ show: false, failures: [] });
  const [reworkPhotosModal, setReworkPhotosModal] = useState({ show: false, photos: [] });
  const [cpuModal, setCpuModal] = useState({ show: false, chassisSN: null, cpus: [] });
  const [dimmModal, setDimmModal] = useState({ show: false, chassisSN: null, dimms: [] });
  const [loadingRework, setLoadingRework] = useState(false);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [loadingFailures, setLoadingFailures] = useState(false);

  // Load rework history with photos
  const loadReworkHistory = async (chassisSN) => {
    setLoadingRework(true);
    try {
      const history = await api.getReworkHistory(chassisSN);
      setReworkModal({
        show: true,
        chassisSN: chassisSN,
        data: history
      });
    } catch (error) {
      console.error('Error loading rework history:', error);
      alert('Failed to load rework history');
    } finally {
      setLoadingRework(false);
    }
  };

  // Load test notes and photos
  const loadTestDetails = async (chassisSN, testType, notes) => {
    setLoadingPhotos(true);
    try {
      const build = await api.getBuild(chassisSN);
      const photos = build.photos?.filter(p => p.photo_type === testType) || [];
      
      setNotesModal({
        show: true,
        type: testType,
        notes: notes || 'No notes available',
        photos: photos
      });
    } catch (error) {
      console.error('Error loading test details:', error);
      setNotesModal({
        show: true,
        type: testType,
        notes: notes || 'No notes available',
        photos: []
      });
    } finally {
      setLoadingPhotos(false);
    }
  };

  // Load failure details
  const loadFailureDetails = async (chassisSN) => {
    setLoadingFailures(true);
    try {
      const buildDetails = await api.getBuildDetails(chassisSN);
      const failures = [];
      
      if (buildDetails.qualityDetails?.failureModes) {
        for (let i = 0; i < buildDetails.qualityDetails.failureModes.length; i++) {
          if (buildDetails.qualityDetails.failureModes[i]) {
            failures.push({
              mode: buildDetails.qualityDetails.failureModes[i],
              category: buildDetails.qualityDetails.failureCategories[i] || 'Unknown'
            });
          }
        }
      }
      
      setFailuresModal({
        show: true,
        failures: failures
      });
    } catch (error) {
      console.error('Error loading failure details:', error);
      alert('Failed to load failure details');
    } finally {
      setLoadingFailures(false);
    }
  };

  // Show rework photos
  const showReworkPhotos = (photos) => {
    setReworkPhotosModal({
      show: true,
      photos: photos || []
    });
  };

  return {
    reworkModal,
    setReworkModal,
    notesModal,
    setNotesModal,
    failuresModal,
    setFailuresModal,
    reworkPhotosModal,
    setReworkPhotosModal,
    cpuModal,
    setCpuModal,
    dimmModal,
    setDimmModal,
    loadingRework,
    loadingPhotos,
    loadingFailures,
    loadReworkHistory,
    loadTestDetails,
    loadFailureDetails,
    showReworkPhotos
  };
};

export default useModalHandlers;