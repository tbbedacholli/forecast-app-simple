// components/ForecastContent.js
'use client';
import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  LinearProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as RunIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';

// Sample forecast models
const forecastModels = [
  {
    id: 1,
    name: 'Revenue Prediction Q1',
    type: 'Revenue',
    algorithm: 'ARIMA',
    accuracy: '94.2%',
    lastRun: '2024-01-15 14:30',
    status: 'Active',
    nextRun: '2024-01-16 02:00'
  },
  {
    id: 2,
    name: 'User Growth Forecast',
    type: 'User Metrics',
    algorithm: 'Linear Regression',
    accuracy: '87.5%',
    lastRun: '2024-01-15 12:15',
    status: 'Active',
    nextRun: '2024-01-16 01:00'
  },
  {
    id: 3,
    name: 'Market Share Analysis',
    type: 'Market',
    algorithm: 'Random Forest',
    accuracy: '91.8%',
    lastRun: '2024-01-14 18:45',
    status: 'Paused',
    nextRun: 'Manual'
  }
];

const quickForecastTemplates = [
  { name: 'Revenue Forecast', description: 'Predict revenue for next quarter', icon: '💰' },
  { name: 'User Growth', description: 'Forecast user acquisition trends', icon: '👥' },
  { name: 'Sales Pipeline', description: 'Predict sales conversion rates', icon: '📊' },
  { name: 'Churn Prediction', description: 'Identify users likely to churn', icon: '⚠️' }
];

export default function ForecastContent() {
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedModel, setSelectedModel] = useState(null);
  const [runningForecast, setRunningForecast] = useState(false);
  const [newModel, setNewModel] = useState({
    name: '',
    type: 'Revenue',
    algorithm: 'ARIMA',
    dataSource: 'sales_data',
    schedule: 'daily'
  });

  const handleCreateModel = () => {
    setOpenDialog(true);
    setSelectedModel(null);
    setNewModel({
      name: '',
      type: 'Revenue',
      algorithm: 'ARIMA',
      dataSource: 'sales_data',
      schedule: 'daily'
    });
  };

  const handleRunForecast = (modelId) => {
    setRunningForecast(true);
    // Simulate forecast run
    setTimeout(() => {
      setRunningForecast(false);
      alert(`Forecast model ${modelId} completed successfully!`);
    }, 3000);
  };

  const handleSaveModel = () => {
    console.log('Saving model:', newModel);
    setOpenDialog(false);
    // Add logic to save the model
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* Header Section */}
      <Box sx={{ mb: 3 }}>
        {/* <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
          Forecast Management
        </Typography> */}
        <Typography variant="body1" color="textSecondary">
          Create, manage, and run predictive forecasting models
        </Typography>
      </Box>

      {/* Quick Actions */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 2, boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Quick Start Templates
              </Typography>
              <Grid container spacing={2}>
                {quickForecastTemplates.map((template, index) => (
                  <Grid item xs={12} sm={6} key={index}>
                    <Card 
                      sx={{ 
                        p: 2, 
                        bgcolor: '#f8fafc', 
                        cursor: 'pointer',
                        '&:hover': { bgcolor: '#e2e8f0' },
                        transition: 'background-color 0.2s'
                      }}
                      onClick={handleCreateModel}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Typography variant="h5" sx={{ mr: 1 }}>
                          {template.icon}
                        </Typography>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {template.name}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="textSecondary">
                        {template.description}
                      </Typography>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 2, boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Forecast Stats
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary">Active Models</Typography>
                <Typography variant="h4" sx={{ fontWeight: 600, color: '#3b82f6' }}>
                  {forecastModels.filter(m => m.status === 'Active').length}
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary">Avg Accuracy</Typography>
                <Typography variant="h4" sx={{ fontWeight: 600, color: '#10b981' }}>
                  91.2%
                </Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                fullWidth
                onClick={handleCreateModel}
                sx={{ mt: 2 }}
              >
                New Forecast Model
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Running Forecast Progress */}
      {runningForecast && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Box sx={{ width: '100%' }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Running forecast model... This may take a few minutes.
            </Typography>
            <LinearProgress />
          </Box>
        </Alert>
      )}

      {/* Forecast Models Table */}
      <Card sx={{ borderRadius: 2, boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 3, borderBottom: '1px solid #e2e8f0' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Forecast Models
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleCreateModel}
              >
                Add Model
              </Button>
            </Box>
          </Box>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Model Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Algorithm</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Accuracy</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Last Run</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {forecastModels.map((model) => (
                  <TableRow key={model.id} sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <AssessmentIcon sx={{ mr: 1, color: '#3b82f6' }} />
                        <Typography sx={{ fontWeight: 500 }}>{model.name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{model.type}</TableCell>
                    <TableCell>
                      <Chip 
                        label={model.algorithm} 
                        size="small" 
                        sx={{ bgcolor: '#e0f2fe', color: '#0277bd' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ color: '#10b981', fontWeight: 600 }}>
                        {model.accuracy}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={model.status}
                        size="small"
                        color={model.status === 'Active' ? 'success' : 'default'}
                        variant={model.status === 'Active' ? 'filled' : 'outlined'}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{model.lastRun}</Typography>
                      <Typography variant="caption" color="textSecondary">
                        Next: {model.nextRun}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton 
                          size="small" 
                          onClick={() => handleRunForecast(model.id)}
                          disabled={runningForecast}
                        >
                          <RunIcon />
                        </IconButton>
                        <IconButton size="small" onClick={() => setSelectedModel(model)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton size="small" color="error">
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Create/Edit Model Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedModel ? 'Edit Forecast Model' : 'Create New Forecast Model'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Model Name"
                  value={newModel.name}
                  onChange={(e) => setNewModel({...newModel, name: e.target.value})}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Forecast Type</InputLabel>
                  <Select
                    value={newModel.type}
                    label="Forecast Type"
                    onChange={(e) => setNewModel({...newModel, type: e.target.value})}
                  >
                    <MenuItem value="Revenue">Revenue</MenuItem>
                    <MenuItem value="User Metrics">User Metrics</MenuItem>
                    <MenuItem value="Market">Market Analysis</MenuItem>
                    <MenuItem value="Sales">Sales Pipeline</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Algorithm</InputLabel>
                  <Select
                    value={newModel.algorithm}
                    label="Algorithm"
                    onChange={(e) => setNewModel({...newModel, algorithm: e.target.value})}
                  >
                    <MenuItem value="ARIMA">ARIMA</MenuItem>
                    <MenuItem value="Linear Regression">Linear Regression</MenuItem>
                    <MenuItem value="Random Forest">Random Forest</MenuItem>
                    <MenuItem value="Neural Network">Neural Network</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Data Source</InputLabel>
                  <Select
                    value={newModel.dataSource}
                    label="Data Source"
                    onChange={(e) => setNewModel({...newModel, dataSource: e.target.value})}
                  >
                    <MenuItem value="sales_data">Sales Data</MenuItem>
                    <MenuItem value="user_data">User Data</MenuItem>
                    <MenuItem value="market_data">Market Data</MenuItem>
                    <MenuItem value="external_api">External API</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Schedule</InputLabel>
                  <Select
                    value={newModel.schedule}
                    label="Schedule"
                    onChange={(e) => setNewModel({...newModel, schedule: e.target.value})}
                  >
                    <MenuItem value="hourly">Hourly</MenuItem>
                    <MenuItem value="daily">Daily</MenuItem>
                    <MenuItem value="weekly">Weekly</MenuItem>
                    <MenuItem value="manual">Manual</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveModel}>
            {selectedModel ? 'Update' : 'Create'} Model
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}