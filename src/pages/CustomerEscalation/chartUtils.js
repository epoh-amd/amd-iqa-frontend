// frontend/src/pages/CustomerEscalation/chartUtils.js
// Chart drawing and management utilities

import Chart from 'chart.js/auto';

/**
 * Draw failure mode chart
 */
// Centralized color palette for failure categories
const CATEGORY_COLOR_PALETTE = [
  '#ef4444', '#3b82f6', '#f59e0b', '#10b981', '#8b5cf6',
  '#f97316', '#06b6d4', '#84cc16', '#ec4899', '#6b7280',
  '#dc2626', '#1d4ed8', '#d97706', '#047857', '#7c3aed',
  '#ea580c', '#0891b2', '#65a30d', '#be185d', '#4b5563'
];

// Helper function to generate consistent colors for categories
export const generateCategoryColors = (monthlyFailureModeData) => {
  // Get all unique categories across all months
  const allCategories = new Set();
  Object.values(monthlyFailureModeData).forEach(monthData => {
    if (Array.isArray(monthData)) {
      monthData.forEach(item => {
        if (item.failure_category) {
          allCategories.add(item.failure_category);
        }
      });
    }
  });
  
  const categoryColorMap = {};
  const categoriesArray = Array.from(allCategories).sort(); // Sort for consistency
  
  categoriesArray.forEach((category, index) => {
    categoryColorMap[category] = CATEGORY_COLOR_PALETTE[index % CATEGORY_COLOR_PALETTE.length];
  });
  
  return categoryColorMap;
};

export const drawFailureModeChart = (chartInstance, setChartInstance, monthlyFailureModeData, selectedMonth, chartViewType) => {  
  const ctx = document.getElementById('failureModeChart');
  if (!ctx) return;

  if (chartInstance) {  
    chartInstance.destroy();
    setChartInstance(null);
  }  

  const monthData = monthlyFailureModeData[selectedMonth] || [];
  if (!Array.isArray(monthData) || monthData.length === 0) return;
  
  const sortedData = [...monthData].sort((a, b) => (b.count || 0) - (a.count || 0));
  
  const labels = sortedData.map(item => item.failure_mode || 'Unknown');
  const data = chartViewType === 'count' 
    ? sortedData.map(item => item.count || 0)
    : sortedData.map(item => parseFloat(item.percentage) || 0);

  // Generate dynamic color mapping based on actual categories in the data
  const categoryColorMap = generateCategoryColors(monthlyFailureModeData);
  
  // Generate colors for each bar based on failure category
  const backgroundColors = sortedData.map((item) => {
    const category = item.failure_category || 'Unknown';
    return categoryColorMap[category] || '#6b7280'; // Default gray for unknown
  });
  
  const borderColors = backgroundColors.map(color => {
    // Create a slightly darker border color
    const hex = color.replace('#', '');
    const r = Math.max(0, parseInt(hex.slice(0, 2), 16) - 20);
    const g = Math.max(0, parseInt(hex.slice(2, 4), 16) - 20);
    const b = Math.max(0, parseInt(hex.slice(4, 6), 16) - 20);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  });

  const newChart = new Chart(ctx, {  
    type: 'bar',
    data: {  
      labels: labels,  
      datasets: [{  
        label: chartViewType === 'count' ? 'Number of Escalations' : 'Percentage of Total (%)',
        data: data,  
        backgroundColor: backgroundColors,
        borderColor: borderColors,
        borderWidth: 1,
        barThickness: 'flex',
        maxBarThickness: 60
      }]  
    },
    plugins: [{
      id: 'dataLabels',
      afterDatasetsDraw(chart, args, options) {
        const { ctx, data, chartArea: { top, bottom, left, right, width, height } } = chart;
        
        ctx.save();
        ctx.font = 'bold 12px Arial';
        ctx.fillStyle = '#374151';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        
        data.datasets.forEach((dataset, datasetIndex) => {
          chart.getDatasetMeta(datasetIndex).data.forEach((dataPoint, index) => {
            const value = dataset.data[index];
            const displayValue = chartViewType === 'count' ? value : value + '%';
            
            ctx.fillText(displayValue, dataPoint.x, dataPoint.y - 4);
          });
        });
        
        ctx.restore();
      }
    }],
    options: {  
      responsive: true,  
      maintainAspectRatio: false,
      plugins: {  
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          cornerRadius: 4,
          callbacks: {
            label: function(context) {
              const dataIndex = context.dataIndex;
              const failureMode = sortedData[dataIndex]?.failure_mode || 'Unknown';
              const failureCategory = sortedData[dataIndex]?.failure_category || 'Unknown';
              const value = context.parsed.y;
              
              const lines = [];
              lines.push(`Mode: ${failureMode}`);
              lines.push(`Category: ${failureCategory}`);
              
              if (chartViewType === 'count') {
                lines.push(`Count: ${value}`);
              } else {
                lines.push(`Percentage: ${value}%`);
              }
              
              return lines;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            font: { size: 12, weight: 500 },
            color: '#666',
            maxRotation: 45,
            minRotation: 45
          }
        },
        y: {
          beginAtZero: true,
          max: Math.max(...data) + 3, // Add 10 units above highest value to prevent label overlap
          grid: { color: 'rgba(0, 0, 0, 0.05)' },
          ticks: {
            font: { size: 12, weight: 500 },
            color: '#666',
            precision: 0,
            callback: function(value) {
              if (chartViewType === 'percentage') {
                return value + '%';
              }
              return value;
            }
          },
          title: {
            display: true,
            text: chartViewType === 'count' ? 'Number of CLF Cases' : 'Percentage of Total CLF (%)',
            font: { size: 14, weight: 600 },
            color: '#333'
          }
        }
      }
    }  
  });  

  setChartInstance(newChart);
};