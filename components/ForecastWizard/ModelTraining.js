// components/ForecastWizard/ModelTraining.js
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
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Divider
} from '@mui/material';
import {
  PlayArrow,
  CheckCircle,
  Error,
  Warning,
  ModelTraining as ModelTrainingIcon,
  Timeline,
  Analytics,
  Speed,
  Memory,
  TrendingUp,
  Assessment,
  CloudQueue,
  Storage,
  Insights,
  Science,
  AutoGraph,
  DataUsage,
  ExpandMore,
  ExpandLess,
  Refresh,
  Stop,
  Download,
  Info
} from '@mui/icons-material';

export default function ModelTraining({ data, onUpdate, onNext, onBack, setError, setLoading }) {
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [trainingStep, setTrainingStep] = useState(0);
  const [trainingResults, setTrainingResults] = useState(null);
  const [trainingLogs, setTrainingLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [estimatedTime, setEstimatedTime] = useState(null);
  const [startTime, setStartTime] = useState(null);

  const trainingSteps = [
    { label: 'Initializing Training Environment', duration: 10, icon: <Science /> },
    { label: 'Loading and Validating Data', duration: 15, icon: <Storage /> },
    { label: 'Feature Engineering', duration: 20, icon: <AutoGraph /> },
    { label: 'Model Training', duration: 45, icon: <ModelTrainingIcon /> },
    { label: 'Model Validation', duration: 8, icon: <Assessment /> },
    { label: 'Generating Predictions', duration: 2, icon: <TrendingUp /> }
  ];

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setTrainingLogs(prev => [...prev, { message, type, timestamp }]);
  };

  const handleStartTraining = async () => {
    if (!data.processedData || !data.configData) {
      setError('No processed data or configuration available. Please complete the previous steps.');
      return;
    }

    try {
      setIsTraining(true);
      setTrainingProgress(0);
      setTrainingStep(0);
      setTrainingLogs([]);
      setStartTime(new Date());
      setError('');

      // Calculate estimated time
      const totalDuration = trainingSteps.reduce((sum, step) => sum + step.duration, 0);
      setEstimatedTime(totalDuration);

      addLog('🚀 Starting model training process...', 'success');
      addLog(`📊 Dataset: ${data.processedData.length.toLocaleString()} rows`, 'info');
      addLog(`🎯 Target: ${data.selectedColumns.target}`, 'info');
      addLog(`📅 Date column: ${data.selectedColumns.date}`, 'info');

      // Simulate training process
      for (let i = 0; i < trainingSteps.length; i++) {
        setTrainingStep(i + 1);
        const step = trainingSteps[i];
        
        addLog(`⏳ ${step.label}...`, 'info');
        
        // Simulate step duration
        const stepDuration = step.duration * 100; // Convert to milliseconds for demo
        const progressIncrement = step.duration / totalDuration * 100;
        
        for (let progress = 0; progress <= step.duration; progress++) {
          await new Promise(resolve => setTimeout(resolve, stepDuration / step.duration));
          setTrainingProgress(prev => Math.min(100, prev + (progressIncrement / step.duration)));
        }
        
        addLog(`✅ ${step.label} completed`, 'success');
      }

      // Generate mock training results
      const results = generateMockResults();
      setTrainingResults(results);
      
      addLog('🎉 Model training completed successfully!', 'success');
      addLog(`📈 Final accuracy: ${results.accuracy}%`, 'success');
      addLog(`⚡ Training time: ${Math.round((new Date() - startTime) / 1000)}s`, 'info');

      // Update parent component
      onUpdate({
        ...data,
        trainingResults: results,
        isTrainingComplete: true
      });

    } catch (error) {
      console.error('❌ Training error:', error);
      addLog(`❌ Training failed: ${error.message}`, 'error');
      setError(`Training failed: ${error.message}`);
    } finally {
      setIsTraining(false);
    }
  };

  const generateMockResults = () => {
    const accuracy = 85 + Math.random() * 12; // 85-97%
    const mae = 0.05 + Math.random() * 0.1; // 0.05-0.15
    const rmse = 0.08 + Math.random() * 0.12; // 0.08-0.20
    
    return {
      accuracy: Math.round(accuracy * 100) / 100,
      mae: Math.round(mae * 1000) / 1000,
      rmse: Math.round(rmse * 1000) / 1000,
      trainingTime: Math.round((new Date() - startTime) / 1000),
      features: data.configData?.dynamic_features?.length || 0,
      epochs: 50 + Math.floor(Math.random() * 50),
      modelSize: Math.round((5 + Math.random() * 15) * 100) / 100, // 5-20 MB
      predictions: generateMockPredictions()
    };
  };

  const generateMockPredictions = () => {
    // Generate sample predictions for visualization
    return Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      predicted: Math.round((100 + Math.random() * 200) * 100) / 100,
      confidence: Math.round((70 + Math.random() * 25) * 100) / 100
    }));
  };

  const getTrainingScore = () => {
    if (!trainingResults) return 0;
    return Math.min(100, trainingResults.accuracy);
  };

  const getLogIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle fontSize="small" color="success" />;
      case 'error': return <Error fontSize="small" color="error" />;
      case 'warning': return <Warning fontSize="small" color="warning" />;
      default: return <Info fontSize="small" color="info" />;
    }
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 3 }}>
        Step 6: Model Training
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Ready to train your forecasting model!</strong>
          <br />
          This process will use your processed data and configuration to train an optimized forecasting model.
        </Typography>
      </Alert>

      {/* Training Overview Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <ModelTrainingIcon color="primary" />
            <Typography variant="h6">Training Overview</Typography>
          </Box>
          
          <Grid container spacing={3}>
            {/* Model Score */}
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
                <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                  {trainingResults ? `${getTrainingScore()}%` : '--'}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Model Accuracy
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={getTrainingScore()} 
                  sx={{ mt: 1, height: 6, borderRadius: 3 }}
                  color={getTrainingScore() >= 90 ? 'success' : getTrainingScore() >= 75 ? 'warning' : 'error'}
                />
              </Box>
            </Grid>

            {/* Training Stats */}
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Chip 
                  icon={<DataUsage />} 
                  label={`${(data.processedData?.length || 0).toLocaleString()} training samples`} 
                  variant="outlined" 
                  color="primary"
                />
                <Chip 
                  icon={<AutoGraph />} 
                  label={`${data.configData?.dynamic_features?.length || 0} features`} 
                  variant="outlined" 
                  color="secondary"
                />
                <Chip 
                  icon={<Timeline />} 
                  label={`${data.configData?.prediction_length || 0} step forecast`} 
                  variant="outlined" 
                  color="success"
                />
              </Box>
            </Grid>

            {/* Training Configuration */}
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Training Configuration:
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TrendingUp />
                  <Typography variant="body2">
                    <strong>Target:</strong> {data.selectedColumns?.target}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Timeline />
                  <Typography variant="body2">
                    <strong>Date:</strong> {data.selectedColumns?.date}
                  </Typography>
                </Box>
                {trainingResults && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Speed />
                    <Typography variant="body2">
                      <strong>Training Time:</strong> {trainingResults.trainingTime}s
                    </Typography>
                  </Box>
                )}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Training Process Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Science color="primary" />
            <Typography variant="h6">Training Process</Typography>
          </Box>
          
          {!trainingResults ? (
            <Box>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                Train a state-of-the-art forecasting model using your prepared data. The training process 
                includes automated feature engineering, hyperparameter optimization, and model validation.
              </Typography>
              
              {/* Training Steps Preview */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                  Training Pipeline:
                </Typography>
                <Grid container spacing={2}>
                  {trainingSteps.map((step, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                      <Card 
                        variant="outlined" 
                        sx={{ 
                          p: 2, 
                          textAlign: 'center', 
                          bgcolor: isTraining && trainingStep > index ? '#e8f5e8' : 
                                   isTraining && trainingStep === index + 1 ? '#fff3e0' : '#fafafa',
                          border: isTraining && trainingStep === index + 1 ? '2px solid #ff9800' : '1px solid #e0e0e0'
                        }}
                      >
                        <Box sx={{ 
                          color: isTraining && trainingStep > index ? 'success.main' : 
                                 isTraining && trainingStep === index + 1 ? 'warning.main' : 'primary.main', 
                          mb: 1 
                        }}>
                          {isTraining && trainingStep > index ? <CheckCircle /> : step.icon}
                        </Box>
                        <Typography variant="body2" sx={{ fontSize: '0.85rem', mb: 0.5 }}>
                          {step.label}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          ~{step.duration}s
                        </Typography>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>

              {/* Training Progress */}
              {isTraining && (
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CircularProgress size={20} />
                      <Typography variant="body2">
                        Training in progress... Step {trainingStep} of {trainingSteps.length}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="textSecondary">
                      {Math.round(trainingProgress)}%
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={trainingProgress} 
                    sx={{ height: 8, borderRadius: 4, mb: 1 }}
                  />
                  <Typography variant="body2" color="textSecondary">
                    {trainingSteps[trainingStep - 1]?.label || 'Preparing...'}
                  </Typography>
                  {estimatedTime && (
                    <Typography variant="caption" color="textSecondary">
                      Estimated time remaining: {Math.max(0, Math.round((estimatedTime * (100 - trainingProgress)) / 100))}s
                    </Typography>
                  )}
                </Box>
              )}
              
              <Button
                variant="contained"
                startIcon={isTraining ? <CircularProgress size={20} /> : <PlayArrow />}
                onClick={handleStartTraining}
                disabled={isTraining || !data.processedData || !data.configData}
                size="large"
                sx={{ 
                  px: 4, 
                  py: 1.5,
                  background: 'linear-gradient(45deg, #FF6B35 30%, #F7931E 90%)',
                  boxShadow: '0 3px 5px 2px rgba(255, 107, 53, .3)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #E55A2B 30%, #E8851B 90%)',
                  }
                }}
              >
                {isTraining ? 'Training Model...' : 'Start Model Training'}
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
                      Model training completed successfully!
                    </Typography>
                    <Typography variant="body2">
                      Your forecasting model achieved {trainingResults.accuracy}% accuracy with excellent performance metrics.
                    </Typography>
                  </Box>
                </Box>
              </Alert>

              {/* Training Results */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                  Training Results:
                </Typography>
                
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Metric</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Value</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Assessment color="primary" />
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              Accuracy
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={`${trainingResults.accuracy}%`} 
                            color={trainingResults.accuracy >= 90 ? 'success' : trainingResults.accuracy >= 75 ? 'warning' : 'error'}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="textSecondary">
                            Overall model prediction accuracy
                          </Typography>
                        </TableCell>
                      </TableRow>
                      
                      <TableRow>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TrendingUp color="secondary" />
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              MAE
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={trainingResults.mae} 
                            variant="outlined"
                            color="secondary"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="textSecondary">
                            Mean Absolute Error
                          </Typography>
                        </TableCell>
                      </TableRow>

                      <TableRow>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Analytics color="info" />
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              RMSE
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={trainingResults.rmse} 
                            variant="outlined"
                            color="info"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="textSecondary">
                            Root Mean Square Error
                          </Typography>
                        </TableCell>
                      </TableRow>

                      <TableRow>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Speed color="success" />
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              Training Time
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={`${trainingResults.trainingTime}s`} 
                            variant="outlined"
                            color="success"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="textSecondary">
                            Total time to train the model
                          </Typography>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>

              {/* Model Details */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                    <AutoGraph color="primary" sx={{ mb: 1 }} />
                    <Typography variant="h6" color="primary">
                      {trainingResults.features}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Features Used
                    </Typography>
                  </Card>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Card variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                    <Refresh color="secondary" sx={{ mb: 1 }} />
                    <Typography variant="h6" color="secondary">
                      {trainingResults.epochs}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Training Epochs
                    </Typography>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Card variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                    <Memory color="info" sx={{ mb: 1 }} />
                    <Typography variant="h6" color="info">
                      {trainingResults.modelSize}MB
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Model Size
                    </Typography>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Card variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                    <Timeline color="success" sx={{ mb: 1 }} />
                    <Typography variant="h6" color="success">
                      {data.configData?.prediction_length || 0}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Forecast Steps
                    </Typography>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Training Logs */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Analytics color="primary" />
              <Typography variant="h6">Training Logs</Typography>
              {trainingLogs.length > 0 && (
                <Chip 
                  label={`${trainingLogs.length} entries`} 
                  size="small" 
                  variant="outlined" 
                />
              )}
            </Box>
            <Button
              onClick={() => setShowLogs(!showLogs)}
              endIcon={showLogs ? <ExpandLess /> : <ExpandMore />}
              size="small"
              disabled={trainingLogs.length === 0}
            >
              {showLogs ? 'Hide' : 'Show'} Logs
            </Button>
          </Box>
          
          <Collapse in={showLogs}>
            <Box sx={{ 
              bgcolor: '#f8f9fa', 
              p: 2, 
              borderRadius: 1, 
              border: '1px solid #e0e0e0',
              maxHeight: 300,
              overflow: 'auto'
            }}>
              {trainingLogs.length > 0 ? (
                <List dense>
                  {trainingLogs.map((log, index) => (
                    <ListItem key={index} sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        {getLogIcon(log.type)}
                      </ListItemIcon>
                      <ListItemText 
                        primary={
                          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                            [{log.timestamp}] {log.message}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 2 }}>
                  No training logs available yet. Start training to see real-time progress.
                </Typography>
              )}
            </Box>
          </Collapse>
        </CardContent>
      </Card>

      {/* Sample Predictions Preview */}
      {trainingResults && trainingResults.predictions && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUp color="primary" />
                <Typography variant="h6">Sample Predictions</Typography>
              </Box>
              <Button
                onClick={() => setShowResults(!showResults)}
                endIcon={showResults ? <ExpandLess /> : <ExpandMore />}
                size="small"
              >
                {showResults ? 'Hide' : 'Show'} Predictions
              </Button>
            </Box>
            
            <Collapse in={showResults}>
              <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 400 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Predicted Value</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Confidence</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {trainingResults.predictions.slice(0, 10).map((pred, index) => (
                      <TableRow key={index}>
                        <TableCell>{pred.date}</TableCell>
                        <TableCell>
                          <Chip 
                            label={pred.predicted} 
                            size="small" 
                            color="primary" 
                            variant="outlined" 
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2">
                              {pred.confidence}%
                            </Typography>
                            <LinearProgress 
                              variant="determinate" 
                              value={pred.confidence} 
                              sx={{ width: 60, height: 4 }}
                              color={pred.confidence >= 80 ? 'success' : pred.confidence >= 60 ? 'warning' : 'error'}
                            />
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                Showing first 10 predictions of {trainingResults.predictions.length} total forecasted values
              </Typography>
            </Collapse>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button onClick={onBack} size="large">
          Back
        </Button>
        <Button 
          variant="contained" 
          onClick={onNext}
          disabled={!trainingResults}
          size="large"
          sx={{
            px: 4,
            py: 1.5,
          }}
        >
          Complete Wizard
        </Button>
      </Box>
    </Box>
  );
}