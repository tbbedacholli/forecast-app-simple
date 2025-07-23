// app/api/wizard/upload/route.js
import { NextResponse } from 'next/server';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import Papa from 'papaparse';

// Configure S3 client with MY_ prefixed environment variables
const s3Client = new S3Client({
  region: process.env.MY_REGION,
  credentials: {
    accessKeyId: process.env.MY_ACCESS_KEY_ID,
    secretAccessKey: process.env.MY_SECRET_ACCESS_KEY
  }
});

function generateFilePath(prefix, filename) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `${prefix}/${timestamp}-${filename}`;
}

// Remove the old config export
// export const config = { ... }

// Add the new route segment config
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes timeout

// Add size limit through headers
export async function POST(request) {
  // Set headers for large file handling
  const headers = {
    'Transfer-Encoding': 'chunked',
    'Content-Type': 'application/json',
  };

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

    // Use multipart upload for large files
    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: process.env.MY_S3_BUCKET_NAME,
        Key: s3Path,
        Body: Buffer.from(bytes),
        ContentType: file.type,
      },
      queueSize: 4, // number of concurrent uploads
      partSize: 5 * 1024 * 1024, // 5MB part size
      leavePartsOnError: false
    });

    // Add event listeners for better monitoring
    upload.on('httpUploadProgress', (progress) => {
      console.log(`Upload progress: ${progress.loaded}/${progress.total}`);
    });

    // Perform upload with retry logic
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        await upload.done();
        break;
      } catch (error) {
        retryCount++;
        console.error(`Upload attempt ${retryCount} failed:`, error);
        
        if (retryCount === maxRetries) {
          throw error;
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, retryCount * 2000));
      }
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
      s3Info: {
        key: s3Path,
        url: `https://${process.env.MY_S3_BUCKET_NAME}.s3.${process.env.MY_REGION}.amazonaws.com/${s3Path}`
      }
    }, { headers });

  } catch (error) {
    console.error('❌ Upload API error:', error);
    return NextResponse.json({
      error: 'Upload failed',
      details: error.message
    }, { 
      status: 500,
      headers 
    });
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Upload endpoint ready' });
}