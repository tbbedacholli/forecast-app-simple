// components/ForecastWizard/FeatureClassification.js
'use client';
import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  FormControl,
  FormControlLabel,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  Alert,
  FormGroup
} from '@mui/material';

export default function FeatureClassification({ data, onUpdate, onNext, onBack, setError }) {
  const [featureClassification, setFeatureClassification] = useState(
    data.featureClassification || {
      entityProperties: [],
      dynamicFeatures: [],
      selectedFutureFeatures: []
    }
  );

  useEffect(() => {
    classifyFeatures();
  }, []);

  const classifyFeatures = () => {
    const { target, date, level } = data.selectedColumns;
    const levelColumns = Array.isArray(level) ? level : (level ? [level] : []);
    
    const otherColumns = data.columns.filter(col => 
      col !== target && 
      col !== date && 
      !levelColumns.includes(col)
    );

    const entityProperties = [];
    const dynamicFeatures = [];

    otherColumns.forEach(column => {
      // Check if column has static values for each level
      const isStatic = checkIfStatic(column);
      
      if (isStatic) {
        entityProperties.push(column);
      } else {
        dynamicFeatures.push(column);
      }
    });

    const newClassification = {
      entityProperties,
      dynamicFeatures,
      selectedFutureFeatures: []
    };

    setFeatureClassification(newClassification);
    onUpdate({ featureClassification: newClassification });
  };

  const checkIfStatic = (column) => {
    // Simple heuristic: if a column has the same value for most rows, consider it static
    const values = data.previewData.map(row => row[column]);
    const uniqueValues = [...new Set(values)];
    return uniqueValues.length <= values.length * 0.3; // 30% threshold
  };

  const handleFutureFeatureToggle = (column) => {
    const newSelected = featureClassification.selectedFutureFeatures.includes(column)
      ? featureClassification.selectedFutureFeatures.filter(f => f !== column)
      : [...featureClassification.selectedFutureFeatures, column];

    const newClassification = {
      ...featureClassification,
      selectedFutureFeatures: newSelected
    };

    setFeatureClassification(newClassification);
    onUpdate({ featureClassification: newClassification });
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 3 }}>
        Step 4: Feature Classification
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        Features are automatically classified as either static (entity properties) or dynamic. 
        For dynamic features, select which ones you can provide future values for.
      </Alert>

      {/* Entity Properties */}
      <Typography variant="h6" sx={{ mb: 2 }}>
        Entity Properties (Static Features)
      </Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
        These features remain constant for each entity over time.
      </Typography>

      <TableContainer component={Paper} sx={{ mb: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Feature</TableCell>
              <TableCell>Sample Values</TableCell>
              <TableCell>Type</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {featureClassification.entityProperties.map((feature) => (
              <TableRow key={feature}>
                <TableCell sx={{ fontWeight: 500 }}>{feature}</TableCell>
                <TableCell>
                  {data.previewData?.slice(0, 3).map((row, i) => (
                    <span key={i}>
                      {row[feature]}
                      {i < 2 ? ', ' : ''}
                    </span>
                  ))}
                </TableCell>
                <TableCell>
                  <Chip 
                    label="Static" 
                    color="success" 
                    size="small" 
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dynamic Features */}
      <Typography variant="h6" sx={{ mb: 2 }}>
        Dynamic Features
      </Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
        Select which dynamic features you can provide future values for:
      </Typography>

      <TableContainer component={Paper} sx={{ mb: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Feature</TableCell>
              <TableCell>Sample Values</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Can Provide Future Values?</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {featureClassification.dynamicFeatures.map((feature) => (
              <TableRow key={feature}>
                <TableCell sx={{ fontWeight: 500 }}>{feature}</TableCell>
                <TableCell>
                  {data.previewData?.slice(0, 3).map((row, i) => (
                    <span key={i}>
                      {row[feature]}
                      {i < 2 ? ', ' : ''}
                    </span>
                  ))}
                </TableCell>
                <TableCell>
                  <Chip 
                    label="Dynamic" 
                    color="primary" 
                    size="small" 
                  />
                </TableCell>
                <TableCell>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={featureClassification.selectedFutureFeatures.includes(feature)}
                        onChange={() => handleFutureFeatureToggle(feature)}
                      />
                    }
                    label="Yes"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {featureClassification.selectedFutureFeatures.length > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          You'll need to provide future values for: {featureClassification.selectedFutureFeatures.join(', ')}
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button onClick={onBack}>
          Back
        </Button>
        <Button variant="contained" onClick={onNext}>
          Next: Training Configuration
        </Button>
      </Box>
    </Box>
  );
}