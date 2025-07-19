import { NextRequest, NextResponse } from 'next/server';
import { downloadFromS3, getSignedDownloadUrl, generateFilePath, uploadCSVToS3, uploadJSONToS3 } from '../../../../utils/s3Storage';

export async function POST(request) {
  try {
    const body = await request.json();
    const { type, data, fileName, metadata = {} } = body;

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
        uploadResult = await uploadCSVToS3(data, s3Path, {
          outputType: 'processed_csv',
          generatedAt: new Date().toISOString(),
          ...metadata
        });
        break;

      case 'config':
        s3Path = generateFilePath('outputs/config', fileName);
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
    const downloadUrl = await getSignedDownloadUrl(uploadResult.key); // 1 hour expiry

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
    const filename = searchParams.get('filename') || 'template.csv';
    const type = searchParams.get('type');
    const s3Key = searchParams.get('key');

    // If downloading from S3
    if (s3Key) {
      const result = await getSignedDownloadUrl(s3Key);
      
      if (result.success) {
        return NextResponse.redirect(result.url);
      } else {
        return NextResponse.json(
          { error: 'Failed to generate download URL' },
          { status: 500 }
        );
      }
    }

    // Generate template content for future values
    if (type === 'template') {
      const csvContent = `timestamp,item_id,feature1,feature2
2024-01-01,item_001,10,20
2024-01-02,item_001,15,25
2024-01-03,item_001,12,22`;

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    return NextResponse.json(
      { error: 'Invalid request parameters' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}