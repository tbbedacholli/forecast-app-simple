/**
 * Generic column type detection utilities
 */

// Check if a column contains date values
export const isDateColumn = (columnSamples) => {
  if (!columnSamples || !Array.isArray(columnSamples)) return false;

  // Check first few non-empty values
  const sampleSize = Math.min(5, columnSamples.length);
  let validDates = 0;

  for (const value of columnSamples) {
    if (!value) continue;
    const str = value.toString().trim();
    
    // Try all common date formats
    const datePatterns = [
      /^\d{1,2}\/\d{1,2}\/\d{4}$/,     // dd/mm/yyyy or d/m/yyyy
      /^\d{4}[/\-\.]\d{1,2}[/\-\.]\d{1,2}$/, // yyyy/mm/dd
      /^\d{1,2}[/\-\.]\d{1,2}[/\-\.]\d{2}$/, // dd/mm/yy
      /^\d{4}-\d{2}-\d{2}$/            // ISO format
    ];

    if (datePatterns.some(pattern => pattern.test(str))) {
      validDates++;
    }

    if (validDates >= sampleSize * 0.8) return true;
  }

  return false;
};

// Check if a column contains numeric values
export const isNumericColumn = (columnSamples) => {
  if (!columnSamples || !Array.isArray(columnSamples)) return false;

  const sampleSize = Math.min(5, columnSamples.length);
  let validNumbers = 0;

  for (const value of columnSamples) {
    if (!value) continue;
    
    // Remove common number formatting
    const cleanValue = value.toString().replace(/[,%$]/g, '');
    if (!isNaN(cleanValue)) {
      validNumbers++;
    }

    if (validNumbers >= sampleSize * 0.8) return true;
  }

  return false;
};