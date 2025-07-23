import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    // Parse the JSON body
    const { data, config } = await request.json();

    if (!data || !config) {
      return NextResponse.json(
        { error: 'Missing data or configuration' },
        { status: 400 }
      );
    }

    // Process data directly without saving to file
    const validationProcess = await import('./validationProcess');
    const results = await validationProcess.default(data, config);

    return NextResponse.json({
      success: true,
      ...results
    });

  } catch (error) {
    console.error('Validation error:', error);
    return NextResponse.json(
      { error: `Validation failed: ${error.message}` },
      { status: 500 }
    );
  }
}