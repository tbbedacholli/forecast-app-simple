// components/ForecastWizard/FileUpload.js
'use client';
import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Chip,
  Card,
  CardContent,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  Tooltip,
  IconButton
} from '@mui/material';
import { 
  CloudUpload, 
  CheckCircle, 
  Error, 
  Warning, 
  Info,
  ExpandMore,
  ExpandLess
} from '@mui/icons-material';

export default function FileUpload({ data, onUpdate, onNext, setError, setLoading }) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [validationResults, setValidationResults] = useState(null);
  const [showValidationDetails, setShowValidationDetails] = useState(false);

  useEffect(() => {
    console.log('🌍 Environment:', process.env.NODE_ENV);
    console.log('🔗 Base URL:', window.location.origin);
    console.log('📡 API URL:', '/api/wizard/upload');
  }, []);

  // Enhanced validation functions
  const validateFileStructure = (data) => {
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

    // Analyze each column
    const columns = Object.keys(data[0]);
    columns.forEach(column => {
      const columnData = data.map(row => row[column]);
      results.columnAnalysis[column] = analyzeColumn(column, columnData);
    });

    return results;
  };

  const analyzeColumn = (columnName, values) => {
    const analysis = {
      name: columnName,
      type: 'unknown',
      confidence: 0, // ✅ Add this line
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

    // Add debug logging
    debugColumnClassification(columnName, nonNullValues);
    
    // Enhanced type detection with better priority
    const detectedType = detectColumnType(columnName, nonNullValues);
    analysis.type = detectedType.type;
    analysis.confidence = detectedType.confidence; // ✅ Add this line
    
    // Add type-specific suggestions
    switch (detectedType.type) {
      case 'date':
        analysis.suggestions.push('Good candidate for date column');
        validateDateColumn(nonNullValues, analysis);
        break;
      case 'numeric':
        analysis.suggestions.push('Good candidate for target or numeric feature');
        validateNumericColumn(nonNullValues, analysis);
        break;
      case 'binary':
        analysis.suggestions.push('Binary column - good for flags/indicators');
        validateBinaryColumn(nonNullValues, analysis);
        break;
      case 'categorical':
        analysis.suggestions.push('Good candidate for level/grouping column');
        validateCategoricalColumn(nonNullValues, analysis);
        break;
      default:
        analysis.warnings.push('Mixed data types detected');
    }

    return analysis;
  };

  const detectColumnType = (columnName, values) => {
    if (values.length === 0) return { type: 'unknown', confidence: 0 };

    // 1. Check column name for date hints first
    const dateWords = ['date', 'time', 'timestamp', 'created', 'updated', 'modified', 'month', 'day', 'year'];
    const hasDateName = dateWords.some(word => columnName.toLowerCase().includes(word));
    
    // 2. Check for date patterns FIRST (especially if column name suggests date)
    if (hasDateName || isDateColumn(values)) {
      const confidence = hasDateName ? 0.95 : 0.85;
      return { type: 'date', confidence };
    }

    // 3. Check for numeric data (after date check)
    if (isNumericColumn(values)) {
      // Check if it's actually binary (0,1 only)
      if (isBinaryColumn(values)) {
        return { type: 'binary', confidence: 0.9 };
      }
      
      // Check if it's categorical numeric (small range of integers)
      if (isCategoricalNumeric(values)) {
        return { type: 'categorical', confidence: 0.8 };
      }
      
      return { type: 'numeric', confidence: 0.85 };
    }

    // 4. Check for categorical patterns
    if (isCategoricalColumn(values)) {
      return { type: 'categorical', confidence: 0.7 };
    }

    // 5. Default to text
    return { type: 'text', confidence: 0.5 };
  };

  const isDateColumn = (values) => {
    if (values.length === 0) return false;
    
    // First check if values are purely numeric (like 1, 2, 3, etc.) - if so, NOT a date column
    const purelyNumeric = values.every(val => {
      const str = String(val).trim();
      return /^\d+$/.test(str) && !str.includes('/') && !str.includes('-');
    });
    
    if (purelyNumeric) {
      return false;
    }
    
    // More specific date patterns - make them more flexible
    const datePatterns = [
      /^\d{1,2}\/\d{1,2}\/\d{4}$/, // M/D/YYYY or MM/DD/YYYY (your format)
      /^\d{4}-\d{1,2}-\d{1,2}$/, // YYYY-MM-DD or YYYY-M-D
      /^\d{1,2}-\d{1,2}-\d{4}$/, // MM-DD-YYYY or M-D-YYYY
      /^\d{4}\/\d{1,2}\/\d{1,2}$/, // YYYY/MM/DD or YYYY/M/D
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/, // ISO datetime
      /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/, // SQL datetime
    ];

    const sampleSize = Math.min(10, values.length);
    const sample = values.slice(0, sampleSize);
    
    let validDateCount = 0;
    
    for (let val of sample) {
      const str = String(val).trim();
      
      // Skip empty values
      if (!str) continue;
      
      // Check regex patterns first
      const matchesPattern = datePatterns.some(pattern => pattern.test(str));
      
      if (matchesPattern) {
        validDateCount++;
        continue;
      }
      
      // Try to parse as date with more lenient approach
      const date = new Date(str);
      const isValidDate = !isNaN(date.getTime());
      
      if (isValidDate) {
        const year = date.getFullYear();
        // Check if it's a reasonable year (1900-2100)
        if (year >= 1900 && year <= 2100) {
          // Additional check: make sure it contains date separators
          if (str.includes('/') || str.includes('-') || str.includes(' ')) {
            validDateCount++;
            continue;
          }
        }
      }
    }
    
    // Require at least 70% of samples to be valid dates (more lenient)
    const validRatio = validDateCount / sample.length;
    const isDateColumn = validRatio >= 0.7;
    
    console.log(`🗓️ Date detection for column:`, {
      sampleValues: sample.slice(0, 3),
      validDateCount,
      sampleSize: sample.length,
      validRatio: validRatio.toFixed(2),
      isDateColumn,
      purelyNumeric
    });
    
    return isDateColumn;
  };

  const isNumericColumn = (values) => {
    if (values.length === 0) return false;
    
    const numericCount = values.filter(val => {
      if (val === null || val === undefined || val === '') return false;
      
      // Convert to string and clean more thoroughly
      let str = String(val).trim();
      
      // Remove quotes (single and double)
      str = str.replace(/^["']|["']$/g, '');
      
      // Remove common formatting: commas, dollar signs, percentage signs
      str = str.replace(/[,%$]/g, '');
      
      // Handle negative numbers in parentheses (accounting format)
      if (str.startsWith('(') && str.endsWith(')')) {
        str = '-' + str.slice(1, -1);
      }
      
      // Check if it's a valid number after cleaning
      const num = parseFloat(str);
      return !isNaN(num) && isFinite(num);
    }).length;

    // Require at least 90% of values to be numeric
    return numericCount / values.length >= 0.9;
  };

  const isBinaryColumn = (values) => {
    if (values.length === 0) return false;
    
    const uniqueValues = new Set(values.map(val => String(val).trim()));
    
    // Check for binary patterns
    const binaryPatterns = [
      new Set(['0', '1']),
      new Set(['true', 'false']),
      new Set(['True', 'False']),
      new Set(['yes', 'no']),
      new Set(['Yes', 'No']),
      new Set(['y', 'n']),
      new Set(['Y', 'N'])
    ];
    
    return binaryPatterns.some(pattern => {
      const intersection = new Set([...uniqueValues].filter(x => pattern.has(x)));
      return intersection.size === uniqueValues.size && uniqueValues.size <= 2;
    });
  };

  const isCategoricalNumeric = (values) => {
    if (values.length === 0) return false;
    
    const numericValues = values.map(val => {
      if (val === null || val === undefined || val === '') return NaN;
      
      // Convert to string and clean more thoroughly
      let str = String(val).trim();
      
      // Remove quotes (single and double)
      str = str.replace(/^["']|["']$/g, '');
      
      // Remove common formatting: commas, dollar signs, percentage signs
      str = str.replace(/[,%$]/g, '');
      
      // Handle negative numbers in parentheses (accounting format)
      if (str.startsWith('(') && str.endsWith(')')) {
        str = '-' + str.slice(1, -1);
      }
      
      return parseFloat(str);
    }).filter(val => !isNaN(val));
    
    if (numericValues.length === 0) return false;
    
    const uniqueValues = new Set(numericValues);
    const min = Math.min(...numericValues);
    const max = Math.max(...numericValues);
    
    // Categorical if:
    // - All values are integers
    // - Small number of unique values (≤ 10)
    // - Small range (≤ 20)
    const allIntegers = numericValues.every(val => Number.isInteger(val));
    const smallCardinality = uniqueValues.size <= 10;
    const smallRange = (max - min) <= 20;
    
    return allIntegers && smallCardinality && smallRange;
  };

  const isCategoricalColumn = (values) => {
    if (values.length === 0) return false;
    
    const uniqueValues = new Set(values);
    const cardinality = uniqueValues.size;
    
    // Categorical if:
    // - Less than 50% unique values
    // - More than 1 unique value
    // - At least 5 total values
    const uniqueRatio = cardinality / values.length;
    return uniqueRatio < 0.5 && cardinality > 1 && values.length >= 5;
  };

  // Add new validation function for binary columns
  const validateBinaryColumn = (values, analysis) => {
    const uniqueValues = new Set(values);
    
    if (uniqueValues.size > 2) {
      analysis.warnings.push('More than 2 unique values for binary column');
    }
    
    // Check for imbalanced binary data
    const valueCounts = {};
    values.forEach(val => {
      valueCounts[val] = (valueCounts[val] || 0) + 1;
    });
    
    const counts = Object.values(valueCounts);
    const minCount = Math.min(...counts);
    const maxCount = Math.max(...counts);
    
    if (minCount / maxCount < 0.1) {
      analysis.warnings.push('Highly imbalanced binary data');
    }
  };

  // Update the existing validateCategoricalColumn function
  const validateCategoricalColumn = (values, analysis) => {
    const uniqueValues = new Set(values);
    const cardinality = uniqueValues.size;

    if (cardinality > values.length * 0.8) {
      analysis.warnings.push('High cardinality - might not be suitable for grouping');
    }

    if (cardinality === 1) {
      analysis.warnings.push('Only one unique value - not useful for grouping');
    }

    // Provide suggestions based on cardinality
    if (cardinality >= 2 && cardinality <= 10) {
      analysis.suggestions.push('Good cardinality for grouping/level column');
    }

    // Check for common categorical patterns
    const commonCategories = ['yes', 'no', 'true', 'false', 'male', 'female', 'active', 'inactive'];
    const hasCommonPattern = [...uniqueValues].some(val => 
      commonCategories.includes(String(val).toLowerCase())
    );

    if (hasCommonPattern) {
      analysis.suggestions.push('Binary/boolean categorical pattern detected');
    }
  };

  const validateDateColumn = (values, analysis) => {
    const parsedDates = values.map(val => new Date(val)).filter(date => !isNaN(date));
    
    if (parsedDates.length === 0) {
      analysis.issues.push('No valid dates found');
      return;
    }

    const sortedDates = parsedDates.sort((a, b) => a - b);
    const dateRange = {
      start: sortedDates[0],
      end: sortedDates[sortedDates.length - 1]
    };

    // Check for reasonable date range
    const now = new Date();
    const hundredYearsAgo = new Date(now.getFullYear() - 100, 0, 1);
    const tenYearsFromNow = new Date(now.getFullYear() + 10, 0, 1);

    if (dateRange.start < hundredYearsAgo) {
      analysis.warnings.push('Contains very old dates');
    }
    if (dateRange.end > tenYearsFromNow) {
      analysis.warnings.push('Contains future dates');
    }

    // Detect frequency
    const intervals = [];
    for (let i = 1; i < sortedDates.length; i++) {
      intervals.push(sortedDates[i] - sortedDates[i-1]);
    }
    
    if (intervals.length > 0) {
      const avgInterval = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
      const days = avgInterval / (1000 * 60 * 60 * 24);
      
      if (days < 1) {
        analysis.suggestions.push('Hourly or sub-daily frequency detected');
      } else if (days <= 1) {
        analysis.suggestions.push('Daily frequency detected');
      } else if (days <= 7) {
        analysis.suggestions.push('Weekly frequency detected');
      } else if (days <= 31) {
        analysis.suggestions.push('Monthly frequency detected');
      } else {
        analysis.suggestions.push('Quarterly or yearly frequency detected');
      }
    }

    // Check for date consistency
    const uniqueDates = new Set(parsedDates.map(d => d.toISOString()));
    if (uniqueDates.size !== parsedDates.length) {
      analysis.warnings.push('Duplicate dates found');
    }
  };

  const validateNumericColumn = (values, analysis) => {
    const numericValues = values.map(val => {
      if (val === null || val === undefined || val === '') return NaN;
      
      // Convert to string and clean more thoroughly
      let str = String(val).trim();
      
      // Remove quotes (single and double)
      str = str.replace(/^["']|["']$/g, '');
      
      // Remove common formatting: commas, dollar signs, percentage signs
      str = str.replace(/[,%$]/g, '');
      
      // Handle negative numbers in parentheses (accounting format)
      if (str.startsWith('(') && str.endsWith(')')) {
        str = '-' + str.slice(1, -1);
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
      analysis.warnings.push(`Contains negative values (minimum: ${stats.min.toLocaleString()})`);
    }

    // Enhanced outlier detection with IQR method
    const sorted = numericValues.sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    
    // Check if this looks like percentage data for more lenient detection
    const maxValue = Math.max(...numericValues);
    const isPercentageData = maxValue <= 100;
    const isLargeNumbers = stats.max > 1000; // Revenue-like numbers
    const outlierMultiplier = isPercentageData ? 2.0 : 1.5;

    const lowerBound = q1 - outlierMultiplier * iqr;
    const upperBound = q3 + outlierMultiplier * iqr;

    const outliers = numericValues.filter(val => val < lowerBound || val > upperBound);
    const outlierDetails = outliers.map(val => ({
      value: val,
      type: val < lowerBound ? 'low' : 'high',
      distance: val < lowerBound ? (lowerBound - val).toFixed(2) : (val - upperBound).toFixed(2)
    }));

    if (outliers.length > 0) {
      // Create detailed outlier message
      const outlierCount = outliers.length;
      const outlierPercentage = ((outlierCount / numericValues.length) * 100).toFixed(1);
      
      // Get sample outliers (max 3 for display)
      const sampleOutliers = outlierDetails.slice(0, 3);
      const outlierSamples = sampleOutliers.map(o => {
        const formattedValue = isLargeNumbers ? o.value.toLocaleString() : o.value;
        return `${formattedValue}${isPercentageData ? '%' : ''} (${o.type === 'high' ? 'high' : 'low'} outlier)`;
      }).join(', ');
      
      const moreText = outlierCount > 3 ? ` and ${outlierCount - 3} more` : '';
      
      // Create comprehensive warning message
      let outlierMessage = `${outlierCount} potential outlier${outlierCount > 1 ? 's' : ''} detected (${outlierPercentage}% of data)`;
      
      // Add range information with proper formatting
      const formattedQ1 = isLargeNumbers ? q1.toLocaleString() : q1.toFixed(2);
      const formattedQ3 = isLargeNumbers ? q3.toLocaleString() : q3.toFixed(2);
      const dataRange = `Normal range: ${formattedQ1} - ${formattedQ3}${isPercentageData ? '%' : ''}`;
      
      // Add sample outliers
      const samplesText = `Outlier examples: ${outlierSamples}${moreText}`;
      
      // Add explanation
      const explanation = `Values outside ${formattedQ1} - ${formattedQ3}${isPercentageData ? '%' : ''} range using IQR method`;
      
      analysis.warnings.push(`${outlierMessage} | ${dataRange} | ${samplesText} | ${explanation}`);
    }

    // Check for zero values
    const zeroCount = numericValues.filter(val => val === 0).length;
    if (zeroCount > numericValues.length * 0.1) {
      const zeroPercentage = (zeroCount/numericValues.length*100).toFixed(1);
      analysis.warnings.push(`${zeroPercentage}% zero values (${zeroCount} out of ${numericValues.length})`);
    }

    // Add distribution info
    if (stats.mean !== 0) {
      const variance = numericValues.reduce((sum, val) => sum + Math.pow(val - stats.mean, 2), 0) / numericValues.length;
      const stdDev = Math.sqrt(variance);
      const cv = stdDev / stats.mean;
      
      if (cv > 1) {
        analysis.suggestions.push(`High variability detected (CV: ${cv.toFixed(2)}) - consider data transformation or investigate extreme values`);
      }
    }

    // Add data quality summary with proper formatting
    const formattedMin = isLargeNumbers ? stats.min.toLocaleString() : stats.min.toFixed(2);
    const formattedMax = isLargeNumbers ? stats.max.toLocaleString() : stats.max.toFixed(2);
    const formattedMean = isLargeNumbers ? stats.mean.toLocaleString() : stats.mean.toFixed(2);
    
    analysis.suggestions.push(`Data range: ${formattedMin} to ${formattedMax}${isPercentageData ? '%' : ''} | Mean: ${formattedMean}${isPercentageData ? '%' : ''}`);
  };

  const handleFileUpload = async (file) => {
    if (!file) return;

    console.log('📁 Uploading file:', file.name, 'Size:', file.size);

    // Basic file validation
    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    // Check file size (4.5MB for Vercel)
    const maxSize = 4.5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('File size must be less than 4.5MB');
      return;
    }

    // Check if file is readable
    try {
      const testRead = await file.text();
      if (!testRead.trim()) {
        setError('File appears to be empty');
        return;
      }
    } catch (err) {
      setError('Unable to read file: ' + err.message);
      return;
    }

    const uploadWithRetry = async (retries = 3) => {
      for (let i = 0; i < retries; i++) {
        try {
          const formData = new FormData();
          formData.append('file', file);

          console.log(`📤 Upload attempt ${i + 1}/${retries}`);
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000);

          const response = await fetch('/api/wizard/upload', {
            method: 'POST',
            body: formData,
            signal: controller.signal
          });

          clearTimeout(timeoutId);
          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.error || `HTTP error! status: ${response.status}`);
          }

          return result;

        } catch (error) {
          console.error(`💥 Upload attempt ${i + 1} failed:`, error);
          
          if (i === retries - 1) {
            throw error;
          }
          
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
      }
    };

    setUploading(true);
    setError('');
    setValidationResults(null);

    try {
      const result = await uploadWithRetry();
      
      // Run validation on the uploaded data
      console.log('🔍 Running data validation...');
      const validation = validateFileStructure(result.preview);
      setValidationResults(validation);
      
      onUpdate({
        file: file,
        previewData: result.preview,
        columns: result.columns,
        totalRows: result.totalRows,
        validation: validation
      });

      setError('');
    } catch (error) {
      console.error('💥 Final upload error:', error);
      
      if (error.name === 'AbortError') {
        setError('Upload timeout - please try again');
      } else {
        setError(`Upload failed: ${error.message}`);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFileUpload(file);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    handleFileUpload(file);
  };

  const getSeverityColor = (type) => {
    switch (type) {
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'info': return 'info';
      default: return 'default';
    }
  };

  const getSeverityIcon = (type) => {
    switch (type) {
      case 'error': return <Error />;
      case 'warning': return <Warning />;
      case 'info': return <Info />;
      default: return <CheckCircle />;
    }
  };

  const getValidationScore = () => {
    if (!validationResults) return 0;
    
    const totalIssues = Object.values(validationResults.columnAnalysis)
      .reduce((sum, col) => sum + col.issues.length, 0);
    const totalWarnings = Object.values(validationResults.columnAnalysis)
      .reduce((sum, col) => sum + col.warnings.length, 0);
    
    const maxScore = 100;
    const issueDeduction = totalIssues * 30;
    const warningDeduction = totalWarnings * 10;
    
    return Math.max(0, maxScore - issueDeduction - warningDeduction);
  };

  // In FileUpload.js, add this debug function:
  const debugColumnClassification = (columnName, values) => {
    console.log(`🔍 Debugging column: ${columnName}`);
    console.log(`📊 Sample values:`, values.slice(0, 5));
    console.log(`📅 isDateColumn:`, isDateColumn(values));
    console.log(`🔢 isNumericColumn:`, isNumericColumn(values));
    console.log(`📋 isCategoricalColumn:`, isCategoricalColumn(values));
    console.log(`🎯 Final type:`, detectColumnType(columnName, values));
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Step 1: Upload Your CSV File
      </Typography>
      
      <Box
        sx={{
          border: '2px dashed #ccc',
          borderRadius: 2,
          p: 4,
          textAlign: 'center',
          bgcolor: dragOver ? '#f5f5f5' : 'transparent',
          cursor: 'pointer',
          mb: 3,
          '&:hover': { bgcolor: '#f9f9f9' }
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
        
        <CloudUpload sx={{ fontSize: 48, color: '#ccc', mb: 2 }} />
        
        {uploading ? (
          <Box>
            <CircularProgress size={24} sx={{ mb: 2 }} />
            <Typography>Uploading and validating file...</Typography>
          </Box>
        ) : (
          <Box>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Drop your CSV file here or click to browse
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Supported format: CSV files only (Max 4.5MB)
            </Typography>
          </Box>
        )}
      </Box>

      {data.file && (
        <Alert severity="success" sx={{ mb: 3 }}>
          File uploaded successfully: {data.file.name} ({data.totalRows} rows)
        </Alert>
      )}

      {/* Validation Results */}
      {validationResults && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Data Validation Results</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2">Quality Score:</Typography>
                <Chip 
                  label={`${getValidationScore()}/100`} 
                  color={getValidationScore() >= 80 ? 'success' : getValidationScore() >= 60 ? 'warning' : 'error'}
                />
              </Box>
            </Box>

            <LinearProgress 
              variant="determinate" 
              value={getValidationScore()} 
              sx={{ mb: 2 }}
              color={getValidationScore() >= 80 ? 'success' : getValidationScore() >= 60 ? 'warning' : 'error'}
            />

            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Chip label={`${validationResults.totalRows} rows`} variant="outlined" />
              <Chip label={`${validationResults.totalColumns} columns`} variant="outlined" />
            </Box>

            <Button
              onClick={() => setShowValidationDetails(!showValidationDetails)}
              endIcon={showValidationDetails ? <ExpandLess /> : <ExpandMore />}
              sx={{ mb: 2 }}
            >
              {showValidationDetails ? 'Hide' : 'Show'} Validation Details
            </Button>

            <Collapse in={showValidationDetails}>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>Column Analysis:</Typography>
              {Object.entries(validationResults.columnAnalysis).map(([columnName, analysis]) => (
                <Card key={columnName} sx={{ mb: 2, bgcolor: '#f9f9f9' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {columnName}
                      </Typography>
                      <Chip label={analysis.type} size="small" />
                      <Chip label={`${analysis.uniqueCount} unique`} size="small" variant="outlined" />
                      {analysis.nullCount > 0 && (
                        <Chip label={`${analysis.nullCount} nulls`} size="small" color="warning" />
                      )}
                      
                      {/* Add confidence score */}
                      <Chip 
                        label={`${(analysis.confidence * 100).toFixed(0)}% confidence`} 
                        size="small" 
                        variant="outlined"
                        color={analysis.confidence >= 0.8 ? 'success' : analysis.confidence >= 0.6 ? 'warning' : 'error'}
                      />
                      
                      {/* Add hover tooltip for detailed info */}
                      {(analysis.issues.length > 0 || analysis.warnings.length > 0 || analysis.suggestions.length > 0) && (
                        <Tooltip
                          title={
                            <Box sx={{ maxWidth: 500 }}>
                              {analysis.issues.length > 0 && (
                                <Box sx={{ mb: 1.5 }}>
                                  <Typography variant="body2" sx={{ 
                                    fontWeight: 600, 
                                    color: '#ffffff', 
                                    mb: 0.5,
                                    bgcolor: '#d32f2f',
                                    px: 1,
                                    py: 0.5,
                                    borderRadius: 1,
                                    fontSize: '0.75rem'
                                  }}>
                                    🚨 CRITICAL ISSUES
                                  </Typography>
                                  {analysis.issues.map((issue, idx) => (
                                    <Typography key={idx} variant="body2" sx={{ 
                                      color: '#ffffff', 
                                      mb: 0.5,
                                      pl: 1,
                                      fontSize: '0.8rem',
                                      lineHeight: 1.4
                                    }}>
                                      • {issue}
                                    </Typography>
                                  ))}
                                </Box>
                              )}
                              
                              {analysis.warnings.length > 0 && (
                                <Box sx={{ mb: 1.5 }}>
                                  <Typography variant="body2" sx={{ 
                                    fontWeight: 600, 
                                    color: '#ffffff', 
                                    mb: 0.5,
                                    bgcolor: '#ed6c02',
                                    px: 1,
                                    py: 0.5,
                                    borderRadius: 1,
                                    fontSize: '0.75rem'
                                  }}>
                                    ⚠️ DATA QUALITY WARNINGS
                                  </Typography>
                                  {analysis.warnings.map((warning, idx) => {
                                    // Split detailed warning by pipe for better formatting
                                    const parts = warning.split(' | ');
                                    return (
                                      <Box key={idx} sx={{ mb: 1, pl: 1 }}>
                                        <Typography variant="body2" sx={{ 
                                          color: '#ffffff', 
                                          fontWeight: 600,
                                          fontSize: '0.8rem',
                                          lineHeight: 1.4
                                        }}>
                                          • {parts[0]}
                                        </Typography>
                                        {parts.slice(1).map((part, partIdx) => (
                                          <Typography key={partIdx} variant="body2" sx={{ 
                                            color: '#ffffff', 
                                            fontSize: '0.75rem',
                                            lineHeight: 1.3,
                                            pl: 1,
                                            opacity: 0.9
                                          }}>
                                            {part}
                                          </Typography>
                                        ))}
                                      </Box>
                                    );
                                  })}
                                </Box>
                              )}
                              
                              {analysis.suggestions.length > 0 && (
                                <Box>
                                  <Typography variant="body2" sx={{ 
                                    fontWeight: 600, 
                                    color: '#ffffff', 
                                    mb: 0.5,
                                    bgcolor: '#0288d1',
                                    px: 1,
                                    py: 0.5,
                                    borderRadius: 1,
                                    fontSize: '0.75rem'
                                  }}>
                                    💡 INSIGHTS & RECOMMENDATIONS
                                  </Typography>
                                  {analysis.suggestions.map((suggestion, idx) => (
                                    <Typography key={idx} variant="body2" sx={{ 
                                      color: '#ffffff', 
                                      mb: 0.5,
                                      pl: 1,
                                      fontSize: '0.8rem',
                                      lineHeight: 1.4
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
                                bgcolor: '#37474f',
                                border: '1px solid #546e7a',
                                borderRadius: 2,
                                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                                maxWidth: 550, // Increased for more detail
                                p: 2
                              }
                            },
                            arrow: {
                              sx: {
                                color: '#37474f'
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

                    {analysis.samples.length > 0 && (
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                        Sample values: {analysis.samples.join(', ')}
                      </Typography>
                    )}

                    {/* Keep the expanded details for when user clicks "Show Details" */}
                    {showValidationDetails && (
                      <Box>
                        {analysis.issues.length > 0 && (
                          <List dense>
                            {analysis.issues.map((issue, index) => (
                              <ListItem key={index} sx={{ py: 0 }}>
                                <ListItemIcon sx={{ minWidth: 36 }}>
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

                        {analysis.warnings.length > 0 && (
                          <List dense>
                            {analysis.warnings.map((warning, index) => (
                              <ListItem key={index} sx={{ py: 0 }}>
                                <ListItemIcon sx={{ minWidth: 36 }}>
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

                        {analysis.suggestions.length > 0 && (
                          <List dense>
                            {analysis.suggestions.map((suggestion, index) => (
                              <ListItem key={index} sx={{ py: 0 }}>
                                <ListItemIcon sx={{ minWidth: 36 }}>
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
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Data Preview (First 10 rows)
          </Typography>
          <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  {data.columns.map((column) => {
                    const analysis = validationResults?.columnAnalysis[column];
                    return (
                      <TableCell key={column} sx={{ fontWeight: 600 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {column}
                          {analysis && (
                            <Chip 
                              label={analysis.type} 
                              size="small" 
                              color={getColumnTypeColor(analysis.type)}
                            />
                          )}
                        </Box>
                      </TableCell>
                    );
                  })}
                </TableRow>
              </TableHead>
              <TableBody>
                {data.previewData.map((row, index) => (
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

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
        <Button
          variant="contained"
          onClick={onNext}
          disabled={!data.file || uploading}
        >
          Next: Select Columns
        </Button>
      </Box>
    </Box>
  );
}

// Add the getColumnTypeColor function that's referenced in your table
const getColumnTypeColor = (type) => {
  switch (type) {
    case 'date': return 'info';
    case 'numeric': return 'success';
    case 'binary': return 'warning';
    case 'categorical': return 'secondary';
    default: return 'default';
  }
};