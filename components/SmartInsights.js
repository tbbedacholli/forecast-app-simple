// components/SmartInsights.js
'use client';
import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Avatar, 
  Chip,
  IconButton,
  Fade
} from '@mui/material';
import { 
  Psychology as AiIcon,
  TrendingUp,
  Warning,
  Lightbulb,
  Refresh
} from '@mui/icons-material';

const insights = [
  {
    type: 'trend',
    icon: <TrendingUp />,
    color: '#10b981',
    title: 'Revenue Acceleration Detected',
    description: 'Your revenue growth has increased 23% compared to last quarter. Consider scaling your marketing efforts.',
    confidence: 94,
    actionable: true
  },
  {
    type: 'warning',
    icon: <Warning />,
    color: '#f59e0b',
    title: 'User Retention Dip',
    description: 'User retention dropped 5% this week. Review recent product changes or run a user satisfaction survey.',
    confidence: 87,
    actionable: true
  },
  {
    type: 'opportunity',
    icon: <Lightbulb />,
    color: '#8b5cf6',
    title: 'Peak Traffic Window',
    description: 'Users are most active between 2-4 PM EST. Consider scheduling key announcements during this window.',
    confidence: 91,
    actionable: false
  }
];

export default function SmartInsights() {
  const [currentInsight, setCurrentInsight] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentInsight((prev) => (prev + 1) % insights.length);
        setIsVisible(true);
      }, 300);
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  const insight = insights[currentInsight];

  return (
    <Card sx={{ 
      borderRadius: 2,
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <Avatar sx={{ 
            bgcolor: 'rgba(255,255,255,0.2)', 
            color: 'white',
            animation: 'pulse 2s infinite',
            '@keyframes pulse': {
              '0%': { transform: 'scale(1)' },
              '50%': { transform: 'scale(1.05)' },
              '100%': { transform: 'scale(1)' }
            }
          }}>
            <AiIcon />
          </Avatar>
          
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="caption" sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)', 
                px: 1, 
                py: 0.5, 
                borderRadius: 1,
                fontWeight: 600
              }}>
                AI INSIGHT
              </Typography>
              <Chip 
                size="small" 
                label={`${insight.confidence}% confident`}
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)', 
                  color: 'white',
                  fontSize: '0.7rem'
                }}
              />
            </Box>
            
            <Fade in={isVisible} timeout={300}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  {insight.title}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9, lineHeight: 1.5 }}>
                  {insight.description}
                </Typography>
              </Box>
            </Fade>
          </Box>

          <IconButton 
            size="small" 
            sx={{ color: 'white', opacity: 0.7 }}
            onClick={() => setCurrentInsight((prev) => (prev + 1) % insights.length)}
          >
            <Refresh />
          </IconButton>
        </Box>

        {/* Progress indicators */}
        <Box sx={{ display: 'flex', gap: 0.5, mt: 2, justifyContent: 'center' }}>
          {insights.map((_, index) => (
            <Box
              key={index}
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: index === currentInsight ? 'white' : 'rgba(255,255,255,0.3)',
                transition: 'all 0.3s ease'
              }}
            />
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}