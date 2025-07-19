/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['moment', 'validator', 'lodash'],
    serverActions: {
      bodySizeLimit: '100mb'
    }
  },
  // Add file upload limits
  serverRuntimeConfig: {
    maxFileSize: 100 * 1024 * 1024, // 100MB in bytes
  },
  api: {
    bodyParser: {
      sizeLimit: '100mb',
    },
    responseLimit: '100mb',
  }
}

export default nextConfig;
