// frontend/src/pages/MasterBuild/components/modals/CpuDetailsModal.js

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrochip, faTimes } from '@fortawesome/free-solid-svg-icons';

const CpuDetailsModal = ({ cpuModal, setCpuModal }) => {
  if (!cpuModal.show) return null;

  return (
    <div className="modal-overlay" onClick={() => setCpuModal({ show: false, chassisSN: null, cpus: [] })}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            <FontAwesomeIcon icon={faMicrochip} style={{ marginRight: '10px' }} />
            CPU Details - {cpuModal.chassisSN}
          </h3>
          <button className="close-btn" onClick={() => setCpuModal({ show: false, chassisSN: null, cpus: [] })}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        <div className="modal-body">
          {cpuModal.cpus.length > 0 ? (
            <table className="detail-table">
              <thead>
                <tr>
                  <th>Position</th>
                  <th>Serial Number</th>
                  <th>Socket Date Code</th>
                </tr>
              </thead>
              <tbody>
                {cpuModal.cpus.map((cpu, index) => (
                  <tr key={index}>
                    <td>{cpu.position}</td>
                    <td className="serial-number">{cpu.serialNumber || '-'}</td>
                    <td className="socket-date-code">{cpu.socketDateCode || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="no-data">No CPU serial numbers found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CpuDetailsModal;