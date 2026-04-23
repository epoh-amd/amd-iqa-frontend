// frontend/src/pages/CustomerEscalation/ListView.js
// List view component for CustomerEscalation

import React from 'react';
import { Search, Eye } from 'lucide-react';
import { getStatusIcon } from './statusUtils';
import { calculateDaysOpen } from './utils';

const ListView = ({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  filteredEscalations,
  fetchEscalationDetails,
  setViewMode
}) => {
  return (
    <div className="customer-escalation">  
      <div className="page-header">  
        <h1>Customer Line Fallout</h1>  
        <button   
          className="btn-primary"  
          onClick={() => setViewMode('overview')}  
        >  
          View Overview  
        </button>  
      </div>  

      <div className="filters">  
        <div className="search-bar">  
          <Search size={20} />  
          <input  
            type="text"  
            placeholder="Search by ticket ID, chassis SN, or customer name..."  
            value={searchTerm}  
            onChange={(e) => setSearchTerm(e.target.value)}  
          />  
        </div>  
        <select  
          value={statusFilter}  
          onChange={(e) => setStatusFilter(e.target.value)}  
          className="status-filter"  
        >  
          <option value="all">All Status</option>  
          <option value="Open">Open</option>  
          <option value="Closed">Closed</option>  
          <option value="Reopened">Reopened</option>  
        </select>  
      </div>  

      <div className="escalation-table">  
        <table>  
          <thead>  
            <tr>  
              <th>Days Open</th>
              <th>Ticket ID</th>  
              <th>Customer Name</th>  
              <th>Technician</th>
              <th>Chassis SN</th>  
              <th>Project</th>  
              <th>Status</th>  
              <th>Created Date</th>  
              <th>Action</th>  
            </tr>  
          </thead>  
          <tbody>  
            {Array.isArray(filteredEscalations) && filteredEscalations.length > 0 ? (  
              filteredEscalations.map(escalation => {
                const daysOpen = calculateDaysOpen(escalation);
                return (
                  <tr key={escalation.ticket_id || Math.random().toString()}>  
                    <td>
                      {daysOpen !== null ? (
                        <span className="days-open-text">
                          {daysOpen} days
                        </span>
                      ) : (
                        <span className="no-days-open">-</span>
                      )}
                    </td>
                    <td>{escalation.ticket_id || 'N/A'}</td>  
                    <td>{escalation.customer_name || 'N/A'}</td>  
                    <td>
                      {(escalation.status === 'Closed' || escalation.status === 'Reopened') && escalation.handling_technician ? 
                        escalation.handling_technician : 
                        (escalation.status === 'Closed' || escalation.status === 'Reopened') ? 'N/A' : '-'
                      }
                    </td>
                    <td>{escalation.chassis_sn || 'N/A'}</td>  
                    <td>{escalation.project_name || 'N/A'}</td>  
                    <td>  
                      <span className={`status ${(escalation.status || '').toLowerCase()}`}>  
                        {getStatusIcon(escalation.status)} {escalation.status || 'Unknown'}  
                      </span>  
                    </td>  
                    <td>{escalation.created_date ? new Date(escalation.created_date).toLocaleDateString() : 'N/A'}</td>  
                    <td>  
                      <button   
                        className="btn-sm"  
                        onClick={() => fetchEscalationDetails(escalation.ticket_id)}  
                      >  
                        <Eye size={16} /> View  
                      </button>  
                    </td>  
                  </tr>  
                );
              })  
            ) : (  
              <tr>  
                <td colSpan="9" className="no-data">No escalations found</td>  
              </tr>  
            )}  
          </tbody>  
        </table>  
      </div>  
    </div>
  );
};

export default ListView;