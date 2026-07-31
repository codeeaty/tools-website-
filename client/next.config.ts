// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:55448/:path*', // Your FastAPI backend
      },
    ];
  },
};

module.exports = nextConfig;