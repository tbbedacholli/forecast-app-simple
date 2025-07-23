import { addDays, addWeeks, addMonths, addQuarters, addYears } from 'date-fns';
import { parse, format, isValid } from 'date-fns';

// Frequency mapping to date-fns functions
const frequencyFunctions = {
  'D': (date, amount) => addDays(date, amount),
  'W': (date, amount) => addWeeks(date, amount),
  'M': (date, amount) => addMonths(date, amount),
  'Q': (date, amount) => addQuarters(date, amount),
  'Y': (date, amount) => addYears(date, amount)
};

// Get the next date based on frequency
export const getNextDate = (date, frequency) => {
  const fn = frequencyFunctions[frequency];
  return fn ? fn(date, 1) : date;
};

// Get the first forecast date based on maximum data date
export const getFirstForecastDate = (maxDate, frequency) => {
  const date = new Date(maxDate);
  
  // For weekly frequency, move to next Sunday
  if (frequency === 'W') {
    const daysUntilSunday = 7 - date.getDay();
    return addDays(date, daysUntilSunday);
  }
  
  // For other frequencies, just get next date
  return getNextDate(date, frequency);
};

// Generate sequence of dates
export const generateDateSequence = (startDate, frequency, count) => {
  const dates = [];
  let currentDate = new Date(startDate);
  
  for (let i = 0; i < count; i++) {
    dates.push(currentDate);
    currentDate = getNextDate(currentDate, frequency);
  }
  
  return dates;
};

// Define supported date formats
export const DATE_FORMATS = {
  STANDARD: [
    'yyyy-MM-dd',          // 2023-12-31
    'dd/MM/yyyy',          // 31/12/2023
    'MM/dd/yyyy',          // 12/31/2023
    'yyyy/MM/dd',          // 2023/12/31
    'd/M/yyyy',           // 1/1/2023
    'M/d/yyyy'            // 1/1/2023
  ],
  LOCALIZED: [
    'PP',                  // Apr 29, 2023
    'P',                   // 04/29/2023
    'PPP'                  // April 29th, 2023
  ],
  ISO: [
    "yyyy-MM-dd'T'HH:mm:ss.SSSxxx", // ISO with timezone
    "yyyy-MM-dd'T'HH:mm:ss",        // ISO without timezone
  ]
};

/**
 * Utility for parsing dates in multiple formats
 */
export const parseFlexibleDate = (dateStr) => {
  if (!dateStr) return null;

  // Common date formats to try
  const formats = [
    // ISO formats
    { 
      regex: /^(\d{4})-(\d{2})-(\d{2})$/, 
      parse: (m) => new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])) 
    },
    { 
      regex: /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/, 
      parse: (m) => new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6])) 
    },
    
    // European/UK formats (DD/MM/YYYY)
    { 
      regex: /^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/, 
      parse: (m) => new Date(Date.UTC(+m[3], +m[2] - 1, +m[1])) 
    },
    
    // US formats (MM/DD/YYYY)
    { 
      regex: /^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/, 
      parse: (m) => new Date(Date.UTC(+m[3], +m[1] - 1, +m[2])) 
    },
    
    // Year first formats (YYYY/MM/DD)
    { 
      regex: /^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/, 
      parse: (m) => new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])) 
    },
    
    // Short year formats
    { 
      regex: /^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2})$/, 
      parse: (m) => {
        const year = +m[3] + (+m[3] >= 50 ? 1900 : 2000);
        return new Date(Date.UTC(year, +m[2] - 1, +m[1]));
      } 
    },
    
    // Excel/Spreadsheet formats
    { 
      regex: /^(\d{5,})$/, 
      parse: (m) => {
        const date = new Date(0);
        date.setUTCMilliseconds(Math.round((+m[1] - 25569) * 86400 * 1000));
        return date;
      } 
    }
  ];

  try {
    const str = dateStr.toString().trim();

    // Try each format
    for (const format of formats) {
      const match = str.match(format.regex);
      if (match) {
        const parsed = format.parse(match);
        // Validate parsed date
        if (parsed && !isNaN(parsed.getTime())) {
          return parsed;
        }
      }
    }

    // Try native Date parsing as fallback
    const nativeDate = new Date(str);
    if (!isNaN(nativeDate.getTime())) {
      return new Date(Date.UTC(
        nativeDate.getFullYear(),
        nativeDate.getMonth(),
        nativeDate.getDate(),
        nativeDate.getHours(),
        nativeDate.getMinutes(),
        nativeDate.getSeconds()
      ));
    }

    console.warn(`Unable to parse date: ${dateStr}`);
    return null;

  } catch (error) {
    console.error(`Error parsing date ${dateStr}:`, error);
    return null;
  }
};

/**
 * Format date consistently for display/storage
 */
export const formatDateForDisplay = (date) => {
  if (!date) return '';
  return date.toISOString().split('T')[0];
};

/**
 * Validate if a string can be parsed as a date
 */
export const isValidDate = (dateStr) => {
  const parsed = parseFlexibleDate(dateStr);
  return parsed !== null && !isNaN(parsed.getTime());
};

/**
 * Generic date column detector
 */
export const isDateColumn = (columnSample) => {
  if (!columnSample || !Array.isArray(columnSample)) return false;
  
  // Check first few non-empty values
  const sampleSize = Math.min(5, columnSample.length);
  let validDates = 0;

  for (let i = 0; i < columnSample.length && validDates < sampleSize; i++) {
    const value = columnSample[i];
    if (!value) continue;

    const parsed = parseFlexibleDate(value);
    if (parsed) validDates++;
  }

  // Return true if most samples are valid dates
  return validDates >= Math.ceil(sampleSize * 0.8);
};

/**
 * Generic numeric column detector
 */
export const isNumericColumn = (columnSample) => {
  if (!columnSample || !Array.isArray(columnSample)) return false;

  const sampleSize = Math.min(5, columnSample.length);
  let validNumbers = 0;

  for (let i = 0; i < columnSample.length && validNumbers < sampleSize; i++) {
    const value = columnSample[i];
    if (!value) continue;

    // Remove common number formatting
    const cleanValue = value.toString().replace(/[,%$]/g, '');
    if (!isNaN(cleanValue)) validNumbers++;
  }

  return validNumbers >= Math.ceil(sampleSize * 0.8);
};