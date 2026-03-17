// frontend/src/pages/Dashboard/utils.js
/**
 * Dashboard utility functions for data processing and calculations
 */

/**
 * Calculate cumulative data for chart visualization
 * @param {Array} data - Array of weekly build data
 * @returns {Array} - Data with cumulative values added
 */
export const calculateCumulativeData = (data) => {
  if (!data || data.length === 0) return [];
  
  let accumActual = 0;
  let accumPOR = 0;
  
  return data.map((item, index) => {
    const actual = (typeof item.actualBuilds === 'number' && !isNaN(item.actualBuilds)) ? item.actualBuilds : 0;
    const por = (typeof item.porTarget === 'number' && !isNaN(item.porTarget)) ? item.porTarget : 0;
    
    accumActual += actual;
    accumPOR += por;
    
    return {
      ...item,
      accumActual,
      accumPOR
    };
  });
};
/**
 * Find the closest week index for a given date
 * @param {Array} chartData - Array of chart data with date field
 * @param {string} targetDate - Target date in YYYY-MM-DD format
 * @returns {number|null} - Index of closest week or null if not found
 */
export const findClosestWeekIndex = (chartData, targetDate) => {
  if (!targetDate || !chartData || chartData.length === 0) return null;
  
  const target = new Date(targetDate);
  let minDiff = Infinity;
  let closestIdx = null;
  
  chartData.forEach((item, idx) => {
    const d = new Date(item.date);
    const diff = Math.abs(d - target);
    if (diff < minDiff) {
      minDiff = diff;
      closestIdx = idx;
    }
  });
  
  return closestIdx;
};

/**
 * Generate weekly dates between start and end date
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {Array} - Array of weekly date objects
 */
export const generateWeeklyDates = (startDate, endDate) => {
  if (!startDate || !endDate) return [];
  
  const weeks = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  let current = new Date(start);
  while (current <= end) {
    weeks.push({
      week: `${(current.getMonth() + 1).toString().padStart(2, '0')}/${current.getDate().toString().padStart(2, '0')}`,
      date: current.toISOString().split('T')[0],
      porTarget: 0
    });
    current.setDate(current.getDate() + 7);
  }
  
  return weeks;
};

/**
 * Format number with commas for display
 * @param {number} num - Number to format
 * @returns {string} - Formatted number string
 */
export const formatNumber = (num) => {
  if (num === null || num === undefined || isNaN(num)) return '0';
  return num.toLocaleString();
};

/**
 * Auto-calculate milestone dates (for UI purposes only)
 * CORRECTED: Milestones are defined by direct start/end dates, not duration
 * This function is mainly for distributing milestones evenly if dates are missing
 * 
 * @param {string} startDate - Project start date
 * @param {string} endDate - Project end date
 * @param {Array} milestones - Array of milestone objects
 * @returns {Array} - Milestones with calculated dates if missing
 */
export const autoCalculateMilestoneDates = (startDate, endDate, milestones) => {
  if (!startDate || !endDate || !milestones || milestones.length === 0) return [];
  
  // If milestones already have dates, return them as-is
  if (milestones.every(m => m.startDate && m.endDate)) {
    return milestones.map(milestone => ({
      ...milestone,
      porTarget: milestone.porTarget || 0
    }));
  }
  
  // Only auto-calculate if dates are missing - distribute evenly
  const projectStart = new Date(startDate);
  const projectEnd = new Date(endDate);
  const projectDurationDays = (projectEnd - projectStart) / (1000 * 60 * 60 * 24);
  const daysPerMilestone = Math.floor(projectDurationDays / milestones.length);
  
  return milestones.map((milestone, index) => {
    const milestoneStart = new Date(projectStart);
    milestoneStart.setDate(milestoneStart.getDate() + (index * daysPerMilestone));
    
    const milestoneEnd = new Date(milestoneStart);
    if (index === milestones.length - 1) {
      // Last milestone ends with project
      milestoneEnd.setTime(projectEnd.getTime());
    } else {
      milestoneEnd.setDate(milestoneEnd.getDate() + daysPerMilestone - 1);
    }
    
    return {
      ...milestone,
      startDate: milestone.startDate || milestoneStart.toISOString().split('T')[0],
      endDate: milestone.endDate || milestoneEnd.toISOString().split('T')[0],
      porTarget: milestone.porTarget || 0
    };
  });
};

/**
 * Merge POR targets from configuration into chart data
 * @param {Array} chartData - Existing chart data
 * @param {Array} porTargets - Array of POR targets by week index
 * @returns {Array} - Chart data with POR targets merged
 */
export const mergePorTargets = (chartData, porTargets) => {
  if (!chartData || !porTargets) return chartData;
  
  return chartData.map((item, index) => ({
    ...item,
    porTarget: porTargets[index] || 0
  }));
};

/**
 * Process quality data from API into chart-ready format
 * @param {Object} rawData - Raw quality data from API
 * @returns {Object} - Processed quality data for charts
 */
export const processQualityData = (rawData) => {
  if (!rawData || typeof rawData !== 'object') {
    return { PRB: null, VRB: null };
  }
  
  const processedData = {};
  
  ['PRB', 'VRB'].forEach(platformType => {
    const platformData = rawData[platformType];
    if (platformData) {
      processedData[platformType] = {
        pieData: platformData.pieData || [],
        breakdownData: platformData.breakdownData || []
      };
    } else {
      processedData[platformType] = null;
    }
  });
  
  return processedData;
};

/**
 * Validate configuration data before saving
 * @param {Object} configData - Configuration data to validate
 * @returns {Object} - Validation result with isValid and errors
 */
export const validateConfiguration = (configData) => {
  const errors = [];
  
  if (!configData.startDate) {
    errors.push('Start date is required');
  }
  
  if (!configData.endDate) {
    errors.push('End date is required');
  }
  
  if (configData.startDate && configData.endDate) {
    const start = new Date(configData.startDate);
    const end = new Date(configData.endDate);
    if (start >= end) {
      errors.push('End date must be after start date');
    }
  }
  
  if (!configData.milestones || configData.milestones.length === 0) {
    errors.push('At least one milestone is required');
  } else {
    configData.milestones.forEach((milestone, index) => {
      if (!milestone.name) {
        errors.push(`Milestone ${index + 1} name is required`);
      }
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Ensure porTargets array is properly sized to match the number of weeks
 * @param {Array} currentPorTargets - Current porTargets array (may be undefined or wrong size)
 * @param {string} startDate - Start date for the project
 * @param {string} endDate - End date for the project
 * @returns {Array} - Properly sized porTargets array
 */
export const ensurePorTargetsSize = (currentPorTargets, startDate, endDate) => {
  if (!startDate || !endDate) return currentPorTargets || [];
  
  const weeks = generateWeeklyDates(startDate, endDate);
  const existingTargets = currentPorTargets || [];
  
  // Create new array with correct size, preserving existing values
  return Array(weeks.length).fill(0).map((_, idx) => existingTargets[idx] || 0);
};