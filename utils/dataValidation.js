import moment from 'moment';
import validator from 'validator';
import _ from 'lodash';

// Enhanced numeric detection using multiple validation methods
export const isNumericValue = (value) => {
  if (value === null || value === undefined || value === '') {
    return false;
  }

  // Convert to string for processing
  let str = String(value).trim();
  
  // Remove quotes
  str = str.replace(/^["']|["']$/g, '');
  
  // Handle empty after cleaning
  if (str === '') return false;

  // Method 1: Use validator.js for basic numeric check
  if (validator.isNumeric(str, { no_symbols: false })) {
    return true;
  }

  // Method 2: Handle formatted numbers (commas, currency, percentages)
  let cleanStr = str;
  
  // Remove common formatting
  cleanStr = cleanStr.replace(/[,%$€£¥]/g, ''); // Currency symbols and commas
  cleanStr = cleanStr.replace(/\s/g, ''); // Remove spaces
  
  // Handle accounting format (parentheses for negative)
  if (cleanStr.startsWith('(') && cleanStr.endsWith(')')) {
    cleanStr = '-' + cleanStr.slice(1, -1);
  }
  
  // Handle percentage
  if (cleanStr.endsWith('%')) {
    cleanStr = cleanStr.slice(0, -1);
  }

  // Method 3: Validate cleaned string
  if (validator.isNumeric(cleanStr)) {
    return true;
  }

  // Method 4: Check for scientific notation
  if (validator.isFloat(cleanStr)) {
    return true;
  }

  // Method 5: Use native JavaScript as fallback
  const parsed = parseFloat(cleanStr);
  return !isNaN(parsed) && isFinite(parsed);
};

// Enhanced date detection using moment.js
export const isDateValue = (value) => {
  if (value === null || value === undefined || value === '') {
    return false;
  }

  // Convert to string for processing
  let str = String(value).trim();
  
  // Remove quotes
  str = str.replace(/^["']|["']$/g, '');
  
  if (str === '') return false;

  // Common date formats to try
  const dateFormats = [
    'YYYY-MM-DD',
    'MM/DD/YYYY',
    'DD/MM/YYYY',
    'YYYY/MM/DD',
    'MM-DD-YYYY',
    'DD-MM-YYYY',
    'YYYY.MM.DD',
    'MM.DD.YYYY',
    'DD.MM.YYYY',
    'MMMM DD, YYYY',
    'MMM DD, YYYY',
    'DD MMMM YYYY',
    'DD MMM YYYY',
    'YYYY-MM-DD HH:mm:ss',
    'MM/DD/YYYY HH:mm:ss',
    'YYYY-MM-DDTHH:mm:ss',
    'YYYY-MM-DDTHH:mm:ss.SSS',
    'YYYY-MM-DDTHH:mm:ss.SSSZ'
  ];

  // Method 1: Try parsing with specific formats
  for (const format of dateFormats) {
    const parsed = moment(str, format, true);
    if (parsed.isValid()) {
      return true;
    }
  }

  // Method 2: Try lenient parsing
  const lenieParsed = moment(str);
  if (lenieParsed.isValid()) {
    // Additional validation - must be reasonable date
    const year = lenieParsed.year();
    if (year >= 1900 && year <= 2100) {
      return true;
    }
  }

  // Method 3: Use validator.js for ISO dates
  if (validator.isISO8601(str)) {
    return true;
  }

  // Method 4: Check if it's a timestamp
  if (validator.isNumeric(str) && str.length >= 10) {
    const timestamp = parseInt(str);
    const date = moment(timestamp);
    if (date.isValid() && date.year() >= 1970 && date.year() <= 2100) {
      return true;
    }
  }

  return false;
};

// Enhanced column type detection
export const detectColumnType = (values, columnName = '') => {
  if (!values || values.length === 0) {
    return {
      type: 'unknown',
      confidence: 0,
      samples: [],
      analysis: {}
    };
  }

  // Filter out null/undefined/empty values for analysis
  const validValues = values.filter(v => v !== null && v !== undefined && v !== '');
  const sampleSize = Math.min(validValues.length, 100); // Analyze up to 100 values
  const sample = _.sampleSize(validValues, sampleSize);

  if (sample.length === 0) {
    return {
      type: 'text',
      confidence: 0.5,
      samples: ['(empty)'],
      analysis: { reason: 'All values are empty' }
    };
  }

  // Analysis counters
  let numericCount = 0;
  let dateCount = 0;
  let binaryCount = 0;
  let integerCount = 0;
  let floatCount = 0;
  
  const uniqueValues = new Set();
  const analysis = {
    totalValues: validValues.length,
    sampleSize: sample.length,
    uniqueValueCount: 0,
    hasNulls: values.length > validValues.length,
    minLength: Number.MAX_SAFE_INTEGER,
    maxLength: 0,
    avgLength: 0
  };

  // Analyze each sample value
  sample.forEach(value => {
    const str = String(value).trim();
    uniqueValues.add(str.toLowerCase());
    
    analysis.minLength = Math.min(analysis.minLength, str.length);
    analysis.maxLength = Math.max(analysis.maxLength, str.length);

    // Check if numeric
    if (isNumericValue(value)) {
      numericCount++;
      
      // Check if integer vs float
      const cleanValue = str.replace(/[,%$€£¥()]/g, '').replace(/^["']|["']$/g, '');
      const parsed = parseFloat(cleanValue);
      if (Number.isInteger(parsed)) {
        integerCount++;
      } else {
        floatCount++;
      }
    }

    // Check if date
    if (isDateValue(value)) {
      dateCount++;
    }

    // Check if binary (0/1, true/false, yes/no)
    const lowerStr = str.toLowerCase();
    if (['0', '1', 'true', 'false', 'yes', 'no', 'y', 'n'].includes(lowerStr)) {
      binaryCount++;
    }
  });

  analysis.uniqueValueCount = uniqueValues.size;
  analysis.avgLength = sample.reduce((sum, v) => sum + String(v).length, 0) / sample.length;

  // Calculate percentages
  const numericRatio = numericCount / sample.length;
  const dateRatio = dateCount / sample.length;
  const binaryRatio = binaryCount / sample.length;
  const uniqueRatio = uniqueValues.size / sample.length;

  // Determine type based on ratios and additional logic
  let detectedType = 'text';
  let confidence = 0.5;
  let reasoning = [];

  // Date detection (high priority)
  if (dateRatio >= 0.8) {
    detectedType = 'date';
    confidence = dateRatio;
    reasoning.push(`${(dateRatio * 100).toFixed(1)}% of values are valid dates`);
  }
  // Numeric detection
  else if (numericRatio >= 0.8) {
    // Binary detection within numeric
    if (binaryRatio >= 0.9 && uniqueValues.size <= 3) {
      detectedType = 'binary';
      confidence = binaryRatio;
      reasoning.push(`${(binaryRatio * 100).toFixed(1)}% of values are binary (0/1, true/false)`);
    } else {
      detectedType = 'numeric';
      confidence = numericRatio;
      reasoning.push(`${(numericRatio * 100).toFixed(1)}% of values are numeric`);
      
      if (integerCount > floatCount * 2) {
        reasoning.push('Mostly integers');
      } else if (floatCount > integerCount) {
        reasoning.push('Contains decimal values');
      }
    }
  }
  // Categorical detection
  else if (uniqueRatio < 0.5 && uniqueValues.size < 20) {
    detectedType = 'categorical';
    confidence = 1 - uniqueRatio;
    reasoning.push(`Low unique ratio (${(uniqueRatio * 100).toFixed(1)}%) suggests categories`);
  }
  // Text detection (default)
  else {
    detectedType = 'text';
    confidence = 0.6;
    reasoning.push('Default to text based on content analysis');
  }

  // Column name hints can boost confidence
  const columnNameLower = columnName.toLowerCase();
  const nameHints = {
    date: ['date', 'time', 'created', 'updated', 'timestamp'],
    numeric: ['amount', 'price', 'cost', 'revenue', 'count', 'quantity', 'rate', 'percent'],
    binary: ['flag', 'active', 'enabled', 'status'],
    categorical: ['category', 'type', 'class', 'group', 'level']
  };

  Object.entries(nameHints).forEach(([type, hints]) => {
    if (hints.some(hint => columnNameLower.includes(hint))) {
      if (type === detectedType) {
        confidence = Math.min(0.95, confidence + 0.1);
        reasoning.push(`Column name suggests ${type} type`);
      }
    }
  });

  return {
    type: detectedType,
    confidence: Math.round(confidence * 100) / 100,
    samples: sample.slice(0, 5).map(String),
    analysis: {
      ...analysis,
      numericRatio,
      dateRatio,
      binaryRatio,
      uniqueRatio,
      reasoning: reasoning.join('; '),
      integerCount,
      floatCount
    }
  };
};

// Enhanced file structure validation
export const validateFileStructure = (data) => {
  if (!data || data.length === 0) {
    return {
      isValid: false,
      error: 'No data provided',
      columnAnalysis: {}
    };
  }

  const columns = Object.keys(data[0]);
  const columnAnalysis = {};
  const issues = [];
  const warnings = [];
  const suggestions = [];

  // Analyze each column using detectColumnType
  columns.forEach(column => {
    const values = data.map(row => row[column]);
    const analysis = detectColumnType(values, column);
    
    columnAnalysis[column] = {
      type: analysis.type,
      confidence: analysis.confidence,
      samples: analysis.samples,
      uniqueCount: analysis.analysis.uniqueValueCount,
      nullCount: data.length - analysis.analysis.totalValues,
      issues: [],
      warnings: [],
      suggestions: [],
      reasoning: analysis.analysis.reasoning,
      // Add these for compatibility with your DataClassification component
      totalValues: analysis.analysis.totalValues,
      numericRatio: analysis.analysis.numericRatio,
      dateRatio: analysis.analysis.dateRatio
    };

    // Generate issues, warnings, and suggestions
    if (analysis.confidence < 0.7) {
      columnAnalysis[column].warnings.push(
        `Low confidence (${(analysis.confidence * 100).toFixed(0)}%) in type detection`
      );
    }

    if (analysis.analysis.hasNulls) {
      const nullRatio = (data.length - analysis.analysis.totalValues) / data.length;
      if (nullRatio > 0.1) {
        columnAnalysis[column].warnings.push(
          `${(nullRatio * 100).toFixed(1)}% missing values`
        );
      }
    }

    if (analysis.type === 'numeric' && analysis.analysis.uniqueValueCount < 5) {
      columnAnalysis[column].suggestions.push(
        'Consider if this should be categorical instead'
      );
    }

    if (analysis.type === 'text' && analysis.analysis.uniqueValueCount < 10) {
      columnAnalysis[column].suggestions.push(
        'Consider if this should be categorical instead'
      );
    }
  });

  // Overall file validation
  const numericColumns = Object.values(columnAnalysis).filter(a => a.type === 'numeric').length;
  const dateColumns = Object.values(columnAnalysis).filter(a => a.type === 'date').length;

  if (numericColumns === 0) {
    warnings.push('No numeric columns detected - ensure you have quantitative data');
  }

  if (dateColumns === 0) {
    warnings.push('No date columns detected - time series forecasting requires date information');
  }

  if (data.length < 30) {
    warnings.push('Dataset is quite small - consider having more historical data for better predictions');
  }

  return {
    isValid: issues.length === 0,
    issues,
    warnings,
    suggestions,
    columnAnalysis,
    summary: {
      totalRows: data.length,
      totalColumns: columns.length,
      numericColumns,
      dateColumns,
      categoricalColumns: Object.values(columnAnalysis).filter(a => a.type === 'categorical').length,
      textColumns: Object.values(columnAnalysis).filter(a => a.type === 'text').length
    }
  };
};