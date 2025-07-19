import { NextRequest, NextResponse } from 'next/server';
import { generateDownloadUrl, uploadCSVToS3, uploadJSONToS3, generateFilePath } from '../../../../utils/s3Storage';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(request) {
  try {
    console.log('📤 Download API called');
    
    const body = await request.json();
    const { type, data, fileName, metadata = {} } = body;

    console.log(`📤 Processing ${type} file: ${fileName}`);

    if (!type || !data || !fileName) {
      return NextResponse.json(
        { error: 'Missing required fields: type, data, fileName' },
        { status: 400 }
      );
    }

    let uploadResult;
    let s3Path;

    switch (type) {
      case 'csv':
        s3Path = generateFilePath('outputs/processed', fileName);
        console.log(`📄 Uploading CSV to: ${s3Path}`);
        uploadResult = await uploadCSVToS3(data, s3Path, {
          outputType: 'processed_csv',
          generatedAt: new Date().toISOString(),
          ...metadata
        });
        break;

      case 'config':
        s3Path = generateFilePath('outputs/config', fileName);
        console.log(`⚙️ Uploading Config to: ${s3Path}`);
        uploadResult = await uploadJSONToS3(data, s3Path, {
          outputType: 'config_json',
          generatedAt: new Date().toISOString(),
          ...metadata
        });
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid file type. Supported: csv, config' },
          { status: 400 }
        );
    }

    // Generate presigned URL for immediate download
    const downloadUrl = await generateDownloadUrl(uploadResult.key, 3600); // 1 hour expiry

    console.log(`✅ File uploaded to S3: ${uploadResult.key}`);

    return NextResponse.json({
      success: true,
      s3Info: {
        bucket: process.env.AWS_S3_BUCKET_NAME,
        key: uploadResult.key,
        url: uploadResult.url
      },
      downloadUrl,
      fileName,
      type
    });

  } catch (error) {
    console.error('❌ Download API error:', error);
    return NextResponse.json(
      { error: `Download preparation failed: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json(
        { error: 'Missing S3 key parameter' },
        { status: 400 }
      );
    }

    const downloadUrl = await generateDownloadUrl(key, 3600);

    return NextResponse.json({
      downloadUrl,
      key
    });

  } catch (error) {
    console.error('❌ Get download URL error:', error);
    return NextResponse.json(
      { error: `Failed to generate download URL: ${error.message}` },
      { status: 500 }
    );
  }
}