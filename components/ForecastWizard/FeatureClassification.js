// components/ForecastWizard/FeatureClassification.js
'use client';
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Button,
  Alert,
  Card,
  CardContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  FormControlLabel,
  Divider,
  ListSubheader,
  IconButton,
  Tooltip,
  LinearProgress
} from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import TimelineIcon from '@mui/icons-material/Timeline';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import InfoIcon from '@mui/icons-material/Info';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import DownloadIcon from '@mui/icons-material/Download';

const FEATURE_ROLES = [
  { 
    value: 'entity_property', 
    label: 'Entity Property', 
    description: 'Static attributes (e.g., product category, region)', 
    icon: <BusinessIcon />
  },
  { 
    value: 'dynamic_feature', 
    label: 'Dynamic Feature', 
    description: 'Time-varying features (e.g., price, promotions)', 
    icon: <TimelineIcon />
  },
  { 
    value: 'future_feature', 
    label: 'Future Feature', 
    description: 'Known future values (e.g., holidays, planned events)', 
    icon: <AnalyticsIcon />
  },
  { 
    value: 'ignore', 
    label: 'Ignore', 
    description: 'Exclude from modeling', 
    icon: null 
  }
];

export default function FeatureClassification({ data, onUpdate, onNext, onBack, setError }) {
  const [featureClassification, setFeatureClassification] = useState({});
  const [futureValues, setFutureValues] = useState({}); // Add this state
  const [autoClassified, setAutoClassified] = useState(new Set());
  const [selectedFutureFeatures, setSelectedFutureFeatures] = useState([]); // Add missing state variable
  
  // Add these new state variables for future values file upload
  const [futureValuesFile, setFutureValuesFile] = useState(null);
  const [futureFileValidation, setFutureFileValidation] = useState(null);
  const [uploadingFutureFile, setUploadingFutureFile] = useState(false);

  // Initialize feature classification based on data types and selected columns
  useEffect(() => {
    if (data.dataClassification && Object.keys(featureClassification).length === 0) {
      const initialClassification = {};
      
      // Get selected columns (target, date, levels)
      const selectedColumns = [
        data.selectedColumns?.target,
        data.selectedColumns?.date,
        ...(data.selectedColumns?.level || [])
      ].filter(Boolean);

      // Classify each column
      Object.entries(data.dataClassification).forEach(([columnName, dataType]) => {
        if (columnName === data.selectedColumns?.target) {
          initialClassification[columnName] = 'target'; // Special case
        } else if (columnName === data.selectedColumns?.date) {
          initialClassification[columnName] = 'date'; // Special case
        } else if (data.selectedColumns?.level?.includes(columnName)) {
          initialClassification[columnName] = 'entity_property'; // Level columns are entity properties
        } else {
          // Auto-classify based on data type
          if (dataType === 'categorical' || dataType === 'binary') {
            initialClassification[columnName] = 'entity_property';
          } else if (dataType === 'numeric') {
            initialClassification[columnName] = 'dynamic_feature';
          } else {
            initialClassification[columnName] = 'ignore';
          }
        }
      });
      
      setFeatureClassification(initialClassification);
      
      // Update parent component
      onUpdate({ 
        featureClassification: {
          ...data.featureClassification,
          columnRoles: initialClassification
        }
      });
    }
  }, [data.dataClassification, data.selectedColumns, onUpdate]);

  const handleRoleChange = (column, newRole) => {
    const updated = { ...featureClassification, [column]: newRole };
    setFeatureClassification(updated);
    
    // If role is changed to future_feature, automatically enable future values
    if (newRole === 'future_feature') {
      setFutureValues(prev => ({ ...prev, [column]: true }));
    } else if (newRole === 'ignore') {
      // If role is changed to ignore, disable future values
      setFutureValues(prev => ({ ...prev, [column]: false }));
    }
    
    onUpdate({ 
      featureClassification: {
        ...data.featureClassification,
        columnRoles: updated
      },
      futureValues
    });
  };

  const handleFutureFeatureToggle = (column) => {
    let newSelectedFutureFeatures;
    if (selectedFutureFeatures.includes(column)) {
      newSelectedFutureFeatures = selectedFutureFeatures.filter(f => f !== column);
    } else {
      newSelectedFutureFeatures = [...selectedFutureFeatures, column];
    }
    
    setSelectedFutureFeatures(newSelectedFutureFeatures);
    
    onUpdate({ 
      featureClassification: {
        ...data.featureClassification,
        selectedFutureFeatures: newSelectedFutureFeatures
      }
    });
  };

  // Add handler for future values
  const handleFutureValueChange = (column, canProvide) => {
    const newFutureValues = { ...futureValues, [column]: canProvide };
    setFutureValues(newFutureValues);
    
    // Update parent component
    onUpdate({
      ...data,
      futureValues: newFutureValues,
      featureClassification: {
        ...data.featureClassification,
        selectedFutureFeatures: Object.keys(newFutureValues).filter(col => newFutureValues[col])
      }
    });
  };

  const validateClassification = () => {
    const missingColumns = data.columns.filter(col => !featureClassification[col]);
    
    if (missingColumns.length > 0) {
      setError(`Please classify all columns: ${missingColumns.join(', ')}`);
      return false;
    }
    
    // Check if we have at least one dynamic feature or entity property
    const hasFeatures = Object.values(featureClassification).some(role => 
      role === 'dynamic_feature' || role === 'entity_property'
    );
    
    if (!hasFeatures) {
      setError('Please select at least one feature column (dynamic feature or entity property)');
      return false;
    }
    
    setError('');
    return true;
  };

  // Update the handleNext function to include future values
  const handleNext = () => {
    const missingClassifications = data.columns.filter(col => 
      !featureClassification[col] || featureClassification[col] === ''
    );

    if (missingClassifications.length > 0) {
      setError(`Please classify all columns. Missing: ${missingClassifications.join(', ')}`);
      return;
    }

    // Include future values in the data passed to next step
    onUpdate({
      ...data,
      featureClassification: {
        ...data.featureClassification,
        columnRoles: featureClassification,
        selectedFutureFeatures: Object.keys(futureValues).filter(col => futureValues[col])
      },
      futureValues
    });
    onNext();
  };

  // Update auto-classification to also set future values
  const handleAutoClassify = () => {
    if (!data.validation?.columnAnalysis) return;

    const newClassification = {};
    const newFutureValues = {};
    const newAutoClassified = new Set();

    Object.entries(data.validation.columnAnalysis).forEach(([column, analysis]) => {
      let role = 'entity_property'; // default
      let canProvideFuture = false;

      // Auto-classify based on data type and column name
      if (analysis.type === 'date') {
        role = 'dynamic_feature';
        canProvideFuture = true; // Dates can often be provided in advance
      } else if (analysis.type === 'numeric') {
        // Check if it's likely a target variable
        const targetWords = ['target', 'revenue', 'sales', 'demand', 'volume', 'count', 'amount'];
        if (targetWords.some(word => column.toLowerCase().includes(word))) {
          role = 'dynamic_feature';
          canProvideFuture = false; // Target variables typically can't be provided in advance
        } else {
          role = 'dynamic_feature';
          canProvideFuture = false;
        }
      } else if (analysis.type === 'categorical' || analysis.type === 'binary') {
        role = 'entity_property';
        canProvideFuture = true; // Static properties can usually be provided
      } else {
        role = 'ignore';
        canProvideFuture = false;
      }

      // Check for future-known features
      const futureWords = ['holiday', 'season', 'promotion', 'campaign', 'planned', 'scheduled'];
      if (futureWords.some(word => column.toLowerCase().includes(word))) {
        role = 'future_feature';
        canProvideFuture = true;
      }

      newClassification[column] = role;
      newFutureValues[column] = canProvideFuture;
      newAutoClassified.add(column);
    });

    setFeatureClassification(newClassification);
    setFutureValues(newFutureValues);
    setAutoClassified(newAutoClassified);

    // Update parent component
    onUpdate({ 
      featureClassification: {
        ...data.featureClassification,
        columnRoles: newClassification,
        selectedFutureFeatures: Object.keys(newFutureValues).filter(col => newFutureValues[col])
      }
    });
  };

  // New helper function to get classification summary
  const getClassificationSummary = () => {
    const summary = {
      'Entity Property': 0,
      'Dynamic Feature': 0,
      'Future Feature': 0,
      'Ignore': 0
    };

    Object.values(featureClassification).forEach(role => {
      if (role === 'entity_property') {
        summary['Entity Property']++;
      } else if (role === 'dynamic_feature') {
        summary['Dynamic Feature']++;
      } else if (role === 'future_feature') {
        summary['Future Feature']++;
      } else {
        summary['Ignore']++;
      }
    });

    return summary;
  };

  // New helper function to get color by type
  const getTypeColor = (type) => {
    switch (type) {
      case 'Entity Property':
        return 'primary';
      case 'Dynamic Feature':
        return 'secondary';
      case 'Future Feature':
        return 'success';
      case 'Ignore':
        return 'default';
      // Add these additional cases for the role labels:
      case 'entity_property':
        return 'primary';
      case 'dynamic_feature':
        return 'secondary';
      case 'future_feature':
        return 'success';
      case 'ignore':
        return 'default';
      default:
        return 'default'; // Always return a valid MUI color
    }
  };

  const handleFutureFileUpload = async (file) => {
    setUploadingFutureFile(true);
    setFutureFileValidation(null);

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        throw new Error('File must contain at least a header row and one data row');
      }

      const headers = lines[0].split(',').map(h => h.trim());
      
      // Validate required columns
      const requiredColumns = ['timestamp', 'item_id'];
      const missingRequired = requiredColumns.filter(col => !headers.includes(col));
      
      if (missingRequired.length > 0) {
        throw new Error(`Missing required columns: ${missingRequired.join(', ')}`);
      }

      // Get future feature columns (exclude timestamp and item_id)
      const futureFeatureColumns = headers.filter(h => !['timestamp', 'item_id'].includes(h));
      
      // Validate that selected future features match file columns
      const selectedFutureFeatures = Object.keys(futureValues).filter(col => futureValues[col]);
      const missingFeatures = selectedFutureFeatures.filter(feature => !futureFeatureColumns.includes(feature));
      const extraFeatures = futureFeatureColumns.filter(feature => !selectedFutureFeatures.includes(feature));

      const validation = {
        isValid: missingFeatures.length === 0,
        totalRows: lines.length - 1,
        headers,
        futureFeatureColumns,
        selectedFutureFeatures,
        missingFeatures,
        extraFeatures,
        warnings: [],
        suggestions: []
      };

      if (missingFeatures.length > 0) {
        validation.warnings.push(`Missing columns for selected future features: ${missingFeatures.join(', ')}`);
      }

      if (extraFeatures.length > 0) {
        validation.suggestions.push(`File contains additional columns that aren't marked as future features: ${extraFeatures.join(', ')}`);
      }

      // Parse sample data for preview
      const sampleRows = lines.slice(1, 6).map(line => {
        const values = line.split(',').map(v => v.trim());
        return headers.reduce((obj, header, index) => {
          obj[header] = values[index] || '';
          return obj;
        }, {});
      });

      validation.sampleData = sampleRows;

      setFutureFileValidation(validation);
      setFutureValuesFile(file);

    } catch (error) {
      setFutureFileValidation({
        isValid: false,
        error: error.message
      });
    } finally {
      setUploadingFutureFile(false);
    }
  };

  const generateFutureValuesTemplate = () => {
    const selectedFutureFeatures = Object.keys(futureValues).filter(col => futureValues[col]);
    
    if (selectedFutureFeatures.length === 0) {
      setError('Please select at least one feature with "Future Values Available" before generating template');
      return;
    }

    // Generate template CSV with better structure
    const headers = ['timestamp', 'item_id', ...selectedFutureFeatures];
    const headerRow = headers.join(',');
    
    // Generate sample data with realistic examples
    const sampleRows = [];
    const today = new Date();
    
    // Add header comment
    const comments = [
      '# Future Values Template',
      '# timestamp: Date in YYYY-MM-DD format',
      '# item_id: Identifier for the item/entity being forecasted',
      `# Future features: ${selectedFutureFeatures.join(', ')}`,
      '# Replace sample data below with your actual future values',
      ''
    ];
    
    // Generate 30 days of future data
    for (let i = 1; i <= 30; i++) {
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + i);
      const timestamp = futureDate.toISOString().split('T')[0];
      
      // Generate sample values based on feature names
      const sampleValues = selectedFutureFeatures.map(feature => {
        const lowerFeature = feature.toLowerCase();
        if (lowerFeature.includes('holiday')) return Math.random() < 0.1 ? '1' : '0';
        if (lowerFeature.includes('promotion')) return Math.random() < 0.2 ? '1' : '0';
        if (lowerFeature.includes('price')) return (Math.random() * 100 + 50).toFixed(2);
        if (lowerFeature.includes('temperature')) return (Math.random() * 30 + 10).toFixed(1);
        if (lowerFeature.includes('weather')) return ['sunny', 'cloudy', 'rainy'][Math.floor(Math.random() * 3)];
        return ''; // Empty for user to fill
      });
      
      const row = [timestamp, 'item_001', ...sampleValues];
      sampleRows.push(row.join(','));
    }

    const csvContent = [
      ...comments.map(c => c),
      headerRow,
      ...sampleRows
    ].join('\n');
    
    // Download template
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `future_values_template_${selectedFutureFeatures.join('_')}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    // Show success message
    setError(''); // Clear any previous errors
    // You could add a success toast here if you have a toast system
  };

  return (
    <Box>
      {/* Page Title - h5 for main page titles */}
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
        Step 4: Feature Classification
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Configure how each column will be used in your forecasting model.</strong>
          <br />
          Classify features based on their role and specify if future values will be available during prediction.
        </Typography>
      </Alert>

      {/* Classification Overview Card */}
      {Object.keys(featureClassification).length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <AnalyticsIcon color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Feature Classification Summary
              </Typography>
            </Box>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={8}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {Object.entries(getClassificationSummary()).map(([type, count]) => (
                    <Chip
                      key={type}
                      label={`${type}: ${count}`}
                      color={getTypeColor(type)}
                      variant="outlined"
                      sx={{ fontWeight: 600 }}
                    />
                  ))}
                </Box>
                
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  Future Values Available:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  <Chip
                    label={`Yes: ${Object.values(futureValues).filter(v => v).length}`}
                    color="success"
                    variant="outlined"
                  />
                  <Chip
                    label={`No: ${Object.values(futureValues).filter(v => !v).length}`}
                    color="default"
                    variant="outlined"
                  />
                </Box>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    startIcon={<AnalyticsIcon />}
                    onClick={handleAutoClassify}
                    disabled={data.loading || !data.validation?.columnAnalysis}
                    size="small"
                    sx={{ 
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600
                    }}
                  >
                    Re-run Auto Classification
                  </Button>
                </Box>
              </Grid>
            </Grid>

            {/* Future Values Upload Section */}
            {Object.values(futureValues).some(v => v) && (
              <Box sx={{ mt: 3, p: 2, bgcolor: '#e8f5e8', borderRadius: 1, border: '1px solid #4caf50' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <CheckCircleIcon color="success" fontSize="small" />
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'success.main' }}>
                    Future Values Configuration Available
                  </Typography>
                </Box>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                  You've marked <strong>{Object.keys(futureValues).filter(col => futureValues[col]).length}</strong> feature(s) 
                  as having future values available: <strong>{Object.keys(futureValues).filter(col => futureValues[col]).join(', ')}</strong>
                  <br />
                  Upload a CSV file with future values to improve prediction accuracy.
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', mb: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={generateFutureValuesTemplate}
                    color="success"
                    size="small"
                    sx={{ fontWeight: 600 }}
                  >
                    Download Template
                  </Button>
                  
                  <Button
                    variant="contained"
                    component="label"
                    startIcon={<CloudUploadIcon />}
                    color="success"
                    size="small"
                    disabled={uploadingFutureFile}
                    sx={{ fontWeight: 600 }}
                  >
                    {uploadingFutureFile ? 'Uploading...' : 'Upload Future Values'}
                    <input
                      type="file"
                      accept=".csv"
                      hidden
                      onChange={(e) => {
                        if (e.target.files[0]) {
                          handleFutureFileUpload(e.target.files[0]);
                        }
                      }}
                    />
                  </Button>
                  
                  {futureValuesFile && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CheckCircleIcon color="success" fontSize="small" />
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                        ✅ {futureValuesFile.name} uploaded
                      </Typography>
                    </Box>
                  )}
                </Box>

                {/* Upload Progress */}
                {uploadingFutureFile && (
                  <Box sx={{ mb: 2 }}>
                    <LinearProgress />
                    <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
                      Processing file...
                    </Typography>
                  </Box>
                )}

                {/* File Validation Results - Show inline */}
                {futureFileValidation && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      {futureFileValidation.isValid ? (
                        <CheckCircleIcon color="success" fontSize="small" />
                      ) : (
                        <ErrorIcon color="error" fontSize="small" />
                      )}
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        File Validation {futureFileValidation.isValid ? 'Passed' : 'Failed'}
                      </Typography>
                    </Box>

                    {futureFileValidation.error && (
                      <Alert severity="error" sx={{ mb: 1, py: 1 }}>
                        <Typography variant="body2">{futureFileValidation.error}</Typography>
                      </Alert>
                    )}

                    {futureFileValidation.totalRows && (
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        📊 <strong>File Summary:</strong> {futureFileValidation.totalRows} rows, 
                        columns: {futureFileValidation.headers?.join(', ')}
                      </Typography>
                    )}

                    {futureFileValidation.warnings?.length > 0 && (
                      <Alert severity="warning" sx={{ mb: 1, py: 1 }}>
                        <Typography variant="body2">
                          <strong>Warnings:</strong> {futureFileValidation.warnings.join('; ')}
                        </Typography>
                      </Alert>
                    )}

                    {futureFileValidation.isValid && (
                      <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 600 }}>
                        ✅ File is ready to use for training!
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Feature Classification Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {data.columns.map((column) => {
          const isAutoClassified = autoClassified.has(column);
          const canProvideFuture = futureValues[column] === true;
          const dataType = data.dataClassification[column];
          const currentRole = featureClassification[column];
          
          return (
            <Grid item xs={12} md={6} lg={4} key={column}>
              <Card sx={{ 
                height: '100%',
                border: isAutoClassified ? '2px solid #e3f2fd' : '1px solid #e0e0e0',
                '&:hover': {
                  boxShadow: 3,
                  transform: 'translateY(-2px)',
                  transition: 'all 0.2s ease-in-out'
                }
              }}>
                <CardContent>
                  {/* Column Header */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, flexGrow: 1 }}>
                      {column}
                    </Typography>
                    {isAutoClassified && (
                      <Tooltip title="Auto-classified">
                        <AnalyticsIcon color="primary" fontSize="small" />
                      </Tooltip>
                    )}
                  </Box>

                  {/* Data Type Display */}
                  <Box sx={{ mb: 2, p: 1.5, bgcolor: '#f8f9fa', borderRadius: 1 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                      Data Type:
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5, fontSize: '0.85rem' }}>
                      {dataType || 'Unknown'}
                    </Typography>
                  </Box>

                  {/* Feature Role Selection */}
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Feature Role</InputLabel>
                    <Select
                      value={currentRole || ''}
                      onChange={(e) => handleRoleChange(column, e.target.value)}
                      label="Feature Role"
                      disabled={data.loading}
                      displayEmpty
                    >
                      <MenuItem value="" disabled>
                        <Typography variant="body2" color="text.secondary">
                          Select feature role
                        </Typography>
                      </MenuItem>
                      {FEATURE_ROLES.map((role) => (
                        <MenuItem key={role.value} value={role.value}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                            {role.icon && React.cloneElement(role.icon, { fontSize: 'small' })}
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {role.label}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {role.description}
                              </Typography>
                            </Box>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* Future Values Toggle */}
                  <Box sx={{ mb: 2 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={futureValues[column] || false}
                          onChange={(e) => handleFutureValueChange(column, e.target.checked)}
                          disabled={
                            data.loading || 
                            currentRole === 'ignore' ||
                            !currentRole
                          }
                        />
                      }
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Typography 
                            variant="body2" 
                            sx={{ fontWeight: 600 }}
                            color={
                              currentRole === 'ignore' || !currentRole 
                                ? 'text.disabled' 
                                : 'text.primary'
                            }
                          >
                            Future Values Available
                          </Typography>
                          <Tooltip 
                            title={
                              !currentRole 
                                ? "Select a feature role first"
                                : currentRole === 'ignore'
                                ? "Ignored features cannot provide future values"
                                : "Check if this feature's future values will be known during prediction"
                            }
                          >
                            <IconButton size="small" sx={{ p: 0 }}>
                              <InfoIcon fontSize="small" color="action" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      }
                    />
                  </Box>

                  {/* Status Display */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {futureValues[column] ? (
                        <CheckCircleIcon color="success" fontSize="small" />
                      ) : (
                        <ErrorIcon color="default" fontSize="small" />
                      )}
                      <Typography variant="caption">
                        {futureValues[column] ? 'Future values: Yes' : 'Future values: No'}
                      </Typography>
                    </Box>
                    
                    {currentRole && (
                      <Chip
                        label={FEATURE_ROLES.find(r => r.value === currentRole)?.label || currentRole}
                        size="small"
                        color={(() => {
                          const role = FEATURE_ROLES.find(r => r.value === currentRole);
                          if (!role) return 'default';
                          
                          switch (role.value) {
                            case 'entity_property':
                              return 'primary';
                            case 'dynamic_feature':
                              return 'secondary';
                            case 'future_feature':
                              return 'success';
                            case 'ignore':
                              return 'default';
                            default:
                              return 'default';
                          }
                        })()}
                        variant="filled"
                      />
                    )}
                  </Box>

                  {/* Role Description */}
                  {currentRole && (
                    <Box sx={{ mt: 2, p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        Role Description:
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.5, fontSize: '0.8rem' }}>
                        {FEATURE_ROLES.find(r => r.value === currentRole)?.description || 'No description available'}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Navigation */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button
          onClick={onBack}
          size="large"
          sx={{ px: 4, py: 1.5 }}
        >
          <Typography variant="button">Back: Data Classification</Typography>
        </Button>
        
        <Button
          variant="contained"
          onClick={handleNext}
          disabled={Object.keys(featureClassification).length !== data.columns.length}
          size="large"
          sx={{
            px: 4,
            py: 1.5,
            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
            boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
            '&:hover': {
              background: 'linear-gradient(45deg, #1976D2 30%, #1BA8D9 90%)',
            },
            '&:disabled': {
              background: '#e0e0e0',
              color: '#999'
            }
          }}
        >
          <Typography variant="button">Next: Training Configuration</Typography>
        </Button>
      </Box>
    </Box>
  );
}