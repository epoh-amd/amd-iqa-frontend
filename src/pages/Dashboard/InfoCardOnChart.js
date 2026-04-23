// frontend/src/pages/Dashboard/InfoCardOnChart.js
import React, { useRef, useState, useLayoutEffect } from 'react';

// InfoCardOnChart overlays the info card at the correct X position on the chart
function InfoCardOnChart({ chartDataWithAccum, autoCursorIndex }) {
  const containerRef = useRef(null);
  const [cardPos, setCardPos] = useState({ left: 0, top: 0, visible: false });

  useLayoutEffect(() => {
    // Try to find the bar/line point for the current week and position the card above it
    const chart = document.querySelector('.recharts-wrapper');
    if (!chart) return;
    
    // Find all X axis ticks
    const ticks = chart.querySelectorAll('.recharts-cartesian-axis-ticks .recharts-layer text');
    if (!ticks || !ticks.length) return;
    
    // Find the tick that matches the current autoCursorIndex
    let tickNode = null;
    if (ticks[autoCursorIndex]) {
      tickNode = ticks[autoCursorIndex];
    }
    
    if (!tickNode) {
      setCardPos({ left: 0, top: 0, visible: false });
      return;
    }
    
    // Get the bounding rect of the tick and chart
    const tickRect = tickNode.getBoundingClientRect();
    const chartRect = chart.getBoundingClientRect();
    
    // Position the card above the tick, but ensure it stays within bounds
    let left = tickRect.left + tickRect.width / 2 - chartRect.left;
    let top = tickRect.top - chartRect.top - 120;
    
    // Ensure the card doesn't go off the left or right edge
    const cardWidth = 380;
    if (left - cardWidth/2 < 10) {
      left = cardWidth/2 + 10;
    } else if (left + cardWidth/2 > chartRect.width - 10) {
      left = chartRect.width - cardWidth/2 - 10;
    }
    
    // Ensure the card doesn't go above the chart area
    if (top < 10) {
      top = 10;
    }
    
    setCardPos({ left, top, visible: true });
  }, [autoCursorIndex, chartDataWithAccum.length]);

  const point = chartDataWithAccum[autoCursorIndex] || {};
  const dateObj = point.date ? new Date(point.date) : null;
  const mm = dateObj ? (dateObj.getMonth() + 1).toString().padStart(2, '0') : '--';
  const dd = dateObj ? dateObj.getDate().toString().padStart(2, '0') : '--';
  const yyyy = dateObj ? dateObj.getFullYear() : '----';
  const fullDate = dateObj ? `${mm}/${dd}/${yyyy}` : '--/--/----';

  // Helper function to format numbers with commas
  const formatNumber = (num) => {
    if (num === null || num === undefined) return '0';
    return num.toLocaleString();
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        left: cardPos.left - 190, // Center the card (width 380)
        top: cardPos.top,
        width: 380,
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        border: '2px solid #3B82F6',
        borderRadius: 12,
        padding: 16,
        boxShadow: '0 8px 32px rgba(59,130,246,0.15), 0 2px 8px rgba(0,0,0,0.1)',
        zIndex: 100,
        textAlign: 'left',
        fontFamily: 'inherit',
        fontSize: 13,
        pointerEvents: 'none',
        opacity: cardPos.visible ? 1 : 0,
        transition: 'left 0.4s ease-out, top 0.4s ease-out, opacity 0.3s ease-out',
      }}
    >
      {/* Header */}
      <div style={{ 
        fontWeight: 700, 
        marginBottom: 10, 
        fontSize: 15, 
        color: '#3B82F6',
        textAlign: 'center',
        borderBottom: '1px solid #e2e8f0',
        paddingBottom: 6
      }}>
        Week: {point.week || 'N/A'} ({fullDate})
      </div>
      
      {/* Data Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        {/* Current Week Data */}
        <div style={{ 
          background: 'rgba(44, 62, 80, 0.05)', 
          padding: '10px', 
          borderRadius: '6px',
          border: '1px solid rgba(44, 62, 80, 0.1)'
        }}>
          <div style={{ fontWeight: 600, color: '#2c3e50', marginBottom: 6, fontSize: 12, textAlign: 'center' }}>
            📊 This Week
          </div>
          <div style={{ fontSize: 12, marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#2c3e50', fontWeight: 500 }}>SH Delivery QTY:</span>
            <span style={{ fontWeight: 700, color: '#2c3e50' }}>{formatNumber(point.actualBuilds)}</span>
          </div>
          <div style={{ fontSize: 12, display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#e74c3c', fontWeight: 500 }}>Factory Delivery QTY:</span>
            <span style={{ fontWeight: 700, color: '#e74c3c' }}>{formatNumber(point.porTarget)}</span>
          </div>
        </div>
        
        {/* Cumulative Data */}
        <div style={{ 
          background: 'rgba(231, 76, 60, 0.05)', 
          padding: '10px', 
          borderRadius: '6px',
          border: '1px solid rgba(231, 76, 60, 0.1)'
        }}>
          <div style={{ fontWeight: 600, color: '#e74c3c', marginBottom: 6, fontSize: 12, textAlign: 'center' }}>
            📈 Cumulative
          </div>
          <div style={{ fontSize: 12, marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#2c3e50', fontWeight: 500 }}>Accum. SH Delivery:</span>
            <span style={{ fontWeight: 700, color: '#2c3e50' }}>{formatNumber(point.accumActual)}</span>
          </div>
          <div style={{ fontSize: 12, display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#e74c3c', fontWeight: 500 }}>Accum. Factory Delivery:</span>
            <span style={{ fontWeight: 700, color: '#e74c3c' }}>{formatNumber(point.accumPOR)}</span>
          </div>
        </div>
      </div>
      
      {/* Performance Indicator */}
      {(point.actualBuilds !== null && point.porTarget !== null && point.actualBuilds !== undefined && point.porTarget !== undefined) && (
        <div style={{ 
          marginTop: 8, 
          padding: '6px 8px', 
          borderRadius: '4px',
          textAlign: 'center',
          fontSize: 11,
          background: point.actualBuilds >= point.porTarget ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          color: point.actualBuilds >= point.porTarget ? '#059669' : '#DC2626',
          fontWeight: 600
        }}>
          {point.actualBuilds >= point.porTarget ? '✅ On Track' : '⚠️ Behind Target'} 
          ({point.actualBuilds >= point.porTarget ? '+' : ''}{formatNumber(point.actualBuilds - point.porTarget)})
        </div>
      )}
      
      {/* Progress indicator */}
      <div style={{ 
        fontSize: 11, 
        color: '#64748b', 
        marginTop: 8, 
        textAlign: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6
      }}>
        <div style={{
          width: '80px',
          height: '3px',
          background: '#e2e8f0',
          borderRadius: '2px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${((autoCursorIndex + 1) / chartDataWithAccum.length) * 100}%`,
            height: '100%',
            background: '#3B82F6',
            borderRadius: '2px',
            transition: 'width 0.3s ease-out'
          }}></div>
        </div>
        <span>{autoCursorIndex + 1}/{chartDataWithAccum.length}</span>
      </div>
    </div>
  );
}

export default InfoCardOnChart;
