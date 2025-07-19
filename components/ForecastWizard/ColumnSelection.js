// components/ForecastWizard/ColumnSelection.js
'use client';
import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField, // ✅ Add this import
  Alert,
  Chip,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip
} from '@mui/material';

// Individual icon imports
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CategoryIcon from '@mui/icons-material/Category';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import DataUsageIcon from '@mui/icons-material/DataUsage';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SettingsIcon from '@mui/icons-material/Settings';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';

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

export default function ColumnSelection({ data, onUpdate, onNext, onBack }) {
  const [selectedColumns, setSelectedColumns] = useState({
    target: '',
    date: '',
    grouping: [],
    frequency: '', // ✅ Add forecast frequency
    horizon: 30   // ✅ Add forecast horizon (default 30 periods)
  });

  const [validationErrors, setValidationErrors] = useState([]);

  // Initialize with existing selections if available
  useEffect(() => {
    if (data.selectedColumns) {
      setSelectedColumns({
        target: data.selectedColumns.target || '',
        date: data.selectedColumns.date || '',
        grouping: data.selectedColumns.grouping || [],
        frequency: data.selectedColumns.frequency || '', // ✅ Add frequency
        horizon: data.selectedColumns.horizon || 30 // ✅ Add horizon
      });
    }
  }, [data.selectedColumns]);

  // Get columns by type from validation results
  const getColumnsByType = (type) => {
    if (!data.validationResults?.columnAnalysis) return [];
    
    return Object.entries(data.validationResults.columnAnalysis)
      .filter(([, analysis]) => analysis.type === type)
      .map(([columnName]) => columnName);
  };

  const getColumnInfo = (columnName) => {
    return data.validationResults?.columnAnalysis?.[columnName] || {};
  };

  const getColumnTypeIcon = (type) => {
    switch (type) {
      case 'date': return <CalendarTodayIcon fontSize="small" />;
      case 'numeric': return <TrendingUpIcon fontSize="small" />;
      case 'categorical': return <CategoryIcon fontSize="small" />;
      case 'binary': return <DataUsageIcon fontSize="small" />;
      default: return <InfoIcon fontSize="small" />;
    }
  };

  const getColumnTypeColor = (type) => {
    switch (type) {
      case 'date': return 'info';
      case 'numeric': return 'success';
      case 'categorical': return 'secondary';
      case 'binary': return 'warning';
      default: return 'default';
    }
  };

  const handleColumnChange = (columnType, value) => {
    console.log('🎯 handleColumnChange called:', { columnType, value });
    const newSelection = { ...selectedColumns, [columnType]: value };
    console.log('📝 New selection:', newSelection);
    
    setSelectedColumns(newSelection);
    validateSelection(newSelection);
  };

  const validateSelection = (selection) => {
    const errors = [];
    
    if (!selection.target) {
      errors.push('Target column is required for forecasting');
    }
    
    if (!selection.date) {
      errors.push('Date column is required for time series forecasting');
    }
    
    if (!selection.frequency) {
      errors.push('Forecast frequency is required');
    }
    
    if (!selection.horizon || selection.horizon < 1) {
      errors.push('Forecast horizon must be at least 1 period');
    }
    
    // Check for overlapping selections (updated for array grouping)
    const allSelected = [
      selection.target, 
      selection.date, 
      ...(selection.grouping || [])
    ].filter(Boolean);
    
    const uniqueSelected = new Set(allSelected);
    if (allSelected.length !== uniqueSelected.size) {
      errors.push('The same column cannot be used for multiple purposes');
    }
    
    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleNext = () => {
    if (validateSelection(selectedColumns)) {
      onUpdate({ selectedColumns });
      onNext();
    }
  };

  const getSelectionSummary = () => {
    const selected = selectedColumns;
    return {
      target: selected.target || 'Not selected',
      date: selected.date || 'Not selected',
      grouping: (selected.grouping || []).length > 0 
        ? `${selected.grouping.length} selected` 
        : 'None',
      frequency: selected.frequency || 'Not selected',
      horizon: selected.horizon || 'Not set'
    };
  };

  // Update the getAllColumnsWithRecommendations function and add debugging:
  const getAllColumnsWithRecommendations = (recommendedType) => {
    console.log('🔍 getAllColumnsWithRecommendations called with:', recommendedType);
    console.log('📊 data.columns:', data.columns);
    console.log('📋 data.validationResults?.columnAnalysis:', data.validationResults?.columnAnalysis);
    
    if (!data.columns) {
      console.log('❌ No data.columns found');
      return { recommended: [], others: [] };
    }
    
    const recommendedColumns = getColumnsByType(recommendedType);
    console.log(`✅ Recommended ${recommendedType} columns:`, recommendedColumns);
    
    const otherColumns = data.columns.filter(col => !recommendedColumns.includes(col));
    console.log(`📋 Other columns:`, otherColumns);
    
    return {
      recommended: recommendedColumns,
      others: otherColumns
    };
  };

  return (
    <Box>
      {/* Page Title - h5 for main page titles */}
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
        Step 2: Select Columns for Forecasting
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Configure your forecasting model by selecting the appropriate columns.</strong>
          <br />
          Choose your target variable, date column, and relevant features for accurate predictions.
        </Typography>
      </Alert>

      {/* Selection Overview Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <SettingsIcon color="primary" />
            {/* Card titles - h6 consistently */}
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Column Configuration
            </Typography>
          </Box>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                <Chip 
                  icon={<TrendingUpIcon />} 
                  label={`Target: ${getSelectionSummary().target}`} 
                  variant="outlined" 
                  color="primary"
                />
                <Chip 
                  icon={<CalendarTodayIcon />} 
                  label={`Date: ${getSelectionSummary().date}`} 
                  variant="outlined" 
                  color="info"
                />
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                <Chip 
                  icon={<CategoryIcon />} 
                  label={`Grouping: ${getSelectionSummary().grouping}`} 
                  variant="outlined" 
                  color="secondary"
                />
                <Chip 
                  icon={<DataUsageIcon />} 
                  label={`Total Columns: ${data.columns?.length || 0}`} 
                  variant="outlined" 
                  color="default"
                />
                <Chip 
                  icon={<AutoGraphIcon />} 
                  label={`Frequency: ${getSelectionSummary().frequency}`} 
                  variant="outlined" 
                  color="warning"
                />
                <Chip 
                  icon={<TrendingUpIcon />} 
                  label={`Horizon: ${getSelectionSummary().horizon} periods`} 
                  variant="outlined" 
                  color="success"
                />
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Column Selection Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Target Column Selection */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <TrendingUpIcon color="primary" />
                {/* Section titles - h6 consistently */}
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Target Column
                </Typography>
                <Chip label="Required" size="small" color="error" />
              </Box>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Select Target Column</InputLabel>
                <Select
                  value={selectedColumns.target}
                  onChange={(e) => handleColumnChange('target', e.target.value)}
                  label="Select Target Column"
                >
                  {/* Recommended Numeric Columns */}
                  {getColumnsByType('numeric').length > 0 && (
                    <MenuItem disabled key="numeric-header">
                      <Typography variant="caption" sx={{ fontWeight: 600, color: 'success.main' }}>
                        📊 RECOMMENDED (Numeric)
                      </Typography>
                    </MenuItem>
                  )}
                  {getColumnsByType('numeric').map((column) => (
                    <MenuItem key={column} value={column}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                        <TrendingUpIcon fontSize="small" color="success" />
                        <Typography variant="body1">{column}</Typography>
                        <Chip 
                          label={`${(getColumnInfo(column).confidence * 100).toFixed(0)}%`} 
                          size="small" 
                          variant="outlined"
                          color="success"
                        />
                      </Box>
                    </MenuItem>
                  ))}
                  
                  {/* Divider if there are recommended columns */}
                  {getColumnsByType('numeric').length > 0 && (
                    <MenuItem disabled key="divider-1">
                      <Divider sx={{ width: '100%' }} />
                    </MenuItem>
                  )}
                  
                  {/* Other Columns */}
                  <MenuItem disabled key="other-header">
                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                      📋 OTHER COLUMNS
                    </Typography>
                  </MenuItem>
                  {data.columns
                    .filter(col => !getColumnsByType('numeric').includes(col))
                    .map((column) => (
                      <MenuItem key={column} value={column}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                          <InfoIcon fontSize="small" color="action" />
                          <Typography variant="body1">{column}</Typography>
                          <Chip 
                            label={getColumnInfo(column).type || 'Unknown'} 
                            size="small" 
                            variant="outlined"
                            color="default"
                          />
                        </Box>
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>

              {/* Description text - body2 consistently */}
              <Typography variant="body2" color="textSecondary">
                The variable you want to predict. Numeric columns are recommended, but you can select any column.
              </Typography>

              {selectedColumns.target && (
                <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                  {/* Selected info - caption consistently */}
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                    Selected: {selectedColumns.target}
                  </Typography>
                  <br />
                  <Typography variant="caption">
                    Type: {getColumnInfo(selectedColumns.target).type || 'Unknown'} | 
                    Confidence: {getColumnInfo(selectedColumns.target).confidence ? 
                      `${(getColumnInfo(selectedColumns.target).confidence * 100).toFixed(0)}%` : 'N/A'}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Date Column Selection */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <CalendarTodayIcon color="info" />
                {/* Section titles - h6 consistently */}
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Date Column
                </Typography>
                <Chip label="Required" size="small" color="error" />
              </Box>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Select Date Column</InputLabel>
                <Select
                  value={selectedColumns.date}
                  onChange={(e) => handleColumnChange('date', e.target.value)}
                  label="Select Date Column"
                >
                  {/* Recommended Date Columns */}
                  {getColumnsByType('date').length > 0 && (
                    <MenuItem disabled key="date-header">
                      <Typography variant="caption" sx={{ fontWeight: 600, color: 'info.main' }}>
                        📅 RECOMMENDED (Date)
                      </Typography>
                    </MenuItem>
                  )}
                  {getColumnsByType('date').map((column) => (
                    <MenuItem key={column} value={column}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                        <CalendarTodayIcon fontSize="small" color="info" />
                        <Typography variant="body1">{column}</Typography>
                        <Chip 
                          label={`${(getColumnInfo(column).confidence * 100).toFixed(0)}%`} 
                          size="small" 
                          variant="outlined"
                          color="info"
                        />
                      </Box>
                    </MenuItem>
                  ))}
                  
                  {/* Divider if there are recommended columns */}
                  {getColumnsByType('date').length > 0 && (
                    <MenuItem disabled key="divider-2">
                      <Divider sx={{ width: '100%' }} />
                    </MenuItem>
                  )}
                  
                  {/* Other Columns */}
                  <MenuItem disabled key="other-date-header">
                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                      📋 OTHER COLUMNS
                    </Typography>
                  </MenuItem>
                  {data.columns
                    .filter(col => !getColumnsByType('date').includes(col))
                    .map((column) => (
                      <MenuItem key={column} value={column}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                          <InfoIcon fontSize="small" color="action" />
                          <Typography variant="body1">{column}</Typography>
                          <Chip 
                            label={getColumnInfo(column).type || 'Unknown'} 
                            size="small" 
                            variant="outlined"
                            color="default"
                          />
                        </Box>
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>

              {/* Description text - body2 consistently */}
              <Typography variant="body2" color="textSecondary">
                The time dimension for your forecast. Date columns are recommended, but you can select any column.
              </Typography>

              {selectedColumns.date && (
                <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                  {/* Selected info - caption consistently */}
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                    Selected: {selectedColumns.date}
                  </Typography>
                  <br />
                  <Typography variant="caption">
                    Type: {getColumnInfo(selectedColumns.date).type || 'Unknown'} | 
                    Confidence: {getColumnInfo(selectedColumns.date).confidence ? 
                      `${(getColumnInfo(selectedColumns.date).confidence * 100).toFixed(0)}%` : 'N/A'}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Grouping Column Selection */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <CategoryIcon color="secondary" />
                {/* Section titles - h6 consistently */}
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Grouping Columns
                </Typography>
                <Chip label="Optional" size="small" color="success" />
              </Box>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Select Grouping Columns</InputLabel>
                <Select
                  multiple
                  value={selectedColumns.grouping || []}
                  onChange={(e) => handleColumnChange('grouping', e.target.value)}
                  label="Select Grouping Columns"
                  MenuProps={MenuProps}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip 
                          key={value} 
                          label={value} 
                          size="small" 
                          color="secondary"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  )}
                >
                  {/* Recommended Categorical/Binary Columns */}
                  {[...getColumnsByType('categorical'), ...getColumnsByType('binary')].length > 0 && (
                    <MenuItem disabled key="grouping-header">
                      <Typography variant="caption" sx={{ fontWeight: 600, color: 'secondary.main' }}>
                        🏷️ RECOMMENDED (Categorical/Binary)
                      </Typography>
                    </MenuItem>
                  )}
                  {[...getColumnsByType('categorical'), ...getColumnsByType('binary')].map((column) => (
                    <MenuItem key={column} value={column}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                        {getColumnTypeIcon(getColumnInfo(column).type)}
                        <Typography variant="body1">{column}</Typography>
                        <Chip 
                          label={getColumnInfo(column).type} 
                          size="small" 
                          color={getColumnTypeColor(getColumnInfo(column).type)}
                        />
                        <Box sx={{ flexGrow: 1 }} />
                        {(selectedColumns.grouping || []).includes(column) && (
                          <CheckCircleIcon color="success" fontSize="small" />
                        )}
                      </Box>
                    </MenuItem>
                  ))}
                  
                  {/* Divider if there are recommended columns */}
                  {[...getColumnsByType('categorical'), ...getColumnsByType('binary')].length > 0 && (
                    <MenuItem disabled key="divider-3">
                      <Divider sx={{ width: '100%' }} />
                    </MenuItem>
                  )}
                  
                  {/* Other Columns */}
                  <MenuItem disabled key="other-grouping-header">
                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                      📋 OTHER COLUMNS
                    </Typography>
                  </MenuItem>
                  {data.columns
                    .filter(col => ![...getColumnsByType('categorical'), ...getColumnsByType('binary')].includes(col))
                    .map((column) => (
                      <MenuItem key={column} value={column}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                          <InfoIcon fontSize="small" color="action" />
                          <Typography variant="body1">{column}</Typography>
                          <Chip 
                            label={getColumnInfo(column).type || 'Unknown'} 
                            size="small" 
                            variant="outlined"
                            color="default"
                          />
                          <Box sx={{ flexGrow: 1 }} />
                          {(selectedColumns.grouping || []).includes(column) && (
                            <CheckCircleIcon color="success" fontSize="small" />
                          )}
                        </Box>
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>

              {/* Description text - body2 consistently */}
              <Typography variant="body2" color="textSecondary">
                Group forecasts by categories. Categorical/binary columns are recommended, but you can select any column.
              </Typography>

              {selectedColumns.grouping && selectedColumns.grouping.length > 0 && (
                <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                    Selected Grouping Columns ({selectedColumns.grouping.length}):
                  </Typography>
                  <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {selectedColumns.grouping.map((column) => (
                      <Chip
                        key={column}
                        label={`${column} (${getColumnInfo(column).type || 'Unknown'})`}
                        size="small"
                        color="secondary"
                        variant="filled"
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Forecast Configuration */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <AutoGraphIcon color="warning" />
                {/* Section titles - h6 consistently */}
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Forecast Frequency
                </Typography>
                <Chip label="Required" size="small" color="error" />
              </Box>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Select Forecast Frequency</InputLabel>
                <Select
                  value={selectedColumns.frequency}
                  onChange={(e) => handleColumnChange('frequency', e.target.value)}
                  label="Select Forecast Frequency"
                >
                  {frequencyOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                        <AutoGraphIcon fontSize="small" color="warning" />
                        {/* Menu item text - body1 consistently */}
                        <Typography variant="body1">{option.label}</Typography>
                        <Chip 
                          label={option.value} 
                          size="small" 
                          variant="outlined"
                          color="warning"
                        />
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Description text - body2 consistently */}
              <Typography variant="body2" color="textSecondary">
                How often do you want to generate forecasts? This should match your data's time intervals.
              </Typography>

              {selectedColumns.frequency && (
                <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                  {/* Selected info - caption consistently */}
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                    Selected: {frequencyOptions.find(opt => opt.value === selectedColumns.frequency)?.label}
                  </Typography>
                  <br />
                  <Typography variant="caption">
                    Code: {selectedColumns.frequency}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Forecast Horizon */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <TrendingUpIcon color="success" />
                {/* Section titles - h6 consistently */}
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Forecast Horizon
                </Typography>
                <Chip label="Required" size="small" color="error" />
              </Box>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <TextField
                  type="number"
                  label="Number of Periods to Forecast"
                  value={selectedColumns.horizon}
                  onChange={(e) => handleColumnChange('horizon', parseInt(e.target.value) || 30)}
                  inputProps={{ min: 1, max: 365 }}
                  fullWidth
                />
              </FormControl>

              {/* Description text - body2 consistently */}
              <Typography variant="body2" color="textSecondary">
                How many time periods ahead do you want to forecast? (e.g., 30 days, 12 months)
              </Typography>

              {selectedColumns.horizon && (
                <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                  {/* Selected info - caption consistently */}
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                    Forecast Horizon: {selectedColumns.horizon} periods
                  </Typography>
                  <br />
                  <Typography variant="caption">
                    {selectedColumns.frequency && `= ${selectedColumns.horizon} ${frequencyOptions.find(opt => opt.value === selectedColumns.frequency)?.label.toLowerCase()}`}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
            Please fix the following issues:
          </Typography>
          <List dense>
            {validationErrors.map((error, index) => (
              <ListItem key={index} sx={{ py: 0 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <WarningIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText 
                  primary={error}
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
            ))}
          </List>
        </Alert>
      )}

      {/* Navigation */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button
          onClick={onBack}
          size="large"
          sx={{ px: 4, py: 1.5 }}
        >
          <Typography variant="button">Back: Upload Data</Typography>
        </Button>
        
        <Button
          variant="contained"
          onClick={handleNext}
          disabled={validationErrors.length > 0}
          size="large"
          sx={{
            px: 4,
            py: 1.5,
            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
            boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
            '&:hover': {
              background: 'linear-gradient(45deg, #1976D2 30%, #1BA8D9 90%)',
            }
          }}
        >
          <Typography variant="button">Next: Training Configuration</Typography>
        </Button>
      </Box>
    </Box>
  );
}