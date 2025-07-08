// components/ActivityFeed.js
'use client';
import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Avatar, 
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Chip,
  Divider
} from '@mui/material';
import { 
  TrendingUp,
  Person,
  Assessment,
  Notifications,
  Update
} from '@mui/icons-material';

export default function ActivityFeed() {
  const [activities, setActivities] = useState([
    {
      id: 1,
      type: 'forecast',
      user: 'System',
      action: 'Generated new revenue forecast',
      time: '2 minutes ago',
      icon: <Assessment />,
      color: '#3b82f6'
    },
    {
      id: 2,
      type: 'user',
      user: 'Sarah Johnson',
      action: 'Updated conversion model parameters',
      time: '15 minutes ago',
      icon: <Person />,
      color: '#10b981'
    },
    {
      id: 3,
      type: 'alert',
      user: 'System',
      action: 'Revenue target exceeded by 12%',
      time: '1 hour ago',
      icon: <TrendingUp />,
      color: '#f59e0b'
    },
    {
      id: 4,
      type: 'update',
      user: 'Data Pipeline',
      action: 'Synchronized external data sources',
      time: '2 hours ago',
      icon: <Update />,
      color: '#8b5cf6'
    }
  ]);

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      const newActivity = {
        id: Date.now(),
        type: 'forecast',
        user: 'System',
        action: 'Real-time data updated',
        time: 'Just now',
        icon: <Notifications />,
        color: '#ef4444'
      };
      
      setActivities(prev => [newActivity, ...prev.slice(0, 4)]);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Card sx={{ borderRadius: 2, height: 400 }}>
      <CardContent sx={{ p: 0 }}>
        <Box sx={{ p: 3, borderBottom: '1px solid #e2e8f0' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Live Activity Feed
          </Typography>
        </Box>
        
        <List sx={{ p: 0, maxHeight: 320, overflow: 'auto' }}>
          {activities.map((activity, index) => (
            <Box key={activity.id}>
              <ListItem sx={{ px: 3, py: 2 }}>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: activity.color, width: 32, height: 32 }}>
                    {activity.icon}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {activity.user}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {activity.action}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Typography variant="caption" color="textSecondary">
                      {activity.time}
                    </Typography>
                  }
                />
                {activity.type === 'alert' && (
                  <Chip size="small" label="Alert" color="warning" />
                )}
              </ListItem>
              {index < activities.length - 1 && <Divider />}
            </Box>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}