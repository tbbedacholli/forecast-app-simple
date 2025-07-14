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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  CircularProgress
} from '@mui/material';

export default function DataClassification({ data, onUpdate, onNext, onBack, setError }) {
  const [classification, setClassification] = useState(data.dataClassification || {});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Auto-classify columns based on data types
    autoClassifyColumns();
  }, []);

  const autoClassifyColumns = async () => {
    if (!data.columns || !data.previewData) return;

    setLoading(true);
    try {
      // Simple client-side classification
      const newClassification = {};
      
      data.columns.forEach(column => {
        // Skip selected columns
        if (column === data.selectedColumns?.target || 
            column === data.selectedColumns?.date || 
            column === data.selectedColumns?.level) {
          return;
        }

        // Sample values for classification
        const sampleValues = data.previewData
          .map(row => row[column])
          .filter(val => val != null && val !== '');
        
        if (sampleValues.length === 0) {
          newClassification[column] = 'categorical';
          return;
        }
        
        // Check if numeric
        const numericValues = sampleValues.filter(val => {
          const num = parseFloat(val);
          return !isNaN(num) && isFinite(num);
        });
        
        if (numericValues.length / sampleValues.length > 0.8) {
          newClassification[column] = 'numeric';
        } else {
          newClassification[column] = 'categorical';
        }
      });

      setClassification(newClassification);
      onUpdate({ dataClassification: newClassification });
    } catch (error) {
      console.error('Auto-classification error:', error);
      setError('Failed to classify columns automatically');
    } finally {
      setLoading(false);
    }
  };

  const handleClassificationChange = (column, type) => {
    const newClassification = { ...classification, [column]: type };
    setClassification(newClassification);
    onUpdate({ dataClassification: newClassification });
  };

  const getOtherColumns = () => {
    const { target, date, level } = data.selectedColumns || {};
    const levelColumns = Array.isArray(level) ? level : (level ? [level] : []);
    
    return data.columns?.filter(col => 
      col !== target && 
      col !== date && 
      !levelColumns.includes(col)
    ) || [];
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'numeric': return 'primary';
      case 'categorical': return 'secondary';
      case 'datetime': return 'warning';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Analyzing data types...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 3 }}>
        Step 3: Data Classification
      </Typography>

      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        Review and adjust the automatic classification of your columns. This helps the model understand your data better.
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Column Name</TableCell>
              <TableCell>Sample Values</TableCell>
              <TableCell>Data Type</TableCell>
              <TableCell>Role</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {/* Target Column */}
            {data.selectedColumns?.target && (
              <TableRow sx={{ bgcolor: '#e3f2fd' }}>
                <TableCell sx={{ fontWeight: 600 }}>
                  {data.selectedColumns.target}
                </TableCell>
                <TableCell>
                  {data.previewData?.slice(0, 3).map((row, i) => (
                    <span key={i}>
                      {row[data.selectedColumns.target]}
                      {i < 2 ? ', ' : ''}
                    </span>
                  ))}
                </TableCell>
                <TableCell>
                  <Chip 
                    label="Numeric" 
                    color="primary" 
                    size="small" 
                  />
                </TableCell>
                <TableCell>
                  <Chip 
                    label="Target" 
                    color="success" 
                    size="small" 
                  />
                </TableCell>
              </TableRow>
            )}

            {/* Date Column */}
            {data.selectedColumns?.date && (
              <TableRow sx={{ bgcolor: '#fff3e0' }}>
                <TableCell sx={{ fontWeight: 600 }}>
                  {data.selectedColumns.date}
                </TableCell>
                <TableCell>
                  {data.previewData?.slice(0, 3).map((row, i) => (
                    <span key={i}>
                      {row[data.selectedColumns.date]}
                      {i < 2 ? ', ' : ''}
                    </span>
                  ))}
                </TableCell>
                <TableCell>
                  <Chip 
                    label="DateTime" 
                    color="warning" 
                    size="small" 
                  />
                </TableCell>
                <TableCell>
                  <Chip 
                    label="Date" 
                    color="info" 
                    size="small" 
                  />
                </TableCell>
              </TableRow>
            )}

            {/* Level Columns */}
            {data.selectedColumns?.level && Array.isArray(data.selectedColumns.level) && data.selectedColumns.level.length > 0 && (
              <>
                {data.selectedColumns.level.map((levelCol, index) => (
                  <TableRow key={`level-${index}`} sx={{ bgcolor: '#f3e5f5' }}>
                    <TableCell sx={{ fontWeight: 600 }}>
                      {levelCol}
                    </TableCell>
                    <TableCell>
                      {data.previewData?.slice(0, 3).map((row, i) => (
                        <span key={i}>
                          {row[levelCol]}
                          {i < 2 ? ', ' : ''}
                        </span>
                      ))}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label="Categorical" 
                        color="secondary" 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label="Level" 
                        color="warning" 
                        size="small" 
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </>
            )}

            {/* Other Columns */}
            {getOtherColumns().map((column) => (
              <TableRow key={column}>
                <TableCell sx={{ fontWeight: 500 }}>
                  {column}
                </TableCell>
                <TableCell>
                  {data.previewData?.slice(0, 3).map((row, i) => (
                    <span key={i}>
                      {row[column]}
                      {i < 2 ? ', ' : ''}
                    </span>
                  ))}
                </TableCell>
                <TableCell>
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <Select
                      value={classification[column] || 'numeric'}
                      onChange={(e) => handleClassificationChange(column, e.target.value)}
                    >
                      <MenuItem value="numeric">Numeric</MenuItem>
                      <MenuItem value="categorical">Categorical</MenuItem>
                      <MenuItem value="datetime">DateTime</MenuItem>
                    </Select>
                  </FormControl>
                </TableCell>
                <TableCell>
                  <Chip 
                    label="Feature" 
                    color={getTypeColor(classification[column])} 
                    size="small" 
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button onClick={onBack}>
          Back
        </Button>
        <Button variant="contained" onClick={onNext}>
          Next: Feature Classification
        </Button>
      </Box>
    </Box>
  );
}