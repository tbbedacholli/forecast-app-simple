// components/Sidebar.js
'use client';
import { 
  Drawer, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Toolbar,
  Box,
  Typography,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  Dashboard as DashboardIcon, 
  TrendingUp as ForecastIcon,
  Analytics as AnalyticsIcon,
  Settings as SettingsIcon,
  ChevronLeft,
  ChevronRight,
  Menu,
  AutoFixHigh as AutoFixHighIcon
} from '@mui/icons-material';
import Link from 'next/link';

const drawerWidth = 260;
const collapsedWidth = 64;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, href: '/' },
  { text: 'Forecast Wizard', icon: <AutoFixHighIcon />, href: '/wizard' },
  { text: 'Forecast', icon: <ForecastIcon />, href: '/forecast' },
  { text: 'Analytics', icon: <AnalyticsIcon />, href: '/analytics' },
  { text: 'Settings', icon: <SettingsIcon />, href: '/settings' },
];

export default function Sidebar({ isCollapsed, onToggle }) {
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: isCollapsed ? collapsedWidth : drawerWidth,
        flexShrink: 0,
        transition: 'width 0.3s ease',
        '& .MuiDrawer-paper': {
          width: isCollapsed ? collapsedWidth : drawerWidth,
          boxSizing: 'border-box',
          backgroundColor: '#1e293b',
          color: 'white',
          transition: 'width 0.3s ease',
          overflowX: 'hidden',
        },
      }}
    >
      <Toolbar sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: isCollapsed ? 'center' : 'space-between',
        px: isCollapsed ? 1 : 2 
      }}>
        {!isCollapsed && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ForecastIcon sx={{ color: '#3b82f6' }} />
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'white' }}>
              ForecastPro
            </Typography>
          </Box>
        )}
        {isCollapsed && (
          <ForecastIcon sx={{ color: '#3b82f6' }} />
        )}
        <IconButton 
          onClick={onToggle}
          sx={{ 
            color: 'white',
            '&:hover': { backgroundColor: '#374151' }
          }}
        >
          {isCollapsed ? <ChevronRight /> : <ChevronLeft />}
        </IconButton>
      </Toolbar>
      
      <Divider sx={{ borderColor: '#374151' }} />
      
      <List sx={{ mt: 1, px: 1 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
            <Tooltip title={isCollapsed ? item.text : ''} placement="right">
              <ListItemButton
                component={Link}
                href={item.href}
                sx={{
                  borderRadius: 2,
                  justifyContent: isCollapsed ? 'center' : 'flex-start',
                  px: isCollapsed ? 1 : 2,
                  py: 1,
                  '&:hover': {
                    backgroundColor: '#374151',
                  },
                  '&.Mui-selected': {
                    backgroundColor: '#3b82f6',
                    '&:hover': {
                      backgroundColor: '#2563eb',
                    },
                  },
                }}
              >
                <ListItemIcon sx={{ 
                  color: '#94a3b8', 
                  minWidth: isCollapsed ? 'auto' : 40,
                  justifyContent: 'center'
                }}>
                  {item.icon}
                </ListItemIcon>
                {!isCollapsed && (
                  <ListItemText 
                    primary={item.text} 
                    sx={{ 
                      ml: 1,
                      '& .MuiTypography-root': { 
                        fontSize: '0.875rem',
                        fontWeight: 500 
                      } 
                    }} 
                  />
                )}
              </ListItemButton>
            </Tooltip>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
}