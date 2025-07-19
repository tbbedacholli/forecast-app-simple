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

export default function DataClassification({ data, onUpdate, onNext, onBack, setError }) {
  console.log('🔍 DataClassification received data:', {
    hasValidationResults: !!data?.validationResults,
    hasColumnAnalysis: !!data?.validationResults?.columnAnalysis,
    columnAnalysis: data?.validationResults?.columnAnalysis,
    columns: data?.columns,
    selectedColumns: data?.selectedColumns
  });

  const [dataClassification, setDataClassification] = useState({});
  const [autoClassified, setAutoClassified] = useState(new Set());

  // Initialize data classification from upload validation results
  useEffect(() => {
    if (data.validationResults?.columnAnalysis && Object.keys(dataClassification).length === 0) {
      const initialClassification = {};
      const autoClassifiedColumns = new Set();
      
      // Pre-populate with detected types from upload validation
      Object.entries(data.validationResults.columnAnalysis).forEach(([columnName, analysis]) => {
        initialClassification[columnName] = analysis.type;
        autoClassifiedColumns.add(columnName);
      });
      
      setDataClassification(initialClassification);
      setAutoClassified(autoClassifiedColumns);
      
      // Update parent component
      onUpdate({ 
        dataClassification: initialClassification,
        autoClassified: autoClassifiedColumns
      });
    }
  }, [data.validationResults, onUpdate]);

  const handleTypeChange = (column, newType) => {
    const updated = { ...dataClassification, [column]: newType };
    setDataClassification(updated);
    
    // Remove from auto-classified if user manually changed it
    const newAutoClassified = new Set(autoClassified);
    newAutoClassified.delete(column);
    setAutoClassified(newAutoClassified);
    
    onUpdate({ 
      dataClassification: updated,
      autoClassified: newAutoClassified
    });
  };

  const handleAutoClassify = () => {
    if (!data.validationResults?.columnAnalysis) {
      setError('No validation data available for auto-classification');
      return;
    }

    const autoClassification = {};
    const newAutoClassified = new Set();
    
    Object.entries(data.validationResults.columnAnalysis).forEach(([columnName, analysis]) => {
      autoClassification[columnName] = analysis.type;
      newAutoClassified.add(columnName);
    });
    
    setDataClassification(autoClassification);
    setAutoClassified(newAutoClassified);
    
    onUpdate({ 
      dataClassification: autoClassification,
      autoClassified: newAutoClassified
    });
  };

  const getTypeColor = (type) => {
    const typeInfo = DATA_TYPES.find(t => t.value === type);
    return typeInfo ? typeInfo.color : 'default';
  };

  const getValidationInfo = (column) => {
    const analysis = data.validationResults?.columnAnalysis[column];
    if (!analysis) return null;

    return {
      issues: analysis.issues || [],
      warnings: analysis.warnings || [],
      suggestions: analysis.suggestions || [],
      confidence: analysis.confidence || 0.8
    };
  };

  const getConfidenceIcon = (column) => {
    const validation = getValidationInfo(column);
    if (!validation) return null;

    if (validation.issues.length > 0) {
      return <Error color="error" fontSize="small" />;
    } else if (validation.warnings.length > 0) {
      return <Warning color="warning" fontSize="small" />;
    } else {
      return <CheckCircle color="success" fontSize="small" />;
    }
  };

  const validateClassification = () => {
    const missingColumns = data.columns.filter(col => !dataClassification[col]);
    
    if (missingColumns.length > 0) {
      setError(`Please classify all columns: ${missingColumns.join(', ')}`);
      return false;
    }
    
    setError('');
    return true;
  };

  const handleNext = () => {
    if (validateClassification()) {
      onNext();
    }
  };

  const getClassificationSummary = () => {
    const summary = {};
    Object.values(dataClassification).forEach(type => {
      summary[type] = (summary[type] || 0) + 1;
    });
    return summary;
  };

  // Replace the getEnhancedValidationTooltip function (around line 146):
  const getEnhancedValidationTooltip = (column) => {
    const analysis = data.validationResults?.columnAnalysis[column];
    const validation = getValidationInfo(column);
    
    if (!analysis && !validation) return null;

    return (
      <Box sx={{ maxWidth: 500 }}>
        {/* Confidence and Type Info */}
        <Box sx={{ mb: 2, p: 1, bgcolor: '#e3f2fd', borderRadius: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
            🎯 Detection Results
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
            Type: <strong>{analysis?.type || 'Unknown'}</strong> 
            {analysis?.confidence && ` (Confidence: ${(analysis.confidence * 100).toFixed(0)}%)`}
          </Typography>
          {analysis?.reasoning && (
            <Typography variant="body2" sx={{ fontSize: '0.8rem', mt: 0.5 }}>
              Reason: {analysis.reasoning}
            </Typography>
          )}
        </Box>

        {/* Analysis Details */}
        {analysis && (
          <Box sx={{ mb: 2, p: 1, bgcolor: '#f3e5f5', borderRadius: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
              📊 Analysis Details
            </Typography>
            {analysis.totalValues && (
              <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                • Total values: {analysis.totalValues}
              </Typography>
            )}
            {analysis.uniqueCount && (
              <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                • Unique values: {analysis.uniqueCount}
              </Typography>
            )}
            {analysis.nullCount !== undefined && (
              <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                • Null values: {analysis.nullCount}
              </Typography>
            )}
            {analysis.numericRatio !== undefined && (
              <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                • Numeric ratio: {(analysis.numericRatio * 100).toFixed(1)}%
              </Typography>
            )}
            {analysis.dateRatio !== undefined && (
              <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                • Date ratio: {(analysis.dateRatio * 100).toFixed(1)}%
              </Typography>
            )}
          </Box>
        )}

        {/* Sample Values */}
        {analysis?.samples && analysis.samples.length > 0 && (
          <Box sx={{ mb: 2, p: 1, bgcolor: '#fff3e0', borderRadius: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
              📋 Sample Values
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
              {analysis.samples.slice(0, 5).join(', ')}
              {analysis.samples.length > 5 && '...'}
            </Typography>
          </Box>
        )}

        {/* Issues */}
        {validation?.issues && validation.issues.length > 0 && (
          <Box sx={{ mb: 2, p: 1, bgcolor: '#ffebee', borderRadius: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, color: 'error.main' }}>
              ⚠️ Issues
            </Typography>
            {validation.issues.map((issue, index) => (
              <Typography key={index} variant="body2" sx={{ fontSize: '0.8rem', color: 'error.main' }}>
                • {issue}
              </Typography>
            ))}
          </Box>
        )}

        {/* Warnings */}
        {validation?.warnings && validation.warnings.length > 0 && (
          <Box sx={{ mb: 2, p: 1, bgcolor: '#fff8e1', borderRadius: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, color: 'warning.main' }}>
              ⚠️ Warnings
            </Typography>
            {validation.warnings.map((warning, index) => (
              <Typography key={index} variant="body2" sx={{ fontSize: '0.8rem', color: 'warning.main' }}>
                • {warning}
              </Typography>
            ))}
          </Box>
        )}

        {/* Suggestions */}
        {validation?.suggestions && validation.suggestions.length > 0 && (
          <Box sx={{ mb: 1, p: 1, bgcolor: '#e8f5e8', borderRadius: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, color: 'info.main' }}>
              💡 Suggestions
            </Typography>
            {validation.suggestions.map((suggestion, index) => (
              <Typography key={index} variant="body2" sx={{ fontSize: '0.8rem', color: 'info.main' }}>
                • {suggestion}
              </Typography>
            ))}
          </Box>
        )}
      </Box>
    );
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
      {Object.keys(dataClassification).length > 0 && (
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
                  {Object.entries(getClassificationSummary()).map(([type, count]) => (
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
        {data.columns.map((column) => {
          const validation = getValidationInfo(column);
          const analysis = data.validationResults?.columnAnalysis[column];
          
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
                      value={dataClassification[column] || ''}
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
                    
                    {dataClassification[column] && (
                      <Chip
                        label={dataClassification[column]}
                        size="small"
                        color={getTypeColor(dataClassification[column])}
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
                          {dataClassification[column] && (
                            <Chip
                              label={dataClassification[column]}
                              size="small"
                              color={getTypeColor(dataClassification[column])}
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
          disabled={Object.keys(dataClassification).length !== data.columns.length}
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