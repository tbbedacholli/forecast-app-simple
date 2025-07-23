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
      sizeLimit: '50mb',
    },
    responseLimit: false,
  },
  // ... other Next.js config options
}

// Replace module.exports with export default
export default nextConfig;
