// frontend/src/pages/MasterBuild/components/modals/ReworkPhotosModal.js

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faImage, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import api from '../../../../services/api';
import { SafeImage } from '../../../../utils/imageLoader';

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
                  <SafeImage 
                    src={photoUrl}
                    alt={`Rework photo ${index + 1}`}
                    fallbackType="photo"
                    onClick={() => window.open(photoUrl, '_blank')}
                    style={{ cursor: 'pointer' }}
                    onError={() => {
                      console.warn('Rework image failed to load:', photoUrl);
                    }}
                  />
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