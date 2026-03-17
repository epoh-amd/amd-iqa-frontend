// frontend/src/pages/SearchRecords/modals/DimmDetailsModal.js

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMemory, faTimes } from '@fortawesome/free-solid-svg-icons';

const DimmDetailsModal = ({ dimmModal, setDimmModal }) => {
  if (!dimmModal.show) return null;

  return (
    <div className="modal-overlay" onClick={() => setDimmModal({ show: false, chassisSN: null, dimms: [] })}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            <FontAwesomeIcon icon={faMemory} style={{ marginRight: '10px' }} />
            DIMM Details - {dimmModal.chassisSN}
          </h3>
          <button className="close-btn" onClick={() => setDimmModal({ show: false, chassisSN: null, dimms: [] })}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        <div className="modal-body">
          {dimmModal.dimms.length > 0 ? (
            <table className="detail-table">
              <thead>
                <tr>
                  <th>Position</th>
                  <th>Serial Number</th>
                </tr>
              </thead>
              <tbody>
                {dimmModal.dimms.map((dimm, index) => (
                  <tr key={index}>
                    <td>DIMM {dimm.position}</td>
                    <td className="serial-number">{dimm.serialNumber}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="no-data">No DIMM serial numbers found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DimmDetailsModal;