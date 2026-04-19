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

const EditRMAForm = ({ buildData, onComplete, onCancel }) => {
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
  const [message, setMessage] = useState(null);

  const handleInputChange = (index, section, field, value) => {
    const updated = [...builds];
    updated[index][section][field] = value;
    setBuilds(updated);
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
        status: data.status_rma
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

        <button className="btn-secondary" onClick={onCancel}>
          <FontAwesomeIcon icon={faArrowLeft} /> Back
        </button>
      </div>

      {/* MESSAGE */}
      {message && (
        <div className={`alert ${message.type}`}>
          {message.text}
        </div>
      )}

      {/* 🔥 RMA TABLE (same layout as system info) */}
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