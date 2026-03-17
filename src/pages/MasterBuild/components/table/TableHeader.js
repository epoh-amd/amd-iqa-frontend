// frontend/src/pages/MasterBuild/components/table/TableHeader.js

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronRight } from '@fortawesome/free-solid-svg-icons';

const TableHeader = ({ collapsedSections, toggleSection, getColumnCount }) => {
  return (
    <thead>
      <tr>
        <th colSpan="2" className="sticky-header">Reference</th>
        {!collapsedSections.general && (
          <th colSpan={getColumnCount('general')} className="section-header" onClick={() => toggleSection('general')}>
            <FontAwesomeIcon icon={faChevronDown} />
            General Information
          </th>
        )}
        {collapsedSections.general && (
          <th className="section-header collapsed" onClick={() => toggleSection('general')}>
            <FontAwesomeIcon icon={faChevronRight} />
            <span>General</span>
          </th>
        )}
        {/* System Information header now covers from Project Name to CPU Vendor */}
        {!collapsedSections.systemInfo && (
          <th colSpan={getColumnCount('systemInfo') + 1} className="section-header" onClick={() => toggleSection('systemInfo')}>
            <FontAwesomeIcon icon={faChevronDown} />
            System Information
          </th>
        )}
        {collapsedSections.systemInfo && (
          <th className="section-header collapsed" onClick={() => toggleSection('systemInfo')}>
            <FontAwesomeIcon icon={faChevronRight} />
            <span>System</span>
          </th>
        )}
        {!collapsedSections.cpuInfo && (
          <th colSpan={getColumnCount('cpuInfo')} className="section-header" onClick={() => toggleSection('cpuInfo')}>
            <FontAwesomeIcon icon={faChevronDown} />
            CPU Information
          </th>
        )}
        {collapsedSections.cpuInfo && (
          <th className="section-header collapsed" onClick={() => toggleSection('cpuInfo')}>
            <FontAwesomeIcon icon={faChevronRight} />
            <span>CPU</span>
          </th>
        )}
        {!collapsedSections.componentInfo && (
          <th colSpan={getColumnCount('componentInfo')} className="section-header" onClick={() => toggleSection('componentInfo')}>
            <FontAwesomeIcon icon={faChevronDown} />
            Component Information
          </th>
        )}
        {collapsedSections.componentInfo && (
          <th className="section-header collapsed" onClick={() => toggleSection('componentInfo')}>
            <FontAwesomeIcon icon={faChevronRight} />
            <span>Components</span>
          </th>
        )}
        {!collapsedSections.testing && (
          <th colSpan={getColumnCount('testing')} className="section-header" onClick={() => toggleSection('testing')}>
            <FontAwesomeIcon icon={faChevronDown} />
            Testing
          </th>
        )}
        {collapsedSections.testing && (
          <th className="section-header collapsed" onClick={() => toggleSection('testing')}>
            <FontAwesomeIcon icon={faChevronRight} />
            <span>Testing</span>
          </th>
        )}
        {!collapsedSections.bkcDetails && (
          <th colSpan={getColumnCount('bkcDetails')} className="section-header" onClick={() => toggleSection('bkcDetails')}>
            <FontAwesomeIcon icon={faChevronDown} />
            BKC Details
          </th>
        )}
        {collapsedSections.bkcDetails && (
          <th className="section-header collapsed" onClick={() => toggleSection('bkcDetails')}>
            <FontAwesomeIcon icon={faChevronRight} />
            <span>BKC</span>
          </th>
        )}
        {!collapsedSections.qualityIndicator && (
          <th colSpan={getColumnCount('qualityIndicator')} className="section-header" onClick={() => toggleSection('qualityIndicator')}>
            <FontAwesomeIcon icon={faChevronDown} />
            Quality Indicator
          </th>
        )}
        {collapsedSections.qualityIndicator && (
          <th className="section-header collapsed" onClick={() => toggleSection('qualityIndicator')}>
            <FontAwesomeIcon icon={faChevronRight} />
            <span>Quality</span>
          </th>
        )}
        {!collapsedSections.teamLocation && (
          <th colSpan={getColumnCount('teamLocation')} className="section-header master-section" onClick={() => toggleSection('teamLocation')}>
            <FontAwesomeIcon icon={faChevronDown} />
            Team & Location Details
          </th>
        )}
        {collapsedSections.teamLocation && (
          <th className="section-header master-section collapsed" onClick={() => toggleSection('teamLocation')}>
            <FontAwesomeIcon icon={faChevronRight} />
            <span>Team</span>
          </th>
        )}
        {!collapsedSections.buildInfo && (
          <th colSpan={getColumnCount('buildInfo')} className="section-header master-section" onClick={() => toggleSection('buildInfo')}>
            <FontAwesomeIcon icon={faChevronDown} />
            Build & ChangeGear Information
          </th>
        )}
        {collapsedSections.buildInfo && (
          <th className="section-header master-section collapsed" onClick={() => toggleSection('buildInfo')}>
            <FontAwesomeIcon icon={faChevronRight} />
            <span>Build</span>
          </th>
        )}
        {!collapsedSections.misc && (
          <th colSpan={getColumnCount('misc')} className="section-header master-section" onClick={() => toggleSection('misc')}>
            <FontAwesomeIcon icon={faChevronDown} />
            MISC
          </th>
        )}
        {collapsedSections.misc && (
          <th className="section-header master-section collapsed" onClick={() => toggleSection('misc')}>
            <FontAwesomeIcon icon={faChevronRight} />
            <span>MISC</span>
          </th>
        )}
      </tr>
      <tr>
        {/* Reference - Always visible */}
        <th className="bmc-name-header col-bmc-name">BMC Name</th>
        <th className="created-date-header col-created-date">Created Date</th>
        
        {/* General Information */}
        {!collapsedSections.general && (
          <>
            <th className="col-standard">Location</th>
            <th className="col-standard">Configuration</th>
          </>
        )}
        {collapsedSections.general && (
          <th className="collapsed-column-header col-collapsed"></th>
        )}
        
        {/* System Information */}
        {!collapsedSections.systemInfo && (
          <>
            <th className="col-standard">Project Name</th>
            <th className="col-standard">System P/N</th>
            <th className="col-standard">Platform Type</th>
            <th className="col-standard">Manufacturer</th>
            <th className="col-standard">Chassis S/N</th>
            <th className="col-standard">Chassis Type</th>
            <th className="col-standard">BMC MAC</th>
            <th className="col-standard">MB S/N</th>
            <th className="col-standard">Ethernet MAC</th>
            <th className="col-standard">CPU Socket</th>
            <th className="col-standard column-group-separator">CPU Vendor</th>
          </>
        )}
        {collapsedSections.systemInfo && (
          <th className="collapsed-column-header col-collapsed"></th>
        )}
        
        {/* CPU Information */}
        {!collapsedSections.cpuInfo && (
          <>
            <th className="col-standard">CPU Program Name</th>
            <th className="col-standard column-group-separator">CPU QTY</th>
          </>
        )}
        {collapsedSections.cpuInfo && (
          <th className="collapsed-column-header col-collapsed"></th>
        )}
        
        {/* Component Information */}
        {!collapsedSections.componentInfo && (
          <>
            <th className="col-standard">M.2 P/N</th>
            <th className="col-standard">M.2 S/N</th>
            <th className="col-standard">DIMM P/N</th>
            <th className="col-standard column-group-separator">DIMM QTY</th>
          </>
        )}
        {collapsedSections.componentInfo && (
          <th className="collapsed-column-header col-collapsed"></th>
        )}
        
        {/* Testing */}
        {!collapsedSections.testing && (
          <>
            <th className="col-standard">Visual Inspection</th>
            <th className="col-standard">Boot Status</th>
            <th className="col-standard">DIMMs Detected</th>
            <th className="col-standard column-group-separator">LOM Working</th>
          </>
        )}
        {collapsedSections.testing && (
          <th className="collapsed-column-header col-collapsed"></th>
        )}
        
        {/* BKC Details */}
        {!collapsedSections.bkcDetails && (
          <>
            <th className="col-standard">BIOS Version</th>
            <th className="col-standard">SCM FPGA</th>
            <th className="col-standard">HPM FPGA</th>
            <th className="col-standard column-group-separator">BMC Version</th>
          </>
        )}
        {collapsedSections.bkcDetails && (
          <th className="collapsed-column-header col-collapsed"></th>
        )}
        
        {/* Quality Indicator */}
        {!collapsedSections.qualityIndicator && (
          <>
            <th className="col-standard">FPY Status</th>
            <th className="col-standard">Build Status</th>
            <th className="col-wide">Problem Description</th>
            <th className="col-standard">Failure Mode</th>
            <th className="col-standard column-group-separator">Rework</th>
          </>
        )}
        {collapsedSections.qualityIndicator && (
          <th className="collapsed-column-header col-collapsed"></th>
        )}
        
        {/* Master Build Fields - REMOVED ALL REQUIRED INDICATORS */}
        {/* Team & Location */}
        {!collapsedSections.teamLocation && (
        <>
            <th className="col-standard" style={{ backgroundColor: '#e3f2fd' }}>Location</th>
            <th className="col-standard" style={{ backgroundColor: '#e3f2fd' }}>Custom Location</th>
            <th className="col-standard" style={{ backgroundColor: '#e3f2fd' }}>Team/Security</th>
            <th className="col-wide column-group-separator" style={{ backgroundColor: '#e3f2fd' }}>Department</th>
        </>
        )}
        {collapsedSections.teamLocation && (
          <th className="collapsed-column-header master-section col-collapsed"></th>
        )}
        
        {/* Build & ChangeGear */}
        {!collapsedSections.buildInfo && (
          <>
            <th className="col-standard" style={{ backgroundColor: '#e3f2fd' }}>Build Engineer</th>
            <th className="col-wide" style={{ backgroundColor: '#e3f2fd' }}>Build Name</th>
            <th className="col-standard" style={{ backgroundColor: '#e3f2fd' }}>Jira Ticket No.</th>
            <th className="col-standard column-group-separator" style={{ backgroundColor: '#e3f2fd' }}>Changegear Asset ID</th>
          </>
        )}
        {collapsedSections.buildInfo && (
          <th className="collapsed-column-header master-section col-collapsed"></th>
        )}
        
        {/* MISC */}
        {!collapsedSections.misc && (
          <>
            <th className="col-notes" style={{ backgroundColor: '#e3f2fd' }}>Notes</th>
            <th className="col-standard" style={{ backgroundColor: '#e3f2fd' }}>SMS Order</th>
            <th className="col-standard" style={{ backgroundColor: '#e3f2fd' }}>Cost Center</th>
            <th className="col-standard" style={{ backgroundColor: '#e3f2fd' }}>Capitalization</th>
            <th className="col-standard" style={{ backgroundColor: '#e3f2fd' }}>Delivery Date</th>
            <th className="col-standard" style={{ backgroundColor: '#e3f2fd' }}>Status</th>
          </>
        )}
        {collapsedSections.misc && (
          <th className="collapsed-column-header master-section col-collapsed"></th>
        )}
      </tr>
    </thead>
  );
};

export default TableHeader;