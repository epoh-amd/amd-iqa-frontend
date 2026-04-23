// frontend/src/pages/StartBuild/hooks/useAutoSave.js

import { useEffect, useRef, useCallback } from 'react';

const STORAGE_KEY = 'startBuild_draft';
const AUTO_SAVE_DELAY = 500; // milliseconds
const DRAFT_EXPIRY_DAYS = 7;

/**
 * Custom hook for auto-saving StartBuild form data to localStorage
 *
 * Features:
 * - Debounced auto-save (500ms after last change)
 * - Draft restoration on component mount
 * - Automatic cleanup of old drafts (7+ days)
 * - Quota exceeded error handling
 *
 * @param {Array} builds - Current builds array from state
 * @param {Function} setBuilds - State setter for builds
 * @returns {Object} - Auto-save utility functions
 */
export const useAutoSave = (builds, setBuilds, reworkData, setReworkData) => {
  const saveTimeoutRef = useRef(null);
  const isRestoringRef = useRef(false);

  /**
   * Helper: Format timestamp to readable date/time
   * Format: "Today at 2:30 PM" or "Jan 15, 2025 at 2:30 PM"
   */
  const getTimeSince = useCallback((timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    const timeString = date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    if (isToday) {
      return `Today at ${timeString}`;
    }

    const dateString = date.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    return `${dateString} at ${timeString}`;
  }, []);

  /**
   * Helper: Check if draft is expired (older than DRAFT_EXPIRY_DAYS)
   */
  const isDraftExpired = useCallback((timestamp) => {
    const now = new Date();
    const draftDate = new Date(timestamp);
    const diffDays = (now - draftDate) / (1000 * 60 * 60 * 24);
    return diffDays > DRAFT_EXPIRY_DAYS;
  }, []);

  /**
   * Helper: Convert File object to base64 string with metadata
   * Handles both direct File objects and {file: File, name: string, type: string} format
   */
  const fileToBase64 = useCallback((photoData) => {
    return new Promise((resolve, reject) => {
      // Handle {file: File, name: string, type: string} format
      const fileObj = photoData?.file || photoData;

      // Validate that we have a File or Blob object
      if (!(fileObj instanceof File) && !(fileObj instanceof Blob)) {
        console.warn('Invalid file object, skipping:', photoData);
        resolve(null);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          name: photoData.name || fileObj.name,
          type: photoData.type || fileObj.type,
          size: fileObj.size,
          lastModified: fileObj.lastModified,
          data: reader.result
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(fileObj);
    });
  }, []);

  /**
   * Helper: Convert base64 data back to File object with original format
   * Returns {file: File, name: string, type: string} format
   */
  const base64ToFile = useCallback((base64Data) => {
    try {
      const arr = base64Data.data.split(',');
      const mime = arr[0].match(/:(.*?);/)[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const file = new File([u8arr], base64Data.name, {
        type: mime,
        lastModified: base64Data.lastModified
      });

      // Return in the same format as useFileHandling stores it
      return {
        file: file,
        name: base64Data.name,
        type: base64Data.type
      };
    } catch (error) {
      console.error('Failed to convert base64 to File:', error);
      return null;
    }
  }, []);

  /**
   * Helper: Process build to convert File objects to base64 for storage
   */
  const prepareBuildsForStorage = useCallback(async (buildsData) => {
    const processedBuilds = await Promise.all(
      buildsData.map(async (build) => {
        const processedBuild = { ...build };

        // Convert photo arrays to base64
        const photoFields = [
          'visualInspectionPhotos',
          'bootPhotos',
          'dimmsDetectedPhotos',
          'lomWorkingPhotos'
        ];

        for (const field of photoFields) {
          if (Array.isArray(build.systemInfo[field]) && build.systemInfo[field].length > 0) {
            try {
              const converted = await Promise.all(
                build.systemInfo[field].map(photoData => fileToBase64(photoData))
              );
              // Filter out null values from invalid files
              processedBuild.systemInfo = {
                ...processedBuild.systemInfo,
                [field]: converted.filter(item => item !== null)
              };
            } catch (error) {
              console.error(`Failed to convert ${field}:`, error);
              processedBuild.systemInfo[field] = [];
            }
          }
        }

        return processedBuild;
      })
    );

    return processedBuilds;
  }, [fileToBase64]);

  /**
   * Helper: Process loaded builds to convert base64 back to File objects
   */
  const restoreBuildsFromStorage = useCallback((buildsData) => {
    return buildsData.map(build => {
      const restoredBuild = { ...build };

      const photoFields = [
        'visualInspectionPhotos',
        'bootPhotos',
        'dimmsDetectedPhotos',
        'lomWorkingPhotos'
      ];

      photoFields.forEach(field => {
        if (Array.isArray(build.systemInfo[field]) && build.systemInfo[field].length > 0) {
          // Check if first item has 'data' property (base64 format)
          if (build.systemInfo[field][0]?.data) {
            restoredBuild.systemInfo = {
              ...restoredBuild.systemInfo,
              [field]: build.systemInfo[field]
                .map(base64Data => base64ToFile(base64Data))
                .filter(file => file !== null)
            };
          }
        }
      });

      return restoredBuild;
    });
  }, [base64ToFile]);

  /**
   * Helper: Filter builds that have meaningful data
   * Excludes completely empty builds from being saved
   */
  const filterNonEmptyBuilds = useCallback((buildsData) => {
    return buildsData.filter(build => {
      // Consider a build "non-empty" if it has any of these key fields
      return build.systemInfo.chassisSN ||
             build.systemInfo.projectName ||
             build.systemInfo.systemPN ||
             build.generalInfo.location ||
             build.generalInfo.buildEngineer;
    });
  }, []);

  /**
   * Save builds to localStorage with debouncing
   */
  const saveToLocalStorage = useCallback(async (buildsData, reworkData) => {
    // Don't auto-save during restoration to prevent overwriting
    if (isRestoringRef.current) {
      return;
    }

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for debounced save
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        // Filter out empty builds
        const buildsToSave = filterNonEmptyBuilds(buildsData);

        if (buildsToSave.length > 0 || (reworkData && reworkData.length > 0)) {
          // Convert File objects to base64
          const processedBuilds = await prepareBuildsForStorage(buildsToSave);

          const draftData = {
            builds: processedBuilds,
            reworkData,
            timestamp: new Date().toISOString(),
            version: '1.0' // For future schema migrations
          };

          const jsonString = JSON.stringify(draftData);
          const draftSizeBytes = new Blob([jsonString]).size;
          const sizeInMB = (draftSizeBytes / (1024 * 1024)).toFixed(2);

          // Calculate total localStorage usage
          let totalSize = 0;
          for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
              totalSize += localStorage[key].length + key.length;
            }
          }

          // Assume 10MB limit (Chrome/Edge), adjust based on browser
          const STORAGE_LIMIT = 10 * 1024 * 1024; // 10MB in bytes
          const usagePercent = Math.round((totalSize / STORAGE_LIMIT) * 100);

          console.log(`Draft size: ${sizeInMB}MB`);
          console.log(`Total localStorage usage: ${usagePercent}%`);

          localStorage.setItem(STORAGE_KEY, jsonString);

          // Update global storage usage for UI
          window.__localStorageUsagePercent = usagePercent;

          console.log('Draft auto-saved:', {
            buildCount: buildsToSave.length,
            size: `${sizeInMB}MB`,
            usage: `${usagePercent}%`,
            time: new Date().toLocaleTimeString()
          });
        } else {
          // No meaningful data, clear any existing draft
          localStorage.removeItem(STORAGE_KEY);
          console.log('Draft cleared (no data to save)');
        }
      } catch (error) {
        console.error('Failed to save draft:', error);

        // Handle quota exceeded error
        if (error.name === 'QuotaExceededError') {
          console.warn('localStorage quota exceeded - keeping old draft, new changes not saved');
          // DO NOT remove old draft - let it stay
          // Set flag for UI to show warning
          window.__autoSaveQuotaExceeded = true;
        }
      }
    }, AUTO_SAVE_DELAY);
  }, [filterNonEmptyBuilds, prepareBuildsForStorage]);

  /**
   * Auto-save whenever builds change
   * Skip initial mount to prevent overwriting on restore
   */
  const isInitialMount = useRef(true);

  useEffect(() => {
    // Skip auto-save on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      console.log('Skipping auto-save on initial mount');
      return;
    }

    // Only save if not currently restoring
    if (!isRestoringRef.current) {
      saveToLocalStorage(builds, reworkData);
    } else {
      console.log('Skipping auto-save during restoration');
    }

    // Cleanup timeout on unmount
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [builds, reworkData, saveToLocalStorage]);

  /**
   * Clear draft from localStorage
   */
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      console.log('Draft cleared from localStorage');
    } catch (error) {
      console.error('Failed to clear draft:', error);
    }
  }, []);

  /**
   * Load draft from localStorage
   */
  const loadDraft = useCallback(() => {
    try {
      const draftJson = localStorage.getItem(STORAGE_KEY);
      if (!draftJson) return null;

      const draftData = JSON.parse(draftJson);

      // Validate draft structure
      if (!draftData.builds || !Array.isArray(draftData.builds)) {
        console.warn('Invalid draft structure, discarding');
        clearDraft();
        return null;
      }

      // Check if draft is expired
      if (draftData.timestamp && isDraftExpired(draftData.timestamp)) {
        console.log('Draft expired (older than 7 days), auto-clearing');
        clearDraft();
        return null;
      }

      // Validate draft version (for future migrations)
      if (draftData.version !== '1.0') {
        console.warn('Draft version mismatch, discarding');
        clearDraft();
        return null;
      }

      // Restore File objects from base64
      const restoredBuilds = restoreBuildsFromStorage(draftData.builds);

      return {
        ...draftData,
        builds: restoredBuilds,
        reworkData: draftData.reworkData || []
      };
    } catch (error) {
      console.error('Failed to load draft:', error);
      // Clear corrupted draft
      clearDraft();
      return null;
    }
  }, [isDraftExpired, clearDraft, restoreBuildsFromStorage]);

  /**
   * Restore draft into state
   */
  const restoreDraft = useCallback(() => {
    console.log('restoreDraft called');
    const draft = loadDraft();
    console.log('Draft loaded in restoreDraft:', draft);

    if (draft && draft.builds && draft.builds.length > 0) {
      console.log('Draft is valid, restoring builds:', draft.builds);
      isRestoringRef.current = true;

      // Call setBuilds to update state
      setBuilds(draft.builds);

      if (draft.reworkData && typeof setReworkData === 'function') {
        setReworkData(draft.reworkData); // ✅ ADD THIS
      }

      console.log('setBuilds called with', draft.builds.length, 'builds');
      console.log('Draft restored successfully:', {
        buildCount: draft.builds.length,
        timestamp: draft.timestamp,
        builds: draft.builds
      });

      // Allow auto-save to resume after restoration
      setTimeout(() => {
        isRestoringRef.current = false;
        console.log('Auto-save resumed after restoration');
      }, 1000);

      return true;
    }

    console.log('Draft validation failed - draft is null or empty');
    return false;
  }, [loadDraft, setBuilds]);

  /**
   * Check if draft exists and is valid
   */
  const hasDraft = useCallback(() => {
    const draft = loadDraft();
    return draft && draft.builds && draft.builds.length > 0;
  }, [loadDraft]);

  /**
   * Get draft metadata for display
   */
  const getDraftInfo = useCallback(() => {
    const draft = loadDraft();
    if (!draft) return null;

    return {
      buildCount: draft.builds.length,
      timestamp: draft.timestamp,
      age: getTimeSince(draft.timestamp)
    };
  }, [loadDraft, getTimeSince]);

  return {
    saveToLocalStorage,
    loadDraft,
    clearDraft,
    restoreDraft,
    hasDraft,
    getDraftInfo
  };
};
