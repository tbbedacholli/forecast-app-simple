// components/ForecastWizard/FileUpload.js
'use client';
import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Grid,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Collapse,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  IconButton
} from '@mui/material';

// Individual icon imports to avoid barrel optimization issues
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import StorageIcon from '@mui/icons-material/Storage';
import AssessmentIcon from '@mui/icons-material/Assessment';
import DataUsageIcon from '@mui/icons-material/DataUsage';
import FilePresentIcon from '@mui/icons-material/FilePresent';
import CloudQueueIcon from '@mui/icons-material/CloudQueue';
import InsightsIcon from '@mui/icons-material/Insights';

import { validateFileStructure } from '../../utils/dataValidation';

export default function FileUpload({ data, onUpdate, onNext, setError, setLoading }) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationResults, setValidationResults] = useState(null);
  const [showValidationDetails, setShowValidationDetails] = useState(false);
  const [showDataPreview, setShowDataPreview] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragOver(false);
    const file = event.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleFile = async (file) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Please select a CSV file');
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      setError('File size must be less than 100MB');
      return;
    }

    setSelectedFile(file);
    setError('');
    await uploadFile(file);
  };

  const uploadFile = async (file) => {
    try {
      setUploading(true);
      setUploadProgress(0);
      setValidationResults(null);
      
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/wizard/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      const result = await response.json();
      setUploadProgress(100);

      if (result.success && result.data && result.columns) {
        // **Use the improved validation logic instead of the problematic one**
        console.log('🔍 Running improved data validation...');
        const validation = validateFileStructureImproved(result.data);
        setValidationResults(validation);
        
        onUpdate({
          file: {
            name: file.name,
            size: file.size,
            type: file.type
          },
          rawData: result.data,
          columns: result.columns,
          totalRows: result.data.length,
          totalColumns: result.columns.length,
          previewData: result.preview || result.data.slice(0, 10),
          s3Info: result.s3Info,
          validationResults: validation
        });

        console.log('🔄 Data passed to parent component:', {
          hasFile: !!(file.name),
          hasRawData: !!(result.data),
          hasColumns: !!(result.columns),
          columnsArray: result.columns,
          dataLength: result.data?.length,
          firstRow: result.data?.[0]
        });

      } else {
        throw new Error('Invalid response from server');
      }

    } catch (error) {
      console.error('Upload error:', error);
      setError(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const getValidationScore = () => {
    if (!validationResults) return 0;
    const issues = validationResults.issues?.length || 0;
    const warnings = validationResults.warnings?.length || 0;
    
    let score = 100;
    score -= (issues * 15);
    score -= (warnings * 5);
    
    return Math.max(0, Math.min(100, score));
  };

  const getDataQualityMetrics = () => {
    if (!data.rawData) return { rows: 0, columns: 0, size: 0, quality: 0 };
    
    return {
      rows: data.totalRows || 0,
      columns: data.totalColumns || 0,
      size: selectedFile ? (selectedFile.size / 1024 / 1024).toFixed(2) : 0,
      quality: getValidationScore()
    };
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'error': return <ErrorIcon fontSize="small" color="error" />;
      case 'warning': return <WarningIcon fontSize="small" color="warning" />;
      case 'info': return <InfoIcon fontSize="small" color="info" />;
      default: return <CheckCircleIcon fontSize="small" color="success" />;
    }
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 3 }}>
        Step 1: Upload Your Data
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Start by uploading your time series data!</strong>
          <br />
          Support for CSV files up to 100MB. Your data will be validated and prepared for forecasting.
        </Typography>
      </Alert>

      {/* Upload Overview Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <CloudUploadIcon color="primary" />
            <Typography variant="h6">Data Upload</Typography>
          </Box>
          
          <Grid container spacing={3}>
            {/* Upload Stats */}
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Chip 
                  icon={<DataUsageIcon />} 
                  label={`${getDataQualityMetrics().rows.toLocaleString()} rows`} 
                  variant="outlined" 
                  color="primary"
                />
                <Chip 
                  icon={<AssessmentIcon />} 
                  label={`${getDataQualityMetrics().columns} columns`} 
                  variant="outlined" 
                  color="secondary"
                />
                <Chip 
                  icon={<StorageIcon />} 
                  label={`${getDataQualityMetrics().size} MB`} 
                  variant="outlined" 
                  color="success"
                />
              </Box>
            </Grid>

            {/* File Information */}
            <Grid item xs={12} md={6}>
              {data.file ? (
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                    Uploaded File:
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <FilePresentIcon />
                      <Typography variant="body2">
                        <strong>Name:</strong> {data.file.name}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <StorageIcon />
                      <Typography variant="body2">
                        <strong>Size:</strong> {(data.file.size / 1024 / 1024).toFixed(2)} MB
                      </Typography>
                    </Box>
                    {data.s3Info && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CloudQueueIcon />
                        <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                          <strong>Cloud Storage:</strong> Secured
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', color: 'text.secondary' }}>
                  <Typography variant="body2">
                    No file uploaded yet
                  </Typography>
                  <Typography variant="caption">
                    Upload a CSV file to see details
                  </Typography>
                </Box>
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* File Upload Area */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <FilePresentIcon color="primary" />
            <Typography variant="h6">File Selection</Typography>
          </Box>

          <Box
            sx={{
              border: '2px dashed #ccc',
              borderRadius: 2,
              p: 4,
              textAlign: 'center',
              bgcolor: dragOver ? '#f5f5f5' : 'transparent',
              cursor: 'pointer',
              mb: 2,
              '&:hover': { bgcolor: '#f9f9f9', borderColor: '#999' },
              transition: 'all 0.2s ease'
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-input').click()}
          >
            <input
              id="file-input"
              type="file"
              accept=".csv"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
            
            <CloudUploadIcon sx={{ fontSize: 48, color: dragOver ? '#1976d2' : '#ccc', mb: 2 }} />
            
            {uploading ? (
              <Box>
                <CircularProgress size={24} sx={{ mb: 2 }} />
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Uploading and validating file...
                </Typography>
                {uploadProgress > 0 && (
                  <Box sx={{ mt: 2, maxWidth: 400, mx: 'auto' }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      Progress: {uploadProgress}%
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={uploadProgress} 
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                )}
              </Box>
            ) : (
              <Box>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  {dragOver ? 'Drop your CSV file here' : 'Drop your CSV file here or click to browse'}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Supported format: CSV files only (Max 100MB)
                </Typography>
                <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1 }}>
                  Files are automatically validated and securely stored in the cloud
                </Typography>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Validation Results */}
      {validationResults && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AssessmentIcon color="primary" />
                <Typography variant="h6">Data Validation Results</Typography>
              </Box>
              {/* <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>Quality Score:</Typography>
                <Chip 
                  label={`${getValidationScore()}/100`} 
                  color={getValidationScore() >= 80 ? 'success' : getValidationScore() >= 60 ? 'warning' : 'error'}
                />
              </Box> */}
            </Box>

            <LinearProgress 
              variant="determinate" 
              value={getValidationScore()} 
              sx={{ mb: 2, height: 8, borderRadius: 4 }}
              color={getValidationScore() >= 80 ? 'success' : getValidationScore() >= 60 ? 'warning' : 'error'}
            />

            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={6} sm={3}>
                <Card variant="outlined" sx={{ p: 1.5, textAlign: 'center' }}>
                  <Typography variant="h6" color="primary">
                    {validationResults.totalRows?.toLocaleString()}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Total Rows
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card variant="outlined" sx={{ p: 1.5, textAlign: 'center' }}>
                  <Typography variant="h6" color="secondary">
                    {validationResults.totalColumns}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Columns
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card variant="outlined" sx={{ p: 1.5, textAlign: 'center' }}>
                  <Typography variant="h6" color="error">
                    {validationResults.issues?.length || 0}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Issues
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card variant="outlined" sx={{ p: 1.5, textAlign: 'center' }}>
                  <Typography variant="h6" color="warning">
                    {validationResults.warnings?.length || 0}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Warnings
                  </Typography>
                </Card>
              </Grid>
            </Grid>

            <Button
              onClick={() => setShowValidationDetails(!showValidationDetails)}
              endIcon={showValidationDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              sx={{ mb: 2 }}
            >
              {showValidationDetails ? 'Hide' : 'Show'} Validation Details
            </Button>

            <Collapse in={showValidationDetails}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                Column Analysis:
              </Typography>
              
              {Object.entries(validationResults.columnAnalysis || {}).map(([columnName, analysis]) => (
                <Card key={columnName} sx={{ mb: 2, bgcolor: '#f9f9f9' }} variant="outlined">
                  <CardContent sx={{ py: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {columnName}
                      </Typography>
                      <Chip label={analysis.type} size="small" color="primary" />
                      <Chip label={`${analysis.uniqueCount} unique`} size="small" variant="outlined" />
                      {analysis.nullCount > 0 && (
                        <Chip label={`${analysis.nullCount} nulls`} size="small" color="warning" />
                      )}
                      <Chip 
                        label={`${(analysis.confidence * 100).toFixed(0)}% confidence`} 
                        size="small" 
                        variant="outlined"
                        color={analysis.confidence >= 0.8 ? 'success' : analysis.confidence >= 0.6 ? 'warning' : 'error'}
                      />
                    </Box>

                    {analysis.samples && analysis.samples.length > 0 && (
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                        <strong>Sample values:</strong> {analysis.samples.slice(0, 5).join(', ')}
                        {analysis.samples.length > 5 && '...'}
                      </Typography>
                    )}

                    {/* Issues, Warnings, Suggestions */}
                    {(analysis.issues?.length > 0 || analysis.warnings?.length > 0 || analysis.suggestions?.length > 0) && (
                      <Box sx={{ mt: 1 }}>
                        {analysis.issues?.length > 0 && (
                          <List dense>
                            {analysis.issues.map((issue, index) => (
                              <ListItem key={index} sx={{ py: 0 }}>
                                <ListItemIcon sx={{ minWidth: 32 }}>
                                  {getSeverityIcon('error')}
                                </ListItemIcon>
                                <ListItemText 
                                  primary={issue} 
                                  primaryTypographyProps={{ variant: 'body2', color: 'error' }}
                                />
                              </ListItem>
                            ))}
                          </List>
                        )}

                        {analysis.warnings?.length > 0 && (
                          <List dense>
                            {analysis.warnings.map((warning, index) => (
                              <ListItem key={index} sx={{ py: 0 }}>
                                <ListItemIcon sx={{ minWidth: 32 }}>
                                  {getSeverityIcon('warning')}
                                </ListItemIcon>
                                <ListItemText 
                                  primary={warning} 
                                  primaryTypographyProps={{ variant: 'body2', color: 'warning.main' }}
                                />
                              </ListItem>
                            ))}
                          </List>
                        )}

                        {analysis.suggestions?.length > 0 && (
                          <List dense>
                            {analysis.suggestions.map((suggestion, index) => (
                              <ListItem key={index} sx={{ py: 0 }}>
                                <ListItemIcon sx={{ minWidth: 32 }}>
                                  {getSeverityIcon('info')}
                                </ListItemIcon>
                                <ListItemText 
                                  primary={suggestion} 
                                  primaryTypographyProps={{ variant: 'body2', color: 'info.main' }}
                                />
                              </ListItem>
                            ))}
                          </List>
                        )}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              ))}
            </Collapse>
          </CardContent>
        </Card>
      )}

      {/* Data Preview */}
      {data.previewData && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <InsightsIcon color="primary" />
                <Typography variant="h6">Data Preview</Typography>
                <Chip 
                  label={`First 10 of ${data.totalRows?.toLocaleString()} rows`} 
                  size="small" 
                  variant="outlined" 
                />
              </Box>
              <Button
                onClick={() => setShowDataPreview(!showDataPreview)}
                endIcon={showDataPreview ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                size="small"
              >
                {showDataPreview ? 'Hide' : 'Show'} Preview
              </Button>
            </Box>
            
            <Collapse in={showDataPreview}>
              <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 400 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      {data.columns?.map((column) => (
                        <TableCell key={column} sx={{ fontWeight: 600, bgcolor: '#f5f5f5' }}>
                          {column}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.previewData.map((row, index) => (
                      <TableRow key={index} hover>
                        {data.columns?.map((column) => (
                          <TableCell key={column}>
                            {row[column]}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Collapse>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
        <Button
          variant="contained"
          onClick={() => {
            console.log('🔄 Next button clicked, current data:', {
              hasFile: !!data.file,
              hasRawData: !!data.rawData,
              hasColumns: !!data.columns,
              columns: data.columns,
              totalRows: data.totalRows,
              totalColumns: data.totalColumns
            });
            onNext();
          }}
          disabled={!data.file || uploading}
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
          Next: Select Columns
        </Button>
      </Box>
    </Box>
  );
}

// Move this function outside the component (at the bottom of the file):
const getColumnTypeColor = (type) => {
  switch (type) {
    case 'date': return 'info';
    case 'numeric': return 'success';
    case 'binary': return 'warning';
    case 'categorical': return 'secondary';
    default: return 'default';
  }
};

// **GENERIC: Data type detection function**
const detectColumnType = (columnName, values) => {
  if (values.length === 0) return { type: 'unknown', confidence: 0 };

  console.log(`🔍 Analyzing column: ${columnName}`, values.slice(0, 5));

  // **STEP 1: Check for actual date patterns FIRST (most restrictive)**
  if (isDateColumn(values)) {
    console.log(`📅 ${columnName} - Detected as date`);
    return { type: 'date', confidence: 0.9 };
  }

  // **STEP 2: Check for numeric data**
  if (isNumericColumn(values)) {
    // Check if it's actually binary (0,1 only)
    if (isBinaryColumn(values)) {
      console.log(`🎯 ${columnName} - Detected as binary`);
      return { type: 'binary', confidence: 0.9 };
    }
    
    // Check if it's categorical numeric (small range of integers)
    if (isCategoricalNumeric(values)) {
      console.log(`📋 ${columnName} - Detected as categorical numeric`);
      return { type: 'categorical', confidence: 0.85 };
    }
    
    console.log(`🔢 ${columnName} - Detected as numeric`);
    return { type: 'numeric', confidence: 0.85 };
  }

  // **STEP 3: Check for categorical patterns**
  if (isCategoricalColumn(values)) {
    console.log(`📋 ${columnName} - Detected as categorical`);
    return { type: 'categorical', confidence: 0.7 };
  }

  // **STEP 4: Default to text**
  console.log(`📝 ${columnName} - Defaulted to text`);
  return { type: 'text', confidence: 0.5 };
};

// **Enhanced date detection**
const isDateColumn = (values) => {
  if (values.length === 0) return false;
  
  // Skip simple numbers entirely (1, 2, 3, etc.)
  const hasOnlySimpleNumbers = values.every(val => {
    const str = String(val).trim();
    return /^\d{1,3}$/.test(str) && !str.includes('/') && !str.includes('-');
  });
  
  if (hasOnlySimpleNumbers) {
    console.log(`🚫 Skipping date detection: only simple numbers`);
    return false;
  }

  // Very specific date patterns
  const strictDatePatterns = [
    /^\d{1,2}\/\d{1,2}\/\d{4}$/,        // MM/DD/YYYY or M/D/YYYY
    /^\d{4}-\d{1,2}-\d{1,2}$/,          // YYYY-MM-DD or YYYY-M-D
    /^\d{1,2}-\d{1,2}-\d{4}$/,          // MM-DD-YYYY or M-D-YYYY
    /^\d{4}\/\d{1,2}\/\d{1,2}$/,        // YYYY/MM/DD or YYYY/M/D
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/, // ISO datetime
    /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/, // SQL datetime
    /^\w{3,9}\s+\d{1,2},?\s+\d{4}$/     // Month DD, YYYY (Jan 15, 2023)
  ];

  const sample = values.slice(0, Math.min(10, values.length));
  let validDateCount = 0;
  
  for (let val of sample) {
    const str = String(val).trim();
    
    if (!str) continue;
    
    const matchesPattern = strictDatePatterns.some(pattern => pattern.test(str));
    
    if (matchesPattern) {
      const date = new Date(str);
      if (!isNaN(date.getTime()) && date.getFullYear() >= 1900 && date.getFullYear() <= 2100) {
        validDateCount++;
        continue;
      }
    }
    
    // Secondary check for less strict date formats
    if (str.includes('/') || str.includes('-') || str.includes(' ')) {
      const date = new Date(str);
      if (!isNaN(date.getTime()) && date.getFullYear() >= 1900 && date.getFullYear() <= 2100) {
        if (!/^\d+$/.test(str)) {
          validDateCount++;
        }
      }
    }
  }
  
  const dateRatio = validDateCount / sample.length;
  const isDate = dateRatio >= 0.8;
  
  console.log(`📅 Date check:`, {
    sample: sample.slice(0, 3),
    validDateCount,
    total: sample.length,
    ratio: dateRatio.toFixed(2),
    isDate,
    hasOnlySimpleNumbers
  });
  
  return isDate;
};

// **Enhanced numeric detection**
const isNumericColumn = (values) => {
  if (values.length === 0) return false;
  
  const numericCount = values.filter(val => {
    if (val === null || val === undefined || val === '') return false;
    
    let str = String(val).trim();
    str = str.replace(/^["']|["']$/g, '');
    str = str.replace(/[,%$€£¥]/g, '');
    
    if (str.startsWith('(') && str.endsWith(')')) {
      str = '-' + str.slice(1, -1);
    }
    
    if (str.endsWith('%')) {
      str = str.slice(0, -1);
    }
    
    const num = parseFloat(str);
    return !isNaN(num) && isFinite(num);
  }).length;

  const numericRatio = numericCount / values.length;
  console.log(`🔢 Numeric check: ${numericCount}/${values.length} = ${numericRatio.toFixed(2)}`);
  
  return numericRatio >= 0.9;
};

// **Enhanced binary detection**
const isBinaryColumn = (values) => {
  if (values.length === 0) return false;
  
  const uniqueValues = new Set(values.map(val => String(val).toLowerCase().trim()));
  
  uniqueValues.delete('');
  uniqueValues.delete('null');
  uniqueValues.delete('undefined');
  
  const binaryPatterns = [
    new Set(['0', '1']),
    new Set(['true', 'false']),
    new Set(['yes', 'no']),
    new Set(['y', 'n']),
    new Set(['male', 'female']),
    new Set(['m', 'f']),
    new Set(['active', 'inactive']),
    new Set(['on', 'off']),
    new Set(['enabled', 'disabled'])
  ];
  
  const isBinary = binaryPatterns.some(pattern => {
    return uniqueValues.size <= 2 && [...uniqueValues].every(val => pattern.has(val));
  });
  
  console.log(`🎯 Binary check:`, {
    uniqueValues: [...uniqueValues],
    isBinary
  });
  
  return isBinary;
};

// Update the isCategoricalNumeric function with iterative approach
const isCategoricalNumeric = (values) => {
  if (!values || values.length === 0) return false;
  
  // Take a sample of values to prevent stack overflow
  const sampleSize = 1000;
  const sample = values.length > sampleSize ? 
    values.slice(0, sampleSize) : 
    values;

  // Process values iteratively instead of using map
  const numericValues = [];
  for (let i = 0; i < sample.length; i++) {
    const val = sample[i];
    if (val === null || val === undefined || val === '') continue;
    
    let str = String(val).trim();
    str = str.replace(/^["']|["']$/g, '');
    str = str.replace(/[,%$€£¥]/g, '');
    
    if (str.startsWith('(') && str.endsWith(')')) {
      str = '-' + str.slice(1, -1);
    }
    
    if (str.endsWith('%')) {
      str = str.slice(0, -1);
    }
    
    const num = parseFloat(str);
    if (!isNaN(num)) {
      numericValues.push(num);
    }
  }
  
  if (numericValues.length === 0) return false;
  
  // Use Set for unique values to improve performance
  const uniqueValues = new Set(numericValues);
  const min = Math.min(...numericValues);
  const max = Math.max(...numericValues);
  const range = max - min;
  
  const allIntegers = numericValues.every(val => Number.isInteger(val));
  const cardinality = uniqueValues.size;
  
  // Simplified categorical checks
  const isSmallRange = range <= 50;
  const isLowCardinality = cardinality <= 20;
  const hasReasonableValues = min >= 0 && max <= 100;
  
  return allIntegers && isSmallRange && isLowCardinality && hasReasonableValues;
};

// **Enhanced categorical detection**
const isCategoricalColumn = (values) => {
  if (values.length === 0) return false;
  
  const cleanValues = values.filter(val => val !== null && val !== undefined && val !== '');
  const uniqueValues = new Set(cleanValues);
  const cardinality = uniqueValues.size;

  const uniqueRatio = cardinality / cleanValues.length;
  
  const isLowUniqueRatio = uniqueRatio < 0.5;
  const hasVariation = cardinality > 1;
  const hasEnoughData = cleanValues.length >= 5;
  const isManageableCardinality = cardinality <= 50;
  
  const sampleValues = [...uniqueValues].slice(0, 10);
  const hasShortStrings = sampleValues.every(val => String(val).length <= 50);
  const hasRepeatedValues = cleanValues.length > cardinality * 2;
  
  const isCategorical = isLowUniqueRatio && hasVariation && hasEnoughData && 
                       isManageableCardinality && hasShortStrings && hasRepeatedValues;
  
  console.log(`📋 Categorical check:`, {
    cardinality,
    totalValues: cleanValues.length,
    uniqueRatio: uniqueRatio.toFixed(3),
    sampleValues: sampleValues.slice(0, 5),
    isCategorical
  });
  
  return isCategorical;
};

// **Enhanced validation functions**
const validateDateColumnImproved = (values, analysis) => {
  const parsedDates = values.map(val => {
    const date = new Date(val);
    return isNaN(date.getTime()) ? null : date;
  }).filter(date => date !== null);
  
  if (parsedDates.length === 0) {
    analysis.issues.push('No valid dates found');
    return;
  }

  const sortedDates = parsedDates.sort((a, b) => a - b);
  const dateRange = {
    start: sortedDates[0],
    end: sortedDates[sortedDates.length - 1]
  };

  const now = new Date();
  const veryOld = new Date(1900, 0, 1);
  const farFuture = new Date(now.getFullYear() + 50, 0, 1);

  if (dateRange.start < veryOld) {
    analysis.warnings.push('Contains very old dates (pre-1900)');
  }
  if (dateRange.end > farFuture) {
    analysis.warnings.push('Contains far future dates');
  }

  if (sortedDates.length > 1) {
    const intervals = [];
    for (let i = 1; i < sortedDates.length; i++) {
      intervals.push(sortedDates[i] - sortedDates[i-1]);
    }
    
    const avgInterval = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
    const days = avgInterval / (1000 * 60 * 60 * 24);
    
    if (days < 1) {
      analysis.suggestions.push('Sub-daily frequency detected');
    } else if (days <= 1.5) {
      analysis.suggestions.push('Daily frequency detected');
    } else if (days <= 8) {
      analysis.suggestions.push('Weekly frequency detected');
    } else if (days <= 35) {
      analysis.suggestions.push('Monthly frequency detected');
    } else if (days <= 100) {
      analysis.suggestions.push('Quarterly frequency detected');
    } else {
      analysis.suggestions.push('Yearly or irregular frequency detected');
    }
  }

  analysis.suggestions.push(
    `Date range: ${dateRange.start.toLocaleDateString()} to ${dateRange.end.toLocaleDateString()}`
  );

  const uniqueDates = new Set(parsedDates.map(d => d.toISOString()));
  if (uniqueDates.size !== parsedDates.length) {
    analysis.warnings.push('Duplicate dates found');
  }
};

const validateBinaryColumn = (values, analysis) => {
  const nonEmptyValues = values.filter(val => val !== null && val !== undefined && val !== '');
  const uniqueValues = new Set(nonEmptyValues.map(val => String(val).toLowerCase().trim()));
  
  if (uniqueValues.size > 2) {
    analysis.warnings.push(`More than 2 unique values for binary column (found ${uniqueValues.size})`);
  }
  
  const valueCounts = {};
  nonEmptyValues.forEach(val => {
    const key = String(val).toLowerCase().trim();
    valueCounts[key] = (valueCounts[key] || 0) + 1;
  });
  
  const counts = Object.values(valueCounts);
  if (counts.length === 2) {
    const minCount = Math.min(...counts);
    const maxCount = Math.max(...counts);
    const imbalanceRatio = minCount / maxCount;
    
    if (imbalanceRatio < 0.1) {
      analysis.warnings.push('Highly imbalanced binary data (>90% skewed)');
    } else if (imbalanceRatio < 0.3) {
      analysis.warnings.push('Moderately imbalanced binary data');
    }
  }

  const distribution = Object.entries(valueCounts)
    .map(([value, count]) => `${value}: ${count} (${(count/nonEmptyValues.length*100).toFixed(1)}%)`)
    .join(', ');
  analysis.suggestions.push(`Distribution: ${distribution}`);
};

const validateCategoricalColumn = (values, analysis) => {
  const nonEmptyValues = values.filter(val => val !== null && val !== undefined && val !== '');
  const uniqueValues = new Set(nonEmptyValues);
  const cardinality = uniqueValues.size;

  if (cardinality > nonEmptyValues.length * 0.8) {
    analysis.warnings.push('Very high cardinality - might be better as text/identifier');
  } else if (cardinality > 20) {
    analysis.warnings.push('High cardinality - consider grouping similar categories');
  }

  if (cardinality === 1) {
    analysis.warnings.push('Only one unique value - constant column');
  }

  if (cardinality >= 2 && cardinality <= 10) {
    analysis.suggestions.push('Good cardinality for categorical analysis');
  } else if (cardinality <= 20) {
    analysis.suggestions.push('Moderate cardinality - manageable for analysis');
  }

  const valueCounts = {};
  nonEmptyValues.forEach(val => {
    valueCounts[val] = (valueCounts[val] || 0) + 1;
  });

  const sortedCategories = Object.entries(valueCounts)
    .sort(([,a], [,b]) => b - a);

  const topCategories = sortedCategories
    .slice(0, 5)
    .map(([value, count]) => `${value} (${count})`)
    .join(', ');
  
  analysis.suggestions.push(`Top categories: ${topCategories}`);

  const hasVeryRareCategories = sortedCategories.some(([,count]) => count === 1);
  if (hasVeryRareCategories && cardinality > 5) {
    const rareCount = sortedCategories.filter(([,count]) => count === 1).length;
    analysis.warnings.push(`${rareCount} categories appear only once - consider data cleaning`);
  }
};

// Enhanced validation functions
const validateFileStructureImproved = (data) => {
  const results = {
    totalRows: data.length,
    totalColumns: data.length > 0 ? Object.keys(data[0]).length : 0,
    issues: [],
    warnings: [],
    suggestions: [],
    columnAnalysis: {}
  };

  if (data.length === 0) {
    results.issues.push('File contains no data rows');
    return results;
  }

  if (data.length < 10) {
    results.warnings.push(`Only ${data.length} rows detected. Consider having more data for better forecasting.`);
  }

  // Take a sample for large files
  const sampleSize = 1000;
  const dataSample = data.length > sampleSize ? 
    data.slice(0, sampleSize) : 
    data;

  // Analyze each column using the sample
  const columns = Object.keys(data[0]);
  columns.forEach(column => {
    const columnData = dataSample.map(row => row[column]);
    results.columnAnalysis[column] = analyzeColumnImproved(column, columnData);
  });

  return results;
};

// Replace the analyzeColumnImproved function with this corrected version:
const analyzeColumnImproved = (columnName, values) => {
  const analysis = {
    name: columnName,
    type: 'unknown',
    confidence: 0,
    nullCount: 0,
    uniqueCount: 0,
    issues: [],
    warnings: [],
    suggestions: [],
    samples: []
  };

  // Count nulls and get unique values
  const nonNullValues = values.filter(val => val !== null && val !== undefined && val !== '');
  analysis.nullCount = values.length - nonNullValues.length;
  analysis.uniqueCount = new Set(nonNullValues).size;
  analysis.samples = [...new Set(nonNullValues)].slice(0, 5);

  // Check for high null percentage
  const nullPercentage = (analysis.nullCount / values.length) * 100;
  if (nullPercentage > 50) {
    analysis.warnings.push(`${nullPercentage.toFixed(1)}% missing values`);
  }

  // Use the correct function name
  const detectedType = detectColumnType(columnName, nonNullValues);
  analysis.type = detectedType.type;
  analysis.confidence = detectedType.confidence;
  
  // Add type-specific suggestions - ✅ FIXED: Use correct function names
  switch (detectedType.type) {
    case 'date':
      analysis.suggestions.push('Good candidate for date column');
      validateDateColumnImproved(nonNullValues, analysis);  // ✅ This one exists
      break;
    case 'numeric':
      analysis.suggestions.push('Good candidate for target or numeric feature');
      validateNumericColumn(nonNullValues, analysis);  // ✅ FIXED: Remove 'Improved'
      break;
    case 'binary':
      analysis.suggestions.push('Binary column - good for flags/indicators');
      validateBinaryColumn(nonNullValues, analysis);  // ✅ FIXED: Remove 'Improved'
      break;
    case 'categorical':
      analysis.suggestions.push('Good candidate for level/grouping column');
      validateCategoricalColumn(nonNullValues, analysis);  // ✅ FIXED: Remove 'Improved'
      break;
    default:
      analysis.warnings.push('Mixed data types detected');
  }

  return analysis;
};

// Add the missing validateNumericColumn function:
const validateNumericColumn = (values, analysis) => {
  const numericValues = values.map(val => {
    if (val === null || val === undefined || val === '') return NaN;
    
    let str = String(val).trim();
    str = str.replace(/^["']|["']$/g, '');
    str = str.replace(/[,%$€£¥]/g, '');
    
    if (str.startsWith('(') && str.endsWith(')')) {
      str = '-' + str.slice(1, -1);
    }
    
    if (str.endsWith('%')) {
      str = str.slice(0, -1);
    }
    
    return parseFloat(str);
  }).filter(val => !isNaN(val));

  if (numericValues.length === 0) {
    analysis.issues.push('No valid numeric values found');
    return;
  }

  const stats = {
    min: Math.min(...numericValues),
    max: Math.max(...numericValues),
    mean: numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length
  };

  // Check for negative values
  if (stats.min < 0) {
    analysis.warnings.push(`Contains negative values (minimum: ${stats.min.toFixed(2)})`);
  }

  // Check for zero values
  const zeroCount = numericValues.filter(val => val === 0).length;
  if (zeroCount > numericValues.length * 0.1) {
    const zeroPercentage = (zeroCount / numericValues.length * 100).toFixed(1);
    analysis.warnings.push(`${zeroPercentage}% zero values`);
  }

  // Enhanced outlier detection
  const sorted = numericValues.sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = q3 - q1;
  
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;
  const outliers = numericValues.filter(val => val < lowerBound || val > upperBound);
  
  if (outliers.length > 0) {
    const outlierPercentage = (outliers.length / numericValues.length * 100).toFixed(1);
    analysis.warnings.push(`${outlierPercentage}% potential outliers detected`);
  }

  // Add basic numeric validation
  analysis.suggestions.push(`Data range: ${stats.min.toFixed(2)} to ${stats.max.toFixed(2)} | Mean: ${stats.mean.toFixed(2)}`);
};