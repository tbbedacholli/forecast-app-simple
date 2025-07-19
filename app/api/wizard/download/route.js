import { NextRequest, NextResponse } from 'next/server';
import { uploadToS3, generateFilePath } from '../../../../utils/s3Storage';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(request) {
  try {
    console.log('🔄 Download API called');
    
    const { type, data, fileName, metadata } = await request.json();

    if (!data || !fileName) {
      return NextResponse.json({ error: 'Missing data or fileName' }, { status: 400 });
    }

    // Generate S3 path based on file type
    let s3Prefix;
    let contentType;
    let fileContent;

    switch (type) {
      case 'csv':
        s3Prefix = 'outputs/processed';
        contentType = 'text/csv';
        fileContent = typeof data === 'string' ? data : JSON.stringify(data);
        break;
      
      case 'config':
        s3Prefix = 'outputs/configs';
        contentType = 'application/json';
        fileContent = typeof data === 'object' ? JSON.stringify(data, null, 2) : data;
        break;
      
      default:
        return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    console.log(`📤 Processing ${type} file: ${fileName}`);

    // Generate S3 key
    const s3Key = generateFilePath(s3Prefix, fileName);
    
    // Convert content to buffer
    const buffer = Buffer.from(fileContent, 'utf-8');
    
    // Upload to S3
    const uploadResult = await uploadToS3(s3Key, buffer, contentType);
    
    if (!uploadResult.success) {
      throw new Error(uploadResult.error || 'S3 upload failed');
    }

    console.log(`✅ File uploaded to S3: ${uploadResult.key}`);

    // Generate download URL (this could be a signed URL or direct link)
    const downloadUrl = uploadResult.url;

    return NextResponse.json({
      success: true,
      downloadUrl: downloadUrl,
      s3Info: {
        bucket: process.env.AWS_S3_BUCKET_NAME,
        key: uploadResult.key,
        url: uploadResult.url,
        contentType: contentType,
        size: buffer.length
      },
      metadata: {
        ...metadata,
        uploadedAt: new Date().toISOString(),
        fileType: type
      }
    });

  } catch (error) {
    console.error('❌ Download API error:', error);
    return NextResponse.json(
      { error: `Download preparation failed: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Download endpoint ready' });
}