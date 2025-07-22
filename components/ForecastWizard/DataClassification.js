// components/ForecastWizard/DataClassification.js
'use client';
import { useState, useEffect } from 'react';
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
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  AutoFixHigh,
  Info,
  CheckCircle,
  Warning,
  Error
} from '@mui/icons-material';

const DATA_TYPES = [
  { value: 'numeric', label: 'Numeric (continuous values)', color: 'success' },
  { value: 'categorical', label: 'Categorical (discrete categories)', color: 'secondary' },
  { value: 'binary', label: 'Binary (0/1, Yes/No)', color: 'warning' },
  { value: 'date', label: 'Date/Time', color: 'info' },
  { value: 'text', label: 'Text/String', color: 'default' }
];

// Helper function to get validation info for a column
const getValidationInfo = (column, data) => {
  if (!data || !column) return null;
  return data.validationResults?.columnAnalysis?.[column] || null;
};

// Helper function to get type color
const getTypeColor = (type) => {
  const typeConfig = DATA_TYPES.find(t => t.value === type);
  return typeConfig?.color || 'default';
};

// Update the getClassificationSummary function
const getClassificationSummary = (classifications) => {
  const summary = {};
  // Add null check
  if (!classifications) return summary;
  
  Object.values(classifications).forEach(type => {
    if (type) { // Add check for valid type
      summary[type] = (summary[type] || 0) + 1;
    }
  });
  return summary;
};

// Helper function to get confidence icon
const getConfidenceIcon = (column, data) => {
  if (!data || !column) return null;
  
  const validation = getValidationInfo(column, data);
  if (!validation) return null;

  const confidence = validation.confidence || 0;
  if (confidence >= 0.8) {
    return <CheckCircle fontSize="small" color="success" />;
  } else if (confidence >= 0.5) {
    return <Warning fontSize="small" color="warning" />;
  }
  return <Error fontSize="small" color="error" />;
};

// Helper function to get enhanced validation tooltip content
const getEnhancedValidationTooltip = (column, data) => {
  if (!data || !column) return 'No validation data available';
  
  const validation = getValidationInfo(column, data);
  if (!validation) return 'No validation data available';

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>Column Analysis</Typography>
      <Typography variant="body2">
        • Type: {validation.type}<br />
        • Unique Values: {validation.uniqueCount}<br />
        • Null Count: {validation.nullCount}<br />
        • Confidence: {(validation.confidence * 100).toFixed(0)}%
      </Typography>
    </Box>
  );
};

export default function DataClassification({ data, onUpdate, onNext, onBack, setError }) {
  // Add state for tracking classifications
  const [classifications, setClassifications] = useState({});
  const [autoClassified, setAutoClassified] = useState(new Set());

  // Initialize classifications from validation results
  useEffect(() => {
    if (data.validationResults?.columnAnalysis) {
      const initialClassifications = {};
      const autoClassifiedColumns = new Set();

      // Set initial classifications from validation results
      Object.entries(data.validationResults.columnAnalysis).forEach(([column, analysis]) => {
        initialClassifications[column] = analysis.type;
        autoClassifiedColumns.add(column);
      });

      // Override with any user classifications
      if (data.dataClassification?.userClassified) {
        Object.entries(data.dataClassification.userClassified).forEach(([column, type]) => {
          initialClassifications[column] = type;
          autoClassifiedColumns.delete(column); // Remove from auto-classified if user modified
        });
      }

      setClassifications(initialClassifications);
      setAutoClassified(autoClassifiedColumns);
    }
  }, [data.validationResults, data.dataClassification]);

  // Log the current state of classifications and autoClassified columns
  useEffect(() => {
    console.log('Classifications State:', {
      classifications,
      autoClassified: Array.from(autoClassified),
      columns: data.columns,
      validationResults: data.validationResults
    });
  }, [classifications, autoClassified, data]);

  // Handle type changes
  const handleTypeChange = (column, newType) => {
    // Update local state
    setClassifications(prev => ({
      ...prev,
      [column]: newType
    }));

    // Update parent state
    onUpdate({
      dataClassification: {
        ...data.dataClassification,
        userClassified: {
          ...(data.dataClassification?.userClassified || {}),
          [column]: newType
        }
      }
    });
  };

  // Get current type for a column
  const getCurrentType = (column) => {
    // First check local state
    if (classifications[column]) {
      return classifications[column];
    }
    // Then check validation results
    return data.validationResults?.columnAnalysis?.[column]?.type || 'unknown';
  };

  // Add handleNext function
  const handleNext = () => {
    // Validate all columns have classifications
    if (Object.keys(classifications).length !== data.columns?.length) {
      setError("Please classify all columns before proceeding");
      return;
    }

    // Update final state before proceeding
    onUpdate({
      dataClassification: {
        autoClassified: Object.fromEntries(
          Array.from(autoClassified).map(column => [column, classifications[column]])
        ),
        userClassified: Object.fromEntries(
          Object.entries(classifications)
            .filter(([column]) => !autoClassified.has(column))
            .map(([column, type]) => [column, type])
        )
      }
    });

    // Proceed to next step
    onNext();
  };

  // Add handleAutoClassify function
  const handleAutoClassify = () => {
    if (!data.validationResults?.columnAnalysis) {
      setError("No validation results available for auto-classification");
      return;
    }

    // Reset to auto-detected types
    const newClassifications = {};
    const newAutoClassified = new Set();

    Object.entries(data.validationResults.columnAnalysis).forEach(([column, analysis]) => {
      newClassifications[column] = analysis.type;
      newAutoClassified.add(column);
    });

    // Update local state
    setClassifications(newClassifications);
    setAutoClassified(newAutoClassified);

    // Update parent state
    onUpdate({
      dataClassification: {
        autoClassified: Object.fromEntries(
          Object.entries(newClassifications)
        ),
        userClassified: {} // Clear user classifications
      }
    });
  };

  return (
    <Box>
      {/* Page Title - h5 for main page titles */}
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
        Step 3: Data Classification
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Data types have been automatically detected</strong> based on your upload validation.
          <br />
          Review and adjust the classifications below if needed. Auto-classified columns are marked with 
          <AutoFixHigh fontSize="small" sx={{ mx: 0.5 }} /> icon.
        </Typography>
      </Alert>

      {/* Classification Overview Card */}
      {Object.keys(data.dataClassification?.userClassified || {}).length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <AutoFixHigh color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Classification Summary
              </Typography>
            </Box>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={8}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {Object.entries(getClassificationSummary(classifications)).map(([type, count]) => (
                    <Chip
                      key={type}
                      label={`${type}: ${count} columns`}
                      color={getTypeColor(type)}
                      variant="outlined"
                      sx={{ fontWeight: 600 }}
                    />
                  ))}
                </Box>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    startIcon={<AutoFixHigh />}
                    onClick={handleAutoClassify}
                    disabled={!data.validationResults?.columnAnalysis}
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
          </CardContent>
        </Card>
      )}

      {/* Column Classification Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {data.columns?.map((column) => {
          const validation = getValidationInfo(column, data);
          const analysis = data.validationResults?.columnAnalysis?.[column];
          
          return (
            <Grid item xs={12} md={6} lg={4} key={column}>
              <Card sx={{ 
                height: '100%',
                border: autoClassified.has(column) ? '2px solid #e3f2fd' : '1px solid #e0e0e0',
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
                    {autoClassified.has(column) && (
                      <Tooltip title="Auto-classified">
                        <AutoFixHigh color="primary" fontSize="small" />
                      </Tooltip>
                    )}
                    {analysis && (
                      <Tooltip
                        title={getEnhancedValidationTooltip(column)}
                        arrow
                        placement="top"
                        componentsProps={{
                          tooltip: {
                            sx: {
                              bgcolor: '#f5f5f5',
                              border: '1px solid #ddd',
                              borderRadius: 2,
                              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                              maxWidth: 450,
                              p: 2,
                              color: '#333'
                            }
                          },
                          arrow: {
                            sx: {
                              color: '#f5f5f5'
                            }
                          }
                        }}
                      >
                        <IconButton size="small" sx={{ 
                          color: '#666',
                          '&:hover': {
                            bgcolor: 'rgba(0,0,0,0.04)',
                            color: '#333'
                          }
                        }}>
                          <Info fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>

                  {/* Sample Values */}
                  {analysis?.samples && (
                    <Box sx={{ mb: 2, p: 1.5, bgcolor: '#f8f9fa', borderRadius: 1 }}>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                        Sample Values:
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.5, fontSize: '0.85rem' }}>
                        {analysis.samples.slice(0, 3).join(', ')}
                        {analysis.samples.length > 3 && '...'}
                      </Typography>
                    </Box>
                  )}

                  {/* Data Type Selection */}
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Data Type</InputLabel>
                    <Select
                      value={getCurrentType(column)}
                      onChange={(e) => handleTypeChange(column, e.target.value)}
                      label="Data Type"
                      displayEmpty
                    >
                      <MenuItem value="" disabled>
                        <Typography variant="body2" color="text.secondary">
                          Select data type
                        </Typography>
                      </MenuItem>
                      {DATA_TYPES.map((type) => (
                        <MenuItem key={type.value} value={type.value}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                            <Chip
                              label={type.value}
                              size="small"
                              color={type.color}
                              variant="outlined"
                            />
                            <Typography variant="body2">{type.label}</Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* Confidence & Status */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getConfidenceIcon(column)}
                      <Typography variant="caption">
                        Confidence: {validation?.confidence ? `${(validation.confidence * 100).toFixed(0)}%` : 'N/A'}
                      </Typography>
                    </Box>
                    
                    {classifications[column] && (
                      <Chip
                        label={classifications[column]}
                        size="small"
                        color={getTypeColor(classifications[column])}
                        variant="filled"
                      />
                    )}
                  </Box>

                  {/* Analysis Summary */}
                  {analysis && (
                    <Box sx={{ mt: 2, p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        Quick Stats:
                      </Typography>
                      <Box sx={{ mt: 0.5, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {analysis.uniqueCount && (
                          <Chip 
                            label={`${analysis.uniqueCount} unique`}
                            size="small"
                            variant="outlined"
                            color="default"
                          />
                        )}
                        {analysis.nullCount !== undefined && (
                          <Chip 
                            label={`${analysis.nullCount} nulls`}
                            size="small"
                            variant="outlined"
                            color={analysis.nullCount > 0 ? "warning" : "success"}
                          />
                        )}
                      </Box>
                    </Box>
                  )}

                  {/* Add indicator for auto/manual classification */}
                  <Box sx={{ mt: 1 }}>
                    <Chip
                      size="small"
                      label={autoClassified.has(column) ? "Auto Classified" : "User Modified"}
                      color={autoClassified.has(column) ? "info" : "primary"}
                      variant="outlined"
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Data Preview Card */}
      {data.previewData && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Info color="info" />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Data Preview with Classifications
              </Typography>
            </Box>
            
            <TableContainer component={Paper} sx={{ maxHeight: 400, border: '1px solid #e0e0e0' }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    {data.columns.map((column) => (
                      <TableCell key={column} sx={{ 
                        fontWeight: 600,
                        bgcolor: '#f8f9fa',
                        borderBottom: '2px solid #e0e0e0'
                      }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {column}
                          </Typography>
                          {classifications[column] && (
                            <Chip
                              label={classifications[column]}
                              size="small"
                              color={getTypeColor(classifications[column])}
                              variant="outlined"
                            />
                          )}
                        </Box>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.previewData.slice(0, 5).map((row, index) => (
                    <TableRow key={index} sx={{
                      '&:nth-of-type(odd)': {
                        bgcolor: '#fafafa'
                      },
                      '&:hover': {
                        bgcolor: '#f0f0f0'
                      }
                    }}>
                      {data.columns.map((column) => (
                        <TableCell key={column}>
                          <Typography variant="body2">
                            {row[column]}
                          </Typography>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button
          onClick={onBack}
          size="large"
          sx={{ px: 4, py: 1.5 }}
        >
          <Typography variant="button">Back: Column Selection</Typography>
        </Button>
        
        <Button
          variant="contained"
          onClick={handleNext}
          disabled={Object.keys(classifications).length !== data.columns?.length}
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