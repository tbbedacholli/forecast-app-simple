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

  // Update the getEffectiveColumnType function
  const getEffectiveColumnType = (column) => {
    // Debug log
    console.log(`Checking type for column: ${column}`);

    // First check user classifications
    if (data.dataClassification?.userClassified?.[column]) {
      console.log(`User classified ${column} as:`, data.dataClassification.userClassified[column]);
      return data.dataClassification.userClassified[column];
    }

    // Then check auto classifications
    if (data.dataClassification?.autoClassified?.[column]) {
      console.log(`Auto classified ${column} as:`, data.dataClassification.autoClassified[column]);
      return data.dataClassification.autoClassified[column];
    }

    // Check the raw data
    if (data.rawData && data.rawData.length > 0) {
      const sampleValues = data.rawData
        .slice(0, 100) // Take larger sample
        .map(row => row[column])
        .filter(value => value !== null && value !== undefined && value !== ''); // Remove empty values

      if (sampleValues.length === 0) {
        console.log(`No valid sample values found for ${column}`);
        return 'categorical'; // Default to categorical if no valid samples
      }

      const uniqueValues = new Set(sampleValues.map(String));
      console.log(`${column} has ${uniqueValues.size} unique values in sample`);

      // Check if all values are numeric
      const numericValues = sampleValues.filter(value => {
        const cleaned = String(value).replace(/[,$%]/g, '').trim();
        const num = parseFloat(cleaned);
        return !isNaN(num) && isFinite(num);
      });

      const numericRatio = numericValues.length / sampleValues.length;
      console.log(`${column} numeric ratio: ${numericRatio}`);

      if (numericRatio > 0.9) { // 90% of values are numeric
        console.log(`${column} classified as numeric`);
        return 'numeric';
      }

      // Check if binary
      if (uniqueValues.size <= 2) {
        console.log(`${column} classified as binary`);
        return 'binary';
      }

      // If few unique values relative to sample size, likely categorical
      if (uniqueValues.size <= Math.min(10, sampleValues.length * 0.2)) {
        console.log(`${column} classified as categorical (few unique values)`);
        return 'categorical';
      }

      console.log(`${column} defaulting to categorical`);
      return 'categorical';
    }

    console.log(`No data available for ${column}, defaulting to categorical`);
    return 'categorical';
  };

  // Update getColumnsByType function
  const getColumnsByType = (type) => {
    if (!data.columns) return [];

    const excludedColumns = [
      data.selectedColumns?.target,
      data.selectedColumns?.date,
      ...(data.selectedColumns?.level || []),
      ...(data.selectedColumns?.grouping || [])
    ].filter(Boolean);

    const result = data.columns.filter(column => {
      if (excludedColumns.includes(column)) {
        console.log(`Excluding column ${column} as it's a special column`);
        return false;
      }

      const effectiveType = getEffectiveColumnType(column);
      console.log(`Column ${column} effective type:`, effectiveType);
      return effectiveType === type;
    });

    console.log(`Columns of type ${type}:`, result);
    return result;
  };

  // Update useEffect for aggregation rules
  useEffect(() => {
    if (data.columns && Object.keys(aggregationRules).length === 0) {
      console.log('Initializing aggregation rules');
      const defaultRules = {};
      
      data.columns.forEach(column => {
        // Skip excluded columns
        if (column === data.selectedColumns?.target ||
            column === data.selectedColumns?.date ||
            data.selectedColumns?.grouping?.includes(column)) {
          console.log(`Skipping excluded column: ${column}`);
          return;
        }

        const type = getEffectiveColumnType(column);
        console.log(`Setting default aggregation for ${column} (${type})`);

        // Set default aggregation based on type
        if (type === 'numeric') {
          defaultRules[column] = 'sum';
        } else if (type === 'categorical' || type === 'binary') {
          defaultRules[column] = 'mode';
        }
      });

      console.log('Default aggregation rules:', defaultRules);
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

  // Add useEffect for data validation
  useEffect(() => {
    console.log('AggregationConfig mounted with data:', {
      hasRawData: !!data.rawData,
      columns: data.columns,
      dataClassification: data.dataClassification,
      validationResults: data.validationResults,
      selectedColumns: data.selectedColumns
    });

    // Force column type detection if missing
    if (data.rawData && (!data.validationResults?.columnAnalysis || !data.dataClassification)) {
      const columnTypes = {};
      data.columns?.forEach(column => {
        columnTypes[column] = getEffectiveColumnType(column);
      });
      console.log('Inferred column types:', columnTypes);
      
      // Update data classification if missing
      if (!data.dataClassification) {
        onUpdate({
          dataClassification: {
            userClassified: {},
            autoClassified: columnTypes
          }
        });
      }
    }
  }, [data]);

  const getAggregationSummary = () => {
    const impact = data.selectedColumns?.aggregationImpact;
    if (!impact) return null;

    return {
      originalRows: impact.originalCount,
      aggregatedRows: impact.aggregatedCount,
      reductionPercent: impact.reductionPercent
    };
  };

  const aggregationSummary = getAggregationSummary();
  return (
    <Box>
      {aggregationSummary && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            Your dataset contains:
            <ul>
              <li>{aggregationSummary.originalRows} total rows</li>
              <li>Will be aggregated to {aggregationSummary.aggregatedRows} rows at {data.selectedColumns.frequency} level</li>
              {aggregationSummary.reductionPercent > 0 && (
                <li>Data will be reduced by {aggregationSummary.reductionPercent}%</li>
              )}
            </ul>
          </Typography>
        </Alert>
      )}

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