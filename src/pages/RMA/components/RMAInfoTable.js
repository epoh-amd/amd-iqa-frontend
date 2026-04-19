import React from 'react';
import '../../../assets/css/rma.css';

const RMAInfoTable = ({ builds, handleInputChange }) => {

  return (
    <div className="builds-table-container">
      <table className="builds-table">
        <thead>
          <tr>
            <th className="build-reference">BMC Name</th>
            <th>Part Number</th>
            <th>Pass / Fail</th>
            <th>Notes</th>
            <th>DIMM</th>
            <th>BMC</th>
            <th>M.2</th>
            <th>Liquid Cooler</th>
            <th>Location</th>
            <th>RMA</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {builds.map((build, index) => (
            <tr key={index} className={`build-row ${build.systemInfo?.status}`}>

              <td className="build-reference">
                {build.systemInfo?.bmcName || '-'}

              </td>

              <td className="build-reference">
                {build.systemInfo?.partNumber || '-'}
              </td>

              <td>
                <select value={build.systemInfo?.passFail || ''}
                 onChange={(e) =>
                  handleInputChange(index, 'systemInfo', 'passFail', e.target.value)
                }>
                  <option value="">Select</option>
                  <option value="Pass">Pass</option>
                  <option value="Fail">Fail</option>
                </select>
              </td>

              <td>  
                  <textarea value={build.systemInfo?.notes || ''} 
                    onChange={(e) =>
                      handleInputChange(index, 'systemInfo', 'notes', e.target.value)
                    }>
                   </textarea>
              </td>

              <td>
                <select value={build.systemInfo?.dimm || ''} 
                 onChange={(e) =>
                  handleInputChange(index, 'systemInfo', 'dimm', e.target.value)
                }>
                  <option value="">Select</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </td>

              <td>
                <select value={build.systemInfo?.bmc || ''} 
                 onChange={(e) =>
                  handleInputChange(index, 'systemInfo', 'bmc', e.target.value)
                }>
                  <option value="">Select</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </td>

              <td>
                <select 
                value={build.systemInfo?.m2 || ''} 
                onChange={(e) =>
                  handleInputChange(index, 'systemInfo', 'm2', e.target.value)
                }>
                  <option value="">Select</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </td>

              <td>
                <select 
                value={build.systemInfo?.liquidCooler || ''} 
                onChange={(e) =>
                  handleInputChange(index, 'systemInfo', 'liquidCooler', e.target.value)
                }>
                  <option value="">Select</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </td>

              <td>
                <select
                 value={build.systemInfo?.location_rma || ''}
                 onChange={(e) =>
                  handleInputChange(index, 'systemInfo', 'location_rma', e.target.value)
                }
                >
                  <option value="">Select</option>
                  <option value="Metcenter">Metcenter</option>
                  <option value="Ceva">Ceva</option>
                  <option value="GUI Sheet location">GUI Sheet location</option>
                  <option value="Oracle">Oracle</option>
                </select>
              </td>

              <td>
                <select 
                value={build.systemInfo?.rma || ''}
                onChange={(e) =>
                  handleInputChange(index, 'systemInfo', 'rma', e.target.value)
                } >
                  <option value="">Select</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </td>

              <td>
                <select 
                value={build.systemInfo?.status_rma || ''}
                onChange={(e) =>
                  handleInputChange(index, 'systemInfo', 'status_rma', e.target.value)
                }>
                 <option value="">Select</option>
                  <option value="Available">Available</option>
                  <option value="Delivered">Delivered</option>
                </select>
              </td>

            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RMAInfoTable;