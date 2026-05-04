// frontend/src/pages/SearchRecords/modals/ReworkPhotosModal.js

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faImage, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import api from '../../../services/api';

const ReworkPhotosModal = ({ reworkPhotosModal, setReworkPhotosModal }) => {
  if (!reworkPhotosModal.show) return null;

  return (
    <div className="modal-overlay" onClick={() => setReworkPhotosModal({ show: false, photos: [] })}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Rework Photos</h3>
          <button className="close-btn" onClick={() => setReworkPhotosModal({ show: false, photos: [] })}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        <div className="modal-body">
          <div className="photo-grid">
            {reworkPhotosModal.photos.map((photo, index) => {
              const photoUrl = api.getPhotoUrl(photo.file_path);
              return (
                <div key={index} className="photo-item">
                  <img 
                    src={photoUrl}
                    alt={`Rework photo ${index + 1}`}
                    onClick={() => window.open(photoUrl, '_blank')}
                    onError={(e) => {
                      console.error('Rework image failed to load:', photoUrl);
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
                    <span>{photo.photo_type.replace(/_/g, ' ')}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReworkPhotosModal;