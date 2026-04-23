// frontend/src/pages/Dashboard/QualityCharts.js

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, CartesianGrid, XAxis, YAxis, LabelList } from 'recharts';
import { AlertTriangle } from 'lucide-react';

const QualityCharts = ({ qualityData, selectedProject }) => {

  const renderQualityPieChart = (type) => {
    const projectQualityData = qualityData[type];

    if (projectQualityData.pieData.every(item => item.value === 0 && item.count === 0)) {
      return renderNoDataMessagePie(type); // show message instead of empty chart
    }

    const data = projectQualityData.pieData;

    console.log('Pie Data with colors:', projectQualityData.pieData);

    return (
      <div className="quality-chart-container" style={{ height: 'auto', minHeight: 'auto' }}>
        <h3 className="quality-chart-title">
          {selectedProject ? `${selectedProject} ` : ''}{type} Incoming Quality Dashboard
        </h3>

        <div className="quality-chart-content" style={{ minHeight: '350px', height: '350px' }}>
          <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
  <Pie
    data={data}
    cx="50%"
    cy="50%"
    outerRadius={130}
    innerRadius={70}
    paddingAngle={0}
    dataKey="value"
    labelLine={false}
    label={({
      cx,
      cy,
      midAngle,
      innerRadius,
      outerRadius,
      index,
      value
    }) => {
      const RADIAN = Math.PI / 180;
      const actualCount = data[index].count || 0;

      // Small slices (<5%) -> label outside
      if (value <= 5) {
        const radius = outerRadius + 20;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        return (
          <text
            x={x}
            y={y}
            textAnchor={x > cx ? "start" : "end"}
            dominantBaseline="central"
            fontSize="12"
            fontWeight="600"
            fill="#1e293b"
          >
            {value}% ({actualCount})
          </text>
        );
      }

      // Normal slices -> label inside
      const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
      const x = cx + radius * Math.cos(-midAngle * RADIAN);
      const y = cy + radius * Math.sin(-midAngle * RADIAN);

      return (
        <g>
          <text
            x={x}
            y={y - 8}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="14"
            fontWeight="700"
            fill="white"
            style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}
          >
            {value}%
          </text>
          <text
            x={x}
            y={y + 8}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="12"
            fontWeight="600"
            fill="white"
            style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}
          >
            ({actualCount})
          </text>
        </g>
      );
    }}
  >
    {data.map((entry) => (
      <Cell key={entry.name} fill={entry.color} />
    ))}
  </Pie>

  <Tooltip
    formatter={(value) => [`${value}%`, 'Percentage']}
    contentStyle={{
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      border: '2px solid rgba(59, 130, 246, 0.2)',
      borderRadius: '12px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
      fontSize: '14px',
      fontWeight: '600'
    }}
  />
</PieChart>
          </ResponsiveContainer>
        </div>

      </div>
    );
  };

  const renderNoDataMessageBar = (type) => (
    <div
      className="quality-chart-container"
      style={{
        textAlign: 'center',
        padding: '40px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#475569',
        height: 'auto', minHeight: 'auto'
      }}
    >
      <div className="no-data-icon">
        <AlertTriangle size={48} />
      </div>
      <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>
        No quality breakdown data available for {selectedProject} {type}.
      </h3>
    </div>
  );

  const renderNoDataMessagePie = (type) => (
    <div
      className="quality-chart-container"
      style={{
        textAlign: 'center',
        padding: '40px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#475569',
        height: 'auto', minHeight: 'auto'
      }}
    >
      <div className="no-data-icon">
        <AlertTriangle size={48} />
      </div>
      <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>
        No Quality Issue found for {selectedProject} {type}.
      </h3>
    </div>
  );


  const renderQualityBarChart = (type) => {
    const projectQualityData = qualityData[type];
    if (!projectQualityData?.breakdownData || projectQualityData.breakdownData.length === 0) {
      return renderNoDataMessageBar(type); // show message instead of empty chart
    }


    // Sort data in decreasing order by qty
    const data = [...projectQualityData.breakdownData].sort((a, b) => b.qty - a.qty);

    // Calculate the maximum value for Y-axis domain
    const maxValue = Math.max(...data.map(item => item.qty));
    const yAxisMax = maxValue + 3;

    // Get color mapping from pie chart data for consistency
    const pieData = projectQualityData.pieData || [];
    const categoryColorMap = {};

    // Create color mapping from pie chart data (excluding "Good")
    pieData.forEach(item => {
      if (item.name !== 'Good') {
        categoryColorMap[item.name] = item.color;
      }
    });

    // Fallback colors if category not found in pie chart
    const fallbackColors = [
      '#f59e0b', '#ef4444', '#f97316', '#dc2626', '#b91c1c',
      '#991b1b', '#a855f7', '#8b5cf6', '#6366f1', '#64748b'
    ];

    // Assign colors to each bar based on category, using pie chart colors when available
    const getColorForCategory = (category, index) => {
      return categoryColorMap[category] || fallbackColors[index % fallbackColors.length];
    };

    return (
      <div className="quality-chart-container" style={{ height: 'auto', minHeight: 'auto' }}>
        <h3 className="quality-chart-title">
          {selectedProject ? `${selectedProject} ` : ''}{type} Incoming Quality Issue Breakdown
        </h3>

        <div className="quality-chart-content" style={{ minHeight: '350px', height: '350px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 20, left: 10, bottom: 80 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
              <XAxis
                dataKey="issue"
                tick={{ fontSize: 11, fontWeight: 600, fill: '#475569' }}
                angle={-45}
                textAnchor="end"
                height={100}
                axisLine={{ stroke: '#64748b', strokeWidth: 2 }}
              />
              <YAxis
                domain={[0, yAxisMax]}
                tickFormatter={(value) => Math.floor(value)}
                label={{ value: 'Qty', angle: -90, position: 'insideLeft', style: { fontSize: '12px', fontWeight: '600', fill: '#475569' } }}
                tick={{ fontSize: 11, fontWeight: 600, fill: '#64748b' }}
                axisLine={{ stroke: '#64748b', strokeWidth: 2 }}
              />
              <Tooltip
                formatter={(value) => [value, 'Quantity']}
                labelFormatter={(label) => `Issue: ${label}`}
                contentStyle={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                  border: '2px solid rgba(59, 130, 246, 0.2)',
                  borderRadius: '12px',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              />
              <Bar
                dataKey="qty"
                radius={[6, 6, 0, 0]}
              >
                {data.map((entry, index) => {
                  const color = getColorForCategory(entry.category, index);
                  return (
                    <Cell key={`cell-${index}`} fill={color} />
                  );
                })}
                <LabelList
                  dataKey="qty"
                  position="top"
                  style={{
                    fontWeight: 700,
                    fontSize: 14,
                    fill: '#1e293b'
                  }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>
    );
  };

  return (
    <div>
      {/* PRB Charts Row - Pie and Bar side by side */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '24px',
        marginBottom: '16px'
      }}>
        {renderQualityPieChart('PRB')}
        {renderQualityBarChart('PRB')}
      </div>

      {/* PRB Legend Card */}
      {qualityData['PRB'] &&
        qualityData['PRB'].pieData &&
        (qualityData['PRB'].breakdownData.length > 0 ||
          qualityData['PRB'].pieData.some(item => item.value !== 0 || item.count !== 0)) && (
          <div
            className="quality-chart-container"
            style={{
              marginBottom: '32px',
              padding: '12px 24px',
              minHeight: 'auto',
              height: 'auto'
            }}
          >
            <div className="quality-legend">
              {qualityData['PRB'].pieData.map((item, index) => (
                <div key={index} className="legend-item">
                  <div
                    className="legend-color"
                    style={{
                      backgroundColor: item.color,
                      boxShadow: `0 2px 4px ${item.color}40`
                    }}
                  ></div>
                  <span className="legend-label">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* VRB Charts Row - Pie and Bar side by side */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '24px',
        marginBottom: '16px'
      }}>
        {renderQualityPieChart('VRB')}
        {renderQualityBarChart('VRB')}
      </div>

      {/* VRB Legend Card */}
      {qualityData['VRB'] &&
        qualityData['VRB'].pieData &&
        (qualityData['VRB'].breakdownData.length > 0 ||
          qualityData['VRB'].pieData.some(item => item.value !== 0 || item.count !== 0)) && (
          <div className="quality-chart-container" style={{
            marginBottom: '32px',
            padding: '12px 24px',
            minHeight: 'auto',
            height: 'auto'
          }}>
            <div className="quality-legend">
              {qualityData['VRB'].pieData.map((item, index) => (
                <div key={index} className="legend-item">
                  <div
                    className="legend-color"
                    style={{
                      backgroundColor: item.color,
                      boxShadow: `0 2px 4px ${item.color}40`
                    }}
                  ></div>
                  <span className="legend-label">
                    {item.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
    </div>
  );
};

export default QualityCharts;
