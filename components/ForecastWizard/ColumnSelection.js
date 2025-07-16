// components/ForecastWizard/ColumnSelection.js
'use client';
import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Grid,
  Button,
  Alert,
  Chip,
  OutlinedInput,
  ListItemText,
  Divider,
  ListSubheader
} from '@mui/material';
import { 
  Recommend,
  TrendingUp,
  DateRange,
  Category
} from '@mui/icons-material';

const frequencyOptions = [
  { value: 'H', label: 'Hourly' },
  { value: 'D', label: 'Daily' },
  { value: 'W', label: 'Weekly' },
  { value: 'M', label: 'Monthly' },
  { value: 'Q', label: 'Quarterly' },
  { value: 'Y', label: 'Yearly' }
];

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 300,
    },
  },
};

export default function ColumnSelection({ data, onUpdate, onNext, onBack, setError }) {
  const [selectedColumns, setSelectedColumns] = useState(data.selectedColumns);
  const [validation, setValidation] = useState({});

  // Get column recommendations based on data types
  const getColumnRecommendations = (targetType) => {
    if (!data.validation?.columnAnalysis) return { recommended: [], others: [] };

    const columnAnalysis = data.validation.columnAnalysis;
    const recommended = [];
    const others = [];

    Object.entries(columnAnalysis).forEach(([columnName, analysis]) => {
      if (analysis.type === targetType) {
        recommended.push(columnName);
      } else {
        others.push(columnName);
      }
    });

    return { recommended, others };
  };

  // Get recommendations for target columns (numeric only)
  const getTargetColumnRecommendations = () => {
    return getColumnRecommendations('numeric');
  };

  // Get recommendations for date columns
  const getDateColumnRecommendations = () => {
    return getColumnRecommendations('date');
  };

  // Get recommendations for level columns (categorical and binary)
  const getLevelColumnRecommendations = () => {
    if (!data.validation?.columnAnalysis) return { recommended: [], others: [] };

    const columnAnalysis = data.validation.columnAnalysis;
    const recommended = [];
    const others = [];

    Object.entries(columnAnalysis).forEach(([columnName, analysis]) => {
      if (analysis.type === 'categorical' || analysis.type === 'binary') {
        recommended.push(columnName);
      } else {
        others.push(columnName);
      }
    });

    return { recommended, others };
  };

  const handleColumnChange = (field, value) => {
    const newSelected = { ...selectedColumns, [field]: value };
    setSelectedColumns(newSelected);
    onUpdate({ selectedColumns: newSelected });
  };

  const handleLevelChange = (event) => {
    const value = event.target.value;
    const levels = Array.isArray(value) ? value : [];
    handleColumnChange('level', levels);
  };

  const handleRemoveLevel = (levelToRemove) => {
    const currentLevels = Array.isArray(selectedColumns.level) ? selectedColumns.level : [];
    const newLevels = currentLevels.filter(level => level !== levelToRemove);
    handleColumnChange('level', newLevels);
  };

  const validateSelections = () => {
    const errors = {};
    
    if (!selectedColumns.target) {
      errors.target = 'Target column is required';
    } else {
      // Validate target column is numeric
      const targetAnalysis = data.validation?.columnAnalysis[selectedColumns.target];
      if (targetAnalysis && targetAnalysis.type !== 'numeric') {
        errors.target = 'Target column must be numeric for forecasting';
      }
    }
    
    if (!selectedColumns.date) {
      errors.date = 'Date column is required';
    } else {
      // Validate date column is date type
      const dateAnalysis = data.validation?.columnAnalysis[selectedColumns.date];
      if (dateAnalysis && dateAnalysis.type !== 'date') {
        errors.date = 'Selected column does not appear to contain valid dates';
      }
    }
    
    if (!selectedColumns.frequency) {
      errors.frequency = 'Frequency is required';
    }
    
    if (!selectedColumns.horizon || selectedColumns.horizon <= 0) {
      errors.horizon = 'Forecast horizon must be greater than 0';
    }

    setValidation(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateSelections()) {
      setError('');
      onNext();
    } else {
      setError('Please fix the validation errors');
    }
  };

  const availableColumns = data.columns || [];
  const currentLevels = Array.isArray(selectedColumns.level) ? selectedColumns.level : [];
  
  const selectedColumnsFlat = [
    selectedColumns.target,
    selectedColumns.date,
    ...currentLevels
  ].filter(Boolean);

  const nonSelectedColumns = availableColumns.filter(col => 
    !selectedColumnsFlat.includes(col)
  );

  // Get recommendations for each column type
  const targetRecommendations = getTargetColumnRecommendations();
  const dateRecommendations = getDateColumnRecommendations();
  const levelRecommendations = getLevelColumnRecommendations();

  // Filter level recommendations to exclude already selected columns
  const availableLevelRecommendations = {
    recommended: levelRecommendations.recommended.filter(col => nonSelectedColumns.includes(col)),
    others: levelRecommendations.others.filter(col => nonSelectedColumns.includes(col))
  };

  const renderColumnWithRecommendation = (column, isRecommended = false) => {
    const analysis = data.validation?.columnAnalysis[column];
    return (
      <Box key={column} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {isRecommended && <Recommend color="primary" fontSize="small" />}
        <Typography>{column}</Typography>
        {analysis && (
          <Chip 
            label={analysis.type} 
            size="small" 
            color={getColumnTypeColor(analysis.type)}
          />
        )}
      </Box>
    );
  };

  const getColumnTypeColor = (type) => {
    switch (type) {
      case 'date': return 'info';
      case 'numeric': return 'success';
      case 'binary': return 'warning';
      case 'categorical': return 'secondary';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 3 }}>
        Step 2: Configure Forecast Parameters
      </Typography>

      {/* Show data quality summary */}
      {data.validation && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Data Quality:</strong> Based on validation, we've identified and ranked columns by suitability for forecasting.
            <br />
            <strong>Recommended columns are shown first</strong> with a <Recommend fontSize="small" /> icon.
          </Typography>
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Target Column */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth error={!!validation.target}>
            <InputLabel>Target Column (What to forecast)</InputLabel>
            <Select
              value={selectedColumns.target || ''}
              label="Target Column (What to forecast)"
              onChange={(e) => handleColumnChange('target', e.target.value)}
            >
              {/* Recommended numeric columns first */}
              {targetRecommendations.recommended.length > 0 && (
                <ListSubheader sx={{ bgcolor: '#e3f2fd', fontWeight: 600 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingUp color="primary" fontSize="small" />
                    Recommended (Numeric Columns)
                  </Box>
                </ListSubheader>
              )}
              {targetRecommendations.recommended.map((column) => (
                <MenuItem key={column} value={column}>
                  {renderColumnWithRecommendation(column, true)}
                </MenuItem>
              ))}
              
              {/* Other columns */}
              {targetRecommendations.others.length > 0 && (
                <>
                  {targetRecommendations.recommended.length > 0 && <Divider />}
                  <ListSubheader sx={{ bgcolor: '#f5f5f5' }}>
                    Other Columns
                  </ListSubheader>
                  {targetRecommendations.others.map((column) => (
                    <MenuItem key={column} value={column}>
                      {renderColumnWithRecommendation(column, false)}
                    </MenuItem>
                  ))}
                </>
              )}
            </Select>
            {validation.target && (
              <Typography variant="caption" color="error">
                {validation.target}
              </Typography>
            )}
          </FormControl>
        </Grid>

        {/* Date Column */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth error={!!validation.date}>
            <InputLabel>Date Column (Time series column)</InputLabel>
            <Select
              value={selectedColumns.date || ''}
              label="Date Column (Time series column)"
              onChange={(e) => handleColumnChange('date', e.target.value)}
            >
              {/* Recommended date columns first */}
              {dateRecommendations.recommended.length > 0 && (
                <ListSubheader sx={{ bgcolor: '#e3f2fd', fontWeight: 600 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DateRange color="primary" fontSize="small" />
                    Recommended (Date Columns)
                  </Box>
                </ListSubheader>
              )}
              {dateRecommendations.recommended.map((column) => (
                <MenuItem key={column} value={column}>
                  {renderColumnWithRecommendation(column, true)}
                </MenuItem>
              ))}
              
              {/* Other columns */}
              {dateRecommendations.others.length > 0 && (
                <>
                  {dateRecommendations.recommended.length > 0 && <Divider />}
                  <ListSubheader sx={{ bgcolor: '#f5f5f5' }}>
                    Other Columns
                  </ListSubheader>
                  {dateRecommendations.others.map((column) => (
                    <MenuItem key={column} value={column}>
                      {renderColumnWithRecommendation(column, false)}
                    </MenuItem>
                  ))}
                </>
              )}
            </Select>
            {validation.date && (
              <Typography variant="caption" color="error">
                {validation.date}
              </Typography>
            )}
          </FormControl>
        </Grid>

        {/* Level Columns */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Level Columns (Multi-select)</InputLabel>
            <Select
              multiple
              value={currentLevels}
              onChange={handleLevelChange}
              input={<OutlinedInput label="Level Columns (Multi-select)" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip 
                      key={value} 
                      label={value} 
                      size="small" 
                      onDelete={() => handleRemoveLevel(value)}
                      onMouseDown={(event) => {
                        event.stopPropagation();
                      }}
                    />
                  ))}
                </Box>
              )}
              MenuProps={MenuProps}
            >
              {/* Recommended categorical/binary columns first */}
              {availableLevelRecommendations.recommended.length > 0 && (
                <ListSubheader sx={{ bgcolor: '#e3f2fd', fontWeight: 600 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Category color="primary" fontSize="small" />
                    Recommended (Categorical/Binary)
                  </Box>
                </ListSubheader>
              )}
              {availableLevelRecommendations.recommended.map((column) => (
                <MenuItem 
                  key={column} 
                  value={column}
                  sx={{
                    backgroundColor: currentLevels.includes(column) ? 'rgba(25, 118, 210, 0.12)' : 'inherit',
                    '&:hover': {
                      backgroundColor: currentLevels.includes(column) ? 'rgba(25, 118, 210, 0.2)' : 'rgba(0, 0, 0, 0.04)',
                    }
                  }}
                >
                  <ListItemText primary={renderColumnWithRecommendation(column, true)} />
                </MenuItem>
              ))}
              
              {/* Other columns */}
              {availableLevelRecommendations.others.length > 0 && (
                <>
                  {availableLevelRecommendations.recommended.length > 0 && <Divider />}
                  <ListSubheader sx={{ bgcolor: '#f5f5f5' }}>
                    Other Columns
                  </ListSubheader>
                  {availableLevelRecommendations.others.map((column) => (
                    <MenuItem 
                      key={column} 
                      value={column}
                      sx={{
                        backgroundColor: currentLevels.includes(column) ? 'rgba(25, 118, 210, 0.12)' : 'inherit',
                        '&:hover': {
                          backgroundColor: currentLevels.includes(column) ? 'rgba(25, 118, 210, 0.2)' : 'rgba(0, 0, 0, 0.04)',
                        }
                      }}
                    >
                      <ListItemText primary={renderColumnWithRecommendation(column, false)} />
                    </MenuItem>
                  ))}
                </>
              )}
            </Select>
            <Typography variant="caption" color="textSecondary" sx={{ mt: 1 }}>
              Select columns to group forecasts by (e.g., product, region, category)
            </Typography>
          </FormControl>
        </Grid>

        {/* Frequency */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth error={!!validation.frequency}>
            <InputLabel>Forecast Frequency</InputLabel>
            <Select
              value={selectedColumns.frequency || ''}
              label="Forecast Frequency"
              onChange={(e) => handleColumnChange('frequency', e.target.value)}
            >
              {frequencyOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
            {validation.frequency && (
              <Typography variant="caption" color="error">
                {validation.frequency}
              </Typography>
            )}
          </FormControl>
        </Grid>

        {/* Horizon */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Forecast Horizon"
            type="number"
            value={selectedColumns.horizon || ''}
            onChange={(e) => handleColumnChange('horizon', parseInt(e.target.value) || 0)}
            error={!!validation.horizon}
            helperText={validation.horizon || 'Number of periods to forecast'}
          />
        </Grid>
      </Grid>

      {/* Selection Summary */}
      {(selectedColumns.target || selectedColumns.date || currentLevels.length > 0) && (
        <Alert severity="success" sx={{ mt: 3 }}>
          <Typography variant="body2">
            <strong>Current Selection:</strong>
            <br />
            {selectedColumns.target && `Target: ${selectedColumns.target} (${data.validation?.columnAnalysis[selectedColumns.target]?.type || 'unknown'})`}
            <br />
            {selectedColumns.date && `Date: ${selectedColumns.date} (${data.validation?.columnAnalysis[selectedColumns.date]?.type || 'unknown'})`}
            <br />
            {currentLevels.length > 0 && `Levels: ${currentLevels.join(', ')}`}
          </Typography>
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button onClick={onBack}>
          Back
        </Button>
        <Button variant="contained" onClick={handleNext}>
          Next: Data Classification
        </Button>
      </Box>
    </Box>
  );
}