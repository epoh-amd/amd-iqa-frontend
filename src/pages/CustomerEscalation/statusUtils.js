// frontend/src/pages/CustomerEscalation/statusUtils.js
// Status management and icon utilities

import React from 'react';
import { AlertCircle, Clock, TrendingUp } from 'lucide-react';
import { STATUS_TRANSITIONS } from './constants';

/**
 * Get available status options based on current status
 * Implements proper status flow control:
 * - Open → Can only Close
 * - Closed → Can only Reopen  
 * - Reopened → Can only Close
 */
export const getAvailableStatusOptions = (currentStatus) => {
  return STATUS_TRANSITIONS[currentStatus] || [
    { value: 'Open', label: 'Open - Investigation ongoing' },
    { value: 'Closed', label: 'Closed - Investigation concluded' },
    { value: 'Reopened', label: 'Reopened - New evidence found' }
  ];
};

/**
 * Get status icon component
 */
export const getStatusIcon = (status) => {  
  switch (status) {  
    case 'Open':  
      return <AlertCircle className="status-icon open" />;  
    case 'Closed':  
      return <Clock className="status-icon closed" />;  
    case 'Reopened':  
      return <TrendingUp className="status-icon reopened" />;  
    default:  
      return null;  
  }  
};