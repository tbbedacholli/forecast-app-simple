// components/DrillDownChart.js
'use client';
import { useState } from 'react';
import { Card, CardContent, Typography, Box, Breadcrumbs, Link, Chip } from '@mui/material';
import { LineChart } from '@mui/x-charts/LineChart';
import { NavigateNext } from '@mui/icons-material';

export default function DrillDownChart() {
  const [drillPath, setDrillPath] = useState(['Revenue']);
  const [currentData, setCurrentData] = useState({
    title: 'Revenue Overview',
    data: [
      { month: 'Jan', value: 45000 },
      { month: 'Feb', value: 52000 },
      { month: 'Mar', value: 48000 },
      { month: 'Apr', value: 61000 },
      { month: 'May', value: 55000 },
      { month: 'Jun', value: 67000 },
    ]
  });

  const drillDownData = {
    'Revenue': {
      'Q1': [
        { month: 'Jan', value: 45000 },
        { month: 'Feb', value: 52000 },
        { month: 'Mar', value: 48000 },
      ],
      'Q2': [
        { month: 'Apr', value: 61000 },
        { month: 'May', value: 55000 },
        { month: 'Jun', value: 67000 },
      ]
    }
  };

  const handleDrillDown = (category) => {
    if (drillDownData[category]) {
      setDrillPath([...drillPath, category]);
      // Update data based on drill down
    }
  };

  const handleBreadcrumbClick = (index) => {
    setDrillPath(drillPath.slice(0, index + 1));
  };

  return (
    <Card sx={{ borderRadius: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Interactive Revenue Analysis
          </Typography>
          <Chip label="Click to drill down" size="small" color="primary" variant="outlined" />
        </Box>
        
        <Breadcrumbs separator={<NavigateNext fontSize="small" />} sx={{ mb: 2 }}>
          {drillPath.map((path, index) => (
            <Link
              key={index}
              color={index === drillPath.length - 1 ? "text.primary" : "inherit"}
              href="#"
              onClick={() => handleBreadcrumbClick(index)}
              sx={{ textDecoration: 'none' }}
            >
              {path}
            </Link>
          ))}
        </Breadcrumbs>

        <Box sx={{ height: 300, cursor: 'pointer' }} onClick={() => handleDrillDown('Q1')}>
          <LineChart
            dataset={currentData.data}
            xAxis={[{ dataKey: 'month', scaleType: 'point' }]}
            series={[{ dataKey: 'value', label: 'Revenue ($)', color: '#3b82f6' }]}
            height={300}
            margin={{ left: 70, right: 20, top: 20, bottom: 40 }}
          />
        </Box>
      </CardContent>
    </Card>
  );
}