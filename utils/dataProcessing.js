export const processDataWithChoices = (data, seriesAnalysis, choices, config) => {
  const modifiedData = [...data];
  const timestampCol = config.timestamp_column;
  const itemIdCol = 'item_id';
  const targetCol = config.target;

  // Process each series based on analysis and choices
  seriesAnalysis.forEach(series => {
    const { seriesId, hasCriticalBreaks, hasNonCriticalBreaks } = series;

    // Handle critical breaks
    if (hasCriticalBreaks && choices.criticalBreaks === 'remove') {
      // Remove series with critical breaks
      const index = modifiedData.findIndex(row => row[itemIdCol] === seriesId);
      if (index !== -1) {
        modifiedData.splice(index, 1);
      }
      return; // Skip further processing for this series
    }

    // Handle non-critical breaks
    if (hasNonCriticalBreaks) {
      if (choices.nonCriticalBreaks === 'remove') {
        // Remove series with non-critical breaks
        const index = modifiedData.findIndex(row => row[itemIdCol] === seriesId);
        if (index !== -1) {
          modifiedData.splice(index, 1);
        }
      } else if (choices.nonCriticalBreaks === 'fill_zeros') {
        // Fill missing dates with zeros
        series.nonCriticalBreaks.forEach(date => {
          const newRow = {
            [timestampCol]: date,
            [itemIdCol]: seriesId,
            [targetCol]: 0
          };
          modifiedData.push(newRow);
        });
      } else if (choices.nonCriticalBreaks === 'mark_missing') {
        // Fill missing dates with zeros and mark as missing
        series.nonCriticalBreaks.forEach(date => {
          const newRow = {
            [timestampCol]: date,
            [itemIdCol]: seriesId,
            [targetCol]: 0,
            is_missing: 1
          };
          modifiedData.push(newRow);
        });
      }
    }
  });

  // Sort data by series ID and timestamp
  return modifiedData.sort((a, b) => {
    if (a[itemIdCol] === b[itemIdCol]) {
      return new Date(a[timestampCol]) - new Date(b[timestampCol]);
    }
    return a[itemIdCol].localeCompare(b[itemIdCol]);
  });
};