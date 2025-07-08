// app/page.js
'use client';
import { useState, useEffect } from 'react';
import { CssBaseline, Box, Toolbar } from '@mui/material';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import Dashboard from '../components/Dashboard';
import { useSidebar } from '../contexts/SidebarContext';

export default function Home() {
  const { sidebarCollapsed, handleSidebarToggle } = useSidebar();

  return (
    <>
      <CssBaseline />
      <Box sx={{ display: 'flex' }}>
        <Header 
          title="Dashboard" 
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
            bgcolor: 'background.default', // Use theme colors
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
            <Dashboard />
          </Box>
        </Box>
      </Box>
    </>
  );
}