// components/Dashboard.js
'use client';
import { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Grid, 
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import Charts from './Charts';
import Filters from './Filters';
import AnimatedStatsCard from './AnimatedStatsCard';
import ChartSkeleton from './ChartSkeleton';
import SmartInsights from './SmartInsights';
import ActivityFeed from './ActivityFeed';
import DrillDownChart from './DrillDownChart';
import FirstTimeTour from './FirstTimeTour';
import { 
  TrendingUp, 
  People, 
  ShoppingCart, 
  Assessment 
} from '@mui/icons-material';

// Mock recent forecast data
const recentForecasts = [
  { id: 1, metric: 'Q4 Revenue', prediction: '$45M', confidence: '92%', date: '2024-01-15' },
  { id: 2, metric: 'User Growth', prediction: '+15%', confidence: '87%', date: '2024-01-14' },
  { id: 3, metric: 'Market Share', prediction: '23%', confidence: '95%', date: '2024-01-13' },
  { id: 4, metric: 'Churn Rate', prediction: '2.1%', confidence: '89%', date: '2024-01-12' },
];

export default function Dashboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilters, setActiveFilters] = useState({});
  
  // Live animated stats
  const [liveStats, setLiveStats] = useState([
    { title: 'Total Revenue', value: 125000, change: 12.5, trend: 'up', icon: <TrendingUp />, color: '#10b981' },
    { title: 'Active Users', value: 8432, change: 8.2, trend: 'up', icon: <People />, color: '#3b82f6' },
    { title: 'Conversions', value: 342, change: -2.1, trend: 'down', icon: <ShoppingCart />, color: '#f59e0b' },
    { title: 'Performance', value: 94, change: 5.3, trend: 'up', icon: <Assessment />, color: '#8b5cf6' },
  ]);

// Fetch data and simulate live updates
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/forecast');
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Simulate live data updates
    const interval = setInterval(() => {
      setLiveStats(prev => prev.map(stat => ({
        ...stat,
        value: stat.value + Math.floor(Math.random() * 100) - 50,
        change: (Math.random() * 20 - 10).toFixed(1)
      })));
    }, 10000);

    return () => clearInterval(interval);
  }, [activeFilters]);

  const handleFiltersChange = (newFilters) => {
    console.log('Filters changed:', newFilters);
    setActiveFilters(newFilters);
  };

  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        <Grid container spacing={2}>
          {[...Array(4)].map((_, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <ChartSkeleton />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 0 }}>
      {/* First Time Tour */}
      <FirstTimeTour />
      
      {/* Filters Component */}
      <Filters onFiltersChange={handleFiltersChange} />
      
      {/* Animated Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {liveStats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <AnimatedStatsCard
              title={stat.title}
              value={stat.value}
              change={stat.change}
              trend={stat.trend}
              icon={stat.icon}
              color={stat.color}
            />
          </Grid>
        ))}
      </Grid>

      {/* Smart Insights */}
      <Box sx={{ mb: 3 }}>
        <SmartInsights />
      </Box>

      {/* Charts Section */}
      <Box sx={{ mb: 3 }}>
        <Charts filters={activeFilters} />
      </Box>

      {/* Activity Feed */}
      <Box sx={{ mb: 3 }}>
        <ActivityFeed />
      </Box>

      {/* Drill Down Chart */}
      <Box sx={{ mb: 3 }}>
        <DrillDownChart />
      </Box>
      
      {/* Live Forecast Data Cards */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
          Live Forecast Data
        </Typography>
        <Grid container spacing={2}>
          {data.map((item, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card 
                sx={{ 
                  height: '100%',
                  borderRadius: 2,
                  boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
                  border: '1px solid #e2e8f0',
                  '&:hover': {
                    borderColor: '#3b82f6',
                    transition: 'border-color 0.2s ease'
                  }
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Typography 
                    color="textSecondary" 
                    gutterBottom 
                    variant="body2"
                    sx={{ textTransform: 'uppercase', fontWeight: 600, letterSpacing: 1 }}
                  >
                    {item.title}
                  </Typography>
                  <Typography 
                    variant="h3" 
                    component="div" 
                    sx={{ 
                      color: '#1e293b', 
                      fontWeight: 'bold',
                      mb: 1
                    }}
                  >
                    {item.value}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Updated just now
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Recent Forecasts Table */}
      <Card sx={{ borderRadius: 2, boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 3, borderBottom: '1px solid #e2e8f0' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Recent Forecast Reports
            </Typography>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Metric</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Prediction</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Confidence</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentForecasts.map((forecast) => (
                  <TableRow key={forecast.id} sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                    <TableCell sx={{ fontWeight: 500 }}>{forecast.metric}</TableCell>
                    <TableCell sx={{ color: '#3b82f6', fontWeight: 600 }}>
                      {forecast.prediction}
                    </TableCell>
                    <TableCell>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: '#10b981',
                          bgcolor: '#dcfce7',
                          px: 2,
                          py: 0.5,
                          borderRadius: 4,
                          display: 'inline-block',
                          fontWeight: 600
                        }}
                      >
                        {forecast.confidence}
                      </Typography>
                    </TableCell>
                    <TableCell color="textSecondary">{forecast.date}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}