// app/api/forecast/route.js
import { getForecastData } from '../../../lib/forecastService.js';

export async function GET(request) {
  try {
    const forecastData = await getForecastData();
    return Response.json(forecastData);
  } catch (error) {
    console.error('Forecast API error:', error);
    return Response.json(
      { error: 'Failed to fetch forecast data' },
      { status: 500 }
    );
  }
}