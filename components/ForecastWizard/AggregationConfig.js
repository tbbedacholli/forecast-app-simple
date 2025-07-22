import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Grid,
  Button,
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import FunctionsIcon from '@mui/icons-material/Functions';

const NUMERIC_AGGREGATIONS = [
  { value: 'sum', label: 'Sum' },
  { value: 'mean', label: 'Mean (Average)' },
  { value: 'median', label: 'Median' },
  { value: 'min', label: 'Minimum' },
  { value: 'max', label: 'Maximum' },
  { value: 'first', label: 'First Value' },
  { value: 'last', label: 'Last Value' }
];

const CATEGORICAL_AGGREGATIONS = [
  { value: 'mode', label: 'Most Frequent Value' },
  { value: 'first', label: 'First Value' },
  { value: 'last', label: 'Last Value' }
];

export default function AggregationConfig({ data, onUpdate, onNext, onBack }) {
  const [aggregationRules, setAggregationRules] = useState({});

  // Helper function to get effective column type
  const getEffectiveColumnType = (column) => {
    // First check user classifications (overrides)
    if (data.dataClassification?.userClassified?.[column]) {
      return data.dataClassification.userClassified[column];
    }
    // Then check automatic classifications
    if (data.validationResults?.columnAnalysis?.[column]) {
      return data.validationResults.columnAnalysis[column].type;
    }
    return null;
  };

  // Get columns by type
  const getColumnsByType = (type) => {
    if (!data.columns) return [];
    
    return data.columns.filter(column => {
      // Exclude target, date and grouping columns
      if (column === data.selectedColumns?.target) return false;
      if (column === data.selectedColumns?.date) return false;
      if (data.selectedColumns?.grouping?.includes(column)) return false;
      
      // Check column type
      const effectiveType = getEffectiveColumnType(column);
      return effectiveType === type;
    });
  };

  // Initialize aggregation rules
  useEffect(() => {
    if (data.columns && Object.keys(aggregationRules).length === 0) {
      const defaultRules = {};
      data.columns.forEach(column => {
        const type = getEffectiveColumnType(column);
        
        // Skip target, date and grouping columns
        if (column === data.selectedColumns?.target) return;
        if (column === data.selectedColumns?.date) return;
        if (data.selectedColumns?.grouping?.includes(column)) return;

        // Set default aggregation based on type
        if (type === 'numeric') {
          defaultRules[column] = 'sum';
        } else if (type === 'categorical' || type === 'binary') {
          defaultRules[column] = 'mode';
        }
      });

      setAggregationRules(defaultRules);
      onUpdate({ aggregationRules: defaultRules });
    }
  }, [data.columns, data.selectedColumns, data.dataClassification]);

  const handleAggregationChange = (column, value) => {
    const newRules = { ...aggregationRules, [column]: value };
    setAggregationRules(newRules);
    onUpdate({ aggregationRules: newRules });
  };

  // Debug logging
  console.log('AggregationConfig Data:', {
    columns: data.columns,
    dataClassification: data.dataClassification,
    numericColumns: getColumnsByType('numeric'),
    categoricalColumns: getColumnsByType('categorical'),
    binaryColumns: getColumnsByType('binary')
  });

  // Column analysis effect
  useEffect(() => {
    console.log('Column Analysis:', {
      allColumns: data.columns,
      validationResults: data.validationResults?.columnAnalysis,
      userClassified: data.dataClassification?.userClassified,
      effectiveTypes: data.columns?.reduce((acc, col) => {
        acc[col] = getEffectiveColumnType(col);
        return acc;
      }, {})
    });
  }, [data]);

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
        Configure Data Aggregation
      </Typography>

      {/* Data Analysis Summary */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Data Structure Analysis
          </Typography>

          {data.verificationResults?.aggregationImpact && (
            <Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  📊 Your dataset contains:
                  <br />
                  • <strong>{data.verificationResults.aggregationImpact.originalCount.toLocaleString()}</strong> total rows
                  <br />
                  • Will be aggregated to <strong>{data.verificationResults.aggregationImpact.aggregatedCount.toLocaleString()}</strong> rows at {data.selectedColumns?.frequency} level
                  {data.verificationResults.aggregationImpact.reductionPercent > 0 && (
                    <>
                      <br />
                      • Multiple records per time period will be aggregated using appropriate methods for each column type
                    </>
                  )}
                </Typography>
              </Alert>

              <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                Based on your selected configuration:
                <ul>
                  <li>Target variable: <strong>{data.selectedColumns?.target}</strong> (excluded from aggregation)</li>
                  <li>Time dimension: <strong>{data.selectedColumns?.date}</strong> (used for grouping)</li>
                  {data.selectedColumns?.grouping?.length > 0 && (
                    <li>Grouping by: <strong>{data.selectedColumns.grouping.join(', ')}</strong> (used for grouping)</li>
                  )}
                  <li>Target frequency: <strong>{data.selectedColumns?.frequency}</strong></li>
                </ul>
                Only remaining columns will be aggregated using these methods:
                <ul>
                  <li>Numeric columns: Sum, average, or other selected method</li>
                  <li>Categorical columns: Most frequent value or selected method</li>
                  <li>Binary columns: Most frequent value or selected method</li>
                </ul>
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Numeric Columns */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <FunctionsIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Numeric Columns ({getColumnsByType('numeric').length})
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {getColumnsByType('numeric').map(column => (
              <Grid item xs={12} md={6} key={column}>
                <FormControl fullWidth>
                  <InputLabel>{column}</InputLabel>
                  <Select
                    value={aggregationRules[column] || 'sum'}
                    onChange={(e) => handleAggregationChange(column, e.target.value)}
                    label={column}
                  >
                    {NUMERIC_AGGREGATIONS.map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Categorical Columns */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <SettingsIcon color="secondary" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Categorical/Binary Columns (
                {[
                  ...getColumnsByType('categorical'),
                  ...getColumnsByType('binary')
                ].length}
              )
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {[
              ...getColumnsByType('categorical'),
              ...getColumnsByType('binary')
            ].map(column => (
              <Grid item xs={12} md={6} key={column}>
                <FormControl fullWidth>
                  <InputLabel>{column}</InputLabel>
                  <Select
                    value={aggregationRules[column] || 'mode'}
                    onChange={(e) => handleAggregationChange(column, e.target.value)}
                    label={column}
                  >
                    {CATEGORICAL_AGGREGATIONS.map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Navigation */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button onClick={onBack} size="large">
          Back: Column Selection
        </Button>
        <Button
          variant="contained"
          onClick={onNext}
          size="large"
          color="primary"
        >
          Next: Training Configuration
        </Button>
      </Box>
    </Box>
  );
}