// frontend/src/pages/StartBuild/DraftRestoreBanner.js

import React from 'react';
import { AlertCircle, Clock, X } from 'lucide-react';
import '../../assets/css/DraftRestoreBanner.css';

/**
 * Banner component shown when a saved draft is detected
 * Allows user to restore or discard the draft
 *
 * @param {Object} draftInfo - Draft metadata (buildCount, timestamp, age)
 * @param {Function} onRestore - Callback when user clicks Restore
 * @param {Function} onDiscard - Callback when user clicks Discard
 */
export const DraftRestoreBanner = ({ draftInfo, onRestore, onDiscard, autoRestored }) => {
  if (!draftInfo) return null;

  return (
    <div className="draft-restore-banner">
      <div className="banner-content">
        <AlertCircle className="icon-warning" size={24} />
        <div className="banner-text">
          <strong>{autoRestored ? 'Draft Restored' : 'Unsaved Draft Found'}</strong>
          <span className="draft-details">
            {draftInfo.buildCount} build{draftInfo.buildCount > 1 ? 's' : ''} ·
            Last saved {draftInfo.age}
          </span>
        </div>
      </div>
      <div className="banner-actions">
        {autoRestored ? (
          <button
            className="btn-restore"
            onClick={() => onDiscard()}
            type="button"
          >
            <X size={16} />
            Dismiss
          </button>
        ) : (
          <>
            <button
              className="btn-restore"
              onClick={onRestore}
              type="button"
            >
              <Clock size={16} />
              Restore Draft
            </button>
            <button
              className="btn-discard"
              onClick={onDiscard}
              type="button"
            >
              <X size={16} />
              Discard
            </button>
          </>
        )}
      </div>
    </div>
  );
};
