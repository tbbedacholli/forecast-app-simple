// components/SmartTooltip.js
import { Tooltip, Typography, Box, Chip } from '@mui/material';
import { TrendingUp, Info } from '@mui/icons-material';

export default function SmartTooltip({ children, data, insights }) {
  return (
    <Tooltip
      title={
        <Box sx={{ p: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            {data.title}
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Current: <strong>{data.value}</strong>
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Trend: <Chip size="small" icon={<TrendingUp />} label={data.trend} color="success" />
          </Typography>
          {insights && (
            <Box sx={{ mt: 1, p: 1, bgcolor: 'rgba(59, 130, 246, 0.1)', borderRadius: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                <Info sx={{ fontSize: 14, mr: 0.5 }} />
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  AI Insight
                </Typography>
              </Box>
              <Typography variant="caption">
                {insights}
              </Typography>
            </Box>
          )}
        </Box>
      }
      arrow
      placement="top"
      sx={{
        '& .MuiTooltip-tooltip': {
          maxWidth: 300,
          bgcolor: 'background.paper',
          color: 'text.primary',
          border: '1px solid',
          borderColor: 'divider',
        }
      }}
    >
      {children}
    </Tooltip>
  );
}