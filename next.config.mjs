/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    return [
      {
        source: '/handoff',
        destination: '/',
      },
      {
        source: '/hands-off',
        destination: '/',
      },
      {
        source: '/cs',
        destination: '/',
      },
    ];
  },
};

export default nextConfig;
