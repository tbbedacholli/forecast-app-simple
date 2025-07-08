// lib/forecastService.js
import axios from 'axios';
import config from './config.js';

/**
 * Fetch raw forecast data from the forecasting engine.
 * @param {object} params  input parameters for the forecast (dates, metrics, etc.)
 * @returns {Promise<object[]>}  raw engine response
 */
export async function fetchRawForecast(params = {}) {
  try {
    const url = config.forecastEngineUrl; 
    const response = await axios.post(url, params, {
      headers: { 'Content-Type': 'application/json' }
    });
    return response.data;
  } catch (error) {
    // Fallback to mock data for demo
    console.warn('Using mock data:', error.message);
    return [
      { metricName: 'Revenue', metricValue: '$120k' },
      { metricName: 'Users', metricValue: '15k' },
      { metricName: 'Growth', metricValue: '+5.2%' },
      { metricName: 'Conversion', metricValue: '3.4%' },
      { metricName: 'Retention', metricValue: '89%' },
      { metricName: 'Churn Rate', metricValue: '2.1%' }
    ];
  }
}

/**
 * Transform raw engine output into UI-friendly cards.
 * @param {object[]} rawData  
 * @returns {{ title: string, value: string|number }[]}
 */
export function transformForecastData(rawData) {
  return rawData.map(item => ({
    title: item.metricName || item.name || 'Unknown',
    value: item.metricValue !== undefined ? item.metricValue : item.value ?? '—'
  }));
}

/**
 * High-level service: fetch + transform in one call.
 * @param {object} params  
 * @returns {Promise<{title:string, value:string|number}[]>}
 */
export async function getForecastData(params = {}) {
  const raw = await fetchRawForecast(params);
  return transformForecastData(raw);
}