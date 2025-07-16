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
  const [dataClassification, setDataClassification] = useState({});
  const [autoClassified, setAutoClassified] = useState(new Set());

  // Initialize data classification from upload validation results
  useEffect(() => {
    if (data.validation?.columnAnalysis && Object.keys(dataClassification).length === 0) {
      const initialClassification = {};
      const autoClassifiedColumns = new Set();
      
      // Pre-populate with detected types from upload validation
      Object.entries(data.validation.columnAnalysis).forEach(([columnName, analysis]) => {
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
  }, [data.validation, onUpdate]);

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
    if (!data.validation?.columnAnalysis) {
      setError('No validation data available for auto-classification');
      return;
    }

    const autoClassification = {};
    const newAutoClassified = new Set();
    
    Object.entries(data.validation.columnAnalysis).forEach(([columnName, analysis]) => {
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
    const analysis = data.validation?.columnAnalysis[column];
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

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 3 }}>
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

      {/* Classification Summary */}
      {Object.keys(dataClassification).length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Classification Summary</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {Object.entries(getClassificationSummary()).map(([type, count]) => (
                <Chip
                  key={type}
                  label={`${type}: ${count}`}
                  color={getTypeColor(type)}
                  variant="outlined"
                />
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Auto-classify Button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
        <Button
          variant="outlined"
          startIcon={<AutoFixHigh />}
          onClick={handleAutoClassify}
          disabled={!data.validation?.columnAnalysis}
        >
          Re-run Auto Classification
        </Button>
      </Box>

      {/* Column Classification Table */}
      <TableContainer component={Paper} sx={{ mb: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Column Name</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Sample Values</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Data Type</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Confidence</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Info</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.columns.map((column) => {
              const validation = getValidationInfo(column);
              const analysis = data.validation?.columnAnalysis[column];
              
              return (
                <TableRow key={column}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {column}
                      {autoClassified.has(column) && (
                        <Tooltip title="Auto-classified">
                          <AutoFixHigh color="primary" fontSize="small" />
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    <Typography variant="body2" color="textSecondary">
                      {analysis?.samples?.join(', ') || 'N/A'}
                    </Typography>
                  </TableCell>
                  
                  <TableCell>
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                      <Select
                        value={dataClassification[column] || ''}
                        onChange={(e) => handleTypeChange(column, e.target.value)}
                        displayEmpty
                      >
                        <MenuItem value="" disabled>
                          Select type
                        </MenuItem>
                        {DATA_TYPES.map((type) => (
                          <MenuItem key={type.value} value={type.value}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Chip
                                label={type.value}
                                size="small"
                                color={type.color}
                              />
                              {type.label}
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </TableCell>
                  
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getConfidenceIcon(column)}
                      <Typography variant="body2">
                        {validation?.confidence ? `${(validation.confidence * 100).toFixed(0)}%` : 'N/A'}
                      </Typography>
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    {validation && (validation.issues.length > 0 || validation.warnings.length > 0 || validation.suggestions.length > 0) && (
                      <Tooltip
                        title={
                          <Box sx={{ maxWidth: 400 }}>
                            {validation.issues.length > 0 && (
                              <Box sx={{ mb: 1.5 }}>
                                <Typography variant="body2" sx={{ 
                                  fontWeight: 600, 
                                  color: '#d32f2f', // Dark red text
                                  mb: 0.5,
                                  bgcolor: '#ffebee', // Light red background
                                  px: 1,
                                  py: 0.5,
                                  borderRadius: 1,
                                  fontSize: '0.75rem'
                                }}>
                                  🚨 ISSUES
                                </Typography>
                                {validation.issues.map((issue, idx) => (
                                  <Typography key={idx} variant="body2" sx={{ 
                                    color: '#d32f2f', // Dark red text
                                    mb: 0.5,
                                    pl: 1,
                                    fontSize: '0.8rem',
                                    lineHeight: 1.3
                                  }}>
                                    • {issue}
                                  </Typography>
                                ))}
                              </Box>
                            )}
                            
                            {validation.warnings.length > 0 && (
                              <Box sx={{ mb: 1.5 }}>
                                <Typography variant="body2" sx={{ 
                                  fontWeight: 600, 
                                  color: '#ed6c02', // Dark orange text
                                  mb: 0.5,
                                  bgcolor: '#fff3e0', // Light orange background
                                  px: 1,
                                  py: 0.5,
                                  borderRadius: 1,
                                  fontSize: '0.75rem'
                                }}>
                                  ⚠️ WARNINGS
                                </Typography>
                                {validation.warnings.map((warning, idx) => (
                                  <Typography key={idx} variant="body2" sx={{ 
                                    color: '#ed6c02', // Dark orange text
                                    mb: 0.5,
                                    pl: 1,
                                    fontSize: '0.8rem',
                                    lineHeight: 1.3
                                  }}>
                                    • {warning}
                                  </Typography>
                                ))}
                              </Box>
                            )}
                            
                            {validation.suggestions.length > 0 && (
                              <Box>
                                <Typography variant="body2" sx={{ 
                                  fontWeight: 600, 
                                  color: '#0288d1', // Dark blue text
                                  mb: 0.5,
                                  bgcolor: '#e3f2fd', // Light blue background
                                  px: 1,
                                  py: 0.5,
                                  borderRadius: 1,
                                  fontSize: '0.75rem'
                                }}>
                                  💡 SUGGESTIONS
                                </Typography>
                                {validation.suggestions.map((suggestion, idx) => (
                                  <Typography key={idx} variant="body2" sx={{ 
                                    color: '#0288d1', // Dark blue text
                                    mb: 0.5,
                                    pl: 1,
                                    fontSize: '0.8rem',
                                    lineHeight: 1.3
                                  }}>
                                    • {suggestion}
                                  </Typography>
                                ))}
                              </Box>
                            )}
                          </Box>
                        }
                        arrow
                        placement="top"
                        componentsProps={{
                          tooltip: {
                            sx: {
                              bgcolor: '#f5f5f5', // Light gray background
                              border: '1px solid #ddd',
                              borderRadius: 2,
                              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                              maxWidth: 450,
                              p: 2,
                              color: '#333' // Dark text for better contrast
                            }
                          },
                          arrow: {
                            sx: {
                              color: '#f5f5f5' // Match the tooltip background
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
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Data Preview with Types */}
      {data.previewData && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Data Preview with Classifications
          </Typography>
          <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  {data.columns.map((column) => (
                    <TableCell key={column} sx={{ fontWeight: 600 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Typography variant="body2">{column}</Typography>
                        {dataClassification[column] && (
                          <Chip
                            label={dataClassification[column]}
                            size="small"
                            color={getTypeColor(dataClassification[column])}
                          />
                        )}
                      </Box>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {data.previewData.slice(0, 5).map((row, index) => (
                  <TableRow key={index}>
                    {data.columns.map((column) => (
                      <TableCell key={column}>
                        {row[column]}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button onClick={onBack}>
          Back
        </Button>
        <Button
          variant="contained"
          onClick={handleNext}
          disabled={Object.keys(dataClassification).length !== data.columns.length}
        >
          Next: Feature Classification
        </Button>
      </Box>
    </Box>
  );
}