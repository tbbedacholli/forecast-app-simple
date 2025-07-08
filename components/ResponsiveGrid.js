// components/ResponsiveGrid.js
import { Grid, useMediaQuery, useTheme } from '@mui/material';

export default function ResponsiveGrid({ children, ...props }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Grid 
      container 
      spacing={isMobile ? 1 : isTablet ? 2 : 3}
      {...props}
    >
      {children}
    </Grid>
  );
}