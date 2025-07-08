// components/NotificationCenter.js
'use client';
import { useState, useEffect } from 'react';
import { 
  Badge, 
  IconButton, 
  Popover, 
  List, 
  ListItem, 
  ListItemText, 
  Typography, 
  Box,
  Chip 
} from '@mui/material';
import { Notifications, Circle } from '@mui/icons-material';

export default function NotificationCenter() {
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Revenue Alert', message: 'Q4 revenue exceeded forecast by 15%', time: '2 min ago', unread: true },
    { id: 2, title: 'Model Update', message: 'User growth model accuracy improved to 94.2%', time: '1 hour ago', unread: true },
    { id: 3, title: 'Forecast Complete', message: 'Monthly sales forecast has been generated', time: '3 hours ago', unread: false },
  ]);

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <>
      <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
        <Badge badgeContent={unreadCount} color="error">
          <Notifications />
        </Badge>
      </IconButton>
      
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: { width: 350, maxHeight: 400 }
        }}
      >
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Notifications
          </Typography>
        </Box>
        <List sx={{ p: 0 }}>
          {notifications.map((notification) => (
            <ListItem 
              key={notification.id}
              sx={{ 
                borderBottom: '1px solid',
                borderColor: 'divider',
                bgcolor: notification.unread ? 'action.hover' : 'transparent'
              }}
            >
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                    {notification.unread && (
                      <Circle sx={{ fontSize: 8, color: 'primary.main', mr: 1 }} />
                    )}
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {notification.title}
                    </Typography>
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      {notification.message}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {notification.time}
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      </Popover>
    </>
  );
}