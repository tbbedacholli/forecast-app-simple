// components/ChartSkeleton.js
import { Card, CardContent, Skeleton, Box } from '@mui/material';

export default function ChartSkeleton() {
  return (
    <Card sx={{ borderRadius: 2 }}>
      <CardContent sx={{ p: 3 }}>
        <Skeleton variant="text" width="40%" height={32} sx={{ mb: 2 }} />
        <Box sx={{ height: 280, position: 'relative' }}>
          <Skeleton 
            variant="rectangular" 
            width="100%" 
            height="100%" 
            sx={{ borderRadius: 1 }}
          />
          {/* Animated loading bars */}
          {[...Array(5)].map((_, i) => (
            <Skeleton
              key={i}
              variant="rectangular"
              width={40}
              height={Math.random() * 200 + 50}
              sx={{
                position: 'absolute',
                bottom: 20,
                left: 60 + i * 80,
                animation: `wave 1.5s ease-in-out infinite`,
                animationDelay: `${i * 0.2}s`
              }}
            />
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}