// components/Charts.js
'use client';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Grid,
  Paper
} from '@mui/material';
import { 
  LineChart,
  BarChart,
  PieChart
} from '@mui/x-charts';

// Fixed: Ensure all data is properly typed
const revenueData = [
  { month: 'Jan', revenue: 65000, forecast: 60000 },
  { month: 'Feb', revenue: 72000, forecast: 68000 },
  { month: 'Mar', revenue: 68000, forecast: 72000 },
  { month: 'Apr', revenue: 85000, forecast: 78000 },
  { month: 'May', revenue: 91000, forecast: 85000 },
  { month: 'Jun', revenue: 88000, forecast: 89000 },
  { month: 'Jul', revenue: 94000, forecast: 92000 },
  { month: 'Aug', revenue: 102000, forecast: 96000 },
  { month: 'Sep', revenue: 98000, forecast: 100000 },
  { month: 'Oct', revenue: 110000, forecast: 105000 },
  { month: 'Nov', revenue: 115000, forecast: 108000 },
  { month: 'Dec', revenue: 125000, forecast: 112000 }
];

const userGrowthData = [
  { quarter: 'Q1', users: 1200 },
  { quarter: 'Q2', users: 1850 },
  { quarter: 'Q3', users: 2400 },
  { quarter: 'Q4', users: 3100 }
];

const marketShareData = [
  { id: 0, value: 35, label: 'Our Product' },
  { id: 1, value: 25, label: 'Competitor A' },
  { id: 2, value: 20, label: 'Competitor B' },
  { id: 3, value: 15, label: 'Competitor C' },
  { id: 4, value: 5, label: 'Others' }
];

const performanceData = [
  { week: 'Week 1', performance: 85 },
  { week: 'Week 2', performance: 88 },
  { week: 'Week 3', performance: 92 },
  { week: 'Week 4', performance: 89 }
];

export default function Charts({ filters = {} }) {
  // Filter data based on active filters
  const getFilteredData = (originalData, filterType) => {
    if (!filters.metricType || filters.metricType === 'all') {
      return originalData;
    }
    
    // Apply filters based on type
    switch (filters.metricType) {
      case 'revenue':
        return originalData; // Show revenue data
      case 'users':
        return originalData; // Show user data
      // Add more filter logic as needed
      default:
        return originalData;
    }
  };

  return (
    <Box sx={{ mt: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        {/* <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Analytics & Forecasts
        </Typography> */}
        {Object.keys(filters).length > 0 && (
          <Typography variant="body2" color="textSecondary">
            Showing filtered results
          </Typography>
        )}
      </Box>
      
      <Grid container spacing={1}>
        {/* Revenue Forecast Chart */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ borderRadius: 2, boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}>
            <CardContent sx={{ p: 2 }}> {/* Fixed padding instead of responsive */}
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                Revenue vs Forecast
              </Typography>
              <Box sx={{ height: 280, width: '100%' }}> {/* Fixed height */}
                <LineChart
                  dataset={revenueData}
                  xAxis={[{ dataKey: 'month', scaleType: 'point' }]}
                  series={[
                    { dataKey: 'revenue', label: 'Revenue ($)', color: '#3b82f6' },
                    { dataKey: 'forecast', label: 'Forecast ($)', color: '#10b981' }
                  ]}
                  height={280}
                  margin={{ left: 60, right: 20, top: 20, bottom: 40 }} // Reduced margins
                  grid={{ vertical: true, horizontal: true }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Market Share Pie Chart */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ borderRadius: 2, boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}>
            <CardContent sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                Market Share
              </Typography>
              <Box sx={{ 
                height: { xs: 200, sm: 250, md: 280 }, 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center' 
              }}>
                <PieChart
                  series={[
                    {
                      data: marketShareData.map((item, index) => ({
                        ...item,
                        color: ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#6b7280'][index]
                      })),
                      highlightScope: { faded: 'global', highlighted: 'item' },
                      faded: { innerRadius: 30, additionalRadius: -30 },
                      innerRadius: 40,
                      outerRadius: 100,
                    },
                  ]}
                  height={280}
                  width={280}
                  margin={{ top: 20, bottom: 20, left: 20, right: 20 }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* User Growth Bar Chart */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 2, boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}>
            <CardContent sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                Quarterly User Growth
              </Typography>
              <Box sx={{ 
                height: { xs: 180, sm: 200, md: 220 }, 
                width: '100%' 
              }}>
                <BarChart
                  dataset={userGrowthData}
                  xAxis={[{ dataKey: 'quarter', scaleType: 'band' }]}
                  series={[
                    { dataKey: 'users', label: 'New Users', color: '#8b5cf6' }
                  ]}
                  height={220}
                  margin={{ left: 80, right: 30, top: 30, bottom: 60 }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Performance Trend */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 2, boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}>
            <CardContent sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                Weekly Performance
              </Typography>
              <Box sx={{ 
                height: { xs: 180, sm: 200, md: 220 }, 
                width: '100%' 
              }}>
                <LineChart
                  dataset={performanceData}
                  xAxis={[{ dataKey: 'week', scaleType: 'point' }]}
                  series={[
                    { dataKey: 'performance', label: 'Performance %', color: '#8b5cf6' }
                  ]}
                  height={220}
                  margin={{ left: 80, right: 30, top: 30, bottom: 60 }}
                  grid={{ vertical: true, horizontal: true }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}