/**
 * Verifies that the combination of date column and grouping columns creates unique rows
 * @param {Array} data - The raw data array
 * @param {string} dateColumn - The name of the date column
 * @param {Array} groupingColumns - Array of grouping column names
 * @returns {Object} Object containing uniqueness check results
 */
export const verifyDateAndGroupingUniqueness = (data, dateColumn, groupingColumns) => {
  if (!data || !dateColumn) {
    return { 
      isUnique: false, 
      duplicates: [],
      error: 'Missing required data or date column'
    };
  }

  // Create composite keys for each row
  const keys = new Map();
  const duplicates = [];

  data.forEach((row, index) => {
    const keyParts = [row[dateColumn]];
    if (groupingColumns?.length > 0) {
      groupingColumns.forEach(col => keyParts.push(row[col]));
    }
    const compositeKey = keyParts.join('|');

    if (keys.has(compositeKey)) {
      duplicates.push({
        key: compositeKey,
        rows: [keys.get(compositeKey), index + 1],
        values: {
          date: row[dateColumn],
          grouping: groupingColumns?.reduce((acc, col) => {
            acc[col] = row[col];
            return acc;
          }, {})
        }
      });
    } else {
      keys.set(compositeKey, index + 1);
    }
  });

  return {
    isUnique: duplicates.length === 0,
    duplicates,
    totalRows: data.length,
    uniqueRows: keys.size,
    reductionPercent: ((data.length - keys.size) / data.length * 100).toFixed(1)
  };
};

/**
 * Analyzes the potential impact of data aggregation
 * @param {Array} data - The raw data array
 * @param {string} dateColumn - The name of the date column
 * @param {Array} groupingColumns - Array of grouping column names
 * @returns {Object} Analysis results
 */
export const analyzeAggregationImpact = (data, dateColumn, groupingColumns) => {
  const uniquenessResult = verifyDateAndGroupingUniqueness(data, dateColumn, groupingColumns);

  return {
    originalCount: uniquenessResult.totalRows,
    aggregatedCount: uniquenessResult.uniqueRows,
    reductionPercent: uniquenessResult.reductionPercent,
    hasDuplicates: !uniquenessResult.isUnique,
    duplicateCount: uniquenessResult.duplicates.length,
    duplicateSamples: uniquenessResult.duplicates.slice(0, 5) // First 5 duplicates as examples
  };
};