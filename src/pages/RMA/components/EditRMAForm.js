import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faSave,
  faSpinner
} from '@fortawesome/free-solid-svg-icons';

import RMAInfoTable from './RMAInfoTable';
import api from '../../../services/api';
import '../../../assets/css/startBuild.css';
import { useAuth } from '../../../contexts/AuthContext';

const EditRMAForm = ({ buildData, onComplete, onCancel, onShowHistory }) => {
  useEffect(() => {
    const fetchRMA = async () => {
      try {
        const res = await api.getRma(buildData.chassis_sn);


        if (res) {
          setBuilds([{
            systemInfo: {
              bmcName: buildData?.bmc_name || '',
              partNumber: buildData?.system_pn || '',
              passFail: res.pass_fail || '',
              notes: res.notes || '',
              dimm: res.dimm || '',
              bmc: res.bmc || '',
              m2: res.m2 || '',
              liquidCooler: res.liquid_cooler || '',
              location_rma: res.location || '',
              rma: res.rma || '',
              status_rma: res.status || ''
            }
          }]);
        }
      } catch (err) {
        console.error('Error fetching RMA:', err);
      }
    };

    fetchRMA();
  }, [buildData.chassis_sn]);

  const [builds, setBuilds] = useState([{
    systemInfo: {
      bmcName: buildData?.bmc_name || '',
      partNumber: buildData?.system_pn || '',
      passFail: buildData?.pass_fail || '',
      notes: buildData?.notes || '',
      dimm: buildData?.dimm || '',
      bmc: buildData?.bmc || '',
      m2: buildData?.m2 || '',
      liquidCooler: buildData?.liquid_cooler || '',
      location_rma: buildData?.location_rma || '',
      rma: buildData?.rma || '',
      status_rma: buildData?.status_rma || ''
    }
  }]);

  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const [message, setMessage] = useState(null);

  const [showHistory, setShowHistory] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const handleInputChange = (index, section, field, value) => {
    const updated = [...builds];
    updated[index][section][field] = value;
    setBuilds(updated);
  };

  const handleToggleHistory = async () => {
    if (!showHistory) {
      try {
        setLoadingHistory(true);

        const res = await api.getRmaHistory(buildData.chassis_sn);
        setHistoryData(res);

      } catch (err) {
        console.error(err);
      } finally {
        setLoadingHistory(false);
      }
    }
    setShowHistory(prev => !prev);
  };

  const handleSave = async () => {

    setSaving(true);
    setMessage(null);

    try {
      const data = builds[0].systemInfo;

      await api.updateRMA({
        chassis_sn: buildData.chassis_sn,   // 🔥 IMPORTANT FK
        pass_fail: data.passFail,
        notes: data.notes,
        dimm: data.dimm,
        bmc: data.bmc,
        m2: data.m2,
        liquid_cooler: data.liquidCooler,
        location: data.location_rma,
        rma: data.rma,
        status: data.status_rma,
        updated_by: user.full_name
      });

      setMessage({
        type: 'success',
        text: 'RMA updated successfully'
      });

      setTimeout(() => onComplete(), 1000);

    } catch (err) {
      console.error(err);
      setMessage({
        type: 'error',
        text: 'Failed to update RMA'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="start-build-container edit-mode">

      {/* HEADER (same style) */}
      <div className="page-header">
        <h1>RMA Edit Data</h1>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-secondary" onClick={onCancel}>
            <FontAwesomeIcon icon={faArrowLeft} /> Back
          </button>

          <button
            className="btn-secondary"
            onClick={handleToggleHistory}
          >
            {showHistory ? 'Hide RMA History' : 'View RMA History'}
          </button>
        </div>
      </div>

      {/* MESSAGE */}
      {message && (
        <div className={`alert ${message.type}`}>
          {message.text}
        </div>
      )}

      {showHistory && (
        <div style={{ margin: '20px 0' }}>
          <h3>RMA History</h3>

          {loadingHistory ? (
            <p>Loading...</p>
          ) : historyData.length === 0 ? (
            <p>No history found</p>
          ) : (
            <table className="builds-table">
              <thead>
                <tr>
                  <th>Updated At</th>
                  <th>Updated By</th>
                  <th>Pass/Fail</th>
                  <th>Notes</th>
                  <th>DIMM</th>
                  <th>BMC</th>
                  <th>M2</th>
                  <th>Liquid Cooler</th>
                  <th>Location</th>
                  <th>RMA</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {historyData.map((item, index) => (
                  <tr key={index}>
                    <td>
                      {item.updated_at
                        ? new Date(item.updated_at).toLocaleString('en-US', {
                          timeZone: 'America/Chicago'
                        })
                        : '-'}
                    </td>
                    <td>{item.updated_by || '-'}</td>
                    <td>{item.pass_fail || '-'}</td>
                    <td>{item.notes || '-'}</td>
                    <td>{item.dimm || '-'}</td>
                    <td>{item.bmc || '-'}</td>
                    <td>{item.m2 || '-'}</td>
                    <td>{item.liquid_cooler || '-'}</td>
                    <td>{item.location || '-'}</td>
                    <td>{item.rma || '-'}</td>
                    <td>{item.status || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* 🔥 RMA TABLE (same layout as system info) */}
      <br></br>
      <RMAInfoTable
        builds={builds}
        handleInputChange={handleInputChange}
      />

      {/* SAVE BUTTON */}
      <div style={{ marginTop: 20 }}>
        <button
          className="btn-save-single"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <>
              <FontAwesomeIcon icon={faSpinner} spin /> Saving...
            </>
          ) : (
            <>
              <FontAwesomeIcon icon={faSave} /> Save RMA
            </>
          )}
        </button>
      </div>

    </div>
  );
};

export default EditRMAForm;