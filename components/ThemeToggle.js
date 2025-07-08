// components/ThemeToggle.js
'use client';
import { IconButton, Tooltip } from '@mui/material';
import { LightMode, DarkMode } from '@mui/icons-material';
import { useCustomTheme } from '../contexts/ThemeContext';

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useCustomTheme();

  return (
    <Tooltip title={`Switch to ${isDark ? 'light' : 'dark'} mode`}>
      <IconButton 
        onClick={toggleTheme}
        data-tour="theme-toggle"
        sx={{
          bgcolor: isDark ? 'rgba(96, 165, 250, 0.1)' : 'rgba(59, 130, 246, 0.1)',
          color: isDark ? '#60a5fa' : '#3b82f6',
          '&:hover': {
            bgcolor: isDark ? 'rgba(96, 165, 250, 0.2)' : 'rgba(59, 130, 246, 0.2)',
            transform: 'rotate(180deg)',
          },
          transition: 'all 0.3s ease',
        }}
      >
        {isDark ? <LightMode /> : <DarkMode />}
      </IconButton>
    </Tooltip>
  );
}