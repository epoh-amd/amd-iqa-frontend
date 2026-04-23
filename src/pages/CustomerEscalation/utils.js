// frontend/src/pages/CustomerEscalation/utils.js
// Utility functions for CustomerEscalation component

import { STANDARD_STATUSES, VALID_TRANSITIONS, FAILURE_MODE_TYPES } from './constants';

/**
 * Get standardized status list with counts
 * Ensures all status types are always shown, even with 0 count
 */
export const getStandardizedStats = (stats) => {
  const statusCounts = {};
  
  // Initialize all statuses with 0
  STANDARD_STATUSES.forEach(status => {
    statusCounts[status] = 0;
  });
  
  // Update with actual counts from API
  if (Array.isArray(stats.byStatus)) {
    stats.byStatus.forEach(stat => {
      // Handle case-insensitive matching and normalize status names
      const normalizedStatus = stat.status;
      
      // Check if this status exists in our standard statuses (case-insensitive)
      const matchingStandardStatus = STANDARD_STATUSES.find(
        standardStatus => standardStatus.toLowerCase() === normalizedStatus.toLowerCase()
      );
      
      if (matchingStandardStatus) {
        statusCounts[matchingStandardStatus] = stat.count || 0;
      }
    });
  }
  
  return STANDARD_STATUSES.map(status => ({
    status,
    count: statusCounts[status]
  }));
};

/**
 * Validate status transition
 * Prevents invalid status changes on the frontend
 */
export const isValidStatusTransition = (currentStatus, newStatus) => {
  // Allow keeping the same status (no change)
  if (currentStatus === newStatus) {
    return true;
  }

  return VALID_TRANSITIONS[currentStatus]?.includes(newStatus) || false;
};

/**
 * Format month string for display
 */
export const formatMonthDisplay = (monthString) => {
  if (!monthString) return 'Select Month';
  try {
    const [year, month] = monthString.split('-');
    if (!year || !month) return monthString;
    
    const monthNum = parseInt(month) - 1;
    if (monthNum < 0 || monthNum > 11) return monthString;
    
    const date = new Date(parseInt(year), monthNum);
    if (isNaN(date.getTime())) return monthString;
    
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  } catch (error) {
    console.error('Error formatting month:', error);
    return monthString;
  }
};

// Mock data generation function removed - now using real data from API

/**
 * Calculate days open for escalation tickets
 * Only applies to Open and Reopened status tickets
 * Returns null for other statuses (like Closed)
 */
export const calculateDaysOpen = (escalation) => {
  if (!escalation || !escalation.created_date) {
    return null;
  }

  // Only calculate days open for Open and Reopened tickets
  if (escalation.status !== 'Open' && escalation.status !== 'Reopened') {
    return null;
  }

  const createdDate = new Date(escalation.created_date);
  const currentDate = new Date();
  const daysSinceCreated = Math.floor((currentDate - createdDate) / (1000 * 60 * 60 * 24));
  
  return Math.max(0, daysSinceCreated);
};

/**
 * Sort escalations by days open in descending order (longest open first)
 * Open/Reopened tickets with days open come first, sorted by days descending
 * Closed tickets come after, sorted by created date (newest first)
 */
export const sortEscalationsByDaysOpen = (escalations) => {
  // Separate escalations into two groups
  const openEscalations = [];
  const closedEscalations = [];
  
  escalations.forEach(escalation => {
    const daysOpen = calculateDaysOpen(escalation);
    if (daysOpen !== null) {
      // Open/Reopened tickets
      openEscalations.push({ ...escalation, daysOpen });
    } else {
      // Closed/Other tickets
      closedEscalations.push(escalation);
    }
  });
  
  // Sort open escalations by days open (descending - longest first)
  openEscalations.sort((a, b) => b.daysOpen - a.daysOpen);
  
  // Sort closed escalations by created date (newest first)
  closedEscalations.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  
  // Combine: open escalations first, then closed escalations
  return [...openEscalations, ...closedEscalations];
};