// components/StatsCards.js
'use client';
import { Grid, Card, CardContent, Typography, Box, Avatar } from '@mui/material';
import { 
  TrendingUp, 
  TrendingDown, 
  People, 
  AttachMoney,
  ShowChart,
  Speed
} from '@mui/icons-material';

const statsData = [
  {
    title: 'Total Revenue',
    value: '$120,000',
    change: '+12.5%',
    isPositive: true,
    icon: <AttachMoney />,
    color: '#10b981'
  },
  {
    title: 'Active Users',
    value: '15,243',
    change: '+8.2%',
    isPositive: true,
    icon: <People />,
    color: '#3b82f6'
  },
  {
    title: 'Conversion Rate',
    value: '3.4%',
    change: '-2.1%',
    isPositive: false,
    icon: <ShowChart />,
    color: '#f59e0b'
  },
  {
    title: 'Performance',
    value: '89%',
    change: '+5.7%',
    isPositive: true,
    icon: <Speed />,
    color: '#8b5cf6'
  }
];

export default function StatsCards() {
  return (
    <Grid container spacing={{ xs: 1, sm: 2, md: 3 }}>
      {statsData.map((stat, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <Card 
            sx={{ 
              height: '100%',
              borderRadius: 2,
              boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
              '&:hover': {
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                transform: 'translateY(-1px)',
                transition: 'all 0.2s ease-in-out'
              }
            }}
          >
            <CardContent sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar 
                  sx={{ 
                    bgcolor: stat.color, 
                    width: 48, 
                    height: 48,
                    mr: 2
                  }}
                >
                  {stat.icon}
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                    {stat.value}
                  </Typography>
                  <Typography color="textSecondary" variant="body2">
                    {stat.title}
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {stat.isPositive ? (
                  <TrendingUp sx={{ color: '#10b981', fontSize: 16, mr: 0.5 }} />
                ) : (
                  <TrendingDown sx={{ color: '#ef4444', fontSize: 16, mr: 0.5 }} />
                )}
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: stat.isPositive ? '#10b981' : '#ef4444',
                    fontWeight: 600 
                  }}
                >
                  {stat.change} from last month
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}