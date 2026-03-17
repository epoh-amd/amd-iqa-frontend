// frontend/src/services/api.js - FIXED FILE URL HANDLING

import axios from 'axios';
import { logger } from '../utils/logger';
import { handleError, getErrorMessage } from '../utils/errorHandler';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

const api = {  
  // ============================================================================
  // STARTBUILD API METHODS
  // ============================================================================

  /**
   * Get platform type information based on system part number
   * Used for auto-populating platform details in SystemInfo step
   * 
   * @param {string} systemPN - System part number from barcode scan
   * @returns {Promise<object>} - { platformType: string }
   * @throws {Error} - Network or server errors
   */
  getPlatformInfo: async (systemPN) => {  
    try {  
      const response = await axios.get(`${API_URL}/platform-info/${systemPN}`);  
      return response.data;  
    } catch (error) {  
      const errorInfo = handleError(error, 'getPlatformInfo', '/platform-info');
      logger.error('Error fetching platform info:', errorInfo);
      throw new Error(errorInfo.message);  
    }  
  },  
    
  /**
   * Search part numbers with autocomplete functionality
   * Supports M.2 (Drive) and DIMM (Module) part number lookup
   * 
   * @param {string} query - Partial part number search term
   * @param {string} type - Part type: 'Drive' for M.2, 'Module' for DIMM
   * @returns {Promise<object>} - { suggestions: string[] }
   */
  searchPartNumbers: async (query, type) => {  
    try {  
      logger.log(`Sending autocomplete request: query=${query}, type=${type}`);  
      const response = await axios.get(`${API_URL}/part-numbers/search`, {  
        params: { query, type }  
      });  
      logger.log('Autocomplete response:', response.data);  
      return response.data;  
    } catch (error) {  
      const errorInfo = handleError(error, 'searchPartNumbers', '/part-numbers/search');
      logger.error('Error searching part numbers:', errorInfo);  
      // Return empty suggestions instead of throwing to prevent form errors  
      return { suggestions: [] };  
    }  
  },  
    
  /**
   * Check for duplicate serial numbers across the system
   * Validates uniqueness for new builds or excludes current build in rework mode
   * 
   * @param {object} serialNumbers - Object containing all serial numbers to check
   * @param {boolean} isReworkMode - If true, excludes current build from duplicate check
   * @returns {Promise<object>} - { hasDuplicates: boolean, duplicates: object }
   * @throws {Error} - Validation errors (M.2 format, build not found, etc.)
   */
  checkDuplicates: async (serialNumbers, isReworkMode = false) => {
  try {
    const requestData = { 
      ...serialNumbers, 
      buildEngineer: serialNumbers.buildEngineer, // NEW FIELD
      jiraTicketNo: serialNumbers.jiraTicketNo, // NEW FIELD  
      cpuVendor: serialNumbers.cpuVendor, // NEW FIELD
      isReworkMode 
    };
    const response = await axios.post(`${API_URL}/check-duplicates`, requestData);
    return response.data;
  } catch (error) {
    const errorInfo = handleError(error, 'checkDuplicates', '/check-duplicates');
    throw new Error(errorInfo.message);
  }
},
    
  /**
   * Save complete build data to database
   * Handles system info, quality details, DIMM SNs, photos, and failure records
   * 
   * @param {object} buildData - Complete build object with all steps data
   * @returns {Promise<object>} - Success response with chassis SN and status
   * @throws {Error} - Validation or database errors
   */
saveBuild: async (buildData) => {
  try {
    logger.log('Saving build data with status:', {
      chassis_sn: buildData.systemInfo?.chassisSN,
      status: buildData.status,
      saveOption: buildData.qualityDetails?.saveOption,
      buildEngineer: buildData.buildEngineer || buildData.build_engineer // Log both for debug
    });
    // Always send both camelCase and snake_case for backend compatibility
    const requestData = {
      ...buildData,
      buildEngineer: buildData.buildEngineer || buildData.build_engineer,
      build_engineer: buildData.buildEngineer || buildData.build_engineer,
      location: buildData.location,
      isCustomConfig: buildData.isCustomConfig,
      systemInfo: buildData.systemInfo,
      qualityDetails: buildData.qualityDetails,
      status: buildData.status
    };
    
    const response = await axios.post(`${API_URL}/builds`, requestData);
    
    logger.log('Build save response:', {
      success: response.data.success,
      status: response.data.status,
      chassisSN: response.data.chassisSN
    });
    
    return response.data;
  } catch (error) {
    const errorInfo = handleError(error, 'saveBuild', '/builds');
    logger.error('Error saving build:', errorInfo);

    // Preserve original error response for detailed error handling
    const enhancedError = new Error(errorInfo.message);
    enhancedError.response = error.response;
    enhancedError.originalError = error;
    throw enhancedError;
  }
},  
      
  /**
   * Retrieve complete build details by chassis serial number
   * Includes all system info, DIMM SNs, photos, and quality data
   * 
   * @param {string} chassisSN - Chassis serial number
   * @returns {Promise<object>} - Complete build record
   * @throws {Error} - Network errors or build not found
   */
  getBuild: async (chassisSN) => {  
    try {  
      const response = await axios.get(`${API_URL}/builds/${chassisSN}`);  
      return response.data;  
    } catch (error) {  
      console.error('Error fetching build:', error);  
      throw error;  
    }  
  },  

  /**
 * Retrieve all project names
 * 
 * @returns {Promise<Array>} - Array of project names
 * @throws {Error} - Network errors
 */
getProjects: async () => {
  try {
    const response = await axios.get(`${API_URL}/dashboard/projects`);
    return response.data;
  } catch (error) {
    console.error('Error fetching projects:', error);
    throw error;
  }
},
    
  /**
   * Get complete build details with quality data and failure information
   * More comprehensive than getBuild - includes formatted quality details and failures
   * 
   * @param {string} chassisSN - Chassis serial number
   * @returns {Promise<object>} - Complete build record with quality details structure
   * @throws {Error} - Network errors or build not found
   */
  getBuildDetails: async (chassisSN) => {  
    try {  
      const response = await axios.get(`${API_URL}/builds/${chassisSN}/complete`);  
      return response.data;  
    } catch (error) {  
      console.error('Error fetching build details:', error);  
      throw error;  
    }  
  },  
    
  /**
   * Get manufacturer information based on platform prefix
   * Used for auto-populating manufacturer field from system part number
   * 
   * @param {string} platformPrefix - Platform prefix extracted from system PN
   * @returns {Promise<object>} - { manufacturer: string }
   */
  getManufacturer: async (platformPrefix) => {  
    try {  
      console.log(`API call for manufacturer with prefix: ${platformPrefix}`);  
      const response = await axios.get(`${API_URL}/manufacturer/${platformPrefix}`);  
      console.log('Manufacturer API response:', response.data);  
      return response.data;  
    } catch (error) {  
      console.error('Error fetching manufacturer:', error);  
      // Check if it's a 404 (not found) error  
      if (error.response && error.response.status === 404) {  
        console.log(`Manufacturer not found for prefix: ${platformPrefix}`);  
      }  
      return { manufacturer: 'Unknown' };  
    }  
  },  
  
  /**
   * Upload single photo file for testing documentation
   * Returns file path for storing in database records
   * 
   * @param {File} photoFile - Image file from file input
   * @param {string} photoType - Type of photo (visual_inspection, boot, etc.)
   * @returns {Promise<object>} - { filePath: string, fileName: string }
   * @throws {Error} - Upload failures
   */
  uploadPhoto: async (photoFile, photoType) => {  
    try {  
      logger.log(`Uploading photo of type: ${photoType}`, photoFile);  
        
      const formData = new FormData();  
      formData.append('photo', photoFile);  
      formData.append('type', photoType);  
        
      const response = await axios.post(`${API_URL}/upload-photo`, formData, {  
        headers: {  
          'Content-Type': 'multipart/form-data'  
        }  
      });  
        
      logger.log('Upload response:', response.data);  
      return response.data;  
    } catch (error) {  
      const errorInfo = handleError(error, 'uploadPhoto', '/file-upload');
      logger.error('Error uploading photo:', errorInfo);  
      throw new Error(errorInfo.message);  
    }  
  },  

  /**
   * Update build status (In Progress, Complete, Fail)
   * Used after successful rework completion or status changes
   * 
   * @param {string} chassisSN - Chassis serial number
   * @param {string} status - New status ('In Progress', 'Complete', 'Fail')
   * @returns {Promise<object>} - Success response
   * @throws {Error} - Invalid status or build not found
   */
  updateBuildStatus: async (chassisSN, status) => {
    try {
      if (!chassisSN) {
        throw new Error('Chassis serial number is required');
      }
      
      const validStatuses = ['In Progress', 'Complete', 'Fail'];
      if (!validStatuses.includes(status)) {
        throw new Error('Invalid status value');
      }
      
      console.log(`Updating build ${chassisSN} status to: ${status}`);
      
      const response = await axios.patch(`${API_URL}/builds/${chassisSN}/status`, {
        status: status
      });
      
      console.log('Status update response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating build status:', error);
      throw error;
    }
  },

  /**
 * Add new part number to database
 * Used when user selects "Other" and enters a custom part number
 * 
 * @param {string} partNumber - The new part number to add
 * @param {string} type - Part type: 'Drive' for M.2, 'Module' for DIMM
 * @returns {Promise<object>} - Success response
 */
addPartNumber: async (partNumber, type) => {
  try {
    const response = await axios.post(`${API_URL}/part-numbers`, {
      partNumber,
      type
    });
    return response.data;
  } catch (error) {
    const errorInfo = handleError(error, 'addPartNumber', '/part-numbers');
    logger.error('Error adding part number:', errorInfo);
    throw new Error(errorInfo.message);
  }
},

  // ============================================================================
  // BKC (BEST KNOWN CONFIGURATION) MANAGEMENT APIs
  // ============================================================================

  /**
   * Extract firmware versions from BMC using automated script
   * Attempts to retrieve BIOS, SCM FPGA, HPM FPGA, and BMC versions
   * 
   * @param {string} bmcName - BMC hostname or IP address for connection
   * @returns {Promise<object>} - { success: boolean, versions: object }
   * @throws {Error} - Connection failures or extraction errors
   */
  extractBMCFirmwareVersions: async (bmcName) => {
    try {
      const response = await axios.post(`${API_URL}/extract-firmware-versions`, { bmcName });
      return response.data;
    } catch (error) {
      console.error('Error extracting firmware versions:', error);
      throw error;
    }
  },

  /**
   * Save BKC (firmware) details to existing build record
   * Updates BIOS, SCM FPGA, HPM FPGA, and BMC version fields
   * 
   * @param {string} chassisSN - Chassis serial number
   * @param {object} bkcDetails - Firmware version details
   * @returns {Promise<object>} - Success response
   * @throws {Error} - Build not found or update failures
   */
  saveBkcDetails: async (chassisSN, bkcDetails) => {  
    try {  
      if (!chassisSN) {  
        throw new Error('Chassis SN is required to save BKC details');  
      }  
        
      const response = await axios.patch(`${API_URL}/builds/${chassisSN}/bkc`, bkcDetails);  
      return response.data;  
    } catch (error) {  
      console.error('Error saving BKC details:', error);  
      throw error;  
    }  
  },  

  // ============================================================================
  // QUALITY MANAGEMENT APIs
  // ============================================================================
    
  /**
   * Get all failure modes organized by category
   * Used for populating failure mode dropdowns in Quality Indicator step
   * 
   * @returns {Promise<object>} - Failure modes grouped by category
   * @throws {Error} - Database connection errors
   */
  getFailureModes: async () => {  
    try {  
      const response = await axios.get(`${API_URL}/failure-modes`);  
      return response.data;  
    } catch (error) {  
      console.error('Error fetching failure modes:', error);  
      throw error;  
    }  
  },  
  
  /**
   * Save quality indicator details including FPY status and failures
   * Updates build status based on save option and manages failure records
   * 
   * @param {string} chassisSN - Chassis serial number
   * @param {object} qualityDetails - FPY status, failures, and save options
   * @returns {Promise<object>} - Success response
   * @throws {Error} - Build not found or validation errors
   */
  saveQualityDetails: async (chassisSN, qualityDetails) => {
    try {
      if (!chassisSN) {
        throw new Error('Chassis SN is required to save quality details');
      }
      
      const response = await axios.patch(`${API_URL}/builds/${chassisSN}/quality`, qualityDetails);
      return response.data;
    } catch (error) {
      console.error('Error saving quality details:', error);
      throw error;
    }
  },

  // Legacy method name compatibility
  saveQualityIndicator: async (chassisSN, qualityData) => {
    return api.saveQualityDetails(chassisSN, qualityData);
  },

  // ============================================================================
  // REWORK SYSTEM APIs
  // ============================================================================

  /**
   * Process rework operation with component replacements
   * Updates build with new component data and maintains rework history
   * 
   * @param {string} chassisSN - Chassis serial number
   * @param {object} reworkData - Updated system information after rework
   * @returns {Promise<object>} - Success response with rework details
   * @throws {Error} - Build not found or rework processing errors
   */
  updateBuildAfterRework: async (chassisSN, reworkData) => {
    try {
      if (!chassisSN) {
        throw new Error('Chassis serial number is required for rework');
      }
        
      console.log(`Updating build after rework. Chassis SN: ${chassisSN}`, reworkData);
        
      const response = await axios.patch(`${API_URL}/builds/${chassisSN}/rework`, reworkData);
      return response.data;
    } catch (error) {
      console.error('Error updating build after rework:', error);
      throw error;
    }
  },

  /**
   * Save build after rework completion
   * Alternative method for saving rework results with different data structure
   * 
   * @param {string} chassisSN - Chassis serial number
   * @param {object} updatedBuildData - Complete updated build data after rework
   * @returns {Promise<object>} - Success response
   * @throws {Error} - Chassis SN required or save failures
   */
  saveBuildAfterRework: async (chassisSN, updatedBuildData) => {
    try {
      if (!chassisSN) {
        throw new Error('Chassis serial number is required');
      }
      
      console.log(`Saving build after rework. Chassis SN: ${chassisSN}`, updatedBuildData);
      
      const response = await axios.patch(`${API_URL}/builds/${chassisSN}/rework`, updatedBuildData);
      return response.data;
    } catch (error) {
      console.error('Error saving build after rework:', error);
      throw error;
    }
  },

  /**
   * Get complete rework history for a build
   * Includes component changes, DIMM changes, and original failure information
   * 
   * @param {string} chassisSN - Chassis serial number
   * @returns {Promise<array>} - Array of rework history records
   * @throws {Error} - Database connection errors
   */
  getReworkHistory: async (chassisSN) => {
    try {
      if (!chassisSN) {
        throw new Error('Chassis serial number is required');
      }
      
      const response = await axios.get(`${API_URL}/builds/${chassisSN}/rework-history`);
      return response.data;
    } catch (error) {
      console.error('Error fetching rework history:', error);
      throw error;
    }
  },

  /**
   * Add a function to get build history (from old API)
   */
  getBuildHistory: async (chassisSN) => {
    try {
      const response = await axios.get(`${API_URL}/builds/${chassisSN}/history`);
      return response.data;
    } catch (error) {
      console.error('Error fetching build history:', error);
      throw error;
    }
  },

// ============================================================================
// CONTINUE BUILD API METHODS
// ============================================================================

/**
 * Get all in-progress builds
 * Returns builds with status 'In Progress' including step completion data
 * 
 * @returns {Promise<array>} - Array of in-progress builds
 */
getInProgressBuilds: async () => {
  try {
    const response = await axios.get(`${API_URL}/builds/in-progress`);
    return response.data;
  } catch (error) {
    console.error('Error fetching in-progress builds:', error);
    throw error;
  }
},

/**
 * Update existing build (PATCH)
 * Used for continue functionality - only updates provided fields
 * 
 * @param {string} chassisSN - Chassis serial number
 * @param {object} updateData - Fields to update
 * @returns {Promise<object>} - Success response
 */
updateBuild: async (chassisSN, updateData) => {
  try {
    if (!chassisSN) {
      throw new Error('Chassis SN is required to update build');
    }
    
    const response = await axios.patch(`${API_URL}/builds/${chassisSN}`, updateData);
    return response.data;
  } catch (error) {
    console.error('Error updating build:', error);
    throw error;
  }
},

// ============================================================================
// EDIT BUILD DATA API METHODS
// ============================================================================

/**
 * Search builds for editing by BMC Names and/or Chassis S/Ns
 * Returns builds matching the search criteria
 *
 * @param {object} filters - Search filters {bmcNames: [], chassisSNs: []}
 * @returns {Promise<array>} - Array of matching builds
 */
searchBuildsForEdit: async (filters) => {
  try {
    const response = await axios.post(`${API_URL}/builds/search-for-edit`, filters);
    return response.data;
  } catch (error) {
    console.error('Error searching builds for edit:', error);
    throw error;
  }
},

/**
 * Update edited build data
 * Comprehensive update for all editable fields
 *
 * @param {string} chassisSN - Chassis serial number
 * @param {object} updateData - Complete update data including all editable fields
 * @returns {Promise<object>} - Success response
 */
updateEditedBuild: async (chassisSN, updateData) => {
  try {
    logger.log('Updating edited build:', chassisSN, updateData);
    const response = await axios.put(`${API_URL}/builds/${chassisSN}/edit`, updateData);
    logger.log('Edit build response:', response.data);
    return response.data;
  } catch (error) {
    const errorInfo = handleError(error, 'updateEditedBuild', `/builds/${chassisSN}/edit`);
    logger.error('Error updating edited build:', errorInfo);
    throw new Error(errorInfo.message);
  }
},

// ============================================================================
// MASTER BUILD API ENDPOINTS
// ============================================================================

/**
 * Get all builds with optional master build data
 * Includes joins with master_builds table for complete information
 *
 * @returns {Promise<array>} - Array of builds with master data if exists
 */
getAllBuilds: async () => {
  try {
    const response = await axios.get(`${API_URL}/builds`);
    return response.data;
  } catch (error) {
    console.error('Error fetching all builds:', error);
    throw error;
  }
},

/**
 * Save master build data for a specific chassis
 * Creates or updates master build record
 * 
 * @param {string} chassisSN - Chassis serial number
 * @param {object} masterData - Master build data to save
 * @returns {Promise<object>} - Success response
 */
saveMasterBuildData: async (chassisSN, masterData) => {
  try {
    console.log('Saving master data for:', chassisSN, masterData);

    const response = await axios.post(`${API_URL}/master-builds/${chassisSN}`, {
      location: masterData.location,
      customLocation: masterData.customLocation,
      teamSecurity: masterData.teamSecurity,
      department: masterData.department,
      buildEngineer: masterData.buildEngineer,
      buildName: masterData.buildName,
      jiraTicketNo: masterData.jiraTicketNo,
      changegearAssetId: masterData.changegearAssetId,
      notes: masterData.notes,
      smsOrder: masterData.smsOrder,
      costCenter: masterData.costCenter,
      capitalization: masterData.capitalization,
      deliveryDate: masterData.deliveryDate,
      masterStatus: masterData.masterStatus
    });
    return response.data;
  } catch (error) {
    console.error('Error saving master build data:', error);
    console.error('Request data:', {
      location: masterData.location,
      customLocation: masterData.customLocation,
      teamSecurity: masterData.teamSecurity,
      department: masterData.department,
      buildEngineer: masterData.buildEngineer,
      buildName: masterData.buildName,
      jiraTicketNo: masterData.jiraTicketNo,
      changegearAssetId: masterData.changegearAssetId,
      notes: masterData.notes,
      smsOrder: masterData.smsOrder,
      costCenter: masterData.costCenter,
      capitalization: masterData.capitalization,
      deliveryDate: masterData.deliveryDate,
      masterStatus: masterData.masterStatus
    });
    throw error;
  }
},

/**
 * Get master build data for specific chassis
 * 
 * @param {string} chassisSN - Chassis serial number
 * @returns {Promise<object>} - Master build data
 */
getMasterBuildData: async (chassisSN) => {
  try {
    const response = await axios.get(`${API_URL}/master-builds/${chassisSN}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching master build data:', error);
    throw error;
  }
},

/**
 * Update master build data
 * 
 * @param {string} chassisSN - Chassis serial number
 * @param {object} updates - Fields to update
 * @returns {Promise<object>} - Success response
 */
updateMasterBuildData: async (chassisSN, updates) => {
  try {
    const response = await axios.patch(`${API_URL}/master-builds/${chassisSN}`, updates);
    return response.data;
  } catch (error) {
    console.error('Error updating master build data:', error);
    throw error;
  }
},

  /**
   * Get debug information about photos for a build
   * Useful for troubleshooting photo display issues
   * 
   * @param {string} chassisSN - Chassis serial number
   * @returns {Promise<object>} - Debug information about photos
   */
  getPhotoDebugInfo: async (chassisSN) => {
    try {
      const response = await axios.get(`${API_URL}/debug/photos/${chassisSN}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching photo debug info:', error);
      throw error;
    }
  },

  /**
   * Test if a photo URL is accessible
   * 
   * @param {string} photoUrl - Photo URL to test
   * @returns {Promise<boolean>} - Whether the photo is accessible
   */
  testPhotoUrl: async (photoUrl) => {
    try {
      const response = await axios.head(photoUrl);
      return response.status === 200;
    } catch (error) {
      console.error('Photo URL test failed:', photoUrl, error.response?.status);
      return false;
    }
  },

  /**
   * Get direct photo URL using image proxy endpoint
   * 
   * @param {string} filename - Photo filename
   * @param {string} type - Photo type
   * @returns {string} - Direct photo URL via proxy
   */
  getDirectPhotoUrl: (filename, type) => {
    const photoPath = type ? `${type}/${filename}` : filename;
    return `${API_URL}/image-proxy?path=${encodeURIComponent(photoPath)}`;
  },

// ============================================================================
// SEARCH API METHOD
// ============================================================================

/**
 * Search builds with comprehensive filters
 * Supports filtering by all build attributes and master build information
 * 
 * @param {object} filters - Search filter criteria including:
 *   - Build Information: dateFrom, dateTo, location, isCustomConfig, projectName, etc.
 *   - System Information: chassisSN, bmcName, mbSN, etc.
 *   - Component Information: cpuP0SN, m2PN, dimmSN, etc.
 *   - Testing Results: visualInspection, bootStatus, etc.
 *   - BKC Details: biosVersion, scmFpga, etc.
 *   - Quality Indicators: status, fpyStatus, failureMode, etc.
 *   - Master Build Information: masterLocation, teamSecurity, buildEngineer, etc.
 * @returns {Promise<array>} - Array of builds matching search criteria
 * @throws {Error} - Search failures
 */
searchBuilds: async (filters) => {
  try {
    console.log('Searching builds with filters:', filters);
    
    // FIXED: Use correct endpoint path from server.js
    const response = await axios.post(`${API_URL}/search-builds`, filters);
    
    console.log(`Search returned ${response.data.length} results`);
    
    return response.data;
  } catch (error) {
    console.error('Error searching builds:', error);
    throw error;
  }
},

  // ============================================================================
  // CUSTOMER ESCALATION APIs (ENHANCED WITH MISSING METHODS FROM OLD API)
  // ============================================================================

  // Get all customer escalations with enhanced filtering (from old API)
  getCustomerEscalations: async (statusFilter = null, search = null) => {
    try {
      const params = {};
      if (statusFilter && statusFilter !== 'all') {
        params.status = statusFilter;
      }
      if (search) {
        params.search = search;
      }
      
      const response = await axios.get(`${API_URL}/customer-escalations`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching escalations:', error);
      throw error;
    }
  },

  // Get escalation statistics with enhanced metrics (from old API)
  getEscalationStats: async () => {
    try {
      const response = await axios.get(`${API_URL}/escalation-stats`);
      return response.data;
    } catch (error) {
      console.error('Error fetching stats:', error);
      throw error;
    }
  },

  // Get monthly failure mode statistics (missing from new API)
  getMonthlyFailureModeStats: async () => {
    try {
      const response = await axios.get(`${API_URL}/monthly-failure-mode-stats`);
      return response.data;
    } catch (error) {
      console.error('Error fetching monthly failure mode stats:', error);
      throw error;
    }
  },

  // Get escalation failure mode trends for chart visualization
  getEscalationFailureModeTrends: async () => {
    try {
      const response = await axios.get(`${API_URL}/escalation-failure-mode-trends`);
      return response.data;
    } catch (error) {
      console.error('Error fetching escalation failure mode trends:', error);
      throw error;
    }
  },

  // Get failure mode trends (missing from new API)
  getFailureModeTrends: async () => {
    try {
      const response = await axios.get(`${API_URL}/failure-mode-trends`);
      return response.data;
    } catch (error) {
      console.error('Error fetching failure mode trends:', error);
      throw error;
    }
  },

  // Get escalation details by ticket ID
  getEscalationDetails: async (ticketId) => {
    try {
      const response = await axios.get(`${API_URL}/customer-escalations/${ticketId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching escalation details:', error);
      throw error;
    }
  },

  // Update escalation (PATCH)
  updateEscalation: async (ticketId, updateData) => {
    try {
      const response = await axios.patch(`${API_URL}/customer-escalations/${ticketId}`, updateData, {
        headers: { 'Content-Type': 'application/json' }
      });
      return response.data;
    } catch (error) {
      console.error('Error updating escalation:', error);
      throw error;
    }
  },

  // Send request to customer
  sendCustomerRequest: async (ticketId, requestData) => {
    try {
      const response = await axios.post(`${API_URL}/customer-escalations/${ticketId}/request`, requestData, {
        headers: { 'Content-Type': 'application/json' }
      });
      return response.data;
    } catch (error) {
      console.error('Error sending request:', error);
      throw error;
    }
  },

  // Sync escalation data (missing from new API)
  syncEscalation: async (ticketId) => {
    try {
      const response = await axios.post(`${API_URL}/customer-escalations/${ticketId}/sync`);
      return response.data;
    } catch (error) {
      console.error('Error syncing escalation:', error);
      throw error;
    }
  },

  // Sync all escalations (missing from new API)
  syncAllEscalations: async () => {
    try {
      const response = await axios.post(`${API_URL}/sync-all-escalations`);
      return response.data;
    } catch (error) {
      console.error('Error syncing all escalations:', error);
      throw error;
    }
  },

  // ============================================================================
  // CUSTOMER PORTAL APIs (from CustomerPortal component)
  // ============================================================================

  // Get AMD part numbers for dropdown
  getAmdPartNumbers: async () => {
    try {
      const response = await axios.get(`${API_URL}/amd-part-numbers`);
      return response.data;
    } catch (error) {
      console.error('Error fetching AMD part numbers:', error);
      throw error;
    }
  },

  // Fetch build data by chassis SN (for auto-population)
  getBuildData: async (chassisSN) => {
    try {
      const response = await axios.get(`${API_URL}/builds/${chassisSN}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching build data:', error);
      throw error;
    }
  },

  // Submit new customer escalation
  submitCustomerEscalation: async (escalationData) => {
    try {
      const response = await axios.post(`${API_URL}/customer-escalations`, escalationData, {
        headers: { 'Content-Type': 'application/json' }
      });
      return response.data;
    } catch (error) {
      console.error('Error submitting escalation:', error);
      throw error;
    }
  },

  // Track escalation by ticket ID (same as getEscalationDetails but used in different context)
  trackEscalation: async (ticketId) => {
    try {
      const response = await axios.get(`${API_URL}/customer-escalations/${ticketId}`);
      return response.data;
    } catch (error) {
      console.error('Error tracking escalation:', error);
      throw error;
    }
  },

  // Submit customer response to technician request
  submitCustomerResponse: async (ticketId, responseData) => {
    try {
      // responseData should be FormData object containing files and other data
      const response = await axios.post(`${API_URL}/customer-escalations/${ticketId}/respond`, responseData);
      return response.data;
    } catch (error) {
      console.error('Error submitting response:', error);
      throw error;
    }
  },

  // ============================================================================
  // FILE MANAGEMENT APIs (FIXED WITH PROPER URL HANDLING)
  // ============================================================================

  /**
   * Upload single file for escalation (customer portal)
   * Returns file information for form handling
   * 
   * @param {File} file - File to upload
   * @returns {Promise<object>} - File path and name information
   * @throws {Error} - Upload failures
   */
  uploadEscalationFile: async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axios.post(`${API_URL}/upload-escalation-file`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      const errorInfo = handleError(error, 'uploadEscalationFile', '/file-upload');
      logger.error('Error uploading escalation file:', errorInfo);
      throw new Error(errorInfo.message);
    }
  },

  /**
   * FIXED: Get URL for timeline attachment file download
   * Used for downloading files from escalation timeline
   * 
   * @param {string} filePath - Relative file path from database
   * @returns {string} - Complete URL for file download
   */
  getTimelineFileUrl: (filePath) => {
    if (!filePath) return '';
    
    // Clean the path - remove leading slashes and normalize
    const cleanPath = filePath.replace(/^[\/\\]+/, '').replace(/\\/g, '/');
    
    // If path already starts with uploads/, use it directly
    if (cleanPath.startsWith('uploads/')) {
      return `${BACKEND_URL}/${cleanPath}`;
    }
    
    // Otherwise, assume it's in the escalations subdirectory
    return `${BACKEND_URL}/uploads/escalations/${cleanPath}`;
  },

  /**
   * FIXED: Get URL for error attachment file download
   * Used for downloading files from escalation error records
   * 
   * @param {string} filePath - Relative file path from database
   * @returns {string} - Complete URL for file download
   */
  getErrorFileUrl: (filePath) => {
    if (!filePath) return '';
    
    // Clean the path - remove leading slashes and normalize
    const cleanPath = filePath.replace(/^[\/\\]+/, '').replace(/\\/g, '/');
    
    // If path already starts with uploads/, use it directly
    if (cleanPath.startsWith('uploads/')) {
      return `${BACKEND_URL}/${cleanPath}`;
    }
    
    // Otherwise, assume it's in the escalations subdirectory
    return `${BACKEND_URL}/uploads/escalations/${cleanPath}`;
  },

  /**
   * FIXED: Get URL for escalation file download
   * Used for downloading customer-uploaded escalation files
   * 
   * @param {string} filePath - Relative file path from database
   * @returns {string} - Complete URL for file download
   */
  getEscalationFileUrl: (filePath) => {
    if (!filePath) return '';
    
    // Clean the path - remove leading slashes and normalize
    const cleanPath = filePath.replace(/^[\/\\]+/, '').replace(/\\/g, '/');
    
    // If path already starts with uploads/, use it directly
    if (cleanPath.startsWith('uploads/')) {
      return `${BACKEND_URL}/${cleanPath}`;
    }
    
    // Otherwise, assume it's in the escalations subdirectory
    return `${BACKEND_URL}/uploads/escalations/${cleanPath}`;
  },

  /**
   * FIXED: Get URL for build photo thumbnail/download
   * Used for displaying system information photos
   * Uses image proxy endpoint to avoid CORS issues
   * 
   * @param {string} photoPath - Relative photo path from uploads
   * @returns {string} - Complete URL for photo access via proxy
   */
  getPhotoUrl: (photoPath) => {
    if (!photoPath) return '';
  
    // Normalize path separators for cross-platform compatibility
    const cleanPath = photoPath.replace(/^[\/\\]+/, '').replace(/\\/g, '/');
  
    // Use the image proxy endpoint to avoid CORS issues
    return `${API_URL}/image-proxy?path=${encodeURIComponent(cleanPath)}`;
  },

  /**
   * Test if a photo URL is accessible (production-safe)
   * Uses image proxy endpoint with timeout and retry logic
   * 
   * @param {string} photoUrl - Photo URL to test
   * @returns {Promise<boolean>} - Whether the photo is accessible
   */
  testPhotoUrl: async (photoUrl) => {
    try {
      const response = await axios.head(photoUrl, { 
        timeout: 5000,
        retry: 1,
        retryDelay: 1000
      });
      return response.status === 200;
    } catch (error) {
      // Handle common network errors gracefully
      if (error.code === 'ECONNABORTED' || error.code === 'ECONNRESET') {
        console.warn('Network error testing photo URL:', error.code);
        return false;
      }
      
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Photo URL test failed:', photoUrl, error.response?.status);
      }
      return false;
    }
  },

  /**
   * Get fallback image URL for broken photos
   * Uses image proxy to serve placeholder image
   * 
   * @returns {string} - URL to placeholder image via proxy
   */
  getFallbackImageUrl: () => {
    return `${API_URL}/image-proxy?path=${encodeURIComponent('placeholder.png')}`;
  },

  /**
   * Check if a file path represents an image file
   * 
   * @param {string} filePath - File path to check
   * @returns {boolean} - Whether the file is an image
   */
  isImageFile: (filePath) => {
    if (!filePath) return false;
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    return imageExtensions.some(ext => 
      filePath.toLowerCase().endsWith(ext)
    );
  },

  // ============================================================================
  // DASHBOARD APIs
  // ============================================================================

  /**
   * Get dashboard statistics and metrics
   * Returns build counts, FPY rates, and other key metrics for dashboard display
   * 
   * @param {string} timeframe - Timeframe filter (today, thisWeek, thisMonth)
   * @returns {Promise<object>} - Dashboard metrics
   */
  getDashboardStats: async (timeframe = 'thisMonth') => {
    try {
      const response = await axios.get(`${API_URL}/dashboard/stats`, {
        params: { timeframe }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  },

  /**
   * Get recent builds for dashboard display
   * Returns the most recent builds with essential information
   * 
   * @param {number} limit - Number of recent builds to return
   * @returns {Promise<array>} - Array of recent builds
   */
  getRecentBuilds: async (limit = 10) => {
    try {
      const response = await axios.get(`${API_URL}/dashboard/recent-builds`, {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching recent builds:', error);
      throw error;
    }
  },

  /**
   * Get build distribution by location for dashboard
   * 
   * @param {string} timeframe - Timeframe filter
   * @returns {Promise<array>} - Build counts by location
   */
  getBuildsByLocation: async (timeframe = 'thisMonth') => {
    try {
      const response = await axios.get(`${API_URL}/dashboard/builds-by-location`, {
        params: { timeframe }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching builds by location:', error);
      throw error;
    }
  },

// ============================================================================
// DASHBOARD API METHODS
// ============================================================================

/**
 * Get all unique project names for dashboard
 * @returns {Promise<array>} - Array of project names
 */
getDashboardProjects: async () => {
  try {
    const response = await axios.get(`${API_URL}/dashboard/projects`);
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard projects:', error);
    throw error;
  }
},

/**
 * Get actual build data for a project
 * @param {string} projectName - Project name
 * @returns {Promise<object>} - { PRB: [], VRB: [] }
 */
getDashboardBuildData: async (projectName) => {
  try {
    const response = await axios.get(`${API_URL}/dashboard/build-data/${encodeURIComponent(projectName)}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard build data:', error);
    throw error;
  }
},

/**
 * Get forecast configuration for a project and platform type
 * @param {string} projectName - Project name
 * @param {string} platformType - PRB or VRB
 * @returns {Promise<object>} - Forecast configuration
 */
getForecastConfig: async (projectName, platformType) => {
  try {
    const response = await axios.get(`${API_URL}/dashboard/forecast-config/${encodeURIComponent(projectName)}/${platformType}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching forecast config:', error);
    throw error;
  }
},

/**
 * Save forecast configuration
 * @param {string} projectName - Project name
 * @param {string} platformType - PRB or VRB
 * @param {object} configData - Configuration data
 * @returns {Promise<object>} - Success response
 */
saveForecastConfig: async (projectName, platformType, configData) => {
  try {
    const response = await axios.post(`${API_URL}/dashboard/forecast-config/${encodeURIComponent(projectName)}/${platformType}`, configData);
    return response.data;
  } catch (error) {
    console.error('Error saving forecast config:', error);
    throw error;
  }
},

/**
 * Get quality data for a project
 * @param {string} projectName - Project name
 * @returns {Promise<object>} - Quality data for PRB and VRB
 */
getDashboardQualityData: async (projectName) => {
  try {
    const response = await axios.get(`${API_URL}/dashboard/quality-data/${encodeURIComponent(projectName)}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard quality data:', error);
    throw error;
  }
},

/**
 * Get location allocation data for dashboard
 * @param {string} startDate - Start date (optional)
 * @param {string} endDate - End date (optional) 
 * @returns {Promise<object>} - Location allocation chart data
 */
getLocationAllocationData: async (startDate, endDate, projectName = null) => {
  try {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (projectName && projectName !== 'all') params.projectName = projectName;

    const response = await axios.get(`${API_URL}/dashboard/location-allocation`, {
      params
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching location allocation data:', error);
    throw error;
  }
},

  // ============================================================================
  // PROFILE AND AUTHENTICATION API METHODS
  // ============================================================================

  /**
   * Get current user profile information
   * @returns {Promise<object>} - User profile data
   */
  getProfile: async () => {
    try {
      const response = await axios.get(`${API_URL}/profile`);
      return response.data;
    } catch (error) {
      const errorInfo = handleError(error, 'getProfile', '/profile');
      logger.error('Error fetching profile:', errorInfo);
      throw new Error(errorInfo.message);
    }
  },

  /**
   * Update user profile information
   * @param {object} profileData - Updated profile data
   * @returns {Promise<object>} - Updated user profile
   */
  updateProfile: async (profileData) => {
    try {
      const response = await axios.put(`${API_URL}/profile`, profileData);
      return response.data;
    } catch (error) {
      const errorInfo = handleError(error, 'updateProfile', '/profile');
      logger.error('Error updating profile:', errorInfo);
      throw new Error(errorInfo.message);
    }
  },

  /**
   * Get user permissions
   * @returns {Promise<object>} - User permissions data
   */
  getPermissions: async () => {
    try {
      const response = await axios.get(`${API_URL}/profile/permissions`);
      return response.data;
    } catch (error) {
      const errorInfo = handleError(error, 'getPermissions', '/profile/permissions');
      logger.error('Error fetching permissions:', errorInfo);
      throw new Error(errorInfo.message);
    }
  },

  /**
   * Get user access logs
   * @param {object} params - Query parameters (limit, offset, etc.)
   * @returns {Promise<object>} - Access logs data
   */
  getAccessLogs: async (params = {}) => {
    try {
      const response = await axios.get(`${API_URL}/profile/access-logs`, { params });
      return response.data;
    } catch (error) {
      const errorInfo = handleError(error, 'getAccessLogs', '/profile/access-logs');
      logger.error('Error fetching access logs:', errorInfo);
      throw new Error(errorInfo.message);
    }
  },

  /**
   * Check access permissions for a resource
   * @param {string} resource - Resource name
   * @param {string} action - Action type (read, write, admin)
   * @returns {Promise<object>} - Access permission result
   */
  checkAccess: async (resource, action = 'read') => {
    try {
      const response = await axios.post(`${API_URL}/profile/check-access`, {
        resource,
        action
      });
      return response.data;
    } catch (error) {
      const errorInfo = handleError(error, 'checkAccess', '/profile/check-access');
      logger.error('Error checking access:', errorInfo);
      throw new Error(errorInfo.message);
    }
  },

  /**
   * Get list of all users (admin only)
   * @param {object} params - Query parameters (page, limit, search, etc.)
   * @returns {Promise<object>} - Users list with pagination
   */
  getUsers: async (params = {}) => {
    try {
      const response = await axios.get(`${API_URL}/profile/users`, { params });
      return response.data;
    } catch (error) {
      const errorInfo = handleError(error, 'getUsers', '/profile/users');
      logger.error('Error fetching users:', errorInfo);
      throw new Error(errorInfo.message);
    }
  },

  /**
   * Update user status or role (admin only)
   * @param {number} userId - User ID to update
   * @param {object} updates - Status/role updates
   * @returns {Promise<object>} - Updated user data
   */
  updateUser: async (userId, updates) => {
    try {
      const response = await axios.put(`${API_URL}/profile/users/${userId}`, updates);
      return response.data;
    } catch (error) {
      const errorInfo = handleError(error, 'updateUser', `/profile/users/${userId}`);
      logger.error('Error updating user:', errorInfo);
      throw new Error(errorInfo.message);
    }
  },

  /**
   * Grant or revoke user permissions (admin only)
   * @param {number} userId - User ID
   * @param {array} permissions - Array of permission IDs to grant/revoke
   * @param {string} action - 'grant' or 'revoke'
   * @returns {Promise<object>} - Result of permission change
   */
  manageUserPermissions: async (userId, permissions, action = 'grant') => {
    try {
      const response = await axios.post(`${API_URL}/profile/users/${userId}/permissions`, {
        permissions,
        action
      });
      return response.data;
    } catch (error) {
      const errorInfo = handleError(error, 'manageUserPermissions', `/profile/users/${userId}/permissions`);
      logger.error('Error managing user permissions:', errorInfo);
      throw new Error(errorInfo.message);
    }
  },

  /**
   * Get system settings (admin only)
   * @returns {Promise<object>} - System settings
   */
  getSystemSettings: async () => {
    try {
      const response = await axios.get(`${API_URL}/profile/system/settings`);
      return response.data;
    } catch (error) {
      const errorInfo = handleError(error, 'getSystemSettings', '/profile/system/settings');
      logger.error('Error fetching system settings:', errorInfo);
      throw new Error(errorInfo.message);
    }
  },

  /**
   * Update system settings (admin only)
   * @param {object} settings - Settings to update
   * @returns {Promise<object>} - Updated settings
   */
  updateSystemSettings: async (settings) => {
    try {
      const response = await axios.put(`${API_URL}/profile/system/settings`, settings);
      return response.data;
    } catch (error) {
      const errorInfo = handleError(error, 'updateSystemSettings', '/profile/system/settings');
      logger.error('Error updating system settings:', errorInfo);
      throw new Error(errorInfo.message);
    }
  },

  // ============================================================================
  // OFFLINE UPLOAD API METHODS
  // ============================================================================

  /**
   * Upload offline builds from Excel/CSV file
   * @param {File} file - The Excel or CSV file containing build data
   * @returns {Promise<object>} - Upload results with success/failure counts
   */
  uploadOfflineBuilds: async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(`${API_URL}/offline/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      return response.data;
    } catch (error) {
      const errorInfo = handleError(error, 'uploadOfflineBuilds', '/offline/upload');
      logger.error('Error uploading offline builds:', errorInfo);
      throw new Error(errorInfo.message);
    }
  },

  /**
   * Get offline template download URL
   * @returns {string} - Template download URL
   */
  getOfflineTemplateUrl: () => {
    return `${API_URL}/offline/template/download`;
  },

  // ============================================================================
  // CUSTOMER TICKETS API METHODS
  // ============================================================================

  /**
   * Get tickets opened by a specific user (by email)
   * @param {string} userEmail - User email address
   * @returns {Promise<array>} - Array of user's tickets
   */
  getUserTickets: async (userEmail) => {
    try {
      const response = await axios.get(`${API_URL}/customer-escalations/user/${encodeURIComponent(userEmail)}`);
      return response.data;
    } catch (error) {
      const errorInfo = handleError(error, 'getUserTickets', '/customer-escalations/user');
      logger.error('Error fetching user tickets:', errorInfo);
      throw new Error(errorInfo.message);
    }
  },

  /**
   * Get tickets from a specific cost center
   * @param {string} costCenter - Cost center number
   * @returns {Promise<array>} - Array of cost center tickets
   */
  getCostCenterTickets: async (costCenter) => {
    try {
      const response = await axios.get(`${API_URL}/customer-escalations/cost-center/${encodeURIComponent(costCenter)}`);
      return response.data;
    } catch (error) {
      const errorInfo = handleError(error, 'getCostCenterTickets', '/customer-escalations/cost-center');
      logger.error('Error fetching cost center tickets:', errorInfo);
      throw new Error(errorInfo.message);
    }
  },
}; 
  
export default api;