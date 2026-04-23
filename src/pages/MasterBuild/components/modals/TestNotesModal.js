// frontend/src/pages/MasterBuild/components/modals/TestNotesModal.js

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faTimes, faImage, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import api from '../../../../services/api';

const TestNotesModal = ({ notesModal, setNotesModal, loadingPhotos }) => {
  if (!notesModal.show) return null;

  return (
    <div className="modal-overlay" onClick={() => setNotesModal({ show: false, type: null, notes: '', photos: [] })}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{notesModal.type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} - Failed Test Details</h3>
          <button className="close-btn" onClick={() => setNotesModal({ show: false, type: null, notes: '', photos: [] })}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        <div className="modal-body">
          {loadingPhotos ? (
            <div className="loading-container">
              <FontAwesomeIcon icon={faSpinner} spin size="2x" />
              <p>Loading test details...</p>
            </div>
          ) : (
            <>
              <div className="notes-section">
                <h4>Notes:</h4>
                <p className="test-notes-content">{notesModal.notes}</p>
              </div>
              
              {notesModal.photos.length > 0 && (
                <div className="photos-section">
                  <h4>Photos:</h4>
                  <div className="photo-grid">
                    {notesModal.photos.map((photo, index) => {
                      const photoUrl = api.getPhotoUrl(photo.file_path);
                      return (
                        <div key={index} className="photo-item">
                          <img 
                            src={photoUrl}
                            alt={`${notesModal.type} photo ${index + 1}`}
                            onClick={() => window.open(photoUrl, '_blank')}
                            onError={(e) => {
                              console.error('Image failed to load:', photoUrl);
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'block';
                            }}
                          />
                          <div className="photo-error" style={{ display: 'none' }}>
                            <FontAwesomeIcon icon={faExclamationTriangle} />
                            <span>Image not found</span>
                          </div>
                          <div className="photo-info">
                            <FontAwesomeIcon icon={faImage} />
                            <span>Click to enlarge</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestNotesModal;