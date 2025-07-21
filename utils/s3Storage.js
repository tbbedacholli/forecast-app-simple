import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: process.env.MY_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.MY_ACCESS_KEY_ID,
    secretAccessKey: process.env.MY_SECRET_ACCESS_KEY,
  },
});

// Add the missing generateFilePath function
export function generateFilePath(prefix, filename) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${prefix}/${timestamp}-${sanitizedFilename}`;
}

export async function uploadToS3(key, body, contentType = 'application/octet-stream') {
  const command = new PutObjectCommand({
    Bucket: process.env.MY_S3_BUCKET_NAME,
    Key: key,
    Body: body,
    ContentType: contentType,
  });

  try {
    const result = await s3Client.send(command);
    return {
      success: true,
      key,
      url: `https://${process.env.MY_S3_BUCKET_NAME}.s3.${process.env.MY_REGION}.amazonaws.com/${key}`
    };
  } catch (error) {
    console.error('S3 upload error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

export async function downloadFromS3(key) {
  const command = new GetObjectCommand({
    Bucket: process.env.MY_S3_BUCKET_NAME,
    Key: key,
  });

  try {
    const result = await s3Client.send(command);
    return {
      success: true,
      body: result.Body,
      contentType: result.ContentType,
      contentLength: result.ContentLength
    };
  } catch (error) {
    console.error('S3 download error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

export async function getSignedDownloadUrl(key, expiresIn = 3600) {
  const command = new GetObjectCommand({
    Bucket: process.env.MY_S3_BUCKET_NAME,
    Key: key,
  });

  try {
    const url = await getSignedUrl(s3Client, command, { expiresIn });
    return {
      success: true,
      url
    };
  } catch (error) {
    console.error('S3 signed URL error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Helper function to upload file with metadata
export async function uploadFileToS3(buffer, key, contentType, metadata = {}) {
  return await uploadToS3(key, buffer, contentType);
}