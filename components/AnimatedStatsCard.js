// components/AnimatedStatsCard.js
'use client';
import { Card, CardContent, Typography, Box, Chip } from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';
import { useState, useEffect } from 'react';

export default function AnimatedStatsCard({ title, value, change, trend, icon, color }) {
  const [animatedValue, setAnimatedValue] = useState(0);
  const [isNew, setIsNew] = useState(false);

  useEffect(() => {
    // Animate value change
    const duration = 1000;
    const steps = 50;
    const increment = (value - animatedValue) / steps;
    
    let current = animatedValue;
    const timer = setInterval(() => {
      current += increment;
      setAnimatedValue(Math.floor(current));
      
      if (Math.abs(current - value) < Math.abs(increment)) {
        setAnimatedValue(value);
        clearInterval(timer);
      }
    }, duration / steps);

    // Flash effect for new data
    setIsNew(true);
    setTimeout(() => setIsNew(false), 1000);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <Card 
      sx={{ 
        borderRadius: 3,
        background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
        border: `1px solid ${color}20`,
        position: 'relative',
        overflow: 'hidden',
        transform: isNew ? 'scale(1.02)' : 'scale(1)',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: `0 8px 25px ${color}25`
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: `linear-gradient(90deg, ${color}, ${color}80)`,
        }
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ 
            bgcolor: `${color}15`, 
            borderRadius: 2, 
            p: 1.5,
            animation: isNew ? 'pulse 1s ease-in-out' : 'none',
            '@keyframes pulse': {
              '0%': { transform: 'scale(1)', opacity: 1 },
              '50%': { transform: 'scale(1.05)', opacity: 0.8 },
              '100%': { transform: 'scale(1)', opacity: 1 }
            }
          }}>
            {icon}
          </Box>
          <Chip
            icon={trend === 'up' ? <TrendingUp /> : <TrendingDown />}
            label={`${change}%`}
            size="small"
            color={trend === 'up' ? 'success' : 'error'}
            sx={{ fontWeight: 600 }}
          />
        </Box>
        
        <Typography variant="h3" sx={{ 
          fontWeight: 700, 
          color: color,
          fontFamily: 'monospace',
          textShadow: `1px 1px 2px ${color}20`
        }}>
          {animatedValue.toLocaleString()}
        </Typography>
        
        <Typography variant="body2" color="textSecondary" sx={{ 
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: 1
        }}>
          {title}
        </Typography>
        
        <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
          <Box sx={{ 
            width: 6, 
            height: 6, 
            borderRadius: '50%', 
            bgcolor: '#10b981',
            mr: 1,
            animation: 'blink 2s infinite',
            '@keyframes blink': {
              '0%, 50%': { opacity: 1 },
              '51%, 100%': { opacity: 0.3 }
            }
          }} />
          <Typography variant="caption" color="textSecondary">
            Live • Updated now
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}