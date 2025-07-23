import { parse, format, isValid, parseISO } from 'date-fns';

// Define date format groups
const DATE_FORMATS = {
  ISO: [
    'yyyy-MM-dd',          // 2022-12-31
    "yyyy-MM-dd'T'HH:mm:ss.SSSxxx", // ISO with timezone
    "yyyy-MM-dd'T'HH:mm:ss",        // ISO without timezone
  ],
  SLASH: [
    'd/M/yyyy',     // 1/1/2022
    'dd/MM/yyyy',   // 01/01/2022
    'M/d/yyyy',     // 1/1/2022
    'MM/dd/yyyy',   // 01/01/2022
    'yyyy/MM/dd',   // 2022/01/01
  ],
  DASH: [
    'd-M-yyyy',     // 1-1-2022
    'dd-MM-yyyy',   // 01-01-2022
    'yyyy-M-d',     // 2022-1-1
  ],
  LOCALE: [
    'PP',           // Apr 29, 1453
    'P',            // 04/29/1453
    'PPP'           // April 29th, 1453
  ]
};

// Improved date validation function
const validateAndParseDate = (dateStr) => {
  if (!dateStr) return null;

  // Clean the input
  const cleanDate = dateStr.toString().trim();

  // 1. Try ISO parsing first (most reliable)
  try {
    const isoDate = parseISO(cleanDate);
    if (isValid(isoDate)) {
      return isoDate;
    }
  } catch (e) {
    // Continue to other formats
  }

  // 2. Try built-in Date parsing
  const builtInDate = new Date(cleanDate);
  if (isValid(builtInDate)) {
    return builtInDate;
  }

  // 3. Try format-specific parsing based on separators
  const separator = cleanDate.match(/[^0-9a-zA-Z]/)?.[0];
  if (separator) {
    const relevantFormats = 
      separator === '/' ? DATE_FORMATS.SLASH :
      separator === '-' ? DATE_FORMATS.DASH :
      DATE_FORMATS.LOCALE;

    for (const fmt of relevantFormats) {
      try {
        const parsedDate = parse(cleanDate, fmt, new Date());
        if (isValid(parsedDate)) {
          return parsedDate;
        }
      } catch (e) {
        continue;
      }
    }
  }

  // 4. Try locale-specific formats as last resort
  for (const fmt of DATE_FORMATS.LOCALE) {
    try {
      const parsedDate = parse(cleanDate, fmt, new Date());
      if (isValid(parsedDate)) {
        return parsedDate;
      }
    } catch (e) {
      continue;
    }
  }

  return null;
};

export default async function validationProcess(data, config) {
  console.log('Starting validation process with config:', config);
  
  const uniqueSeries = new Set();
  const categories = { cat1: 0, cat2: 0, cat3: 0 };
  let processedCount = 0;
  const seriesData = new Map();

  try {
    // Process data directly from memory
    for (const row of data) {
      try {
        const seriesId = row[config.id_column];
        const dateStr = row[config.timestamp_column];
        
        if (!seriesId || !dateStr) {
          console.warn('Skipping row with missing data:', row);
          continue;
        }

        const date = validateAndParseDate(dateStr);
        if (!date) {
          console.warn(`Skipping row with invalid date: ${dateStr}`);
          continue;
        }

        if (!seriesData.has(seriesId)) {
          seriesData.set(seriesId, new Set());
          uniqueSeries.add(seriesId);
        }
        seriesData.get(seriesId).add(date.getTime());
        processedCount++;
      } catch (rowError) {
        console.warn('Error processing row:', rowError);
      }
    }

    console.log(`Processed ${processedCount} rows with ${uniqueSeries.size} unique series`);

    // Process series data
    const results = [];
    for (const [seriesId, dates] of seriesData.entries()) {
      const sortedDates = Array.from(dates).sort();
      const minDate = new Date(sortedDates[0]);
      const maxDate = new Date(sortedDates[sortedDates.length - 1]);

      // Generate expected dates
      const expectedDates = generateDateSequence(minDate, maxDate, config.time_granularity);
      const missingDates = expectedDates.filter(date => 
        !dates.has(date.getTime())
      );

      // Check critical period
      const criticalPeriodStart = new Date(maxDate);
      adjustDateByGranularity(criticalPeriodStart, config.time_granularity, -(config.prediction_length * 2));

      const criticalBreaks = missingDates.filter(date => date >= criticalPeriodStart);
      const nonCriticalBreaks = missingDates.filter(date => date < criticalPeriodStart);

      results.push({
        seriesId,
        hasCriticalBreaks: criticalBreaks.length > 0,
        hasNonCriticalBreaks: nonCriticalBreaks.length > 0,
        criticalBreaksCount: criticalBreaks.length,
        nonCriticalBreaksCount: nonCriticalBreaks.length,
        totalRecords: dates.size
      });

      // Categorize the series
      if (!criticalBreaks.length && !nonCriticalBreaks.length) {
        categories.cat1++;
      } else if (!criticalBreaks.length && nonCriticalBreaks.length) {
        categories.cat2++;
      } else {
        categories.cat3++;
      }
    }

    return {
      success: true,
      totalSeries: uniqueSeries.size,
      category1Count: categories.cat1,
      category2Count: categories.cat2,
      category3Count: categories.cat3,
      processedRecords: processedCount,
      seriesAnalysis: results,
      timeGranularity: config.time_granularity,
      predictionLength: config.prediction_length,
      requiredLength: config.prediction_length * 2
    };

  } catch (error) {
    console.error('Validation process error:', error);
    throw error;
  }
}

function adjustDateByGranularity(date, granularity, units) {
  switch(granularity.toLowerCase()) {
    case 'daily':
    case 'd':
      date.setDate(date.getDate() + units);
      break;
    case 'weekly':
    case 'w':
      date.setDate(date.getDate() + (units * 7));
      break;
    case 'monthly':
    case 'm':
      date.setMonth(date.getMonth() + units);
      break;
    case 'quarterly':
    case 'q':
      date.setMonth(date.getMonth() + (units * 3));
      break;
  }
}

function generateDateSequence(start, end, granularity) {
  const dates = [];
  const current = new Date(start);
  
  while (current <= end) {
    dates.push(new Date(current));
    adjustDateByGranularity(current, granularity, 1);
  }
  return dates;
}