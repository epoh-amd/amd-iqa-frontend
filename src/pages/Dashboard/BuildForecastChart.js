// frontend/src/pages/Dashboard/BuildForecastChart.js

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea, ReferenceLine, Bar } from 'recharts';
import { Edit3, ZoomIn, ZoomOut, RotateCcw, ChevronLeft, ChevronRight, Activity, ActivitySquare } from 'lucide-react';
import InfoCardOnChart from './InfoCardOnChart';
import { calculateCumulativeData, findClosestWeekIndex } from './utils';

const BuildForecastChart = ({ 
  type, 
  chartData, 
  chartConfigs, 
  selectedProject, 
  autoCursorProps, 
  onEditStart,
  chartDataWithAccumRef // Add this prop to get the ref from parent
}) => {
  // Zoom state management - focus on X-axis (time) zooming
  const [zoomState, setZoomState] = useState({
    startIndex: 0,
    endIndex: null, // null means show all data
    isZoomed: false
  });
  const chartRef = useRef(null);
  const [isMouseOverChart, setIsMouseOverChart] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const data = chartData[type] || [];

  
  const config = chartConfigs[selectedProject]?.[type] || {};
  const milestones = config.milestones || [];
  const afeDate = config.afeDate;
  const uuDate = config.uuDate;
  const iodDate = config.iodDate;
  const tvDate = config.tvDate;

  // Compute chartDataWithAccum using utility function
  const chartDataWithAccum = calculateCumulativeData(data);
  
  // Create intelligent accumulation lines - find start and end points for continuous lines
  // This ensures both Actual and POR lines draw continuously from first to last data point
  const createIntelligentAccumLines = (data) => {
    // Find first and last indices for POR targets
    let firstPORIndex = -1;
    let lastPORIndex = -1;

    for (let i = 0; i < data.length; i++) {
      if (data[i].porTarget !== null && data[i].porTarget !== undefined && data[i].porTarget > 0) {
        if (firstPORIndex === -1) firstPORIndex = i;
        lastPORIndex = i;
      }
    }

    // Find first and last indices for actual builds
    let firstActualIndex = -1;
    let lastActualIndex = -1;

    for (let i = 0; i < data.length; i++) {
      if (data[i].actualBuilds !== null && data[i].actualBuilds !== undefined && data[i].actualBuilds > 0) {
        if (firstActualIndex === -1) firstActualIndex = i;
        lastActualIndex = i;
      }
    }

    // Create intelligent lines from first to last point
    return data.map((item, index) => {
      return {
        ...item,
        // Show accumPOR only within POR range (continuous line from first to last POR week)
        accumPOR: (firstPORIndex !== -1 && index >= firstPORIndex && index <= lastPORIndex)
          ? item.accumPOR
          : null,
        // Show accumActual only within Actual range (continuous line from first to last Actual week)
        accumActual: (firstActualIndex !== -1 && index >= firstActualIndex && index <= lastActualIndex)
          ? item.accumActual
          : null
      };
    });
  };

  // Apply intelligent line creation to the data
  const chartDataWithIntelligentAccum = createIntelligentAccumLines(chartDataWithAccum);
  
  
  // Update the ref for auto-cursor (critical for InfoCardOnChart) - use useEffect to avoid infinite loops
  useEffect(() => {
    if (chartDataWithAccumRef && type === 'PRB') {
      chartDataWithAccumRef.current = chartDataWithIntelligentAccum;
    }
  }, [chartDataWithIntelligentAccum, chartDataWithAccumRef, type]);

  // Find the last index with nonzero actualBuilds and porTarget for line visibility
  const hasActualLine = chartDataWithIntelligentAccum.some(item => 
    item.actualBuilds !== null && item.actualBuilds !== undefined && item.actualBuilds > 0
  );
  const hasPorLine = chartDataWithIntelligentAccum.some(item => 
    item.porTarget !== null && item.porTarget !== undefined && item.porTarget > 0
  );
  
  // Check if there's valid accumulation data
  const hasActualAccumLine = chartDataWithIntelligentAccum.some(item => 
    item.accumActual !== null && item.accumActual !== undefined && item.accumActual > 0
  );
  const hasPorAccumLine = chartDataWithIntelligentAccum.some(item => 
    item.accumPOR !== null && item.accumPOR !== undefined && item.accumPOR > 0
  );

  // Memoize frequently used indices using utility function
  const afeIndex = findClosestWeekIndex(chartDataWithIntelligentAccum, afeDate);
  const uuIndex = findClosestWeekIndex(chartDataWithIntelligentAccum, uuDate);
  const iodIndex = findClosestWeekIndex(chartDataWithIntelligentAccum, iodDate);
  const tvIndex = findClosestWeekIndex(chartDataWithIntelligentAccum, tvDate);

  // UX-friendly, soft, and colorblind-accessible milestone area colors
  // Extended to 10 distinct colors for better milestone differentiation
  const milestoneColors = [
    '#BFD7FF', // Soft Blue
    '#CFFFE1', // Soft Green
    '#FFF9C4', // Soft Yellow
    '#FFE0B2', // Soft Orange
    '#E1CFFF', // Soft Purple
    '#FFD4E5', // Soft Pink
    '#D4F1F4', // Soft Cyan
    '#F5E6D3', // Soft Beige
    '#E8F5E9', // Soft Mint
    '#FFF3CD'  // Soft Cream
  ];

  // Calculate milestone positions with adjacent positioning (no gaps, no overlaps)
  // First calculate all milestones based on full data
  const allMilestones = [];
  let lastEndIdx = -1;
  
  milestones.forEach((milestone, index) => {
    const originalStartIdx = findClosestWeekIndex(chartDataWithIntelligentAccum, milestone.startDate);
    const originalEndIdx = findClosestWeekIndex(chartDataWithIntelligentAccum, milestone.endDate);
    
    if (originalStartIdx !== null && originalEndIdx !== null) {
      let startIdx, endIdx;
      
      if (index === 0) {
        // First milestone - use original indices
        startIdx = originalStartIdx;
        endIdx = originalEndIdx;
      } else {
        // Subsequent milestones - start immediately after previous milestone
        startIdx = lastEndIdx + 1;
        endIdx = Math.max(startIdx, originalEndIdx);
        
        // Ensure we don't exceed chart bounds
        if (startIdx >= chartDataWithIntelligentAccum.length) {
          return; // Skip this milestone if it's beyond the chart
        }
        endIdx = Math.min(endIdx, chartDataWithIntelligentAccum.length - 1);
      }
      
      if (startIdx <= endIdx) {
        allMilestones.push({
          ...milestone,
          _startIdx: startIdx,
          _endIdx: endIdx
        });
        lastEndIdx = endIdx;
      }
    }
  });

  // Filter milestones to only show those that overlap with the visible data range
  const visibleMilestones = allMilestones.filter(milestone => {
    const currentStartIdx = zoomState.isZoomed ? zoomState.startIndex : 0;
    const currentEndIdx = zoomState.isZoomed ? (zoomState.endIndex || chartDataWithIntelligentAccum.length) : chartDataWithIntelligentAccum.length;
    
    // Check if milestone overlaps with visible range
    return milestone._endIdx >= currentStartIdx && milestone._startIdx < currentEndIdx;
  });

  // Helper function to check if an index is within visible range
  const isIndexVisible = useCallback((index) => {
    if (!zoomState.isZoomed) return true;
    
    const currentStartIdx = zoomState.startIndex;
    const currentEndIdx = zoomState.endIndex || chartDataWithIntelligentAccum.length;
    
    return index >= currentStartIdx && index < currentEndIdx;
  }, [zoomState, chartDataWithIntelligentAccum.length]);

  // For more Y-axis labels, set tickCount and interval
  const yTickCount = 10;

  // Calculate the maximum value in the chart data to set Y-axis domain
  const maxValue = Math.max(
    ...chartDataWithIntelligentAccum.map(item => Math.max(
      item.accumActual || 0,
      item.accumPOR || 0,
      item.actualBuilds || 0,
      item.porTarget || 0
    ))
  );
  
  // Set Y-axis domain to be 1000 points higher than the maximum value to provide space for info card
  const yAxisMax = maxValue > 0 ? maxValue + 1000 : 'auto';

  // Get the data slice based on zoom state
  const getVisibleData = useCallback(() => {
    if (!zoomState.isZoomed) {
      return chartDataWithIntelligentAccum;
    }
    
    const startIdx = Math.max(0, zoomState.startIndex);
    const endIdx = Math.min(chartDataWithIntelligentAccum.length, zoomState.endIndex || chartDataWithIntelligentAccum.length);
    
    // Ensure we always include at least one data point and don't go beyond array bounds
    const safeStartIdx = Math.min(startIdx, chartDataWithIntelligentAccum.length - 1);
    const safeEndIdx = Math.max(safeStartIdx + 1, endIdx);
    
    return chartDataWithIntelligentAccum.slice(safeStartIdx, safeEndIdx);
  }, [chartDataWithIntelligentAccum, zoomState]);

  // Zoom functionality - X-axis (time) focused
  const handleZoomIn = useCallback(() => {
    if (chartDataWithIntelligentAccum.length === 0) return;
    
    setZoomState(prev => {
      const totalLength = chartDataWithIntelligentAccum.length;
      
      if (prev.isZoomed) {
        // Already zoomed, zoom in further
        const currentRange = (prev.endIndex || totalLength) - prev.startIndex;
        const newRange = Math.max(3, Math.floor(currentRange * 0.7)); // Show fewer weeks
        
        const centerIndex = Math.floor(prev.startIndex + currentRange / 2);
        let newStartIndex = Math.max(0, Math.floor(centerIndex - newRange / 2));
        let newEndIndex = Math.min(totalLength, newStartIndex + newRange);
        
        // Ensure we don't exceed boundaries - adjust start if end hits the limit
        if (newEndIndex >= totalLength) {
          newEndIndex = totalLength;
          newStartIndex = Math.max(0, newEndIndex - newRange);
        }
        
        return {
          startIndex: newStartIndex,
          endIndex: newEndIndex,
          isZoomed: true
        };
      } else {
        // First zoom - show middle portion of data
        const zoomRange = Math.max(5, Math.floor(totalLength * 0.5)); // Show 50% of weeks
        const startIndex = Math.floor((totalLength - zoomRange) / 2);
        const endIndex = Math.min(totalLength, startIndex + zoomRange);
        
        return {
          startIndex: startIndex,
          endIndex: endIndex,
          isZoomed: true
        };
      }
    });
  }, [chartDataWithIntelligentAccum]);

  const handleZoomOut = useCallback(() => {
    if (chartDataWithIntelligentAccum.length === 0) return;
    
    setZoomState(prev => {
      if (!prev.isZoomed) {
        return prev; // Can't zoom out more
      }
      
      const totalLength = chartDataWithIntelligentAccum.length;
      const currentRange = (prev.endIndex || totalLength) - prev.startIndex;
      const newRange = Math.min(totalLength, Math.floor(currentRange * 1.4));
      
      // Check if we're back to full view
      if (newRange >= totalLength) {
        return {
          startIndex: 0,
          endIndex: null,
          isZoomed: false
        };
      }
      
      const centerIndex = Math.floor(prev.startIndex + currentRange / 2);
      let newStartIndex = Math.max(0, Math.floor(centerIndex - newRange / 2));
      let newEndIndex = Math.min(totalLength, newStartIndex + newRange);
      
      // Ensure we don't exceed boundaries - adjust start if end hits the limit
      if (newEndIndex >= totalLength) {
        newEndIndex = totalLength;
        newStartIndex = Math.max(0, newEndIndex - newRange);
      }
      
      return {
        startIndex: newStartIndex,
        endIndex: newEndIndex,
        isZoomed: true
      };
    });
  }, [chartDataWithIntelligentAccum]);

  const handleZoomReset = useCallback(() => {
    setZoomState({
      startIndex: 0,
      endIndex: null,
      isZoomed: false
    });
  }, []);

  // Pan functionality for scrolling left/right when zoomed
  const handlePanLeft = useCallback(() => {
    if (!zoomState.isZoomed) return;
    
    setZoomState(prev => {
      const totalLength = chartDataWithIntelligentAccum.length;
      const currentRange = (prev.endIndex || totalLength) - prev.startIndex;
      const panAmount = Math.max(1, Math.floor(currentRange * 0.2)); // Pan by 20% of visible range
      
      let newStartIndex = Math.max(0, prev.startIndex - panAmount);
      let newEndIndex = Math.min(totalLength, newStartIndex + currentRange);
      
      // Ensure we maintain the exact range
      if (newEndIndex - newStartIndex !== currentRange) {
        newEndIndex = Math.min(totalLength, newStartIndex + currentRange);
      }
      
      return {
        ...prev,
        startIndex: newStartIndex,
        endIndex: newEndIndex
      };
    });
  }, [zoomState.isZoomed, chartDataWithIntelligentAccum.length]);

  const handlePanRight = useCallback(() => {
    if (!zoomState.isZoomed) return;
    
    setZoomState(prev => {
      const totalLength = chartDataWithIntelligentAccum.length;
      const currentRange = (prev.endIndex || totalLength) - prev.startIndex;
      const panAmount = Math.max(1, Math.floor(currentRange * 0.2)); // Pan by 20% of visible range
      
      let newEndIndex = Math.min(totalLength, (prev.endIndex || totalLength) + panAmount);
      let newStartIndex = Math.max(0, newEndIndex - currentRange);
      
      // If we hit the right boundary, adjust both indices
      if (newEndIndex >= totalLength) {
        newEndIndex = totalLength;
        newStartIndex = Math.max(0, newEndIndex - currentRange);
      }
      
      return {
        ...prev,
        startIndex: newStartIndex,
        endIndex: newEndIndex
      };
    });
  }, [zoomState.isZoomed, chartDataWithIntelligentAccum.length]);

  // Mouse wheel zoom handler
  const handleWheel = useCallback((e) => {
    if (!isMouseOverChart) return;
    
    e.preventDefault();
    
    // Check if Shift key is pressed for horizontal scrolling
    if (e.shiftKey && zoomState.isZoomed) {
      if (e.deltaY < 0) {
        handlePanLeft();
      } else {
        handlePanRight();
      }
    } else {
      // Regular zoom
      if (e.deltaY < 0) {
        // Scroll up - zoom in
        handleZoomIn();
      } else {
        // Scroll down - zoom out
        handleZoomOut();
      }
    }
  }, [isMouseOverChart, handleZoomIn, handleZoomOut, handlePanLeft, handlePanRight, zoomState.isZoomed]);

  // Effect to add wheel event listener
  useEffect(() => {
    const chartElement = chartRef.current;
    if (chartElement) {
      chartElement.addEventListener('wheel', handleWheel, { passive: false });
      return () => {
        chartElement.removeEventListener('wheel', handleWheel);
      };
    }
  }, [handleWheel]);

  // Check if we should show bar labels (when zoomed to less than 30 data points)
  const visibleDataLength = getVisibleData().length;
  const showBarLabels = visibleDataLength < 30;

  return (
    <div className="chart-container">
      {/* Title and Controls */}
      <div className="chart-header">
        <h3 className="chart-title">
          {selectedProject ? `${selectedProject} ` : ''}{type} Weekly Build Delivery Factory & Smart Hand
          {zoomState.isZoomed && <span className="zoom-indicator"> (Zoomed)</span>}
        </h3>
        
        <div className="chart-controls">
          {/* Animation line toggle */}
          <div className="animation-controls">
            <label className="animation-toggle">
              <input
                type="checkbox"
                checked={autoCursorProps.autoCursorActive}
                onChange={autoCursorProps.toggleAutoCursor}
                className="animation-checkbox"
              />
              <span className="animation-slider"></span>
            </label>
            
            {autoCursorProps.autoCursorActive && (
              <select
                value={autoCursorProps.autoCursorSpeed}
                onChange={(e) => autoCursorProps.setSpeed(parseInt(e.target.value))}
                className="speed-select"
              >
                <option value={3000}>3s</option>
                <option value={10000}>10s</option>
              </select>
            )}
          </div>
          
          <div className="zoom-controls">
            <button
              onClick={handleZoomIn}
              className="control-button zoom"
              title="Zoom In (show fewer weeks)"
            >
              <ZoomIn size={14} />
            </button>
            
            <button
              onClick={handleZoomOut}
              className="control-button zoom"
              title="Zoom Out (show more weeks)"
            >
              <ZoomOut size={14} />
            </button>
            
            <button
              onClick={handleZoomReset}
              className="control-button zoom"
              title="Reset Zoom"
              disabled={!zoomState.isZoomed}
            >
              <RotateCcw size={14} />
            </button>
            
            {zoomState.isZoomed && (
              <>
                <div className="zoom-separator"></div>
                <button
                  onClick={handlePanLeft}
                  className="control-button pan"
                  title="Scroll Left (or Shift+Scroll Up)"
                >
                  <ChevronLeft size={14} />
                </button>
                
                <button
                  onClick={handlePanRight}
                  className="control-button pan"
                  title="Scroll Right (or Shift+Scroll Down)"
                >
                  <ChevronRight size={14} />
                </button>
              </>
            )}
          </div>

          <button
            onClick={() => onEditStart(type)}
            className="control-button edit"
          >
            <Edit3 size={14} />
            Edit
          </button>
        </div>
      </div>

      {/* Unified Chart: Lines and Bars */}
      <div 
        ref={chartRef}
        style={{ flex: '1 1 0', minHeight: '400px', position: 'relative', paddingTop: '0px' }}
        onMouseEnter={() => setIsMouseOverChart(true)}
        onMouseLeave={() => setIsMouseOverChart(false)}
      >
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart
            data={getVisibleData()}
            margin={{ top: 10, right: 30, left: 40, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
            <XAxis
              dataKey="week"
              interval={0}
              tick={({ x, y, payload, index, ...rest }) => {
                // Show every week as a tick, with daily intervals between points
                const visibleData = getVisibleData();
                const item = visibleData[index];
                if (!item) return null;
                // Calculate the exact x position for the tick label to align with the bar/line point
                let alignedX = x;
                if (rest && rest.scale && typeof item.week !== 'undefined') {
                  alignedX = rest.scale(item.week);
                }
                // Show label for every week (all points)
                const date = new Date(item.date);
                const mm = (date.getMonth() + 1).toString().padStart(2, '0');
                const dd = date.getDate().toString().padStart(2, '0');
                const labelText = `${mm}/${dd}`;
                return (
                  <g transform={`translate(${alignedX},${y + 22})`}>
                    <text
                      textAnchor="middle"
                      fontSize={12}
                      fontWeight={600}
                      fill="#475569"
                      style={{ fontStyle: 'normal', pointerEvents: 'none' }}
                      alignmentBaseline="hanging"
                      transform="rotate(-90)"
                    >
                      {labelText}
                    </text>
                  </g>
                );
              }}
              axisLine={{ stroke: '#64748b', strokeWidth: 2 }}
              height={60}
            />
            <YAxis
              label={{ value: 'Build Delivery QTY', angle: -90, position: 'insideLeft', style: { fontSize: '13px', fontWeight: '600', fill: '#475569' } }}
              tick={{ fontSize: 12, fontWeight: 600, fill: '#64748b' }}
              allowDecimals={false}
              domain={[0, yAxisMax]}
              axisLine={{ stroke: '#64748b', strokeWidth: 2 }}
              tickCount={yTickCount}
            />
            {/* Simulated moving info card OVER the chart, at the corresponding X position */}
            <Tooltip />
            
            {/* Moving vertical line indicator */}
            {getVisibleData().length > 0 && autoCursorProps.autoCursorActive && 
             autoCursorProps.autoCursorIndex >= zoomState.startIndex && 
             autoCursorProps.autoCursorIndex < (zoomState.endIndex || chartDataWithIntelligentAccum.length) && (
              <>
                {/* Shadow/glow effect */}
                <ReferenceLine
                  x={chartDataWithIntelligentAccum[autoCursorProps.autoCursorIndex]?.week}
                  stroke="#3b82f6"
                  strokeWidth={12}
                  opacity={0.15}
                />
                {/* Main line */}
                <ReferenceLine
                  x={chartDataWithIntelligentAccum[autoCursorProps.autoCursorIndex]?.week}
                  stroke="#3b82f6"
                  strokeWidth={4}
                  strokeDasharray={autoCursorProps.autoCursorPaused ? "8 8" : "none"}
                  opacity={0.95}
                  label={({ viewBox }) => {
                    if (!viewBox) return null;
                    const { x, y, height } = viewBox;
                    const point = chartDataWithIntelligentAccum[autoCursorProps.autoCursorIndex] || {};
                    
                    // Format full date
                    const dateObj = point.date ? new Date(point.date) : null;
                    const mm = dateObj ? (dateObj.getMonth() + 1).toString().padStart(2, '0') : '--';
                    const dd = dateObj ? dateObj.getDate().toString().padStart(2, '0') : '--';
                    const yyyy = dateObj ? dateObj.getFullYear() : '----';
                    const fullDate = dateObj ? `${mm}/${dd}/${yyyy}` : '--/--/----';
                    
                    // Format numbers with commas
                    const formatNumber = (num) => {
                      if (num === null || num === undefined) return '0';
                      return num.toLocaleString();
                    };
                    
                    return (
                      <g>
                        {/* Top circle indicator with glow */}
                        <circle
                          cx={x}
                          cy={y + 10}
                          r="8"
                          fill="#3b82f6"
                          opacity={0.2}
                        />
                        <circle
                          cx={x}
                          cy={y + 10}
                          r="5"
                          fill="#3b82f6"
                          opacity={0.95}
                          stroke="white"
                          strokeWidth="3"
                        />
                        
                        {/* Bottom circle indicator with glow */}
                        <circle
                          cx={x}
                          cy={y + height - 10}
                          r="8"
                          fill="#3b82f6"
                          opacity={0.2}
                        />
                        <circle
                          cx={x}
                          cy={y + height - 10}
                          r="5"
                          fill="#3b82f6"
                          opacity={0.95}
                          stroke="white"
                          strokeWidth="3"
                        />
                        
                        {/* Enhanced information box with gradient background */}
                        <defs>
                          <linearGradient id="infoBoxGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" style={{stopColor: '#ffffff', stopOpacity: 0.98}} />
                            <stop offset="100%" style={{stopColor: '#f8fafc', stopOpacity: 0.95}} />
                          </linearGradient>
                          <filter id="boxShadow" x="-50%" y="-50%" width="200%" height="200%">
                            <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#000000" floodOpacity="0.15"/>
                          </filter>
                        </defs>
                        
                        <rect
                          x={x - 90}
                          y={y + 30}
                          width={180}
                          height={105}
                          rx={12}
                          fill="url(#infoBoxGradient)"
                          filter="url(#boxShadow)"
                          stroke="#3b82f6"
                          strokeWidth="2"
                        />
                        
                        {/* Date header with enhanced styling */}
                        <text
                          x={x}
                          y={y + 50}
                          textAnchor="middle"
                          fontSize={12}
                          fontWeight={700}
                          fill="#1e40af"
                        >
                          {fullDate}
                        </text>
                        
                        {/* Weekly Values Row with better spacing */}
                        <text
                          x={x - 80}
                          y={y + 70}
                          textAnchor="start"
                          fontSize={11}
                          fontWeight={700}
                          fill="#64748b"
                        >
                          SH Delivery QTY: {formatNumber(point.actualBuilds)}
                        </text>
                        
                        <text
                          x={x - 80}
                          y={y + 84}
                          textAnchor="start"
                          fontSize={11}
                          fontWeight={700}
                          fill="#64748b"
                        >
                          Factory Delivery QTY: {formatNumber(point.porTarget)}
                        </text>
                        
                        {/* Cumulative Values Row with enhanced styling */}
                        <text
                          x={x - 80}
                          y={y + 98}
                          textAnchor="start"
                          fontSize={11}
                          fontWeight={700}
                          fill="#1e293b"
                        >
                          Accum SH Delivery: {formatNumber(point.accumActual)}
                        </text>
                        
                        <text
                          x={x - 80}
                          y={y + 112}
                          textAnchor="start"
                          fontSize={11}
                          fontWeight={700}
                          fill="#1e293b"
                        >
                          Accum Factory Delivery: {formatNumber(point.accumPOR)}
                        </text>
                        
                        {/* Performance indicator with enhanced styling */}
                        {(point.actualBuilds !== null && point.porTarget !== null && 
                          point.actualBuilds !== undefined && point.porTarget !== undefined) && (
                          <>
                            {/* Enhanced performance indicator circle */}
                            <circle
                              cx={x - 70}
                              cy={y + 125}
                              r="5"
                              fill={point.actualBuilds >= point.porTarget ? "#10b981" : "#ef4444"}
                              opacity={0.9}
                            />
                            <text
                              x={x - 55}
                              y={y + 128}
                              textAnchor="start"
                              fontSize={10}
                              fontWeight={700}
                              fill={point.actualBuilds >= point.porTarget ? "#10b981" : "#ef4444"}
                            >
                              {point.actualBuilds >= point.porTarget ? '+' : ''}{formatNumber(point.actualBuilds - point.porTarget)}
                            </text>
                          </>
                        )}
                      </g>
                    );
                  }}
                />
              </>
            )}
            
            {getVisibleData().length > 0 && autoCursorProps.autoCursorIndex >= zoomState.startIndex && 
             autoCursorProps.autoCursorIndex < (zoomState.endIndex || chartDataWithIntelligentAccum.length) && (
              <InfoCardOnChart
                chartDataWithAccum={chartDataWithIntelligentAccum}
                autoCursorIndex={autoCursorProps.autoCursorIndex}
              />
            )}

            {/* Milestone Reference Areas with labels */}
            {visibleMilestones.map((milestone, index) => {
              const startX = chartDataWithIntelligentAccum[milestone._startIdx]?.week;
              const endX = chartDataWithIntelligentAccum[milestone._endIdx]?.week;
              const midIndex = Math.floor((milestone._startIdx + milestone._endIdx) / 2);
              const midX = chartDataWithIntelligentAccum[midIndex]?.week;
              return (
                <g key={index}>
                  <ReferenceArea
                    x1={startX}
                    x2={endX}
                    fill={milestoneColors[index % milestoneColors.length]}
                    fillOpacity={0.48}
                    stroke={undefined}
                    strokeOpacity={0}
                    strokeWidth={0}
                  />
                  {/* Milestone label: SVG, placed at the top center of the milestone area */}
                  {midX && (
                    <ReferenceLine
                      x={midX}
                      strokeOpacity={0}
                      label={({ viewBox }) => {
                        if (!viewBox) return null;
                        const { x, y } = viewBox;
                        // Place label above the milestone reference area (above the chart plot area)
                        const labelX = x;
                        const labelY = y - 10; // 10px above the top of the chart area
                        const text = milestone.name;
                        return (
                          <text
                            x={labelX}
                            y={labelY}
                            textAnchor="middle"
                            fontSize={14}
                            fontWeight={900}
                            fill="#000000"
                            style={{
                              opacity: 1,
                              letterSpacing: 1
                            }}
                            dominantBaseline="middle"
                          >
                            {text}
                          </text>
                        );
                      }}
                    />
                  )}
                </g>
              );
            })}

            {/* Reference Lines: AFE, UU, IOD, TV */}
            {/* AFE Reference Line */}
            {afeIndex !== null && isIndexVisible(afeIndex) && (
              <>
                <ReferenceLine
                  x={chartDataWithIntelligentAccum[afeIndex]?.week}
                  stroke="#FF9800"
                  strokeWidth={3}
                  strokeDasharray="5 5"
                />
                <ReferenceLine
                  x={chartDataWithIntelligentAccum[afeIndex]?.week}
                  strokeOpacity={0}
                  label={({ viewBox }) => {
                    if (!viewBox) return null;
                    const { x, y, width } = viewBox;
                    const labelX = x;
                    const labelY = y + 18;
                    return (
                      <g>
                        <rect
                          x={labelX - 22}
                          y={labelY - 15}
                          width={44}
                          height={22}
                          rx={6}
                          fill="#fff"
                          opacity={0.95}
                        />
                        <text
                          x={labelX}
                          y={labelY}
                          textAnchor="middle"
                          fontSize={13}
                          fontWeight={700}
                          fill="#FF9800"
                          style={{ opacity: 1, textShadow: '0 2px 8px #fff, 0 0px 2px #fff' }}
                        >
                          AFE
                        </text>
                      </g>
                    );
                  }}
                />
              </>
            )}
            {/* UU Reference Line */}
            {uuIndex !== null && isIndexVisible(uuIndex) && (
              <>
                <ReferenceLine
                  x={chartDataWithIntelligentAccum[uuIndex]?.week}
                  stroke="#00B894"
                  strokeWidth={3}
                  strokeDasharray="4 4"
                />
                <ReferenceLine
                  x={chartDataWithIntelligentAccum[uuIndex]?.week}
                  strokeOpacity={0}
                  label={({ viewBox }) => {
                    if (!viewBox) return null;
                    const { x, y } = viewBox;
                    const labelX = x;
                    const labelY = y + 18;
                    return (
                      <g>
                        <rect
                          x={labelX - 22}
                          y={labelY - 15}
                          width={44}
                          height={22}
                          rx={6}
                          fill="#fff"
                          opacity={0.95}
                        />
                        <text
                          x={labelX}
                          y={labelY}
                          textAnchor="middle"
                          fontSize={13}
                          fontWeight={700}
                          fill="#00B894"
                          style={{ opacity: 1, textShadow: '0 2px 8px #fff, 0 0px 2px #fff' }}
                        >
                          UU
                        </text>
                      </g>
                    );
                  }}
                />
              </>
            )}
            {/* IOD Reference Line */}
            {iodIndex !== null && isIndexVisible(iodIndex) && (
              <>
                <ReferenceLine
                  x={chartDataWithIntelligentAccum[iodIndex]?.week}
                  stroke="#6C5CE7"
                  strokeWidth={3}
                  strokeDasharray="4 4"
                />
                <ReferenceLine
                  x={chartDataWithIntelligentAccum[iodIndex]?.week}
                  strokeOpacity={0}
                  label={({ viewBox }) => {
                    if (!viewBox) return null;
                    const { x, y } = viewBox;
                    const labelX = x;
                    const labelY = y + 18;
                    return (
                      <g>
                        <rect
                          x={labelX - 22}
                          y={labelY - 15}
                          width={44}
                          height={22}
                          rx={6}
                          fill="#fff"
                          opacity={0.95}
                        />
                        <text
                          x={labelX}
                          y={labelY}
                          textAnchor="middle"
                          fontSize={13}
                          fontWeight={700}
                          fill="#6C5CE7"
                          style={{ opacity: 1, textShadow: '0 2px 8px #fff, 0 0px 2px #fff' }}
                        >
                          IOD
                        </text>
                      </g>
                    );
                  }}
                />
              </>
            )}
            {/* TV Reference Line */}
            {tvIndex !== null && isIndexVisible(tvIndex) && (
              <>
                <ReferenceLine
                  x={chartDataWithIntelligentAccum[tvIndex]?.week}
                  stroke="#E17055"
                  strokeWidth={3}
                  strokeDasharray="4 4"
                />
                <ReferenceLine
                  x={chartDataWithIntelligentAccum[tvIndex]?.week}
                  strokeOpacity={0}
                  label={({ viewBox }) => {
                    if (!viewBox) return null;
                    const { x, y } = viewBox;
                    const labelX = x;
                    const labelY = y + 18;
                    return (
                      <g>
                        <rect
                          x={labelX - 22}
                          y={labelY - 15}
                          width={44}
                          height={22}
                          rx={6}
                          fill="#fff"
                          opacity={0.95}
                        />
                        <text
                          x={labelX}
                          y={labelY}
                          textAnchor="middle"
                          fontSize={13}
                          fontWeight={700}
                          fill="#E17055"
                          style={{ opacity: 1, textShadow: '0 2px 8px #fff, 0 0px 2px #fff' }}
                        >
                          TV
                        </text>
                      </g>
                    );
                  }}
                />
              </>
            )}
            {/* Bar charts for daily actual builds and POR targets with enhanced styling */}
            <Bar 
              dataKey="actualBuilds" 
              fill="url(#actualBuildsGradient)" 
              name="SH Delivery QTY" 
              radius={[4,4,0,0]} 
              opacity={0.9}
              label={showBarLabels ? {
                position: 'insideTop',
                fontSize: 9,
                fontWeight: 600,
                fill: '#000000',
                formatter: (value) => value > 0 ? value : ''
              } : false}
            />
            {/* Forecast QTY bar with enhanced styling */}
            <Bar
              dataKey="porTarget"
              fill="url(#porTargetGradient)"
              name="Factory Delivery QTY" 
              radius={[4,4,0,0]} 
              opacity={0.75}
              label={showBarLabels ? {
                position: 'insideBottom',
                fontSize: 9,
                fontWeight: 600,
                fill: '#000000',
                formatter: (value) => value > 0 ? value : ''
              } : false}
            />
            
            {/* Enhanced gradients for bars */}
            <defs>
              <linearGradient id="actualBuildsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1e40af" stopOpacity={1} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.8} />
              </linearGradient>
              <linearGradient id="porTargetGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#dc2626" stopOpacity={1} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0.8} />
              </linearGradient>
              <linearGradient id="actualLineGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1e40af" stopOpacity={1} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.9} />
              </linearGradient>
              <linearGradient id="porLineGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#dc2626" stopOpacity={1} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0.9} />
              </linearGradient>
            </defs>
            
            {/* Cumulative lines with enhanced styling */}
            {/* Only show Actual Delivered QTY accum line if there is data */}
            {hasActualAccumLine && (() => {
              // Find first and last index with accumActual data
              let firstActualIndex = -1;
              let lastActualIndex = -1;
              chartDataWithIntelligentAccum.forEach((item, idx) => {
                if (item.accumActual != null && item.accumActual > 0) {
                  if (firstActualIndex === -1) firstActualIndex = idx;
                  lastActualIndex = idx;
                }
              });

              return (
                <Line
                  type="monotone"
                  dataKey="accumActual"
                  stroke="url(#actualLineGradient)"
                  strokeWidth={4}
                  dot={(props) => {
                    const { cx, cy, index, payload } = props;
                    if (payload.accumActual == null || payload.accumActual <= 0) return null;

                    // Show label at: last point, then every 5 backwards until 5 points after start
                    const shouldShowLabel = index === lastActualIndex ||
                                          (index >= firstActualIndex + 5 && (lastActualIndex - index) % 5 === 0);

                    if (shouldShowLabel) {
                      return (
                        <g>
                          <circle cx={cx} cy={cy} r={3} fill="#1e40af" />
                          <text
                            x={cx}
                            y={cy - 8}
                            textAnchor="middle"
                            fontSize={12}
                            fontWeight="normal"
                            fill="#000000"
                          >
                            {payload.accumActual}
                          </text>
                        </g>
                      );
                    }
                    return null;
                  }}
                  activeDot={{ r: 5, fill: '#1e40af', stroke: '#ffffff', strokeWidth: 2 }}
                  name="Accum. SH Delivery QTY"
                  isAnimationActive={false}
                  connectNulls={true}
                />
              );
            })()}
            {/* Only show Forecast line if there is any nonzero Forecast Qty */}
            {hasPorAccumLine && (() => {
              // Find first and last index with accumPOR data
              let firstPORIndex = -1;
              let lastPORIndex = -1;
              chartDataWithIntelligentAccum.forEach((item, idx) => {
                if (item.accumPOR != null && item.accumPOR > 0) {
                  if (firstPORIndex === -1) firstPORIndex = idx;
                  lastPORIndex = idx;
                }
              });

              // Find the last Actual index to align labels
              let lastActualIndex = -1;
              chartDataWithIntelligentAccum.forEach((item, idx) => {
                if (item.accumActual != null && item.accumActual > 0) {
                  lastActualIndex = idx;
                }
              });

              return (
                <Line
                  type="monotone"
                  dataKey="accumPOR"
                  stroke="url(#porLineGradient)"
                  strokeWidth={4}
                  dot={(props) => {
                    const { cx, cy, index, payload } = props;
                    if (payload.accumPOR == null || payload.accumPOR <= 0) return null;

                    // Show label at: last point, last Actual index (for alignment), then every 5 backwards until 5 points after start
                    const shouldShowLabel = index === lastPORIndex ||
                                          index === lastActualIndex ||
                                          (index >= firstPORIndex + 5 && (lastPORIndex - index) % 5 === 0);

                    if (shouldShowLabel) {
                      return (
                        <g>
                          <circle cx={cx} cy={cy} r={3} fill="#dc2626" />
                          <text
                            x={cx}
                            y={cy - 8}
                            textAnchor="middle"
                            fontSize={12}
                            fontWeight="normal"
                            fill="#000000"
                          >
                            {payload.accumPOR}
                          </text>
                        </g>
                      );
                    }
                    return null;
                  }}
                  activeDot={{ r: 5, fill: '#dc2626', stroke: '#ffffff', strokeWidth: 2 }}
                  name="Accum. Factory Delivery QTY"
                  connectNulls={true}
                />
              );
            })()}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Enhanced Legend with modern styling */}
      <div style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        gap: '40px',
        marginTop: 0,
        marginBottom: 0,
        fontSize: 14,
        fontWeight: 600,
        background: 'rgba(248, 250, 252, 0.6)',
        padding: '10px',
        borderRadius: '12px',
        border: '1px solid rgba(226, 232, 240, 0.6)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ 
            width: 20, 
            height: 20, 
            background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)', 
            borderRadius: 6, 
            marginRight: 8,
            boxShadow: '0 2px 4px rgba(30, 64, 175, 0.3)'
          }}></div>
          <span style={{ color: '#1e293b' }}>SH Delivery QTY</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ 
            width: 20, 
            height: 20, 
            background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)', 
            borderRadius: 6, 
            marginRight: 8,
            boxShadow: '0 2px 4px rgba(220, 38, 38, 0.3)'
          }}></div>
          <span style={{ color: '#1e293b' }}>Factory Delivery QTY</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ 
            width: 20, 
            height: 5, 
            background: 'linear-gradient(90deg, #1e40af 0%, #3b82f6 100%)', 
            borderRadius: 3, 
            marginRight: 8,
            boxShadow: '0 2px 4px rgba(30, 64, 175, 0.3)'
          }}></div>
          <span style={{ color: '#1e293b' }}>Accum. SH Delivery QTY</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ 
            width: 20, 
            height: 5, 
            background: 'linear-gradient(90deg, #dc2626 0%, #ef4444 100%)', 
            borderRadius: 3, 
            marginRight: 8,
            boxShadow: '0 2px 4px rgba(220, 38, 38, 0.3)'
          }}></div>
          <span style={{ color: '#1e293b' }}>Accum. Factory Delivery QTY</span>
        </div>
      </div>

      {/* Enhanced Milestone & Reference Line Labels */}
      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: '16px', 
        marginTop: '5px',
        padding: '10px',
        background: 'rgba(248, 250, 252, 0.8)',
        borderRadius: '12px',
        justifyContent: 'flex-start',
        alignItems: 'center',
        minHeight: '48px',
        border: '1px solid rgba(226, 232, 240, 0.6)'
      }}>
        {/* Enhanced milestone color labels */}
        {visibleMilestones.map((milestone, index) => (
          <div key={index} style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.8)',
            padding: '8px 12px',
            borderRadius: '8px',
            transition: 'all 0.3s ease'
          }}>
            <div style={{
              width: '16px',
              height: '16px',
              backgroundColor: milestoneColors[index % milestoneColors.length],
              border: `2px solid ${milestoneColors[index % milestoneColors.length]}`,
              borderRadius: '6px',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
            }}></div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>
              {milestone.name}
            </span>
          </div>
        ))}
        {/* Enhanced reference line color labels */}
        {afeDate && afeIndex !== null && isIndexVisible(afeIndex) && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.8)',
            padding: '8px 12px',
            borderRadius: '8px',
            transition: 'all 0.3s ease'
          }}>
            <div style={{
              width: '16px',
              height: '4px',
              backgroundColor: '#ff9800',
              borderRadius: '3px',
              boxShadow: '0 2px 4px rgba(255, 152, 0, 0.3)'
            }}></div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>
              AFE
            </span>
          </div>
        )}
        {uuIndex !== null && isIndexVisible(uuIndex) && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.8)',
            padding: '8px 12px',
            borderRadius: '8px',
            transition: 'all 0.3s ease'
          }}>
            <div style={{
              width: '16px',
              height: '4px',
              backgroundColor: '#00b894',
              borderRadius: '3px',
              boxShadow: '0 2px 4px rgba(0, 184, 148, 0.3)'
            }}></div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>
              UU
            </span>
          </div>
        )}
        {iodIndex !== null && isIndexVisible(iodIndex) && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.8)',
            padding: '8px 12px',
            borderRadius: '8px',
            transition: 'all 0.3s ease'
          }}>
            <div style={{
              width: '16px',
              height: '4px',
              backgroundColor: '#6c5ce7',
              borderRadius: '3px',
              boxShadow: '0 2px 4px rgba(108, 92, 231, 0.3)'
            }}></div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>
              IOD
            </span>
          </div>
        )}
        {tvIndex !== null && isIndexVisible(tvIndex) && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.8)',
            padding: '8px 12px',
            borderRadius: '8px',
            transition: 'all 0.3s ease'
          }}>
            <div style={{
              width: '16px',
              height: '4px',
              backgroundColor: '#e17055',
              borderRadius: '3px',
              boxShadow: '0 2px 4px rgba(225, 112, 85, 0.3)'
            }}></div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>
              TV
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default BuildForecastChart;