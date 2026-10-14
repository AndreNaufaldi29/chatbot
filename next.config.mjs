/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  allowedDevOrigins: [
    'quilt-boxed-souls-tooth.trycloudflare.com',
    '*.trycloudflare.com',
    '**.trycloudflare.com',
    '*.loca.lt',
    '**.loca.lt',
    '*.ngrok-free.app',
    '*.ngrok.app',
    '*.ngrok.io',
    'localhost',
    '127.0.0.1',
  ],
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
