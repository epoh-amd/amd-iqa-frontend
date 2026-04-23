// frontend/src/pages/Dashboard/useAutoCursor.js

import { useState, useEffect, useRef, useMemo } from 'react';

export const useAutoCursor = (chartDataWithAccum, selectedProject, chartData) => {
  // --- Auto-cursor state ---
  const [autoCursorIndex, setAutoCursorIndex] = useState(0);
  const [autoCursorActive, setAutoCursorActive] = useState(false); // Start hidden
  const [autoCursorPaused, setAutoCursorPaused] = useState(true); // Start paused
  const [autoCursorSpeed, setAutoCursorSpeed] = useState(3000); // 3 seconds default
  const [autoCursorPayload, setAutoCursorPayload] = useState(null);
  const [autoCursorLabel, setAutoCursorLabel] = useState(null);
  
  // --- Refs ---
  const intervalRef = useRef(null);

  // Memoize the chart data length to prevent unnecessary re-renders
  const chartDataLength = useMemo(() => {
    return chartDataWithAccum ? chartDataWithAccum.length : 0;
  }, [chartDataWithAccum]);

  // Effect to auto-advance the cursor every N seconds
  useEffect(() => {
    if (!chartDataWithAccum || chartDataLength === 0) {
      return;
    }
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    if (autoCursorActive && !autoCursorPaused) {
      let idx = autoCursorIndex;
      intervalRef.current = setInterval(() => {
        idx = (idx + 1) % chartDataLength;
        setAutoCursorIndex(idx);
      }, autoCursorSpeed);
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoCursorActive, autoCursorPaused, autoCursorSpeed, autoCursorIndex, selectedProject, chartDataLength]);

  // Effect to update the tooltip payload/label for the current auto-cursor index
  useEffect(() => {
    if (!chartDataWithAccum || chartDataLength === 0) return;
    const point = chartDataWithAccum[autoCursorIndex];
    if (!point) return;
    // Build payload array as recharts would for the tooltip
    const payloadArr = [
      { name: 'Actual Delivered QTY', dataKey: 'actualBuilds', value: point.actualBuilds, payload: point },
      { name: 'Accum. Actual Delivered QTY', dataKey: 'accumActual', value: point.accumActual, payload: point },
      { name: 'Accum. Forecast QTY', dataKey: 'accumPOR', value: point.accumPOR, payload: point },
      { name: 'Forecast QTY', dataKey: 'porTarget', value: point.porTarget, payload: point }
    ];
    setAutoCursorPayload(payloadArr);
    setAutoCursorLabel(point.week);
  }, [autoCursorIndex, chartDataWithAccum, chartDataLength]);

  // Auto-cursor control functions
  const toggleAutoCursor = () => {
    if (autoCursorActive) {
      // If active, hide the animation line completely
      setAutoCursorActive(false);
      setAutoCursorPaused(true);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    } else {
      // If not active, show and start the animation line
      setAutoCursorActive(true);
      setAutoCursorPaused(false);
      setAutoCursorIndex(0);
    }
  };

  const resetAutoCursor = () => {
    setAutoCursorIndex(0);
  };

  const setSpeed = (speed) => {
    setAutoCursorSpeed(speed);
  };

  return {
    // State
    autoCursorIndex,
    autoCursorActive,
    autoCursorPaused,
    autoCursorSpeed,
    autoCursorPayload,
    autoCursorLabel,
    
    // Functions
    toggleAutoCursor,
    resetAutoCursor,
    setSpeed
  };
};