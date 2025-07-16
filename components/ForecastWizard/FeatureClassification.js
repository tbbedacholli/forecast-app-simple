// components/ForecastWizard/FeatureClassification.js
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
  Checkbox,
  FormControlLabel, // Add this
  Divider,
  ListSubheader,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  Business,
  Timeline,
  Analytics,
  Info
} from '@mui/icons-material';

const FEATURE_ROLES = [
  { value: 'entity_property', label: 'Entity Property', description: 'Static attributes (e.g., product category, region)', icon: <Business /> },
  { value: 'dynamic_feature', label: 'Dynamic Feature', description: 'Time-varying features (e.g., price, promotions)', icon: <Timeline /> },
  { value: 'future_feature', label: 'Future Feature', description: 'Known future values (e.g., holidays, planned events)', icon: <Analytics /> }, // ✅ Changed here
  { value: 'ignore', label: 'Ignore', description: 'Exclude from modeling', icon: null }
];

export default function FeatureClassification({ data, onUpdate, onNext, onBack, setError }) {
  const [featureClassification, setFeatureClassification] = useState({});
  const [futureValues, setFutureValues] = useState({}); // Add this state
  const [autoClassified, setAutoClassified] = useState(new Set());

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
    
    // Update selected future features
    let newSelectedFutureFeatures = [...selectedFutureFeatures];
    if (newRole === 'future_feature' && !selectedFutureFeatures.includes(column)) {
      newSelectedFutureFeatures.push(column);
    } else if (newRole !== 'future_feature' && selectedFutureFeatures.includes(column)) {
      newSelectedFutureFeatures = newSelectedFutureFeatures.filter(f => f !== column);
    }
    
    setSelectedFutureFeatures(newSelectedFutureFeatures);
    
    onUpdate({ 
      featureClassification: {
        ...data.featureClassification,
        columnRoles: updated,
        selectedFutureFeatures: newSelectedFutureFeatures
      }
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
    setFutureValues(prev => ({
      ...prev,
      [column]: canProvide
    }));
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
      default:
        return 'inherit';
    }
  };

  return (
    <Box p={2}>
      <Typography variant="h6" gutterBottom>
        Feature Classification
      </Typography>
      <Divider sx={{ mb: 2 }} />
      
      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Typography variant="subtitle1" gutterBottom>
            Classify each column based on its role in the forecasting model:
          </Typography>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Button 
            variant="outlined" 
            onClick={handleAutoClassify} 
            disabled={data.loading || !data.validation?.columnAnalysis}
            fullWidth
          >
            Re-run Auto Classification
          </Button>
        </Grid>
      </Grid>

      <Divider sx={{ my: 2 }} />
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Column</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Future Values</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.columns.map(column => {
              const isAutoClassified = autoClassified.has(column);
              const canProvideFuture = futureValues[column] === true;
              const dataType = data.dataClassification[column];
              
              return (
                <TableRow key={column}>
                  <TableCell>{column}</TableCell>
                  <TableCell>{dataType}</TableCell>
                  <TableCell>
                    <FormControl fullWidth variant="outlined">
                      <Select
                        value={featureClassification[column] || ''}
                        onChange={e => handleRoleChange(column, e.target.value)}
                        disabled={data.loading}
                        displayEmpty
                      >
                        <MenuItem value=""><em>None</em></MenuItem>
                        {FEATURE_ROLES.map(role => (
                          <MenuItem key={role.value} value={role.value}>
                            {role.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={futureValues[column] || false}
                          onChange={(e) => handleFutureValueChange(column, e.target.checked)}
                          disabled={
                            data.loading || 
                            featureClassification[column] === 'ignore' ||
                            !featureClassification[column]
                          }
                        />
                      }
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Typography 
                            variant="body2" 
                            color={
                              featureClassification[column] === 'ignore' || !featureClassification[column] 
                                ? 'text.disabled' 
                                : 'text.primary'
                            }
                          >
                            {futureValues[column] ? 'Yes' : 'No'}
                          </Typography>
                          <Tooltip 
                            title={
                              !featureClassification[column] 
                                ? "Select a feature role first"
                                : featureClassification[column] === 'ignore'
                                ? "Ignored features cannot provide future values"
                                : "Check if this feature's future values will be known during prediction"
                            }
                          >
                            <IconButton size="small" sx={{ p: 0 }}>
                              <Info fontSize="small" color="action" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      }
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Classification Summary Card */}
      {Object.keys(featureClassification).length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Classification Summary</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {Object.entries(getClassificationSummary()).map(([type, count]) => (
                <Chip
                  key={type}
                  label={`${type}: ${count}`}
                  color={getTypeColor(type)}
                  variant="outlined"
                />
              ))}
            </Box>
            
            {/* Add Future Values Summary */}
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Future Values Available:</Typography>
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
          </CardContent>
        </Card>
      )}

      {/* <Box mt={2} display="flex" justifyContent="flex-end">
        <Button 
          variant="contained" 
          onClick={handleNext} 
          endIcon={<TrendingUp />}
          disabled={data.loading}
        >
          Next
        </Button>
      </Box> */}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button onClick={onBack}>
          Back
        </Button>
        <Button
          variant="contained"
          onClick={handleNext}
          disabled={Object.keys(featureClassification).length !== data.columns.length}
        >
          Next: Training Configuration
        </Button>
      </Box>
    </Box>
  );
}