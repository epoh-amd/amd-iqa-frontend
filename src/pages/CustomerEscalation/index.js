// frontend/src/pages/CustomerEscalation/index.js
// Main CustomerEscalation component - Fixed version with persistent metrics and clickable filter functionality

import React, { useState, useEffect } from 'react';  
import api from '../../services/api';
import { useToast } from '../../components/Toast';
import { useAuth } from '../../contexts/AuthContext';
import { getStandardizedStats, isValidStatusTransition, formatMonthDisplay, calculateDaysOpen, sortEscalationsByDaysOpen } from './utils';
import { getAvailableStatusOptions } from './statusUtils';
import { drawFailureModeChart } from './chartUtils';
import OverviewView from './OverviewView';
import DetailView from './DetailView';
import ListView from './ListView';
import '../../assets/css/customerEscalation.css';  
  
const CustomerEscalation = () => {  
  const [escalations, setEscalations] = useState([]);
  const { success, error, warning } = useToast();
  const { user } = useAuth();  
  const [filteredEscalations, setFilteredEscalations] = useState([]);  
  const [selectedEscalation, setSelectedEscalation] = useState(null);  
  const [viewMode, setViewMode] = useState('list');  
  const [searchTerm, setSearchTerm] = useState('');  
  const [statusFilter, setStatusFilter] = useState('all');  
  const [stats, setStats] = useState({ total: 0, byStatus: [], monthly: [], byFailureMode: [] });  
  const [isEditMode, setIsEditMode] = useState(false);  
  const [editData, setEditData] = useState({  
    status: '',  
    failureMode: '',  
    failureCategory: '',  
    technicianNotes: ''  
  });  
  const [failureModes, setFailureModes] = useState({});
  const [flatFailureModes, setFlatFailureModes] = useState([]);
  const [chartInstance, setChartInstance] = useState(null);
  const [requestData, setRequestData] = useState({
    requestType: 'error_log',
    requestMessage: ''
  });
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [timelineData, setTimelineData] = useState([]);
  
  // Chart states
  const [chartViewType, setChartViewType] = useState('count');
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [availableMonths, setAvailableMonths] = useState([]);
  const [monthlyFailureModeData, setMonthlyFailureModeData] = useState({});
  
  useEffect(() => {  
    fetchEscalations();  
    fetchStats();  
    fetchFailureModes();
    fetchMonthlyFailureModeData();
  }, []);  
  
  useEffect(() => {  
    if (Array.isArray(escalations)) {  
      filterEscalations();  
    }  
  }, [escalations, searchTerm, statusFilter]);  
  
  useEffect(() => {  
    if (viewMode === 'overview' && selectedMonth && monthlyFailureModeData[selectedMonth]) {  
      setTimeout(() => {
        drawFailureModeChart(chartInstance, setChartInstance, monthlyFailureModeData, selectedMonth, chartViewType);
      }, 100);
    }  
    return () => {  
      if (chartInstance) {  
        chartInstance.destroy();
        setChartInstance(null);
      }  
    };  
  }, [stats, viewMode, chartViewType, selectedMonth, monthlyFailureModeData]);

  /**
   * NEW: Handle metric card clicks to filter escalations
   * Sets the appropriate filter and switches to list view
   */
  const handleMetricClick = (status) => {
    console.log(`Metric clicked: ${status}`);
    
    // Set the status filter
    if (status === 'total') {
      setStatusFilter('all');
    } else {
      setStatusFilter(status);
    }
    
    // Switch to list view to show filtered results
    setViewMode('list');
  };

  /**
   * Enhanced handleUpdate with status validation
   */
  const handleUpdate = async () => {  
    if (!selectedEscalation || !selectedEscalation.ticket_id) {  
      warning('No escalation selected or missing ticket ID');  
      return;  
    }  

    // Validate status transition before sending to server
    if (editData.status && !isValidStatusTransition(selectedEscalation.status, editData.status)) {
      error(`Invalid status transition: Cannot change from "${selectedEscalation.status}" to "${editData.status}"`);
      return;
    }
  
    try {  
      // Map frontend field names to API field names and include technician name
      const updatePayload = {
        status: editData.status,
        current_failure_mode: editData.failureMode,
        current_failure_category: editData.failureCategory,
        latest_technician_notes: editData.technicianNotes,
        technicianName: user?.full_name || 'Tech Support'
      };

      await api.updateEscalation(selectedEscalation.ticket_id, updatePayload);
      success('Escalation updated successfully');  
      setIsEditMode(false);  
      fetchEscalations();  
      fetchEscalationDetails(selectedEscalation.ticket_id);  
    } catch (error) {  
      console.error('Error updating escalation:', error);  
      error('Failed to update escalation');  
    }  
  };

  const fetchEscalations = async () => {  
    try {  
      const data = await api.getCustomerEscalations();
      setEscalations(Array.isArray(data) ? data : []);  
      setFilteredEscalations(Array.isArray(data) ? data : []);  
    } catch (error) {  
      console.error('Error fetching escalations:', error);  
      setEscalations([]);  
      setFilteredEscalations([]);  
    }  
  };

  const fetchStats = async () => {  
    try {  
      const data = await api.getEscalationStats();
      console.log('Raw stats data from API:', data);
      
      // Transform flat backend data to expected array format
      const byStatusArray = [
        { status: 'Open', count: data?.open || 0 },
        { status: 'Closed', count: data?.closed || 0 },
        { status: 'Reopened', count: data?.reopened || 0 }
      ];
      
      setStats({  
        total: data?.total || 0,  
        byStatus: byStatusArray,
        monthly: Array.isArray(data?.monthly) ? data.monthly : [],
        byFailureMode: Array.isArray(data?.byFailureMode) ? data.byFailureMode : []
      });
      
      console.log('Transformed stats:', {
        total: data?.total || 0,
        byStatus: byStatusArray
      });
    } catch (error) {  
      console.error('Error fetching stats:', error);  
      setStats({ total: 0, byStatus: [], monthly: [], byFailureMode: [] });  
    }  
  };

  const fetchFailureModes = async () => {  
    try {  
      const data = await api.getFailureModes();
      console.log('Raw failure modes data:', data);
      
      if (data && typeof data === 'object') {
        setFailureModes(data);
        
        const flatArray = [];
        Object.keys(data).forEach(category => {
          if (Array.isArray(data[category])) {
            data[category].forEach(mode => {
              flatArray.push({
                failure_mode: mode,
                failure_category: category
              });
            });
          }
        });
        
        setFlatFailureModes(flatArray);
      } else if (Array.isArray(data)) {
        setFlatFailureModes(data);
        
        const grouped = data.reduce((acc, item) => {
          const category = item.failure_category || 'Uncategorized';
          if (!acc[category]) {
            acc[category] = [];
          }
          acc[category].push(item.failure_mode);
          return acc;
        }, {});
        
        setFailureModes(grouped);
      } else {
        console.warn('Unexpected failure modes data format:', data);
        setFailureModes({});
        setFlatFailureModes([]);
      }
    } catch (error) {  
      console.error('Error fetching failure modes:', error);  
      setFailureModes({});
      setFlatFailureModes([]);
    }  
  };

  const fetchEscalationDetails = async (ticketId) => {  
    try {  
      const data = await api.getEscalationDetails(ticketId);
      setSelectedEscalation(data);
      setTimelineData(data.timeline || []);
      setEditData({  
        status: data?.status || '',  
        failureMode: data?.current_failure_mode || '',  
        failureCategory: data?.current_failure_category || '',  
        technicianNotes: data?.latest_technician_notes || ''  
      });  
      setViewMode('detail');  
    } catch (error) {  
      console.error('Error fetching escalation details:', error);  
    }  
  };

  const handleSendRequest = async () => {
    if (!requestData.requestMessage.trim()) {
      warning('Please enter a request message');
      return;
    }
  
    setIsSubmittingRequest(true);
    try {
      await api.sendCustomerRequest(selectedEscalation.ticket_id, {
        ...requestData,
        technicianName: 'Technician'
      });
      success('Request sent to customer successfully');
      setShowRequestForm(false);
      setRequestData({ requestType: 'error_log', requestMessage: '' });
      fetchEscalationDetails(selectedEscalation.ticket_id);
    } catch (error) {
      console.error('Error sending request:', error);
      error('Failed to send request');
    } finally {
      setIsSubmittingRequest(false);
    }
  };
  
  const fetchMonthlyFailureModeData = async () => {
    try {
      console.log('Fetching real failure mode trends data...');
      const realData = await api.getEscalationFailureModeTrends();
      console.log('Real failure mode trends data:', realData);
      
      setMonthlyFailureModeData(realData);
      const months = Object.keys(realData).sort();
      
      setAvailableMonths(months);
      if (months.length > 0) {
        // Select the latest month with data
        const latestMonth = months[months.length - 1];
        setSelectedMonth(latestMonth);
      }
    } catch (error) {
      console.error('Error fetching monthly failure mode data:', error);
      // Fallback to empty data structure
      setMonthlyFailureModeData({});
      setAvailableMonths([]);
      setSelectedMonth(null);
    }
  };
  
  const filterEscalations = () => {  
    if (!Array.isArray(escalations)) {  
      setFilteredEscalations([]);  
      return;  
    }  
      
    let filtered = escalations;  
  
    if (searchTerm) {  
      filtered = filtered.filter(e =>   
        (e.ticket_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||  
        (e.chassis_sn || '').toLowerCase().includes(searchTerm.toLowerCase()) ||  
        (e.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase())  
      );  
    }  
  
    if (statusFilter !== 'all') {  
      filtered = filtered.filter(e => e.status === statusFilter);  
    }  
  
    // Sort by days open in descending order (longest open first)
    filtered = sortEscalationsByDaysOpen(filtered);
  
    setFilteredEscalations(filtered);  
  };
  
  const navigateMonth = (direction) => {
    const currentIndex = availableMonths.indexOf(selectedMonth);
    if (direction === 'prev' && currentIndex > 0) {
      setSelectedMonth(availableMonths[currentIndex - 1]);
    } else if (direction === 'next' && currentIndex < availableMonths.length - 1) {
      setSelectedMonth(availableMonths[currentIndex + 1]);
    }
  };
  
  const getCurrentMonthData = () => {
    if (!selectedMonth || !monthlyFailureModeData[selectedMonth]) {
      return [];
    }
    const data = monthlyFailureModeData[selectedMonth];
    return Array.isArray(data) ? data : [];
  };

  const handleFailureModeChange = (mode) => {  
    const selected = flatFailureModes.find(f => f.failure_mode === mode);
    
    setEditData({  
      ...editData,  
      failureMode: mode,  
      failureCategory: selected ? selected.failure_category : ''  
    });  
  };

  // Component rendering starts here...
  if (viewMode === 'overview') {  
    const standardizedStats = getStandardizedStats(stats);
    
    return <OverviewView 
      stats={stats}
      standardizedStats={standardizedStats}
      handleMetricClick={handleMetricClick}
      setViewMode={setViewMode}
      selectedMonth={selectedMonth}
      availableMonths={availableMonths}
      monthlyFailureModeData={monthlyFailureModeData}
      chartViewType={chartViewType}
      setChartViewType={setChartViewType}
      navigateMonth={navigateMonth}
      formatMonthDisplay={formatMonthDisplay}
      getCurrentMonthData={getCurrentMonthData}
    />;
  }  
  
  if (viewMode === 'detail' && selectedEscalation) {  
    return <DetailView 
      selectedEscalation={selectedEscalation}
      setViewMode={setViewMode}
      isEditMode={isEditMode}
      setIsEditMode={setIsEditMode}
      showRequestForm={showRequestForm}
      setShowRequestForm={setShowRequestForm}
      requestData={requestData}
      setRequestData={setRequestData}
      isSubmittingRequest={isSubmittingRequest}
      handleSendRequest={handleSendRequest}
      editData={editData}
      setEditData={setEditData}
      flatFailureModes={flatFailureModes}
      handleFailureModeChange={handleFailureModeChange}
      handleUpdate={handleUpdate}
      timelineData={timelineData}
    />;
  }  
  
  return <ListView 
    searchTerm={searchTerm}
    setSearchTerm={setSearchTerm}
    statusFilter={statusFilter}
    setStatusFilter={setStatusFilter}
    filteredEscalations={filteredEscalations}
    fetchEscalationDetails={fetchEscalationDetails}
    setViewMode={setViewMode}
  />;
};  
  
export default CustomerEscalation;