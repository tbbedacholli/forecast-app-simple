export const processDataForTraining = (rawData, featureClassification, selectedColumns) => {
  if (!rawData || rawData.length === 0) {
    throw new Error('No data provided for processing');
  }

  const processedData = rawData.map(row => {
    const processedRow = {};
    
    // Process each column based on its type and role
    Object.keys(row).forEach(columnName => {
      const value = row[columnName];
      const columnRole = featureClassification?.columnRoles?.[columnName];
      
      // Skip ignored columns
      if (columnRole === 'Ignore') {
        return;
      }

      // Process date columns
      if (columnName === selectedColumns?.date || columnRole === 'date') {
        processedRow.timestamp = formatDateForTraining(value);
        return;
      }

      // Process target column
      if (columnName === selectedColumns?.target) {
        processedRow[columnName] = cleanNumericValue(value);
        return;
      }

      // Process other columns based on their data type
      const processedValue = processColumnValue(value, columnName, featureClassification);
      if (processedValue !== null && processedValue !== undefined) {
        processedRow[columnName] = processedValue;
      }
    });

    // Add item_id if not present (for multi-series forecasting)
    if (!processedRow.item_id) {
      // Use level columns to create item_id, or default to 'overall'
      if (selectedColumns?.level && selectedColumns.level.length > 0) {
        const levelValues = selectedColumns.level
          .map(levelCol => row[levelCol])
          .filter(val => val !== null && val !== undefined && val !== '')
          .join('_');
        processedRow.item_id = levelValues || 'overall';
      } else {
        processedRow.item_id = 'overall';
      }
    }

    return processedRow;
  });

  // Sort by timestamp if available
  if (processedData[0]?.timestamp) {
    processedData.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }

  return processedData;
};

const formatDateForTraining = (dateValue) => {
  if (!dateValue) return null;
  
  try {
    let date;
    
    if (typeof dateValue === 'string') {
      // Handle MM/DD/YYYY format
      if (dateValue.includes('/')) {
        const [month, day, year] = dateValue.split('/');
        date = new Date(year, month - 1, day);
      }
      // Handle YYYY-MM-DD format
      else if (dateValue.includes('-') && dateValue.length === 10) {
        date = new Date(dateValue);
      }
      // Try parsing as-is
      else {
        date = new Date(dateValue);
      }
    } else {
      date = new Date(dateValue);
    }

    // Validate date
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date: ${dateValue}`);
    }

    // Return in YYYY-MM-DD format
    return date.toISOString().split('T')[0];
  } catch (error) {
    console.warn(`Failed to parse date: ${dateValue}`, error);
    return null;
  }
};

const cleanNumericValue = (value) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  // If already a number, return it
  if (typeof value === 'number') {
    return value;
  }

  // Convert string to number
  let cleanValue = String(value).trim();
  
  // Remove quotes (both single and double)
  cleanValue = cleanValue.replace(/^["']|["']$/g, '');
  
  // Remove commas and currency symbols
  cleanValue = cleanValue.replace(/[,$%]/g, '');
  
  // Handle negative numbers in parentheses
  if (cleanValue.startsWith('(') && cleanValue.endsWith(')')) {
    cleanValue = '-' + cleanValue.slice(1, -1);
  }

  const numValue = parseFloat(cleanValue);
  return isNaN(numValue) ? null : numValue;
};

const cleanPercentageValue = (value) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  let cleanValue = String(value).trim();
  
  // Remove quotes
  cleanValue = cleanValue.replace(/^["']|["']$/g, '');
  
  // If it has % symbol, remove it and divide by 100
  if (cleanValue.includes('%')) {
    cleanValue = cleanValue.replace('%', '');
    const numValue = parseFloat(cleanValue);
    return isNaN(numValue) ? null : numValue / 100;
  }

  // If it's already a decimal (like 0.34), return as-is
  const numValue = parseFloat(cleanValue);
  if (!isNaN(numValue)) {
    // If the value is > 1, assume it's a percentage that needs conversion
    return numValue > 1 ? numValue / 100 : numValue;
  }

  return null;
};

const processColumnValue = (value, columnName, featureClassification) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const columnAnalysis = featureClassification?.validation?.columnAnalysis?.[columnName];
  const dataType = columnAnalysis?.type || 'unknown';

  // Detect if column contains percentages
  const isPercentageColumn = columnName.toLowerCase().includes('rate') || 
                            columnName.toLowerCase().includes('percent') ||
                            String(value).includes('%');

  if (isPercentageColumn) {
    return cleanPercentageValue(value);
  }

  switch (dataType) {
    case 'numeric':
    case 'binary':
      return cleanNumericValue(value);
    
    case 'categorical':
    case 'text':
      return String(value).trim();
    
    case 'date':
      return formatDateForTraining(value);
    
    default:
      // Try to determine type from value
      if (!isNaN(parseFloat(value)) && isFinite(value)) {
        return cleanNumericValue(value);
      }
      return String(value).trim();
  }
};

export const generateProcessedFileName = (originalFileName) => {
  const timestamp = getTimestamp().split('_')[0]; // Get just the date part
  const baseName = getBaseName(originalFileName);
  return `${baseName}_processed_${timestamp}.csv`;
};

// Add this new function to generate config.json
export const generateConfigFile = (wizardData, processedFileName) => {
  const config = {
    target: wizardData.selectedColumns?.target || "revenue",
    prediction_length: wizardData.selectedColumns?.horizon || 60,
    eval_metric: "WQL",
    static_features: [],
    dynamic_features: [],
    forecast_levels: [],
    time_granularity: mapFrequencyToGranularity(wizardData.selectedColumns?.frequency || "D"),
    timestamp_column: "timestamp",
    original_filename: wizardData.fileName || "data.csv",
    column_types: {},
    model_path: `outputs/${getBaseName(wizardData.fileName)}_${getTimestamp()}`,
    uploaded_covariates_path: null,
    template_path: null,
    time_limit: 600
  };

  // Build dynamic_features from feature classification
  if (wizardData.featureClassification?.columnRoles) {
    Object.entries(wizardData.featureClassification.columnRoles).forEach(([column, role]) => {
      if (role === 'Feature' && column !== wizardData.selectedColumns?.target && column !== wizardData.selectedColumns?.date) {
        config.dynamic_features.push(column);
        
        // Determine column type from validation data
        const columnAnalysis = wizardData.validation?.columnAnalysis?.[column];
        if (columnAnalysis) {
          config.column_types[column] = mapAnalysisTypeToConfigType(columnAnalysis.type);
        } else {
          // Default to numeric if no analysis available
          config.column_types[column] = "numeric";
        }
      }
    });
  }

  // Add forecast levels if any level columns are selected
  if (wizardData.selectedColumns?.level && wizardData.selectedColumns.level.length > 0) {
    config.forecast_levels = wizardData.selectedColumns.level;
  }

  // Add future covariates paths if uploaded
  if (wizardData.futureValuesFile) {
    const baseModelPath = config.model_path;
    config.uploaded_covariates_path = `${baseModelPath}/uploads/uploaded_covariates_${getTimestamp()}.csv`;
    config.template_path = `${baseModelPath}/prediction_input_templates/future_covariates_template_${getTimestamp()}.csv`;
  }

  return config;
};

// Helper functions for config generation
const mapFrequencyToGranularity = (frequency) => {
  const frequencyMap = {
    'H': 'Hourly',
    'D': 'Daily',
    'W': 'Weekly',
    'M': 'Monthly',
    'Q': 'Quarterly',
    'Y': 'Yearly'
  };
  return frequencyMap[frequency] || 'Daily';
};

const mapAnalysisTypeToConfigType = (analysisType) => {
  const typeMap = {
    'numeric': 'numeric',
    'binary': 'numeric', // Binary is still numeric (0/1)
    'categorical': 'categorical',
    'date': 'date',
    'text': 'categorical'
  };
  return typeMap[analysisType] || 'numeric';
};

const getBaseName = (fileName) => {
  if (!fileName) return 'data';
  return fileName.replace(/\.[^/.]+$/, ''); // Remove extension
};

const getTimestamp = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  return `${year}${month}${day}_${hours}${minutes}${seconds}`;
};

export const convertToCSV = (data) => {
  if (!data || data.length === 0) {
    return '';
  }

  // Get headers from first row
  const headers = Object.keys(data[0]);
  
  // Create CSV content
  const csvContent = [
    headers.join(','), // Header row
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Handle values that might contain commas or quotes
        if (value === null || value === undefined) {
          return '';
        }
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    )
  ].join('\n');

  return csvContent;
};

export const downloadCSV = (csvContent, fileName) => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

// Add function to download JSON file
export const downloadJSON = (jsonContent, fileName) => {
  const blob = new Blob([JSON.stringify(jsonContent, null, 2)], { 
    type: 'application/json;charset=utf-8;' 
  });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};