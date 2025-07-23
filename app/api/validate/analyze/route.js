import { NextResponse } from 'next/server';

// Update the config to use the new App Router syntax
export async function POST(request) {
  const maxBodySize = '50mb';
  // Set response headers for larger payload
  const headers = {
    'Transfer-Encoding': 'chunked',
    'Content-Type': 'application/json',
  };

  try {
    // Parse the JSON body with size limit
    const body = await request.json();
    const { data, config } = body;

    if (!data || !config) {
      return NextResponse.json(
        { error: 'Missing data or configuration' },
        { 
          status: 400,
          headers
        }
      );
    }

    // Process data
    const validationProcess = await import('./validationProcess');
    const results = await validationProcess.default(data, config);

    return NextResponse.json({
      success: true,
      ...results
    }, { headers });

  } catch (error) {
    console.error('Validation error:', error);
    return NextResponse.json(
      { error: `Validation failed: ${error.message}` },
      { 
        status: 500,
        headers
      }
    );
  }
}

// Remove the old config export
// export const config = { ... }