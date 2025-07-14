// app/api/wizard/upload/route.js
import { NextResponse } from 'next/server';
import Papa from 'papaparse';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(request) {
  try {
    console.log('🔄 Upload API called');
    
    // Check if request has form data
    if (!request.formData) {
      console.error('❌ No formData method available');
      return NextResponse.json({ error: 'Invalid request format' }, { status: 400 });
    }

    console.log('📋 Getting form data...');
    const data = await request.formData();
    console.log('📋 Form data received');
    
    const file = data.get('file');
    console.log('📁 File from form:', file ? `${file.name} (${file.size} bytes)` : 'No file');

    if (!file) {
      console.error('❌ No file in form data');
      return NextResponse.json({ error: 'No file received' }, { status: 400 });
    }

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      console.error('❌ Invalid file type:', file.name);
      return NextResponse.json({ error: 'Please upload a CSV file' }, { status: 400 });
    }

    console.log('📊 Processing file:', file.name, 'Size:', file.size);

    // Get file content
    const bytes = await file.arrayBuffer();
    const csvContent = new TextDecoder().decode(bytes);
    
    console.log('📝 CSV content length:', csvContent.length);
    console.log('📝 First 100 chars:', csvContent.substring(0, 100));

    if (!csvContent.trim()) {
      console.error('❌ Empty CSV content');
      return NextResponse.json({ error: 'CSV file is empty' }, { status: 400 });
    }

    // Parse CSV
    console.log('🔍 Parsing CSV...');
    const parseResult = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      preview: 1000,
    });

    console.log('📊 Parse result:', {
      rowCount: parseResult.data?.length || 0,
      errorCount: parseResult.errors?.length || 0,
      fields: parseResult.meta?.fields || []
    });

    if (parseResult.errors.length > 0) {
      console.error('❌ CSV parsing errors:', parseResult.errors);
      return NextResponse.json({ 
        error: 'CSV parsing failed: ' + parseResult.errors[0].message 
      }, { status: 400 });
    }

    const { data: rows, meta } = parseResult;
    
    if (!rows || rows.length === 0) {
      console.error('❌ No rows parsed from CSV');
      return NextResponse.json({ error: 'CSV file contains no data rows' }, { status: 400 });
    }

    // Get column names
    const columns = meta.fields || Object.keys(rows[0]);
    console.log('📋 Columns found:', columns);
    
    // Get preview data
    const preview = rows.slice(0, 10);
    const totalRows = rows.length;

    console.log('✅ Success! Rows:', totalRows, 'Columns:', columns.length);

    return NextResponse.json({
      filename: file.name,
      columns,
      preview,
      totalRows,
      success: true
    });

  } catch (error) {
    console.error('💥 Upload error:', error);
    console.error('💥 Error stack:', error.stack);
    
    return NextResponse.json({ 
      error: 'Upload failed: ' + error.message,
      details: error.stack
    }, { status: 500 });
  }
}