// frontend/src/pages/MasterBuild/components/modals/FailuresModal.js

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faTimes } from '@fortawesome/free-solid-svg-icons';

const FailuresModal = ({ failuresModal, setFailuresModal, loadingFailures }) => {
  if (!failuresModal.show) return null;

  return (
    <div className="modal-overlay" onClick={() => setFailuresModal({ show: false, failures: [] })}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Failure Details</h3>
          <button className="close-btn" onClick={() => setFailuresModal({ show: false, failures: [] })}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        <div className="modal-body">
          {loadingFailures ? (
            <div className="loading-container">
              <FontAwesomeIcon icon={faSpinner} spin size="2x" />
              <p>Loading failure details...</p>
            </div>
          ) : failuresModal.failures.length > 0 ? (
            <table className="failure-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Failure Mode</th>
                  <th>Failure Category</th>
                </tr>
              </thead>
              <tbody>
                {failuresModal.failures.map((failure, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{failure.mode}</td>
                    <td>{failure.category}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="no-data">No failure details found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FailuresModal;