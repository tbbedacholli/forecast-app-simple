import { addDays, addWeeks, addMonths, addQuarters, addYears } from 'date-fns';

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