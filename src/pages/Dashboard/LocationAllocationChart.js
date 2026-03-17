// frontend/src/pages/Dashboard/LocationAllocationChart.js

import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, LabelList, ReferenceLine } from 'recharts';
import { Calendar, MapPin } from 'lucide-react';
import api from '../../services/api';

const LocationAllocationChart = ({ selectedProject, projects }) => {
  const [data, setData] = useState({
    PRB: { chartData: [], totalDelivered: 0 },
    VRB: { chartData: [], totalDelivered: 0 },
    dateRange: {}
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedYear, setSelectedYear] = useState('');
  const [prbSubcategoryFilters, setPrbSubcategoryFilters] = useState(['1P', '2P']);
  const [vrbSubcategoryFilters, setVrbSubcategoryFilters] = useState(['1P', '2P', 'Others']);

  // Initialize default year (current year)
  useEffect(() => {
    const currentYear = new Date().getFullYear();
    setSelectedYear(currentYear.toString());
  }, []);

  // Fetch data when component mounts or year/project changes
  useEffect(() => {
    if (selectedYear && selectedProject) {
      fetchLocationAllocationData();
    }
  }, [selectedYear, selectedProject]);

  const fetchLocationAllocationData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Create date range for the selected year
      const startDate = `${selectedYear}-01-01`;
      const endDate = `${selectedYear}-12-31`;

      const response = await api.getLocationAllocationData(startDate, endDate, selectedProject);

      setData(response);
    } catch (err) {
      console.error('Error fetching location allocation data:', err);
      setError('Failed to load location allocation data');
    } finally {
      setLoading(false);
    }
  };


  // Custom tooltip for the chart - updated to work with platform-specific data
  const createCustomTooltip = (platformType) => {
    return ({ active, payload, label }) => {
      if (active && payload && payload.length && data[platformType] && data[platformType].chartData) {
        const location = data[platformType].chartData.find(item => item.location === label);

        return (
          <div className="custom-tooltip" style={{
            backgroundColor: '#fff',
            border: '1px solid #ccc',
            borderRadius: '8px',
            padding: '12px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
          }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#333' }}>
              <MapPin size={16} style={{ display: 'inline', marginRight: '4px' }} />
              {label} ({platformType})
            </h4>
            <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#666' }}>
              <strong>Includes:</strong> {location?.clusters?.join(', ')}
            </p>
            <div>
              {payload.map((entry, index) => (
                <div key={index} style={{
                  color: entry.color,
                  fontSize: '14px',
                  marginBottom: '4px'
                }}>
                  {entry.dataKey}: {entry.value}
                </div>
              ))}
            </div>
            <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #eee' }}>
              <strong>Total: {location?.totalQuantity}</strong>
            </div>
          </div>
        );
      }
      return null;
    };
  };

  // Function to prepare chart data for stacked bar chart for a specific platform
  const prepareChartData = (platformType) => {
    if (!data[platformType] || !data[platformType].chartData) {
      return [];
    }

    const subcategoryFilters = platformType === 'PRB' ? prbSubcategoryFilters : vrbSubcategoryFilters;

    return data[platformType].chartData.map(location => {
      const stackedData = { name: location.location, total: 0 };

      // Filter and aggregate data based on selected subcategories
      location.subcategories
        .filter(subcat => subcategoryFilters.includes(subcat.subcategory))
        .forEach(subcat => {
          subcat.teams.forEach(team => {
            if (!stackedData[team.team]) {
              stackedData[team.team] = 0;
            }
            stackedData[team.team] += team.quantity;
            stackedData.total += team.quantity;
          });
        });

      return stackedData;
    }).filter(location => location.total > 0); // Only include locations with data
  };

  // Function to get all unique teams for the legend for a specific platform
  // Sorted by total quantity (descending) so smallest appears at top of stack
  const getAllTeams = (platformType) => {
    if (!data[platformType] || !data[platformType].chartData) {
      return [];
    }

    const subcategoryFilters = platformType === 'PRB' ? prbSubcategoryFilters : vrbSubcategoryFilters;

    // Calculate total quantity for each team across all locations
    const teamTotals = {};

    data[platformType].chartData.forEach(location => {
      location.subcategories
        .filter(subcat => subcategoryFilters.includes(subcat.subcategory))
        .forEach(subcat => {
          subcat.teams.forEach(team => {
            if (!teamTotals[team.team]) {
              teamTotals[team.team] = 0;
            }
            teamTotals[team.team] += team.quantity;
          });
        });
    });

    // Get unique teams and sort by total (descending = highest first, appears at bottom)
    const uniqueTeams = [...new Set(
      data[platformType].chartData.flatMap(location =>
        location.subcategories
          .filter(subcat => subcategoryFilters.includes(subcat.subcategory))
          .flatMap(subcat => subcat.teams.map(team => team.team))
      )
    )];

    const sortedTeams = uniqueTeams.sort((a, b) => teamTotals[b] - teamTotals[a]);

    console.log(`${platformType} Teams sorted by total:`,
      sortedTeams.map(team => `${team}: ${teamTotals[team]}`).join(', ')
    );

    return sortedTeams;
  };

  // Function to create team color mapping for a specific platform
  const getTeamColors = (platformType) => {
    if (!data[platformType] || !data[platformType].chartData) {
      return {};
    }

    const subcategoryFilters = platformType === 'PRB' ? prbSubcategoryFilters : vrbSubcategoryFilters;
    const teamColors = {};

    data[platformType].chartData.forEach(location => {
      location.subcategories
        .filter(subcat => subcategoryFilters.includes(subcat.subcategory))
        .forEach(subcat => {
          subcat.teams.forEach(team => {
            teamColors[team.team] = team.color;
          });
        });
    });
    return teamColors;
  };

  // Function to calculate Y-axis domain for a specific platform
  // Rounds up to next 50 to create even gaps of 50 on Y-axis
  const calculateYAxisMax = (platformType) => {
    const chartData = prepareChartData(platformType);
    if (chartData.length === 0) return 50;
    const maxValue = Math.max(...chartData.map(item => item.total));
    // Round up to nearest 50, then add 50 for spacing above highest bar
    return Math.ceil((maxValue + 50) / 50) * 50;
  };

  // Custom label component factory that shows individual team values
  const createCustomTeamLabel = (teamName) => {
    return (props) => {
      const { x, y, width, height, payload } = props;
      if (!payload || !payload[teamName]) return null;

      const teamValue = payload[teamName];
      if (teamValue === 0) return null;

      return (
        <text
          x={x + width / 2}
          y={y + height / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fill="white"
          fontSize="9"
          fontWeight="bold"
        >
          {teamValue}
        </text>
      );
    };
  };

  // Custom label component that shows total values above each bar
  const CustomTotalLabel = (props) => {
    const { x, y, width, payload } = props;
    if (!payload || !payload.total) return null;

    return (
      <text
        x={x + width / 2}
        y={y - 8}
        textAnchor="middle"
        dominantBaseline="bottom"
        fill="#000"
        fontSize="14"
        fontWeight="bold"
      >
        {payload.total}
      </text>
    );
  };


  const handleYearChange = (year) => {
    setSelectedYear(year);
  };

  // Handle subcategory dropdown changes
  const handleSubcategoryDropdownChange = (platformType, value) => {
    const availableOptions = platformType === 'PRB' ? ['1P', '2P'] : ['1P', '2P', 'Others'];

    let newFilters;
    if (value === 'all') {
      newFilters = availableOptions;
    } else {
      newFilters = [value];
    }

    if (platformType === 'PRB') {
      setPrbSubcategoryFilters(newFilters);
    } else {
      setVrbSubcategoryFilters(newFilters);
    }
  };

  // Generate year options (5 years before and 5 years after current year)
  const yearOptions = [];
  const currentYear = new Date().getFullYear();
  for (let i = -5; i <= 5; i++) {
    yearOptions.push(currentYear + i);
  }

  // Render subcategory filters as dropdown
  const renderSubcategoryFilters = (platformType) => {
    const availableOptions = platformType === 'PRB' ? ['1P', '2P'] : ['1P', '2P', 'Others'];
    const selectedFilters = platformType === 'PRB' ? prbSubcategoryFilters : vrbSubcategoryFilters;
    const selectedValue = selectedFilters.length === availableOptions.length ? 'all' : selectedFilters.join(',');

    return (
      <div className="dashboard-filter-group">
        <label>1P/2P:</label>
        <select
          value={selectedValue}
          onChange={(e) => handleSubcategoryDropdownChange(platformType, e.target.value)}
          className="dashboard-project-select"
        >
          <option value="all">All</option>
          {availableOptions.map(option => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
    );
  };

  // Function to render a single chart for a platform type
  const renderPlatformChart = (platformType) => {
    const chartData = prepareChartData(platformType);
    const allTeams = getAllTeams(platformType);
    const teamColors = getTeamColors(platformType);
    const yAxisMax = calculateYAxisMax(platformType);

    // Generate Y-axis ticks at intervals of 50
    const yAxisTicks = Array.from({ length: Math.floor(yAxisMax / 50) + 1 }, (_, i) => i * 50);

    console.log(`${platformType} Y-axis:`, { yAxisMax, yAxisTicks });
    console.log(`${platformType} Bar render order:`, allTeams);

    if (chartData.length === 0) {
      return (
        <div className="dashboard-card">
          {/* Chart Header with Title and Filters */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px'
          }}>
            <h3 className="chart-title" style={{ textAlign: 'left', color: '#666', margin: 0 }}>
              {selectedProject ? `${selectedProject} ` : ''}{platformType} Location Allocation
            </h3>
            <div className="chart-controls">
              {/* Subcategory Filters */}
              {renderSubcategoryFilters(platformType)}
              {/* Year Filter */}
              <div className="dashboard-filter-group">
                <label>Year:</label>
                <select
                  value={selectedYear}
                  onChange={(e) => handleYearChange(e.target.value)}
                  className="dashboard-project-select"
                >
                  {yearOptions.map(year => (
                    <option key={year} value={year.toString()}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="no-data-message" style={{
            textAlign: 'center',
            padding: '40px',
            color: '#666'
          }}>
            <MapPin size={48} style={{ opacity: 0.3 }} />
            <h3>No {platformType} Data Available</h3>
            <p>No {platformType} deliveries found for the selected year.</p>
          </div>
        </div>
      );
    }

    // Create a unique key that changes when team order changes
    const chartKey = `${platformType}-${allTeams.join('|')}`;

    return (
      <div className="dashboard-card" key={chartKey}>
        {/* Chart Header with Title and Filters */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px'
        }}>
          <h3 className="chart-title" style={{ textAlign: 'left', margin: 0 }}>
            {selectedProject ? `${selectedProject} ` : ''}{platformType} Location Allocation
          </h3>
          <div className="chart-controls">
            {/* Subcategory Filters */}
            {renderSubcategoryFilters(platformType)}
            {/* Year Filter */}
            <div className="dashboard-filter-group">
              <label>Year:</label>
              <select
                value={selectedYear}
                onChange={(e) => handleYearChange(e.target.value)}
                className="dashboard-project-select"
              >
                {yearOptions.map(year => (
                  <option key={year} value={year.toString()}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={900}>
          <BarChart
            data={chartData}
            margin={{ top: 50, right: 30, left: 60, bottom: 80 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
              angle={-45}
              textAnchor="end"
              height={100}
              fontSize={12}
              label={{
                value: 'Location',
                position: 'insideBottom',
                offset: -10
              }}
            />
            <YAxis
              domain={[0, yAxisMax]}
              ticks={yAxisTicks}
              interval={0}
              allowDecimals={false}
              label={{
                value: 'Delivery Quantity',
                angle: -90,
                position: 'insideLeft'
              }}
            />
            <Tooltip content={createCustomTooltip(platformType)} />
            {/* Hide default legend - we'll create custom one below */}
            <Legend content={() => null} />

            {/* Render stacked bars for each team */}
            {allTeams.map((team, index) => {
              const isLastTeam = index === allTeams.length - 1;
              return (
                <Bar
                  key={team}
                  dataKey={team}
                  stackId="teams"
                  fill={teamColors[team] || '#94A3B8'}
                  name={team}
                >
                  {/* Show individual team value for each location - only if >= 10 */}
                  <LabelList
                    dataKey={team}
                    position="center"
                    fill="white"
                    fontSize="10"
                    fontWeight="bold"
                    formatter={(value) => (value >= 10 ? value : '')}
                  />
                  {/* Show total value on top of the last (topmost) bar */}
                  {isLastTeam && (
                    <LabelList
                      dataKey="total"
                      position="top"
                      fill="#000"
                      fontSize="14"
                      fontWeight="900"
                    />
                  )}
                </Bar>
              );
            })}
          </BarChart>
        </ResponsiveContainer>

        {/* Custom Multi-Column Legend */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: '12px',
          marginTop: '20px',
          padding: '16px',
          backgroundColor: '#f8fafc',
          borderRadius: '8px',
          border: '1px solid #e2e8f0'
        }}>
          {allTeams.map((team) => (
            <div key={team} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <div style={{
                width: '16px',
                height: '16px',
                backgroundColor: teamColors[team] || '#94A3B8',
                borderRadius: '3px',
                flexShrink: 0
              }}></div>
              <span style={{
                fontSize: '12px',
                fontWeight: '500',
                color: '#334155',
                lineHeight: '1.2'
              }}>
                {team}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="dashboard-card">
        <div className="loading-state">
          <div className="loading-icon">
            <div className="loading-spinner"></div>
          </div>
          <h3>Loading Location Allocation Data...</h3>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-card">
        <div className="error-container">
          <div className="error-content">
            <h3>Error Loading Data</h3>
            <p>{error}</p>
            <button onClick={fetchLocationAllocationData} className="retry-button">
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Charts Layout - Stacked vertically */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '32px'
      }}>
        {renderPlatformChart('PRB')}
        {renderPlatformChart('VRB')}
      </div>
    </div>
  );
};

export default LocationAllocationChart;