import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;

// Generate unique file path
export const generateFilePath = (prefix, originalFileName, suffix = '') => {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  const randomId = Math.random().toString(36).substring(2, 8);
  const baseName = originalFileName.replace(/\.[^/.]+$/, '');
  const extension = originalFileName.split('.').pop();
  
  return `${prefix}/${timestamp}_${randomId}/${baseName}${suffix}.${extension}`;
};

// Upload file to S3
export const uploadFileToS3 = async (fileBuffer, fileName, contentType, metadata = {}) => {
  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: fileBuffer,
      ContentType: contentType,
      Metadata: {
        uploadedAt: new Date().toISOString(),
        ...metadata
      }
    });

    const result = await s3Client.send(command);
    
    return {
      success: true,
      key: fileName,
      url: `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`,
      etag: result.ETag
    };
  } catch (error) {
    console.error('S3 upload error:', error);
    throw new Error(`Failed to upload to S3: ${error.message}`);
  }
};

// Upload CSV content as string
export const uploadCSVToS3 = async (csvContent, fileName, metadata = {}) => {
  const buffer = Buffer.from(csvContent, 'utf-8');
  return uploadFileToS3(buffer, fileName, 'text/csv', metadata);
};

// Upload JSON content
export const uploadJSONToS3 = async (jsonContent, fileName, metadata = {}) => {
  const buffer = Buffer.from(JSON.stringify(jsonContent, null, 2), 'utf-8');
  return uploadFileToS3(buffer, fileName, 'application/json', metadata);
};

// Generate presigned URL for download
export const generateDownloadUrl = async (key, expiresIn = 3600) => {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn });
    return url;
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    throw new Error(`Failed to generate download URL: ${error.message}`);
  }
};

// Get file from S3
export const getFileFromS3 = async (key) => {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const response = await s3Client.send(command);
    return response.Body;
  } catch (error) {
    console.error('Error getting file from S3:', error);
    throw new Error(`Failed to get file from S3: ${error.message}`);
  }
};

// Delete file from S3
export const deleteFileFromS3 = async (key) => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
    return { success: true };
  } catch (error) {
    console.error('Error deleting file from S3:', error);
    throw new Error(`Failed to delete file from S3: ${error.message}`);
  }
};