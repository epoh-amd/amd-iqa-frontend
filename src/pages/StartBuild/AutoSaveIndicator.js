// frontend/src/pages/StartBuild/AutoSaveIndicator.js

import React, { useState, useEffect } from 'react';
import { Cloud, CloudOff, Check, AlertTriangle, HardDrive } from 'lucide-react';
import '../../assets/css/AutoSaveIndicator.css';

/**
 * Visual indicator showing auto-save status
 * Displays saving/saved states with timestamps
 *
 * @param {Array} builds - Current builds array (triggers on changes)
 */
export const AutoSaveIndicator = ({ builds }) => {
  const [saveStatus, setSaveStatus] = useState('idle'); // idle, saving, saved, quota-exceeded
  const [lastSaveTime, setLastSaveTime] = useState(null);
  const [storageUsage, setStorageUsage] = useState(0);

  // Initialize storage usage on mount
  useEffect(() => {
    if (typeof window.__localStorageUsagePercent === 'number') {
      setStorageUsage(window.__localStorageUsagePercent);
    }
  }, []);

  useEffect(() => {
    // Check for quota exceeded flag
    if (window.__autoSaveQuotaExceeded) {
      setSaveStatus('quota-exceeded');
      return;
    }

    // Trigger "saving" status on builds change
    setSaveStatus('saving');

    const timer = setTimeout(() => {
      // Check again before marking as saved
      if (window.__autoSaveQuotaExceeded) {
        setSaveStatus('quota-exceeded');
      } else {
        setSaveStatus('saved');
        setLastSaveTime(new Date());

        // Update storage usage from global variable
        if (typeof window.__localStorageUsagePercent === 'number') {
          setStorageUsage(window.__localStorageUsagePercent);
        }

        // Reset to idle after 3 seconds
        setTimeout(() => {
          if (!window.__autoSaveQuotaExceeded) {
            setSaveStatus('idle');
          }
        }, 3000);
      }
    }, 600); // Match debounce delay + buffer

    return () => clearTimeout(timer);
  }, [builds]);

  const getStorageColor = (usage) => {
    if (usage <= 50) return '#4caf50'; // Green
    if (usage <= 80) return '#ff9800'; // Yellow/Orange
    return '#f44336'; // Red
  };

  const formatTime = (date) => {
    if (!date) return '';

    // Format: "Jan 15, 2025 at 2:30 PM" or "Today at 2:30 PM"
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
  };

  if (saveStatus === 'idle' && !lastSaveTime) return null;

  return (
    <div className={`auto-save-indicator status-${saveStatus}`}>
      {saveStatus === 'saving' && (
        <>
          <Cloud className="icon-spin" size={16} />
          <span>Saving draft...</span>
        </>
      )}
      {saveStatus === 'saved' && (
        <>
          <Check className="icon-success" size={16} />
          <span>Draft saved {formatTime(lastSaveTime)}</span>
        </>
      )}
      {saveStatus === 'idle' && lastSaveTime && (
        <>
          <CloudOff className="icon-idle" size={16} />
          <span>Last saved {formatTime(lastSaveTime)}</span>
        </>
      )}
      {saveStatus === 'quota-exceeded' && (
        <>
          <AlertTriangle className="icon-warning" size={16} />
          <span>Storage full - Please save your builds now</span>
        </>
      )}

      {saveStatus !== 'quota-exceeded' && (
        <>
          <HardDrive size={16} style={{ color: getStorageColor(storageUsage) }} />
          <span style={{ color: getStorageColor(storageUsage), fontWeight: 600 }}>
            {storageUsage}%
          </span>
        </>
      )}
    </div>
  );
};
