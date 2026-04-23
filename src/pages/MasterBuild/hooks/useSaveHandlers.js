// frontend/src/pages/MasterBuild/hooks/useSaveHandlers.js

import { useState } from 'react';
import api from '../../../services/api';

export const useSaveHandlers = (masterData, setMasterData, selectedBuilds, setMessages) => {
  const [saving, setSaving] = useState(false);

  const validateMasterData = () => {
    // Just ensure we have builds to process
    if (!selectedBuilds || selectedBuilds.length === 0) {
      console.error('No selectedBuilds provided');
      return false;
    }
    
    // Clear any existing errors since no fields are required
    setMasterData(prev => ({
      ...prev,
      errors: {}
    }));

    return true;
  };

  // Helper function to create default master data for a build
  const createDefaultMasterData = (build) => {
    // Helper function to format date for input[type="date"]
    const formatDateForInput = (dateString) => {
      if (!dateString) return '';
      
      let date;
      if (dateString instanceof Date) {
        date = dateString;
      } else if (typeof dateString === 'string') {
        if (dateString.includes(' ')) {
          date = new Date(dateString.split(' ')[0]);
        } else {
          date = new Date(dateString);
        }
      } else {
        return '';
      }
      
      if (isNaN(date.getTime())) {
        return '';
      }
      
      return date.toISOString().split('T')[0];
    };

    // Check if build has existing master data
    if (build.master_location || build.master_status) {
      return {
        location: build.master_location || '',
        customLocation: build.custom_location || '',
        teamSecurity: build.team_security || '',
        department: build.department || '',
        // UPDATED: These fields are now read-only from builds table
        buildEngineer: build.build_engineer || '',
        buildName: build.build_name || '',
        jiraTicketNo: build.jira_ticket_no || '',
        changegearAssetId: build.changegear_asset_id || '',
        notes: build.master_notes || '',
        smsOrder: build.sms_order || '',
        costCenter: build.cost_center || '',
        capitalization: build.capitalization || '',
        deliveryDate: formatDateForInput(build.delivery_date),
        masterStatus: build.master_status || '',
        isExisting: true
      };
    } else {
      return {
        location: '',
        customLocation: '',
        teamSecurity: '',
        department: '',
        // UPDATED: These fields are now read-only from builds table
        buildEngineer: build.build_engineer || '',
        buildName: '',
        jiraTicketNo: build.jira_ticket_no || '',
        changegearAssetId: '',
        notes: '',
        smsOrder: '',
        costCenter: '',
        capitalization: '',
        deliveryDate: '',
        masterStatus: '',
        isExisting: false
      };
    }
  };

  const saveMasterData = async (continueAfterSave = false) => {
    console.log('saveMasterData called with selectedBuilds:', selectedBuilds);
    console.log('continueAfterSave:', continueAfterSave);
    
    // Validate data
    if (!validateMasterData()) {
      setMessages([{
        type: 'error',
        text: 'No builds selected for saving'
      }]);
      return;
    }

    // Verify we have build objects (not chassis serial numbers)
    if (selectedBuilds.length > 0 && typeof selectedBuilds[0] === 'string') {
      console.error('selectedBuilds contains strings instead of objects:', selectedBuilds);
      setMessages([{
        type: 'error',
        text: 'Internal error: Invalid data format received. Please refresh and try again.'
      }]);
      return;
    }

    setSaving(true);
    setMessages([]);

    try {
      let successCount = 0;
      let failureCount = 0;
      const errors = [];

      // Save master data for each build sequentially to avoid race conditions
      for (let i = 0; i < selectedBuilds.length; i++) {
        const build = selectedBuilds[i];
        const chassisSN = build.chassis_sn;
        
        if (!chassisSN) {
          console.error(`Build ${i + 1} missing chassis_sn:`, build);
          errors.push(`Build ${i + 1} is missing chassis_sn property`);
          failureCount++;
          continue;
        }
        
        let buildData = masterData.builds?.[chassisSN];
        
        // If buildData doesn't exist, create default data from the build object
        if (!buildData) {
          console.warn(`No master data found for ${chassisSN}, creating default data`);
          buildData = createDefaultMasterData(build);
        }
        
        // Create data object with only the fields that have been modified
        // This allows partial updates without overwriting existing data
        const dataToSave = {};
        
        // Only include fields that have been set or changed in the UI
        // Check against both empty string and the existing value from the build
        if (buildData.location !== undefined && buildData.location !== '' && buildData.location !== build.master_location) {
          dataToSave.location = buildData.location;
        }
        if (buildData.customLocation !== undefined && buildData.customLocation !== build.custom_location) {
          dataToSave.customLocation = buildData.customLocation;
        }
        if (buildData.teamSecurity !== undefined && buildData.teamSecurity !== '' && buildData.teamSecurity !== build.team_security) {
          dataToSave.teamSecurity = buildData.teamSecurity;
        }
        if (buildData.department !== undefined && buildData.department !== build.department) {
          dataToSave.department = buildData.department;
        }
        // UPDATED: Remove buildEngineer from save operations - field is read-only
        if (buildData.buildName !== undefined && buildData.buildName !== build.build_name) {
          dataToSave.buildName = buildData.buildName;
        }
        // UPDATED: Remove jiraTicketNo from save operations - field is read-only
        if (buildData.changegearAssetId !== undefined && buildData.changegearAssetId !== build.changegear_asset_id) {
          dataToSave.changegearAssetId = buildData.changegearAssetId;
        }
        if (buildData.notes !== undefined && buildData.notes !== build.master_notes) {
          dataToSave.notes = buildData.notes;
        }
        if (buildData.smsOrder !== undefined && buildData.smsOrder !== build.sms_order) {
          dataToSave.smsOrder = buildData.smsOrder;
        }
        if (buildData.costCenter !== undefined && buildData.costCenter !== build.cost_center) {
          dataToSave.costCenter = buildData.costCenter;
        }
        if (buildData.capitalization !== undefined && buildData.capitalization !== build.capitalization) {
          dataToSave.capitalization = buildData.capitalization;
        }
        if (buildData.deliveryDate !== undefined && buildData.deliveryDate !== build.delivery_date) {
          dataToSave.deliveryDate = buildData.deliveryDate;
        }
        if (buildData.masterStatus !== undefined && buildData.masterStatus !== '' && buildData.masterStatus !== build.master_status) {
          dataToSave.masterStatus = buildData.masterStatus;
        }
        
        // Skip if no changes
        if (Object.keys(dataToSave).length === 0) {
          console.log(`No changes for ${chassisSN}, skipping`);
          successCount++;
          continue;
        }
        
        console.log(`Saving data for ${chassisSN}:`, dataToSave);
        
        try {
          // Add small delay between requests to avoid overwhelming the server
          if (i > 0) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          
          await api.saveMasterBuildData(chassisSN, dataToSave);
          successCount++;
          
          // Update the build object in selectedBuilds to reflect saved data
          Object.keys(dataToSave).forEach(key => {
            const buildKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
            if (buildKey === 'location') {
              build.master_location = dataToSave[key];
            } else if (buildKey === 'custom_location') {
              build.custom_location = dataToSave[key];
            } else if (buildKey === 'team_security') {
              build.team_security = dataToSave[key];
            } else if (buildKey === 'notes') {
              build.master_notes = dataToSave[key];
            } else {
              build[buildKey] = dataToSave[key];
            }
          });
          
        } catch (error) {
          console.error(`Error saving data for ${chassisSN}:`, error);
          failureCount++;
          
          // Check if it's a 404 error but data might have been saved
          if (error.response && error.response.status === 404) {
            // Try to verify if data was actually saved
            try {
              const verifyResult = await api.getMasterBuildData(chassisSN).catch(() => null);
              if (verifyResult) {
                console.log(`Data was actually saved for ${chassisSN} despite 404 error`);
                successCount++;
                failureCount--;
                continue;
              }
            } catch (verifyError) {
              console.error('Error verifying saved data:', verifyError);
            }
          }
          
          errors.push(`${build.bmc_name || chassisSN}: ${error.response?.data?.error || error.message}`);
        }
      }

      // Show results
      if (successCount > 0 && failureCount === 0) {
        setMessages([{
          type: 'success',
          text: `Successfully saved master data for ${successCount} build(s)`
        }]);
        
        // If not continuing after save, reload after a delay
        if (!continueAfterSave) {
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        }
      } else if (successCount > 0 && failureCount > 0) {
        setMessages([{
          type: 'warning',
          text: `Saved ${successCount} build(s), but ${failureCount} failed. Errors: ${errors.join('; ')}`
        }]);
      } else {
        setMessages([{
          type: 'error',
          text: `Failed to save all builds. Errors: ${errors.join('; ')}`
        }]);
      }
      
    } catch (error) {
      console.error('Error in save process:', error);
      setMessages([{
        type: 'error',
        text: `Failed to save master data: ${error.message}`
      }]);
    } finally {
      setSaving(false);
    }
  };

  // Also export a saveMasterDataAndContinue function
  const saveMasterDataAndContinue = async () => {
    return saveMasterData(true);
  };

  // Return both functions
  return {
    saving,
    saveMasterData,
    saveMasterDataAndContinue
  };
};