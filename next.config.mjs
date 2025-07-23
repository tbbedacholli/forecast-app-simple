/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [
      'moment', 
      'validator', 
      'lodash',
      '@aws-sdk/client-s3',
      '@aws-sdk/lib-storage'
    ],
    serverActions: {
      bodySizeLimit: '100mb'
    }
  },
  serverRuntimeConfig: {
    maxFileSize: 100 * 1024 * 1024, // 100MB in bytes
  },
  // Update api config for App Router
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Transfer-Encoding',
            value: 'chunked',
          },
        ],
      },
    ];
  },
  // Add API route configuration
  api: {
    bodyParser: {
      sizeLimit: '100mb',
    },
    responseLimit: false,
  },
  // Add custom config
  env: {
    AWS_UPLOAD_TIMEOUT: 300000, // 5 minutes
    AWS_RETRY_ATTEMPTS: 5,
  }
};

export default nextConfig;
