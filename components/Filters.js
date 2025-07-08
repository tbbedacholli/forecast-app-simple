// components/Filters.js
'use client';
import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Chip,
  IconButton
} from '@mui/material';
import {
  DateRange as DateRangeIcon,
  Clear as ClearIcon
} from '@mui/icons-material';

export default function Filters({ onFiltersChange }) {
  const [filters, setFilters] = useState({
    dateRange: 'last30days',
    metricType: 'revenue',
    region: 'all'
  });

  const handleFilterChange = (filterType, value) => {
    const newFilters = { ...filters, [filterType]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      dateRange: 'last30days',
      metricType: 'revenue',
      region: 'all'
    };
    setFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  return (
    <Card sx={{ mb: 3, borderRadius: 2, boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}>
      <CardContent sx={{ p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Date Range</InputLabel>
              <Select
                value={filters.dateRange}
                label="Date Range"
                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
              >
                <MenuItem value="last7days">Last 7 days</MenuItem>
                <MenuItem value="last30days">Last 30 days</MenuItem>
                <MenuItem value="last90days">Last 90 days</MenuItem>
                <MenuItem value="last12months">Last 12 months</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={4} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Metric Type</InputLabel>
              <Select
                value={filters.metricType}
                label="Metric Type"
                onChange={(e) => handleFilterChange('metricType', e.target.value)}
              >
                <MenuItem value="revenue">Revenue</MenuItem>
                <MenuItem value="users">Users</MenuItem>
                <MenuItem value="conversions">Conversions</MenuItem>
                <MenuItem value="performance">Performance</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={4} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Region</InputLabel>
              <Select
                value={filters.region}
                label="Region"
                onChange={(e) => handleFilterChange('region', e.target.value)}
              >
                <MenuItem value="all">All Regions</MenuItem>
                <MenuItem value="north-america">North America</MenuItem>
                <MenuItem value="europe">Europe</MenuItem>
                <MenuItem value="asia">Asia</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={12} md={3}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <IconButton 
                onClick={clearFilters}
                size="small"
                sx={{ 
                  bgcolor: 'action.hover',
                  '&:hover': { bgcolor: 'action.selected' }
                }}
              >
                <ClearIcon />
              </IconButton>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}