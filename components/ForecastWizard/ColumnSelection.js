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
  ListItemText
} from '@mui/material';

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
      width: 250,
    },
  },
};

export default function ColumnSelection({ data, onUpdate, onNext, onBack, setError }) {
  const [selectedColumns, setSelectedColumns] = useState(data.selectedColumns);
  const [validation, setValidation] = useState({});

  const handleColumnChange = (field, value) => {
    const newSelected = { ...selectedColumns, [field]: value };
    setSelectedColumns(newSelected);
    onUpdate({ selectedColumns: newSelected });
  };

  const handleLevelChange = (event) => {
    const value = event.target.value;
    // Ensure value is always an array
    const levels = Array.isArray(value) ? value : [];
    handleColumnChange('level', levels);
  };

  // Function to remove a specific level column
  const handleRemoveLevel = (levelToRemove) => {
    const currentLevels = Array.isArray(selectedColumns.level) ? selectedColumns.level : [];
    const newLevels = currentLevels.filter(level => level !== levelToRemove);
    handleColumnChange('level', newLevels);
  };

  const validateSelections = () => {
    const errors = {};
    
    if (!selectedColumns.target) {
      errors.target = 'Target column is required';
    }
    
    if (!selectedColumns.date) {
      errors.date = 'Date column is required';
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

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 3 }}>
        Step 2: Configure Forecast Parameters
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth error={!!validation.target}>
            <InputLabel>Target Column (What to forecast)</InputLabel>
            <Select
              value={selectedColumns.target || ''}
              label="Target Column (What to forecast)"
              onChange={(e) => handleColumnChange('target', e.target.value)}
            >
              {availableColumns.map((column) => (
                <MenuItem key={column} value={column}>
                  {column}
                </MenuItem>
              ))}
            </Select>
            {validation.target && (
              <Typography variant="caption" color="error">
                {validation.target}
              </Typography>
            )}
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth error={!!validation.date}>
            <InputLabel>Date Column (Which is the time series column)</InputLabel>
            <Select
              value={selectedColumns.date || ''}
              label="Date Column (Which is the time series column)"
              onChange={(e) => handleColumnChange('date', e.target.value)}
            >
              {availableColumns.map((column) => (
                <MenuItem key={column} value={column}>
                  {column}
                </MenuItem>
              ))}
            </Select>
            {validation.date && (
              <Typography variant="caption" color="error">
                {validation.date}
              </Typography>
            )}
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Level Columns (What is the grain of the forecast - Multi-select)</InputLabel>
            <Select
              multiple
              value={currentLevels}
              onChange={handleLevelChange}
              input={<OutlinedInput label="Level Columns (What is the grain of the forecast - Multi-select)" />}
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
              {nonSelectedColumns.map((column) => (
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
                  <ListItemText primary={column} />
                </MenuItem>
              ))}
            </Select>
            <Typography variant="caption" color="textSecondary" sx={{ mt: 1 }}>
              Select columns to group forecasts by (e.g., product, region, category)
            </Typography>
          </FormControl>
        </Grid>

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

      {/* Selected Levels Summary */}
      {currentLevels.length > 0 && (
        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="body2">
            <strong>Selected Level Columns:</strong> {currentLevels.join(', ')}
            <br />
            Forecasts will be generated for each unique combination of these levels.
            <br />
            <em>Tip: Click the X on any chip above to remove it, or click items in the dropdown to toggle selection.</em>
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