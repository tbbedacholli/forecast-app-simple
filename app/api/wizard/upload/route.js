// app/api/wizard/upload/route.js
import { NextResponse } from 'next/server';
import Papa from 'papaparse';

// Import with error handling
let uploadToS3;
try {
  const s3Module = await import('../../../../utils/s3Storage');
  uploadToS3 = s3Module.uploadToS3;
} catch (error) {
  console.error('Failed to import S3 storage:', error);
  uploadToS3 = null;
}

function generateFilePath(prefix, filename) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `${prefix}/${timestamp}-${filename}`;
}

async function uploadFileToS3(buffer, key, contentType, metadata = {}) {
  if (!uploadToS3) {
    throw new Error('S3 upload functionality not available');
  }
  return await uploadToS3(key, buffer, contentType);
}

export async function POST(request) {
  try {
    console.log('🔄 Upload API called');
    
    const data = await request.formData();
    const file = data.get('file');
    const fileType = data.get('fileType');
    const uploadPath = data.get('uploadPath');

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
    const maxSize = 100 * 1024 * 1024;
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
    
    if (!csvContent.trim()) {
      console.error('❌ Empty CSV content');
      return NextResponse.json({ error: 'CSV file is empty' }, { status: 400 });
    }

    // Parse CSV
    console.log('🔍 Parsing CSV...');
    const parseResult = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      transformHeader: (header) => {
        return header.trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '_');
      }
    });

    const { data: rows } = parseResult;
    
    if (!rows || rows.length === 0) {
      console.error('❌ No rows parsed from CSV');
      return NextResponse.json({ error: 'CSV file contains no data rows' }, { status: 400 });
    }

    // Determine the upload path based on file type
    const s3Path = generateFilePath(
      uploadPath || 'inputs/raw', // Use provided path or default
      file.name
    );

    // Try to upload to S3
    let s3Info = null;
    try {
      if (uploadToS3) {
        console.log(`📤 Uploading to S3 path: ${s3Path}`);
        const uploadResult = await uploadFileToS3(Buffer.from(bytes), s3Path, 'text/csv');
        
        if (uploadResult.success) {
          console.log(`✅ File uploaded to S3: ${uploadResult.key}`);
          s3Info = {
            bucket: process.env.AWS_S3_BUCKET_NAME,
            key: uploadResult.key,
            url: uploadResult.url
          };
        }
      }
    } catch (s3Error) {
      console.warn('⚠️ S3 upload failed:', s3Error.message);
      throw s3Error; // Rethrow to handle in the main try-catch
    }

    const columns = Object.keys(rows[0]);
    
    return NextResponse.json({
      success: true,
      preview: rows.slice(0, 10),
      data: rows,
      columns: columns,
      totalRows: rows.length,
      fileSize: file.size,
      fileName: file.name,
      s3Info: s3Info
    });

  } catch (error) {
    console.error('❌ Upload API error:', error);
    return NextResponse.json(
      { error: `Upload failed: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Upload endpoint ready' });
}