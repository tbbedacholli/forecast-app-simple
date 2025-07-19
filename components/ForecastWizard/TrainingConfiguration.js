// components/ForecastWizard/TrainingConfiguration.js
'use client';
import { useState } from 'react';
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
  Divider,
  ButtonGroup,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  LinearProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Collapse,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import { 
  Download,
  PlayArrow,
  CheckCircle,
  Settings,
  Description,
  CloudDownload,
  AutoFixHigh,
  TrendingUp,
  DataUsage,
  Timeline,
  ExpandMore,
  ExpandLess,
  Storage,
  Speed,
  Insights,
  Assessment,
  Analytics,
  CloudQueue,
  FileDownload,
  Info
} from '@mui/icons-material';

import { 
  processDataForTraining, 
  generateProcessedFileName, 
  generateConfigFile,
  convertToCSV, 
  downloadCSV,
  downloadJSON
} from '../../utils/dataProcessor';

export default function TrainingConfiguration({ data, onUpdate, onNext, onBack, setError, setLoading }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedData, setProcessedData] = useState(null);
  const [processedFileName, setProcessedFileName] = useState('');
  const [configData, setConfigData] = useState(null);
  const [configFileName, setConfigFileName] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [processedFileS3, setProcessedFileS3] = useState(null);
  const [configFileS3, setConfigFileS3] = useState(null);
  const [showConfigPreview, setShowConfigPreview] = useState(false);
  const [showDataPreview, setShowDataPreview] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);

  const handleStartTraining = async () => {
    try {
      setIsProcessing(true);
      setError('');
      setProcessingStep(0);

      // Validate required data
      if (!data.rawData || data.rawData.length === 0) {
        throw new Error('No data available for processing');
      }

      if (!data.selectedColumns?.target) {
        throw new Error('Please select a target column');
      }

      if (!data.selectedColumns?.date) {
        throw new Error('Please select a date column');
      }

      // Step 1: Data validation
      setProcessingStep(1);
      await new Promise(resolve => setTimeout(resolve, 800));

      // Step 2: Processing data
      setProcessingStep(2);
      console.log('🔄 Processing data for training...');
      
      const processed = processDataForTraining(
        data.rawData, 
        data.featureClassification, 
        data.selectedColumns
      );

      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 3: Generate configuration
      setProcessingStep(3);
      const originalFileName = data.fileName || 'data.csv';
      const csvFileName = generateProcessedFileName(originalFileName);
      const jsonFileName = csvFileName.replace('.csv', '_config.json');

      console.log('🔄 Generating config file...');
      const config = generateConfigFile(data, csvFileName);

      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 4: Complete
      setProcessingStep(4);
      console.log('✅ Data processed successfully');

      setProcessedData(processed);
      setProcessedFileName(csvFileName);
      setConfigData(config);
      setConfigFileName(jsonFileName);

      // Update parent component with processed data
      onUpdate({
        ...data,
        processedData: processed,
        processedFileName: csvFileName,
        configData: config,
        configFileName: jsonFileName,
        isProcessed: true
      });

    } catch (error) {
      console.error('❌ Error processing data:', error);
      setError(`Failed to process data: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadProcessed = async () => {
    if (!processedData || processedData.length === 0) {
      setError('No processed data available for download');
      return;
    }

    try {
      setIsDownloading(true);
      
      const csvContent = convertToCSV(processedData);
      
      const response = await fetch('/api/wizard/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'csv',
          data: csvContent,
          fileName: processedFileName,
          metadata: {
            originalFile: data.fileName,
            rowCount: processedData.length.toString(),
            processedAt: new Date().toISOString(),
            targetColumn: data.selectedColumns?.target,
            dateColumn: data.selectedColumns?.date
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to prepare download');
      }

      const result = await response.json();
      setProcessedFileS3(result.s3Info);
      window.open(result.downloadUrl, '_blank');
      
    } catch (error) {
      console.error('❌ Download error:', error);
      setError(`Failed to download processed data: ${error.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadConfig = async () => {
    if (!configData) {
      setError('No config data available for download');
      return;
    }

    try {
      setIsDownloading(true);
      
      const response = await fetch('/api/wizard/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'config',
          data: configData,
          fileName: configFileName,
          metadata: {
            originalFile: data.fileName,
            targetColumn: configData.target,
            predictionLength: configData.prediction_length.toString(),
            featuresCount: configData.dynamic_features.length.toString(),
            generatedAt: new Date().toISOString()
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to prepare config download');
      }

      const result = await response.json();
      setConfigFileS3(result.s3Info);
      window.open(result.downloadUrl, '_blank');
      
    } catch (error) {
      console.error('❌ Config download error:', error);
      setError(`Failed to download config file: ${error.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSaveToBoth = async () => {
    try {
      setIsDownloading(true);
      let csvResult = null;
      let configResult = null;
      
      // Save processed CSV
      if (processedData && processedData.length > 0) {
        try {
          const csvContent = convertToCSV(processedData);
          
          const csvResponse = await fetch('/api/wizard/download', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'csv',
              data: csvContent,
              fileName: processedFileName,
              metadata: {
                originalFile: data.fileName,
                rowCount: processedData.length.toString(),
                processedAt: new Date().toISOString(),
                targetColumn: data.selectedColumns?.target,
                dateColumn: data.selectedColumns?.date
              }
            })
          });

          if (!csvResponse.ok) {
            throw new Error(`CSV upload failed: ${csvResponse.status} ${csvResponse.statusText}`);
          }

          csvResult = await csvResponse.json();
          setProcessedFileS3(csvResult.s3Info);
        } catch (csvError) {
          setError(`Failed to save CSV: ${csvError.message}`);
        }
      }
      
      // Save config JSON
      if (configData) {
        try {
          const configResponse = await fetch('/api/wizard/download', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'config',
              data: configData,
              fileName: configFileName,
              metadata: {
                originalFile: data.fileName,
                targetColumn: configData.target,
                predictionLength: configData.prediction_length.toString(),
                featuresCount: configData.dynamic_features.length.toString(),
                generatedAt: new Date().toISOString()
              }
            })
          });

          if (!configResponse.ok) {
            throw new Error(`Config upload failed: ${configResponse.status} ${configResponse.statusText}`);
          }

          configResult = await configResponse.json();
          setConfigFileS3(configResult.s3Info);
        } catch (configError) {
          setError(`Failed to save Config: ${configError.message}`);
        }
      }
      
    } catch (error) {
      setError(`Failed to save files: ${error.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const getConfigurationSummary = () => {
    const summary = [];
    
    if (data.selectedColumns?.target) {
      summary.push({ label: 'Target Column', value: data.selectedColumns.target, icon: <TrendingUp /> });
    }
    
    if (data.selectedColumns?.date) {
      summary.push({ label: 'Date Column', value: data.selectedColumns.date, icon: <Timeline /> });
    }
    
    if (data.selectedColumns?.level && data.selectedColumns.level.length > 0) {
      summary.push({ label: 'Level Columns', value: data.selectedColumns.level.join(', '), icon: <DataUsage /> });
    }

    const futureFeatures = Object.keys(data.futureValues || {}).filter(col => data.futureValues[col]);
    if (futureFeatures.length > 0) {
      summary.push({ label: 'Future Features', value: futureFeatures.join(', '), icon: <Insights /> });
    }

    return summary;
  };

  const getFeatureSummary = () => {
    if (!data.featureClassification?.columnRoles) return { total: 0, features: 0, ignored: 0 };
    
    const roles = Object.values(data.featureClassification.columnRoles);
    return {
      total: roles.length,
      features: roles.filter(role => role === 'Feature').length,
      ignored: roles.filter(role => role === 'Ignore').length,
      target: roles.filter(role => role === 'Target').length,
      date: roles.filter(role => role === 'Date').length
    };
  };

  const getProcessingSteps = () => [
    { label: 'Validating Configuration', icon: <Assessment /> },
    { label: 'Processing Data', icon: <Speed /> },
    { label: 'Generating Configuration', icon: <Settings /> },
    { label: 'Finalizing Training Setup', icon: <CheckCircle /> }
  ];

  const getDataQualityScore = () => {
    const featureCount = getFeatureSummary().features;
    const rowCount = data.rawData?.length || 0;
    const hasTarget = data.selectedColumns?.target ? 20 : 0;
    const hasDate = data.selectedColumns?.date ? 20 : 0;
    const featuresScore = Math.min(30, featureCount * 5);
    const volumeScore = Math.min(30, rowCount / 100);
    
    return Math.min(100, hasTarget + hasDate + featuresScore + volumeScore);
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 3 }}>
        Step 5: Training Configuration
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Ready to process your data for training!</strong>
          <br />
          Review your configuration below and start the training preparation process.
        </Typography>
      </Alert>

      {/* Configuration Overview Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Analytics color="primary" />
            <Typography variant="h6">Configuration Overview</Typography>
          </Box>
          
          <Grid container spacing={3}>
            {/* Data Quality Score */}
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
                <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                  {getDataQualityScore()}%
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Data Quality Score
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={getDataQualityScore()} 
                  sx={{ mt: 1, height: 6, borderRadius: 3 }}
                  color={getDataQualityScore() >= 80 ? 'success' : getDataQualityScore() >= 60 ? 'warning' : 'error'}
                />
              </Box>
            </Grid>

            {/* Dataset Stats */}
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Chip 
                  icon={<Storage />} 
                  label={`${(data.rawData?.length || 0).toLocaleString()} rows`} 
                  variant="outlined" 
                  color="primary"
                />
                <Chip 
                  icon={<DataUsage />} 
                  label={`${data.columns?.length || 0} total columns`} 
                  variant="outlined" 
                  color="secondary"
                />
                <Chip 
                  icon={<TrendingUp />} 
                  label={`${getFeatureSummary().features} features`} 
                  variant="outlined" 
                  color="success"
                />
              </Box>
            </Grid>

            {/* Configuration Summary */}
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Selected Configuration:
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {getConfigurationSummary().map((item, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {item.icon}
                    <Typography variant="body2">
                      <strong>{item.label}:</strong> {item.value}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Grid>
          </Grid>

          {data.futureValuesFile && (
            <Alert severity="success" sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CloudQueue />
                <Typography variant="body2">
                  <strong>Future Values File:</strong> {data.futureValuesFile.name} uploaded
                </Typography>
              </Box>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Processing Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <AutoFixHigh color="primary" />
            <Typography variant="h6">Data Processing</Typography>
          </Box>
          
          {!processedData ? (
            <Box>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                Transform your data into a training-ready format. This process will clean, validate, 
                and structure your data according to the selected configuration parameters.
              </Typography>
              
              {/* Processing Steps Preview */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                  Processing Steps:
                </Typography>
                <Grid container spacing={2}>
                  {getProcessingSteps().map((step, index) => (
                    <Grid item xs={12} sm={6} md={3} key={index}>
                      <Card variant="outlined" sx={{ p: 2, textAlign: 'center', bgcolor: '#fafafa' }}>
                        <Box sx={{ color: 'primary.main', mb: 1 }}>
                          {step.icon}
                        </Box>
                        <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                          {step.label}
                        </Typography>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>

              {/* Processing Progress */}
              {isProcessing && (
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <CircularProgress size={20} />
                    <Typography variant="body2">
                      Processing... Step {processingStep} of {getProcessingSteps().length}
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={(processingStep / getProcessingSteps().length) * 100} 
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    {getProcessingSteps()[processingStep - 1]?.label}
                  </Typography>
                </Box>
              )}
              
              <Button
                variant="contained"
                startIcon={isProcessing ? <CircularProgress size={20} /> : <PlayArrow />}
                onClick={handleStartTraining}
                disabled={isProcessing}
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
                {isProcessing ? 'Processing Data...' : 'Start Training Preparation'}
              </Button>
            </Box>
          ) : (
            <Box>
              {/* Success Alert */}
              <Alert severity="success" sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircle />
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Data processed successfully!
                    </Typography>
                    <Typography variant="body2">
                      {processedData.length.toLocaleString()} rows prepared for training with optimized features.
                    </Typography>
                  </Box>
                </Box>
              </Alert>

              {/* Download Actions */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                  Download Training Files:
                </Typography>
                
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>File Type</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Size</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Description color="primary" />
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              Training CSV
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="textSecondary">
                            Processed dataset ready for model training
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={`${processedData.length} rows`} 
                            size="small" 
                            color="primary" 
                            variant="outlined" 
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            startIcon={<FileDownload />}
                            onClick={handleDownloadProcessed}
                            disabled={isDownloading}
                            size="small"
                            variant="outlined"
                          >
                            Download
                          </Button>
                        </TableCell>
                      </TableRow>
                      
                      <TableRow>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Settings color="secondary" />
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              Config JSON
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="textSecondary">
                            Model configuration and parameters
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={`${configData?.dynamic_features?.length || 0} features`} 
                            size="small" 
                            color="secondary" 
                            variant="outlined" 
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            startIcon={<FileDownload />}
                            onClick={handleDownloadConfig}
                            disabled={isDownloading}
                            size="small"
                            variant="outlined"
                          >
                            Download
                          </Button>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Cloud Save Button */}
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <Button
                    variant="contained"
                    startIcon={isDownloading ? <CircularProgress size={16} /> : <CloudDownload />}
                    onClick={handleSaveToBoth}
                    disabled={isDownloading}
                    size="large"
                    sx={{
                      px: 4,
                      py: 1.5,
                      background: 'linear-gradient(45deg, #4CAF50 30%, #66BB6A 90%)',
                      boxShadow: '0 3px 5px 2px rgba(76, 175, 80, .3)',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #388E3C 30%, #4CAF50 90%)',
                      }
                    }}
                  >
                    {isDownloading ? 'Saving to Cloud...' : 'Save All to Cloud Storage'}
                  </Button>
                </Box>
              </Box>

              {/* File Info */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                <Typography variant="caption" color="textSecondary">
                  📄 <strong>CSV File:</strong> {processedFileName}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  ⚙️ <strong>Config File:</strong> {configFileName}
                </Typography>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Configuration Preview */}
      {configData && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Settings color="primary" />
                <Typography variant="h6">Training Configuration</Typography>
              </Box>
              <Button
                onClick={() => setShowConfigPreview(!showConfigPreview)}
                endIcon={showConfigPreview ? <ExpandLess /> : <ExpandMore />}
                size="small"
              >
                {showConfigPreview ? 'Hide' : 'Show'} Details
              </Button>
            </Box>

            {/* Quick Config Summary */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              <Chip label={`Target: ${configData.target}`} color="primary" />
              <Chip label={`Features: ${configData.dynamic_features?.length || 0}`} color="secondary" />
              <Chip label={`Prediction Length: ${configData.prediction_length}`} color="info" />
            </Box>
            
            <Collapse in={showConfigPreview}>
              <Box sx={{ bgcolor: '#f8f9fa', p: 2, borderRadius: 1, border: '1px solid #e0e0e0' }}>
                <pre style={{ fontSize: '12px', margin: 0, whiteSpace: 'pre-wrap', overflow: 'auto' }}>
                  {JSON.stringify(configData, null, 2)}
                </pre>
              </Box>
            </Collapse>
          </CardContent>
        </Card>
      )}

      {/* Data Preview */}
      {processedData && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <DataUsage color="primary" />
                <Typography variant="h6">Processed Data Preview</Typography>
              </Box>
              <Button
                onClick={() => setShowDataPreview(!showDataPreview)}
                endIcon={showDataPreview ? <ExpandLess /> : <ExpandMore />}
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
                      {processedData[0] && Object.keys(processedData[0]).map((column) => (
                        <TableCell key={column} sx={{ fontWeight: 600 }}>
                          {column}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {processedData.slice(0, 10).map((row, index) => (
                      <TableRow key={index}>
                        {Object.values(row).map((value, cellIndex) => (
                          <TableCell key={cellIndex}>
                            {String(value)}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                Showing first 10 rows of {processedData.length.toLocaleString()} total rows
              </Typography>
            </Collapse>
          </CardContent>
        </Card>
      )}

      {/* S3 Storage Status */}
      {(processedFileS3 || configFileS3) && (
        <Alert severity="success" sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <CloudQueue />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Files successfully saved to cloud storage:
            </Typography>
          </Box>
          
          <List dense>
            {processedFileS3 && (
              <ListItem sx={{ py: 0 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <Description fontSize="small" />
                </ListItemIcon>
                <ListItemText 
                  primary="Training CSV" 
                  secondary={processedFileS3.key}
                  primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                  secondaryTypographyProps={{ variant: 'caption' }}
                />
              </ListItem>
            )}
            {configFileS3 && (
              <ListItem sx={{ py: 0 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <Settings fontSize="small" />
                </ListItemIcon>
                <ListItemText 
                  primary="Configuration JSON" 
                  secondary={configFileS3.key}
                  primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                  secondaryTypographyProps={{ variant: 'caption' }}
                />
              </ListItem>
            )}
          </List>
          
          <Typography variant="body2" sx={{ fontSize: '0.8rem', mt: 1, fontStyle: 'italic', opacity: 0.8 }}>
            Files are securely stored with 24-hour download access. Use these for model training in your ML pipeline.
          </Typography>
        </Alert>
      )}

      {/* Navigation */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button onClick={onBack} size="large">
          Back
        </Button>
        <Button 
          variant="contained" 
          onClick={onNext}
          disabled={!processedData}
          size="large"
          sx={{
            px: 4,
            py: 1.5,
          }}
        >
          Next: View Training Results
        </Button>
      </Box>
    </Box>
  );
}