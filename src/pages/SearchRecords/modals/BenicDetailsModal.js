// frontend/src/pages/SearchRecords/modals/BenicDetailsModal.js

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faNetworkWired, faTimes } from '@fortawesome/free-solid-svg-icons';

const BenicDetailsModal = ({ benicModal, setBenicModal }) => {
  if (!benicModal.show) return null;

  return (
    <div className="modal-overlay" onClick={() => setBenicModal({ show: false, chassisSN: null, benics: [] })}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            <FontAwesomeIcon icon={faNetworkWired} style={{ marginRight: '10px' }} />
            BENIC MAC Details - {benicModal.chassisSN}
          </h3>
          <button className="close-btn" onClick={() => setBenicModal({ show: false, chassisSN: null, benics: [] })}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        <div className="modal-body">
          {benicModal.benics.length > 0 ? (
            <table className="detail-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>MAC Address</th>
                </tr>
              </thead>
              <tbody>
                {benicModal.benics.map((mac, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td className="serial-number">{mac}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="no-data">No BENIC MAC addresses found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BenicDetailsModal;
