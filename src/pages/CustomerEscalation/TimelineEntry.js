// frontend/src/pages/CustomerEscalation/TimelineEntry.js
// Timeline entry component for displaying communication history

import React from 'react';
import { User, UserCheck, Eye, Download } from 'lucide-react';
import { getTimelineIcon, formatTimelineContent } from './timelineUtils';
import { renderFileIcon } from './fileUtils';
import api from '../../services/api';

const TimelineEntry = ({ entry, level = 0 }) => {
  const getFileUrl = (file) => {
    return api.getTimelineFileUrl(file.file_path);
  };

  return (
    <div key={entry.id} className={`timeline-entry level-${level} ${entry.actor_type}`}>
      <div className="timeline-item">
        <div className="timeline-marker">
          {getTimelineIcon(entry.timeline_type)}
        </div>
        <div className="timeline-card">
          <div className="timeline-header">
            <div className="timeline-actor">
              {entry.actor_type === 'customer' ? <User size={16} /> : <UserCheck size={16} />}
              <span>{entry.actor_name}</span>
              <span className="actor-type">({entry.actor_type})</span>
            </div>
            <div className="timeline-date">
              {new Date(entry.created_at).toLocaleString()}
            </div>
          </div>
          {formatTimelineContent(entry)}
          {entry.attachments && entry.attachments.length > 0 && (
            <div className="timeline-attachments">
              <h5>📎 Attachments ({entry.attachments.length}):</h5>
              <div className="attachment-grid">
                {entry.attachments.map(file => (
                  <div key={file.id} className="attachment-item">
                    <div className="attachment-icon">
                      {renderFileIcon(file.file_name, file.mime_type)}
                    </div>
                    <div className="attachment-info">
                      <span className="file-name" title={file.file_name}>
                        {file.file_name.length > 20 ? 
                          `${file.file_name.substring(0, 20)}...` : 
                          file.file_name
                        }
                      </span>
                      <span className="file-size">({(file.file_size / 1024).toFixed(1)} KB)</span>
                      <span className="file-type">{file.file_type.replace('_', ' ')}</span>
                    </div>
                    <div className="attachment-actions">
                      {file.mime_type?.startsWith('image/') && (
                        <button 
                          className="btn-view"
                          onClick={() => window.open(getFileUrl(file), '_blank')}
                          title="View image"
                        >
                          <Eye size={14} />
                        </button>
                      )}
                      <a 
                        href={getFileUrl(file)}
                        download={file.file_name}
                        className="btn-download"
                        title="Download file"
                      >
                        <Download size={14} />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      {entry.children && entry.children.length > 0 && (
        <div className="timeline-children">
          {entry.children.map(child => <TimelineEntry key={child.id} entry={child} level={level + 1} />)}
        </div>
      )}
    </div>
  );
};

export default TimelineEntry;