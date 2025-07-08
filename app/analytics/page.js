// app/analytics/page.js
'use client';
import { CssBaseline, Box, Toolbar } from '@mui/material';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import Charts from '../../components/Charts';
import { useSidebar } from '../../contexts/SidebarContext';

export default function AnalyticsPage() {
  const { sidebarCollapsed, handleSidebarToggle } = useSidebar();

  return (
    <>
      <CssBaseline />
      <Box sx={{ display: 'flex' }}>
        <Header 
          title="Analytics" 
          onMenuClick={handleSidebarToggle}
        />
        <Sidebar 
          isCollapsed={sidebarCollapsed} 
          onToggle={handleSidebarToggle} 
        />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            bgcolor: 'background.default', // Theme-aware background
            minHeight: '100vh',
            ml: sidebarCollapsed ? '64px' : '260px',
            transition: 'margin-left 0.3s ease',
            p: 0,
            m: 0,
            position: 'relative',
          }}
        >
          <Toolbar sx={{ minHeight: '64px !important' }} />
          <Box sx={{ 
            p: 0.5,
            m: 0,
            '& > *': {
              m: 0,
            }
          }}>
            <Charts />
          </Box>
        </Box>
      </Box>
    </>
  );
}