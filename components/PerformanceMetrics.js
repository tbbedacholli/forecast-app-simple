// components/PerformanceMetrics.js
'use client';
import { Card, CardContent, Typography, Box, LinearProgress } from '@mui/material';
import { Speed, Memory, Storage } from '@mui/icons-material';

export default function PerformanceMetrics() {
  const metrics = [
    { label: 'API Response Time', value: 245, max: 1000, unit: 'ms', icon: <Speed />, color: '#10b981' },
    { label: 'Memory Usage', value: 67, max: 100, unit: '%', icon: <Memory />, color: '#f59e0b' },
    { label: 'Data Freshness', value: 95, max: 100, unit: '%', icon: <Storage />, color: '#3b82f6' },
  ];

  return (
    <Card sx={{ borderRadius: 2 }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          System Performance
        </Typography>
        {metrics.map((metric, index) => (
          <Box key={index} sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Box sx={{ color: metric.color, mr: 1 }}>{metric.icon}</Box>
              <Typography variant="body2" sx={{ flexGrow: 1 }}>
                {metric.label}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: metric.color }}>
                {metric.value}{metric.unit}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={(metric.value / metric.max) * 100}
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: `${metric.color}20`,
                '& .MuiLinearProgress-bar': {
                  bgcolor: metric.color,
                  borderRadius: 3,
                }
              }}
            />
          </Box>
        ))}
      </CardContent>
    </Card>
  );
}