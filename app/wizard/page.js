// app/wizard/page.js
'use client';
import { CssBaseline, Box, Toolbar } from '@mui/material';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import ForecastWizard from '../../components/ForecastWizard';
import { useSidebar } from '../../contexts/SidebarContext';

export default function WizardPage() {
  const { sidebarCollapsed, handleSidebarToggle } = useSidebar();

  return (
    <>
      <CssBaseline />
      <Box sx={{ display: 'flex' }}>
        <Header 
          title="Forecast Wizard" 
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
            bgcolor: 'background.default',
            minHeight: '100vh',
            ml: sidebarCollapsed ? '64px' : '260px',
            transition: 'margin-left 0.3s ease',
            p: 0,
            m: 0,
            position: 'relative',
          }}
        >
          <Toolbar sx={{ minHeight: '64px !important' }} />
          <Box sx={{ p: 2 }}>
            <ForecastWizard />
          </Box>
        </Box>
      </Box>
    </>
  );
}