// frontend/src/pages/CustomerEscalation/timelineUtils.js
// Timeline component utilities and formatters

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { TIMELINE_ICONS } from './constants';

/**
 * Get timeline icon based on type
 */
export const getTimelineIcon = (type) => {
  const iconName = TIMELINE_ICONS[type] || TIMELINE_ICONS.default;
  return <FontAwesomeIcon icon={iconName} className={`timeline-icon ${type || 'default'}`} />;
};

/**
 * Format timeline content based on entry type
 */
export const formatTimelineContent = (entry) => {
  switch (entry.timeline_type) {
    case 'initial_submission':
      return (
        <div className="timeline-content">
          <h4>Initial Escalation Submitted</h4>
          <p>{entry.response_text}</p>
        </div>
      );
    case 'technician_request':
      return (
        <div className="timeline-content">
          <h4>Request Sent - {entry.request_type?.replace('_', ' ').toUpperCase()}</h4>
          <p>{entry.request_message}</p>
          <div className="request-status">
            {entry.children && entry.children.length > 0 ? 
              <span className="status-fulfilled">✓ Responded</span> : 
              <span className="status-pending">⏳ Awaiting Response</span>
            }
          </div>
        </div>
      );
    case 'customer_response':
      return (
        <div className="timeline-content">
          <h4>Customer Response</h4>
          {entry.response_text && <p>{entry.response_text}</p>}
          {entry.error_number && <p><strong>Related to Error #{entry.error_number}</strong></p>}
        </div>
      );
    case 'technician_update':
      return (
        <div className="timeline-content">
          <h4>Analysis Update</h4>
          {entry.old_status && entry.new_status && entry.old_status !== entry.new_status && (
            <p><strong>Status Changed:</strong> From <span className="status-old">{entry.old_status}</span> to <span className="status-new">{entry.new_status}</span></p>
          )}
          {entry.failure_mode && <p><strong>Failure Mode:</strong> {entry.failure_mode}</p>}
          {entry.failure_category && <p><strong>Category:</strong> {entry.failure_category}</p>}
          {entry.technician_notes && <p><strong>Notes:</strong> {entry.technician_notes}</p>}
        </div>
      );
    case 'status_change':
      return (
        <div className="timeline-content">
          <h4>Status Changed</h4>
          <p>From <span className="status-old">{entry.old_status}</span> to <span className="status-new">{entry.new_status}</span></p>
        </div>
      );
    default:
      return <div className="timeline-content"><p>Timeline entry</p></div>;
  }
};