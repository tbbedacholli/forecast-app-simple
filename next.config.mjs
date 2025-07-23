/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['moment', 'validator', 'lodash'],
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
}

export default nextConfig;
