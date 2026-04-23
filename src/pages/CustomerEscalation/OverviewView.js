// frontend/src/pages/CustomerEscalation/OverviewView.js
// Overview view component for CustomerEscalation

import React from 'react';
import { ChevronLeft, ChevronRight, BarChart3, Percent } from 'lucide-react';
import { generateCategoryColors } from './chartUtils';

const OverviewView = ({ 
  stats, 
  standardizedStats, 
  handleMetricClick, 
  setViewMode,
  selectedMonth,
  availableMonths,
  monthlyFailureModeData,
  chartViewType,
  setChartViewType,
  navigateMonth,
  formatMonthDisplay,
  getCurrentMonthData
}) => {
  const currentMonthData = getCurrentMonthData();
  
  return (
    <div className="customer-escalation">  
      <h1>Customer Line Fallout Overview</h1>  
        
      <div className="stats-cards">  
        {/* Total Escalations - Always Clickable */}
        <div 
          className="stat-card total clickable" 
          onClick={() => handleMetricClick('total')}
          style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
          onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
        >  
          <h3>Total CLF</h3>  
          <div className="stat-value">{stats.total}</div>
          <div className="click-hint" style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            Click to view all
          </div>
        </div>  
        
        {/* Status-based metrics - Always shown, even with 0 count */}
        {standardizedStats.map(stat => (  
          <div 
            key={stat.status} 
            className={`stat-card ${stat.status.toLowerCase()} clickable`}
            onClick={() => handleMetricClick(stat.status)}
            style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
            onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
          >  
            <h3>{stat.status}</h3>  
            <div className="stat-value">{stat.count}</div>
            <div className="click-hint" style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              Click to filter
            </div>
          </div>  
        ))}  
      </div>  

      <div className="chart-container">
        <div className="chart-header">
          <div className="chart-navigation">
            <button 
              className="nav-button"
              onClick={() => navigateMonth('prev')}
              disabled={!selectedMonth || availableMonths.indexOf(selectedMonth) === 0}
            >
              <ChevronLeft size={20} />
            </button>
            <div className="month-display">
              <h3>{formatMonthDisplay(selectedMonth)}</h3>
              <span className="month-indicator">Failure Mode Analysis</span>
            </div>
            <button 
              className="nav-button"
              onClick={() => navigateMonth('next')}
              disabled={!selectedMonth || availableMonths.indexOf(selectedMonth) === availableMonths.length - 1}
            >
              <ChevronRight size={20} />
            </button>
          </div>
          <div className="chart-controls">
            <button
              className={`chart-toggle ${chartViewType === 'count' ? 'active' : ''}`}
              onClick={() => setChartViewType('count')}
            >
              <BarChart3 size={16} />
              Count
            </button>
            <button
              className={`chart-toggle ${chartViewType === 'percentage' ? 'active' : ''}`}
              onClick={() => setChartViewType('percentage')}
            >
              <Percent size={16} />
              Percentage
            </button>
          </div>
        </div>
        <div className="chart-wrapper" style={{ height: '400px', position: 'relative' }}>
          <canvas id="failureModeChart" style={{ width: '100%', height: '100%' }}></canvas>
          {currentMonthData.length === 0 && (
            <div style={{ 
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              backgroundColor: '#f8f9fa',
              border: '2px dashed #dee2e6',
              borderRadius: '8px',
              color: '#6c757d',
              fontSize: '18px',
              zIndex: 10
            }}>
              No data available for {formatMonthDisplay(selectedMonth)}
            </div>
          )}
        </div>
        {/* Category Legend - Moved up and simplified */}
        {currentMonthData.length > 0 && (
          <div className="category-legend" style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>
              Failure Categories:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
              {(() => {
                // Use the same centralized color mapping as the chart
                const categoryColorMap = generateCategoryColors(monthlyFailureModeData);
                const currentCategories = Array.from(new Set(currentMonthData.map(item => item.failure_category).filter(Boolean))).sort();
                
                return currentCategories.map(category => {
                  const color = categoryColorMap[category] || '#6b7280'; // Fallback to gray
                  
                  return (
                    <div key={category} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '14px',
                        height: '14px',
                        backgroundColor: color,
                        borderRadius: '3px',
                        border: '1px solid rgba(0,0,0,0.1)',
                        boxShadow: `0 1px 3px ${color}40`
                      }}></div>
                      <span style={{ fontSize: '14px', color: '#374151', fontWeight: '500' }}>{category}</span>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}
      </div>

      <button   
        className="btn-primary"   
        onClick={() => setViewMode('list')}  
      >  
        View All CLF
      </button>  
    </div>
  );
};

export default OverviewView;