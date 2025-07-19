// app/api/upload/route.js
import { NextResponse } from 'next/server';
import { uploadToS3 } from '../../../utils/s3Storage';

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

    // Check file size (100MB = 104,857,600 bytes)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File size exceeds 100MB limit. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB` },
        { status: 413 }
      );
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
      dynamicTyping: false, // Keep as strings for validation
      worker: false, // Disable worker for server-side
      chunk: undefined, // Process all at once
      fastMode: false, // Use complete parsing for accuracy
      delimiter: '', // Auto-detect delimiter
      newline: '', // Auto-detect line endings
      quoteChar: '"',
      escapeChar: '"',
      transformHeader: (header) => {
        // Clean header names
        return header.trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '_');
      }
    });

    console.log('📊 Parse result:', {
      rowCount: parseResult.data?.length || 0,
      errorCount: parseResult.errors?.length || 0,
      fields: parseResult.meta?.fields || []
    });

    if (parseResult.errors && parseResult.errors.length > 0) {
      console.error('❌ CSV parsing errors:', parseResult.errors);
      // Only fail if there are fatal errors
      const fatalErrors = parseResult.errors.filter(error => error.type === 'Delimiter');
      if (fatalErrors.length > 0) {
        return NextResponse.json(
          { error: `CSV parsing failed: ${fatalErrors[0].message}` },
          { status: 400 }
        );
      }
    }

    const { data: rows, meta } = parseResult;
    
    if (!rows || rows.length === 0) {
      console.error('❌ No rows parsed from CSV');
      return NextResponse.json({ error: 'CSV file contains no data rows' }, { status: 400 });
    }

    // Upload original file to S3
    console.log('📤 Uploading original file to S3...');
    const s3Path = generateFilePath('inputs/raw', file.name);
    
    const uploadResult = await uploadFileToS3(
      Buffer.from(bytes),
      s3Path,
      'text/csv',
      {
        originalName: file.name,
        fileSize: file.size.toString(),
        uploadType: 'raw_input',
        rowCount: rows.length.toString(),
        columnCount: Object.keys(rows[0]).length.toString()
      }
    );

    console.log(`✅ File uploaded to S3: ${uploadResult.key}`);

    // Get column names
    const columns = Object.keys(rows[0]);
    
    console.log(`✅ Successfully parsed: ${rows.length} rows, ${columns.length} columns`);

    return NextResponse.json({
      success: true,
      preview: rows.slice(0, 10), // First 10 rows for preview
      data: rows, // Full dataset for processing
      columns: columns,
      totalRows: rows.length,
      fileSize: file.size,
      fileName: file.name,
      s3Info: {
        bucket: process.env.AWS_S3_BUCKET_NAME,
        key: uploadResult.key,
        url: uploadResult.url
      }
    });

  } catch (error) {
    console.error('❌ Upload API error:', error);
    return NextResponse.json(
      { error: `Upload failed: ${error.message}` },
      { status: 500 }
    );
  }
}

// Add GET handler if needed
export async function GET() {
  return NextResponse.json({ message: 'Upload endpoint ready' });
}