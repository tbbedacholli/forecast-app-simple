"use client";
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Alert,
  Grid,
  Button,
  RadioGroup,
  Radio,
  FormControlLabel,
  FormControl,
  FormLabel,
  CircularProgress,
  Divider,
  TextField
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import { parse, format as formatDate } from 'date-fns';
import { parseISO } from 'date-fns/parseISO';
import { differenceInSeconds } from 'date-fns/differenceInSeconds';
import { differenceInDays } from 'date-fns/differenceInDays';
import { format } from 'date-fns/format';
import { parseFlexibleDate, formatDateForDisplay } from '../../utils/dateUtils';
import { isDateColumn, isNumericColumn } from '../../utils/columnUtils';

const FREQUENCY_MAP = {
  'daily': 'D',
  'weekly': 'W',
  'monthly': 'M',
  'quarterly': 'Q',
  'yearly': 'Y',
  // Add lowercase variants
  'w': 'W',
  'm': 'M',
  'q': 'Q',
  'y': 'Y',
  'd': 'D'
};

// Update the aggregateData function to respect data classification
const aggregateData = (data, dateCol, targetCol, idCol, frequency, dataClassification) => {
  // Group data by ID and date according to frequency
  const aggregated = {};

  // Get column types from dataClassification
  const numericColumns = new Set([
    ...dataClassification?.autoClassified?.numeric || [],
    ...dataClassification?.userClassified?.numeric || []
  ]);
  const categoricalColumns = new Set([
    ...dataClassification?.autoClassified?.categorical || [],
    ...dataClassification?.userClassified?.categorical || []
  ]);

  // Get all columns except date and id
  const otherColumns = Object.keys(data[0]).filter(col => 
    col !== dateCol && 
    col !== idCol
  );

  data.forEach(row => {
    try {
      const date = parseFlexibleDate(row[dateCol]);
      if (!date || isNaN(date.getTime())) {
        console.warn('Invalid date:', row[dateCol]);
        return;
      }

      // Generate groupKey based on frequency
      let groupKey;

      // Create grouping key based on frequency
      switch(frequency.toLowerCase()) {
        case 'w':
        case 'weekly':
          // Get Monday of the week (using UTC to avoid timezone issues)
          const dayOfWeek = date.getUTCDay();
          const diff = date.getUTCDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
          const monday = new Date(Date.UTC(
            date.getUTCFullYear(),
            date.getUTCMonth(),
            diff
          ));
          groupKey = monday.toISOString().split('T')[0];
          break;

        case 'm':
        case 'monthly':
          // First day of month
          groupKey = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-01`;
          break;

        case 'q':
        case 'quarterly':
          // First day of quarter
          const quarter = Math.floor(date.getUTCMonth() / 3);
          groupKey = `${date.getUTCFullYear()}-${String(quarter * 3 + 1).padStart(2, '0')}-01`;
          break;

        case 'y':
        case 'yearly':
          // First day of year
          groupKey = `${date.getUTCFullYear()}-01-01`;
          break;

        default: // Daily
          groupKey = new Date(Date.UTC(
            date.getUTCFullYear(),
            date.getUTCMonth(),
            date.getUTCDate()
          )).toISOString().split('T')[0];
      }

      const key = `${row[idCol]}_${groupKey}`;

      // Initialize group if not exists
      if (!aggregated[key]) {
        aggregated[key] = {
          [idCol]: row[idCol],
          [dateCol]: groupKey,
          // Initialize columns based on their type
          ...otherColumns.reduce((acc, col) => ({
            ...acc,
            [col]: numericColumns.has(col) ? 
              { sum: 0, count: 0 } : 
              { values: [] }
          }), {})
        };
      }

      // Aggregate values based on column type
      otherColumns.forEach(col => {
        const value = row[col];
        if (value == null) return;

        if (numericColumns.has(col)) {
          // Handle numeric columns
          const numValue = parseFloat(String(value).replace(/[,$]/g, ''));
          if (!isNaN(numValue)) {
            aggregated[key][col].sum += numValue;
            aggregated[key][col].count++;
          }
        } else if (categoricalColumns.has(col)) {
          // Handle categorical columns
          aggregated[key][col].values.push(value);
        }
      });

    } catch (error) {
      console.warn('Error processing row:', error, row);
    }
  });

  // Convert aggregated data to final format
  return Object.values(aggregated)
    .map(group => {
      const result = {
        [idCol]: group[idCol],
        [dateCol]: group[dateCol]
      };

      // Process each column based on its type
      otherColumns.forEach(col => {
        if (numericColumns.has(col)) {
          // Calculate mean for numeric columns
          result[col] = group[col].count > 0 ? 
            group[col].sum / group[col].count : 
            null;
        } else if (categoricalColumns.has(col)) {
          // Use mode for categorical columns
          result[col] = findMode(group[col].values);
        }
      });

      return result;
    })
    .sort((a, b) => a[dateCol].localeCompare(b[dateCol]));
};

// Helper function to find mode of array
const findMode = (arr) => {
  if (!arr.length) return null;
  
  const counts = arr.reduce((acc, val) => {
    acc[val] = (acc[val] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])[0][0];
};

export default function ValidationStep({ data, onUpdate, onNext, onBack }) {
  // Add debug check at the start
  if (process.env.NODE_ENV !== 'production') {
    console.log('ValidationStep render with data:', {
      frequency: data?.selectedColumns?.frequency,
      horizon: data?.selectedColumns?.horizon,
      date: data?.selectedColumns?.date,
      target: data?.selectedColumns?.target
    });
  }

  const [loading, setLoading] = useState(true);
  const [validationResults, setValidationResults] = useState(null);
  const [error, setError] = useState(null);
  const [criticalBreaksChoice, setCriticalBreaksChoice] = useState('');
  const [nonCriticalBreaksChoice, setNonCriticalBreaksChoice] = useState('');
  const [processing, setProcessing] = useState(false);

  // Update the useEffect hook to properly initialize with parent data
  useEffect(() => {
    const init = async () => {
      try {
        setError(null);
        setLoading(true);

        console.log('Initializing ValidationStep with full data:', data);

        // Check for required data
        if (!data?.rawData?.length) {
          throw new Error('No data available');
        }

        // Initialize selectedColumns with parent data
        if (!data.selectedColumns?.date || !data.selectedColumns?.target) {
          onUpdate({
            ...data,
            selectedColumns: {
              ...data.selectedColumns,
              date: data.date || '',
              target: data.target || '',
              frequency: data.frequency || data.selectedColumns?.frequency || '',
              horizon: data.horizon || data.selectedColumns?.horizon || '',
              level: data.selectedColumns?.level || []
            }
          });
          return; // Exit to let effect run again with updated data
        }

        // Proceed with validation if we have all required data
        if (data.selectedColumns?.date && 
            data.selectedColumns?.target && 
            data.selectedColumns?.frequency && 
            data.selectedColumns?.horizon) {
          console.log('Starting validation with complete data:', {
            date: data.selectedColumns.date,
            target: data.selectedColumns.target,
            frequency: data.selectedColumns.frequency,
            horizon: data.selectedColumns.horizon
          });
          await validateData();
        } else {
          console.warn('Missing required fields:', {
            date: data.selectedColumns?.date,
            target: data.selectedColumns?.target,
            frequency: data.selectedColumns?.frequency,
            horizon: data.selectedColumns?.horizon
          });
        }

      } catch (error) {
        console.error('Initialization error:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [data]);

  // Update the validateData function
  const validateData = async () => {
    try {
      setLoading(true);
      
      // Log validation attempt
      console.log('Starting validation with:', {
        selectedColumns: data.selectedColumns,
        rawDataLength: data?.rawData?.length
      });

      // Validate required fields
      if (!data?.selectedColumns?.frequency || !data?.selectedColumns?.horizon) {
        throw new Error('Please select forecast frequency and horizon');
      }

      // Normalize frequency case
      const userFrequency = data.selectedColumns.frequency.toLowerCase();
      const userHorizon = parseInt(data.selectedColumns.horizon, 10);

      // Check if frequency is valid using case-insensitive lookup
      if (!FREQUENCY_MAP[userFrequency]) {
        console.warn(`Invalid frequency: ${userFrequency}. Valid options:`, Object.keys(FREQUENCY_MAP));
        throw new Error(`Invalid frequency: ${userFrequency}`);
      }

      if (isNaN(userHorizon) || userHorizon < 1) {
        throw new Error('Invalid horizon value');
      }

      const validationConfig = {
        timestamp_column: data.selectedColumns.date,
        id_column: data.selectedColumns.level?.[0] || 
                  Object.keys(data.rawData[0]).find(col => col !== data.selectedColumns.date) ||
                  'row_id',
        time_granularity: FREQUENCY_MAP[userFrequency], // This will now always return the correct uppercase value
        prediction_length: userHorizon
      };

      console.log('Validation config:', validationConfig);

      // Format the data for validation
      const formattedData = data.rawData
        .map((row, index) => {
          try {
            const parsedDate = parseFlexibleDate(row[data.selectedColumns.date]);
            if (!parsedDate) {
              console.warn(`Invalid date at row ${index}:`, row[data.selectedColumns.date]);
              return null;
            }
            return {
              ...row,
              [data.selectedColumns.date]: formatDateForDisplay(parsedDate)
            };
          } catch (error) {
            console.warn(`Error processing row ${index}:`, error);
            return null;
          }
        })
        .filter(Boolean);

      if (formattedData.length === 0) {
        throw new Error('No valid data rows after date parsing');
      }

      // Make validation request
      const response = await fetch('/api/validate/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          data: formattedData, 
          config: validationConfig 
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const results = await response.json();
      console.log('Validation results:', results);

      if (!results.success) {
        throw new Error(results.error || 'Validation failed');
      }

      setValidationResults(results);
      setError(null);

    } catch (error) {
      console.error('Validation error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Update arrayToCSV function to handle undefined values
  function arrayToCSV(data) {
    const headers = Object.keys(data[0]);
    const rows = data.map(row => 
      headers.map(header => {
        const value = row[header];
        return value === undefined || value === null ? '' : value;
      })
    );
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  const analyzeTimeSeriesIntegrity = (data, config) => {
    const timestampCol = config.timestamp_column;
    const itemIdCol = 'item_id';
    const timeGranularity = config.time_granularity;
    const predictionLength = config.prediction_length;
    const requiredLength = predictionLength * 2;

    // Get date ranges
    const dates = data[timestampCol].map(d => new Date(d));
    const maxDate = new Date(Math.max(...dates));
    const minDate = new Date(Math.min(...dates));

    // Generate expected dates based on granularity
    const getDateSequence = (start, end, granularity) => {
      const dates = [];
      let current = new Date(start);
      while (current <= end) {
        dates.push(new Date(current));
        switch (granularity.toLowerCase()) {
          case 'daily':
            current.setDate(current.getDate() + 1);
            break;
          case 'weekly':
            current.setDate(current.getDate() + 7);
            break;
          case 'monthly':
            current.setMonth(current.getMonth() + 1);
            break;
          case 'quarterly':
            current.setMonth(current.getMonth() + 3);
            break;
        }
      }
      return dates;
    };

    // Analyze each series
    const uniqueSeries = [...new Set(data[itemIdCol])];
    const seriesAnalysis = uniqueSeries.map(seriesId => {
      const seriesData = data.filter(row => row[itemIdCol] === seriesId);
      const seriesDates = seriesData[timestampCol].map(d => new Date(d));
      
      // Get expected dates for this series
      const expectedDates = getDateSequence(minDate, maxDate, timeGranularity);
      
      // Find missing dates
      const missingDates = expectedDates.filter(date => 
        !seriesDates.some(d => d.getTime() === date.getTime())
      );

      // Determine if breaks are critical
      const criticalPeriodStart = new Date(maxDate);
      criticalPeriodStart.setMonth(criticalPeriodStart.getMonth() - requiredLength);

      const criticalBreaks = missingDates.filter(date => date >= criticalPeriodStart);
      const nonCriticalBreaks = missingDates.filter(date => date < criticalPeriodStart);

      return {
        seriesId,
        hasCriticalBreaks: criticalBreaks.length > 0,
        hasNonCriticalBreaks: nonCriticalBreaks.length > 0,
        criticalBreaks,
        nonCriticalBreaks,
        totalRecords: seriesData.length
      };
    });

    // Categorize series
    const category1 = seriesAnalysis.filter(s => !s.hasCriticalBreaks && !s.hasNonCriticalBreaks);
    const category2 = seriesAnalysis.filter(s => !s.hasCriticalBreaks && s.hasNonCriticalBreaks);
    const category3 = seriesAnalysis.filter(s => s.hasCriticalBreaks);

    return {
      totalSeries: uniqueSeries.length,
      category1Count: category1.length,
      category2Count: category2.length,
      category3Count: category3.length,
      seriesAnalysis,
      timeGranularity,
      predictionLength,
      requiredLength,
      dateRange: {
        min: minDate,
        max: maxDate
      }
    };
  };

  // Add processDataWithChoices function before handleSubmit
  const processDataWithChoices = (data, seriesAnalysis = [], choices = {}, config = {}) => {
    try {
      // Add debug logging
      console.log('Processing data with:', {
        hasData: !!data?.rawData,
        seriesCount: seriesAnalysis?.length,
        choices,
        config
      });

      if (!Array.isArray(seriesAnalysis)) {
        console.warn('Series analysis is not an array:', seriesAnalysis);
        return data.rawData;
      }

      let processedData = [...data.rawData];
      const dateCol = data.selectedColumns?.date;
      const targetCol = data.selectedColumns?.target;
      
      if (!dateCol) {
        console.warn('No date column specified');
        return processedData;
      }
      
      // Get all unique dates and format them consistently
      const allDates = new Set(
        processedData.map(row => parseFlexibleDate(row[dateCol]))
      );
      
      // Process series based on choices
      seriesAnalysis.forEach(series => {
        if (!series || !series.seriesId) {
          console.warn('Invalid series:', series);
          return;
        }

        const seriesId = series.seriesId;
        const seriesData = processedData.filter(row => row[config.id_column] === seriesId);
        
        // Handle critical breaks
        if (series.hasCriticalBreaks && choices.criticalBreaks) {
          if (choices.criticalBreaks === 'remove') {
            // Remove series data using filter
            const filtered = processedData.filter(row => row[config.id_column] !== seriesId);
            processedData.length = 0;
            processedData.push(...filtered);
          } else if (choices.criticalBreaks === 'fill_zeros') {
            // Generate missing dates for the series
            const seriesDates = new Set(seriesData.map(row => parseFlexibleDate(row[dateCol])));
            const latestDate = new Date(Math.max(...Array.from(seriesDates)));
            const criticalPeriodStart = new Date(latestDate);
            criticalPeriodStart.setMonth(criticalPeriodStart.getMonth() - (config.prediction_length * 2));

            // Fill gaps in critical period
            for (const date of allDates) {
              const currentDate = new Date(date);
              if (currentDate >= criticalPeriodStart && !seriesDates.has(date)) {
                processedData.push({
                  [config.id_column]: seriesId,
                  [dateCol]: date,
                  [data.selectedColumns.target]: 0
                });
              }
            }
          }
        }
        
        // Handle non-critical breaks
        if (series.hasNonCriticalBreaks && choices.nonCriticalBreaks) {
          if (choices.nonCriticalBreaks === 'remove') {
            // Remove series data using filter
            const filtered = processedData.filter(row => row[config.id_column] !== seriesId);
            processedData.length = 0;
            processedData.push(...filtered);
          } else if (choices.nonCriticalBreaks === 'fill_zeros') {
            // Generate missing dates for the series
            const seriesDates = new Set(seriesData.map((row) => parseFlexibleDate(row[dateCol])));
            const latestDate = new Date(Math.max(...Array.from(seriesDates)));
            const criticalPeriodStart = new Date(latestDate);
            criticalPeriodStart.setMonth(criticalPeriodStart.getMonth() - (config.prediction_length * 2));

            // Fill gaps in non-critical period
            for (const date of allDates) {
              const currentDate = new Date(date);
              if (currentDate < criticalPeriodStart && !seriesDates.has(date)) {
                processedData.push({
                  [config.id_column]: seriesId,
                  [dateCol]: date,
                  [data.selectedColumns.target]: 0
                });
              }
            }
          }
        }
      });

      // After all gap filling, aggregate the data based on selected frequency
      if (config.time_granularity && config.time_granularity !== 'D') {
        console.log('Aggregating data to frequency:', config.time_granularity);
        processedData = aggregateData(
          processedData,
          dateCol,
          targetCol,
          config.id_column,
          config.time_granularity,
          data.dataClassification // Pass the data classification
        );
        console.log('Data aggregated. New length:', processedData.length);
      }

      return processedData;
    } catch (error) {
      console.error('Error processing data:', error);
      throw error;
    }
  };

  // Update handleSubmit function
  const handleSubmit = async () => {
    try {
      setProcessing(true);
      
      // ... existing validation checks ...

      const selectedFrequency = data.selectedColumns?.frequency?.toLowerCase() || 'daily';
      const selectedHorizon = parseInt(data.selectedColumns?.horizon || '30', 10);

      const config = {
        timestamp_column: data.selectedColumns.date,
        id_column: data.selectedColumns.level?.[0] || 
                  Object.keys(data.rawData[0]).find(col => col !== data.selectedColumns.date) ||
                  'row_id',
        time_granularity: FREQUENCY_MAP[selectedFrequency],
        prediction_length: selectedHorizon
      };

      console.log('Processing with config:', {
        frequency: selectedFrequency,
        granularity: config.time_granularity,
        horizon: selectedHorizon
      });

      const modifiedData = processDataWithChoices(
        data,
        validationResults.seriesAnalysis,
        {
          criticalBreaks: criticalBreaksChoice,
          nonCriticalBreaks: nonCriticalBreaksChoice
        },
        config
      );

      console.log('Data processed:', {
        originalLength: data.rawData.length,
        processedLength: modifiedData.length,
        frequency: config.time_granularity
      });

      onUpdate({
        ...data,
        processedData: modifiedData,
        validationResults: validationResults
      });

      onNext();
    } catch (error) {
      console.error('Processing error:', error);
      setError(error.message);
    } finally {
      setProcessing(false);
    }
  };

  // Update the return statement to not show frequency/horizon selection if already set
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
        Data Validation
      </Typography>

      {error && (
        <Alert severity="info" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Only show frequency/horizon selection if not already set */}
      {(!data?.selectedColumns?.frequency || !data?.selectedColumns?.horizon) && !data?.frequency && !data?.horizon && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Configure Forecast Settings
            </Typography>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <FormLabel>Time Frequency</FormLabel>
              <RadioGroup
                value={data?.selectedColumns?.frequency || ''}
                onChange={(e) => {
                  onUpdate({
                    ...data,
                    selectedColumns: {
                      ...data.selectedColumns,
                      frequency: e.target.value
                    }
                  });
                }}
              >
                {Object.keys(FREQUENCY_MAP).map(freq => (
                  <FormControlLabel 
                    key={freq} 
                    value={freq} 
                    control={<Radio />} 
                    label={freq.charAt(0).toUpperCase() + freq.slice(1)} 
                  />
                ))}
              </RadioGroup>
            </FormControl>

            <FormControl fullWidth>
              <FormLabel>Forecast Horizon (periods)</FormLabel>
              <TextField
                type="number"
                value={data?.selectedColumns?.horizon || ''}
                onChange={(e) => {
                  onUpdate({
                    ...data,
                    selectedColumns: {
                      ...data.selectedColumns,
                      horizon: e.target.value
                    }
                  });
                }}
                placeholder="Enter number of periods to forecast"
                inputProps={{ min: 1 }}
                sx={{ mt: 1 }}
              />
            </FormControl>

            <Box sx={{ mt: 3 }}>
              <Button
                variant="contained"
                onClick={validateData}
                disabled={!data?.selectedColumns?.frequency || !data?.selectedColumns?.horizon}
              >
                Validate Data
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Show validation results only if we have them */}
      {validationResults ? (
        <>
          {/* Summary Card */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Summary Statistics
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircleIcon color="success" />
                    <Typography>
                      No Issues: {validationResults?.category1Count || 0} series
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WarningIcon color="warning" />
                    <Typography>
                      Non-Critical Issues: {validationResults?.category2Count || 0} series
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ErrorIcon color="error" />
                    <Typography>
                      Critical Issues: {validationResults?.category3Count || 0} series
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* User Choices */}
          {validationResults && (validationResults.category2Count > 0 || validationResults.category3Count > 0) && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3 }}>
                  Data Handling Choices
                </Typography>

                {validationResults.category3Count > 0 && (
                  <FormControl sx={{ mb: 3 }} fullWidth>
                    <FormLabel>
                      How should we handle critical gaps in your data? ({validationResults.category3Count} series affected)
                    </FormLabel>
                    <RadioGroup
                      value={criticalBreaksChoice}
                      onChange={(e) => setCriticalBreaksChoice(e.target.value)}
                    >
                      <FormControlLabel 
                        value="fill_zeros" 
                        control={<Radio />} 
                        label="Fill gaps with zeros (assume no activity)" 
                      />
                      <FormControlLabel 
                        value="remove" 
                        control={<Radio />} 
                        label="Remove affected series from analysis" 
                      />
                    </RadioGroup>
                  </FormControl>
                )}

                {validationResults.category2Count > 0 && (
                  <FormControl sx={{ mb: 3 }} fullWidth>
                    <FormLabel>
                      How should we handle non-critical gaps? ({validationResults.category2Count} series affected)
                    </FormLabel>
                    <RadioGroup
                      value={nonCriticalBreaksChoice}
                      onChange={(e) => setNonCriticalBreaksChoice(e.target.value)}
                    >
                      <FormControlLabel 
                        value="fill_zeros" 
                        control={<Radio />} 
                        label="Fill gaps with zeros" 
                      />
                      <FormControlLabel 
                        value="mark_missing" 
                        control={<Radio />} 
                        label="Mark as missing data" 
                      />
                      <FormControlLabel 
                        value="remove" 
                        control={<Radio />} 
                        label="Remove affected series" 
                      />
                    </RadioGroup>
                  </FormControl>
                )}
              </CardContent>
            </Card>
          )}

          {/* Navigation Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button onClick={onBack}>
              Back
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={processing || 
                (validationResults.category3Count > 0 && !criticalBreaksChoice) ||
                (validationResults.category2Count > 0 && !nonCriticalBreaksChoice)}
            >
              {processing ? <CircularProgress size={24} /> : "Next"}
            </Button>
          </Box>
        </>
      ) : loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : null}
    </Box>
  );
}