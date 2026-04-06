// frontend/src/pages/Dashboard/useDashboardData.js

import { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  generateWeeklyDates, 
  processQualityData,
  ensurePorTargetsSize
} from './utils';

export const useDashboardData = () => {
  // --- All state declarations ---
  const [selectedProject, setSelectedProject] = useState('');
  const [projects, setProjects] = useState([]);
  const [chartData, setChartData] = useState({ PRB: [], VRB: [] });
  const [chartConfigs, setChartConfigs] = useState({});
  
  // --- Loading and Error States ---
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [qualityData, setQualityData] = useState({});
  const [configLoading, setConfigLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);

  // Effect to load projects on component mount
  useEffect(() => {
    loadProjects();
  }, []);

  // Effect to load data when project is selected
  useEffect(() => {
    if (selectedProject) {
      loadProjectData();
    }
  }, [selectedProject]);

  // Load projects from database
  const loadProjects = async () => {
    try {
      setLoading(true);
      const projectList = await api.getDashboardProjects();
      setProjects(projectList);
      if (projectList.length > 0 && !selectedProject) {
        setSelectedProject(projectList[0]); // Select first project by default
      }
    } catch (err) {
      console.error('Error loading projects:', err);
      setError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  // Load all data for selected project
  const loadProjectData = async () => {
    if (!selectedProject) return;

    try {
      setDataLoading(true);
      setError(null);

      // Fetch config from DB for both PRB and VRB, and also fetch actual build data
      const [prbConfig, vrbConfig, qualityDataResult, buildDataResult] = await Promise.all([
        api.getForecastConfig(selectedProject, 'PRB').catch(() => null),
        api.getForecastConfig(selectedProject, 'VRB').catch(() => null),
        api.getDashboardQualityData(selectedProject),
        api.getDashboardBuildData(selectedProject).catch(() => ({ PRB: [], VRB: [] }))
      ]);

      // DEBUG: Log the build data API response
      console.log('=== useDashboardData Debug ===');
      console.log('selectedProject:', selectedProject);
      console.log('buildDataResult from API:', buildDataResult);
      console.log('PRB build data:', buildDataResult.PRB);
      console.log('VRB build data:', buildDataResult.VRB);

      // Set chart configurations
      const configs = {};
      if (prbConfig) configs.PRB = prbConfig;
      if (vrbConfig) configs.VRB = vrbConfig;
      setChartConfigs({ [selectedProject]: configs });

      // For each config, generate table/chart data based on config's date range and porTargets
      const mergedChartData = {};
      ['PRB', 'VRB'].forEach(platformType => {
        const config = configs[platformType];
        const actualBuildsData = buildDataResult[platformType] || [];
        
        let baseChartData = [];
        
        if (config && config.startDate && config.endDate) {
          // Use config date range if available
          const weeks = generateWeeklyDates(config.startDate, config.endDate);
          const porTargets = ensurePorTargetsSize(config.porTargets, config.startDate, config.endDate);
          
          baseChartData = weeks.map((w, i) => ({
            ...w,
            porTarget: porTargets[i] || 0,
            actualBuilds: 0 // Default to 0, will be overridden by actual data
          }));
        } else if (actualBuildsData.length > 0) {
          // If no config but we have actual build data, use actual data dates
          baseChartData = actualBuildsData.map(actualWeek => ({
            week: actualWeek.week,
            date: actualWeek.date,
            porTarget: 0,
            actualBuilds: 0 // Will be set below
          }));
        }
        
        // Merge actual build data from the API response
        console.log(`=== Merging ${platformType} actual build data ===`);
        console.log('actualBuildsData:', actualBuildsData);
        console.log('baseChartData weeks:', baseChartData.map(w => w.week));
        
        // Create a detailed comparison of all weeks
        console.log('=== Detailed week comparison ===');
        console.log('Chart data weeks:');
        baseChartData.forEach((w, i) => console.log(`  ${i}: "${w.week}" (${w.date})`));
        console.log('Actual build weeks:');
        actualBuildsData.forEach((w, i) => console.log(`  ${i}: "${w.week}" (${w.date}) - ${w.actualBuilds} builds`));
        
        actualBuildsData.forEach(actualWeek => {
          // Find the matching week in our chart data by comparing the week string (MM/DD format)
          const matchingIndex = baseChartData.findIndex(chartWeek => chartWeek.week === actualWeek.week);
          console.log(`Looking for week "${actualWeek.week}", found at index ${matchingIndex}`);
          if (matchingIndex !== -1) {
            console.log(`Merging actualBuilds: ${actualWeek.actualBuilds} for week ${actualWeek.week}`);
            baseChartData[matchingIndex].actualBuilds = actualWeek.actualBuilds || 0;
          } else {
            console.log(`Week "${actualWeek.week}" not found in chart data`);
            // Let's also try to find by date instead of week string
            const matchingByDate = baseChartData.findIndex(chartWeek => chartWeek.date === actualWeek.date);
            console.log(`  Trying to match by date "${actualWeek.date}", found at index ${matchingByDate}`);
            if (matchingByDate !== -1) {
              console.log(`  Date match found! Merging actualBuilds: ${actualWeek.actualBuilds} for date ${actualWeek.date}`);
              baseChartData[matchingByDate].actualBuilds = actualWeek.actualBuilds || 0;
            }
          }
        });
        
        console.log(`Final ${platformType} chart data:`, baseChartData.filter(w => w.actualBuilds > 0));
        mergedChartData[platformType] = baseChartData;
      });
      setChartData(mergedChartData);

      // Set quality data using utility function
      console.log('=== Quality Data Debug ===');
      console.log('Raw quality data from API:', qualityDataResult);
      const processedQuality = processQualityData(qualityDataResult);
      console.log('Processed quality data:', processedQuality);
      setQualityData(processedQuality);

    } catch (err) {
      console.error('Error loading project data:', err);
      setError('Failed to load project data');
    } finally {
      setDataLoading(false);
    }
  };

  /*
  // Save configuration to database
  const saveConfiguration = async (type, configData) => {
    try {
      setConfigLoading(true);

      // Always save porTargets as an array matching the table range
      const porTargets = ensurePorTargetsSize(configData.porTargets, configData.startDate, configData.endDate);

      // Prepare data in format expected by backend
      const backendData = {
        startDate: configData.startDate,
        endDate: configData.endDate,
        afeDate: configData.afeDate || null,
        tvDate: configData.tvDate || null,
        iodDate: configData.iodDate || null,
        uuDate: configData.uuDate || null,
        milestones: configData.milestones || [],
        porTargets // Save as array, not object
      };

      await api.saveForecastConfig(selectedProject, type, backendData);
      console.log('Configuration saved successfully');
    } catch (err) {
      console.error('Error saving configuration:', err);
      setError('Failed to save configuration');
    } finally {
      setConfigLoading(false);
    }
  };

  */

  const saveConfiguration = async (type, configData) => {
    try {
      setConfigLoading(true);
  
      // Ensure correct sizes
      const smartTargets = ensurePorTargetsSize(
        configData.smartTargets,
        configData.startDate,
        configData.endDate
      );
  
      const nonSmartTargets = ensurePorTargetsSize(
        configData.nonSmartTargets,
        configData.startDate,
        configData.endDate
      );
  
      // 🔥 Compute total (porTargets)
      const porTargets = smartTargets.map((val, idx) => {
        return val + (nonSmartTargets[idx] || 0);
      });
  
      // Prepare backend data
      const backendData = {
        startDate: configData.startDate,
        endDate: configData.endDate,
        afeDate: configData.afeDate || null,
        tvDate: configData.tvDate || null,
        iodDate: configData.iodDate || null,
        uuDate: configData.uuDate || null,
        milestones: configData.milestones || [],
  
        // ✅ ALL THREE
        smartTargets,
        nonSmartTargets,
        porTargets
      };
  
      await api.saveForecastConfig(selectedProject, type, backendData);
      console.log('Configuration saved successfully');
  
    } catch (err) {
      console.error('Error saving configuration:', err);
      setError('Failed to save configuration');
    } finally {
      setConfigLoading(false);
    }
  };

  
  const retryOperation = () => {
    setError(null);
    if (selectedProject) {
      loadProjectData();
    } else {
      loadProjects();
    }
  };

  return {
    // State
    selectedProject,
    setSelectedProject,
    projects,
    chartData,
    chartConfigs,
    setChartConfigs,
    qualityData,
    
    // Loading states
    loading,
    error,
    configLoading,
    dataLoading,
    
    // Functions
    loadProjectData,
    saveConfiguration,
    retryOperation
  };
};